// src/api/services/commentService.js
// Comment API calls với threading, real-time updates và performance optimization

import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { useCacheStore } from '@/stores/cache'
import { useWebSocket } from '@/composables/useWebSocket'

class CommentService {
    constructor() {
        this.cache = useCacheStore()
        this.websocket = useWebSocket()
        this.cacheTTL = {
            comments: 5 * 60 * 1000,     // 5 minutes
            replies: 3 * 60 * 1000,      // 3 minutes
            thread: 5 * 60 * 1000        // 5 minutes
        }

        // Setup real-time updates
        this.setupRealTimeUpdates()
    }

    setupRealTimeUpdates() {
        // Listen for real-time comment updates
        this.websocket.on('comment:created', (comment) => {
            this.handleNewComment(comment)
        })

        this.websocket.on('comment:updated', (comment) => {
            this.handleCommentUpdate(comment)
        })

        this.websocket.on('comment:deleted', (commentId) => {
            this.handleCommentDelete(commentId)
        })

        this.websocket.on('comment:liked', (data) => {
            this.handleCommentLike(data.commentId, data.userId, true)
        })

        this.websocket.on('comment:unliked', (data) => {
            this.handleCommentLike(data.commentId, data.userId, false)
        })
    }

    // Get comments for a post
    async getPostComments(postId, options = {}) {
        const cacheKey = `post-comments-${postId}-${JSON.stringify(options)}`

        try {
            // Check cache first
            if (!options.forceRefresh) {
                const cached = this.cache.get(cacheKey)
                if (cached) {
                    return { success: true, data: cached, fromCache: true }
                }
            }

            const response = await apiClient.get(ENDPOINTS.COMMENTS.POST_COMMENTS(postId), {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    sortBy: options.sortBy || 'createdAt', // createdAt, likes, replies
                    order: options.order || 'desc',
                    includeReplies: options.includeReplies || false,
                    replyLimit: options.replyLimit || 3
                }
            })

            const commentsData = response.data.data

            // Cache the result
            this.cache.set(cacheKey, commentsData, this.cacheTTL.comments)

            return {
                success: true,
                data: commentsData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy bình luận'
            }
        }
    }

    // Create new comment
    async createComment(postId, commentData) {
        try {
            const cleanData = this.sanitizeCommentData(commentData)

            const response = await apiClient.post(ENDPOINTS.COMMENTS.CREATE(postId), cleanData, {
                showLoading: true
            })

            const newComment = response.data.data

            // Invalidate relevant caches
            this.invalidateCommentCaches(postId)

            // Notify via WebSocket for real-time updates
            this.websocket.emit('comment:create', { postId, comment: newComment })

            return {
                success: true,
                data: newComment,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể tạo bình luận',
                errors: error.response?.data?.errors
            }
        }
    }

    // Reply to a comment
    async replyToComment(commentId, replyData) {
        try {
            const cleanData = this.sanitizeCommentData(replyData)

            const response = await apiClient.post(ENDPOINTS.COMMENTS.REPLIES(commentId), cleanData, {
                showLoading: true
            })

            const newReply = response.data.data

            // Update parent comment's reply count in cache
            this.updateCommentInCache(commentId, (comment) => ({
                ...comment,
                repliesCount: (comment.repliesCount || 0) + 1,
                replies: comment.replies ? [newReply, ...comment.replies] : [newReply]
            }))

            // Notify via WebSocket
            this.websocket.emit('comment:reply', { commentId, reply: newReply })

            return {
                success: true,
                data: newReply,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể trả lời bình luận',
                errors: error.response?.data?.errors
            }
        }
    }

    // Get comment details
    async getComment(commentId, options = {}) {
        const cacheKey = `comment-${commentId}`

        try {
            // Check cache first
            if (!options.forceRefresh) {
                const cached = this.cache.get(cacheKey)
                if (cached) {
                    return { success: true, data: cached, fromCache: true }
                }
            }

            const response = await apiClient.get(ENDPOINTS.COMMENTS.DETAIL(commentId), {
                params: {
                    includeReplies: options.includeReplies || false,
                    replyLimit: options.replyLimit || 10
                }
            })

            const comment = response.data.data

            // Cache the result
            this.cache.set(cacheKey, comment, this.cacheTTL.comments)

            return {
                success: true,
                data: comment
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy thông tin bình luận'
            }
        }
    }

    // Update comment
    async updateComment(commentId, updateData) {
        try {
            const cleanData = this.sanitizeCommentData(updateData)

            const response = await apiClient.put(ENDPOINTS.COMMENTS.DETAIL(commentId), cleanData, {
                showLoading: true
            })

            const updatedComment = response.data.data

            // Update cache
            this.cache.set(`comment-${commentId}`, updatedComment, this.cacheTTL.comments)

            // Notify via WebSocket
            this.websocket.emit('comment:update', updatedComment)

            return {
                success: true,
                data: updatedComment,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Cập nhật bình luận thất bại',
                errors: error.response?.data?.errors
            }
        }
    }

    // Delete comment
    async deleteComment(commentId) {
        try {
            const response = await apiClient.delete(ENDPOINTS.COMMENTS.DELETE(commentId), {
                showLoading: true
            })

            // Remove from cache
            this.cache.delete(`comment-${commentId}`)
            this.invalidateAllCommentCaches()

            // Notify via WebSocket
            this.websocket.emit('comment:delete', commentId)

            return {
                success: true,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Xóa bình luận thất bại'
            }
        }
    }

    // Like comment
    async likeComment(commentId) {
        try {
            const response = await apiClient.post(ENDPOINTS.COMMENTS.LIKE(commentId), {}, {
                showLoading: false
            })

            // Update cached comment data
            this.updateCommentInCache(commentId, (comment) => ({
                ...comment,
                isLiked: true,
                likesCount: (comment.likesCount || 0) + 1
            }))

            // Notify via WebSocket
            this.websocket.emit('comment:like', { commentId })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể like bình luận'
            }
        }
    }

    // Unlike comment
    async unlikeComment(commentId) {
        try {
            const response = await apiClient.delete(ENDPOINTS.COMMENTS.UNLIKE(commentId), {
                showLoading: false
            })

            // Update cached comment data
            this.updateCommentInCache(commentId, (comment) => ({
                ...comment,
                isLiked: false,
                likesCount: Math.max((comment.likesCount || 1) - 1, 0)
            }))

            // Notify via WebSocket
            this.websocket.emit('comment:unlike', { commentId })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể unlike bình luận'
            }
        }
    }

    // Get replies for a comment
    async getCommentReplies(commentId, options = {}) {
        const cacheKey = `comment-replies-${commentId}-${JSON.stringify(options)}`

        try {
            // Check cache first
            if (!options.forceRefresh) {
                const cached = this.cache.get(cacheKey)
                if (cached) {
                    return { success: true, data: cached, fromCache: true }
                }
            }

            const response = await apiClient.get(ENDPOINTS.COMMENTS.REPLIES(commentId), {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    sortBy: options.sortBy || 'createdAt',
                    order: options.order || 'asc' // Replies usually chronological
                }
            })

            const repliesData = response.data.data

            // Cache the result
            this.cache.set(cacheKey, repliesData, this.cacheTTL.replies)

            return {
                success: true,
                data: repliesData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy replies'
            }
        }
    }

    // Get comment thread (comment + all nested replies)
    async getCommentThread(commentId, options = {}) {
        const cacheKey = `comment-thread-${commentId}-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.COMMENTS.THREAD(commentId), {
                params: {
                    maxDepth: options.maxDepth || 3,
                    sortBy: options.sortBy || 'createdAt',
                    includeDeleted: options.includeDeleted || false
                }
            })

            const threadData = response.data.data
            this.cache.set(cacheKey, threadData, this.cacheTTL.thread)

            return {
                success: true,
                data: threadData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy comment thread'
            }
        }
    }

    // Report comment
    async reportComment(commentId, reason, description = '') {
        try {
            const response = await apiClient.post(ENDPOINTS.COMMENTS.REPORT(commentId), {
                reason,
                description: description.trim()
            }, {
                showLoading: true
            })

            return {
                success: true,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể báo cáo bình luận'
            }
        }
    }

    // Pin/Unpin comment (for post owners)
    async pinComment(commentId) {
        try {
            const response = await apiClient.post(ENDPOINTS.COMMENTS.PIN(commentId), {}, {
                showLoading: true
            })

            // Update comment in cache
            this.updateCommentInCache(commentId, (comment) => ({
                ...comment,
                isPinned: true
            }))

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể pin bình luận'
            }
        }
    }

    async unpinComment(commentId) {
        try {
            const response = await apiClient.delete(ENDPOINTS.COMMENTS.PIN(commentId), {
                showLoading: true
            })

            // Update comment in cache
            this.updateCommentInCache(commentId, (comment) => ({
                ...comment,
                isPinned: false
            }))

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể unpin bình luận'
            }
        }
    }

    // Search comments
    async searchComments(query, options = {}) {
        try {
            const response = await apiClient.get(ENDPOINTS.COMMENTS.SEARCH, {
                params: {
                    q: query.trim(),
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    postId: options.postId, // Search within specific post
                    userId: options.userId,  // Search user's comments
                    sortBy: options.sortBy || 'relevance'
                }
            })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Tìm kiếm bình luận thất bại'
            }
        }
    }

    // Get user's comments
    async getUserComments(userId, options = {}) {
        const cacheKey = `user-comments-${userId}-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.COMMENTS.USER_COMMENTS(userId), {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    sortBy: options.sortBy || 'createdAt',
                    order: options.order || 'desc'
                }
            })

            const commentsData = response.data.data
            this.cache.set(cacheKey, commentsData, this.cacheTTL.comments)

            return {
                success: true,
                data: commentsData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy bình luận của người dùng'
            }
        }
    }

    // Utility methods
    sanitizeCommentData(commentData) {
        const sanitized = { ...commentData }

        // Trim and clean content
        if (sanitized.content) {
            sanitized.content = sanitized.content.trim()
        }

        // Extract mentions and hashtags if not provided
        if (sanitized.content && !sanitized.mentions) {
            sanitized.mentions = this.extractMentions(sanitized.content)
        }

        if (sanitized.content && !sanitized.hashtags) {
            sanitized.hashtags = this.extractHashtags(sanitized.content)
        }

        // Remove empty fields
        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] === '' || sanitized[key] == null) {
                delete sanitized[key]
            }
        })

        return sanitized
    }

    extractMentions(content) {
        const mentionRegex = /@(\w+)/g
        const mentions = []
        let match

        while ((match = mentionRegex.exec(content)) !== null) {
            mentions.push(match[1])
        }

        return [...new Set(mentions)] // Remove duplicates
    }

    extractHashtags(content) {
        const hashtagRegex = /#(\w+)/g
        const hashtags = []
        let match

        while ((match = hashtagRegex.exec(content)) !== null) {
            hashtags.push(match[1])
        }

        return [...new Set(hashtags)] // Remove duplicates
    }

    updateCommentInCache(commentId, updateFn) {
        const cacheKey = `comment-${commentId}`
        const cachedComment = this.cache.get(cacheKey)

        if (cachedComment) {
            const updatedComment = updateFn(cachedComment)
            this.cache.set(cacheKey, updatedComment, this.cacheTTL.comments)
        }

        // Also update in comment lists
        this.updateCommentInAllCaches(commentId, updateFn)
    }

    updateCommentInAllCaches(commentId, updateFn) {
        const allKeys = this.cache.getKeys()

        allKeys.forEach(key => {
            if (key.includes('comments-') || key.includes('thread-')) {
                const data = this.cache.get(key)
                if (data && data.comments) {
                    const commentIndex = data.comments.findIndex(c => c.id === commentId)
                    if (commentIndex !== -1) {
                        data.comments[commentIndex] = updateFn(data.comments[commentIndex])
                        this.cache.set(key, data, this.cacheTTL.comments)
                    }
                }
            }
        })
    }

    invalidateCommentCaches(postId) {
        this.cache.deletePattern(`post-comments-${postId}`)
        this.cache.deletePattern('comment-thread-')
    }

    invalidateAllCommentCaches() {
        this.cache.deletePattern('post-comments-')
        this.cache.deletePattern('comment-replies-')
        this.cache.deletePattern('comment-thread-')
        this.cache.deletePattern('user-comments-')
    }

    // Real-time update handlers
    handleNewComment(comment) {
        // Add to relevant post comment caches
        const postCommentKeys = this.cache.getKeys().filter(key =>
            key.startsWith(`post-comments-${comment.postId}`)
        )

        postCommentKeys.forEach(key => {
            const commentsData = this.cache.get(key)
            if (commentsData && commentsData.comments) {
                commentsData.comments.unshift(comment)
                commentsData.meta.total += 1
                this.cache.set(key, commentsData, this.cacheTTL.comments)
            }
        })
    }

    handleCommentUpdate(comment) {
        // Update comment in cache
        this.cache.set(`comment-${comment.id}`, comment, this.cacheTTL.comments)

        // Update in all list caches
        this.updateCommentInAllCaches(comment.id, () => comment)
    }

    handleCommentDelete(commentId) {
        // Remove from cache
        this.cache.delete(`comment-${commentId}`)

        // Remove from all list caches
        const listKeys = this.cache.getKeys().filter(key =>
            key.includes('comments-') || key.includes('thread-')
        )

        listKeys.forEach(key => {
            const listData = this.cache.get(key)
            if (listData && listData.comments) {
                listData.comments = listData.comments.filter(comment => comment.id !== commentId)
                listData.meta.total = Math.max(0, listData.meta.total - 1)
                this.cache.set(key, listData, this.cacheTTL.comments)
            }
        })
    }

    handleCommentLike(commentId, userId, isLiked) {
        this.updateCommentInCache(commentId, (comment) => {
            const likesCount = isLiked
                ? (comment.likesCount || 0) + 1
                : Math.max((comment.likesCount || 1) - 1, 0)

            return {
                ...comment,
                isLiked,
                likesCount
            }
        })
    }

    // Prefetch methods
    async prefetchComment(commentId) {
        if (!this.cache.has(`comment-${commentId}`)) {
            try {
                await this.getComment(commentId)
            } catch (error) {
                console.warn(`Failed to prefetch comment ${commentId}:`, error)
            }
        }
    }

    // Batch operations
    async getCommentsBatch(commentIds) {
        try {
            const response = await apiClient.post(ENDPOINTS.COMMENTS.BATCH, {
                commentIds
            })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy thông tin comments'
            }
        }
    }

    // Clear all comment caches
    clearCommentCaches() {
        this.cache.clearPattern('comment-')
        this.cache.clearPattern('post-comments-')
        this.cache.clearPattern('user-comments-')
        this.cache.clearPattern('thread-')
    }
}

// Export singleton instance
export const commentService = new CommentService()
export default commentService