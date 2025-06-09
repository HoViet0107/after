<!-- Header của cuộc trò chuyện với WebSocket real-time presence và call controls -->

<template>
    <div class="conversation-header">
        <div class="header-container">
            <!-- Left Section: Back Button + Conversation Info -->
            <div class="header-left">
                <!-- Back Button (Mobile) -->
                <button v-if="showBackButton" type="button" class="btn btn-link btn-back d-lg-none" @click="goBack"
                    title="Quay lại danh sách">
                    <i class="fas fa-arrow-left"></i>
                </button>

                <!-- Conversation Avatar & Info -->
                <div class="conversation-info" @click="showConversationDetails">
                    <div class="avatar-container">
                        <!-- Group Avatar -->
                        <div v-if="conversation?.isGroupChat" class="group-avatar">
                            <img :src="conversation.avatar || '/default-group-avatar.png'" :alt="conversation.name"
                                class="avatar-image" />
                            <div v-if="conversation.memberCount" class="member-count">
                                {{ conversation.memberCount }}
                            </div>
                        </div>

                        <!-- Direct Chat Avatar -->
                        <div v-else class="user-avatar">
                            <img :src="otherParticipant?.avatar || '/default-avatar.png'" :alt="otherParticipant?.name"
                                class="avatar-image" />
                            <div v-if="otherParticipant?.presence" class="presence-indicator"
                                :class="otherParticipant.presence.status"
                                :title="getPresenceTooltip(otherParticipant.presence)"></div>
                        </div>
                    </div>

                    <div class="conversation-details">
                        <div class="conversation-name">
                            {{ conversationTitle }}
                            <i v-if="conversation?.isGroupChat && conversation?.settings?.privacy === 'private'"
                                class="fas fa-lock text-muted ms-1" title="Nhóm riêng tư"></i>
                        </div>

                        <div class="conversation-status">
                            <!-- Group Status -->
                            <span v-if="conversation?.isGroupChat" class="group-status">
                                {{ conversation.memberCount }} thành viên
                                <span v-if="onlineCount > 0" class="online-indicator">
                                    • {{ onlineCount }} online
                                </span>
                            </span>

                            <!-- Direct Chat Status -->
                            <div v-else class="user-status">
                                <!-- Typing Indicator -->
                                <div v-if="isTyping" class="typing-indicator">
                                    <span class="typing-text">đang gõ</span>
                                    <div class="typing-animation">
                                        <div class="typing-dot"></div>
                                        <div class="typing-dot"></div>
                                        <div class="typing-dot"></div>
                                    </div>
                                </div>

                                <!-- Presence Status -->
                                <span v-else-if="otherParticipant?.presence" class="presence-status">
                                    {{ getPresenceText(otherParticipant.presence.status) }}
                                    <span
                                        v-if="otherParticipant.presence.lastSeen && otherParticipant.presence.status === 'offline'"
                                        class="last-seen">
                                        • {{ formatLastSeen(otherParticipant.presence.lastSeen) }}
                                    </span>
                                </span>

                                <!-- Default Status -->
                                <span v-else class="default-status">Nhấn để xem thông tin</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Section: Action Buttons -->
            <div class="header-right">
                <!-- Search Button -->
                <button type="button" class="btn btn-link header-action" @click="toggleSearch"
                    :class="{ active: showSearch }" title="Tìm kiếm trong cuộc trò chuyện">
                    <i class="fas fa-search"></i>
                </button>

                <!-- Call Buttons -->
                <div v-if="canMakeCall" class="call-actions">
                    <!-- Audio Call -->
                    <button type="button" class="btn btn-link header-action" @click="startCall('audio')"
                        :disabled="isCallActive" title="Gọi thoại">
                        <i class="fas fa-phone"
                            :class="{ 'text-success': isCallActive && activeCallType === 'audio' }"></i>
                    </button>

                    <!-- Video Call -->
                    <button type="button" class="btn btn-link header-action" @click="startCall('video')"
                        :disabled="isCallActive" title="Gọi video">
                        <i class="fas fa-video"
                            :class="{ 'text-success': isCallActive && activeCallType === 'video' }"></i>
                    </button>
                </div>

                <!-- More Actions Menu -->
                <div class="dropdown">
                    <button type="button" class="btn btn-link header-action dropdown-toggle" data-bs-toggle="dropdown"
                        aria-expanded="false" title="Thêm tùy chọn">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>

                    <ul class="dropdown-menu dropdown-menu-end">
                        <!-- View Info -->
                        <li>
                            <button class="dropdown-item" @click="showConversationDetails">
                                <i class="fas fa-info-circle me-2"></i>
                                {{ conversation?.isGroupChat ? 'Thông tin nhóm' : 'Thông tin liên hệ' }}
                            </button>
                        </li>

                        <!-- Media Gallery -->
                        <li>
                            <button class="dropdown-item" @click="openMediaGallery">
                                <i class="fas fa-images me-2"></i>
                                Thư viện media
                            </button>
                        </li>

                        <!-- Select Messages -->
                        <li>
                            <button class="dropdown-item" @click="toggleSelectMode">
                                <i class="fas fa-check-square me-2"></i>
                                {{ isSelectMode ? 'Hủy chọn' : 'Chọn tin nhắn' }}
                            </button>
                        </li>

                        <li>
                            <hr class="dropdown-divider">
                        </li>

                        <!-- Notifications -->
                        <li>
                            <button class="dropdown-item" @click="toggleNotifications">
                                <i :class="notificationIcon" class="me-2"></i>
                                {{ notificationText }}
                            </button>
                        </li>

                        <!-- Pin Conversation -->
                        <li>
                            <button class="dropdown-item" @click="togglePin">
                                <i :class="pinIcon" class="me-2"></i>
                                {{ pinText }}
                            </button>
                        </li>

                        <!-- Archive Conversation -->
                        <li v-if="!conversation?.isGroupChat || canLeaveGroup">
                            <button class="dropdown-item" @click="toggleArchive">
                                <i :class="archiveIcon" class="me-2"></i>
                                {{ archiveText }}
                            </button>
                        </li>

                        <li>
                            <hr class="dropdown-divider">
                        </li>

                        <!-- Group Actions -->
                        <template v-if="conversation?.isGroupChat">
                            <!-- Add Members -->
                            <li v-if="canAddMembers">
                                <button class="dropdown-item" @click="addMembers">
                                    <i class="fas fa-user-plus me-2"></i>
                                    Thêm thành viên
                                </button>
                            </li>

                            <!-- Group Settings -->
                            <li v-if="canEditGroup">
                                <button class="dropdown-item" @click="editGroupSettings">
                                    <i class="fas fa-cog me-2"></i>
                                    Cài đặt nhóm
                                </button>
                            </li>

                            <!-- Leave Group -->
                            <li v-if="canLeaveGroup">
                                <button class="dropdown-item text-warning" @click="leaveGroup">
                                    <i class="fas fa-sign-out-alt me-2"></i>
                                    Rời khỏi nhóm
                                </button>
                            </li>

                            <!-- Delete Group -->
                            <li v-if="canDeleteGroup">
                                <button class="dropdown-item text-danger" @click="deleteGroup">
                                    <i class="fas fa-trash me-2"></i>
                                    Xóa nhóm
                                </button>
                            </li>
                        </template>

                        <!-- Direct Chat Actions -->
                        <template v-else>
                            <!-- Block User -->
                            <li>
                                <button class="dropdown-item text-danger" @click="blockUser">
                                    <i class="fas fa-ban me-2"></i>
                                    Chặn người dùng
                                </button>
                            </li>

                            <!-- Report User -->
                            <li>
                                <button class="dropdown-item text-danger" @click="reportUser">
                                    <i class="fas fa-flag me-2"></i>
                                    Báo cáo
                                </button>
                            </li>
                        </template>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Search Bar (when expanded) -->
        <Transition name="search-slide">
            <div v-if="showSearch" class="search-bar">
                <div class="search-container">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="fas fa-search"></i>
                        </span>
                        <input type="text" v-model="searchQuery" class="form-control" placeholder="Tìm kiếm tin nhắn..."
                            @input="handleSearch" @keydown.enter="searchNext" @keydown.escape="closeSearch"
                            ref="searchInput" />
                        <button v-if="searchQuery" type="button" class="btn btn-outline-secondary" @click="clearSearch">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>

                    <!-- Search Results Counter -->
                    <div v-if="searchResults.length > 0" class="search-results-info">
                        <span class="results-count">
                            {{ currentSearchIndex + 1 }}/{{ searchResults.length }}
                        </span>
                        <div class="search-navigation">
                            <button type="button" class="btn btn-sm btn-outline-secondary" @click="searchPrevious"
                                :disabled="currentSearchIndex === 0" title="Kết quả trước">
                                <i class="fas fa-chevron-up"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-secondary" @click="searchNext"
                                :disabled="currentSearchIndex === searchResults.length - 1" title="Kết quả sau">
                                <i class="fas fa-chevron-down"></i>
                            </button>
                        </div>
                    </div>

                    <div v-else-if="searchQuery && !isSearching" class="no-results">
                        <span class="text-muted">Không tìm thấy kết quả</span>
                    </div>

                    <div v-if="isSearching" class="searching">
                        <div class="spinner-border spinner-border-sm me-2"></div>
                        <span class="text-muted">Đang tìm kiếm...</span>
                    </div>
                </div>
            </div>
        </Transition>

        <!-- Connection Status Banner -->
        <Transition name="banner-slide">
            <div v-if="!isConnected" class="connection-banner">
                <div class="banner-content">
                    <i class="fas fa-wifi text-warning me-2"></i>
                    <span>Đang kết nối lại...</span>
                    <div class="spinner-border spinner-border-sm ms-2"></div>
                </div>
            </div>
        </Transition>

        <!-- Call Status Banner -->
        <Transition name="banner-slide">
            <div v-if="isCallActive" class="call-banner" :class="callBannerClass">
                <div class="banner-content">
                    <i :class="callIcon" class="me-2"></i>
                    <span>{{ callStatusText }}</span>
                    <div class="call-duration ms-2">{{ formatCallDuration(callDuration) }}</div>

                    <div class="call-controls ms-auto">
                        <button type="button" class="btn btn-sm btn-outline-light" @click="toggleMute"
                            :class="{ active: isMuted }" title="Tắt/Bật mic">
                            <i :class="isMuted ? 'fas fa-microphone-slash' : 'fas fa-microphone'"></i>
                        </button>

                        <button v-if="activeCallType === 'video'" type="button" class="btn btn-sm btn-outline-light"
                            @click="toggleVideo" :class="{ active: isVideoOff }" title="Tắt/Bật camera">
                            <i :class="isVideoOff ? 'fas fa-video-slash' : 'fas fa-video'"></i>
                        </button>

                        <button type="button" class="btn btn-sm btn-danger" @click="endCall" title="Kết thúc cuộc gọi">
                            <i class="fas fa-phone-slash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore } from '@/stores/message'
import { usePresenceStore } from '@/stores/presence'
import { useWebSocket } from '@/composables/useWebSocket'
import { useToast } from 'vue-toastification'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { debounce } from 'lodash-es'

// Props
const props = defineProps({
    conversation: {
        type: Object,
        default: null
    },
    typingUsers: {
        type: Array,
        default: () => []
    },
    showBackButton: {
        type: Boolean,
        default: true
    },
    isSelectMode: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits([
    'back',
    'info',
    'search',
    'call-start',
    'call-end',
    'call-mute',
    'call-video',
    'select-mode-toggle',
    'pin-toggle',
    'archive-toggle',
    'notification-toggle',
    'leave',
    'delete',
    'block',
    'report'
])

// Dependencies
const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const presenceStore = usePresenceStore()
const { isConnected } = useWebSocket()
const toast = useToast()

// Refs
const searchInput = ref(null)

// State
const showSearch = ref(false)
const searchQuery = ref('')
const searchResults = ref([])
const currentSearchIndex = ref(0)
const isSearching = ref(false)

// Call state
const isCallActive = ref(false)
const activeCallType = ref(null) // 'audio' | 'video'
const callDuration = ref(0)
const isMuted = ref(false)
const isVideoOff = ref(false)
const callStartTime = ref(null)

// Call timer
let callTimer = null

// Computed
const currentUser = computed(() => authStore.user)

const otherParticipant = computed(() => {
    if (!props.conversation || props.conversation.isGroupChat) return null
    return props.conversation.participants?.find(p => p.id !== currentUser.value?.id)
})

const conversationTitle = computed(() => {
    if (!props.conversation) return ''

    if (props.conversation.isGroupChat) {
        return props.conversation.name || 'Nhóm chat'
    }

    return otherParticipant.value?.name || 'Cuộc trò chuyện'
})

const onlineCount = computed(() => {
    if (!props.conversation?.participants) return 0
    return props.conversation.participants.filter(p =>
        p.presence?.status === 'online'
    ).length
})

const isTyping = computed(() => {
    return props.typingUsers.length > 0
})

const canMakeCall = computed(() => {
    if (!props.conversation) return false

    if (props.conversation.isGroupChat) {
        // Allow calls for groups with <= 8 members
        return props.conversation.memberCount <= 8
    }

    // Always allow calls for direct chats
    return true
})

const currentUserMember = computed(() => {
    if (!props.conversation?.participants) return null
    return props.conversation.participants.find(p => p.id === currentUser.value?.id)
})

const canAddMembers = computed(() => {
    if (!props.conversation?.isGroupChat) return false

    const userRole = currentUserMember.value?.role
    const settings = props.conversation.settings || {}

    return userRole === 'owner' ||
        userRole === 'admin' ||
        settings.whoCanAddMembers === 'all'
})

const canEditGroup = computed(() => {
    if (!props.conversation?.isGroupChat) return false

    const userRole = currentUserMember.value?.role
    const settings = props.conversation.settings || {}

    return userRole === 'owner' ||
        userRole === 'admin' ||
        settings.whoCanEditInfo === 'all'
})

const canLeaveGroup = computed(() => {
    return props.conversation?.isGroupChat &&
        currentUserMember.value?.role !== 'owner'
})

const canDeleteGroup = computed(() => {
    return props.conversation?.isGroupChat &&
        currentUserMember.value?.role === 'owner'
})

// Notification state
const notificationIcon = computed(() => {
    return props.conversation?.notificationsEnabled === false
        ? 'fas fa-bell-slash text-muted'
        : 'fas fa-bell'
})

const notificationText = computed(() => {
    return props.conversation?.notificationsEnabled === false
        ? 'Bật thông báo'
        : 'Tắt thông báo'
})

// Pin state
const pinIcon = computed(() => {
    return props.conversation?.isPinned
        ? 'fas fa-thumbtack text-warning'
        : 'far fa-thumbtack'
})

const pinText = computed(() => {
    return props.conversation?.isPinned ? 'Bỏ ghim' : 'Ghim cuộc trò chuyện'
})

// Archive state
const archiveIcon = computed(() => {
    return props.conversation?.isArchived
        ? 'fas fa-inbox'
        : 'fas fa-archive'
})

const archiveText = computed(() => {
    return props.conversation?.isArchived ? 'Bỏ lưu trữ' : 'Lưu trữ'
})

// Call state
const callIcon = computed(() => {
    const icons = {
        audio: 'fas fa-phone',
        video: 'fas fa-video'
    }
    return icons[activeCallType.value] || 'fas fa-phone'
})

const callStatusText = computed(() => {
    const statusMap = {
        audio: 'Cuộc gọi thoại',
        video: 'Cuộc gọi video'
    }
    return statusMap[activeCallType.value] || 'Đang gọi'
})

const callBannerClass = computed(() => {
    return {
        'call-audio': activeCallType.value === 'audio',
        'call-video': activeCallType.value === 'video'
    }
})

// Methods
const getPresenceText = (status) => {
    const statusMap = {
        online: 'Đang hoạt động',
        away: 'Vắng mặt',
        busy: 'Bận',
        offline: 'Offline'
    }
    return statusMap[status] || 'Offline'
}

const getPresenceTooltip = (presence) => {
    let tooltip = getPresenceText(presence.status)

    if (presence.lastSeen && presence.status === 'offline') {
        tooltip += ` • Lần cuối ${formatLastSeen(presence.lastSeen)}`
    }

    return tooltip
}

const formatLastSeen = (date) => {
    return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: vi
    })
}

const formatCallDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60

    if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
    }

    return `0:${remainingSeconds.toString().padStart(2, '0')}`
}

const goBack = () => {
    emit('back')
}

const showConversationDetails = () => {
    emit('info')
}

const toggleSearch = () => {
    showSearch.value = !showSearch.value

    if (showSearch.value) {
        nextTick(() => {
            searchInput.value?.focus()
        })
    } else {
        clearSearch()
    }

    emit('search', showSearch.value)
}

const closeSearch = () => {
    showSearch.value = false
    clearSearch()
    emit('search', false)
}

const handleSearch = debounce(() => {
    if (!searchQuery.value.trim()) {
        searchResults.value = []
        currentSearchIndex.value = 0
        return
    }

    performSearch()
}, 300)

const performSearch = async () => {
    if (!searchQuery.value.trim()) return

    isSearching.value = true

    try {
        const results = await messageStore.searchMessages(props.conversation.id, {
            query: searchQuery.value,
            limit: 100
        })

        searchResults.value = results.messages || []
        currentSearchIndex.value = 0

        if (searchResults.value.length > 0) {
            highlightSearchResult(searchResults.value[0])
        }

    } catch (error) {
        console.error('Search error:', error)
        toast.error('Tìm kiếm thất bại')
    } finally {
        isSearching.value = false
    }
}

const searchNext = () => {
    if (currentSearchIndex.value < searchResults.value.length - 1) {
        currentSearchIndex.value++
        highlightSearchResult(searchResults.value[currentSearchIndex.value])
    }
}

const searchPrevious = () => {
    if (currentSearchIndex.value > 0) {
        currentSearchIndex.value--
        highlightSearchResult(searchResults.value[currentSearchIndex.value])
    }
}

const highlightSearchResult = (message) => {
    // Scroll to and highlight the message
    const messageElement = document.querySelector(`[data-message-id="${message.id}"]`)
    if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
        messageElement.classList.add('search-highlight')

        setTimeout(() => {
            messageElement.classList.remove('search-highlight')
        }, 3000)
    }
}

const clearSearch = () => {
    searchQuery.value = ''
    searchResults.value = []
    currentSearchIndex.value = 0
}

const startCall = (type) => {
    if (isCallActive.value) return

    isCallActive.value = true
    activeCallType.value = type
    callStartTime.value = Date.now()
    callDuration.value = 0
    isMuted.value = false
    isVideoOff.value = false

    // Start call timer
    callTimer = setInterval(() => {
        callDuration.value = Math.floor((Date.now() - callStartTime.value) / 1000)
    }, 1000)

    emit('call-start', { type, conversationId: props.conversation?.id })

    toast.success(`Đang bắt đầu ${type === 'video' ? 'cuộc gọi video' : 'cuộc gọi thoại'}`)
}

const endCall = () => {
    if (!isCallActive.value) return

    isCallActive.value = false

    if (callTimer) {
        clearInterval(callTimer)
        callTimer = null
    }

    emit('call-end', {
        type: activeCallType.value,
        duration: callDuration.value,
        conversationId: props.conversation?.id
    })

    // Reset call state
    activeCallType.value = null
    callDuration.value = 0
    isMuted.value = false
    isVideoOff.value = false
    callStartTime.value = null

    toast.info('Cuộc gọi đã kết thúc')
}

const toggleMute = () => {
    isMuted.value = !isMuted.value
    emit('call-mute', isMuted.value)
}

const toggleVideo = () => {
    isVideoOff.value = !isVideoOff.value
    emit('call-video', !isVideoOff.value)
}

const toggleSelectMode = () => {
    emit('select-mode-toggle')
}

const openMediaGallery = () => {
    // Implementation for media gallery
    toast.info('Tính năng đang phát triển')
}

const toggleNotifications = async () => {
    try {
        const newState = !props.conversation?.notificationsEnabled
        await conversationStore.updateNotificationSettings(props.conversation.id, {
            enabled: newState
        })

        emit('notification-toggle', newState)
        toast.success(newState ? 'Đã bật thông báo' : 'Đã tắt thông báo')

    } catch (error) {
        console.error('Toggle notifications error:', error)
        toast.error('Cập nhật thông báo thất bại')
    }
}

const togglePin = async () => {
    try {
        const newState = !props.conversation?.isPinned
        await conversationStore.updateConversation(props.conversation.id, {
            isPinned: newState
        })

        emit('pin-toggle', newState)
        toast.success(newState ? 'Đã ghim cuộc trò chuyện' : 'Đã bỏ ghim')

    } catch (error) {
        console.error('Toggle pin error:', error)
        toast.error('Cập nhật ghim thất bại')
    }
}

const toggleArchive = async () => {
    try {
        const newState = !props.conversation?.isArchived
        await conversationStore.updateConversation(props.conversation.id, {
            isArchived: newState
        })

        emit('archive-toggle', newState)
        toast.success(newState ? 'Đã lưu trữ cuộc trò chuyện' : 'Đã bỏ lưu trữ')

    } catch (error) {
        console.error('Toggle archive error:', error)
        toast.error('Cập nhật lưu trữ thất bại')
    }
}

const addMembers = () => {
    // Implementation for add members
    toast.info('Tính năng đang phát triển')
}

const editGroupSettings = () => {
    showConversationDetails()
}

const leaveGroup = () => {
    if (confirm('Bạn có chắc muốn rời khỏi nhóm này?')) {
        emit('leave')
    }
}

const deleteGroup = () => {
    if (confirm('Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác.')) {
        emit('delete')
    }
}

const blockUser = () => {
    if (confirm(`Bạn có chắc muốn chặn ${otherParticipant.value?.name}?`)) {
        emit('block', otherParticipant.value)
    }
}

const reportUser = () => {
    emit('report', otherParticipant.value)
}

// Lifecycle
onMounted(() => {
    // Handle escape key to close search
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && showSearch.value) {
            closeSearch()
        }
    })
})

onUnmounted(() => {
    if (callTimer) {
        clearInterval(callTimer)
    }

    document.removeEventListener('keydown', closeSearch)
})

// Watch for conversation changes
watch(() => props.conversation, () => {
    // Reset search when conversation changes
    if (showSearch.value) {
        clearSearch()
    }

    // End call if conversation changes
    if (isCallActive.value) {
        endCall()
    }
})
</script>

<style scoped>
.conversation-header {
    background: white;
    border-bottom: 1px solid var(--bs-border-color);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    min-height: 60px;
}

.header-left {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
}

.btn-back {
    padding: 0.375rem;
    margin-right: 0.5rem;
    color: var(--bs-body-color);
}

.conversation-info {
    display: flex;
    align-items: center;
    cursor: pointer;
    flex: 1;
    min-width: 0;
    transition: background-color 0.2s ease;
    padding: 0.5rem;
    border-radius: 0.375rem;
}

.conversation-info:hover {
    background-color: var(--bs-light);
}

.avatar-container {
    position: relative;
    margin-right: 0.75rem;
    flex-shrink: 0;
}

.group-avatar,
.user-avatar {
    position: relative;
}

.avatar-image {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.member-count {
    position: absolute;
    bottom: -2px;
    right: -2px;
    background: var(--bs-primary);
    color: white;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: bold;
    border: 2px solid white;
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

.conversation-details {
    flex: 1;
    min-width: 0;
}

.conversation-name {
    font-weight: 600;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.conversation-status {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.online-indicator {
    color: var(--bs-success);
    font-weight: 500;
}

.typing-indicator {
    display: flex;
    align-items: center;
    color: var(--bs-primary);
    font-style: italic;
}

.typing-text {
    margin-right: 0.5rem;
}

.typing-animation {
    display: flex;
    gap: 0.2rem;
}

.typing-dot {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: var(--bs-primary);
    animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing-bounce {

    0%,
    80%,
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

.header-right {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
}

.header-action {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bs-body-color);
    border: none;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.header-action:hover {
    background-color: var(--bs-light);
    color: var(--bs-primary);
}

.header-action.active {
    background-color: var(--bs-primary);
    color: white;
}

.call-actions {
    display: flex;
    gap: 0.25rem;
}

.search-bar {
    padding: 0.75rem 1rem;
    background-color: var(--bs-light);
    border-bottom: 1px solid var(--bs-border-color);
}

.search-container {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.search-container .input-group {
    flex: 1;
}

.search-results-info {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    white-space: nowrap;
}

.results-count {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.search-navigation {
    display: flex;
    gap: 0.25rem;
}

.no-results,
.searching {
    display: flex;
    align-items: center;
    font-size: 0.875rem;
}

.connection-banner,
.call-banner {
    padding: 0.5rem 1rem;
    background-color: var(--bs-warning);
    color: white;
    text-align: center;
}

.call-banner {
    background-color: var(--bs-success);
}

.call-banner.call-video {
    background-color: var(--bs-info);
}

.banner-content {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
}

.call-controls {
    display: flex;
    gap: 0.25rem;
}

.call-controls .btn {
    min-width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
}

.call-controls .btn.active {
    background-color: rgba(255, 255, 255, 0.2);
}

/* Transitions */
.search-slide-enter-active,
.search-slide-leave-active {
    transition: all 0.3s ease;
}

.search-slide-enter-from,
.search-slide-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}

.banner-slide-enter-active,
.banner-slide-leave-active {
    transition: all 0.3s ease;
}

.banner-slide-enter-from,
.banner-slide-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}

/* Global search highlight style */
:deep(.search-highlight) {
    background-color: var(--bs-warning) !important;
    animation: search-pulse 3s ease-in-out;
}

@keyframes search-pulse {

    0%,
    100% {
        background-color: var(--bs-warning);
    }

    50% {
        background-color: var(--bs-warning-dark);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .header-container {
        padding: 0.5rem;
    }

    .conversation-name {
        font-size: 0.95rem;
    }

    .conversation-status {
        font-size: 0.8rem;
    }

    .header-action {
        width: 36px;
        height: 36px;
    }

    .call-controls {
        margin-left: 0.5rem;
    }

    .search-container {
        flex-direction: column;
        align-items: stretch;
        gap: 0.5rem;
    }

    .search-results-info {
        justify-content: space-between;
    }
}

@media (max-width: 576px) {
    .call-controls .btn {
        min-width: 28px;
        height: 28px;
        font-size: 0.8rem;
    }

    .banner-content {
        font-size: 0.875rem;
    }
}
</style>