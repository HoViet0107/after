<template>
    <div class="chat-view">
        <!-- Chat Sidebar -->
        <div class="chat-sidebar" :class="{ 'mobile-hidden': selectedConversationId && isMobile }">
            <ConversationList :active-conversation-id="selectedConversationId"
                @conversation-selected="handleConversationSelected" />
        </div>

        <!-- Chat Main Content -->
        <div class="chat-main" :class="{ 'mobile-hidden': !selectedConversationId && isMobile }">
            <!-- No Conversation Selected -->
            <div v-if="!selectedConversationId" class="no-conversation">
                <div class="text-center">
                    <i class="fas fa-comments text-muted mb-4" style="font-size: 4rem;"></i>
                    <h4 class="text-muted mb-3">Chọn một cuộc trò chuyện</h4>
                    <p class="text-muted mb-4">
                        Chọn một cuộc trò chuyện từ danh sách bên trái để bắt đầu nhắn tin
                    </p>
                    <button class="btn btn-primary" @click="showNewConversationModal = true">
                        <i class="fas fa-plus me-2"></i>
                        Cuộc trò chuyện mới
                    </button>
                </div>
            </div>

            <!-- Conversation Interface -->
            <div v-else class="conversation-interface">
                <!-- Conversation Header -->
                <div class="conversation-header">
                    <div class="header-left">
                        <!-- Mobile Back Button -->
                        <button v-if="isMobile" class="btn btn-ghost me-2" @click="goBackToList">
                            <i class="fas fa-arrow-left"></i>
                        </button>

                        <!-- Conversation Info -->
                        <div class="conversation-info">
                            <div class="conversation-avatar">
                                <img v-if="!conversation?.isGroupChat" :src="getConversationAvatar()"
                                    :alt="conversationTitle" @error="handleAvatarError" />
                                <div v-else class="group-avatar">
                                    <i class="fas fa-users"></i>
                                </div>
                                <div v-if="!conversation?.isGroupChat && isOtherUserOnline" class="online-indicator"
                                    title="Đang online"></div>
                            </div>

                            <div class="conversation-details">
                                <h6 class="conversation-title mb-1">{{ conversationTitle }}</h6>
                                <div class="conversation-status">
                                    <span v-if="typingUsers.length > 0" class="typing-status">
                                        {{ getTypingText() }}
                                    </span>
                                    <span v-else-if="!conversation?.isGroupChat" class="user-status">
                                        {{ isOtherUserOnline ? 'Đang hoạt động' : 'Offline' }}
                                    </span>
                                    <span v-else class="group-status">
                                        {{ participants.length }} thành viên
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="header-actions">
                        <!-- Search Messages -->
                        <button class="btn btn-ghost" @click="toggleSearch" title="Tìm kiếm tin nhắn">
                            <i class="fas fa-search"></i>
                        </button>

                        <!-- Voice/Video Call -->
                        <button v-if="!conversation?.isGroupChat" class="btn btn-ghost" @click="startVoiceCall"
                            title="Gọi thoại">
                            <i class="fas fa-phone"></i>
                        </button>

                        <button v-if="!conversation?.isGroupChat" class="btn btn-ghost" @click="startVideoCall"
                            title="Gọi video">
                            <i class="fas fa-video"></i>
                        </button>

                        <!-- Conversation Menu -->
                        <div class="dropdown">
                            <button class="btn btn-ghost dropdown-toggle" type="button" data-bs-toggle="dropdown"
                                title="Tùy chọn">
                                <i class="fas fa-ellipsis-v"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end">
                                <li>
                                    <a class="dropdown-item" href="#" @click="viewConversationInfo">
                                        <i class="fas fa-info-circle me-2"></i>Thông tin cuộc trò chuyện
                                    </a>
                                </li>
                                <li v-if="conversation?.isGroupChat">
                                    <a class="dropdown-item" href="#" @click="manageParticipants">
                                        <i class="fas fa-users me-2"></i>Quản lý thành viên
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#" @click="toggleMute">
                                        <i :class="conversation?.isMuted ? 'fas fa-volume-up' : 'fas fa-volume-mute'"
                                            class="me-2"></i>
                                        {{ conversation?.isMuted ? 'Bật thông báo' : 'Tắt thông báo' }}
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item" href="#" @click="archiveConversation">
                                        <i class="fas fa-archive me-2"></i>Lưu trữ
                                    </a>
                                </li>
                                <li>
                                    <hr class="dropdown-divider">
                                </li>
                                <li>
                                    <a class="dropdown-item text-danger" href="#" @click="deleteConversation">
                                        <i class="fas fa-trash me-2"></i>Xóa cuộc trò chuyện
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>

                <!-- Search Bar -->
                <div v-if="showSearch" class="search-bar">
                    <div class="input-group">
                        <input v-model="searchQuery" type="text" class="form-control" placeholder="Tìm kiếm tin nhắn..."
                            @keyup.enter="searchMessages" />
                        <button class="btn btn-outline-secondary" @click="searchMessages">
                            <i class="fas fa-search"></i>
                        </button>
                        <button class="btn btn-outline-secondary" @click="clearSearch">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Connection Status -->
                <div v-if="connectionError || !isConnected" class="connection-status">
                    <div v-if="connectionError" class="alert alert-danger mb-0">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Lỗi kết nối. Đang thử kết nối lại...
                    </div>
                    <div v-else-if="!isConnected" class="alert alert-warning mb-0">
                        <i class="fas fa-wifi me-2"></i>
                        Đang kết nối...
                    </div>
                </div>

                <!-- Message List -->
                <div class="message-list-container">
                    <MessageList ref="messageListRef" :conversation-id="selectedConversationId"
                        :search-query="searchQuery" @message-reply="handleMessageReply"
                        @message-edit="handleMessageEdit" @message-delete="handleMessageDelete"
                        @message-react="handleMessageReact" @message-forward="handleMessageForward"
                        @scroll-to-bottom="handleScrollToBottom" @load-more="handleLoadMore" />
                </div>

                <!-- Message Input -->
                <div class="message-input-container">
                    <MessageInput ref="messageInputRef" :conversation-id="selectedConversationId"
                        :disabled="!canSendMessages" @send-message="handleSendMessage" @typing-start="handleTypingStart"
                        @typing-stop="handleTypingStop" />
                </div>
            </div>
        </div>

        <!-- Modals -->
        <ConversationInfoModal v-if="showConversationInfo" :conversation="conversation"
            @close="showConversationInfo = false" @updated="handleConversationUpdated" />

        <ParticipantsModal v-if="showParticipantsModal" :conversation="conversation"
            @close="showParticipantsModal = false" @participant-added="handleParticipantAdded"
            @participant-removed="handleParticipantRemoved" />

        <NewConversationModal v-if="showNewConversationModal" @close="showNewConversationModal = false"
            @created="handleConversationCreated" />

        <ForwardMessageModal v-if="showForwardModal" :message="forwardingMessage" @close="showForwardModal = false"
            @forwarded="handleMessageForwarded" />

        <!-- Call Interface -->
        <CallInterface v-if="activeCall" :call="activeCall" @end-call="handleEndCall" @toggle-mute="handleToggleMute"
            @toggle-video="handleToggleVideo" />
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useChat } from '@/composables/useChat'
import { useWebSocket } from '@/composables/useWebSocket'
import { usePresence } from '@/composables/usePresence'
import { useBreakpoints } from '@/composables/useBreakpoints'
import { useToast } from 'vue-toastification'
import ConversationList from '@/components/conversation/ConversationList.vue'
import MessageList from '@/components/message/MessageList.vue'
import MessageInput from '@/components/message/MessageInput.vue'
import ConversationInfoModal from '@/components/conversation/ConversationInfoModal.vue'
import ParticipantsModal from '@/components/conversation/ParticipantsModal.vue'
import NewConversationModal from '@/components/conversation/NewConversationModal.vue'
import ForwardMessageModal from '@/components/message/ForwardMessageModal.vue'
import CallInterface from '@/components/call/CallInterface.vue'

// Router
const route = useRoute()
const router = useRouter()

// Dependencies
const { isConnected } = useWebSocket()
const { isUserOnline } = usePresence()
const { isMobile } = useBreakpoints()
const toast = useToast()

// State
const selectedConversationId = ref(route.params.conversationId || null)
const showSearch = ref(false)
const searchQuery = ref('')
const showConversationInfo = ref(false)
const showParticipantsModal = ref(false)
const showNewConversationModal = ref(false)
const showForwardModal = ref(false)
const forwardingMessage = ref(null)
const activeCall = ref(null)

// Refs
const messageListRef = ref(null)
const messageInputRef = ref(null)

// Chat composable
const {
    conversation,
    messages,
    participants,
    otherParticipants,
    isLoading,
    connectionError,
    conversationTitle,
    isGroupChat,
    canSendMessages,
    unreadCount,
    typingUsers,
    sendChatMessage,
    replyToMessage,
    editMessage,
    deleteMessage,
    reactToMessage,
    loadMoreMessages,
    searchMessages: searchChatMessages,
    muteConversation,
    unmuteConversation,
    leaveChat,
    startTyping,
    stopTyping
} = useChat(selectedConversationId)

// Computed
const isOtherUserOnline = computed(() => {
    if (isGroupChat.value || otherParticipants.value.length === 0) return false
    return isUserOnline(otherParticipants.value[0].id)
})

// Watch route changes
watch(
    () => route.params.conversationId,
    (newId) => {
        selectedConversationId.value = newId || null
    }
)

// Methods
const handleConversationSelected = async (conversation) => {
    selectedConversationId.value = conversation.id

    // Update URL
    await router.push({
        name: 'Conversation',
        params: { conversationId: conversation.id }
    })
}

const goBackToList = () => {
    selectedConversationId.value = null
    router.push({ name: 'Chat' })
}

const getConversationAvatar = () => {
    if (isGroupChat.value || otherParticipants.value.length === 0) {
        return '/default-group-avatar.png'
    }
    return otherParticipants.value[0].avatar || '/default-avatar.png'
}

const getTypingText = () => {
    if (typingUsers.value.length === 0) return ''

    if (typingUsers.value.length === 1) {
        return `${typingUsers.value[0].username} đang nhập...`
    } else {
        return `${typingUsers.value.length} người đang nhập...`
    }
}

// Message handlers
const handleSendMessage = async (messageData) => {
    const result = await sendChatMessage(messageData)

    if (result.success) {
        // Auto-scroll to bottom
        nextTick(() => {
            messageListRef.value?.scrollToBottom()
        })
    }
}

const handleMessageReply = (message) => {
    replyToMessage(message)
    messageInputRef.value?.focus()
}

const handleMessageEdit = (message) => {
    // Edit state is handled by message store
    messageInputRef.value?.focus()
}

const handleMessageDelete = async (message) => {
    await deleteMessage(message.id)
}

const handleMessageReact = async (message, emoji) => {
    await reactToMessage(message.id, emoji)
}

const handleMessageForward = (message) => {
    forwardingMessage.value = message
    showForwardModal.value = true
}

const handleMessageForwarded = () => {
    showForwardModal.value = false
    forwardingMessage.value = null
    toast.success('Đã chuyển tiếp tin nhắn!')
}

const handleScrollToBottom = () => {
    // Mark conversation as read when scrolled to bottom
    if (unreadCount.value > 0) {
        // markConversationAsRead() // Will be called by useChat
    }
}

const handleLoadMore = () => {
    // Loading more messages is handled by MessageList component
}

// Typing handlers
const handleTypingStart = () => {
    startTyping()
}

const handleTypingStop = () => {
    stopTyping()
}

// Search methods
const toggleSearch = () => {
    showSearch.value = !showSearch.value
    if (!showSearch.value) {
        clearSearch()
    }
}

const searchMessages = async () => {
    if (!searchQuery.value.trim()) return

    const result = await searchChatMessages(searchQuery.value)
    if (!result.success) {
        toast.error('Không thể tìm kiếm tin nhắn')
    }
}

const clearSearch = () => {
    searchQuery.value = ''
    showSearch.value = false
}

// Conversation actions
const viewConversationInfo = () => {
    showConversationInfo.value = true
}

const manageParticipants = () => {
    showParticipantsModal.value = true
}

const toggleMute = async () => {
    if (conversation.value?.isMuted) {
        await unmuteConversation()
    } else {
        await muteConversation()
    }
}

const archiveConversation = async () => {
    // Implementation for archiving
    toast.success('Đã lưu trữ cuộc trò chuyện')
}

const deleteConversation = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
        await leaveChat()
        goBackToList()
    }
}

// Call methods
const startVoiceCall = () => {
    // Implementation for voice call
    console.log('Starting voice call...')
}

const startVideoCall = () => {
    // Implementation for video call
    console.log('Starting video call...')
}

const handleEndCall = () => {
    activeCall.value = null
}

const handleToggleMute = () => {
    // Implementation for call mute
}

const handleToggleVideo = () => {
    // Implementation for video toggle
}

// Modal handlers
const handleConversationCreated = (conversation) => {
    showNewConversationModal.value = false
    handleConversationSelected(conversation)
}

const handleConversationUpdated = () => {
    showConversationInfo.value = false
    // Conversation will be updated via WebSocket events
}

const handleParticipantAdded = () => {
    // Participant list will be updated via WebSocket events
}

const handleParticipantRemoved = () => {
    // Participant list will be updated via WebSocket events
}

// Utility methods
const handleAvatarError = (event) => {
    event.target.src = '/default-avatar.png'
}

// Keyboard shortcuts
const handleKeydown = (event) => {
    // Ctrl/Cmd + F to search
    if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault()
        toggleSearch()
    }

    // Escape to close search
    if (event.key === 'Escape' && showSearch.value) {
        clearSearch()
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('keydown', handleKeydown)

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission()
    }
})

onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
})

// Meta
defineOptions({
    name: 'ChatView'
})
</script>

<style lang="scss" scoped>
.chat-view {
    height: 100vh;
    display: flex;
    background: var(--bs-body-bg);
}

.chat-sidebar {
    width: 350px;
    flex-shrink: 0;
    border-right: 1px solid var(--bs-border-color);
    background: var(--bs-body-bg);

    @media (max-width: 768px) {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        width: 100%;
        z-index: 1000;

        &.mobile-hidden {
            display: none;
        }
    }
}

.chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;

    @media (max-width: 768px) {
        &.mobile-hidden {
            display: none;
        }
    }
}

.no-conversation {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: var(--bs-gray-50);
}

.conversation-interface {
    height: 100%;
    display: flex;
    flex-direction: column;
}

.conversation-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 16px;
    border-bottom: 1px solid var(--bs-border-color);
    background: var(--bs-body-bg);
    flex-shrink: 0;
}

.header-left {
    display: flex;
    align-items: center;
    flex: 1;
    min-width: 0;
}

.conversation-info {
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
}

.conversation-avatar {
    position: relative;
    flex-shrink: 0;

    img {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        object-fit: cover;
    }

    .group-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--bs-primary);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 1.1rem;
    }

    .online-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 12px;
        height: 12px;
        background: #28a745;
        border: 2px solid white;
        border-radius: 50%;
    }
}

.conversation-details {
    flex: 1;
    min-width: 0;
}

.conversation-title {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.conversation-status {
    font-size: 0.85rem;
    color: var(--bs-secondary);

    .typing-status {
        color: var(--bs-primary);
        font-style: italic;
    }
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
}

.btn-ghost {
    background: none;
    border: none;
    color: var(--bs-secondary);
    padding: 8px;
    border-radius: 50%;
    transition: all 0.2s;

    &:hover {
        background: var(--bs-gray-100);
        color: var(--bs-primary);
    }
}

.search-bar {
    padding: 12px 16px;
    border-bottom: 1px solid var(--bs-border-color);
    background: var(--bs-gray-50);
}

.connection-status {
    flex-shrink: 0;
}

.message-list-container {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.message-input-container {
    flex-shrink: 0;
    background: var(--bs-body-bg);
}

// Dark theme
[data-bs-theme="dark"] {
    .no-conversation {
        background: var(--bs-gray-900);
    }

    .search-bar {
        background: var(--bs-gray-800);
    }

    .btn-ghost:hover {
        background: var(--bs-gray-700);
    }
}

// Mobile adjustments
@media (max-width: 768px) {
    .chat-view {
        height: 100vh;
        height: 100dvh; // Dynamic viewport height for mobile
    }

    .conversation-header {
        padding: 8px 12px;
    }

    .conversation-info {
        gap: 8px;
    }

    .conversation-avatar {

        img,
        .group-avatar {
            width: 36px;
            height: 36px;
        }
    }

    .conversation-title {
        font-size: 0.95rem;
    }

    .header-actions {
        gap: 4px;
    }

    .btn-ghost {
        padding: 6px;
    }
}

// Animation transitions
.conversation-interface {
    animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateX(20px);
    }

    to {
        opacity: 1;
        transform: translateX(0);
    }
}
</style>