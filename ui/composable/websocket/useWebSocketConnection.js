import { ref, onUnmounted } from 'vue';
import { WebSocketManager } from 'src/services/websocket/WebSocketManager';

/**
 * Provides a WebSocket connection to the server and handles all
 * WebSocket-related events and operations, such as connecting,
 * disconnecting, sending messages, joining and leaving conversations,
 * and editing and deleting messages.
 *
 * @param {string} token - The authentication token to use for the WebSocket connection.
 *
 * @returns An object with the following properties:
 *
 *   - `wsManager`: The underlying WebSocketManager object.
 *   - `isConnected`: A boolean ref indicating whether the WebSocket connection is currently connected.
 *   - `connectionError`: A string ref indicating the last error that occurred while attempting to connect to the WebSocket server.
 *   - `connect`: A function that attempts to connect to the WebSocket server. Returns a promise that resolves to `true` if the connection is successful, or `false` if the connection fails.
 *   - `disconnect`: A function that disconnects the WebSocket connection.
 *   - `send`: A function that sends a message to the WebSocket server.
 *   - `joinConversation`: A function that joins a conversation.
 *   - `leaveConversation`: A function that leaves a conversation.
 *   - `sendMessage`: A function that sends a message to a conversation.
 *   - `editMessage`: A function that edits a message.
 *   - `deleteMessage`: A function that deletes a message.
 *   - `markAsRead`: A function that marks a message as read.
 *   - `addEventListener`: A function that adds an event listener to the WebSocketManager.
 */
export function useWebSocketConnection(token) {
    const wsManager = ref(new WebSocketManager());
    const isConnected = ref(false);
    const connectionError = ref(null);
    const cleanupFunctions = [];

    const connect = async () => {
        try {
            connectionError.value = null;
            await wsManager.value.connect(token);
            isConnected.value = true;

            // Set up event listeners
            const connectedUnsubscribe = wsManager.value.addEventListener('connected', () => {
                isConnected.value = true;
                connectionError.value = null;
            });

            const disconnectedUnsubscribe = wsManager.value.addEventListener('disconnected', () => {
                isConnected.value = false;
            });

            const errorUnsubscribe = wsManager.value.addEventListener('error', (error) => {
                connectionError.value = error;
            });

            // Store cleanup functions
            cleanupFunctions.push(connectedUnsubscribe, disconnectedUnsubscribe, errorUnsubscribe);

            return true;
        } catch (error) {
            connectionError.value = error;
            isConnected.value = false;
            return false;
        }
    };

    const disconnect = () => {
        // Remove all event listeners
        cleanupFunctions.forEach(cleanup => cleanup());

        // Disconnect WebSocket
        wsManager.value.disconnect();
        isConnected.value = false;
    };

    const send = (data) => {
        if (!isConnected.value) {
            console.error('WebSocket is not connected');
            return false;
        }

        return wsManager.value.send(data);
    };

    const joinConversation = (conversationId) => {
        return wsManager.value.joinConversation(conversationId);
    };

    const leaveConversation = (conversationId) => {
        return wsManager.value.leaveConversation(conversationId);
    };

    const sendMessage = (conversationId, content, type = 'TEXT') => {
        return wsManager.value.sendMessage(conversationId, content, type);
    };

    const editMessage = (messageId, content) => {
        return wsManager.value.editMessage(messageId, content);
    };

    const deleteMessage = (messageId) => {
        return wsManager.value.deleteMessage(messageId);
    };

    const markAsRead = (conversationId, messageId) => {
        return wsManager.value.markAsRead(conversationId, messageId);
    };

    const addEventListener = (eventName, callback) => {
        const unsubscribe = wsManager.value.addEventListener(eventName, callback);
        cleanupFunctions.push(unsubscribe);
        return unsubscribe;
    };

    // Clean up on component unmount
    onUnmounted(() => {
        disconnect();
    });

    return {
        wsManager,
        isConnected,
        connectionError,
        connect,
        disconnect,
        send,
        joinConversation,
        leaveConversation,
        sendMessage,
        editMessage,
        deleteMessage,
        markAsRead,
        addEventListener
    };
}