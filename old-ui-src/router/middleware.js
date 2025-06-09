// Router middleware với performance optimization, security và caching

import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'

class RouterMiddleware {
    constructor() {
        this.authStore = null
        this.uiStore = null
        this.cacheStore = null
        this.toast = useToast()

        // Middleware chain
        this.middlewares = new Map()

        // Performance tracking
        this.performanceMetrics = {
            routeLoadTimes: new Map(),
            chunkLoadTimes: new Map(),
            averageLoadTime: 0
        }

        // Security settings
        this.securityConfig = {
            rateLimiting: {
                enabled: true,
                maxRequests: 100,
                windowMs: 60000, // 1 minute
                userRequests: new Map()
            },
            contentSecurityPolicy: {
                enabled: true,
                directives: {
                    'default-src': ["'self'"],
                    'script-src': ["'self'", "'unsafe-inline'", 'https://apis.google.com'],
                    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
                    'img-src': ["'self'", 'data:', 'https:'],
                    'font-src': ["'self'", 'https://fonts.gstatic.com'],
                    'connect-src': ["'self'", 'wss:', 'https:']
                }
            }
        }

        this.registerMiddlewares()
    }

    initialize() {
        this.authStore = useAuthStore()
        this.uiStore = useUIStore()
        this.cacheStore = useCacheStore()
    }

    // Register all available middlewares
    registerMiddlewares() {
        // Core middlewares
        this.middlewares.set('auth', this.authMiddleware.bind(this))
        this.middlewares.set('guest', this.guestMiddleware.bind(this))
        this.middlewares.set('admin', this.adminMiddleware.bind(this))
        this.middlewares.set('permission', this.permissionMiddleware.bind(this))

        // Security middlewares
        this.middlewares.set('rateLimit', this.rateLimitMiddleware.bind(this))
        this.middlewares.set('csp', this.cspMiddleware.bind(this))
        this.middlewares.set('xss', this.xssProtectionMiddleware.bind(this))

        // Performance middlewares
        this.middlewares.set('cache', this.cacheMiddleware.bind(this))
        this.middlewares.set('preload', this.preloadMiddleware.bind(this))
        this.middlewares.set('performance', this.performanceMiddleware.bind(this))

        // Feature middlewares
        this.middlewares.set('analytics', this.analyticsMiddleware.bind(this))
        this.middlewares.set('seo', this.seoMiddleware.bind(this))
        this.middlewares.set('theme', this.themeMiddleware.bind(this))
        this.middlewares.set('locale', this.localeMiddleware.bind(this))
    }

    // Execute middleware chain
    async executeMiddleware(middlewareNames, context) {
        const results = []

        for (const name of middlewareNames) {
            if (this.middlewares.has(name)) {
                try {
                    const startTime = performance.now()
                    const result = await this.middlewares.get(name)(context)
                    const endTime = performance.now()

                    results.push({
                        name,
                        result,
                        duration: endTime - startTime,
                        success: result?.success !== false
                    })

                    // Stop execution if middleware returns false or error
                    if (result === false || result?.success === false) {
                        break
                    }
                } catch (error) {
                    console.error(`Middleware ${name} failed:`, error)
                    results.push({
                        name,
                        error: error.message,
                        success: false
                    })
                    break
                }
            }
        }

        return results
    }

    // Authentication middleware
    async authMiddleware(context) {
        const { to, from, next } = context

        if (!this.authStore.isAuthenticated) {
            // Try to restore session
            const restored = await this.authStore.restoreSession()

            if (!restored) {
                this.toast.warning('Vui lòng đăng nhập để tiếp tục')
                return {
                    success: false,
                    redirect: '/auth/login',
                    params: { redirect: to.fullPath }
                }
            }
        }

        // Check if user account is active
        if (this.authStore.user?.status === 'suspended') {
            this.toast.error('Tài khoản của bạn đã bị tạm khóa')
            return {
                success: false,
                redirect: '/auth/suspended'
            }
        }

        // Update last activity
        this.authStore.updateLastActivity()

        return { success: true }
    }

    // Guest middleware (for login/register pages)
    async guestMiddleware(context) {
        const { to, from, next } = context

        if (this.authStore.isAuthenticated) {
            return {
                success: false,
                redirect: '/app/feed'
            }
        }

        return { success: true }
    }

    // Admin middleware
    async adminMiddleware(context) {
        const { to, from, next } = context

        if (!this.authStore.isAuthenticated) {
            return {
                success: false,
                redirect: '/auth/login'
            }
        }

        if (!this.authStore.hasRole('admin')) {
            this.toast.error('Bạn không có quyền truy cập vào khu vực quản trị')
            return {
                success: false,
                redirect: '/403'
            }
        }

        return { success: true }
    }

    // Permission middleware
    async permissionMiddleware(context) {
        const { to, from, next, permissions = [] } = context

        if (!this.authStore.isAuthenticated) {
            return {
                success: false,
                redirect: '/auth/login'
            }
        }

        const hasPermissions = permissions.every(permission =>
            this.authStore.checkPermission(permission)
        )

        if (!hasPermissions) {
            this.toast.error('Bạn không có quyền thực hiện hành động này')
            return {
                success: false,
                redirect: '/403'
            }
        }

        return { success: true }
    }

    // Rate limiting middleware
    async rateLimitMiddleware(context) {
        if (!this.securityConfig.rateLimiting.enabled) {
            return { success: true }
        }

        const { to } = context
        const userId = this.authStore.user?.id || 'anonymous'
        const now = Date.now()
        const windowMs = this.securityConfig.rateLimiting.windowMs
        const maxRequests = this.securityConfig.rateLimiting.maxRequests

        // Clean old entries
        this.cleanOldRateLimitEntries(now, windowMs)

        // Get user's request history
        if (!this.securityConfig.rateLimiting.userRequests.has(userId)) {
            this.securityConfig.rateLimiting.userRequests.set(userId, [])
        }

        const userRequests = this.securityConfig.rateLimiting.userRequests.get(userId)

        // Count requests in current window
        const recentRequests = userRequests.filter(timestamp =>
            now - timestamp < windowMs
        )

        if (recentRequests.length >= maxRequests) {
            this.toast.error('Quá nhiều yêu cầu. Vui lòng thử lại sau.')
            return {
                success: false,
                error: 'Rate limit exceeded'
            }
        }

        // Add current request
        userRequests.push(now)
        this.securityConfig.rateLimiting.userRequests.set(userId, userRequests)

        return { success: true }
    }

    // Content Security Policy middleware
    async cspMiddleware(context) {
        if (!this.securityConfig.contentSecurityPolicy.enabled) {
            return { success: true }
        }

        try {
            const directives = this.securityConfig.contentSecurityPolicy.directives
            const cspHeader = Object.entries(directives)
                .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
                .join('; ')

            // Set CSP meta tag
            let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
            if (!cspMeta) {
                cspMeta = document.createElement('meta')
                cspMeta.setAttribute('http-equiv', 'Content-Security-Policy')
                document.head.appendChild(cspMeta)
            }
            cspMeta.setAttribute('content', cspHeader)

            return { success: true }
        } catch (error) {
            console.error('CSP middleware error:', error)
            return { success: true } // Don't block navigation on CSP errors
        }
    }

    // XSS Protection middleware
    async xssProtectionMiddleware(context) {
        const { to } = context

        // Sanitize route parameters
        Object.keys(to.params).forEach(key => {
            if (typeof to.params[key] === 'string') {
                to.params[key] = this.sanitizeInput(to.params[key])
            }
        })

        // Sanitize query parameters
        Object.keys(to.query).forEach(key => {
            if (typeof to.query[key] === 'string') {
                to.query[key] = this.sanitizeInput(to.query[key])
            }
        })

        return { success: true }
    }

    // Cache middleware
    async cacheMiddleware(context) {
        const { to } = context
        const cacheConfig = to.meta?.cache

        if (!cacheConfig?.enabled) {
            return { success: true }
        }

        const cacheKey = `route_${to.path}_${JSON.stringify(to.query)}`
        const cached = this.cacheStore.get(cacheKey)

        if (cached) {
            console.log('Route cache hit:', to.path)
            return {
                success: true,
                cached: true,
                data: cached
            }
        }

        return { success: true }
    }

    // Preload middleware
    async preloadMiddleware(context) {
        const { to } = context
        const preloadConfig = to.meta?.preload

        if (!preloadConfig) {
            return { success: true }
        }

        try {
            const preloadPromises = []

            // Preload user data
            if (preloadConfig.user && this.authStore.isAuthenticated) {
                preloadPromises.push(this.preloadUserData(to))
            }

            // Preload route-specific data
            if (preloadConfig.feed) {
                preloadPromises.push(this.preloadFeedData())
            }

            if (preloadConfig.conversations) {
                preloadPromises.push(this.preloadConversationsData())
            }

            if (preloadConfig.notifications) {
                preloadPromises.push(this.preloadNotificationsData())
            }

            // Execute preloads (don't wait for all to complete)
            Promise.allSettled(preloadPromises).then(results => {
                const failed = results.filter(r => r.status === 'rejected')
                if (failed.length > 0) {
                    console.warn('Some preloads failed:', failed)
                }
            })

            return { success: true }
        } catch (error) {
            console.warn('Preload middleware error:', error)
            return { success: true } // Don't block navigation on preload errors
        }
    }

    // Performance monitoring middleware
    async performanceMiddleware(context) {
        const { to, from } = context
        const startTime = performance.now()

        // Mark navigation start
        if (performance.mark) {
            performance.mark(`navigation-start-${to.name}`)
        }

        // Store start time for later measurement
        context.performanceStartTime = startTime

        return { success: true }
    }

    // Analytics middleware
    async analyticsMiddleware(context) {
        const { to, from } = context
        const analyticsConfig = to.meta?.analytics

        if (!analyticsConfig) {
            return { success: true }
        }

        try {
            // Track page view
            this.trackPageView(to, from, analyticsConfig)

            // Track custom events
            if (analyticsConfig.events) {
                analyticsConfig.events.forEach(event => {
                    this.trackEvent(event.category, event.action, event.label)
                })
            }

            return { success: true }
        } catch (error) {
            console.warn('Analytics middleware error:', error)
            return { success: true }
        }
    }

    // SEO middleware
    async seoMiddleware(context) {
        const { to } = context

        try {
            // Update page title
            this.updatePageTitle(to)

            // Update meta description
            this.updateMetaDescription(to)

            // Update meta keywords
            this.updateMetaKeywords(to)

            // Update Open Graph tags
            this.updateOpenGraphTags(to)

            // Update canonical URL
            this.updateCanonicalUrl(to)

            // Handle noindex
            this.handleNoIndex(to)

            return { success: true }
        } catch (error) {
            console.warn('SEO middleware error:', error)
            return { success: true }
        }
    }

    // Theme middleware
    async themeMiddleware(context) {
        const { to } = context
        const themeConfig = to.meta?.theme

        if (themeConfig) {
            this.uiStore.setTheme(themeConfig)
        }

        // Apply layout-specific themes
        if (to.meta?.layout === 'auth') {
            document.body.classList.add('auth-layout')
        } else {
            document.body.classList.remove('auth-layout')
        }

        return { success: true }
    }

    // Locale middleware
    async localeMiddleware(context) {
        const { to } = context
        const locale = to.query.locale || to.meta?.locale

        if (locale) {
            // Set document language
            document.documentElement.lang = locale

            // Update UI store locale
            this.uiStore.updatePreference('language', locale)
        }

        return { success: true }
    }

    // Helper methods
    cleanOldRateLimitEntries(now, windowMs) {
        this.securityConfig.rateLimiting.userRequests.forEach((requests, userId) => {
            const recentRequests = requests.filter(timestamp =>
                now - timestamp < windowMs
            )
            this.securityConfig.rateLimiting.userRequests.set(userId, recentRequests)
        })
    }

    sanitizeInput(input) {
        if (typeof input !== 'string') return input

        // Remove dangerous characters and patterns
        return input
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/javascript:/gi, '')
            .replace(/ on\w +\s *=/gi, '')
            .trim()
    }

    async preloadUserData(to) {
        const { userService } = await import('@/api/services/userService')
        const userId = to.params.userId === 'me' ? this.authStore.user?.id : to.params.userId

        if (userId) {
            return userService.prefetchUser(userId)
        }
    }

    async preloadFeedData() {
        const { feedService } = await import('@/api/services/feedService')
        return feedService.preloadFeedContent('home')
    }

    async preloadConversationsData() {
        const { useConversationStore } = await import('@/stores/conversation')
        const conversationStore = useConversationStore()
        return conversationStore.fetchConversations({ limit: 20 })
    }

    async preloadNotificationsData() {
        const { useNotificationStore } = await import('@/stores/notification')
        const notificationStore = useNotificationStore()
        return notificationStore.fetchNotifications({ limit: 20 })
    }

    trackPageView(to, from, config) {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', 'page_view', {
                page_title: to.meta?.title,
                page_location: window.location.href,
                page_path: to.path,
                custom_parameter: config?.category
            })
        }
    }

    trackEvent(category, action, label) {
        if (typeof window !== 'undefined' && window.gtag) {
            window.gtag('event', action, {
                event_category: category,
                event_label: label
            })
        }
    }

    updatePageTitle(to) {
        const title = to.meta?.title || 'Social Media Platform'
        const siteName = 'Social Connect'
        document.title = title === siteName ? title : `${title} - ${siteName}`
    }

    updateMetaDescription(to) {
        const description = to.meta?.description || 'Kết nối và chia sẻ với bạn bè'
        this.updateMetaTag('description', description)
    }

    updateMetaKeywords(to) {
        const keywords = to.meta?.keywords
        if (keywords) {
            this.updateMetaTag('keywords', keywords)
        }
    }

    updateOpenGraphTags(to) {
        const title = to.meta?.title || 'Social Media Platform'
        const description = to.meta?.description || 'Kết nối và chia sẻ với bạn bè'
        const image = to.meta?.ogImage || '/images/og-default.jpg'

        this.updateMetaTag('og:title', title, 'property')
        this.updateMetaTag('og:description', description, 'property')
        this.updateMetaTag('og:image', image, 'property')
        this.updateMetaTag('og:url', window.location.href, 'property')
        this.updateMetaTag('og:type', 'website', 'property')
    }

    updateCanonicalUrl(to) {
        let canonical = document.querySelector('link[rel="canonical"]')
        if (!canonical) {
            canonical = document.createElement('link')
            canonical.rel = 'canonical'
            document.head.appendChild(canonical)
        }
        canonical.href = window.location.href
    }

    handleNoIndex(to) {
        const noIndex = to.meta?.noIndex
        let robots = document.querySelector('meta[name="robots"]')

        if (noIndex) {
            if (!robots) {
                robots = document.createElement('meta')
                robots.name = 'robots'
                document.head.appendChild(robots)
            }
            robots.content = 'noindex, nofollow'
        } else if (robots) {
            robots.content = 'index, follow'
        }
    }

    updateMetaTag(name, content, attribute = 'name') {
        let meta = document.querySelector(`meta[${attribute}="${name}"]`)
        if (!meta) {
            meta = document.createElement('meta')
            meta.setAttribute(attribute, name)
            document.head.appendChild(meta)
        }
        meta.content = content
    }

    // Performance measurement completion
    completePerformanceMeasurement(context) {
        if (context.performanceStartTime) {
            const endTime = performance.now()
            const duration = endTime - context.performanceStartTime
            const routeName = context.to.name

            // Store performance metrics
            this.performanceMetrics.routeLoadTimes.set(routeName, duration)

            // Calculate average
            const times = Array.from(this.performanceMetrics.routeLoadTimes.values())
            this.performanceMetrics.averageLoadTime = times.reduce((a, b) => a + b, 0) / times.length

            // Mark navigation end
            if (performance.mark && performance.measure) {
                performance.mark(`navigation-end-${routeName}`)
                performance.measure(
                    `navigation-${routeName}`,
                    `navigation-start-${routeName}`,
                    `navigation-end-${routeName}`
                )
            }

            console.log(`Route ${routeName} loaded in ${duration.toFixed(2)}ms`)
        }
    }

    // Get performance stats
    getPerformanceStats() {
        return {
            routeLoadTimes: Object.fromEntries(this.performanceMetrics.routeLoadTimes),
            averageLoadTime: this.performanceMetrics.averageLoadTime,
            chunkLoadTimes: Object.fromEntries(this.performanceMetrics.chunkLoadTimes)
        }
    }

    // Reset performance metrics
    resetPerformanceMetrics() {
        this.performanceMetrics.routeLoadTimes.clear()
        this.performanceMetrics.chunkLoadTimes.clear()
        this.performanceMetrics.averageLoadTime = 0
    }
}

// Create singleton instance
const routerMiddleware = new RouterMiddleware()

// Export middleware manager and common middleware functions
export default routerMiddleware

// Individual middleware exports for direct use
export const authMiddleware = (context) => routerMiddleware.authMiddleware(context)
export const guestMiddleware = (context) => routerMiddleware.guestMiddleware(context)
export const adminMiddleware = (context) => routerMiddleware.adminMiddleware(context)
export const permissionMiddleware = (permissions) => (context) =>
    routerMiddleware.permissionMiddleware({ ...context, permissions })
export const rateLimitMiddleware = (context) => routerMiddleware.rateLimitMiddleware(context)
export const performanceMiddleware = (context) => routerMiddleware.performanceMiddleware(context)
export const analyticsMiddleware = (context) => routerMiddleware.analyticsMiddleware(context)
export const seoMiddleware = (context) => routerMiddleware.seoMiddleware(context)