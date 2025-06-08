import { ref, computed, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import { useWebSocket } from '@/composables/useWebSocket'

export function useNotifications() {
    const notificationStore = useNotificationStore()
    const { on, off } = useWebSocket()

    // State
    const permission = ref(Notification.permission)
    const isSupported = ref('Notification' in window)

    // Computed
    const notifications = computed(() => notificationStore.notifications)
    const unreadCount = computed(() => notificationStore.unreadCount)
    const canShowNotifications = computed(() =>
        isSupported.value && permission.value === 'granted'
    )

    // Actions
    const requestPermission = async () => {
        if (!isSupported.value) {
            throw new Error('Notifications not supported')
        }

        if (permission.value === 'granted') {
            return true
        }

        const result = await Notification.requestPermission()
        permission.value = result
        return result === 'granted'
    }

    const showNotification = (title, options = {}) => {
        if (!canShowNotifications.value) return null

        const notification = new Notification(title, {
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: 'social-app',
            renotify: true,
            ...options
        })

        // Auto close after 5 seconds
        setTimeout(() => {
            notification.close()
        }, 5000)

        return notification
    }

    const showMessageNotification = (message, conversation) => {
        if (!canShowNotifications.value) return

        showNotification(`${message.sender.name}`, {
            body: message.content,
            icon: message.sender.avatar,
            tag: `message-${conversation.id}`,
            data: {
                type: 'message',
                conversationId: conversation.id,
                messageId: message.id
            }
        })
    }

    const showPostNotification = (post, action) => {
        if (!canShowNotifications.value) return

        let body = ''
        switch (action) {
            case 'like':
                body = `${post.author.name} đã thích bài viết của bạn`
                break
            case 'comment':
                body = `${post.author.name} đã bình luận về bài viết của bạn`
                break
            case 'share':
                body = `${post.author.name} đã chia sẻ bài viết của bạn`
                break
        }

        showNotification('Thông báo mới', {
            body,
            icon: post.author.avatar,
            tag: `post-${post.id}-${action}`,
            data: {
                type: 'post',
                postId: post.id,
                action
            }
        })
    }

    const handleNewNotification = (data) => {
        // Add to store
        notificationStore.addNotification(data.notification)

        // Show browser notification if enabled
        if (canShowNotifications.value) {
            const { notification } = data

            switch (notification.type) {
                case 'message':
                    showMessageNotification(notification.data.message, notification.data.conversation)
                    break
                case 'like':
                case 'comment':
                case 'share':
                    showPostNotification(notification.data.post, notification.type)
                    break
                default:
                    showNotification(notification.title, {
                        body: notification.message,
                        tag: `notification-${notification.id}`
                    })
            }
        }
    }

    // WebSocket event handlers
    const setupWebSocketListeners = () => {
        on('new-notification', handleNewNotification)
    }

    const cleanupWebSocketListeners = () => {
        off('new-notification', handleNewNotification)
    }

    onMounted(() => {
        setupWebSocketListeners()

        // Fetch initial notifications
        notificationStore.fetchNotifications()
        notificationStore.fetchUnreadCount()
    })

    return {
        // State
        permission,
        isSupported,

        // Computed
        notifications,
        unreadCount,
        canShowNotifications,

        // Actions
        requestPermission,
        showNotification,
        showMessageNotification,
        showPostNotification,
        setupWebSocketListeners,
        cleanupWebSocketListeners
    }
}