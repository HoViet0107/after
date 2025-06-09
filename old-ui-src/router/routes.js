// Route definitions với lazy loading, metadata và performance optimization

import { authGuard, guestGuard, adminGuard, permissionGuard } from './guards'

// Layouts - Preload essential layouts
const MainLayout = () => import('@/components/layout/MainLayout.vue')
const AuthLayout = () => import('@/components/layout/AuthLayout.vue')
const ChatLayout = () => import('@/components/layout/ChatLayout.vue')
const AdminLayout = () => import('@/components/layout/AdminLayout.vue')

// Views - Lazy load with chunk names for better debugging
const HomeView = () => import(/* webpackChunkName: "home" */ '@/views/HomeView.vue')
const FeedView = () => import(/* webpackChunkName: "feed" */ '@/views/FeedView.vue')
const LoginView = () => import(/* webpackChunkName: "auth" */ '@/views/LoginView.vue')
const RegisterView = () => import(/* webpackChunkName: "auth" */ '@/views/RegisterView.vue')
const ProfileView = () => import(/* webpackChunkName: "profile" */ '@/views/ProfileView.vue')
const ChatView = () => import(/* webpackChunkName: "chat" */ '@/views/ChatView.vue')
const ConversationView = () => import(/* webpackChunkName: "chat" */ '@/views/ConversationView.vue')
const PostDetailView = () => import(/* webpackChunkName: "post" */ '@/views/PostDetailView.vue')
const SearchView = () => import(/* webpackChunkName: "search" */ '@/views/SearchView.vue')
const SettingsView = () => import(/* webpackChunkName: "settings" */ '@/views/SettingsView.vue')
const NotificationsView = () => import(/* webpackChunkName: "notifications" */ '@/views/NotificationsView.vue')
const NotFoundView = () => import(/* webpackChunkName: "error" */ '@/views/NotFoundView.vue')

// Admin views
const AdminDashboard = () => import(/* webpackChunkName: "admin" */ '@/views/admin/DashboardView.vue')
const AdminUsers = () => import(/* webpackChunkName: "admin" */ '@/views/admin/UsersView.vue')
const AdminPosts = () => import(/* webpackChunkName: "admin" */ '@/views/admin/PostsView.vue')
const AdminReports = () => import(/* webpackChunkName: "admin" */ '@/views/admin/ReportsView.vue')

// Error pages
const ForbiddenView = () => import(/* webpackChunkName: "error" */ '@/views/errors/ForbiddenView.vue')
const ServerErrorView = () => import(/* webpackChunkName: "error" */ '@/views/errors/ServerErrorView.vue')

// Static pages
const AboutView = () => import(/* webpackChunkName: "static" */ '@/views/static/AboutView.vue')
const TermsView = () => import(/* webpackChunkName: "static" */ '@/views/static/TermsView.vue')
const PrivacyView = () => import(/* webpackChunkName: "static" */ '@/views/static/PrivacyView.vue')

// Define routes with comprehensive metadata
export const routes = [
    // Public root route
    {
        path: '/',
        name: 'Home',
        component: HomeView,
        meta: {
            title: 'Trang chủ',
            description: 'Kết nối và chia sẻ với bạn bè',
            keywords: 'mạng xã hội, kết nối, chia sẻ',
            layout: 'public',
            requiresAuth: false,
            preload: {
                user: false
            },
            cache: {
                enabled: true,
                ttl: 300000 // 5 minutes
            }
        }
    },

    // Authentication routes
    {
        path: '/auth',
        component: AuthLayout,
        meta: {
            layout: 'auth',
            requiresGuest: true
        },
        children: [
            {
                path: 'login',
                name: 'Login',
                component: LoginView,
                beforeEnter: guestGuard(),
                meta: {
                    title: 'Đăng nhập',
                    description: 'Đăng nhập vào tài khoản của bạn',
                    requiresGuest: true,
                    noIndex: true,
                    analytics: {
                        category: 'auth',
                        action: 'login_view'
                    }
                }
            },
            {
                path: 'register',
                name: 'Register',
                component: RegisterView,
                beforeEnter: guestGuard(),
                meta: {
                    title: 'Đăng ký',
                    description: 'Tạo tài khoản mới',
                    requiresGuest: true,
                    noIndex: true,
                    analytics: {
                        category: 'auth',
                        action: 'register_view'
                    }
                }
            },
            {
                path: 'forgot-password',
                name: 'ForgotPassword',
                component: () => import('@/views/auth/ForgotPasswordView.vue'),
                beforeEnter: guestGuard(),
                meta: {
                    title: 'Quên mật khẩu',
                    requiresGuest: true,
                    noIndex: true
                }
            },
            {
                path: 'reset-password/:token',
                name: 'ResetPassword',
                component: () => import('@/views/auth/ResetPasswordView.vue'),
                beforeEnter: guestGuard(),
                meta: {
                    title: 'Đặt lại mật khẩu',
                    requiresGuest: true,
                    noIndex: true
                }
            },
            {
                path: 'verify-email',
                name: 'VerifyEmail',
                component: () => import('@/views/auth/VerifyEmailView.vue'),
                meta: {
                    title: 'Xác thực email',
                    requiresAuth: true,
                    noIndex: true
                }
            }
        ]
    },

    // Main application routes
    {
        path: '/app',
        component: MainLayout,
        beforeEnter: authGuard(),
        meta: {
            requiresAuth: true,
            layout: 'main'
        },
        children: [
            // Feed
            {
                path: 'feed',
                name: 'Feed',
                component: FeedView,
                meta: {
                    title: 'Bảng tin',
                    description: 'Xem bài viết mới nhất từ bạn bè',
                    requiresAuth: true,
                    preload: {
                        user: true,
                        feed: true
                    },
                    cache: {
                        enabled: true,
                        ttl: 120000 // 2 minutes
                    },
                    analytics: {
                        category: 'content',
                        action: 'feed_view'
                    }
                }
            },

            // Profile routes
            {
                path: 'profile/:userId?',
                name: 'Profile',
                component: ProfileView,
                meta: {
                    title: 'Hồ sơ người dùng',
                    requiresAuth: true,
                    preload: {
                        user: true,
                        posts: true
                    },
                    cache: {
                        enabled: true,
                        ttl: 300000 // 5 minutes
                    }
                }
            },
            {
                path: 'profile/:userId/followers',
                name: 'ProfileFollowers',
                component: () => import('@/views/profile/FollowersView.vue'),
                meta: {
                    title: 'Người theo dõi',
                    requiresAuth: true,
                    preload: {
                        user: true
                    }
                }
            },
            {
                path: 'profile/:userId/following',
                name: 'ProfileFollowing',
                component: () => import('@/views/profile/FollowingView.vue'),
                meta: {
                    title: 'Đang theo dõi',
                    requiresAuth: true,
                    preload: {
                        user: true
                    }
                }
            },

            // Post routes
            {
                path: 'post/:postId',
                name: 'PostDetail',
                component: PostDetailView,
                meta: {
                    title: 'Chi tiết bài viết',
                    requiresAuth: true,
                    preload: {
                        post: true,
                        comments: true
                    },
                    cache: {
                        enabled: true,
                        ttl: 180000 // 3 minutes
                    }
                }
            },
            {
                path: 'post/:postId/edit',
                name: 'PostEdit',
                component: () => import('@/views/post/PostEditView.vue'),
                meta: {
                    title: 'Chỉnh sửa bài viết',
                    requiresAuth: true,
                    permissions: ['post.edit']
                }
            },

            // Search
            {
                path: 'search',
                name: 'Search',
                component: SearchView,
                meta: {
                    title: 'Tìm kiếm',
                    requiresAuth: true,
                    cache: {
                        enabled: false // Search results shouldn't be cached
                    }
                }
            },

            // Notifications
            {
                path: 'notifications',
                name: 'Notifications',
                component: NotificationsView,
                meta: {
                    title: 'Thông báo',
                    requiresAuth: true,
                    preload: {
                        notifications: true
                    }
                }
            },

            // Settings
            {
                path: 'settings',
                name: 'Settings',
                component: SettingsView,
                meta: {
                    title: 'Cài đặt',
                    requiresAuth: true,
                    requiresEmailVerification: true
                },
                children: [
                    {
                        path: 'profile',
                        name: 'SettingsProfile',
                        component: () => import('@/views/settings/ProfileSettingsView.vue'),
                        meta: {
                            title: 'Cài đặt hồ sơ',
                            requiresAuth: true
                        }
                    },
                    {
                        path: 'privacy',
                        name: 'SettingsPrivacy',
                        component: () => import('@/views/settings/PrivacySettingsView.vue'),
                        meta: {
                            title: 'Cài đặt riêng tư',
                            requiresAuth: true
                        }
                    },
                    {
                        path: 'notifications',
                        name: 'SettingsNotifications',
                        component: () => import('@/views/settings/NotificationSettingsView.vue'),
                        meta: {
                            title: 'Cài đặt thông báo',
                            requiresAuth: true
                        }
                    },
                    {
                        path: 'security',
                        name: 'SettingsSecurity',
                        component: () => import('@/views/settings/SecuritySettingsView.vue'),
                        meta: {
                            title: 'Cài đặt bảo mật',
                            requiresAuth: true,
                            requiresEmailVerification: true
                        }
                    },
                    {
                        path: 'blocked-users',
                        name: 'SettingsBlockedUsers',
                        component: () => import('@/views/settings/BlockedUsersView.vue'),
                        meta: {
                            title: 'Người dùng bị chặn',
                            requiresAuth: true
                        }
                    }
                ]
            }
        ]
    },

    // Chat routes with special layout
    {
        path: '/app/chat',
        component: ChatLayout,
        beforeEnter: authGuard(),
        meta: {
            requiresAuth: true,
            layout: 'chat'
        },
        children: [
            {
                path: '',
                name: 'Chat',
                component: ChatView,
                meta: {
                    title: 'Tin nhắn',
                    requiresAuth: true,
                    preload: {
                        conversations: true
                    },
                    realtime: {
                        enabled: true,
                        channels: ['conversations', 'messages']
                    }
                }
            },
            {
                path: ':conversationId',
                name: 'Conversation',
                component: ConversationView,
                meta: {
                    title: 'Cuộc trò chuyện',
                    requiresAuth: true,
                    preload: {
                        conversation: true,
                        messages: true
                    },
                    realtime: {
                        enabled: true,
                        channels: ['messages', 'typing', 'presence']
                    }
                }
            }
        ]
    },

    // Admin routes
    {
        path: '/admin',
        component: AdminLayout,
        beforeEnter: adminGuard(),
        meta: {
            requiresAuth: true,
            requiresAdmin: true,
            layout: 'admin'
        },
        children: [
            {
                path: '',
                redirect: '/admin/dashboard'
            },
            {
                path: 'dashboard',
                name: 'AdminDashboard',
                component: AdminDashboard,
                meta: {
                    title: 'Bảng điều khiển quản trị',
                    requiresAdmin: true,
                    permissions: ['admin.dashboard.view']
                }
            },
            {
                path: 'users',
                name: 'AdminUsers',
                component: AdminUsers,
                meta: {
                    title: 'Quản lý người dùng',
                    requiresAdmin: true,
                    permissions: ['admin.users.view']
                }
            },
            {
                path: 'posts',
                name: 'AdminPosts',
                component: AdminPosts,
                meta: {
                    title: 'Quản lý bài viết',
                    requiresAdmin: true,
                    permissions: ['admin.posts.view']
                }
            },
            {
                path: 'reports',
                name: 'AdminReports',
                component: AdminReports,
                meta: {
                    title: 'Báo cáo vi phạm',
                    requiresAdmin: true,
                    permissions: ['admin.reports.view']
                }
            },
            {
                path: 'settings',
                name: 'AdminSettings',
                component: () => import('@/views/admin/AdminSettingsView.vue'),
                beforeEnter: permissionGuard(['admin.settings.manage']),
                meta: {
                    title: 'Cài đặt hệ thống',
                    requiresAdmin: true,
                    permissions: ['admin.settings.manage']
                }
            }
        ]
    },

    // Static pages
    {
        path: '/about',
        name: 'About',
        component: AboutView,
        meta: {
            title: 'Về chúng tôi',
            description: 'Tìm hiểu về nền tảng mạng xã hội của chúng tôi',
            layout: 'public',
            cache: {
                enabled: true,
                ttl: 3600000 // 1 hour
            }
        }
    },
    {
        path: '/terms',
        name: 'Terms',
        component: TermsView,
        meta: {
            title: 'Điều khoản sử dụng',
            description: 'Điều khoản và điều kiện sử dụng dịch vụ',
            layout: 'public',
            cache: {
                enabled: true,
                ttl: 3600000 // 1 hour
            }
        }
    },
    {
        path: '/privacy',
        name: 'Privacy',
        component: PrivacyView,
        meta: {
            title: 'Chính sách bảo mật',
            description: 'Chính sách bảo mật và xử lý dữ liệu cá nhân',
            layout: 'public',
            cache: {
                enabled: true,
                ttl: 3600000 // 1 hour
            }
        }
    },

    // API routes (for documentation or testing)
    {
        path: '/api-docs',
        name: 'ApiDocs',
        component: () => import('@/views/developer/ApiDocsView.vue'),
        beforeEnter: permissionGuard(['developer.docs.view']),
        meta: {
            title: 'API Documentation',
            requiresAuth: true,
            permissions: ['developer.docs.view'],
            noIndex: true
        }
    },

    // Error pages
    {
        path: '/403',
        name: 'Forbidden',
        component: ForbiddenView,
        meta: {
            title: 'Không có quyền truy cập',
            layout: 'error',
            noIndex: true
        }
    },
    {
        path: '/500',
        name: 'ServerError',
        component: ServerErrorView,
        meta: {
            title: 'Lỗi máy chủ',
            layout: 'error',
            noIndex: true
        }
    },

    // Redirects for backwards compatibility
    {
        path: '/user/:userId',
        redirect: to => {
            return { name: 'Profile', params: { userId: to.params.userId } }
        }
    },
    {
        path: '/users/:userId',
        redirect: to => {
            return { name: 'Profile', params: { userId: to.params.userId } }
        }
    },
    {
        path: '/messages',
        redirect: '/app/chat'
    },
    {
        path: '/messages/:conversationId',
        redirect: to => {
            return { path: `/app/chat/${to.params.conversationId}` }
        }
    },

    // Catch-all 404 route - MUST BE LAST
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFoundView,
        meta: {
            title: 'Không tìm thấy trang',
            layout: 'error',
            noIndex: true
        }
    }
]

// Route groups for easier management
export const routeGroups = {
    public: ['Home', 'About', 'Terms', 'Privacy'],
    auth: ['Login', 'Register', 'ForgotPassword', 'ResetPassword', 'VerifyEmail'],
    app: ['Feed', 'Profile', 'PostDetail', 'Search', 'Notifications', 'Settings'],
    chat: ['Chat', 'Conversation'],
    admin: ['AdminDashboard', 'AdminUsers', 'AdminPosts', 'AdminReports', 'AdminSettings'],
    error: ['NotFound', 'Forbidden', 'ServerError']
}

// Route permissions map
export const routePermissions = {
    'AdminDashboard': ['admin.dashboard.view'],
    'AdminUsers': ['admin.users.view'],
    'AdminPosts': ['admin.posts.view'],
    'AdminReports': ['admin.reports.view'],
    'AdminSettings': ['admin.settings.manage'],
    'PostEdit': ['post.edit'],
    'ApiDocs': ['developer.docs.view']
}

// Route metadata helpers
export function getRouteMetadata(routeName) {
    const route = routes.find(r => r.name === routeName ||
        r.children?.find(c => c.name === routeName))

    if (!route) return null

    if (route.children) {
        const childRoute = route.children.find(c => c.name === routeName)
        return childRoute?.meta || null
    }

    return route.meta || null
}

export function isPublicRoute(routeName) {
    return routeGroups.public.includes(routeName)
}

export function isAuthRoute(routeName) {
    return routeGroups.auth.includes(routeName)
}

export function isAdminRoute(routeName) {
    return routeGroups.admin.includes(routeName)
}

export function getRoutePermissions(routeName) {
    return routePermissions[routeName] || []
}

// Dynamic route helpers
export function generateUserProfileRoute(userId) {
    return {
        name: 'Profile',
        params: { userId }
    }
}

export function generatePostDetailRoute(postId) {
    return {
        name: 'PostDetail',
        params: { postId }
    }
}

export function generateConversationRoute(conversationId) {
    return {
        name: 'Conversation',
        params: { conversationId }
    }
}

// Route prefetching helpers
export function shouldPrefetchRoute(routeName) {
    const metadata = getRouteMetadata(routeName)
    return metadata?.preload && Object.keys(metadata.preload).length > 0
}

export function getRoutePrefetchConfig(routeName) {
    const metadata = getRouteMetadata(routeName)
    return metadata?.preload || {}
}

// Route caching helpers
export function shouldCacheRoute(routeName) {
    const metadata = getRouteMetadata(routeName)
    return metadata?.cache?.enabled === true
}

export function getRouteCacheTTL(routeName) {
    const metadata = getRouteMetadata(routeName)
    return metadata?.cache?.ttl || 300000 // Default 5 minutes
}

// SEO helpers
export function getRouteTitle(routeName, params = {}) {
    const metadata = getRouteMetadata(routeName)
    let title = metadata?.title || 'Social Media Platform'

    // Replace dynamic placeholders
    Object.entries(params).forEach(([key, value]) => {
        title = title.replace(`{${key}}`, value)
    })

    return title
}

export function getRouteDescription(routeName) {
    const metadata = getRouteMetadata(routeName)
    return metadata?.description || 'Kết nối và chia sẻ với bạn bè'
}

export function shouldIndexRoute(routeName) {
    const metadata = getRouteMetadata(routeName)
    return metadata?.noIndex !== true
}

export default routes