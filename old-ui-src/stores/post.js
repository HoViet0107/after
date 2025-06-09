import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

export const usePostStore = defineStore('post', () => {
    // State
    const posts = ref([])
    const userPosts = ref(new Map()) // userId -> posts
    const postCache = ref(new Map()) // postId -> post
    const feedPosts = ref([])
    const trendingPosts = ref([])
    const isLoading = ref(false)
    const isLoadingMore = ref(false)
    const isCreating = ref(false)
    const currentPage = ref(0)
    const hasMore = ref(true)
    const feedType = ref('home') // 'home', 'trending', 'following'

    // Dependencies
    const authStore = useAuthStore()
    const toast = useToast()

    // Getters
    const allPosts = computed(() => posts.value)

    const getFeedPosts = computed(() => {
        switch (feedType.value) {
            case 'trending':
                return trendingPosts.value
            case 'following':
                return posts.value.filter(post =>
                    authStore.userProfile?.following?.includes(post.authorId)
                )
            default:
                return feedPosts.value.length > 0 ? feedPosts.value : posts.value
        }
    })

    const getPostById = computed(() => (postId) => {
        return postCache.value.get(postId) ||
            posts.value.find(post => post.id === postId)
    })

    const getUserPosts = computed(() => (userId) => {
        return userPosts.value.get(userId) || []
    })

    const getPostStats = computed(() => (postId) => {
        const post = getPostById.value(postId)
        if (!post) return { likes: 0, comments: 0, shares: 0 }

        return {
            likes: post.likesCount || 0,
            comments: post.commentsCount || 0,
            shares: post.sharesCount || 0
        }
    })

    const isPostLiked = computed(() => (postId) => {
        const post = getPostById.value(postId)
        return post?.isLiked || false
    })

    // Actions
    const fetchFeed = async (type = 'home', page = 0, reset = false) => {
        if (reset) {
            currentPage.value = 0
            hasMore.value = true
            posts.value = []
            feedPosts.value = []
        }

        if (!hasMore.value && !reset) return

        isLoading.value = page === 0
        isLoadingMore.value = page > 0
        feedType.value = type

        try {
            let endpoint
            switch (type) {
                case 'trending':
                    endpoint = ENDPOINTS.POSTS.TRENDING
                    break
                case 'user':
                    endpoint = ENDPOINTS.FEED.USER(authStore.userId)
                    break
                default:
                    endpoint = ENDPOINTS.FEED.HOME
            }

            const response = await apiClient.get(endpoint, {
                params: {
                    page,
                    size: 20,
                    sort: 'createdAt,desc'
                }
            })

            const { content, totalPages, number, last } = response.data

            // Cache posts
            content.forEach(post => {
                postCache.value.set(post.id, post)
            })

            if (reset) {
                if (type === 'trending') {
                    trendingPosts.value = content
                } else {
                    feedPosts.value = content
                    posts.value = content
                }
            } else {
                if (type === 'trending') {
                    trendingPosts.value.push(...content)
                } else {
                    feedPosts.value.push(...content)
                    posts.value.push(...content)
                }
            }

            currentPage.value = number
            hasMore.value = !last

            return { success: true, data: content }
        } catch (error) {
            console.error('Failed to fetch feed:', error)
            toast.error('Không thể tải bảng tin')
            return { success: false, error }
        } finally {
            isLoading.value = false
            isLoadingMore.value = false
        }
    }

    const fetchUserPosts = async (userId, page = 0, reset = false) => {
        try {
            const response = await apiClient.get(ENDPOINTS.POSTS.USER_POSTS(userId), {
                params: {
                    page,
                    size: 20,
                    sort: 'createdAt,desc'
                }
            })

            const { content } = response.data

            // Cache posts
            content.forEach(post => {
                postCache.value.set(post.id, post)
            })

            if (reset) {
                userPosts.value.set(userId, content)
            } else {
                const existingPosts = userPosts.value.get(userId) || []
                userPosts.value.set(userId, [...existingPosts, ...content])
            }

            return { success: true, data: content }
        } catch (error) {
            console.error('Failed to fetch user posts:', error)
            toast.error('Không thể tải bài viết của người dùng')
            return { success: false, error }
        }
    }

    const fetchPostById = async (postId) => {
        // Check cache first
        const cached = postCache.value.get(postId)
        if (cached) {
            return { success: true, data: cached }
        }

        try {
            const response = await apiClient.get(ENDPOINTS.POSTS.DETAIL(postId))
            const post = response.data

            // Update cache
            postCache.value.set(postId, post)

            // Update in posts array if exists
            const index = posts.value.findIndex(p => p.id === postId)
            if (index !== -1) {
                posts.value[index] = post
            }

            return { success: true, data: post }
        } catch (error) {
            console.error('Failed to fetch post:', error)
            toast.error('Không thể tải bài viết')
            return { success: false, error }
        }
    }

    const createPost = async (postData) => {
        isCreating.value = true

        try {
            const response = await apiClient.post(ENDPOINTS.POSTS.CREATE, {
                content: postData.content,
                type: postData.type || 'text',
                attachments: postData.attachments || [],
                visibility: postData.visibility || 'public',
                hashtags: postData.hashtags || [],
                mentions: postData.mentions || []
            })

            const newPost = response.data

            // Add to posts array (at the beginning)
            posts.value.unshift(newPost)
            feedPosts.value.unshift(newPost)

            // Cache post
            postCache.value.set(newPost.id, newPost)

            // Add to user posts
            const currentUserPosts = userPosts.value.get(authStore.userId) || []
            userPosts.value.set(authStore.userId, [newPost, ...currentUserPosts])

            toast.success('Đã đăng bài viết thành công!')
            return { success: true, data: newPost }
        } catch (error) {
            console.error('Failed to create post:', error)
            toast.error('Không thể đăng bài viết')
            return { success: false, error }
        } finally {
            isCreating.value = false
        }
    }

    const updatePost = async (postId, updates) => {
        try {
            const response = await apiClient.put(
                ENDPOINTS.POSTS.DETAIL(postId),
                updates
            )

            const updatedPost = response.data

            // Update in all relevant arrays and cache
            updatePostInState(postId, updatedPost)

            toast.success('Đã cập nhật bài viết!')
            return { success: true, data: updatedPost }
        } catch (error) {
            console.error('Failed to update post:', error)
            toast.error('Không thể cập nhật bài viết')
            return { success: false, error }
        }
    }

    const deletePost = async (postId) => {
        try {
            await apiClient.delete(ENDPOINTS.POSTS.DETAIL(postId))

            // Remove from all arrays and cache
            removePostFromState(postId)

            toast.success('Đã xóa bài viết!')
            return { success: true }
        } catch (error) {
            console.error('Failed to delete post:', error)
            toast.error('Không thể xóa bài viết')
            return { success: false, error }
        }
    }

    const likePost = async (postId) => {
        try {
            await apiClient.post(ENDPOINTS.POSTS.LIKE(postId))

            // Optimistically update UI
            const post = getPostById.value(postId)
            if (post) {
                post.isLiked = true
                post.likesCount = (post.likesCount || 0) + 1
                updatePostInState(postId, post)
            }

            return { success: true }
        } catch (error) {
            console.error('Failed to like post:', error)

            // Revert optimistic update
            const post = getPostById.value(postId)
            if (post) {
                post.isLiked = false
                post.likesCount = Math.max((post.likesCount || 1) - 1, 0)
                updatePostInState(postId, post)
            }

            toast.error('Không thể thích bài viết')
            return { success: false, error }
        }
    }

    const unlikePost = async (postId) => {
        try {
            await apiClient.delete(ENDPOINTS.POSTS.UNLIKE(postId))

            // Optimistically update UI
            const post = getPostById.value(postId)
            if (post) {
                post.isLiked = false
                post.likesCount = Math.max((post.likesCount || 1) - 1, 0)
                updatePostInState(postId, post)
            }

            return { success: true }
        } catch (error) {
            console.error('Failed to unlike post:', error)

            // Revert optimistic update
            const post = getPostById.value(postId)
            if (post) {
                post.isLiked = true
                post.likesCount = (post.likesCount || 0) + 1
                updatePostInState(postId, post)
            }

            toast.error('Không thể bỏ thích bài viết')
            return { success: false, error }
        }
    }

    const sharePost = async (postId, shareData = {}) => {
        try {
            const response = await apiClient.post(ENDPOINTS.POSTS.SHARE(postId), {
                content: shareData.content || '',
                visibility: shareData.visibility || 'public'
            })

            const sharedPost = response.data

            // Add shared post to feed
            posts.value.unshift(sharedPost)
            feedPosts.value.unshift(sharedPost)

            // Update original post share count
            const originalPost = getPostById.value(postId)
            if (originalPost) {
                originalPost.sharesCount = (originalPost.sharesCount || 0) + 1
                updatePostInState(postId, originalPost)
            }

            toast.success('Đã chia sẻ bài viết!')
            return { success: true, data: sharedPost }
        } catch (error) {
            console.error('Failed to share post:', error)
            toast.error('Không thể chia sẻ bài viết')
            return { success: false, error }
        }
    }

    const addComment = async (postId, commentData) => {
        try {
            const response = await apiClient.post(
                ENDPOINTS.COMMENTS.POST_COMMENTS(postId),
                {
                    content: commentData.content,
                    parentId: commentData.parentId
                }
            )

            const comment = response.data

            // Update post comment count
            const post = getPostById.value(postId)
            if (post) {
                post.commentsCount = (post.commentsCount || 0) + 1
                updatePostInState(postId, post)
            }

            return { success: true, data: comment }
        } catch (error) {
            console.error('Failed to add comment:', error)
            toast.error('Không thể thêm bình luận')
            return { success: false, error }
        }
    }

    const searchPosts = async (query, filters = {}) => {
        try {
            const response = await apiClient.get(ENDPOINTS.SEARCH.POSTS, {
                params: {
                    q: query,
                    hashtag: filters.hashtag,
                    author: filters.author,
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                    type: filters.type,
                    limit: filters.limit || 20
                }
            })

            return { success: true, data: response.data }
        } catch (error) {
            console.error('Failed to search posts:', error)
            toast.error('Không thể tìm kiếm bài viết')
            return { success: false, error }
        }
    }

    const getHashtagPosts = async (hashtag, page = 0) => {
        try {
            const response = await apiClient.get(ENDPOINTS.FEED.HASHTAG(hashtag), {
                params: { page, size: 20 }
            })

            return { success: true, data: response.data.content }
        } catch (error) {
            console.error('Failed to fetch hashtag posts:', error)
            toast.error('Không thể tải bài viết theo hashtag')
            return { success: false, error }
        }
    }

    const reportPost = async (postId, reason, description = '') => {
        try {
            await apiClient.post(`${ENDPOINTS.POSTS.DETAIL(postId)}/report`, {
                reason,
                description
            })

            toast.success('Đã báo cáo bài viết!')
            return { success: true }
        } catch (error) {
            console.error('Failed to report post:', error)
            toast.error('Không thể báo cáo bài viết')
            return { success: false, error }
        }
    }

    const hidePost = async (postId) => {
        try {
            await apiClient.post(`${ENDPOINTS.POSTS.DETAIL(postId)}/hide`)

            // Remove from feed
            posts.value = posts.value.filter(post => post.id !== postId)
            feedPosts.value = feedPosts.value.filter(post => post.id !== postId)
            trendingPosts.value = trendingPosts.value.filter(post => post.id !== postId)

            toast.success('Đã ẩn bài viết!')
            return { success: true }
        } catch (error) {
            console.error('Failed to hide post:', error)
            toast.error('Không thể ẩn bài viết')
            return { success: false, error }
        }
    }

    // Helper functions
    const updatePostInState = (postId, updatedPost) => {
        // Update cache
        postCache.value.set(postId, updatedPost)

        // Update in posts array
        const postIndex = posts.value.findIndex(post => post.id === postId)
        if (postIndex !== -1) {
            posts.value[postIndex] = updatedPost
        }

        // Update in feed posts
        const feedIndex = feedPosts.value.findIndex(post => post.id === postId)
        if (feedIndex !== -1) {
            feedPosts.value[feedIndex] = updatedPost
        }

        // Update in trending posts
        const trendingIndex = trendingPosts.value.findIndex(post => post.id === postId)
        if (trendingIndex !== -1) {
            trendingPosts.value[trendingIndex] = updatedPost
        }

        // Update in user posts
        for (const [userId, userPostsList] of userPosts.value) {
            const userPostIndex = userPostsList.findIndex(post => post.id === postId)
            if (userPostIndex !== -1) {
                userPostsList[userPostIndex] = updatedPost
            }
        }
    }

    const removePostFromState = (postId) => {
        // Remove from cache
        postCache.value.delete(postId)

        // Remove from posts array
        posts.value = posts.value.filter(post => post.id !== postId)
        feedPosts.value = feedPosts.value.filter(post => post.id !== postId)
        trendingPosts.value = trendingPosts.value.filter(post => post.id !== postId)

        // Remove from user posts
        for (const [userId, userPostsList] of userPosts.value) {
            const filtered = userPostsList.filter(post => post.id !== postId)
            userPosts.value.set(userId, filtered)
        }
    }

    const addPostToFeed = (post) => {
        posts.value.unshift(post)
        feedPosts.value.unshift(post)
        postCache.value.set(post.id, post)
    }

    const updatePostEngagement = (postId, engagement) => {
        const post = getPostById.value(postId)
        if (post) {
            Object.assign(post, engagement)
            updatePostInState(postId, post)
        }
    }

    const reset = () => {
        posts.value = []
        userPosts.value.clear()
        postCache.value.clear()
        feedPosts.value = []
        trendingPosts.value = []
        currentPage.value = 0
        hasMore.value = true
        feedType.value = 'home'
    }

    return {
        // State
        posts,
        userPosts,
        feedPosts,
        trendingPosts,
        isLoading,
        isLoadingMore,
        isCreating,
        currentPage,
        hasMore,
        feedType,

        // Getters
        allPosts,
        getFeedPosts,
        getPostById,
        getUserPosts,
        getPostStats,
        isPostLiked,

        // Actions
        fetchFeed,
        fetchUserPosts,
        fetchPostById,
        createPost,
        updatePost,
        deletePost,
        likePost,
        unlikePost,
        sharePost,
        addComment,
        searchPosts,
        getHashtagPosts,
        reportPost,
        hidePost,

        // Helpers
        updatePostInState,
        removePostFromState,
        addPostToFeed,
        updatePostEngagement,
        reset
    }
})