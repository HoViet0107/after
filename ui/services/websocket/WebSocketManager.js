import { ConnectionManager } from './ConnectionManager.js';
import { MessageHandler } from './MessageHandler.js';
import { EventBroadcaster } from './EventBroadcaster.js';

/**
 * WebSocketManager
 * 
 * Manages a WebSocket connection to the server, emits events when messages are received
 * and provides methods to send messages and disconnect from the server.
 * @property {ConnectionManager} connection - The underlying ConnectionManager object.
 * @property {MessageHandler} messageHandler - The underlying MessageHandler object.
 * @property {EventBroadcaster} eventBroadcaster - The underlying EventBroadcaster object.
 * @property {Map<string, Array<function>>} handlers - Registered message handlers
 */
export class WebSocketManager {
    /**
     * Creates a new WebSocketManager instance.
     * @constructor
     */
    constructor() {
        this.connection = new ConnectionManager();
        this.messageHandler = new MessageHandler();
        this.eventBroadcaster = new EventBroadcaster();
        this.handlers = new Map();
    }

    /**
     * Connects to the WebSocket server.
     * @param {string} token - The authentication token.
     * @returns {Promise<boolean>} A promise that resolves to true if the connection is successful.
     */
    async connect(token) {
        return this.connection.connect(token, {
            onOpen: () => this.eventBroadcaster.emit('connected'),
            onClose: () => this.eventBroadcaster.emit('disconnected'),
            onMessage: (data) => this.handleMessage(data),
            onError: (error) => this.eventBroadcaster.emit('error', error)
        });
    }

    /**
     * Disconnects from the WebSocket server.
     */
    disconnect() {
        this.connection.disconnect();
    }

    /**
     * Registers a message handler for a specific message type.
     * @param {string} type - The message type.
     * @param {function} callback - The callback function to be called when a message of the specified type is received.
     */
    registerHandler(type, callback) {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, []);
        }
        this.handlers.get(type).push(callback);
    }

    /**
     * Handles a message received from the WebSocket server.
     * @param {Object} data - The message data.
     */
    handleMessage(data) {
        // Use unified message handler
        this.messageHandler.handle(data, this.handlers);
    }

    /**
     * Sends a message to the WebSocket server.
     * @param {Object} data - The message data.
     * @returns {Promise<boolean>} A promise that resolves to true if the message is sent successfully.
     */
    send(data) {
        return this.connection.send(data);
    }

    /**
     * Joins a conversation.
     * @param {string} conversationId - The ID of the conversation to join.
     * @returns {Promise<boolean>} A promise that resolves to true if the conversation is joined successfully.
     */
    joinConversation(conversationId) {
        return this.send({
            type: 'JOIN_CONVERSATION',
            conversationId
        });
    }

    /**
     * Leaves a conversation.
     * @param {string} conversationId - The ID of the conversation to leave.
     * @returns {Promise<boolean>} A promise that resolves to true if the conversation is left successfully.
     */
    leaveConversation(conversationId) {
        return this.send({
            type: 'LEAVE_CONVERSATION',
            conversationId
        });
    }

    /**
     * Sends a message to a conversation.
     * @param {string} conversationId - The ID of the conversation to send the message to.
     * @param {string} content - The content of the message.
     * @param {string} type - The type of the message (default is 'TEXT').
     * @returns {Promise<boolean>} A promise that resolves to true if the message is sent successfully.
     */
    sendMessage(conversationId, content, type = 'TEXT') {
        return this.send({
            type: 'SEND_MESSAGE',
            conversationId,
            content,
            messageType: type,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Edits a message.
     * @param {string} messageId - The ID of the message to edit.
     * @param {string} content - The new content of the message.
     * @returns {Promise<boolean>} A promise that resolves to true if the message is edited successfully.
     */
    editMessage(messageId, content) {
        return this.send({
            type: 'EDIT_MESSAGE',
            messageId,
            content,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Deletes a message.
     * @param {string} messageId - The ID of the message to delete.
     * @returns {Promise<boolean>} A promise that resolves to true if the message is deleted successfully.
     */
    deleteMessage(messageId) {
        return this.send({
            type: 'DELETE_MESSAGE',
            messageId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Marks a message as read.
     * @param {string} conversationId - The ID of the conversation.
     * @param {string} messageId - The ID of the message to mark as read.
     * @returns {Promise<boolean>} A promise that resolves to true if the message is marked as read successfully.
     */
    markAsRead(conversationId, messageId) {
        return this.send({
            type: 'MARK_AS_READ',
            conversationId,
            messageId
        });
    }

    /**
     * Adds an event listener.
     * @param {string} eventName - The name of the event to listen to.
     * @param {function} callback - The callback function to be called when the event is emitted.
     * @returns {Function} An unsubscribe function to remove the listener.
     */
    addEventListener(eventName, callback) {
        return this.eventBroadcaster.on(eventName, callback);
    }

    /**
     * Removes an event listener.
     * @param {string} eventName - The name of the event to listen to.
     * @param {function} callback - The callback function to be called when the event is emitted.
     */
    removeEventListener(eventName, callback) {
        return this.eventBroadcaster.off(eventName, callback);
    }
}