import { ref, computed } from 'vue';
import { conversationUtils } from 'src/utils/chat/conversationUtils';

/**
 * useChatState composable provides reactive state management for chat functionality.
 *
 * State:
 * - `conversations`: List of all chat conversations.
 * - `selectedConversationId`: ID of the currently selected conversation.
 * - `messages`: List of messages in the current conversation.
 * - `loading`: Object tracking loading states for conversations and messages.
 *
 * Computed:
 * - `selectedConversation`: Currently selected conversation object.
 * - `unreadCount`: Total count of unread messages across all conversations.
 * - `sortedMessages`: Messages sorted by send time.
 * - `sortedConversations`: Conversations sorted by last activity.
 *
 * Actions:
 * - `setSelectedConversation`: Sets the current conversation by ID.
 * - `addMessage`: Adds or updates a message in the current conversation.
 * - `updateConversation`: Updates conversation details by ID.
 * - `removeConversation`: Removes a conversation by ID.
 * - `updateConversationWithMessage`: Updates conversation's last message.
 * - `setLoading`: Sets loading state for conversations or messages.
 * - `clearMessages`: Clears all messages in the current conversation.
 */
export function useChatState() {
    // State
    const conversations = ref([]);
    const selectedConversationId = ref(null);
    const messages = ref([]);
    const loading = ref({
        conversations: false,
        messages: false
    });

    // Computed
    /**
     * The currently selected conversation.
     *
     * @type {Object}
     */
    const selectedConversation = computed(() => {
        return conversations.value.find(c => c.id === selectedConversationId.value);
    });

    /**
     * The total count of unread messages across all conversations.
     *
     * @type {number}
     */
    const unreadCount = computed(() => {
        return conversations.value.reduce((count, conv) => {
            return count + (conv.unreadCount || 0);
        }, 0);
    });

    /**
     * Messages sorted by send time.
     *
     * @type {Array<Object>}
     */
    const sortedMessages = computed(() => {
        return [...messages.value].sort((a, b) => {
            const timeA = new Date(a.sentAt || a.sendAt);
            const timeB = new Date(b.sentAt || b.sendAt);
            return timeA - timeB;
        });
    });

    /**
     * Conversations sorted by last activity.
     *
     * @type {Array<Object>}
     */
    const sortedConversations = computed(() => {
        return conversationUtils.sortByLastActivity(conversations.value);
    });

    // Actions
    /**
     * Sets the currently selected conversation.
     *
     * @param {string} conversationId - The ID of the conversation to select.
     */
    const setSelectedConversation = (conversationId) => {
        selectedConversationId.value = conversationId;
    };

    /**
     * Adds or updates a message in the current conversation.
     *
     * @param {Object} message - The message to add or update.
     */
    const addMessage = (message) => {
        const existingIndex = messages.value.findIndex(m => m.id === message.id);
        if (existingIndex === -1) {
            messages.value.push(message);
        } else {
            messages.value[existingIndex] = { ...messages.value[existingIndex], ...message };
        }
    };

    /**
     * Updates a conversation's details by ID.
     *
     * @param {string} conversationId - The ID of the conversation to update.
     * @param {Object} updates - The updates to apply to the conversation.
     */
    const updateConversation = (conversationId, updates) => {
        const index = conversations.value.findIndex(c => c.id === conversationId);
        if (index !== -1) {
            conversations.value[index] = { ...conversations.value[index], ...updates };
        }
    };

    /**
     * Removes a conversation by ID.
     *
     * @param {string} conversationId - The ID of the conversation to remove.
     */
    const removeConversation = (conversationId) => {
        conversations.value = conversations.value.filter(c => c.id !== conversationId);
    };

    /**
     * Updates a conversation's last message.
     *
     * @param {string} conversationId - The ID of the conversation to update.
     * @param {Object} message - The message to set as the last message.
     */
    const updateConversationWithMessage = (conversationId, message) => {
        const conversation = conversations.value.find(c => c.id === conversationId);
        if (conversation) {
            const updatedConversation = conversationUtils.updateLastMessage(conversation, message);
            updateConversation(conversationId, updatedConversation);
        }
    };

    /**
     * Sets the loading state for conversations or messages.
     *
     * @param {string} type - The type of loading state to set ('conversations' or 'messages').
     * @param {boolean} isLoading - The loading state to set.
     */
    const setLoading = (type, isLoading) => {
        loading.value = { ...loading.value, [type]: isLoading };
    };

    /**
     * Clears all messages in the current conversation.
     */
    const clearMessages = () => {
        messages.value = [];
    };

    return {
        // State
        conversations,
        selectedConversationId,
        messages,
        loading,

        // Computed
        selectedConversation,
        unreadCount,
        sortedMessages,
        sortedConversations,

        // Actions
        setSelectedConversation,
        addMessage,
        updateConversation,
        removeConversation,
        updateConversationWithMessage,
        setLoading,
        clearMessages
    };
}