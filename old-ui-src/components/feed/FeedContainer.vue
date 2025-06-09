<template>
    <div class="feed-container">
        <!-- Feed Header -->
        <div class="feed-header">
            <div class="feed-title">
                <h4>{{ feedTitle }}</h4>
                <p class="feed-subtitle">{{ feedSubtitle }}</p>
            </div>

            <div class="feed-actions">
                <FeedFilter :current-filter="currentFilter" :filters="availableFilters"
                    @filter-change="handleFilterChange" />

                <button class="btn btn-outline-secondary btn-sm refresh-btn" @click="refreshFeed"
                    :disabled="isRefreshing">
                    <i :class="['fas fa-sync-alt', { 'fa-spin': isRefreshing }]"></i>
                </button>
            </div>
        </div>

        <!-- Create Post (if enabled) -->
        <div v-if="showCreatePost" class="create-post-section">
            <PostCreate @submit="handlePostCreated" />
        </div>

        <!-- Feed Content -->
        <div class="feed-content">
            <!-- Loading state -->
            <div v-if="isLoading && feedItems.length === 0" class="loading-container">
                <LoadingSpinner size="large" show-text text="Đang tải bảng tin..." />
            </div>

            <!-- Empty state -->
            <div v-else-if="feedItems.length === 0 && !isLoading" class="empty-feed">
                <div class="empty-icon">
                    <i class="fas fa-newspaper"></i>
                </div>
                <h5>{{ emptyTitle }}</h5>
                <p class="text-muted">{{ emptyMessage }}</p>
                <button v-if="showEmptyAction" class="btn btn-primary" @click="handleEmptyAction">
                    {{ emptyActionText }}
                </button>
            </div>

            <!-- Feed items -->
            <div v-else class="feed-items">
                <FeedItem v-for="item in feedItems" :key="item.id" :item="item" :feed-type="feedType"
                    @like="handleItemLike" @comment="handleItemComment" @share="handleItemShare" @save="handleItemSave"
                    @follow="handleUserFollow" @hide="handleItemHide" @report="handleItemReport" />

                <!-- Load more trigger -->
                <InfiniteScroll :is-loading="isLoadingMore" :has-more="hasMore" :threshold="scrollThreshold"
                    @load-more="loadMoreItems">
                    <template #loading>
                        <div class="loading-more">
                            <LoadingSpinner size="medium" />
                            <span class="ms-2">Đang tải thêm...</span>
                        </div>
                    </template>

                    <template #no-more>
                        <div class="no-more-items">
                            <i class="fas fa-check-circle me-2"></i>
                            Bạn đã xem hết tất cả bài viết
                        </div>
                    </template>
                </InfiniteScroll>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useFeedStore } from '@/stores/feed'
import { usePostStore } from '@/stores/post'
import { useUserStore } from '@/stores/user'
import { useToast } from 'vue-toastification'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import PostCreate from '@/components/post/PostCreate.vue'
import FeedFilter from './FeedFilter.vue'
import FeedItem from './FeedItem.vue'
import InfiniteScroll from './InfiniteScroll.vue'

const props = defineProps({
    feedType: {
        type: String,
        default: 'home',
        validator: (value) => ['home', 'discover', 'trending', 'following', 'saved'].includes(value)
    },
    showCreatePost: {
        type: Boolean,
        default: true
    },
    scrollThreshold: {
        type: Number,
        default: 200
    }
})

const emit = defineEmits(['post-created', 'filter-changed'])

const feedStore = useFeedStore()
const postStore = usePostStore()
const userStore = useUserStore()
const toast = useToast()

// State
const currentFilter = ref('latest')
const isRefreshing = ref(false)

// Computed
const feedItems = computed(() => {
    switch (props.feedType) {
        case 'home':
            return feedStore.homeFeed
        case 'discover':
            return feedStore.discoverFeed
        case 'trending':
            return feedStore.trendingFeed
        case 'following':
            return feedStore.followingFeed
        case 'saved':
            return feedStore.savedPosts
        default:
            return feedStore.homeFeed
    }
})

const isLoading = computed(() => feedStore.isLoading)
const isLoadingMore = computed(() => feedStore.isLoadingMore)
const hasMore = computed(() => feedStore.hasMorePosts)

const feedTitle = computed(() => {
    const titles = {
        home: 'Bảng tin',
        discover: 'Khám phá',
        trending: 'Xu hướng',
        following: 'Đang theo dõi',
        saved: 'Đã lưu'
    }
    return titles[props.feedType] || 'Bảng tin'
})

const feedSubtitle = computed(() => {
    const subtitles = {
        home: 'Cập nhật mới nhất từ những người bạn theo dõi',
        discover: 'Khám phá nội dung thú vị từ cộng đồng',
        trending: 'Những bài viết đang được quan tâm nhất',
        following: 'Bài viết từ những người bạn theo dõi',
        saved: 'Những bài viết bạn đã lưu lại'
    }
    return subtitles[props.feedType] || ''
})

const availableFilters = computed(() => {
    const commonFilters = [
        { value: 'latest', label: 'Mới nhất' },
        { value: 'popular', label: 'Phổ biến' }
    ]

    if (props.feedType === 'trending') {
        return [
            ...commonFilters,
            { value: 'today', label: 'Hôm nay' },
            { value: 'week', label: 'Tuần này' },
            { value: 'month', label: 'Tháng này' }
        ]
    }

    return commonFilters
})

const emptyTitle = computed(() => {
    const titles = {
        home: 'Bảng tin trống',
        discover: 'Chưa có nội dung',
        trending: 'Chưa có xu hướng',
        following: 'Chưa có bài viết mới',
        saved: 'Chưa có bài viết đã lưu'
    }
    return titles[props.feedType] || 'Chưa có nội dung'
})

const emptyMessage = computed(() => {
    const messages = {
        home: 'Hãy theo dõi một số người để xem bài viết của họ tại đây.',
        discover: 'Hãy quay lại sau để khám phá nội dung mới.',
        trending: 'Chưa có bài viết nào đang xu hướng.',
        following: 'Những người bạn theo dõi chưa đăng bài viết mới.',
        saved: 'Bạn chưa lưu bài viết nào. Hãy lưu những bài viết thú vị!'
    }
    return messages[props.feedType] || ''
})

const showEmptyAction = computed(() => {
    return ['home', 'discover'].includes(props.feedType)
})

const emptyActionText = computed(() => {
    return props.feedType === 'home' ? 'Tìm người để theo dõi' : 'Khám phá ngay'
})

// Actions
const loadFeed = async (reset = false) => {
    try {
        const params = {
            filter: currentFilter.value,
            reset
        }

        switch (props.feedType) {
            case 'home':
                await feedStore.fetchHomeFeed(params, reset)
                break
            case 'discover':
                await feedStore.fetchDiscoverFeed(params)
                break
            case 'trending':
                await feedStore.fetchTrendingFeed(params)
                break
            case 'following':
                await feedStore.fetchFollowingFeed(params)
                break
            case 'saved':
                await feedStore.fetchSavedPosts(params)
                break
        }
    } catch (error) {
        console.error('Failed to load feed:', error)
        toast.error('Không thể tải bảng tin. Vui lòng thử lại.')
    }
}

const loadMoreItems = async () => {
    if (!hasMore.value || isLoadingMore.value) return

    try {
        await feedStore.loadMorePosts()
    } catch (error) {
        console.error('Failed to load more items:', error)
        toast.error('Không thể tải thêm bài viết.')
    }
}

const refreshFeed = async () => {
    isRefreshing.value = true

    try {
        await feedStore.refreshFeed()
        toast.success('Đã cập nhật bảng tin!')
    } catch (error) {
        console.error('Failed to refresh feed:', error)
        toast.error('Không thể làm mới bảng tin.')
    } finally {
        isRefreshing.value = false
    }
}

const handleFilterChange = (filter) => {
    currentFilter.value = filter
    emit('filter-changed', filter)
    loadFeed(true)
}

const handlePostCreated = (post) => {
    emit('post-created', post)
    toast.success('Đăng bài thành công!')

    // Refresh feed to show new post
    if (props.feedType === 'home') {
        loadFeed(true)
    }
}

const handleItemLike = async (item) => {
    try {
        if (item.isLiked) {
            await postStore.unlikePost(item.id)
        } else {
            await postStore.likePost(item.id)
        }

        // Update feed item
        feedStore.updatePostInFeed(item.id, {
            isLiked: !item.isLiked,
            likesCount: item.isLiked ? item.likesCount - 1 : item.likesCount + 1
        })
    } catch (error) {
        console.error('Failed to toggle like:', error)
        toast.error('Không thể thực hiện hành động này.')
    }
}

const handleItemComment = (item) => {
    // Navigate to post detail for commenting
    router.push(`/app/post/${item.id}`)
}

const handleItemShare = async (item) => {
    try {
        await postStore.sharePost(item.id)
        feedStore.updatePostInFeed(item.id, {
            sharesCount: item.sharesCount + 1
        })
        toast.success('Đã chia sẻ bài viết!')
    } catch (error) {
        console.error('Failed to share post:', error)
        toast.error('Không thể chia sẻ bài viết.')
    }
}

const handleItemSave = async (item) => {
    try {
        if (item.isSaved) {
            await postStore.unsavePost(item.id)
            toast.success('Đã bỏ lưu bài viết!')
        } else {
            await postStore.savePost(item.id)
            toast.success('Đã lưu bài viết!')
        }

        feedStore.updatePostInFeed(item.id, {
            isSaved: !item.isSaved
        })
    } catch (error) {
        console.error('Failed to toggle save:', error)
        toast.error('Không thể thực hiện hành động này.')
    }
}

const handleUserFollow = async (user) => {
    try {
        if (user.isFollowing) {
            await userStore.unfollowUser(user.id)
            toast.success(`Đã bỏ theo dõi ${user.name}`)
        } else {
            await userStore.followUser(user.id)
            toast.success(`Đã theo dõi ${user.name}`)
        }
    } catch (error) {
        console.error('Failed to toggle follow:', error)
        toast.error('Không thể thực hiện hành động này.')
    }
}

const handleItemHide = (item) => {
    feedStore.removePostFromFeed(item.id)
    toast.info('Đã ẩn bài viết')
}

const handleItemReport = (item) => {
    // Handle report logic
    toast.info('Đã báo cáo bài viết. Chúng tôi sẽ xem xét.')
}

const handleEmptyAction = () => {
    if (props.feedType === 'home') {
        router.push('/app/search')
    } else if (props.feedType === 'discover') {
        loadFeed(true)
    }
}

// Lifecycle
onMounted(() => {
    loadFeed(true)
})

// Watchers
watch(() => props.feedType, () => {
    loadFeed(true)
})
</script>

<style lang="scss" scoped>
.feed-container {
    .feed-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        padding: 1rem;
        background: white;
        border-radius: 0.75rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .feed-title {
            flex: 1;

            h4 {
                margin: 0 0 0.25rem 0;
                font-weight: 700;
                color: var(--bs-body-color);
            }

            .feed-subtitle {
                margin: 0;
                font-size: 0.875rem;
                color: var(--bs-secondary);
            }
        }

        .feed-actions {
            display: flex;
            align-items: center;
            gap: 0.75rem;

            .refresh-btn {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 36px;
                height: 36px;
                border-radius: 50%;
            }
        }
    }

    .create-post-section {
        margin-bottom: 1rem;
    }

    .feed-content {
        .loading-container {
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 300px;
        }

        .empty-feed {
            text-align: center;
            padding: 3rem 1rem;
            background: white;
            border-radius: 0.75rem;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

            .empty-icon {
                font-size: 4rem;
                color: var(--bs-secondary);
                margin-bottom: 1rem;
            }

            h5 {
                margin-bottom: 0.75rem;
                color: var(--bs-body-color);
            }

            p {
                margin-bottom: 1.5rem;
                max-width: 400px;
                margin-left: auto;
                margin-right: auto;
            }
        }

        .feed-items {
            .loading-more {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: var(--bs-secondary);
            }

            .no-more-items {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                color: var(--bs-secondary);
                font-style: italic;
            }
        }
    }
}

// Mobile adjustments
@media (max-width: 768px) {
    .feed-container {
        .feed-header {
            padding: 0.75rem;
            margin-bottom: 0.75rem;

            .feed-title {
                h4 {
                    font-size: 1.25rem;
                }
            }

            .feed-actions {
                gap: 0.5rem;
            }
        }
    }
}
</style>