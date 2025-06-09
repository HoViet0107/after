// Directive thực hiện lazy loading cho images, components và content với Intersection Observer
class LazyLoader {
    constructor() {
        this.observers = new Map()
        this.instances = new WeakMap()
        this.imageCache = new Map()
        
        // Global configuration
        this.config = {
            root: null,
            rootMargin: '50px',
            threshold: 0.1,
            
            // Loading states
            loadingClass: 'lazy-loading',
            loadedClass: 'lazy-loaded',
            errorClass: 'lazy-error',
            
            // Image options
            placeholder: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB2aWV3Qm94PSIwIDAgMSAxIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmNmY2ZjYiLz48L3N2Zz4=',
            errorImage: null,
            enableWebP: true,
            enableResponsive: true,
            
            // Performance options
            delay: 0,
            throttle: 100,
            maxRetries: 3,
            retryDelay: 1000,
            
            // Cache options
            enableCache: true,
            cacheSize: 100,
            
            // Debug
            debug: process.env.NODE_ENV === 'development'
        }

        this.init()
    }

    init() {
        // Check browser support
        this.supportsIntersectionObserver = 'IntersectionObserver' in window
        this.supportsWebP = null
        
        if (this.config.enableWebP) {
            this.detectWebPSupport()
        }

        // Create default observer
        this.createObserver('default', this.config)
        
        this.log('LazyLoader initialized', {
            intersectionObserver: this.supportsIntersectionObserver,
            webP: this.supportsWebP
        })
    }

    configure(options) {
        this.config = { ...this.config, ...options }
        
        // Recreate default observer with new config
        this.destroyObserver('default')
        this.createObserver('default', this.config)
        
        this.log('LazyLoader reconfigured:', this.config)
    }

    createObserver(name, options = {}) {
        if (!this.supportsIntersectionObserver) return null

        const observerOptions = {
            root: options.root || this.config.root,
            rootMargin: options.rootMargin || this.config.rootMargin,
            threshold: options.threshold || this.config.threshold
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.handleIntersection(entry.target, options)
                }
            })
        }, observerOptions)

        this.observers.set(name, observer)
        return observer
    }

    destroyObserver(name) {
        const observer = this.observers.get(name)
        if (observer) {
            observer.disconnect()
            this.observers.delete(name)
        }
    }

    async handleIntersection(element, options = {}) {
        const instance = this.instances.get(element)
        if (!instance) return

        const observer = this.observers.get(instance.observerName)
        if (observer) {
            observer.unobserve(element)
        }

        // Apply delay if specified
        if (options.delay || this.config.delay) {
            await this.delay(options.delay || this.config.delay)
        }

        // Load based on element type
        switch (instance.type) {
            case 'image':
                await this.loadImage(element, instance)
                break
            case 'background':
                await this.loadBackground(element, instance)
                break
            case 'component':
                await this.loadComponent(element, instance)
                break
            case 'content':
                await this.loadContent(element, instance)
                break
            default:
                this.log('Unknown lazy type:', instance.type)
        }
    }

    async loadImage(img, instance) {
        const { src, srcset, sizes, alt } = instance.data
        
        try {
            // Add loading class
            img.classList.add(this.config.loadingClass)
            
            // Check cache first
            const cacheKey = this.getCacheKey(src, srcset)
            if (this.config.enableCache && this.imageCache.has(cacheKey)) {
                const cachedData = this.imageCache.get(cacheKey)
                this.applyImageData(img, cachedData)
                this.handleImageSuccess(img, instance)
                return
            }

            // Create new image for preloading
            const imageLoader = new Image()
            
            // Set up promise for loading
            const loadPromise = new Promise((resolve, reject) => {
                imageLoader.onload = () => resolve(imageLoader)
                imageLoader.onerror = reject
                
                // Timeout handling
                setTimeout(() => {
                    reject(new Error('Image load timeout'))
                }, 10000)
            })

            // Handle responsive images
            if (srcset && this.config.enableResponsive) {
                imageLoader.srcset = srcset
                if (sizes) imageLoader.sizes = sizes
            }

            // Convert to WebP if supported
            const finalSrc = this.getOptimizedSrc(src)
            imageLoader.src = finalSrc

            // Wait for load
            await loadPromise

            // Cache the result
            if (this.config.enableCache) {
                const imageData = {
                    src: finalSrc,
                    srcset: imageLoader.srcset,
                    sizes: imageLoader.sizes,
                    width: imageLoader.naturalWidth,
                    height: imageLoader.naturalHeight
                }
                this.cacheImage(cacheKey, imageData)
            }

            // Apply to actual element
            this.applyImageData(img, {
                src: finalSrc,
                srcset: imageLoader.srcset,
                sizes: imageLoader.sizes,
                alt: alt || ''
            })

            this.handleImageSuccess(img, instance)

        } catch (error) {
            this.handleImageError(img, instance, error)
        }
    }

    async loadBackground(element, instance) {
        const { src } = instance.data
        
        try {
            element.classList.add(this.config.loadingClass)
            
            // Check cache
            const cacheKey = this.getCacheKey(src)
            if (this.config.enableCache && this.imageCache.has(cacheKey)) {
                const cachedData = this.imageCache.get(cacheKey)
                element.style.backgroundImage = `url("${cachedData.src}")`
                this.handleLoadSuccess(element, instance)
                return
            }

            // Preload image
            const img = new Image()
            await new Promise((resolve, reject) => {
                img.onload = resolve
                img.onerror = reject
                img.src = this.getOptimizedSrc(src)
            })

            // Cache and apply
            if (this.config.enableCache) {
                this.cacheImage(cacheKey, { src: img.src })
            }

            element.style.backgroundImage = `url("${img.src}")`
            this.handleLoadSuccess(element, instance)

        } catch (error) {
            this.handleLoadError(element, instance, error)
        }
    }

    async loadComponent(element, instance) {
        const { component, props, loading } = instance.data
        
        try {
            element.classList.add(this.config.loadingClass)
            
            // Show loading component if provided
            if (loading) {
                element.innerHTML = loading
            }

            // Dynamic import component
            let componentModule
            if (typeof component === 'string') {
                componentModule = await import(component)
            } else if (typeof component === 'function') {
                componentModule = { default: await component() }
            } else {
                componentModule = { default: component }
            }

            // Call success callback with component
            if (instance.callback) {
                instance.callback(componentModule.default, props)
            }

            this.handleLoadSuccess(element, instance)

        } catch (error) {
            this.handleLoadError(element, instance, error)
        }
    }

    async loadContent(element, instance) {
        const { url, method, body, headers } = instance.data
        
        try {
            element.classList.add(this.config.loadingClass)
            
            // Fetch content
            const response = await fetch(url, {
                method: method || 'GET',
                body: body || null,
                headers: headers || {}
            })

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`)
            }

            const content = await response.text()
            element.innerHTML = content

            this.handleLoadSuccess(element, instance)

        } catch (error) {
            this.handleLoadError(element, instance, error)
        }
    }

    // Helper methods
    applyImageData(img, data) {
        if (data.src) img.src = data.src
        if (data.srcset) img.srcset = data.srcset
        if (data.sizes) img.sizes = data.sizes
        if (data.alt) img.alt = data.alt
    }

    getOptimizedSrc(src) {
        if (!src) return src
        
        // Convert to WebP if supported
        if (this.supportsWebP && this.config.enableWebP) {
            // Simple WebP conversion - in real app, this would be handled by server
            if (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png')) {
                return src.replace(/\.(jpg|jpeg|png)$/i, '.webp')
            }
        }
        
        return src
    }

    handleImageSuccess(img, instance) {
        img.classList.remove(this.config.loadingClass)
        img.classList.add(this.config.loadedClass)
        
        if (instance.callback) {
            instance.callback(null, img)
        }
        
        this.log('Image loaded successfully:', img.src)
    }

    handleImageError(img, instance, error) {
        img.classList.remove(this.config.loadingClass)
        img.classList.add(this.config.errorClass)
        
        // Retry logic
        if (instance.retryCount < (instance.maxRetries || this.config.maxRetries)) {
            instance.retryCount++
            this.log(`Retrying image load (${instance.retryCount}/${instance.maxRetries}):`, error)
            
            setTimeout(() => {
                this.loadImage(img, instance)
            }, instance.retryDelay || this.config.retryDelay)
            return
        }

        // Set error image if available
        if (this.config.errorImage) {
            img.src = this.config.errorImage
        }
        
        if (instance.callback) {
            instance.callback(error, img)
        }
        
        this.log('Image load failed:', error)
    }

    handleLoadSuccess(element, instance) {
        element.classList.remove(this.config.loadingClass)
        element.classList.add(this.config.loadedClass)
        
        if (instance.callback) {
            instance.callback(null, element)
        }
        
        this.log('Content loaded successfully')
    }

    handleLoadError(element, instance, error) {
        element.classList.remove(this.config.loadingClass)
        element.classList.add(this.config.errorClass)
        
        if (instance.callback) {
            instance.callback(error, element)
        }
        
        this.log('Content load failed:', error)
    }

    getCacheKey(src, srcset = '') {
        return btoa(src + srcset).replace(/[/+=]/g, '')
    }

    cacheImage(key, data) {
        if (this.imageCache.size >= this.config.cacheSize) {
            // Remove oldest entry
            const firstKey = this.imageCache.keys().next().value
            this.imageCache.delete(firstKey)
        }
        this.imageCache.set(key, data)
    }

    async detectWebPSupport() {
        try {
            const webpData = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA'
            const img = new Image()
            
            this.supportsWebP = await new Promise(resolve => {
                img.onload = () => resolve(img.width === 2)
                img.onerror = () => resolve(false)
                img.src = webpData
            })
        } catch {
            this.supportsWebP = false
        }
        
        this.log('WebP support:', this.supportsWebP)
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    log(...args) {
        if (this.config.debug) {
            console.log('[LazyLoader]', ...args)
        }
    }

    // Cleanup
    destroy() {
        this.observers.forEach((observer, name) => {
            this.destroyObserver(name)
        })
        this.instances = new WeakMap()
        this.imageCache.clear()
    }
}

// Create global instance
const lazyLoader = new LazyLoader()

// Vue directive
const lazyDirective = {
    mounted(el, binding) {
        // Parse binding value
        let data = {}
        let callback = null
        let type = 'image'
        let observerName = 'default'

        if (typeof binding.value === 'string') {
            // Simple string value
            if (el.tagName.toLowerCase() === 'img') {
                data.src = binding.value
                type = 'image'
            } else {
                data.src = binding.value
                type = 'background'
            }
        } else if (typeof binding.value === 'object') {
            data = { ...binding.value }
            callback = data.callback
            type = data.type || type
            observerName = data.observer || observerName
            delete data.callback
            delete data.type
            delete data.observer
        }

        // Handle modifiers
        if (binding.modifiers.background) type = 'background'
        if (binding.modifiers.component) type = 'component'
        if (binding.modifiers.content) type = 'content'

        // Create instance data
        const instance = {
            type,
            data,
            callback,
            observerName,
            retryCount: 0,
            maxRetries: data.maxRetries || lazyLoader.config.maxRetries,
            retryDelay: data.retryDelay || lazyLoader.config.retryDelay
        }

        lazyLoader.instances.set(el, instance)

        // Set placeholder for images
        if (type === 'image' && el.tagName.toLowerCase() === 'img') {
            if (!el.src && lazyLoader.config.placeholder) {
                el.src = lazyLoader.config.placeholder
            }
        }

        // Start observing
        const observer = lazyLoader.observers.get(observerName)
        if (observer) {
            observer.observe(el)
        } else if (!lazyLoader.supportsIntersectionObserver) {
            // Fallback for browsers without IntersectionObserver
            lazyLoader.handleIntersection(el)
        }
    },

    updated(el, binding) {
        const instance = lazyLoader.instances.get(el)
        if (instance && binding.value !== binding.oldValue) {
            // Re-mount with new value
            lazyDirective.unmounted(el)
            lazyDirective.mounted(el, binding)
        }
    },

    unmounted(el) {
        const instance = lazyLoader.instances.get(el)
        if (instance) {
            const observer = lazyLoader.observers.get(instance.observerName)
            if (observer) {
                observer.unobserve(el)
            }
            lazyLoader.instances.delete(el)
        }
    }
}

// Export
export default lazyDirective
export { lazyLoader, LazyLoader }