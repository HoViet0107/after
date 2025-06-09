import { ref, computed } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'

export function useTyping(conversationId) {
    const { emit, on, off } = useWebSocket()

    // State
    const typingUsers = ref(new Set())
    const isTyping = ref(false)
    const typingTimeout = ref(null)

    // Computed
    const typingUsersList = computed(() => Array.from(typingUsers.value))
    const hasTypingUsers = computed(() => typingUsers.value.size > 0)
    const typingMessage = computed(() => {
        const count = typingUsers.value.size
        if (count === 0) return ''
        if (count === 1) return 'đang nhập...'
        if (count === 2) return 'đang nhập...'
        return `${count} người đang nhập...`
    })

    // Actions
    const startTyping = (userId) => {
        if (!conversationId) return

        isTyping.value = true

        // Clear existing timeout
        if (typingTimeout.value) {
            clearTimeout(typingTimeout.value)
        }

        // Emit typing start
        emit('typing-start', {
            conversationId,
            userId
        })

        // Auto stop typing after 3 seconds
        typingTimeout.value = setTimeout(() => {
            stopTyping(userId)
        }, 3000)
    }

    const stopTyping = (userId) => {
        if (!conversationId) return

        isTyping.value = false

        // Clear timeout
        if (typingTimeout.value) {
            clearTimeout(typingTimeout.value)
            typingTimeout.value = null
        }

        // Emit typing stop
        emit('typing-stop', {
            conversationId,
            userId
        })
    }

    const addTypingUser = (userId) => {
        typingUsers.value.add(userId)
    }

    const removeTypingUser = (userId) => {
        typingUsers.value.delete(userId)
    }

    const clearAllTyping = () => {
        typingUsers.value.clear()
    }

    const handleTypingStart = (data) => {
        if (data.conversationId === conversationId) {
            addTypingUser(data.userId)
        }
    }

    const handleTypingStop = (data) => {
        if (data.conversationId === conversationId) {
            removeTypingUser(data.userId)
        }
    }

    // Setup WebSocket listeners
    const setupWebSocketListeners = () => {
        on('typing-start', handleTypingStart)
        on('typing-stop', handleTypingStop)
    }

    const cleanupWebSocketListeners = () => {
        off('typing-start', handleTypingStart)
        off('typing-stop', handleTypingStop)

        // Clear any pending timeouts
        if (typingTimeout.value) {
            clearTimeout(typingTimeout.value)
        }
    }

    return {
        // State
        typingUsers,
        isTyping,

        // Computed
        typingUsersList,
        hasTypingUsers,
        typingMessage,

        // Actions
        startTyping,
        stopTyping,
        addTypingUser,
        removeTypingUser,
        clearAllTyping,
        setupWebSocketListeners,
        cleanupWebSocketListeners
    }
}