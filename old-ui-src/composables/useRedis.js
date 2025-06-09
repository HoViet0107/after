import { ref, computed } from 'vue'
import { useCacheStore } from '@/stores/cache'

export function useRedis() {
    const cacheStore = useCacheStore()

    // State
    const isConnected = ref(true) // Assume connected, will be updated by WebSocket
    const error = ref(null)

    // Computed
    const isReady = computed(() => isConnected.value && !error.value)

    // Set value in cache
    const set = async (key, value, ttl = null) => {
        try {
            cacheStore.set(key, value, ttl)
            return true
        } catch (err) {
            error.value = err
            console.error('Redis set error:', err)
            return false
        }
    }

    // Get value from cache
    const get = async (key) => {
        try {
            return cacheStore.get(key)
        } catch (err) {
            error.value = err
            console.error('Redis get error:', err)
            return null
        }
    }

    // Check if key exists
    const exists = async (key) => {
        try {
            return cacheStore.has(key)
        } catch (err) {
            error.value = err
            console.error('Redis exists error:', err)
            return false
        }
    }

    // Delete key
    const del = async (key) => {
        try {
            cacheStore.remove(key)
            return true
        } catch (err) {
            error.value = err
            console.error('Redis delete error:', err)
            return false
        }
    }

    // Clear all cache
    const flush = async () => {
        try {
            cacheStore.clear()
            return true
        } catch (err) {
            error.value = err
            console.error('Redis flush error:', err)
            return false
        }
    }

    // Set with expiration
    const setex = async (key, seconds, value) => {
        return set(key, value, seconds * 1000)
    }

    // Increment counter
    const incr = async (key) => {
        try {
            const current = (await get(key)) || 0
            const newValue = Number(current) + 1
            await set(key, newValue)
            return newValue
        } catch (err) {
            error.value = err
            console.error('Redis increment error:', err)
            return null
        }
    }

    // Add to list
    const lpush = async (key, ...values) => {
        try {
            const current = (await get(key)) || []
            const newList = [...values, ...current]
            await set(key, newList)
            return newList.length
        } catch (err) {
            error.value = err
            console.error('Redis lpush error:', err)
            return null
        }
    }

    // Get list range
    const lrange = async (key, start = 0, stop = -1) => {
        try {
            const list = (await get(key)) || []
            if (stop === -1) return list.slice(start)
            return list.slice(start, stop + 1)
        } catch (err) {
            error.value = err
            console.error('Redis lrange error:', err)
            return []
        }
    }

    // Add to set
    const sadd = async (key, ...members) => {
        try {
            const current = new Set(await get(key) || [])
            members.forEach(member => current.add(member))
            const newSet = Array.from(current)
            await set(key, newSet)
            return newSet.length
        } catch (err) {
            error.value = err
            console.error('Redis sadd error:', err)
            return null
        }
    }

    // Get all set members
    const smembers = async (key) => {
        try {
            return (await get(key)) || []
        } catch (err) {
            error.value = err
            console.error('Redis smembers error:', err)
            return []
        }
    }

    return {
        // State
        isConnected: computed(() => isConnected.value),
        error: computed(() => error.value),
        isReady,

        // Actions
        set,
        get,
        exists,
        del,
        flush,
        setex,
        incr,
        lpush,
        lrange,
        sadd,
        smembers
    }
}
