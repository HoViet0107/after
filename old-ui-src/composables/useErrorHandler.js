import { ref, computed } from 'vue'
import { useToast } from 'vue-toastification'
import { ApplicationError, getErrorType, getErrorMessage } from '@/utils/errorHandler'

export function useErrorHandler() {
    const errors = ref([])
    const isError = ref(false)
    const toast = useToast()

    // Computed
    const hasErrors = computed(() => errors.value.length > 0)
    const latestError = computed(() => errors.value[errors.value.length - 1] || null)

    // Add error
    const addError = (error, context = {}) => {
        const enhancedError = error instanceof ApplicationError
            ? error
            : new ApplicationError(
                error.message || 'Unknown error',
                getErrorType(error),
                error,
                context
            )

        errors.value.push({
            id: Date.now().toString(),
            error: enhancedError,
            timestamp: new Date(),
            context
        })

        isError.value = true

        // Auto-remove error after 10 seconds
        setTimeout(() => {
            removeError(enhancedError.id)
        }, 10000)

        return enhancedError
    }

    // Remove error
    const removeError = (errorId) => {
        errors.value = errors.value.filter(e => e.id !== errorId)
        isError.value = errors.value.length > 0
    }

    // Clear all errors
    const clearErrors = () => {
        errors.value = []
        isError.value = false
    }

    // Handle API errors
    const handleApiError = (error, showToast = true) => {
        const enhancedError = addError(error, { type: 'api' })

        if (showToast) {
            const message = getErrorMessage(enhancedError.type) || enhancedError.message
            toast.error(message)
        }

        return enhancedError
    }

    // Handle validation errors
    const handleValidationError = (errors, showToast = true) => {
        const errorMessages = Array.isArray(errors) ? errors : [errors]
        const message = errorMessages.join(', ')

        const enhancedError = addError(new Error(message), {
            type: 'validation',
            validationErrors: errorMessages
        })

        if (showToast) {
            toast.error('Vui lòng kiểm tra lại thông tin nhập vào')
        }

        return enhancedError
    }

    // Handle network errors
    const handleNetworkError = (error, showToast = true) => {
        const enhancedError = addError(error, { type: 'network' })

        if (showToast) {
            toast.error('Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet.')
        }

        return enhancedError
    }

    // Retry function
    const retry = async (fn, maxAttempts = 3, delay = 1000) => {
        let attempts = 0

        while (attempts < maxAttempts) {
            try {
                return await fn()
            } catch (error) {
                attempts++

                if (attempts >= maxAttempts) {
                    handleApiError(error)
                    throw error
                }

                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, delay * attempts))
            }
        }
    }

    return {
        // State
        errors: computed(() => errors.value),
        isError: computed(() => isError.value),
        hasErrors,
        latestError,

        // Actions
        addError,
        removeError,
        clearErrors,
        handleApiError,
        handleValidationError,
        handleNetworkError,
        retry
    }
}