// Feed API calls với AI-powered algorithms và real-time updates

import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { useCacheStore } from '@/stores/cache'
import { useWebSocket } from '@/composables/useWebSocket'

class FeedService {
    constructor() {
        this.cache = useCacheStore()
        this.websocket = useWebSocket()
        this.cacheTTL = {
            homeFeed: 2 * 60 * 1000,      // 2 minutes
            trending: 10 * 60 * 1000,     // 10 minutes
            discover: 5 * 60 * 1000,      // 5 minutes
            hashtag: 5 * 60 * 1000,       // 5 minutes
            userFeed: 3 * 60 * 1000       // 3 minutes
        }

        // Feed algorithms configuration
        this.algorithms = {
            default: 'smart_feed',
            chronological: 'time_based',
            trending: 'engagement_based',
            discovery: 'interest_based',
            personalized: 'ai_recommendation'
        }

        this.setupRealTimeUpdates()
    }

    setupRealTimeUpdates() {
        // Listen for feed updates
        this.websocket.on('feed:new_content', (data) => {
            this.handleNewContent(data)
        })

        this.websocket.on('feed:trending_update', (trendingData) => {
            this.handleTrendingUpdate(trendingData)
        })

        this.websocket.on('feed:personalized_update', (userId, recommendations) => {
            this.handlePersonalizedUpdate(userId, recommendations)
        })
    }

    // Home feed with smart algorithm
    async getHomeFeed(options = {}) {
        const cacheKey = `home-feed-${JSON.stringify(options)}`

        try {
            // Check cache for non-fresh requests
            if (options.algorithm !== 'fresh' && !options.forceRefresh) {
                const cached = this.cache.get(cacheKey)
                if (cached) {
                    return { success: true, data: cached, fromCache: true }
                }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.HOME, {
                params: {
                    algorithm: options.algorithm || this.algorithms.default,
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    includeStories: options.includeStories || false,
                    includeAds: options.includeAds || true,
                    freshness: options.freshness || 'balanced', // fresh, balanced, diverse
                    personalization: options.personalization || 'high' // low, medium, high
                }
            })

            const feedData = response.data.data

            // Process feed data
            const processedFeed = this.processFeedData(feedData, options)

            // Cache with appropriate TTL based on algorithm
            const ttl = this.getCacheTTL(options.algorithm)
            this.cache.set(cacheKey, processedFeed, ttl)

            return {
                success: true,
                data: processedFeed
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy feed'
            }
        }
    }

    // Trending content feed
    async getTrendingFeed(options = {}) {
        const cacheKey = `trending-feed-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.TRENDING, {
                params: {
                    timeframe: options.timeframe || '24h', // 1h, 6h, 24h, 7d
                    category: options.category || 'all', // all, tech, sports, entertainment, etc.
                    location: options.location || 'global', // global, local, country
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    minEngagement: options.minEngagement || 10
                }
            })

            const trendingData = response.data.data

            // Add trending metadata
            const processedData = {
                ...trendingData,
                trendingScore: this.calculateTrendingScores(trendingData.posts),
                lastUpdated: new Date().toISOString(),
                algorithm: 'trending'
            }

            this.cache.set(cacheKey, processedData, this.cacheTTL.trending)

            return {
                success: true,
                data: processedData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy trending feed'
            }
        }
    }

    // Discovery feed - content from non-following users
    async getDiscoveryFeed(options = {}) {
        const cacheKey = `discovery-feed-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.DISCOVERY, {
                params: {
                    interests: options.interests || [], // User's interests
                    algorithm: options.algorithm || this.algorithms.discovery,
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    diversityLevel: options.diversityLevel || 'medium', // low, medium, high
                    includePopular: options.includePopular || true,
                    excludeViewed: options.excludeViewed || true
                }
            })

            const discoveryData = response.data.data

            // Add discovery metadata
            const processedData = {
                ...discoveryData,
                diversityScore: this.calculateDiversityScore(discoveryData.posts),
                recommendationReasons: this.getRecommendationReasons(discoveryData.posts),
                algorithm: 'discovery'
            }

            this.cache.set(cacheKey, processedData, this.cacheTTL.discover)

            return {
                success: true,
                data: processedData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy discovery feed'
            }
        }
    }

    // User-specific feed
    async getUserFeed(userId, options = {}) {
        const cacheKey = `user-feed-${userId}-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.USER(userId), {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    includeShares: options.includeShares || true,
                    includeReplies: options.includeReplies || false,
                    mediaOnly: options.mediaOnly || false,
                    sortBy: options.sortBy || 'createdAt'
                }
            })

            const userFeedData = response.data.data

            this.cache.set(cacheKey, userFeedData, this.cacheTTL.userFeed)

            return {
                success: true,
                data: userFeedData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy feed của người dùng'
            }
        }
    }

    // Hashtag feed
    async getHashtagFeed(hashtag, options = {}) {
        const cacheKey = `hashtag-feed-${hashtag}-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.HASHTAG(hashtag), {
                params: {
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    sortBy: options.sortBy || 'trending', // trending, recent, popular
                    timeframe: options.timeframe || '7d',
                    includeRelated: options.includeRelated || true
                }
            })

            const hashtagData = response.data.data

            // Add hashtag analytics
            const processedData = {
                ...hashtagData,
                hashtagStats: this.calculateHashtagStats(hashtagData.posts, hashtag),
                relatedHashtags: this.extractRelatedHashtags(hashtagData.posts),
                trendingScore: this.calculateHashtagTrending(hashtag)
            }

            this.cache.set(cacheKey, processedData, this.cacheTTL.hashtag)

            return {
                success: true,
                data: processedData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || `Không thể lấy feed cho hashtag #${hashtag}`
            }
        }
    }

    // Location-based feed
    async getLocationFeed(location, options = {}) {
        const cacheKey = `location-feed-${JSON.stringify(location)}-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.LOCATION, {
                params: {
                    latitude: location.lat,
                    longitude: location.lng,
                    radius: options.radius || 10, // km
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    sortBy: options.sortBy || 'distance'
                }
            })

            const locationData = response.data.data

            return {
                success: true,
                data: locationData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy feed theo vị trí'
            }
        }
    }

    // Stories feed
    async getStoriesFeed(options = {}) {
        const cacheKey = `stories-feed-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.STORIES, {
                params: {
                    limit: options.limit || 50,
                    includeViewed: options.includeViewed || false,
                    sortBy: options.sortBy || 'recent'
                }
            })

            const storiesData = response.data.data

            // Process stories with expiry info
            const processedStories = this.processStoriesData(storiesData)

            // Short cache for stories
            this.cache.set(cacheKey, processedStories, 1 * 60 * 1000) // 1 minute

            return {
                success: true,
                data: processedStories
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy stories'
            }
        }
    }

    // Search feed
    async searchFeed(query, options = {}) {
        try {
            const response = await apiClient.get(ENDPOINTS.FEED.SEARCH, {
                params: {
                    q: query.trim(),
                    type: options.type || 'all', // all, posts, users, hashtags
                    limit: options.limit || 20,
                    offset: options.offset || 0,
                    sortBy: options.sortBy || 'relevance',
                    filters: options.filters || {}
                }
            })

            const searchResults = response.data.data

            // Add search metadata
            const processedResults = {
                ...searchResults,
                query,
                searchTime: new Date().toISOString(),
                suggestions: this.generateSearchSuggestions(query, searchResults)
            }

            return {
                success: true,
                data: processedResults
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Tìm kiếm thất bại'
            }
        }
    }

    // Update feed preferences
    async updateFeedPreferences(preferences) {
        try {
            const response = await apiClient.put(ENDPOINTS.FEED.PREFERENCES, preferences, {
                showLoading: true
            })

            // Clear feed caches to reflect new preferences
            this.clearFeedCaches()

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể cập nhật preferences'
            }
        }
    }

    // Report content quality issues
    async reportFeedQuality(feedId, issues) {
        try {
            const response = await apiClient.post(ENDPOINTS.FEED.REPORT_QUALITY, {
                feedId,
                issues,
                timestamp: new Date().toISOString()
            })

            return {
                success: true,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể gửi báo cáo'
            }
        }
    }

    // Analytics and insights
    async getFeedAnalytics(timeframe = '7d') {
        const cacheKey = `feed-analytics-${timeframe}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.ANALYTICS, {
                params: { timeframe }
            })

            const analyticsData = response.data.data

            // Cache for longer as analytics change slowly
            this.cache.set(cacheKey, analyticsData, 30 * 60 * 1000) // 30 minutes

            return {
                success: true,
                data: analyticsData
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy analytics'
            }
        }
    }

    // AI-powered recommendations
    async getPersonalizedRecommendations(options = {}) {
        const cacheKey = `ai-recommendations-${JSON.stringify(options)}`

        try {
            const cached = this.cache.get(cacheKey)
            if (cached && !options.forceRefresh) {
                return { success: true, data: cached, fromCache: true }
            }

            const response = await apiClient.get(ENDPOINTS.FEED.AI_RECOMMENDATIONS, {
                params: {
                    type: options.type || 'mixed', // posts, users, hashtags, mixed
                    limit: options.limit || 10,
                    contextual: options.contextual || true,
                    experimental: options.experimental || false
                }
            })

            const recommendations = response.data.data

            // Add AI metadata
            const processedRecommendations = {
                ...recommendations,
                aiModel: recommendations.model || 'default',
                confidenceScore: recommendations.confidence || 0.8,
                explanations: this.generateExplanations(recommendations.items)
            }

            // Cache for moderate time as recommendations should be fresh
            this.cache.set(cacheKey, processedRecommendations, 10 * 60 * 1000) // 10 minutes

            return {
                success: true,
                data: processedRecommendations
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Không thể lấy AI recommendations'
            }
        }
    }

    // Utility methods
    processFeedData(feedData, options) {
        return {
            ...feedData,
            posts: feedData.posts?.map(post => this.enrichPostData(post)) || [],
            algorithm: options.algorithm || 'default',
            generatedAt: new Date().toISOString(),
            personalized: options.personalization !== 'low'
        }
    }

    enrichPostData(post) {
        return {
            ...post,
            engagementScore: this.calculateEngagementScore(post),
            relevanceScore: this.calculateRelevanceScore(post),
            timeDecay: this.calculateTimeDecay(post.createdAt)
        }
    }

    calculateEngagementScore(post) {
        const likes = post.likesCount || 0
        const comments = post.commentsCount || 0
        const shares = post.sharesCount || 0

        // Weighted engagement score
        return (likes * 1) + (comments * 2) + (shares * 3)
    }

    calculateRelevanceScore(post) {
        // Simple relevance calculation - would be more complex in real implementation
        let score = 0.5 // Base score

        if (post.isFromFollowing) score += 0.3
        if (post.hasCommonInterests) score += 0.2
        if (post.isRecent) score += 0.1

        return Math.min(score, 1.0)
    }

    calculateTimeDecay(createdAt) {
        const hoursSinceCreation = (Date.now() - new Date(createdAt)) / (1000 * 60 * 60)
        return Math.exp(-hoursSinceCreation / 24) // Exponential decay over 24 hours
    }

    calculateTrendingScores(posts) {
        return posts.map(post => ({
            id: post.id,
            trendingScore: this.calculateEngagementScore(post) * this.calculateTimeDecay(post.createdAt)
        }))
    }

    calculateDiversityScore(posts) {
        const topics = posts.map(post => post.topic || 'general')
        const uniqueTopics = new Set(topics)
        return uniqueTopics.size / Math.max(posts.length, 1)
    }

    calculateHashtagStats(posts, hashtag) {
        const total = posts.length
        const engagement = posts.reduce((sum, post) => sum + this.calculateEngagementScore(post), 0)

        return {
            totalPosts: total,
            avgEngagement: total > 0 ? engagement / total : 0,
            peakHours: this.calculatePeakHours(posts),
            topContributors: this.getTopContributors(posts)
        }
    }

    calculatePeakHours(posts) {
        const hourCounts = {}

        posts.forEach(post => {
            const hour = new Date(post.createdAt).getHours()
            hourCounts[hour] = (hourCounts[hour] || 0) + 1
        })

        return Object.entries(hourCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([hour, count]) => ({ hour: parseInt(hour), count }))
    }

    getTopContributors(posts) {
        const userCounts = {}

        posts.forEach(post => {
            const userId = post.author.id
            userCounts[userId] = (userCounts[userId] || 0) + 1
        })

        return Object.entries(userCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([userId, count]) => {
                const user = posts.find(p => p.author.id === userId)?.author
                return { user, postCount: count }
            })
    }

    extractRelatedHashtags(posts) {
        const hashtagCounts = {}

        posts.forEach(post => {
            post.hashtags?.forEach(tag => {
                hashtagCounts[tag] = (hashtagCounts[tag] || 0) + 1
            })
        })

        return Object.entries(hashtagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([hashtag, count]) => ({ hashtag, count }))
    }

    processStoriesData(storiesData) {
        const now = Date.now()

        return {
            ...storiesData,
            stories: storiesData.stories?.map(story => ({
                ...story,
                timeRemaining: this.calculateStoryTimeRemaining(story.expiresAt, now),
                isExpired: new Date(story.expiresAt) < now,
                viewProgress: story.viewCount / (story.totalSlides || 1)
            })) || []
        }
    }

    calculateStoryTimeRemaining(expiresAt, now) {
        const remaining = new Date(expiresAt) - now
        return Math.max(0, remaining)
    }

    generateSearchSuggestions(query, results) {
        // Simple suggestion generation - would use ML in production
        const suggestions = []

        // Extract popular hashtags from results
        const hashtags = new Set()
        results.posts?.forEach(post => {
            post.hashtags?.forEach(tag => hashtags.add(tag))
        })

        // Add top hashtags as suggestions
        Array.from(hashtags).slice(0, 5).forEach(tag => {
            suggestions.push(`#${tag}`)
        })

        return suggestions
    }

    generateExplanations(items) {
        return items?.map(item => ({
            id: item.id,
            reason: this.getRecommendationReason(item),
            confidence: item.confidence || 0.8
        })) || []
    }

    getRecommendationReason(item) {
        // Simple reason generation
        if (item.isFromFollowing) return 'Từ người bạn đang theo dõi'
        if (item.hasCommonInterests) return 'Dựa trên sở thích của bạn'
        if (item.isTrending) return 'Đang trending'
        return 'Được đề xuất cho bạn'
    }

    getRecommendationReasons(posts) {
        return posts.map(post => ({
            postId: post.id,
            reasons: this.generateReasonsList(post)
        }))
    }

    generateReasonsList(post) {
        const reasons = []

        if (post.isFromFollowing) reasons.push('following')
        if (post.hasCommonInterests) reasons.push('interests')
        if (post.isTrending) reasons.push('trending')
        if (post.isPopular) reasons.push('popular')
        if (post.isRecent) reasons.push('recent')

        return reasons
    }

    getCacheTTL(algorithm) {
        switch (algorithm) {
            case 'fresh':
                return 30 * 1000 // 30 seconds
            case 'trending':
                return this.cacheTTL.trending
            case 'discovery':
                return this.cacheTTL.discover
            default:
                return this.cacheTTL.homeFeed
        }
    }

    // Real-time update handlers
    handleNewContent(data) {
        // Invalidate relevant feed caches
        this.cache.deletePattern('home-feed-')
        this.cache.deletePattern('discovery-feed-')

        console.log('New content available in feed')
    }

    handleTrendingUpdate(trendingData) {
        // Update trending caches
        this.cache.deletePattern('trending-feed-')

        console.log('Trending content updated')
    }

    handlePersonalizedUpdate(userId, recommendations) {
        // Update personalized recommendation caches
        this.cache.deletePattern('ai-recommendations-')

        console.log('Personalized recommendations updated')
    }

    // Cache management
    clearFeedCaches() {
        this.cache.clearPattern('home-feed-')
        this.cache.clearPattern('trending-feed-')
        this.cache.clearPattern('discovery-feed-')
        this.cache.clearPattern('user-feed-')
        this.cache.clearPattern('hashtag-feed-')
        this.cache.clearPattern('stories-feed-')
        this.cache.clearPattern('ai-recommendations-')
    }

    // Preloading for better UX
    async preloadFeedContent(feedType = 'home') {
        try {
            switch (feedType) {
                case 'home':
                    await this.getHomeFeed({ limit: 10 })
                    break
                case 'trending':
                    await this.getTrendingFeed({ limit: 10 })
                    break
                case 'discovery':
                    await this.getDiscoveryFeed({ limit: 10 })
                    break
            }
        } catch (error) {
            console.warn(`Failed to preload ${feedType} feed:`, error)
        }
    }
}

// Export singleton instance
export const feedService = new FeedService()
export default feedService