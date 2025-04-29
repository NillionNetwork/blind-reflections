import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { createJWT, ES256KSigner } from 'did-jwt';
import { nilql } from "@nillion/nilql";
// import { secretvaults } from "secretvaults";

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

// The `memory` entry is stored with shares
const SCHEMA = '35969a5c-a698-4110-bd18-921078bf7759';
const AGGREGATION = '1749d382-356b-4314-80c0-28f7075b4359';

// --- Constants --- (Moved Bearer token here)
const NIL_API_BASE_URL = "https://nilai-a779.nillion.network/v1";
const NIL_API_TOKEN = "Nillion2025"; // TODO: Secure this token
const DEFAULT_LLM_MODEL = "meta-llama/Llama-3.1-8B-Instruct";


// Define an enum for key types
export const KeyType = {
  CLUSTER: "cluster",
  SECRET: "secret",
};

// Define an enum for operations types
export const OperationType = {
  STORE: "store",
  SUM: "sum",
  MATCH: "match",
};

/**
 * NilQLWrapper provides encryption and decryption of data using Nillion's technology.
 * It generates and manages secret keys, splits data into shares when encrypting,
 * and recombines shares when decrypting.
 *
 * @example
 * const wrapper = new NilQLWrapper(cluster);
 * await wrapper.init();
 * const shares = await wrapper.encrypt(sensitiveData);
 */
export class NilQLWrapper {
  constructor(
    cluster,
    operation = OperationType.STORE,
    secretKey = null, // option to pass in your own secret key
    secretKeySeed = null,
    keyType = KeyType.CLUSTER,
  ) {
    this.cluster = cluster;
    this.secretKey = secretKey;
    this.secretKeySeed = secretKeySeed;
    this.operation = {
      [operation]: true,
    };
    this.keyType = keyType;
  }

  /**
   * Initializes the NilQLWrapper by generating and storing a secret key
   * for the cluster. This must be called before any encryption/decryption operations.
   * @returns {Promise<void>}
   */
  async init() {
    // Create secretKey from secretKeySeed, if provided
    if (this.secretKeySeed && this.secretKey === null) {
      this.secretKey = await nilql.SecretKey.generate(
        this.cluster,
        this.operation,
        this.secretKeySeed,
      );
    }

    if (this.secretKey === null) {
      switch (this.keyType) {
        case KeyType.SECRET:
          this.secretKey = await nilql.SecretKey.generate(
            this.cluster,
            this.operation,
          );
          break;
        case KeyType.CLUSTER:
          this.secretKey = await nilql.ClusterKey.generate(
            this.cluster,
            this.operation,
          );
          break;
        default:
          throw new Error("Unsupported key type");
      }
    }
  }

  /**
   * Encrypts data using the initialized secret key
   * @param {any} data - The data to encrypt
   * @throws {Error} If NilQLWrapper hasn't been initialized
   * @returns {Promise<Array>} Array of encrypted shares
   */
  async encrypt(data) {
    if (!this.secretKey) {
      throw new Error("NilQLWrapper not initialized. Call init() first.");
    }
    const shares = await nilql.encrypt(this.secretKey, data);
    return shares;
  }

  /**
   * Decrypts data using the initialized secret key and provided shares
   * @param {Array} shares - Array of encrypted shares to decrypt
   * @throws {Error} If NilQLWrapper hasn't been initialized
   * @returns {Promise<any>} The decrypted data
   */
  async decrypt(shares) {
    if (!this.secretKey) {
      throw new Error("NilQLWrapper not initialized. Call init() first.");
    }
    const decryptedData = await nilql.decrypt(this.secretKey, shares);
    return decryptedData;
  }

  /**
   * Recursively encrypts all values marked with %allot in the given data object
   * and prepares it for secure processing.
   *
   * - Traverses the entire object structure, handling nested objects at any depth.
   * - Encrypts values associated with the %allot key using nilql.encrypt().
   * - Preserves non-%allot values and maintains the original object structure.
   * - Calls nilql.allot() on the fully processed data before returning.
   *
   * @param {object} data - The input object containing fields marked with %allot for encryption.
   * @throws {Error} If NilQLWrapper has not been initialized with a secret key.
   * @returns {Promise<object>} The processed object with encrypted %allot values.
   */
  async prepareAndAllot(data) {
    if (!this.secretKey) {
      throw new Error("NilQLWrapper not initialized. Call init() first.");
    }

    const encryptDeep = async (obj) => {
      if (typeof obj !== "object" || obj === null) {
        return obj;
      }

      const encrypted = Array.isArray(obj) ? [] : {};

      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "object" && value !== null) {
          if ("%allot" in value) {
            encrypted[key] = {
              "%allot": await nilql.encrypt(this.secretKey, value["%allot"]),
            };
          } else {
            encrypted[key] = await encryptDeep(value); // Recurse into nested objects
          }
        } else {
          encrypted[key] = value;
        }
      }
      return encrypted;
    };

    const encryptedData = await encryptDeep(data);
    return nilql.allot(encryptedData);
  }

  /**
   * Recombines encrypted shares back into original data structure
   * @param {Array} shares - Array of shares from prepareAndAllot
   * @throws {Error} If NilQLWrapper hasn't been initialized
   * @returns {Promise<object>} Original data structure with decrypted values
   */
  async unify(shares) {
    if (!this.secretKey) {
      throw new Error("NilQLWrapper not initialized. Call init() first.");
    }
    const unifiedResult = await nilql.unify(this.secretKey, shares);
    return unifiedResult;
  }
}

class SecretVaultWrapper {
    constructor(
        nodes,
        credentials,
        schemaId = null,
        operation = 'store',
        secretKey = null,
        secretKeySeed = null,
        tokenExpirySeconds = 36000000,
    ) {
        this.nodes = nodes;
        this.nodesJwt = null;
        this.credentials = credentials;
        this.schemaId = schemaId;
        this.operation = operation;
        this.secretKey = secretKey;
        this.secretKeySeed = secretKeySeed;
        this.tokenExpirySeconds = tokenExpirySeconds;
        this.nilqlWrapper = null;
    }

    async init() {
        const nodeConfigs = await Promise.all(
            this.nodes.map(async (node) => ({
                url: node.url,
                jwt: await this.generateNodeToken(node.did),
            }))
        );
        this.nodesJwt = nodeConfigs;
        // Determine keyType
        const keyType =
          this.secretKey || this.secretKeySeed ? KeyType.SECRET : KeyType.CLUSTER;
        this.nilqlWrapper = new NilQLWrapper(
          { nodes: this.nodes },
          this.operation,
          this.secretKey,
          this.secretKeySeed,
          keyType,
        );
        await this.nilqlWrapper.init();
        return this.nilqlWrapper;
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

    /**
     * Transforms data by encrypting specified fields across all nodes
     * @param {object|array} data - Data to transform
     * @param {array} fieldsToEncrypt - Fields to encrypt
     * @returns {Promise<array>} Array of transformed data for each node
     */
    async allotData(data) {
      const encryptedRecords = [];
      for (const item of data) {
        const encryptedItem = await this.nilqlWrapper.prepareAndAllot(item);
        encryptedRecords.push(encryptedItem);
      }
      return encryptedRecords;
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

    async writeToNodes(data) {
      // add a _id field to each record if it doesn't exist
      const idData = data.map((record) => {
        if (!record._id) {
          return { ...record, _id: uuidv4() };
        }
        return record;
      });
      const transformedData = await this.allotData(idData);

      const writeDataToNode = async (node, index) => {
        try {
          const jwt = await this.generateNodeToken(node.did);
          const nodeData = transformedData.map((encryptedShares) =>
            encryptedShares.length !== this.nodes.length
              ? encryptedShares[0]
              : encryptedShares[index],
          );
          const payload = {
            schema: this.schemaId,
            data: nodeData,
          };

          const result = await this.makeRequest(
            node.url,
            "data/create",
            jwt,
            payload,
          );
          return { result, node };
        } catch (error) {
          console.error(`❌ Failed to write to ${node.url}:`, error.message);
          throw { error, node };
        }
      };

      const settledResults = await Promise.allSettled(
        this.nodes.map((node, index) => writeDataToNode(node, index)),
      );

      const results = settledResults.map((settledResult) => {
        if (settledResult.status === "fulfilled") {
          return {
            ...settledResult.value.result,
            node: settledResult.value.node,
            schemaId: this.schemaId,
          };
        }
        if (settledResult.status === "rejected") {
          return {
            error: settledResult.reason.error,
            node: settledResult.reason.node,
          };
        }
      });
      return results;
    }

    async readFromNodes(filter = {}) {
      const payload = { schema: this.schemaId, filter };

      const readDataFromNode = async (node) => {
        try {
          const jwt = await this.generateNodeToken(node.did);
          const result = await this.makeRequest(
            node.url,
            "data/read",
            jwt,
            payload,
          );
          return { result, node };
        } catch (error) {
          console.error(`❌ Failed to read from ${node.url}:`, error.message);
          throw { error, node };
        }
      };

      const settledResults = await Promise.allSettled(
        this.nodes.map((node) => readDataFromNode(node)),
      );

      const results = settledResults.map((settledResult) => {
        if (settledResult.status === "fulfilled") {
          return {
            ...settledResult.value.result,
            node: settledResult.value.node,
          };
        }
        if (settledResult.status === "rejected") {
          return {
            error: settledResult.reason.error,
            node: settledResult.reason.node,
          };
        }
      });

      // Group records across nodes by _id
      const recordGroups = results.reduce((acc, nodeResult) => {
        if (nodeResult.data) {
          for (const record of nodeResult.data) {
            const existingGroup = acc.find((group) =>
              group.shares.some((share) => share._id === record._id),
            );
            if (existingGroup) {
              existingGroup.shares.push(record);
            } else {
              acc.push({ shares: [record], recordIndex: record._id });
            }
          }
        }
        return acc;
      }, []);

      const recombinedRecords = await Promise.all(
        recordGroups.map(async (record) => {
          const recombined = await this.nilqlWrapper.unify(record.shares);
          return recombined;
        }),
      );
      return recombinedRecords;
    }

    /**
     * Updates data on all nodes, with optional field encryption
     * @param {array} recordUpdate - Data to update
     * @param {object} filter - Filter criteria for which records to update
     * @returns {Promise<array>} Array of update results from each node
     */
    async updateDataToNodes(recordUpdate, filter = {}) {
      const transformedData = await this.allotData([recordUpdate]);

      const updateDataOnNode = async (node, index) => {
        try {
          const jwt = await this.generateNodeToken(node.did);
          const [nodeData] = transformedData.map((encryptedShares) =>
            encryptedShares.length !== this.nodes.length
              ? encryptedShares[0]
              : encryptedShares[index],
          );
          const payload = {
            schema: this.schemaId,
            update: {
              $set: nodeData,
            },
            filter,
          };

          const result = await this.makeRequest(
            node.url,
            "data/update",
            jwt,
            payload,
          );
          return { result, node };
        } catch (error) {
          console.error(`❌ Failed to write to ${node.url}:`, error.message);
          throw { error, node };
        }
      };

      const settledResults = await Promise.allSettled(
        this.nodes.map((node, index) => updateDataOnNode(node, index)),
      );

      const results = settledResults.map((settledResult) => {
        if (settledResult.status === "fulfilled") {
          return {
            ...settledResult.value.result,
            node: settledResult.value.node,
          };
        }
        if (settledResult.status === "rejected") {
          return {
            error: settledResult.reason.error,
            node: settledResult.reason.node,
          };
        }
      });

      return results;
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
    // References to potentially dynamic elements
    const saveEntryBtn = document.getElementById('save-entry-btn');
    const saveEntryBtnOriginalContent = saveEntryBtn ? saveEntryBtn.innerHTML : '';
    const entriesLoadingSpinner = document.getElementById('entries-loading-spinner');
    const histogramLoadingEl = document.getElementById('histogram-loading');

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
        const tagsInput = document.getElementById('entry-tags'); // Get tags input
        // Ensure tagsInput is found before accessing value
        const tagsText = tagsInput ? tagsInput.value.trim() : '';

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

        // Process tags: split by comma, trim whitespace, remove empty tags
        // Default to empty array if tagsText is empty
        const tagsArray = tagsText
            ? tagsText.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
            : [];

        // Save entry to nilDB
        const message_for_nildb = {
            uuid: uuid,
            date: currentSelectedDate,
            entry: { "%allot": entryText },
            tags: tagsArray
        };

        // Show loading state
        const savingSpinner = document.getElementById('saving-entry-spinner');
        if (saveEntryBtn) saveEntryBtn.disabled = true;
        if (savingSpinner) savingSpinner.style.display = 'inline-block';

        try {
            if (!appState.collection) {
                throw new Error("Collection not initialized. Please log in.");
            }
            const dataWritten = await appState.collection.writeToNodes([message_for_nildb]);
            const recordId = dataWritten[0]?.data?.created?.[0]; // Extract the created ID

            const data = loadData();
            const timestamp = new Date().toISOString();

            if (!data[currentSelectedDate]) {
                data[currentSelectedDate] = [];
            }

            // Add the 'date' property here, using currentSelectedDate
            data[currentSelectedDate].push({ text: entryText, id: recordId, timestamp, tags: tagsArray, date: currentSelectedDate });
            saveData(data);

            // Clear the input fields
            entryTextArea.value = '';
            tagsInput.value = ''; // Clear tags input

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
            // Restore button state and hide spinner
            if (saveEntryBtn) saveEntryBtn.disabled = false;
            if (savingSpinner) savingSpinner.style.display = 'none';
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
        const formattedDate = formatDisplayDate(dateStr);

        // Update title of the Add Entry card
        const addTitleEl = document.getElementById('add-entry-title');
        if (addTitleEl) {
            addTitleEl.textContent = `Add a memory for ${formattedDate}`;
        }

        // Update title of the retrieved entries card
        const retrievedTitleEl = document.getElementById('retrieved-entries-title');
        if (retrievedTitleEl) {
            retrievedTitleEl.textContent = `Memories for ${formattedDate}`;
        }

        // Show the Add Entry and Retrieved Entries cards
        document.getElementById('add-entry-card').style.display = 'block';
        document.getElementById('retrieved-entries-card').style.display = 'block';

        // Hide "no date selected" message
        document.getElementById('no-date-message').style.display = 'none';

        // Show loading animation
        if(entriesLoadingSpinner) entriesLoadingSpinner.style.display = 'inline-block'; // Show spinner

        // Fetch and display entries for the selected date
        await fetchEntriesByDate(dateStr); // Call the refactored function

        // Clear the tag search input when a date is selected
        const tagInput = document.getElementById('tag-search-input');
        if (tagInput) tagInput.value = '';
    }

    // Refactored function to fetch entries by date
    async function fetchEntriesByDate(dateStr) {
        const entriesLoadingSpinner = document.getElementById('entries-loading-spinner'); // Get spinner ref inside
        try {
            const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
            const uuid = authData?.uuid;

            if (!uuid) {
                showWarningModal('You must be logged in to view memories.');
                // Optionally hide cards, reset selection etc. (Consider UI state consistency)
                return;
            }

            if (!appState.collection) {
                throw new Error("Collection not initialized. Please log in.");
            }

            const dataReadFromNilDB = await appState.collection.readFromNodes({ uuid, date: dateStr });
            const entries = processFetchedEntries(dataReadFromNilDB);

            // Update local storage (optional, maybe only cache date-based fetches?)
            const data = loadData();
            data[dateStr] = entries;
            saveData(data);

            displayEntries(entries);
        } catch (error) {
            console.error('Failed to read data by date from nilDB:', error);
            showWarningModal(`Failed to fetch memories for date: ${error.message}`);
            displayEntries(null);
        } finally {
            if(entriesLoadingSpinner) entriesLoadingSpinner.style.display = 'none';
        }
    }

    // New function to fetch entries by tag
    async function fetchEntriesByTag(tagsArray, logic) { // Accept array and logic
        const entriesLoadingSpinner = document.getElementById('entries-loading-spinner');
        const retrievedTitleEl = document.getElementById('retrieved-entries-title');
        const tagSearchButton = document.getElementById('tag-search-button'); // Need button for logic

        // Update title based on tags and logic
        const tagsString = tagsArray.map(t => `\"${t}\"`).join(', ');
        const logicString = tagSearchButton ? tagSearchButton.dataset.selectedLogic : 'OR'; // Read current logic
        // Only show logic if more than one tag
        const titleText = tagsArray.length > 1
            ? `Memories for Tags: ${tagsString} (${logicString})`
            : `Memories for Tag: ${tagsString}`;
        if (retrievedTitleEl) retrievedTitleEl.textContent = titleText;
        if (entriesLoadingSpinner) entriesLoadingSpinner.style.display = 'inline-block';

        // Ensure cards are visible (might be hidden if app just loaded)
        document.getElementById('add-entry-card').style.display = 'block';
        document.getElementById('retrieved-entries-card').style.display = 'block';
        document.getElementById('no-date-message').style.display = 'none';

        // Deselect any selected date in calendar visually
        if (currentSelectedDate) {
           const prevEl = calendar.el.querySelector(`.fc-day[data-date="${currentSelectedDate}"]`);
           if (prevEl) prevEl.classList.remove('fc-day-selected');
        }

        let finalEntries = [];
        let errorOccurred = false;

        try {
            const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
            const uuid = authData?.uuid;

            if (!uuid || !appState.collection) {
                showWarningModal('You must be logged in and collection initialized to search.');
                errorOccurred = true;
                return;
            }

            if (logicString === 'OR') {
                const allNodeResults = [];
                for (const tag of tagsArray) {
                    const dataRead = await appState.collection.readFromNodes({ uuid, tags: tag });
                    allNodeResults.push(...dataRead); // Accumulate results from all nodes for this tag
                }
                // Process and deduplicate based on ID
                const processedEntries = processFetchedEntries(allNodeResults);
                const uniqueEntriesMap = new Map();
                processedEntries.forEach(entry => {
                    if (!uniqueEntriesMap.has(entry.id)) {
                        uniqueEntriesMap.set(entry.id, entry);
                    }
                });
                finalEntries = Array.from(uniqueEntriesMap.values());

            } else { // AND logic
                if (tagsArray.length === 0) {
                    finalEntries = []; // No tags means no results for AND
                } else {
                    // Fetch based on the first tag
                    const firstTag = tagsArray[0];
                    const dataRead = await appState.collection.readFromNodes({ uuid, tags: firstTag });
                    let potentialMatches = processFetchedEntries(dataRead);

                    // Client-side filter for remaining tags
                    if (tagsArray.length > 1) {
                         finalEntries = potentialMatches.filter(entry => {
                             // Check if entry.tags (which should be an array) contains ALL other tags
                             const hasAllTags = tagsArray.slice(1).every(requiredTag =>
                                 Array.isArray(entry.tags) && entry.tags.includes(requiredTag)
                             );
                             return hasAllTags;
                         });
                    } else {
                         finalEntries = potentialMatches; // Only one tag, so initial fetch is enough
                    }
                }
            }

        } catch (error) {
            console.error(`Failed to read data by tag (${logicString}) from nilDB:`, error);
            showWarningModal(`Failed to fetch memories for tags (${logicString}): ${error.message}`);
            errorOccurred = true; // Mark error
            // Don't call displayEntries(null) here, let finally handle spinner, displayEntries called after finally if no error
        } finally {
            if (entriesLoadingSpinner) entriesLoadingSpinner.style.display = 'none';
            // Only display results if no error occurred during fetch/processing
            if (!errorOccurred) {
                displayEntries(finalEntries);
            } else {
                displayEntries(null); // Show error state in display
            }
        }
    }

    // Helper function to process fetched entries (avoids duplication)
    function processFetchedEntries(dataReadFromNilDB) {
        return dataReadFromNilDB
            .filter(entry => entry && typeof entry === 'object' && entry._id)
            .map(entry => ({
                id: entry._id,
                timestamp: entry._created,
                text: entry.entry,
                tags: entry.tags,
                date: entry.date
            }));
    }

    // Global variable to store the memory queue
    const memoryQueue = [];

    // Function to display entries in the Retrieved Memories card
    function displayEntries(entries) {
        const entriesListEl = document.getElementById('entries-list');
        const noEntriesMessageEl = document.getElementById('no-entries-message');
        const retrievedEntriesCard = document.getElementById('retrieved-entries-card'); // Reference the card
        // const memoryDisplayBox = document.getElementById('memory-display-box'); // Not directly modified here

        if (!entriesListEl || !noEntriesMessageEl || !retrievedEntriesCard) {
            console.error("Required elements for displaying entries are missing.");
            return;
        }

        entriesListEl.innerHTML = ''; // Clear previous entries

        // Ensure the retrieved entries card is visible if we might show entries or the 'no entries' message
        retrievedEntriesCard.style.display = 'block';

        // Ensure entries is a valid array before proceeding
        if (!Array.isArray(entries)) {
            console.error("displayEntries received non-array data:", entries);
             // Show error message within the retrieved entries card
             noEntriesMessageEl.innerHTML = `
                 <div class=\"text-center p-4\">
                     <i class=\"fas fa-exclamation-triangle fs-1 mb-3 text-warning\"></i>
                     <p>Could not load memories for this date.</p>
                 </div>
             `;
            noEntriesMessageEl.style.display = 'block';
            entriesListEl.style.display = 'none'; // Hide the list itself
            return;
        }

        if (entries.length === 0) {
            // Show 'no entries' message within the retrieved entries card
            noEntriesMessageEl.innerHTML = `
                 <div class=\"text-center p-4\">
                     <i class=\"fas fa-pencil fs-1 mb-3 text-secondary\"></i>
                     <p>No memories for this date yet. Write your first memory!</p>
                 </div>
             `;
            noEntriesMessageEl.style.display = 'block';
            entriesListEl.style.display = 'none'; // Hide the list itself
            return;
        }

        // If we have entries, ensure the 'no entries' message is hidden and list is shown
        noEntriesMessageEl.style.display = 'none';
        entriesListEl.style.display = 'block'; // Ensure list is visible

        // Create a copy before sorting to avoid modifying the original array passed in
        const sortedEntries = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        sortedEntries.forEach((entry) => {
            const entryCard = document.createElement('div');
            entryCard.className = 'card entry-card mb-3';
            entryCard.style.cursor = 'pointer'; // Make it look clickable
            entryCard.setAttribute('data-entry-id', entry.id); // Store ID for reference

            // Format creation timestamp
            const creationTimestamp = new Date(entry.timestamp);
            const formattedCreationTime = creationTimestamp.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
            const formattedCreationDate = creationTimestamp.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            // Format the reflection date (which is just YYYY-MM-DD string)
            // Use formatDisplayDate for consistency if needed, or keep simple
            const reflectionDate = entry.date; // Assuming it's YYYY-MM-DD
            // Optional: Use formatDisplayDate(reflectionDate) for fuller format
            const formattedReflectionDate = formatDisplayDate(reflectionDate);

            entryCard.innerHTML = `
                <div class=\"card-body\">
                    <div class=\"d-flex justify-content-between align-items-start\">
                        <div class=\"entry-meta mb-2\">
                            <span class=\"entry-timestamp small text-muted\">
                                Generated on ${formattedCreationDate} at ${formattedCreationTime} for ${formattedReflectionDate}
                            </span>
                        </div>
                        <div class=\"d-flex gap-1\">
                          <button class=\"btn btn-outline-secondary btn-sm entry-edit-btn\" title=\"Edit this memory\" data-entry-id=\"${entry.id}\"><i class=\"fas fa-edit\"></i></button>
                          <button class=\"btn btn-outline-danger btn-sm entry-delete-btn\" title=\"Delete this memory\" data-entry-id=\"${entry.id}\"><i class=\"fas fa-trash\"></i></button>
                        </div>
                    </div>
                    <p class=\"card-text entry-text\">${entry.text}</p>
                    <!-- Container for Tags -->
                    <div class=\"entry-tags-container mt-2\">
                        <!-- Tags will be injected here by JS -->
                    </div>
                </div>
            `;

            // Inject tags if they exist
            if (Array.isArray(entry.tags) && entry.tags.length > 0) {
                const tagsContainer = entryCard.querySelector('.entry-tags-container');
                if (tagsContainer) {
                    entry.tags.forEach(tag => {
                        const tagElement = document.createElement('span');
                        tagElement.className = 'entry-tag';
                        tagElement.textContent = tag;
                        tagsContainer.appendChild(tagElement);
                    });
                }
            }

            // Add click event to append the memory to the memory display box
            entryCard.addEventListener('click', (e) => {
                // Prevent click if delete button was clicked
                if (e.target.closest('.entry-delete-btn')) return;
                const memoryText = entry.text;
                const memoryDate = currentSelectedDate;
                const alreadyExists = memoryQueue.some(item => item.id === entry.id);
                if (alreadyExists) return;
                const memoryData = { id: entry.id, date: memoryDate, text: memoryText };
                memoryQueue.push(memoryData);
                if (memoryQueue.length > 5) {
                    memoryQueue.shift();
                }
                renderMemoryDisplayBox();
            });

            // Add delete button handler
            entryCard.querySelector('.entry-delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showDeleteConfirmModal(entry);
            });

            // Add edit button handler
            entryCard.querySelector('.entry-edit-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                showEditEntryModal(entry);
            });

            entriesListEl.appendChild(entryCard);
        });
    }

    // --- Delete confirmation modal logic ---
    let entryIdToDelete = null;
    function showDeleteConfirmModal(entry) {
        entryIdToDelete = entry.id;
        const modal = new bootstrap.Modal(document.getElementById('delete-confirm-modal'));
        const msg = document.getElementById('delete-confirm-message');
        msg.textContent = 'Are you sure you want to delete this memory?';
        modal.show();
    }

    // --- Edit entry modal logic ---
    let entryIdToEdit = null;
    function showEditEntryModal(entry) {
        entryIdToEdit = entry.id;
        // Fill modal fields
        document.getElementById('edit-entry-text').value = entry.text;
        document.getElementById('edit-entry-tags').value = Array.isArray(entry.tags) ? entry.tags.join(', ') : '';
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('edit-entry-modal'));
        modal.show();
    }

    // Save Changes button handler for edit modal
    document.getElementById('save-edit-entry-btn').addEventListener('click', async function() {
        if (!entryIdToEdit) return;
        const editText = document.getElementById('edit-entry-text').value.trim();
        const editTags = document.getElementById('edit-entry-tags').value.trim();
        const tagsArray = editTags ? editTags.split(',').map(tag => tag.trim()).filter(tag => tag !== '') : [];

        // Validate
        if (!editText) {
            showWarningModal('Please enter some text for your memory.');
            return;
        }
        const MAX_CHARS = 25000;
        if (editText.length > MAX_CHARS) {
            showWarningModal(`Your entry is too long. Please limit your reflection to approximately 5000 words (${MAX_CHARS} characters).`);
            return;
        }

        // Show loading state (disable button)
        const saveBtn = document.getElementById('save-edit-entry-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';

        try {
            if (!appState.collection) throw new Error('Collection not initialized');
            // Prepare update object
            const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
            const uuid = authData?.uuid;
            if (!uuid) throw new Error('No UUID found. Please log in again.');
            // Find the date for this entry in local storage
            const data = loadData();
            let entryDate = null;
            for (const date in data) {
                if (data[date].some(e => e.id === entryIdToEdit)) {
                    entryDate = date;
                    break;
                }
            }
            if (!entryDate) throw new Error('Could not determine entry date.');
            // Build update object
            const recordUpdate = {
                uuid: uuid,
                date: entryDate,
                entry: { "%allot": editText },
                tags: tagsArray
            };
            const filter = { _id: entryIdToEdit };
            // Update on all nodes
            await appState.collection.updateDataToNodes(recordUpdate, filter);
            // Update local storage
            if (data[entryDate]) {
                data[entryDate] = data[entryDate].map(e =>
                    e.id === entryIdToEdit ? { ...e, text: editText, tags: tagsArray } : e
                );
                saveData(data);
            }
            // Refresh UI
            if (currentSelectedDate) {
                displayEntries(data[currentSelectedDate]);
            }
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('edit-entry-modal'));
            if (modal) modal.hide();
            entryIdToEdit = null;
        } catch (err) {
            showWarningModal('Failed to update memory: ' + (err.message || err));
        } finally {
            // Restore button state
            saveBtn.disabled = false;
            saveBtn.innerHTML = 'Save Changes';
        }
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', async function() {
        if (!entryIdToDelete) return;
        try {
            if (!appState.collection) throw new Error('Collection not initialized');
            // Call deleteDataFromNodes with filter {_id: entryIdToDelete}
            await appState.collection.deleteDataFromNodes({ _id: entryIdToDelete });
            // Remove from local cache
            const data = loadData();
            for (const date in data) {
                data[date] = data[date].filter(entry => entry.id !== entryIdToDelete);
            }
            saveData(data);
            // Refresh display
            if (currentSelectedDate) {
                displayEntries(data[currentSelectedDate]);
            }
            // Hide modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('delete-confirm-modal'));
            if (modal) modal.hide();
            entryIdToDelete = null;
        } catch (err) {
            showWarningModal('Failed to delete memory: ' + (err.message || err));
        }
    });

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

    document.getElementById('ask-secret-llm-btn').addEventListener('click', async (event) => {
        // Prevent dropdown from interfering if main button part is clicked
        if (event.target.closest('#model-select-dropdown-toggle')) {
            return;
        }

        const askLlmButton = document.getElementById('ask-secret-llm-btn'); // Get button reference
        const privateReflectionInput = document.getElementById('private-reflection-input');

        // Get selected model from the button's data attribute
        const selectedModel = askLlmButton ? askLlmButton.dataset.selectedModel : DEFAULT_LLM_MODEL;
        if (!selectedModel) { // Check if a model is actually selected
            showWarningModal('Please select an LLM model using the gear icon.');
            return;
        }

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
        myHeaders.append("Authorization", `Bearer ${NIL_API_TOKEN}`); // Use constant

        const raw = JSON.stringify({
            model: selectedModel, // Use the selected model
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
            const response = await fetch(`${NIL_API_BASE_URL}/chat/completions`, requestOptions); // Use constant

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API Error (${response.status}): ${errorText}`);
            }

            const result = await response.json();

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

    // --- Tag Search Event Listeners ---

    // Add listeners for the new tag logic dropdown
    const tagLogicDropdownMenu = document.getElementById('tag-logic-dropdown-menu');
    const tagSearchButtonForLogic = document.getElementById('tag-search-button'); // Use different var name
    const tagLogicDisplaySpan = document.getElementById('tag-logic-display');

    if (tagLogicDropdownMenu && tagSearchButtonForLogic && tagLogicDisplaySpan) {
        tagLogicDropdownMenu.addEventListener('click', (event) => {
            // Use closest to handle clicks on the button itself or its content
            const button = event.target.closest('.dropdown-item[data-logic]');
            if (button) {
                const selectedLogic = button.dataset.logic;
                // Update the data attribute on the main button
                tagSearchButtonForLogic.dataset.selectedLogic = selectedLogic;
                // Update the display span
                tagLogicDisplaySpan.textContent = `(${selectedLogic})`;
            }
        });
    }

    // Modify listener for the main tag search button
    const tagSearchButton = document.getElementById('tag-search-button');
    const tagSearchInput = document.getElementById('tag-search-input');

    if (tagSearchButton && tagSearchInput) {
        tagSearchButton.addEventListener('click', () => {
            // Split tags, trim, filter empty
            const tagsArray = tagSearchInput.value
                .split(',')
                .map(tag => tag.trim())
                .filter(tag => tag !== '');

            if (tagsArray.length > 0) {
                const selectedLogic = tagSearchButton.dataset.selectedLogic || 'OR'; // Get logic
                fetchEntriesByTag(tagsArray, selectedLogic); // Pass array and logic
            } else {
                showWarningModal("Please enter at least one tag to search.");
            }
        });
        // Keep Enter key listener
        tagSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                tagSearchButton.click(); // Trigger button click
            }
        });
    }

    // --- Define Speech API access once ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // --- Speech Recognition Logic for Private Reflection ---
    const micButton = document.getElementById('mic-button');
    const micIcon = document.getElementById('mic-icon');
    const reflectionInput = document.getElementById('private-reflection-input');
    const speechStatus = document.getElementById('speech-status');
    let recognition;
    let isRecording = false;

    // Check for elements *and* API support (API checked via the constant above)
    if (SpeechRecognition && micButton && reflectionInput && speechStatus && micIcon) {
        recognition = new SpeechRecognition();
        recognition.continuous = true; // Keep listening even after pauses
        recognition.interimResults = true;

        micButton.addEventListener('click', () => {
            if (isRecording) {
                recognition.stop();
            } else {
                try {
                    recognition.start();
                } catch (error) {
                     console.error("Error starting speech recognition:", error);
                     showWarningModal("Could not start dictation. Please check microphone permissions or try again.");
                     isRecording = false;
                     micIcon.className = 'fas fa-microphone';
                     speechStatus.style.display = 'none';
                }
            }
        });

        recognition.onstart = () => {
            isRecording = true;
            micIcon.className = 'fas fa-stop-circle text-danger';
            speechStatus.textContent = 'Listening...';
            speechStatus.style.display = 'inline';
        };

        recognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                const currentText = reflectionInput.value;
                const separator = (currentText.length > 0 && !/\s$/.test(currentText)) ? ' ' : '';
                reflectionInput.value += separator + finalTranscript.trim() + ' ';

                 speechStatus.textContent = 'Added: "' + finalTranscript.trim() + '" ';
                 setTimeout(() => {
                    if(isRecording) speechStatus.textContent = 'Listening...';
                 }, 1500);
            }
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            let errorMessage = "An unknown error occurred during dictation.";
            // Reuse the same error message logic from the other handler
            switch (event.error) {
                 case 'no-speech':
                     errorMessage = "No speech was detected. Microphone might be muted or setup incorrectly.";
                     break;
                 case 'audio-capture':
                     errorMessage = "Microphone not available. Check if it's connected and enabled.";
                     break;
                 case 'not-allowed':
                     errorMessage = "Microphone permission denied. Please allow access in browser settings.";
                     break;
                 case 'network':
                      errorMessage = "Network error during speech recognition. Check connection.";
                      break;
             }
            showWarningModal(errorMessage);
            isRecording = false;
            micIcon.className = 'fas fa-microphone';
            speechStatus.style.display = 'none';
        };

        recognition.onend = () => {
            isRecording = false;
            micIcon.className = 'fas fa-microphone';
            speechStatus.style.display = 'none';
        };

    } else {
        if(micButton) micButton.style.display = 'none';
        console.warn('Web Speech API not supported or mic elements missing.');
    }

    // --- Speech Recognition Logic for Daily Entry ---
    const entryMicButton = document.getElementById('entry-mic-button');
    const entryMicIcon = document.getElementById('entry-mic-icon');
    const entryTextArea = document.getElementById('entry-text');
    const entrySpeechStatus = document.getElementById('entry-speech-status');
    let entryRecognition;
    let isEntryRecording = false;

    // Check for elements *and* API support (API checked via the constant above)
    if (SpeechRecognition && entryMicButton && entryTextArea && entrySpeechStatus && entryMicIcon) {
        entryRecognition = new SpeechRecognition();
        entryRecognition.continuous = true;
        entryRecognition.interimResults = true;

        entryMicButton.addEventListener('click', () => {
            if (isEntryRecording) {
                entryRecognition.stop();
            } else {
                try {
                    entryRecognition.start();
                } catch (error) {
                     console.error("Error starting entry speech recognition:", error);
                     showWarningModal("Could not start dictation for entry. Please check microphone permissions or try again.");
                     isEntryRecording = false;
                     entryMicIcon.className = 'fas fa-microphone';
                     entrySpeechStatus.style.display = 'none';
                }
            }
        });

        entryRecognition.onstart = () => {
            isEntryRecording = true;
            entryMicIcon.className = 'fas fa-stop-circle text-danger';
            entrySpeechStatus.textContent = 'Listening...';
            entrySpeechStatus.style.display = 'inline';
        };

        entryRecognition.onresult = (event) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            if (finalTranscript) {
                const currentText = entryTextArea.value;
                const separator = (currentText.length > 0 && !/\s$/.test(currentText)) ? ' ' : '';
                entryTextArea.value += separator + finalTranscript.trim() + ' ';

                 entrySpeechStatus.textContent = 'Added: "' + finalTranscript.trim() + '" ';
                 setTimeout(() => {
                    if(isEntryRecording) entrySpeechStatus.textContent = 'Listening...';
                 }, 1500);
            }
        };

        entryRecognition.onerror = (event) => {
            console.error('Entry speech recognition error:', event.error);
            let errorMessage = "An unknown error occurred during entry dictation.";
            // Reuse the same error message logic from the other handler
            switch (event.error) {
                 case 'no-speech':
                     errorMessage = "No speech was detected. Microphone might be muted or setup incorrectly.";
                     break;
                 case 'audio-capture':
                     errorMessage = "Microphone not available. Check if it's connected and enabled.";
                     break;
                 case 'not-allowed':
                     errorMessage = "Microphone permission denied. Please allow access in browser settings.";
                     break;
                 case 'network':
                      errorMessage = "Network error during speech recognition. Check connection.";
                      break;
             }
            showWarningModal(errorMessage);
            isEntryRecording = false;
            entryMicIcon.className = 'fas fa-microphone';
            entrySpeechStatus.style.display = 'none';
        };

        entryRecognition.onend = () => {
            isEntryRecording = false;
            entryMicIcon.className = 'fas fa-microphone';
            entrySpeechStatus.style.display = 'none';
        };

    } else {
        if(entryMicButton) entryMicButton.style.display = 'none';
        console.warn('Web Speech API not supported or entry mic elements missing.');
    }
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
        container.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-chart-bar fs-1 mb-3 text-secondary"></i>
                <p class="text-muted small">Not enough reflection data to display histogram.</p>
            </div>
        `;
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
    const histogramLoadingEl = document.getElementById('histogram-loading');
    if(histogramLoadingEl) histogramLoadingEl.style.display = 'flex'; // Show loading state

    if (!appState.collection) {
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

    try {
        // Call executeQueryOnSingleNode with the correct payload format
        const result = await appState.collection.executeQueryOnSingleNode(targetNode, queryPayload);

        if (result.error) {
            console.error(`❌ Initial query execution failed (Node: ${result.node}, Status: ${result.status}):`, result.error);
            renderHistogram([]); // Render empty state on error
        } else if (Array.isArray(result.data)) { // Process even if empty
            const sortedData = [...result.data].sort((a, b) => { // Create copy before sorting
                // Ensure both counts are numbers before subtracting
                const countA = Number(a.reflections_count) || 0;
                const countB = Number(b.reflections_count) || 0;
                return countB - countA; // Sort descending
            });
            const topK = sortedData.slice(0, TOP_K_RESULTS);
            renderHistogram(topK); // Render histogram with top K data
        } else {
            renderHistogram([]); // Render empty state
        }
    } catch (e) {
        // Catch any unexpected errors from the call itself
        console.error(`❌ Unexpected error during initial query execution:`, e);
        renderHistogram([]); // Render empty state on error
    } finally {
        // Hide loading animation
        if(histogramLoadingEl) histogramLoadingEl.style.display = 'none'; // Hide spinner
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
        // Check if UUID span element exists
        if (uuidSpan) {
            const newUuid = uuidv4();
            uuidSpan.textContent = newUuid;
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
             return;
        }
        try {
            // Store the instance in appState
            appState.collection = new SecretVaultWrapper(NILDB.nodes, NILDB.orgCredentials, SCHEMA);
            await appState.collection.init();
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

// Function to fetch available LLM models
async function fetchAndPopulateModels() {
    // No longer need the old select element
    // const modelSelect = document.getElementById('llm-model-select');
    // if (!modelSelect) return;

    const modelDropdownMenu = document.getElementById('model-select-dropdown-menu');
    const modelDisplaySpan = document.getElementById('llm-model-display');
    const askLlmButton = document.getElementById('ask-secret-llm-btn');

    // Initial state before fetch
    if (modelDisplaySpan) modelDisplaySpan.textContent = 'Loading...';
    if (askLlmButton) askLlmButton.dataset.selectedModel = ''; // Clear selected model data

    const myHeaders = new Headers();
    myHeaders.append("Accept", "application/json");
    myHeaders.append("Authorization", `Bearer ${NIL_API_TOKEN}`);

    const requestOptions = {
      method: "GET",
      headers: myHeaders,
      redirect: "follow"
    };

    try {
        const response = await fetch(`${NIL_API_BASE_URL}/models`, requestOptions);
        if (!response.ok) {
            throw new Error(`Failed to fetch models: ${response.status} ${response.statusText}`);
        }
        const result = await response.json();

        // Check if the result *itself* is an array
        if (Array.isArray(result)) {
            populateModelDropdown(result); // Pass the result array directly
        } else {
            throw new Error("Unexpected response structure for models");
        }

    } catch (error) {
        console.error("Error fetching models:", error);
        // Update dropdown menu and display span to show error
        if(modelDropdownMenu) modelDropdownMenu.innerHTML = '<li><a class="dropdown-item disabled" href="#">Error loading models</a></li>';
        if(modelDisplaySpan) modelDisplaySpan.textContent = 'Error';
        if(askLlmButton) askLlmButton.dataset.selectedModel = ''; // Clear selection on error
    }
}

// Function to populate the new model dropdown menu (UL element)
function populateModelDropdown(models) {
    const modelDropdownMenu = document.getElementById('model-select-dropdown-menu');
    const modelDisplaySpan = document.getElementById('llm-model-display');
    const askLlmButton = document.getElementById('ask-secret-llm-btn');

    if (!modelDropdownMenu || !modelDisplaySpan || !askLlmButton) {
        console.error("Required elements for model dropdown not found.");
        return;
    }

    modelDropdownMenu.innerHTML = ''; // Clear existing items (like "Loading...")

    if (!models || models.length === 0) {
        modelDropdownMenu.innerHTML = '<li><a class="dropdown-item disabled" href="#">No models available</a></li>';
        modelDisplaySpan.textContent = 'N/A';
        askLlmButton.dataset.selectedModel = '';
        return;
    }

    let defaultModelSet = false;
    models.forEach(model => {
        if (model && typeof model.id === 'string') {
            const listItem = document.createElement('li');
            const buttonItem = document.createElement('button');
            buttonItem.className = 'dropdown-item';
            buttonItem.type = 'button';
            buttonItem.textContent = model.id;
            buttonItem.dataset.modelId = model.id; // Store model ID on the button

            // Add click listener to update selection
            buttonItem.addEventListener('click', (e) => {
                const selectedId = e.target.dataset.modelId;
                modelDisplaySpan.textContent = selectedId; // Update display
                askLlmButton.dataset.selectedModel = selectedId; // Store selection on main button
            });

            listItem.appendChild(buttonItem);
            modelDropdownMenu.appendChild(listItem);

            // Set initial display and selection based on default
            if (!defaultModelSet && model.id === DEFAULT_LLM_MODEL) {
                modelDisplaySpan.textContent = model.id;
                askLlmButton.dataset.selectedModel = model.id;
                defaultModelSet = true;
            }
        }
    });

    // If default wasn't found, select and display the first one
    if (!defaultModelSet && models.length > 0 && models[0] && models[0].id) {
         const firstModelId = models[0].id;
         modelDisplaySpan.textContent = firstModelId;
         askLlmButton.dataset.selectedModel = firstModelId;
         // Add active class to the first item visually if needed (optional)
         // modelDropdownMenu.querySelector('.dropdown-item')?.classList.add('active');
    }
}

// Single DOMContentLoaded listener to initialize both parts
document.addEventListener('DOMContentLoaded', function() {
    initializeReflectionsApp();
    initializeAuth();
    fetchAndPopulateModels(); // Fetch models when DOM is ready
});
