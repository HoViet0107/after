import { defineStore } from 'pinia';
import { MessageServices } from 'src/services/api';
import { useAuthStore } from 'src/stores/auth';
import { messageUtils } from 'src/utils/chat/messageUtils';
import { useChatNotifications } from 'src/composables/chat/useChatNotifications';

/**
 * Store for managing messages.
 *
 * The store has the following state:
 * - `messages`: an object with conversationId as key and an array of messages as value
 * - `currentConversationId`: the id of the currently selected conversation
 * - `loading`: a boolean indicating whether the store is currently loading messages
 * - `sending`: a boolean indicating whether the store is currently sending a message
 * - `error`: an error object if there was an error loading or sending messages
 * - `pendingMessages`: an array of objects with `id` and `conversationId` properties
 *   representing messages that are currently being sent
 *
 * The store has the following getters:
 * - `currentMessages`: returns the messages of the currently selected conversation
 * - `sortedCurrentMessages`: returns the messages of the currently selected conversation sorted by sendAt
 * - `pendingCount`: returns the number of pending messages
 *
 * The store has the following actions:
 * - `setCurrentConversation`: sets the currently selected conversation
 * - `loadMessages`: loads the messages of a conversation
 * - `sendMessage`: sends a message in a conversation
 * - `replaceMessage`: replaces a temporary message with a server response
 * - `markMessageAsFailed`: marks a message as failed
 * - `addMessage`: adds a message to a conversation
 * - `clearConversationMessages`: clears the messages of a conversation
 * - `clearAll`: clears all messages and resets the state
 */
export const useMessageStore = defineStore('messages', {
    state: () => ({
        messages: {},  // Indexed by conversationId for faster access
        currentConversationId: null,
        loading: false,
        sending: false,
        error: null,
        pendingMessages: []
    }),

    getters: {
        /**
         * Returns the messages of the currently selected conversation.
         * If there is no currently selected conversation, returns an empty array.
         * @returns {Array} Messages of the currently selected conversation
         */
        currentMessages: (state) => {
            return state.currentConversationId
                ? (state.messages[state.currentConversationId] || [])
                : [];
        },

        /**
         * Returns the messages of the currently selected conversation sorted by send time.
         * If there is no currently selected conversation, returns an empty array.
         * @returns {Array} Messages sorted by send time
         */
        sortedCurrentMessages: (state) => {
            const currentMessages = state.currentConversationId
                ? (state.messages[state.currentConversationId] || [])
                : [];

            return [...currentMessages].sort((a, b) => {
                const timeA = new Date(a.sentAt || a.sendAt);
                const timeB = new Date(b.sentAt || b.sendAt);
                return timeA - timeB;
            });
        },

        /**
         * Returns the number of pending messages.
         * @returns {number} Number of pending messages
         */
        pendingCount: (state) => state.pendingMessages.length
    },

    actions: {
        /**
         * Sets the currently selected conversation.
         *
         * @param {string} conversationId - The ID of the conversation to select.
         */
        setCurrentConversation(conversationId) {
            this.currentConversationId = conversationId;
        },

        /**
         * Loads the messages of a conversation.
         *
         * @param {string} conversationId - The ID of the conversation to load messages for.
         * @returns {Promise<Array>} A promise that resolves to an array of messages.
         */
        async loadMessages(conversationId) {
            this.loading = true;
            this.error = null;

            try {
                const authStore = useAuthStore();
                const response = await MessageServices.getMessages(
                    conversationId,
                    authStore.getToken()
                );

                // Process messages
                const messages = response.data.map(msg => messageUtils.processMessage(msg));

                // Store messages indexed by conversation
                this.messages[conversationId] = messages;

                return messages;
            } catch (error) {
                console.error('Failed to load messages:', error);
                this.error = error;
                return [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Sends a message in a conversation.
         *
         * @param {string} conversationId - The ID of the conversation to send the message to.
         * @param {string} content - The content of the message.
         * @param {string} type - The type of the message (default is 'TEXT').
         * @returns {Promise<Message>} A promise that resolves to the sent message.
         */
        async sendMessage(conversationId, content, type = 'TEXT') {
            this.sending = true;
            this.error = null;
            const tempId = `temp-${Date.now()}`;

            try {
                const authStore = useAuthStore();
                const { _notify } = useChatNotifications();

                // Create temporary message
                const tempMessage = messageUtils.processMessage({
                    id: tempId,
                    content,
                    senderId: authStore.user.id,
                    senderName: authStore.user.name,
                    conversationId,
                    sendAt: new Date().toISOString(),
                    type,
                    status: 'SENDING'
                });

                // Add to messages immediately for UI update
                if (!this.messages[conversationId]) {
                    this.messages[conversationId] = [];
                }
                this.messages[conversationId].push(tempMessage);

                // Add to pending messages
                this.pendingMessages.push({
                    id: tempId,
                    conversationId
                });

                // Send to server
                const formData = new FormData();
                formData.append('content', content.trim());
                formData.append('status', 'SENDING');
                formData.append('mediaType', type);

                const response = await MessageServices.sendMessage(
                    conversationId,
                    formData,
                    authStore.getToken()
                );

                const serverMessage = messageUtils.processMessage(response.data);

                // Replace temp message with server response
                this.replaceMessage(tempId, serverMessage);

                // Remove from pending
                this.pendingMessages = this.pendingMessages.filter(m => m.id !== tempId);

                return serverMessage;
            } catch (error) {
                console.error('Failed to send message:', error);
                this.error = error;

                // Mark the message as failed
                this.markMessageAsFailed(tempId);

                throw error;
            } finally {
                this.sending = false;
            }
        },

        /**
         * Replaces a temporary message with a server response.
         *
         * @param {string} tempId - The ID of the temporary message to replace.
         * @param {Message} serverMessage - The server response message to replace the temporary message with.
         */
        replaceMessage(tempId, serverMessage) {
            // Find conversation and update message
            for (const conversationId in this.messages) {
                const index = this.messages[conversationId].findIndex(m => m.id === tempId);
                if (index !== -1) {
                    this.messages[conversationId][index] = serverMessage;
                    return;
                }
            }
        },

        /**
         * Marks a message as failed.
         *
         * @param {string} messageId - The ID of the message to mark as failed.
         */
        markMessageAsFailed(messageId) {
            // Find conversation and mark message as failed
            for (const conversationId in this.messages) {
                const index = this.messages[conversationId].findIndex(m => m.id === messageId);
                if (index !== -1) {
                    this.messages[conversationId][index] = {
                        ...this.messages[conversationId][index],
                        status: 'FAILED'
                    };
                    return;
                }
            }
        },

        /**
         * Adds a message to a conversation.
         *
         * @param {Message} message - The message to add.
         */
        addMessage(message) {
            const conversationId = message.conversationId;
            if (!conversationId) return;

            // Initialize conversation messages array if needed
            if (!this.messages[conversationId]) {
                this.messages[conversationId] = [];
            }

            // Check if message already exists
            const index = this.messages[conversationId].findIndex(m => m.id === message.id);

            // Update or add
            if (index !== -1) {
                this.messages[conversationId][index] = {
                    ...this.messages[conversationId][index],
                    ...message
                };
            } else {
                this.messages[conversationId].push(message);
            }
        },

        /**
         * Clears the messages of a conversation.
         *
         * @param {string} conversationId - The ID of the conversation to clear messages for.
         */
        clearConversationMessages(conversationId) {
            if (this.messages[conversationId]) {
                this.messages[conversationId] = [];
            }
        },

        /**
         * Clears all messages and resets the state.
         */
        clearAll() {
            this.messages = {};
            this.currentConversationId = null;
            this.loading = false;
            this.sending = false;
            this.error = null;
            this.pendingMessages = [];
        }
    }
});