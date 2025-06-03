export const conversationUtils = {
    /**
     * Update the last message of a conversation.
     * @param {Object} conversation - Conversation object
     * @param {Object} message - Message object
     * @returns {Object} Updated conversation object
     */
    updateLastMessage(conversation, message) {
        if (!conversation || !message) return conversation;

        return {
            ...conversation,
            lastMessage: message,
            lastMessageAt: message.sendAt || new Date().toISOString()
        };
    },

    /**
     * Get the default avatar for a conversation.
     * @param {Object} conversation - Conversation object
     * @returns {string} Default avatar URL
     */
    getDefaultAvatar(conversation, currentUserId) {
        if (!conversation) return '';

        // If group, return group avatar
        if (conversation.isGroup) {
            return `${conversation.avatarUrl || 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.flaticon.com%2Ffree-icon%2Fgroup_718339&psig=AOvVaw3zns5f00ubpgc9FM_FKVo4&ust=1748873673467000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCKDP5KG00I0DFQAAAAAdAAAAABAE'}`;
        }

        // If 1-1, return avatar of the other participant
        const otherParticipant = conversation.participants?.find(p => p.id !== currentUserId);
        return otherParticipant?.avatarUrl || 'https://www.google.com/url?sa=i&url=https%3A%2F%2Fwww.freepik.com%2Fpremium-vector%2Fperson-icon_65665745.htm&psig=AOvVaw1EoKvKcXsvE60Fd_4tj063&ust=1748873750435000&source=images&cd=vfe&opi=89978449&ved=0CBQQjRxqFwoTCNigtsa00I0DFQAAAAAdAAAAABAU';
    },

    /**
     * Check if the current user can leave a conversation.
     * @param {Object} conversation - Conversation object
     * @param {string} userId - User ID
     * @returns {boolean} Whether the user can leave the conversation
     */
    canLeaveConversation(conversation, userId) {
        if (!conversation) return false;

        // Can't leave 1-1 conversation
        if (!conversation.isGroup) return false;

        // Check if the user is a participant
        return conversation.participants?.some(p => p.id === userId) || false;
    },

    /**
     * Format the participant count for display.
     * @param {number} count - Number of participants
     * @returns {string} Formatted participant count
     */
    formatParticipantCount(count) {
        if (!count || count <= 0) return '';
        return count === 1 ? '1 participant' : `${count} participants`;
    },

    /**
     * Get the conversation name for display.
     * @param {Object} conversation - Conversation object
     * @param {string} currentUserId - Current user ID
     * @returns {string} Conversation name
     */
    getConversationName(conversation, currentUserId) {
        if (!conversation) return 'Unknown';

        if (conversation.name) return conversation.name;

        // For 1-1 conversation, display the other user's name
        if (!conversation.isGroup) {
            const otherUser = conversation.participants?.find(p => p.id !== currentUserId);
            return otherUser?.name || 'Unknown User';
        }

        // Fallback for group without name
        return `Group (${conversation.participants?.length || 0} members)`;
    },

    /**
     * Get the unread count for a conversation.
     * @param {Object} conversation - Conversation object
     * @returns {number} Unread count
     */
    getUnreadCount(conversation) {
        return conversation?.unreadCount || 0;
    },

    /**
     * Sort conversations by last activity.
     * @param {Array} conversations - Array of conversation objects
     * @returns {Array} Sorted conversations
     */
    sortByLastActivity(conversations) {
        return [...conversations].sort((a, b) => {
            const timeA = new Date(a.lastMessageAt || a.createdAt || 0).getTime();
            const timeB = new Date(b.lastMessageAt || b.createdAt || 0).getTime();
            return timeB - timeA;
        });
    }
};