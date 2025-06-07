import { ref, computed, onMounted, onUnmounted } from 'vue'
import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Global WebSocket state
const socket = ref(null)
const isConnected = ref(false)
const isReconnecting = ref(false)
const connectionError = ref(null)
const events = ref(new Map())
const reconnectAttempts = ref(0)
const maxReconnectAttempts = 5

export function useWebSocket() {
    const authStore = useAuthStore()
    const toast = useToast()

    // Computed
    const connectionStatus = computed(() => {
        if (isConnected.value) return 'connected'
        if (isReconnecting.value) return 'reconnecting'
        if (connectionError.value) return 'error'
        return 'disconnected'
    })

    // Socket configuration
    const socketConfig = {
        autoConnect: false,
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        maxReconnectionAttempts: maxReconnectAttempts,
        auth: {
            token: () => authStore.token
        }
    }

    // Initialize connection
    const connect = async () => {
        if (socket.value?.connected) {
            console.log('📡 WebSocket already connected')
            return
        }

        if (!authStore.token) {
            console.warn('📡 Cannot connect WebSocket: No auth token')
            return
        }

        try {
            console.log('📡 Connecting to WebSocket...')

            // Create socket instance
            const socketUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8080'
            socket.value = io(socketUrl, {
                ...socketConfig,
                auth: {
                    token: authStore.token,
                    userId: authStore.userId
                }
            })

            setupEventListeners()

            socket.value.connect()

        } catch (error) {
            console.error('📡 WebSocket connection failed:', error)
            connectionError.value = error
            toast.error('Không thể kết nối real-time. Một số tính năng có thể bị hạn chế.')
        }
    }

    // Disconnect
    const disconnect = () => {
        if (socket.value) {
            console.log('📡 Disconnecting WebSocket...')
            socket.value.disconnect()
            socket.value = null
        }

        isConnected.value = false
        isReconnecting.value = false
        connectionError.value = null
        reconnectAttempts.value = 0
    }

    // Setup event listeners
    const setupEventListeners = () => {
        if (!socket.value) return

        // Connection events
        socket.value.on('connect', handleConnect)
        socket.value.on('disconnect', handleDisconnect)
        socket.value.on('connect_error', handleConnectionError)
        socket.value.on('reconnect', handleReconnect)
        socket.value.on('reconnect_attempt', handleReconnectAttempt)
        socket.value.on('reconnect_error', handleReconnectError)

        // Authentication events
        socket.value.on('auth_success', handleAuthSuccess)
        socket.value.on('auth_failed', handleAuthFailed)

        // Message events
        socket.value.on('message:received', handleMessageReceived)
        socket.value.on('message:sent', handleMessageSent)
        socket.value.on('message:edited', handleMessageEdited)
        socket.value.on('message:deleted', handleMessageDeleted)
        socket.value.on('message:reaction', handleMessageReaction)

        // Typing events
        socket.value.on('user:typing', handleUserTyping)
        socket.value.on('user:stop_typing', handleUserStopTyping)

        // Presence events
        socket.value.on('user:online', handleUserOnline)
        socket.value.on('user:offline', handleUserOffline)
        socket.value.on('user:status_change', handleUserStatusChange)

        // Conversation events
        socket.value.on('conversation:created', handleConversationCreated)
        socket.value.on('conversation:updated', handleConversationUpdated)
        socket.value.on('conversation:deleted', handleConversationDeleted)
        socket.value.on('conversation:participant_added', handleParticipantAdded)
        socket.value.on('conversation:participant_removed', handleParticipantRemoved)

        // Notification events
        socket.value.on('notification:new', handleNotificationReceived)
        socket.value.on('notification:read', handleNotificationRead)

        // Post events (real-time updates)
        socket.value.on('post:liked', handlePostLiked)
        socket.value.on('post:commented', handlePostCommented)
        socket.value.on('post:shared', handlePostShared)
    }

    // Event handlers
    const handleConnect = () => {
        console.log('📡 WebSocket connected')
        isConnected.value = true
        isReconnecting.value = false
        connectionError.value = null
        reconnectAttempts.value = 0

        // Join user's personal room
        if (authStore.userId) {
            socket.value.emit('join:user_room', authStore.userId)
        }

        // Emit presence
        emitUserOnline()
    }

    const handleDisconnect = (reason) => {
        console.log('📡 WebSocket disconnected:', reason)
        isConnected.value = false

        if (reason === 'io server disconnect') {
            // Server initiated disconnect, try to reconnect
            setTimeout(() => {
                if (authStore.token) {
                    connect()
                }
            }, 1000)
        }
    }

    const handleConnectionError = (error) => {
        console.error('📡 WebSocket connection error:', error)
        connectionError.value = error

        if (error.type === 'TransportError') {
            toast.error('Lỗi kết nối mạng. Đang thử kết nối lại...')
        }
    }

    const handleReconnect = (attemptNumber) => {
        console.log(`📡 WebSocket reconnected after ${attemptNumber} attempts`)
        isReconnecting.value = false
        toast.success('Đã kết nối lại thành công!')
    }

    const handleReconnectAttempt = (attemptNumber) => {
        console.log(`📡 WebSocket reconnect attempt ${attemptNumber}`)
        isReconnecting.value = true
        reconnectAttempts.value = attemptNumber
    }

    const handleReconnectError = (error) => {
        console.error('📡 WebSocket reconnect error:', error)

        if (reconnectAttempts.value >= maxReconnectAttempts) {
            toast.error('Không thể kết nối lại. Vui lòng tải lại trang.')
        }
    }

    const handleAuthSuccess = (data) => {
        console.log('📡 WebSocket authentication successful:', data)
    }

    const handleAuthFailed = (error) => {
        console.error('📡 WebSocket authentication failed:', error)
        toast.error('Xác thực thất bại. Vui lòng đăng nhập lại.')
        authStore.logout()
    }

    // Message event handlers
    const handleMessageReceived = (message) => {
        triggerEvent('message:received', message)
    }

    const handleMessageSent = (message) => {
        triggerEvent('message:sent', message)
    }

    const handleMessageEdited = (message) => {
        triggerEvent('message:edited', message)
    }

    const handleMessageDeleted = (messageId) => {
        triggerEvent('message:deleted', messageId)
    }

    const handleMessageReaction = (reaction) => {
        triggerEvent('message:reaction', reaction)
    }

    // Typing event handlers
    const handleUserTyping = (data) => {
        triggerEvent('user:typing', data)
    }

    const handleUserStopTyping = (data) => {
        triggerEvent('user:stop_typing', data)
    }

    // Presence event handlers
    const handleUserOnline = (userId) => {
        triggerEvent('user:online', userId)
    }

    const handleUserOffline = (userId) => {
        triggerEvent('user:offline', userId)
    }

    const handleUserStatusChange = (data) => {
        triggerEvent('user:status_change', data)
    }

    // Conversation event handlers
    const handleConversationCreated = (conversation) => {
        triggerEvent('conversation:created', conversation)
    }

    const handleConversationUpdated = (conversation) => {
        triggerEvent('conversation:updated', conversation)
    }

    const handleConversationDeleted = (conversationId) => {
        triggerEvent('conversation:deleted', conversationId)
    }

    const handleParticipantAdded = (data) => {
        triggerEvent('conversation:participant_added', data)
    }

    const handleParticipantRemoved = (data) => {
        triggerEvent('conversation:participant_removed', data)
    }

    // Notification event handlers
    const handleNotificationReceived = (notification) => {
        triggerEvent('notification:new', notification)

        // Show toast for new notifications
        if (notification.type !== 'message') {
            toast.info(notification.message)
        }
    }

    const handleNotificationRead = (notificationId) => {
        triggerEvent('notification:read', notificationId)
    }

    // Post event handlers
    const handlePostLiked = (data) => {
        triggerEvent('post:liked', data)
    }

    const handlePostCommented = (data) => {
        triggerEvent('post:commented', data)
    }

    const handlePostShared = (data) => {
        triggerEvent('post:shared', data)
    }

    // Emit functions
    const sendMessage = (conversationId, message) => {
        if (!socket.value?.connected) {
            console.warn('📡 Cannot send message: WebSocket not connected')
            return false
        }

        socket.value.emit('message:send', {
            conversationId,
            content: message.content,
            type: message.type || 'text',
            replyTo: message.replyTo,
            attachments: message.attachments
        })

        return true
    }

    const emitTyping = (conversationId, isTyping = true) => {
        if (!socket.value?.connected) return

        socket.value.emit('user:typing', {
            conversationId,
            isTyping,
            userId: authStore.userId
        })
    }

    const emitUserOnline = () => {
        if (!socket.value?.connected) return

        socket.value.emit('user:online', {
            userId: authStore.userId,
            status: 'online'
        })
    }

    const emitUserOffline = () => {
        if (!socket.value?.connected) return

        socket.value.emit('user:offline', {
            userId: authStore.userId
        })
    }

    const joinConversation = (conversationId) => {
        if (!socket.value?.connected) return

        socket.value.emit('conversation:join', conversationId)
    }

    const leaveConversation = (conversationId) => {
        if (!socket.value?.connected) return

        socket.value.emit('conversation:leave', conversationId)
    }

    // Event subscription system
    const on = (eventName, callback) => {
        if (!events.value.has(eventName)) {
            events.value.set(eventName, new Set())
        }
        events.value.get(eventName).add(callback)

        // Return unsubscribe function
        return () => {
            const eventSet = events.value.get(eventName)
            if (eventSet) {
                eventSet.delete(callback)
                if (eventSet.size === 0) {
                    events.value.delete(eventName)
                }
            }
        }
    }

    const off = (eventName, callback) => {
        const eventSet = events.value.get(eventName)
        if (eventSet) {
            eventSet.delete(callback)
            if (eventSet.size === 0) {
                events.value.delete(eventName)
            }
        }
    }

    const triggerEvent = (eventName, data) => {
        const eventSet = events.value.get(eventName)
        if (eventSet) {
            eventSet.forEach(callback => {
                try {
                    callback(data)
                } catch (error) {
                    console.error(`Error in event handler for ${eventName}:`, error)
                }
            })
        }
    }

    // Lifecycle
    onMounted(() => {
        // Auto-connect if authenticated
        if (authStore.isAuthenticated) {
            connect()
        }
    })

    onUnmounted(() => {
        // Emit offline status before disconnecting
        emitUserOffline()
        disconnect()
    })

    // Handle page visibility change
    if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', () => {
            if (authStore.isAuthenticated && socket.value) {
                if (document.hidden) {
                    emitUserOffline()
                } else {
                    emitUserOnline()
                }
            }
        })

        // Handle page unload
        window.addEventListener('beforeunload', () => {
            emitUserOffline()
        })
    }

    return {
        // State
        socket: computed(() => socket.value),
        isConnected,
        isReconnecting,
        connectionError,
        connectionStatus,
        reconnectAttempts,

        // Actions
        connect,
        disconnect,

        // Event system
        on,
        off,

        // Emit functions
        sendMessage,
        emitTyping,
        emitUserOnline,
        emitUserOffline,
        joinConversation,
        leaveConversation
    }
}