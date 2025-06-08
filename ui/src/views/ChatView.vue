<!-- Main chat interface với conversation list, message view và real-time features -->

<template>
    <div class="chat-view">
        <div class="container-fluid p-0">
            <div class="row g-0 h-100">
                <!-- Conversations Sidebar -->
                <div class="col-lg-4 col-md-5" :class="{ 'd-none d-lg-block': activeConversationId }">
                    <div class="conversations-sidebar">
                        <!-- Header -->
                        <div class="sidebar-header">
                            <div class="header-content">
                                <h2 class="header-title">Tin nhắn</h2>
                                <div class="header-actions">
                                    <button class="btn btn-ghost" @click="showNewChatModal = true" title="Tạo cuộc trò chuyện mới">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <div class="dropdown">
                                        <button class="btn btn-ghost dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-h"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" @click="markAllAsRead">
                                                <i class="fas fa-check-double me-2"></i>Đánh dấu tất cả đã đọc</a></li>
                                            <li><a class="dropdown-item" href="#" @click="showArchivedChats">
                                                <i class="fas fa-archive me-2"></i>Tin nhắn đã lưu trữ</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item" href="#" @click="openChatSettings">
                                                <i class="fas fa-cog me-2"></i>Cài đặt chat</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Search -->
                            <div class="search-container">
                                <div class="search-input-group">
                                    <i class="fas fa-search search-icon"></i>
                                    <input type="text" v-model="searchQuery" class="form-control" 
                                           placeholder="Tìm kiếm cuộc trò chuyện..." @input="handleSearch">
                                    <button v-if="searchQuery" class="btn btn-clear" @click="clearSearch">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Filter Tabs -->
                            <div class="filter-tabs">
                                <button class="filter-tab" :class="{ active: activeFilter === 'all' }" 
                                        @click="setFilter('all')">
                                    Tất cả
                                    <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
                                </button>
                                <button class="filter-tab" :class="{ active: activeFilter === 'unread' }" 
                                        @click="setFilter('unread')">
                                    Chưa đọc
                                    <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
                                </button>
                                <button class="filter-tab" :class="{ active: activeFilter === 'groups' }" 
                                        @click="setFilter('groups')">
                                    Nhóm
                                </button>
                            </div>
                        </div>

                        <!-- Conversations List -->
                        <div class="conversations-list" ref="conversationsList">
                            <div v-if="isLoadingConversations" class="loading-skeleton">
                                <ConversationSkeleton v-for="i in 8" :key="i" />
                            </div>

                            <div v-else-if="filteredConversations.length === 0" class="empty-state">
                                <div class="empty-content">
                                    <i class="fas fa-comments empty-icon"></i>
                                    <h5 class="empty-title">{{ getEmptyStateTitle() }}</h5>
                                    <p class="empty-description">{{ getEmptyStateDescription() }}</p>
                                    <button v-if="activeFilter === 'all'" class="btn btn-primary" 
                                            @click="showNewChatModal = true">
                                        <i class="fas fa-plus me-2"></i>
                                        Bắt đầu cuộc trò chuyện
                                    </button>
                                </div>
                            </div>

                            <div v-else class="conversation-items">
                                <ConversationItem v-for="conversation in filteredConversations" 
                                                  :key="conversation.id" :conversation="conversation"
                                                  :is-active="conversation.id === activeConversationId"
                                                  :search-query="searchQuery"
                                                  @click="selectConversation(conversation.id)"
                                                  @archive="archiveConversation"
                                                  @delete="deleteConversation"
                                                  @mute="muteConversation"
                                                  @mark-read="markConversationAsRead" />
                            </div>

                            <!-- Load More -->
                            <div ref="loadMoreTrigger" class="load-more-trigger" v-show="hasMoreConversations">
                                <div v-if="isLoadingMore" class="text-center py-3">
                                    <div class="spinner-border spinner-border-sm text-primary"></div>
                                </div>
                            </div>
                        </div>

                        <!-- Online Friends -->
                        <div class="online-friends" v-if="onlineFriends.length > 0">
                            <h6 class="friends-title">Bạn bè đang online</h6>
                            <div class="friends-list">
                                <div class="friend-item" v-for="friend in onlineFriends" :key="friend.id"
                                     @click="startChatWithFriend(friend)">
                                    <div class="friend-avatar">
                                        <UserAvatar :user="friend" size="sm" />
                                        <div class="online-dot"></div>
                                    </div>
                                    <span class="friend-name">{{ friend.name }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Chat Area -->
                <div class="col-lg-8 col-md-7" :class="{ 'd-none': !activeConversationId && isMobile }">
                    <div class="chat-area">
                        <!-- No Conversation Selected -->
                        <div v-if="!activeConversationId" class="no-conversation">
                            <div class="welcome-content">
                                <div class="welcome-icon">
                                    <i class="fas fa-comments"></i>
                                </div>
                                <h3 class="welcome-title">Chào mừng đến với Chat</h3>
                                <p class="welcome-description">
                                    Chọn một cuộc trò chuyện để bắt đầu nhắn tin hoặc tạo cuộc trò chuyện mới
                                </p>
                                <button class="btn btn-primary" @click="showNewChatModal = true">
                                    <i class="fas fa-plus me-2"></i>
                                    Tạo cuộc trò chuyện mới
                                </button>
                            </div>
                        </div>

                        <!-- Active Conversation -->
                        <div v-else class="active-conversation">
                            <!-- Chat Header -->
                            <div class="chat-header">
                                <div class="header-left">
                                    <button class="btn btn-ghost back-btn d-lg-none" @click="backToConversations">
                                        <i class="fas fa-arrow-left"></i>
                                    </button>
                                    
                                    <div class="conversation-info" @click="showConversationDetails">
                                        <UserAvatar v-if="!activeConversation.isGroupChat" 
                                                    :user="getOtherParticipant()" size="md" class="conversation-avatar" />
                                        <div v-else class="group-avatar">
                                            <i class="fas fa-users"></i>
                                        </div>
                                        
                                        <div class="conversation-details">
                                            <h5 class="conversation-title">{{ getConversationTitle() }}</h5>
                                            <div class="conversation-status">
                                                <span v-if="!activeConversation.isGroupChat && otherParticipantPresence">
                                                    {{ getPresenceText(otherParticipantPresence) }}
                                                </span>
                                                <span v-else-if="activeConversation.isGroupChat">
                                                    {{ activeConversation.participants.length }} thành viên
                                                </span>
                                                <span v-if="isTyping" class="typing-indicator">
                                                    đang gõ tin nhắn...
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="header-actions">
                                    <button class="btn btn-ghost" @click="startVoiceCall" title="Gọi thoại">
                                        <i class="fas fa-phone"></i>
                                    </button>
                                    <button class="btn btn-ghost" @click="startVideoCall" title="Gọi video">
                                        <i class="fas fa-video"></i>
                                    </button>
                                    <button class="btn btn-ghost" @click="showConversationInfo = true" title="Thông tin">
                                        <i class="fas fa-info-circle"></i>
                                    </button>
                                    <div class="dropdown">
                                        <button class="btn btn-ghost dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" @click="searchInConversation">
                                                <i class="fas fa-search me-2"></i>Tìm kiếm</a></li>
                                            <li><a class="dropdown-item" href="#" @click="viewSharedMedia">
                                                <i class="fas fa-images me-2"></i>Ảnh & Video</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item" href="#" @click="muteConversation(activeConversation)">
                                                <i class="fas fa-bell-slash me-2"></i>Tắt thông báo</a></li>
                                            <li><a class="dropdown-item text-danger" href="#" @click="deleteConversation(activeConversation)">
                                                <i class="fas fa-trash me-2"></i>Xóa cuộc trò chuyện</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Messages Container -->
                            <div class="messages-container" ref="messagesContainer">
                                <div v-if="isLoadingMessages" class="loading-messages">
                                    <MessageSkeleton v-for="i in 5" :key="i" />
                                </div>

                                <div v-else class="messages-list">
                                    <!-- Load earlier messages -->
                                    <div v-if="hasEarlierMessages" class="load-earlier" @click="loadEarlierMessages">
                                        <div v-if="isLoadingEarlier" class="spinner-border spinner-border-sm text-primary"></div>
                                        <span v-else>Tải tin nhắn cũ hơn</span>
                                    </div>

                                    <!-- Messages -->
                                    <div v-for="(message, index) in messages" :key="message.id" class="message-wrapper">
                                        <!-- Date separator -->
                                        <div v-if="shouldShowDateSeparator(message, index)" class="date-separator">
                                            <span class="date-text">{{ formatMessageDate(message.createdAt) }}</span>
                                        </div>

                                        <!-- Message -->
                                        <MessageBubble :message="message" 
                                                       :is-own="message.senderId === currentUser.id"
                                                       :show-avatar="shouldShowAvatar(message, index)"
                                                       :show-sender="shouldShowSender(message, index)"
                                                       @reply="replyToMessage"
                                                       @edit="editMessage"
                                                       @delete="deleteMessage"
                                                       @react="reactToMessage"
                                                       @forward="forwardMessage" />
                                    </div>

                                    <!-- Typing indicator -->
                                    <TypingIndicator v-if="typingUsers.length > 0" 
                                                     :typing-users="typingUsers" 
                                                     :conversation-id="activeConversationId" />
                                </div>

                                <!-- Scroll to bottom button -->
                                <button v-if="showScrollToBottom" class="scroll-to-bottom" @click="scrollToBottom">
                                    <i class="fas fa-chevron-down"></i>
                                    <span v-if="newMessagesCount > 0" class="new-messages-badge">{{ newMessagesCount }}</span>
                                </button>
                            </div>

                            <!-- Message Input -->
                            <div class="message-input-container">
                                <MessageInput :conversation-id="activeConversationId" 
                                              :reply-to-message="replyToMessage"
                                              @send="handleSendMessage"
                                              @typing="handleTyping"
                                              @stop-typing="handleStopTyping"
                                              @cancel-reply="cancelReply" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <NewChatModal v-if="showNewChatModal" @close="showNewChatModal = false" @created="handleChatCreated" />
        
        <ConversationInfoModal v-if="showConversationInfo" :conversation="activeConversation"
                               @close="showConversationInfo = false" @updated="handleConversationUpdated" />

        <ForwardMessageModal v-if="showForwardModal" :message="forwardingMessage"
                             @close="showForwardModal = false" @forwarded="handleMessageForwarded" />

        <CallInterface v-if="activeCall" :call="activeCall" 
                       @end-call="handleEndCall" @toggle-mute="handleToggleMute" @toggle-video="handleToggleVideo" />
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore } from '@/stores/message'
import { usePresenceStore } from '@/stores/presence'
import { useWebSocket } from '@/composables/useWebSocket'
import { useBreakpoints } from '@/composables/useBreakpoints'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import { useToast } from 'vue-toastification'
import { formatDate, formatTime } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'
import ConversationItem from '@/components/conversation/ConversationItem.vue'
import ConversationSkeleton from '@/components/skeleton/ConversationSkeleton.vue'
import MessageBubble from '@/components/message/MessageBubble.vue'
import MessageSkeleton from '@/components/skeleton/MessageSkeleton.vue'
import MessageInput from '@/components/message/MessageInput.vue'
import TypingIndicator from '@/components/message/TypingIndicator.vue'
import NewChatModal from '@/components/conversation/NewChatModal.vue'
import ConversationInfoModal from '@/components/conversation/ConversationInfoModal.vue'
import ForwardMessageModal from '@/components/message/ForwardMessageModal.vue'
import CallInterface from '@/components/call/CallInterface.vue'

// Router & Stores
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const presenceStore = usePresenceStore()
const toast = useToast()

// Composables
const { on, off } = useWebSocket()
const { isMobile } = useBreakpoints()

// Refs
const conversationsList = ref(null)
const messagesContainer = ref(null)
const loadMoreTrigger = ref(null)

// State
const activeConversationId = ref(route.params.conversationId || null)
const searchQuery = ref('')
const activeFilter = ref('all')
const isLoadingConversations = ref(false)
const isLoadingMessages = ref(false)
const isLoadingMore = ref(false)
const isLoadingEarlier = ref(false)
const showScrollToBottom = ref(false)
const newMessagesCount = ref(0)
const replyToMessage = ref(null)
const showNewChatModal = ref(false)
const showConversationInfo = ref(false)
const showForwardModal = ref(false)
const forwardingMessage = ref(null)
const activeCall = ref(null)

// Mock data
const onlineFriends = ref([
    { id: 2, name: 'Nguyễn Văn A', avatar: '/avatars/user2.jpg' },
    { id: 3, name: 'Trần Thị B', avatar: '/avatars/user3.jpg' },
    { id: 4, name: 'Lê Văn C', avatar: '/avatars/user4.jpg' }
])

// Computed
const currentUser = computed(() => authStore.user)
const conversations = computed(() => conversationStore.conversations)
const activeConversation = computed(() => conversationStore.activeConversation)
const messages = computed(() => messageStore.getMessagesByConversation(activeConversationId.value))
const typingUsers = computed(() => messageStore.getTypingUsersForConversation(activeConversationId.value))
const hasMoreConversations = computed(() => conversationStore.hasMore)
const hasEarlierMessages = computed(() => messageStore.hasMoreMessages(activeConversationId.value))
const unreadCount = computed(() => conversationStore.totalUnreadCount)

const filteredConversations = computed(() => {
    let filtered = conversations.value

    // Apply filter
    if (activeFilter.value === 'unread') {
        filtered = filtered.filter(conv => conv.unreadCount > 0)
    } else if (activeFilter.value === 'groups') {
        filtered = filtered.filter(conv => conv.isGroupChat)
    }

    // Apply search
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(conv => 
            conv.title?.toLowerCase().includes(query) ||
            conv.participants?.some(p => 
                p.name?.toLowerCase().includes(query) ||
                p.username?.toLowerCase().includes(query)
            )
        )
    }

    return filtered
})

const otherParticipantPresence = computed(() => {
    if (!activeConversation.value || activeConversation.value.isGroupChat) return null
    const otherParticipant = getOtherParticipant()
    return otherParticipant ? presenceStore.getUserPresence(otherParticipant.id) : null
})

const isTyping = computed(() => typingUsers.value.length > 0)

// Infinite scroll for conversations
const { setupInfiniteScroll: setupConversationsScroll } = useInfiniteScroll(
    loadMoreTrigger,
    loadMoreConversations,
    { threshold: 100 }
)

// Methods
const loadConversations = async (refresh = false) => {
    try {
        isLoadingConversations.value = refresh
        await conversationStore.loadConversations({ refresh })
    } catch (error) {
        console.error('Error loading conversations:', error)
        toast.error('Không thể tải danh sách cuộc trò chuyện')
    } finally {
        isLoadingConversations.value = false
    }
}

const loadMoreConversations = async () => {
    if (!hasMoreConversations.value || isLoadingMore.value) return
    
    isLoadingMore.value = true
    try {
        await conversationStore.loadConversations({ refresh: false })
    } finally {
        isLoadingMore.value = false
    }
}

const selectConversation = async (conversationId) => {
    if (activeConversationId.value === conversationId) return

    activeConversationId.value = conversationId
    router.push(`/chat/${conversationId}`)
    
    await loadConversationData(conversationId)
}

const loadConversationData = async (conversationId) => {
    try {
        isLoadingMessages.value = true
        
        // Set active conversation
        await conversationStore.setActiveConversation(conversationId)
        
        // Load messages
        await messageStore.loadMessages(conversationId, { refresh: true })
        
        // Mark as read
        await conversationStore.markAsRead(conversationId)
        
        // Scroll to bottom
        await nextTick()
        scrollToBottom()
        
    } catch (error) {
        console.error('Error loading conversation:', error)
        toast.error('Không thể tải cuộc trò chuyện')
    } finally {
        isLoadingMessages.value = false
    }
}

const loadEarlierMessages = async () => {
    if (!hasEarlierMessages.value || isLoadingEarlier.value) return
    
    isLoadingEarlier.value = true
    try {
        const scrollPosition = messagesContainer.value.scrollTop
        await messageStore.loadMessages(activeConversationId.value, { refresh: false })
        
        // Maintain scroll position
        await nextTick()
        messagesContainer.value.scrollTop = scrollPosition
    } finally {
        isLoadingEarlier.value = false
    }
}

const handleSendMessage = async (messageData) => {
    try {
        await messageStore.sendMessage(activeConversationId.value, messageData)
        await nextTick()
        scrollToBottom()
    } catch (error) {
        console.error('Error sending message:', error)
        toast.error('Không thể gửi tin nhắn')
    }
}

const handleTyping = () => {
    messageStore.startTyping(activeConversationId.value)
}

const handleStopTyping = () => {
    messageStore.stopTyping(activeConversationId.value)
}

const replyToMessage = (message) => {
    replyToMessage.value = message
}

const cancelReply = () => {
    replyToMessage.value = null
}

const editMessage = (message) => {
    // Handle edit message
    console.log('Edit message:', message)
}

const deleteMessage = async (message) => {
    if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return
    
    try {
        await messageStore.deleteMessage(message.id)
        toast.success('Đã xóa tin nhắn')
    } catch (error) {
        toast.error('Không thể xóa tin nhắn')
    }
}

const reactToMessage = async (message, reaction) => {
    try {
        await messageStore.reactToMessage(message.id, reaction)
    } catch (error) {
        toast.error('Không thể thêm phản ứng')
    }
}

const forwardMessage = (message) => {
    forwardingMessage.value = message
    showForwardModal.value = true
}

const handleMessageForwarded = () => {
    showForwardModal.value = false
    forwardingMessage.value = null
    toast.success('Đã chuyển tiếp tin nhắn')
}

// Conversation actions
const archiveConversation = async (conversation) => {
    try {
        await conversationStore.archiveConversation(conversation.id)
        toast.success('Đã lưu trữ cuộc trò chuyện')
    } catch (error) {
        toast.error('Không thể lưu trữ cuộc trò chuyện')
    }
}

const deleteConversation = async (conversation) => {
    if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return
    
    try {
        await conversationStore.deleteConversation(conversation.id)
        
        if (activeConversationId.value === conversation.id) {
            activeConversationId.value = null
            router.push('/chat')
        }
        
        toast.success('Đã xóa cuộc trò chuyện')
    } catch (error) {
        toast.error('Không thể xóa cuộc trò chuyện')
    }
}

const muteConversation = async (conversation) => {
    try {
        await conversationStore.muteConversation(conversation.id)
        toast.success('Đã tắt thông báo')
    } catch (error) {
        toast.error('Không thể tắt thông báo')
    }
}

const markConversationAsRead = async (conversation) => {
    try {
        await conversationStore.markAsRead(conversation.id)
    } catch (error) {
        console.error('Error marking as read:', error)
    }
}

const markAllAsRead = async () => {
    try {
        await conversationStore.markAllAsRead()
        toast.success('Đã đánh dấu tất cả đã đọc')
    } catch (error) {
        toast.error('Không thể đánh dấu đã đọc')
    }
}

// UI helpers
const getConversationTitle = () => {
    if (!activeConversation.value) return ''
    
    if (activeConversation.value.title) {
        return activeConversation.value.title
    }
    
    if (activeConversation.value.isGroupChat) {
        return `Nhóm ${activeConversation.value.participants.length} người`
    }
    
    const otherParticipant = getOtherParticipant()
    return otherParticipant?.name || 'Cuộc trò chuyện'
}

const getOtherParticipant = () => {
    if (!activeConversation.value || activeConversation.value.isGroupChat) return null
    return activeConversation.value.participants?.find(p => p.id !== currentUser.value?.id)
}

const getPresenceText = (presence) => {
    if (presence.status === 'online') return 'Đang hoạt động'
    if (presence.status === 'away') return 'Vắng mặt'
    if (presence.lastSeen) return `Hoạt động ${formatTime(presence.lastSeen)}`
    return 'Ngoại tuyến'
}

const shouldShowDateSeparator = (message, index) => {
    if (index === 0) return true
    
    const previousMessage = messages.value[index - 1]
    const currentDate = new Date(message.createdAt).toDateString()
    const previousDate = new Date(previousMessage.createdAt).toDateString()
    
    return currentDate !== previousDate
}

const shouldShowAvatar = (message, index) => {
    if (message.senderId === currentUser.value?.id) return false
    if (index === messages.value.length - 1) return true
    
    const nextMessage = messages.value[index + 1]
    return nextMessage.senderId !== message.senderId
}

const shouldShowSender = (message, index) => {
    if (!activeConversation.value?.isGroupChat) return false
    if (message.senderId === currentUser.value?.id) return false
    if (index === 0) return true
    
    const previousMessage = messages.value[index - 1]
    return previousMessage.senderId !== message.senderId
}

const formatMessageDate = (date) => {
    return formatDate(date, 'dd/MM/yyyy')
}

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

const handleScroll = () => {
    if (!messagesContainer.value) return
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    
    showScrollToBottom.value = !isNearBottom
    
    if (isNearBottom) {
        newMessagesCount.value = 0
    }
}

// Filter and search
const setFilter = (filter) => {
    activeFilter.value = filter
}

const handleSearch = () => {
    // Search is reactive through computed property
}

const clearSearch = () => {
    searchQuery.value = ''
}

// Empty states
const getEmptyStateTitle = () => {
    if (searchQuery.value) return 'Không tìm thấy cuộc trò chuyện'
    if (activeFilter.value === 'unread') return 'Không có tin nhắn chưa đọc'
    if (activeFilter.value === 'groups') return 'Không có nhóm chat'
    return 'Chưa có cuộc trò chuyện nào'
}

const getEmptyStateDescription = () => {
    if (searchQuery.value) return 'Thử tìm kiếm với từ khóa khác'
    if (activeFilter.value === 'unread') return 'Tất cả tin nhắn đã được đọc'
    if (activeFilter.value === 'groups') return 'Tạo nhóm chat để bắt đầu trò chuyện nhóm'
    return 'Bắt đầu cuộc trò chuyện với bạn bè'
}

// Navigation
const backToConversations = () => {
    activeConversationId.value = null
    router.push('/chat')
}

const showConversationDetails = () => {
    showConversationInfo.value = true
}

// New chat
const handleChatCreated = (conversation) => {
    showNewChatModal.value = false
    selectConversation(conversation.id)
}

const startChatWithFriend = async (friend) => {
    try {
        const conversation = await conversationStore.createDirectMessage(friend.id)
        selectConversation(conversation.id)
    } catch (error) {
        toast.error('Không thể tạo cuộc trò chuyện')
    }
}

// Call functions
const startVoiceCall = () => {
    // Implement voice call
    console.log('Start voice call')
}

const startVideoCall = () => {
    // Implement video call
    console.log('Start video call')
}

const handleEndCall = () => {
    activeCall.value = null
}

const handleToggleMute = () => {
    // Toggle mute
}

const handleToggleVideo = () => {
    // Toggle video
}

// Settings and other actions
const showArchivedChats = () => {
    router.push('/chat/archived')
}

const openChatSettings = () => {
    router.push('/settings/chat')
}

const searchInConversation = () => {
    // Implement search in conversation
    console.log('Search in conversation')
}

const viewSharedMedia = () => {
    // View shared media
    console.log('View shared media')
}

const handleConversationUpdated = (updatedConversation) => {
    // Handle conversation update
    showConversationInfo.value = false
}

// Real-time updates
const setupRealTimeUpdates = () => {
    on('message:received', (data) => {
        if (data.conversationId === activeConversationId.value) {
            if (!isNearBottom()) {
                newMessagesCount.value++
            }
        }
    })

    on('conversation:updated', (data) => {
        conversationStore.updateConversation(data.conversation)
    })

    on('user:typing', (data) => {
        if (data.conversationId === activeConversationId.value) {
            messageStore.addTypingUser(data.conversationId, data.user)
        }
    })

    on('user:stop_typing', (data) => {
        if (data.conversationId === activeConversationId.value) {
            messageStore.removeTypingUser(data.conversationId, data.userId)
        }
    })
}

const cleanupRealTimeUpdates = () => {
    off('message:received')
    off('conversation:updated')
    off('user:typing')
    off('user:stop_typing')
}

const isNearBottom = () => {
    if (!messagesContainer.value) return true
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    return scrollHeight - scrollTop - clientHeight < 100
}

// Watchers
watch(() => route.params.conversationId, (newId) => {
    if (newId !== activeConversationId.value) {
        activeConversationId.value = newId
        if (newId) {
            loadConversationData(newId)
        }
    }
})

// Lifecycle
onMounted(async () => {
    await loadConversations(true)
    
    if (activeConversationId.value) {
        await loadConversationData(activeConversationId.value)
    }
    
    setupRealTimeUpdates()
    setupConversationsScroll()
    
    // Setup scroll listener
    if (messagesContainer.value) {
        messagesContainer.value.addEventListener('scroll', handleScroll)
    }
})

onUnmounted(() => {
    cleanupRealTimeUpdates()
    
    if (messagesContainer.value) {
        messagesContainer.value.removeEventListener('scroll', handleScroll)
    }
})
</script>

<style lang="scss" scoped>
.chat-view {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bs-light);

    .row {
        height: 100vh;
    }
}

// Conversations Sidebar
.conversations-sidebar {
    height: 100vh;
    background: white;
    border-right: 1px solid var(--bs-border-color);
    display: flex;
    flex-direction: column;

    .sidebar-header {
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);
        flex-shrink: 0;

        .header-content {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;

            .header-title {
                font-size: 1.5rem;
                font-weight: 700;
                margin: 0;
                color: var(--bs-dark);
            }

            .header-actions {
                display: flex;
                gap: 0.5rem;

                .btn-ghost {
                    background: none;
                    border: none;
                    padding: 0.5rem;
                    border-radius: 50%;
                    color: var(--bs-secondary);
                    transition: all 0.2s ease;

                    &:hover {
                        background: var(--bs-light);
                        color: var(--bs-primary);
                    }
                }
            }
        }

        .search-container {
            margin-bottom: 1rem;

            .search-input-group {
                position: relative;

                .search-icon {
                    position: absolute;
                    left: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--bs-secondary);
                    z-index: 5;
                }

                .form-control {
                    padding-left: 3rem;
                    padding-right: 3rem;
                    border-radius: 25px;
                    border: 1px solid var(--bs-border-color);
                    background: var(--bs-light);

                    &:focus {
                        border-color: var(--bs-primary);
                        box-shadow: none;
                        background: white;
                    }
                }

                .btn-clear {
                    position: absolute;
                    right: 0.5rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    padding: 0.25rem;
                    color: var(--bs-secondary);
                    border-radius: 50%;

                    &:hover {
                        background: var(--bs-secondary);
                        color: white;
                    }
                }
            }
        }

        .filter-tabs {
            display: flex;
            gap: 0.5rem;

            .filter-tab {
                flex: 1;
                background: none;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                font-weight: 500;
                color: var(--bs-secondary);
                transition: all 0.2s ease;
                position: relative;

                &:hover {
                    background: var(--bs-light);
                }

                &.active {
                    background: var(--bs-primary);
                    color: white;
                }

                .badge {
                    background: var(--bs-danger);
                    color: white;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    padding: 0.2rem 0.5rem;
                    margin-left: 0.5rem;
                }
            }
        }
    }

    .conversations-list {
        flex: 1;
        overflow-y: auto;

        .empty-state {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            padding: 2rem;

            .empty-content {
                text-align: center;

                .empty-icon {
                    font-size: 3rem;
                    color: var(--bs-secondary);
                    margin-bottom: 1rem;
                }

                .empty-title {
                    color: var(--bs-dark);
                    margin-bottom: 0.5rem;
                }

                .empty-description {
                    color: var(--bs-secondary);
                    margin-bottom: 1.5rem;
                }
            }
        }

        .load-more-trigger {
            height: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
    }

    .online-friends {
        padding: 1rem;
        border-top: 1px solid var(--bs-border-color);
        background: var(--bs-light);

        .friends-title {
            font-size: 0.9rem;
            font-weight: 600;
            color: var(--bs-secondary);
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .friends-list {
            display: flex;
            gap: 1rem;
            overflow-x: auto;
            padding-bottom: 0.5rem;

            .friend-item {
                flex-shrink: 0;
                text-align: center;
                cursor: pointer;
                transition: transform 0.2s ease;

                &:hover {
                    transform: scale(1.05);
                }

                .friend-avatar {
                    position: relative;
                    margin-bottom: 0.5rem;

                    .online-dot {
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

                .friend-name {
                    font-size: 0.8rem;
                    color: var(--bs-dark);
                    font-weight: 500;
                }
            }
        }
    }
}

// Chat Area
.chat-area {
    height: 100vh;
    display: flex;
    flex-direction: column;

    .no-conversation {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        background: white;

        .welcome-content {
            text-align: center;
            max-width: 400px;
            padding: 2rem;

            .welcome-icon {
                font-size: 4rem;
                color: var(--bs-primary);
                margin-bottom: 1.5rem;
            }

            .welcome-title {
                font-size: 1.75rem;
                font-weight: 700;
                color: var(--bs-dark);
                margin-bottom: 1rem;
            }

            .welcome-description {
                color: var(--bs-secondary);
                margin-bottom: 2rem;
                line-height: 1.6;
            }
        }
    }

    .active-conversation {
        height: 100vh;
        display: flex;
        flex-direction: column;

        .chat-header {
            background: white;
            border-bottom: 1px solid var(--bs-border-color);
            padding: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            flex-shrink: 0;

            .header-left {
                display: flex;
                align-items: center;
                gap: 1rem;

                .back-btn {
                    background: none;
                    border: none;
                    padding: 0.5rem;
                    border-radius: 50%;
                    color: var(--bs-secondary);

                    &:hover {
                        background: var(--bs-light);
                        color: var(--bs-primary);
                    }
                }

                .conversation-info {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    cursor: pointer;
                    padding: 0.5rem;
                    border-radius: 10px;
                    transition: background 0.2s ease;

                    &:hover {
                        background: var(--bs-light);
                    }

                    .group-avatar {
                        width: 48px;
                        height: 48px;
                        background: var(--bs-primary);
                        color: white;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.2rem;
                    }

                    .conversation-details {
                        .conversation-title {
                            margin: 0;
                            font-weight: 600;
                            color: var(--bs-dark);
                            font-size: 1.1rem;
                        }

                        .conversation-status {
                            font-size: 0.85rem;
                            color: var(--bs-secondary);

                            .typing-indicator {
                                color: var(--bs-primary);
                                font-style: italic;
                            }
                        }
                    }
                }
            }

            .header-actions {
                display: flex;
                gap: 0.5rem;

                .btn-ghost {
                    background: none;
                    border: none;
                    padding: 0.75rem;
                    border-radius: 50%;
                    color: var(--bs-secondary);
                    transition: all 0.2s ease;

                    &:hover {
                        background: var(--bs-light);
                        color: var(--bs-primary);
                    }
                }
            }
        }

        .messages-container {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
            background: #f8f9fa;
            position: relative;

            .loading-messages {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .messages-list {
                .load-earlier {
                    text-align: center;
                    padding: 1rem;
                    color: var(--bs-primary);
                    cursor: pointer;
                    font-weight: 500;
                    border-radius: 20px;
                    margin-bottom: 1rem;
                    transition: background 0.2s ease;

                    &:hover {
                        background: rgba(var(--bs-primary-rgb), 0.1);
                    }
                }

                .message-wrapper {
                    .date-separator {
                        text-align: center;
                        margin: 1.5rem 0;

                        .date-text {
                            background: rgba(0, 0, 0, 0.1);
                            color: var(--bs-secondary);
                            padding: 0.25rem 0.75rem;
                            border-radius: 15px;
                            font-size: 0.8rem;
                            font-weight: 500;
                        }
                    }
                }
            }

            .scroll-to-bottom {
                position: absolute;
                bottom: 2rem;
                right: 2rem;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                background: var(--bs-primary);
                color: white;
                border: none;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.2s ease;

                &:hover {
                    transform: scale(1.1);
                }

                .new-messages-badge {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: var(--bs-danger);
                    color: white;
                    border-radius: 10px;
                    font-size: 0.7rem;
                    padding: 0.2rem 0.4rem;
                    min-width: 18px;
                    text-align: center;
                }
            }
        }

        .message-input-container {
            background: white;
            border-top: 1px solid var(--bs-border-color);
            flex-shrink: 0;
        }
    }
}

// Responsive
@media (max-width: 768px) {
    .conversations-sidebar {
        .sidebar-header {
            padding: 0.75rem;

            .header-content {
                .header-title {
                    font-size: 1.25rem;
                }
            }

            .filter-tabs {
                .filter-tab {
                    padding: 0.4rem 0.75rem;
                    font-size: 0.85rem;
                }
            }
        }

        .online-friends {
            padding: 0.75rem;

            .friends-list {
                gap: 0.75rem;

                .friend-item {
                    .friend-name {
                        font-size: 0.75rem;
                    }
                }
            }
        }
    }

    .chat-area {
        .active-conversation {
            .chat-header {
                padding: 0.75rem;

                .header-left {
                    .conversation-info {
                        gap: 0.5rem;

                        .group-avatar {
                            width: 40px;
                            height: 40px;
                            font-size: 1rem;
                        }

                        .conversation-details {
                            .conversation-title {
                                font-size: 1rem;
                            }

                            .conversation-status {
                                font-size: 0.8rem;
                            }
                        }
                    }
                }

                .header-actions {
                    .btn-ghost {
                        padding: 0.5rem;
                    }
                }
            }

            .messages-container {
                padding: 0.75rem;

                .scroll-to-bottom {
                    bottom: 1.5rem;
                    right: 1.5rem;
                    width: 40px;
                    height: 40px;
                }
            }
        }
    }
}

// Scrollbar styling
.conversations-list,
.messages-container {
    &::-webkit-scrollbar {
        width: 6px;
    }

    &::-webkit-scrollbar-track {
        background: transparent;
    }

    &::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 3px;

        &:hover {
            background: rgba(0, 0, 0, 0.3);
        }
    }
}
</style>