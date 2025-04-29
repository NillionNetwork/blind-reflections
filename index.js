import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { createJWT, ES256KSigner } from 'did-jwt';

window.Buffer = Buffer; // Required for in-browser use of eciesjs.

// SHA-256 Helper using Web Crypto API
async function sha256(message) {
    // encode as UTF-8
    const msgBuffer = new TextEncoder().encode(message);
    // hash the message
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    // convert ArrayBuffer to Array
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    // convert bytes to hex string
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Application state container
const appState = {
    collection: null, // Holds the SecretVaultWrapper instance
};

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
const AGGREGATION = '87b54dc5-4229-455f-9d60-2c6cf315a74a';

// With shares
// const SCHEMA = 'd6381b22-a274-44f5-b1f4-0cd03526ed03';
// const AGGREGATION = 'eae83257-c0f4-4752-9042-0bc83c344b8b';

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

    /**
     * Executes a query on a single node and returns the results.
     *
     * @param {object} node - The target node object (should contain 'url' and 'did').
     * @param {object} queryPayload - The query payload to execute.
     * @returns {Promise<object>} - A promise resolving to the query response from the node.
     */
    async executeQueryOnSingleNode(node, queryPayload) {
        if (!node || !node.url || !node.did) {
            console.error("❌ Invalid node object provided:", node);
            return { node: node?.url || 'unknown', error: "Invalid node object" };
        }
        if (!queryPayload) {
             console.error("❌ Query payload cannot be empty");
             return { node: node.url, error: "Query payload cannot be empty" };
        }

        try {
            const jwt = await this.generateNodeToken(node.did);
            const result = await this.makeRequest(
                node.url,
                'queries/execute', // Endpoint for query execution
                jwt,
                queryPayload
            );

            // Check if the request itself resulted in an error structure
            if (result && result.error) {
                 console.error(`❌ Query execution failed on ${node.url} with status ${result.status}:`, result.error);
                 return {
                     node: node.url,
                     status: result.status,
                     error: result.error,
                 };
            }

            // If successful, return the node URL and the data from the response
            return {
                node: node.url,
                status: result.status,
                data: result.data || [], // Use the 'data' field from makeRequest result
            };
        } catch (error) {
            // Catch errors from generateNodeToken or unexpected issues in makeRequest
            console.error(`❌ Failed to execute query on ${node.url}:`, error.message);
            return {
                node: node.url,
                status: error.status || null, // Include status if available on error object
                error: error.message || "An unknown error occurred",
            };
        }
    }
}

// Function to display a warning modal using template
function showWarningModal(message) {
    const template = document.getElementById('warning-modal-template');
    if (!template) {
         console.error('Warning modal template not found!');
         alert(message); // Fallback
         return;
    }

    const clone = template.content.cloneNode(true);
    const modalElement = clone.querySelector('.modal');
    const messageElement = clone.querySelector('.warning-message');

    if (!modalElement || !messageElement) {
         console.error('Essential elements missing in warning modal template!');
         return;
    }

    messageElement.textContent = message;

    // Append the cloned modal to the body *before* initializing
    document.body.appendChild(modalElement);

    // Show the modal
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();

    // Remove the modal from the DOM when hidden
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });
}

// Function to display the LLM response in a modal using template
function showLLMResponseModal(responseContent) {
    const template = document.getElementById('llm-response-modal-template');
    if (!template) {
        console.error('LLM response modal template not found!');
        alert('Error displaying response.'); // Fallback
        return;
    }

    const clone = template.content.cloneNode(true);
    const modalElement = clone.querySelector('.modal'); // Get the modal root element
    const responseContentElement = clone.querySelector('.response-content');
    const copyButton = clone.querySelector('.copy-response-btn');

    if (!modalElement || !responseContentElement || !copyButton) {
        console.error('Essential elements missing in LLM response modal template!');
        return;
    }

    responseContentElement.textContent = responseContent;

    // Append the cloned modal to the body *before* initializing
    document.body.appendChild(modalElement);

    // Show the modal using Bootstrap's JS
    const modalInstance = new bootstrap.Modal(modalElement);
    modalInstance.show();

    // Add copy functionality
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(responseContent)
            .then(() => {
                copyButton.textContent = 'Copied!';
                copyButton.disabled = true;
                setTimeout(() => {
                    copyButton.textContent = 'Copy Response';
                    copyButton.disabled = false;
                }, 1500);
            })
            .catch((err) => {
                console.error('Failed to copy text:', err);
                // Optionally show a small error message near the button
            });
    });

    // Remove the modal from the DOM when hidden to prevent ID conflicts
    modalElement.addEventListener('hidden.bs.modal', () => {
        modalElement.remove();
    });
}

// Function to initialize application logic for reflections
function initializeReflectionsApp() {
    // Global variables
    let currentSelectedDate = null;
    let calendar;

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
            showWarningModal('You must be logged in to save a memory.');
            // Assuming authModal initialization is handled elsewhere or needed here
            if (authModal) authModal.show(); // Requires authModal initialization setup
            return;
        }

        const entryTextArea = document.getElementById('entry-text');
        const entryText = entryTextArea.value.trim();

        // Check if entry is empty
        if (!entryText) {
            showWarningModal('Please enter some text for your reflection.');
            return;
        }

        // Check if entry exceeds character limit (approximately 5000 words)
        const MAX_CHARS = 25000; // Approximately 5000 words (5 chars per word average)
        if (entryText.length > MAX_CHARS) {
            showWarningModal(`Your entry is too long. Please limit your reflection to approximately 5000 words (${MAX_CHARS} characters).`);
            return;
        }

        // Save entry to nilDB
        const message_for_nildb = {
            uuid: uuid,
            date: currentSelectedDate,
            entry: entryText,
        };

        // Show loading animation
        showLoadingAnimation("Saving your memory...");

        try {
            if (!appState.collection) {
                throw new Error("Collection not initialized. Please log in.");
            }
            const dataWritten = await appState.collection.writeToNodes([message_for_nildb]);
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
            markDateWithEntriesHelper(currentSelectedDate);

            // Scroll to the top of the entries list to see the newest entry
            const entriesList = document.getElementById('entries-list');
            if (entriesList) {
                entriesList.scrollTop = 0;
            }

            // Refresh histogram data
            runAndLogInitialQuery();

        } catch (error) {
            console.error('Failed to write data to nilDB:', error);
            showWarningModal(`Failed to save memory: ${error.message}`);
        } finally {
            // Hide loading animation
            hideLoadingAnimation();
        }
    }

    // Mark dates with entries in the calendar
    function markDatesWithEntries() {
        const data = loadData();
        Object.keys(data).forEach(dateStr => {
            markDateWithEntriesHelper(dateStr);
        });
    }

    // Helper function to mark a single date
    function markDateWithEntriesHelper(dateStr) {
        if (!calendar) return; // Guard clause if calendar isn't initialized yet
        const dateEl = calendar.el.querySelector(`.fc-day[data-date="${dateStr}"]`);
        if (dateEl) {
            dateEl.classList.add('fc-day-has-entries');
        }
    }

    // Function to format date for display
    function formatDisplayDate(dateStr) {
        // Parse the date string as a local date
        const [year, month, day] = dateStr.split('-').map(Number);
        const date = new Date(year, month - 1, day); // Month is 0-based in JavaScript

        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Function to select a date and load entries
    async function selectDate(dateStr) {
        if (!calendar) return;
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

        // Show loading animation
        showLoadingAnimation("Fetching memories...");

        // Fetch and display entries for the selected date
        try {
            const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
            const uuid = authData?.uuid;

            if (!uuid) {
                showWarningModal('You must be logged in to view memories.');
                return;
            }

            if (!appState.collection) {
                throw new Error("Collection not initialized. Please log in.");
            }

            // Use readFromNodes to pull data from nilDB
            const dataReadFromNilDB = await appState.collection.readFromNodes({ uuid, date: dateStr });
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

            // Display the fetched entries
            displayEntries(data[dateStr]);
        } catch (error) {
            console.error('Failed to read data from nilDB:', error);
            showWarningModal(`Failed to fetch memories: ${error.message}`);
        } finally {
            // Hide loading animation
            hideLoadingAnimation();
        }
    }

    // Global variable to store the memory queue
    const memoryQueue = [];

    // Function to display entries
    function displayEntries(entries) {
        const entriesListEl = document.getElementById('entries-list');
        const noEntriesMessageEl = document.getElementById('no-entries-message');
        const memoryDisplayBox = document.getElementById('memory-display-box');

        entriesListEl.innerHTML = '';

        if (!entries || entries.length === 0) {
            noEntriesMessageEl.style.display = 'block';
            return;
        }

        noEntriesMessageEl.style.display = 'none';

        // Sort entries by timestamp (newest first)
        entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        entries.forEach((entry) => {
            const entryCard = document.createElement('div');
            entryCard.className = 'card entry-card mb-3';
            entryCard.style.cursor = 'pointer'; // Make it look clickable
            entryCard.setAttribute('data-entry-id', entry.id); // Store ID for reference

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
                    </div>
                    <p class="card-text entry-text">${entry.text}</p>
                </div>
            `;

            // Add click event to append the memory to the memory display box
            entryCard.addEventListener('click', () => {
                const memoryText = entry.text;

                // Use the selected date instead of the entry's timestamp
                const memoryDate = currentSelectedDate;

                // Avoid adding duplicate memories to the queue
                const alreadyExists = memoryQueue.some(item => item.id === entry.id);
                if (alreadyExists) return;

                // Create data structure for the memory
                const memoryData = { id: entry.id, date: memoryDate, text: memoryText };

                // Add the memory to the queue
                memoryQueue.push(memoryData);

                // If the queue exceeds 5 items, remove the first one
                if (memoryQueue.length > 5) {
                    memoryQueue.shift();
                }

                // Re-render the memory display box
                renderMemoryDisplayBox();
            });

            entriesListEl.appendChild(entryCard);
        });
    }

    // Function to render the memory display box
    function renderMemoryDisplayBox() {
        const memoryDisplayBox = document.getElementById('memory-display-box');

        // Clear the memory display box
        memoryDisplayBox.innerHTML = '';

        // If the memory queue is empty, hide the box
        if (memoryQueue.length === 0) {
            memoryDisplayBox.style.display = 'none';
            return;
        }

        // Otherwise, show the box and render the memories
        memoryDisplayBox.style.display = 'block';
        memoryQueue.forEach((itemData) => {
            // Create a wrapper div for the memory
            const memoryCard = document.createElement('div');
            memoryCard.className = 'card memory-card mb-2'; // Add card styling
            memoryCard.innerHTML = `
                <div class="card-body d-flex align-items-start">
                    <span class="memory-date me-3">${itemData.date}</span>
                    <p class="card-text entry-text memory-text mb-0">${itemData.text}</p>
                </div>
            `;

            memoryDisplayBox.appendChild(memoryCard);
        });
    }

    document.getElementById('ask-secret-llm-btn').addEventListener('click', async () => {
        const privateReflectionInput = document.getElementById('private-reflection-input');

        // Check if input or memories are empty
        if (!privateReflectionInput.value.trim() && memoryQueue.length === 0) {
            showWarningModal('Please provide a prompt and select at least one memory.');
            return;
        } else if (!privateReflectionInput.value.trim()) {
            showWarningModal('Please provide a prompt.');
            return;
        } else if (memoryQueue.length === 0) {
            showWarningModal('Please select at least one memory.');
            return;
        }

        // Prepare the messages for the API call
        const messages = [];

        // Add the user's private reflection input as a message
        if (privateReflectionInput.value.trim()) {
            messages.push({
                role: 'user',
                content: privateReflectionInput.value.trim(),
            });
        }

        // Add selected memories as messages
        if (memoryQueue.length > 0) {
            const memoryContext = memoryQueue.map((item) => {
                return `Memory from ${item.date}: ${item.text}`; // Use item.date and item.text
            }).join('\n\n'); // Add more space between memories

            messages.push({
                role: 'system',
                content: `Context based on selected memories:\n${memoryContext}`,
            });
        } else {
            console.warn('No memories selected.');
        }

        // Prepare the API request
        const myHeaders = new Headers();
        myHeaders.append("Content-Type", "application/json");
        myHeaders.append("Accept", "application/json");
        myHeaders.append("Authorization", "Bearer Nillion2025"); // TODO: Replace with secure method

        console.log('Messages for API:', messages);

        const raw = JSON.stringify({
            model: "meta-llama/Llama-3.1-8B-Instruct", // TODO: Move to config
            messages: messages,
            temperature: 0.2,
            top_p: 0.95,
            max_tokens: 2048,
            stream: false,
            nilrag: {} // TODO: Understand what this does or remove if unnecessary
        });

        const requestOptions = {
            method: "POST",
            headers: myHeaders,
            body: raw,
            redirect: "follow"
        };

        // Show loading animation
        showLoadingAnimation("Waiting for SecretLLM...");

        // Make the API call
        try {
            // TODO: Move URL to config
            const response = await fetch("https://nilai-a779.nillion.network/v1/chat/completions", requestOptions);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }

            const result = await response.json();
            console.log('API Response:', result);

            // Show the response in a modal
            if (result.choices && result.choices[0] && result.choices[0].message) {
                 showLLMResponseModal(result.choices[0].message.content);
            } else {
                throw new Error("Invalid response structure from API");
            }

        } catch (error) {
            console.error('Error calling the API:', error);
            showWarningModal(`Failed to process request: ${error.message}`);
        } finally {
            // Hide loading animation
            hideLoadingAnimation();
        }

        // Clear the memory queue
        memoryQueue.length = 0;

        // Clear the private reflection input and restore the placeholder
        privateReflectionInput.value = '';
        privateReflectionInput.setAttribute('placeholder', "Let's do some private reflections...");

        // Re-render the memory display box
        renderMemoryDisplayBox();
    });

    // Function to show loading animation using template
    function showLoadingAnimation(message = "Loading...") {
        // Remove any existing loader first
        hideLoadingAnimation();

        const template = document.getElementById('loading-animation-template');
         if (!template) {
             console.error('Loading animation template not found!');
             return;
         }

        const clone = template.content.cloneNode(true);
        const loaderElement = clone.querySelector('.custom-loader-overlay'); // Select the main container
        const messageElement = clone.querySelector('.loading-message');

         if (!loaderElement || !messageElement) {
             console.error('Essential elements missing in loading template!');
             return;
         }

        messageElement.textContent = message;

        // Assign an ID to the loader for easy removal
        loaderElement.id = 'active-loader-overlay';

        document.body.appendChild(loaderElement); // Append the container
    }

    // Function to hide the loading animation
    function hideLoadingAnimation() {
        const loaderOverlay = document.getElementById('active-loader-overlay'); // Use the assigned ID
        if (loaderOverlay) {
            loaderOverlay.remove();
        }
    }

    // Initialize the calendar and mark dates with entries
    const calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: '', // Removed the 'dayGridMonth' button
        },
        selectable: true,
        dateClick: function(info) {
            selectDate(info.dateStr);
        },
        datesSet: function() {
            markDatesWithEntries(); // Re-mark dates when view changes
        },
        contentHeight: 'auto', // Ensure no vertical scrolling
        height: 'auto', // Automatically adjust height to remove scrollbar
    });
    calendar.render();

    // Mark dates with entries on initial load
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
}

function ensureHistogramElements() {
    let section = document.getElementById('histogram-section');
    if (!section) {
        section = document.createElement('div');
        section.id = 'histogram-section';
        section.className = 'mt-3';
        section.innerHTML = `
            <div class="card border-0 shadow-sm">
                <div class="card-body">
                    <h6 class="card-subtitle mb-2 text-muted">Top Reflection Days</h6>
                    <div id="histogram-container" class="histogram-container">
                        <p id="histogram-loading" class="text-muted small">Loading histogram data...</p>
                    </div>
                </div>
            </div>
        `;
        // Append to a stable parent, e.g. document.querySelector('.container')
        document.querySelector('.container').appendChild(section);
    }
    // Ensure children exist
    if (!section.querySelector('#histogram-container')) {
        section.querySelector('.card-body').insertAdjacentHTML('beforeend',
            `<div id="histogram-container" class="histogram-container">
                <p id="histogram-loading" class="text-muted small">Loading histogram data...</p>
            </div>`);
    }
    if (!section.querySelector('#histogram-loading')) {
        section.querySelector('#histogram-container').innerHTML =
            `<p id="histogram-loading" class="text-muted small">Loading histogram data...</p>`;
    }
    return section;
}

function renderHistogram(data) {
    const section = ensureHistogramElements();
    const container = section.querySelector('#histogram-container');
    const loadingMsg = section.querySelector('#histogram-loading');

    section.style.display = 'block';
    container.innerHTML = '';
    if (loadingMsg) loadingMsg.style.display = 'none';

    if (!Array.isArray(data) || data.length === 0) {
        container.innerHTML = '<p class="text-muted small text-center w-100">No reflection data to display.</p>';
        return;
    }

    const maxCount = Math.max(...data.map(item => Number(item.reflections_count) || 0));
    data.forEach(item => {
        const count = Number(item.reflections_count) || 0;
        const barHeight = maxCount > 0 ? (count / maxCount) * 100 : 0;
        const bar = document.createElement('div');
        bar.className = 'histogram-bar';
        bar.style.height = `${barHeight}%`;
        bar.title = `${item.date}: ${count} reflections`;

        const valueLabel = document.createElement('span');
        valueLabel.className = 'bar-value';
        valueLabel.textContent = count;

        const dateLabel = document.createElement('span');
        dateLabel.className = 'bar-label';
        dateLabel.textContent = item.date;

        bar.appendChild(valueLabel);
        bar.appendChild(dateLabel);
        container.appendChild(bar);
    });
}

const TOP_K_RESULTS = 5; // Increase K for a better histogram (adjust as needed)

// Helper function to run and log an initial query execution
async function runAndLogInitialQuery() {
    if (!appState.collection) {
        console.log("Skipping initial query: Collection not initialized.");
        renderHistogram([]); // Render empty state
        return;
    }
    if (!NILDB.nodes || NILDB.nodes.length === 0) {
        console.error("Skipping initial query: No nodes configured.");
        renderHistogram([]); // Render empty state
        return;
    }

    // Get the current user's UUID from session storage
    const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
    const currentUserUuid = authData?.uuid;

    if (!currentUserUuid) {
        console.error("Skipping initial query: User UUID not found in session storage.");
        renderHistogram([]); // Render empty state
        return;
    }

    const targetNode = NILDB.nodes[0]; // Use the first node
    const queryPayload = {
        id: AGGREGATION, // Use the AGGREGATION constant as the query ID
        variables: {
             uuid: currentUserUuid // Provide the required uuid variable
        }
    };

    console.log(`🚀 Running initial query execution (ID: ${queryPayload.id}, UUID: ${currentUserUuid}) on node: ${targetNode.url}`);

    try {
        // Call executeQueryOnSingleNode with the correct payload format
        const result = await appState.collection.executeQueryOnSingleNode(targetNode, queryPayload);

        if (result.error) {
            console.error(`❌ Initial query execution failed (Node: ${result.node}, Status: ${result.status}):`, result.error);
            renderHistogram([]); // Render empty state on error
        } else {
            console.log(`✅ Initial query execution successful (Node: ${result.node}, Status: ${result.status}). Raw data:`, result.data);

            // Process the results: sort by reflections_count and get top K
            if (Array.isArray(result.data)) { // Process even if empty
                const sortedData = [...result.data].sort((a, b) => { // Create copy before sorting
                    // Ensure both counts are numbers before subtracting
                    const countA = Number(a.reflections_count) || 0;
                    const countB = Number(b.reflections_count) || 0;
                    return countB - countA; // Sort descending
                });
                const topK = sortedData.slice(0, TOP_K_RESULTS);
                console.log(`📊 Top ${TOP_K_RESULTS} reflection counts:`, topK);
                renderHistogram(topK); // Render histogram with top K data
            } else {
                console.log("ℹ️ Data returned from query is not an array.");
                renderHistogram([]); // Render empty state
            }
        }
    } catch (e) {
        // Catch any unexpected errors from the call itself
        console.error(`❌ Unexpected error during initial query execution:`, e);
        renderHistogram([]); // Render empty state on error
    }
}

// Function to initialize authentication logic
function initializeAuth() {
    // Session storage keys
    const SESSION_UUID_KEY = 'blind_reflections_uuid';
    const SESSION_AUTH_KEY = 'blind_reflections_auth';

    const uuidSpan = document.getElementById('register-uuid');
    const registerTabLink = document.querySelector('a#register-tab');
    const authModal = document.getElementById('authModal');
    const authModalElement = authModal ? new bootstrap.Modal(authModal) : null; // Initialize if exists
    const signUpLoginButton = document.getElementById('sign-up-login-button');
    const userDisplaySpan = document.getElementById('user-display') || createUserDisplayElement();

    // Register and login buttons
    const registerButton = document.getElementById('register-button');
    const loginButton = document.getElementById('login-button');
    // Get *all* Connect Wallet buttons (using a class is better, but ID works for now)
    const connectWalletButtons = document.querySelectorAll('#connect-metamask-btn'); // Keep ID for now

    // Login form elements (needed for Wallet Connect pre-fill)
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginTabLink = document.getElementById('login-tab'); // Get the login tab link

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
        // Ensure collection is not re-initialized unnecessarily
        if (appState.collection && appState.collection.credentials.orgDid === NILDB.orgCredentials.orgDid) {
             console.log(`Collection already initialized for UUID: ${uuid}`);
             return;
        }
        try {
            // Store the instance in appState
            appState.collection = new SecretVaultWrapper(NILDB.nodes, NILDB.orgCredentials, SCHEMA);
            await appState.collection.init();
            console.log(`Collection initialized for UUID: ${uuid}`);
        } catch (error) {
            console.error("Failed to initialize collection:", error);
            showWarningModal(`Error initializing connection: ${error.message}`);
            sessionStorage.removeItem(SESSION_UUID_KEY);
            sessionStorage.removeItem(SESSION_AUTH_KEY);
            appState.collection = null;
            location.reload();
        }
    }

    // Function to display the logged-in user (handles UUID or Address)
    function displayLoggedInUser(identifier) {
        if (userDisplaySpan && identifier) {
            let displayIdentifier = identifier;
            // Check if it looks like an Ethereum address
            if (identifier.startsWith('0x') && identifier.length === 42) {
                // Truncate address for display
                displayIdentifier = `${identifier.substring(0, 6)}...${identifier.substring(identifier.length - 4)}`;
                userDisplaySpan.title = `Logged in as: ${identifier}`; // Full address in tooltip
            } else {
                userDisplaySpan.title = `Your unique identifier`; // Keep original title for UUID
            }

            userDisplaySpan.textContent = displayIdentifier;
            userDisplaySpan.classList.remove('d-none');

            // Add a small copy button next to the identifier
            const existingCopyBtn = document.getElementById('header-copy-uuid-btn');
            if (!existingCopyBtn) { // Only add if it doesn't exist
                const copyBtn = document.createElement('button');
                copyBtn.id = 'header-copy-uuid-btn';
                copyBtn.className = 'btn btn-sm btn-outline-secondary ms-1';
                copyBtn.title = 'Copy full identifier to clipboard';
                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';

                // Add copy functionality (copies the full identifier)
                copyBtn.addEventListener('click', function() {
                    navigator.clipboard.writeText(identifier) // Copy original full identifier
                        .then(function() {
                            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
                            copyBtn.classList.add('btn-success');
                            copyBtn.classList.remove('btn-outline-secondary');
                            copyBtn.disabled = true;

                            setTimeout(() => {
                                copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                                copyBtn.classList.remove('btn-success');
                                copyBtn.classList.add('btn-outline-secondary');
                                 copyBtn.disabled = false;
                            }, 1200);
                        })
                        .catch(function(err) {
                            console.error('Could not copy text: ', err);
                            showWarningModal('Failed to copy to clipboard');
                        });
                });

                // Insert after the identifier span
                if (userDisplaySpan.parentNode) {
                    userDisplaySpan.parentNode.insertBefore(copyBtn, userDisplaySpan.nextSibling);
                }
            }

            // Update the sign-up/login button text
            if (signUpLoginButton) {
                signUpLoginButton.textContent = 'Logout';
                signUpLoginButton.removeAttribute('data-bs-toggle');
                signUpLoginButton.removeAttribute('data-bs-target');

                // Remove existing click handlers and add logout
                const newButton = signUpLoginButton.cloneNode(true);
                signUpLoginButton.parentNode.replaceChild(newButton, signUpLoginButton);

                // Add logout functionality
                newButton.addEventListener('click', function logoutHandler() {
                    // Remove the copy button when logging out
                    const copyBtn = document.getElementById('header-copy-uuid-btn');
                    if (copyBtn) copyBtn.remove();

                    sessionStorage.removeItem(SESSION_UUID_KEY);
                    sessionStorage.removeItem(SESSION_AUTH_KEY);
                    appState.collection = null;
                    location.reload();
                });
            }
        }
    }

    // Handle registration
    if (registerButton) {
        registerButton.addEventListener('click', async function() {
            const uuid = uuidSpan.textContent;
            const passwordInput = document.getElementById('register-password');
            const password = passwordInput.value;

            if (!uuid || uuid === 'UUID generation failed' || !password) {
                showWarningModal('Please generate a valid UUID and provide a password');
                return;
            }

            // Basic password validation (example)
            if (password.length < 8) {
                 showWarningModal('Password must be at least 8 characters long.');
                 return;
            }

            // Save the auth data
            saveAuthData(uuid, password);

            // Initialize the collection
            await initializeCollection(uuid);

            // Dynamically get the modal instance and close it
            const authModalInstance = bootstrap.Modal.getInstance(authModal);
            if (authModalInstance) {
                authModalInstance.hide();
            }

            // Display the logged-in user
            displayLoggedInUser(uuid);
            // Run initial query after registration
            runAndLogInitialQuery();
        });
    }

    // Handle login
    if (loginButton) {
        loginButton.addEventListener('click', async function() {
            const uuidInput = document.getElementById('login-username');
            const passwordInput = document.getElementById('login-password');
            const uuid = uuidInput.value;
            const password = passwordInput.value;

            if (!uuid || !password) {
                showWarningModal('Please provide both Unique Identifier and password');
                return;
            }

            // TODO: Add actual authentication logic here if needed
            // For now, we just save the credentials and initialize

            // Save the auth data
            saveAuthData(uuid, password);

            // Initialize the collection
            await initializeCollection(uuid);

            // Close the modal if initialization was successful (or handle error)
             if (appState.collection) {
                 if (authModalElement) {
                     authModalElement.hide();
                 }
                 // Display the logged-in user
                 displayLoggedInUser(uuid);
                 // Run initial query after login
                 runAndLogInitialQuery();
             } else {
                // Error handling is done within initializeCollection
                // Optionally clear fields or provide specific feedback
                passwordInput.value = ''; // Clear password field on failed login attempt
             }
        });
    }

    // Define the Wallet Connect click handler logic
    async function handleWalletConnect() {
        if (typeof window.ethereum === 'undefined') {
            showWarningModal('No Ethereum wallet detected! Please install a browser extension like MetaMask.');
            return;
        }

        // Ensure login form elements are available
        if (!loginUsernameInput || !loginPasswordInput || !loginTabLink) {
            console.error('Login form elements not found, cannot pre-fill.');
            showWarningModal('Internal error: Cannot access login form elements.');
            return;
        }

        try {
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            if (!accounts || accounts.length === 0) {
                showWarningModal('Could not retrieve account from wallet.');
                return;
            }
            const address = accounts[0]; // User's Ethereum address
            console.log(`Wallet Connect: Fetched address=${address}`);

            // Pre-fill the login form with the address
            loginUsernameInput.value = address;

            // Switch to the Login tab
            const loginTab = new bootstrap.Tab(loginTabLink);
            loginTab.show();

            // Focus the password field for the user
            loginPasswordInput.focus();

        } catch (error) {
            console.error('Error connecting wallet:', error);
            let userMessage = 'Failed to connect wallet.';
            if (error.code === 4001) { // EIP-1193 userRejectedRequest error
                userMessage = 'Wallet connection request rejected.';
            }
            showWarningModal(userMessage);
        }
    }

    // Handle Connect Wallet button (attach listener to both buttons)
    if (connectWalletButtons.length > 0) {
        connectWalletButtons.forEach(button => {
            button.addEventListener('click', handleWalletConnect);
        });
    }

    // Set UUID when register tab is shown
    if (registerTabLink && uuidSpan) {
        registerTabLink.addEventListener('shown.bs.tab', setUuid);
    }

    // Set UUID when auth modal is shown (if not already set)
    if (authModal && uuidSpan) {
        authModal.addEventListener('show.bs.modal', () => {
            if (!uuidSpan.textContent || uuidSpan.textContent === 'UUID generation failed') {
                setUuid();
            }
        });
    }

    // Initial UUID generation on load if needed
    if (uuidSpan && (!uuidSpan.textContent || uuidSpan.textContent === 'UUID generation failed')) {
         setUuid();
    }

    // Copy to clipboard functionality for registration modal
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
                        copyBtn.disabled = true;

                        // Reset after delay
                        setTimeout(() => {
                            copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
                            copyBtn.classList.remove('btn-success');
                            copyBtn.classList.add('btn-outline-secondary');
                             copyBtn.disabled = false;
                        }, 1200);
                    })
                    .catch(function(err) {
                        console.error('Could not copy text: ', err);
                        showWarningModal('Failed to copy to clipboard');
                    });
            } else {
                showWarningModal('No valid UUID to copy');
            }
        });
    }

    // Check if user is already logged in on page load
    const savedUuid = sessionStorage.getItem(SESSION_UUID_KEY);
    if (savedUuid) {
        // Wrap in an async IIFE to use await for initialization
        (async () => {
            displayLoggedInUser(savedUuid);
            await initializeCollection(savedUuid); // Ensure collection is initialized
            // Run initial query on page load if logged in
            runAndLogInitialQuery();
        })();
    }
}

// Single DOMContentLoaded listener to initialize both parts
document.addEventListener('DOMContentLoaded', function() {
    initializeReflectionsApp();
    initializeAuth();
});
