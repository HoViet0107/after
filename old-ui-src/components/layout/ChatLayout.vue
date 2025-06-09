<template>
    <div class="chat-layout">
        <!-- Mobile header -->
        <header v-if="isMobile" class="chat-header">
            <div class="header-content">
                <button class="btn btn-ghost back-btn" @click="handleBack">
                    <i class="fas fa-arrow-left"></i>
                </button>

                <div v-if="activeConversation" class="conversation-info">
                    <UserAvatar v-if="!activeConversation.isGroupChat" :src="otherParticipant?.avatar"
                        :name="otherParticipant?.name" :show-online-status="true"
                        :is-online="otherParticipant?.isOnline" size="sm" clickable @click="viewProfile" />

                    <div v-else class="group-avatar">
                        <i class="fas fa-users"></i>
                    </div>

                    <div class="conversation-details">
                        <h6 class="conversation-title">{{ conversationTitle }}</h6>
                        <div class="conversation-status">
                            <span v-if="isTyping">{{ typingText }}</span>
                            <span v-else-if="otherParticipant">
                                {{ otherParticipant.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến' }}
                            </span>
                            <span v-else-if="activeConversation.isGroupChat">
                                {{ activeConversation.participants.length }} thành viên
                            </span>
                        </div>
                    </div>
                </div>

                <div class="header-actions">
                    <button v-if="activeConversation" class="btn btn-ghost" @click="openConversationInfo">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        </header>

        <!-- Main chat content -->
        <div class="chat-content">
            <!-- Conversations list -->
            <div :class="['conversations-panel', { hidden: isMobile && activeConversationId }]">
                <ConversationList :active-conversation-id="activeConversationId"
                    @conversation-selected="selectConversation" @conversation-created="handleConversationCreated" />
            </div>

            <!-- Messages area -->
            <div :class="['messages-panel', { hidden: isMobile && !activeConversationId }]">
                <div v-if="!activeConversationId" class="no-conversation">
                    <div class="no-conversation-content">
                        <i class="fas fa-comment-alt"></i>
                        <h5>Chọn một cuộc trò chuyện</h5>
                        <p>Chọn một cuộc trò chuyện từ danh sách bên trái hoặc tạo cuộc trò chuyện mới để bắt đầu.</p>
                    </div>
                </div>

                <div v-else class="conversation-view">
                    <!-- Desktop conversation header -->
                    <div v-if="!isMobile" class="conversation-header">
                        <div class="conversation-info">
                            <UserAvatar v-if="!activeConversation.isGroupChat" :src="otherParticipant?.avatar"
                                :name="otherParticipant?.name" :show-online-status="true"
                                :is-online="otherParticipant?.isOnline" size="medium" clickable @click="viewProfile" />

                            <div v-else class="group-avatar">
                                <i class="fas fa-users"></i>
                            </div>

                            <div class="conversation-details">
                                <h5 class="conversation-title">{{ conversationTitle }}</h5>
                                <div class="conversation-status">
                                    <span v-if="isTyping">{{ typingText }}</span>
                                    <span v-else-if="otherParticipant">
                                        {{ otherParticipant.isOnline ? 'Đang hoạt động' : 'Ngoại tuyến' }}
                                    </span>
                                    <span v-else-if="activeConversation.isGroupChat">
                                        {{ activeConversation.participants.length }} thành viên
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div class="conversation-actions">
                            <button class="btn btn-ghost" @click="startVoiceCall" title="Gọi thoại">
                                <i class="fas fa-phone"></i>
                            </button>
                            <button class="btn btn-ghost" @click="startVideoCall" title="Gọi video">
                                <i class="fas fa-video"></i>
                            </button>
                            <button class="btn btn-ghost" @click="openConversationInfo" title="Thông tin">
                                <i class="fas fa-info-circle"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Messages -->
                    <div class="messages-container">
                        <MessageList ref="messageList" :messages="messages" :typing-users="typingUsers"
                            :is-loading="isLoadingMessages" @reply="handleReply" @edit="handleEdit"
                            @delete="handleDelete" @react="handleReact" @forward="handleForward"
                            @load-more="loadMoreMessages" />
                    </div>

                    <!-- Message input -->
                    <div class="message-input-container">
                        <MessageInput :conversation-id="activeConversationId" :reply-to-message="replyToMessage"
                            @send="handleSendMessage" @typing="handleTyping" @stop-typing="handleStopTyping"
                            @cancel-reply="cancelReply" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <ConversationInfoModal v-if="showConversationInfo" :conversation="activeConversation"
            @close="showConversationInfo = false" @leave="handleLeaveConversation" @delete="handleDeleteConversation" />
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore } from '@/stores/message'
import { useChat } from '@/composables/useChat'
import { useBreakpoints } from '@/composables/useBreakpoints'
import ConversationList from '@/components/conversation/ConversationList.vue'
import MessageList from '@/components/message/MessageList.vue'
import MessageInput from '@/components/message/MessageInput.vue'
import UserAvatar from '@/components/user/UserAvatar.vue'
import ConversationInfoModal from '@/components/conversation/ConversationInfoModal.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const messageStore = useMessageStore()
const { isMobile } = useBreakpoints()

// Chat composable
const {
    activeConversation,
    messages,
    typingUsers,
    setActiveConversation,
    sendMessage,
    startTyping,
    stopTyping
} = useChat()

// Refs
const messageList = ref(null)

// State
const activeConversationId = ref(route.params.conversationId || null)
const isLoadingMessages = ref(false)
const showConversationInfo = ref(false)
const replyToMessage = ref(null)

// Computed
const currentUser = computed(() => authStore.user)

const otherParticipant = computed(() => {
    if (!activeConversation.value || activeConversation.value.isGroupChat) return null
    return activeConversation.value.participants?.find(p => p.id !== currentUser.value?.id)
})

const conversationTitle = computed(() => {
    if (!activeConversation.value) return ''

    if (activeConversation.value.title) {
        return activeConversation.value.title
    }

    if (activeConversation.value.isGroupChat) {
        return 'Nhóm chat'
    }

    return otherParticipant.value?.name || 'Cuộc trò chuyện'
})

const isTyping = computed(() => typingUsers.value.length > 0)

const typingText = computed(() => {
    if (typingUsers.value.length === 0) return ''

    if (typingUsers.value.length === 1) {
        return `${typingUsers.value[0].name} đang nhập...`
    }

    return `${typingUsers.value.length} người đang nhập...`
})

// Actions
const selectConversation = async (conversation) => {
    activeConversationId.value = conversation.id

    // Update URL
    if (route.params.conversationId !== conversation.id) {
        router.replace(`/app/chat/${conversation.id}`)
    }

    // Set active conversation
    await setActiveConversation(conversation.id)
}

const handleConversationCreated = (conversation) => {
    selectConversation(conversation)
}

const handleSendMessage = async (messageData) => {
    try {
        await sendMessage(messageData.content, messageData.type, messageData.attachments)

        // Scroll to bottom
        setTimeout(() => {
            messageList.value?.scrollToBottom()
        }, 100)
    } catch (error) {
        console.error('Failed to send message:', error)
    }
}

const handleReply = (message) => {
    replyToMessage.value = message
}

const cancelReply = () => {
    replyToMessage.value = null
}

const handleEdit = (message) => {
    // Handle message edit
    console.log('Edit message:', message)
}

const handleDelete = (message) => {
    // Handle message delete
    console.log('Delete message:', message)
}

const handleReact = (message, reaction) => {
    // Handle message reaction
    console.log('React to message:', message, reaction)
}

const handleForward = (message) => {
    // Handle message forward
    console.log('Forward message:', message)
}

const handleTyping = () => {
    startTyping()
}

const handleStopTyping = () => {
    stopTyping()
}

const loadMoreMessages = () => {
    // Load more messages
    console.log('Load more messages')
}

const handleBack = () => {
    if (isMobile.value) {
        activeConversationId.value = null
        router.replace('/app/chat')
    }
}

const viewProfile = () => {
    if (otherParticipant.value) {
        router.push(`/app/profile/${otherParticipant.value.id}`)
    }
}

const openConversationInfo = () => {
    showConversationInfo.value = true
}

const startVoiceCall = () => {
    // Start voice call
    console.log('Start voice call')
}

const startVideoCall = () => {
    // Start video call
    console.log('Start video call')
}

const handleLeaveConversation = () => {
    // Handle leave conversation
    showConversationInfo.value = false
    activeConversationId.value = null
    router.replace('/app/chat')
}

const handleDeleteConversation = () => {
    // Handle delete conversation
    showConversationInfo.value = false
    activeConversationId.value = null
    router.replace('/app/chat')
}

// Watchers
watch(() => route.params.conversationId, (newId) => {
    if (newId && newId !== activeConversationId.value) {
        activeConversationId.value = newId
        setActiveConversation(newId)
    }
})

// Lifecycle
onMounted(() => {
    if (activeConversationId.value) {
        setActiveConversation(activeConversationId.value)
    }
})
</script>

<style lang="scss" scoped>
.chat-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bs-light);

    .chat-header {
        background: white;
        border-bottom: 1px solid var(--bs-border-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

        .header-content {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;

            .back-btn {
                flex-shrink: 0;
            }

            .conversation-info {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                flex: 1;
                min-width: 0;

                .group-avatar {
                    width: 40px;
                    height: 40px;
                    background: var(--bs-secondary);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .conversation-details {
                    flex: 1;
                    min-width: 0;

                    .conversation-title {
                        margin: 0;
                        font-weight: 600;
                        font-size: 1rem;
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    }

                    .conversation-status {
                        font-size: 0.875rem;
                        color: var(--bs-secondary);
                    }
                }
            }

            .header-actions {
                display: flex;
                gap: 0.25rem;
            }
        }
    }

    .chat-content {
        flex: 1;
        display: flex;
        overflow: hidden;

        .conversations-panel {
            width: 350px;
            background: white;
            border-right: 1px solid var(--bs-border-color);

            &.hidden {
                display: none;
            }

            @media (max-width: 768px) {
                width: 100%;
            }
        }

        .messages-panel {
            flex: 1;
            display: flex;
            flex-direction: column;
            background: white;

            &.hidden {
                display: none;
            }

            .no-conversation {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;

                .no-conversation-content {
                    text-align: center;
                    max-width: 400px;

                    i {
                        font-size: 4rem;
                        color: var(--bs-secondary);
                        margin-bottom: 1rem;
                    }

                    h5 {
                        margin-bottom: 0.5rem;
                    }

                    p {
                        color: var(--bs-secondary);
                    }
                }
            }

            .conversation-view {
                height: 100%;
                display: flex;
                flex-direction: column;

                .conversation-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1rem;
                    border-bottom: 1px solid var(--bs-border-color);
                    background: white;

                    .conversation-info {
                        display: flex;
                        align-items: center;
                        gap: 1rem;

                        .group-avatar {
                            width: 50px;
                            height: 50px;
                            background: var(--bs-secondary);
                            color: white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            font-size: 1.25rem;
                        }

                        .conversation-details {
                            .conversation-title {
                                margin: 0 0 0.25rem 0;
                                font-weight: 600;
                            }

                            .conversation-status {
                                font-size: 0.875rem;
                                color: var(--bs-secondary);
                            }
                        }
                    }

                    .conversation-actions {
                        display: flex;
                        gap: 0.5rem;
                    }
                }

                .messages-container {
                    flex: 1;
                    overflow: hidden;
                }

                .message-input-container {
                    flex-shrink: 0;
                }
            }
        }
    }
}

.btn-ghost {
    background: none;
    border: none;
    color: var(--bs-secondary);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
        background: var(--bs-light);
        color: var(--bs-body-color);
    }
}

// Mobile-specific styles
@media (max-width: 768px) {
    .chat-layout {
        .chat-content {

            .conversations-panel,
            .messages-panel {
                width: 100%;
            }
        }
    }
}
</style>