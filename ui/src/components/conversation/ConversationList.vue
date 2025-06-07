<template>
    <div class="conversation-list">
        <!-- Header with Search -->
        <div class="conversation-header">
            <div class="d-flex align-items-center justify-content-between mb-3">
                <h5 class="mb-0">Tin nhắn</h5>
                <div class="conversation-actions">
                    <button class="btn btn-outline-primary btn-sm me-2" @click="showNewConversationModal = true"
                        title="Cuộc trò chuyện mới">
                        <i class="fas fa-plus"></i>
                    </button>
                    <div class="dropdown">
                        <button class="btn btn-outline-secondary btn-sm dropdown-toggle" type="button"
                            data-bs-toggle="dropdown">
                            <i class="fas fa-filter"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li>
                                <a class="dropdown-item" href="#" @click="setFilter('all')">
                                    <i class="fas fa-comments me-2"></i>Tất cả
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" @click="setFilter('unread')">
                                    <i class="fas fa-circle me-2 text-primary"></i>Chưa đọc
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" @click="setFilter('direct')">
                                    <i class="fas fa-user me-2"></i>Tin nhắn riêng
                                </a>
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" @click="setFilter('group')">
                                    <i class="fas fa-users me-2"></i>Nhóm chat
                                </a>
                            </li>
                            <li>
                                <hr class="dropdown-divider">
                            </li>
                            <li>
                                <a class="dropdown-item" href="#" @click="setFilter('archived')">
                                    <i class="fas fa-archive me-2"></i>Đã lưu trữ
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <!-- Search Input -->
            <div class="search-wrapper mb-3">
                <div class="input-group">
                    <span class="input-group-text">
                        <i class="fas fa-search"></i>
                    </span>
                    <input v-model="searchQuery" type="text" class="form-control"
                        placeholder="Tìm kiếm cuộc trò chuyện..." @input="handleSearch" />
                    <button v-if="searchQuery" class="btn btn-outline-secondary" type="button" @click="clearSearch">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- Filter Pills -->
            <div v-if="activeFilter !== 'all'" class="filter-pills mb-3">
                <span class="badge bg-primary">
                    {{ getFilterLabel(activeFilter) }}
                    <button type="button" class="btn-close btn-close-white ms-2" @click="setFilter('all')"
                        aria-label="Xóa bộ lọc"></button>
                </span>
            </div>
        </div>

        <!-- Conversation Items -->
        <div class="conversation-items">
            <!-- Loading State -->
            <div v-if="isLoading && conversations.length === 0" class="loading-state">
                <LoadingSpinner size="medium" />
                <p class="text-muted mt-2">Đang tải cuộc trò chuyện...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="!isLoading && filteredConversations.length === 0" class="empty-state">
                <div class="text-center py-4">
                    <i class="fas fa-comments text-muted mb-3" style="font-size: 3rem;"></i>
                    <h6 class="text-muted">{{ getEmptyStateMessage() }}</h6>
                    <p class="text-muted small">{{ getEmptyStateSubMessage() }}</p>
                    <button v-if="activeFilter === 'all' && !searchQuery" class="btn btn-primary btn-sm"
                        @click="showNewConversationModal = true">
                        <i class="fas fa-plus me-1"></i>
                        Bắt đầu trò chuyện
                    </button>
                </div>
            </div>

            <!-- Conversation List -->
            <div v-else class="conversation-scroll">
                <div v-for="conversation in filteredConversations" :key="conversation.id" class="conversation-item"
                    :class="{
                        'active': conversation.id === activeConversationId,
                        'unread': conversation.unreadCount > 0,
                        'muted': conversation.isMuted
                    }" @click="selectConversation(conversation)"
                    @contextmenu.prevent="showContextMenu($event, conversation)">
                    <!-- Avatar -->
                    <div class="conversation-avatar">
                        <div v-if="conversation.isGroupChat" class="group-avatar">
                            <i class="fas fa-users"></i>
                        </div>
                        <div v-else class="user-avatar">
                            <img :src="getConversationAvatar(conversation)" :alt="getConversationTitle(conversation)"
                                @error="handleAvatarError" />
                            <div v-if="isUserOnline(conversation)" class="online-indicator" title="Đang online"></div>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="conversation-content">
                        <div class="conversation-header-row">
                            <h6 class="conversation-title">
                                {{ getConversationTitle(conversation) }}
                                <i v-if="conversation.isMuted" class="fas fa-volume-mute text-muted ms-1"></i>
                            </h6>
                            <div class="conversation-meta">
                                <span class="timestamp">{{ formatTime(conversation.lastMessageAt) }}</span>
                                <div v-if="conversation.unreadCount > 0" class="unread-badge">
                                    {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
                                </div>
                            </div>
                        </div>

                        <div class="last-message">
                            <div class="message-preview">
                                <span v-if="conversation.lastMessage?.senderId === currentUserId"
                                    class="message-sender">
                                    Bạn:
                                </span>
                                <span v-else-if="conversation.isGroupChat && conversation.lastMessage"
                                    class="message-sender">
                                    {{ conversation.lastMessage.senderName }}:
                                </span>
                                <span class="message-content">
                                    {{ getLastMessagePreview(conversation.lastMessage) }}
                                </span>
                            </div>

                            <!-- Typing Indicator -->
                            <div v-if="getTypingUsers(conversation.id).length > 0" class="typing-indicator">
                                <div class="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                                <span class="typing-text">
                                    {{ getTypingText(conversation.id) }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Actions -->
                    <div class="conversation-actions">
                        <div class="dropdown">
                            <button class="btn btn-sm btn-ghost" type="button" data-bs-toggle="dropdown" @click.stop>
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li>
                                    <a class="dropdown-item" href="#" @click="markAsRead(conversation)">
                                        <i class="fas fa-check me-2"></i>Đánh dấu đã đọc
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#" @click="toggleMute(conversation)">
                                        <i :class="conversation.isMuted ? 'fas fa-volume-up' : 'fas fa-volume-mute'"
                                            class="me-2"></i>
                                        {{ conversation.isMuted ? 'Bật thông báo' : 'Tắt thông báo' }}
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#" @click="archiveConversation(conversation)">
                                        <i class="fas fa-archive me-2"></i>Lưu trữ
                                    </a>
                                </li>
                                <li>
                                    <hr class="dropdown-divider">
                                </li>
                                <li>
                                    <a class="dropdown-item text-danger" href="#"
                                        @click="deleteConversation(conversation)">
                                        <i class="fas fa-trash me-2"></i>Xóa cuộc trò chuyện
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Load More -->
                <div v-if="hasMore && !isLoadingMore" class="load-more">
                    <button class="btn btn-outline-secondary btn-sm w-100" @click="loadMore">
                        Tải thêm
                    </button>
                </div>

                <div v-if="isLoadingMore" class="loading-more text-center py-3">
                    <LoadingSpinner size="small" />
                </div>
            </div>
        </div>

        <!-- New Conversation Modal -->
        <NewConversationModal v-if="showNewConversationModal" @close="showNewConversationModal = false"
            @created="handleConversationCreated" />

        <!-- Context Menu -->
        <ConversationContextMenu v-if="contextMenu.show" :conversation="contextMenu.conversation"
            :position="contextMenu.position" @close="hideContextMenu" @action="handleContextAction" />
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore } from '@/stores/message'
import { useAuthStore } from '@/stores/auth'
import { usePresenceStore } from '@/stores/presence'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import NewConversationModal from '@/components/conversation/NewConversationModal.vue'
import ConversationContextMenu from '@/components/conversation/ConversationContextMenu.vue'

// Props
const props = defineProps({
    activeConversationId: {
        type: String,
        default: null
    }
})

// Emits
const emit = defineEmits(['conversation-selected'])

// Dependencies
const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const authStore = useAuthStore()
const presenceStore = usePresenceStore()
const router = useRouter()
const toast = useToast()

// State
const searchQuery = ref('')
const activeFilter = ref('all')
const showNewConversationModal = ref(false)
const contextMenu = ref({
    show: false,
    conversation: null,
    position: { x: 0, y: 0 }
})

// Computed
const conversations = computed(() => conversationStore.conversations)
const isLoading = computed(() => conversationStore.isLoading)
const isLoadingMore = computed(() => conversationStore.isLoadingMore)
const hasMore = computed(() => conversationStore.hasMore)
const currentUserId = computed(() => authStore.userId)

const filteredConversations = computed(() => {
    let filtered = conversations.value

    // Apply filter
    switch (activeFilter.value) {
        case 'unread':
            filtered = filtered.filter(conv => conv.unreadCount > 0)
            break
        case 'direct':
            filtered = filtered.filter(conv => !conv.isGroupChat)
            break
        case 'group':
            filtered = filtered.filter(conv => conv.isGroupChat)
            break
        case 'archived':
            filtered = filtered.filter(conv => conv.isArchived)
            break
        case 'muted':
            filtered = filtered.filter(conv => conv.isMuted)
            break
        default:
            filtered = filtered.filter(conv => !conv.isArchived)
    }

    // Apply search
    if (searchQuery.value.trim()) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(conv =>
            getConversationTitle(conv).toLowerCase().includes(query) ||
            conv.lastMessage?.content?.toLowerCase().includes(query)
        )
    }

    return filtered
})

// Methods
const selectConversation = async (conversation) => {
    emit('conversation-selected', conversation)

    // Navigate to conversation route
    await router.push({
        name: 'Conversation',
        params: { conversationId: conversation.id }
    })
}

const getConversationTitle = (conversation) => {
    if (conversation.title) return conversation.title

    if (conversation.isGroupChat) {
        return `Nhóm ${conversation.participants?.length || 0} thành viên`
    }

    // For direct messages, show other participant's name
    const otherParticipant = conversation.participants?.find(p => p.id !== currentUserId.value)
    return otherParticipant ? `${otherParticipant.firstName} ${otherParticipant.lastName}` : 'Cuộc trò chuyện'
}

const getConversationAvatar = (conversation) => {
    if (conversation.avatar) return conversation.avatar

    if (!conversation.isGroupChat) {
        const otherParticipant = conversation.participants?.find(p => p.id !== currentUserId.value)
        return otherParticipant?.avatar || '/default-avatar.png'
    }

    return '/default-group-avatar.png'
}

const getLastMessagePreview = (message) => {
    if (!message) return 'Chưa có tin nhắn'

    if (message.type === 'image') return '📷 Hình ảnh'
    if (message.type === 'video') return '🎥 Video'
    if (message.type === 'file') return '📎 File đính kèm'
    if (message.type === 'audio') return '🎵 Tin nhắn thoại'

    return message.content || 'Tin nhắn'
}

const formatTime = (timestamp) => {
    if (!timestamp) return ''

    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)

    if (diffInHours < 24) {
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit'
        })
    } else if (diffInHours < 7 * 24) {
        return formatDistanceToNow(date, {
            addSuffix: true,
            locale: vi
        })
    } else {
        return date.toLocaleDateString('vi-VN')
    }
}

const isUserOnline = (conversation) => {
    if (conversation.isGroupChat) return false

    const otherParticipant = conversation.participants?.find(p => p.id !== currentUserId.value)
    return otherParticipant ? presenceStore.isUserOnline(otherParticipant.id) : false
}

const getTypingUsers = (conversationId) => {
    return messageStore.getTypingUsersForConversation(conversationId)
}

const getTypingText = (conversationId) => {
    const typingUsers = getTypingUsers(conversationId)
    if (typingUsers.length === 0) return ''

    if (typingUsers.length === 1) {
        return `${typingUsers[0].username} đang nhập...`
    } else if (typingUsers.length === 2) {
        return `${typingUsers[0].username} và ${typingUsers[1].username} đang nhập...`
    } else {
        return `${typingUsers.length} người đang nhập...`
    }
}

// Filter methods
const setFilter = (filter) => {
    activeFilter.value = filter
}

const getFilterLabel = (filter) => {
    const labels = {
        'unread': 'Chưa đọc',
        'direct': 'Tin nhắn riêng',
        'group': 'Nhóm chat',
        'archived': 'Đã lưu trữ',
        'muted': 'Đã tắt thông báo'
    }
    return labels[filter] || filter
}

// Search methods
const handleSearch = debounce(() => {
    if (searchQuery.value.trim()) {
        // Implement search API call if needed
        conversationStore.searchConversations(searchQuery.value)
    }
}, 300)

const clearSearch = () => {
    searchQuery.value = ''
}

// Empty state methods
const getEmptyStateMessage = () => {
    if (searchQuery.value) return 'Không tìm thấy cuộc trò chuyện'
    if (activeFilter.value === 'unread') return 'Không có tin nhắn chưa đọc'
    if (activeFilter.value === 'archived') return 'Không có cuộc trò chuyện đã lưu trữ'
    return 'Chưa có cuộc trò chuyện nào'
}

const getEmptyStateSubMessage = () => {
    if (searchQuery.value) return 'Thử tìm kiếm với từ khóa khác'
    if (activeFilter.value !== 'all') return 'Thử thay đổi bộ lọc để xem thêm'
    return 'Bắt đầu cuộc trò chuyện đầu tiên của bạn'
}

// Action methods
const markAsRead = async (conversation) => {
    await conversationStore.markConversationAsRead(conversation.id)
}

const toggleMute = async (conversation) => {
    if (conversation.isMuted) {
        await conversationStore.unmuteConversation(conversation.id)
    } else {
        await conversationStore.muteConversation(conversation.id)
    }
}

const archiveConversation = async (conversation) => {
    await conversationStore.archiveConversation(conversation.id)
    toast.success('Đã lưu trữ cuộc trò chuyện')
}

const deleteConversation = async (conversation) => {
    if (confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
        await conversationStore.deleteConversation(conversation.id)
    }
}

const loadMore = async () => {
    await conversationStore.fetchConversations(conversationStore.currentPage + 1)
}

// Context menu methods
const showContextMenu = (event, conversation) => {
    contextMenu.value = {
        show: true,
        conversation,
        position: { x: event.clientX, y: event.clientY }
    }
}

const hideContextMenu = () => {
    contextMenu.value.show = false
}

const handleContextAction = (action, conversation) => {
    switch (action) {
        case 'mark-read':
            markAsRead(conversation)
            break
        case 'mute':
            toggleMute(conversation)
            break
        case 'archive':
            archiveConversation(conversation)
            break
        case 'delete':
            deleteConversation(conversation)
            break
    }
    hideContextMenu()
}

// Event handlers
const handleConversationCreated = (conversation) => {
    showNewConversationModal.value = false
    selectConversation(conversation)
}

const handleAvatarError = (event) => {
    event.target.src = '/default-avatar.png'
}

// Click outside to close context menu
const handleClickOutside = (event) => {
    if (contextMenu.value.show && !event.target.closest('.context-menu')) {
        hideContextMenu()
    }
}

// Lifecycle
onMounted(async () => {
    await conversationStore.fetchConversations(0, true)
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.conversation-list {
    height: 100%;
    display: flex;
    flex-direction: column;
    background: var(--bs-body-bg);
}

.conversation-header {
    padding: 16px;
    border-bottom: 1px solid var(--bs-border-color);
    flex-shrink: 0;
}

.conversation-actions {
    display: flex;
    align-items: center;
}

.filter-pills {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.conversation-items {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.loading-state,
.empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.conversation-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
}

.conversation-item {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    cursor: pointer;
    transition: background-color 0.2s;
    border-bottom: 1px solid var(--bs-border-color-translucent);

    &:hover {
        background: var(--bs-gray-50);
    }

    &.active {
        background: var(--bs-primary-bg-subtle);
        border-left: 3px solid var(--bs-primary);
    }

    &.unread {
        background: var(--bs-info-bg-subtle);

        .conversation-title {
            font-weight: 600;
        }
    }

    &.muted {
        opacity: 0.7;
    }
}

.conversation-avatar {
    margin-right: 12px;
    position: relative;
    flex-shrink: 0;

    .group-avatar {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: var(--bs-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.2rem;
    }

    .user-avatar {
        position: relative;

        img {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            object-fit: cover;
        }
    }

    .online-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 14px;
        height: 14px;
        background: #28a745;
        border: 2px solid white;
        border-radius: 50%;
    }
}

.conversation-content {
    flex: 1;
    min-width: 0;
}

.conversation-header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
}

.conversation-title {
    margin: 0;
    font-size: 0.95rem;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
}

.conversation-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.timestamp {
    font-size: 0.8rem;
    color: var(--bs-secondary);
}

.unread-badge {
    background: var(--bs-primary);
    color: white;
    border-radius: 12px;
    padding: 2px 8px;
    font-size: 0.75rem;
    font-weight: 500;
    min-width: 20px;
    text-align: center;
}

.last-message {
    position: relative;
}

.message-preview {
    font-size: 0.85rem;
    color: var(--bs-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    .message-sender {
        font-weight: 500;
        margin-right: 4px;
    }
}

.typing-indicator {
    display: flex;
    align-items: center;
    gap: 8px;

    .typing-dots {
        display: flex;
        gap: 2px;

        span {
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background: var(--bs-primary);
            animation: typing 1.4s infinite ease-in-out;

            &:nth-child(1) {
                animation-delay: -0.32s;
            }

            &:nth-child(2) {
                animation-delay: -0.16s;
            }

            &:nth-child(3) {
                animation-delay: 0s;
            }
        }
    }

    .typing-text {
        font-size: 0.8rem;
        color: var(--bs-primary);
        font-style: italic;
    }
}

@keyframes typing {

    0%,
    80%,
    100% {
        transform: scale(0);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

.conversation-actions {
    flex-shrink: 0;
    margin-left: 8px;

    .btn-ghost {
        background: none;
        border: none;
        color: var(--bs-secondary);
        padding: 4px 8px;
        border-radius: 4px;

        &:hover {
            background: var(--bs-gray-200);
            color: var(--bs-dark);
        }
    }
}

.load-more {
    padding: 16px;
}

.loading-more {
    padding: 16px;
}

// Dark theme
[data-bs-theme="dark"] {
    .conversation-item:hover {
        background: var(--bs-gray-800);
    }

    .btn-ghost:hover {
        background: var(--bs-gray-700);
        color: var(--bs-light);
    }
}

// Mobile responsive
@media (max-width: 768px) {
    .conversation-header {
        padding: 12px 16px;
    }

    .conversation-item {
        padding: 10px 16px;
    }

    .conversation-avatar {

        .group-avatar,
        .user-avatar img {
            width: 40px;
            height: 40px;
        }
    }

    .conversation-title {
        max-width: 150px;
    }
}
</style>