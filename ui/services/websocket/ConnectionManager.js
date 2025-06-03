/**
 * Manages a WebSocket connection, reconnecting if the connection is lost.
 * Handles pinging the server every 30 seconds to keep the connection alive.
 * Provides methods to send messages and disconnect from the server.
 * @property {WebSocket} socket - The underlying WebSocket object.
 * @property {number} reconnectAttempts - The number of times the connection has been
 *   attempted. Resets to 0 on successful connection.
 * @property {number} maxReconnectAttempts - The maximum number of times to attempt
 *   reconnecting before giving up.
 * @property {number} reconnectInterval - The initial delay between reconnect
 *   attempts, in milliseconds. Doubles for each subsequent attempt.
 * @property {number} pingInterval - The interval at which to send pings to the
 *   server, in milliseconds.
 * @property {{onOpen: function, onClose: function, onMessage: function, onError: function}} handlers
 *   - Callback handlers for various events.
 */
export class ConnectionManager {
    constructor() {
        this.socket = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectInterval = 1000; // 1 second
        this.pingInterval = null;
        this.handlers = {
            onOpen: () => { },
            onClose: () => { },
            onMessage: () => { },
            onError: () => { }
        };
    }

    connect(token, handlers = {}) {
        return new Promise((resolve, reject) => {
            try {
                const baseUrl = process.env.VUE_APP_WS_URL || 'ws://localhost:8080';
                const url = `${baseUrl}?token=${token}`;

                // Override default handlers with provided handlers and initialize socket
                this.handlers = { ...this.handlers, ...handlers };
                this.socket = new WebSocket(url);

                // Set up event handlers
                this.socket.onopen = (event) => {
                    this.reconnectAttempts = 0; // reset attempts
                    this.setupPing(); // start ping interval
                    this.handlers.onOpen(event); // Invoke callbacks
                    resolve(true);
                };

                this.socket.onclose = (event) => {
                    this.handleClose(event); // Invoke callbacks

                    // If not a clean close, try to reconnect
                    if (event.code !== 1000) {
                        this.reconnect();
                    }
                };

                // Handle incoming messages
                this.socket.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data); // Parse JSON
                        this.handlers.onMessage(data); // Invoke callbacks
                    } catch (error) {
                        console.error('Error parsing websocket message:', error);
                    }
                };

                this.socket.onerror = (error) => {
                    this.handlers.onError(error); // Invoke callbacks
                    reject(error);  // Reject Promise
                };
            } catch (error) {
                console.error('WebSocket connection error:', error);
                reject(error); // Reject Promise
            }
        });
    }

    reconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('Max reconnect attempts reached');
            return;
        }

        this.reconnectAttempts += 1;
        const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);

        console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        setTimeout(() => {
            if (this.socket?.token) {
                this.connect(this.socket.token, this.handlers);
            }
        }, delay);
    }

    setupPing() {
        // Clear existing ping interval if any
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
        }

        // Set up ping every 30 seconds to keep connection alive
        this.pingInterval = setInterval(() => {
            this.send({ type: 'PING' });
        }, 30000);
    }

    handleClose(event) {
        // Clear ping interval on connection close
        if (this.pingInterval) {
            clearInterval(this.pingInterval); // Clear ping interval
            this.pingInterval = null;
        }

        this.handlers.onClose(event); // Invoke callbacks
    }

    send(data) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            console.error('WebSocket is not connected');
            return false;
        }

        try {
            this.socket.send(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error sending message:', error);
            return false;
        }
    }

    disconnect() {
        if (this.socket) {
            // Clear ping interval
            if (this.pingInterval) {
                clearInterval(this.pingInterval);
                this.pingInterval = null;
            }

            // Close connection
            this.socket.close(1000, 'Client disconnected');
            this.socket = null;
        }
    }

    isConnected() {
        return this.socket && this.socket.readyState === WebSocket.OPEN;
    }
}