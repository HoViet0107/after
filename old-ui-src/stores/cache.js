// Caching store với Redis integration và performance optimization

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCacheStore = defineStore('cache', () => {
    // State
    const localCache = ref(new Map())
    const cacheStats = ref({
        hits: 0,
        misses: 0,
        sets: 0,
        deletes: 0,
        totalSize: 0
    })
    const redisConnected = ref(false)
    const maxLocalCacheSize = ref(100 * 1024 * 1024) // 100MB
    const currentCacheSize = ref(0)

    // Cache layers configuration
    const cacheConfig = {
        // Local cache for frequently accessed data
        local: {
            enabled: true,
            maxSize: 50 * 1024 * 1024, // 50MB
            defaultTTL: 5 * 60 * 1000,  // 5 minutes
            maxItems: 1000
        },
        // Redis for distributed caching
        redis: {
            enabled: import.meta.env.VITE_REDIS_ENABLED === 'true',
            host: import.meta.env.VITE_REDIS_HOST || 'localhost',
            port: import.meta.env.VITE_REDIS_PORT || 6379,
            defaultTTL: 15 * 60 * 1000,  // 15 minutes
            keyPrefix: 'social_ui:'
        },
        // Browser storage fallback
        storage: {
            enabled: true,
            maxSize: 10 * 1024 * 1024, // 10MB
            defaultTTL: 30 * 60 * 1000  // 30 minutes
        }
    }

    // Redis client (will be initialized in plugin)
    let redisClient = null

    // Computed
    const hitRate = computed(() => {
        const total = cacheStats.value.hits + cacheStats.value.misses
        return total > 0 ? (cacheStats.value.hits / total * 100).toFixed(2) : 0
    })

    const cacheInfo = computed(() => ({
        localItems: localCache.value.size,
        totalSize: formatBytes(currentCacheSize.value),
        hitRate: hitRate.value + '%',
        ...cacheStats.value
    }))

    // Core cache operations
    const set = (key, value, ttl = cacheConfig.local.defaultTTL) => {
        try {
            const cacheItem = {
                value,
                timestamp: Date.now(),
                ttl,
                size: calculateSize(value),
                accessCount: 0,
                lastAccessed: Date.now()
            }

            // Check cache size limits
            if (currentCacheSize.value + cacheItem.size > maxLocalCacheSize.value) {
                evictLRU()
            }

            // Set in local cache
            localCache.value.set(key, cacheItem)
            currentCacheSize.value += cacheItem.size
            cacheStats.value.sets++

            // Set in Redis if available
            if (redisConnected.value && redisClient) {
                setInRedis(key, value, ttl)
            }

            // Set in browser storage as fallback
            if (cacheConfig.storage.enabled) {
                setInStorage(key, value, ttl)
            }

            return true
        } catch (error) {
            console.error('Cache set error:', error)
            return false
        }
    }

    const get = (key) => {
        try {
            // Try local cache first
            const localItem = localCache.value.get(key)
            if (localItem) {
                // Check TTL
                if (isExpired(localItem)) {
                    remove(key)
                    cacheStats.value.misses++
                    return null
                }

                // Update access stats
                localItem.accessCount++
                localItem.lastAccessed = Date.now()
                cacheStats.value.hits++

                return localItem.value
            }

            // Try Redis cache
            if (redisConnected.value && redisClient) {
                const redisValue = getFromRedis(key)
                if (redisValue !== null) {
                    // Store in local cache for faster access
                    set(key, redisValue, cacheConfig.local.defaultTTL)
                    cacheStats.value.hits++
                    return redisValue
                }
            }

            // Try browser storage
            if (cacheConfig.storage.enabled) {
                const storageValue = getFromStorage(key)
                if (storageValue !== null) {
                    // Store in local cache for faster access
                    set(key, storageValue, cacheConfig.local.defaultTTL)
                    cacheStats.value.hits++
                    return storageValue
                }
            }

            cacheStats.value.misses++
            return null
        } catch (error) {
            console.error('Cache get error:', error)
            cacheStats.value.misses++
            return null
        }
    }

    const has = (key) => {
        const item = localCache.value.get(key)
        if (item && !isExpired(item)) {
            return true
        }

        // Check Redis if local cache doesn't have it
        if (redisConnected.value && redisClient) {
            return hasInRedis(key)
        }

        return false
    }

    const remove = (key) => {
        try {
            const item = localCache.value.get(key)
            if (item) {
                currentCacheSize.value -= item.size
                localCache.value.delete(key)
                cacheStats.value.deletes++
            }

            // Remove from Redis
            if (redisConnected.value && redisClient) {
                removeFromRedis(key)
            }

            // Remove from storage
            if (cacheConfig.storage.enabled) {
                removeFromStorage(key)
            }

            return true
        } catch (error) {
            console.error('Cache remove error:', error)
            return false
        }
    }

    // Advanced cache operations
    const clear = () => {
        try {
            localCache.value.clear()
            currentCacheSize.value = 0

            // Clear Redis
            if (redisConnected.value && redisClient) {
                clearRedis()
            }

            // Clear storage
            if (cacheConfig.storage.enabled) {
                clearStorage()
            }

            return true
        } catch (error) {
            console.error('Cache clear error:', error)
            return false
        }
    }

    const clearPattern = (pattern) => {
        try {
            const keys = Array.from(localCache.value.keys())
            const regex = new RegExp(pattern.replace(/\*/g, '.*'))

            keys.forEach(key => {
                if (regex.test(key)) {
                    remove(key)
                }
            })

            // Clear pattern in Redis
            if (redisConnected.value && redisClient) {
                clearPatternInRedis(pattern)
            }

            return true
        } catch (error) {
            console.error('Cache clear pattern error:', error)
            return false
        }
    }

    const clearAll = () => {
        clear()
        resetStats()
    }

    // Pattern-based operations
    const deletePattern = (pattern) => {
        return clearPattern(pattern)
    }

    const getKeys = () => {
        return Array.from(localCache.value.keys())
    }

    const getPattern = (pattern) => {
        const results = new Map()
        const regex = new RegExp(pattern.replace(/\*/g, '.*'))

        localCache.value.forEach((value, key) => {
            if (regex.test(key) && !isExpired(value)) {
                results.set(key, value.value)
            }
        })

        return results
    }

    // Multi-get operations for performance
    const mget = (keys) => {
        const results = new Map()

        keys.forEach(key => {
            const value = get(key)
            if (value !== null) {
                results.set(key, value)
            }
        })

        return results
    }

    const mset = (entries, ttl = cacheConfig.local.defaultTTL) => {
        let successCount = 0

        entries.forEach(([key, value]) => {
            if (set(key, value, ttl)) {
                successCount++
            }
        })

        return successCount === entries.length
    }

    // Cache warming and preloading
    const warmup = async (warmupData) => {
        try {
            for (const [key, value, ttl] of warmupData) {
                set(key, value, ttl || cacheConfig.local.defaultTTL)
            }
            console.log(`Cache warmed up with ${warmupData.length} items`)
        } catch (error) {
            console.error('Cache warmup error:', error)
        }
    }

    const preload = async (keys, fetchFn) => {
        try {
            const missing = keys.filter(key => !has(key))

            if (missing.length > 0) {
                const values = await fetchFn(missing)

                missing.forEach((key, index) => {
                    if (values[index] !== undefined) {
                        set(key, values[index])
                    }
                })
            }
        } catch (error) {
            console.error('Cache preload error:', error)
        }
    }

    // Memory management
    const evictLRU = () => {
        try {
            const items = Array.from(localCache.value.entries())

            // Sort by last accessed time (LRU)
            items.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)

            // Remove oldest 20% of items
            const toRemove = Math.ceil(items.length * 0.2)

            for (let i = 0; i < toRemove && items.length > 0; i++) {
                const [key, item] = items[i]
                currentCacheSize.value -= item.size
                localCache.value.delete(key)
            }

            console.log(`Evicted ${toRemove} items from cache`)
        } catch (error) {
            console.error('Cache eviction error:', error)
        }
    }

    const evictExpired = () => {
        try {
            let evictedCount = 0
            const now = Date.now()

            localCache.value.forEach((item, key) => {
                if (isExpired(item, now)) {
                    currentCacheSize.value -= item.size
                    localCache.value.delete(key)
                    evictedCount++
                }
            })

            if (evictedCount > 0) {
                console.log(`Evicted ${evictedCount} expired items from cache`)
            }

            return evictedCount
        } catch (error) {
            console.error('Cache expired eviction error:', error)
            return 0
        }
    }

    // Redis operations
    const setInRedis = async (key, value, ttl) => {
        if (!redisClient) return false

        try {
            const serialized = JSON.stringify({
                value,
                timestamp: Date.now(),
                ttl
            })

            await redisClient.setex(
                cacheConfig.redis.keyPrefix + key,
                Math.ceil(ttl / 1000),
                serialized
            )

            return true
        } catch (error) {
            console.error('Redis set error:', error)
            return false
        }
    }

    const getFromRedis = async (key) => {
        if (!redisClient) return null

        try {
            const data = await redisClient.get(cacheConfig.redis.keyPrefix + key)

            if (data) {
                const parsed = JSON.parse(data)

                // Check if expired
                if (Date.now() - parsed.timestamp > parsed.ttl) {
                    await removeFromRedis(key)
                    return null
                }

                return parsed.value
            }

            return null
        } catch (error) {
            console.error('Redis get error:', error)
            return null
        }
    }

    const removeFromRedis = async (key) => {
        if (!redisClient) return false

        try {
            await redisClient.del(cacheConfig.redis.keyPrefix + key)
            return true
        } catch (error) {
            console.error('Redis remove error:', error)
            return false
        }
    }

    const hasInRedis = async (key) => {
        if (!redisClient) return false

        try {
            const exists = await redisClient.exists(cacheConfig.redis.keyPrefix + key)
            return exists === 1
        } catch (error) {
            console.error('Redis has error:', error)
            return false
        }
    }

    const clearRedis = async () => {
        if (!redisClient) return false

        try {
            const keys = await redisClient.keys(cacheConfig.redis.keyPrefix + '*')
            if (keys.length > 0) {
                await redisClient.del(keys)
            }
            return true
        } catch (error) {
            console.error('Redis clear error:', error)
            return false
        }
    }

    const clearPatternInRedis = async (pattern) => {
        if (!redisClient) return false

        try {
            const keys = await redisClient.keys(cacheConfig.redis.keyPrefix + pattern)
            if (keys.length > 0) {
                await redisClient.del(keys)
            }
            return true
        } catch (error) {
            console.error('Redis clear pattern error:', error)
            return false
        }
    }

    // Browser storage operations
    const setInStorage = (key, value, ttl) => {
        try {
            const item = {
                value,
                timestamp: Date.now(),
                ttl
            }

            localStorage.setItem(
                cacheConfig.redis.keyPrefix + key,
                JSON.stringify(item)
            )

            return true
        } catch (error) {
            console.error('Storage set error:', error)
            return false
        }
    }

    const getFromStorage = (key) => {
        try {
            const data = localStorage.getItem(cacheConfig.redis.keyPrefix + key)

            if (data) {
                const parsed = JSON.parse(data)

                // Check if expired
                if (Date.now() - parsed.timestamp > parsed.ttl) {
                    removeFromStorage(key)
                    return null
                }

                return parsed.value
            }

            return null
        } catch (error) {
            console.error('Storage get error:', error)
            return null
        }
    }

    const removeFromStorage = (key) => {
        try {
            localStorage.removeItem(cacheConfig.redis.keyPrefix + key)
            return true
        } catch (error) {
            console.error('Storage remove error:', error)
            return false
        }
    }

    const clearStorage = () => {
        try {
            const keys = Object.keys(localStorage)
            const prefix = cacheConfig.redis.keyPrefix

            keys.forEach(key => {
                if (key.startsWith(prefix)) {
                    localStorage.removeItem(key)
                }
            })

            return true
        } catch (error) {
            console.error('Storage clear error:', error)
            return false
        }
    }

    // Utility functions
    const isExpired = (item, now = Date.now()) => {
        return (now - item.timestamp) > item.ttl
    }

    const calculateSize = (value) => {
        try {
            return JSON.stringify(value).length * 2 // Rough estimate
        } catch {
            return 0
        }
    }

    const formatBytes = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const resetStats = () => {
        cacheStats.value = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            totalSize: 0
        }
    }

    // Maintenance tasks
    const runMaintenance = () => {
        try {
            const evictedCount = evictExpired()

            // Log cache statistics
            console.log('Cache maintenance completed:', {
                evicted: evictedCount,
                hitRate: hitRate.value + '%',
                size: formatBytes(currentCacheSize.value),
                items: localCache.value.size
            })

            return evictedCount
        } catch (error) {
            console.error('Cache maintenance error:', error)
            return 0
        }
    }

    // Redis connection management
    const initRedis = (client) => {
        redisClient = client
        redisConnected.value = true
        console.log('Redis cache client initialized')
    }

    const disconnectRedis = () => {
        redisClient = null
        redisConnected.value = false
        console.log('Redis cache client disconnected')
    }

    // Periodic maintenance
    if (typeof window !== 'undefined') {
        setInterval(runMaintenance, 5 * 60 * 1000) // Every 5 minutes
    }

    return {
        // State
        localCache: computed(() => localCache.value),
        cacheStats: computed(() => cacheStats.value),
        redisConnected: computed(() => redisConnected.value),
        cacheInfo,
        hitRate,

        // Core operations
        set,
        get,
        has,
        remove,
        clear,
        clearAll,
        clearPattern,
        deletePattern,

        // Advanced operations
        getKeys,
        getPattern,
        mget,
        mset,

        // Cache warming
        warmup,
        preload,

        // Memory management
        evictLRU,
        evictExpired,
        runMaintenance,

        // Redis management
        initRedis,
        disconnectRedis,

        // Utilities
        resetStats,
        formatBytes
    }
})