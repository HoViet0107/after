import { ref, computed, onMounted, onUnmounted } from 'vue'

export function useInfiniteScroll(fetchMore, options = {}) {
    const {
        threshold = 100,
        disabled = false,
        container = null
    } = options

    // State
    const isLoading = ref(false)
    const hasMore = ref(true)
    const error = ref(null)

    // Get scroll container
    const scrollContainer = computed(() => {
        if (container) return container
        return window
    })

    // Check if should load more
    const shouldLoadMore = () => {
        if (isLoading.value || !hasMore.value || disabled) return false

        const element = scrollContainer.value

        if (element === window) {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop
            const windowHeight = window.innerHeight
            const documentHeight = document.documentElement.scrollHeight

            return scrollTop + windowHeight >= documentHeight - threshold
        } else {
            const scrollTop = element.scrollTop
            const clientHeight = element.clientHeight
            const scrollHeight = element.scrollHeight

            return scrollTop + clientHeight >= scrollHeight - threshold
        }
    }

    // Load more data
    const loadMore = async () => {
        if (isLoading.value || !hasMore.value) return

        try {
            isLoading.value = true
            error.value = null

            const result = await fetchMore()

            // Update hasMore based on result
            if (result && typeof result === 'object') {
                if (result.hasMore !== undefined) {
                    hasMore.value = result.hasMore
                } else if (result.data && Array.isArray(result.data)) {
                    hasMore.value = result.data.length > 0
                }
            } else if (Array.isArray(result)) {
                hasMore.value = result.length > 0
            }

        } catch (err) {
            error.value = err
            console.error('Failed to load more:', err)
        } finally {
            isLoading.value = false
        }
    }

    // Scroll event handler
    const handleScroll = () => {
        if (shouldLoadMore()) {
            loadMore()
        }
    }

    // Throttled scroll handler
    let scrollTimeout = null
    const throttledScrollHandler = () => {
        if (scrollTimeout) return

        scrollTimeout = setTimeout(() => {
            handleScroll()
            scrollTimeout = null
        }, 100)
    }

    // Reset state
    const reset = () => {
        hasMore.value = true
        error.value = null
        isLoading.value = false
    }

    // Manual trigger
    const trigger = () => {
        if (!isLoading.value && hasMore.value) {
            loadMore()
        }
    }

    onMounted(() => {
        const element = scrollContainer.value
        if (element) {
            element.addEventListener('scroll', throttledScrollHandler, { passive: true })
        }
    })

    onUnmounted(() => {
        const element = scrollContainer.value
        if (element) {
            element.removeEventListener('scroll', throttledScrollHandler)
        }

        if (scrollTimeout) {
            clearTimeout(scrollTimeout)
        }
    })

    return {
        isLoading: computed(() => isLoading.value),
        hasMore: computed(() => hasMore.value),
        error: computed(() => error.value),
        loadMore,
        reset,
        trigger
    }
}
