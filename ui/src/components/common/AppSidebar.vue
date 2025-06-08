<template>
    <aside :class="['app-sidebar', { collapsed }]">
        <nav class="sidebar-nav">
            <!-- Main Navigation -->
            <div class="nav-section">
                <router-link v-for="item in mainNavItems" :key="item.name" :to="item.path"
                    :class="['nav-item', { active: isActiveRoute(item.path) }]" @click="handleNavClick">
                    <i :class="item.icon"></i>
                    <span class="nav-text">{{ item.label }}</span>
                    <div v-if="item.badge" class="nav-badge">{{ item.badge }}</div>
                </router-link>
            </div>

            <!-- Quick Access -->
            <div v-if="!collapsed" class="nav-section">
                <h6 class="section-title">Truy cập nhanh</h6>
                <router-link v-for="conversation in quickConversations" :key="conversation.id"
                    :to="`/app/chat/${conversation.id}`" class="nav-item conversation-item" @click="handleNavClick">
                    <UserAvatar v-if="!conversation.isGroupChat" :src="getOtherParticipant(conversation)?.avatar"
                        :name="getOtherParticipant(conversation)?.name" :show-online-status="true"
                        :is-online="getOtherParticipant(conversation)?.isOnline" size="xs" />
                    <div v-else class="group-avatar-small">
                        <i class="fas fa-users"></i>
                    </div>
                    <span class="nav-text">{{ getConversationTitle(conversation) }}</span>
                    <div v-if="conversation.unreadCount > 0" class="nav-badge">
                        {{ conversation.unreadCount }}
                    </div>
                </router-link>
            </div>

            <!-- User Actions -->
            <div class="nav-section nav-actions">
                <button class="nav-item nav-button" @click="createPost">
                    <i class="fas fa-plus"></i>
                    <span class="nav-text">Tạo bài viết</span>
                </button>

                <button class="nav-item nav-button" @click="toggleSidebar">
                    <i :class="collapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left'"></i>
                    <span class="nav-text">{{ collapsed ? 'Mở rộng' : 'Thu gọn' }}</span>
                </button>
            </div>
        </nav>
    </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useNotificationStore } from '@/stores/notification'
import { useBreakpoints } from '@/composables/useBreakpoints'
import UserAvatar from '@/components/user/UserAvatar.vue'

const props = defineProps({
    collapsed: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['toggle'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const notificationStore = useNotificationStore()
const { isMobile } = useBreakpoints()

// Computed
const currentUser = computed(() => authStore.user)
const quickConversations = computed(() =>
    conversationStore.conversationsList.slice(0, 5)
)

const mainNavItems = computed(() => [
    {
        name: 'feed',
        path: '/app/feed',
        label: 'Trang chủ',
        icon: 'fas fa-home'
    },
    {
        name: 'search',
        path: '/app/search',
        label: 'Khám phá',
        icon: 'fas fa-compass'
    },
    {
        name: 'notifications',
        path: '/app/notifications',
        label: 'Thông báo',
        icon: 'fas fa-bell',
        badge: notificationStore.unreadCount > 0 ? notificationStore.unreadCount : null
    },
    {
        name: 'messages',
        path: '/app/chat',
        label: 'Tin nhắn',
        icon: 'fas fa-comment',
        badge: conversationStore.unreadCount > 0 ? conversationStore.unreadCount : null
    },
    {
        name: 'saved',
        path: '/app/saved',
        label: 'Đã lưu',
        icon: 'fas fa-bookmark'
    },
    {
        name: 'profile',
        path: `/app/profile/${currentUser.value?.id}`,
        label: 'Hồ sơ',
        icon: 'fas fa-user'
    },
    {
        name: 'settings',
        path: '/app/settings',
        label: 'Cài đặt',
        icon: 'fas fa-cog'
    }
])

// Actions
const isActiveRoute = (path) => {
    if (path === '/app/feed') {
        return route.path === path || route.path === '/app'
    }
    return route.path.startsWith(path)
}

const handleNavClick = () => {
    if (isMobile.value) {
        emit('toggle')
    }
}

const toggleSidebar = () => {
    emit('toggle')
}

const createPost = () => {
    // Navigate to create post or open modal
    router.push('/app/create')
}

const getOtherParticipant = (conversation) => {
    if (conversation.isGroupChat) return null
    return conversation.participants?.find(p => p.id !== currentUser.value?.id)
}

const getConversationTitle = (conversation) => {
    if (conversation.title) return conversation.title

    if (conversation.isGroupChat) {
        return 'Nhóm chat'
    }

    const otherParticipant = getOtherParticipant(conversation)
    return otherParticipant?.name || 'Cuộc trò chuyện'
}
</script>

<style lang="scss" scoped>
.app-sidebar {
    width: 280px;
    background: white;
    border-right: 1px solid var(--bs-border-color);
    height: 100%;
    overflow-y: auto;
    transition: all 0.3s ease;
    position: relative;

    &.collapsed {
        width: 80px;

        .nav-text {
            display: none;
        }

        .section-title {
            display: none;
        }

        .nav-item {
            justify-content: center;

            .nav-badge {
                position: absolute;
                top: 0.5rem;
                right: 0.5rem;
            }
        }

        .conversation-item {
            display: none;
        }
    }

    .sidebar-nav {
        padding: 1rem 0;
        height: 100%;
        display: flex;
        flex-direction: column;

        .nav-section {
            margin-bottom: 2rem;

            &.nav-actions {
                margin-top: auto;
                margin-bottom: 1rem;
            }

            .section-title {
                padding: 0 1rem;
                margin-bottom: 0.75rem;
                font-size: 0.875rem;
                font-weight: 600;
                color: var(--bs-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .nav-item {
                display: flex;
                align-items: center;
                gap: 1rem;
                padding: 0.75rem 1rem;
                color: var(--bs-body-color);
                text-decoration: none;
                transition: all 0.2s ease;
                position: relative;
                border-radius: 0;

                &:hover {
                    background: var(--bs-light);
                    color: var(--bs-primary);
                    text-decoration: none;
                }

                &.active {
                    background: rgba(var(--bs-primary-rgb), 0.1);
                    color: var(--bs-primary);
                    border-right: 3px solid var(--bs-primary);

                    i {
                        transform: scale(1.1);
                    }
                }

                i {
                    width: 20px;
                    text-align: center;
                    font-size: 1.1rem;
                    transition: transform 0.2s ease;
                }

                .nav-text {
                    flex: 1;
                    font-weight: 500;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .nav-badge {
                    background: var(--bs-danger);
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 0.125rem 0.375rem;
                    border-radius: 0.75rem;
                    min-width: 18px;
                    text-align: center;
                }
            }

            .nav-button {
                background: none;
                border: none;
                width: 100%;
                text-align: left;
                cursor: pointer;

                &:first-child {
                    background: var(--bs-primary);
                    color: white;
                    margin: 0 1rem;
                    border-radius: 0.5rem;

                    &:hover {
                        background: var(--bs-primary);
                        color: white;
                        transform: translateY(-1px);
                        box-shadow: 0 4px 8px rgba(var(--bs-primary-rgb), 0.3);
                    }
                }
            }

            .conversation-item {
                .group-avatar-small {
                    width: 20px;
                    height: 20px;
                    background: var(--bs-secondary);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 0.75rem;
                }
            }
        }
    }
}

// Mobile sidebar
@media (max-width: 768px) {
    .app-sidebar {
        position: fixed;
        top: 0;
        left: 0;
        height: 100vh;
        z-index: 1030;
        transform: translateX(-100%);

        &:not(.collapsed) {
            transform: translateX(0);
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
        }
    }
}

// Custom scrollbar
.app-sidebar::-webkit-scrollbar {
    width: 6px;
}

.app-sidebar::-webkit-scrollbar-track {
    background: transparent;
}

.app-sidebar::-webkit-scrollbar-thumb {
    background: var(--bs-border-color);
    border-radius: 3px;

    &:hover {
        background: var(--bs-secondary);
    }
}
</style>