<!-- Component tìm kiếm người dùng với Redis caching và WebSocket real-time updates -->

<template>
    <div class="user-search">
        <!-- Search Input -->
        <div class="search-input-container">
            <div class="input-group">
                <span class="input-group-text">
                    <i class="fas fa-search"></i>
                </span>
                <input type="text" v-model="searchQuery" class="form-control" placeholder="Tìm kiếm người dùng..."
                    @input="handleSearchInput" @focus="showResults = true" @keydown.enter="selectFirstResult"
                    @keydown.arrow-down="navigateResults(1)" @keydown.arrow-up="navigateResults(-1)"
                    @keydown.escape="hideResults" ref="searchInput" />
                <button v-if="searchQuery" type="button" class="btn btn-outline-secondary" @click="clearSearch">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <!-- Search Filters -->
            <div v-if="showAdvancedSearch" class="search-filters mt-2">
                <div class="row g-2">
                    <div class="col-md-4">
                        <select v-model="filters.location" class="form-select form-select-sm">
                            <option value="">Tất cả địa điểm</option>
                            <option v-for="location in availableLocations" :key="location" :value="location">
                                {{ location }}
                            </option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <select v-model="filters.status" class="form-select form-select-sm">
                            <option value="">Tất cả trạng thái</option>
                            <option value="online">Đang online</option>
                            <option value="offline">Offline</option>
                            <option value="away">Vắng mặt</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <select v-model="filters.relationship" class="form-select form-select-sm">
                            <option value="">Tất cả mối quan hệ</option>
                            <option value="friends">Bạn bè</option>
                            <option value="not_friends">Chưa kết bạn</option>
                            <option value="pending">Đang chờ phản hồi</option>
                        </select>
                    </div>
                </div>
            </div>

            <div class="search-actions mt-2">
                <button type="button" class="btn btn-sm btn-outline-secondary"
                    @click="showAdvancedSearch = !showAdvancedSearch">
                    <i class="fas fa-filter me-1"></i>
                    {{ showAdvancedSearch ? 'Ẩn bộ lọc' : 'Bộ lọc nâng cao' }}
                </button>
            </div>
        </div>

        <!-- Search Results -->
        <div v-if="showResults && (searchResults.length > 0 || isSearching || searchQuery)" class="search-results"
            v-click-outside="hideResults">
            <!-- Loading -->
            <div v-if="isSearching" class="search-loading">
                <div class="d-flex align-items-center justify-content-center py-3">
                    <div class="spinner-border spinner-border-sm me-2" role="status">
                        <span class="visually-hidden">Đang tìm kiếm...</span>
                    </div>
                    <span class="text-muted">Đang tìm kiếm...</span>
                </div>
            </div>

            <!-- Recent Searches -->
            <div v-else-if="!searchQuery && recentSearches.length > 0" class="recent-searches">
                <div class="search-section-header">
                    <h6 class="text-muted mb-0">Tìm kiếm gần đây</h6>
                    <button type="button" class="btn btn-sm btn-link text-muted" @click="clearRecentSearches">
                        Xóa tất cả
                    </button>
                </div>
                <div class="search-items">
                    <div v-for="recent in recentSearches" :key="recent.id" class="search-item recent-item"
                        @click="searchUser(recent.query)">
                        <div class="search-item-icon">
                            <i class="fas fa-history text-muted"></i>
                        </div>
                        <div class="search-item-content">
                            <div class="search-item-title">{{ recent.query }}</div>
                            <div class="search-item-meta">{{ formatSearchTime(recent.timestamp) }}</div>
                        </div>
                        <button type="button" class="btn btn-sm btn-link text-muted search-item-action"
                            @click.stop="removeRecentSearch(recent.id)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Search Results -->
            <div v-else-if="searchResults.length > 0" class="search-items">
                <div v-for="(user, index) in searchResults" :key="user.id" class="search-item user-item" :class="{
                    'highlighted': index === selectedIndex,
                    'online': user.presence?.status === 'online',
                    'away': user.presence?.status === 'away'
                }" @click="selectUser(user)" @mouseenter="selectedIndex = index">
                    <!-- User Avatar -->
                    <div class="search-item-avatar">
                        <div class="position-relative">
                            <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" class="avatar" />
                            <div v-if="user.presence" class="presence-indicator" :class="user.presence.status"
                                :title="getPresenceText(user.presence.status)"></div>
                        </div>
                    </div>

                    <!-- User Info -->
                    <div class="search-item-content">
                        <div class="search-item-title">
                            <span v-html="highlightSearchTerm(user.name, searchQuery)"></span>
                            <i v-if="user.isVerified" class="fas fa-check-circle text-primary ms-1"
                                title="Đã xác minh"></i>
                        </div>
                        <div class="search-item-meta">
                            <span v-if="user.username" class="username">@{{ user.username }}</span>
                            <span v-if="user.location" class="location">
                                <i class="fas fa-map-marker-alt me-1"></i>{{ user.location }}
                            </span>
                            <span v-if="user.mutualFriends > 0" class="mutual-friends">
                                {{ user.mutualFriends }} bạn chung
                            </span>
                        </div>
                        <div v-if="user.bio" class="search-item-bio">
                            <span v-html="highlightSearchTerm(user.bio, searchQuery)"></span>
                        </div>
                    </div>

                    <!-- User Actions -->
                    <div class="search-item-actions">
                        <!-- Friend Status -->
                        <div class="friendship-status">
                            <span v-if="user.friendshipStatus === 'friends'" class="badge bg-success">
                                <i class="fas fa-user-friends me-1"></i>Bạn bè
                            </span>
                            <span v-else-if="user.friendshipStatus === 'pending_sent'" class="badge bg-warning">
                                <i class="fas fa-clock me-1"></i>Đã gửi
                            </span>
                            <span v-else-if="user.friendshipStatus === 'pending_received'" class="badge bg-info">
                                <i class="fas fa-user-plus me-1"></i>Phản hồi
                            </span>
                        </div>

                        <!-- Action Buttons -->
                        <div class="action-buttons">
                            <button v-if="user.friendshipStatus === 'none'" type="button"
                                class="btn btn-sm btn-outline-primary" @click.stop="sendFriendRequest(user)"
                                :disabled="loadingActions.has(user.id)">
                                <span v-if="loadingActions.has(user.id)"
                                    class="spinner-border spinner-border-sm me-1"></span>
                                <i v-else class="fas fa-user-plus me-1"></i>Kết bạn
                            </button>

                            <button v-if="user.friendshipStatus === 'pending_received'" type="button"
                                class="btn btn-sm btn-success" @click.stop="acceptFriendRequest(user)"
                                :disabled="loadingActions.has(user.id)">
                                <i class="fas fa-check me-1"></i>Chấp nhận
                            </button>

                            <button type="button" class="btn btn-sm btn-outline-secondary" @click.stop="openChat(user)"
                                title="Nhắn tin">
                                <i class="fas fa-comment"></i>
                            </button>

                            <div class="dropdown d-inline-block">
                                <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle"
                                    data-bs-toggle="dropdown" @click.stop>
                                    <i class="fas fa-ellipsis-h"></i>
                                </button>
                                <ul class="dropdown-menu dropdown-menu-end">
                                    <li>
                                        <button class="dropdown-item" @click="viewProfile(user)">
                                            <i class="fas fa-user me-2"></i>Xem hồ sơ
                                        </button>
                                    </li>
                                    <li v-if="user.friendshipStatus === 'friends'">
                                        <button class="dropdown-item" @click="unfriend(user)">
                                            <i class="fas fa-user-minus me-2"></i>Hủy kết bạn
                                        </button>
                                    </li>
                                    <li v-if="user.friendshipStatus === 'pending_sent'">
                                        <button class="dropdown-item" @click="cancelFriendRequest(user)">
                                            <i class="fas fa-times me-2"></i>Hủy lời mời
                                        </button>
                                    </li>
                                    <li>
                                        <hr class="dropdown-divider">
                                    </li>
                                    <li>
                                        <button class="dropdown-item text-danger" @click="blockUser(user)">
                                            <i class="fas fa-ban me-2"></i>Chặn người dùng
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- No Results -->
            <div v-else-if="searchQuery && !isSearching" class="no-results">
                <div class="text-center py-4">
                    <i class="fas fa-search text-muted fs-1 mb-3"></i>
                    <h6 class="text-muted">Không tìm thấy kết quả</h6>
                    <p class="text-muted small mb-0">
                        Không có người dùng nào khớp với "{{ searchQuery }}"
                    </p>
                </div>
            </div>

            <!-- Load More -->
            <div v-if="searchResults.length > 0 && hasMore" class="load-more">
                <button type="button" class="btn btn-sm btn-outline-primary w-100" @click="loadMoreResults"
                    :disabled="isLoadingMore">
                    <span v-if="isLoadingMore" class="spinner-border spinner-border-sm me-1"></span>
                    {{ isLoadingMore ? 'Đang tải...' : 'Tải thêm kết quả' }}
                </button>
            </div>
        </div>

        <!-- Search Suggestions -->
        <div v-if="showSuggestions && suggestedUsers.length > 0" class="search-suggestions mt-3">
            <h6 class="text-muted mb-2">Gợi ý kết bạn</h6>
            <div class="suggestions-grid">
                <div v-for="user in suggestedUsers" :key="user.id" class="suggestion-card" @click="selectUser(user)">
                    <div class="suggestion-avatar">
                        <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
                        <div v-if="user.presence" class="presence-indicator" :class="user.presence.status"></div>
                    </div>
                    <div class="suggestion-info">
                        <div class="suggestion-name">{{ user.name }}</div>
                        <div class="suggestion-meta">
                            <span v-if="user.mutualFriends > 0">{{ user.mutualFriends }} bạn chung</span>
                            <span v-else-if="user.location">{{ user.location }}</span>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-primary" @click.stop="sendFriendRequest(user)"
                        :disabled="loadingActions.has(user.id)">
                        <i class="fas fa-user-plus"></i>
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { usePresenceStore } from '@/stores/presence'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

// Props
const props = defineProps({
    placeholder: {
        type: String,
        default: 'Tìm kiếm người dùng...'
    },
    autoFocus: {
        type: Boolean,
        default: false
    },
    showSuggestions: {
        type: Boolean,
        default: true
    },
    maxResults: {
        type: Number,
        default: 10
    }
})

// Emits
const emit = defineEmits([
    'user-selected',
    'search-changed',
    'friend-request-sent',
    'friend-request-accepted'
])

// Dependencies
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const presenceStore = usePresenceStore()
const cacheStore = useCacheStore()
const toast = useToast()

// Refs
const searchInput = ref(null)

// State
const searchQuery = ref('')
const searchResults = ref([])
const suggestedUsers = ref([])
const recentSearches = ref([])
const availableLocations = ref([])
const showResults = ref(false)
const showAdvancedSearch = ref(false)
const isSearching = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(false)
const selectedIndex = ref(-1)
const loadingActions = ref(new Set())
const currentPage = ref(1)

// Filters
const filters = ref({
    location: '',
    status: '',
    relationship: ''
})

// Computed
const currentUser = computed(() => authStore.user)

// Methods
const highlightSearchTerm = (text, term) => {
    if (!term || !text) return text
    const regex = new RegExp(`(${term})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
}

const getPresenceText = (status) => {
    const statusMap = {
        online: 'Đang online',
        away: 'Vắng mặt',
        busy: 'Bận',
        offline: 'Offline'
    }
    return statusMap[status] || 'Không xác định'
}

const formatSearchTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: vi
    })
}

const handleSearchInput = debounce(() => {
    selectedIndex.value = -1
    currentPage.value = 1

    if (searchQuery.value.trim()) {
        performSearch()
    } else {
        searchResults.value = []
        hasMore.value = false
    }

    emit('search-changed', searchQuery.value)
}, 300)

const performSearch = async () => {
    if (!searchQuery.value.trim()) return

    isSearching.value = true

    try {
        // Try cache first
        const cacheKey = `user_search_${searchQuery.value}_${JSON.stringify(filters.value)}`
        const cachedResults = cacheStore.get(cacheKey)

        if (cachedResults) {
            searchResults.value = cachedResults.results
            hasMore.value = cachedResults.hasMore
            isSearching.value = false
            return
        }

        const searchParams = {
            query: searchQuery.value,
            page: currentPage.value,
            limit: props.maxResults,
            ...filters.value
        }

        const response = await userStore.searchUsers(searchParams)

        if (currentPage.value === 1) {
            searchResults.value = response.users
        } else {
            searchResults.value.push(...response.users)
        }

        hasMore.value = response.hasMore

        // Cache results for 5 minutes
        cacheStore.set(cacheKey, {
            results: searchResults.value,
            hasMore: hasMore.value
        }, 5 * 60 * 1000)

        // Add to recent searches
        addToRecentSearches(searchQuery.value)

    } catch (error) {
        console.error('Search error:', error)
        toast.error('Tìm kiếm thất bại')
    } finally {
        isSearching.value = false
    }
}

const loadMoreResults = async () => {
    if (isLoadingMore.value || !hasMore.value) return

    isLoadingMore.value = true
    currentPage.value++

    try {
        await performSearch()
    } finally {
        isLoadingMore.value = false
    }
}

const addToRecentSearches = (query) => {
    // Remove existing entry
    recentSearches.value = recentSearches.value.filter(item => item.query !== query)

    // Add to front
    recentSearches.value.unshift({
        id: Date.now(),
        query,
        timestamp: new Date()
    })

    // Keep only 10 recent searches
    recentSearches.value = recentSearches.value.slice(0, 10)

    // Save to localStorage
    localStorage.setItem('recentUserSearches', JSON.stringify(recentSearches.value))
}

const clearRecentSearches = () => {
    recentSearches.value = []
    localStorage.removeItem('recentUserSearches')
}

const removeRecentSearch = (id) => {
    recentSearches.value = recentSearches.value.filter(item => item.id !== id)
    localStorage.setItem('recentUserSearches', JSON.stringify(recentSearches.value))
}

const searchUser = (query) => {
    searchQuery.value = query
    searchInput.value?.focus()
    performSearch()
}

const selectUser = (user) => {
    emit('user-selected', user)
    hideResults()
}

const selectFirstResult = () => {
    if (searchResults.value.length > 0) {
        selectUser(searchResults.value[0])
    }
}

const navigateResults = (direction) => {
    if (searchResults.value.length === 0) return

    selectedIndex.value += direction

    if (selectedIndex.value < 0) {
        selectedIndex.value = searchResults.value.length - 1
    } else if (selectedIndex.value >= searchResults.value.length) {
        selectedIndex.value = 0
    }
}

const hideResults = () => {
    showResults.value = false
    selectedIndex.value = -1
}

const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    hasMore.value = false
    hideResults()
    emit('search-changed', '')
}

const sendFriendRequest = async (user) => {
    if (loadingActions.value.has(user.id)) return

    loadingActions.value.add(user.id)

    try {
        await userStore.sendFriendRequest(user.id)

        // Update user status in results
        const userIndex = searchResults.value.findIndex(u => u.id === user.id)
        if (userIndex !== -1) {
            searchResults.value[userIndex].friendshipStatus = 'pending_sent'
        }

        toast.success(`Đã gửi lời mời kết bạn tới ${user.name}`)
        emit('friend-request-sent', user)

    } catch (error) {
        console.error('Send friend request error:', error)
        toast.error('Gửi lời mời kết bạn thất bại')
    } finally {
        loadingActions.value.delete(user.id)
    }
}

const acceptFriendRequest = async (user) => {
    if (loadingActions.value.has(user.id)) return

    loadingActions.value.add(user.id)

    try {
        await userStore.acceptFriendRequest(user.id)

        // Update user status in results
        const userIndex = searchResults.value.findIndex(u => u.id === user.id)
        if (userIndex !== -1) {
            searchResults.value[userIndex].friendshipStatus = 'friends'
        }

        toast.success(`Đã chấp nhận lời mời kết bạn từ ${user.name}`)
        emit('friend-request-accepted', user)

    } catch (error) {
        console.error('Accept friend request error:', error)
        toast.error('Chấp nhận lời mời kết bạn thất bại')
    } finally {
        loadingActions.value.delete(user.id)
    }
}

const unfriend = async (user) => {
    if (!confirm(`Bạn có chắc muốn hủy kết bạn với ${user.name}?`)) return

    loadingActions.value.add(user.id)

    try {
        await userStore.unfriend(user.id)

        // Update user status in results
        const userIndex = searchResults.value.findIndex(u => u.id === user.id)
        if (userIndex !== -1) {
            searchResults.value[userIndex].friendshipStatus = 'none'
        }

        toast.success(`Đã hủy kết bạn với ${user.name}`)

    } catch (error) {
        console.error('Unfriend error:', error)
        toast.error('Hủy kết bạn thất bại')
    } finally {
        loadingActions.value.delete(user.id)
    }
}

const cancelFriendRequest = async (user) => {
    loadingActions.value.add(user.id)

    try {
        await userStore.cancelFriendRequest(user.id)

        // Update user status in results
        const userIndex = searchResults.value.findIndex(u => u.id === user.id)
        if (userIndex !== -1) {
            searchResults.value[userIndex].friendshipStatus = 'none'
        }

        toast.success(`Đã hủy lời mời kết bạn tới ${user.name}`)

    } catch (error) {
        console.error('Cancel friend request error:', error)
        toast.error('Hủy lời mời kết bạn thất bại')
    } finally {
        loadingActions.value.delete(user.id)
    }
}

const blockUser = async (user) => {
    if (!confirm(`Bạn có chắc muốn chặn ${user.name}? Họ sẽ không thể nhắn tin hoặc tìm thấy bạn.`)) return

    try {
        await userStore.blockUser(user.id)

        // Remove from search results
        searchResults.value = searchResults.value.filter(u => u.id !== user.id)

        toast.success(`Đã chặn ${user.name}`)

    } catch (error) {
        console.error('Block user error:', error)
        toast.error('Chặn người dùng thất bại')
    }
}

const openChat = (user) => {
    router.push(`/chat/${user.id}`)
}

const viewProfile = (user) => {
    router.push(`/profile/${user.id}`)
}

const loadSuggestedUsers = async () => {
    try {
        // Try cache first
        const cachedSuggestions = cacheStore.get('user_suggestions')
        if (cachedSuggestions) {
            suggestedUsers.value = cachedSuggestions
            return
        }

        const response = await userStore.getSuggestedUsers({ limit: 6 })
        suggestedUsers.value = response.users

        // Cache for 30 minutes
        cacheStore.set('user_suggestions', suggestedUsers.value, 30 * 60 * 1000)

    } catch (error) {
        console.error('Load suggested users error:', error)
    }
}

const loadRecentSearches = () => {
    try {
        const saved = localStorage.getItem('recentUserSearches')
        if (saved) {
            recentSearches.value = JSON.parse(saved)
                .map(item => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                }))
                .slice(0, 10)
        }
    } catch (error) {
        console.error('Load recent searches error:', error)
        recentSearches.value = []
    }
}

// Watch for filter changes
watch(filters, () => {
    if (searchQuery.value) {
        currentPage.value = 1
        performSearch()
    }
}, { deep: true })

// Lifecycle
onMounted(async () => {
    loadRecentSearches()

    if (props.showSuggestions) {
        await loadSuggestedUsers()
    }

    if (props.autoFocus) {
        searchInput.value?.focus()
    }
})

// Click outside directive
const vClickOutside = {
    beforeMount(el, binding) {
        el.clickOutsideEvent = function (event) {
            if (!(el === event.target || el.contains(event.target))) {
                binding.value()
            }
        }
        document.addEventListener('click', el.clickOutsideEvent)
    },
    unmounted(el) {
        document.removeEventListener('click', el.clickOutsideEvent)
    }
}
</script>

<style scoped>
.user-search {
    position: relative;
}

.search-input-container {
    position: relative;
}

.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    margin-top: 0.25rem;
}

.search-section-header {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: 0.75rem 1rem 0.5rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.search-items {
    max-height: 350px;
    overflow-y: auto;
}

.search-item {
    display: flex;
    align-items: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--bs-border-color-translucent);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.search-item:last-child {
    border-bottom: none;
}

.search-item:hover,
.search-item.highlighted {
    background-color: var(--bs-light);
}

.user-item {
    position: relative;
}

.user-item.online::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: var(--bs-success);
}

.user-item.away::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 3px;
    background-color: var(--bs-warning);
}

.search-item-icon {
    margin-right: 0.75rem;
}

.search-item-avatar {
    margin-right: 0.75rem;
}

.avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.presence-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
}

.presence-indicator.online {
    background-color: var(--bs-success);
}

.presence-indicator.away {
    background-color: var(--bs-warning);
}

.presence-indicator.busy {
    background-color: var(--bs-danger);
}

.presence-indicator.offline {
    background-color: var(--bs-secondary);
}

.search-item-content {
    flex: 1;
    min-width: 0;
}

.search-item-title {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.search-item-title :deep(mark) {
    background-color: var(--bs-warning);
    padding: 0.1em 0.2em;
    border-radius: 0.2em;
}

.search-item-meta {
    font-size: 0.875rem;
    color: var(--bs-secondary);
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.search-item-bio {
    font-size: 0.875rem;
    color: var(--bs-secondary);
    margin-top: 0.25rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.search-item-actions {
    margin-left: 1rem;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.5rem;
}

.friendship-status {
    font-size: 0.75rem;
}

.action-buttons {
    display: flex;
    gap: 0.25rem;
    align-items: center;
}

.search-item-action {
    opacity: 0;
    transition: opacity 0.2s ease;
}

.search-item:hover .search-item-action {
    opacity: 1;
}

.recent-item .search-item-action {
    opacity: 1;
}

.no-results {
    padding: 2rem 1rem;
}

.load-more {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--bs-border-color);
}

.suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.suggestion-card {
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    padding: 1rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
}

.suggestion-card:hover {
    border-color: var(--bs-primary);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.suggestion-avatar {
    position: relative;
    display: inline-block;
    margin-bottom: 0.5rem;
}

.suggestion-avatar img {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    object-fit: cover;
}

.suggestion-info {
    margin-bottom: 0.75rem;
}

.suggestion-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.suggestion-meta {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

@media (max-width: 768px) {
    .search-item {
        padding: 0.5rem;
    }

    .search-item-actions {
        margin-left: 0.5rem;
    }

    .action-buttons {
        flex-direction: column;
    }

    .suggestions-grid {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    }

    .suggestion-card {
        padding: 0.75rem;
    }
}
</style>