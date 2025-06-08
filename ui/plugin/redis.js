// Redis-compatible caching plugin for browser environment

import { useCacheStore } from '@/stores/cache'

class RedisBrowserClient {
    constructor() {
        this.cache = useCacheStore()
        this.isConnected = false
        this.connectionAttempts = 0
        this.maxConnectionAttempts = 5
        this.retryDelay = 1000
        this.serverUrl = import.meta.env.VITE_REDIS_SERVER_URL
        this.apiKey = import.meta.env.VITE_REDIS_API_KEY

        // Simulate Redis commands with local storage + API hybrid
        this.keyPrefix = 'redis_browser:'
        this.pubsubChannels = new Map()
        this.subscribers = new Map()

        // WebSocket for pub/sub if available
        this.pubsubSocket = null

        // Statistics
        this.stats = {
            operations: 0,
            hits: 0,
            misses: 0,
            sets: 0,
            gets: 0,
            deletes: 0,
            errors: 0
        }

        this.initialize()
    }

    async initialize() {
        try {
            // Try to connect to Redis server if URL provided
            if (this.serverUrl) {
                await this.connectToServer()
            } else {
                // Fallback to browser-only mode
                console.log('📦 Redis: Running in browser-only mode')
                this.isConnected = true
            }

            // Initialize cache store integration
            this.cache.initRedis(this)

            console.log('✅ Redis client initialized')
        } catch (error) {
            console.error('❌ Redis initialization failed:', error)
            // Fallback to local cache only
            this.isConnected = true
        }
    }

    async connectToServer() {
        try {
            this.connectionAttempts++

            // Test connection with ping
            const response = await fetch(`${this.serverUrl}/ping`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                }
            })

            if (response.ok) {
                this.isConnected = true
                this.connectionAttempts = 0
                console.log('✅ Connected to Redis server')

                // Setup pub/sub WebSocket if supported
                await this.setupPubSub()
            } else {
                throw new Error(`Server responded with ${response.status}`)
            }
        } catch (error) {
            console.warn('⚠️ Redis server connection failed:', error.message)

            if (this.connectionAttempts < this.maxConnectionAttempts) {
                console.log(`Retrying connection in ${this.retryDelay}ms...`)
                setTimeout(() => this.connectToServer(), this.retryDelay)
                this.retryDelay *= 2 // Exponential backoff
            } else {
                console.log('Max connection attempts reached, using local cache only')
                this.isConnected = true // Enable local operations
            }
        }
    }

    async setupPubSub() {
        if (!this.serverUrl) return

        try {
            const wsUrl = this.serverUrl.replace('http', 'ws') + '/pubsub'
            this.pubsubSocket = new WebSocket(wsUrl)

            this.pubsubSocket.onopen = () => {
                console.log('✅ Redis Pub/Sub WebSocket connected')
            }

            this.pubsubSocket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data)
                    this.handlePubSubMessage(data)
                } catch (error) {
                    console.error('Failed to parse pub/sub message:', error)
                }
            }

            this.pubsubSocket.onclose = () => {
                console.log('❌ Redis Pub/Sub WebSocket disconnected')
                // Attempt to reconnect after delay
                setTimeout(() => this.setupPubSub(), 5000)
            }

            this.pubsubSocket.onerror = (error) => {
                console.error('Redis Pub/Sub WebSocket error:', error)
            }
        } catch (error) {
            console.error('Failed to setup pub/sub:', error)
        }
    }

    // Core Redis commands implementation
    async set(key, value, options = {}) {
        try {
            this.stats.operations++
            this.stats.sets++

            const fullKey = this.keyPrefix + key
            const ttl = options.ex || options.ttl || 0 // TTL in seconds

            const data = {
                value: typeof value === 'string' ? value : JSON.stringify(value),
                timestamp: Date.now(),
                ttl: ttl > 0 ? ttl * 1000 : 0, // Convert to milliseconds
                type: typeof value
            }

            // Store locally first
            localStorage.setItem(fullKey, JSON.stringify(data))

            // Also store in cache store
            this.cache.set(key, value, data.ttl)

            // Sync with server if connected
            if (this.serverUrl && this.isConnected) {
                await this.syncToServer('SET', key, data, options)
            }

            return 'OK'
        } catch (error) {
            this.stats.errors++
            console.error('Redis SET error:', error)
            throw error
        }
    }

    async get(key) {
        try {
            this.stats.operations++
            this.stats.gets++

            // Try cache store first (fastest)
            const cacheValue = this.cache.get(key)
            if (cacheValue !== null) {
                this.stats.hits++
                return cacheValue
            }

            // Try local storage
            const fullKey = this.keyPrefix + key
            const stored = localStorage.getItem(fullKey)

            if (stored) {
                const data = JSON.parse(stored)

                // Check TTL
                if (data.ttl > 0 && Date.now() - data.timestamp > data.ttl) {
                    // Expired, remove it
                    localStorage.removeItem(fullKey)
                    this.stats.misses++
                    return null
                }

                // Parse value based on type
                let value = data.value
                if (data.type === 'object') {
                    value = JSON.parse(data.value)
                }

                // Update cache store
                this.cache.set(key, value, data.ttl - (Date.now() - data.timestamp))

                this.stats.hits++
                return value
            }

            // Try server if connected
            if (this.serverUrl && this.isConnected) {
                const serverValue = await this.getFromServer(key)
                if (serverValue !== null) {
                    // Cache locally
                    await this.set(key, serverValue, { ttl: 300 }) // 5 minutes default
                    this.stats.hits++
                    return serverValue
                }
            }

            this.stats.misses++
            return null
        } catch (error) {
            this.stats.errors++
            console.error('Redis GET error:', error)
            return null
        }
    }

    async del(key) {
        try {
            this.stats.operations++
            this.stats.deletes++

            const fullKey = this.keyPrefix + key
            let deletedCount = 0

            // Remove from local storage
            if (localStorage.getItem(fullKey)) {
                localStorage.removeItem(fullKey)
                deletedCount++
            }

            // Remove from cache store
            this.cache.remove(key)

            // Sync with server
            if (this.serverUrl && this.isConnected) {
                await this.syncToServer('DEL', key)
            }

            return deletedCount
        } catch (error) {
            this.stats.errors++
            console.error('Redis DEL error:', error)
            return 0
        }
    }

    async exists(key) {
        try {
            this.stats.operations++

            // Check cache store first
            if (this.cache.has(key)) {
                return 1
            }

            // Check local storage
            const fullKey = this.keyPrefix + key
            const stored = localStorage.getItem(fullKey)

            if (stored) {
                const data = JSON.parse(stored)

                // Check TTL
                if (data.ttl > 0 && Date.now() - data.timestamp > data.ttl) {
                    localStorage.removeItem(fullKey)
                    return 0
                }

                return 1
            }

            // Check server if connected
            if (this.serverUrl && this.isConnected) {
                return await this.checkExistsOnServer(key)
            }

            return 0
        } catch (error) {
            this.stats.errors++
            console.error('Redis EXISTS error:', error)
            return 0
        }
    }

    async expire(key, seconds) {
        try {
            this.stats.operations++

            const fullKey = this.keyPrefix + key
            const stored = localStorage.getItem(fullKey)

            if (stored) {
                const data = JSON.parse(stored)
                data.ttl = seconds * 1000
                data.timestamp = Date.now()
                localStorage.setItem(fullKey, JSON.stringify(data))

                // Update cache store TTL
                const value = this.cache.get(key)
                if (value !== null) {
                    this.cache.set(key, value, data.ttl)
                }

                // Sync with server
                if (this.serverUrl && this.isConnected) {
                    await this.syncToServer('EXPIRE', key, { ttl: seconds })
                }

                return 1
            }

            return 0
        } catch (error) {
            this.stats.errors++
            console.error('Redis EXPIRE error:', error)
            return 0
        }
    }

    async ttl(key) {
        try {
            this.stats.operations++

            const fullKey = this.keyPrefix + key
            const stored = localStorage.getItem(fullKey)

            if (stored) {
                const data = JSON.parse(stored)

                if (data.ttl === 0) {
                    return -1 // No expiration
                }

                const remaining = Math.max(0, data.ttl - (Date.now() - data.timestamp))
                if (remaining === 0) {
                    localStorage.removeItem(fullKey)
                    return -2 // Key doesn't exist
                }

                return Math.ceil(remaining / 1000) // Return seconds
            }

            return -2 // Key doesn't exist
        } catch (error) {
            this.stats.errors++
            console.error('Redis TTL error:', error)
            return -2
        }
    }

    async keys(pattern = '*') {
        try {
            this.stats.operations++

            const keys = []
            const regex = new RegExp(
                pattern.replace(/\*/g, '.*').replace(/\?/g, '.')
            )

            // Get from local storage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(this.keyPrefix)) {
                    const cleanKey = key.replace(this.keyPrefix, '')
                    if (regex.test(cleanKey)) {
                        keys.push(cleanKey)
                    }
                }
            }

            // Get from server if connected
            if (this.serverUrl && this.isConnected) {
                const serverKeys = await this.getKeysFromServer(pattern)
                keys.push(...serverKeys.filter(k => !keys.includes(k)))
            }

            return keys
        } catch (error) {
            this.stats.errors++
            console.error('Redis KEYS error:', error)
            return []
        }
    }

    async flushall() {
        try {
            this.stats.operations++

            // Clear local storage keys
            const keysToRemove = []
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i)
                if (key.startsWith(this.keyPrefix)) {
                    keysToRemove.push(key)
                }
            }

            keysToRemove.forEach(key => localStorage.removeItem(key))

            // Clear cache store
            this.cache.clearAll()

            // Sync with server
            if (this.serverUrl && this.isConnected) {
                await this.syncToServer('FLUSHALL')
            }

            return 'OK'
        } catch (error) {
            this.stats.errors++
            console.error('Redis FLUSHALL error:', error)
            return 'ERROR'
        }
    }

    // Hash operations
    async hset(hash, field, value) {
        try {
            this.stats.operations++

            const hashKey = this.keyPrefix + 'hash:' + hash
            let hashData = {}

            const stored = localStorage.getItem(hashKey)
            if (stored) {
                hashData = JSON.parse(stored)
            }

            hashData[field] = typeof value === 'string' ? value : JSON.stringify(value)

            localStorage.setItem(hashKey, JSON.stringify(hashData))

            // Sync with server
            if (this.serverUrl && this.isConnected) {
                await this.syncToServer('HSET', hash, { field, value })
            }

            return 1
        } catch (error) {
            this.stats.errors++
            console.error('Redis HSET error:', error)
            return 0
        }
    }

    async hget(hash, field) {
        try {
            this.stats.operations++

            const hashKey = this.keyPrefix + 'hash:' + hash
            const stored = localStorage.getItem(hashKey)

            if (stored) {
                const hashData = JSON.parse(stored)
                return hashData[field] || null
            }

            // Try server
            if (this.serverUrl && this.isConnected) {
                return await this.getHashFromServer(hash, field)
            }

            return null
        } catch (error) {
            this.stats.errors++
            console.error('Redis HGET error:', error)
            return null
        }
    }

    async hgetall(hash) {
        try {
            this.stats.operations++

            const hashKey = this.keyPrefix + 'hash:' + hash
            const stored = localStorage.getItem(hashKey)

            if (stored) {
                return JSON.parse(stored)
            }

            // Try server
            if (this.serverUrl && this.isConnected) {
                return await this.getAllHashFromServer(hash)
            }

            return {}
        } catch (error) {
            this.stats.errors++
            console.error('Redis HGETALL error:', error)
            return {}
        }
    }

    // List operations
    async lpush(list, ...values) {
        try {
            this.stats.operations++

            const listKey = this.keyPrefix + 'list:' + list
            let listData = []

            const stored = localStorage.getItem(listKey)
            if (stored) {
                listData = JSON.parse(stored)
            }

            // Add values to the beginning
            listData.unshift(...values)

            localStorage.setItem(listKey, JSON.stringify(listData))

            // Sync with server
            if (this.serverUrl && this.isConnected) {
                await this.syncToServer('LPUSH', list, { values })
            }

            return listData.length
        } catch (error) {
            this.stats.errors++
            console.error('Redis LPUSH error:', error)
            return 0
        }
    }

    async lrange(list, start, stop) {
        try {
            this.stats.operations++

            const listKey = this.keyPrefix + 'list:' + list
            const stored = localStorage.getItem(listKey)

            if (stored) {
                const listData = JSON.parse(stored)
                return listData.slice(start, stop === -1 ? undefined : stop + 1)
            }

            // Try server
            if (this.serverUrl && this.isConnected) {
                return await this.getRangeFromServer(list, start, stop)
            }

            return []
        } catch (error) {
            this.stats.errors++
            console.error('Redis LRANGE error:', error)
            return []
        }
    }

    // Pub/Sub operations
    async publish(channel, message) {
        try {
            this.stats.operations++

            // Send via WebSocket if connected
            if (this.pubsubSocket && this.pubsubSocket.readyState === WebSocket.OPEN) {
                this.pubsubSocket.send(JSON.stringify({
                    action: 'publish',
                    channel,
                    message
                }))
            } else {
                // Local pub/sub simulation
                this.handleLocalPublish(channel, message)
            }

            return 1
        } catch (error) {
            this.stats.errors++
            console.error('Redis PUBLISH error:', error)
            return 0
        }
    }

    subscribe(channel, callback) {
        if (!this.subscribers.has(channel)) {
            this.subscribers.set(channel, new Set())
        }

        this.subscribers.get(channel).add(callback)

        // Subscribe via WebSocket if connected
        if (this.pubsubSocket && this.pubsubSocket.readyState === WebSocket.OPEN) {
            this.pubsubSocket.send(JSON.stringify({
                action: 'subscribe',
                channel
            }))
        }

        // Return unsubscribe function
        return () => this.unsubscribe(channel, callback)
    }

    unsubscribe(channel, callback) {
        if (this.subscribers.has(channel)) {
            this.subscribers.get(channel).delete(callback)

            if (this.subscribers.get(channel).size === 0) {
                this.subscribers.delete(channel)

                // Unsubscribe via WebSocket
                if (this.pubsubSocket && this.pubsubSocket.readyState === WebSocket.OPEN) {
                    this.pubsubSocket.send(JSON.stringify({
                        action: 'unsubscribe',
                        channel
                    }))
                }
            }
        }
    }

    // Server sync methods
    async syncToServer(command, key, data = {}, options = {}) {
        if (!this.serverUrl || !this.isConnected) return

        try {
            await fetch(`${this.serverUrl}/command`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    command,
                    key,
                    data,
                    options
                })
            })
        } catch (error) {
            console.warn('Failed to sync to server:', error)
        }
    }

    async getFromServer(key) {
        if (!this.serverUrl || !this.isConnected) return null

        try {
            const response = await fetch(`${this.serverUrl}/get/${key}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                return data.value
            }
        } catch (error) {
            console.warn('Failed to get from server:', error)
        }

        return null
    }

    // Local pub/sub handling
    handleLocalPublish(channel, message) {
        if (this.subscribers.has(channel)) {
            this.subscribers.get(channel).forEach(callback => {
                try {
                    callback(message)
                } catch (error) {
                    console.error('Pub/sub callback error:', error)
                }
            })
        }
    }

    handlePubSubMessage(data) {
        if (data.action === 'message' && this.subscribers.has(data.channel)) {
            this.subscribers.get(data.channel).forEach(callback => {
                try {
                    callback(data.message)
                } catch (error) {
                    console.error('Pub/sub callback error:', error)
                }
            })
        }
    }

    // Statistics and monitoring
    getStats() {
        return {
            ...this.stats,
            connected: this.isConnected,
            serverUrl: this.serverUrl ? 'configured' : 'not configured',
            subscribers: this.subscribers.size,
            cacheSize: this.cache.cacheInfo.localItems
        }
    }

    resetStats() {
        this.stats = {
            operations: 0,
            hits: 0,
            misses: 0,
            sets: 0,
            gets: 0,
            deletes: 0,
            errors: 0
        }
    }

    // Cleanup
    disconnect() {
        if (this.pubsubSocket) {
            this.pubsubSocket.close()
            this.pubsubSocket = null
        }

        this.isConnected = false
        this.subscribers.clear()
    }
}

// Create singleton instance
const redisClient = new RedisBrowserClient()

// Vue plugin installation
export default {
    install(app) {
        // Provide Redis client globally
        app.config.globalProperties.$redis = redisClient
        app.provide('redis', redisClient)
    }
}

// Export client for direct use
export { redisClient }