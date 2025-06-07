<template>
    <div class="message-list" ref="messageListRef">
        <!-- Load More Button (Top) -->
        <div v-if="hasMoreMessages && !isLoadingMore" class="load-more-top">
            <button class="btn btn-outline-secondary btn-sm" @click="loadMoreMessages">
                <i class="fas fa-chevron-up me-1"></i>
                Tải tin nhắn cũ hơn
            </button>
        </div>

        <!-- Loading More Messages -->
        <div v-if="isLoadingMore" class="loading-more text-center py-3">
            <LoadingSpinner size="small" />
            <span class="text-muted ms-2">Đang tải...</span>
        </div>

        <!-- Messages Container -->
        <div class="messages-container" ref="messagesContainer">
            <!-- Loading State -->
            <div v-if="isLoading && messages.length === 0" class="loading-state">
                <LoadingSpinner size="medium" />
                <p class="text-muted mt-2">Đang tải tin nhắn...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="messages.length === 0" class="empty-state">
                <div class="text-center py-5">
                    <i class="fas fa-comments text-muted mb-3" style="font-size: 3rem;"></i>
                    <h6 class="text-muted">Chưa có tin nhắn nào</h6>
                    <p class="text-muted small">Hãy bắt đầu cuộc trò chuyện!</p>
                </div>
            </div>

            <!-- Message Groups -->
            <div v-else class="message-groups">
                <div v-for="(group, groupIndex) in messageGroups" :key="groupIndex" class="message-group">
                    <!-- Date Separator -->
                    <div v-if="group.showDateSeparator" class="date-separator">
                        <span class="date-text">{{ formatDate(group.date) }}</span>
                    </div>

                    <!-- Messages in Group -->
                    <div class="grouped-messages">
                        <MessageBubble v-for="(message, messageIndex) in group.messages" :key="message.id"
                            :message="message" :is-own="message.senderId === currentUserId"
                            :show-avatar="shouldShowAvatar(group, messageIndex)"
                            :show-sender="shouldShowSender(group, messageIndex)"
                            :show-timestamp="shouldShowTimestamp(group, messageIndex)"
                            :is-first-in-group="messageIndex === 0"
                            :is-last-in-group="messageIndex === group.messages.length - 1"
                            :conversation-id="conversationId" @reply="handleReply" @edit="handleEdit"
                            @delete="handleDelete" @react="handleReact" @forward="handleForward"
                            @scroll-to="scrollToMessage" />
                    </div>
                </div>

                <!-- Temporary Messages (Sending/Failed) -->
                <div v-if="tempMessages.length > 0" class="temp-messages">
                    <MessageBubble v-for="tempMessage in tempMessages" :key="tempMessage.id" :message="tempMessage"
                        :is-own="true" :show-avatar="false" :show-sender="false" :show-timestamp="true"
                        :is-first-in-group="true" :is-last-in-group="true" :conversation-id="conversationId"
                        @retry="handleRetry" />
                </div>
            </div>
        </div>

        <!-- Typing Indicators -->
        <div v-if="typingUsers.length > 0" class="typing-indicators">
            <div class="typing-item">
                <div class="typing-avatars">
                    <img v-for="user in typingUsers.slice(0, 3)" :key="user.userId"
                        :src="user.avatar || '/default-avatar.png'" :alt="user.username" class="typing-avatar" />
                </div>
                <div class="typing-bubble">
                    <div class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </div>
            <div class="typing-text">
                {{ getTypingText() }}
            </div>
        </div>

        <!-- Scroll to Bottom Button -->
        <Transition name="fade">
            <button v-if="showScrollToBottom" class="scroll-to-bottom-btn" @click="scrollToBottom"
                title="Cuộn xuống cuối">
                <i class="fas fa-chevron-down"></i>
                <span v-if="unreadCount > 0" class="unread-count">{{ unreadCount }}</span>
            </button>
        </Transition>

        <!-- Message Search Results -->
        <div v-if="searchResults.length > 0" class="search-results-overlay">
            <div class="search-results">
                <div class="search-header">
                    <h6>Kết quả tìm kiếm ({{ searchResults.length }})</h6>
                    <button class="btn btn-sm btn-outline-secondary" @click="clearSearch">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="search-items">
                    <div v-for="result in searchResults" :key="result.id" class="search-item"
                        @click="scrollToMessage(result.id)">
                        <div class="search-content">
                            <strong>{{ result.senderName }}</strong>
                            <span class="search-preview">{{ result.content }}</span>
                        </div>
                        <div class="search-time">{{ formatTime(result.createdAt) }}</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useMessageStore } from '@/stores/message'
import { useAuthStore } from '@/stores/auth'
import { useIntersectionObserver } from '@/composables/useIntersectionObserver'
import { formatDistanceToNow, format, isToday, isYesterday, isSameDay } from 'date-fns'
import { vi } from 'date-fns/locale'
import MessageBubble from '@/components/message/MessageBubble.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

// Props
const props = defineProps({
    conversationId: {
        type: String,
        required: true
    },
    searchQuery: {
        type: String,
        default: ''
    }
})

// Emits
const emit = defineEmits([
    'message-reply',
    'message-edit',
    'message-delete',
    'message-react',
    'message-forward',
    'scroll-to-bottom',
    'load-more'
])

// Dependencies
const messageStore = useMessageStore()
const authStore = useAuthStore()

// Refs
const messageListRef = ref(null)
const messagesContainer = ref(null)

// State
const showScrollToBottom = ref(false)
const lastScrollTop = ref(0)
const autoScrollEnabled = ref(true)
const searchResults = ref([])
const unreadCount = ref(0)

// Computed
const currentUserId = computed(() => authStore.userId)
const messages = computed(() => messageStore.getMessagesByConversation(props.conversationId))
const tempMessages = computed(() => messageStore.getTempMessages(props.conversationId))
const typingUsers = computed(() => messageStore.getTypingUsersForConversation(props.conversationId))
const isLoading = computed(() => messageStore.isLoading)
const isLoadingMore = computed(() => messageStore.isLoadingMore)
const hasMoreMessages = computed(() => messageStore.hasMoreMessages(props.conversationId))

// Group messages by date and sender
const messageGroups = computed(() => {
    const groups = []
    let currentGroup = null
    let lastMessageDate = null

    messages.value.forEach((message, index) => {
        const messageDate = new Date(message.createdAt)
        const showDateSeparator = !lastMessageDate || !isSameDay(messageDate, lastMessageDate)

        // Check if we need to start a new group
        const shouldStartNewGroup = !currentGroup ||
            showDateSeparator ||
            message.senderId !== currentGroup.senderId ||
            (messageDate - new Date(currentGroup.lastMessageTime)) > 5 * 60 * 1000 // 5 minutes

        if (shouldStartNewGroup) {
            currentGroup = {
                senderId: message.senderId,
                senderName: message.senderName,
                senderAvatar: message.senderAvatar,
                messages: [],
                date: messageDate,
                showDateSeparator,
                lastMessageTime: message.createdAt
            }
            groups.push(currentGroup)
        }

        currentGroup.messages.push(message)
        currentGroup.lastMessageTime = message.createdAt
        lastMessageDate = messageDate
    })

    return groups
})

// Watch for new messages and auto-scroll
watch(messages, (newMessages, oldMessages) => {
    if (newMessages.length > oldMessages.length && autoScrollEnabled.value) {
        nextTick(() => {
            scrollToBottom(false)
        })
    }
}, { deep: true })

// Watch for conversation change
watch(() => props.conversationId, async (newConversationId) => {
    if (newConversationId) {
        await loadMessages(true)
        nextTick(() => {
            scrollToBottom(false)
        })
    }
})

// Watch for search query
watch(() => props.searchQuery, async (newQuery) => {
    if (newQuery.trim()) {
        await searchMessages(newQuery)
    } else {
        clearSearch()
    }
})

// Methods
const loadMessages = async (reset = false) => {
    if (!props.conversationId) return

    await messageStore.fetchMessages(props.conversationId, 0, reset)
}

const loadMoreMessages = async () => {
    if (!hasMoreMessages.value || isLoadingMore.value) return

    const currentScrollHeight = messagesContainer.value?.scrollHeight || 0

    await messageStore.fetchMessages(
        props.conversationId,
        Math.floor(messages.value.length / 50)
    )

    // Maintain scroll position after loading more messages
    nextTick(() => {
        if (messagesContainer.value) {
            const newScrollHeight = messagesContainer.value.scrollHeight
            messagesContainer.value.scrollTop = newScrollHeight - currentScrollHeight
        }
    })

    emit('load-more')
}

const scrollToBottom = (smooth = true) => {
    if (!messagesContainer.value) return

    const scrollOptions = {
        top: messagesContainer.value.scrollHeight,
        behavior: smooth ? 'smooth' : 'auto'
    }

    messagesContainer.value.scrollTo(scrollOptions)
    showScrollToBottom.value = false
    autoScrollEnabled.value = true
    unreadCount.value = 0

    emit('scroll-to-bottom')
}

const scrollToMessage = (messageId) => {
    const messageElement = document.querySelector(`[data-message-id="${messageId}"]`)
    if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })

        // Highlight the message briefly
        messageElement.classList.add('highlighted')
        setTimeout(() => {
            messageElement.classList.remove('highlighted')
        }, 2000)
    }
}

const handleScroll = () => {
    if (!messagesContainer.value) return

    const { scrollTop, scrollHeight, clientHeight } = messagesContainer.value
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100

    // Show/hide scroll to bottom button
    showScrollToBottom.value = !isNearBottom && messages.value.length > 0

    // Enable/disable auto-scroll
    autoScrollEnabled.value = isNearBottom

    // Load more messages when scrolling to top
    if (scrollTop === 0 && hasMoreMessages.value && !isLoadingMore.value) {
        loadMoreMessages()
    }

    lastScrollTop.value = scrollTop
}

// Message actions
const handleReply = (message) => {
    messageStore.setReplyingToMessage(message)
    emit('message-reply', message)
}

const handleEdit = (message) => {
    messageStore.setEditingMessage(message)
    emit('message-edit', message)
}

const handleDelete = async (message) => {
    await messageStore.deleteMessage(message.id)
    emit('message-delete', message)
}

const handleReact = async (message, emoji) => {
    await messageStore.reactToMessage(message.id, emoji)
    emit('message-react', message, emoji)
}

const handleForward = (message) => {
    emit('message-forward', message)
}

const handleRetry = async (tempMessage) => {
    await messageStore.retryFailedMessage(props.conversationId, tempMessage.id)
}

// Search methods
const searchMessages = async (query) => {
    const result = await messageStore.searchMessages(props.conversationId, query)
    if (result.success) {
        searchResults.value = result.data
    }
}

const clearSearch = () => {
    searchResults.value = []
}

// Utility methods
const shouldShowAvatar = (group, messageIndex) => {
    return messageIndex === group.messages.length - 1 && group.senderId !== currentUserId.value
}

const shouldShowSender = (group, messageIndex) => {
    return messageIndex === 0 && group.senderId !== currentUserId.value
}

const shouldShowTimestamp = (group, messageIndex) => {
    const message = group.messages[messageIndex]
    const nextMessage = group.messages[messageIndex + 1]

    if (!nextMessage) return true

    const timeDiff = new Date(nextMessage.createdAt) - new Date(message.createdAt)
    return timeDiff > 5 * 60 * 1000 // 5 minutes
}

const formatDate = (date) => {
    if (isToday(date)) return 'Hôm nay'
    if (isYesterday(date)) return 'Hôm qua'
    return format(date, 'dd/MM/yyyy', { locale: vi })
}

const formatTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm', { locale: vi })
}

const getTypingText = () => {
    const users = typingUsers.value
    if (users.length === 0) return ''

    if (users.length === 1) {
        return `${users[0].username} đang nhập...`
    } else if (users.length === 2) {
        return `${users[0].username} và ${users[1].username} đang nhập...`
    } else {
        return `${users.length} người đang nhập...`
    }
}

// Intersection Observer for auto-marking messages as read
const { observe, unobserve } = useIntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const messageId = entry.target.dataset.messageId
            if (messageId) {
                messageStore.markMessageAsRead(messageId)
            }
        }
    })
}, { threshold: 0.5 })

// Lifecycle
onMounted(async () => {
    await loadMessages(true)

    // Setup scroll listener
    if (messagesContainer.value) {
        messagesContainer.value.addEventListener('scroll', handleScroll, { passive: true })
    }

    // Scroll to bottom initially
    nextTick(() => {
        scrollToBottom(false)
    })

    // Observe messages for read status
    nextTick(() => {
        const messageElements = messagesContainer.value?.querySelectorAll('[data-message-id]')
        messageElements?.forEach(observe)
    })
})

onUnmounted(() => {
    if (messagesContainer.value) {
        messagesContainer.value.removeEventListener('scroll', handleScroll)
    }

    // Unobserve all elements
    const messageElements = messagesContainer.value?.querySelectorAll('[data-message-id]')
    messageElements?.forEach(unobserve)
})

// Expose methods for parent components
defineExpose({
    scrollToBottom,
    scrollToMessage,
    loadMessages,
    loadMoreMessages
})
</script>

<style lang="scss" scoped>
.message-list {
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    background: var(--bs-body-bg);
}

.load-more-top {
    padding: 16px;
    text-align: center;
    border-bottom: 1px solid var(--bs-border-color);
}

.loading-more {
    border-bottom: 1px solid var(--bs-border-color);
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    scroll-behavior: smooth;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}

.message-groups {
    display: flex;
    flex-direction: column;
    gap: 16px;
}

.message-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
}

.date-separator {
    text-align: center;
    margin: 16px 0;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--bs-border-color);
        z-index: 1;
    }

    .date-text {
        background: var(--bs-body-bg);
        padding: 0 16px;
        color: var(--bs-secondary);
        font-size: 0.875rem;
        position: relative;
        z-index: 2;
    }
}

.grouped-messages {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.temp-messages {
    margin-top: 8px;
}

.typing-indicators {
    padding: 8px 16px;
    border-top: 1px solid var(--bs-border-color);

    .typing-item {
        display: flex;
        align-items: flex-end;
        gap: 8px;
        margin-bottom: 4px;
    }

    .typing-avatars {
        display: flex;
        gap: 4px;

        .typing-avatar {
            width: 24px;
            height: 24px;
            border-radius: 50%;
            object-fit: cover;
        }
    }

    .typing-bubble {
        background: var(--bs-gray-200);
        border-radius: 18px;
        padding: 8px 12px;

        .typing-dots {
            display: flex;
            gap: 2px;

            span {
                width: 4px;
                height: 4px;
                border-radius: 50%;
                background: var(--bs-secondary);
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
    }

    .typing-text {
        font-size: 0.8rem;
        color: var(--bs-secondary);
        font-style: italic;
        margin-left: 32px;
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

.scroll-to-bottom-btn {
    position: absolute;
    bottom: 24px;
    right: 24px;
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
    transition: all 0.3s ease;
    z-index: 10;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    .unread-count {
        position: absolute;
        top: -8px;
        right: -8px;
        background: var(--bs-danger);
        color: white;
        border-radius: 12px;
        padding: 2px 6px;
        font-size: 0.7rem;
        font-weight: 500;
        min-width: 20px;
        text-align: center;
    }
}

.search-results-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
}

.search-results {
    background: var(--bs-body-bg);
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    max-width: 400px;
    width: 90%;
    max-height: 60vh;
    display: flex;
    flex-direction: column;

    .search-header {
        padding: 16px;
        border-bottom: 1px solid var(--bs-border-color);
        display: flex;
        align-items: center;
        justify-content: space-between;

        h6 {
            margin: 0;
        }
    }

    .search-items {
        flex: 1;
        overflow-y: auto;

        .search-item {
            padding: 12px 16px;
            border-bottom: 1px solid var(--bs-border-color);
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover {
                background: var(--bs-gray-50);
            }

            &:last-child {
                border-bottom: none;
            }
        }

        .search-content {
            margin-bottom: 4px;

            strong {
                margin-right: 8px;
            }

            .search-preview {
                color: var(--bs-secondary);
                font-size: 0.9rem;
            }
        }

        .search-time {
            font-size: 0.8rem;
            color: var(--bs-secondary);
        }
    }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

// Message highlighting
:deep(.message-bubble.highlighted) {
    animation: highlight 2s ease-out;
}

@keyframes highlight {
    0% {
        background-color: var(--bs-warning-bg-subtle);
        transform: scale(1.02);
    }

    100% {
        background-color: transparent;
        transform: scale(1);
    }
}

// Dark theme
[data-bs-theme="dark"] {
    .typing-bubble {
        background: var(--bs-gray-700);
    }

    .search-item:hover {
        background: var(--bs-gray-800);
    }
}

// Mobile responsive
@media (max-width: 768px) {
    .messages-container {
        padding: 8px;
    }

    .scroll-to-bottom-btn {
        bottom: 16px;
        right: 16px;
        width: 40px;
        height: 40px;
    }

    .search-results {
        width: 95%;
        max-height: 70vh;
    }
}
</style>