import axios from 'axios'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Create an Axios instance with base URL and default settings
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    timeout: 30000, // 30 seconds
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
})

// Request interceptor - add token and request ID
apiClient.interceptors.request.use(
    (config) => {
        const authStore = useAuthStore()

        // Add Authorization header if token exists
        if (authStore.token) {
            config.headers.Authorization = `Bearer ${authStore.token}`
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = generateRequestId()

        // Log request in development
        if (import.meta.env.DEV) {
            console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
                headers: config.headers,
                data: config.data
            })
        }

        return config
    },
    (error) => {
        console.error('❌ Request Error:', error)
        return Promise.reject(error)
    }
)

// Response interceptor - handle errors and log responses
apiClient.interceptors.response.use(
    (response) => {
        // Log response in development
        if (import.meta.env.DEV) {
            console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
                status: response.status,
                data: response.data
            })
        }

        return response
    },
    async (error) => {
        const authStore = useAuthStore()
        const toast = useToast()

        console.error('❌ Response Error:', error)

        // Handle different types of errors
        if (error.response) {
            const { status, data } = error.response

            switch (status) {
                case 401:
                    // Unauthorized - token expired or invalid
                    toast.error('Session has expired. Please log in again.')
                    await authStore.logout()
                    window.location.href = '/auth/login'
                    break

                case 403:
                    // Forbidden
                    toast.error('You do not have permission to perform this action.')
                    break

                case 404:
                    // Not Found
                    toast.error('Resource not found.')
                    break

                case 422:
                    // Validation Error
                    if (data?.errors) {
                        // Display validation errors
                        Object.values(data.errors).forEach(messages => {
                            if (Array.isArray(messages)) {
                                messages.forEach(message => toast.error(message))
                            } else {
                                toast.error(messages)
                            }
                        })
                    } else {
                        toast.error(data?.message || 'Invalid data.')
                    }
                    break

                case 429:
                    // Rate Limit
                    toast.error('You have made too many requests. Please try again later.')
                    break

                case 500:
                    // Server Error
                    toast.error('Server error. Please try again later.')
                    break

                default:
                    // Other errors
                    toast.error(data?.message || `Error ${status}: ${error.message}`)
            }
        } else if (error.request) {
            // Network Error
            if (error.code === 'ECONNABORTED') {
                toast.error('Request timed out. Please try again.')
            } else {
                toast.error('Unable to connect to the server. Please check your network connection.')
            }
        } else {
            // Other errors
            toast.error('An unexpected error occurred.')
        }

        return Promise.reject(error)
    }
)

// Utility functions
function generateRequestId() {
    return Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15)
}

// Retry logic cho failed requests
export const retryRequest = async (fn, retries = 3, delay = 1000) => {
    try {
        return await fn()
    } catch (error) {
        if (retries > 0 && shouldRetry(error)) {
            await wait(delay)
            return retryRequest(fn, retries - 1, delay * 2)
        }
        throw error
    }
}

function shouldRetry(error) {
    // Retry for network errors and 5xx server errors
    return !error.response ||
        error.response.status >= 500 ||
        error.code === 'ECONNABORTED'
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Upload progress helper
export const createUploadConfig = (onProgress) => ({
    onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
        )
        onProgress?.(percentCompleted)
    }
})

// Cancel token helper
export const createCancelToken = () => {
    const source = axios.CancelToken.source()
    return {
        token: source.token,
        cancel: source.cancel
    }
}

// Health check
export const healthCheck = async () => {
    try {
        const response = await apiClient.get('/health')
        return response.status === 200
    } catch {
        return false
    }
}

export default apiClient