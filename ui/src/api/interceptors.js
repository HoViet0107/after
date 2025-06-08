import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useToast } from 'vue-toastification'
import router from '@/router'

const toast = useToast()

// Tạo axios instance với base config
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Performance monitoring
const requestTimes = new Map()

// Request interceptor
apiClient.interceptors.request.use(
    (config) => {
        try {
            const authStore = useAuthStore()
            const uiStore = useUIStore()

            // Add auth token if available
            if (authStore.token) {
                config.headers.Authorization = `Bearer ${authStore.token}`
            }

            // Add request ID for tracking
            const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            config.headers['X-Request-ID'] = requestId

            // Performance tracking
            requestTimes.set(requestId, performance.now())

            // Show loading spinner for specific requests
            if (config.showLoading !== false) {
                uiStore.setLoading(true)
            }

            // Add CSRF token if available
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            if (csrfToken) {
                config.headers['X-CSRF-TOKEN'] = csrfToken
            }

            // Add device info for analytics
            config.headers['X-Device-Info'] = JSON.stringify({
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            })

            console.log(`🚀 [API Request] ${config.method?.toUpperCase()} ${config.url}`, {
                requestId,
                params: config.params,
                data: config.data ? (typeof config.data === 'string' ? 'FormData' : config.data) : undefined
            })

            return config
        } catch (error) {
            console.error('Request interceptor error:', error)
            return Promise.reject(error)
        }
    },
    (error) => {
        console.error('Request setup error:', error)
        toast.error('Lỗi khi chuẩn bị request')
        return Promise.reject(error)
    }
)

// Response interceptor
apiClient.interceptors.response.use(
    (response) => {
        try {
            const uiStore = useUIStore()
            const requestId = response.config.headers['X-Request-ID']

            // Performance tracking
            if (requestId && requestTimes.has(requestId)) {
                const startTime = requestTimes.get(requestId)
                const endTime = performance.now()
                const duration = Math.round(endTime - startTime)

                console.log(`✅ [API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                    requestId,
                    status: response.status,
                    duration: `${duration}ms`,
                    dataSize: response.data ? JSON.stringify(response.data).length : 0
                })

                // Log slow requests
                if (duration > 3000) {
                    console.warn(`🐌 Slow request detected: ${response.config.url} took ${duration}ms`)
                }

                requestTimes.delete(requestId)
            }

            // Hide loading spinner
            uiStore.setLoading(false)

            // Handle different response structures
            if (response.data && typeof response.data === 'object') {
                // Chuẩn hóa response structure
                const normalizedResponse = {
                    success: response.data.success !== false,
                    data: response.data.data || response.data,
                    message: response.data.message,
                    meta: response.data.meta || {
                        page: response.data.page,
                        limit: response.data.limit,
                        total: response.data.total,
                        totalPages: response.data.totalPages
                    }
                }

                response.data = normalizedResponse
            }

            return response
        } catch (error) {
            console.error('Response interceptor error:', error)
            return response // Return original response if processing fails
        }
    },
    async (error) => {
        try {
            const authStore = useAuthStore()
            const uiStore = useUIStore()

            uiStore.setLoading(false)

            const requestId = error.config?.headers?.['X-Request-ID']
            if (requestId) {
                requestTimes.delete(requestId)
            }

            console.error(`❌ [API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
                requestId,
                status: error.response?.status,
                message: error.message,
                data: error.response?.data
            })

            // Handle network errors
            if (!error.response) {
                if (error.code === 'NETWORK_ERROR') {
                    toast.error('Lỗi kết nối mạng. Kiểm tra kết nối internet của bạn.')
                } else if (error.code === 'ECONNABORTED') {
                    toast.error('Request bị timeout. Vui lòng thử lại.')
                } else {
                    toast.error('Không thể kết nối đến server.')
                }
                return Promise.reject(error)
            }

            const { status, data } = error.response

            // Handle different HTTP status codes
            switch (status) {
                case 400:
                    // Bad Request - validation errors
                    if (data?.errors) {
                        const errorMessages = Object.values(data.errors).flat()
                        errorMessages.forEach(msg => toast.error(msg))
                    } else {
                        toast.error(data?.message || 'Dữ liệu không hợp lệ')
                    }
                    break

                case 401:
                    // Unauthorized - token expired or invalid
                    console.warn('Unauthorized access - clearing auth state')
                    authStore.logout()

                    if (router.currentRoute.value.meta.requiresAuth) {
                        await router.push('/auth/login')
                        toast.warning('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.')
                    }
                    break

                case 403:
                    // Forbidden - insufficient permissions
                    toast.error('Bạn không có quyền thực hiện hành động này')
                    break

                case 404:
                    // Not Found
                    if (error.config.url?.includes('/api/')) {
                        toast.error('Không tìm thấy tài nguyên yêu cầu')
                    }
                    break

                case 409:
                    // Conflict
                    toast.error(data?.message || 'Xung đột dữ liệu. Vui lòng refresh và thử lại.')
                    break

                case 422:
                    // Unprocessable Entity - validation errors
                    if (data?.errors) {
                        const firstError = Object.values(data.errors)[0]
                        if (Array.isArray(firstError)) {
                            toast.error(firstError[0])
                        } else {
                            toast.error(firstError)
                        }
                    } else {
                        toast.error(data?.message || 'Dữ liệu không hợp lệ')
                    }
                    break

                case 429:
                    // Too Many Requests
                    const retryAfter = error.response.headers['retry-after']
                    toast.error(`Quá nhiều requests. Vui lòng thử lại sau ${retryAfter || 60} giây.`)
                    break

                case 500:
                    // Internal Server Error
                    toast.error('Lỗi server nội bộ. Chúng tôi đang khắc phục.')
                    break

                case 502:
                    // Bad Gateway
                    toast.error('Lỗi gateway. Vui lòng thử lại sau.')
                    break

                case 503:
                    // Service Unavailable
                    toast.error('Dịch vụ tạm thời không khả dụng. Vui lòng thử lại sau.')
                    break

                case 504:
                    // Gateway Timeout
                    toast.error('Request timeout. Vui lòng thử lại.')
                    break

                default:
                    toast.error(data?.message || `Lỗi không xác định (${status})`)
            }

            // Enhanced error object for better debugging
            const enhancedError = {
                ...error,
                timestamp: new Date().toISOString(),
                requestId,
                url: error.config?.url,
                method: error.config?.method,
                status,
                message: data?.message || error.message,
                errors: data?.errors,
                stack: error.stack
            }

            // Log error to monitoring service in production
            if (import.meta.env.PROD && status >= 500) {
                // Send to error tracking service (Sentry, LogRocket, etc.)
                // logErrorToService(enhancedError)
            }

            return Promise.reject(enhancedError)
        } catch (interceptorError) {
            console.error('Error in response interceptor:', interceptorError)
            return Promise.reject(error) // Return original error if interceptor fails
        }
    }
)

// Retry mechanism for failed requests
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000 // 1 second

apiClient.interceptors.response.use(undefined, async (error) => {
    const config = error.config

    if (!config || !config.retry) {
        config.retry = true
        config.retryCount = 0
    }

    const shouldRetry = (
        config.retryCount < MAX_RETRY_ATTEMPTS &&
        error.response?.status >= 500 &&
        error.config.method?.toLowerCase() === 'get'
    )

    if (shouldRetry) {
        config.retryCount++
        console.log(`🔄 Retrying request (${config.retryCount}/${MAX_RETRY_ATTEMPTS}): ${config.url}`)

        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * config.retryCount))

        return apiClient(config)
    }

    return Promise.reject(error)
})

// Request deduplication để tránh duplicate requests
const pendingRequests = new Map()

const generateRequestKey = (config) => {
    return `${config.method}-${config.url}-${JSON.stringify(config.params)}-${JSON.stringify(config.data)}`
}

apiClient.interceptors.request.use((config) => {
    const requestKey = generateRequestKey(config)

    if (config.deduplicate !== false && pendingRequests.has(requestKey)) {
        console.log(`🔄 Duplicate request detected, reusing pending request: ${config.url}`)
        return pendingRequests.get(requestKey)
    }

    if (config.deduplicate !== false) {
        pendingRequests.set(requestKey, config)
    }

    return config
})

apiClient.interceptors.response.use(
    (response) => {
        const requestKey = generateRequestKey(response.config)
        pendingRequests.delete(requestKey)
        return response
    },
    (error) => {
        const requestKey = generateRequestKey(error.config)
        pendingRequests.delete(requestKey)
        return Promise.reject(error)
    }
)

export default apiClient