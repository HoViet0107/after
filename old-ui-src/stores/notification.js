// src/stores/notification.js
// Notification store với real-time updates, push notifications và smart grouping

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'

export const useNotificationStore = defineStore('notification', () => {
    // Dependencies
    const websocket = useWebSocket()
    const cache = useCacheStore()
    const toast = useToast()

    // State
    const notifications = ref([])
    const unreadCount = ref(0)
    const isLoading = ref(false)
    const lastFetchTime = ref(null)
    const hasMore = ref(true)
    const currentPage = ref(0)

    // Settings
    const settings = ref({
        enablePush: localStorage.getItem('notification_push_enabled') !== 'false',
        enableSound: localStorage.getItem('notification_sound_enabled') !== 'false',
        enableDesktop: localStorage.getItem('notification_desktop_enabled') !== 'false',
        enableInApp: localStorage.getItem('notification_in_app_enabled') !== 'false',
        quietHours: {
            enabled: localStorage.getItem('notification_quiet_hours_enabled') === 'true',
            start: localStorage.getItem('notification_quiet_start') || '22:00',
            end: localStorage.getItem('notification_quiet_end') || '07:00'
        },
        groupSimilar: localStorage.getItem('notification_group_similar') !== 'false',
        showPreviews: localStorage.getItem('notification_show_previews') !== 'false',
        categories: {
            likes: localStorage.getItem('notification_likes_enabled') !== 'false',
            comments: localStorage.getItem('notification_comments_enabled') !== 'false',
            follows: localStorage.getItem('notification_follows_enabled') !== 'false',
            mentions: localStorage.getItem('notification_mentions_enabled') !== 'false',
            messages: localStorage.getItem('notification_messages_enabled') !== 'false',
            posts: localStorage.getItem('notification_posts_enabled') !== 'false',
            system: localStorage.getItem('notification_system_enabled') !== 'false'
        }
    })

    // Notification types configuration
    const notificationTypes = {
        like: {
            icon: 'fas fa-heart',
            color: 'text-danger',
            sound: 'like.mp3',
            priority: 'low',
            groupable: true
        },
        comment: {
            icon: 'fas fa-comment',
            color: 'text-primary',
            sound: 'comment.mp3',
            priority: 'medium',
            groupable: true
        },
        follow: {
            icon: 'fas fa-user-plus',
            color: 'text-success',
            sound: 'follow.mp3',
            priority: 'medium',
            groupable: true
        },
        mention: {
            icon: 'fas fa-at',
            color: 'text-warning',
            sound: 'mention.mp3',
            priority: 'high',
            groupable: false
        },
        message: {
            icon: 'fas fa-envelope',
            color: 'text-info',
            sound: 'message.mp3',
            priority: 'high',
            groupable: false
        },
        post: {
            icon: 'fas fa-file-alt',
            color: 'text-secondary',
            sound: 'post.mp3',
            priority: 'low',
            groupable: true
        },
        system: {
            icon: 'fas fa-cog',
            color: 'text-dark',
            sound: 'system.mp3',
            priority: 'high',
            groupable: false
        }
    }

    // Push notification support
    const pushSubscription = ref(null)
    const pushSupported = ref('serviceWorker' in navigator && 'PushManager' in window)

    // Computed
    const unreadNotifications = computed(() =>
        notifications.value.filter(n => !n.read)
    )

    const recentNotifications = computed(() =>
        notifications.value.slice(0, 20)
    )

    const groupedNotifications = computed(() => {
        if (!settings.value.groupSimilar) {
            return notifications.value
        }

        const grouped = []
        const groups = new Map()

        notifications.value.forEach(notification => {
            const type = notificationTypes[notification.type]

            if (type?.groupable) {
                const groupKey = `${notification.type}_${notification.entityId || notification.entityType}`

                if (groups.has(groupKey)) {
                    groups.get(groupKey).items.push(notification)
                    groups.get(groupKey).count++
                    groups.get(groupKey).latestTime = Math.max(
                        groups.get(groupKey).latestTime,
                        new Date(notification.createdAt).getTime()
                    )
                } else {
                    groups.set(groupKey, {
                        id: groupKey,
                        type: notification.type,
                        items: [notification],
                        count: 1,
                        latestTime: new Date(notification.createdAt).getTime(),
                        read: notification.read
                    })
                }
            } else {
                grouped.push(notification)
            }
        })

        // Add grouped notifications
        groups.forEach(group => {
            if (group.count > 1) {
                grouped.push({
                    id: group.id,
                    type: group.type,
                    isGroup: true,
                    count: group.count,
                    items: group.items,
                    createdAt: new Date(group.latestTime).toISOString(),
                    read: group.items.every(item => item.read),
                    title: generateGroupTitle(group),
                    body: generateGroupBody(group)
                })
            } else {
                grouped.push(group.items[0])
            }
        })

        return grouped.sort((a, b) =>
            new Date(b.createdAt) - new Date(a.createdAt)
        )
    })

    const hasUnread = computed(() => unreadCount.value > 0)

    const isQuietTime = computed(() => {
        if (!settings.value.quietHours.enabled) return false

        const now = new Date()
        const currentTime = now.getHours() * 60 + now.getMinutes()

        const start = parseTimeString(settings.value.quietHours.start)
        const end = parseTimeString(settings.value.quietHours.end)

        if (start <= end) {
            return currentTime >= start && currentTime <= end
        } else {
            return currentTime >= start || currentTime <= end
        }
    })

    // Setup WebSocket listeners
    const setupRealTimeListeners = () => {
        websocket.on('notification:new', handleNewNotification)
        websocket.on('notification:read', handleNotificationRead)
        websocket.on('notification:deleted', handleNotificationDeleted)
        websocket.on('notification:batch_read', handleBatchRead)
        websocket.on('notification:settings_updated', handleSettingsUpdated)
    }

    // Fetch notifications from API
    const fetchNotifications = async (options = {}) => {
        try {
            isLoading.value = true

            const cacheKey = `notifications-${currentPage.value}`

            if (!options.forceRefresh) {
                const cached = cache.get(cacheKey)
                if (cached) {
                    return { success: true, data: cached, fromCache: true }
                }
            }

            const response = await apiClient.get('/notifications', {
                params: {
                    page: currentPage.value,
                    limit: options.limit || 20,
                    unreadOnly: options.unreadOnly || false,
                    type: options.type,
                    sinceId: options.sinceId
                }
            })

            const data = response.data.data

            if (currentPage.value === 0) {
                notifications.value = data.notifications
            } else {
                notifications.value.push(...data.notifications)
            }

            unreadCount.value = data.unreadCount
            hasMore.value = data.hasMore
            lastFetchTime.value = Date.now()

            // Cache the data
            cache.set(cacheKey, data, 2 * 60 * 1000) // 2 minutes

            return { success: true, data }
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
            return { success: false, error: error.message }
        } finally {
            isLoading.value = false
        }
    }

    // Load more notifications
    const loadMore = async () => {
        if (!hasMore.value || isLoading.value) return

        currentPage.value++
        return await fetchNotifications()
    }

    // Refresh notifications
    const refresh = async () => {
        currentPage.value = 0
        return await fetchNotifications({ forceRefresh: true })
    }

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const notification = notifications.value.find(n => n.id === notificationId)
            if (!notification || notification.read) return

            // Optimistic update
            notification.read = true
            unreadCount.value = Math.max(0, unreadCount.value - 1)

            // API call
            await apiClient.put(`/notifications/${notificationId}/read`)

            // Clear cache
            cache.deletePattern('notifications-')

            return { success: true }
        } catch (error) {
            // Revert optimistic update
            const notification = notifications.value.find(n => n.id === notificationId)
            if (notification) {
                notification.read = false
                unreadCount.value++
            }

            console.error('Failed to mark notification as read:', error)
            return { success: false, error: error.message }
        }
    }

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const unreadIds = unreadNotifications.value.map(n => n.id)
            if (unreadIds.length === 0) return { success: true }

            // Optimistic update
            notifications.value.forEach(n => {
                if (!n.read) n.read = true
            })
            unreadCount.value = 0

            // API call
            await apiClient.put('/notifications/mark-all-read')

            // Clear cache
            cache.deletePattern('notifications-')

            toast.success('Đã đánh dấu tất cả thông báo là đã đọc')

            return { success: true }
        } catch (error) {
            // Revert optimistic update
            unreadIds.forEach(id => {
                const notification = notifications.value.find(n => n.id === id)
                if (notification) notification.read = false
            })
            unreadCount.value = unreadIds.length

            console.error('Failed to mark all as read:', error)
            toast.error('Không thể đánh dấu tất cả thông báo')
            return { success: false, error: error.message }
        }
    }

    // Delete notification
    const deleteNotification = async (notificationId) => {
        try {
            const index = notifications.value.findIndex(n => n.id === notificationId)
            if (index === -1) return { success: true }

            const notification = notifications.value[index]
            const wasUnread = !notification.read

            // Optimistic update
            notifications.value.splice(index, 1)
            if (wasUnread) {
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }

            // API call
            await apiClient.delete(`/notifications/${notificationId}`)

            // Clear cache
            cache.deletePattern('notifications-')

            return { success: true }
        } catch (error) {
            // Revert optimistic update
            if (index !== -1) {
                notifications.value.splice(index, 0, notification)
                if (wasUnread) {
                    unreadCount.value++
                }
            }

            console.error('Failed to delete notification:', error)
            return { success: false, error: error.message }
        }
    }

    // Clear all notifications
    const clearAll = async () => {
        try {
            const backup = [...notifications.value]
            const backupCount = unreadCount.value

            // Optimistic update
            notifications.value = []
            unreadCount.value = 0

            // API call
            await apiClient.delete('/notifications/clear-all')

            // Clear cache
            cache.deletePattern('notifications-')

            toast.success('Đã xóa tất cả thông báo')

            return { success: true }
        } catch (error) {
            // Revert optimistic update
            notifications.value = backup
            unreadCount.value = backupCount

            console.error('Failed to clear all notifications:', error)
            toast.error('Không thể xóa tất cả thông báo')
            return { success: false, error: error.message }
        }
    }

    // Handle new notification from WebSocket
    const handleNewNotification = (notification) => {
        // Add to notifications list
        notifications.value.unshift(notification)

        if (!notification.read) {
            unreadCount.value++
        }

        // Apply filters based on settings
        if (!shouldShowNotification(notification)) {
            return
        }

        // Show desktop notification if enabled
        if (settings.value.enableDesktop && !isQuietTime.value) {
            showDesktopNotification(notification)
        }

        // Show in-app notification if enabled
        if (settings.value.enableInApp) {
            showInAppNotification(notification)
        }

        // Play sound if enabled
        if (settings.value.enableSound && !isQuietTime.value) {
            playNotificationSound(notification.type)
        }

        // Clear cache
        cache.deletePattern('notifications-')
    }

    // Handle notification read event
    const handleNotificationRead = (data) => {
        const notification = notifications.value.find(n => n.id === data.notificationId)
        if (notification && !notification.read) {
            notification.read = true
            unreadCount.value = Math.max(0, unreadCount.value - 1)
        }
    }

    // Handle notification deleted event
    const handleNotificationDeleted = (data) => {
        const index = notifications.value.findIndex(n => n.id === data.notificationId)
        if (index !== -1) {
            const notification = notifications.value[index]
            notifications.value.splice(index, 1)

            if (!notification.read) {
                unreadCount.value = Math.max(0, unreadCount.value - 1)
            }
        }
    }

    // Handle batch read event
    const handleBatchRead = (data) => {
        data.notificationIds.forEach(id => {
            const notification = notifications.value.find(n => n.id === id)
            if (notification && !notification.read) {
                notification.read = true
            }
        })

        unreadCount.value = Math.max(0, unreadCount.value - data.notificationIds.length)
    }

    // Handle settings updated event
    const handleSettingsUpdated = (newSettings) => {
        Object.assign(settings.value, newSettings)
        saveSettings()
    }

    // Desktop notifications
    const requestDesktopPermission = async () => {
        if (!('Notification' in window)) {
            return { success: false, error: 'Desktop notifications not supported' }
        }

        const permission = await Notification.requestPermission()

        if (permission === 'granted') {
            settings.value.enableDesktop = true
            saveSettings()
            return { success: true }
        } else {
            settings.value.enableDesktop = false
            saveSettings()
            return { success: false, error: 'Permission denied' }
        }
    }

    const showDesktopNotification = (notification) => {
        if (!('Notification' in window) || Notification.permission !== 'granted') {
            return
        }

        const options = {
            body: notification.body,
            icon: notification.icon || '/icons/notification.png',
            badge: '/icons/badge.png',
            tag: notification.id,
            requireInteraction: notificationTypes[notification.type]?.priority === 'high',
            silent: isQuietTime.value,
            actions: [
                {
                    action: 'view',
                    title: 'Xem'
                },
                {
                    action: 'dismiss',
                    title: 'Bỏ qua'
                }
            ]
        }

        const desktopNotification = new Notification(notification.title, options)

        desktopNotification.onclick = () => {
            handleNotificationClick(notification)
            desktopNotification.close()
        }

        // Auto close after delay
        setTimeout(() => {
            desktopNotification.close()
        }, 10000)
    }

    // In-app notifications
    const showInAppNotification = (notification) => {
        const config = notificationTypes[notification.type] || {}

        toast({
            component: 'NotificationToast',
            props: {
                notification,
                icon: config.icon,
                color: config.color
            },
            timeout: getPriorityTimeout(config.priority),
            position: 'top-right',
            onClick: () => handleNotificationClick(notification)
        })
    }

    // Sound notifications
    const playNotificationSound = (type) => {
        if (!settings.value.enableSound) return

        const config = notificationTypes[type] || {}
        const soundFile = config.sound || 'default.mp3'

        try {
            const audio = new Audio(`/sounds/${soundFile}`)
            audio.volume = 0.5
            audio.play().catch(console.warn)
        } catch (error) {
            console.warn('Failed to play notification sound:', error)
        }
    }

    // Push notifications
    const setupPushNotifications = async () => {
        if (!pushSupported.value) {
            return { success: false, error: 'Push notifications not supported' }
        }

        try {
            const registration = await navigator.serviceWorker.ready

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY
            })

            pushSubscription.value = subscription

            // Send subscription to server
            await apiClient.post('/notifications/push-subscription', {
                subscription: subscription.toJSON()
            })

            settings.value.enablePush = true
            saveSettings()

            return { success: true }
        } catch (error) {
            console.error('Failed to setup push notifications:', error)
            return { success: false, error: error.message }
        }
    }

    const unsubscribePush = async () => {
        if (!pushSubscription.value) return { success: true }

        try {
            await pushSubscription.value.unsubscribe()

            // Remove subscription from server
            await apiClient.delete('/notifications/push-subscription')

            pushSubscription.value = null
            settings.value.enablePush = false
            saveSettings()

            return { success: true }
        } catch (error) {
            console.error('Failed to unsubscribe from push notifications:', error)
            return { success: false, error: error.message }
        }
    }

    // Settings management
    const updateSettings = async (newSettings) => {
        try {
            Object.assign(settings.value, newSettings)
            saveSettings()

            // Update server settings
            await apiClient.put('/notifications/settings', settings.value)

            return { success: true }
        } catch (error) {
            console.error('Failed to update notification settings:', error)
            return { success: false, error: error.message }
        }
    }

    const saveSettings = () => {
        Object.keys(settings.value).forEach(key => {
            if (typeof settings.value[key] === 'object') {
                Object.keys(settings.value[key]).forEach(subKey => {
                    localStorage.setItem(`notification_${key}_${subKey}`, settings.value[key][subKey].toString())
                })
            } else {
                localStorage.setItem(`notification_${key}`, settings.value[key].toString())
            }
        })
    }

    // Utility functions
    const shouldShowNotification = (notification) => {
        // Check if category is enabled
        if (!settings.value.categories[notification.type]) {
            return false
        }

        // Check quiet hours
        if (isQuietTime.value && notificationTypes[notification.type]?.priority !== 'high') {
            return false
        }

        return true
    }

    const handleNotificationClick = (notification) => {
        // Mark as read
        if (!notification.read) {
            markAsRead(notification.id)
        }

        // Navigate to relevant page
        if (notification.url) {
            router.push(notification.url)
        }
    }

    const generateGroupTitle = (group) => {
        const count = group.count
        const type = group.type

        switch (type) {
            case 'like':
                return `${count} lượt thích mới`
            case 'comment':
                return `${count} bình luận mới`
            case 'follow':
                return `${count} người theo dõi mới`
            default:
                return `${count} thông báo mới`
        }
    }

    const generateGroupBody = (group) => {
        const users = group.items.map(item => item.actor?.name).filter(Boolean)
        const uniqueUsers = [...new Set(users)]

        if (uniqueUsers.length <= 2) {
            return uniqueUsers.join(' và ')
        } else {
            return `${uniqueUsers[0]}, ${uniqueUsers[1]} và ${uniqueUsers.length - 2} người khác`
        }
    }

    const parseTimeString = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number)
        return hours * 60 + minutes
    }

    const getPriorityTimeout = (priority) => {
        switch (priority) {
            case 'high': return 10000
            case 'medium': return 7000
            case 'low': return 5000
            default: return 5000
        }
    }

    // Initialize
    const initialize = () => {
        setupRealTimeListeners()

        // Load initial notifications
        fetchNotifications()

        // Request desktop permission if enabled
        if (settings.value.enableDesktop && Notification.permission === 'default') {
            requestDesktopPermission()
        }

        // Setup push notifications if enabled
        if (settings.value.enablePush && pushSupported.value) {
            setupPushNotifications()
        }
    }

    return {
        // State
        notifications: computed(() => notifications.value),
        unreadNotifications,
        recentNotifications,
        groupedNotifications,
        unreadCount: computed(() => unreadCount.value),
        hasUnread,
        isLoading: computed(() => isLoading.value),
        hasMore: computed(() => hasMore.value),
        settings: computed(() => settings.value),
        isQuietTime,
        pushSupported: computed(() => pushSupported.value),

        // Actions
        fetchNotifications,
        loadMore,
        refresh,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        clearAll,
        updateSettings,
        requestDesktopPermission,
        setupPushNotifications,
        unsubscribePush,
        initialize,

        // Utilities
        handleNotificationClick,
        shouldShowNotification
    }
})