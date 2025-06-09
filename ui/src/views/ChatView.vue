<template>
    <div class="chat-view">
        <div class="chat-container">
            <!-- Sidebar - Conversations List -->
            <div class="chat-sidebar" :class="{ 'mobile-hidden': showConversation && isMobile }">
                <div class="sidebar-header">
                    <h5 class="mb-0">Tin nhắn</h5>
                    <button class="btn btn-sm btn-primary" @click="showNewChatModal = true">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>

                <div class="search-container">
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="fas fa-search"></i>
                        </span>
                        <input v-model="searchQuery" type="text" class="form-control" placeholder="Tìm kiếm..."
                            @input="handleSearch">
                    </div>
                </div>

                <div class="conversations-list">
                    <div v-if="loading.conversations" class="loading-skeleton">
                        <div v-for="i in 5" :key="i" class="skeleton-item"></div>
                    </div>

                    <div v-else-if="filteredConversations.length === 0" class="empty-state">
                        <i class="fas fa-comments fa-2x text-muted"></i>
                        <p class="mt-2 text-muted">Chưa có cuộc trò chuyện nào</p>
                    </div>

                    <div v-else>
                        <div v-for="conversation in filteredConversations" :key="conversation.id"
                            class="conversation-item" :class="{ active: conversation.id === activeConversationId }"
                            @click="selectConversation(conversation.id)">
                            <UserAvatar :user="getOtherParticipant(conversation)" :size="48" />
                            <div class="conversation-info">
                                <div class="conversation-header">
                                    <h6 class="conversation-name">{{ getConversationName(conversation) }}</h6>
                                    <span class="conversation-time">{{ formatTime(conversation.lastMessage?.createdAt)
                                        }}</span>
                                </div>
                                <div class="conversation-preview">
                                    <p class="last-message">{{ conversation.lastMessage?.content || 'Chưa có tin nhắn'
                                        }}</p>
                                    <span v-if="conversation.unreadCount" class="badge bg-primary">
                                        {{ conversation.unreadCount }}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Chat Area -->
            <div class="chat-main" :class="{ 'full-width': !activeConversationId }">
                <div v-if="!activeConversationId" class="no-conversation">
                    <i class="fas fa-comments fa-4x text-muted"></i>
                    <h4 class="mt-3">Chọn cuộc trò chuyện</h4>
                    <p class="text-muted">Chọn một cuộc trò chuyện để bắt đầu nhắn tin</p>
                </div>

                <div v-else class="conversation-container">
                    <!-- Conversation Header -->
                    <div class="conversation-header">
                        <button v-if="isMobile" class="btn btn-sm btn-light me-2" @click="showConversation = false">
                            <i class="fas fa-arrow-left"></i>
                        </button>

                        <UserAvatar :user="getOtherParticipant(activeConversation)" :size="40" />
                        <div class="header-info">
                            <h6 class="mb-0">{{ getConversationName(activeConversation) }}</h6>
                            <small class="text-muted">{{ getPresenceStatus() }}</small>
                        </div>

                        <div class="header-actions ms-auto">
                            <button class="btn btn-sm btn-light" @click="toggleConversationInfo">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Messages Area -->
                    <div ref="messagesContainer" class="messages-container">
                        <div v-if="loading.messages" class="loading-skeleton">
                            <div v-for="i in 10" :key="i" class="skeleton-message"></div>
                        </div>

                        <div v-else class="messages-list">
                            <div v-for="message in messages" :key="message.id" class="message-wrapper"
                                :class="{ 'own-message': message.senderId === currentUser.id }">
                                <div class="message-bubble">
                                    <div class="message-content">{{ message.content }}</div>
                                    <div class="message-time">{{ formatTime(message.createdAt) }}</div>
                                </div>
                            </div>
                        </div>

                        <div v-if="typingUsers.length > 0" class="typing-indicator">
                            <span>{{ getTypingText() }}</span>
                        </div>
                    </div>

                    <!-- Message Input -->
                    <div class="message-input-container">
                        <div class="input-group">
                            <textarea v-model="messageText" class="form-control" placeholder="Nhập tin nhắn..." rows="1"
                                @keydown.enter.exact.prevent="sendMessage" @input="handleTyping"
                                @blur="stopTyping"></textarea>
                            <button class="btn btn-primary" :disabled="!messageText.trim() || loading.send"
                                @click="sendMessage">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <NewChatModal v-if="showNewChatModal" @close="showNewChatModal = false" @created="handleChatCreated" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useBreakpoints } from '@/composables/useBreakpoints'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAppStores } from '@/composables/useAppStores'
import { useLoadingStates } from '@/composables/useLoadingStates'
import { formatTime } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'
import NewChatModal from '@/components/conversation/NewChatModal.vue'

const route = useRoute()
const router = useRouter()
const { isMobile } = useBreakpoints()
const { on, off, emit } = useWebSocket()
const { authStore, conversationStore, messageStore, presenceStore } = useAppStores()
const { loading, setLoading } = useLoadingStates(['conversations', 'messages', 'send'])

// Refs
const messagesContainer = ref(null)

// State
const searchQuery = ref('')
const messageText = ref('')
const conversations = ref([])
const messages = ref([])
const activeConversationId = ref(route.params.conversationId || null)
const activeConversation = ref(null)
const typingUsers = ref([])
const showConversation = ref(!isMobile.value || !!activeConversationId.value)
const showNewChatModal = ref(false)
const showConversationInfo = ref(false)

// Computed
const currentUser = computed(() => authStore.user)

const filteredConversations = computed(() => {
    if (!searchQuery.value) return conversations.value
    return conversations.value.filter(conv =>
        getConversationName(conv).toLowerCase().includes(searchQuery.value.toLowerCase())
    )
})

// Methods
const loadConversations = async () => {
    setLoading('conversations', true)
    try {
        const response = await conversationStore.fetchConversations()
        conversations.value = response.data
    } catch (error) {
        console.error('Load conversations error:', error)
    } finally {
        setLoading('conversations', false)
    }
}

const loadMessages = async (conversationId) => {
    if (!conversationId) return

    setLoading('messages', true)
    try {
        const response = await messageStore.fetchMessages(conversationId)
        messages.value = response.data
        await nextTick()
        scrollToBottom()
    } catch (error) {
        console.error('Load messages error:', error)
    } finally {
        setLoading('messages', false)
    }
}

const selectConversation = async (conversationId) => {
    activeConversationId.value = conversationId
    activeConversation.value = conversations.value.find(c => c.id === conversationId)

    if (isMobile.value) {
        showConversation.value = true
    }

    router.push(`/app/chat/${conversationId}`)
    await loadMessages(conversationId)

    // Mark as read
    await conversationStore.markAsRead(conversationId)
}

const sendMessage = async () => {
    if (!messageText.value.trim() || !activeConversationId.value || loading.send) return

    setLoading('send', true)
    try {
        const newMessage = {
            conversationId: activeConversationId.value,
            content: messageText.value.trim(),
            senderId: currentUser.value.id
        }

        await messageStore.sendMessage(newMessage)
        messages.value.push(newMessage)
        messageText.value = ''

        await nextTick()
        scrollToBottom()

    } catch (error) {
        console.error('Send message error:', error)
    } finally {
        setLoading('send', false)
    }
}

const handleTyping = () => {
    if (activeConversationId.value) {
        emit('typing', { conversationId: activeConversationId.value })
    }
}

const stopTyping = () => {
    if (activeConversationId.value) {
        emit('stop-typing', { conversationId: activeConversationId.value })
    }
}

const handleSearch = () => {
    // Search is handled by computed property
}

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

const getOtherParticipant = (conversation) => {
    if (!conversation?.participants) return null
    return conversation.participants.find(p => p.id !== currentUser.value?.id)
}

const getConversationName = (conversation) => {
    if (!conversation) return ''
    if (conversation.name) return conversation.name

    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.name || 'Cuộc trò chuyện'
}

const getPresenceStatus = () => {
    if (!activeConversation.value) return ''

    const otherParticipant = getOtherParticipant(activeConversation.value)
    if (!otherParticipant) return ''

    const presence = presenceStore.getPresence(otherParticipant.id)
    return presence?.isOnline ? 'Đang hoạt động' : 'Offline'
}

const getTypingText = () => {
    if (typingUsers.value.length === 0) return ''
    if (typingUsers.value.length === 1) return `${typingUsers.value[0].name} đang nhập...`
    return 'Nhiều người đang nhập...'
}

const toggleConversationInfo = () => {
    showConversationInfo.value = !showConversationInfo.value
}

const handleChatCreated = (conversation) => {
    conversations.value.unshift(conversation)
    selectConversation(conversation.id)
}

// WebSocket handlers
const setupWebSocket = () => {
    on('message:received', (data) => {
        if (data.conversationId === activeConversationId.value) {
            messages.value.push(data.message)
            nextTick(() => scrollToBottom())
        }

        // Update conversation last message
        const conv = conversations.value.find(c => c.id === data.conversationId)
        if (conv) {
            conv.lastMessage = data.message
            conv.unreadCount = (conv.unreadCount || 0) + 1
        }
    })

    on('typing:start', (data) => {
        if (data.conversationId === activeConversationId.value) {
            const user = { id: data.userId, name: data.userName }
            if (!typingUsers.value.find(u => u.id === user.id)) {
                typingUsers.value.push(user)
            }
        }
    })

    on('typing:stop', (data) => {
        typingUsers.value = typingUsers.value.filter(u => u.id !== data.userId)
    })
}

// Watchers
watch(() => route.params.conversationId, (newId) => {
    if (newId && newId !== activeConversationId.value) {
        selectConversation(newId)
    }
})

// Lifecycle
onMounted(async () => {
    await loadConversations()
    setupWebSocket()

    if (activeConversationId.value) {
        await selectConversation(activeConversationId.value)
    }
})

onUnmounted(() => {
    off('message:received')
    off('typing:start')
    off('typing:stop')
})
</script>

<style lang="scss" scoped>
.chat-view {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.chat-container {
    display: flex;
    flex: 1;
    overflow: hidden;
}

.chat-sidebar {
    width: 350px;
    border-right: 1px solid var(--bs-border-color);
    display: flex;
    flex-direction: column;
    background: white;

    @media (max-width: 768px) {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        z-index: 10;

        &.mobile-hidden {
            display: none;
        }
    }
}

.sidebar-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.search-container {
    padding: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.conversations-list {
    flex: 1;
    overflow-y: auto;
}

.conversation-item {
    display: flex;
    padding: 1rem;
    cursor: pointer;
    border-bottom: 1px solid var(--bs-border-color-translucent);
    transition: background-color 0.2s ease;

    &:hover,
    &.active {
        background-color: var(--bs-light);
    }

    .conversation-info {
        margin-left: 0.75rem;
        flex: 1;
        min-width: 0;
    }

    .conversation-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.25rem;
    }

    .conversation-name {
        font-size: 0.9rem;
        font-weight: 600;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .conversation-time {
        font-size: 0.75rem;
        color: var(--bs-secondary);
    }

    .conversation-preview {
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .last-message {
        font-size: 0.8rem;
        color: var(--bs-secondary);
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
    }
}

.chat-main {
    flex: 1;
    display: flex;
    flex-direction: column;

    &.full-width {
        @media (max-width: 768px) {
            width: 100%;
        }
    }
}

.no-conversation {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    text-align: center;
    color: var(--bs-secondary);
}

.conversation-container {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.conversation-header {
    display: flex;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
    background: white;

    .header-info {
        margin-left: 0.75rem;
        flex: 1;
    }
}

.messages-container {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    background: var(--bs-light);
}

.messages-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.message-wrapper {
    display: flex;

    &.own-message {
        justify-content: flex-end;

        .message-bubble {
            background: var(--bs-primary);
            color: white;
        }
    }
}

.message-bubble {
    max-width: 70%;
    padding: 0.75rem 1rem;
    border-radius: 1rem;
    background: white;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);

    .message-content {
        margin-bottom: 0.25rem;
    }

    .message-time {
        font-size: 0.7rem;
        opacity: 0.7;
    }
}

.typing-indicator {
    padding: 0.5rem 1rem;
    font-style: italic;
    color: var(--bs-secondary);
    font-size: 0.85rem;
}

.message-input-container {
    padding: 1rem;
    border-top: 1px solid var(--bs-border-color);
    background: white;

    textarea {
        resize: none;
        min-height: 2.5rem;
        max-height: 6rem;
    }
}

.loading-skeleton,
.empty-state {
    padding: 2rem;
    text-align: center;
}

.skeleton-item,
.skeleton-message {
    height: 4rem;
    background: var(--bs-light);
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    animation: pulse 1.5s ease-in-out infinite alternate;
}

@keyframes pulse {
    0% {
        opacity: 1;
    }

    100% {
        opacity: 0.5;
    }
}
</style>