import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useBreakpoints, breakpointsTailwind } from '@vueuse/core'

export const useUIStore = defineStore('ui', () => {
    // Breakpoints for responsive design
    const breakpoints = useBreakpoints(breakpointsTailwind)

    // Theme management
    const theme = ref(localStorage.getItem('social_theme') || 'light')
    const systemTheme = ref('light')
    const themePreference = ref(localStorage.getItem('social_theme_preference') || 'system')

    // Layout state
    const sidebarCollapsed = ref(localStorage.getItem('social_sidebar_collapsed') === 'true')
    const isMobile = computed(() => breakpoints.smaller('md').value)
    const isTablet = computed(() => breakpoints.between('md', 'lg').value)
    const isDesktop = computed(() => breakpoints.greater('lg').value)

    // Loading states
    const isLoading = ref(false)
    const loadingMessage = ref('')
    const loadingProgress = ref(0)

    // Modal management
    const modals = ref(new Map())
    const activeModal = ref(null)

    // Toast/Notification state
    const notifications = ref([])
    const maxNotifications = ref(5)

    // Search state
    const searchOpen = ref(false)
    const searchQuery = ref('')
    const searchResults = ref([])
    const searchLoading = ref(false)

    // Navigation state
    const navigationHistory = ref([])
    const canGoBack = computed(() => navigationHistory.value.length > 1)

    // Page state
    const pageTitle = ref('')
    const pageLoading = ref(false)
    const pageError = ref(null)

    // Form state
    const unsavedChanges = ref(new Set())
    const hasUnsavedChanges = computed(() => unsavedChanges.value.size > 0)

    // Focus management
    const focusedElement = ref(null)
    const focusTrap = ref(false)

    // Scroll state
    const scrollPosition = ref(0)
    const isScrollingUp = ref(false)
    const isScrollingDown = ref(false)
    const showScrollToTop = ref(false)

    // Connectivity state
    const isOnline = ref(navigator.onLine)
    const lastOnlineTime = ref(Date.now())

    // Performance state
    const performanceMetrics = ref({
        loadTime: 0,
        renderTime: 0,
        interactionTime: 0
    })

    // Accessibility state
    const highContrastMode = ref(localStorage.getItem('social_high_contrast') === 'true')
    const reducedMotion = ref(localStorage.getItem('social_reduced_motion') === 'true')
    const screenReaderMode = ref(false)
    const fontSize = ref(localStorage.getItem('social_font_size') || 'medium')

    // Quick actions state
    const quickActionsOpen = ref(false)
    const commandPaletteOpen = ref(false)

    // Computed properties
    const currentTheme = computed(() => {
        if (themePreference.value === 'system') {
            return systemTheme.value
        }
        return theme.value
    })

    const isDarkMode = computed(() => currentTheme.value === 'dark')
    const isLightMode = computed(() => currentTheme.value === 'light')

    const hasActiveModal = computed(() => activeModal.value !== null)

    const deviceType = computed(() => {
        if (isMobile.value) return 'mobile'
        if (isTablet.value) return 'tablet'
        return 'desktop'
    })

    // Actions
    const setTheme = (newTheme) => {
        theme.value = newTheme
        themePreference.value = newTheme === 'system' ? 'system' : 'manual'

        localStorage.setItem('social_theme', newTheme)
        localStorage.setItem('social_theme_preference', themePreference.value)

        updateDocumentTheme()
    }

    const toggleTheme = () => {
        const newTheme = currentTheme.value === 'light' ? 'dark' : 'light'
        setTheme(newTheme)
    }

    const updateDocumentTheme = () => {
        document.documentElement.setAttribute('data-bs-theme', currentTheme.value)
        document.documentElement.classList.toggle('dark', isDarkMode.value)
        document.documentElement.classList.toggle('light', isLightMode.value)
    }

    const detectSystemTheme = () => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        systemTheme.value = mediaQuery.matches ? 'dark' : 'light'

        mediaQuery.addEventListener('change', (e) => {
            systemTheme.value = e.matches ? 'dark' : 'light'
        })
    }

    // Sidebar actions
    const toggleSidebar = () => {
        sidebarCollapsed.value = !sidebarCollapsed.value
        localStorage.setItem('social_sidebar_collapsed', sidebarCollapsed.value.toString())
    }

    const collapseSidebar = () => {
        sidebarCollapsed.value = true
        localStorage.setItem('social_sidebar_collapsed', 'true')
    }

    const expandSidebar = () => {
        sidebarCollapsed.value = false
        localStorage.setItem('social_sidebar_collapsed', 'false')
    }

    // Loading actions
    const setLoading = (loading, message = '') => {
        isLoading.value = loading
        loadingMessage.value = message
        if (!loading) {
            loadingProgress.value = 0
        }
    }

    const setLoadingProgress = (progress) => {
        loadingProgress.value = Math.max(0, Math.min(100, progress))
    }

    // Modal actions
    const openModal = (modalId, props = {}) => {
        modals.value.set(modalId, { id: modalId, props, isOpen: true })
        activeModal.value = modalId
        document.body.classList.add('modal-open')
    }

    const closeModal = (modalId) => {
        if (modals.value.has(modalId)) {
            modals.value.delete(modalId)
        }

        if (activeModal.value === modalId) {
            activeModal.value = null
            document.body.classList.remove('modal-open')
        }
    }

    const closeAllModals = () => {
        modals.value.clear()
        activeModal.value = null
        document.body.classList.remove('modal-open')
    }

    // Search actions
    const toggleSearch = () => {
        searchOpen.value = !searchOpen.value
        if (!searchOpen.value) {
            searchQuery.value = ''
            searchResults.value = []
        }
    }

    const openSearch = () => {
        searchOpen.value = true
    }

    const closeSearch = () => {
        searchOpen.value = false
        searchQuery.value = ''
        searchResults.value = []
    }

    const setSearchQuery = (query) => {
        searchQuery.value = query
    }

    const setSearchResults = (results) => {
        searchResults.value = results
    }

    const setSearchLoading = (loading) => {
        searchLoading.value = loading
    }

    // Navigation actions
    const pushToHistory = (route) => {
        navigationHistory.value.push(route)
        if (navigationHistory.value.length > 50) {
            navigationHistory.value.shift()
        }
    }

    const goBack = () => {
        if (canGoBack.value) {
            navigationHistory.value.pop()
            return navigationHistory.value[navigationHistory.value.length - 1]
        }
        return null
    }

    // Page actions
    const setPageTitle = (title) => {
        pageTitle.value = title
        document.title = title ? `${title} - Social Connect` : 'Social Connect'
    }

    const setPageLoading = (loading) => {
        pageLoading.value = loading
    }

    const setPageError = (error) => {
        pageError.value = error
    }

    // Form state actions
    const addUnsavedChanges = (formId) => {
        unsavedChanges.value.add(formId)
    }

    const removeUnsavedChanges = (formId) => {
        unsavedChanges.value.delete(formId)
    }

    const clearAllUnsavedChanges = () => {
        unsavedChanges.value.clear()
    }

    // Focus management
    const setFocus = (element) => {
        focusedElement.value = element
        if (element) {
            element.focus()
        }
    }

    const enableFocusTrap = () => {
        focusTrap.value = true
    }

    const disableFocusTrap = () => {
        focusTrap.value = false
    }

    // Scroll actions
    const updateScrollPosition = (position) => {
        const previousPosition = scrollPosition.value
        scrollPosition.value = position

        isScrollingUp.value = position < previousPosition
        isScrollingDown.value = position > previousPosition
        showScrollToTop.value = position > 300
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    // Connectivity actions
    const setOnlineStatus = (online) => {
        isOnline.value = online
        if (online) {
            lastOnlineTime.value = Date.now()
        }
    }

    // Performance actions
    const updatePerformanceMetrics = (metrics) => {
        performanceMetrics.value = { ...performanceMetrics.value, ...metrics }
    }

    // Accessibility actions
    const toggleHighContrast = () => {
        highContrastMode.value = !highContrastMode.value
        localStorage.setItem('social_high_contrast', highContrastMode.value.toString())
        document.documentElement.classList.toggle('high-contrast', highContrastMode.value)
    }

    const toggleReducedMotion = () => {
        reducedMotion.value = !reducedMotion.value
        localStorage.setItem('social_reduced_motion', reducedMotion.value.toString())
        document.documentElement.classList.toggle('reduced-motion', reducedMotion.value)
    }

    const setScreenReaderMode = (enabled) => {
        screenReaderMode.value = enabled
    }

    const setFontSize = (size) => {
        fontSize.value = size
        localStorage.setItem('social_font_size', size)
        document.documentElement.setAttribute('data-font-size', size)
    }

    // Quick actions
    const toggleQuickActions = () => {
        quickActionsOpen.value = !quickActionsOpen.value
    }

    const toggleCommandPalette = () => {
        commandPaletteOpen.value = !commandPaletteOpen.value
    }

    // Notification actions
    const addNotification = (notification) => {
        const id = Date.now().toString()
        notifications.value.unshift({ id, ...notification, timestamp: Date.now() })

        if (notifications.value.length > maxNotifications.value) {
            notifications.value = notifications.value.slice(0, maxNotifications.value)
        }

        return id
    }

    const removeNotification = (id) => {
        const index = notifications.value.findIndex(n => n.id === id)
        if (index !== -1) {
            notifications.value.splice(index, 1)
        }
    }

    const clearAllNotifications = () => {
        notifications.value = []
    }

    // Watchers
    watch(currentTheme, updateDocumentTheme, { immediate: true })

    watch(isOnline, (online) => {
        if (!online) {
            addNotification({
                type: 'warning',
                title: 'Mất kết nối',
                message: 'Bạn đang offline. Một số tính năng có thể không khả dụng.',
                persistent: true
            })
        } else if (!online && lastOnlineTime.value) {
            removeNotification('offline')
            addNotification({
                type: 'success',
                title: 'Đã kết nối lại',
                message: 'Kết nối mạng đã được khôi phục.',
                duration: 3000
            })
        }
    })

    // Initialize
    const initialize = () => {
        detectSystemTheme()
        updateDocumentTheme()

        // Set initial accessibility classes
        document.documentElement.classList.toggle('high-contrast', highContrastMode.value)
        document.documentElement.classList.toggle('reduced-motion', reducedMotion.value)
        document.documentElement.setAttribute('data-font-size', fontSize.value)

        // Listen for online/offline events
        window.addEventListener('online', () => setOnlineStatus(true))
        window.addEventListener('offline', () => setOnlineStatus(false))

        // Listen for scroll events
        let ticking = false
        window.addEventListener('scroll', () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateScrollPosition(window.pageYOffset)
                    ticking = false
                })
                ticking = true
            }
        }, { passive: true })
    }

    return {
        // State
        theme,
        systemTheme,
        themePreference,
        sidebarCollapsed,
        isLoading,
        loadingMessage,
        loadingProgress,
        modals,
        activeModal,
        notifications,
        searchOpen,
        searchQuery,
        searchResults,
        searchLoading,
        navigationHistory,
        pageTitle,
        pageLoading,
        pageError,
        unsavedChanges,
        focusedElement,
        focusTrap,
        scrollPosition,
        isScrollingUp,
        isScrollingDown,
        showScrollToTop,
        isOnline,
        lastOnlineTime,
        performanceMetrics,
        highContrastMode,
        reducedMotion,
        screenReaderMode,
        fontSize,
        quickActionsOpen,
        commandPaletteOpen,

        // Computed
        currentTheme,
        isDarkMode,
        isLightMode,
        hasActiveModal,
        deviceType,
        isMobile,
        isTablet,
        isDesktop,
        canGoBack,
        hasUnsavedChanges,

        // Actions
        setTheme,
        toggleTheme,
        toggleSidebar,
        collapseSidebar,
        expandSidebar,
        setLoading,
        setLoadingProgress,
        openModal,
        closeModal,
        closeAllModals,
        toggleSearch,
        openSearch,
        closeSearch,
        setSearchQuery,
        setSearchResults,
        setSearchLoading,
        pushToHistory,
        goBack,
        setPageTitle,
        setPageLoading,
        setPageError,
        addUnsavedChanges,
        removeUnsavedChanges,
        clearAllUnsavedChanges,
        setFocus,
        enableFocusTrap,
        disableFocusTrap,
        updateScrollPosition,
        scrollToTop,
        setOnlineStatus,
        updatePerformanceMetrics,
        toggleHighContrast,
        toggleReducedMotion,
        setScreenReaderMode,
        setFontSize,
        toggleQuickActions,
        toggleCommandPalette,
        addNotification,
        removeNotification,
        clearAllNotifications,
        initialize
    }
})