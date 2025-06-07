import { useToast } from 'vue-toastification'

/**
 * Global Error Handler for Vue.js Social Media Application
 * Handles different types of errors and provides user-friendly messages
 */

// Error types
export const ERROR_TYPES = {
    NETWORK: 'NETWORK_ERROR',
    AUTHENTICATION: 'AUTH_ERROR',
    VALIDATION: 'VALIDATION_ERROR',
    PERMISSION: 'PERMISSION_ERROR',
    NOT_FOUND: 'NOT_FOUND_ERROR',
    SERVER: 'SERVER_ERROR',
    CLIENT: 'CLIENT_ERROR',
    WEBSOCKET: 'WEBSOCKET_ERROR',
    FILE_UPLOAD: 'FILE_UPLOAD_ERROR',
    TIMEOUT: 'TIMEOUT_ERROR',
    RATE_LIMIT: 'RATE_LIMIT_ERROR'
}

// Error severity levels
export const ERROR_SEVERITY = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
}

// Error messages in Vietnamese
const ERROR_MESSAGES = {
    [ERROR_TYPES.NETWORK]: {
        title: 'Lỗi kết nối',
        message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.',
        severity: ERROR_SEVERITY.HIGH
    },
    [ERROR_TYPES.AUTHENTICATION]: {
        title: 'Lỗi xác thực',
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.',
        severity: ERROR_SEVERITY.HIGH
    },
    [ERROR_TYPES.VALIDATION]: {
        title: 'Dữ liệu không hợp lệ',
        message: 'Vui lòng kiểm tra lại thông tin đã nhập.',
        severity: ERROR_SEVERITY.MEDIUM
    },
    [ERROR_TYPES.PERMISSION]: {
        title: 'Không có quyền truy cập',
        message: 'Bạn không có quyền thực hiện hành động này.',
        severity: ERROR_SEVERITY.MEDIUM
    },
    [ERROR_TYPES.NOT_FOUND]: {
        title: 'Không tìm thấy',
        message: 'Tài nguyên yêu cầu không tồn tại.',
        severity: ERROR_SEVERITY.MEDIUM
    },
    [ERROR_TYPES.SERVER]: {
        title: 'Lỗi máy chủ',
        message: 'Đã xảy ra lỗi trên máy chủ. Vui lòng thử lại sau.',
        severity: ERROR_SEVERITY.HIGH
    },
    [ERROR_TYPES.CLIENT]: {
        title: 'Lỗi ứng dụng',
        message: 'Đã xảy ra lỗi trong ứng dụng. Vui lòng tải lại trang.',
        severity: ERROR_SEVERITY.MEDIUM
    },
    [ERROR_TYPES.WEBSOCKET]: {
        title: 'Lỗi kết nối real-time',
        message: 'Mất kết nối real-time. Đang thử kết nối lại...',
        severity: ERROR_SEVERITY.MEDIUM
    },
    [ERROR_TYPES.FILE_UPLOAD]: {
        title: 'Lỗi tải file',
        message: 'Không thể tải file lên. Vui lòng thử lại.',
        severity: ERROR_SEVERITY.MEDIUM
    },
    [ERROR_TYPES.TIMEOUT]: {
        title: 'Hết thời gian chờ',
        message: 'Yêu cầu đã hết thời gian chờ. Vui lòng thử lại.',
        severity: ERROR_SEVERITY.MEDIUM
    },
    [ERROR_TYPES.RATE_LIMIT]: {
        title: 'Quá nhiều yêu cầu',
        message: 'Bạn đã thực hiện quá nhiều yêu cầu. Vui lòng thử lại sau.',
        severity: ERROR_SEVERITY.MEDIUM
    }
}

/**
 * Enhanced error class with additional context
 */
export class ApplicationError extends Error {
    constructor(message, type = ERROR_TYPES.CLIENT, originalError = null, context = {}) {
        super(message)
        this.name = 'ApplicationError'
        this.type = type
        this.originalError = originalError
        this.context = context
        this.timestamp = new Date().toISOString()
        this.severity = ERROR_MESSAGES[type]?.severity || ERROR_SEVERITY.MEDIUM
    }

    toJSON() {
        return {
            name: this.name,
            message: this.message,
            type: this.type,
            severity: this.severity,
            timestamp: this.timestamp,
            context: this.context,
            stack: this.stack,
            originalError: this.originalError ? {
                name: this.originalError.name,
                message: this.originalError.message,
                stack: this.originalError.stack
            } : null
        }
    }
}

/**
 * Determines error type from HTTP status code or error object
 */
export function getErrorType(error) {
    if (!error) return ERROR_TYPES.CLIENT

    // Network errors
    if (error.code === 'NETWORK_ERROR' || !error.response) {
        return ERROR_TYPES.NETWORK
    }

    // HTTP status code based errors
    if (error.response) {
        const status = error.response.status

        switch (status) {
            case 400:
                return ERROR_TYPES.VALIDATION
            case 401:
                return ERROR_TYPES.AUTHENTICATION
            case 403:
                return ERROR_TYPES.PERMISSION
            case 404:
                return ERROR_TYPES.NOT_FOUND
            case 408:
                return ERROR_TYPES.TIMEOUT
            case 429:
                return ERROR_TYPES.RATE_LIMIT
            case 500:
            case 502:
            case 503:
            case 504:
                return ERROR_TYPES.SERVER
            default:
                return ERROR_TYPES.CLIENT
        }
    }

    // WebSocket errors
    if (error.type === 'websocket' || error.name === 'WebSocketError') {
        return ERROR_TYPES.WEBSOCKET
    }

    // File upload errors
    if (error.name === 'FileUploadError' || error.type === 'upload') {
        return ERROR_TYPES.FILE_UPLOAD
    }

    // Default to client error
    return ERROR_TYPES.CLIENT
}

/**
 * Extracts user-friendly message from error
 */
export function getErrorMessage(error, customMessage = null) {
    if (customMessage) return customMessage

    const errorType = getErrorType(error)
    const defaultMessage = ERROR_MESSAGES[errorType]

    // Try to get message from API response
    if (error.response?.data?.message) {
        return error.response.data.message
    }

    // Use default message for error type
    return defaultMessage.message
}

/**
 * Main error handler function
 */
export function handleError(error, context = {}, options = {}) {
    const {
        showToast = true,
        logToConsole = true,
        reportToService = import.meta.env.PROD,
        customMessage = null,
        severity = null
    } = options

    const errorType = getErrorType(error)
    const errorInfo = ERROR_MESSAGES[errorType]
    const message = customMessage || getErrorMessage(error)

    const enhancedError = new ApplicationError(
        message,
        errorType,
        error,
        {
            ...context,
            url: window.location.href,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        }
    )

    // Override severity if provided
    if (severity) {
        enhancedError.severity = severity
    }

    // Log to console in development
    if (logToConsole && import.meta.env.DEV) {
        console.group(`🚨 ${errorInfo.title}`)
        console.error('Error Object:', enhancedError)
        console.error('Original Error:', error)
        console.error('Context:', context)
        console.groupEnd()
    }

    // Show toast notification
    if (showToast) {
        const toast = useToast()

        switch (enhancedError.severity) {
            case ERROR_SEVERITY.CRITICAL:
            case ERROR_SEVERITY.HIGH:
                toast.error(message, {
                    title: errorInfo.title,
                    timeout: 8000
                })
                break
            case ERROR_SEVERITY.MEDIUM:
                toast.warning(message, {
                    title: errorInfo.title,
                    timeout: 5000
                })
                break
            case ERROR_SEVERITY.LOW:
                toast.info(message, {
                    title: errorInfo.title,
                    timeout: 3000
                })
                break
        }
    }

    // Report to error tracking service
    if (reportToService && enhancedError.severity !== ERROR_SEVERITY.LOW) {
        reportError(enhancedError)
    }

    return enhancedError
}

/**
 * Reports error to external service (Sentry, etc.)
 */
async function reportError(error) {
    try {
        // Only report in production with valid DSN
        if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) {
            return
        }

        // Report to Sentry or other error tracking service
        if (window.Sentry) {
            window.Sentry.captureException(error.originalError || error, {
                tags: {
                    errorType: error.type,
                    severity: error.severity
                },
                extra: {
                    context: error.context,
                    timestamp: error.timestamp
                }
            })
        }

        // Alternative: Send to custom error API
        // await fetch('/api/errors', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(error.toJSON())
        // })

    } catch (reportingError) {
        console.error('Failed to report error:', reportingError)
    }
}

/**
 * Setup global error handlers for Vue app
 */
export function setupErrorHandler(app) {
    // Vue error handler
    app.config.errorHandler = (error, instance, info) => {
        handleError(error, {
            component: instance?.$options?.name || 'Unknown',
            info,
            vue: true
        })
    }

    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        handleError(event.reason, {
            type: 'unhandledRejection',
            promise: true
        })
        event.preventDefault()
    })

    // Global JavaScript errors
    window.addEventListener('error', (event) => {
        handleError(event.error, {
            type: 'globalError',
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
        })
    })

    // Resource loading errors
    window.addEventListener('error', (event) => {
        if (event.target !== window) {
            handleError(new Error(`Failed to load resource: ${event.target.src || event.target.href}`), {
                type: 'resourceError',
                tagName: event.target.tagName,
                src: event.target.src || event.target.href
            }, {
                severity: ERROR_SEVERITY.LOW
            })
        }
    }, true)
}

/**
 * Utility functions for specific error scenarios
 */
export const errorUtils = {
    // Network error handler
    handleNetworkError(error, context = {}) {
        return handleError(error, {
            ...context,
            type: 'network'
        }, {
            customMessage: 'Mất kết nối mạng. Vui lòng kiểm tra kết nối và thử lại.',
            severity: ERROR_SEVERITY.HIGH
        })
    },

    // API error handler
    handleApiError(error, endpoint, context = {}) {
        return handleError(error, {
            ...context,
            endpoint,
            type: 'api'
        })
    },

    // File upload error handler
    handleFileUploadError(error, fileName, context = {}) {
        return handleError(error, {
            ...context,
            fileName,
            type: 'fileUpload'
        }, {
            customMessage: `Không thể tải file "${fileName}". Vui lòng thử lại.`,
            severity: ERROR_SEVERITY.MEDIUM
        })
    },

    // WebSocket error handler
    handleWebSocketError(error, context = {}) {
        return handleError(error, {
            ...context,
            type: 'websocket'
        }, {
            severity: ERROR_SEVERITY.MEDIUM
        })
    },

    // Validation error handler
    handleValidationError(errors, context = {}) {
        const messages = Array.isArray(errors) ? errors : [errors]
        return handleError(new Error(messages.join(', ')), {
            ...context,
            type: 'validation',
            validationErrors: errors
        }, {
            severity: ERROR_SEVERITY.MEDIUM
        })
    }
}

export default {
    ApplicationError,
    ERROR_TYPES,
    ERROR_SEVERITY,
    handleError,
    setupErrorHandler,
    getErrorType,
    getErrorMessage,
    errorUtils
}