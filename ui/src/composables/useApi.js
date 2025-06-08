import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import { useToast } from 'vue-toastification'

export function useApi() {
    const isLoading = ref(false)
    const error = ref(null)
    const data = ref(null)

    const execute = async (apiCall, options = {}) => {
        const {
            showToast = true,
            successMessage = null,
            errorMessage = null,
            transform = null
        } = options

        try {
            isLoading.value = true
            error.value = null

            const response = await apiCall()
            data.value = transform ? transform(response.data) : response.data

            if (showToast && successMessage) {
                const toast = useToast()
                toast.success(successMessage)
            }

            return data.value
        } catch (err) {
            error.value = err

            if (showToast && errorMessage) {
                const toast = useToast()
                toast.error(errorMessage)
            }

            throw err
        } finally {
            isLoading.value = false
        }
    }

    const reset = () => {
        isLoading.value = false
        error.value = null
        data.value = null
    }

    return {
        isLoading: computed(() => isLoading.value),
        error: computed(() => error.value),
        data: computed(() => data.value),
        execute,
        reset
    }
}