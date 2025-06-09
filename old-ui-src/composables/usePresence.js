import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useAuthStore } from '@/stores/auth'

export function usePresence() {
    const { emit, on, off, isConnected } = useWebSocket()
    const authStore = useAuthStore()

    // State
    const userPresence = ref(new Map()) // userId -> { status, lastSeen }
    const currentStatus = ref('online')

    // Computed
    const onlineUsers = computed(() => {
        const online = []
        for (const [userId, presence] of userPresence.value) {
            if (presence.status === 'online') {
                online.push(userId)
            }
        }
        return online
    })

    const getUserPresence = computed(() => (userId) => {
        return userPresence.value.get(userId) || { status: 'offline', lastSeen: null }
    })

    const isUserOnline = computed(() => (userId) => {
        const presence = userPresence.value.get(userId)
        return presence && presence.status === 'online'
    })

    // Actions
    const updatePresence = (status) => {
        if (!isConnected.value) return

        currentStatus.value = status
        emit('presence-update', {
            userId: authStore.userId,
            status,
            timestamp: Date.now()
        })
    }

    const setUserPresence = (userId, presence) => {
        userPresence.value.set(userId, {
            ...presence,
            lastUpdated: Date.now()
        })
    }

    const removeUserPresence = (userId) => {
        userPresence.value.delete(userId)
    }

    const handlePresenceUpdate = (data) => {
        const { userId, status, timestamp } = data
        setUserPresence(userId, { status, lastSeen: timestamp })
    }

    const handleUserOnline = (data) => {
        const { userId, timestamp } = data
        setUserPresence(userId, { status: 'online', lastSeen: timestamp })
    }

    const handleUserOffline = (data) => {
        const { userId, timestamp } = data
        setUserPresence(userId, { status: 'offline', lastSeen: timestamp })
    }

    const handlePresenceList = (data) => {
        const { users } = data
        users.forEach(user => {
            setUserPresence(user.userId, {
                status: user.status,
                lastSeen: user.lastSeen
            })
        })
    }

    // Setup presence tracking
    const setupPresenceTracking = () => {
        if (!isConnected.value) return

        // Request initial presence list
        emit('presence-list-request')

        // Setup auto presence updates
        const updateInterval = setInterval(() => {
            if (isConnected.value && document.visibilityState === 'visible') {
                updatePresence(currentStatus.value)
            }
        }, 30000) // Update every 30 seconds

        // Handle visibility change
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                updatePresence('online')
            } else {
                updatePresence('away')
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Cleanup function
        return () => {
            clearInterval(updateInterval)
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }

    // WebSocket event listeners
    const setupWebSocketListeners = () => {
        on('presence-update', handlePresenceUpdate)
        on('user-online', handleUserOnline)
        on('user-offline', handleUserOffline)
        on('presence-list', handlePresenceList)
    }

    const cleanupWebSocketListeners = () => {
        off('presence-update', handlePresenceUpdate)
        off('user-online', handleUserOnline)
        off('user-offline', handleUserOffline)
        off('presence-list', handlePresenceList)
    }

    onMounted(() => {
        setupWebSocketListeners()
        const cleanup = setupPresenceTracking()

        // Store cleanup function
        onUnmounted(() => {
            cleanup?.()
            cleanupWebSocketListeners()
            updatePresence('offline')
        })
    })

    return {
        // State
        userPresence,
        currentStatus,

        // Computed
        onlineUsers,
        getUserPresence,
        isUserOnline,

        // Actions
        updatePresence,
        setUserPresence,
        removeUserPresence,
        setupPresenceTracking,
        setupWebSocketListeners,
        cleanupWebSocketListeners
    }
}