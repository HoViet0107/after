// Notification plugin với push notifications, service worker và real-time support

import { useNotificationStore } from '@/stores/notification'
import { useToast } from 'vue-toastification'

class NotificationManager {
    constructor() {
        this.serviceWorker = null
        this.pushSubscription = null
        this.notificationStore = null
        this.toast = useToast()
        this.isSupported = 'Notification' in window && 'serviceWorker' in navigator
        this.permission = Notification.permission
        this.vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

        // Notification queue for offline mode
        this.notificationQueue = []
        this.isOnline = navigator.onLine

        // Sound management
        this.sounds = new Map()
        this.soundEnabled = localStorage.getItem('notification_sound_enabled') !== 'false'

        // Notification templates
        this.templates = new Map()

        this.initialize()
    }

    async initialize() {
        try {
            // Initialize notification store
            this.notificationStore = useNotificationStore()

            // Setup service worker
            if (this.isSupported) {
                await this.registerServiceWorker()
            }

            // Load notification sounds
            this.loadSounds()

            // Setup notification templates
            this.setupTemplates()

            // Setup network listeners
            this.setupNetworkListeners()

            // Setup visibility change listener
            this.setupVisibilityListener()

            console.log('✅ Notification manager initialized')
        } catch (error) {
            console.error('❌ Failed to initialize notification manager:', error)
        }
    }

    // Service Worker management
    async registerServiceWorker() {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            })

            this.serviceWorker = registration

            registration.addEventListener('updatefound', () => {
                console.log('Service worker update found')
                this.handleServiceWorkerUpdate(registration)
            })

            // Listen for messages from service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                this.handleServiceWorkerMessage(event)
            })

            console.log('✅ Service worker registered')
            return registration
        } catch (error) {
            console.error('❌ Service worker registration failed:', error)
            throw error
        }
    }

    handleServiceWorkerUpdate(registration) {
        const newWorker = registration.installing

        newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New service worker is available
                this.showUpdateNotification()
            }
        })
    }

    showUpdateNotification() {
        this.toast.info('Có phiên bản mới! Tải lại trang để cập nhật.', {
            timeout: 0,
            closeOnClick: false,
            draggable: false,
            showCloseButtonOnHover: true,
            actions: [
                {
                    text: 'Tải lại',
                    onClick: () => {
                        window.location.reload()
                    }
                },
                {
                    text: 'Bỏ qua',
                    onClick: (_, toastObject) => {
                        toastObject.goAway(0)
                    }
                }
            ]
        })
    }

    handleServiceWorkerMessage(event) {
        const { type, data } = event.data

        switch (type) {
            case 'NOTIFICATION_CLICK':
                this.handleNotificationClick(data)
                break
            case 'BACKGROUND_SYNC':
                this.handleBackgroundSync(data)
                break
            case 'PUSH_RECEIVED':
                this.handlePushReceived(data)
                break
            default:
                console.log('Unknown service worker message:', type, data)
        }
    }

    // Push notification management
    async requestPermission() {
        if (!this.isSupported) {
            return { success: false, error: 'Notifications not supported' }
        }

        try {
            const permission = await Notification.requestPermission()
            this.permission = permission

            if (permission === 'granted') {
                console.log('✅ Notification permission granted')

                // Setup push subscription if service worker is ready
                if (this.serviceWorker) {
                    await this.setupPushSubscription()
                }

                return { success: true, permission }
            } else {
                console.log('❌ Notification permission denied')
                return { success: false, error: 'Permission denied', permission }
            }
        } catch (error) {
            console.error('Failed to request notification permission:', error)
            return { success: false, error: error.message }
        }
    }

    async setupPushSubscription() {
        if (!this.vapidPublicKey || !this.serviceWorker) {
            console.warn('VAPID key or service worker not available')
            return
        }

        try {
            const registration = await navigator.serviceWorker.ready

            // Check for existing subscription
            let subscription = await registration.pushManager.getSubscription()

            if (!subscription) {
                // Create new subscription
                subscription = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
                })
            }

            this.pushSubscription = subscription

            // Send subscription to server
            await this.sendSubscriptionToServer(subscription)

            console.log('✅ Push subscription setup complete')
        } catch (error) {
            console.error('❌ Failed to setup push subscription:', error)
        }
    }

    async sendSubscriptionToServer(subscription) {
        try {
            const response = await fetch('/api/v1/notifications/push-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: JSON.stringify({
                    subscription: subscription.toJSON(),
                    userAgent: navigator.userAgent,
                    platform: navigator.platform
                })
            })

            if (!response.ok) {
                throw new Error('Failed to send subscription to server')
            }

            console.log('✅ Push subscription sent to server')
        } catch (error) {
            console.error('❌ Failed to send push subscription to server:', error)
        }
    }

    async unsubscribeFromPush() {
        if (!this.pushSubscription) return { success: true }

        try {
            await this.pushSubscription.unsubscribe()

            // Remove from server
            await fetch('/api/v1/notifications/push-subscription', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
            })

            this.pushSubscription = null
            console.log('✅ Push subscription removed')

            return { success: true }
        } catch (error) {
            console.error('❌ Failed to unsubscribe from push:', error)
            return { success: false, error: error.message }
        }
    }

    // Local notification management
    showNotification(title, options = {}) {
        if (this.permission !== 'granted') {
            console.warn('Notification permission not granted')
            return null
        }

        try {
            // Enhance options with defaults
            const notificationOptions = {
                icon: options.icon || '/icons/notification-icon.png',
                badge: options.badge || '/icons/notification-badge.png',
                image: options.image,
                body: options.body || '',
                tag: options.tag || `notification_${Date.now()}`,
                requireInteraction: options.requireInteraction || false,
                silent: options.silent || false,
                vibrate: options.vibrate || [200, 100, 200],
                data: options.data || {},
                actions: options.actions || [],
                timestamp: Date.now(),
                ...options
            }

            // Show notification
            const notification = new Notification(title, notificationOptions)

            // Setup event listeners
            notification.addEventListener('click', () => {
                this.handleNotificationClick({
                    title,
                    options: notificationOptions
                })
                notification.close()
            })

            notification.addEventListener('close', () => {
                console.log('Notification closed:', title)
            })

            notification.addEventListener('error', (error) => {
                console.error('Notification error:', error)
            })

            // Auto-close after delay
            if (options.autoClose !== false) {
                setTimeout(() => {
                    notification.close()
                }, options.timeout || 10000)
            }

            // Play sound if enabled
            if (this.soundEnabled && options.sound) {
                this.playSound(options.sound)
            }

            return notification
        } catch (error) {
            console.error('Failed to show notification:', error)
            return null
        }
    }

    // Template-based notifications
    setupTemplates() {
        // Message notification template
        this.templates.set('message', {
            title: (data) => `Tin nhắn từ ${data.senderName}`,
            body: (data) => data.message,
            icon: '/icons/message.png',
            tag: (data) => `message_${data.conversationId}`,
            actions: [
                {
                    action: 'reply',
                    title: 'Trả lời',
                    icon: '/icons/reply.png'
                },
                {
                    action: 'mark_read',
                    title: 'Đánh dấu đã đọc',
                    icon: '/icons/mark-read.png'
                }
            ],
            sound: 'message'
        })

        // Like notification template
        this.templates.set('like', {
            title: (data) => `${data.userName} đã thích bài viết của bạn`,
            body: (data) => data.postPreview,
            icon: '/icons/like.png',
            tag: 'likes',
            sound: 'like'
        })

        // Comment notification template
        this.templates.set('comment', {
            title: (data) => `${data.userName} đã bình luận bài viết của bạn`,
            body: (data) => data.comment,
            icon: '/icons/comment.png',
            tag: (data) => `comment_${data.postId}`,
            actions: [
                {
                    action: 'view',
                    title: 'Xem',
                    icon: '/icons/view.png'
                },
                {
                    action: 'reply',
                    title: 'Trả lời',
                    icon: '/icons/reply.png'
                }
            ],
            sound: 'comment'
        })

        // Follow notification template
        this.templates.set('follow', {
            title: (data) => `${data.userName} đã theo dõi bạn`,
            body: (data) => data.userBio || '',
            icon: '/icons/follow.png',
            tag: 'follows',
            actions: [
                {
                    action: 'view_profile',
                    title: 'Xem trang cá nhân',
                    icon: '/icons/profile.png'
                },
                {
                    action: 'follow_back',
                    title: 'Theo dõi lại',
                    icon: '/icons/follow-back.png'
                }
            ],
            sound: 'follow'
        })

        // System notification template
        this.templates.set('system', {
            title: (data) => data.title || 'Thông báo hệ thống',
            body: (data) => data.message,
            icon: '/icons/system.png',
            tag: 'system',
            requireInteraction: true,
            sound: 'system'
        })
    }

    showTemplateNotification(template, data) {
        const templateConfig = this.templates.get(template)
        if (!templateConfig) {
            console.error('Unknown notification template:', template)
            return null
        }

        const title = typeof templateConfig.title === 'function'
            ? templateConfig.title(data)
            : templateConfig.title

        const options = {
            body: typeof templateConfig.body === 'function'
                ? templateConfig.body(data)
                : templateConfig.body,
            icon: templateConfig.icon,
            tag: typeof templateConfig.tag === 'function'
                ? templateConfig.tag(data)
                : templateConfig.tag,
            actions: templateConfig.actions || [],
            requireInteraction: templateConfig.requireInteraction || false,
            sound: templateConfig.sound,
            data: { template, ...data }
        }

        return this.showNotification(title, options)
    }

    // Sound management
    loadSounds() {
        const soundFiles = {
            message: '/sounds/message.mp3',
            like: '/sounds/like.mp3',
            comment: '/sounds/comment.mp3',
            follow: '/sounds/follow.mp3',
            system: '/sounds/system.mp3',
            default: '/sounds/default.mp3'
        }

        Object.entries(soundFiles).forEach(([name, url]) => {
            const audio = new Audio(url)
            audio.preload = 'auto'
            audio.volume = 0.7
            this.sounds.set(name, audio)
        })
    }

    playSound(soundName) {
        if (!this.soundEnabled) return

        const sound = this.sounds.get(soundName) || this.sounds.get('default')
        if (sound) {
            sound.currentTime = 0
            sound.play().catch(error => {
                console.warn('Failed to play notification sound:', error)
            })
        }
    }

    setSoundEnabled(enabled) {
        this.soundEnabled = enabled
        localStorage.setItem('notification_sound_enabled', enabled.toString())
    }

    // Event handlers
    handleNotificationClick(data) {
        // Focus window
        if (window.focus) {
            window.focus()
        }

        // Handle different notification types
        const { template, ...notificationData } = data.data || {}

        switch (template) {
            case 'message':
                this.handleMessageClick(notificationData)
                break
            case 'like':
            case 'comment':
                this.handlePostClick(notificationData)
                break
            case 'follow':
                this.handleFollowClick(notificationData)
                break
            default:
                console.log('Notification clicked:', data)
        }

        // Mark as read if applicable
        if (notificationData.notificationId) {
            this.notificationStore?.markAsRead(notificationData.notificationId)
        }
    }

    handleMessageClick(data) {
        // Navigate to conversation
        if (data.conversationId) {
            window.location.href = `/app/chat/${data.conversationId}`
        }
    }

    handlePostClick(data) {
        // Navigate to post
        if (data.postId) {
            window.location.href = `/app/post/${data.postId}`
        }
    }

    handleFollowClick(data) {
        // Navigate to user profile
        if (data.userId) {
            window.location.href = `/app/profile/${data.userId}`
        }
    }

    handlePushReceived(data) {
        console.log('Push notification received:', data)

        // Show local notification if app is in foreground
        if (document.visibilityState === 'visible') {
            this.showTemplateNotification(data.template, data)
        }
    }

    handleBackgroundSync(data) {
        console.log('Background sync triggered:', data)

        // Process queued notifications
        this.processNotificationQueue()
    }

    // Network and visibility management
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true
            console.log('Network online - processing notification queue')
            this.processNotificationQueue()
        })

        window.addEventListener('offline', () => {
            this.isOnline = false
            console.log('Network offline - notifications will be queued')
        })
    }

    setupVisibilityListener() {
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                // App became visible, clear badge count
                this.clearBadgeCount()
            }
        })
    }

    // Notification queue management
    queueNotification(notificationData) {
        this.notificationQueue.push({
            ...notificationData,
            timestamp: Date.now()
        })

        // Limit queue size
        if (this.notificationQueue.length > 100) {
            this.notificationQueue.shift()
        }
    }

    processNotificationQueue() {
        if (!this.isOnline || this.notificationQueue.length === 0) return

        const now = Date.now()
        const validNotifications = this.notificationQueue.filter(
            notification => (now - notification.timestamp) < 5 * 60 * 1000 // 5 minutes
        )

        validNotifications.forEach(notification => {
            this.showTemplateNotification(notification.template, notification.data)
        })

        this.notificationQueue = []
    }

    // Badge management
    updateBadgeCount(count) {
        if ('setAppBadge' in navigator) {
            navigator.setAppBadge(count).catch(error => {
                console.warn('Failed to set app badge:', error)
            })
        }
    }

    clearBadgeCount() {
        if ('clearAppBadge' in navigator) {
            navigator.clearAppBadge().catch(error => {
                console.warn('Failed to clear app badge:', error)
            })
        }
    }

    // Utility methods
    urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4)
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/')

        const rawData = window.atob(base64)
        const outputArray = new Uint8Array(rawData.length)

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i)
        }
        return outputArray
    }

    // Status getters
    getPermissionStatus() {
        return {
            permission: this.permission,
            supported: this.isSupported,
            pushSupported: 'PushManager' in window,
            serviceWorkerSupported: 'serviceWorker' in navigator
        }
    }

    getSubscriptionStatus() {
        return {
            subscribed: !!this.pushSubscription,
            subscription: this.pushSubscription?.toJSON(),
            serviceWorkerReady: !!this.serviceWorker
        }
    }

    // Cleanup
    destroy() {
        // Unsubscribe from push notifications
        if (this.pushSubscription) {
            this.unsubscribeFromPush()
        }

        // Clear notification queue
        this.notificationQueue = []

        // Dispose audio objects
        this.sounds.clear()
    }
}

// Create singleton instance
const notificationManager = new NotificationManager()

// Vue plugin installation
export default {
    install(app) {
        // Provide notification manager globally
        app.config.globalProperties.$notifications = notificationManager
        app.provide('notifications', notificationManager)

        // Auto-request permission on user interaction
        let permissionRequested = false
        const requestPermissionOnce = () => {
            if (!permissionRequested && notificationManager.permission === 'default') {
                permissionRequested = true
                notificationManager.requestPermission()
            }
        }

        // Listen for first user interaction
        document.addEventListener('click', requestPermissionOnce, { once: true })
        document.addEventListener('keydown', requestPermissionOnce, { once: true })
    }
}

// Export manager for direct use
export { notificationManager }