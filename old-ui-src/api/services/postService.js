// src/api/services/postService.js
// Post API calls với real-time updates, caching và performance optimization

import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { useCacheStore } from '@/stores/cache'
import { useWebSocket } from '@/composables/useWebSocket'

class PostService {
    constructor() {
        this.cache = useCacheStore()
        this.websocket = useWebSocket()
        this.cacheTTL = {
            posts: 5 * 60 * 1000,     // 5 minutes
            feed: 2 * 60 * 1000,      // 2 minutes
            userPosts: 3 * 60 * 1000, // 3 minutes
            trending: 10 * 60 * 1000   // 10 minutes
        }

        // Subscribe to real-time post updates
        this.setupRealTimeUpdates()
    }

    setupRealTimeUpdates() {
        // Listen for real-time post updates
        this.websocket.on('post:created', (post) => {
            this.handleNewPost(post)
        })

        this.websocket.on('post:updated', (post) => {
            this.handlePostUpdate(post)
        })

        this.websocket.on('post:deleted', (postId) => {
            this.handlePostDelete(postId)
        })

        this.websocket.on('post:liked', (data) => {
            this.handlePostLike(data.postId, data.userId, true)
        })

        this.websocket.on('post:unliked', (data) => {
            this.handlePostLike(data.postId, data.userId, false)
        })
    }

    // Create new post
    async createPost(postData) {
        try {
            const formData = this.preparePostData(postData)

            const response = await apiClient.post(ENDPOINTS.POSTS.CREATE, formData, {
                headers: {
                    'Content-Type': postData.files?.length > 0 ? 'multipart/form-data' : 'application/json'
                },
                showLoading: true,
                onUploadProgress: postData.onProgress || undefined
            })

            const newPost = response.data.data

            // Invalidate relevant caches
            this.invalidatePostCaches()

            // Notify via WebSocket for real-time updates
            this.websocket.emit('post:create', newPost)

            return {
                success: true,
                data: newPost,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Tạo bài viết thất bại',
                errors: error.response?.data?.errors
            }
        }
    }

    // Get post details
    async getPost(postId, options = {}) {
        const cacheKey = `post-${postId}`

        try {
            // Check cache first
            if (!options.forceRefresh) {
                const cached = this.cache.get(cacheKey)
                if (cached) {
                    return { success: true, data: cached, fromCache: true }
                }
            }

            const response = await apiClient.get(ENDPOINTS.POSTS.DETAIL(postId), {
                params: {
                    includeComments: options.includeComments || false,
                    commentLimit: options.commentLimit || 10
                }
            })

            const post = response.data.data

            // Cache the result
            this.cache.set(cacheKey, post, this.cacheTTL.posts)

            return {
                success: true,
                data: post
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy thông tin bài viết'
            }
        }
    }

    // Update post
    async updatePost(postId, updateData) {
        try {
            const response = await apiClient.put(ENDPOINTS.POSTS.DETAIL(postId), updateData, {
                showLoading: true
            })

            const updatedPost = response.data.data

            // Update cache
            this.cache.set(`post-${postId}`, updatedPost, this.cacheTTL.posts)

            // Notify via WebSocket
            this.websocket.emit('post:update', updatedPost)

            return {
                success: true,
                data: updatedPost,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Cập nhật bài viết thất bại',
                errors: error.response?.data?.errors
            }
        }
    }

    // Delete post
    async deletePost(postId) {
        try {
            const response = await apiClient.delete(ENDPOINTS.POSTS.DELETE(postId), {
                showLoading: true
            })

            // Remove from cache
            this.cache.delete(`post-${postId}`)
            this.invalidatePostCaches()

            // Notify via WebSocket
            this.websocket.emit('post:delete', postId)

            return {
                success: true,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Xóa bài viết thất bại'
            }
        }
    }

    // Like/Unlike post
    async likePost(postId) {
        try {
            const response = await apiClient.post(ENDPOINTS.POSTS.LIKE(postId), {}, {
                showLoading: false
            })

            // Update cached post data
            this.updatePostInCache(postId, (post) => ({
                ...post,
                isLiked: true,
                likesCount: (post.likesCount || 0) + 1
            }))

            // Notify via WebSocket
            this.websocket.emit('post:like', { postId })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể like bài viết'
            }
        }
    }

    async unlikePost(postId) {
        try {
            const response = await apiClient.delete(ENDPOINTS.POSTS.UNLIKE(postId), {
                showLoading: false
            })

            // Update cached post data
            this.updatePostInCache(postId, (post) => ({
                ...post,
                isLiked: false,
                likesCount: Math.max((post.likesCount || 1) - 1, 0)
            }))

            // Notify via WebSocket
            this.websocket.emit('post:unlike', { postId })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể unlike bài viết'
            }
        }
    }

    // Share post
    async sharePost(postId, shareData = {}) {
        try {
            const response = await apiClient.post(ENDPOINTS.POSTS.SHARE(postId), {
                content: shareData.content || '',
                privacy: shareData.privacy || 'public'
            }, {
                showLoading: true
            })

            // Update share count in cache
            this.updatePostInCache(postId, (post) => ({
                ...post,
                sharesCount: (post.sharesCount || 0) + 1
            }))

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể share bài viết'
            }
        }
    }

    // Get user's posts
    async getUserPosts(userId, options = {}) {
        const cacheKey = `user-posts-${userId}-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.POSTS.USER_POSTS(userId), {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    type: options.type || 'all', // all, posts, shares, media
                    sortBy: options.sortBy || 'createdAt',
                    order: options.order || 'desc'
                }
            })

            const posts = response.data.data
            this.cache.set(cacheKey, posts, this.cacheTTL.userPosts)

            return {
                success: true,
                data: posts
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy bài viết của người dùng'
            }
        }
    }

    // Get feed posts
    async getFeedPosts(options = {}) {
        const cacheKey = `feed-posts-${JSON.stringify(options)}`

        try {
            // For fresh feed, don't use cache or use very short cache
            const useCache = options.type !== 'fresh' && !options.forceRefresh

            if (useCache) {
                const cached = this.cache.get(cacheKey)
                if (cached) {
                    return { success: true, data: cached, fromCache: true }
                }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.HOME, {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    type: options.type || 'all', // all, following, trending, fresh
                    algorithm: options.algorithm || 'default' // default, chronological, trending
                }
            })

            const feedData = response.data.data

            // Cache with shorter TTL for fresh content
            const ttl = options.type === 'fresh' ? 30000 : this.cacheTTL.feed // 30s for fresh, normal for others
            this.cache.set(cacheKey, feedData, ttl)

            return {
                success: true,
                data: feedData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy feed'
            }
        }
    }

    // Get trending posts
    async getTrendingPosts(options = {}) {
        const cacheKey = `trending-posts-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.TRENDING, {
                params: {
                    limit: options.limit || 20,
                    timeframe: options.timeframe || '24h', // 1h, 24h, 7d, 30d
                    category: options.category || 'all'
                }
            })

            const trendingPosts = response.data.data
            this.cache.set(cacheKey, trendingPosts, this.cacheTTL.trending)

            return {
                success: true,
                data: trendingPosts
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy trending posts'
            }
        }
    }

    // Search posts
    async searchPosts(query, options = {}) {
        try {
            const response = await apiClient.get(ENDPOINTS.POSTS.SEARCH, {
                params: {
                    q: query.trim(),
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    type: options.type || 'all', // all, text, media, links
                    sortBy: options.sortBy || 'relevance', // relevance, recent, popular
                    dateRange: options.dateRange || 'all' // today, week, month, year, all
                }
            })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Tìm kiếm thất bại'
            }
        }
    }

    // Get posts by hashtag
    async getPostsByHashtag(hashtag, options = {}) {
        const cacheKey = `hashtag-posts-${hashtag}-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.HASHTAG(hashtag), {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    sortBy: options.sortBy || 'recent'
                }
            })

            const posts = response.data.data
            this.cache.set(cacheKey, posts, this.cacheTTL.posts)

            return {
                success: true,
                data: posts
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || `Không thể lấy bài viết cho hashtag #${hashtag}`
            }
        }
    }

    // Report post
    async reportPost(postId, reason, description = '') {
        try {
            const response = await apiClient.post(ENDPOINTS.POSTS.REPORT(postId), {
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
                error: error.response?.data?.message || 'Không thể báo cáo bài viết'
            }
        }
    }

    // Save/Unsave post
    async savePost(postId) {
        try {
            const response = await apiClient.post(ENDPOINTS.POSTS.SAVE(postId), {}, {
                showLoading: false
            })

            this.updatePostInCache(postId, (post) => ({
                ...post,
                isSaved: true
            }))

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lưu bài viết'
            }
        }
    }

    async unsavePost(postId) {
        try {
            const response = await apiClient.delete(ENDPOINTS.POSTS.SAVE(postId), {
                showLoading: false
            })

            this.updatePostInCache(postId, (post) => ({
                ...post,
                isSaved: false
            }))

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể bỏ lưu bài viết'
            }
        }
    }

    // Utility methods
    preparePostData(postData) {
        if (postData.files?.length > 0) {
            // Multi-part form data for files
            const formData = new FormData()
            formData.append('content', postData.content || '')
            formData.append('privacy', postData.privacy || 'public')
            formData.append('location', postData.location || '')
            formData.append('tags', JSON.stringify(postData.tags || []))

            postData.files.forEach((file, index) => {
                formData.append(`files[${index}]`, file)
            })

            return formData
        } else {
            // JSON data for text posts
            return {
                content: postData.content?.trim() || '',
                privacy: postData.privacy || 'public',
                location: postData.location || '',
                tags: postData.tags || [],
                mentions: postData.mentions || [],
                hashtags: postData.hashtags || []
            }
        }
    }

    updatePostInCache(postId, updateFn) {
        const cacheKey = `post-${postId}`
        const cachedPost = this.cache.get(cacheKey)

        if (cachedPost) {
            const updatedPost = updateFn(cachedPost)
            this.cache.set(cacheKey, updatedPost, this.cacheTTL.posts)
        }
    }

    invalidatePostCaches() {
        // Invalidate all post-related caches
        this.cache.deletePattern('feed-posts-')
        this.cache.deletePattern('user-posts-')
        this.cache.deletePattern('hashtag-posts-')
        this.cache.deletePattern('trending-posts-')
    }

    // Real-time update handlers
    handleNewPost(post) {
        // Add to relevant caches if they exist
        const feedKeys = this.cache.getKeys().filter(key => key.startsWith('feed-posts-'))

        feedKeys.forEach(key => {
            const feedData = this.cache.get(key)
            if (feedData && feedData.posts) {
                // Add new post to the beginning
                feedData.posts.unshift(post)
                feedData.meta.total += 1
                this.cache.set(key, feedData, this.cacheTTL.feed)
            }
        })
    }

    handlePostUpdate(post) {
        // Update post in cache
        this.cache.set(`post-${post.id}`, post, this.cacheTTL.posts)

        // Update in feed caches
        this.updatePostInAllCaches(post.id, () => post)
    }

    handlePostDelete(postId) {
        // Remove from cache
        this.cache.delete(`post-${postId}`)

        // Remove from all list caches
        const listKeys = this.cache.getKeys().filter(key =>
            key.startsWith('feed-posts-') ||
            key.startsWith('user-posts-') ||
            key.startsWith('hashtag-posts-')
        )

        listKeys.forEach(key => {
            const listData = this.cache.get(key)
            if (listData && listData.posts) {
                listData.posts = listData.posts.filter(post => post.id !== postId)
                listData.meta.total = Math.max(0, listData.meta.total - 1)
                this.cache.set(key, listData, this.cacheTTL.feed)
            }
        })
    }

    handlePostLike(postId, userId, isLiked) {
        this.updatePostInCache(postId, (post) => {
            const likesCount = isLiked
                ? (post.likesCount || 0) + 1
                : Math.max((post.likesCount || 1) - 1, 0)

            return {
                ...post,
                isLiked,
                likesCount
            }
        })
    }

    updatePostInAllCaches(postId, updateFn) {
        // Update in all caches that might contain this post
        const allKeys = this.cache.getKeys()

        allKeys.forEach(key => {
            if (key.includes('posts-') || key.includes('feed-')) {
                const data = this.cache.get(key)
                if (data && data.posts) {
                    const postIndex = data.posts.findIndex(p => p.id === postId)
                    if (postIndex !== -1) {
                        data.posts[postIndex] = updateFn(data.posts[postIndex])
                        this.cache.set(key, data, this.cacheTTL.posts)
                    }
                }
            }
        })
    }

    // Prefetch methods for better UX
    async prefetchPost(postId) {
        if (!this.cache.has(`post-${postId}`)) {
            try {
                await this.getPost(postId)
            } catch (error) {
                console.warn(`Failed to prefetch post ${postId}:`, error)
            }
        }
    }

    // Batch operations
    async getPostsBatch(postIds) {
        try {
            const response = await apiClient.post(ENDPOINTS.POSTS.BATCH, {
                postIds
            })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy thông tin posts'
            }
        }
    }

    // Clear all post caches
    clearPostCaches() {
        this.cache.clearPattern('post-')
        this.cache.clearPattern('feed-')
        this.cache.clearPattern('user-posts-')
        this.cache.clearPattern('hashtag-posts-')
        this.cache.clearPattern('trending-posts-')
    }
}

// Export singleton instance
export const postService = new PostService()
export default postService