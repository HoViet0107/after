// Directive tạo tooltip với positioning, animation và responsive support
class TooltipManager {
    constructor() {
        this.tooltips = new WeakMap()
        this.activeTooltip = null
        this.config = {
            // Positioning
            defaultPlacement: 'top',
            offset: 8,
            
            // Timing
            delay: 300,
            hideDelay: 100,
            
            // Animation
            animation: 'fade',
            duration: 200,
            
            // Styling
            theme: 'dark',
            maxWidth: 200,
            zIndex: 9999,
            
            // Behavior
            trigger: 'hover',
            interactive: false,
            arrow: true,
            
            // Responsive
            responsive: true,
            mobileBreakpoint: 768,
            
            // Debug
            debug: false
        }

        this.init()
    }

    init() {
        // Create tooltip container
        this.createContainer()
        
        // Global event listeners
        document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true })
        window.addEventListener('resize', this.handleResize.bind(this))
        
        // Touch device detection
        this.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0
        
        this.log('TooltipManager initialized')
    }

    createContainer() {
        if (document.getElementById('tooltip-container')) return

        this.container = document.createElement('div')
        this.container.id = 'tooltip-container'
        this.container.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            z-index: ${this.config.zIndex};
            pointer-events: none;
        `
        document.body.appendChild(this.container)
    }

    configure(options) {
        this.config = { ...this.config, ...options }
        this.log('Tooltip configured:', this.config)
    }

    create(element, options) {
        const tooltip = {
            element,
            content: options.content || element.getAttribute('title') || '',
            placement: options.placement || this.config.defaultPlacement,
            trigger: options.trigger || this.config.trigger,
            delay: options.delay ?? this.config.delay,
            hideDelay: options.hideDelay ?? this.config.hideDelay,
            theme: options.theme || this.config.theme,
            maxWidth: options.maxWidth || this.config.maxWidth,
            interactive: options.interactive ?? this.config.interactive,
            arrow: options.arrow ?? this.config.arrow,
            animation: options.animation || this.config.animation,
            duration: options.duration || this.config.duration,
            offset: options.offset ?? this.config.offset,
            customClass: options.class || '',
            html: options.html || false,
            disabled: options.disabled || false,
            
            // Runtime properties
            tooltipElement: null,
            showTimer: null,
            hideTimer: null,
            isVisible: false,
            isHovered: false,
            
            // Callbacks
            onShow: options.onShow,
            onHide: options.onHide,
            onUpdate: options.onUpdate
        }

        // Remove title attribute to prevent native tooltip
        if (element.hasAttribute('title')) {
            tooltip.originalTitle = element.getAttribute('title')
            element.removeAttribute('title')
        }

        // Bind events
        this.bindEvents(tooltip)
        
        // Store tooltip
        this.tooltips.set(element, tooltip)
        
        this.log('Tooltip created for element:', element)
        return tooltip
    }

    bindEvents(tooltip) {
        const { element, trigger } = tooltip

        if (trigger === 'hover' || trigger.includes('hover')) {
            element.addEventListener('mouseenter', () => this.handleMouseEnter(tooltip))
            element.addEventListener('mouseleave', () => this.handleMouseLeave(tooltip))
        }

        if (trigger === 'focus' || trigger.includes('focus')) {
            element.addEventListener('focus', () => this.show(tooltip))
            element.addEventListener('blur', () => this.hide(tooltip))
        }

        if (trigger === 'click' || trigger.includes('click')) {
            element.addEventListener('click', (e) => {
                e.preventDefault()
                this.toggle(tooltip)
            })
        }

        // Touch support
        if (this.isTouchDevice && trigger === 'hover') {
            element.addEventListener('touchstart', (e) => {
                e.preventDefault()
                this.toggle(tooltip)
            }, { passive: false })
        }
    }

    handleMouseEnter(tooltip) {
        if (tooltip.disabled) return
        
        tooltip.isHovered = true
        this.clearTimer(tooltip, 'hideTimer')
        
        if (tooltip.delay > 0) {
            tooltip.showTimer = setTimeout(() => {
                if (tooltip.isHovered) {
                    this.show(tooltip)
                }
            }, tooltip.delay)
        } else {
            this.show(tooltip)
        }
    }

    handleMouseLeave(tooltip) {
        tooltip.isHovered = false
        this.clearTimer(tooltip, 'showTimer')
        
        if (tooltip.hideDelay > 0) {
            tooltip.hideTimer = setTimeout(() => {
                if (!tooltip.isHovered && !tooltip.tooltipHovered) {
                    this.hide(tooltip)
                }
            }, tooltip.hideDelay)
        } else {
            this.hide(tooltip)
        }
    }

    show(tooltip) {
        if (tooltip.disabled || tooltip.isVisible) return

        // Hide any active tooltip
        if (this.activeTooltip && this.activeTooltip !== tooltip) {
            this.hide(this.activeTooltip)
        }

        // Create tooltip element
        tooltip.tooltipElement = this.createTooltipElement(tooltip)
        
        // Add to container
        this.container.appendChild(tooltip.tooltipElement)
        
        // Position tooltip
        this.position(tooltip)
        
        // Show with animation
        this.animate(tooltip, 'show')
        
        // Update state
        tooltip.isVisible = true
        this.activeTooltip = tooltip
        
        // Interactive tooltip support
        if (tooltip.interactive) {
            this.bindTooltipEvents(tooltip)
        }

        // Callback
        if (tooltip.onShow) {
            tooltip.onShow(tooltip.element, tooltip.tooltipElement)
        }

        this.log('Tooltip shown')
    }

    hide(tooltip) {
        if (!tooltip.isVisible || !tooltip.tooltipElement) return

        // Clear timers
        this.clearTimer(tooltip, 'showTimer')
        this.clearTimer(tooltip, 'hideTimer')

        // Hide with animation
        this.animate(tooltip, 'hide').then(() => {
            if (tooltip.tooltipElement && tooltip.tooltipElement.parentNode) {
                tooltip.tooltipElement.parentNode.removeChild(tooltip.tooltipElement)
            }
            tooltip.tooltipElement = null
        })

        // Update state
        tooltip.isVisible = false
        if (this.activeTooltip === tooltip) {
            this.activeTooltip = null
        }

        // Callback
        if (tooltip.onHide) {
            tooltip.onHide(tooltip.element)
        }

        this.log('Tooltip hidden')
    }

    toggle(tooltip) {
        if (tooltip.isVisible) {
            this.hide(tooltip)
        } else {
            this.show(tooltip)
        }
    }

    createTooltipElement(tooltip) {
        const tooltipEl = document.createElement('div')
        tooltipEl.className = this.getTooltipClasses(tooltip)
        
        // Content
        const content = document.createElement('div')
        content.className = 'tooltip-content'
        
        if (tooltip.html) {
            content.innerHTML = tooltip.content
        } else {
            content.textContent = tooltip.content
        }
        
        tooltipEl.appendChild(content)
        
        // Arrow
        if (tooltip.arrow) {
            const arrow = document.createElement('div')
            arrow.className = 'tooltip-arrow'
            tooltipEl.appendChild(arrow)
        }

        // Styling
        tooltipEl.style.cssText = `
            position: absolute;
            max-width: ${tooltip.maxWidth}px;
            z-index: ${this.config.zIndex};
            opacity: 0;
            pointer-events: ${tooltip.interactive ? 'auto' : 'none'};
            transition: opacity ${tooltip.duration}ms ease;
        `

        return tooltipEl
    }

    getTooltipClasses(tooltip) {
        const classes = [
            'tooltip',
            `tooltip-${tooltip.theme}`,
            `tooltip-${tooltip.placement}`
        ]

        if (tooltip.customClass) {
            classes.push(tooltip.customClass)
        }

        if (tooltip.animation) {
            classes.push(`tooltip-${tooltip.animation}`)
        }

        return classes.join(' ')
    }

    position(tooltip) {
        const { element, tooltipElement, placement, offset } = tooltip
        
        if (!tooltipElement) return

        const elementRect = element.getBoundingClientRect()
        const tooltipRect = tooltipElement.getBoundingClientRect()
        const viewport = {
            width: window.innerWidth,
            height: window.innerHeight
        }

        let position = this.calculatePosition(
            elementRect, 
            tooltipRect, 
            placement, 
            offset, 
            viewport
        )

        // Check if position needs adjustment
        const adjustedPlacement = this.adjustPlacement(
            position, 
            tooltipRect, 
            viewport
        )

        if (adjustedPlacement !== placement) {
            tooltipElement.className = tooltipElement.className
                .replace(`tooltip-${placement}`, `tooltip-${adjustedPlacement}`)
            
            position = this.calculatePosition(
                elementRect, 
                tooltipRect, 
                adjustedPlacement, 
                offset, 
                viewport
            )
        }

        // Apply position
        tooltipElement.style.left = `${position.x + window.scrollX}px`
        tooltipElement.style.top = `${position.y + window.scrollY}px`

        // Update tooltip placement for arrow positioning
        tooltip.actualPlacement = adjustedPlacement

        this.log('Tooltip positioned:', position)
    }

    calculatePosition(elementRect, tooltipRect, placement, offset, viewport) {
        const positions = {
            top: {
                x: elementRect.left + elementRect.width / 2 - tooltipRect.width / 2,
                y: elementRect.top - tooltipRect.height - offset
            },
            bottom: {
                x: elementRect.left + elementRect.width / 2 - tooltipRect.width / 2,
                y: elementRect.bottom + offset
            },
            left: {
                x: elementRect.left - tooltipRect.width - offset,
                y: elementRect.top + elementRect.height / 2 - tooltipRect.height / 2
            },
            right: {
                x: elementRect.right + offset,
                y: elementRect.top + elementRect.height / 2 - tooltipRect.height / 2
            }
        }

        return positions[placement] || positions.top
    }

    adjustPlacement(position, tooltipRect, viewport) {
        const margin = 10
        
        // Check bounds and suggest alternative placement
        const fitsTop = position.y >= margin
        const fitsBottom = position.y + tooltipRect.height <= viewport.height - margin
        const fitsLeft = position.x >= margin
        const fitsRight = position.x + tooltipRect.width <= viewport.width - margin

        if (!fitsTop && fitsBottom) return 'bottom'
        if (!fitsBottom && fitsTop) return 'top'
        if (!fitsLeft && fitsRight) return 'right'
        if (!fitsRight && fitsLeft) return 'left'

        return 'top' // fallback
    }

    animate(tooltip, direction) {
        return new Promise(resolve => {
            if (!tooltip.tooltipElement) {
                resolve()
                return
            }

            const { tooltipElement, animation, duration } = tooltip

            if (direction === 'show') {
                tooltipElement.style.opacity = '1'
                
                if (animation === 'scale') {
                    tooltipElement.style.transform = 'scale(1)'
                } else if (animation === 'slide') {
                    tooltipElement.style.transform = 'translateY(0)'
                }
                
                setTimeout(resolve, duration)
            } else {
                tooltipElement.style.opacity = '0'
                
                if (animation === 'scale') {
                    tooltipElement.style.transform = 'scale(0.8)'
                } else if (animation === 'slide') {
                    tooltipElement.style.transform = 'translateY(-10px)'
                }
                
                setTimeout(resolve, duration)
            }
        })
    }

    bindTooltipEvents(tooltip) {
        if (!tooltip.tooltipElement) return

        tooltip.tooltipElement.addEventListener('mouseenter', () => {
            tooltip.tooltipHovered = true
            this.clearTimer(tooltip, 'hideTimer')
        })

        tooltip.tooltipElement.addEventListener('mouseleave', () => {
            tooltip.tooltipHovered = false
            if (!tooltip.isHovered) {
                this.hide(tooltip)
            }
        })
    }

    update(element, newOptions) {
        const tooltip = this.tooltips.get(element)
        if (!tooltip) return

        // Update options
        Object.assign(tooltip, newOptions)

        // Update content if visible
        if (tooltip.isVisible && tooltip.tooltipElement) {
            const content = tooltip.tooltipElement.querySelector('.tooltip-content')
            if (content) {
                if (tooltip.html) {
                    content.innerHTML = tooltip.content
                } else {
                    content.textContent = tooltip.content
                }
            }
            
            // Reposition
            this.position(tooltip)
        }

        // Callback
        if (tooltip.onUpdate) {
            tooltip.onUpdate(element, tooltip)
        }
    }

    destroy(element) {
        const tooltip = this.tooltips.get(element)
        if (!tooltip) return

        // Hide if visible
        if (tooltip.isVisible) {
            this.hide(tooltip)
        }

        // Clear timers
        this.clearTimer(tooltip, 'showTimer')
        this.clearTimer(tooltip, 'hideTimer')

        // Restore original title
        if (tooltip.originalTitle) {
            element.setAttribute('title', tooltip.originalTitle)
        }

        // Remove from map
        this.tooltips.delete(element)

        this.log('Tooltip destroyed for element:', element)
    }

    clearTimer(tooltip, timerName) {
        if (tooltip[timerName]) {
            clearTimeout(tooltip[timerName])
            tooltip[timerName] = null
        }
    }

    handleScroll() {
        if (this.activeTooltip && this.activeTooltip.isVisible) {
            this.position(this.activeTooltip)
        }
    }

    handleResize() {
        if (this.activeTooltip && this.activeTooltip.isVisible) {
            // Check if we need to adjust for mobile
            if (this.config.responsive && 
                window.innerWidth <= this.config.mobileBreakpoint) {
                this.hide(this.activeTooltip)
                return
            }
            
            this.position(this.activeTooltip)
        }
    }

    log(...args) {
        if (this.config.debug) {
            console.log('[Tooltip]', ...args)
        }
    }

    // Cleanup
    destroyAll() {
        this.tooltips.forEach((tooltip, element) => {
            this.destroy(element)
        })
        
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container)
        }
    }
}

// Create global instance
const tooltipManager = new TooltipManager()

// Vue directive
const tooltipDirective = {
    mounted(el, binding) {
        let options = {}

        if (typeof binding.value === 'string') {
            options.content = binding.value
        } else if (typeof binding.value === 'object') {
            options = { ...binding.value }
        }

        // Handle modifiers
        if (binding.modifiers.top) options.placement = 'top'
        if (binding.modifiers.bottom) options.placement = 'bottom'
        if (binding.modifiers.left) options.placement = 'left'
        if (binding.modifiers.right) options.placement = 'right'
        if (binding.modifiers.click) options.trigger = 'click'
        if (binding.modifiers.focus) options.trigger = 'focus'
        if (binding.modifiers.html) options.html = true
        if (binding.modifiers.interactive) options.interactive = true

        // Handle arg as placement
        if (binding.arg) {
            options.placement = binding.arg
        }

        tooltipManager.create(el, options)
    },

    updated(el, binding) {
        if (binding.value !== binding.oldValue) {
            let options = {}

            if (typeof binding.value === 'string') {
                options.content = binding.value
            } else if (typeof binding.value === 'object') {
                options = { ...binding.value }
            }

            tooltipManager.update(el, options)
        }
    },

    unmounted(el) {
        tooltipManager.destroy(el)
    }
}

// CSS styles (to be included in your CSS)
const tooltipStyles = `
.tooltip {
    position: absolute;
    z-index: 9999;
    font-size: 0.875rem;
    line-height: 1.4;
    border-radius: 0.375rem;
    padding: 0.5rem 0.75rem;
    word-wrap: break-word;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.tooltip-dark {
    background-color: #374151;
    color: #f9fafb;
}

.tooltip-light {
    background-color: #f9fafb;
    color: #374151;
    border: 1px solid #e5e7eb;
}

.tooltip-arrow {
    position: absolute;
    width: 0;
    height: 0;
}

.tooltip-top .tooltip-arrow {
    bottom: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #374151;
}

.tooltip-bottom .tooltip-arrow {
    top: -5px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-bottom: 5px solid #374151;
}

.tooltip-left .tooltip-arrow {
    right: -5px;
    top: 50%;
    transform: translateY(-50%);
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-left: 5px solid #374151;
}

.tooltip-right .tooltip-arrow {
    left: -5px;
    top: 50%;
    transform: translateY(-50%);
    border-top: 5px solid transparent;
    border-bottom: 5px solid transparent;
    border-right: 5px solid #374151;
}

.tooltip-scale {
    transform: scale(0.8);
    transition: transform 200ms ease, opacity 200ms ease;
}

.tooltip-slide {
    transform: translateY(-10px);
    transition: transform 200ms ease, opacity 200ms ease;
}
`

// Inject styles
if (typeof document !== 'undefined') {
    const styleEl = document.createElement('style')
    styleEl.textContent = tooltipStyles
    document.head.appendChild(styleEl)
}

export default tooltipDirective
export { tooltipManager, TooltipManager }