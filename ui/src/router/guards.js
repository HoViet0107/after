// Route guards với authentication, permissions và security

import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useToast } from 'vue-toastification'

class RouteGuardManager {
    constructor() {
        this.authStore = null
        this.uiStore = null
        this.toast = useToast()
        this.redirectAfterLogin = null

        // Security configurations
        this.securityConfig = {
            maxRedirectDepth: 3,
            sensitiveRoutes: [
                '/admin',
                '/settings',
                '/api',
                '/dashboard'
            ],
            publicRoutes: [
                '/',
                '/auth/login',
                '/auth/register',
                '/auth/forgot-password',
                '/auth/reset-password',
                '/terms',
                '/privacy',
                '/about'
            ],
            guestOnlyRoutes: [
                '/auth/login',
                '/auth/register'
            ]
        }

        // Route metadata cache
        this.routeMetadataCache = new Map()
    }

    // Initialize guards with stores
    initialize(router) {
        this.authStore = useAuthStore()
        this.uiStore = useUIStore()

        // Setup global before guards
        router.beforeEach(async (to, from, next) => {
            await this.globalBeforeGuard(to, from, next)
        })

        // Setup global resolve guards
        router.beforeResolve(async (to, from, next) => {
            await this.globalResolveGuard(to, from, next)
        })

        // Setup after each guards
        router.afterEach((to, from, failure) => {
            this.globalAfterGuard(to, from, failure)
        })

        // Setup error handler
        router.onError((error, to, from) => {
            this.handleRouterError(error, to, from)
        })

        console.log('✅ Router guards initialized')
    }

    // Global before guard - runs before every route change
    async globalBeforeGuard(to, from, next) {
        try {
            // Show loading for route changes
            this.uiStore.setLoading(true, 'route-change')

            // Security checks
            if (!this.performSecurityChecks(to, from)) {
                next('/404')
                return
            }

            // Authentication checks
            const authResult = await this.checkAuthentication(to, from)
            if (authResult !== true) {
                next(authResult)
                return
            }

            // Permission checks
            const permissionResult = this.checkPermissions(to)
            if (permissionResult !== true) {
                next(permissionResult)
                return
            }

            // Route-specific checks
            const routeResult = await this.checkRouteSpecific(to, from)
            if (routeResult !== true) {
                next(routeResult)
                return
            }

            // Proceed to route
            next()
        } catch (error) {
            console.error('Route guard error:', error)
            this.toast.error('Lỗi khi chuyển trang. Vui lòng thử lại.')
            next(false) // Cancel navigation
        }
    }

    // Global resolve guard - runs after route components are resolved
    async globalResolveGuard(to, from, next) {
        try {
            // Preload data if needed
            await this.preloadRouteData(to)

            // Update UI state
            this.updateUIState(to)

            next()
        } catch (error) {
            console.error('Route resolve error:', error)
            next(false)
        }
    }

    // Global after guard - runs after successful navigation
    globalAfterGuard(to, from, failure) {
        try {
            // Hide loading
            this.uiStore.setLoading(false, 'route-change')

            if (failure) {
                console.error('Navigation failed:', failure)
                this.handleNavigationFailure(failure, to, from)
                return
            }

            // Update breadcrumbs
            this.updateBreadcrumbs(to)

            // Update navigation history
            this.uiStore.updateNavigationHistory(to)

            // Track analytics
            this.trackPageView(to, from)

            // Update document title
            this.updateDocumentTitle(to)

            // Handle post-navigation tasks
            this.handlePostNavigation(to, from)

        } catch (error) {
            console.error('After guard error:', error)
        }
    }

    // Security checks
    performSecurityChecks(to, from) {
        // Check for malicious routes
        if (this.isMaliciousRoute(to)) {
            console.warn('Malicious route detected:', to.path)
            return false
        }

        // Check redirect depth to prevent loops
        if (this.getRedirectDepth(to) > this.securityConfig.maxRedirectDepth) {
            console.warn('Max redirect depth exceeded')
            return false
        }

        // Validate route parameters
        if (!this.validateRouteParams(to)) {
            console.warn('Invalid route parameters:', to.params)
            return false
        }

        return true
    }

    // Authentication checks
    async checkAuthentication(to, from) {
        const requiresAuth = to.meta.requiresAuth
        const requiresGuest = to.meta.requiresGuest
        const isPublicRoute = this.securityConfig.publicRoutes.includes(to.path)

        // Skip auth check for public routes
        if (isPublicRoute && !requiresAuth) {
            return true
        }

        // Try to restore session if not authenticated
        if (!this.authStore.isAuthenticated) {
            const restored = await this.authStore.restoreSession()
            if (!restored && requiresAuth) {
                this.redirectAfterLogin = to.fullPath
                this.toast.warning('Vui lòng đăng nhập để tiếp tục')
                return '/auth/login'
            }
        }

        // Check if route requires authentication
        if (requiresAuth && !this.authStore.isAuthenticated) {
            this.redirectAfterLogin = to.fullPath
            return '/auth/login'
        }

        // Check if route is guest-only (login, register)
        if (requiresGuest && this.authStore.isAuthenticated) {
            return this.redirectAfterLogin || '/app/feed'
        }

        // Check email verification if required
        if (to.meta.requiresEmailVerification && !this.authStore.user?.emailVerified) {
            this.toast.warning('Vui lòng xác thực email để tiếp tục')
            return '/auth/verify-email'
        }

        return true
    }

    // Permission checks
    checkPermissions(to) {
        const requiredPermissions = to.meta.permissions
        const requiredRoles = to.meta.roles
        const requiresAdmin = to.meta.requiresAdmin

        if (!this.authStore.isAuthenticated) {
            return true // Will be handled by auth check
        }

        // Admin check
        if (requiresAdmin && !this.authStore.hasRole('admin')) {
            this.toast.error('Bạn không có quyền truy cập trang này')
            return '/403'
        }

        // Role checks
        if (requiredRoles && requiredRoles.length > 0) {
            const hasRole = requiredRoles.some(role => this.authStore.hasRole(role))
            if (!hasRole) {
                this.toast.error('Bạn không có quyền truy cập trang này')
                return '/403'
            }
        }

        // Permission checks
        if (requiredPermissions && requiredPermissions.length > 0) {
            const hasPermission = requiredPermissions.every(permission =>
                this.authStore.checkPermission(permission)
            )
            if (!hasPermission) {
                this.toast.error('Bạn không có quyền truy cập trang này')
                return '/403'
            }
        }

        return true
    }

    // Route-specific checks
    async checkRouteSpecific(to, from) {
        // User profile access check
        if (to.name === 'UserProfile') {
            const userId = to.params.userId
            if (userId && userId !== 'me' && !await this.canAccessUserProfile(userId)) {
                return '/404'
            }
        }

        // Conversation access check
        if (to.name === 'Conversation') {
            const conversationId = to.params.conversationId
            if (!await this.canAccessConversation(conversationId)) {
                this.toast.error('Bạn không có quyền truy cập cuộc trò chuyện này')
                return '/app/chat'
            }
        }

        // Post access check
        if (to.name === 'PostDetail') {
            const postId = to.params.postId
            if (!await this.canAccessPost(postId)) {
                return '/404'
            }
        }

        // Settings page checks
        if (to.path.startsWith('/app/settings')) {
            if (!this.authStore.user?.emailVerified) {
                this.toast.warning('Vui lòng xác thực email để truy cập cài đặt')
                return '/auth/verify-email'
            }
        }

        return true
    }

    // Access permission helpers
    async canAccessUserProfile(userId) {
        try {
            // Check if user exists and is accessible
            const response = await fetch(`/api/v1/users/${userId}/profile`, {
                headers: {
                    'Authorization': `Bearer ${this.authStore.token}`
                }
            })
            return response.status !== 404 && response.status !== 403
        } catch (error) {
            console.error('Error checking user profile access:', error)
            return false
        }
    }

    async canAccessConversation(conversationId) {
        try {
            const response = await fetch(`/api/v1/conversations/${conversationId}`, {
                headers: {
                    'Authorization': `Bearer ${this.authStore.token}`
                }
            })
            return response.ok
        } catch (error) {
            console.error('Error checking conversation access:', error)
            return false
        }
    }

    async canAccessPost(postId) {
        try {
            const response = await fetch(`/api/v1/posts/${postId}`, {
                headers: {
                    'Authorization': `Bearer ${this.authStore.token}`
                }
            })
            return response.status !== 404
        } catch (error) {
            console.error('Error checking post access:', error)
            return false
        }
    }

    // Utility methods
    isMaliciousRoute(to) {
        const suspiciousPatterns = [
            /\.\./,           // Directory traversal
            /<script/i,       // Script injection
            /javascript:/i,   // Javascript protocol
            /data:/i,         // Data protocol
            /vbscript:/i     // VBScript protocol
        ]

        return suspiciousPatterns.some(pattern =>
            pattern.test(to.path) || pattern.test(to.query?.toString() || '')
        )
    }

    getRedirectDepth(to) {
        // Track redirect depth to prevent infinite loops
        const redirects = to.query?.redirects || '0'
        return parseInt(redirects)
    }

    validateRouteParams(to) {
        // Validate UUIDs and IDs
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
        const idPattern = /^[0-9a-f]{24}$/i // MongoDB ObjectId pattern

        Object.entries(to.params).forEach(([key, value]) => {
            if (key.endsWith('Id') && value) {
                // Check if it's a valid ID format
                if (!uuidPattern.test(value) && !idPattern.test(value) && !/^\d+$/.test(value)) {
                    console.warn(`Invalid ${key} format:`, value)
                    return false
                }
            }
        })

        return true
    }

    // Data preloading
    async preloadRouteData(to) {
        const preloadConfig = to.meta.preload
        if (!preloadConfig) return

        try {
            const promises = []

            // Preload user data
            if (preloadConfig.user && this.authStore.isAuthenticated) {
                promises.push(this.preloadUserData(to))
            }

            // Preload conversation data
            if (preloadConfig.conversation && to.params.conversationId) {
                promises.push(this.preloadConversationData(to.params.conversationId))
            }

            // Preload post data
            if (preloadConfig.post && to.params.postId) {
                promises.push(this.preloadPostData(to.params.postId))
            }

            await Promise.allSettled(promises)
        } catch (error) {
            console.warn('Preload error:', error)
        }
    }

    async preloadUserData(to) {
        const userId = to.params.userId === 'me' ? this.authStore.user?.id : to.params.userId
        if (userId) {
            // Trigger user service to cache user data
            await import('@/api/services/userService').then(module =>
                module.userService.prefetchUser(userId)
            )
        }
    }

    async preloadConversationData(conversationId) {
        // Preload conversation data
        const { useConversationStore } = await import('@/stores/conversation')
        const conversationStore = useConversationStore()
        conversationStore.prefetchConversation(conversationId)
    }

    async preloadPostData(postId) {
        // Preload post data
        const { postService } = await import('@/api/services/postService')
        postService.prefetchPost(postId)
    }

    // UI state management
    updateUIState(to) {
        // Update sidebar visibility based on route
        if (to.path.startsWith('/app/chat')) {
            this.uiStore.setChatSidebarVisible(true)
        }

        // Update layout mode
        if (to.meta.layout) {
            this.uiStore.setLayout(to.meta.layout)
        }

        // Update compact mode for mobile
        if (this.uiStore.isMobile && to.meta.mobileCompact) {
            this.uiStore.setCompactMode(true)
        }
    }

    updateBreadcrumbs(to) {
        const breadcrumbs = this.generateBreadcrumbs(to)
        this.uiStore.setBreadcrumbs(breadcrumbs)
    }

    generateBreadcrumbs(to) {
        const breadcrumbs = []
        const pathSegments = to.path.split('/').filter(Boolean)

        let currentPath = ''
        pathSegments.forEach((segment, index) => {
            currentPath += `/${segment}`

            const breadcrumb = {
                name: this.getBreadcrumbName(segment, to, index),
                path: currentPath,
                active: index === pathSegments.length - 1
            }

            breadcrumbs.push(breadcrumb)
        })

        return breadcrumbs
    }

    getBreadcrumbName(segment, to, index) {
        // Custom breadcrumb names
        const breadcrumbMap = {
            'app': 'Trang chủ',
            'feed': 'Bảng tin',
            'chat': 'Tin nhắn',
            'profile': 'Hồ sơ',
            'settings': 'Cài đặt',
            'notifications': 'Thông báo',
            'search': 'Tìm kiếm'
        }

        // Check if it's a dynamic segment
        if (to.params[segment]) {
            return to.params[segment]
        }

        return breadcrumbMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
    }

    updateDocumentTitle(to) {
        const title = to.meta.title || 'Social Media Platform'
        const siteName = 'Social Connect'

        document.title = title === siteName ? title : `${title} - ${siteName}`
    }

    // Analytics and tracking
    trackPageView(to, from) {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('config', import.meta.env.VITE_GA_ID, {
                page_title: to.meta.title,
                page_location: window.location.href,
                page_path: to.path
            })
        }

        // Custom analytics
        this.sendAnalytics('page_view', {
            path: to.path,
            name: to.name,
            from: from.path,
            userId: this.authStore.user?.id,
            timestamp: Date.now()
        })
    }

    sendAnalytics(event, data) {
        // Send to analytics service
        try {
            if (import.meta.env.PROD) {
                // Implementation would depend on analytics service
                console.log('Analytics:', event, data)
            }
        } catch (error) {
            console.warn('Analytics error:', error)
        }
    }

    // Error handling
    handleRouterError(error, to, from) {
        console.error('Router error:', error)

        this.uiStore.setLoading(false, 'route-change')

        // Handle different types of errors
        if (error.name === 'ChunkLoadError') {
            this.handleChunkLoadError(to)
        } else if (error.name === 'NavigationDuplicated') {
            // Ignore duplicate navigation errors
            return
        } else {
            this.toast.error('Lỗi khi tải trang. Vui lòng thử lại.')
        }
    }

    handleChunkLoadError(to) {
        this.toast.warning('Đang tải phiên bản mới. Vui lòng đợi...', {
            timeout: 3000
        })

        // Reload the page to get new chunks
        setTimeout(() => {
            window.location.reload()
        }, 1000)
    }

    handleNavigationFailure(failure, to, from) {
        console.error('Navigation failure:', failure)

        if (failure.type === 'aborted') {
            // Navigation was aborted
            console.log('Navigation aborted')
        } else if (failure.type === 'cancelled') {
            // Navigation was cancelled
            console.log('Navigation cancelled')
        } else if (failure.type === 'duplicated') {
            // Duplicate navigation
            console.log('Duplicate navigation')
        }
    }

    // Post navigation tasks
    handlePostNavigation(to, from) {
        // Scroll to top for new pages
        if (to.name !== from.name) {
            this.$nextTick(() => {
                window.scrollTo(0, 0)
            })
        }

        // Focus management for accessibility
        this.manageFocus(to)

        // Route-specific post-navigation tasks
        if (to.name === 'Chat') {
            this.initializeChatFeatures()
        }
    }

    manageFocus(to) {
        // Find main content area and focus for screen readers
        this.$nextTick(() => {
            const mainContent = document.querySelector('#main-content, main, [role="main"]')
            if (mainContent) {
                mainContent.focus()
            }
        })
    }

    initializeChatFeatures() {
        // Initialize chat-specific features
        this.$nextTick(() => {
            // Setup WebSocket connections
            // Initialize real-time features
        })
    }

    // Public API
    getRedirectAfterLogin() {
        return this.redirectAfterLogin
    }

    clearRedirectAfterLogin() {
        this.redirectAfterLogin = null
    }

    // Guard factory functions for specific routes
    createAuthGuard() {
        return (to, from, next) => {
            if (!this.authStore.isAuthenticated) {
                this.redirectAfterLogin = to.fullPath
                next('/auth/login')
            } else {
                next()
            }
        }
    }

    createGuestGuard() {
        return (to, from, next) => {
            if (this.authStore.isAuthenticated) {
                next('/app/feed')
            } else {
                next()
            }
        }
    }

    createAdminGuard() {
        return (to, from, next) => {
            if (!this.authStore.isAuthenticated) {
                next('/auth/login')
            } else if (!this.authStore.hasRole('admin')) {
                next('/403')
            } else {
                next()
            }
        }
    }

    createPermissionGuard(permissions) {
        return (to, from, next) => {
            if (!this.authStore.isAuthenticated) {
                next('/auth/login')
            } else if (!permissions.every(p => this.authStore.checkPermission(p))) {
                next('/403')
            } else {
                next()
            }
        }
    }
}

// Create singleton instance
const routeGuardManager = new RouteGuardManager()

// Export guard manager and common guard functions
export default routeGuardManager

export const authGuard = () => routeGuardManager.createAuthGuard()
export const guestGuard = () => routeGuardManager.createGuestGuard()
export const adminGuard = () => routeGuardManager.createAdminGuard()
export const permissionGuard = (permissions) => routeGuardManager.createPermissionGuard(permissions)