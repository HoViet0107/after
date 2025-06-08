import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore } from '@/stores/message'
import { useNotificationStore } from '@/stores/notification'
import { useFeedStore } from '@/stores/feed'

export function useRealTime() {
    const { on, off, emit, isConnected } = useWebSocket()
    const authStore = useAuthStore()
    const conversationStore = useConversationStore()
    const messageStore = useMessageStore()
    const notificationStore = useNotificationStore()
    const feedStore = useFeedStore()

    // State
    const listeners = ref(new Map())
    const isSetup = ref(false)

    // Computed
    const isReady = computed(() => isConnected.value && isSetup.value)

    // Setup real-time event listeners
    const setupEventListeners = () => {
        if (isSetup.value) return

        // Message events
        on('message:new', handleNewMessage)
        on('message:edited', handleMessageEdited)
        on('message:deleted', handleMessageDeleted)
        on('message:reaction', handleMessageReaction)

        // Conversation events
        on('conversation:updated', handleConversationUpdated)
        on('conversation:participant_added', handleParticipantAdded)
        on('conversation:participant_removed', handleParticipantRemoved)

        // Typing events
        on('typing:start', handleTypingStart)
        on('typing:stop', handleTypingStop)

        // Notification events
        on('notification:new', handleNewNotification)
        on('notification:read', handleNotificationRead)

        // Post events
        on('post:new', handleNewPost)
        on('post:updated', handlePostUpdated)
        on('post:deleted', handlePostDeleted)
        on('post:liked', handlePostLiked)
        on('post:commented', handlePostCommented)

        // User events
        on('user:status_changed', handleUserStatusChanged)
        on('user:online', handleUserOnline)
        on('user:offline', handleUserOffline)

        isSetup.value = true
        console.log('✅ Real-time event listeners setup complete')
    }

    // Event handlers
    const handleNewMessage = (data) => {
        const { conversationId, message } = data
        messageStore.addMessage(conversationId, message)
        conversationStore.addMessage(conversationId, message)
    }

    const handleMessageEdited = (data) => {
        const { conversationId, messageId, content } = data
        // Update message in store
        const messages = messageStore.getConversationMessages(conversationId)
        const messageIndex = messages.findIndex(m => m.id === messageId)
        if (messageIndex !== -1) {
            messages[messageIndex].content = content
            messages[messageIndex].isEdited = true
        }
    }

    const handleMessageDeleted = (data) => {
        const { conversationId, messageId } = data
        // Remove message from store or mark as deleted
        const messages = messageStore.getConversationMessages(conversationId)
        const messageIndex = messages.findIndex(m => m.id === messageId)
        if (messageIndex !== -1) {
            messages[messageIndex].isDeleted = true
        }
    }

    const handleMessageReaction = (data) => {
        const { conversationId, messageId, reaction, userId } = data
        // Update message reactions
        console.log('Message reaction:', data)
    }

    const handleConversationUpdated = (data) => {
        const { conversation } = data
        conversationStore.updateConversation(conversation.id, conversation)
    }

    const handleParticipantAdded = (data) => {
        const { conversationId, participant } = data
        // Update conversation participants
        console.log('Participant added:', data)
    }

    const handleParticipantRemoved = (data) => {
        const { conversationId, participantId } = data
        // Remove participant from conversation
        console.log('Participant removed:', data)
    }

    const handleTypingStart = (data) => {
        const { conversationId, userId } = data
        messageStore.setTyping(conversationId, userId, true)
    }

    const handleTypingStop = (data) => {
        const { conversationId, userId } = data
        messageStore.setTyping(conversationId, userId, false)
    }

    const handleNewNotification = (data) => {
        const { notification } = data
        notificationStore.addNotification(notification)
    }

    const handleNotificationRead = (data) => {
        const { notificationId } = data
        // Mark notification as read
        console.log('Notification read:', data)
    }

    const handleNewPost = (data) => {
        const { post } = data
        // Add new post to feed if relevant
        console.log('New post:', data)
    }

    const handlePostUpdated = (data) => {
        const { postId, updates } = data
        feedStore.updatePostInFeed(postId, updates)
    }

    const handlePostDeleted = (data) => {
        const { postId } = data
        feedStore.removePostFromFeed(postId)
    }

    const handlePostLiked = (data) => {
        const { postId, userId, liked } = data
        feedStore.updatePostInFeed(postId, {
            likesCount: liked ?
                (feedStore.getPostById(postId)?.likesCount || 0) + 1 :
                Math.max((feedStore.getPostById(postId)?.likesCount || 0) - 1, 0),
            isLiked: userId === authStore.userId ? liked : undefined
        })
    }

    const handlePostCommented = (data) => {
        const { postId, comment } = data
        feedStore.updatePostInFeed(postId, {
            commentsCount: (feedStore.getPostById(postId)?.commentsCount || 0) + 1
        })
    }

    const handleUserStatusChanged = (data) => {
        const { userId, status } = data
        // Update user status in relevant stores
        console.log('User status changed:', data)
    }

    const handleUserOnline = (data) => {
        const { userId } = data
        // Update user online status
        console.log('User online:', data)
    }

    const handleUserOffline = (data) => {
        const { userId } = data
        // Update user offline status
        console.log('User offline:', data)
    }

    // Custom event listener
    const addEventListener = (event, handler) => {
        on(event, handler)

        // Store for cleanup
        if (!listeners.value.has(event)) {
            listeners.value.set(event, [])
        }
        listeners.value.get(event).push(handler)
    }

    // Remove custom event listener
    const removeEventListener = (event, handler) => {
        off(event, handler)

        const eventListeners = listeners.value.get(event)
        if (eventListeners) {
            const index = eventListeners.indexOf(handler)
            if (index !== -1) {
                eventListeners.splice(index, 1)
            }
        }
    }

    // Emit custom event
    const emitEvent = (event, data) => {
        emit(event, data)
    }

    // Cleanup all listeners
    const cleanup = () => {
        // Remove all custom listeners
        for (const [event, handlers] of listeners.value) {
            handlers.forEach(handler => off(event, handler))
        }
        listeners.value.clear()

        // Remove built-in listeners
        off('message:new', handleNewMessage)
        off('message:edited', handleMessageEdited)
        off('message:deleted', handleMessageDeleted)
        off('message:reaction', handleMessageReaction)
        off('conversation:updated', handleConversationUpdated)
        off('conversation:participant_added', handleParticipantAdded)
        off('conversation:participant_removed', handleParticipantRemoved)
        off('typing:start', handleTypingStart)
        off('typing:stop', handleTypingStop)
        off('notification:new', handleNewNotification)
        off('notification:read', handleNotificationRead)
        off('post:new', handleNewPost)
        off('post:updated', handlePostUpdated)
        off('post:deleted', handlePostDeleted)
        off('post:liked', handlePostLiked)
        off('post:commented', handlePostCommented)
        off('user:status_changed', handleUserStatusChanged)
        off('user:online', handleUserOnline)
        off('user:offline', handleUserOffline)

        isSetup.value = false
    }

    onMounted(() => {
        if (isConnected.value) {
            setupEventListeners()
        }
    })

    onUnmounted(() => {
        cleanup()
    })

    return {
        // State
        isReady,
        isSetup: computed(() => isSetup.value),

        // Actions
        setupEventListeners,
        addEventListener,
        removeEventListener,
        emitEvent,
        cleanup
    }
}