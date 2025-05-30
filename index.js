/* global bootstrap, FullCalendar, marked */

import { Buffer } from 'buffer';
import { v4 as uuidv4 } from 'uuid';
import { createJWT, ES256KSigner } from 'did-jwt';
import { nilql } from "@nillion/nilql";

window.Buffer = Buffer; // Required for in-browser use of eciesjs.

// Application state container
const appState = {
  collection: null, // Holds the SecretVaultWrapper instance
};

/* Organization configuration for nilDB. */
const NILDB = {
  orgCredentials: {
    secretKey: process.env.NILDB_ORG_ID,
    orgDid: process.env.NILDB_SECRET_KEY,
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

// The `memory`, `mood`, `file`, and `file_name` entries are stored with shares
const SCHEMA = process.env.NILDB_SCHEMA_ID;
const TAG_AGGREGATION = process.env.TAG_AGGREGATION;
const MOOD_AGGREGATION = process.env.MOOD_AGGREGATION;

// --- Constants ---
const NIL_API_BASE_URL = process.env.NIL_API_BASE_URL;
const NIL_API_TOKEN = process.env.NIL_API_TOKEN;
const DEFAULT_LLM_MODEL = "meta-llama/Llama-3.1-8B-Instruct";
const CHUNK_SIZE = 2 * 1024; // 2 KB

class SecretVaultWrapper {
  constructor(
    nodes,
    credentials,
    schemaId = null,
    secretKeySeed = null,
    tokenExpirySeconds = 36000000,
  ) {
    this.nodes = nodes;
    this.nodesJwt = null;
    this.credentials = credentials;
    this.schemaId = schemaId;
    this.secretKeySeed = secretKeySeed;
    this.tokenExpirySeconds = tokenExpirySeconds;
    this.secretKeyStore = null;
    this.secretKeySum = null;
  }

  async init() {
    const nodeConfigs = await Promise.all(
      this.nodes.map(async (node) => ({
        url: node.url,
        jwt: await this.generateNodeToken(node.did),
      }))
    );
    this.nodesJwt = nodeConfigs;

    // --- Generate both keys ---
    this.secretKeyStore = await nilql.SecretKey.generate(
      { nodes: this.nodes },
      { store: true },
      null,
      this.secretKeySeed,
    );
    this.secretKeySum = await nilql.SecretKey.generate(
      { nodes: this.nodes },
      { sum: true },
      null,
      this.secretKeySeed,
    );
    return true;
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
  async encryptData(data, update = false) {
    // This assumes data is an array of message objects (usually length 1)
    const allNodeRecords = [];
    for (const item of data) {
      // Only generate a UUID for this record if not present and not updating
      const recordId = (!update && !item._id) ? uuidv4() : item._id;
      // Encrypt the entry field directly (assume it's a string)
      const entryShares = await nilql.encrypt(this.secretKeyStore, item.entry);

      // Encrypt mood if present (as integer) using SUM key
      let moodShares = null;
      if (item.mood !== undefined && item.mood !== null && item.mood !== "") {
        moodShares = await nilql.encrypt(this.secretKeySum, parseInt(item.mood, 10));
      }

      // Encrypt file chunks if present using STORE key
      let allChunkShares = []; // Will hold arrays of shares, one array per chunk
      let fileNameShares = null; // Will hold shares for the filename
      if (Array.isArray(item.file) && item.file.length > 0) {
        for (const chunk of item.file) {
          // Assuming chunk is Uint8Array, nilql handles Buffer conversion if needed
          const chunkShares = await nilql.encrypt(this.secretKeyStore, chunk);
          allChunkShares.push(chunkShares);
        }
        // Also encrypt the filename if file exists
        if (item.file_name) {
          fileNameShares = await nilql.encrypt(this.secretKeyStore, item.file_name);
        }
      }

      // For each node, create a message with the same _id and all other fields identical except encrypted ones
      for (let i = 0; i < this.nodes.length; i++) {
        let nodeMessage;
        const baseMessage = update ? { ...item } : { ...item, _id: recordId }; // Handle _id based on update flag
        nodeMessage = {
          ...baseMessage,
          entry: { "%share": entryShares[i] },
        };

        // Add mood share if present
        if (moodShares) {
          nodeMessage.mood = { "%share": moodShares[i] };
        }

        // Add file chunk shares if present
        if (allChunkShares.length > 0) {
          nodeMessage.file = [];
          for (let j = 0; j < allChunkShares.length; j++) {
            // Get the i-th share for the j-th chunk
            nodeMessage.file.push({ "%share": allChunkShares[j][i] });
          }
          // Add encrypted file_name share if present
          if (fileNameShares) {
            nodeMessage.file_name = { "%share": fileNameShares[i] };
          }
        }

        allNodeRecords.push(nodeMessage);
      }
    }
    return allNodeRecords;
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
    const transformedData = await this.encryptData(idData);

    const writeDataToNode = async (node, index) => {
      try {
        const jwt = await this.generateNodeToken(node.did);
        const nodeData = [transformedData[index]];
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

    // Group records across nodes by _id and collect all shares
    const recordSharesMap = new Map();
    for (const nodeResult of results) {
      if (nodeResult.data) {
        for (const record of nodeResult.data) {
          if (!record._id) continue;

          // Initialize if record._id is not yet in the map
          if (!recordSharesMap.has(record._id)) {
            // Initialize with entry, mood, and optionally file/file_name
            recordSharesMap.set(record._id, {
              entry: [],
              mood: [],
              file: record.file ? record.file.map(() => []) : [], // Initialize based on first seen record's file structure
              file_name: [], // Add for filename shares
              firstRecordData: { ...record } // Store the first occurrence's non-shared data
            });
          }

          // Get the share object for the current record ID
          const recordData = recordSharesMap.get(record._id);

          // Push entry share if it exists
          recordData.entry.push(record.entry && record.entry["%share"]);

          // Push mood share if it exists
          if (record.mood && record.mood["%share"]) {
            recordData.mood.push(record.mood["%share"]);
          }

          // Push file chunk shares if they exist
          if (Array.isArray(record.file)) {
            // Ensure the file structure in the map matches the current record
            if (recordData.file.length !== record.file.length) {
              // If first time seeing file or structure mismatch, initialize/resize
              recordData.file = record.file.map(() => []);
              // Update firstRecordData if this is the first record with file info
              if (!recordData.firstRecordData.file) {
                recordData.firstRecordData = { ...record };
              }
            }
            record.file.forEach((chunkShareObj, chunkIndex) => {
              if (chunkShareObj && chunkShareObj["%share"]) {
                // Ensure the inner array exists for this chunk index
                if (!recordData.file[chunkIndex]) {
                  recordData.file[chunkIndex] = [];
                }
                recordData.file[chunkIndex].push(chunkShareObj["%share"]);
              }
            });
          }

          // Push file_name share if it exists
          if (record.file_name && record.file_name["%share"]) {
            // Initialize file_name array if needed (might not be present in firstRecordData)
            if (!recordData.file_name) {
              recordData.file_name = [];
            }
            recordData.file_name.push(record.file_name["%share"]);
            // Update firstRecordData if this is the first time seeing file_name share structure
            if (!recordData.firstRecordData.file_name || !recordData.firstRecordData.file_name["%share"]) {
              // Update firstRecordData to include the structure, but value is irrelevant here
              recordData.firstRecordData.file_name = { "%share": "placeholder" };
            }
          }
        }
      }
    }

    // For each record, decrypt the entry/mood/file from shares and merge other fields
    const mergedRecords = [];
    for (const [_id, recordData] of recordSharesMap.entries()) {
      const { entry: entryShares, mood: moodShares, file: fileChunkSharesArrays, file_name: fileNameShares, firstRecordData } = recordData;

      // Decrypt entry
      let decryptedEntry = null;
      const validEntryShares = entryShares.filter(Boolean);
      if (validEntryShares.length > 0) {
        decryptedEntry = await nilql.decrypt(this.secretKeyStore, validEntryShares);
      }

      // Decrypt mood
      let decryptedMood = null;
      const validMoodShares = moodShares.filter(Boolean);
      if (validMoodShares.length > 0) {
        const rawMood = await nilql.decrypt(this.secretKeySum, validMoodShares);
        decryptedMood = Number(rawMood);
      }

      // Decrypt file chunks
      let decryptedFileChunks = [];
      let decryptedFileName = null;

      if (Array.isArray(fileChunkSharesArrays) && fileChunkSharesArrays.length > 0) {
        for (const chunkShares of fileChunkSharesArrays) {
          const validChunkShares = chunkShares.filter(Boolean);
          if (validChunkShares.length > 0) {
            try {
              const decryptedChunk = await nilql.decrypt(this.secretKeyStore, validChunkShares);
              // nilql.decrypt might return Buffer, ensure it's Uint8Array if needed downstream
              // For now, assume it's compatible or handle conversion later
              decryptedFileChunks.push(decryptedChunk);
            } catch (decryptError) {
              console.error(`❌ Failed to decrypt file chunk for record ${_id}:`, decryptError);
              // Decide how to handle partial decryption failure - skip file? add error indicator?
              // For now, we'll continue, potentially resulting in an incomplete file array
            }
          }
        }
      }

      // Decrypt file_name (only if chunks were processed, implying file existed)
      if (decryptedFileChunks.length > 0 && Array.isArray(fileNameShares) && fileNameShares.length > 0) {
        const validFileNameShares = fileNameShares.filter(Boolean);
        if (validFileNameShares.length > 0) {
          try {
            decryptedFileName = await nilql.decrypt(this.secretKeyStore, validFileNameShares);
          } catch (decryptError) {
            console.error(`❌ Failed to decrypt file name for record ${_id}:`, decryptError);
          }
        }
      }

      // Construct the merged record using data from the first occurrence and decrypted values
      const mergedRecord = {
        ...firstRecordData, // Start with non-shared data from the first record seen
        _id: _id,
        entry: decryptedEntry,
      };

      // Add decrypted mood only if decryption was successful
      if (decryptedMood !== null && !isNaN(decryptedMood)) {
        mergedRecord.mood = decryptedMood;
      } else {
        // Ensure mood field is removed if decryption failed or wasn't present
        delete mergedRecord.mood;
      }

      // Add decrypted file chunks and file_name if available
      if (decryptedFileChunks.length > 0) {
        mergedRecord.file = decryptedFileChunks; // Array of decrypted chunks (e.g., Uint8Arrays or Buffers)
        // Add decrypted file_name if available
        if (decryptedFileName) {
          mergedRecord.file_name = decryptedFileName;
        } else {
          // If chunks exist but filename failed decryption, remove placeholder
          delete mergedRecord.file_name;
        }
      } else {
        // Ensure file fields are removed if decryption failed or wasn't present
        delete mergedRecord.file;
        delete mergedRecord.file_name;
      }

      mergedRecords.push(mergedRecord);
    }

    return mergedRecords;
  }

  /**
  * Updates data on all nodes, with optional field encryption
  * @param {array} recordUpdate - Data to update
  * @param {object} filter - Filter criteria for which records to update
  * @returns {Promise<array>} Array of update results from each node
  */
  async updateDataToNodes(recordUpdate, filter = {}) {
    const transformedData = await this.encryptData([recordUpdate], true);

    const updateDataOnNode = async (node, index) => {
      try {
        const jwt = await this.generateNodeToken(node.did);
        const nodeData = transformedData[index];
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
        'queries/execute',
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
      console.error(`❌ Failed to execute query on ${node.url}:`, error.message);
      return {
        node: node.url,
        status: error.status || null, // Include status if available on error object
        error: error.message || "An unknown error occurred",
      };
    }
  }

  /**
  * Executes a query on all configured nodes, groups the results by _id,
  * and unifies the shares to reconstruct the original records.
  *
  * @param {object} queryPayload - The query payload to execute (e.g., { id: QUERY_ID, variables: { ... } }).
  * @returns {Promise<Array<object>>} - A promise resolving to an array of unified records.
  */
  async executeQueryOnNodes(queryPayload) {
    // Execute queries in parallel on all nodes
    const resultsFromAllNodes = await Promise.all(
      this.nodes.map(node => this.executeQueryOnSingleNode(node, queryPayload))
    );

    // Filter out any node results that resulted in an error
    const successfulNodeResults = resultsFromAllNodes.filter(result => !result.error && Array.isArray(result.data));

    // --- Aggregation Result Handling ---
    if (successfulNodeResults.length === 0) {
      console.warn("[executeQueryOnNodes] No successful results from any node.");
      return []; // No data to process
    }

    // Collect all aggregated_mood shares from all successful nodes
    const allAggregatedMoodShares = [];
    successfulNodeResults.forEach(nodeResult => {
      nodeResult.data.forEach(record => {
        if (record && record.aggregated_mood && record.aggregated_mood["%share"]) {
          allAggregatedMoodShares.push(record.aggregated_mood["%share"]);
        }
      });
    });

    // Get the count from the first successful record (assuming count is consistent)
    // Find the first result that actually has data
    const firstResultWithData = successfulNodeResults.find(r => r.data.length > 0);
    const count = firstResultWithData ? firstResultWithData.data[0].count : null;

    let decryptedAggregatedMood = null;
    let finalResult = {};

    try {
      // Decrypt aggregated_mood using all collected shares
      if (allAggregatedMoodShares.length > 0) {
        decryptedAggregatedMood = await nilql.decrypt(this.secretKeySum, allAggregatedMoodShares);
        decryptedAggregatedMood = Number(decryptedAggregatedMood);
      }

      // Construct the single result object
      finalResult = {
        count: count, // Use the count obtained earlier
      };

      // Add the decrypted mood if decryption was successful
      if (decryptedAggregatedMood !== null && !isNaN(decryptedAggregatedMood)) {
        finalResult.aggregated_mood = decryptedAggregatedMood;
      }
    } catch (error) {
      console.error(`❌ Failed to decrypt aggregated_mood shares:`, error);
      // Return partial data or empty array on decryption failure
      finalResult = {
        count: count, // Still return the count if available
        error: "Failed to decrypt aggregated mood"
      };
    }

    // Return the single aggregated result within an array
    return [finalResult];
  }
}

// Function to chunk a byte array (Uint8Array)
function chunkBytes(bytes, chunkSize) {
  const chunks = [];
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(bytes.slice(i, i + chunkSize));
  }
  return chunks;
}

// Function to unchunk byte arrays (Uint8Array)
function unchunkBytes(chunks) {
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    merged.set(chunk, offset);
    offset += chunk.length;
  }
  return merged;
}

// Helper function to get MIME type from filename
function getMimeTypeFromFilename(filename) {
  const extension = filename.split('.').pop().toLowerCase();
  switch (extension) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    // Add more cases as needed
    default:
      return 'application/octet-stream'; // Default fallback
  }
}

// Mood Emojis Map (Moved to higher scope for reuse)
const moodEmojis = {
  1: { emoji: '😞', label: 'Very Bad' },
  2: { emoji: '😕', label: 'Bad' },
  3: { emoji: '😐', label: 'Neutral' },
  4: { emoji: '🙂', label: 'Good' },
  5: { emoji: '😄', label: 'Very Good' },
};

// Function to display the aggregated mood and count for the day
function displayDailyMood(mood, count) {
  const displayEl = document.getElementById('daily-mood-display');
  if (!displayEl) return;

  if (mood !== null && mood !== undefined && count !== null && count !== undefined) {
    const moodObj = moodEmojis[Math.round(mood)];
    const moodEmoji = moodObj ? moodObj.emoji : '?';
    const moodLabel = moodObj ? moodObj.label : '?';
    const countText = count === 1 ? '1 memory' : `${count} memories`;
    displayEl.textContent = `Overall mood of the day: ${moodLabel} ${moodEmoji} (${countText})`;
  } else {
    displayEl.textContent = '';
  }
}

// Function to fetch and display the aggregated mood for a specific date
async function fetchAndDisplayDailyMood(dateStr) {
  // Clear previous mood display first
  displayDailyMood(null, null);

  const authData = JSON.parse(sessionStorage.getItem('blind_reflections_auth'));
  const currentUserUuid = authData?.uuid;

  if (!currentUserUuid || !appState.collection) {
    console.warn("Cannot fetch daily mood: User not logged in or collection not initialized.");
    return;
  }

  const queryPayload = {
    id: MOOD_AGGREGATION,
    variables: {
      user_uuid: currentUserUuid,
      dates: [dateStr]
    }
  };

  try {
    const results = await appState.collection.executeQueryOnNodes(queryPayload);

    if (results && results.length > 0) {
      const dailyData = results[0];
      const count = dailyData.count;
      const mood = (count > 0) ? (dailyData.aggregated_mood / count) : null; // Avoid division by zero
      displayDailyMood(mood, count);
    } else {
      displayDailyMood(null, null);
    }
  } catch (error) {
    console.error(`❌ Failed to execute or process mood aggregation query for date ${dateStr}:`, error);
    displayDailyMood(null, null); // Clear display on error
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
  const entriesLoadingSpinner = document.getElementById('entries-loading-spinner');

  // Initialize all tooltips
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.map(function (tooltipTriggerEl) {
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
      themeToggleBtn.addEventListener('click', function () {
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
    const imageInput = document.getElementById('entry-image'); // Get image input
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

    // Mood
    const moodValue = document.getElementById('entry-mood')?.value;

    // --- Image Size Check --- //
    const file = imageInput.files[0];
    const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB in bytes

    if (file && file.size > MAX_FILE_SIZE) {
      showWarningModal(`Image file too large (${(file.size / 1024 / 1024).toFixed(2)} MB). Please select an image smaller than 15 MB.`);
      imageInput.value = ''; // Clear the invalid file input
      return; // Stop the save process
    }
    // --- End Image Size Check ---

    // Save entry to nilDB
    const message_for_nildb = {
      uuid: uuid,
      date: currentSelectedDate,
      entry: entryText,
      tags: tagsArray
    };
    if (moodValue) message_for_nildb.mood = moodValue;

    // --- Image Processing --- //
    if (file) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        // Add chunks and filename to the message
        message_for_nildb.file = chunkBytes(bytes, CHUNK_SIZE); // Store the array of Uint8Array chunks
        message_for_nildb.file_name = file.name;
      } catch (error) {
        console.error('Error processing image file:', error);
        showWarningModal(`Failed to process image: ${error.message}. Memory saved without image.`);
      }
    }
    // --- End Image Processing ---

    // Show loading state
    const savingSpinner = document.getElementById('saving-entry-spinner');
    if (saveEntryBtn) saveEntryBtn.disabled = true;
    if (savingSpinner) savingSpinner.style.display = 'inline-block';

    try {
      if (!appState.collection) {
        throw new Error("Collection not initialized. Please log in.");
      }
      await appState.collection.writeToNodes([message_for_nildb]);

      // Clear the input fields
      entryTextArea.value = '';
      tagsInput.value = ''; // Clear tags input
      imageInput.value = ''; // Clear image input

      // Refresh entries display
      await fetchEntriesByDate(currentSelectedDate);

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

    // Show loading animation for entries
    if (entriesLoadingSpinner) entriesLoadingSpinner.style.display = 'inline-block'; // Show spinner

    // Fetch and display entries for the selected date
    await fetchEntriesByDate(dateStr); // Call the refactored function

    // --- Fetch and display daily mood ---
    await fetchAndDisplayDailyMood(dateStr);
    // -------------------------------------

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

      displayEntries(entries);
    } catch (error) {
      console.error('Failed to read data by date from nilDB:', error);
      showWarningModal(`Failed to fetch memories for date: ${error.message}`);
      displayEntries(null);

      // Only log out if error is authentication-related (401/403)
      if (error && (error.status === 401 || error.status === 403 || (error.message && (error.message.includes('401') || error.message.includes('403'))))) {
        sessionStorage.removeItem('blind_reflections_uuid');
        sessionStorage.removeItem('blind_reflections_auth');
        appState.collection = null;
        setTimeout(() => { location.reload(); }, 1000); // Give user a moment to see the warning
      }
    } finally {
      if (entriesLoadingSpinner) entriesLoadingSpinner.style.display = 'none';
    }
  }

  // New function to fetch entries by tag
  async function fetchEntriesByTag(tagsArray) {
    const entriesLoadingSpinner = document.getElementById('entries-loading-spinner');
    const retrievedTitleEl = document.getElementById('retrieved-entries-title');
    const tagSearchButton = document.getElementById('tag-search-button'); // Need button for logic

    // Update title based on tags and logic
    const tagsString = tagsArray.map(t => `"${t}"`).join(', ');
    const logicString = tagSearchButton ? tagSearchButton.dataset.selectedLogic : 'OR';
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
    const entries = dataReadFromNilDB
      .filter(entry => entry && typeof entry === 'object' && entry._id)
      .map(entry => ({
        id: entry._id,
        timestamp: entry._created,
        text: entry.entry,
        tags: entry.tags,
        date: entry.date,
        mood: entry.mood,
        file: entry.file,
        file_name: entry.file_name
      }));
    return entries;
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
                 <div class="text-center p-4">
                     <i class="fas fa-exclamation-triangle fs-1 mb-3 text-warning"></i>
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
                 <div class="text-center p-4">
                     <i class="fas fa-pencil fs-1 mb-3 text-secondary"></i>
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

    sortedEntries.forEach(async (entry) => {
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

      // Mood display
      let moodHtml = '';
      if (entry.mood) {
        // Use the globally defined moodEmojis map
        const moodObj = moodEmojis[entry.mood];
        if (moodObj) {
          moodHtml = `<span class="entry-mood-emoji ms-2" title="Mood: ${moodObj.label}">${moodObj.emoji}</span>`;
        }
      }

      entryCard.innerHTML = `
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start">
                        <div class="entry-meta mb-2">
                            <span class="entry-timestamp small text-muted">
                                Generated on ${formattedCreationDate} at ${formattedCreationTime} for ${formattedReflectionDate}
                            </span>
                            ${moodHtml}
                        </div>
                        <div class="d-flex gap-1">
                          <button class="btn btn-outline-secondary btn-sm entry-edit-btn" title="Edit this memory" data-entry-id="${entry.id}"><i class="fas fa-edit"></i></button>
                          <button class="btn btn-outline-danger btn-sm entry-delete-btn" title="Delete this memory" data-entry-id="${entry.id}"><i class="fas fa-trash"></i></button>
                        </div>
                    </div>
                    <div class="card-text entry-text"></div> <!-- Removed static text, will be filled by Markdown -->
                    <!-- Container for Tags -->
                    <div class="entry-tags-container mt-1"> <!-- Changed mt-2 to mt-1 -->
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

      // Parse and inject entry text as Markdown
      const entryTextContainer = entryCard.querySelector('.entry-text');
      if (entryTextContainer && entry.text) {
        // Use marked.parse() to convert Markdown to HTML
        // Ensure the output is sanitized if necessary, marked generally handles basic safety.
        // For higher security, consider a dedicated sanitizer like DOMPurify.
        entryTextContainer.innerHTML = marked.parse(entry.text);
      } else if (entryTextContainer) {
        entryTextContainer.textContent = ''; // Clear if no text
      }

      // Inject image if it exists
      if (Array.isArray(entry.file) && entry.file.length > 0 && entry.file_name) {
        // Dynamically create the container only if an image exists
        const imageContainer = document.createElement('div');
        imageContainer.className = 'entry-image-container mt-1';

        // Find the card body to append to
        const cardBody = entryCard.querySelector('.card-body');

        if (cardBody) {
          try {
            // 1. Unchunk the bytes (entry.file contains decrypted chunks)
            // Ensure chunks are Uint8Array before passing to unchunkBytes
            const chunksAsUint8Array = entry.file.map(chunk => {
              if (chunk instanceof Uint8Array) return chunk;
              // nilql might return Buffer, convert if necessary
              if (Buffer.isBuffer(chunk)) return new Uint8Array(chunk);
              // Handle unexpected types if necessary, though ideally decrypt returns consistent type
              console.warn(`[Debug] Unexpected chunk type for entry ${entry.id}, attempting conversion:`, typeof chunk);
              return new Uint8Array(chunk); // Attempt conversion
            });
            const imageBytes = unchunkBytes(chunksAsUint8Array);

            // 2. Create Blob and Object URL
            const mimeType = getMimeTypeFromFilename(entry.file_name);
            const blob = new Blob([imageBytes], { type: mimeType });
            const imageUrl = URL.createObjectURL(blob);

            // 3. Create and append image element
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            imgElement.alt = `Memory image: ${entry.file_name}`;
            imgElement.className = 'entry-image img-fluid rounded'; // Bootstrap classes
            imgElement.style.maxWidth = '100px'; // Limit size
            imgElement.style.maxHeight = '100px';
            imgElement.style.marginTop = '5px';

            imageContainer.appendChild(imgElement);

            // Append the container with the image to the card body
            cardBody.appendChild(imageContainer);

            // Optional: Revoke URL when element is removed (more complex, skip for now)
            // imgElement.onload = () => { URL.revokeObjectURL(imageUrl); };
          } catch (error) {
            console.error(`[Debug] Error processing/displaying image for entry ${entry.id}:`, error);
            const errorMsg = document.createElement('span');
            errorMsg.className = 'text-danger small';
            errorMsg.textContent = 'Error displaying image.';
            imageContainer.appendChild(errorMsg);
            // Append the container even if there's an error to show the message
            cardBody.appendChild(imageContainer);
          }
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
  document.getElementById('save-edit-entry-btn').addEventListener('click', async function () {
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
      // Find the date for this entry by fetching it
      let entryDate = null;
      const dataReadFromNilDB = await appState.collection.readFromNodes({ uuid, _id: entryIdToEdit });
      const entryData = processFetchedEntries(dataReadFromNilDB)[0];
      if (entryData) {
        entryDate = entryData.date;
      } else {
        throw new Error('Could not determine entry date.');
      }
      // Build update object
      const recordUpdate = {
        uuid: uuid,
        date: entryDate,
        entry: editText,
        tags: tagsArray
      };
      const filter = { _id: entryIdToEdit };
      // Update on all nodes
      await appState.collection.updateDataToNodes(recordUpdate, filter);
      // Refresh UI
      if (currentSelectedDate) {
        await fetchEntriesByDate(currentSelectedDate);
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

  document.getElementById('confirm-delete-btn').addEventListener('click', async function () {
    if (!entryIdToDelete) return;
    try {
      if (!appState.collection) throw new Error('Collection not initialized');
      // Call deleteDataFromNodes with filter {_id: entryIdToDelete}
      await appState.collection.deleteDataFromNodes({ _id: entryIdToDelete });
      // Refresh display
      if (currentSelectedDate) {
        await fetchEntriesByDate(currentSelectedDate);
      }
      // Refresh histogram data after deletion
      runAndLogInitialQuery();
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
    dateClick: function (info) {
      selectDate(info.dateStr);
    },
    contentHeight: 'auto', // Ensure no vertical scrolling
    height: 'auto', // Automatically adjust height to remove scrollbar
  });
  calendar.render();

  // Event Listeners
  document.getElementById('save-entry-btn').addEventListener('click', saveEntry);

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
        fetchEntriesByTag(tagsArray); // Pass array and logic
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

  // --- Reusable Speech Recognition Setup ---
  function setupSpeechRecognition(buttonId, iconId, inputId, statusId) {
    const micButton = document.getElementById(buttonId);
    const micIcon = document.getElementById(iconId);
    const inputElement = document.getElementById(inputId);
    const speechStatus = document.getElementById(statusId);
    let recognition;
    let isRecording = false;

    // Check for elements *and* API support
    if (SpeechRecognition && micButton && inputElement && speechStatus && micIcon) {
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
            console.error(`Error starting speech recognition for ${inputId}:`, error);
            showWarningModal(`Could not start dictation for ${inputElement.ariaLabel || 'input'}. Please check microphone permissions or try again.`);
            isRecording = false; // Ensure state is reset on error
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
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          const currentText = inputElement.value;
          // Add space only if needed
          const separator = (currentText.length > 0 && !/\s$/.test(currentText)) ? ' ' : '';
          inputElement.value += separator + finalTranscript.trim() + ' ';

          speechStatus.textContent = 'Added: "' + finalTranscript.trim() + '" ';
          setTimeout(() => {
            if (isRecording) speechStatus.textContent = 'Listening...';
          }, 1500);
        }
      };

      recognition.onerror = (event) => {
        console.error(`Speech recognition error for ${inputId}:`, event.error);
        let errorMessage = `An unknown error occurred during dictation for ${inputElement.ariaLabel || 'input'}.`;
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
      if (micButton) micButton.style.display = 'none'; // Hide button if API not supported or elements missing
      console.warn(`Web Speech API not supported or elements missing for ${buttonId}.`);
    }
  }

  // --- Speech Recognition Logic for Private Reflection ---
  // Setup using the reusable function
  setupSpeechRecognition('mic-button', 'mic-icon', 'private-reflection-input', 'speech-status');


  // --- Speech Recognition Logic for Daily Entry ---
  // Setup using the reusable function
  setupSpeechRecognition('entry-mic-button', 'entry-mic-icon', 'entry-text', 'entry-speech-status');

  // Add listeners for Markdown buttons
  document.querySelectorAll('.markdown-btn').forEach(button => {
    button.addEventListener('click', () => {
      const textareaId = button.dataset.textareaId;
      const format = button.dataset.format;
      wrapTextWithMarkdown(textareaId, format);
    });
  });

  // Add keydown listener for automatic list continuation
  ['entry-text', 'edit-entry-text'].forEach(textareaId => {
    const textarea = document.getElementById(textareaId);
    if (textarea) {
      textarea.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          const start = textarea.selectionStart;
          const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
          const currentLine = textarea.value.substring(lineStart, start);

          // Regex to match unordered list markers or ordered list markers
          const listMatch = currentLine.match(/^(\s*)(- |\* |\+ |\d+\. )/);

          if (listMatch) {
            event.preventDefault(); // Prevent default Enter behavior

            const indent = listMatch[1] || ''; // Capture indentation
            const marker = listMatch[2]; // Capture the marker part
            let nextMarker;

            // Check if the list item content is empty (only marker and whitespace)
            const isEmptyListItem = currentLine.trim() === marker.trim();

            if (isEmptyListItem) {
              // If Enter is pressed on an empty list item, remove the marker and indent
              textarea.value = textarea.value.substring(0, lineStart) + textarea.value.substring(start);
              textarea.selectionStart = textarea.selectionEnd = lineStart;
              return; // Stop further processing
            }

            // Determine the next marker
            const orderedMatch = marker.match(/^(\d+)\. /);
            if (orderedMatch) {
              // Ordered list: Increment number
              const nextNum = parseInt(orderedMatch[1], 10) + 1;
              nextMarker = `${indent}${nextNum}. `;
            } else {
              // Unordered list: Keep the same marker
              nextMarker = `${indent}${marker}`;
            }

            // Insert newline and the next marker
            const textToInsert = '\n' + nextMarker;
            textarea.value = textarea.value.substring(0, start) + textToInsert + textarea.value.substring(start);

            // Set cursor position after the inserted marker
            textarea.selectionStart = textarea.selectionEnd = start + textToInsert.length;
          }
        }
      });
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
  if (histogramLoadingEl) histogramLoadingEl.style.display = 'flex'; // Show loading state

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
    id: TAG_AGGREGATION,
    variables: {
      uuid: currentUserUuid
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
    if (histogramLoadingEl) histogramLoadingEl.style.display = 'none'; // Hide spinner
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
  async function initializeCollection(seed) {
    // Ensure collection is not re-initialized unnecessarily
    if (appState.collection && appState.collection.credentials.orgDid === NILDB.orgCredentials.orgDid) {
      return;
    }
    try {
      // Store the instance in appState
      appState.collection = new SecretVaultWrapper(NILDB.nodes, NILDB.orgCredentials, SCHEMA, seed);
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
        copyBtn.addEventListener('click', function () {
          navigator.clipboard.writeText(identifier) // Copy original full identifier
            .then(function () {
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
            .catch(function (err) {
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
    registerButton.addEventListener('click', async function () {
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
      await initializeCollection(password);

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
    loginButton.addEventListener('click', async function () {
      const uuidInput = document.getElementById('login-username');
      const passwordInput = document.getElementById('login-password');
      const uuid = uuidInput.value;
      const password = passwordInput.value;

      if (!uuid || !password) {
        showWarningModal('Please provide both Unique Identifier and password');
        return;
      }

      // Save the auth data
      saveAuthData(uuid, password);

      // Initialize the collection
      await initializeCollection(password);

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
    copyBtn.addEventListener('click', function () {
      // Get the current UUID text
      const uuidText = uuidSpan.textContent;

      // Check if we have a valid UUID to copy
      if (uuidText && uuidText !== 'UUID generation failed') {
        // Use the clipboard API to copy the text
        navigator.clipboard.writeText(uuidText)
          .then(function () {
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
          .catch(function (err) {
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
  const savedAuth = sessionStorage.getItem(SESSION_AUTH_KEY);
  let savedPassword = null;
  if (savedAuth) {
    try {
      const parsedAuth = JSON.parse(savedAuth);
      savedPassword = parsedAuth.password;
    } catch {
      savedPassword = null;
    }
  }
  if (savedUuid && savedPassword) {
    // Wrap in an async IIFE to use await for initialization
    (async () => {
      displayLoggedInUser(savedUuid);
      await initializeCollection(savedPassword); // Ensure collection is initialized
      // Run initial query on page load if logged in
      runAndLogInitialQuery();
    })();
  }
}

// Function to fetch available LLM models
async function fetchAndPopulateModels() {
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
    if (modelDropdownMenu) modelDropdownMenu.innerHTML = '<li><a class="dropdown-item disabled" href="#">Error loading models</a></li>';
    if (modelDisplaySpan) modelDisplaySpan.textContent = 'Error';
    if (askLlmButton) askLlmButton.dataset.selectedModel = ''; // Clear selection on error
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

// Helper function to wrap selected text in a textarea with Markdown syntax
function wrapTextWithMarkdown(textareaId, format) {
  const textarea = document.getElementById(textareaId);
  if (!textarea) {
    console.error(`[Debug Markdown] Textarea with ID '${textareaId}' not found!`);
    return;
  }

  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selectedText = textarea.value.substring(start, end);
  let markdownText = selectedText;

  switch (format) {
    case 'bold':
      markdownText = `**${selectedText}**`;
      textarea.value = textarea.value.substring(0, start) + markdownText + textarea.value.substring(end);
      // Adjust cursor position
      if (selectedText.length === 0) { textarea.selectionStart = textarea.selectionEnd = start + 2; }
      else { textarea.selectionStart = textarea.selectionEnd = start + markdownText.length; }
      break;
    case 'italic':
      markdownText = `*${selectedText}*`;
      textarea.value = textarea.value.substring(0, start) + markdownText + textarea.value.substring(end);
      if (selectedText.length === 0) { textarea.selectionStart = textarea.selectionEnd = start + 1; }
      else { textarea.selectionStart = textarea.selectionEnd = start + markdownText.length; }
      break;
    case 'strikethrough':
      markdownText = `~~${selectedText}~~`;
      textarea.value = textarea.value.substring(0, start) + markdownText + textarea.value.substring(end);
      if (selectedText.length === 0) { textarea.selectionStart = textarea.selectionEnd = start + 2; }
      else { textarea.selectionStart = textarea.selectionEnd = start + markdownText.length; }
      break;
    case 'underline': // Added case
      markdownText = `<u>${selectedText}</u>`;
      textarea.value = textarea.value.substring(0, start) + markdownText + textarea.value.substring(end);
      if (selectedText.length === 0) { textarea.selectionStart = textarea.selectionEnd = start + 3; }
      else { textarea.selectionStart = textarea.selectionEnd = start + markdownText.length; }
      break;
    case 'h1':
    case 'h2':
    case 'h3':
    case 'h4':
      const level = parseInt(format.substring(1), 10);
      const prefix = '#'.repeat(level) + ' ';
      const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
      // Insert prefix at the beginning of the line
      textarea.value = textarea.value.substring(0, lineStart) + prefix + textarea.value.substring(lineStart);
      // Adjust cursor position to be after the inserted prefix
      textarea.selectionStart = textarea.selectionEnd = lineStart + prefix.length;
      break;
    case 'unordered-list':
      {
        const listPrefix = '- ';
        const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
        textarea.value = textarea.value.substring(0, lineStart) + listPrefix + textarea.value.substring(lineStart);
        textarea.selectionStart = textarea.selectionEnd = lineStart + listPrefix.length;
      }
      break;
    case 'ordered-list':
      {
        const listPrefix = '1. ';
        const lineStart = textarea.value.lastIndexOf('\n', start - 1) + 1;
        textarea.value = textarea.value.substring(0, lineStart) + listPrefix + textarea.value.substring(lineStart);
        textarea.selectionStart = textarea.selectionEnd = lineStart + listPrefix.length;
      }
      break;
    // Add cases for other formats like lists, links, etc. if needed
  }

  textarea.focus(); // Keep focus on the textarea
}

// Single DOMContentLoaded listener to initialize both parts
document.addEventListener('DOMContentLoaded', function () {
  initializeReflectionsApp();
  initializeAuth();
  fetchAndPopulateModels(); // Fetch models when DOM is ready
});
