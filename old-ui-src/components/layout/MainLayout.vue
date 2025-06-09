<template>
    <div class="main-layout">
        <!-- Header -->
        <AppHeader />

        <div class="layout-body">
            <!-- Sidebar -->
            <AppSidebar :collapsed="isSidebarCollapsed" @toggle="toggleSidebar" />

            <!-- Main Content -->
            <main :class="['main-content', { 'sidebar-collapsed': isSidebarCollapsed }]">
                <div class="content-wrapper">
                    <router-view />
                </div>
            </main>

            <!-- Right Panel (optional) -->
            <aside v-if="showRightPanel" class="right-panel">
                <div class="panel-content">
                    <!-- Trending Topics -->
                    <div class="widget trending-widget">
                        <h6 class="widget-title">Xu hướng</h6>
                        <TrendingTopics />
                    </div>

                    <!-- Suggested Users -->
                    <div class="widget suggestions-widget">
                        <h6 class="widget-title">Gợi ý kết bạn</h6>
                        <div class="suggestions-list">
                            <UserListItem v-for="user in suggestedUsers" :key="user.id" :user="user" :show-bio="false"
                                :show-follow-button="true" :show-message-button="false" :show-more-actions="false" />
                        </div>
                    </div>
                </div>
            </aside>
        </div>

        <!-- Mobile Bottom Navigation -->
        <nav v-if="isMobile" class="mobile-bottom-nav">
            <router-link to="/app/feed" class="nav-item">
                <i class="fas fa-home"></i>
                <span>Trang chủ</span>
            </router-link>
            <router-link to="/app/search" class="nav-item">
                <i class="fas fa-search"></i>
                <span>Tìm kiếm</span>
            </router-link>
            <router-link to="/app/chat" class="nav-item">
                <i class="fas fa-comment"></i>
                <span>Tin nhắn</span>
                <div v-if="unreadMessagesCount > 0" class="badge">{{ unreadMessagesCount }}</div>
            </router-link>
            <router-link to="/app/notifications" class="nav-item">
                <i class="fas fa-bell"></i>
                <span>Thông báo</span>
                <div v-if="unreadNotificationsCount > 0" class="badge">{{ unreadNotificationsCount }}</div>
            </router-link>
            <router-link :to="`/app/profile/${currentUser?.id}`" class="nav-item">
                <UserAvatar :src="currentUser?.avatar" :name="currentUser?.name" size="xs" />
                <span>Hồ sơ</span>
            </router-link>
        </nav>

        <!-- Global Components -->
        <div id="modals-root"></div>
        <div id="toasts-root"></div>
    </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useConversationStore } from '@/stores/conversation'
import { useNotificationStore } from '@/stores/notification'
import { useUserStore } from '@/stores/user'
import { useBreakpoints } from '@/composables/useBreakpoints'
import AppHeader from '../common/AppHeader.vue'
import AppSidebar from '../common/AppSidebar.vue'
import TrendingTopics from '@/components/feed/TrendingTopics.vue'
import UserListItem from '@/components/user/UserListItem.vue'
import UserAvatar from '@/components/user/UserAvatar.vue'

const route = useRoute()
const authStore = useAuthStore()
const uiStore = useUIStore()
const conversationStore = useConversationStore()
const notificationStore = useNotificationStore()
const userStore = useUserStore()
const { isMobile, isTablet } = useBreakpoints()

// Computed
const currentUser = computed(() => authStore.user)
const isSidebarCollapsed = computed(() => uiStore.sidebarCollapsed || isMobile.value)
const unreadMessagesCount = computed(() => conversationStore.unreadCount)
const unreadNotificationsCount = computed(() => notificationStore.unreadCount)
const suggestedUsers = computed(() => userStore.suggestions.slice(0, 3))

const showRightPanel = computed(() => {
    // Don't show right panel on mobile/tablet or specific routes
    if (isMobile.value || isTablet.value) return false

    const hideOnRoutes = ['/app/chat', '/app/settings']
    return !hideOnRoutes.some(routePath => route.path.startsWith(routePath))
})

// Actions
const toggleSidebar = () => {
    uiStore.toggleSidebar()
}

// Handle window resize
const handleResize = () => {
    if (isMobile.value && !uiStore.sidebarCollapsed) {
        uiStore.setSidebarCollapsed(true)
    }
}

// Lifecycle
onMounted(() => {
    window.addEventListener('resize', handleResize)

    // Load initial data
    userStore.fetchSuggestions()
    notificationStore.fetchUnreadCount()
    conversationStore.fetchConversations()
})

onUnmounted(() => {
    window.removeEventListener('resize', handleResize)
})
</script>

<style lang="scss" scoped>
.main-layout {
    display: flex;
    flex-direction: column;
    height: 100vh;
    background: var(--bs-light);

    .layout-body {
        display: flex;
        flex: 1;
        overflow: hidden;

        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
            transition: margin-left 0.3s ease;

            &.sidebar-collapsed {
                margin-left: 0;
            }

            .content-wrapper {
                flex: 1;
                overflow-y: auto;
                padding: 1rem;

                @media (max-width: 768px) {
                    padding: 0.5rem;
                }
            }
        }

        .right-panel {
            width: 300px;
            background: white;
            border-left: 1px solid var(--bs-border-color);
            overflow-y: auto;

            .panel-content {
                padding: 1rem;

                .widget {
                    background: white;
                    border: 1px solid var(--bs-border-color);
                    border-radius: 0.75rem;
                    padding: 1rem;
                    margin-bottom: 1rem;

                    .widget-title {
                        font-weight: 600;
                        margin-bottom: 0.75rem;
                        border-bottom: 1px solid var(--bs-border-color);
                        padding-bottom: 0.5rem;
                    }

                    &.suggestions-widget {
                        .suggestions-list {
                            display: flex;
                            flex-direction: column;
                            gap: 0.75rem;
                        }
                    }
                }
            }
        }
    }

    .mobile-bottom-nav {
        display: flex;
        background: white;
        border-top: 1px solid var(--bs-border-color);
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);

        .nav-item {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 0.75rem 0.5rem;
            text-decoration: none;
            color: var(--bs-secondary);
            font-size: 0.75rem;
            position: relative;
            transition: color 0.2s ease;

            &:hover {
                color: var(--bs-primary);
                text-decoration: none;
            }

            &.router-link-active {
                color: var(--bs-primary);

                i {
                    transform: scale(1.1);
                }
            }

            i {
                font-size: 1.25rem;
                margin-bottom: 0.25rem;
                transition: transform 0.2s ease;
            }

            span {
                font-weight: 500;
            }

            .badge {
                position: absolute;
                top: 0.25rem;
                right: 50%;
                transform: translateX(50%);
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

// Desktop only - hide mobile nav
@media (min-width: 769px) {
    .mobile-bottom-nav {
        display: none;
    }
}

// Mobile adjustments
@media (max-width: 768px) {
    .main-layout {
        .layout-body {
            .main-content {
                .content-wrapper {
                    padding-bottom: 5rem; // Space for bottom nav
                }
            }

            .right-panel {
                display: none;
            }
        }
    }
}
</style>
