import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { createJWT, ES256KSigner } from 'did-jwt';

window.Buffer = Buffer; // Required for in-browser use of eciesjs.

// Declare `collection` as a global variable
let collection;

/* Organization configuration for nilDB. */
const NILDB = {
    orgCredentials: {
      secretKey: '71c918306c9ca544e824363bdfcca57ff56a1e086020b36dfc70705637c348da',
      orgDid: 'did:nil:testnet:nillion1z4c6ntjf7vcpytfesew6dplek3v3rnkaxntmt6',
    },
    nodes: [
      {
        url: 'https://nildb-nx8v.nillion.network',
        did: 'did:nil:testnet:nillion1qfrl8nje3nvwh6cryj63mz2y6gsdptvn07nx8v',
      },
      {
        url: 'https://nildb-p3mx.nillion.network',
        did: 'did:nil:testnet:nillion1uak7fgsp69kzfhdd6lfqv69fnzh3lprg2mp3mx',
      },
      {
        url: 'https://nildb-rugk.nillion.network',
        did: 'did:nil:testnet:nillion1kfremrp2mryxrynx66etjl8s7wazxc3rssrugk',
      },
    ],
};

// In the clear
const SCHEMA = 'fa800faa-c7ec-4a09-bf76-6ec768ee6299';

// With shares
// const SCHEMA = 'd6381b22-a274-44f5-b1f4-0cd03526ed03';


class SecretVaultWrapper {
    constructor(
        nodes,
        credentials,
        schemaId = null,
        operation = 'store',
        tokenExpirySeconds = 36000000
    ) {
        this.nodes = nodes;
        this.nodesJwt = null;
        this.credentials = credentials;
        this.schemaId = schemaId;
        this.operation = operation;
        this.tokenExpirySeconds = tokenExpirySeconds;
    }

    async init() {
        const nodeConfigs = await Promise.all(
            this.nodes.map(async (node) => ({
                url: node.url,
                jwt: await this.generateNodeToken(node.did),
            }))
        );
        this.nodesJwt = nodeConfigs;
    }

    setSchemaId(schemaId, operation = this.operation) {
        this.schemaId = schemaId;
        this.operation = operation;
    }

    async generateNodeToken(nodeDid) {
      const signer = ES256KSigner(Buffer.from(this.credentials.secretKey, "hex"));
      const payload = {
        iss: this.credentials.orgDid,
        aud: nodeDid,
        exp: Math.floor(Date.now() / 1000) + this.tokenExpirySeconds,
      };
      return await createJWT(payload, {
        issuer: this.credentials.orgDid,
        signer,
      });
    }

    async generateTokensForAllNodes() {
      const tokens = await Promise.all(
        this.nodes.map(async (node) => {
          const token = await this.generateNodeToken(node.did);
          return { node: node.url, token };
        })
      );
      return tokens;
    }

    async makeRequest(nodeUrl, endpoint, token, payload, method = 'POST') {
      try {
        const response = await fetch(`${nodeUrl}/api/v1/${endpoint}`, {
          method,
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: method === 'GET' ? null : JSON.stringify(payload),
        });

        if (!response.ok) {
          const text = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status}, body: ${text}`
          );
        }

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          return {
            status: response.status,
            ...data,
          };
        }
        return {
          status: response.status,
        };
      } catch (error) {
        console.error(
          `❌ Failed to ${method} ${endpoint} from ${nodeUrl}:`,
          error.message
        );
        const statusMatch = error.message.match(/status: (\d+)/);
        const bodyMatch = error.message.match(/body: ({.*})/);

        const errorJson = {
          status: statusMatch ? parseInt(statusMatch[1]) : null,
          error: bodyMatch ? JSON.parse(bodyMatch[1]) : { errors: [error] },
        };
        return errorJson;
      }
    }

    async flushData() {
      const results = [];
      for (const node of this.nodes) {
        const jwt = await this.generateNodeToken(node.did);
        const payload = { schema: this.schemaId };
        const result = await this.makeRequest(
          node.url,
          'data/flush',
          jwt,
          payload
        );
        results.push({ ...result, node });
      }
      return results;
    }

    async getSchemas() {
      const results = [];
      for (const node of this.nodes) {
        const jwt = await this.generateNodeToken(node.did);
        try {
          const result = await this.makeRequest(
            node.url,
            'schemas',
            jwt,
            {},
            'GET'
          );
          results.push({ ...result, node });
        } catch (error) {
          console.error(
            `❌ Failed to get schemas from ${node.url}:`,
            error.message
          );
          results.push({ error, node });
        }
      }
      return results;
    }

    async createSchema(schema, schemaName, schemaId = null) {
      if (!schemaId) {
        schemaId = uuidv4();
      }
      const schemaPayload = {
        _id: schemaId,
        name: schemaName,
        schema,
      };
      const results = [];
      for (const node of this.nodes) {
        const jwt = await this.generateNodeToken(node.did);
        try {
          const result = await this.makeRequest(
            node.url,
            'schemas',
            jwt,
            schemaPayload
          );
          results.push({
            ...result,
            node,
            schemaId,
            name: schemaName,
          });
        } catch (error) {
          console.error(
            `❌ Error while creating schema on ${node.url}:`,
            error.message
          );
          results.push({ error, node });
        }
      }
      return results;
    }

    async writeToNodes(data) {
      // Add an "_id" field to each record if it doesn't exist.
      const idData = data.map((record) => {
        if (!record._id) {
          return { ...record, _id: uuidv4() };
        }
        return record;
      });
      const results = [];

      for (let i = 0; i < this.nodes.length; i++) {
        const node = this.nodes[i];
        try {
          const jwt = await this.generateNodeToken(node.did);
          const payload = {
            schema: this.schemaId,
            data: idData,
          };
          const result = await this.makeRequest(
            node.url,
            'data/create',
            jwt,
            payload
          );

          results.push({
            ...result,
            node,
            schemaId: this.schemaId,
          });
        } catch (error) {
          console.error(`❌ Failed to write to ${node.url}:`, error.message);
          results.push({ node, error });
        }
      }

      return results;
    }

    async readFromNodes(filter = {}) {
      const results = [];

      for (const node of this.nodes) {
        try {
          const jwt = await this.generateNodeToken(node.did);
          const payload = { schema: this.schemaId, filter };
          const result = await this.makeRequest(
            node.url,
            'data/read',
            jwt,
            payload
          );
          results.push({ ...result, node });
        } catch (error) {
          console.error(`❌ Failed to read from ${node.url}:`, error.message);
          results.push({ error, node });
        }
      }

      // Group records across nodes by _id
      const recordGroups = results.reduce((acc, nodeResult) => {
        nodeResult.data.forEach((record) => {
          const existingGroup = acc.find((group) =>
            group.shares.some((share) => share._id === record._id)
          );
          if (existingGroup) {
            existingGroup.shares.push(record);
          } else {
            acc.push({ shares: [record], recordIndex: record._id });
          }
        });
        return acc;
      }, []);

      const recombinedRecords = await Promise.all(
        recordGroups.map(async (record) => {
          const recombined = record.shares;
          return recombined;
        })
      );
      return recombinedRecords;
    }

    async deleteDataFromNodes(filter = {}) {
      const results = [];

      for (const node of this.nodes) {
        try {
          const jwt = await this.generateNodeToken(node.did);
          const payload = { schema: this.schemaId, filter };
          const result = await this.makeRequest(
            node.url,
            'data/delete',
            jwt,
            payload
          );
          results.push({ ...result, node });
        } catch (error) {
          console.error(`❌ Failed to delete from ${node.url}:`, error.message);
          results.push({ error, node });
        }
      }
      return results;
    }
}


function scrub(string) {
    return string.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

function uint8ArrayToHex(uint8Array) {
    return Array.from(uint8Array)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
}

function uint8ArrayFromHex(hex) {
    return new Uint8Array(Buffer.from(hex, "hex"));
}


document.addEventListener('DOMContentLoaded', function() {
    // Global variables
    let currentSelectedDate = null;

    // Local storage key
    const STORAGE_KEY = 'blind_reflections_data';

    // Initialize all tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Theme functionality
    try {
        // Set initial theme preference based on user's system preference
        const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const htmlElement = document.getElementById('html-element');
        const themeToggleBtn = document.getElementById('theme-toggle-btn');
        const themeIcon = document.getElementById('theme-icon');

        if (htmlElement && themeToggleBtn && themeIcon) {
            if (localStorage.getItem('theme')) {
                // Use saved preference if it exists
                htmlElement.setAttribute('data-bs-theme', localStorage.getItem('theme'));
                updateThemeIcon(localStorage.getItem('theme'));
            } else {
                // Otherwise use system preference
                const initialTheme = prefersDarkScheme ? 'dark' : 'light';
                htmlElement.setAttribute('data-bs-theme', initialTheme);
                updateThemeIcon(initialTheme);
            }

            // Theme toggle handler
            themeToggleBtn.addEventListener('click', function() {
                const currentTheme = htmlElement.getAttribute('data-bs-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

                htmlElement.setAttribute('data-bs-theme', newTheme);
                localStorage.setItem('theme', newTheme);
                updateThemeIcon(newTheme);
            });

            // Function to update theme icon
            function updateThemeIcon(theme) {
                if (theme === 'dark') {
                    themeIcon.className = 'fas fa-sun'; // Show sun icon in dark mode
                } else {
                    themeIcon.className = 'fas fa-moon'; // Show moon icon in light mode
                }
            }
        }
    } catch (e) {
        console.error('Error initializing theme:', e);
    }

    // Set today's date in the header
    const todayDateElement = document.getElementById('today-date');
    const today = new Date();
    todayDateElement.textContent = today.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Load data from localStorage based on UUID
    function loadData() {
        const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
        const uuid = authData?.uuid;

        if (!uuid) {
            console.error('No UUID found. Cannot load data.');
            return {};
        }

        const data = localStorage.getItem(`${STORAGE_KEY}_${uuid}`);
        return data ? JSON.parse(data) : {};
    }

    // Save data to localStorage based on UUID
    function saveData(data) {
        const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
        const uuid = authData?.uuid;

        if (!uuid) {
            console.error('No UUID found. Cannot save data.');
            return;
        }

        localStorage.setItem(`${STORAGE_KEY}_${uuid}`, JSON.stringify(data));
    }

    // Save a new entry
    async function saveEntry() {
        if (!currentSelectedDate) return;

        const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
        const uuid = authData?.uuid;

        if (!uuid) {
            const authModal = new bootstrap.Modal(document.getElementById('authModal'));
            const authWarning = document.getElementById('auth-warning');

            // Show the warning message
            authWarning.classList.remove('d-none');
            authModal.show();
            return;
        } else {
            console.log('UUID found:', uuid);
        }

        const entryTextArea = document.getElementById('entry-text');
        const entryText = entryTextArea.value.trim();

        // Check if entry is empty
        if (!entryText) {
            alert('Please enter some text for your reflection.');
            return;
        }

        // Check if entry exceeds character limit (approximately 5000 words)
        const MAX_CHARS = 25000; // Approximately 5000 words (5 chars per word average)
        if (entryText.length > MAX_CHARS) {
            alert(`Your entry is too long. Please limit your reflection to approximately 5000 words (${MAX_CHARS} characters).`);
            return;
        }

        // Save entry to nilDB
        const message_for_nildb = {
            uuid: uuid,
            date: currentSelectedDate,
            entry: entryText,
        };

        try {
            const dataWritten = await collection.writeToNodes([message_for_nildb]);
            console.log('Data written to nilDB:', dataWritten);
            const recordId = dataWritten[0]?.data?.created?.[0]; // Extract the created ID

            const data = loadData();
            const timestamp = new Date().toISOString();

            if (!data[currentSelectedDate]) {
                data[currentSelectedDate] = [];
            }

            data[currentSelectedDate].push({ text: entryText, id: recordId, timestamp });
            saveData(data);

            // Clear the input field
            entryTextArea.value = '';

            // Refresh entries display
            displayEntries(data[currentSelectedDate]);

            // Mark this date as having entries in the calendar
            markDateWithEntries(currentSelectedDate);

            // Scroll to the top of the entries list to see the newest entry
            const entriesList = document.getElementById('entries-list');
            if (entriesList) {
                entriesList.scrollTop = 0;
            }
        } catch (error) {
            console.error('Failed to write data to nilDB:', error);
        }
    }

    // Mark dates with entries in the calendar
    function markDatesWithEntries() {
        const data = loadData();
        Object.keys(data).forEach(dateStr => {
            markDateWithEntries(dateStr);
        });
    }

    // Function to format date for display
    function formatDisplayDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Function to select a date and load entries
    async function selectDate(dateStr) {
        // Remove selected class from previously selected date
        if (currentSelectedDate) {
            const prevEl = calendar.el.querySelector(`.fc-day[data-date="${currentSelectedDate}"]`);
            if (prevEl) prevEl.classList.remove('fc-day-selected');
        }

        // Add selected class to new date
        const dateEl = calendar.el.querySelector(`.fc-day[data-date="${dateStr}"]`);
        if (dateEl) dateEl.classList.add('fc-day-selected');

        currentSelectedDate = dateStr;

        // Update header with selected date
        document.getElementById('selected-date-header').textContent = formatDisplayDate(dateStr);

        // Show entry form
        document.getElementById('entry-form-container').style.display = 'block';

        // Hide "no date selected" message
        document.getElementById('no-date-message').style.display = 'none';

        // Fetch and display entries for the selected date
        try {
            const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
            const uuid = authData?.uuid;

            if (!uuid) {
                console.error('No UUID found. User must be logged in.');
                return;
            }

            // Use readFromNodes to pull data from nilDB
            const dataReadFromNilDB = await collection.readFromNodes({ uuid, date: dateStr });
            console.log('Data read from nilDB:', dataReadFromNilDB);

            // Process and display the fetched entries
            const entries = dataReadFromNilDB.flatMap(nodeArray => {
                if (Array.isArray(nodeArray)) {
                    // Flatten the inner array and map the entries
                    return nodeArray.map(entry => ({
                        id: entry._id,
                        timestamp: entry._created,
                        text: entry.entry,
                    }));
                }
                return []; // Return an empty array if nodeArray is not an array
            });

            console.log('Processed entries:', entries);

            // Update local storage with fetched entries
            const data = loadData();
            data[dateStr] = entries;
            saveData(data);

            console.log('Updated local storage with fetched entries:', data[dateStr]);

            // Display the fetched entries
            displayEntries(data[dateStr]);
        } catch (error) {
            console.error('Failed to read data from nilDB:', error);
        }
    }

    // Function to display entries
    function displayEntries(entries) {
        const entriesListEl = document.getElementById('entries-list');
        const noEntriesMessageEl = document.getElementById('no-entries-message');

        entriesListEl.innerHTML = '';

        if (!entries || entries.length === 0) {
            noEntriesMessageEl.style.display = 'block';
            return;
        }

        noEntriesMessageEl.style.display = 'none';

        // Sort entries by timestamp (newest first)
        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        entries.forEach((entry, index) => {
            const entryCard = document.createElement('div');
            entryCard.className = 'card entry-card mb-3';

            // Format timestamp
            const timestamp = new Date(entry.timestamp);
            const formattedTime = timestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const formattedDate = timestamp.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            entryCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <span class="entry-timestamp">${formattedDate} at ${formattedTime}</span>
                        <div class="entry-actions">
                        </div>
                    </div>
                    <p class="card-text entry-text">${entry.text}</p>
                </div>
            `;

            entriesListEl.appendChild(entryCard);
        });
    }

    // Function to mark dates with entries in the calendar
    function markDateWithEntries(dateStr) {
        const dateEl = calendar.el.querySelector(`.fc-day[data-date="${dateStr}"]`);
        if (dateEl) {
            dateEl.classList.add('fc-day-has-entries');
        }
    }

    // Function to display error messages
    function displayError(message) {
        // Could implement a toast notification here
        console.error(message);
        alert(message);
    }

    // Initialize the calendar and mark dates with entries
    const calendarEl = document.getElementById('calendar');
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: '' // Removed the 'dayGridMonth' button
        },
        selectable: true,
        dateClick: function(info) {
            selectDate(info.dateStr);
        },
        datesSet: function() {
            markDatesWithEntries();
        }
    });
    calendar.render();

    // Mark dates with entries on load
    markDatesWithEntries();

    // Event Listeners
    document.getElementById('save-entry-btn').addEventListener('click', saveEntry);

    // Handle entry form submission with Enter key
    document.getElementById('entry-text').addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            saveEntry();
        }
    });
});

document.addEventListener('DOMContentLoaded', function() {
    // Session storage keys
    const SESSION_UUID_KEY = 'blind_reflections_uuid';
    const SESSION_AUTH_KEY = 'blind_reflections_auth';

    const uuidSpan = document.getElementById('register-uuid');
    const registerTabLink = document.querySelector('a#register-tab');
    const authModal = document.getElementById('authModal');
    const authModalElement = new bootstrap.Modal(document.getElementById('authModal'));
    const signUpLoginButton = document.getElementById('sign-up-login-button');
    const userDisplaySpan = document.getElementById('user-display') || createUserDisplayElement();

    // Register and login buttons
    const registerButton = document.getElementById('register-button');
    const loginButton = document.getElementById('login-button');

    // Function to create user display element if it doesn't exist
    function createUserDisplayElement() {
        const span = document.createElement('span');
        span.id = 'user-display';
        span.className = 'ms-2 d-none'; // Changed from me-2 (margin-end) to ms-2 (margin-start)
        span.style.fontFamily = 'monospace';
        span.style.fontSize = '0.9rem';

        // Insert after the sign-up/login button
        if (signUpLoginButton && signUpLoginButton.parentNode) {
            // If there's a next sibling, insert before it, otherwise append to parent
            if (signUpLoginButton.nextSibling) {
                signUpLoginButton.parentNode.insertBefore(span, signUpLoginButton.nextSibling);
            } else {
                signUpLoginButton.parentNode.appendChild(span);
            }
        }

        return span;
    }

    // Function to generate and set UUID
    function setUuid() {
        try {
            // Check if UUID span element exists
            if (uuidSpan) {
                // Generate a new UUID - the fallback is defined in the HTML if the library fails
                const newUuid = uuidv4();
                uuidSpan.textContent = newUuid;
                console.log('UUID generated successfully');
            }
        } catch (error) {
            console.error('Error generating UUID:', error);
            // If there's an error, try the fallback method
            if (uuidSpan) {
                uuidSpan.textContent = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            }
        }
    }

    // Function to save authentication data
    function saveAuthData(uuid, password) {
        const authData = { uuid, password, timestamp: new Date().toISOString() };
        sessionStorage.setItem(SESSION_UUID_KEY, uuid);
        sessionStorage.setItem(SESSION_AUTH_KEY, JSON.stringify(authData));
    }

    // Function to initialize the collection
    async function initializeCollection(uuid) {
        collection = new SecretVaultWrapper(NILDB.nodes, NILDB.orgCredentials, SCHEMA);
        await collection.init();
        console.log(`Collection initialized for UUID: ${uuid}`);
    }

    // Function to display the logged-in user
    function displayLoggedInUser(uuid) {
        if (userDisplaySpan && uuid) {
            // Show the full UUID for display
            userDisplaySpan.textContent = uuid;
            userDisplaySpan.title = `Your unique identifier`;
            userDisplaySpan.classList.remove('d-none');

            // Add a small copy button next to the UUID
            if (!document.getElementById('header-copy-uuid-btn')) {
                const copyBtn = document.createElement('button');
                copyBtn.id = 'header-copy-uuid-btn';
                copyBtn.className = 'btn btn-sm btn-outline-secondary ms-1';
                copyBtn.title = 'Copy to clipboard';
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';

                // Add copy functionality
                copyBtn.addEventListener('click', function() {
                    navigator.clipboard.writeText(uuid)
                        .then(function() {
                            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                            copyBtn.classList.add('btn-success');
                            copyBtn.classList.remove('btn-outline-secondary');

                            setTimeout(() => {
                                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                                copyBtn.classList.remove('btn-success');
                                copyBtn.classList.add('btn-outline-secondary');
                            }, 1200);
                        })
                        .catch(function(err) {
                            console.error('Could not copy text: ', err);
                        });
                });

                // Insert after the UUID span
                userDisplaySpan.parentNode.insertBefore(copyBtn, userDisplaySpan.nextSibling);
            }

            // Update the sign-up/login button text
            if (signUpLoginButton) {
                signUpLoginButton.textContent = 'Logout';
                signUpLoginButton.removeAttribute('data-bs-toggle');
                signUpLoginButton.removeAttribute('data-bs-target');

                // Remove existing click handlers
                const newButton = signUpLoginButton.cloneNode(true);
                signUpLoginButton.parentNode.replaceChild(newButton, signUpLoginButton);

                // Add logout functionality
                newButton.addEventListener('click', function() {
                    // Remove the copy button when logging out
                    const copyBtn = document.getElementById('header-copy-uuid-btn');
                    if (copyBtn) copyBtn.remove();

                    sessionStorage.removeItem(SESSION_UUID_KEY);
                    sessionStorage.removeItem(SESSION_AUTH_KEY);
                    location.reload(); // Reload to reset the UI
                });
            }
        }
    }

    // Handle registration
    if (registerButton) {
        registerButton.addEventListener('click', async function() {
            const uuid = uuidSpan.textContent;
            const password = document.getElementById('register-password').value;

            if (!uuid || !password) {
                alert('Please provide both UUID and password');
                return;
            }

            // Save the auth data
            saveAuthData(uuid, password);

            // Initialize the collection
            await initializeCollection(uuid);

            // Dynamically get the modal instance and close it
            const authModalInstance = bootstrap.Modal.getInstance(document.getElementById('authModal'));
            if (authModalInstance) {
                authModalInstance.hide();
            }

            // Display the logged-in user
            displayLoggedInUser(uuid);
        });
    }

    // Handle login
    if (loginButton) {
        loginButton.addEventListener('click', async function() {
            const uuid = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            if (!uuid || !password) {
                alert('Please provide both UUID and password');
                return;
            }

            // Save the auth data
            saveAuthData(uuid, password);

            // Initialize the collection
            await initializeCollection(uuid);

            // Close the modal
            authModalElement.hide();

            // Display the logged-in user
            displayLoggedInUser(uuid);
        });
    }


    // Set UUID when register tab is shown
    if (registerTabLink && uuidSpan) {
        registerTabLink.addEventListener('shown.bs.tab', setUuid);
    }

    // Set UUID when auth modal is shown
    if (authModal && uuidSpan) {
        authModal.addEventListener('show.bs.modal', setUuid);
    }

    // Initial UUID generation
    if (uuidSpan) setUuid();

    // Copy to clipboard functionality
    const copyBtn = document.getElementById('copy-uuid-btn');
    if (copyBtn && uuidSpan) {
        copyBtn.addEventListener('click', function() {
            // Get the current UUID text
            const uuidText = uuidSpan.textContent;

            // Check if we have a valid UUID to copy
            if (uuidText && uuidText !== 'UUID generation failed') {
                // Use the clipboard API to copy the text
                navigator.clipboard.writeText(uuidText)
                    .then(function() {
                        // Success feedback
                        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                        copyBtn.classList.add('btn-success');
                        copyBtn.classList.remove('btn-outline-secondary');

                        // Reset after delay
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                            copyBtn.classList.remove('btn-success');
                            copyBtn.classList.add('btn-outline-secondary');
                        }, 1200);
                    })
                    .catch(function(err) {
                        console.error('Could not copy text: ', err);
                        alert('Failed to copy to clipboard');
                    });
            } else {
                alert('No valid UUID to copy');
            }
        });
    }

    // Check if user is already logged in on page load
    const savedUuid = sessionStorage.getItem(SESSION_UUID_KEY);
    if (savedUuid) {
        displayLoggedInUser(savedUuid);
        initializeCollection(savedUuid);
    }
});
