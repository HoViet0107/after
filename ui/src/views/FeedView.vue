<template>
    <div class="feed-view">
        <div class="container-fluid">
            <div class="row">
                <!-- Left Sidebar -->
                <div class="col-lg-3 d-none d-lg-block">
                    <div class="sidebar-content">
                        <!-- Profile Card -->
                        <div class="profile-card">
                            <div class="profile-header">
                                <UserAvatar :user="currentUser" :size="60" />
                                <div class="profile-info">
                                    <h6 class="profile-name">{{ currentUser?.name }}</h6>
                                    <p class="profile-username">@{{ currentUser?.username }}</p>
                                </div>
                            </div>
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <span class="stat-number">{{ formatNumber(currentUser?.postsCount || 0) }}</span>
                                    <span class="stat-label">Bài viết</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">{{ formatNumber(currentUser?.followersCount || 0)
                                    }}</span>
                                    <span class="stat-label">Theo dõi</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">{{ formatNumber(currentUser?.followingCount || 0)
                                    }}</span>
                                    <span class="stat-label">Đang theo dõi</span>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="quick-actions">
                            <h6 class="section-title">Hành động nhanh</h6>
                            <div class="action-list">
                                <button class="action-item" @click="openCreatePost">
                                    <i class="fas fa-plus text-primary"></i>
                                    <span>Tạo bài viết</span>
                                </button>
                                <router-link to="/app/chat" class="action-item">
                                    <i class="fas fa-comment text-success"></i>
                                    <span>Tin nhắn</span>
                                </router-link>
                                <router-link to="/app/search" class="action-item">
                                    <i class="fas fa-search text-info"></i>
                                    <span>Tìm kiếm</span>
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Feed -->
                <div class="col-lg-6">
                    <div class="feed-content">
                        <!-- Create Post -->
                        <div class="create-post-card">
                            <div class="create-post-input" @click="openCreatePost">
                                <UserAvatar :user="currentUser" :size="40" />
                                <div class="fake-input">
                                    <span class="placeholder">Bạn đang nghĩ gì?</span>
                                </div>
                            </div>
                            <div class="create-post-actions">
                                <button class="action-btn" @click="openCreatePost('photo')">
                                    <i class="fas fa-image text-success"></i>
                                    <span>Ảnh/Video</span>
                                </button>
                                <button class="action-btn" @click="openCreatePost('feeling')">
                                    <i class="fas fa-smile text-warning"></i>
                                    <span>Cảm xúc</span>
                                </button>
                                <button class="action-btn" @click="openCreatePost('location')">
                                    <i class="fas fa-map-marker-alt text-danger"></i>
                                    <span>Vị trí</span>
                                </button>
                            </div>
                        </div>

                        <!-- Feed Filter -->
                        <div class="feed-filter">
                            <div class="filter-tabs">
                                <button v-for="filter in filters" :key="filter.key" class="filter-tab"
                                    :class="{ active: feedFilter === filter.key }" @click="setFeedFilter(filter.key)">
                                    <i :class="filter.icon"></i>
                                    <span>{{ filter.label }}</span>
                                </button>
                            </div>
                        </div>

                        <!-- Posts List -->
                        <div class="posts-list">
                            <div v-if="loading.posts" class="loading-skeleton">
                                <div v-for="i in 5" :key="i" class="skeleton-post"></div>
                            </div>

                            <div v-else-if="posts.length === 0" class="empty-feed">
                                <i class="fas fa-newspaper fa-3x text-muted"></i>
                                <h5 class="mt-3">Chưa có bài viết nào</h5>
                                <p class="text-muted">{{ getEmptyMessage() }}</p>
                                <button class="btn btn-primary" @click="openCreatePost">
                                    Tạo bài viết đầu tiên
                                </button>
                            </div>

                            <div v-else>
                                <PostCard v-for="post in posts" :key="post.id" :post="post" @like="handlePostLike"
                                    @comment="handlePostComment" @share="handlePostShare" />

                                <!-- Load More -->
                                <div v-if="hasMorePosts" class="load-more">
                                    <button class="btn btn-outline-primary w-100" :disabled="loading.more"
                                        @click="loadMorePosts">
                                        <i v-if="loading.more" class="fas fa-spinner fa-spin me-2"></i>
                                        {{ loading.more ? 'Đang tải...' : 'Tải thêm bài viết' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Sidebar -->
                <div class="col-lg-3 d-none d-lg-block">
                    <div class="sidebar-content">
                        <!-- Trending -->
                        <div class="trending-section">
                            <h6 class="section-title">Xu hướng</h6>
                            <div class="trending-list">
                                <div v-for="trend in trendingTopics" :key="trend.id" class="trending-item">
                                    <div class="trend-info">
                                        <span class="trend-category">{{ trend.category }}</span>
                                        <h6 class="trend-name">#{{ trend.name }}</h6>
                                        <span class="trend-count">{{ formatNumber(trend.postsCount) }} bài viết</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Suggested Users -->
                        <div class="suggestions-section">
                            <h6 class="section-title">Gợi ý kết bạn</h6>
                            <div class="suggestions-list">
                                <div v-for="user in suggestedUsers" :key="user.id" class="suggestion-item">
                                    <UserAvatar :user="user" :size="40" />
                                    <div class="suggestion-info">
                                        <h6 class="suggestion-name">{{ user.name }}</h6>
                                        <p class="suggestion-mutual">{{ user.mutualFriends }} bạn chung</p>
                                    </div>
                                    <button class="btn btn-sm btn-primary" @click="followUser(user.id)">
                                        Theo dõi
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <CreatePostModal v-if="showCreateModal" :initial-type="createPostType" @close="showCreateModal = false"
            @created="handlePostCreated" />

        <!-- Floating Action Button (Mobile) -->
        <div class="fab-container d-lg-none">
            <button class="fab" @click="openCreatePost">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStores } from '@/composables/useAppStores'
import { useLoadingStates } from '@/composables/useLoadingStates'
import { useWebSocket } from '@/composables/useWebSocket'
import { formatNumber } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'
import PostCard from '@/components/post/PostCard.vue'
import CreatePostModal from '@/components/modals/CreatePostModal.vue'

const router = useRouter()
const { authStore, postStore, userStore } = useAppStores()
const { loading, setLoading } = useLoadingStates(['posts', 'more'])
const { on, off } = useWebSocket()

// State
const posts = ref([])
const suggestedUsers = ref([])
const trendingTopics = ref([])
const feedFilter = ref('all')
const showCreateModal = ref(false)
const createPostType = ref('text')
const currentPage = ref(1)
const hasMorePosts = ref(true)

// Computed
const currentUser = computed(() => authStore.user)

const filters = computed(() => [
    { key: 'all', label: 'Tất cả', icon: 'fas fa-globe' },
    { key: 'following', label: 'Bạn bè', icon: 'fas fa-users' },
    { key: 'photos', label: 'Ảnh', icon: 'fas fa-images' },
    { key: 'videos', label: 'Video', icon: 'fas fa-video' }
])

// Methods
const loadFeedPosts = async (refresh = false) => {
    if (refresh) {
        currentPage.value = 1
        hasMorePosts.value = true
    }

    setLoading('posts', true)
    try {
        const response = await postStore.getFeedPosts({
            filter: feedFilter.value,
            page: currentPage.value,
            limit: 20
        })

        if (refresh) {
            posts.value = response.data
        } else {
            posts.value.push(...response.data)
        }

        hasMorePosts.value = response.hasMore

    } catch (error) {
        console.error('Load feed error:', error)
    } finally {
        setLoading('posts', false)
    }
}

const loadMorePosts = async () => {
    if (loading.more || !hasMorePosts.value) return

    setLoading('more', true)
    currentPage.value++

    try {
        const response = await postStore.getFeedPosts({
            filter: feedFilter.value,
            page: currentPage.value,
            limit: 20
        })

        posts.value.push(...response.data)
        hasMorePosts.value = response.hasMore

    } catch (error) {
        console.error('Load more posts error:', error)
        currentPage.value-- // Rollback page
    } finally {
        setLoading('more', false)
    }
}

const loadSuggestedUsers = async () => {
    try {
        const response = await userStore.getSuggestedUsers()
        suggestedUsers.value = response.data.slice(0, 5)
    } catch (error) {
        console.error('Load suggested users error:', error)
    }
}

const loadTrendingTopics = async () => {
    try {
        const response = await postStore.getTrendingTopics()
        trendingTopics.value = response.data.slice(0, 5)
    } catch (error) {
        console.error('Load trending topics error:', error)
    }
}

const setFeedFilter = (filter) => {
    feedFilter.value = filter
    loadFeedPosts(true)
}

const openCreatePost = (type = 'text') => {
    createPostType.value = type
    showCreateModal.value = true
}

const handlePostCreated = (newPost) => {
    posts.value.unshift(newPost)
    showCreateModal.value = false
}

const handlePostLike = async (postId) => {
    try {
        const post = posts.value.find(p => p.id === postId)
        if (post) {
            post.isLiked = !post.isLiked
            post.likesCount += post.isLiked ? 1 : -1
        }

        await postStore.toggleLike(postId)
    } catch (error) {
        console.error('Like post error:', error)
        // Revert optimistic update
        const post = posts.value.find(p => p.id === postId)
        if (post) {
            post.isLiked = !post.isLiked
            post.likesCount += post.isLiked ? 1 : -1
        }
    }
}

const handlePostComment = (postId) => {
    router.push(`/app/post/${postId}`)
}

const handlePostShare = async (postId) => {
    try {
        await postStore.sharePost(postId)
        const post = posts.value.find(p => p.id === postId)
        if (post) {
            post.sharesCount++
        }
    } catch (error) {
        console.error('Share post error:', error)
    }
}

const followUser = async (userId) => {
    try {
        await userStore.followUser(userId)
        // Remove from suggestions
        suggestedUsers.value = suggestedUsers.value.filter(u => u.id !== userId)
    } catch (error) {
        console.error('Follow user error:', error)
    }
}

const getEmptyMessage = () => {
    switch (feedFilter.value) {
        case 'following':
            return 'Chưa có bài viết từ những người bạn theo dõi'
        case 'photos':
            return 'Chưa có bài viết nào chứa ảnh'
        case 'videos':
            return 'Chưa có bài viết nào chứa video'
        default:
            return 'Hãy theo dõi một số người để xem bài viết của họ'
    }
}

// WebSocket handlers
const setupWebSocket = () => {
    on('post:created', (data) => {
        if (data.post.authorId !== currentUser.value?.id) {
            posts.value.unshift(data.post)
        }
    })

    on('post:liked', (data) => {
        const post = posts.value.find(p => p.id === data.postId)
        if (post) {
            post.likesCount = data.likesCount
        }
    })
}

// Watchers
watch(feedFilter, () => {
    loadFeedPosts(true)
})

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadFeedPosts(true),
        loadSuggestedUsers(),
        loadTrendingTopics()
    ])

    setupWebSocket()
})

onUnmounted(() => {
    off('post:created')
    off('post:liked')
})
</script>

<style lang="scss" scoped>
.feed-view {
    background: #f8f9fa;
    min-height: 100vh;
    padding-top: 1rem;
}

.sidebar-content {
    position: sticky;
    top: 1rem;
}

.profile-card,
.quick-actions,
.trending-section,
.suggestions-section {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
}

.profile-header {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;

    .profile-info {
        margin-left: 0.75rem;

        .profile-name {
            margin: 0;
            font-weight: 600;
        }

        .profile-username {
            margin: 0;
            color: #6c757d;
            font-size: 0.9rem;
        }
    }
}

.profile-stats {
    display: flex;
    justify-content: space-between;

    .stat-item {
        text-align: center;

        .stat-number {
            display: block;
            font-weight: 600;
            color: #495057;
        }

        .stat-label {
            font-size: 0.8rem;
            color: #6c757d;
        }
    }
}

.section-title {
    font-weight: 600;
    margin-bottom: 1rem;
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #495057;
}

.action-list {
    .action-item {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 0.75rem;
        border: none;
        background: none;
        text-decoration: none;
        color: #495057;
        border-radius: 0.5rem;
        transition: background-color 0.2s ease;
        margin-bottom: 0.25rem;

        &:hover {
            background-color: #f8f9fa;
        }

        i {
            margin-right: 0.75rem;
            width: 20px;
        }
    }
}

.create-post-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
}

.create-post-input {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
    cursor: pointer;

    .fake-input {
        flex: 1;
        margin-left: 0.75rem;
        padding: 0.75rem 1rem;
        background: #f8f9fa;
        border-radius: 2rem;

        .placeholder {
            color: #6c757d;
        }
    }
}

.create-post-actions {
    display: flex;
    gap: 1rem;

    .action-btn {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        border: none;
        background: none;
        border-radius: 0.5rem;
        transition: background-color 0.2s ease;

        &:hover {
            background-color: #f8f9fa;
        }

        i {
            margin-right: 0.5rem;
        }
    }
}

.feed-filter {
    background: white;
    border-radius: 0.75rem;
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
}

.filter-tabs {
    display: flex;
    gap: 0.5rem;

    .filter-tab {
        display: flex;
        align-items: center;
        padding: 0.5rem 1rem;
        border: none;
        background: none;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
        color: #6c757d;

        &:hover,
        &.active {
            background-color: #e7f3ff;
            color: #0d6efd;
        }

        i {
            margin-right: 0.5rem;
        }
    }
}

.posts-list {
    .skeleton-post {
        height: 300px;
        background: white;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
        animation: pulse 1.5s ease-in-out infinite alternate;
    }
}

.empty-feed {
    background: white;
    border-radius: 0.75rem;
    padding: 3rem 2rem;
    text-align: center;
    margin-bottom: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
}

.trending-item,
.suggestion-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 0;
    border-bottom: 1px solid #f8f9fa;

    &:last-child {
        border-bottom: none;
    }
}

.trending-item {
    .trend-category {
        font-size: 0.75rem;
        color: #6c757d;
        text-transform: uppercase;
    }

    .trend-name {
        margin: 0.25rem 0;
        font-size: 0.9rem;
        font-weight: 600;
    }

    .trend-count {
        font-size: 0.75rem;
        color: #6c757d;
    }
}

.suggestion-item {
    .suggestion-info {
        flex: 1;
        margin-left: 0.75rem;

        .suggestion-name {
            margin: 0;
            font-size: 0.9rem;
            font-weight: 600;
        }

        .suggestion-mutual {
            margin: 0;
            font-size: 0.75rem;
            color: #6c757d;
        }
    }
}

.fab-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 1000;
}

.fab {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: #0d6efd;
    color: white;
    border: none;
    box-shadow: 0 4px 12px rgba(13, 110, 253, 0.4);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    transition: all 0.3s ease;

    &:hover {
        transform: scale(1.1);
        box-shadow: 0 6px 16px rgba(13, 110, 253, 0.5);
    }
}

@keyframes pulse {
    0% {
        opacity: 1;
    }

    100% {
        opacity: 0.5;
    }
}

@media (max-width: 768px) {
    .feed-view {
        padding-top: 0;
    }

    .create-post-actions {
        flex-wrap: wrap;
        gap: 0.5rem;
    }

    .filter-tabs {
        flex-wrap: wrap;
        gap: 0.25rem;
    }
}
</style>