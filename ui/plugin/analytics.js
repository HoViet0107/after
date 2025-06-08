// Plugin tích hợp analytics với tracking events, performance monitoring và user behavior analysis
class AnalyticsPlugin {
    constructor() {
        this.enabled = false
        this.trackingId = null
        this.userId = null
        this.sessionId = this.generateSessionId()
        this.events = []
        this.pageViews = []
        this.performanceMetrics = new Map()
        this.userProperties = {}
        
        // Configuration
        this.config = {
            debug: process.env.NODE_ENV === 'development',
            apiEndpoint: process.env.VUE_APP_ANALYTICS_API || '/api/analytics',
            batchSize: 50,
            flushInterval: 30000, // 30 seconds
            enablePerformanceTracking: true,
            enableErrorTracking: true,
            enableUserBehavior: true,
            excludePages: ['/admin', '/debug']
        }

        this.init()
    }

    init() {
        // Initialize session
        this.startSession()
        
        // Set up periodic flush
        if (typeof window !== 'undefined') {
            setInterval(() => {
                this.flush()
            }, this.config.flushInterval)

            // Flush on page unload
            window.addEventListener('beforeunload', () => {
                this.flush(true) // Force immediate flush
            })

            // Track performance metrics
            if (this.config.enablePerformanceTracking) {
                this.setupPerformanceTracking()
            }

            // Track errors
            if (this.config.enableErrorTracking) {
                this.setupErrorTracking()
            }

            // Track user behavior
            if (this.config.enableUserBehavior) {
                this.setupBehaviorTracking()
            }
        }
    }

    // Configuration methods
    configure(options) {
        this.config = { ...this.config, ...options }
        
        if (options.trackingId) {
            this.trackingId = options.trackingId
            this.enabled = true
        }

        this.log('Analytics configured:', this.config)
    }

    setUserId(userId) {
        this.userId = userId
        this.setUserProperty('userId', userId)
        this.track('user_identified', { userId })
    }

    setUserProperty(key, value) {
        this.userProperties[key] = value
        this.log('User property set:', { [key]: value })
    }

    // Core tracking methods
    track(eventName, properties = {}, options = {}) {
        if (!this.enabled && !this.config.debug) return

        const event = {
            id: this.generateEventId(),
            name: eventName,
            properties: {
                ...properties,
                ...this.userProperties,
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: Date.now(),
                url: window.location.href,
                userAgent: navigator.userAgent,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            },
            options
        }

        this.events.push(event)
        this.log('Event tracked:', event)

        // Auto-flush if batch size reached
        if (this.events.length >= this.config.batchSize) {
            this.flush()
        }

        return event.id
    }

    page(pageName, properties = {}) {
        if (!this.enabled && !this.config.debug) return

        // Check if page should be excluded
        if (this.config.excludePages.some(excluded => 
            window.location.pathname.startsWith(excluded))) {
            return
        }

        const pageView = {
            id: this.generateEventId(),
            type: 'page_view',
            name: pageName,
            properties: {
                ...properties,
                ...this.userProperties,
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: Date.now(),
                url: window.location.href,
                referrer: document.referrer,
                title: document.title,
                path: window.location.pathname,
                search: window.location.search,
                hash: window.location.hash
            }
        }

        this.pageViews.push(pageView)
        this.log('Page view tracked:', pageView)

        return pageView.id
    }

    // E-commerce tracking
    trackPurchase(transactionId, items, revenue, currency = 'VND') {
        this.track('purchase', {
            transactionId,
            items,
            revenue,
            currency,
            itemCount: items.length
        })
    }

    trackAddToCart(item, quantity = 1) {
        this.track('add_to_cart', {
            itemId: item.id,
            itemName: item.name,
            itemCategory: item.category,
            itemPrice: item.price,
            quantity
        })
    }

    // Social tracking
    trackShare(content, method) {
        this.track('content_share', {
            contentId: content.id,
            contentType: content.type,
            contentTitle: content.title,
            shareMethod: method
        })
    }

    trackLike(content) {
        this.track('content_like', {
            contentId: content.id,
            contentType: content.type,
            contentAuthor: content.author
        })
    }

    trackComment(content, commentText) {
        this.track('content_comment', {
            contentId: content.id,
            contentType: content.type,
            commentLength: commentText.length,
            hasLinks: /https?:\/\//.test(commentText),
            hasMentions: /@\w+/.test(commentText)
        })
    }

    // Performance tracking
    setupPerformanceTracking() {
        // Track page load performance
        window.addEventListener('load', () => {
            setTimeout(() => {
                if (window.performance) {
                    const perfData = window.performance.getEntriesByType('navigation')[0]
                    if (perfData) {
                        this.track('page_performance', {
                            loadTime: perfData.loadEventEnd - perfData.loadEventStart,
                            domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                            firstPaint: this.getFirstPaint(),
                            firstContentfulPaint: this.getFirstContentfulPaint(),
                            timeToInteractive: this.calculateTTI()
                        })
                    }
                }
            }, 1000)
        })
    }

    getFirstPaint() {
        const paint = window.performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-paint')
        return paint ? paint.startTime : null
    }

    getFirstContentfulPaint() {
        const paint = window.performance.getEntriesByType('paint')
            .find(entry => entry.name === 'first-contentful-paint')
        return paint ? paint.startTime : null
    }

    calculateTTI() {
        // Simplified TTI calculation
        return window.performance.now()
    }

    // Error tracking
    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.track('javascript_error', {
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            })
        })

        window.addEventListener('unhandledrejection', (event) => {
            this.track('promise_rejection', {
                reason: event.reason,
                stack: event.reason?.stack
            })
        })
    }

    // Behavior tracking
    setupBehaviorTracking() {
        let clickCount = 0
        let scrollDepth = 0
        let timeOnPage = Date.now()

        // Click tracking
        document.addEventListener('click', (event) => {
            clickCount++
            
            const element = event.target
            this.track('element_click', {
                tagName: element.tagName,
                className: element.className,
                id: element.id,
                text: element.textContent?.substring(0, 100),
                clickCount,
                x: event.clientX,
                y: event.clientY
            })
        })

        // Scroll tracking
        let scrollTimer
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimer)
            scrollTimer = setTimeout(() => {
                const currentDepth = Math.round(
                    (window.scrollY + window.innerHeight) / document.body.scrollHeight * 100
                )
                
                if (currentDepth > scrollDepth) {
                    scrollDepth = currentDepth
                    
                    // Track scroll milestones
                    if (scrollDepth >= 25 && scrollDepth < 50) {
                        this.track('scroll_depth', { depth: 25 })
                    } else if (scrollDepth >= 50 && scrollDepth < 75) {
                        this.track('scroll_depth', { depth: 50 })
                    } else if (scrollDepth >= 75 && scrollDepth < 100) {
                        this.track('scroll_depth', { depth: 75 })
                    } else if (scrollDepth >= 100) {
                        this.track('scroll_depth', { depth: 100 })
                    }
                }
            }, 250)
        })

        // Time on page
        window.addEventListener('beforeunload', () => {
            const timeSpent = Date.now() - timeOnPage
            this.track('time_on_page', { 
                duration: timeSpent,
                clicks: clickCount,
                maxScrollDepth: scrollDepth
            })
        })
    }

    // Data transmission
    async flush(force = false) {
        if ((!this.enabled && !this.config.debug) || 
            (this.events.length === 0 && this.pageViews.length === 0)) {
            return
        }

        const payload = {
            events: [...this.events],
            pageViews: [...this.pageViews],
            sessionId: this.sessionId,
            trackingId: this.trackingId,
            userId: this.userId,
            timestamp: Date.now()
        }

        // Clear arrays
        this.events.length = 0
        this.pageViews.length = 0

        try {
            if (this.config.debug) {
                console.log('Analytics flush:', payload)
                return
            }

            const method = force ? 'sendBeacon' : 'fetch'
            
            if (method === 'sendBeacon' && navigator.sendBeacon) {
                navigator.sendBeacon(
                    this.config.apiEndpoint,
                    JSON.stringify(payload)
                )
            } else {
                await fetch(this.config.apiEndpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload),
                    keepalive: force
                })
            }

            this.log('Analytics data sent successfully')
        } catch (error) {
            console.error('Analytics flush error:', error)
            
            // Re-add events back to queue on error
            this.events.unshift(...payload.events)
            this.pageViews.unshift(...payload.pageViews)
        }
    }

    // Session management
    startSession() {
        this.sessionId = this.generateSessionId()
        this.track('session_start')
    }

    endSession() {
        this.track('session_end')
        this.flush(true)
    }

    // Utility methods
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }

    generateEventId() {
        return 'evt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    }

    log(...args) {
        if (this.config.debug) {
            console.log('[Analytics]', ...args)
        }
    }

    // Vue plugin installation
    install(app) {
        // Global properties
        app.config.globalProperties.$analytics = this
        
        // Provide for composition API
        app.provide('analytics', this)

        // Global mixin for automatic page tracking
        app.mixin({
            beforeRouteEnter(to, from, next) {
                next(() => {
                    this.$analytics.page(to.name || to.path, {
                        routeName: to.name,
                        routePath: to.path,
                        routeParams: to.params,
                        routeQuery: to.query
                    })
                })
            },
            
            beforeRouteUpdate(to, from) {
                this.$analytics.page(to.name || to.path, {
                    routeName: to.name,
                    routePath: to.path,
                    routeParams: to.params,
                    routeQuery: to.query,
                    previousRoute: from.path
                })
            }
        })
    }
}

// Create and export plugin instance
const analytics = new AnalyticsPlugin()

export default analytics
export { AnalyticsPlugin }