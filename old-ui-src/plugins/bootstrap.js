// Bootstrap configuration với custom themes, components và utilities

import 'bootstrap/dist/css/bootstrap.min.css'
import { Modal, Dropdown, Tooltip, Popover, Collapse, Offcanvas, Toast, Alert } from 'bootstrap'

class BootstrapManager {
    constructor() {
        this.components = new Map()
        this.initialized = false
        this.theme = 'light'
        this.customThemes = new Map()
        this.breakpoints = {
            xs: 0,
            sm: 576,
            md: 768,
            lg: 992,
            xl: 1200,
            xxl: 1400
        }

        // Component configurations
        this.defaultConfigs = {
            modal: {
                backdrop: true,
                keyboard: true,
                focus: true
            },
            dropdown: {
                boundary: 'viewport',
                autoClose: true
            },
            tooltip: {
                placement: 'top',
                trigger: 'hover focus',
                html: false,
                animation: true,
                delay: 0
            },
            popover: {
                placement: 'right',
                trigger: 'click',
                html: true,
                animation: true
            },
            toast: {
                animation: true,
                autohide: true,
                delay: 5000
            },
            collapse: {
                toggle: true
            },
            offcanvas: {
                backdrop: true,
                keyboard: true,
                scroll: false
            }
        }

        this.initialize()
    }

    initialize() {
        if (this.initialized) return

        // Setup custom CSS properties for dynamic theming
        this.setupCustomProperties()

        // Initialize global event listeners
        this.setupGlobalListeners()

        // Setup responsive utilities
        this.setupResponsiveUtils()

        // Setup form validation
        this.setupFormValidation()

        this.initialized = true
        console.log('✅ Bootstrap manager initialized')
    }

    // Theme management
    setupCustomProperties() {
        const root = document.documentElement

        // Define custom theme variables
        const themeVariables = {
            light: {
                '--bs-body-bg': '#ffffff',
                '--bs-body-color': '#212529',
                '--bs-primary': '#0d6efd',
                '--bs-secondary': '#6c757d',
                '--bs-success': '#198754',
                '--bs-info': '#0dcaf0',
                '--bs-warning': '#ffc107',
                '--bs-danger': '#dc3545',
                '--bs-light': '#f8f9fa',
                '--bs-dark': '#212529',
                '--bs-border-color': '#dee2e6',
                '--bs-gray-100': '#f8f9fa',
                '--bs-gray-200': '#e9ecef',
                '--bs-gray-300': '#dee2e6',
                '--bs-gray-400': '#ced4da',
                '--bs-gray-500': '#adb5bd',
                '--bs-gray-600': '#6c757d',
                '--bs-gray-700': '#495057',
                '--bs-gray-800': '#343a40',
                '--bs-gray-900': '#212529'
            },
            dark: {
                '--bs-body-bg': '#121212',
                '--bs-body-color': '#e9ecef',
                '--bs-primary': '#0d6efd',
                '--bs-secondary': '#6c757d',
                '--bs-success': '#198754',
                '--bs-info': '#0dcaf0',
                '--bs-warning': '#ffc107',
                '--bs-danger': '#dc3545',
                '--bs-light': '#212529',
                '--bs-dark': '#f8f9fa',
                '--bs-border-color': '#495057',
                '--bs-gray-100': '#212529',
                '--bs-gray-200': '#343a40',
                '--bs-gray-300': '#495057',
                '--bs-gray-400': '#6c757d',
                '--bs-gray-500': '#adb5bd',
                '--bs-gray-600': '#ced4da',
                '--bs-gray-700': '#dee2e6',
                '--bs-gray-800': '#e9ecef',
                '--bs-gray-900': '#f8f9fa'
            }
        }

        // Store themes
        this.customThemes.set('light', themeVariables.light)
        this.customThemes.set('dark', themeVariables.dark)

        // Apply default theme
        this.applyTheme('light')
    }

    applyTheme(themeName) {
        if (!this.customThemes.has(themeName)) {
            console.warn(`Theme ${themeName} not found`)
            return
        }

        const theme = this.customThemes.get(themeName)
        const root = document.documentElement

        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value)
        })

        this.theme = themeName
        document.body.setAttribute('data-bs-theme', themeName)

        console.log(`Applied theme: ${themeName}`)
    }

    addCustomTheme(name, variables) {
        this.customThemes.set(name, variables)
    }

    // Component initialization and management
    initModal(element, options = {}) {
        const config = { ...this.defaultConfigs.modal, ...options }
        const modal = new Modal(element, config)

        const modalId = element.getAttribute('id') || this.generateId('modal')
        this.components.set(modalId, modal)

        // Setup event listeners
        element.addEventListener('show.bs.modal', (event) => {
            console.log('Modal showing:', modalId)
            this.handleModalShow(event)
        })

        element.addEventListener('hidden.bs.modal', (event) => {
            console.log('Modal hidden:', modalId)
            this.handleModalHidden(event)
        })

        return modal
    }

    initDropdown(element, options = {}) {
        const config = { ...this.defaultConfigs.dropdown, ...options }
        const dropdown = new Dropdown(element, config)

        const dropdownId = element.getAttribute('id') || this.generateId('dropdown')
        this.components.set(dropdownId, dropdown)

        return dropdown
    }

    initTooltip(element, options = {}) {
        const config = { ...this.defaultConfigs.tooltip, ...options }
        const tooltip = new Tooltip(element, config)

        const tooltipId = element.getAttribute('id') || this.generateId('tooltip')
        this.components.set(tooltipId, tooltip)

        return tooltip
    }

    initPopover(element, options = {}) {
        const config = { ...this.defaultConfigs.popover, ...options }
        const popover = new Popover(element, config)

        const popoverId = element.getAttribute('id') || this.generateId('popover')
        this.components.set(popoverId, popover)

        return popover
    }

    initToast(element, options = {}) {
        const config = { ...this.defaultConfigs.toast, ...options }
        const toast = new Toast(element, config)

        const toastId = element.getAttribute('id') || this.generateId('toast')
        this.components.set(toastId, toast)

        return toast
    }

    initCollapse(element, options = {}) {
        const config = { ...this.defaultConfigs.collapse, ...options }
        const collapse = new Collapse(element, config)

        const collapseId = element.getAttribute('id') || this.generateId('collapse')
        this.components.set(collapseId, collapse)

        return collapse
    }

    initOffcanvas(element, options = {}) {
        const config = { ...this.defaultConfigs.offcanvas, ...options }
        const offcanvas = new Offcanvas(element, config)

        const offcanvasId = element.getAttribute('id') || this.generateId('offcanvas')
        this.components.set(offcanvasId, offcanvas)

        return offcanvas
    }

    // Auto-initialization for data attributes
    autoInitializeComponents() {
        // Auto-init tooltips
        document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(element => {
            if (!this.isComponentInitialized(element)) {
                this.initTooltip(element)
            }
        })

        // Auto-init popovers
        document.querySelectorAll('[data-bs-toggle="popover"]').forEach(element => {
            if (!this.isComponentInitialized(element)) {
                this.initPopover(element)
            }
        })

        // Auto-init dropdowns
        document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(element => {
            if (!this.isComponentInitialized(element)) {
                this.initDropdown(element)
            }
        })

        // Auto-init modals
        document.querySelectorAll('.modal').forEach(element => {
            if (!this.isComponentInitialized(element)) {
                this.initModal(element)
            }
        })

        // Auto-init collapses
        document.querySelectorAll('[data-bs-toggle="collapse"]').forEach(element => {
            if (!this.isComponentInitialized(element)) {
                this.initCollapse(element)
            }
        })

        // Auto-init offcanvas
        document.querySelectorAll('.offcanvas').forEach(element => {
            if (!this.isComponentInitialized(element)) {
                this.initOffcanvas(element)
            }
        })
    }

    isComponentInitialized(element) {
        return element.hasAttribute('data-bs-component-initialized')
    }

    markComponentInitialized(element) {
        element.setAttribute('data-bs-component-initialized', 'true')
    }

    // Global event listeners
    setupGlobalListeners() {
        // Auto-initialize components when DOM changes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            this.autoInitializeComponentsInNode(node)
                        }
                    })
                }
            })
        })

        observer.observe(document.body, {
            childList: true,
            subtree: true
        })

        // Handle keyboard navigation
        document.addEventListener('keydown', (event) => {
            this.handleGlobalKeydown(event)
        })

        // Handle focus management
        document.addEventListener('focusin', (event) => {
            this.handleGlobalFocus(event)
        })
    }

    autoInitializeComponentsInNode(node) {
        if (node.querySelector) {
            // Find and initialize components in the new node
            node.querySelectorAll('[data-bs-toggle]').forEach(element => {
                const toggle = element.getAttribute('data-bs-toggle')

                switch (toggle) {
                    case 'tooltip':
                        if (!this.isComponentInitialized(element)) {
                            this.initTooltip(element)
                        }
                        break
                    case 'popover':
                        if (!this.isComponentInitialized(element)) {
                            this.initPopover(element)
                        }
                        break
                    case 'dropdown':
                        if (!this.isComponentInitialized(element)) {
                            this.initDropdown(element)
                        }
                        break
                    case 'modal':
                        if (!this.isComponentInitialized(element)) {
                            this.initModal(element)
                        }
                        break
                    case 'collapse':
                        if (!this.isComponentInitialized(element)) {
                            this.initCollapse(element)
                        }
                        break
                }
            })

            // Initialize modals and offcanvas
            node.querySelectorAll('.modal').forEach(element => {
                if (!this.isComponentInitialized(element)) {
                    this.initModal(element)
                }
            })

            node.querySelectorAll('.offcanvas').forEach(element => {
                if (!this.isComponentInitialized(element)) {
                    this.initOffcanvas(element)
                }
            })
        }
    }

    // Responsive utilities
    setupResponsiveUtils() {
        this.currentBreakpoint = this.getCurrentBreakpoint()

        window.addEventListener('resize', () => {
            const newBreakpoint = this.getCurrentBreakpoint()
            if (newBreakpoint !== this.currentBreakpoint) {
                this.currentBreakpoint = newBreakpoint
                this.handleBreakpointChange(newBreakpoint)
            }
        })
    }

    getCurrentBreakpoint() {
        const width = window.innerWidth

        if (width >= this.breakpoints.xxl) return 'xxl'
        if (width >= this.breakpoints.xl) return 'xl'
        if (width >= this.breakpoints.lg) return 'lg'
        if (width >= this.breakpoints.md) return 'md'
        if (width >= this.breakpoints.sm) return 'sm'
        return 'xs'
    }

    handleBreakpointChange(breakpoint) {
        console.log('Breakpoint changed to:', breakpoint)

        // Emit custom event
        document.dispatchEvent(new CustomEvent('bootstrap:breakpoint', {
            detail: { breakpoint, width: window.innerWidth }
        }))

        // Handle responsive component behavior
        this.updateResponsiveComponents(breakpoint)
    }

    updateResponsiveComponents(breakpoint) {
        // Auto-close dropdowns on mobile
        if (breakpoint === 'xs' || breakpoint === 'sm') {
            this.components.forEach((component, id) => {
                if (component instanceof Dropdown) {
                    component.hide()
                }
            })
        }
    }

    // Form validation
    setupFormValidation() {
        // Custom validation styles
        const style = document.createElement('style')
        style.textContent = `
      .was-validated .form-control:invalid,
      .was-validated .form-select:invalid {
        border-color: var(--bs-danger);
        padding-right: calc(1.5em + 0.75rem);
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' width='12' height='12' fill='none' stroke='%23dc3545'%3e%3ccircle cx='6' cy='6' r='4.5'/%3e%3cpath d='m5.8 3.6h.4L6 6.5z'/%3e%3ccircle cx='6' cy='8.2' r='.6' fill='%23dc3545' stroke='none'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right calc(0.375em + 0.1875rem) center;
        background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
      }

      .was-validated .form-control:valid,
      .was-validated .form-select:valid {
        border-color: var(--bs-success);
        padding-right: calc(1.5em + 0.75rem);
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 8 8'%3e%3cpath fill='%23198754' d='m2.3 6.73.68-.68L4.9 2.28l.68.68L2.3 6.73z'/%3e%3c/svg%3e");
        background-repeat: no-repeat;
        background-position: right calc(0.375em + 0.1875rem) center;
        background-size: calc(0.75em + 0.375rem) calc(0.75em + 0.375rem);
      }
    `
        document.head.appendChild(style)

        // Setup form validation event listeners
        document.addEventListener('submit', (event) => {
            const form = event.target
            if (form.tagName === 'FORM' && form.hasAttribute('data-bs-validate')) {
                this.validateForm(form, event)
            }
        })
    }

    validateForm(form, event) {
        if (!form.checkValidity()) {
            event.preventDefault()
            event.stopPropagation()

            // Focus first invalid field
            const firstInvalid = form.querySelector(':invalid')
            if (firstInvalid) {
                firstInvalid.focus()
            }
        }

        form.classList.add('was-validated')
    }

    // Event handlers
    handleModalShow(event) {
        // Prevent body scroll
        document.body.style.overflow = 'hidden'

        // Focus management
        const modal = event.target
        const focusableElements = modal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )

        if (focusableElements.length > 0) {
            focusableElements[0].focus()
        }
    }

    handleModalHidden(event) {
        // Restore body scroll if no other modals are open
        const openModals = document.querySelectorAll('.modal.show')
        if (openModals.length === 0) {
            document.body.style.overflow = ''
        }
    }

    handleGlobalKeydown(event) {
        // ESC key handling for modals and offcanvas
        if (event.key === 'Escape') {
            const activeModal = document.querySelector('.modal.show')
            const activeOffcanvas = document.querySelector('.offcanvas.show')

            if (activeModal) {
                const modalInstance = Modal.getInstance(activeModal)
                if (modalInstance) {
                    modalInstance.hide()
                }
            } else if (activeOffcanvas) {
                const offcanvasInstance = Offcanvas.getInstance(activeOffcanvas)
                if (offcanvasInstance) {
                    offcanvasInstance.hide()
                }
            }
        }
    }

    handleGlobalFocus(event) {
        // Ensure focus stays within modal
        const activeModal = document.querySelector('.modal.show')
        if (activeModal && !activeModal.contains(event.target)) {
            const focusableElements = activeModal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )

            if (focusableElements.length > 0) {
                focusableElements[0].focus()
            }
        }
    }

    // Utility methods
    generateId(prefix) {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    getComponent(id) {
        return this.components.get(id)
    }

    removeComponent(id) {
        const component = this.components.get(id)
        if (component && component.dispose) {
            component.dispose()
        }
        this.components.delete(id)
    }

    // Utility functions for Vue components
    showToast(message, options = {}) {
        const toastContainer = document.querySelector('.toast-container') || this.createToastContainer()

        const toastElement = document.createElement('div')
        toastElement.className = `toast ${options.class || ''}`
        toastElement.innerHTML = `
      <div class="toast-header">
        <strong class="me-auto">${options.title || 'Thông báo'}</strong>
        <small>${options.time || 'Vừa xong'}</small>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        ${message}
      </div>
    `

        toastContainer.appendChild(toastElement)

        const toast = this.initToast(toastElement, options)
        toast.show()

        // Remove element after hidden
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove()
        })

        return toast
    }

    createToastContainer() {
        const container = document.createElement('div')
        container.className = 'toast-container position-fixed top-0 end-0 p-3'
        container.style.zIndex = '1055'
        document.body.appendChild(container)
        return container
    }

    showAlert(message, type = 'info', dismissible = true) {
        const alertElement = document.createElement('div')
        alertElement.className = `alert alert-${type} ${dismissible ? 'alert-dismissible' : ''}`
        alertElement.innerHTML = `
      ${message}
      ${dismissible ? '<button type="button" class="btn-close" data-bs-dismiss="alert"></button>' : ''}
    `

        return alertElement
    }

    // Cleanup
    destroy() {
        // Dispose all components
        this.components.forEach((component, id) => {
            if (component && component.dispose) {
                component.dispose()
            }
        })

        this.components.clear()
        this.initialized = false
    }
}

// Create singleton instance
const bootstrapManager = new BootstrapManager()

// Vue plugin installation
export default {
    install(app) {
        // Provide Bootstrap manager globally
        app.config.globalProperties.$bootstrap = bootstrapManager
        app.provide('bootstrap', bootstrapManager)

        // Auto-initialize components after mount
        app.mixin({
            mounted() {
                this.$nextTick(() => {
                    bootstrapManager.autoInitializeComponents()
                })
            }
        })
    }
}

// Export manager for direct use
export { bootstrapManager }