// Feed management store với AI algorithm, infinite scroll và real-time updates

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { feedService } from '@/api/services/feedService'
import { useCacheStore } from '@/stores/cache'
import { useWebSocket } from '@/composables/useWebSocket'
import { useToast } from 'vue-toastification'

export const useFeedStore = defineStore('feed', () => {
    // Dependencies
    const cache = useCacheStore()
    const websocket = useWebSocket()
    const toast = useToast()

    // State
    const feeds = ref(new Map()) // feedType -> posts array
    const feedMetadata = ref(new Map()) // feedType -> metadata
    const trendingContent = ref([])
    const discoveryContent = ref([])
    const hashtagFeeds = ref(new Map()) // hashtag -> posts
    const userFeeds = ref(new Map()) // userId -> posts

    // Loading states
    const isLoading = ref(false)
    const loadingStates = ref(new Map()) // operation -> loading state
    const refreshingStates = ref(new Map()) // feedType -> refreshing state

    // Pagination and infinite scroll
    const pagination = ref(new Map()) // feedType -> { page, hasMore, loading }
    const feedCursors = ref(new Map()) // feedType -> cursor for pagination

    // Feed configuration
    const feedTypes = {
        HOME: 'home',
        FOLLOWING: 'following',
        TRENDING: 'trending',
        DISCOVERY: 'discovery',
        FRESH: 'fresh'
    }

    const currentFeedType = ref(feedTypes.HOME)
    const feedAlgorithm = ref('smart_feed') // smart_feed, chronological, engagement_based
    const feedFilters = ref({
        mediaOnly: false,
        verified: false,
        timeRange: 'all', // today, week, month, all
        categories: []
    })

    // Real-time updates
    const newContentAvailable = ref(new Map()) // feedType -> boolean
    const realTimeUpdates = ref(true)
    const lastFetchTime = ref(new Map()) // feedType -> timestamp

    // Computed
    const getCurrentFeed = computed(() => {
        return feeds.value.get(currentFeedType.value) || []
    })

    const getCurrentFeedMetadata = computed(() => {
        return feedMetadata.value.get(currentFeedType.value) || {}
    })

    const getCurrentPagination = computed(() => {
        return pagination.value.get(currentFeedType.value) || { page: 0, hasMore: true, loading: false }
    })

    const isCurrentFeedLoading = computed(() => {
        return loadingStates.value.get(`feed_${currentFeedType.value}`) || false
    })

    const isCurrentFeedRefreshing = computed(() => {
        return refreshingStates.value.get(currentFeedType.value) || false
    })

    const hasNewContent = computed(() => {
        return newContentAvailable.value.get(currentFeedType.value) || false
    })

    const filteredCurrentFeed = computed(() => {
        let feed = getCurrentFeed.value

        // Apply filters
        if (feedFilters.value.mediaOnly) {
            feed = feed.filter(post => post.mediaCount > 0)
        }

        if (feedFilters.value.verified) {
            feed = feed.filter(post => post.author?.verified)
        }

        if (feedFilters.value.timeRange !== 'all') {
            const now = Date.now()
            const timeRanges = {
                today: 24 * 60 * 60 * 1000,
                week: 7 * 24 * 60 * 60 * 1000,
                month: 30 * 24 * 60 * 60 * 1000
            }

            const cutoff = now - timeRanges[feedFilters.value.timeRange]
            feed = feed.filter(post => new Date(post.createdAt).getTime() > cutoff)
        }

        if (feedFilters.value.categories.length > 0) {
            feed = feed.filter(post =>
                feedFilters.value.categories.some(category => post.categories?.includes(category))
            )
        }

        return feed
    })

    const getFeedByType = computed(() => (feedType) => {
        return feeds.value.get(feedType) || []
    })

    const getHashtagFeed = computed(() => (hashtag) => {
        return hashtagFeeds.value.get(hashtag) || []
    })

    const getUserFeed = computed(() => (userId) => {
        return userFeeds.value.get(userId) || []
    })

    const isOperationLoading = computed(() => (operation) => {
        return loadingStates.value.get(operation) || false
    })

    // Actions

    // Fetch feed content
    const fetchFeed = async (feedType = currentFeedType.value, options = {}) => {
        const operationKey = `feed_${feedType}`

        try {
            setOperationLoading(operationKey, true)

            // Set pagination loading
            const currentPagination = pagination.value.get(feedType) || {}
            pagination.value.set(feedType, { ...currentPagination, loading: true })

            const fetchOptions = {
                algorithm: feedAlgorithm.value,
                limit: options.limit || 20,
                offset: options.offset || 0,
                cursor: feedCursors.value.get(feedType),
                type: feedType,
                forceRefresh: options.forceRefresh || false,
                ...options
            }

            let response

            switch (feedType) {
                case feedTypes.TRENDING:
                    response = await feedService.getTrendingFeed(fetchOptions)
                    break
                case feedTypes.DISCOVERY:
                    response = await feedService.getDiscoveryFeed(fetchOptions)
                    break
                default:
                    response = await feedService.getFeedPosts(fetchOptions)
            }

            if (response.success) {
                const newPosts = response.data.posts || []
                const metadata = response.data.meta || {}

                // Handle pagination
                if (options.offset === 0 || options.forceRefresh) {
                    // Replace feed
                    feeds.value.set(feedType, newPosts)
                } else {
                    // Append to existing feed
                    const existingPosts = feeds.value.get(feedType) || []
                    const mergedPosts = mergePosts(existingPosts, newPosts)
                    feeds.value.set(feedType, mergedPosts)
                }

                // Update metadata
                feedMetadata.value.set(feedType, metadata)

                // Update pagination
                pagination.value.set(feedType, {
                    page: Math.floor((options.offset || 0) / (options.limit || 20)),
                    hasMore: metadata.hasMore !== false,
                    loading: false
                })

                // Update cursor for pagination
                if (metadata.nextCursor) {
                    feedCursors.value.set(feedType, metadata.nextCursor)
                }

                // Update last fetch time
                lastFetchTime.value.set(feedType, Date.now())

                // Clear new content indicator if refreshing
                if (options.forceRefresh) {
                    newContentAvailable.value.set(feedType, false)
                }

                return response
            } else {
                return response
            }
        } catch (error) {
            console.error(`Failed to fetch ${feedType} feed:`, error)
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)

            // Clear pagination loading
            const currentPagination = pagination.value.get(feedType) || {}
            pagination.value.set(feedType, { ...currentPagination, loading: false })
        }
    }

    // Load more content (infinite scroll)
    const loadMoreFeed = async (feedType = currentFeedType.value) => {
        const paginationInfo = pagination.value.get(feedType) || {}

        if (!paginationInfo.hasMore || paginationInfo.loading) {
            return { success: false, error: 'No more content or already loading' }
        }

        const currentFeed = feeds.value.get(feedType) || []
        const nextOffset = currentFeed.length

        return await fetchFeed(feedType, { offset: nextOffset })
    }

    // Refresh feed
    const refreshFeed = async (feedType = currentFeedType.value, showToast = true) => {
        try {
            refreshingStates.value.set(feedType, true)

            const response = await fetchFeed(feedType, {
                forceRefresh: true,
                offset: 0
            })

            if (response.success && showToast) {
                toast.success('Đã cập nhật feed mới!')
            }

            return response
        } catch (error) {
            console.error('Failed to refresh feed:', error)
            if (showToast) {
                toast.error('Không thể cập nhật feed')
            }
            return { success: false, error: error.message }
        } finally {
            refreshingStates.value.set(feedType, false)
        }
    }

    // Fetch hashtag feed
    const fetchHashtagFeed = async (hashtag, options = {}) => {
        const operationKey = `hashtag_${hashtag}`

        try {
            setOperationLoading(operationKey, true)

            const response = await feedService.getPostsByHashtag(hashtag, options)

            if (response.success) {
                const posts = response.data.posts || []

                if (options.offset === 0) {
                    hashtagFeeds.value.set(hashtag, posts)
                } else {
                    const existing = hashtagFeeds.value.get(hashtag) || []
                    hashtagFeeds.value.set(hashtag, mergePosts(existing, posts))
                }

                return response
            } else {
                return response
            }
        } catch (error) {
            console.error(`Failed to fetch hashtag feed for #${hashtag}:`, error)
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Fetch user feed
    const fetchUserFeed = async (userId, options = {}) => {
        const operationKey = `user_feed_${userId}`

        try {
            setOperationLoading(operationKey, true)

            const response = await feedService.getUserFeed(userId, options)

            if (response.success) {
                const posts = response.data.posts || []

                if (options.offset === 0) {
                    userFeeds.value.set(userId, posts)
                } else {
                    const existing = userFeeds.value.get(userId) || []
                    userFeeds.value.set(userId, mergePosts(existing, posts))
                }

                return response
            } else {
                return response
            }
        } catch (error) {
            console.error(`Failed to fetch user feed for ${userId}:`, error)
            return { success: false, error: error.message }
        } finally {
            setOperationLoading(operationKey, false)
        }
    }

    // Switch feed type
    const switchFeedType = async (feedType) => {
        if (feedType === currentFeedType.value) return

        currentFeedType.value = feedType

        // Load feed if not already loaded
        const existingFeed = feeds.value.get(feedType)
        if (!existingFeed || existingFeed.length === 0) {
            await fetchFeed(feedType)
        }
    }

    // Update feed algorithm
    const updateFeedAlgorithm = async (algorithm) => {
        if (algorithm === feedAlgorithm.value) return

        feedAlgorithm.value = algorithm

        // Refresh current feed with new algorithm
        await refreshFeed(currentFeedType.value, false)
    }

    // Update feed filters
    const updateFeedFilters = (newFilters) => {
        feedFilters.value = { ...feedFilters.value, ...newFilters }
    }

    // Add new post to feed
    const addPostToFeed = (post, feedType = feedTypes.HOME) => {
        const currentFeed = feeds.value.get(feedType) || []
        const updatedFeed = [post, ...currentFeed]
        feeds.value.set(feedType, updatedFeed)
    }

    // Update post in feeds
    const updatePostInFeeds = (postId, updates) => {
        feeds.value.forEach((feed, feedType) => {
            const postIndex = feed.findIndex(post => post.id === postId)
            if (postIndex !== -1) {
                feed[postIndex] = { ...feed[postIndex], ...updates }
                feeds.value.set(feedType, [...feed])
            }
        })

        // Update in hashtag feeds
        hashtagFeeds.value.forEach((feed, hashtag) => {
            const postIndex = feed.findIndex(post => post.id === postId)
            if (postIndex !== -1) {
                feed[postIndex] = { ...feed[postIndex], ...updates }
                hashtagFeeds.value.set(hashtag, [...feed])
            }
        })

        // Update in user feeds
        userFeeds.value.forEach((feed, userId) => {
            const postIndex = feed.findIndex(post => post.id === postId)
            if (postIndex !== -1) {
                feed[postIndex] = { ...feed[postIndex], ...updates }
                userFeeds.value.set(userId, [...feed])
            }
        })
    }

    // Remove post from feeds
    const removePostFromFeeds = (postId) => {
        feeds.value.forEach((feed, feedType) => {
            const filteredFeed = feed.filter(post => post.id !== postId)
            feeds.value.set(feedType, filteredFeed)
        })

        hashtagFeeds.value.forEach((feed, hashtag) => {
            const filteredFeed = feed.filter(post => post.id !== postId)
            hashtagFeeds.value.set(hashtag, filteredFeed)
        })

        userFeeds.value.forEach((feed, userId) => {
            const filteredFeed = feed.filter(post => post.id !== postId)
            userFeeds.value.set(userId, filteredFeed)
        })
    }

    // Handle real-time updates
    const handleNewPost = (post) => {
        if (!realTimeUpdates.value) return

        // Add to appropriate feeds
        if (post.isPublic) {
            newContentAvailable.value.set(feedTypes.HOME, true)
            newContentAvailable.value.set(feedTypes.TRENDING, true)
        }

        // Add to hashtag feeds
        if (post.hashtags) {
            post.hashtags.forEach(hashtag => {
                if (hashtagFeeds.value.has(hashtag)) {
                    const feed = hashtagFeeds.value.get(hashtag)
                    hashtagFeeds.value.set(hashtag, [post, ...feed])
                }
            })
        }

        // Add to user feed
        if (userFeeds.value.has(post.authorId)) {
            const feed = userFeeds.value.get(post.authorId)
            userFeeds.value.set(post.authorId, [post, ...feed])
        }
    }

    const handlePostUpdate = (postData) => {
        updatePostInFeeds(postData.id, postData)
    }

    const handlePostDelete = (postId) => {
        removePostFromFeeds(postId)
    }

    const handlePostLike = (postId, userId, isLiked) => {
        const updates = {
            isLiked,
            likesCount: isLiked ?
                (getCurrentPost(postId)?.likesCount || 0) + 1 :
                Math.max((getCurrentPost(postId)?.likesCount || 1) - 1, 0)
        }
        updatePostInFeeds(postId, updates)
    }

    // Utility functions
    const setOperationLoading = (operation, loading) => {
        if (loading) {
            loadingStates.value.set(operation, true)
        } else {
            loadingStates.value.delete(operation)
        }
    }

    const mergePosts = (existingPosts, newPosts) => {
        const existingIds = new Set(existingPosts.map(post => post.id))
        const uniqueNewPosts = newPosts.filter(post => !existingIds.has(post.id))
        return [...existingPosts, ...uniqueNewPosts]
    }

    const getCurrentPost = (postId) => {
        const currentFeed = getCurrentFeed.value
        return currentFeed.find(post => post.id === postId)
    }

    const getPostFromAnyFeed = (postId) => {
        // Search in all feeds
        for (const [feedType, feed] of feeds.value) {
            const post = feed.find(p => p.id === postId)
            if (post) return post
        }

        // Search in hashtag feeds
        for (const [hashtag, feed] of hashtagFeeds.value) {
            const post = feed.find(p => p.id === postId)
            if (post) return post
        }

        // Search in user feeds
        for (const [userId, feed] of userFeeds.value) {
            const post = feed.find(p => p.id === postId)
            if (post) return post
        }

        return null
    }

    // Performance optimization
    const preloadAdjacentContent = async () => {
        const currentFeed = getCurrentFeed.value
        if (currentFeed.length > 15) { // Start preloading when near end
            await loadMoreFeed()
        }
    }

    // Analytics and insights
    const trackFeedEngagement = (action, postId, metadata = {}) => {
        // Track user engagement with feed content
        // This would integrate with analytics service
        console.log('Feed engagement:', { action, postId, feedType: currentFeedType.value, ...metadata })
    }

    const getFeedInsights = () => {
        return {
            currentFeedType: currentFeedType.value,
            currentAlgorithm: feedAlgorithm.value,
            totalPosts: getCurrentFeed.value.length,
            lastUpdated: lastFetchTime.value.get(currentFeedType.value),
            hasNewContent: hasNewContent.value,
            filters: feedFilters.value
        }
    }

    // Setup real-time listeners
    const setupRealTimeListeners = () => {
        websocket.on('post:created', handleNewPost)
        websocket.on('post:updated', handlePostUpdate)
        websocket.on('post:deleted', handlePostDelete)
        websocket.on('post:liked', (data) => handlePostLike(data.postId, data.userId, true))
        websocket.on('post:unliked', (data) => handlePostLike(data.postId, data.userId, false))
    }

    // Clear functions
    const clearFeed = (feedType) => {
        feeds.value.delete(feedType)
        feedMetadata.value.delete(feedType)
        pagination.value.delete(feedType)
        feedCursors.value.delete(feedType)
        newContentAvailable.value.delete(feedType)
        lastFetchTime.value.delete(feedType)
    }

    const clearAllFeeds = () => {
        feeds.value.clear()
        feedMetadata.value.clear()
        hashtagFeeds.value.clear()
        userFeeds.value.clear()
        pagination.value.clear()
        feedCursors.value.clear()
        newContentAvailable.value.clear()
        lastFetchTime.value.clear()
        loadingStates.value.clear()
        refreshingStates.value.clear()
    }

    const clearHashtagFeed = (hashtag) => {
        hashtagFeeds.value.delete(hashtag)
    }

    const clearUserFeed = (userId) => {
        userFeeds.value.delete(userId)
    }

    // Initialize
    const initialize = () => {
        setupRealTimeListeners()
        // Load initial feed
        fetchFeed(currentFeedType.value)
    }

    return {
        // State
        feeds: computed(() => feeds.value),
        currentFeedType: computed(() => currentFeedType.value),
        feedAlgorithm: computed(() => feedAlgorithm.value),
        feedFilters: computed(() => feedFilters.value),
        realTimeUpdates: computed(() => realTimeUpdates.value),

        // Getters
        getCurrentFeed,
        getCurrentFeedMetadata,
        getCurrentPagination,
        isCurrentFeedLoading,
        isCurrentFeedRefreshing,
        hasNewContent,
        filteredCurrentFeed,
        getFeedByType,
        getHashtagFeed,
        getUserFeed,
        isOperationLoading,

        // Actions
        fetchFeed,
        loadMoreFeed,
        refreshFeed,
        fetchHashtagFeed,
        fetchUserFeed,
        switchFeedType,
        updateFeedAlgorithm,
        updateFeedFilters,
        addPostToFeed,
        updatePostInFeeds,
        removePostFromFeeds,

        // Real-time handlers
        handleNewPost,
        handlePostUpdate,
        handlePostDelete,
        handlePostLike,

        // Utilities
        preloadAdjacentContent,
        trackFeedEngagement,
        getFeedInsights,
        clearFeed,
        clearAllFeeds,
        clearHashtagFeed,
        clearUserFeed,
        initialize,

        // Constants
        feedTypes
    }
})