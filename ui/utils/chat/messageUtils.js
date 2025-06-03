export const messageUtils = {
    // Extracted from MessageList.vue + ChatsPage.vue + WebSocketService.js
    isSystemMessage(message) {
        return (
            message.isSystem === true ||
            message.senderName === 'System' ||
            message.type === 'DELIVERED' ||
            message.senderId === null ||
            this.isSystemMessageContent(message.content)
        );
    },

    /**
     * Check if the message content is a system message.
     * @param {string} content - Message content
     * @returns {boolean} True if the content is a system message
     */
    isSystemMessageContent(content) {
        if (!content) return false;

        // System messages patterns
        const systemPatterns = [
            /left the group!?$/i,
            /created the group!?$/i,
            /added .+ to the group!?$/i,
            /removed .+ from the group!?$/i,
            /changed the conversation/i,
            /Group has been deleted/i,
            /joined the group!?$/i,
            /became admin/i,
            /is no longer admin/i
        ];

        return systemPatterns.some(pattern => pattern.test(content.trim()));
    },

    /**
     * Get the icon for a system message.
     * @param {Object} message - Message object
     * @returns {string} Icon name
     */
    getSystemMessageIcon(message) {
        const content = message.content?.toLowerCase() || '';

        if (content.includes('left') || content.includes('removed')) {
            return 'person_remove';
        } else if (content.includes('added') || content.includes('joined')) {
            return 'person_add';
        } else if (content.includes('created')) {
            return 'group_add';
        } else if (content.includes('deleted')) {
            return 'delete';
        } else if (content.includes('changed') || content.includes('updated')) {
            return 'edit';
        } else if (content.includes('admin')) {
            return 'admin_panel_settings';
        } else {
            return 'info';
        }
    },

    /**
     * Process a raw message into a formatted message object.
     * @param {Object} rawMessage - Raw message object
     * @param {string} [conversationId=null] - Conversation ID
     * @returns {Object} Processed message object
     */
    processMessage(rawMessage, conversationId = null) {
        return {
            id: rawMessage.id || rawMessage.messageId || `temp-${Date.now()}-${Math.random()}`,
            content: rawMessage.content || '',
            sendAt: rawMessage.sentAt || rawMessage.sendAt || rawMessage.createdAt || new Date().toISOString(),
            senderId: rawMessage.senderId || rawMessage.sender?.id,
            senderName: rawMessage.senderName || rawMessage.sender?.name || 'Unknown',
            conversationId: conversationId || rawMessage.conversationId,
            isSystem: this.isSystemMessage(rawMessage),
            type: rawMessage.type || 'TEXT',
            edited: rawMessage.edited || false,
            editedAt: rawMessage.editedAt || null
        };
    },

    /**
     * Extract the username from a leave message.
     * @param {string} message - Leave message content
     * @returns {string} Extracted username or 'Someone' if not found
     */
    extractUserNameFromLeaveMessage(message) {
        const match = message.match(/^(.+)\s+left\s+the\s+group!?$/i);
        return match ? match[1].trim() : 'Someone';
    },

    /**
     * Get the avatar URL for a user.
     * @param {string} id - User id
     * @returns {string} Avatar URL
     */
    getAvatarUrl(id) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(id || 'User')}&background=random`;
    },

    /**
     * Get the status icon for a message.
     * @param {string} status - Message status
     * @returns {string} Icon name
     */
    getStatusIcon(status) {
        switch (status) {
            case 'SENDING': return 'schedule';
            case 'SENT': return 'done';
            case 'DELIVERED': return 'done_all';
            case 'READ': return 'done_all';
            default: return 'error';
        }
    }
};