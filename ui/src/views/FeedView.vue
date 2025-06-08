<!-- Main feed page với posts, stories, suggestions và real-time updates -->

<template>
    <div class="feed-view">
        <div class="container-fluid">
            <div class="row">
                <!-- Left Sidebar -->
                <div class="col-lg-3 d-none d-lg-block">
                    <div class="left-sidebar">
                        <!-- User Profile Card -->
                        <div class="profile-card">
                            <div class="profile-header">
                                <UserAvatar :user="currentUser" size="lg" class="profile-avatar" />
                                <div class="profile-info">
                                    <h5 class="profile-name">{{ currentUser?.name || currentUser?.username }}</h5>
                                    <p class="profile-username">@{{ currentUser?.username }}</p>
                                </div>
                            </div>
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <span class="stat-number">{{ formatNumber(userStats.postsCount) }}</span>
                                    <span class="stat-label">Bài viết</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">{{ formatNumber(userStats.followersCount) }}</span>
                                    <span class="stat-label">Người theo dõi</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">{{ formatNumber(userStats.followingCount) }}</span>
                                    <span class="stat-label">Đang theo dõi</span>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="quick-actions">
                            <h6 class="section-title">Thao tác nhanh</h6>
                            <div class="action-list">
                                <router-link to="/profile" class="action-item">
                                    <i class="fas fa-user"></i>
                                    <span>Trang cá nhân</span>
                                </router-link>
                                <router-link to="/chat" class="action-item">
                                    <i class="fas fa-comments"></i>
                                    <span>Tin nhắn</span>
                                    <span v-if="unreadMessagesCount > 0" class="badge">{{ unreadMessagesCount }}</span>
                                </router-link>
                                <router-link to="/notifications" class="action-item">
                                    <i class="fas fa-bell"></i>
                                    <span>Thông báo</span>
                                    <span v-if="unreadNotificationsCount > 0" class="badge">{{ unreadNotificationsCount }}</span>
                                </router-link>
                                <router-link to="/settings" class="action-item">
                                    <i class="fas fa-cog"></i>
                                    <span>Cài đặt</span>
                                </router-link>
                            </div>
                        </div>

                        <!-- Trending Hashtags -->
                        <div class="trending-section">
                            <h6 class="section-title">Trending</h6>
                            <div class="hashtag-list">
                                <a href="#" v-for="hashtag in trendingHashtags" :key="hashtag.id" 
                                   class="hashtag-item" @click.prevent="searchHashtag(hashtag.tag)">
                                    <span class="hashtag-name">#{{ hashtag.tag }}</span>
                                    <span class="hashtag-count">{{ formatNumber(hashtag.count) }} bài viết</span>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="col-lg-6">
                    <div class="main-content">
                        <!-- Stories Section -->
                        <div class="stories-section" v-if="stories.length > 0">
                            <div class="stories-container">
                                <div class="story-item add-story" @click="createStory">
                                    <div class="story-avatar">
                                        <UserAvatar :user="currentUser" size="md" />
                                        <div class="add-icon">
                                            <i class="fas fa-plus"></i>
                                        </div>
                                    </div>
                                    <span class="story-label">Tạo Story</span>
                                </div>

                                <div class="story-item" v-for="story in stories" :key="story.id" 
                                     @click="viewStory(story)" :class="{ 'viewed': story.isViewed }">
                                    <div class="story-avatar">
                                        <UserAvatar :user="story.author" size="md" />
                                        <div class="story-ring"></div>
                                    </div>
                                    <span class="story-label">{{ story.author.name }}</span>
                                </div>
                            </div>
                        </div>

                        <!-- Create Post -->
                        <div class="create-post-card">
                            <div class="create-post-header">
                                <UserAvatar :user="currentUser" size="md" class="me-3" />
                                <div class="create-post-input" @click="openCreatePostModal">
                                    <input type="text" placeholder="Bạn đang nghĩ gì?" readonly>
                                </div>
                            </div>
                            <div class="create-post-actions">
                                <button class="action-btn" @click="openCreatePostModal('photo')">
                                    <i class="fas fa-image text-success"></i>
                                    <span>Ảnh/Video</span>
                                </button>
                                <button class="action-btn" @click="openCreatePostModal('feeling')">
                                    <i class="fas fa-smile text-warning"></i>
                                    <span>Cảm xúc</span>
                                </button>
                                <button class="action-btn" @click="openCreatePostModal('location')">
                                    <i class="fas fa-map-marker-alt text-danger"></i>
                                    <span>Vị trí</span>
                                </button>
                            </div>
                        </div>

                        <!-- Feed Filter -->
                        <div class="feed-filter">
                            <div class="filter-tabs">
                                <button class="filter-tab" :class="{ 'active': feedFilter === 'all' }" 
                                        @click="setFeedFilter('all')">
                                    <i class="fas fa-globe"></i>
                                    <span>Tất cả</span>
                                </button>
                                <button class="filter-tab" :class="{ 'active': feedFilter === 'following' }" 
                                        @click="setFeedFilter('following')">
                                    <i class="fas fa-users"></i>
                                    <span>Bạn bè</span>
                                </button>
                                <button class="filter-tab" :class="{ 'active': feedFilter === 'photos' }" 
                                        @click="setFeedFilter('photos')">
                                    <i class="fas fa-images"></i>
                                    <span>Ảnh</span>
                                </button>
                                <button class="filter-tab" :class="{ 'active': feedFilter === 'videos' }" 
                                        @click="setFeedFilter('videos')">
                                    <i class="fas fa-video"></i>
                                    <span>Video</span>
                                </button>
                            </div>
                        </div>

                        <!-- Posts Feed -->
                        <div class="posts-feed">
                            <!-- Loading skeleton -->
                            <PostSkeleton v-if="isLoading && posts.length === 0" v-for="i in 3" :key="i" />

                            <!-- Posts -->
                            <PostCard v-for="post in posts" :key="post.id" :post="post" 
                                      @like="handleLikePost" @unlike="handleUnlikePost"
                                      @comment="handleCommentPost" @share="handleSharePost"
                                      @edit="handleEditPost" @delete="handleDeletePost"
                                      @report="handleReportPost" @save="handleSavePost"
                                      class="mb-3" />

                            <!-- Load more trigger -->
                            <div ref="loadMoreTrigger" class="load-more-trigger" v-show="hasMorePosts">
                                <div v-if="isLoadingMore" class="text-center py-3">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Đang tải...</span>
                                    </div>
                                </div>
                            </div>

                            <!-- No more posts -->
                            <div v-if="!hasMorePosts && posts.length > 0" class="no-more-posts text-center py-4">
                                <i class="fas fa-check-circle text-success fs-2 mb-2"></i>
                                <p class="text-muted">Bạn đã xem hết bài viết!</p>
                            </div>

                            <!-- Empty state -->
                            <div v-if="posts.length === 0 && !isLoading" class="empty-feed text-center py-5">
                                <i class="fas fa-newspaper fs-1 text-muted mb-3"></i>
                                <h5 class="text-muted">Chưa có bài viết nào</h5>
                                <p class="text-muted">Theo dõi thêm bạn bè để xem nội dung thú vị!</p>
                                <router-link to="/discover" class="btn btn-primary">
                                    <i class="fas fa-compass me-2"></i>
                                    Khám phá
                                </router-link>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Sidebar -->
                <div class="col-lg-3 d-none d-lg-block">
                    <div class="right-sidebar">
                        <!-- Online Friends -->
                        <div class="online-friends" v-if="onlineFriends.length > 0">
                            <h6 class="section-title">Bạn bè đang online</h6>
                            <div class="friends-list">
                                <div class="friend-item" v-for="friend in onlineFriends" :key="friend.id"
                                     @click="startChat(friend)">
                                    <div class="friend-avatar">
                                        <UserAvatar :user="friend" size="sm" />
                                        <div class="online-indicator"></div>
                                    </div>
                                    <div class="friend-info">
                                        <span class="friend-name">{{ friend.name }}</span>
                                        <span class="friend-status">{{ friend.activity || 'Đang hoạt động' }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Friend Suggestions -->
                        <div class="friend-suggestions">
                            <h6 class="section-title">Gợi ý kết bạn</h6>
                            <div class="suggestions-list">
                                <div class="suggestion-item" v-for="suggestion in friendSuggestions" :key="suggestion.id">
                                    <UserAvatar :user="suggestion" size="md" class="suggestion-avatar" />
                                    <div class="suggestion-info">
                                        <h6 class="suggestion-name">{{ suggestion.name }}</h6>
                                        <p class="suggestion-mutual">{{ suggestion.mutualFriendsCount }} bạn chung</p>
                                        <div class="suggestion-actions">
                                            <button class="btn btn-primary btn-sm" @click="sendFriendRequest(suggestion)">
                                                <i class="fas fa-user-plus me-1"></i>
                                                Kết bạn
                                            </button>
                                            <button class="btn btn-outline-secondary btn-sm" @click="removeSuggestion(suggestion)">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Events -->
                        <div class="upcoming-events" v-if="upcomingEvents.length > 0">
                            <h6 class="section-title">Sự kiện sắp tới</h6>
                            <div class="events-list">
                                <div class="event-item" v-for="event in upcomingEvents" :key="event.id">
                                    <div class="event-date">
                                        <span class="event-day">{{ formatEventDate(event.date, 'DD') }}</span>
                                        <span class="event-month">{{ formatEventDate(event.date, 'MMM') }}</span>
                                    </div>
                                    <div class="event-info">
                                        <h6 class="event-title">{{ event.title }}</h6>
                                        <p class="event-time">{{ formatEventDate(event.date, 'HH:mm') }}</p>
                                        <p class="event-attendees">{{ event.attendeesCount }} người tham gia</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Sponsored -->
                        <div class="sponsored-content">
                            <h6 class="section-title">Được tài trợ</h6>
                            <div class="sponsored-item" v-for="ad in sponsoredAds" :key="ad.id">
                                <img :src="ad.image" :alt="ad.title" class="sponsored-image">
                                <div class="sponsored-info">
                                    <h6 class="sponsored-title">{{ ad.title }}</h6>
                                    <p class="sponsored-description">{{ ad.description }}</p>
                                    <a :href="ad.link" target="_blank" class="btn btn-outline-primary btn-sm">
                                        Tìm hiểu thêm
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <CreatePostModal v-if="showCreatePostModal" :initial-type="createPostType" 
                         @close="showCreatePostModal = false" @created="handlePostCreated" />

        <StoryViewerModal v-if="showStoryViewer" :story="currentStory" :stories="stories"
                          @close="showStoryViewer = false" @next="nextStory" @previous="previousStory" />

        <!-- Floating Action Button (Mobile) -->
        <div class="fab-container d-lg-none">
            <button class="fab" @click="openCreatePostModal">
                <i class="fas fa-plus"></i>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostStore } from '@/stores/post'
import { useUserStore } from '@/stores/user'
import { useConversationStore } from '@/stores/conversation'
import { useNotificationStore } from '@/stores/notification'
import { useWebSocket } from '@/composables/useWebSocket'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useToast } from 'vue-toastification'
import { formatNumber, formatDate } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'
import PostCard from '@/components/post/PostCard.vue'
import PostSkeleton from '@/components/skeleton/PostSkeleton.vue'
import CreatePostModal from '@/components/post/CreatePostModal.vue'
import StoryViewerModal from '@/components/story/StoryViewerModal.vue'

// Router & Stores
const router = useRouter()
const authStore = useAuthStore()
const postStore = usePostStore()
const userStore = useUserStore()
const conversationStore = useConversationStore()
const notificationStore = useNotificationStore()
const toast = useToast()

// WebSocket
const { on, off } = useWebSocket()

// Refs
const loadMoreTrigger = ref(null)

// State
const isLoading = ref(false)
const isLoadingMore = ref(false)
const feedFilter = ref('all')
const showCreatePostModal = ref(false)
const createPostType = ref('')
const showStoryViewer = ref(false)
const currentStory = ref(null)
const currentStoryIndex = ref(0)

// Mock data (replace with actual API calls)
const stories = ref([
    {
        id: 1,
        author: { id: 2, name: 'Nguyễn Văn A', avatar: '/avatars/user2.jpg' },
        isViewed: false
    },
    {
        id: 2,
        author: { id: 3, name: 'Trần Thị B', avatar: '/avatars/user3.jpg' },
        isViewed: true
    }
])

const trendingHashtags = ref([
    { id: 1, tag: 'vietnam', count: 12500 },
    { id: 2, tag: 'travel', count: 8200 },
    { id: 3, tag: 'food', count: 6800 },
    { id: 4, tag: 'technology', count: 5400 },
    { id: 5, tag: 'lifestyle', count: 4200 }
])

const onlineFriends = ref([
    {
        id: 2,
        name: 'Nguyễn Văn A',
        avatar: '/avatars/user2.jpg',
        activity: 'Đang nghe nhạc'
    },
    {
        id: 3,
        name: 'Trần Thị B',
        avatar: '/avatars/user3.jpg',
        activity: 'Đang xem video'
    }
])

const friendSuggestions = ref([
    {
        id: 4,
        name: 'Lê Văn C',
        avatar: '/avatars/user4.jpg',
        mutualFriendsCount: 5
    },
    {
        id: 5,
        name: 'Phạm Thị D',
        avatar: '/avatars/user5.jpg',
        mutualFriendsCount: 3
    }
])

const upcomingEvents = ref([
    {
        id: 1,
        title: 'Meetup Lập trình viên Hà Nội',
        date: '2025-06-15T19:00:00',
        attendeesCount: 45
    },
    {
        id: 2,
        title: 'Workshop UI/UX Design',
        date: '2025-06-20T14:00:00',
        attendeesCount: 28
    }
])

const sponsoredAds = ref([
    {
        id: 1,
        title: 'Khóa học lập trình online',
        description: 'Học lập trình từ cơ bản đến nâng cao',
        image: '/ads/programming-course.jpg',
        link: 'https://example.com'
    }
])

// Computed
const currentUser = computed(() => authStore.user)

const userStats = computed(() => ({
    postsCount: currentUser.value?.postsCount || 0,
    followersCount: currentUser.value?.followersCount || 0,
    followingCount: currentUser.value?.followingCount || 0
}))

const posts = computed(() => postStore.getFeedPosts)
const hasMorePosts = computed(() => postStore.hasMoreFeedPosts)

const unreadMessagesCount = computed(() => conversationStore.totalUnreadCount)
const unreadNotificationsCount = computed(() => notificationStore.unreadCount)

// Infinite scroll
const { setupInfiniteScroll, cleanup: cleanupInfiniteScroll } = useInfiniteScroll(
    loadMoreTrigger,
    loadMorePosts,
    { threshold: 100 }
)

// Methods
const loadFeedPosts = async (refresh = false) => {
    try {
        if (refresh) {
            isLoading.value = true
        } else {
            isLoadingMore.value = true
        }

        await postStore.loadFeedPosts({
            filter: feedFilter.value,
            refresh
        })
    } catch (error) {
        console.error('Error loading feed:', error)
        toast.error('Không thể tải bài viết')
    } finally {
        isLoading.value = false
        isLoadingMore.value = false
    }
}

const loadMorePosts = async () => {
    if (!hasMorePosts.value || isLoadingMore.value) return
    await loadFeedPosts(false)
}

const setFeedFilter = async (filter) => {
    if (feedFilter.value === filter) return
    
    feedFilter.value = filter
    await loadFeedPosts(true)
}

const openCreatePostModal = (type = '') => {
    createPostType.value = type
    showCreatePostModal.value = true
}

const handlePostCreated = (post) => {
    postStore.addPost(post)
    showCreatePostModal.value = false
    toast.success('Đã đăng bài viết thành công!')
}

const handleLikePost = async (post) => {
    try {
        await postStore.likePost(post.id)
    } catch (error) {
        toast.error('Không thể thích bài viết')
    }
}

const handleUnlikePost = async (post) => {
    try {
        await postStore.unlikePost(post.id)
    } catch (error) {
        toast.error('Không thể bỏ thích bài viết')
    }
}

const handleCommentPost = (post) => {
    router.push(`/posts/${post.id}`)
}

const handleSharePost = async (post) => {
    try {
        await postStore.sharePost(post.id)
        toast.success('Đã chia sẻ bài viết!')
    } catch (error) {
        toast.error('Không thể chia sẻ bài viết')
    }
}

const handleEditPost = (post) => {
    // Open edit modal
    console.log('Edit post:', post)
}

const handleDeletePost = async (post) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return
    
    try {
        await postStore.deletePost(post.id)
        toast.success('Đã xóa bài viết!')
    } catch (error) {
        toast.error('Không thể xóa bài viết')
    }
}

const handleReportPost = (post) => {
    // Open report modal
    console.log('Report post:', post)
}

const handleSavePost = async (post) => {
    try {
        await postStore.savePost(post.id)
        toast.success('Đã lưu bài viết!')
    } catch (error) {
        toast.error('Không thể lưu bài viết')
    }
}

const createStory = () => {
    // Open story creation modal
    console.log('Create story')
}

const viewStory = (story) => {
    currentStory.value = story
    currentStoryIndex.value = stories.value.findIndex(s => s.id === story.id)
    showStoryViewer.value = true
}

const nextStory = () => {
    if (currentStoryIndex.value < stories.value.length - 1) {
        currentStoryIndex.value++
        currentStory.value = stories.value[currentStoryIndex.value]
    }
}

const previousStory = () => {
    if (currentStoryIndex.value > 0) {
        currentStoryIndex.value--
        currentStory.value = stories.value[currentStoryIndex.value]
    }
}

const searchHashtag = (hashtag) => {
    router.push(`/search?q=${encodeURIComponent('#' + hashtag)}`)
}

const startChat = (friend) => {
    router.push(`/chat/${friend.id}`)
}

const sendFriendRequest = async (user) => {
    try {
        await userStore.sendFriendRequest(user.id)
        // Remove from suggestions
        friendSuggestions.value = friendSuggestions.value.filter(s => s.id !== user.id)
        toast.success(`Đã gửi lời mời kết bạn đến ${user.name}`)
    } catch (error) {
        toast.error('Không thể gửi lời mời kết bạn')
    }
}

const removeSuggestion = (user) => {
    friendSuggestions.value = friendSuggestions.value.filter(s => s.id !== user.id)
}

const formatEventDate = (date, format) => {
    return formatDate(date, format)
}

// Real-time updates
const setupRealTimeUpdates = () => {
    on('post:created', (data) => {
        if (data.post.author.id !== currentUser.value?.id) {
            postStore.addPost(data.post, true) // Add to beginning
        }
    })

    on('post:liked', (data) => {
        postStore.updatePostLikes(data.postId, data.likesCount, data.isLiked)
    })

    on('post:commented', (data) => {
        postStore.updatePostComments(data.postId, data.commentsCount)
    })

    on('user:online', (data) => {
        // Update online friends
        const friend = onlineFriends.value.find(f => f.id === data.userId)
        if (friend) {
            friend.activity = data.activity
        }
    })

    on('user:offline', (data) => {
        // Remove from online friends
        onlineFriends.value = onlineFriends.value.filter(f => f.id !== data.userId)
    })
}

const cleanupRealTimeUpdates = () => {
    off('post:created')
    off('post:liked')
    off('post:commented')
    off('user:online')
    off('user:offline')
}

// Watchers
watch(feedFilter, () => {
    // Clear posts when filter changes
    postStore.clearFeedPosts()
})

// Lifecycle
onMounted(async () => {
    // Load initial data
    await loadFeedPosts(true)
    
    // Setup infinite scroll
    await nextTick()
    setupInfiniteScroll()
    
    // Setup real-time updates
    setupRealTimeUpdates()
})

onUnmounted(() => {
    cleanupInfiniteScroll()
    cleanupRealTimeUpdates()
})
</script>

<style lang="scss" scoped>
.feed-view {
    background: var(--bs-light);
    min-height: 100vh;
    padding-top: 1rem;
}

// Left Sidebar
.left-sidebar {
    position: sticky;
    top: 1rem;
    height: fit-content;

    .profile-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

        .profile-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;

            .profile-info {
                margin-left: 0.75rem;

                .profile-name {
                    margin: 0;
                    font-weight: 600;
                    color: var(--bs-dark);
                }

                .profile-username {
                    margin: 0;
                    color: var(--bs-secondary);
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
                    font-weight: 700;
                    font-size: 1.2rem;
                    color: var(--bs-primary);
                }

                .stat-label {
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                }
            }
        }
    }

    .section-title {
        font-weight: 600;
        color: var(--bs-dark);
        margin-bottom: 1rem;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .quick-actions,
    .trending-section {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .action-list {
        .action-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 0;
            color: var(--bs-dark);
            text-decoration: none;
            border-radius: 8px;
            transition: all 0.2s ease;
            position: relative;

            &:hover {
                background: var(--bs-light);
                color: var(--bs-primary);
            }

            i {
                width: 20px;
                margin-right: 0.75rem;
            }

            .badge {
                background: var(--bs-danger);
                color: white;
                border-radius: 50%;
                font-size: 0.7rem;
                min-width: 18px;
                height: 18px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-left: auto;
            }
        }
    }

    .hashtag-list {
        .hashtag-item {
            display: block;
            padding: 0.5rem 0;
            color: var(--bs-dark);
            text-decoration: none;
            border-bottom: 1px solid var(--bs-border-color-translucent);

            &:last-child {
                border-bottom: none;
            }

            &:hover {
                color: var(--bs-primary);
            }

            .hashtag-name {
                display: block;
                font-weight: 600;
            }

            .hashtag-count {
                font-size: 0.8rem;
                color: var(--bs-secondary);
            }
        }
    }
}

// Main Content
.main-content {
    .stories-section {
        margin-bottom: 1rem;

        .stories-container {
            display: flex;
            gap: 1rem;
            padding: 1rem;
            background: white;
            border-radius: 15px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
            overflow-x: auto;

            .story-item {
                flex-shrink: 0;
                text-align: center;
                cursor: pointer;
                transition: transform 0.2s ease;

                &:hover {
                    transform: scale(1.05);
                }

                .story-avatar {
                    position: relative;
                    margin-bottom: 0.5rem;

                    .add-icon {
                        position: absolute;
                        bottom: 0;
                        right: 0;
                        width: 24px;
                        height: 24px;
                        background: var(--bs-primary);
                        border: 2px solid white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;

                        i {
                            color: white;
                            font-size: 0.8rem;
                        }
                    }

                    .story-ring {
                        position: absolute;
                        top: -2px;
                        left: -2px;
                        right: -2px;
                        bottom: -2px;
                        border: 2px solid var(--bs-primary);
                        border-radius: 50%;
                    }
                }

                .story-label {
                    font-size: 0.8rem;
                    color: var(--bs-dark);
                    font-weight: 500;
                }

                &.viewed {
                    .story-ring {
                        border-color: var(--bs-secondary);
                    }
                }

                &.add-story {
                    .story-label {
                        color: var(--bs-primary);
                    }
                }
            }
        }
    }

    .create-post-card {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

        .create-post-header {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;

            .create-post-input {
                flex: 1;
                cursor: pointer;

                input {
                    width: 100%;
                    border: none;
                    background: var(--bs-light);
                    border-radius: 25px;
                    padding: 0.75rem 1.5rem;
                    cursor: pointer;

                    &:focus {
                        outline: none;
                    }
                }
            }
        }

        .create-post-actions {
            display: flex;
            gap: 1rem;

            .action-btn {
                flex: 1;
                border: none;
                background: none;
                padding: 0.75rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                transition: background 0.2s ease;

                &:hover {
                    background: var(--bs-light);
                }

                span {
                    font-size: 0.9rem;
                    font-weight: 500;
                }
            }
        }
    }

    .feed-filter {
        background: white;
        border-radius: 15px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

        .filter-tabs {
            display: flex;
            gap: 0.5rem;

            .filter-tab {
                flex: 1;
                border: none;
                background: none;
                padding: 0.75rem 1rem;
                border-radius: 25px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                transition: all 0.2s ease;
                color: var(--bs-secondary);

                &:hover {
                    background: var(--bs-light);
                }

                &.active {
                    background: var(--bs-primary);
                    color: white;
                }

                span {
                    font-weight: 500;
                }
            }
        }
    }

    .load-more-trigger {
        height: 20px;
    }

    .no-more-posts,
    .empty-feed {
        background: white;
        border-radius: 15px;
        padding: 2rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }
}

// Right Sidebar
.right-sidebar {
    position: sticky;
    top: 1rem;
    height: fit-content;

    .section-title {
        font-weight: 600;
        color: var(--bs-dark);
        margin-bottom: 1rem;
        font-size: 0.9rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .online-friends,
    .friend-suggestions,
    .upcoming-events,
    .sponsored-content {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .friends-list {
        .friend-item {
            display: flex;
            align-items: center;
            padding: 0.75rem 0;
            cursor: pointer;
            border-radius: 8px;
            transition: background 0.2s ease;

            &:hover {
                background: var(--bs-light);
            }

            .friend-avatar {
                position: relative;
                margin-right: 0.75rem;

                .online-indicator {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 12px;
                    height: 12px;
                    background: var(--bs-success);
                    border: 2px solid white;
                    border-radius: 50%;
                }
            }

            .friend-info {
                .friend-name {
                    display: block;
                    font-weight: 600;
                    color: var(--bs-dark);
                }

                .friend-status {
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                }
            }
        }
    }

    .suggestions-list {
        .suggestion-item {
            display: flex;
            align-items: center;
            padding: 1rem 0;
            border-bottom: 1px solid var(--bs-border-color-translucent);

            &:last-child {
                border-bottom: none;
            }

            .suggestion-avatar {
                margin-right: 0.75rem;
            }

            .suggestion-info {
                flex: 1;

                .suggestion-name {
                    margin: 0 0 0.25rem 0;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .suggestion-mutual {
                    margin: 0 0 0.75rem 0;
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                }

                .suggestion-actions {
                    display: flex;
                    gap: 0.5rem;

                    .btn {
                        font-size: 0.8rem;
                        padding: 0.25rem 0.75rem;
                    }
                }
            }
        }
    }

    .events-list {
        .event-item {
            display: flex;
            padding: 1rem 0;
            border-bottom: 1px solid var(--bs-border-color-translucent);

            &:last-child {
                border-bottom: none;
            }

            .event-date {
                width: 50px;
                text-align: center;
                margin-right: 1rem;

                .event-day {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--bs-primary);
                }

                .event-month {
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                    text-transform: uppercase;
                }
            }

            .event-info {
                flex: 1;

                .event-title {
                    margin: 0 0 0.25rem 0;
                    font-size: 0.9rem;
                    font-weight: 600;
                }

                .event-time,
                .event-attendees {
                    margin: 0;
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                }
            }
        }
    }

    .sponsored-item {
        .sponsored-image {
            width: 100%;
            height: 120px;
            object-fit: cover;
            border-radius: 8px;
            margin-bottom: 0.75rem;
        }

        .sponsored-title {
            font-size: 0.9rem;
            font-weight: 600;
            margin-bottom: 0.5rem;
        }

        .sponsored-description {
            font-size: 0.8rem;
            color: var(--bs-secondary);
            margin-bottom: 0.75rem;
        }
    }
}

// Floating Action Button
.fab-container {
    position: fixed;
    bottom: 2rem;
    right: 2rem;
    z-index: 1000;

    .fab {
        width: 56px;
        height: 56px;
        border-radius: 50%;
        background: var(--bs-primary);
        color: white;
        border: none;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
        transition: all 0.3s ease;

        &:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
        }
    }
}

// Responsive
@media (max-width: 992px) {
    .feed-view {
        padding-top: 0.5rem;
    }

    .main-content {
        .stories-section {
            .stories-container {
                padding: 0.75rem;
            }
        }

        .create-post-card,
        .feed-filter {
            margin-left: 0.5rem;
            margin-right: 0.5rem;
        }

        .posts-feed {
            padding: 0 0.5rem;
        }
    }
}

@media (max-width: 576px) {
    .main-content {
        .create-post-actions {
            .action-btn {
                span {
                    display: none;
                }
            }
        }

        .filter-tabs {
            .filter-tab {
                span {
                    display: none;
                }
            }
        }
    }
}
</style>