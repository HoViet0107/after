// Trang hiển thị kết quả tìm kiếm với filtering, sorting và pagination
<template>
    <div class="search-view">
        <div class="container-fluid">
            <div class="row">
                <!-- Search Header -->
                <div class="col-12">
                    <div class="search-header bg-white p-4 mb-4 rounded shadow-sm">
                        <div class="row align-items-center">
                            <div class="col-md-8">
                                <div class="search-input-group">
                                    <div class="input-group">
                                        <input
                                            v-model="searchQuery"
                                            type="text"
                                            class="form-control form-control-lg"
                                            placeholder="Tìm kiếm bài viết, người dùng..."
                                            @keyup.enter="performSearch"
                                            @input="debounceSearch"
                                        >
                                        <button 
                                            class="btn btn-primary"
                                            @click="performSearch"
                                            :disabled="isSearching"
                                        >
                                            <i v-if="isSearching" class="fas fa-spinner fa-spin"></i>
                                            <i v-else class="fas fa-search"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <div class="search-filters d-flex gap-2">
                                    <select v-model="searchType" class="form-select" @change="performSearch">
                                        <option value="all">Tất cả</option>
                                        <option value="posts">Bài viết</option>
                                        <option value="users">Người dùng</option>
                                        <option value="hashtags">Hashtag</option>
                                    </select>
                                    <select v-model="sortBy" class="form-select" @change="performSearch">
                                        <option value="relevance">Liên quan</option>
                                        <option value="date">Mới nhất</option>
                                        <option value="popularity">Phổ biến</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Search Results -->
                <div class="col-12">
                    <!-- Loading State -->
                    <div v-if="isSearching" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Đang tìm kiếm...</span>
                        </div>
                        <p class="mt-3 text-muted">Đang tìm kiếm...</p>
                    </div>

                    <!-- No Results -->
                    <div v-else-if="!isSearching && searchResults.length === 0 && hasSearched" class="text-center py-5">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h5>Không tìm thấy kết quả</h5>
                        <p class="text-muted">Hãy thử từ khóa khác hoặc kiểm tra lại chính tả</p>
                    </div>

                    <!-- Search Results -->
                    <div v-else-if="searchResults.length > 0" class="search-results">
                        <!-- Results Summary -->
                        <div class="results-summary mb-3">
                            <small class="text-muted">
                                Tìm thấy {{ totalResults }} kết quả cho "{{ lastSearchQuery }}" 
                                ({{ searchTime }}ms)
                            </small>
                        </div>

                        <!-- Results List -->
                        <div class="results-grid">
                            <!-- Post Results -->
                            <div v-for="result in searchResults" :key="result.id" class="result-item mb-3">
                                <!-- Post Result -->
                                <div v-if="result.type === 'post'" class="card">
                                    <div class="card-body">
                                        <div class="d-flex">
                                            <img
                                                :src="result.author.avatar"
                                                :alt="result.author.name"
                                                class="rounded-circle me-3"
                                                width="40"
                                                height="40"
                                            >
                                            <div class="flex-grow-1">
                                                <div class="d-flex justify-content-between align-items-start">
                                                    <div>
                                                        <router-link 
                                                            :to="{ name: 'Profile', params: { userId: result.author.id } }"
                                                            class="fw-bold text-decoration-none"
                                                        >
                                                            {{ result.author.name }}
                                                        </router-link>
                                                        <small class="text-muted ms-2">
                                                            @{{ result.author.username }}
                                                        </small>
                                                    </div>
                                                    <small class="text-muted">
                                                        {{ formatDate(result.createdAt) }}
                                                    </small>
                                                </div>
                                                <p class="mt-2 mb-2" v-html="highlightSearchTerms(result.content)"></p>
                                                <div class="post-stats d-flex gap-3 text-muted">
                                                    <small><i class="fas fa-heart"></i> {{ result.likesCount }}</small>
                                                    <small><i class="fas fa-comment"></i> {{ result.commentsCount }}</small>
                                                    <small><i class="fas fa-share"></i> {{ result.sharesCount }}</small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- User Result -->
                                <div v-else-if="result.type === 'user'" class="card">
                                    <div class="card-body">
                                        <div class="d-flex align-items-center">
                                            <img
                                                :src="result.avatar"
                                                :alt="result.name"
                                                class="rounded-circle me-3"
                                                width="50"
                                                height="50"
                                            >
                                            <div class="flex-grow-1">
                                                <div class="d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <router-link 
                                                            :to="{ name: 'Profile', params: { userId: result.id } }"
                                                            class="fw-bold text-decoration-none"
                                                        >
                                                            {{ result.name }}
                                                        </router-link>
                                                        <div class="text-muted">@{{ result.username }}</div>
                                                        <small class="text-muted">{{ result.bio }}</small>
                                                    </div>
                                                    <button 
                                                        class="btn btn-outline-primary btn-sm"
                                                        @click="toggleFollow(result)"
                                                        :disabled="result.isFollowing === null"
                                                    >
                                                        {{ result.isFollowing ? 'Bỏ theo dõi' : 'Theo dõi' }}
                                                    </button>
                                                </div>
                                                <div class="user-stats mt-2">
                                                    <small class="text-muted me-3">
                                                        <strong>{{ result.followersCount }}</strong> người theo dõi
                                                    </small>
                                                    <small class="text-muted">
                                                        <strong>{{ result.postsCount }}</strong> bài viết
                                                    </small>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Hashtag Result -->
                                <div v-else-if="result.type === 'hashtag'" class="card">
                                    <div class="card-body">
                                        <div class="d-flex justify-content-between align-items-center">
                                            <div>
                                                <h6 class="mb-1">
                                                    <router-link 
                                                        :to="{ name: 'Search', query: { q: result.tag } }"
                                                        class="text-primary text-decoration-none"
                                                    >
                                                        #{{ result.tag }}
                                                    </router-link>
                                                </h6>
                                                <small class="text-muted">{{ result.postsCount }} bài viết</small>
                                            </div>
                                            <button 
                                                class="btn btn-outline-primary btn-sm"
                                                @click="followHashtag(result.tag)"
                                            >
                                                {{ result.isFollowing ? 'Bỏ theo dõi' : 'Theo dõi' }}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Load More -->
                        <div v-if="hasMoreResults" class="text-center mt-4">
                            <button 
                                class="btn btn-outline-primary"
                                @click="loadMoreResults"
                                :disabled="isLoadingMore"
                            >
                                <i v-if="isLoadingMore" class="fas fa-spinner fa-spin me-2"></i>
                                {{ isLoadingMore ? 'Đang tải...' : 'Tải thêm' }}
                            </button>
                        </div>
                    </div>

                    <!-- Initial State -->
                    <div v-else class="text-center py-5">
                        <i class="fas fa-search fa-3x text-muted mb-3"></i>
                        <h5>Tìm kiếm</h5>
                        <p class="text-muted">Nhập từ khóa để tìm kiếm bài viết, người dùng hoặc hashtag</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash'
import { searchAPI } from '@/api/services/searchService'
import { followAPI } from '@/api/services/followService'
import { formatDate } from '@/filters/dateFilter'

// Composables
const route = useRoute()
const router = useRouter()
const toast = useToast()

// Reactive data
const searchQuery = ref('')
const searchType = ref('all')
const sortBy = ref('relevance')
const searchResults = ref([])
const isSearching = ref(false)
const isLoadingMore = ref(false)
const hasSearched = ref(false)
const totalResults = ref(0)
const currentPage = ref(1)
const lastSearchQuery = ref('')
const searchTime = ref(0)

// Computed
const hasMoreResults = computed(() => {
    return searchResults.value.length > 0 && searchResults.value.length < totalResults.value
})

// Debounced search
const debounceSearch = debounce(() => {
    if (searchQuery.value.trim().length >= 2) {
        performSearch()
    }
}, 500)

// Methods
const performSearch = async () => {
    if (!searchQuery.value.trim()) return

    try {
        isSearching.value = true
        hasSearched.value = true
        currentPage.value = 1
        lastSearchQuery.value = searchQuery.value
        
        const startTime = Date.now()
        
        const response = await searchAPI.search({
            query: searchQuery.value,
            type: searchType.value,
            sortBy: sortBy.value,
            page: 1,
            limit: 20
        })

        searchTime.value = Date.now() - startTime
        searchResults.value = response.data.results
        totalResults.value = response.data.total
        
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
        isSearching.value = false
    }
}

const loadMoreResults = async () => {
    try {
        isLoadingMore.value = true
        currentPage.value++

        const response = await searchAPI.search({
            query: lastSearchQuery.value,
            type: searchType.value,
            sortBy: sortBy.value,
            page: currentPage.value,
            limit: 20
        })

        searchResults.value.push(...response.data.results)

    } catch (error) {
        console.error('Load more error:', error)
        toast.error('Có lỗi xảy ra khi tải thêm kết quả')
        currentPage.value--
    } finally {
        isLoadingMore.value = false
    }
}

const highlightSearchTerms = (text) => {
    if (!lastSearchQuery.value) return text
    
    const regex = new RegExp(`(${lastSearchQuery.value})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
}

const toggleFollow = async (user) => {
    try {
        if (user.isFollowing) {
            await followAPI.unfollow(user.id)
            user.isFollowing = false
            user.followersCount--
        } else {
            await followAPI.follow(user.id)
            user.isFollowing = true
            user.followersCount++
        }
    } catch (error) {
        console.error('Follow toggle error:', error)
        toast.error('Có lỗi xảy ra')
    }
}

const followHashtag = async (hashtag) => {
    try {
        // TODO: Implement hashtag follow functionality
        toast.success(`Đã theo dõi hashtag #${hashtag}`)
    } catch (error) {
        console.error('Hashtag follow error:', error)
        toast.error('Có lỗi xảy ra')
    }
}

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

onUnmounted(() => {
    debounceSearch.cancel()
})
</script>

<style lang="scss" scoped>
.search-view {
    min-height: 100vh;
    background-color: #f8f9fa;

    .search-header {
        .search-input-group .input-group {
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            
            .form-control {
                border-right: 0;
                
                &:focus {
                    box-shadow: none;
                    border-color: #0d6efd;
                }
            }
            
            .btn {
                border-left: 0;
            }
        }
        
        .search-filters {
            .form-select {
                min-width: 120px;
            }
        }
    }

    .result-item {
        transition: transform 0.2s ease;
        
        &:hover {
            transform: translateY(-2px);
        }
        
        .card {
            border: 1px solid #e9ecef;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            
            &:hover {
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
        }
    }

    .results-summary {
        border-bottom: 1px solid #e9ecef;
        padding-bottom: 10px;
    }

    .post-stats {
        font-size: 0.875rem;
        
        i {
            width: 16px;
        }
    }

    .user-stats {
        font-size: 0.875rem;
    }

    mark {
        background-color: #fff3cd;
        padding: 0 2px;
        border-radius: 2px;
    }
}

@media (max-width: 768px) {
    .search-view {
        .search-header {
            .row {
                flex-direction: column;
                gap: 1rem;
            }
            
            .search-filters {
                flex-direction: column;
                
                .form-select {
                    min-width: auto;
                }
            }
        }
    }
}
</style>