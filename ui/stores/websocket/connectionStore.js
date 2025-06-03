import { defineStore } from 'pinia';
import { WebSocketManager } from 'src/services/websocket/WebSocketManager';
import { useAuthStore } from 'src/stores/auth';

/**
 * useWebSocketStore
 * 
 * Provides a store for managing a WebSocket connection, including connection
 * state, error handling, and message/event handling capabilities.
 * 
 * State:
 *   - `isConnected`: Indicates if the WebSocket is currently connected.
 *   - `error`: Stores the last error encountered during connection attempts.
 *   - `lastConnectionAttempt`: Timestamp of the last connection attempt.
 *   - `reconnectAttempts`: Number of reconnection attempts made.
 *   - `wsManager`: Instance of WebSocketManager responsible for handling connections.
 * 
 * Actions:
 *   - `initializeManager`: Initializes the WebSocketManager if not already initialized.
 *   - `connect`: Attempts to connect to the WebSocket server using an authentication token.
 *   - `disconnect`: Disconnects the WebSocket connection.
 *   - `setupEventListeners`: Sets up event listeners for connection, disconnection, and error events.
 *   - `registerHandler`: Registers a message handler for a specific message type.
 *   - `send`: Sends a message to the WebSocket server.
 *   - `joinConversation`: Joins a specific conversation on the server.
 *   - `leaveConversation`: Leaves a specific conversation on the server.
 */
export const useWebSocketStore = defineStore('webSocket', {
    state: () => ({
        isConnected: false,
        error: null,
        lastConnectionAttempt: null,
        reconnectAttempts: 0,
        wsManager: null
    }),

    actions: {
        /**
         * Initializes the WebSocketManager if not already initialized.
         */
        initializeManager() {
            if (!this.wsManager) {
                this.wsManager = new WebSocketManager();
            }
        },

        /**
         * Attempts to connect to the WebSocket server using an authentication token.
         *
         * @returns {Promise<boolean>} A promise that resolves to true if the connection is successful, false otherwise.
         */
        async connect() {
            this.initializeManager();

            try {
                const authStore = useAuthStore();
                const token = authStore.getToken();

                if (!token) {
                    throw new Error('Authentication token not available');
                }

                this.lastConnectionAttempt = new Date();
                await this.wsManager.connect(token);

                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.error = null;

                this.setupEventListeners();

                return true;
            } catch (error) {
                console.error('WebSocket connection failed:', error);
                this.isConnected = false;
                this.error = error;
                this.reconnectAttempts += 1;

                return false;
            }
        },

        /**
         * Disconnects the WebSocket connection.
         */
        disconnect() {
            if (this.wsManager) {
                this.wsManager.disconnect();
                this.isConnected = false;
            }
        },

        /**
         * Sets up event listeners for connection, disconnection, and error events.
         */
        setupEventListeners() {
            // Connected event
            this.wsManager.addEventListener('connected', () => {
                this.isConnected = true;
                this.error = null;
            });

            // Disconnected event
            this.wsManager.addEventListener('disconnected', () => {
                this.isConnected = false;
            });

            // Error event
            this.wsManager.addEventListener('error', (error) => {
                this.error = error;
            });
        },

        /**
         * Registers a message handler for a specific message type.
         *
         * @param {string} type - The type of message to register a handler for.
         * @param {Function} callback - The callback function to be called when a message of the specified type is received.
         */
        registerHandler(type, callback) {
            if (!this.wsManager) {
                this.initializeManager();
            }

            this.wsManager.registerHandler(type, callback);
        },

        /**
         * Sends a message to the WebSocket server.
         *
         * @param {Object} data - The message data to send.
         * @returns {boolean} True if the message was sent successfully, false otherwise.
         */
        send(data) {
            if (!this.wsManager || !this.isConnected) {
                console.error('WebSocket is not connected');
                return false;
            }

            return this.wsManager.send(data);
        },

        /**
         * Joins a specific conversation on the WebSocket server.
         *
         * @param {string} conversationId - The ID of the conversation to join.
         * @returns {boolean} True if the conversation was joined successfully, false otherwise.
         */
        joinConversation(conversationId) {
            if (!this.wsManager || !this.isConnected) {
                console.error('WebSocket is not connected');
                return false;
            }

            return this.wsManager.joinConversation(conversationId);
        },

        /**
         * Leaves a specific conversation on the WebSocket server.
         *
         * @param {string} conversationId - The ID of the conversation to leave.
         * @returns {boolean} True if the conversation was left successfully, false otherwise.
         */
        leaveConversation(conversationId) {
            if (!this.wsManager || !this.isConnected) {
                console.error('WebSocket is not connected');
                return false;
            }

            return this.wsManager.leaveConversation(conversationId);
        }
    }
});