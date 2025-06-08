// Directive sử dụng Intersection Observer API để theo dõi visibility, infinite scroll và animations
class IntersectionManager {
    constructor() {
        this.observers = new Map()
        this.elements = new WeakMap()
        this.globalConfig = {
            root: null,
            rootMargin: '0px',
            threshold: [0, 0.25, 0.5, 0.75, 1],
            
            // Performance options
            trackVisibility: true,
            delay: 100,
            
            // Animation options
            animateOnce: true,
            animationDelay: 0,
            animationDuration: 300,
            animationEasing: 'ease-out',
            
            // Debug
            debug: false
        }

        this.init()
    }

    init() {
        // Check browser support
        this.supportsIntersectionObserver = 'IntersectionObserver' in window
        this.supportsV2 = this.checkV2Support()
        
        // Default observers
        this.createObserver('default', this.globalConfig)
        this.createObserver('viewport', { 
            ...this.globalConfig, 
            threshold: 0.1,
            rootMargin: '0px'
        })
        this.createObserver('scroll', { 
            ...this.globalConfig, 
            threshold: 0,
            rootMargin: '100px 0px'
        })

        this.log('IntersectionManager initialized', {
            supported: this.supportsIntersectionObserver,
            v2: this.supportsV2
        })
    }

    checkV2Support() {
        try {
            // Test if IntersectionObserver V2 is supported (trackVisibility)
            new IntersectionObserver(() => {}, { trackVisibility: true, delay: 100 })
            return true
        } catch {
            return false
        }
    }

    configure(options) {
        this.globalConfig = { ...this.globalConfig, ...options }
        
        // Recreate default observer
        this.destroyObserver('default')
        this.createObserver('default', this.globalConfig)
        
        this.log('Configuration updated:', this.globalConfig)
    }

    createObserver(name, options = {}) {
        if (!this.supportsIntersectionObserver) {
            this.log('IntersectionObserver not supported, using fallback')
            return null
        }

        const config = { ...this.globalConfig, ...options }
        
        // Create observer options
        const observerOptions = {
            root: config.root,
            rootMargin: config.rootMargin,
            threshold: config.threshold
        }

        // Add V2 features if supported
        if (this.supportsV2 && config.trackVisibility) {
            observerOptions.trackVisibility = true
            observerOptions.delay = config.delay
        }

        const observer = new IntersectionObserver((entries) => {
            this.handleIntersections(entries, config)
        }, observerOptions)

        this.observers.set(name, {
            observer,
            config,
            elements: new Set()
        })

        this.log(`Observer '${name}' created with config:`, config)
        return observer
    }

    destroyObserver(name) {
        const observerData = this.observers.get(name)
        if (observerData) {
            observerData.observer.disconnect()
            observerData.elements.clear()
            this.observers.delete(name)
            this.log(`Observer '${name}' destroyed`)
        }
    }

    observe(element, options = {}) {
        if (!this.supportsIntersectionObserver) {
            // Fallback for browsers without support
            this.handleFallback(element, options)
            return
        }

        // Determine which observer to use
        const observerName = options.observer || 'default'
        const observerData = this.observers.get(observerName)
        
        if (!observerData) {
            this.log(`Observer '${observerName}' not found, creating...`)
            this.createObserver(observerName, options)
        }

        const finalObserverData = this.observers.get(observerName)
        if (!finalObserverData) {
            this.log(`Failed to create observer '${observerName}'`)
            return
        }

        // Store element data
        const elementData = {
            element,
            options: { ...finalObserverData.config, ...options },
            observerName,
            
            // State tracking
            isIntersecting: false,
            intersectionRatio: 0,
            hasBeenVisible: false,
            visibilityTime: 0,
            lastVisibilityChange: 0,
            
            // Animation state
            hasAnimated: false,
            animationApplied: false,
            
            // Performance tracking
            entries: [],
            maxEntries: 10
        }

        this.elements.set(element, elementData)
        finalObserverData.elements.add(element)
        finalObserverData.observer.observe(element)

        this.log('Element added to observer:', { element, observerName })
    }

    unobserve(element) {
        const elementData = this.elements.get(element)
        if (!elementData) return

        const observerData = this.observers.get(elementData.observerName)
        if (observerData) {
            observerData.observer.unobserve(element)
            observerData.elements.delete(element)
        }

        this.elements.delete(element)
        this.log('Element removed from observer:', element)
    }

    handleIntersections(entries, config) {
        entries.forEach(entry => {
            const elementData = this.elements.get(entry.target)
            if (!elementData) return

            this.updateElementData(elementData, entry)
            this.processIntersection(elementData, entry, config)
        })
    }

    updateElementData(elementData, entry) {
        const wasIntersecting = elementData.isIntersecting
        
        // Update intersection state
        elementData.isIntersecting = entry.isIntersecting
        elementData.intersectionRatio = entry.intersectionRatio
        elementData.lastVisibilityChange = Date.now()

        // Track visibility duration
        if (entry.isIntersecting && !wasIntersecting) {
            elementData.visibilityTime = Date.now()
            elementData.hasBeenVisible = true
        } else if (!entry.isIntersecting && wasIntersecting) {
            elementData.visibilityTime = Date.now() - elementData.visibilityTime
        }

        // Store entry history (for debugging/analytics)
        elementData.entries.push({
            time: Date.now(),
            isIntersecting: entry.isIntersecting,
            intersectionRatio: entry.intersectionRatio,
            boundingClientRect: entry.boundingClientRect,
            intersectionRect: entry.intersectionRect
        })

        // Keep only recent entries
        if (elementData.entries.length > elementData.maxEntries) {
            elementData.entries.shift()
        }
    }

    processIntersection(elementData, entry, config) {
        const { element, options } = elementData

        // Handle different intersection types
        if (options.type === 'visibility') {
            this.handleVisibility(elementData, entry)
        } else if (options.type === 'animation') {
            this.handleAnimation(elementData, entry)
        } else if (options.type === 'infinite-scroll') {
            this.handleInfiniteScroll(elementData, entry)
        } else if (options.type === 'lazy-load') {
            this.handleLazyLoad(elementData, entry)
        } else {
            // Default behavior - call callback
            this.handleCallback(elementData, entry)
        }

        // Progress tracking
        if (options.onProgress && typeof options.onProgress === 'function') {
            options.onProgress(entry.intersectionRatio, element, entry)
        }

        // Threshold callbacks
        this.handleThresholds(elementData, entry)
    }

    handleVisibility(elementData, entry) {
        const { element, options } = elementData

        if (entry.isIntersecting) {
            element.classList.add(options.visibleClass || 'is-visible')
            element.classList.remove(options.hiddenClass || 'is-hidden')
            
            if (options.onVisible) {
                options.onVisible(element, entry)
            }
        } else {
            element.classList.remove(options.visibleClass || 'is-visible')
            element.classList.add(options.hiddenClass || 'is-hidden')
            
            if (options.onHidden) {
                options.onHidden(element, entry)
            }
        }
    }

    handleAnimation(elementData, entry) {
        const { element, options } = elementData

        if (entry.isIntersecting && !elementData.hasAnimated) {
            // Apply animation
            this.applyAnimation(element, options)
            elementData.hasAnimated = true

            if (options.onAnimate) {
                options.onAnimate(element, entry)
            }

            // Unobserve if animate once
            if (options.animateOnce !== false) {
                setTimeout(() => {
                    this.unobserve(element)
                }, options.animationDuration || 300)
            }
        }
    }

    handleInfiniteScroll(elementData, entry) {
        const { element, options } = elementData

        if (entry.isIntersecting) {
            if (options.onLoadMore && typeof options.onLoadMore === 'function') {
                // Prevent multiple calls
                if (!elementData.isLoading) {
                    elementData.isLoading = true
                    
                    const loadPromise = options.onLoadMore(element, entry)
                    
                    if (loadPromise && typeof loadPromise.then === 'function') {
                        loadPromise.finally(() => {
                            elementData.isLoading = false
                        })
                    } else {
                        elementData.isLoading = false
                    }
                }
            }
        }
    }

    handleLazyLoad(elementData, entry) {
        const { element, options } = elementData

        if (entry.isIntersecting && !elementData.hasLoaded) {
            if (options.onLoad && typeof options.onLoad === 'function') {
                options.onLoad(element, entry)
                elementData.hasLoaded = true
                
                // Unobserve after loading
                this.unobserve(element)
            }
        }
    }

    handleCallback(elementData, entry) {
        const { options } = elementData

        if (options.callback && typeof options.callback === 'function') {
            options.callback(entry, elementData.element)
        }

        // Separate enter/leave callbacks
        if (entry.isIntersecting && options.onEnter) {
            options.onEnter(elementData.element, entry)
        } else if (!entry.isIntersecting && options.onLeave) {
            options.onLeave(elementData.element, entry)
        }
    }

    handleThresholds(elementData, entry) {
        const { options } = elementData

        if (!options.thresholds) return

        Object.entries(options.thresholds).forEach(([threshold, callback]) => {
            const thresholdValue = parseFloat(threshold)
            
            if (entry.intersectionRatio >= thresholdValue && 
                typeof callback === 'function') {
                callback(elementData.element, entry, thresholdValue)
            }
        })
    }

    applyAnimation(element, options) {
        const animation = options.animation || 'fadeIn'
        const duration = options.animationDuration || 300
        const delay = options.animationDelay || 0
        const easing = options.animationEasing || 'ease-out'

        // Apply animation class
        element.classList.add('intersection-animate', `animate-${animation}`)
        
        // Set CSS custom properties
        element.style.setProperty('--animation-duration', `${duration}ms`)
        element.style.setProperty('--animation-delay', `${delay}ms`)
        element.style.setProperty('--animation-easing', easing)

        // Apply inline styles for common animations
        this.applyAnimationStyles(element, animation, duration, delay, easing)
    }

    applyAnimationStyles(element, animation, duration, delay, easing) {
        const animations = {
            fadeIn: {
                opacity: '0',
                transition: `opacity ${duration}ms ${easing} ${delay}ms`
            },
            slideUp: {
                opacity: '0',
                transform: 'translateY(30px)',
                transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`
            },
            slideDown: {
                opacity: '0',
                transform: 'translateY(-30px)',
                transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`
            },
            slideLeft: {
                opacity: '0',
                transform: 'translateX(30px)',
                transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`
            },
            slideRight: {
                opacity: '0',
                transform: 'translateX(-30px)',
                transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`
            },
            zoomIn: {
                opacity: '0',
                transform: 'scale(0.8)',
                transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`
            },
            zoomOut: {
                opacity: '0',
                transform: 'scale(1.2)',
                transition: `opacity ${duration}ms ${easing} ${delay}ms, transform ${duration}ms ${easing} ${delay}ms`
            }
        }

        const animationStyles = animations[animation]
        if (animationStyles) {
            Object.assign(element.style, animationStyles)
            
            // Trigger animation
            setTimeout(() => {
                element.style.opacity = '1'
                element.style.transform = 'none'
            }, 10)
        }
    }

    handleFallback(element, options) {
        // Fallback for browsers without IntersectionObserver
        this.log('Using fallback for element:', element)
        
        const fallbackCheck = () => {
            const rect = element.getBoundingClientRect()
            const isVisible = (
                rect.top < window.innerHeight &&
                rect.bottom > 0 &&
                rect.left < window.innerWidth &&
                rect.right > 0
            )

            if (isVisible && options.callback) {
                options.callback({
                    isIntersecting: true,
                    intersectionRatio: 1,
                    target: element
                }, element)
            }
        }

        // Check on scroll and resize
        window.addEventListener('scroll', fallbackCheck, { passive: true })
        window.addEventListener('resize', fallbackCheck, { passive: true })
        
        // Initial check
        fallbackCheck()
    }

    // Utility methods
    getElementData(element) {
        return this.elements.get(element)
    }

    getObserverStats(observerName) {
        const observerData = this.observers.get(observerName)
        if (!observerData) return null

        return {
            name: observerName,
            elementCount: observerData.elements.size,
            config: observerData.config
        }
    }

    getAllStats() {
        const stats = {
            totalObservers: this.observers.size,
            totalElements: this.elements.size || 0,
            observers: {}
        }

        this.observers.forEach((data, name) => {
            stats.observers[name] = this.getObserverStats(name)
        })

        return stats
    }

    log(...args) {
        if (this.globalConfig.debug) {
            console.log('[IntersectionManager]', ...args)
        }
    }

    // Cleanup
    destroy() {
        this.observers.forEach((data, name) => {
            this.destroyObserver(name)
        })
        this.elements = new WeakMap()
    }
}

// Create global instance
const intersectionManager = new IntersectionManager()

// Vue directive
const intersectionDirective = {
    mounted(el, binding) {
        let options = {}

        // Parse binding value
        if (typeof binding.value === 'function') {
            options.callback = binding.value
        } else if (typeof binding.value === 'object') {
            options = { ...binding.value }
        }

        // Handle modifiers
        if (binding.modifiers.once) options.animateOnce = true
        if (binding.modifiers.animation) options.type = 'animation'
        if (binding.modifiers.visibility) options.type = 'visibility'
        if (binding.modifiers.scroll) options.type = 'infinite-scroll'
        if (binding.modifiers.lazy) options.type = 'lazy-load'

        // Handle arg as animation type
        if (binding.arg) {
            options.animation = binding.arg
            options.type = 'animation'
        }

        // Default animation if type is animation but no animation specified
        if (options.type === 'animation' && !options.animation) {
            options.animation = 'fadeIn'
        }

        intersectionManager.observe(el, options)
    },

    updated(el, binding) {
        if (binding.value !== binding.oldValue) {
            intersectionManager.unobserve(el)
            intersectionDirective.mounted(el, binding)
        }
    },

    unmounted(el) {
        intersectionManager.unobserve(el)
    }
}

// CSS styles for animations
const animationStyles = `
.intersection-animate {
    will-change: opacity, transform;
}

.animate-fadeIn {
    opacity: 0;
}

.animate-slideUp {
    opacity: 0;
    transform: translateY(30px);
}

.animate-slideDown {
    opacity: 0;
    transform: translateY(-30px);
}

.animate-slideLeft {
    opacity: 0;
    transform: translateX(30px);
}

.animate-slideRight {
    opacity: 0;
    transform: translateX(-30px);
}

.animate-zoomIn {
    opacity: 0;
    transform: scale(0.8);
}

.animate-zoomOut {
    opacity: 0;
    transform: scale(1.2);
}

/* Utility classes */
.is-visible {
    opacity: 1;
}

.is-hidden {
    opacity: 0;
}
`

// Inject styles
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style')
    styleEl.textContent = animationStyles
    document.head.appendChild(styleEl)
}

export default intersectionDirective
export { intersectionManager, IntersectionManager }