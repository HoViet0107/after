<template>
    <div v-if="hasError" class="error-boundary">
        <div class="error-container">
            <div class="error-icon">
                <i class="fas fa-exclamation-triangle text-danger"></i>
            </div>

            <div class="error-content">
                <h4 class="error-title">{{ errorTitle }}</h4>
                <p class="error-message">{{ errorMessage }}</p>

                <div v-if="showDetails && isDev" class="error-details">
                    <details>
                        <summary class="btn btn-outline-secondary btn-sm">
                            Chi tiết lỗi
                        </summary>
                        <pre class="error-stack">{{ errorDetails }}</pre>
                    </details>
                </div>

                <div class="error-actions">
                    <button class="btn btn-primary me-2" @click="handleRetry" :disabled="isRetrying">
                        <span v-if="isRetrying" class="spinner-border spinner-border-sm me-2"></span>
                        {{ isRetrying ? 'Đang thử lại...' : 'Thử lại' }}
                    </button>

                    <button class="btn btn-outline-secondary me-2" @click="handleReload">
                        Tải lại trang
                    </button>

                    <button v-if="showReportButton" class="btn btn-outline-danger" @click="handleReportError">
                        Báo cáo lỗi
                    </button>
                </div>
            </div>
        </div>
    </div>

    <div v-else>
        <slot />
    </div>
</template>

<script setup>
import { ref, onErrorCaptured, computed } from 'vue'
import { useToast } from 'vue-toastification'

// Props
const props = defineProps({
    fallbackTitle: {
        type: String,
        default: 'Đã xảy ra lỗi'
    },
    fallbackMessage: {
        type: String,
        default: 'Có lỗi không mong muốn xảy ra. Vui lòng thử lại hoặc liên hệ hỗ trợ.'
    },
    showDetails: {
        type: Boolean,
        default: true
    },
    showReportButton: {
        type: Boolean,
        default: true
    },
    onRetry: {
        type: Function,
        default: null
    },
    onError: {
        type: Function,
        default: null
    }
})

// Emits
const emit = defineEmits(['error', 'retry'])

// State
const hasError = ref(false)
const errorInfo = ref(null)
const retryCount = ref(0)
const isRetrying = ref(false)
const toast = useToast()

// Computed
const isDev = computed(() => import.meta.env.DEV)

const errorTitle = computed(() => {
    if (!errorInfo.value) return props.fallbackTitle

    // Customize title based on error type
    if (errorInfo.value.name === 'ChunkLoadError') {
        return 'Lỗi tải tài nguyên'
    }
    if (errorInfo.value.name === 'NetworkError') {
        return 'Lỗi kết nối mạng'
    }
    if (errorInfo.value.name === 'TypeError') {
        return 'Lỗi dữ liệu'
    }

    return props.fallbackTitle
})

const errorMessage = computed(() => {
    if (!errorInfo.value) return props.fallbackMessage

    // Customize message based on error type
    if (errorInfo.value.name === 'ChunkLoadError') {
        return 'Không thể tải một phần của ứng dụng. Vui lòng thử tải lại trang.'
    }
    if (errorInfo.value.name === 'NetworkError') {
        return 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
    }
    if (errorInfo.value.message && errorInfo.value.message.length < 200) {
        return errorInfo.value.message
    }

    return props.fallbackMessage
})

const errorDetails = computed(() => {
    if (!errorInfo.value) return ''

    return `
  Error: ${errorInfo.value.name || 'Unknown'}
  Message: ${errorInfo.value.message || 'No message'}
  Stack: ${errorInfo.value.stack || 'No stack trace'}
  Retry Count: ${retryCount.value}
  Timestamp: ${new Date().toISOString()}
  URL: ${window.location.href}
  User Agent: ${navigator.userAgent}
    `.trim()
})

// Error capture
onErrorCaptured((error, instance, info) => {
    console.error('🚨 Error captured by ErrorBoundary:', {
        error,
        instance,
        info,
        componentStack: instance?.$?.type?.name || 'Unknown'
    })

    hasError.value = true
    errorInfo.value = {
        ...error,
        componentInfo: info,
        timestamp: new Date().toISOString()
    }

    // Call callback onError if available
    props.onError?.(error, instance, info)
    emit('error', { error, instance, info })

    // Log error to external service in production
    if (import.meta.env.PROD) {
        logErrorToService(error, instance, info)
    }

    // Show toast notification
    toast.error('Đã xảy ra lỗi trong ứng dụng')

    // Prevent error from propagating
    return false
})

// Action handlers
const handleRetry = async () => {
    if (retryCount.value >= 3) {
        toast.error('Đã thử lại quá nhiều lần. Vui lòng tải lại trang.')
        return
    }

    isRetrying.value = true
    retryCount.value++

    try {
        // Call the retry function if provided
        if (props.onRetry) {
            await props.onRetry()
        }

        // Reset error state
        hasError.value = false
        errorInfo.value = null

        emit('retry', retryCount.value)
        toast.success('Đã thử lại thành công!')

    } catch (error) {
        console.error('Retry failed:', error)
        toast.error('Thử lại không thành công')
    } finally {
        isRetrying.value = false
    }
}

const handleReload = () => {
    window.location.reload()
}

const handleReportError = () => {
    // Open modal or redirect to error report page
    const subject = encodeURIComponent(`Báo cáo lỗi: ${errorTitle.value}`)
    const body = encodeURIComponent(`
  Chi tiết lỗi:
  ${errorDetails.value}
  
  Mô tả thêm:
  [Vui lòng mô tả những gì bạn đang làm khi lỗi xảy ra]
    `)

    const mailtoLink = `mailto:support@example.com?subject=${subject}&body=${body}`
    window.open(mailtoLink, '_blank')
}

// Error logging service
const logErrorToService = async (error, instance, info) => {
    try {
        // Send error to logging service (Sentry, LogRocket, etc.)
        const errorData = {
            message: error.message,
            stack: error.stack,
            name: error.name,
            componentInfo: info,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString(),
            userId: getCurrentUserId(), // Implement this function
            sessionId: getSessionId() // Implement this function
        }

        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(errorData)
        // })

        console.log('Error logged:', errorData)
    } catch (logError) {
        console.error('Failed to log error:', logError)
    }
}

// Helper functions
const getCurrentUserId = () => {
    // Get from auth store
    try {
        const authStore = useAuthStore()
        return authStore.userId
    } catch {
        return null
    }
}

const getSessionId = () => {
    // Generate or get session ID
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
        sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2)
        sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
}

// Reset error on route change
if (typeof window !== 'undefined') {
    window.addEventListener('popstate', () => {
        if (hasError.value) {
            hasError.value = false
            errorInfo.value = null
            retryCount.value = 0
        }
    })
}
</script>

<style lang="scss" scoped>
.error-boundary {
    min-height: 400px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.error-container {
    max-width: 600px;
    text-align: center;
    background: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 12px;
    padding: 3rem 2rem;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.error-icon {
    font-size: 4rem;
    margin-bottom: 2rem;
    opacity: 0.8;
}

.error-title {
    color: var(--bs-danger);
    margin-bottom: 1rem;
    font-weight: 600;
}

.error-message {
    color: var(--bs-secondary);
    margin-bottom: 2rem;
    line-height: 1.6;
}

.error-details {
    margin: 1.5rem 0;
    text-align: left;

    summary {
        cursor: pointer;
        margin-bottom: 1rem;
    }

    .error-stack {
        background: var(--bs-gray-100);
        border: 1px solid var(--bs-border-color);
        border-radius: 4px;
        padding: 1rem;
        font-size: 0.875rem;
        max-height: 300px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-word;
    }
}

.error-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
}

// Dark theme
[data-bs-theme="dark"] {
    .error-details .error-stack {
        background: var(--bs-gray-800);
        color: var(--bs-gray-100);
    }
}

// Responsive
@media (max-width: 576px) {
    .error-container {
        padding: 2rem 1rem;
    }

    .error-actions {
        flex-direction: column;

        .btn {
            width: 100%;
        }
    }
}
</style>