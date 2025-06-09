<template>
    <header class="app-header">
        <div class="header-content">
            <!-- Left Section -->
            <div class="header-left">
                <button v-if="isMobile" class="btn btn-ghost sidebar-toggle" @click="toggleSidebar">
                    <i class="fas fa-bars"></i>
                </button>

                <router-link to="/app/feed" class="brand-logo">
                    <i class="fas fa-comments brand-icon"></i>
                    <span class="brand-text">Social Connect</span>
                </router-link>
            </div>

            <!-- Center Section - Search (Desktop) -->
            <div v-if="!isMobile" class="header-center">
                <SearchInput placeholder="Tìm kiếm người dùng, bài viết..." :suggestions="searchSuggestions"
                    :is-loading="isSearching" @search="handleSearch" @select="handleSearchSelect"
                    @focus="handleSearchFocus" @blur="handleSearchBlur" />
            </div>

            <!-- Right Section -->
            <div class="header-right">
                <!-- Search button (Mobile) -->
                <button v-if="isMobile" class="btn btn-ghost header-btn" @click="openMobileSearch">
                    <i class="fas fa-search"></i>
                </button>

                <!-- Notifications -->
                <div class="dropdown notification-dropdown">
                    <button class="btn btn-ghost header-btn" data-bs-toggle="dropdown" aria-expanded="false"
                        @click="markNotificationsAsRead">
                        <i class="fas fa-bell"></i>
                        <div v-if="unreadNotificationsCount > 0" class="notification-badge">
                            {{ unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount }}
                        </div>
                    </button>

                    <div class="dropdown-menu dropdown-menu-end notification-menu">
                        <div class="dropdown-header">
                            <h6>Thông báo</h6>
                            <button v-if="unreadNotificationsCount > 0" class="btn btn-sm btn-outline-primary"
                                @click="markAllNotificationsAsRead">
                                Đánh dấu tất cả đã đọc
                            </button>
                        </div>

                        <div class="notifications-list">
                            <div v-for="notification in recentNotifications" :key="notification.id"
                                :class="['notification-item', { unread: !notification.read }]"
                                @click="handleNotificationClick(notification)">
                                <UserAvatar :src="notification.actor?.avatar" :name="notification.actor?.name"
                                    size="sm" />
                                <div class="notification-content">
                                    <div class="notification-text">{{ notification.message }}</div>
                                    <div class="notification-time">{{ formatRelativeTime(notification.createdAt) }}
                                    </div>
                                </div>
                            </div>

                            <div v-if="recentNotifications.length === 0" class="empty-notifications">
                                <i class="fas fa-bell-slash"></i>
                                <span>Không có thông báo</span>
                            </div>
                        </div>

                        <div class="dropdown-footer">
                            <router-link to="/app/notifications" class="btn btn-sm btn-primary w-100">
                                Xem tất cả thông báo
                            </router-link>
                        </div>
                    </div>
                </div>

                <!-- Messages -->
                <div class="dropdown messages-dropdown">
                    <button class="btn btn-ghost header-btn" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-comment"></i>
                        <div v-if="unreadMessagesCount > 0" class="notification-badge">
                            {{ unreadMessagesCount > 99 ? '99+' : unreadMessagesCount }}
                        </div>
                    </button>

                    <div class="dropdown-menu dropdown-menu-end messages-menu">
                        <div class="dropdown-header">
                            <h6>Tin nhắn</h6>
                            <router-link to="/app/chat" class="btn btn-sm btn-outline-primary">
                                Xem tất cả
                            </router-link>
                        </div>

                        <div class="messages-list">
                            <ConversationItem v-for="conversation in recentConversations" :key="conversation.id"
                                :conversation="conversation" @click="openConversation" />

                            <div v-if="recentConversations.length === 0" class="empty-messages">
                                <i class="fas fa-comment-slash"></i>
                                <span>Không có tin nhắn</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- User Menu -->
                <div class="dropdown user-dropdown">
                    <button class="btn btn-ghost user-menu-btn" data-bs-toggle="dropdown" aria-expanded="false">
                        <UserAvatar :src="currentUser?.avatar" :name="currentUser?.name" size="sm" />
                        <span v-if="!isMobile" class="user-name">{{ currentUser?.name }}</span>
                        <i class="fas fa-chevron-down"></i>
                    </button>

                    <ul class="dropdown-menu dropdown-menu-end user-menu">
                        <li class="user-info">
                            <UserAvatar :src="currentUser?.avatar" :name="currentUser?.name" size="medium" />
                            <div>
                                <div class="user-display-name">{{ currentUser?.name }}</div>
                                <div class="user-username">@{{ currentUser?.username }}</div>
                            </div>
                        </li>
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li>
                            <router-link :to="`/app/profile/${currentUser?.id}`" class="dropdown-item">
                                <i class="fas fa-user me-2"></i>Hồ sơ của tôi
                            </router-link>
                        </li>
                        <li>
                            <router-link to="/app/settings" class="dropdown-item">
                                <i class="fas fa-cog me-2"></i>Cài đặt
                            </router-link>
                        </li>
                        <li>
                            <button class="dropdown-item" @click="toggleTheme">
                                <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'" class="me-2"></i>
                                {{ isDarkMode ? 'Chế độ sáng' : 'Chế độ tối' }}
                            </button>
                        </li>
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li>
                            <button class="dropdown-item text-danger" @click="handleLogout">
                                <i class="fas fa-sign-out-alt me-2"></i>Đăng xuất
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </header>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notification'
import { useConversationStore } from '@/stores/conversation'
import { useBreakpoints } from '@/composables/useBreakpoints'
import { useDebounce } from '@/composables/useDebounce'
import SearchInput from '@/components/common/SearchInput.vue'
import UserAvatar from '@/components/user/UserAvatar.vue'
import ConversationItem from '@/components/conversation/ConversationItem.vue'

const emit = defineEmits(['toggle-sidebar'])

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()
const notificationStore = useNotificationStore()
const conversationStore = useConversationStore()
const { isMobile } = useBreakpoints()

// State
const searchSuggestions = ref([])
const isSearching = ref(false)

// Computed
const currentUser = computed(() => authStore.user)
const isDarkMode = computed(() => uiStore.isDarkMode)
const unreadNotificationsCount = computed(() => notificationStore.unreadCount)
const unreadMessagesCount = computed(() => conversationStore.unreadCount)
const recentNotifications = computed(() => notificationStore.notifications.slice(0, 5))
const recentConversations = computed(() => conversationStore.conversationsList.slice(0, 5))

// Actions
const toggleSidebar = () => {
    emit('toggle-sidebar')
}

const toggleTheme = () => {
    uiStore.toggleTheme()
}

const handleSearch = async (query) => {
    if (!query.trim()) {
        searchSuggestions.value = []
        return
    }

    isSearching.value = true

    try {
        // Implement search logic here
        // const results = await searchService.globalSearch(query)
        // searchSuggestions.value = results

        // Mock suggestions for now
        setTimeout(() => {
            searchSuggestions.value = [
                { id: 1, title: 'John Doe', subtitle: '@johndoe', type: 'user' },
                { id: 2, title: 'JavaScript Tips', subtitle: 'Hashtag', type: 'hashtag' }
            ]
            isSearching.value = false
        }, 300)
    } catch (error) {
        console.error('Search error:', error)
        isSearching.value = false
    }
}

const handleSearchSelect = (suggestion) => {
    if (suggestion.type === 'user') {
        router.push(`/app/profile/${suggestion.id}`)
    } else if (suggestion.type === 'hashtag') {
        router.push(`/app/search?q=${encodeURIComponent(suggestion.title)}`)
    }
}

const handleSearchFocus = () => {
    // Handle search focus
}

const handleSearchBlur = () => {
    // Handle search blur
}

const openMobileSearch = () => {
    router.push('/app/search')
}

const markNotificationsAsRead = () => {
    // Mark notifications as read when dropdown opens
}

const markAllNotificationsAsRead = async () => {
    try {
        await notificationStore.markAllAsRead()
    } catch (error) {
        console.error('Failed to mark notifications as read:', error)
    }
}

const handleNotificationClick = (notification) => {
    // Handle notification click and navigate
    if (!notification.read) {
        notificationStore.markAsRead(notification.id)
    }

    // Navigate based on notification type
    if (notification.type === 'message') {
        router.push(`/app/chat/${notification.data.conversationId}`)
    } else if (notification.type === 'like' || notification.type === 'comment') {
        router.push(`/app/post/${notification.data.postId}`)
    }
}

const openConversation = (conversation) => {
    router.push(`/app/chat/${conversation.id}`)
}

const handleLogout = async () => {
    try {
        await authStore.logout()
        router.push('/auth/login')
    } catch (error) {
        console.error('Logout error:', error)
    }
}

const formatRelativeTime = (date) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInSeconds = Math.floor((now - notificationDate) / 1000)

    if (diffInSeconds < 60) {
        return 'Vừa xong'
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} phút trước`
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} giờ trước`
    } else {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days} ngày trước`
    }
}

// Lifecycle
onMounted(() => {
    notificationStore.fetchNotifications()
    conversationStore.fetchConversations()
})
</script>

<style lang="scss" scoped>
.app-header {
    background: white;
    border-bottom: 1px solid var(--bs-border-color);
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    position: sticky;
    top: 0;
    z-index: 1020;

    .header-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        max-width: 1200px;
        margin: 0 auto;

        .header-left {
            display: flex;
            align-items: center;
            gap: 1rem;

            .sidebar-toggle {
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
            }

            .brand-logo {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                text-decoration: none;
                color: var(--bs-primary);
                font-weight: 700;
                font-size: 1.25rem;

                .brand-icon {
                    font-size: 1.5rem;
                }

                .brand-text {
                    @media (max-width: 480px) {
                        display: none;
                    }
                }
            }
        }

        .header-center {
            flex: 1;
            max-width: 500px;
            margin: 0 2rem;
        }

        .header-right {
            display: flex;
            align-items: center;
            gap: 0.5rem;

            .header-btn {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 40px;
                height: 40px;
                border-radius: 50%;

                .notification-badge {
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    background: var(--bs-danger);
                    color: white;
                    font-size: 0.625rem;
                    font-weight: 600;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.75rem;
                    min-width: 16px;
                    text-align: center;
                }
            }

            .user-menu-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.5rem;
                border-radius: 2rem;

                .user-name {
                    font-weight: 500;
                    max-width: 100px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }

                i {
                    font-size: 0.75rem;
                }
            }
        }
    }
}

.btn-ghost {
    background: none;
    border: none;
    color: var(--bs-secondary);
    transition: all 0.2s ease;

    &:hover {
        background: var(--bs-light);
        color: var(--bs-body-color);
    }
}

// Dropdown menus
.notification-menu,
.messages-menu {
    width: 350px;
    max-height: 400px;

    .dropdown-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0.75rem 1rem;
        border-bottom: 1px solid var(--bs-border-color);

        h6 {
            margin: 0;
            font-weight: 600;
        }
    }

    .notifications-list,
    .messages-list {
        max-height: 250px;
        overflow-y: auto;
    }

    .notification-item {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
            background: var(--bs-light);
        }

        &.unread {
            background: rgba(var(--bs-primary-rgb), 0.05);

            &::before {
                content: '';
                position: absolute;
                left: 0;
                top: 0;
                bottom: 0;
                width: 3px;
                background: var(--bs-primary);
            }
        }

        .notification-content {
            flex: 1;
            min-width: 0;

            .notification-text {
                font-size: 0.875rem;
                line-height: 1.4;
                margin-bottom: 0.25rem;
            }

            .notification-time {
                font-size: 0.75rem;
                color: var(--bs-secondary);
            }
        }
    }

    .empty-notifications,
    .empty-messages {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
        color: var(--bs-secondary);

        i {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
    }

    .dropdown-footer {
        padding: 0.75rem 1rem;
        border-top: 1px solid var(--bs-border-color);
    }
}

.user-menu {
    width: 250px;

    .user-info {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 1rem;

        .user-display-name {
            font-weight: 600;
        }

        .user-username {
            font-size: 0.875rem;
            color: var(--bs-secondary);
        }
    }

    .dropdown-item {
        display: flex;
        align-items: center;

        i {
            width: 20px;
            text-align: center;
        }
    }
}

// Mobile adjustments
@media (max-width: 768px) {
    .app-header {
        .header-content {
            padding: 0.5rem 1rem;

            .header-center {
                display: none;
            }

            .header-right {
                gap: 0.25rem;

                .user-name {
                    display: none;
                }
            }
        }
    }

    .notification-menu,
    .messages-menu {
        width: 90vw;
        max-width: 300px;
    }
}
</style>