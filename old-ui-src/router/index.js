import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'

// Layouts
const MainLayout = () => import('@/components/layout/MainLayout.vue')
const AuthLayout = () => import('@/components/layout/AuthLayout.vue')
const ChatLayout = () => import('@/components/layout/ChatLayout.vue')

// Views - Lazy loading cho performance tốt hơn
const HomeView = () => import('@/views/HomeView.vue')
const LoginView = () => import('@/views/LoginView.vue')
const RegisterView = () => import('@/views/RegisterView.vue')
const FeedView = () => import('@/views/FeedView.vue')
const ProfileView = () => import('@/views/ProfileView.vue')
const ChatView = () => import('@/views/ChatView.vue')
const ConversationView = () => import('@/views/ConversationView.vue')
const PostDetailView = () => import('@/views/PostDetailView.vue')
const SearchView = () => import('@/views/SearchView.vue')
const SettingsView = () => import('@/views/SettingsView.vue')
const NotificationsView = () => import('@/views/NotificationsView.vue')
const NotFoundView = () => import('@/views/NotFoundView.vue')

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomeView,
        meta: {
            layout: 'main',
            title: 'Home'
        }
    },

    // Authentication routes
    {
        path: '/auth',
        component: AuthLayout,
        children: [
            {
                path: 'login',
                name: 'Login',
                component: LoginView,
                meta: {
                    requiresGuest: true,
                    title: 'Login'
                }
            },
            {
                path: 'register',
                name: 'Register',
                component: RegisterView,
                meta: {
                    requiresGuest: true,
                    title: 'Register'
                }
            }
        ]
    },

    // Protected routes
    {
        path: '/app',
        component: MainLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: 'feed',
                name: 'Feed',
                component: FeedView,
                meta: {
                    title: 'Feed',
                    icon: 'fas fa-home'
                }
            },
            {
                path: 'profile/:userId?',
                name: 'Profile',
                component: ProfileView,
                props: true,
                meta: {
                    title: 'Profile',
                    icon: 'fas fa-user'
                }
            },
            {
                path: 'search',
                name: 'Search',
                component: SearchView,
                meta: {
                    title: 'Search',
                    icon: 'fas fa-search'
                }
            },
            {
                path: 'notifications',
                name: 'Notifications',
                component: NotificationsView,
                meta: {
                    title: 'Notifications',
                    icon: 'fas fa-bell'
                }
            },
            {
                path: 'settings',
                name: 'Settings',
                component: SettingsView,
                meta: {
                    title: 'Settings',
                    icon: 'fas fa-cog'
                }
            },
            {
                path: 'post/:postId',
                name: 'PostDetail',
                component: PostDetailView,
                props: true,
                meta: {
                    title: 'Post Detail'
                }
            }
        ]
    },

    // Chat routes
    {
        path: '/chat',
        component: ChatLayout,
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                name: 'Chat',
                component: ChatView,
                meta: {
                    title: 'Chat',
                    icon: 'fas fa-comments'
                }
            },
            {
                path: 'conversation/:conversationId',
                name: 'Conversation',
                component: ConversationView,
                props: true,
                meta: {
                    title: 'Conversation'
                }
            }
        ]
    },

    // Redirects
    {
        path: '/login',
        redirect: '/auth/login'
    },
    {
        path: '/register',
        redirect: '/auth/register'
    },

    // 404 Error
    {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: NotFoundView,
        meta: {
            title: 'Not Found'
        }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
        // Restore scroll position when navigating back
        if (savedPosition) {
            return savedPosition
        }

        // Scroll to anchor if hash is present
        if (to.hash) {
            return {
                el: to.hash,
                behavior: 'smooth'
            }
        }

        // Scroll to top for new route
        return { top: 0, behavior: 'smooth' }
    }
})

// Global navigation guards
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore()
    const uiStore = useUIStore()

    // Show loading
    uiStore.setLoading(true)

    try {
        // Check authentication status
        if (!authStore.isInitialized) {
            await authStore.initializeAuth()
        }

        // Route requires authentication
        if (to.meta.requiresAuth && !authStore.isAuthenticated) {
            next({
                name: 'Login',
                query: { redirect: to.fullPath }
            })
            return
        }

        // Route requires guest (not authenticated)
        if (to.meta.requiresGuest && authStore.isAuthenticated) {
            next({ name: 'Feed' })
            return
        }

        // Update page title
        if (to.meta.title) {
            document.title = `${to.meta.title} - Social Media Platform`
        }

        next()
    } catch (error) {
        console.error('Navigation error:', error)
        next({ name: 'Login' })
    }
})

router.afterEach((to, from) => {
    const uiStore = useUIStore()

    // Hide loading
    uiStore.setLoading(false)

    // Close mobile menu if open
    if (uiStore.isMobileMenuOpen) {
        uiStore.closeMobileMenu()
    }

    // Analytics tracking (if any)
    if (import.meta.env.PROD && window.gtag) {
        window.gtag('config', 'GA_TRACKING_ID', {
            page_path: to.path
        })
    }
})

// Error handling
router.onError((error) => {
    console.error('Router error:', error)

    // Redirect to home or error page
    if (error.name === 'ChunkLoadError') {
        // Chunk load error - reload page
        window.location.reload()
    }
})

export default router