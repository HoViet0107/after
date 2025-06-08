// Directive xử lý click outside element để đóng dropdown, modal, tooltip
const clickOutsideDirective = {
    name: 'click-outside',
    
    // Map để theo dõi các element và handler
    instances: new WeakMap(),
    
    mounted(el, binding) {
        const handler = (event) => {
            // Kiểm tra nếu click target không phải là element hoặc children của nó
            if (!el.contains(event.target)) {
                // Gọi callback function
                if (typeof binding.value === 'function') {
                    binding.value(event)
                }
            }
        }

        // Cấu hình options từ directive modifiers và arg
        const options = {
            capture: binding.modifiers.capture || false,
            passive: binding.modifiers.passive || false,
            once: binding.modifiers.once || false,
            
            // Delay để tránh trigger ngay lập tức
            delay: binding.arg ? parseInt(binding.arg) : 0,
            
            // Các element ngoại lệ (không trigger khi click vào)
            exclude: binding.modifiers.exclude ? 
                document.querySelectorAll(binding.modifiers.exclude) : [],
            
            // Chỉ trigger trên các event cụ thể
            events: binding.modifiers.touch ? 
                ['touchstart'] : ['mousedown', 'touchstart']
        }

        // Wrapper handler với delay và exclude logic
        const wrappedHandler = (event) => {
            // Kiểm tra exclude elements
            if (options.exclude.length > 0) {
                for (const excludeEl of options.exclude) {
                    if (excludeEl.contains(event.target)) {
                        return
                    }
                }
            }

            // Kiểm tra nếu element vẫn trong DOM
            if (!document.contains(el)) {
                return
            }

            // Delay execution nếu cần
            if (options.delay > 0) {
                setTimeout(() => handler(event), options.delay)
            } else {
                handler(event)
            }
        }

        // Lưu handler và options để cleanup sau
        const instance = {
            handler: wrappedHandler,
            options,
            originalHandler: binding.value
        }
        
        this.instances.set(el, instance)

        // Thêm event listeners
        options.events.forEach(eventType => {
            document.addEventListener(eventType, wrappedHandler, {
                capture: options.capture,
                passive: options.passive,
                once: options.once
            })
        })
    },

    updated(el, binding) {
        const instance = this.instances.get(el)
        
        if (instance && instance.originalHandler !== binding.value) {
            // Handler đã thay đổi, cần re-bind
            this.unmounted(el)
            this.mounted(el, binding)
        }
    },

    unmounted(el) {
        const instance = this.instances.get(el)
        
        if (instance) {
            // Remove event listeners
            instance.options.events.forEach(eventType => {
                document.removeEventListener(eventType, instance.handler, {
                    capture: instance.options.capture
                })
            })
            
            // Cleanup
            this.instances.delete(el)
        }
    }
}

// Enhanced version với thêm tính năng
const enhancedClickOutsideDirective = {
    name: 'click-outside-enhanced',
    
    instances: new WeakMap(),
    globalDisabled: false,
    
    // Disable/enable globally
    disable() {
        this.globalDisabled = true
    },
    
    enable() {
        this.globalDisabled = false
    },
    
    mounted(el, binding) {
        // Parse binding value
        let callback, options = {}
        
        if (typeof binding.value === 'function') {
            callback = binding.value
        } else if (typeof binding.value === 'object') {
            callback = binding.value.handler
            options = { ...binding.value }
        } else {
            console.warn('[v-click-outside] Invalid binding value')
            return
        }

        // Default options
        const defaultOptions = {
            enabled: true,
            capture: false,
            passive: false,
            once: false,
            delay: 0,
            debug: false,
            
            // Advanced options
            includeTouch: true,
            middleware: null, // Function to filter events
            detectIframe: false, // Detect clicks in iframes
            stopPropagation: false,
            preventDefault: false,
            
            // Mobile support
            touchThreshold: 10, // px - minimum touch movement to consider as click
            
            // Performance options
            throttle: 0, // ms - throttle event handling
            debounce: 0  // ms - debounce event handling
        }

        const finalOptions = { 
            ...defaultOptions, 
            ...options,
            capture: binding.modifiers.capture || options.capture,
            passive: binding.modifiers.passive || options.passive,
            once: binding.modifiers.once || options.once
        }

        // Touch tracking for mobile
        let touchStartX = 0
        let touchStartY = 0
        let hasTouchMoved = false

        const touchStartHandler = (event) => {
            touchStartX = event.touches[0].clientX
            touchStartY = event.touches[0].clientY
            hasTouchMoved = false
        }

        const touchMoveHandler = (event) => {
            if (!hasTouchMoved) {
                const touchX = event.touches[0].clientX
                const touchY = event.touches[0].clientY
                const deltaX = Math.abs(touchX - touchStartX)
                const deltaY = Math.abs(touchY - touchStartY)
                
                if (deltaX > finalOptions.touchThreshold || 
                    deltaY > finalOptions.touchThreshold) {
                    hasTouchMoved = true
                }
            }
        }

        // Main event handler
        const handler = (event) => {
            // Check global disabled state
            if (this.globalDisabled) return
            
            // Check instance enabled state
            if (!finalOptions.enabled) return
            
            // For touch events, check if touch moved (scroll vs tap)
            if (event.type.startsWith('touch') && hasTouchMoved) {
                return
            }

            // Check if element contains target
            if (el.contains(event.target)) return
            
            // Check middleware filter
            if (finalOptions.middleware && 
                !finalOptions.middleware(event, el)) {
                return
            }

            // Check if element is still in DOM
            if (!document.contains(el)) return

            // Debug logging
            if (finalOptions.debug) {
                console.log('[v-click-outside] Triggered:', {
                    target: event.target,
                    element: el,
                    event: event.type
                })
            }

            // Handle stop propagation/prevent default
            if (finalOptions.stopPropagation) {
                event.stopPropagation()
            }
            if (finalOptions.preventDefault) {
                event.preventDefault()
            }

            // Execute callback
            const executeCallback = () => {
                try {
                    callback(event, el)
                } catch (error) {
                    console.error('[v-click-outside] Callback error:', error)
                }
            }

            // Apply delay if specified
            if (finalOptions.delay > 0) {
                setTimeout(executeCallback, finalOptions.delay)
            } else {
                executeCallback()
            }
        }

        // Apply throttle/debounce if specified
        let finalHandler = handler
        
        if (finalOptions.throttle > 0) {
            finalHandler = throttle(handler, finalOptions.throttle)
        } else if (finalOptions.debounce > 0) {
            finalHandler = debounce(handler, finalOptions.debounce)
        }

        // Iframe click detection
        const iframeHandler = () => {
            if (finalOptions.detectIframe) {
                // Simulate click outside when iframe gains focus
                const syntheticEvent = new Event('synthetic-click-outside')
                syntheticEvent.target = document.activeElement
                finalHandler(syntheticEvent)
            }
        }

        // Event types to listen to
        const eventTypes = finalOptions.includeTouch ? 
            ['mousedown', 'touchstart'] : ['mousedown']

        // Store instance data
        const instance = {
            handler: finalHandler,
            touchStartHandler,
            touchMoveHandler,
            iframeHandler,
            options: finalOptions,
            eventTypes,
            originalCallback: callback
        }
        
        this.instances.set(el, instance)

        // Add event listeners
        eventTypes.forEach(eventType => {
            document.addEventListener(eventType, finalHandler, {
                capture: finalOptions.capture,
                passive: finalOptions.passive,
                once: finalOptions.once
            })
        })

        // Add touch handlers for mobile support
        if (finalOptions.includeTouch) {
            el.addEventListener('touchstart', touchStartHandler, { passive: true })
            el.addEventListener('touchmove', touchMoveHandler, { passive: true })
        }

        // Add iframe detection
        if (finalOptions.detectIframe) {
            window.addEventListener('blur', iframeHandler)
        }
    },

    updated(el, binding) {
        const instance = this.instances.get(el)
        
        if (instance) {
            // Check if callback or options changed
            let callback, options = {}
            
            if (typeof binding.value === 'function') {
                callback = binding.value
            } else if (typeof binding.value === 'object') {
                callback = binding.value.handler
                options = { ...binding.value }
            }

            if (instance.originalCallback !== callback) {
                // Callback changed, re-mount
                this.unmounted(el)
                this.mounted(el, binding)
            } else if (options.enabled !== undefined && 
                       options.enabled !== instance.options.enabled) {
                // Just update enabled state
                instance.options.enabled = options.enabled
            }
        }
    },

    unmounted(el) {
        const instance = this.instances.get(el)
        
        if (instance) {
            // Remove event listeners
            instance.eventTypes.forEach(eventType => {
                document.removeEventListener(eventType, instance.handler, {
                    capture: instance.options.capture
                })
            })

            // Remove touch handlers
            if (instance.touchStartHandler) {
                el.removeEventListener('touchstart', instance.touchStartHandler)
                el.removeEventListener('touchmove', instance.touchMoveHandler)
            }

            // Remove iframe handler
            if (instance.options.detectIframe) {
                window.removeEventListener('blur', instance.iframeHandler)
            }
            
            // Cleanup
            this.instances.delete(el)
        }
    }
}

// Utility functions
function throttle(func, limit) {
    let inThrottle
    return function() {
        const args = arguments
        const context = this
        if (!inThrottle) {
            func.apply(context, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

function debounce(func, wait, immediate) {
    let timeout
    return function() {
        const context = this
        const args = arguments
        const later = function() {
            timeout = null
            if (!immediate) func.apply(context, args)
        }
        const callNow = immediate && !timeout
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
        if (callNow) func.apply(context, args)
    }
}

// Export both versions
export default clickOutsideDirective
export { enhancedClickOutsideDirective }