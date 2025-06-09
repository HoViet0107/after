// Manage loading states to avoid declaring multiple refs

import { ref, reactive } from 'vue'

export const useLoadingStates = (states = []) => {
    const loading = reactive({})

    // Initialize loading states
    states.forEach(state => {
        loading[state] = false
    })

    const setLoading = (state, value) => {
        if (loading.hasOwnProperty(state)) {
            loading[state] = value
        }
    }

    const isLoading = (state) => {
        return loading[state] || false
    }

    const isAnyLoading = () => {
        return Object.values(loading).some(state => state)
    }

    const resetLoading = () => {
        Object.keys(loading).forEach(key => {
            loading[key] = false
        })
    }

    return {
        loading,
        setLoading,
        isLoading,
        isAnyLoading,
        resetLoading
    }
}

export default useLoadingStates