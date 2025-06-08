// src/stores/ui.js
// UI state store với theme management, responsive design và user preferences

import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'

export const useUIStore = defineStore('ui', () => {
    // Loading states
    const isLoading = ref(false)
    const loadingStates = ref(new Map())
    const globalLoadingCount = ref(0)

    // Theme and appearance
    const theme = ref(localStorage.getItem('ui_theme') || 'light')
    const isDarkMode = computed(() => theme.value === 'dark')
    const fontSize = ref(localStorage.getItem('ui_font_size') || 'medium')
    const colorScheme = ref(localStorage.getItem('ui_color_scheme') || 'default')
    const reducedMotion = ref(localStorage.getItem('ui_reduced_motion') === 'true')
    const highContrast = ref(localStorage.getItem('ui_high_contrast') === 'true')

    // Layout states
    const sidebarCollapsed = ref(localStorage.getItem('ui_sidebar_collapsed') === 'true')
    const sidebarVisible = ref(true)
    const headerVisible = ref(true)
    const footerVisible = ref(true)
    const compactMode = ref(localStorage.getItem('ui_compact_mode') === 'true')

    // Screen and device detection
    const screenSize = ref(getScreenSize())
    const isMobile = computed(() => screenSize.value === 'xs' || screenSize.value === 'sm')
    const isTablet = computed(() => screenSize.value === 'md')
    const isDesktop = computed(() => screenSize.value === 'lg' || screenSize.value === 'xl')
    const deviceType = ref(getDeviceType())
    const orientation = ref(getOrientation())

    // Modal and overlay states
    const modals = ref(new Map())
    const activeModal = ref(null)
    const overlayVisible = ref(false)
    const modalBackdrop = ref(true)

    // Toast notifications queue
    const toasts = ref([])
    const maxToasts = ref(5)

    // Navigation states
    const breadcrumbs = ref([])
    const navigationHistory = ref([])
    const canGoBack = computed(() => navigationHistory.value.length > 1)

    // Performance and accessibility
    const animationsEnabled = ref(!reducedMotion.value)
    const soundEnabled = ref(localStorage.getItem('ui_sound_enabled') !== 'false')
    const keyboardNavigation = ref(false)
    const touchNavigation = ref('ontouchstart' in window)

    // User preferences
    const preferences = ref({
        language: localStorage.getItem('ui_language') || 'vi',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        dateFormat: localStorage.getItem('ui_date_format') || 'DD/MM/YYYY',
        timeFormat: localStorage.getItem('ui_time_format') || '24h',
        numberFormat: localStorage.getItem('ui_number_format') || 'vi-VN'
    })

    // Chat and messaging UI states
    const chatSidebarVisible = ref(!isMobile.value)
    const chatInputFocused = ref(false)
    const typingIndicatorVisible = ref(false)
    const emojiPickerVisible = ref(false)

    // Feed and content UI states
    const feedRefreshing = ref(false)
    const infiniteScrollEnabled = ref(true)
    const autoPlayVideos = ref(localStorage.getItem('ui_autoplay_videos') !== 'false')
    const showImagePreviews = ref(localStorage.getItem('ui_image_previews') !== 'false')

    // Search and filters
    const searchVisible = ref(false)
    const filtersVisible = ref(false)
    const activeFilters = ref(new Map())

    // Watchers for persistence
    watch(theme, (newTheme) => {
        localStorage.setItem('ui_theme', newTheme)
        applyTheme(newTheme)
    })

    watch(fontSize, (newSize) => {
        localStorage.setItem('ui_font_size', newSize)
        applyFontSize(newSize)
    })

    watch(colorScheme, (newScheme) => {
        localStorage.setItem('ui_color_scheme', newScheme)
        applyColorScheme(newScheme)
    })

    watch(sidebarCollapsed, (collapsed) => {
        localStorage.setItem('ui_sidebar_collapsed', collapsed.toString())
    })

    watch(compactMode, (compact) => {
        localStorage.setItem('ui_compact_mode', compact.toString())
    })

    watch(reducedMotion, (reduced) => {
        localStorage.setItem('ui_reduced_motion', reduced.toString())
        animationsEnabled.value = !reduced
    })

    watch(highContrast, (contrast) => {
        localStorage.setItem('ui_high_contrast', contrast.toString())
        applyHighContrast(contrast)
    })

    watch(soundEnabled, (enabled) => {
        localStorage.setItem('ui_sound_enabled', enabled.toString())
    })

    watch(autoPlayVideos, (enabled) => {
        localStorage.setItem('ui_autoplay_videos', enabled.toString())
    })

    watch(showImagePreviews, (enabled) => {
        localStorage.setItem('ui_image_previews', enabled.toString())
    })

    // Loading management
    const setLoading = (loading, key = 'global') => {
        if (key === 'global') {
            isLoading.value = loading
            if (loading) {
                globalLoadingCount.value++
            } else {
                globalLoadingCount.value = Math.max(0, globalLoadingCount.value - 1)
            }
        } else {
            if (loading) {
                loadingStates.value.set(key, true)
            } else {
                loadingStates.value.delete(key)
            }
        }
    }

    const isLoadingKey = (key) => {
        return loadingStates.value.has(key)
    }

    const hasAnyLoading = computed(() => {
        return globalLoadingCount.value > 0 || loadingStates.value.size > 0
    })

    // Theme management
    const toggleTheme = () => {
        theme.value = theme.value === 'light' ? 'dark' : 'light'
    }

    const setTheme = (newTheme) => {
        if (['light', 'dark', 'auto'].includes(newTheme)) {
            theme.value = newTheme
        }
    }

    const applyTheme = (themeName) => {
        document.documentElement.setAttribute('data-theme', themeName)

        if (themeName === 'dark') {
            document.documentElement.classList.add('dark')
        } else {
            document.documentElement.classList.remove('dark')
        }
    }

    // Font size management
    const setFontSize = (size) => {
        if (['small', 'medium', 'large', 'extra-large'].includes(size)) {
            fontSize.value = size
        }
    }

    const applyFontSize = (size) => {
        document.documentElement.setAttribute('data-font-size', size)

        const sizeMap = {
            'small': '14px',
            'medium': '16px',
            'large': '18px',
            'extra-large': '20px'
        }

        document.documentElement.style.setProperty('--base-font-size', sizeMap[size])
    }

    // Color scheme management
    const setColorScheme = (scheme) => {
        colorScheme.value = scheme
    }

    const applyColorScheme = (scheme) => {
        document.documentElement.setAttribute('data-color-scheme', scheme)
    }

    // Accessibility
    const toggleReducedMotion = () => {
        reducedMotion.value = !reducedMotion.value
    }

    const toggleHighContrast = () => {
        highContrast.value = !highContrast.value
    }

    const applyHighContrast = (enabled) => {
        if (enabled) {
            document.documentElement.classList.add('high-contrast')
        } else {
            document.documentElement.classList.remove('high-contrast')
        }
    }

    const enableKeyboardNavigation = () => {
        keyboardNavigation.value = true
        document.documentElement.classList.add('keyboard-navigation')
    }

    const disableKeyboardNavigation = () => {
        keyboardNavigation.value = false
        document.documentElement.classList.remove('keyboard-navigation')
    }

    // Layout management
    const toggleSidebar = () => {
        sidebarCollapsed.value = !sidebarCollapsed.value
    }

    const setSidebarVisible = (visible) => {
        sidebarVisible.value = visible
    }

    const toggleCompactMode = () => {
        compactMode.value = !compactMode.value
    }

    const setCompactMode = (compact) => {
        compactMode.value = compact
    }

    // Modal management
    const openModal = (modalId, options = {}) => {
        const modal = {
            id: modalId,
            visible: true,
            backdrop: options.backdrop !== false,
            keyboard: options.keyboard !== false,
            focus: options.focus !== false,
            ...options
        }

        modals.value.set(modalId, modal)
        activeModal.value = modalId
        overlayVisible.value = true

        // Prevent body scroll
        if (modal.backdrop) {
            document.body.classList.add('modal-open')
        }

        return modal
    }

    const closeModal = (modalId) => {
        if (modals.value.has(modalId)) {
            modals.value.delete(modalId)

            if (activeModal.value === modalId) {
                activeModal.value = null
            }

            // Check if any modals are still open
            if (modals.value.size === 0) {
                overlayVisible.value = false
                document.body.classList.remove('modal-open')
            }
        }
    }

    const closeAllModals = () => {
        modals.value.clear()
        activeModal.value = null
        overlayVisible.value = false
        document.body.classList.remove('modal-open')
    }

    const isModalOpen = (modalId) => {
        return modals.value.has(modalId) && modals.value.get(modalId).visible
    }

    // Toast management
    const addToast = (toast) => {
        const toastId = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const toastItem = {
            id: toastId,
            type: toast.type || 'info',
            title: toast.title,
            message: toast.message,
            duration: toast.duration || 5000,
            actions: toast.actions || [],
            timestamp: Date.now(),
            ...toast
        }

        toasts.value.push(toastItem)

        // Remove oldest toasts if exceeding limit
        if (toasts.value.length > maxToasts.value) {
            toasts.value.splice(0, toasts.value.length - maxToasts.value)
        }

        // Auto remove after duration
        if (toastItem.duration > 0) {
            setTimeout(() => {
                removeToast(toastId)
            }, toastItem.duration)
        }

        return toastId
    }

    const removeToast = (toastId) => {
        const index = toasts.value.findIndex(toast => toast.id === toastId)
        if (index !== -1) {
            toasts.value.splice(index, 1)
        }
    }

    const clearToasts = () => {
        toasts.value = []
    }

    // Navigation management
    const setBreadcrumbs = (crumbs) => {
        breadcrumbs.value = crumbs
    }

    const addBreadcrumb = (crumb) => {
        breadcrumbs.value.push(crumb)
    }

    const updateNavigationHistory = (route) => {
        navigationHistory.value.push({
            path: route.path,
            name: route.name,
            timestamp: Date.now()
        })

        // Keep only last 50 entries
        if (navigationHistory.value.length > 50) {
            navigationHistory.value.shift()
        }
    }

    // Screen size detection
    const updateScreenSize = () => {
        screenSize.value = getScreenSize()
        deviceType.value = getDeviceType()
        orientation.value = getOrientation()
    }

    // Chat UI management
    const toggleChatSidebar = () => {
        chatSidebarVisible.value = !chatSidebarVisible.value
    }

    const setChatInputFocus = (focused) => {
        chatInputFocused.value = focused
    }

    const showEmojiPicker = () => {
        emojiPickerVisible.value = true
    }

    const hideEmojiPicker = () => {
        emojiPickerVisible.value = false
    }

    const toggleEmojiPicker = () => {
        emojiPickerVisible.value = !emojiPickerVisible.value
    }

    // Feed UI management
    const setFeedRefreshing = (refreshing) => {
        feedRefreshing.value = refreshing
    }

    const toggleAutoPlayVideos = () => {
        autoPlayVideos.value = !autoPlayVideos.value
    }

    const toggleImagePreviews = () => {
        showImagePreviews.value = !showImagePreviews.value
    }

    // Search and filters
    const toggleSearch = () => {
        searchVisible.value = !searchVisible.value
    }

    const setSearchVisible = (visible) => {
        searchVisible.value = visible
    }

    const toggleFilters = () => {
        filtersVisible.value = !filtersVisible.value
    }

    const setFilter = (key, value) => {
        if (value === null || value === undefined) {
            activeFilters.value.delete(key)
        } else {
            activeFilters.value.set(key, value)
        }
    }

    const clearFilters = () => {
        activeFilters.value.clear()
    }

    const getFilter = (key) => {
        return activeFilters.value.get(key)
    }

    // Preferences management
    const updatePreference = (key, value) => {
        preferences.value[key] = value
        localStorage.setItem(`ui_${key}`, value)
    }

    const resetPreferences = () => {
        // Reset to defaults
        preferences.value = {
            language: 'vi',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24h',
            numberFormat: 'vi-VN'
        }

        // Clear localStorage
        Object.keys(preferences.value).forEach(key => {
            localStorage.removeItem(`ui_${key}`)
        })
    }

    // Utility functions
    function getScreenSize() {
        const width = window.innerWidth

        if (width < 576) return 'xs'
        if (width < 768) return 'sm'
        if (width < 992) return 'md'
        if (width < 1200) return 'lg'
        return 'xl'
    }

    function getDeviceType() {
        const userAgent = navigator.userAgent

        if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
            return 'tablet'
        }

        if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
            return 'mobile'
        }

        return 'desktop'
    }

    function getOrientation() {
        return window.innerWidth > window.innerHeight ? 'landscape' : 'portrait'
    }

    // Event listeners setup
    const setupEventListeners = () => {
        // Screen size changes
        window.addEventListener('resize', updateScreenSize)

        // Keyboard navigation detection
        window.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                enableKeyboardNavigation()
            }
        })

        window.addEventListener('mousedown', () => {
            disableKeyboardNavigation()
        })

        // Orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(updateScreenSize, 100)
        })

        // Theme detection from system
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
            mediaQuery.addEventListener('change', (e) => {
                if (theme.value === 'auto') {
                    applyTheme(e.matches ? 'dark' : 'light')
                }
            })
        }

        // Reduced motion detection
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
            mediaQuery.addEventListener('change', (e) => {
                reducedMotion.value = e.matches
            })
        }
    }

    // Initialize
    const initialize = () => {
        // Apply saved settings
        applyTheme(theme.value)
        applyFontSize(fontSize.value)
        applyColorScheme(colorScheme.value)
        applyHighContrast(highContrast.value)

        // Setup event listeners
        setupEventListeners()

        // Update screen size
        updateScreenSize()

        // Auto-detect system preferences if not set
        if (theme.value === 'auto' && window.matchMedia) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            applyTheme(prefersDark ? 'dark' : 'light')
        }

        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            reducedMotion.value = true
        }
    }

    // Export public API
    return {
        // Loading
        isLoading: computed(() => isLoading.value),
        hasAnyLoading,
        setLoading,
        isLoadingKey,

        // Theme
        theme: computed(() => theme.value),
        isDarkMode,
        fontSize: computed(() => fontSize.value),
        colorScheme: computed(() => colorScheme.value),
        reducedMotion: computed(() => reducedMotion.value),
        highContrast: computed(() => highContrast.value),
        animationsEnabled: computed(() => animationsEnabled.value),
        soundEnabled: computed(() => soundEnabled.value),
        toggleTheme,
        setTheme,
        setFontSize,
        setColorScheme,
        toggleReducedMotion,
        toggleHighContrast,

        // Layout
        sidebarCollapsed: computed(() => sidebarCollapsed.value),
        sidebarVisible: computed(() => sidebarVisible.value),
        headerVisible: computed(() => headerVisible.value),
        footerVisible: computed(() => footerVisible.value),
        compactMode: computed(() => compactMode.value),
        toggleSidebar,
        setSidebarVisible,
        toggleCompactMode,
        setCompactMode,

        // Screen
        screenSize: computed(() => screenSize.value),
        isMobile,
        isTablet,
        isDesktop,
        deviceType: computed(() => deviceType.value),
        orientation: computed(() => orientation.value),
        touchNavigation: computed(() => touchNavigation.value),
        keyboardNavigation: computed(() => keyboardNavigation.value),

        // Modals
        modals: computed(() => modals.value),
        activeModal: computed(() => activeModal.value),
        overlayVisible: computed(() => overlayVisible.value),
        openModal,
        closeModal,
        closeAllModals,
        isModalOpen,

        // Toasts
        toasts: computed(() => toasts.value),
        addToast,
        removeToast,
        clearToasts,

        // Navigation
        breadcrumbs: computed(() => breadcrumbs.value),
        navigationHistory: computed(() => navigationHistory.value),
        canGoBack,
        setBreadcrumbs,
        addBreadcrumb,
        updateNavigationHistory,

        // Chat UI
        chatSidebarVisible: computed(() => chatSidebarVisible.value),
        chatInputFocused: computed(() => chatInputFocused.value),
        emojiPickerVisible: computed(() => emojiPickerVisible.value),
        toggleChatSidebar,
        setChatInputFocus,
        toggleEmojiPicker,
        showEmojiPicker,
        hideEmojiPicker,

        // Feed UI
        feedRefreshing: computed(() => feedRefreshing.value),
        autoPlayVideos: computed(() => autoPlayVideos.value),
        showImagePreviews: computed(() => showImagePreviews.value),
        setFeedRefreshing,
        toggleAutoPlayVideos,
        toggleImagePreviews,

        // Search and filters
        searchVisible: computed(() => searchVisible.value),
        filtersVisible: computed(() => filtersVisible.value),
        activeFilters: computed(() => activeFilters.value),
        toggleSearch,
        setSearchVisible,
        toggleFilters,
        setFilter,
        clearFilters,
        getFilter,

        // Preferences
        preferences: computed(() => preferences.value),
        updatePreference,
        resetPreferences,

        // Initialization
        initialize
    }
})