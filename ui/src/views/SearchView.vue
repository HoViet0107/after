<template>
    <div class="search-view">
        <div class="container-fluid">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <!-- Search Header -->
                    <div class="search-header">
                        <div class="search-input-container">
                            <div class="input-group">
                                <span class="input-group-text">
                                    <i class="fas fa-search"></i>
                                </span>
                                <input v-model="searchQuery" type="text" class="form-control form-control-lg"
                                    placeholder="Tìm kiếm bài viết, người dùng, hashtag..." @input="handleSearch"
                                    @keydown.enter="performSearch">
                                <button v-if="searchQuery" class="btn btn-outline-secondary" @click="clearSearch">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>

                        <!-- Search Filters -->
                        <div class="search-filters">
                            <div class="filter-tabs">
                                <button v-for="filter in searchFilters" :key="filter.key" class="filter-tab"
                                    :class="{ active: searchType === filter.key }" @click="setSearchType(filter.key)">
                                    <i :class="filter.icon"></i>
                                    <span>{{ filter.label }}</span>
                                </button>
                            </div>

                            <div class="sort-options">
                                <select v-model="sortBy" class="form-select" @change="performSearch">
                                    <option value="relevance">Liên quan nhất</option>
                                    <option value="newest">Mới nhất</option>
                                    <option value="popular">Phổ biến</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Search Results -->
                    <div class="search-results">
                        <!-- Search Status -->
                        <div v-if="hasSearched && searchQuery" class="search-status">
                            <div v-if="loading.search" class="search-loading">
                                <i class="fas fa-spinner fa-spin me-2"></i>
                                Đang tìm kiếm...
                            </div>
                            <div v-else class="search-info">
                                <span class="results-count">
                                    {{ formatNumber(totalResults) }} kết quả
                                </span>
                                <span class="search-time">
                                    ({{ searchTime }}ms)
                                </span>
                                <span class="search-query">
                                    cho "<strong>{{ lastSearchQuery }}</strong>"
                                </span>
                            </div>
                        </div>

                        <!-- Results Content -->
                        <div class="results-content">
                            <!-- Loading State -->
                            <div v-if="loading.search && searchResults.length === 0" class="loading-skeleton">
                                <div v-for="i in 10" :key="i" class="skeleton-item"></div>
                            </div>

                            <!-- No Results -->
                            <div v-else-if="hasSearched && searchResults.length === 0 && !loading.search"
                                class="no-results">
                                <i class="fas fa-search fa-3x text-muted"></i>
                                <h5 class="mt-3">Không tìm thấy kết quả</h5>
                                <p class="text-muted">
                                    Không tìm thấy kết quả nào cho "<strong>{{ lastSearchQuery }}</strong>".
                                    Hãy thử với từ khóa khác.
                                </p>
                                <div class="search-suggestions">
                                    <h6>Gợi ý:</h6>
                                    <ul>
                                        <li>Kiểm tra chính tả từ khóa</li>
                                        <li>Sử dụng từ khóa chung hơn</li>
                                        <li>Thử tìm kiếm với các bộ lọc khác</li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Search Results -->
                            <div v-else-if="searchResults.length > 0" class="results-list">
                                <!-- Users Results -->
                                <div v-if="searchType === 'users' || searchType === 'all'">
                                    <div v-for="user in getUserResults" :key="`user-${user.id}`"
                                        class="result-item user-result">
                                        <UserAvatar :user="user" :size="48" />
                                        <div class="result-info">
                                            <router-link :to="`/app/profile/${user.id}`" class="result-title">
                                                {{ user.name }}
                                            </router-link>
                                            <p class="result-subtitle">@{{ user.username }}</p>
                                            <p v-if="user.bio" class="result-description">{{ truncateText(user.bio, 100)
                                            }}</p>
                                            <div class="result-meta">
                                                <span>{{ formatNumber(user.followersCount) }} người theo dõi</span>
                                            </div>
                                        </div>
                                        <div class="result-actions">
                                            <button v-if="user.id !== currentUser?.id" class="btn btn-sm"
                                                :class="user.isFollowing ? 'btn-outline-primary' : 'btn-primary'"
                                                @click="toggleFollow(user)">
                                                {{ user.isFollowing ? 'Bỏ theo dõi' : 'Theo dõi' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Posts Results -->
                                <div v-if="searchType === 'posts' || searchType === 'all'">
                                    <div v-for="post in getPostResults" :key="`post-${post.id}`"
                                        class="result-item post-result">
                                        <PostCard :post="post" @like="handlePostLike" @comment="handlePostComment"
                                            @share="handlePostShare" />
                                    </div>
                                </div>

                                <!-- Hashtags Results -->
                                <div v-if="searchType === 'hashtags' || searchType === 'all'">
                                    <div v-for="hashtag in getHashtagResults" :key="`hashtag-${hashtag.id}`"
                                        class="result-item hashtag-result">
                                        <div class="hashtag-icon">
                                            <i class="fas fa-hashtag"></i>
                                        </div>
                                        <div class="result-info">
                                            <router-link :to="`/app/hashtag/${hashtag.name}`" class="result-title">
                                                #{{ hashtag.name }}
                                            </router-link>
                                            <p class="result-meta">
                                                {{ formatNumber(hashtag.postsCount) }} bài viết
                                            </p>
                                        </div>
                                        <div class="result-actions">
                                            <button class="btn btn-sm btn-outline-primary"
                                                @click="followHashtag(hashtag)">
                                                Theo dõi
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <!-- Load More -->
                                <div v-if="hasMoreResults" class="load-more-container">
                                    <button class="btn btn-outline-primary w-100" :disabled="loading.more"
                                        @click="loadMoreResults">
                                        <i v-if="loading.more" class="fas fa-spinner fa-spin me-2"></i>
                                        {{ loading.more ? 'Đang tải...' : 'Tải thêm kết quả' }}
                                    </button>
                                </div>
                            </div>

                            <!-- Initial State -->
                            <div v-else class="initial-state">
                                <i class="fas fa-search fa-4x text-muted"></i>
                                <h4 class="mt-3">Tìm kiếm</h4>
                                <p class="text-muted">
                                    Nhập từ khóa để tìm kiếm bài viết, người dùng hoặc hashtag
                                </p>

                                <!-- Popular Searches -->
                                <div class="popular-searches">
                                    <h6>Tìm kiếm phổ biến:</h6>
                                    <div class="popular-tags">
                                        <button v-for="tag in popularSearches" :key="tag"
                                            class="btn btn-sm btn-outline-secondary me-2 mb-2"
                                            @click="searchPopular(tag)">
                                            {{ tag }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAppStores } from '@/composables/useAppStores'
import { useLoadingStates } from '@/composables/useLoadingStates'
import { debounce } from 'lodash-es'
import { formatNumber, truncateText } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'
import PostCard from '@/components/post/PostCard.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { authStore, postStore, userStore } = useAppStores()
const { loading, setLoading } = useLoadingStates(['search', 'more'])

// State
const searchQuery = ref('')
const searchType = ref('all')
const sortBy = ref('relevance')
const searchResults = ref([])
const totalResults = ref(0)
const currentPage = ref(1)
const hasSearched = ref(false)
const lastSearchQuery = ref('')
const searchTime = ref(0)
const hasMoreResults = ref(false)

// Data
const searchFilters = ref([
    { key: 'all', label: 'Tất cả', icon: 'fas fa-globe' },
    { key: 'posts', label: 'Bài viết', icon: 'fas fa-newspaper' },
    { key: 'users', label: 'Người dùng', icon: 'fas fa-users' },
    { key: 'hashtags', label: 'Hashtag', icon: 'fas fa-hashtag' }
])

const popularSearches = ref([
    '#travel', '#food', '#technology', '#lifestyle', '#photography'
])

// Computed
const currentUser = computed(() => authStore.user)

const getUserResults = computed(() => {
    return searchResults.value.filter(item => item.type === 'user')
})

const getPostResults = computed(() => {
    return searchResults.value.filter(item => item.type === 'post')
})

const getHashtagResults = computed(() => {
    return searchResults.value.filter(item => item.type === 'hashtag')
})

// Debounced search
const debouncedSearch = debounce(() => {
    if (searchQuery.value.trim().length >= 2) {
        performSearch()
    }
}, 500)

// Methods
const handleSearch = () => {
    debouncedSearch()
}

const performSearch = async () => {
    if (!searchQuery.value.trim()) return

    const startTime = Date.now()
    setLoading('search', true)
    hasSearched.value = true
    lastSearchQuery.value = searchQuery.value
    currentPage.value = 1

    try {
        // Mock API call - replace with actual API
        const response = await mockSearchAPI({
            query: searchQuery.value,
            type: searchType.value,
            sort: sortBy.value,
            page: currentPage.value,
            limit: 20
        })

        searchTime.value = Date.now() - startTime
        searchResults.value = response.data
        totalResults.value = response.total
        hasMoreResults.value = response.hasMore

        // Update URL
        router.push({
            name: 'Search',
            query: {
                q: searchQuery.value,
                type: searchType.value !== 'all' ? searchType.value : undefined,
                sort: sortBy.value !== 'relevance' ? sortBy.value : undefined
            }
        })

    } catch (error) {
        console.error('Search error:', error)
        toast.error('Có lỗi xảy ra khi tìm kiếm')
        searchResults.value = []
        totalResults.value = 0
    } finally {
        setLoading('search', false)
    }
}

const loadMoreResults = async () => {
    if (loading.more || !hasMoreResults.value) return

    setLoading('more', true)
    currentPage.value++

    try {
        const response = await mockSearchAPI({
            query: lastSearchQuery.value,
            type: searchType.value,
            sort: sortBy.value,
            page: currentPage.value,
            limit: 20
        })

        searchResults.value.push(...response.data)
        hasMoreResults.value = response.hasMore

    } catch (error) {
        console.error('Load more error:', error)
        currentPage.value-- // Rollback
        toast.error('Có lỗi xảy ra khi tải thêm kết quả')
    } finally {
        setLoading('more', false)
    }
}

const setSearchType = (type) => {
    searchType.value = type
    if (hasSearched.value && searchQuery.value) {
        performSearch()
    }
}

const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    hasSearched.value = false
    totalResults.value = 0
    router.push({ name: 'Search' })
}

const searchPopular = (tag) => {
    searchQuery.value = tag
    performSearch()
}

const toggleFollow = async (user) => {
    try {
        if (user.isFollowing) {
            await userStore.unfollowUser(user.id)
            user.isFollowing = false
            user.followersCount--
        } else {
            await userStore.followUser(user.id)
            user.isFollowing = true
            user.followersCount++
        }

        toast.success(user.isFollowing ? 'Đã theo dõi' : 'Đã bỏ theo dõi')

    } catch (error) {
        console.error('Toggle follow error:', error)
        toast.error('Có lỗi xảy ra')
    }
}

const followHashtag = async (hashtag) => {
    try {
        // Mock hashtag follow
        toast.success(`Đã theo dõi hashtag #${hashtag.name}`)
    } catch (error) {
        console.error('Follow hashtag error:', error)
        toast.error('Có lỗi xảy ra')
    }
}

const handlePostLike = async (postId) => {
    try {
        const post = searchResults.value.find(item => item.type === 'post' && item.id === postId)
        if (post) {
            post.isLiked = !post.isLiked
            post.likesCount += post.isLiked ? 1 : -1
        }

        await postStore.toggleLike(postId)

    } catch (error) {
        console.error('Like post error:', error)
        // Revert optimistic update
        const post = searchResults.value.find(item => item.type === 'post' && item.id === postId)
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
        const post = searchResults.value.find(item => item.type === 'post' && item.id === postId)
        if (post) {
            post.sharesCount++
        }
        toast.success('Chia sẻ thành công')
    } catch (error) {
        console.error('Share post error:', error)
        toast.error('Chia sẻ thất bại')
    }
}

// Mock API function - replace with actual API
const mockSearchAPI = async (params) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // Mock response based on search type
    const mockData = []

    if (params.type === 'all' || params.type === 'users') {
        mockData.push({
            type: 'user',
            id: 1,
            name: 'John Doe',
            username: 'johndoe',
            bio: 'Software Developer at TechCorp',
            avatar: '/avatars/user1.jpg',
            followersCount: 1234,
            isFollowing: false
        })
    }

    if (params.type === 'all' || params.type === 'posts') {
        mockData.push({
            type: 'post',
            id: 1,
            content: 'This is a sample post content',
            author: { id: 1, name: 'John Doe', username: 'johndoe' },
            likesCount: 42,
            commentsCount: 5,
            sharesCount: 2,
            isLiked: false
        })
    }

    if (params.type === 'all' || params.type === 'hashtags') {
        mockData.push({
            type: 'hashtag',
            id: 1,
            name: 'technology',
            postsCount: 15234
        })
    }

    return {
        data: mockData,
        total: mockData.length,
        hasMore: false
    }
}

// Watchers
watch(() => route.query, (newQuery) => {
    if (newQuery.q) {
        searchQuery.value = newQuery.q
        searchType.value = newQuery.type || 'all'
        sortBy.value = newQuery.sort || 'relevance'
        performSearch()
    }
}, { immediate: true })

// Lifecycle
onMounted(() => {
    // Initialize from URL query
    if (route.query.q) {
        searchQuery.value = route.query.q
        searchType.value = route.query.type || 'all'
        sortBy.value = route.query.sort || 'relevance'
        performSearch()
    }
})
</script>

<style lang="scss" scoped>
.search-view {
    min-height: 100vh;
    background: #f8f9fa;
    padding: 2rem 0;
}

.search-header {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
}

.search-input-container {
    margin-bottom: 1.5rem;

    .input-group {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        border-radius: 0.5rem;
        overflow: hidden;

        .input-group-text {
            background: white;
            border: none;
            color: #6c757d;
        }

        .form-control {
            border: none;
            font-size: 1.1rem;

            &:focus {
                box-shadow: none;
            }
        }

        .btn {
            border: none;
        }
    }
}

.search-filters {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 1rem;

    @media (max-width: 768px) {
        flex-direction: column;
        align-items: stretch;
    }
}

.filter-tabs {
    display: flex;
    gap: 0.5rem;

    .filter-tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: 1px solid #e9ecef;
        background: white;
        color: #6c757d;
        border-radius: 0.5rem;
        transition: all 0.2s ease;

        &:hover {
            background: #f8f9fa;
            color: #495057;
        }

        &.active {
            background: #007bff;
            color: white;
            border-color: #007bff;
        }

        i {
            font-size: 0.9rem;
        }
    }
}

.sort-options {
    .form-select {
        min-width: 150px;
    }
}

.search-status {
    padding: 1rem 0;
    border-bottom: 1px solid #e9ecef;
    margin-bottom: 1.5rem;

    .search-loading {
        color: #6c757d;
    }

    .search-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: #6c757d;

        .results-count {
            font-weight: 600;
            color: #495057;
        }

        .search-time {
            font-size: 0.9rem;
        }
    }
}

.results-content {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
    overflow: hidden;
}

.result-item {
    display: flex;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid #f8f9fa;
    transition: background-color 0.2s ease;

    &:hover {
        background: #f8f9fa;
    }

    &:last-child {
        border-bottom: none;
    }

    .result-info {
        flex: 1;
        margin-left: 1rem;

        .result-title {
            font-weight: 600;
            color: #333;
            text-decoration: none;
            margin-bottom: 0.25rem;

            &:hover {
                color: #007bff;
            }
        }

        .result-subtitle {
            color: #6c757d;
            margin: 0;
            font-size: 0.9rem;
        }

        .result-description {
            margin: 0.5rem 0;
            line-height: 1.5;
        }

        .result-meta {
            color: #6c757d;
            font-size: 0.9rem;
        }
    }

    .result-actions {
        margin-left: 1rem;
    }
}

.hashtag-result {
    .hashtag-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #667eea, #764ba2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.2rem;
    }
}

.post-result {
    flex-direction: column;
    align-items: stretch;
}

.no-results {
    text-align: center;
    padding: 4rem 2rem;

    .search-suggestions {
        text-align: left;
        max-width: 400px;
        margin: 2rem auto 0;

        h6 {
            margin-bottom: 1rem;
        }

        ul {
            color: #6c757d;

            li {
                margin-bottom: 0.5rem;
            }
        }
    }
}

.initial-state {
    text-align: center;
    padding: 4rem 2rem;

    .popular-searches {
        margin-top: 2rem;

        h6 {
            margin-bottom: 1rem;
        }

        .popular-tags {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 0.5rem;
        }
    }
}

.loading-skeleton {
    .skeleton-item {
        height: 80px;
        background: #f8f9fa;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        animation: pulse 1.5s ease-in-out infinite alternate;
    }
}

.load-more-container {
    padding: 1.5rem;
    border-top: 1px solid #f8f9fa;
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
    .search-view {
        padding: 1rem 0;
    }

    .filter-tabs {
        flex-wrap: wrap;
    }

    .result-item {
        flex-direction: column;
        align-items: stretch;

        .result-info {
            margin-left: 0;
            margin-top: 1rem;
        }

        .result-actions {
            margin-left: 0;
            margin-top: 1rem;
        }
    }
}
</style>