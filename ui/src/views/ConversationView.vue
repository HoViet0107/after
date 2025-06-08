<!-- Individual conversation view với detailed messages, media sharing và conversation settings -->

<template>
    <div class="conversation-view">
        <div class="container-fluid p-0">
            <div class="row g-0 h-100">
                <!-- Main Chat Area -->
                <div class="col-lg-9 col-md-8">
                    <div class="chat-container">
                        <!-- Chat Header -->
                        <div class="chat-header">
                            <div class="header-left">
                                <button class="btn btn-ghost back-btn" @click="goBack">
                                    <i class="fas fa-arrow-left"></i>
                                </button>
                                
                                <div class="conversation-info" @click="toggleSidebar">
                                    <UserAvatar v-if="!conversation.isGroupChat" 
                                                :user="getOtherParticipant()" size="lg" class="conversation-avatar" />
                                    <div v-else class="group-avatar">
                                        <i class="fas fa-users"></i>
                                    </div>
                                    
                                    <div class="conversation-details">
                                        <h4 class="conversation-title">{{ getConversationTitle() }}</h4>
                                        <div class="conversation-status">
                                            <span v-if="!conversation.isGroupChat && otherParticipantPresence">
                                                {{ getPresenceText(otherParticipantPresence) }}
                                            </span>
                                            <span v-else-if="conversation.isGroupChat">
                                                {{ conversation.participants.length }} thành viên
                                                <span v-if="onlineCount > 0" class="online-count">
                                                    • {{ onlineCount }} đang online
                                                </span>
                                            </span>
                                            <div v-if="typingUsers.length > 0" class="typing-indicator">
                                                <TypingIndicator :typing-users="typingUsers" 
                                                                 :conversation-id="conversationId" compact />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="header-actions">
                                <button class="btn btn-ghost" @click="searchInConversation" title="Tìm kiếm">
                                    <i class="fas fa-search"></i>
                                </button>
                                <button class="btn btn-ghost" @click="startVoiceCall" title="Gọi thoại">
                                    <i class="fas fa-phone"></i>
                                </button>
                                <button class="btn btn-ghost" @click="startVideoCall" title="Gọi video">
                                    <i class="fas fa-video"></i>
                                </button>
                                <div class="dropdown">
                                    <button class="btn btn-ghost dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-v"></i>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li><a class="dropdown-item" href="#" @click="viewProfile">
                                            <i class="fas fa-user me-2"></i>Xem hồ sơ</a></li>
                                        <li><a class="dropdown-item" href="#" @click="searchInConversation">
                                            <i class="fas fa-search me-2"></i>Tìm kiếm tin nhắn</a></li>
                                        <li><a class="dropdown-item" href="#" @click="viewSharedMedia">
                                            <i class="fas fa-images me-2"></i>Ảnh & Video</a></li>
                                        <li><hr class="dropdown-divider"></li>
                                        <li><a class="dropdown-item" href="#" @click="muteConversation">
                                            <i class="fas fa-bell-slash me-2"></i>Tắt thông báo</a></li>
                                        <li><a class="dropdown-item" href="#" @click="blockUser" v-if="!conversation.isGroupChat">
                                            <i class="fas fa-ban me-2"></i>Chặn người dùng</a></li>
                                        <li><a class="dropdown-item text-danger" href="#" @click="deleteConversation">
                                            <i class="fas fa-trash me-2"></i>Xóa cuộc trò chuyện</a></li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Messages Area -->
                        <div class="messages-area" ref="messagesArea">
                            <!-- Search Results -->
                            <div v-if="searchResults.length > 0" class="search-results">
                                <div class="search-header">
                                    <h6>Kết quả tìm kiếm: "{{ searchQuery }}"</h6>
                                    <button class="btn btn-sm btn-ghost" @click="clearSearch">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="search-items">
                                    <div v-for="result in searchResults" :key="result.id" 
                                         class="search-item" @click="jumpToMessage(result.id)">
                                        <div class="search-avatar">
                                            <UserAvatar :user="result.sender" size="sm" />
                                        </div>
                                        <div class="search-content">
                                            <div class="search-sender">{{ result.sender.name }}</div>
                                            <div class="search-text" v-html="highlightSearchTerm(result.content, searchQuery)"></div>
                                            <div class="search-time">{{ formatTime(result.createdAt) }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Messages Container -->
                            <div v-else class="messages-container" ref="messagesContainer">
                                <div v-if="isLoadingMessages" class="loading-messages">
                                    <MessageSkeleton v-for="i in 10" :key="i" />
                                </div>

                                <div v-else class="messages-list">
                                    <!-- Load earlier messages -->
                                    <div v-if="hasEarlierMessages" class="load-earlier" @click="loadEarlierMessages">
                                        <div v-if="isLoadingEarlier" class="spinner-border spinner-border-sm text-primary"></div>
                                        <span v-else>
                                            <i class="fas fa-chevron-up me-2"></i>
                                            Tải tin nhắn cũ hơn
                                        </span>
                                    </div>

                                    <!-- Message groups -->
                                    <div v-for="(group, groupIndex) in messageGroups" :key="groupIndex" 
                                         class="message-group">
                                        <!-- Date separator -->
                                        <div v-if="group.showDate" class="date-separator">
                                            <span class="date-text">{{ formatMessageDate(group.date) }}</span>
                                        </div>

                                        <!-- Messages in group -->
                                        <div class="group-messages">
                                            <div v-for="(message, messageIndex) in group.messages" :key="message.id" 
                                                 class="message-wrapper" :id="`message-${message.id}`"
                                                 :class="{ 'highlighted': highlightedMessageId === message.id }">
                                                
                                                <MessageBubble :message="message" 
                                                               :is-own="message.senderId === currentUser.id"
                                                               :show-avatar="shouldShowAvatar(group, messageIndex)"
                                                               :show-sender="shouldShowSender(group, messageIndex)"
                                                               :show-time="shouldShowTime(group, messageIndex)"
                                                               :is-last-in-group="messageIndex === group.messages.length - 1"
                                                               @reply="replyToMessage"
                                                               @edit="editMessage"
                                                               @delete="deleteMessage"
                                                               @react="reactToMessage"
                                                               @forward="forwardMessage"
                                                               @download="downloadFile"
                                                               @view-media="viewMedia" />
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Typing indicator -->
                                    <div v-if="typingUsers.length > 0" class="typing-container">
                                        <TypingIndicator :typing-users="typingUsers" 
                                                         :conversation-id="conversationId" />
                                    </div>
                                </div>

                                <!-- Scroll to bottom button -->
                                <button v-if="showScrollToBottom" class="scroll-to-bottom" @click="scrollToBottom">
                                    <i class="fas fa-chevron-down"></i>
                                    <span v-if="newMessagesCount > 0" class="new-messages-badge">{{ newMessagesCount }}</span>
                                </button>

                                <!-- Unread messages indicator -->
                                <div v-if="unreadMessagesCount > 0" class="unread-indicator" @click="scrollToFirstUnread">
                                    <span>{{ unreadMessagesCount }} tin nhắn chưa đọc</span>
                                    <i class="fas fa-chevron-down"></i>
                                </div>
                            </div>
                        </div>

                        <!-- Message Input -->
                        <div class="message-input-container">
                            <MessageInput :conversation-id="conversationId" 
                                          :reply-to-message="replyToMessage"
                                          :is-blocked="isBlocked"
                                          @send="handleSendMessage"
                                          @typing="handleTyping"
                                          @stop-typing="handleStopTyping"
                                          @cancel-reply="cancelReply"
                                          @upload-progress="handleUploadProgress" />
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="col-lg-3 col-md-4" :class="{ 'd-none d-lg-block': !showSidebar }">
                    <div class="conversation-sidebar">
                        <!-- Sidebar Header -->
                        <div class="sidebar-header">
                            <h5 class="sidebar-title">Thông tin cuộc trò chuyện</h5>
                            <button class="btn btn-ghost close-sidebar d-lg-none" @click="closeSidebar">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>

                        <!-- Conversation Info -->
                        <div class="conversation-info-section">
                            <div class="info-avatar">
                                <UserAvatar v-if="!conversation.isGroupChat" 
                                            :user="getOtherParticipant()" size="xl" />
                                <div v-else class="group-avatar-large">
                                    <i class="fas fa-users"></i>
                                </div>
                            </div>
                            
                            <div class="info-details">
                                <h4 class="info-name">{{ getConversationTitle() }}</h4>
                                <p v-if="!conversation.isGroupChat" class="info-username">
                                    @{{ getOtherParticipant()?.username }}
                                </p>
                                <p v-else class="info-description">
                                    Nhóm có {{ conversation.participants.length }} thành viên
                                </p>
                            </div>

                            <div class="info-actions">
                                <button v-if="!conversation.isGroupChat" class="btn btn-outline-primary" @click="viewProfile">
                                    <i class="fas fa-user me-2"></i>
                                    Xem hồ sơ
                                </button>
                                <button v-else class="btn btn-outline-primary" @click="editGroupInfo">
                                    <i class="fas fa-edit me-2"></i>
                                    Chỉnh sửa nhóm
                                </button>
                            </div>
                        </div>

                        <!-- Participants (for group chats) -->
                        <div v-if="conversation.isGroupChat" class="participants-section">
                            <h6 class="section-title">
                                Thành viên ({{ conversation.participants.length }})
                                <button v-if="canAddMembers" class="btn btn-sm btn-ghost" @click="addMembers">
                                    <i class="fas fa-user-plus"></i>
                                </button>
                            </h6>
                            <div class="participants-list">
                                <div v-for="participant in conversation.participants" :key="participant.id" 
                                     class="participant-item">
                                    <UserAvatar :user="participant" size="md" />
                                    <div class="participant-info">
                                        <div class="participant-name">{{ participant.name }}</div>
                                        <div class="participant-status">
                                            {{ getParticipantStatus(participant) }}
                                        </div>
                                    </div>
                                    <div v-if="participant.isAdmin" class="admin-badge">
                                        <i class="fas fa-crown" title="Quản trị viên"></i>
                                    </div>
                                    <div v-if="canManageParticipant(participant)" class="dropdown">
                                        <button class="btn btn-sm btn-ghost dropdown-toggle" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-v"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" @click="viewParticipantProfile(participant)">
                                                <i class="fas fa-user me-2"></i>Xem hồ sơ</a></li>
                                            <li><a class="dropdown-item" href="#" @click="makeAdmin(participant)" v-if="!participant.isAdmin">
                                                <i class="fas fa-crown me-2"></i>Làm quản trị viên</a></li>
                                            <li><a class="dropdown-item text-danger" href="#" @click="removeParticipant(participant)">
                                                <i class="fas fa-user-minus me-2"></i>Xóa khỏi nhóm</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Shared Media -->
                        <div class="shared-media-section">
                            <div class="section-header">
                                <h6 class="section-title">Ảnh & Video</h6>
                                <button class="btn btn-sm btn-ghost" @click="viewAllMedia">
                                    Xem tất cả
                                </button>
                            </div>
                            <div v-if="sharedMedia.length > 0" class="media-grid">
                                <div v-for="media in sharedMedia.slice(0, 6)" :key="media.id" 
                                     class="media-item" @click="viewMedia(media)">
                                    <img :src="media.thumbnail || media.url" :alt="media.name" class="img-fluid">
                                    <div v-if="media.type === 'video'" class="video-overlay">
                                        <i class="fas fa-play"></i>
                                    </div>
                                </div>
                            </div>
                            <div v-else class="empty-media">
                                <i class="fas fa-images"></i>
                                <span>Chưa có ảnh hoặc video</span>
                            </div>
                        </div>

                        <!-- Shared Files -->
                        <div class="shared-files-section">
                            <div class="section-header">
                                <h6 class="section-title">Files đã chia sẻ</h6>
                                <button class="btn btn-sm btn-ghost" @click="viewAllFiles">
                                    Xem tất cả
                                </button>
                            </div>
                            <div v-if="sharedFiles.length > 0" class="files-list">
                                <div v-for="file in sharedFiles.slice(0, 5)" :key="file.id" 
                                     class="file-item" @click="downloadFile(file)">
                                    <div class="file-icon">
                                        <i :class="getFileIcon(file.type)"></i>
                                    </div>
                                    <div class="file-info">
                                        <div class="file-name">{{ file.name }}</div>
                                        <div class="file-meta">
                                            {{ formatFileSize(file.size) }} • {{ formatTime(file.createdAt) }}
                                        </div>
                                    </div>
                                    <button class="btn btn-sm btn-ghost download-btn">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                            <div v-else class="empty-files">
                                <i class="fas fa-file"></i>
                                <span>Chưa có file nào</span>
                            </div>
                        </div>

                        <!-- Privacy & Support -->
                        <div class="privacy-section">
                            <h6 class="section-title">Quyền riêng tư & Hỗ trợ</h6>
                            <div class="privacy-actions">
                                <button class="privacy-action" @click="muteConversation">
                                    <i class="fas fa-bell-slash"></i>
                                    <span>{{ conversation.isMuted ? 'Bật thông báo' : 'Tắt thông báo' }}</span>
                                </button>
                                <button class="privacy-action" @click="blockUser" v-if="!conversation.isGroupChat">
                                    <i class="fas fa-ban"></i>
                                    <span>Chặn người dùng</span>
                                </button>
                                <button class="privacy-action" @click="reportConversation">
                                    <i class="fas fa-flag"></i>
                                    <span>Báo cáo</span>
                                </button>
                                <button class="privacy-action text-danger" @click="deleteConversation">
                                    <i class="fas fa-trash"></i>
                                    <span>Xóa cuộc trò chuyện</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <SearchModal v-if="showSearchModal" :conversation-id="conversationId"
                     @close="showSearchModal = false" @result="handleSearchResult" />

        <MediaViewerModal v-if="showMediaViewer" :media="currentMedia" :media-list="allMedia"
                          @close="showMediaViewer = false" @navigate="navigateMedia" />

        <AddMembersModal v-if="showAddMembersModal" :conversation="conversation"
                         @close="showAddMembersModal = false" @added="handleMembersAdded" />

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
import { useToast } from 'vue-toastification'
import { formatTime, formatDate, formatFileSize, highlightSearchTerm } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'
import MessageBubble from '@/components/message/MessageBubble.vue'
import MessageSkeleton from '@/components/skeleton/MessageSkeleton.vue'
import MessageInput from '@/components/message/MessageInput.vue'
import TypingIndicator from '@/components/message/TypingIndicator.vue'
import SearchModal from '@/components/conversation/SearchModal.vue'
import MediaViewerModal from '@/components/media/MediaViewerModal.vue'
import AddMembersModal from '@/components/conversation/AddMembersModal.vue'
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
const messagesArea = ref(null)
const messagesContainer = ref(null)

// Props/Params
const conversationId = computed(() => route.params.id)

// State
const conversation = ref({})
const messages = ref([])
const typingUsers = ref([])
const isLoadingMessages = ref(false)
const isLoadingEarlier = ref(false)
const hasEarlierMessages = ref(true)
const showScrollToBottom = ref(false)
const newMessagesCount = ref(0)
const unreadMessagesCount = ref(0)
const highlightedMessageId = ref(null)
const replyToMessage = ref(null)
const showSidebar = ref(!isMobile.value)
const searchQuery = ref('')
const searchResults = ref([])
const showSearchModal = ref(false)
const showMediaViewer = ref(false)
const showAddMembersModal = ref(false)
const currentMedia = ref(null)
const activeCall = ref(null)
const isBlocked = ref(false)

// Mock data
const sharedMedia = ref([
    { id: 1, type: 'image', url: '/images/shared1.jpg', thumbnail: '/images/shared1_thumb.jpg' },
    { id: 2, type: 'video', url: '/videos/shared1.mp4', thumbnail: '/videos/shared1_thumb.jpg' },
    { id: 3, type: 'image', url: '/images/shared2.jpg', thumbnail: '/images/shared2_thumb.jpg' }
])

const sharedFiles = ref([
    { id: 1, name: 'Document.pdf', type: 'pdf', size: 2048576, createdAt: '2025-06-08T10:30:00Z' },
    { id: 2, name: 'Presentation.pptx', type: 'pptx', size: 5242880, createdAt: '2025-06-07T15:45:00Z' }
])

// Computed
const currentUser = computed(() => authStore.user)

const messageGroups = computed(() => {
    if (!messages.value.length) return []

    const groups = []
    let currentGroup = null
    let currentDate = null

    messages.value.forEach((message, index) => {
        const messageDate = new Date(message.createdAt).toDateString()
        const showDate = currentDate !== messageDate

        if (showDate || !currentGroup || currentGroup.senderId !== message.senderId) {
            // Start new group
            currentGroup = {
                senderId: message.senderId,
                sender: message.sender,
                date: messageDate,
                showDate,
                messages: [message]
            }
            groups.push(currentGroup)
        } else {
            // Add to current group
            currentGroup.messages.push(message)
        }

        currentDate = messageDate
    })

    return groups
})

const otherParticipantPresence = computed(() => {
    if (!conversation.value || conversation.value.isGroupChat) return null
    const otherParticipant = getOtherParticipant()
    return otherParticipant ? presenceStore.getUserPresence(otherParticipant.id) : null
})

const onlineCount = computed(() => {
    if (!conversation.value?.isGroupChat) return 0
    return conversation.value.participants?.filter(p => 
        presenceStore.getUserPresence(p.id)?.status === 'online'
    ).length || 0
})

const canAddMembers = computed(() => {
    return conversation.value?.isGroupChat && 
           (conversation.value.isAdmin || conversation.value.canAddMembers)
})

const canManageParticipant = computed(() => {
    return (participant) => {
        return conversation.value?.isAdmin && participant.id !== currentUser.value?.id
    }
})

const allMedia = computed(() => {
    return [...sharedMedia.value]
})

// Methods
const loadConversation = async () => {
    try {
        isLoadingMessages.value = true
        
        // Load conversation details
        const conv = await conversationStore.getConversation(conversationId.value)
        conversation.value = conv
        
        // Load messages
        const msgs = await messageStore.loadMessages(conversationId.value, { refresh: true })
        messages.value = msgs
        
        // Load typing users
        typingUsers.value = messageStore.getTypingUsersForConversation(conversationId.value)
        
        // Mark as read
        await conversationStore.markAsRead(conversationId.value)
        
        // Scroll to bottom
        await nextTick()
        scrollToBottom()
        
    } catch (error) {
        console.error('Error loading conversation:', error)
        toast.error('Không thể tải cuộc trò chuyện')
        router.push('/chat')
    } finally {
        isLoadingMessages.value = false
    }
}

const loadEarlierMessages = async () => {
    if (!hasEarlierMessages.value || isLoadingEarlier.value) return
    
    isLoadingEarlier.value = true
    try {
        const scrollPosition = messagesContainer.value?.scrollTop || 0
        const earlierMessages = await messageStore.loadMessages(conversationId.value, { 
            refresh: false,
            before: messages.value[0]?.id 
        })
        
        messages.value = [...earlierMessages, ...messages.value]
        hasEarlierMessages.value = earlierMessages.length > 0
        
        // Maintain scroll position
        await nextTick()
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = scrollPosition
        }
    } finally {
        isLoadingEarlier.value = false
    }
}

const handleSendMessage = async (messageData) => {
    try {
        const newMessage = await messageStore.sendMessage(conversationId.value, messageData)
        messages.value.push(newMessage)
        
        await nextTick()
        scrollToBottom()
    } catch (error) {
        console.error('Error sending message:', error)
        toast.error('Không thể gửi tin nhắn')
    }
}

const handleTyping = () => {
    messageStore.startTyping(conversationId.value)
}

const handleStopTyping = () => {
    messageStore.stopTyping(conversationId.value)
}

const replyToMessage = (message) => {
    replyToMessage.value = message
}

const cancelReply = () => {
    replyToMessage.value = null
}

const editMessage = async (message) => {
    // Handle edit message
    console.log('Edit message:', message)
}

const deleteMessage = async (message) => {
    if (!confirm('Bạn có chắc muốn xóa tin nhắn này?')) return
    
    try {
        await messageStore.deleteMessage(message.id)
        messages.value = messages.value.filter(m => m.id !== message.id)
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
    // Handle forward message
    console.log('Forward message:', message)
}

const downloadFile = (file) => {
    // Handle file download
    console.log('Download file:', file)
}

const viewMedia = (media) => {
    currentMedia.value = media
    showMediaViewer.value = true
}

const navigateMedia = (direction) => {
    const currentIndex = allMedia.value.findIndex(m => m.id === currentMedia.value.id)
    if (direction === 'next' && currentIndex < allMedia.value.length - 1) {
        currentMedia.value = allMedia.value[currentIndex + 1]
    } else if (direction === 'prev' && currentIndex > 0) {
        currentMedia.value = allMedia.value[currentIndex - 1]
    }
}

// UI helpers
const getConversationTitle = () => {
    if (!conversation.value) return ''
    
    if (conversation.value.title) {
        return conversation.value.title
    }
    
    if (conversation.value.isGroupChat) {
        return `Nhóm ${conversation.value.participants?.length || 0} người`
    }
    
    const otherParticipant = getOtherParticipant()
    return otherParticipant?.name || 'Cuộc trò chuyện'
}

const getOtherParticipant = () => {
    if (!conversation.value || conversation.value.isGroupChat) return null
    return conversation.value.participants?.find(p => p.id !== currentUser.value?.id)
}

const getPresenceText = (presence) => {
    if (presence.status === 'online') return 'Đang hoạt động'
    if (presence.status === 'away') return 'Vắng mặt'
    if (presence.lastSeen) return `Hoạt động ${formatTime(presence.lastSeen)}`
    return 'Ngoại tuyến'
}

const getParticipantStatus = (participant) => {
    const presence = presenceStore.getUserPresence(participant.id)
    if (presence?.status === 'online') return 'Đang hoạt động'
    return 'Ngoại tuyến'
}

const shouldShowAvatar = (group, messageIndex) => {
    return messageIndex === group.messages.length - 1 && group.senderId !== currentUser.value?.id
}

const shouldShowSender = (group, messageIndex) => {
    return messageIndex === 0 && conversation.value?.isGroupChat && 
           group.senderId !== currentUser.value?.id
}

const shouldShowTime = (group, messageIndex) => {
    return messageIndex === group.messages.length - 1
}

const formatMessageDate = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
        return 'Hôm nay'
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Hôm qua'
    } else {
        return formatDate(date, 'dd/MM/yyyy')
    }
}

const getFileIcon = (fileType) => {
    const iconMap = {
        pdf: 'fas fa-file-pdf text-danger',
        doc: 'fas fa-file-word text-primary',
        docx: 'fas fa-file-word text-primary',
        xls: 'fas fa-file-excel text-success',
        xlsx: 'fas fa-file-excel text-success',
        ppt: 'fas fa-file-powerpoint text-warning',
        pptx: 'fas fa-file-powerpoint text-warning',
        zip: 'fas fa-file-archive text-secondary',
        rar: 'fas fa-file-archive text-secondary'
    }
    return iconMap[fileType] || 'fas fa-file text-muted'
}

// Navigation and actions
const goBack = () => {
    router.push('/chat')
}

const toggleSidebar = () => {
    showSidebar.value = !showSidebar.value
}

const closeSidebar = () => {
    showSidebar.value = false
}

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

const scrollToFirstUnread = () => {
    // Scroll to first unread message
    const firstUnreadElement = document.querySelector('.message-wrapper.unread')
    if (firstUnreadElement) {
        firstUnreadElement.scrollIntoView({ behavior: 'smooth' })
    }
}

const jumpToMessage = (messageId) => {
    highlightedMessageId.value = messageId
    const messageElement = document.getElementById(`message-${messageId}`)
    if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth' })
        setTimeout(() => {
            highlightedMessageId.value = null
        }, 3000)
    }
}

// Search
const searchInConversation = () => {
    showSearchModal.value = true
}

const handleSearchResult = (results) => {
    searchResults.value = results
    showSearchModal.value = false
}

const clearSearch = () => {
    searchResults.value = []
    searchQuery.value = ''
}

// Conversation actions
const viewProfile = () => {
    const otherParticipant = getOtherParticipant()
    if (otherParticipant) {
        router.push(`/profile/${otherParticipant.username || otherParticipant.id}`)
    }
}

const viewSharedMedia = () => {
    // Navigate to shared media view
    router.push(`/chat/${conversationId.value}/media`)
}

const viewAllMedia = () => {
    viewSharedMedia()
}

const viewAllFiles = () => {
    router.push(`/chat/${conversationId.value}/files`)
}

const muteConversation = async () => {
    try {
        await conversationStore.muteConversation(conversationId.value)
        conversation.value.isMuted = !conversation.value.isMuted
        toast.success(conversation.value.isMuted ? 'Đã tắt thông báo' : 'Đã bật thông báo')
    } catch (error) {
        toast.error('Không thể thay đổi cài đặt thông báo')
    }
}

const blockUser = async () => {
    if (!confirm('Bạn có chắc muốn chặn người dùng này?')) return
    
    try {
        const otherParticipant = getOtherParticipant()
        if (otherParticipant) {
            await conversationStore.blockUser(otherParticipant.id)
            isBlocked.value = true
            toast.success('Đã chặn người dùng')
        }
    } catch (error) {
        toast.error('Không thể chặn người dùng')
    }
}

const deleteConversation = async () => {
    if (!confirm('Bạn có chắc muốn xóa cuộc trò chuyện này?')) return
    
    try {
        await conversationStore.deleteConversation(conversationId.value)
        toast.success('Đã xóa cuộc trò chuyện')
        router.push('/chat')
    } catch (error) {
        toast.error('Không thể xóa cuộc trò chuyện')
    }
}

const reportConversation = () => {
    // Handle report conversation
    console.log('Report conversation')
}

// Group actions
const editGroupInfo = () => {
    // Handle edit group info
    console.log('Edit group info')
}

const addMembers = () => {
    showAddMembersModal.value = true
}

const handleMembersAdded = (newMembers) => {
    conversation.value.participants.push(...newMembers)
    showAddMembersModal.value = false
    toast.success(`Đã thêm ${newMembers.length} thành viên mới`)
}

const viewParticipantProfile = (participant) => {
    router.push(`/profile/${participant.username || participant.id}`)
}

const makeAdmin = async (participant) => {
    try {
        await conversationStore.makeAdmin(conversationId.value, participant.id)
        participant.isAdmin = true
        toast.success(`Đã đặt ${participant.name} làm quản trị viên`)
    } catch (error) {
        toast.error('Không thể đặt làm quản trị viên')
    }
}

const removeParticipant = async (participant) => {
    if (!confirm(`Bạn có chắc muốn xóa ${participant.name} khỏi nhóm?`)) return
    
    try {
        await conversationStore.removeParticipant(conversationId.value, participant.id)
        conversation.value.participants = conversation.value.participants.filter(p => p.id !== participant.id)
        toast.success(`Đã xóa ${participant.name} khỏi nhóm`)
    } catch (error) {
        toast.error('Không thể xóa thành viên')
    }
}

// Call functions
const startVoiceCall = () => {
    console.log('Start voice call')
}

const startVideoCall = () => {
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

const handleUploadProgress = (progress) => {
    // Handle upload progress
    console.log('Upload progress:', progress)
}

// Scroll handling
const handleScroll = () => {
    if (!messagesContainer.value) return
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100
    
    showScrollToBottom.value = !isNearBottom
    
    if (isNearBottom) {
        newMessagesCount.value = 0
    }
}

// Real-time updates
const setupRealTimeUpdates = () => {
    on('message:received', (data) => {
        if (data.conversationId === conversationId.value) {
            messages.value.push(data.message)
            if (!isNearBottom()) {
                newMessagesCount.value++
            } else {
                nextTick(() => scrollToBottom())
            }
        }
    })

    on('user:typing', (data) => {
        if (data.conversationId === conversationId.value) {
            const existingUser = typingUsers.value.find(u => u.id === data.user.id)
            if (!existingUser) {
                typingUsers.value.push(data.user)
            }
        }
    })

    on('user:stop_typing', (data) => {
        if (data.conversationId === conversationId.value) {
            typingUsers.value = typingUsers.value.filter(u => u.id !== data.userId)
        }
    })
}

const cleanupRealTimeUpdates = () => {
    off('message:received')
    off('user:typing')
    off('user:stop_typing')
}

const isNearBottom = () => {
    if (!messagesContainer.value) return true
    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    return scrollHeight - scrollTop - clientHeight < 100
}

// Watchers
watch(() => route.params.id, (newId) => {
    if (newId) {
        loadConversation()
    }
}, { immediate: true })

// Lifecycle
onMounted(() => {
    setupRealTimeUpdates()
    
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
.conversation-view {
    height: 100vh;
    background: var(--bs-light);

    .row {
        height: 100vh;
    }
}

// Chat Container
.chat-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: white;

    .chat-header {
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        z-index: 10;
        flex-shrink: 0;

        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;
            flex: 1;
            min-width: 0;

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
                gap: 1rem;
                cursor: pointer;
                padding: 0.5rem;
                border-radius: 10px;
                transition: background 0.2s ease;
                flex: 1;
                min-width: 0;

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
                    flex-shrink: 0;
                }

                .conversation-details {
                    flex: 1;
                    min-width: 0;

                    .conversation-title {
                        margin: 0;
                        font-weight: 600;
                        color: var(--bs-dark);
                        font-size: 1.2rem;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }

                    .conversation-status {
                        font-size: 0.9rem;
                        color: var(--bs-secondary);

                        .online-count {
                            color: var(--bs-success);
                        }

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
            flex-shrink: 0;

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

    .messages-area {
        flex: 1;
        overflow: hidden;
        position: relative;

        .search-results {
            height: 100%;
            background: white;
            border-bottom: 1px solid var(--bs-border-color);

            .search-header {
                padding: 1rem;
                border-bottom: 1px solid var(--bs-border-color);
                display: flex;
                justify-content: space-between;
                align-items: center;

                h6 {
                    margin: 0;
                    font-weight: 600;
                }
            }

            .search-items {
                overflow-y: auto;
                height: calc(100% - 80px);

                .search-item {
                    padding: 1rem;
                    border-bottom: 1px solid var(--bs-border-color-translucent);
                    cursor: pointer;
                    display: flex;
                    gap: 0.75rem;

                    &:hover {
                        background: var(--bs-light);
                    }

                    .search-avatar {
                        flex-shrink: 0;
                    }

                    .search-content {
                        flex: 1;
                        min-width: 0;

                        .search-sender {
                            font-weight: 600;
                            color: var(--bs-dark);
                            margin-bottom: 0.25rem;
                        }

                        .search-text {
                            color: var(--bs-dark);
                            margin-bottom: 0.25rem;
                            overflow: hidden;
                            text-overflow: ellipsis;
                            white-space: nowrap;

                            :deep(.highlight) {
                                background: var(--bs-warning);
                                padding: 0.1rem 0.2rem;
                                border-radius: 2px;
                            }
                        }

                        .search-time {
                            font-size: 0.8rem;
                            color: var(--bs-secondary);
                        }
                    }
                }
            }
        }

        .messages-container {
            height: 100%;
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
                    margin-bottom: 1.5rem;
                    transition: background 0.2s ease;

                    &:hover {
                        background: rgba(var(--bs-primary-rgb), 0.1);
                    }
                }

                .message-group {
                    margin-bottom: 1.5rem;

                    .date-separator {
                        text-align: center;
                        margin: 2rem 0 1.5rem;

                        .date-text {
                            background: rgba(0, 0, 0, 0.1);
                            color: var(--bs-secondary);
                            padding: 0.5rem 1rem;
                            border-radius: 20px;
                            font-size: 0.9rem;
                            font-weight: 500;
                        }
                    }

                    .group-messages {
                        .message-wrapper {
                            margin-bottom: 0.25rem;

                            &.highlighted {
                                animation: highlight 2s ease-out;
                            }

                            &:last-child {
                                margin-bottom: 0;
                            }
                        }
                    }
                }

                .typing-container {
                    margin-top: 1rem;
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
                z-index: 10;

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

            .unread-indicator {
                position: absolute;
                top: 1rem;
                left: 50%;
                transform: translateX(-50%);
                background: var(--bs-primary);
                color: white;
                padding: 0.5rem 1rem;
                border-radius: 20px;
                cursor: pointer;
                font-size: 0.9rem;
                font-weight: 500;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10;

                &:hover {
                    background: var(--bs-primary-dark);
                }
            }
        }
    }

    .message-input-container {
        background: white;
        border-top: 1px solid var(--bs-border-color);
        flex-shrink: 0;
    }
}

// Sidebar
.conversation-sidebar {
    height: 100vh;
    background: white;
    border-left: 1px solid var(--bs-border-color);
    overflow-y: auto;

    .sidebar-header {
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: white;
        position: sticky;
        top: 0;
        z-index: 5;

        .sidebar-title {
            margin: 0;
            font-weight: 600;
            color: var(--bs-dark);
        }

        .close-sidebar {
            background: none;
            border: none;
            padding: 0.5rem;
            border-radius: 50%;
            color: var(--bs-secondary);

            &:hover {
                background: var(--bs-light);
                color: var(--bs-danger);
            }
        }
    }

    .conversation-info-section {
        padding: 2rem 1rem;
        text-align: center;
        border-bottom: 1px solid var(--bs-border-color);

        .info-avatar {
            margin-bottom: 1rem;

            .group-avatar-large {
                width: 80px;
                height: 80px;
                background: var(--bs-primary);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                margin: 0 auto;
            }
        }

        .info-details {
            margin-bottom: 1.5rem;

            .info-name {
                font-size: 1.5rem;
                font-weight: 700;
                color: var(--bs-dark);
                margin-bottom: 0.5rem;
            }

            .info-username {
                color: var(--bs-secondary);
                margin-bottom: 0;
            }

            .info-description {
                color: var(--bs-secondary);
                margin-bottom: 0;
            }
        }

        .info-actions {
            .btn {
                border-radius: 25px;
                font-weight: 600;
                padding: 0.5rem 1.5rem;
            }
        }
    }

    .participants-section,
    .shared-media-section,
    .shared-files-section,
    .privacy-section {
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);

        .section-title {
            font-weight: 600;
            color: var(--bs-dark);
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 1rem;

            .section-title {
                margin-bottom: 0;
            }

            .btn {
                color: var(--bs-primary);
                text-decoration: none;
                font-size: 0.9rem;

                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }

    .participants-list {
        .participant-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--bs-border-color-translucent);

            &:last-child {
                border-bottom: none;
            }

            .participant-info {
                flex: 1;
                min-width: 0;

                .participant-name {
                    font-weight: 600;
                    color: var(--bs-dark);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .participant-status {
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                }
            }

            .admin-badge {
                color: var(--bs-warning);
                margin-left: auto;
            }
        }
    }

    .media-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;

        .media-item {
            aspect-ratio: 1;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            position: relative;
            transition: transform 0.2s ease;

            &:hover {
                transform: scale(1.05);
            }

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .video-overlay {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.7);
                color: white;
                border-radius: 50%;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 0.8rem;
            }
        }
    }

    .empty-media,
    .empty-files {
        text-align: center;
        padding: 2rem 1rem;
        color: var(--bs-secondary);

        i {
            font-size: 2rem;
            margin-bottom: 0.5rem;
            display: block;
        }
    }

    .files-list {
        .file-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--bs-border-color-translucent);
            cursor: pointer;
            transition: background 0.2s ease;

            &:hover {
                background: var(--bs-light);
            }

            &:last-child {
                border-bottom: none;
            }

            .file-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                flex-shrink: 0;
            }

            .file-info {
                flex: 1;
                min-width: 0;

                .file-name {
                    font-weight: 500;
                    color: var(--bs-dark);
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                .file-meta {
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                }
            }

            .download-btn {
                background: none;
                border: none;
                padding: 0.5rem;
                border-radius: 50%;
                color: var(--bs-secondary);

                &:hover {
                    background: var(--bs-primary);
                    color: white;
                }
            }
        }
    }

    .privacy-actions {
        .privacy-action {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            width: 100%;
            padding: 0.75rem 0;
            background: none;
            border: none;
            color: var(--bs-dark);
            text-align: left;
            transition: color 0.2s ease;

            &:hover {
                color: var(--bs-primary);
            }

            &.text-danger:hover {
                color: var(--bs-danger);
            }

            i {
                width: 20px;
                text-align: center;
                flex-shrink: 0;
            }
        }
    }
}

// Animations
@keyframes highlight {
    0% {
        background: rgba(var(--bs-warning-rgb), 0.3);
    }
    100% {
        background: transparent;
    }
}

// Responsive
@media (max-width: 768px) {
    .chat-container {
        .chat-header {
            padding: 0.75rem;

            .header-left {
                .conversation-info {
                    gap: 0.75rem;

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

        .messages-area {
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

    .conversation-sidebar {
        .conversation-info-section {
            padding: 1.5rem 1rem;

            .info-details {
                .info-name {
                    font-size: 1.25rem;
                }
            }
        }

        .media-grid {
            grid-template-columns: repeat(2, 1fr);
        }
    }
}

// Scrollbar styling
.conversation-sidebar,
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