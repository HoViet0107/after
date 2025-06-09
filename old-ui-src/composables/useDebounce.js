import { ref, watch } from 'vue'

export function useDebounce(value, delay = 300) {
    const debouncedValue = ref(value.value)

    let timeout = null

    watch(value, (newValue) => {
        if (timeout) {
            clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
            debouncedValue.value = newValue
        }, delay)
    }, { immediate: true })

    return debouncedValue
}

export function useDebouncedRef(initialValue, delay = 300) {
    const immediate = ref(initialValue)
    const debounced = ref(initialValue)

    let timeout = null

    watch(immediate, (newValue) => {
        if (timeout) {
            clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
            debounced.value = newValue
        }, delay)
    })

    return [immediate, debounced]
}

export function useDebouncedFunction(fn, delay = 300) {
    let timeout = null

    return (...args) => {
        if (timeout) {
            clearTimeout(timeout)
        }

        timeout = setTimeout(() => {
            fn(...args)
        }, delay)
    }
}