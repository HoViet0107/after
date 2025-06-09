<template>
    <div class="mobile-layout">
        <!-- Mobile Header -->
        <header class="mobile-header">
            <div class="header-content">
                <div class="header-left">
                    <button v-if="showBackButton" class="btn btn-ghost back-btn" @click="handleBack">
                        <i class="fas fa-arrow-left"></i>
                    </button>

                    <h1 class="page-title">{{ pageTitle }}</h1>
                </div>

                <div class="header-right">
                    <button v-if="showSearch" class="btn btn-ghost header-action" @click="openSearch">
                        <i class="fas fa-search"></i>
                    </button>

                    <button v-if="showNotifications" class="btn btn-ghost header-action" @click="openNotifications">
                        <i class="fas fa-bell"></i>
                        <div v-if="unreadNotificationsCount > 0" class="notification-badge">
                            {{ unreadNotificationsCount }}
                        </div>
                    </button>

                    <button v-if="showMenu" class="btn btn-ghost header-action" @click="toggleMobileMenu">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="mobile-main">
            <div class="content-wrapper">
                <router-view />
            </div>

            <!-- Pull to refresh indicator -->
            <div v-if="isPullingToRefresh" class="pull-to-refresh-indicator">
                <i class="fas fa-arrow-down"></i>
                <span>Kéo để làm mới</span>
            </div>
        </main>

        <!-- Bottom Navigation -->
        <nav class="mobile-bottom-nav">
            <router-link v-for="item in bottomNavItems" :key="item.name" :to="item.path"
                :class="['nav-item', { active: isActiveRoute(item.path) }]">
                <div class="nav-icon">
                    <i :class="item.icon"></i>
                    <div v-if="item.badge" class="nav-badge">{{ item.badge }}</div>
                </div>
                <span class="nav-label">{{ item.label }}</span>
            </router-link>
        </nav>

        <!-- Mobile Menu Overlay -->
        <div v-if="showMobileMenu" class="mobile-menu-overlay" @click="closeMobileMenu">
            <div class="mobile-menu" @click.stop>
                <div class="menu-header">
                    <UserAvatar :src="currentUser?.avatar" :name="currentUser?.name" size="lg" />
                    <div class="user-info">
                        <h6>{{ currentUser?.name }}</h6>
                        <p>@{{ currentUser?.username }}</p>
                    </div>
                    <button class="btn btn-ghost close-btn" @click="closeMobileMenu">
                        <i class="fas fa-times"></i>
                    </button>
                </div>

                <div class="menu-content">
                    <router-link v-for="item in menuItems" :key="item.name" :to="item.path" class="menu-item"
                        @click="closeMobileMenu">
                        <i :class="item.icon"></i>
                        <span>{{ item.label }}</span>
                    </router-link>

                    <hr>

                    <button class="menu-item" @click="toggleTheme">
                        <i :class="isDarkMode ? 'fas fa-sun' : 'fas fa-moon'"></i>
                        <span>{{ isDarkMode ? 'Chế độ sáng' : 'Chế độ tối' }}</span>
                    </button>

                    <button class="menu-item text-danger" @click="handleLogout">
                        <i class="fas fa-sign-out-alt"></i>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Toast Container -->
        <div id="mobile-toasts"></div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useNotificationStore } from '@/stores/notification'
import { useConversationStore } from '@/stores/conversation'
import UserAvatar from '@/components/user/UserAvatar.vue'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()
const notificationStore = useNotificationStore()
const conversationStore = useConversationStore()

// State
const showMobileMenu = ref(false)
const isPullingToRefresh = ref(false)
const pullStartY = ref(0)
const pullDistance = ref(0)

// Computed
const currentUser = computed(() => authStore.user)
const isDarkMode = computed(() => uiStore.isDarkMode)
const unreadNotificationsCount = computed(() => notificationStore.unreadCount)
const unreadMessagesCount = computed(() => conversationStore.unreadCount)

const pageTitle = computed(() => {
    const routeMeta = route.meta
    return routeMeta?.title || 'Social Connect'
})

const showBackButton = computed(() => {
    const noBackRoutes = ['/app/feed', '/app/search', '/app/chat', '/app/notifications']
    return !noBackRoutes.includes(route.path)
})

const showSearch = computed(() => {
    return route.path !== '/app/search'
})

const showNotifications = computed(() => {
    return route.path !== '/app/notifications'
})

const showMenu = computed(() => {
    return true
})

const bottomNavItems = computed(() => [
    {
        name: 'feed',
        path: '/app/feed',
        label: 'Trang chủ',
        icon: 'fas fa-home'
    },
    {
        name: 'search',
        path: '/app/search',
        label: 'Tìm kiếm',
        icon: 'fas fa-search'
    },
    {
        name: 'chat',
        path: '/app/chat',
        label: 'Tin nhắn',
        icon: 'fas fa-comment',
        badge: unreadMessagesCount.value > 0 ? unreadMessagesCount.value : null
    },
    {
        name: 'notifications',
        path: '/app/notifications',
        label: 'Thông báo',
        icon: 'fas fa-bell',
        badge: unreadNotificationsCount.value > 0 ? unreadNotificationsCount.value : null
    },
    {
        name: 'profile',
        path: `/app/profile/${currentUser.value?.id}`,
        label: 'Hồ sơ',
        icon: 'fas fa-user'
    }
])

const menuItems = computed(() => [
    {
        name: 'profile',
        path: `/app/profile/${currentUser.value?.id}`,
        label: 'Hồ sơ của tôi',
        icon: 'fas fa-user'
    },
    {
        name: 'saved',
        path: '/app/saved',
        label: 'Đã lưu',
        icon: 'fas fa-bookmark'
    },
    {
        name: 'settings',
        path: '/app/settings',
        label: 'Cài đặt',
        icon: 'fas fa-cog'
    },
    {
        name: 'help',
        path: '/app/help',
        label: 'Trợ giúp',
        icon: 'fas fa-question-circle'
    }
])

// Actions
const isActiveRoute = (path) => {
    if (path === '/app/feed') {
        return route.path === path || route.path === '/app'
    }
    return route.path.startsWith(path)
}

const handleBack = () => {
    if (window.history.length > 1) {
        router.back()
    } else {
        router.push('/app/feed')
    }
}

const openSearch = () => {
    router.push('/app/search')
}

const openNotifications = () => {
    router.push('/app/notifications')
}

const toggleMobileMenu = () => {
    showMobileMenu.value = !showMobileMenu.value
}

const closeMobileMenu = () => {
    showMobileMenu.value = false
}

const toggleTheme = () => {
    uiStore.toggleTheme()
    closeMobileMenu()
}

const handleLogout = async () => {
    closeMobileMenu()

    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        try {
            await authStore.logout()
            router.push('/auth/login')
        } catch (error) {
            console.error('Logout error:', error)
        }
    }
}

// Pull to refresh
const handleTouchStart = (event) => {
    if (window.scrollY === 0) {
        pullStartY.value = event.touches[0].clientY
    }
}

const handleTouchMove = (event) => {
    if (pullStartY.value > 0) {
        const currentY = event.touches[0].clientY
        pullDistance.value = Math.max(0, currentY - pullStartY.value)

        if (pullDistance.value > 50) {
            isPullingToRefresh.value = true
        }
    }
}

const handleTouchEnd = () => {
    if (isPullingToRefresh.value && pullDistance.value > 100) {
        // Trigger refresh
        window.location.reload()
    }

    // Reset
    isPullingToRefresh.value = false
    pullStartY.value = 0
    pullDistance.value = 0
}

// Lifecycle
onMounted(() => {
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
})

onUnmounted(() => {
    document.removeEventListener('touchstart', handleTouchStart)
    document.removeEventListener('touchmove', handleTouchMove)
    document.removeEventListener('touchend', handleTouchEnd)
})
</script>

<style lang="scss" scoped>
.mobile-layout {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bs-light);

    .mobile-header {
        background: white;
        border-bottom: 1px solid var(--bs-border-color);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        position: sticky;
        top: 0;
        z-index: 1000;

        .header-content {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;

            .header-left {
                display: flex;
                align-items: center;
                gap: 1rem;
                flex: 1;
                min-width: 0;

                .back-btn {
                    flex-shrink: 0;
                }

                .page-title {
                    margin: 0;
                    font-size: 1.25rem;
                    font-weight: 600;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }

            .header-right {
                display: flex;
                gap: 0.5rem;

                .header-action {
                    position: relative;

                    .notification-badge {
                        position: absolute;
                        top: -4px;
                        right: -4px;
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
            }
        }
    }

    .mobile-main {
        flex: 1;
        overflow-y: auto;
        position: relative;

        .content-wrapper {
            min-height: 100%;
            padding-bottom: 80px; // Space for bottom nav
        }

        .pull-to-refresh-indicator {
            position: absolute;
            top: -60px;
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            align-items: center;
            gap: 0.5rem;
            padding: 1rem;
            background: var(--bs-primary);
            color: white;
            border-radius: 2rem;
            font-size: 0.875rem;
            z-index: 10;

            i {
                animation: bounce 1s infinite;
            }
        }
    }

    .mobile-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-top: 1px solid var(--bs-border-color);
        display: flex;
        z-index: 1000;

        .nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 0.5rem;
            text-decoration: none;
            color: var(--bs-secondary);
            transition: color 0.2s ease;

            &:hover {
                text-decoration: none;
            }

            &.active {
                color: var(--bs-primary);

                .nav-icon i {
                    transform: scale(1.1);
                }
            }

            .nav-icon {
                position: relative;
                margin-bottom: 0.25rem;

                i {
                    font-size: 1.25rem;
                    transition: transform 0.2s ease;
                }

                .nav-badge {
                    position: absolute;
                    top: -6px;
                    right: -6px;
                    background: var(--bs-danger);
                    color: white;
                    font-size: 0.625rem;
                    font-weight: 600;
                    padding: 0.125rem 0.25rem;
                    border-radius: 0.75rem;
                    min-width: 14px;
                    text-align: center;
                }
            }

            .nav-label {
                font-size: 0.75rem;
                font-weight: 500;
                text-align: center;
            }
        }
    }

    .mobile-menu-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 2000;
        display: flex;
        justify-content: flex-end;

        .mobile-menu {
            background: white;
            width: 80%;
            max-width: 300px;
            height: 100%;
            display: flex;
            flex-direction: column;

            .menu-header {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 2rem 1rem 1rem 1rem;
                background: var(--bs-primary);
                color: white;

                .user-info {
                    flex: 1;
                    min-width: 0;

                    h6 {
                        margin: 0 0 0.25rem 0;
                        font-weight: 600;
                    }

                    p {
                        margin: 0;
                        opacity: 0.8;
                        font-size: 0.875rem;
                    }
                }

                .close-btn {
                    color: white;

                    &:hover {
                        background: rgba(255, 255, 255, 0.1);
                    }
                }
            }

            .menu-content {
                flex: 1;
                padding: 1rem 0;

                .menu-item {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    width: 100%;
                    padding: 1rem 1.5rem;
                    text-decoration: none;
                    color: var(--bs-body-color);
                    background: none;
                    border: none;
                    text-align: left;
                    transition: background-color 0.2s ease;

                    &:hover {
                        background: var(--bs-light);
                        text-decoration: none;
                    }

                    &.text-danger {
                        color: var(--bs-danger);
                    }

                    i {
                        width: 20px;
                        text-align: center;
                    }

                    span {
                        font-weight: 500;
                    }
                }

                hr {
                    margin: 1rem 0;
                }
            }
        }
    }
}

.btn-ghost {
    background: none;
    border: none;
    color: var(--bs-secondary);
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;

    &:hover {
        background: var(--bs-light);
        color: var(--bs-body-color);
    }
}

@keyframes bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-10px);
    }

    60% {
        transform: translateY(-5px);
    }
}

// Safe area adjustments for devices with notches
@supports (padding-bottom: env(safe-area-inset-bottom)) {
    .mobile-bottom-nav {
        padding-bottom: env(safe-area-inset-bottom);
    }
}
</style>