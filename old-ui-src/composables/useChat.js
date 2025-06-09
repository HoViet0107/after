import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore } from '@/stores/message'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuth } from '@/composables/useAuth'
import { usePresence } from '@/composables/usePresence'
import { useTyping } from '@/composables/useTyping'
import { useToast } from 'vue-toastification'

export function useChat(conversationId) {
    // Dependencies
    const conversationStore = useConversationStore()
    const messageStore = useMessageStore()
    const { isConnected, on, off, joinConversation, leaveConversation, sendMessage } = useWebSocket()
    const { currentUser } = useAuth()
    const { updateUserPresence } = usePresence()
    const { startTyping, stopTyping } = useTyping(conversationId)
    const toast = useToast()

    // State
    const isLoading = ref(false)
    const isConnecting = ref(false)
    const connectionError = ref(null)
    const lastActivity = ref(Date.now())

    // Computed
    const conversation = computed(() =>
        conversationStore.getConversationById(conversationId.value)
    )

    const messages = computed(() =>
        messageStore.getAllMessages(conversationId.value)
    )

    const participants = computed(() =>
        conversation.value?.participants || []
    )

    const otherParticipants = computed(() =>
        participants.value.filter(p => p.id !== currentUser.value?.id)
    )

    const isGroupChat = computed(() =>
        conversation.value?.isGroupChat || false
    )

    const conversationTitle = computed(() => {
        if (!conversation.value) return ''

        if (conversation.value.title) {
            return conversation.value.title
        }

        if (isGroupChat.value) {
            return `Nhóm ${participants.value.length} thành viên`
        }

        const otherParticipant = otherParticipants.value[0]
        return otherParticipant ?
            `${otherParticipant.firstName} ${otherParticipant.lastName}` :
            'Cuộc trò chuyện'
    })

    const canSendMessages = computed(() =>
        conversation.value &&
        !conversation.value.isArchived &&
        isConnected.value &&
        currentUser.value
    )

    const unreadCount = computed(() =>
        conversation.value?.unreadCount || 0
    )

    const typingUsers = computed(() =>
        messageStore.getTypingUsersForConversation(conversationId.value)
    )

    // WebSocket event handlers
    const handleMessageReceived = (message) => {
        if (message.conversationId === conversationId.value) {
            messageStore.addMessage(conversationId.value, message)

            // Mark as read if conversation is active
            if (document.hasFocus()) {
                markMessageAsRead(message.id)
            }

            // Update conversation
            conversationStore.updateLastMessage(conversationId.value, message)

            // Show notification if not focused
            if (!document.hasFocus() && message.senderId !== currentUser.value?.id) {
                showMessageNotification(message)
            }
        }
    }

    const handleMessageEdited = (message) => {
        if (message.conversationId === conversationId.value) {
            messageStore.updateMessageInState(message)
        }
    }

    const handleMessageDeleted = (messageId) => {
        messageStore.deleteMessage(messageId)
    }

    const handleUserTyping = (data) => {
        if (data.conversationId === conversationId.value) {
            messageStore.setTypingStatus(
                data.conversationId,
                data.userId,
                data.isTyping,
                data.userInfo
            )
        }
    }

    const handleConversationUpdated = (updatedConversation) => {
        if (updatedConversation.id === conversationId.value) {
            conversationStore.updateConversationInState(
                conversationId.value,
                updatedConversation
            )
        }
    }

    const handleParticipantAdded = (data) => {
        if (data.conversationId === conversationId.value) {
            // Refresh conversation to get updated participants
            conversationStore.fetchConversationById(conversationId.value)
            toast.success(`${data.user.username} đã được thêm vào cuộc trò chuyện`)
        }
    }

    const handleParticipantRemoved = (data) => {
        if (data.conversationId === conversationId.value) {
            // Refresh conversation to get updated participants
            conversationStore.fetchConversationById(conversationId.value)
            toast.info(`${data.user.username} đã rời khỏi cuộc trò chuyện`)
        }
    }

    // Actions
    const initializeChat = async () => {
        if (!conversationId.value) return

        isLoading.value = true
        connectionError.value = null

        try {
            // Load conversation data
            await conversationStore.selectConversation(conversationId.value)

            // Load messages
            await messageStore.fetchMessages(conversationId.value, 0, true)

            // Join conversation room via WebSocket
            if (isConnected.value) {
                joinConversation(conversationId.value)
            }

            // Mark conversation as read
            await markConversationAsRead()

            // Update user presence
            updateUserPresence('active')

        } catch (error) {
            console.error('Failed to initialize chat:', error)
            connectionError.value = error
            toast.error('Không thể tải cuộc trò chuyện')
        } finally {
            isLoading.value = false
        }
    }

    const sendChatMessage = async (messageData) => {
        if (!canSendMessages.value) {
            toast.error('Không thể gửi tin nhắn lúc này')
            return { success: false }
        }

        try {
            // Send via message store (includes optimistic UI)
            const result = await messageStore.sendMessage(conversationId.value, messageData)

            if (result.success) {
                // Update activity timestamp
                updateActivity()

                // Stop typing indicator
                stopTyping()
            }

            return result
        } catch (error) {
            console.error('Failed to send message:', error)
            toast.error('Không thể gửi tin nhắn')
            return { success: false, error }
        }
    }

    const markMessageAsRead = async (messageId) => {
        try {
            await messageStore.markMessageAsRead(messageId)
        } catch (error) {
            console.error('Failed to mark message as read:', error)
        }
    }

    const markConversationAsRead = async () => {
        try {
            await conversationStore.markConversationAsRead(conversationId.value)
        } catch (error) {
            console.error('Failed to mark conversation as read:', error)
        }
    }

    const replyToMessage = (message) => {
        messageStore.setReplyingToMessage(message)
    }

    const editMessage = async (messageId, newContent) => {
        try {
            const result = await messageStore.editMessage(messageId, newContent)
            if (result.success) {
                toast.success('Đã chỉnh sửa tin nhắn')
            }
            return result
        } catch (error) {
            console.error('Failed to edit message:', error)
            toast.error('Không thể chỉnh sửa tin nhắn')
            return { success: false, error }
        }
    }

    const deleteMessage = async (messageId) => {
        try {
            const result = await messageStore.deleteMessage(messageId)
            if (result.success) {
                toast.success('Đã xóa tin nhắn')
            }
            return result
        } catch (error) {
            console.error('Failed to delete message:', error)
            toast.error('Không thể xóa tin nhắn')
            return { success: false, error }
        }
    }

    const reactToMessage = async (messageId, emoji) => {
        try {
            const result = await messageStore.reactToMessage(messageId, emoji)
            return result
        } catch (error) {
            console.error('Failed to react to message:', error)
            toast.error('Không thể thêm reaction')
            return { success: false, error }
        }
    }

    const loadMoreMessages = async () => {
        try {
            const currentPage = Math.floor(messages.value.length / 50)
            const result = await messageStore.fetchMessages(
                conversationId.value,
                currentPage
            )
            return result
        } catch (error) {
            console.error('Failed to load more messages:', error)
            toast.error('Không thể tải thêm tin nhắn')
            return { success: false, error }
        }
    }

    const searchMessages = async (query) => {
        try {
            const result = await messageStore.searchMessages(conversationId.value, query)
            return result
        } catch (error) {
            console.error('Failed to search messages:', error)
            toast.error('Không thể tìm kiếm tin nhắn')
            return { success: false, error }
        }
    }

    const addParticipant = async (userId) => {
        try {
            const result = await conversationStore.addParticipant(conversationId.value, userId)
            if (result.success) {
                toast.success('Đã thêm thành viên vào cuộc trò chuyện')
            }
            return result
        } catch (error) {
            console.error('Failed to add participant:', error)
            toast.error('Không thể thêm thành viên')
            return { success: false, error }
        }
    }

    const removeParticipant = async (userId) => {
        try {
            const result = await conversationStore.removeParticipant(conversationId.value, userId)
            if (result.success) {
                toast.success('Đã xóa thành viên khỏi cuộc trò chuyện')
            }
            return result
        } catch (error) {
            console.error('Failed to remove participant:', error)
            toast.error('Không thể xóa thành viên')
            return { success: false, error }
        }
    }

    const leaveChat = async () => {
        try {
            const result = await conversationStore.leaveConversation(conversationId.value)
            if (result.success) {
                toast.success('Đã rời khỏi cuộc trò chuyện')
            }
            return result
        } catch (error) {
            console.error('Failed to leave conversation:', error)
            toast.error('Không thể rời khỏi cuộc trò chuyện')
            return { success: false, error }
        }
    }

    const muteConversation = async () => {
        try {
            const result = await conversationStore.muteConversation(conversationId.value)
            if (result.success) {
                toast.success('Đã tắt thông báo cuộc trò chuyện')
            }
            return result
        } catch (error) {
            console.error('Failed to mute conversation:', error)
            toast.error('Không thể tắt thông báo')
            return { success: false, error }
        }
    }

    const unmuteConversation = async () => {
        try {
            const result = await conversationStore.unmuteConversation(conversationId.value)
            if (result.success) {
                toast.success('Đã bật thông báo cuộc trò chuyện')
            }
            return result
        } catch (error) {
            console.error('Failed to unmute conversation:', error)
            toast.error('Không thể bật thông báo')
            return { success: false, error }
        }
    }

    // Utility functions
    const updateActivity = () => {
        lastActivity.value = Date.now()
        updateUserPresence('active')
    }

    const showMessageNotification = (message) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return
        }

        const notification = new Notification(
            message.senderName || 'Tin nhắn mới',
            {
                body: message.content || 'Bạn có tin nhắn mới',
                icon: message.senderAvatar || '/default-avatar.png',
                tag: `message-${message.id}`,
                requireInteraction: false
            }
        )

        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close()
        }, 5000)

        // Handle click
        notification.onclick = () => {
            window.focus()
            notification.close()
        }
    }

    const cleanup = () => {
        // Leave conversation room
        if (conversationId.value) {
            leaveConversation(conversationId.value)
        }

        // Stop typing indicator
        stopTyping()

        // Clear message store state for this conversation
        messageStore.clearConversationMessages(conversationId.value)

        // Remove event listeners
        off('message:received', handleMessageReceived)
        off('message:edited', handleMessageEdited)
        off('message:deleted', handleMessageDeleted)
        off('user:typing', handleUserTyping)
        off('conversation:updated', handleConversationUpdated)
        off('conversation:participant_added', handleParticipantAdded)
        off('conversation:participant_removed', handleParticipantRemoved)
    }

    // Watchers
    watch(conversationId, (newId, oldId) => {
        if (oldId) {
            cleanup()
        }

        if (newId) {
            initializeChat()
        }
    }, { immediate: true })

    watch(isConnected, (connected) => {
        if (connected && conversationId.value) {
            joinConversation(conversationId.value)
        }
    })

    // Setup WebSocket event listeners
    onMounted(() => {
        // Message events
        on('message:received', handleMessageReceived)
        on('message:edited', handleMessageEdited)
        on('message:deleted', handleMessageDeleted)

        // Typing events
        on('user:typing', handleUserTyping)

        // Conversation events
        on('conversation:updated', handleConversationUpdated)
        on('conversation:participant_added', handleParticipantAdded)
        on('conversation:participant_removed', handleParticipantRemoved)

        // Activity tracking
        const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart']
        activityEvents.forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true })
        })

        // Page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                stopTyping()
            } else if (conversationId.value) {
                markConversationAsRead()
            }
        })
    })

    onUnmounted(() => {
        cleanup()

        // Remove activity listeners
        const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart']
        activityEvents.forEach(event => {
            document.removeEventListener(event, updateActivity)
        })

        document.removeEventListener('visibilitychange', () => { })
    })

    return {
        // State
        conversation,
        messages,
        participants,
        otherParticipants,
        isLoading,
        isConnecting,
        connectionError,
        lastActivity,

        // Computed
        conversationTitle,
        isGroupChat,
        canSendMessages,
        unreadCount,
        typingUsers,

        // Actions
        initializeChat,
        sendChatMessage,
        markMessageAsRead,
        markConversationAsRead,
        replyToMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        loadMoreMessages,
        searchMessages,

        // Conversation management
        addParticipant,
        removeParticipant,
        leaveChat,
        muteConversation,
        unmuteConversation,

        // Typing
        startTyping,
        stopTyping,

        // Utilities
        updateActivity,
        cleanup
    }
}