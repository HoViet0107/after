import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useWebSocket } from '@/composables/useWebSocket'
import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'

export const usePresenceStore = defineStore('presence', () => {
    // Dependencies
    const authStore = useAuthStore()
    const { on, off } = useWebSocket()

    // State
    const userPresence = ref(new Map()) // userId -> presence info
    const myPresence = ref({
        status: 'offline', // offline, online, away, busy, invisible
        lastSeen: null,
        activity: null, // current activity
        device: null, // device info
        location: null // optional location
    })

    const presenceSettings = ref({
        showOnlineStatus: true,
        showLastSeen: true,
        showActivity: false,
        autoAwayMinutes: 10,
        autoOfflineMinutes: 30
    })

    // Activity tracking
    const lastActivity = ref(Date.now())
    const activityTimer = ref(null)
    const awayTimer = ref(null)
    const isPageVisible = ref(!document.hidden)

    // Presence cache
    const presenceCache = ref(new Map())
    const cacheExpiry = 5 * 60 * 1000 // 5 minutes

    // Computed
    const onlineUsers = computed(() => {
        const online = new Set()
        for (const [userId, presence] of userPresence.value) {
            if (['online', 'away', 'busy'].includes(presence.status)) {
                online.add(userId)
            }
        }
        return online
    })

    const onlineCount = computed(() => onlineUsers.value.size)

    const isUserOnline = computed(() => (userId) => {
        const presence = userPresence.value.get(userId)
        return presence && ['online', 'away', 'busy'].includes(presence.status)
    })

    const getUserPresence = computed(() => (userId) => {
        return userPresence.value.get(userId) || {
            status: 'offline',
            lastSeen: null,
            activity: null
        }
    })

    const getUserLastSeen = computed(() => (userId) => {
        const presence = userPresence.value.get(userId)
        return presence?.lastSeen || null
    })

    const getUserActivity = computed(() => (userId) => {
        const presence = userPresence.value.get(userId)
        return presence?.activity || null
    })

    const myStatus = computed(() => myPresence.value.status)
    const isOnline = computed(() => ['online', 'away', 'busy'].includes(myStatus.value))

    // Actions
    const initializePresence = async () => {
        if (!authStore.isAuthenticated) return

        try {
            // Load presence settings
            await loadPresenceSettings()

            // Set initial presence
            await updateMyPresence('online')

            // Setup activity tracking
            setupActivityTracking()

            // Setup WebSocket listeners
            setupWebSocketListeners()

            // Load initial presence data for contacts/friends
            await loadContactsPresence()

        } catch (error) {
            console.error('Failed to initialize presence:', error)
        }
    }

    const updateMyPresence = async (status, activity = null) => {
        if (!authStore.isAuthenticated) return

        const previousStatus = myPresence.value.status

        // Update local state immediately
        myPresence.value = {
            ...myPresence.value,
            status,
            activity,
            lastSeen: Date.now(),
            device: getDeviceInfo()
        }

        try {
            // Send to server
            await apiClient.post(ENDPOINTS.USERS.STATUS(authStore.userId), {
                status,
                activity,
                lastSeen: Date.now(),
                device: getDeviceInfo()
            })

            // Emit via WebSocket for real-time updates
            if (window.socket) {
                window.socket.emit('user:presence', {
                    userId: authStore.userId,
                    status,
                    activity,
                    lastSeen: Date.now()
                })
            }

        } catch (error) {
            console.error('Failed to update presence:', error)
            // Revert local state on error
            myPresence.value.status = previousStatus
        }
    }

    const setUserPresence = (userId, presenceData) => {
        const existing = userPresence.value.get(userId) || {}

        userPresence.value.set(userId, {
            ...existing,
            ...presenceData,
            updatedAt: Date.now()
        })

        // Update cache
        presenceCache.value.set(userId, {
            ...presenceData,
            cachedAt: Date.now()
        })
    }

    const setOnline = async () => {
        await updateMyPresence('online')
    }

    const setAway = async () => {
        await updateMyPresence('away')
    }

    const setBusy = async (activity = null) => {
        await updateMyPresence('busy', activity)
    }

    const setOffline = async () => {
        await updateMyPresence('offline')
    }

    const setInvisible = async () => {
        await updateMyPresence('invisible')
    }

    const setActivity = async (activity) => {
        await updateMyPresence(myPresence.value.status, activity)
    }

    const clearActivity = async () => {
        await updateMyPresence(myPresence.value.status, null)
    }

    // Load presence for multiple users
    const loadUsersPresence = async (userIds) => {
        if (!userIds || userIds.length === 0) return

        // Filter out users we already have fresh cache for
        const uncachedUsers = userIds.filter(userId => {
            const cached = presenceCache.value.get(userId)
            return !cached || (Date.now() - cached.cachedAt) > cacheExpiry
        })

        if (uncachedUsers.length === 0) {
            // Use cached data
            userIds.forEach(userId => {
                const cached = presenceCache.value.get(userId)
                if (cached) {
                    setUserPresence(userId, cached)
                }
            })
            return
        }

        try {
            const response = await apiClient.post('/users/presence/batch', {
                userIds: uncachedUsers
            })

            const presenceData = response.data
            presenceData.forEach(presence => {
                setUserPresence(presence.userId, presence)
            })

        } catch (error) {
            console.error('Failed to load users presence:', error)
        }
    }

    const loadContactsPresence = async () => {
        try {
            const response = await apiClient.get('/users/presence/contacts')
            const presenceData = response.data

            presenceData.forEach(presence => {
                setUserPresence(presence.userId, presence)
            })

        } catch (error) {
            console.error('Failed to load contacts presence:', error)
        }
    }

    const loadPresenceSettings = async () => {
        try {
            const response = await apiClient.get('/users/presence/settings')
            presenceSettings.value = { ...presenceSettings.value, ...response.data }
        } catch (error) {
            console.error('Failed to load presence settings:', error)
        }
    }

    const updatePresenceSettings = async (settings) => {
        try {
            await apiClient.put('/users/presence/settings', settings)
            presenceSettings.value = { ...presenceSettings.value, ...settings }
        } catch (error) {
            console.error('Failed to update presence settings:', error)
            throw error
        }
    }

    // Activity tracking
    const updateActivity = () => {
        lastActivity.value = Date.now()

        // If user was away/offline and is now active, set to online
        if (['away', 'offline'].includes(myPresence.value.status) && isPageVisible.value) {
            updateMyPresence('online')
        }

        // Reset away timer
        resetAwayTimer()
    }

    const setupActivityTracking = () => {
        // Track user activity
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

        events.forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true })
        })

        // Track page visibility
        document.addEventListener('visibilitychange', handleVisibilityChange)

        // Start away timer
        resetAwayTimer()
    }

    const handleVisibilityChange = () => {
        isPageVisible.value = !document.hidden

        if (document.hidden) {
            // Page is hidden, set away after delay
            setTimeout(() => {
                if (document.hidden && myPresence.value.status === 'online') {
                    updateMyPresence('away')
                }
            }, 30000) // 30 seconds
        } else {
            // Page is visible, set online if was away
            if (['away', 'offline'].includes(myPresence.value.status)) {
                updateMyPresence('online')
            }
            updateActivity()
        }
    }

    const resetAwayTimer = () => {
        if (awayTimer.value) {
            clearTimeout(awayTimer.value)
        }

        // Set away after inactivity
        awayTimer.value = setTimeout(() => {
            if (myPresence.value.status === 'online' && isPageVisible.value) {
                const timeSinceActivity = Date.now() - lastActivity.value
                const awayThreshold = presenceSettings.value.autoAwayMinutes * 60 * 1000

                if (timeSinceActivity >= awayThreshold) {
                    updateMyPresence('away')
                }
            }
        }, presenceSettings.value.autoAwayMinutes * 60 * 1000)
    }

    // WebSocket event handling
    const setupWebSocketListeners = () => {
        on('user:online', handleUserOnline)
        on('user:offline', handleUserOffline)
        on('user:status_change', handleUserStatusChange)
        on('user:activity_change', handleUserActivityChange)
    }

    const handleUserOnline = (data) => {
        setUserPresence(data.userId, {
            status: 'online',
            lastSeen: Date.now(),
            activity: data.activity || null
        })
    }

    const handleUserOffline = (data) => {
        setUserPresence(data.userId, {
            status: 'offline',
            lastSeen: data.lastSeen || Date.now(),
            activity: null
        })
    }

    const handleUserStatusChange = (data) => {
        setUserPresence(data.userId, {
            status: data.status,
            lastSeen: data.lastSeen || Date.now(),
            activity: data.activity || null
        })
    }

    const handleUserActivityChange = (data) => {
        const currentPresence = userPresence.value.get(data.userId)
        if (currentPresence) {
            setUserPresence(data.userId, {
                ...currentPresence,
                activity: data.activity,
                lastSeen: Date.now()
            })
        }
    }

    // Utility functions
    const getDeviceInfo = () => {
        return {
            type: getDeviceType(),
            browser: getBrowserInfo(),
            os: getOSInfo()
        }
    }

    const getDeviceType = () => {
        const width = window.innerWidth
        if (width < 768) return 'mobile'
        if (width < 1024) return 'tablet'
        return 'desktop'
    }

    const getBrowserInfo = () => {
        const ua = navigator.userAgent
        if (ua.includes('Chrome')) return 'Chrome'
        if (ua.includes('Firefox')) return 'Firefox'
        if (ua.includes('Safari')) return 'Safari'
        if (ua.includes('Edge')) return 'Edge'
        return 'Unknown'
    }

    const getOSInfo = () => {
        const platform = navigator.platform
        if (platform.includes('Win')) return 'Windows'
        if (platform.includes('Mac')) return 'macOS'
        if (platform.includes('Linux')) return 'Linux'
        if (platform.includes('iPhone') || platform.includes('iPad')) return 'iOS'
        if (platform.includes('Android')) return 'Android'
        return 'Unknown'
    }

    const formatLastSeen = (timestamp) => {
        if (!timestamp) return 'Chưa xác định'

        const now = Date.now()
        const diff = now - timestamp

        if (diff < 60000) return 'Vừa xong'
        if (diff < 3600000) return `${Math.floor(diff / 60000)} phút trước`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} giờ trước`

        const days = Math.floor(diff / 86400000)
        return `${days} ngày trước`
    }

    const getStatusColor = (status) => {
        const colors = {
            'online': '#28a745',
            'away': '#ffc107',
            'busy': '#dc3545',
            'offline': '#6c757d',
            'invisible': '#6c757d'
        }
        return colors[status] || colors.offline
    }

    const getStatusText = (status) => {
        const texts = {
            'online': 'Đang hoạt động',
            'away': 'Vắng mặt',
            'busy': 'Bận',
            'offline': 'Offline',
            'invisible': 'Ẩn'
        }
        return texts[status] || texts.offline
    }

    // Cleanup
    const cleanup = () => {
        // Clear timers
        if (awayTimer.value) {
            clearTimeout(awayTimer.value)
        }
        if (activityTimer.value) {
            clearTimeout(activityTimer.value)
        }

        // Remove WebSocket listeners
        off('user:online', handleUserOnline)
        off('user:offline', handleUserOffline)
        off('user:status_change', handleUserStatusChange)
        off('user:activity_change', handleUserActivityChange)

        // Remove event listeners
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
        events.forEach(event => {
            document.removeEventListener(event, updateActivity)
        })
        document.removeEventListener('visibilitychange', handleVisibilityChange)

        // Set offline before cleanup
        if (authStore.isAuthenticated) {
            setOffline()
        }
    }

    return {
        // State
        userPresence,
        myPresence,
        presenceSettings,
        lastActivity,
        isPageVisible,

        // Computed
        onlineUsers,
        onlineCount,
        isUserOnline,
        getUserPresence,
        getUserLastSeen,
        getUserActivity,
        myStatus,
        isOnline,

        // Actions
        initializePresence,
        updateMyPresence,
        setUserPresence,
        setOnline,
        setAway,
        setBusy,
        setOffline,
        setInvisible,
        setActivity,
        clearActivity,
        loadUsersPresence,
        loadContactsPresence,
        updatePresenceSettings,
        updateActivity,

        // Utilities
        formatLastSeen,
        getStatusColor,
        getStatusText,
        cleanup
    }
})