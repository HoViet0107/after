import apiClient from '@/api/client'
import { ENDPOINTS, PAGINATION } from '@/api/endpoints'

/**
 * Conversation API Service
 * Handles all conversation-related API calls
 */
export const conversationService = {
    /**
     * Get all conversations for the current user
     * @param {object} params - Query parameters
     * @returns {Promise<object>} API response
     */
    async getConversations(params = {}) {
        const {
            page = PAGINATION.DEFAULT_PAGE,
            size = PAGINATION.DEFAULT_SIZE,
            sort = 'lastMessageAt,desc',
            type, // 'direct' or 'group'
            status, // 'active', 'archived', 'muted'
            search
        } = params

        const queryParams = { page, size, sort }
        if (type) queryParams.type = type
        if (status) queryParams.status = status
        if (search) queryParams.search = search

        return await apiClient.get(ENDPOINTS.CONVERSATIONS.LIST, {
            params: queryParams
        })
    },

    /**
     * Get conversation by ID
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async getConversationById(conversationId) {
        return await apiClient.get(
            ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)
        )
    },

    /**
     * Create a new conversation
     * @param {object} conversationData - Conversation data
     * @returns {Promise<object>} API response
     */
    async createConversation(conversationData) {
        const payload = {
            title: conversationData.title,
            description: conversationData.description,
            isGroupChat: conversationData.isGroupChat || false,
            participantIds: conversationData.participantIds || [],
            isPrivate: conversationData.isPrivate || false
        }

        return await apiClient.post(ENDPOINTS.CONVERSATIONS.CREATE, payload)
    },

    /**
     * Update conversation details
     * @param {string} conversationId - The conversation ID
     * @param {object} updates - Update data
     * @returns {Promise<object>} API response
     */
    async updateConversation(conversationId, updates) {
        const allowedUpdates = {
            title: updates.title,
            description: updates.description,
            avatar: updates.avatar,
            settings: updates.settings
        }

        // Remove undefined values
        const payload = Object.fromEntries(
            Object.entries(allowedUpdates).filter(([_, value]) => value !== undefined)
        )

        return await apiClient.put(
            ENDPOINTS.CONVERSATIONS.DETAIL(conversationId),
            payload
        )
    },

    /**
     * Delete a conversation
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async deleteConversation(conversationId) {
        return await apiClient.delete(
            ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)
        )
    },

    /**
     * Get conversation participants
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async getParticipants(conversationId) {
        return await apiClient.get(
            ENDPOINTS.CONVERSATIONS.PARTICIPANTS(conversationId)
        )
    },

    /**
     * Add participant to conversation
     * @param {string} conversationId - The conversation ID
     * @param {string} userId - User ID to add
     * @param {string} role - User role ('member', 'admin')
     * @returns {Promise<object>} API response
     */
    async addParticipant(conversationId, userId, role = 'member') {
        return await apiClient.post(
            ENDPOINTS.CONVERSATIONS.ADD_PARTICIPANT(conversationId),
            { userId, role }
        )
    },

    /**
     * Add multiple participants to conversation
     * @param {string} conversationId - The conversation ID
     * @param {string[]} userIds - Array of user IDs to add
     * @returns {Promise<object>} API response
     */
    async addMultipleParticipants(conversationId, userIds) {
        return await apiClient.post(
            ENDPOINTS.CONVERSATIONS.ADD_PARTICIPANT(conversationId),
            { userIds }
        )
    },

    /**
     * Remove participant from conversation
     * @param {string} conversationId - The conversation ID
     * @param {string} userId - User ID to remove
     * @returns {Promise<object>} API response
     */
    async removeParticipant(conversationId, userId) {
        return await apiClient.delete(
            ENDPOINTS.CONVERSATIONS.REMOVE_PARTICIPANT(conversationId, userId)
        )
    },

    /**
     * Update participant role
     * @param {string} conversationId - The conversation ID
     * @param {string} userId - User ID
     * @param {string} role - New role ('member', 'admin')
     * @returns {Promise<object>} API response
     */
    async updateParticipantRole(conversationId, userId, role) {
        return await apiClient.put(
            ENDPOINTS.CONVERSATIONS.REMOVE_PARTICIPANT(conversationId, userId),
            { role }
        )
    },

    /**
     * Leave a conversation
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async leaveConversation(conversationId) {
        return await apiClient.post(
            ENDPOINTS.CONVERSATIONS.LEAVE(conversationId)
        )
    },

    /**
     * Mute conversation notifications
     * @param {string} conversationId - The conversation ID
     * @param {number} duration - Mute duration in milliseconds (optional)
     * @returns {Promise<object>} API response
     */
    async muteConversation(conversationId, duration = null) {
        const payload = duration ? { duration } : {}
        return await apiClient.post(
            ENDPOINTS.CONVERSATIONS.MUTE(conversationId),
            payload
        )
    },

    /**
     * Unmute conversation notifications
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async unmuteConversation(conversationId) {
        return await apiClient.post(
            ENDPOINTS.CONVERSATIONS.UNMUTE(conversationId)
        )
    },

    /**
     * Archive a conversation
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async archiveConversation(conversationId) {
        return await apiClient.post(
            ENDPOINTS.CONVERSATIONS.ARCHIVE(conversationId)
        )
    },

    /**
     * Unarchive a conversation
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async unarchiveConversation(conversationId) {
        return await apiClient.post(
            ENDPOINTS.CONVERSATIONS.UNARCHIVE(conversationId)
        )
    },

    /**
     * Search conversations
     * @param {string} query - Search query
     * @param {object} filters - Additional filters
     * @returns {Promise<object>} API response
     */
    async searchConversations(query, filters = {}) {
        const params = {
            q: query,
            limit: filters.limit || 20,
            type: filters.type, // 'direct', 'group'
            status: filters.status // 'active', 'archived'
        }

        // Remove undefined values
        const cleanParams = Object.fromEntries(
            Object.entries(params).filter(([_, value]) => value !== undefined)
        )

        return await apiClient.get(ENDPOINTS.SEARCH.CONVERSATIONS || '/search/conversations', {
            params: cleanParams
        })
    },

    /**
     * Get conversation settings
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async getConversationSettings(conversationId) {
        return await apiClient.get(
            `${ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)}/settings`
        )
    },

    /**
     * Update conversation settings
     * @param {string} conversationId - The conversation ID
     * @param {object} settings - Settings to update
     * @returns {Promise<object>} API response
     */
    async updateConversationSettings(conversationId, settings) {
        return await apiClient.put(
            `${ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)}/settings`,
            settings
        )
    },

    /**
     * Get conversation stats
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async getConversationStats(conversationId) {
        return await apiClient.get(
            `${ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)}/stats`
        )
    },

    /**
     * Create direct conversation with user
     * @param {string} userId - Target user ID
     * @returns {Promise<object>} API response
     */
    async createDirectConversation(userId) {
        return await this.createConversation({
            isGroupChat: false,
            participantIds: [userId]
        })
    },

    /**
     * Create group conversation
     * @param {object} groupData - Group conversation data
     * @returns {Promise<object>} API response
     */
    async createGroupConversation(groupData) {
        return await this.createConversation({
            title: groupData.title,
            description: groupData.description,
            isGroupChat: true,
            participantIds: groupData.participantIds,
            isPrivate: groupData.isPrivate || false
        })
    },

    /**
     * Check if conversation exists with user
     * @param {string} userId - Target user ID
     * @returns {Promise<object>} API response
     */
    async findDirectConversation(userId) {
        return await apiClient.get('/conversations/direct', {
            params: { userId }
        })
    },

    /**
     * Get conversation drafts
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async getDrafts(conversationId) {
        return await apiClient.get(
            `${ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)}/drafts`
        )
    },

    /**
     * Save conversation draft
     * @param {string} conversationId - The conversation ID
     * @param {string} content - Draft content
     * @returns {Promise<object>} API response
     */
    async saveDraft(conversationId, content) {
        return await apiClient.post(
            `${ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)}/drafts`,
            { content }
        )
    },

    /**
     * Delete conversation draft
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async deleteDraft(conversationId) {
        return await apiClient.delete(
            `${ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)}/drafts`
        )
    },

    /**
     * Get typing users in conversation
     * @param {string} conversationId - The conversation ID
     * @returns {Promise<object>} API response
     */
    async getTypingUsers(conversationId) {
        return await apiClient.get(
            `${ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)}/typing`
        )
    },

    /**
     * Update typing status
     * @param {string} conversationId - The conversation ID
     * @param {boolean} isTyping - Typing status
     * @returns {Promise<object>} API response
     */
    async updateTypingStatus(conversationId, isTyping) {
        return await apiClient.post(
            `${ENDPOINTS.CONVERSATIONS.DETAIL(conversationId)}/typing`,
            { isTyping }
        )
    },

    /**
     * Bulk operations on conversations
     * @param {string} action - Action to perform ('archive', 'unarchive', 'delete', 'mute', 'unmute')
     * @param {string[]} conversationIds - Array of conversation IDs
     * @returns {Promise<object>} API response
     */
    async bulkAction(action, conversationIds) {
        return await apiClient.post('/conversations/bulk', {
            action,
            conversationIds
        })
    },

    /**
     * Get recent conversations
     * @param {number} limit - Number of conversations to fetch
     * @returns {Promise<object>} API response
     */
    async getRecentConversations(limit = 10) {
        return await this.getConversations({
            size: limit,
            sort: 'lastMessageAt,desc'
        })
    },

    /**
     * Get archived conversations
     * @param {object} params - Query parameters
     * @returns {Promise<object>} API response
     */
    async getArchivedConversations(params = {}) {
        return await this.getConversations({
            ...params,
            status: 'archived'
        })
    },

    /**
     * Get muted conversations
     * @param {object} params - Query parameters
     * @returns {Promise<object>} API response
     */
    async getMutedConversations(params = {}) {
        return await this.getConversations({
            ...params,
            status: 'muted'
        })
    }
}

export default conversationService