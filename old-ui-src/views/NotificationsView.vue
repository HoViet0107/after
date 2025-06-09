// Trang hiển thị thông báo với filtering, real-time updates và mark as read functionality
<template>
    <div class="notifications-view">
        <div class="container-fluid">
            <div class="row">
                <!-- Header -->
                <div class="col-12">
                    <div class="notifications-header bg-white p-4 mb-4 rounded shadow-sm">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <h4 class="mb-0">
                                    <i class="fas fa-bell me-2"></i>
                                    Thông báo
                                    <span v-if="unreadCount > 0" class="badge bg-danger ms-2">{{ unreadCount }}</span>
                                </h4>
                            </div>
                            <div class="col-md-6">
                                <div class="d-flex justify-content-md-end gap-2">
                                    <button
                                        v-if="unreadCount > 0"
                                        class="btn btn-outline-primary btn-sm"
                                        @click="markAllAsRead"
                                        :disabled="isMarkingAllRead"
                                    >
                                        <i v-if="isMarkingAllRead" class="fas fa-spinner fa-spin me-1"></i>
                                        {{ isMarkingAllRead ? 'Đang xử lý...' : 'Đánh dấu tất cả đã đọc' }}
                                    </button>
                                    <div class="dropdown">
                                        <button class="btn btn-outline-secondary btn-sm dropdown-toggle" 
                                                data-bs-toggle="dropdown" aria-expanded="false">
                                            <i class="fas fa-filter me-1"></i>
                                            {{ getCurrentFilterLabel() }}
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li>
                                                <a class="dropdown-item" href="#" @click.prevent="setFilter('all')">
                                                    <i class="fas fa-list me-2"></i>
                                                    Tất cả
                                                    <span v-if="filter === 'all'" class="ms-auto">
                                                        <i class="fas fa-check"></i>
                                                    </span>
                                                </a>
                                            </li>
                                            <li>
                                                <a class="dropdown-item" href="#" @click.prevent="setFilter('unread')">
                                                    <i class="fas fa-circle me-2"></i>
                                                    Chưa đọc
                                                    <span v-if="filter === 'unread'" class="ms-auto">
                                                        <i class="fas fa-check"></i>
                                                    </span>
                                                </a>
                                            </li>
                                            <li>
                                                <a class="dropdown-item" href="#" @click.prevent="setFilter('likes')">
                                                    <i class="fas fa-heart me-2"></i>
                                                    Lượt thích
                                                    <span v-if="filter === 'likes'" class="ms-auto">
                                                        <i class="fas fa-check"></i>
                                                    </span>
                                                </a>
                                            </li>
                                            <li>
                                                <a class="dropdown-item" href="#" @click.prevent="setFilter('comments')">
                                                    <i class="fas fa-comment me-2"></i>
                                                    Bình luận
                                                    <span v-if="filter === 'comments'" class="ms-auto">
                                                        <i class="fas fa-check"></i>
                                                    </span>
                                                </a>
                                            </li>
                                            <li>
                                                <a class="dropdown-item" href="#" @click.prevent="setFilter('follows')">
                                                    <i class="fas fa-user-plus me-2"></i>
                                                    Theo dõi
                                                    <span v-if="filter === 'follows'" class="ms-auto">
                                                        <i class="fas fa-check"></i>
                                                    </span>
                                                </a>
                                            </li>
                                            <li>
                                                <a class="dropdown-item" href="#" @click.prevent="setFilter('mentions')">
                                                    <i class="fas fa-at me-2"></i>
                                                    Nhắc đến
                                                    <span v-if="filter === 'mentions'" class="ms-auto">
                                                        <i class="fas fa-check"></i>
                                                    </span>
                                                </a>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Content -->
                <div class="col-12">
                    <!-- Loading State -->
                    <div v-if="isLoading" class="text-center py-5">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Đang tải...</span>
                        </div>
                        <p class="mt-3 text-muted">Đang tải thông báo...</p>
                    </div>

                    <!-- Empty State -->
                    <div v-else-if="filteredNotifications.length === 0" class="text-center py-5">
                        <i class="fas fa-bell-slash fa-3x text-muted mb-3"></i>
                        <h5>Không có thông báo</h5>
                        <p class="text-muted">
                            {{ getEmptyStateMessage() }}
                        </p>
                    </div>

                    <!-- Notifications List -->
                    <div v-else class="notifications-list">
                        <div
                            v-for="notification in filteredNotifications"
                            :key="notification.id"
                            :class="[
                                'notification-item',
                                { 'unread': !notification.isRead },
                                { 'clicking': clickingNotification === notification.id }
                            ]"
                            @click="handleNotificationClick(notification)"
                        >
                            <div class="card">
                                <div class="card-body p-3">
                                    <div class="d-flex">
                                        <!-- Notification Icon -->
                                        <div class="notification-icon me-3">
                                            <div :class="['icon-wrapper', getNotificationIconClass(notification.type)]">
                                                <i :class="getNotificationIcon(notification.type)"></i>
                                            </div>
                                        </div>

                                        <!-- Notification Content -->
                                        <div class="notification-content flex-grow-1">
                                            <div class="d-flex justify-content-between align-items-start">
                                                <div class="notification-text">
                                                    <!-- User Avatar (for user-related notifications) -->
                                                    <div v-if="notification.actor" class="d-flex align-items-start">
                                                        <img
                                                            :src="notification.actor.avatar"
                                                            :alt="notification.actor.name"
                                                            class="rounded-circle me-2"
                                                            width="32"
                                                            height="32"
                                                        >
                                                        <div>
                                                            <p class="mb-1">
                                                                <router-link
                                                                    :to="{ name: 'Profile', params: { userId: notification.actor.id } }"
                                                                    class="fw-bold text-decoration-none"
                                                                >
                                                                    {{ notification.actor.name }}
                                                                </router-link>
                                                                {{ getNotificationText(notification) }}
                                                            </p>
                                                            <div class="notification-meta">
                                                                <small class="text-muted">
                                                                    {{ formatTimeAgo(notification.createdAt) }}
                                                                </small>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- System notifications -->
                                                    <div v-else>
                                                        <p class="mb-1">{{ notification.message }}</p>
                                                        <div class="notification-meta">
                                                            <small class="text-muted">
                                                                {{ formatTimeAgo(notification.createdAt) }}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Actions -->
                                                <div class="notification-actions">
                                                    <div class="dropdown">
                                                        <button
                                                            class="btn btn-sm btn-link text-muted"
                                                            data-bs-toggle="dropdown"
                                                            aria-expanded="false"
                                                            @click.stop
                                                        >
                                                            <i class="fas fa-ellipsis-h"></i>
                                                        </button>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li v-if="!notification.isRead">
                                                                <a class="dropdown-item" href="#" @click.prevent="markAsRead(notification.id)">
                                                                    <i class="fas fa-check me-2"></i>
                                                                    Đánh dấu đã đọc
                                                                </a>
                                                            </li>
                                                            <li v-else>
                                                                <a class="dropdown-item" href="#" @click.prevent="markAsUnread(notification.id)">
                                                                    <i class="fas fa-circle me-2"></i>
                                                                    Đánh dấu chưa đọc
                                                                </a>
                                                            </li>
                                                            <li>
                                                                <a class="dropdown-item text-danger" href="#" @click.prevent="deleteNotification(notification.id)">
                                                                    <i class="fas fa-trash me-2"></i>
                                                                    Xóa
                                                                </a>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Notification Preview (for posts/comments) -->
                                            <div v-if="notification.preview" class="notification-preview mt-2">
                                                <div class="preview-content p-2 bg-light rounded">
                                                    <small class="text-muted">{{ notification.preview }}</small>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Unread Indicator -->
                                        <div v-if="!notification.isRead" class="unread-indicator">
                                            <div class="unread-dot"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Load More -->
                        <div v-if="hasMoreNotifications" class="text-center mt-4">
                            <button
                                class="btn btn-outline-primary"
                                @click="loadMoreNotifications"
                                :disabled="isLoadingMore"
                            >
                                <i v-if="isLoadingMore" class="fas fa-spinner fa-spin me-2"></i>
                                {{ isLoadingMore ? 'Đang tải...' : 'Tải thêm' }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { formatTimeAgo } from '@/filters/dateFilter'
import { notificationAPI } from '@/api/services/notificationService'

// Composables
const router = useRouter()
const toast = useToast()

// Reactive data
const notifications = ref([])
const filter = ref('all')
const isLoading = ref(true)
const isLoadingMore = ref(false)
const isMarkingAllRead = ref(false)
const hasMoreNotifications = ref(true)
const currentPage = ref(1)
const clickingNotification = ref(null)

// WebSocket connection for real-time updates
let websocket = null

// Computed
const filteredNotifications = computed(() => {
    if (filter.value === 'all') {
        return notifications.value
    }
    if (filter.value === 'unread') {
        return notifications.value.filter(n => !n.isRead)
    }
    return notifications.value.filter(n => n.type === filter.value)
})

const unreadCount = computed(() => {
    return notifications.value.filter(n => !n.isRead).length
})

// Filter labels
const filterLabels = {
    all: 'Tất cả',
    unread: 'Chưa đọc',
    likes: 'Lượt thích',
    comments: 'Bình luận',
    follows: 'Theo dõi',
    mentions: 'Nhắc đến'
}

// Methods
const getCurrentFilterLabel = () => {
    return filterLabels[filter.value] || 'Tất cả'
}

const setFilter = (newFilter) => {
    filter.value = newFilter
}

const getEmptyStateMessage = () => {
    if (filter.value === 'all') {
        return 'Bạn chưa có thông báo nào'
    }
    if (filter.value === 'unread') {
        return 'Bạn đã đọc hết tất cả thông báo'
    }
    return `Không có thông báo ${filterLabels[filter.value].toLowerCase()}`
}

const getNotificationIcon = (type) => {
    const icons = {
        like: 'fas fa-heart',
        comment: 'fas fa-comment',
        follow: 'fas fa-user-plus',
        mention: 'fas fa-at',
        system: 'fas fa-info-circle'
    }
    return icons[type] || 'fas fa-bell'
}

const getNotificationIconClass = (type) => {
    const classes = {
        like: 'like',
        comment: 'comment',
        follow: 'follow',
        mention: 'mention',
        system: 'system'
    }
    return classes[type] || 'default'
}

const getNotificationText = (notification) => {
    const texts = {
        like: 'đã thích bài viết của bạn',
        comment: 'đã bình luận bài viết của bạn',
        follow: 'đã theo dõi bạn',
        mention: 'đã nhắc đến bạn trong một bài viết'
    }
    return texts[notification.type] || notification.message
}

const handleNotificationClick = async (notification) => {
    try {
        clickingNotification.value = notification.id
        
        // Mark as read if unread
        if (!notification.isRead) {
            await markAsRead(notification.id)
        }

        // Navigate to related content
        if (notification.targetType && notification.targetId) {
            switch (notification.targetType) {
                case 'post':
                    router.push({ name: 'PostDetail', params: { postId: notification.targetId } })
                    break
                case 'user':
                    router.push({ name: 'Profile', params: { userId: notification.targetId } })
                    break
                case 'conversation':
                    router.push({ name: 'Conversation', params: { conversationId: notification.targetId } })
                    break
                default:
                    break
            }
        }
    } catch (error) {
        console.error('Handle notification click error:', error)
        toast.error('Có lỗi xảy ra')
    } finally {
        setTimeout(() => {
            clickingNotification.value = null
        }, 150)
    }
}

const markAsRead = async (notificationId) => {
    try {
        await notificationAPI.markAsRead(notificationId)
        
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) {
            notification.isRead = true
        }
    } catch (error) {
        console.error('Mark as read error:', error)
        toast.error('Có lỗi xảy ra khi đánh dấu đã đọc')
    }
}

const markAsUnread = async (notificationId) => {
    try {
        await notificationAPI.markAsUnread(notificationId)
        
        const notification = notifications.value.find(n => n.id === notificationId)
        if (notification) {
            notification.isRead = false
        }
    } catch (error) {
        console.error('Mark as unread error:', error)
        toast.error('Có lỗi xảy ra khi đánh dấu chưa đọc')
    }
}

const markAllAsRead = async () => {
    try {
        isMarkingAllRead.value = true
        
        await notificationAPI.markAllAsRead()
        
        notifications.value.forEach(notification => {
            notification.isRead = true
        })
        
        toast.success('Đã đánh dấu tất cả thông báo đã đọc')
    } catch (error) {
        console.error('Mark all as read error:', error)
        toast.error('Có lỗi xảy ra khi đánh dấu tất cả đã đọc')
    } finally {
        isMarkingAllRead.value = false
    }
}

const deleteNotification = async (notificationId) => {
    try {
        await notificationAPI.delete(notificationId)
        
        notifications.value = notifications.value.filter(n => n.id !== notificationId)
        toast.success('Đã xóa thông báo')
    } catch (error) {
        console.error('Delete notification error:', error)
        toast.error('Có lỗi xảy ra khi xóa thông báo')
    }
}

const loadNotifications = async (page = 1) => {
    try {
        const response = await notificationAPI.getNotifications({
            page,
            limit: 20
        })
        
        if (page === 1) {
            notifications.value = response.data.notifications
        } else {
            notifications.value.push(...response.data.notifications)
        }
        
        hasMoreNotifications.value = response.data.hasMore
        currentPage.value = page
    } catch (error) {
        console.error('Load notifications error:', error)
        toast.error('Có lỗi xảy ra khi tải thông báo')
    }
}

const loadMoreNotifications = async () => {
    if (isLoadingMore.value || !hasMoreNotifications.value) return
    
    try {
        isLoadingMore.value = true
        await loadNotifications(currentPage.value + 1)
    } catch (error) {
        console.error('Load more notifications error:', error)
        toast.error('Có lỗi xảy ra khi tải thêm thông báo')
    } finally {
        isLoadingMore.value = false
    }
}

const setupWebSocket = () => {
    try {
        const wsUrl = `${process.env.VUE_APP_WS_URL}/notifications`
        websocket = new WebSocket(wsUrl)
        
        websocket.onmessage = (event) => {
            const notification = JSON.parse(event.data)
            notifications.value.unshift(notification)
            
            // Show toast for new notifications
            toast.info(`Thông báo mới: ${getNotificationText(notification)}`)
        }
        
        websocket.onerror = (error) => {
            console.error('WebSocket error:', error)
        }
        
        websocket.onclose = () => {
            // Reconnect after 5 seconds
            setTimeout(setupWebSocket, 5000)
        }
    } catch (error) {
        console.error('WebSocket setup error:', error)
    }
}

// Lifecycle
onMounted(async () => {
    try {
        await loadNotifications()
        setupWebSocket()
    } catch (error) {
        console.error('Mount error:', error)
    } finally {
        isLoading.value = false
    }
})

onUnmounted(() => {
    if (websocket) {
        websocket.close()
    }
})
</script>

<style lang="scss" scoped>
.notifications-view {
    min-height: 100vh;
    background-color: #f8f9fa;

    .notifications-header {
        .dropdown-menu {
            .dropdown-item {
                display: flex;
                align-items: center;
                justify-content: space-between;
                
                .ms-auto {
                    margin-left: auto;
                }
            }
        }
    }

    .notifications-list {
        .notification-item {
            margin-bottom: 0.75rem;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
                transform: translateY(-1px);
            }

            &.clicking {
                transform: scale(0.98);
            }

            &.unread {
                .card {
                    border-left: 4px solid #0d6efd;
                    background-color: #f8f9ff;
                }
            }

            .card {
                border: 1px solid #e9ecef;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                transition: all 0.2s ease;

                &:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                }
            }

            .notification-icon {
                .icon-wrapper {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 1.1rem;

                    &.like {
                        background-color: #ffe6e6;
                        color: #dc3545;
                    }

                    &.comment {
                        background-color: #e6f3ff;
                        color: #0d6efd;
                    }

                    &.follow {
                        background-color: #e6ffe6;
                        color: #198754;
                    }

                    &.mention {
                        background-color: #fff3e6;
                        color: #fd7e14;
                    }

                    &.system {
                        background-color: #f0f0f0;
                        color: #6c757d;
                    }

                    &.default {
                        background-color: #f8f9fa;
                        color: #6c757d;
                    }
                }
            }

            .notification-content {
                .notification-text {
                    line-height: 1.4;
                }

                .notification-preview {
                    .preview-content {
                        border-left: 3px solid #dee2e6;
                        font-style: italic;
                    }
                }
            }

            .notification-actions {
                .dropdown-toggle {
                    border: none;
                    background: none;
                    padding: 0.25rem 0.5rem;

                    &:hover {
                        background-color: #f8f9fa;
                        border-radius: 0.25rem;
                    }
                }
            }

            .unread-indicator {
                display: flex;
                align-items: flex-start;
                padding-top: 0.5rem;

                .unread-dot {
                    width: 8px;
                    height: 8px;
                    background-color: #0d6efd;
                    border-radius: 50%;
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .notifications-view {
        .notifications-header {
            .row {
                flex-direction: column;
                gap: 1rem;
            }

            .d-flex {
                justify-content: center !important;
            }
        }

        .notification-item {
            .notification-icon {
                .icon-wrapper {
                    width: 32px;
                    height: 32px;
                    font-size: 0.9rem;
                }
            }
        }
    }
}
</style>