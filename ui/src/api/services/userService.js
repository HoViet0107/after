// src/api/services/userService.js
// User API calls với caching, retry logic và performance optimization

import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { useCacheStore } from '@/stores/cache'

class UserService {
    constructor() {
        this.cache = useCacheStore()
        this.cacheTTL = {
            profile: 5 * 60 * 1000, // 5 minutes
            search: 2 * 60 * 1000,  // 2 minutes
            followers: 3 * 60 * 1000, // 3 minutes
            following: 3 * 60 * 1000  // 3 minutes
        }
    }

    // Authentication methods
    async login(credentials) {
        try {
            const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
                email: credentials.email?.toLowerCase().trim(),
                password: credentials.password,
                rememberMe: credentials.rememberMe || false,
                deviceInfo: this.getDeviceInfo()
            }, {
                showLoading: true,
                deduplicate: false // Don't deduplicate login requests
            })

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Đăng nhập thất bại',
                errors: error.response?.data?.errors
            }
        }
    }

    async register(userData) {
        try {
            // Validate data before sending
            const cleanData = this.sanitizeUserData(userData)

            const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, cleanData, {
                showLoading: true,
                deduplicate: false
            })

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Đăng ký thất bại',
                errors: error.response?.data?.errors
            }
        }
    }

    async logout() {
        try {
            await apiClient.post(ENDPOINTS.AUTH.LOGOUT, {}, {
                showLoading: false
            })

            // Clear all caches
            this.cache.clearAll()

            return { success: true }
        } catch (error) {
            console.error('Logout error:', error)
            // Even if logout fails on server, clear local data
            this.cache.clearAll()
            return { success: true }
        }
    }

    async refreshToken() {
        try {
            const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH, {}, {
                showLoading: false,
                retry: false // Don't retry refresh token requests
            })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Token refresh failed'
            }
        }
    }

    // Profile methods
    async getCurrentUser() {
        const cacheKey = 'current-user'

        try {
            // Check cache first
            const cached = this.cache.get(cacheKey)
            if (cached) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.USERS.PROFILE('me'), {
                showLoading: false
            })

            const userData = response.data.data

            // Cache the result
            this.cache.set(cacheKey, userData, this.cacheTTL.profile)

            return {
                success: true,
                data: userData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy thông tin người dùng'
            }
        }
    }

    async getUserProfile(userId) {
        const cacheKey = `user-profile-${userId}`

        try {
            // Check cache first
            const cached = this.cache.get(cacheKey)
            if (cached) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.USERS.PROFILE(userId))

            const userData = response.data.data

            // Cache the result
            this.cache.set(cacheKey, userData, this.cacheTTL.profile)

            return {
                success: true,
                data: userData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy thông tin người dùng'
            }
        }
    }

    async updateProfile(userId, profileData) {
        try {
            const cleanData = this.sanitizeUserData(profileData)

            const response = await apiClient.put(ENDPOINTS.USERS.PROFILE(userId), cleanData, {
                showLoading: true
            })

            const updatedUser = response.data.data

            // Invalidate related caches
            this.cache.delete(`user-profile-${userId}`)
            this.cache.delete('current-user')

            return {
                success: true,
                data: updatedUser,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Cập nhật profile thất bại',
                errors: error.response?.data?.errors
            }
        }
    }

    async updateAvatar(userId, avatarFile) {
        try {
            const formData = new FormData()
            formData.append('avatar', avatarFile)

            const response = await apiClient.post(ENDPOINTS.UPLOAD.AVATAR, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                showLoading: true,
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
                    console.log(`Upload progress: ${percentCompleted}%`)
                }
            })

            // Invalidate profile caches
            this.cache.delete(`user-profile-${userId}`)
            this.cache.delete('current-user')

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Cập nhật avatar thất bại'
            }
        }
    }

    // User search and discovery
    async searchUsers(query, options = {}) {
        const cacheKey = `user-search-${query}-${JSON.stringify(options)}`

        try {
            // Check cache for search results
            const cached = this.cache.get(cacheKey)
            if (cached && query.length > 2) { // Only cache meaningful searches
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.USERS.SEARCH, {
                params: {
                    q: query.trim(),
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    filters: options.filters
                },
                showLoading: options.showLoading !== false
            })

            const searchResults = response.data.data

            // Cache results for meaningful searches
            if (query.length > 2) {
                this.cache.set(cacheKey, searchResults, this.cacheTTL.search)
            }

            return {
                success: true,
                data: searchResults
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Tìm kiếm thất bại'
            }
        }
    }

    // Followers/Following management
    async getFollowers(userId, options = {}) {
        const cacheKey = `user-followers-${userId}-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.USERS.FOLLOWERS(userId), {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0
                }
            })

            const followers = response.data.data
            this.cache.set(cacheKey, followers, this.cacheTTL.followers)

            return {
                success: true,
                data: followers
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy danh sách followers'
            }
        }
    }

    async getFollowing(userId, options = {}) {
        const cacheKey = `user-following-${userId}-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.USERS.FOLLOWING(userId), {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0
                }
            })

            const following = response.data.data
            this.cache.set(cacheKey, following, this.cacheTTL.following)

            return {
                success: true,
                data: following
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy danh sách following'
            }
        }
    }

    async followUser(userId) {
        try {
            const response = await apiClient.post(ENDPOINTS.USERS.FOLLOW(userId), {}, {
                showLoading: true
            })

            // Invalidate related caches
            this.invalidateFollowCaches(userId)

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể follow người dùng'
            }
        }
    }

    async unfollowUser(userId) {
        try {
            const response = await apiClient.delete(ENDPOINTS.USERS.FOLLOW(userId), {
                showLoading: true
            })

            // Invalidate related caches
            this.invalidateFollowCaches(userId)

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể unfollow người dùng'
            }
        }
    }

    // Block/Unblock users
    async blockUser(userId) {
        try {
            const response = await apiClient.post(ENDPOINTS.USERS.BLOCK(userId), {}, {
                showLoading: true
            })

            // Invalidate caches
            this.cache.delete(`user-profile-${userId}`)
            this.invalidateFollowCaches(userId)

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể block người dùng'
            }
        }
    }

    async unblockUser(userId) {
        try {
            const response = await apiClient.delete(ENDPOINTS.USERS.BLOCK(userId), {
                showLoading: true
            })

            // Invalidate caches
            this.cache.delete(`user-profile-${userId}`)

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể unblock người dùng'
            }
        }
    }

    // Status management
    async updateStatus(status) {
        try {
            const response = await apiClient.put(ENDPOINTS.USERS.STATUS('me'), {
                status: status.trim()
            })

            // Invalidate current user cache
            this.cache.delete('current-user')

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Cập nhật status thất bại'
            }
        }
    }

    // Utility methods
    sanitizeUserData(userData) {
        const sanitized = { ...userData }

        // Trim string fields
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'string') {
                sanitized[key] = sanitized[key].trim()
            }
        })

        // Remove empty fields
        Object.keys(sanitized).forEach(key => {
            if (sanitized[key] === '' || sanitized[key] == null) {
                delete sanitized[key]
            }
        })

        return sanitized
    }

    getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            timestamp: new Date().toISOString()
        }
    }

    invalidateFollowCaches(userId) {
        // Invalidate various follow-related caches
        const patterns = [
            `user-followers-${userId}`,
            `user-following-${userId}`,
            `user-profile-${userId}`,
            'current-user'
        ]

        patterns.forEach(pattern => {
            this.cache.deletePattern(pattern)
        })
    }

    // Batch operations for performance
    async getUsersBatch(userIds) {
        try {
            const response = await apiClient.post(ENDPOINTS.USERS.BATCH, {
                userIds
            })

            return {
                success: true,
                data: response.data.data
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy thông tin users'
            }
        }
    }

    // Prefetch user data for better UX
    async prefetchUser(userId) {
        if (!userId) return

        const cacheKey = `user-profile-${userId}`

        // Only prefetch if not already cached
        if (!this.cache.has(cacheKey)) {
            try {
                await this.getUserProfile(userId)
            } catch (error) {
                console.warn(`Failed to prefetch user ${userId}:`, error)
            }
        }
    }

    // Clear all user-related caches
    clearUserCaches() {
        this.cache.clearPattern('user-')
        this.cache.delete('current-user')
    }
}

// Export singleton instance
export const userService = new UserService()
export default userService