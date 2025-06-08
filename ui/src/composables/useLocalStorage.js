import { ref, watch, computed } from 'vue'

export function useLocalStorage(key, defaultValue = null, options = {}) {
    const {
        serializer = JSON,
        syncAcrossTabs = true
    } = options

    // Read initial value
    const read = () => {
        try {
            const item = localStorage.getItem(key)
            if (item === null) return defaultValue
            return serializer.parse(item)
        } catch (error) {
            console.error(`Error reading localStorage key "${key}":`, error)
            return defaultValue
        }
    }

    // Write value
    const write = (value) => {
        try {
            if (value === null || value === undefined) {
                localStorage.removeItem(key)
            } else {
                localStorage.setItem(key, serializer.stringify(value))
            }
        } catch (error) {
            console.error(`Error writing localStorage key "${key}":`, error)
        }
    }

    // Reactive value
    const storedValue = ref(read())

    // Watch for changes and update localStorage
    watch(storedValue, (newValue) => {
        write(newValue)
    }, { deep: true })

    // Listen for changes from other tabs
    if (syncAcrossTabs) {
        const handleStorageChange = (e) => {
            if (e.key === key && e.newValue !== e.oldValue) {
                try {
                    storedValue.value = e.newValue
                        ? serializer.parse(e.newValue)
                        : defaultValue
                } catch (error) {
                    console.error(`Error parsing localStorage value for key "${key}":`, error)
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)
    }

    return storedValue
}