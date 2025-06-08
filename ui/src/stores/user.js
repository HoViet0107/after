// User management store với profile, social features và caching

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userService } from '@/api/services/userService'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'

export const useUserStore = defineStore('user', () => {
    // Dependencies
    const cache = useCacheStore()
    const toast = useToast()

    // State
    const users = ref(new Map()) // userId -> user data
    const profiles = ref(new Map()) // userId -> profile data
    const followers = ref(new Map()) // userId -> followers list
    const following = ref(new Map()) // userId -> following list
    const searchResults = ref([])
    const suggestedUsers = ref([])
    const blockedUsers = ref([])

    // Loading states
    const isLoading = ref(false)
    const loadingStates = ref(new Map()) // operation -> loading state

    // Pagination
    const pagination = ref({
        search: { page: 0, hasMore: true },
        followers: new Map(), // userId -> { page, hasMore }
        following: new Map(), // userId -> { page, hasMore }
        suggestions: { page: 0, hasMore: true }
    })

    // Search and filtering
    const searchQuery = ref('')
    const searchFilters = ref({
        location: '',
        interests: [],
        ageRange: null,
        verified: false
    })

    // Social features
    const followRequests = ref([]) // pending follow requests
    const mutualFriends = ref(new Map()) // userId -> mutual friends count
    const onlineUsers = ref(new Set()) // online user IDs

    // Computed
    const getUserById = computed(() => (userId) => {
        return users.value.get(userId) || profiles.value.get(userId)
    })

    const getProfileById = computed(() => (userId) => {
        return profiles.value.get(userId)
    })

    const getFollowersById = computed(() => (userId) => {
        return followers.value.get(userId) || []
    })

    const getFollowingById = computed(() => (userId) => {
        return following.value.get(userId) || []
    })

    const isUserOnline = computed(() => (userId) => {
        return onlineUsers.value.has(userId)
    })

    const getMutualFriendsCount = computed(() => (userId) => {
        return mutualFriends.value.get(userId) || 0
    })

    const filteredSearchResults = computed(() => {
        if (!searchResults.value.length) return []

        return searchResults.value.filter(user => {
            // Apply filters
            if (searchFilters.value.location &&
                !user.location?.toLowerCase().includes(searchFilters.value.location.toLowerCase())) {
                return false
            }

            if (searchFilters.value.verified && !user.verified) {
                return false
            }

            if (searchFilters.value.interests.length > 0) {
                const userInterests = user.interests || []
                const hasMatchingInterest = searchFilters.value.interests.some(
                    interest => userInterests.includes(interest)
                )
                if (!hasMatchingInterest) return false
            }

            if (searchFilters.value.ageRange) {
                const age = calculateAge(user.birthDate)
                const { min, max } = searchFilters.value.ageRange
                if (age < min || age > max) return false
            }

            return true
        })
    })

    const isOperationLoading = computed(() => (operation) => {
        return loadingStates.value.get(operation) || false
    })

    // Actions

    // Fetch user profile
    const fetchUserProfile = async (userId, options = {}) => {
        if (!userId) return { success: false, error: 'User ID is required' }

        const operationKey = `profile_${userId}`

        try {
            if (!options.forceRefresh) {
                // Check if already in store
                const existing = profiles.value.get(userId)
                if (existing) {
                    return { success: true, data: existing, fromCache: true }
                }
            }

            setOperationLoading(operationKey, true)

            const response = await userService.getUserProfile(userId)

            if (response.success) {
                // Store in both maps for easy access
                users.value.set(userId, response.data)
                profiles.value.set(userId, response.data)

                // Calculate mutual friends if not current user
                if (response.data.id !== getCurrentUserId()) {
                    calculateMutualFriends(userId)
                }

                return response
            } else {
                return response
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error)
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Update user profile
    const updateUserProfile = async (userId, profileData) => {
        const operationKey = `update_profile_${userId}`

        try {
            setOperationLoading(operationKey, true)

            const response = await userService.updateProfile(userId, profileData)

            if (response.success) {
                // Update in store
                users.value.set(userId, response.data)
                profiles.value.set(userId, response.data)

                toast.success('Cập nhật hồ sơ thành công!')
                return response
            } else {
                toast.error(response.error || 'Cập nhật hồ sơ thất bại')
                return response
            }
        } catch (error) {
            console.error('Failed to update profile:', error)
            toast.error('Có lỗi xảy ra khi cập nhật hồ sơ')
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Search users
    const searchUsers = async (query, options = {}) => {
        if (!query || query.trim().length < 2) {
            searchResults.value = []
            return { success: true, data: [] }
        }

        const operationKey = 'search_users'

        try {
            setOperationLoading(operationKey, true)
            searchQuery.value = query.trim()

            const response = await userService.searchUsers(query, {
                limit: options.limit || 20,
                offset: options.offset || 0,
                filters: searchFilters.value
            })

            if (response.success) {
                if (options.offset === 0) {
                    searchResults.value = response.data.users || []
                } else {
                    searchResults.value.push(...(response.data.users || []))
                }

                // Update pagination
                pagination.value.search = {
                    page: Math.floor((options.offset || 0) / (options.limit || 20)),
                    hasMore: response.data.hasMore || false
                }

                // Store users in main collection
                response.data.users?.forEach(user => {
                    users.value.set(user.id, user)
                })

                return response
            } else {
                return response
            }
        } catch (error) {
            console.error('Failed to search users:', error)
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Load more search results
    const loadMoreSearchResults = async () => {
        if (!searchQuery.value || !pagination.value.search.hasMore) return

        const nextOffset = (pagination.value.search.page + 1) * 20
        return await searchUsers(searchQuery.value, { offset: nextOffset })
    }

    // Follow user
    const followUser = async (userId) => {
        if (!userId) return { success: false, error: 'User ID is required' }

        const operationKey = `follow_${userId}`

        try {
            setOperationLoading(operationKey, true)

            const response = await userService.followUser(userId)

            if (response.success) {
                // Update user's follower count
                const user = users.value.get(userId)
                if (user) {
                    user.followersCount = (user.followersCount || 0) + 1
                    user.isFollowing = true
                    users.value.set(userId, user)
                }

                // Add to following list of current user
                const currentUserId = getCurrentUserId()
                if (currentUserId) {
                    const currentUserFollowing = following.value.get(currentUserId) || []
                    if (!currentUserFollowing.find(u => u.id === userId)) {
                        currentUserFollowing.unshift({ id: userId, ...user })
                        following.value.set(currentUserId, currentUserFollowing)
                    }
                }

                toast.success('Đã theo dõi người dùng')
                return response
            } else {
                toast.error(response.error || 'Không thể theo dõi người dùng')
                return response
            }
        } catch (error) {
            console.error('Failed to follow user:', error)
            toast.error('Có lỗi xảy ra khi theo dõi người dùng')
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Unfollow user
    const unfollowUser = async (userId) => {
        if (!userId) return { success: false, error: 'User ID is required' }

        const operationKey = `unfollow_${userId}`

        try {
            setOperationLoading(operationKey, true)

            const response = await userService.unfollowUser(userId)

            if (response.success) {
                // Update user's follower count
                const user = users.value.get(userId)
                if (user) {
                    user.followersCount = Math.max((user.followersCount || 1) - 1, 0)
                    user.isFollowing = false
                    users.value.set(userId, user)
                }

                // Remove from following list
                const currentUserId = getCurrentUserId()
                if (currentUserId) {
                    const currentUserFollowing = following.value.get(currentUserId) || []
                    const updatedFollowing = currentUserFollowing.filter(u => u.id !== userId)
                    following.value.set(currentUserId, updatedFollowing)
                }

                toast.success('Đã bỏ theo dõi người dùng')
                return response
            } else {
                toast.error(response.error || 'Không thể bỏ theo dõi người dùng')
                return response
            }
        } catch (error) {
            console.error('Failed to unfollow user:', error)
            toast.error('Có lỗi xảy ra khi bỏ theo dõi người dùng')
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Get followers
    const fetchFollowers = async (userId, options = {}) => {
        if (!userId) return { success: false, error: 'User ID is required' }

        const operationKey = `followers_${userId}`

        try {
            setOperationLoading(operationKey, true)

            const response = await userService.getFollowers(userId, options)

            if (response.success) {
                if (options.offset === 0) {
                    followers.value.set(userId, response.data.users || [])
                } else {
                    const existing = followers.value.get(userId) || []
                    followers.value.set(userId, [...existing, ...(response.data.users || [])])
                }

                // Update pagination
                const currentPagination = pagination.value.followers.get(userId) || {}
                pagination.value.followers.set(userId, {
                    page: Math.floor((options.offset || 0) / (options.limit || 20)),
                    hasMore: response.data.hasMore || false
                })

                // Store users
                response.data.users?.forEach(user => {
                    users.value.set(user.id, user)
                })

                return response
            } else {
                return response
            }
        } catch (error) {
            console.error('Failed to fetch followers:', error)
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Get following
    const fetchFollowing = async (userId, options = {}) => {
        if (!userId) return { success: false, error: 'User ID is required' }

        const operationKey = `following_${userId}`

        try {
            setOperationLoading(operationKey, true)

            const response = await userService.getFollowing(userId, options)

            if (response.success) {
                if (options.offset === 0) {
                    following.value.set(userId, response.data.users || [])
                } else {
                    const existing = following.value.get(userId) || []
                    following.value.set(userId, [...existing, ...(response.data.users || [])])
                }

                // Update pagination
                pagination.value.following.set(userId, {
                    page: Math.floor((options.offset || 0) / (options.limit || 20)),
                    hasMore: response.data.hasMore || false
                })

                // Store users
                response.data.users?.forEach(user => {
                    users.value.set(user.id, user)
                })

                return response
            } else {
                return response
            }
        } catch (error) {
            console.error('Failed to fetch following:', error)
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Block user
    const blockUser = async (userId) => {
        if (!userId) return { success: false, error: 'User ID is required' }

        const operationKey = `block_${userId}`

        try {
            setOperationLoading(operationKey, true)

            const response = await userService.blockUser(userId)

            if (response.success) {
                // Add to blocked users
                const user = users.value.get(userId)
                if (user && !blockedUsers.value.find(u => u.id === userId)) {
                    blockedUsers.value.push(user)
                }

                // Remove from followers/following
                removeUserFromSocialLists(userId)

                toast.success('Đã chặn người dùng')
                return response
            } else {
                toast.error(response.error || 'Không thể chặn người dùng')
                return response
            }
        } catch (error) {
            console.error('Failed to block user:', error)
            toast.error('Có lỗi xảy ra khi chặn người dùng')
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Unblock user
    const unblockUser = async (userId) => {
        if (!userId) return { success: false, error: 'User ID is required' }

        const operationKey = `unblock_${userId}`

        try {
            setOperationLoading(operationKey, true)

            const response = await userService.unblockUser(userId)

            if (response.success) {
                // Remove from blocked users
                blockedUsers.value = blockedUsers.value.filter(user => user.id !== userId)

                toast.success('Đã bỏ chặn người dùng')
                return response
            } else {
                toast.error(response.error || 'Không thể bỏ chặn người dùng')
                return response
            }
        } catch (error) {
            console.error('Failed to unblock user:', error)
            toast.error('Có lỗi xảy ra khi bỏ chặn người dùng')
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Get suggested users
    const fetchSuggestedUsers = async (options = {}) => {
        const operationKey = 'suggested_users'

        try {
            setOperationLoading(operationKey, true)

            // This would call a suggestions API endpoint
            const response = await userService.getSuggestedUsers(options)

            if (response.success) {
                if (options.offset === 0) {
                    suggestedUsers.value = response.data.users || []
                } else {
                    suggestedUsers.value.push(...(response.data.users || []))
                }

                // Update pagination
                pagination.value.suggestions = {
                    page: Math.floor((options.offset || 0) / (options.limit || 20)),
                    hasMore: response.data.hasMore || false
                }

                // Store users
                response.data.users?.forEach(user => {
                    users.value.set(user.id, user)
                })

                return response
            } else {
                return response
            }
        } catch (error) {
            console.error('Failed to fetch suggested users:', error)
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Utility functions
    const setOperationLoading = (operation, loading) => {
        if (loading) {
            loadingStates.value.set(operation, true)
        } else {
            loadingStates.value.delete(operation)
        }
    }

    const getCurrentUserId = () => {
        // Get from auth store
        const { useAuthStore } = require('@/stores/auth')
        const authStore = useAuthStore()
        return authStore.user?.id
    }

    const calculateAge = (birthDate) => {
        if (!birthDate) return null
        const today = new Date()
        const birth = new Date(birthDate)
        let age = today.getFullYear() - birth.getFullYear()
        const monthDiff = today.getMonth() - birth.getMonth()
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--
        }
        return age
    }

    const calculateMutualFriends = async (userId) => {
        try {
            // This would be an API call to get mutual friends
            const response = await userService.getMutualFriends(userId)
            if (response.success) {
                mutualFriends.value.set(userId, response.data.count)
            }
        } catch (error) {
            console.warn('Failed to calculate mutual friends:', error)
        }
    }

    const removeUserFromSocialLists = (userId) => {
        // Remove from all following/followers lists
        followers.value.forEach((followersList, key) => {
            followers.value.set(key, followersList.filter(user => user.id !== userId))
        })

        following.value.forEach((followingList, key) => {
            following.value.set(key, followingList.filter(user => user.id !== userId))
        })

        // Remove from search results
        searchResults.value = searchResults.value.filter(user => user.id !== userId)

        // Remove from suggestions
        suggestedUsers.value = suggestedUsers.value.filter(user => user.id !== userId)
    }

    // Real-time updates
    const handleUserOnline = (userId) => {
        onlineUsers.value.add(userId)
    }

    const handleUserOffline = (userId) => {
        onlineUsers.value.delete(userId)
    }

    const handleUserUpdated = (userData) => {
        users.value.set(userData.id, userData)
        profiles.value.set(userData.id, userData)
    }

    // Clear/reset functions
    const clearSearchResults = () => {
        searchResults.value = []
        searchQuery.value = ''
        pagination.value.search = { page: 0, hasMore: true }
    }

    const clearUserData = (userId) => {
        users.value.delete(userId)
        profiles.value.delete(userId)
        followers.value.delete(userId)
        following.value.delete(userId)
        mutualFriends.value.delete(userId)
        onlineUsers.value.delete(userId)
    }

    const clearAllData = () => {
        users.value.clear()
        profiles.value.clear()
        followers.value.clear()
        following.value.clear()
        searchResults.value = []
        suggestedUsers.value = []
        blockedUsers.value = []
        followRequests.value = []
        mutualFriends.value.clear()
        onlineUsers.value.clear()
        loadingStates.value.clear()
        searchQuery.value = ''
    }

    // Batch operations
    const fetchUsersBatch = async (userIds) => {
        try {
            const response = await userService.getUsersBatch(userIds)

            if (response.success) {
                response.data.forEach(user => {
                    users.value.set(user.id, user)
                })
            }

            return response
        } catch (error) {
            console.error('Failed to fetch users batch:', error)
            return { success: false, error: error.message }
        }
    }

    // Prefetch user data
    const prefetchUser = async (userId) => {
        if (!userId || users.value.has(userId)) return

        try {
            await userService.prefetchUser(userId)
        } catch (error) {
            console.warn('Failed to prefetch user:', error)
        }
    }

    return {
        // State
        users: computed(() => users.value),
        profiles: computed(() => profiles.value),
        searchResults: computed(() => filteredSearchResults.value),
        suggestedUsers: computed(() => suggestedUsers.value),
        blockedUsers: computed(() => blockedUsers.value),
        searchQuery: computed(() => searchQuery.value),
        searchFilters: computed(() => searchFilters.value),
        isLoading: computed(() => isLoading.value),

        // Getters
        getUserById,
        getProfileById,
        getFollowersById,
        getFollowingById,
        isUserOnline,
        getMutualFriendsCount,
        isOperationLoading,

        // Actions
        fetchUserProfile,
        updateUserProfile,
        searchUsers,
        loadMoreSearchResults,
        followUser,
        unfollowUser,
        fetchFollowers,
        fetchFollowing,
        blockUser,
        unblockUser,
        fetchSuggestedUsers,
        fetchUsersBatch,
        prefetchUser,

        // Real-time handlers
        handleUserOnline,
        handleUserOffline,
        handleUserUpdated,

        // Utilities
        clearSearchResults,
        clearUserData,
        clearAllData
    }
})