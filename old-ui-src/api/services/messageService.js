import apiClient from '@/api/client'
import { ENDPOINTS, PAGINATION } from '@/api/endpoints'

/**
 * Message API Service
 * Handles all message-related API calls
 */
export const messageService = {
    /**
     * Fetch messages for a conversation
     * @param {string} conversationId - The conversation ID
     * @param {object} params - Query parameters
     * @returns {Promise<object>} API response
     */
    async getMessages(conversationId, params = {}) {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            size = PAGINATION.DEFAULT_SIZE,
            sort = 'createdAt,desc'
        } = params

        return await apiClient.get(
            ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId),
            {
                params: { page, size, sort }
            }
        )
    },

    /**
     * Send a new message
     * @param {string} conversationId - The conversation ID
     * @param {object} messageData - Message data
     * @returns {Promise<object>} API response
     */
    async sendMessage(conversationId, messageData) {
        const payload = {
            content: messageData.content,
            type: messageData.type || 'text',
            replyToId: messageData.replyToId,
            attachments: messageData.attachments || []
        }

        return await apiClient.post(
            ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId),
            payload
        )
    },

    /**
     * Edit an existing message
     * @param {string} messageId - The message ID
     * @param {string} content - New message content
     * @returns {Promise<object>} API response
     */
    async editMessage(messageId, content) {
        return await apiClient.put(
            ENDPOINTS.MESSAGES.EDIT(messageId),
            { content }
        )
    },

    /**
     * Delete a message
     * @param {string} messageId - The message ID
     * @returns {Promise<object>} API response
     */
    async deleteMessage(messageId) {
        return await apiClient.delete(
            ENDPOINTS.MESSAGES.DELETE(messageId)
        )
    },

    /**
     * Get message details
     * @param {string} messageId - The message ID
     * @returns {Promise<object>} API response
     */
    async getMessageById(messageId) {
        return await apiClient.get(
            ENDPOINTS.MESSAGES.DETAIL(messageId)
        )
    },

    /**
     * Mark a message as read
     * @param {string} messageId - The message ID
     * @returns {Promise<object>} API response
     */
    async markAsRead(messageId) {
        return await apiClient.post(
            ENDPOINTS.MESSAGES.MARK_READ(messageId)
        )
    },

    /**
     * Mark all messages in a conversation as read
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async markAllAsRead(conversationId) {
        return await apiClient.post(
            ENDPOINTS.MESSAGES.MARK_ALL_READ(conversationId)
        )
    },

    /**
     * React to a message
     * @param {string} messageId - The message ID
     * @param {string} emoji - The emoji reaction
     * @param {string} action - 'add' or 'remove'
     * @returns {Promise<object>} API response
     */
    async reactToMessage(messageId, emoji, action = 'toggle') {
        return await apiClient.post(
            ENDPOINTS.MESSAGES.REACTIONS(messageId),
            { emoji, action }
        )
    },

    /**
     * Get reactions for a message
     * @param {string} messageId - The message ID
     * @returns {Promise<object>} API response
     */
    async getMessageReactions(messageId) {
        return await apiClient.get(
            ENDPOINTS.MESSAGES.REACTIONS(messageId)
        )
    },

    /**
     * Remove a reaction from a message
     * @param {string} messageId - The message ID
     * @param {string} emoji - The emoji to remove
     * @returns {Promise<object>} API response
     */
    async removeReaction(messageId, emoji) {
        return await apiClient.delete(
            `${ENDPOINTS.MESSAGES.REACTIONS(messageId)}/${emoji}`
        )
    },

    /**
     * Search messages
     * @param {object} searchParams - Search parameters
     * @returns {Promise<object>} API response
     */
    async searchMessages(searchParams) {
        const {
            query,
            conversationId,
            limit = 50,
            offset = 0,
            type,
            fromDate,
            toDate,
            userId
        } = searchParams

        const params = {
            q: query,
            limit,
            offset
        }

        if (conversationId) params.conversationId = conversationId
        if (type) params.type = type
        if (fromDate) params.fromDate = fromDate
        if (toDate) params.toDate = toDate
        if (userId) params.userId = userId

        return await apiClient.get(ENDPOINTS.MESSAGES.SEARCH, { params })
    },

    /**
     * Forward a message to other conversations
     * @param {string} messageId - The message ID
     * @param {string[]} conversationIds - Target conversation IDs
     * @returns {Promise<object>} API response
     */
    async forwardMessage(messageId, conversationIds) {
        return await apiClient.post(
            ENDPOINTS.MESSAGES.FORWARD(messageId),
            { conversationIds }
        )
    },

    /**
     * Upload attachment for message
     * @param {File} file - The file to upload
     * @param {function} onProgress - Progress callback
     * @returns {Promise<object>} API response
     */
    async uploadAttachment(file, onProgress) {
        const formData = new FormData()
        formData.append('file', file)

        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        }

        if (onProgress) {
            config.onUploadProgress = (progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                )
                onProgress(percentCompleted)
            }
        }

        // Determine upload endpoint based on file type
        let endpoint = ENDPOINTS.UPLOAD.DOCUMENT
        if (file.type.startsWith('image/')) {
            endpoint = ENDPOINTS.UPLOAD.IMAGE
        } else if (file.type.startsWith('video/')) {
            endpoint = ENDPOINTS.UPLOAD.VIDEO
        }

        return await apiClient.post(endpoint, formData, config)
    },

    /**
     * Get message history for a conversation
     * @param {string} conversationId - The conversation ID
     * @param {object} params - Query parameters
     * @returns {Promise<object>} API response
     */
    async getMessageHistory(conversationId, params = {}) {
        const {
            before,
            after,
            limit = 50,
            type
        } = params

        const queryParams = { limit }
        if (before) queryParams.before = before
        if (after) queryParams.after = after
        if (type) queryParams.type = type

        return await apiClient.get(
            ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId),
            { params: queryParams }
        )
    },

    /**
     * Get message statistics for a conversation
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async getMessageStats(conversationId) {
        return await apiClient.get(
            `${ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId)}/stats`
        )
    },

    /**
     * Export conversation messages
     * @param {string} conversationId - The conversation ID
     * @param {object} exportParams - Export parameters
     * @returns {Promise<object>} API response
     */
    async exportMessages(conversationId, exportParams = {}) {
        const {
            format = 'json',
            fromDate,
            toDate,
            includeAttachments = false
        } = exportParams

        const params = { format, includeAttachments }
        if (fromDate) params.fromDate = fromDate
        if (toDate) params.toDate = toDate

        return await apiClient.get(
            `${ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId)}/export`,
            {
                params,
                responseType: format === 'json' ? 'json' : 'blob'
            }
        )
    },

    /**
     * Get unread message count
     * @param {string} conversationId - The conversation ID (optional)
     * @returns {Promise<object>} API response
     */
    async getUnreadCount(conversationId = null) {
        const endpoint = conversationId
            ? `${ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId)}/unread-count`
            : `${ENDPOINTS.MESSAGES.BASE}/unread-count`

        return await apiClient.get(endpoint)
    },

    /**
     * Pin/unpin a message
     * @param {string} messageId - The message ID
     * @param {boolean} pinned - Whether to pin or unpin
     * @returns {Promise<object>} API response
     */
    async togglePin(messageId, pinned) {
        const action = pinned ? 'pin' : 'unpin'
        return await apiClient.post(
            `${ENDPOINTS.MESSAGES.DETAIL(messageId)}/${action}`
        )
    },

    /**
     * Get pinned messages for a conversation
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async getPinnedMessages(conversationId) {
        return await apiClient.get(
            `${ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId)}/pinned`
        )
    },

    /**
     * Report a message
     * @param {string} messageId - The message ID
     * @param {string} reason - Report reason
     * @param {string} description - Additional description
     * @returns {Promise<object>} API response
     */
    async reportMessage(messageId, reason, description = '') {
        return await apiClient.post(
            `${ENDPOINTS.MESSAGES.DETAIL(messageId)}/report`,
            { reason, description }
        )
    }
}

export default messageService