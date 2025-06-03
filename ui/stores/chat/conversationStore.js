import { defineStore } from 'pinia';
import { ConversationServices } from '@/services/api';
import { useAuthStore } from '@/stores/auth';
import { conversationUtils } from '@/utils/chat/conversationUtils';

    /**
     * Conversation store for managing conversations.
     *
     * The store has the following state:
     * - `conversations`: an array of conversation objects
     * - `selectedConversationId`: the id of the currently selected conversation
     * - `loading`: a boolean indicating whether the store is currently loading conversations
     * - `error`: an error object if there was an error loading conversations
     * - `typingUsers`: an object with conversationId as key and an array of typing user objects as value
     *   where each typing user object has `id` and `name` properties
     *
     * The store has the following getters:
     * - `selectedConversation`: returns the conversation object with the currently selected id
     * - `sortedConversations`: returns the conversations array sorted by last activity
     * - `unreadCount`: returns the total unread count of all conversations
     * - `typingUsersList`: returns the array of typing users for the given conversationId
     *
     * The store has the following actions:
     * - `setSelectedConversation`: sets the currently selected conversation
     * - `loadConversations`: loads all conversations
     * - `loadConversation`: loads a single conversation
     * - `updateConversation`: updates a conversation in the store
     * - `updateConversationWithMessage`: updates a conversation based on a message
     * - `removeConversation`: removes a conversation from the store
     * - `setTypingUser`: adds a typing user to the store
     * - `removeTypingUser`: removes a typing user from the store
     * - `markAsRead`: marks a conversation as read
     * - `incrementUnreadCount`: increments the unread count of a conversation
     * - `clearAll`: clears all conversations, selected conversation, and typing users
     */
export const useConversationStore = defineStore('conversations', {
    state: () => ({
        conversations: [],
        selectedConversationId: null,
        loading: false,
        error: null,
        typingUsers: {} // Indexed by conversationId
    }),

    getters: {
        /**
         * Returns the conversation object with the currently selected id.
         * If there is no currently selected conversation, returns null.
         * @returns {Object|null} Conversation object with the currently selected id
         */
        selectedConversation: (state) => {
            return state.conversations.find(c => c.id === state.selectedConversationId);
        },

        /**
         * Returns the conversations array sorted by last activity.
         * @returns {Array} Conversations array sorted by last activity
         */
        sortedConversations: (state) => {
            return conversationUtils.sortByLastActivity(state.conversations);
        },

        /**
         * Returns the total unread count of all conversations.
         * @returns {number} Total unread count of all conversations
         */
        unreadCount: (state) => {
            return state.conversations.reduce((count, conv) => {
                return count + (conv.unreadCount || 0);
            }, 0);
        },

        /**
         * Returns the array of typing users for the given conversationId.
         * If there are no typing users for the given conversationId, returns an empty array.
         * @param {string} conversationId - The id of the conversation to get typing users for.
         * @returns {Array} Array of typing users for the given conversationId
         */
        typingUsersList: (state) => (conversationId) => {
            return state.typingUsers[conversationId] || [];
        }
    },

    actions: {
        /**
         * Sets the currently selected conversation.
         *
         * @param {string} conversationId - The ID of the conversation to select.
         */
        setSelectedConversation(conversationId) {
            this.selectedConversationId = conversationId;
        },

        /**
         * Loads all conversations.
         *
         * @returns {Promise<Array>} A promise that resolves to an array of conversation objects.
         */
        async loadConversations() {
            this.loading = true;
            this.error = null;

            try {
                const authStore = useAuthStore();
                const response = await ConversationServices.getConversations(authStore.getToken());

                this.conversations = response.data;
                return response.data;
            } catch (error) {
                console.error('Failed to load conversations:', error);
                this.error = error;
                return [];
            } finally {
                this.loading = false;
            }
        },

        /**
         * Loads a single conversation.
         *
         * @param {string} conversationId - The ID of the conversation to load.
         * @returns {Promise<Object>} A promise that resolves to the conversation object.
         */
        async loadConversation(conversationId) {
            try {
                const authStore = useAuthStore();
                const response = await ConversationServices.getConversation(
                    conversationId,
                    authStore.getToken()
                );

                // Update or add conversation
                this.updateConversation(conversationId, response.data);

                return response.data;
            } catch (error) {
                console.error(`Failed to load conversation ${conversationId}:`, error);
                throw error;
            }
        },

        /**
         * Updates a conversation in the store.
         *
         * @param {string} conversationId - The ID of the conversation to update.
         * @param {Object} updates - The updates to apply to the conversation.
         */
        updateConversation(conversationId, updates) {
            const index = this.conversations.findIndex(c => c.id === conversationId);

            if (index !== -1) {
                this.conversations[index] = { ...this.conversations[index], ...updates };
            } else if (updates && updates.id) {
                // If conversation doesn't exist but we have full data, add it
                this.conversations.push(updates);
            }
        },

        /**
         * Updates a conversation based on a message.
         *
         * @param {string} conversationId - The ID of the conversation to update.
         * @param {Object} message - The message to update the conversation with.
         */
        updateConversationWithMessage(conversationId, message) {
            const conversation = this.conversations.find(c => c.id === conversationId);

            if (conversation) {
                const updatedConversation = conversationUtils.updateLastMessage(conversation, message);

                this.updateConversation(conversationId, updatedConversation);
            }
        },

        /**
         * Removes a conversation from the store.
         *
         * @param {string} conversationId - The ID of the conversation to remove.
         */
        removeConversation(conversationId) {
            this.conversations = this.conversations.filter(c => c.id !== conversationId);

            // If this was the selected conversation, clear selection
            if (this.selectedConversationId === conversationId) {
                this.selectedConversationId = null;
            }
        },

        /**
         * Adds a typing user to the store.
         *
         * @param {string} conversationId - The ID of the conversation to add the typing user to.
         * @param {string} userId - The ID of the user who is typing.
         * @param {string} userName - The name of the user who is typing.
         */
        setTypingUser(conversationId, userId, userName) {
            if (!conversationId || !userId) return;

            if (!this.typingUsers[conversationId]) {
                this.typingUsers[conversationId] = [];
            }

            // Don't add duplicates
            if (!this.typingUsers[conversationId].some(u => u.id === userId)) {
                this.typingUsers[conversationId].push({ id: userId, name: userName });
            }
        },

        /**
         * Removes a typing user from the store.
         *
         * @param {string} conversationId - The ID of the conversation to remove the typing user from.
         * @param {string} userId - The ID of the user who is typing.
         */
        removeTypingUser(conversationId, userId) {
            if (!conversationId || !userId || !this.typingUsers[conversationId]) return;

            this.typingUsers[conversationId] = this.typingUsers[conversationId]
                .filter(u => u.id !== userId);
        },

        /**
         * Marks a conversation as read.
         *
         * @param {string} conversationId - The ID of the conversation to mark as read.
         */
        markAsRead(conversationId) {
            const conversation = this.conversations.find(c => c.id === conversationId);

            if (conversation) {
                this.updateConversation(conversationId, { unreadCount: 0 });
            }
        },

        /**
         * Increments the unread count of a conversation.
         *
         * @param {string} conversationId - The ID of the conversation to increment the unread count for.
         */
        incrementUnreadCount(conversationId) {
            const conversation = this.conversations.find(c => c.id === conversationId);

            if (conversation && conversationId !== this.selectedConversationId) {
                this.updateConversation(conversationId, {
                    unreadCount: (conversation.unreadCount || 0) + 1
                });
            }
        },

        /**
         * Clears all conversations and typing users.
         */
        clearAll() {
            this.conversations = [];
            this.selectedConversationId = null;
            this.loading = false;
            this.error = null;
            this.typingUsers = {};
        }
    }
});