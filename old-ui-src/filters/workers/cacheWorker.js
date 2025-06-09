// Web Worker cho cache management với LRU, compression và persistence

// Check if running in worker context
const isWorker = typeof importScripts === 'function'

class CacheManager {
    constructor() {
        this.config = {
            // Cache limits
            maxMemorySize: 50 * 1024 * 1024, // 50MB
            maxEntries: 10000,
            defaultTTL: 24 * 60 * 60 * 1000, // 24 hours
            
            // Storage options
            enablePersistence: true,
            persistenceKey: 'app_cache_v1',
            enableCompression: true,
            compressionThreshold: 1024, // bytes
            
            // Cleanup settings
            cleanupInterval: 5 * 60 * 1000, // 5 minutes
            maxCleanupTime: 1000, // 1 second
            evictionBatchSize: 100,
            
            // Performance settings
            enableStats: true,
            enableMetrics: true,
            metricsInterval: 60 * 1000, // 1 minute
            
            // Cache strategies
            defaultStrategy: 'lru',
            strategies: ['lru', 'lfu', 'fifo', 'ttl'],
            
            // Namespace settings
            enableNamespaces: true,
            maxNamespaces: 100
        }

        this.init()
    }

    init() {
        // Initialize storage structures
        this.cache = new Map()
        this.accessTimes = new Map()
        this.accessCounts = new Map()
        this.insertionOrder = new Map()
        this.namespaces = new Map()
        
        // Metrics tracking
        this.metrics = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0,
            evictions: 0,
            compressions: 0,
            decompressions: 0,
            persistenceWrites: 0,
            persistenceReads: 0,
            errors: 0,
            
            // Performance metrics
            totalResponseTime: 0,
            operations: 0,
            
            // Memory metrics
            currentSize: 0,
            peakSize: 0,
            
            // Timestamps
            startTime: Date.now(),
            lastCleanup: Date.now(),
            lastMetricsReset: Date.now()
        }

        // Cleanup tracking
        this.insertionCounter = 0
        this.isCleaningUp = false

        // Start background tasks
        this.startCleanupTimer()
        this.startMetricsTimer()
        
        // Load persisted cache
        if (this.config.enablePersistence) {
            this.loadFromPersistence()
        }

        this.log('CacheManager initialized')
    }

    // Core cache operations
    async get(key, options = {}) {
        const startTime = Date.now()
        const namespace = options.namespace || 'default'
        const fullKey = this.getFullKey(namespace, key)

        try {
            const entry = this.cache.get(fullKey)
            
            if (!entry) {
                this.metrics.misses++
                this.recordResponseTime(startTime)
                return null
            }

            // Check TTL
            if (this.isExpired(entry)) {
                this.delete(key, { namespace })
                this.metrics.misses++
                this.recordResponseTime(startTime)
                return null
            }

            // Update access tracking
            this.updateAccessTracking(fullKey)
            
            // Decompress if needed
            let value = entry.value
            if (entry.compressed) {
                value = await this.decompress(value)
                this.metrics.decompressions++
            }

            this.metrics.hits++
            this.recordResponseTime(startTime)
            
            return {
                value,
                metadata: entry.metadata,
                createdAt: entry.createdAt,
                accessedAt: entry.accessedAt,
                expiresAt: entry.expiresAt
            }

        } catch (error) {
            this.metrics.errors++
            this.log('Cache get error:', error)
            this.recordResponseTime(startTime)
            return null
        }
    }

    async set(key, value, options = {}) {
        const startTime = Date.now()
        const namespace = options.namespace || 'default'
        const fullKey = this.getFullKey(namespace, key)
        const ttl = options.ttl || this.config.defaultTTL
        const strategy = options.strategy || this.config.defaultStrategy

        try {
            // Prepare entry
            const entry = {
                key: fullKey,
                value,
                metadata: options.metadata || {},
                strategy,
                compressed: false,
                size: this.calculateSize(value),
                createdAt: Date.now(),
                accessedAt: Date.now(),
                expiresAt: Date.now() + ttl
            }

            // Compress if needed
            if (this.config.enableCompression && entry.size > this.config.compressionThreshold) {
                entry.value = await this.compress(value)
                entry.compressed = true
                entry.size = this.calculateSize(entry.value)
                this.metrics.compressions++
            }

            // Check if we need to evict
            if (this.needsEviction(entry.size)) {
                await this.evict(entry.size)
            }

            // Store entry
            this.cache.set(fullKey, entry)
            this.initializeAccessTracking(fullKey)
            
            // Update namespace tracking
            if (this.config.enableNamespaces) {
                this.updateNamespace(namespace, fullKey)
            }

            // Update metrics
            this.metrics.sets++
            this.metrics.currentSize += entry.size
            this.metrics.peakSize = Math.max(this.metrics.peakSize, this.metrics.currentSize)

            // Persist if enabled
            if (this.config.enablePersistence && options.persist !== false) {
                this.schedulePersistence()
            }

            this.recordResponseTime(startTime)
            return true

        } catch (error) {
            this.metrics.errors++
            this.log('Cache set error:', error)
            this.recordResponseTime(startTime)
            return false
        }
    }

    async delete(key, options = {}) {
        const startTime = Date.now()
        const namespace = options.namespace || 'default'
        const fullKey = this.getFullKey(namespace, key)

        try {
            const entry = this.cache.get(fullKey)
            if (!entry) {
                this.recordResponseTime(startTime)
                return false
            }

            // Remove from cache
            this.cache.delete(fullKey)
            this.accessTimes.delete(fullKey)
            this.accessCounts.delete(fullKey)
            this.insertionOrder.delete(fullKey)

            // Update metrics
            this.metrics.deletes++
            this.metrics.currentSize -= entry.size

            // Update namespace
            if (this.config.enableNamespaces) {
                this.removeFromNamespace(namespace, fullKey)
            }

            this.recordResponseTime(startTime)
            return true

        } catch (error) {
            this.metrics.errors++
            this.log('Cache delete error:', error)
            this.recordResponseTime(startTime)
            return false
        }
    }

    async clear(options = {}) {
        const startTime = Date.now()
        const namespace = options.namespace

        try {
            if (namespace && namespace !== 'default') {
                // Clear specific namespace
                const namespaceKeys = this.namespaces.get(namespace) || new Set()
                for (const key of namespaceKeys) {
                    await this.delete(this.getKeyFromFullKey(key), { namespace })
                }
                this.namespaces.delete(namespace)
            } else {
                // Clear all
                this.cache.clear()
                this.accessTimes.clear()
                this.accessCounts.clear()
                this.insertionOrder.clear()
                this.namespaces.clear()
                this.metrics.currentSize = 0
            }

            this.recordResponseTime(startTime)
            return true

        } catch (error) {
            this.metrics.errors++
            this.log('Cache clear error:', error)
            this.recordResponseTime(startTime)
            return false
        }
    }

    // Batch operations
    async getBatch(keys, options = {}) {
        const namespace = options.namespace || 'default'
        const results = new Map()

        const promises = keys.map(async key => {
            const result = await this.get(key, { namespace })
            return { key, result }
        })

        const batchResults = await Promise.all(promises)
        batchResults.forEach(({ key, result }) => {
            results.set(key, result)
        })

        return results
    }

    async setBatch(entries, options = {}) {
        const namespace = options.namespace || 'default'
        const results = new Map()

        const promises = entries.map(async ({ key, value, ...entryOptions }) => {
            const result = await this.set(key, value, { namespace, ...entryOptions })
            return { key, result }
        })

        const batchResults = await Promise.all(promises)
        batchResults.forEach(({ key, result }) => {
            results.set(key, result)
        })

        return results
    }

    async deleteBatch(keys, options = {}) {
        const namespace = options.namespace || 'default'
        const results = new Map()

        const promises = keys.map(async key => {
            const result = await this.delete(key, { namespace })
            return { key, result }
        })

        const batchResults = await Promise.all(promises)
        batchResults.forEach(({ key, result }) => {
            results.set(key, result)
        })

        return results
    }

    // Cache management
    async evict(requiredSize = 0) {
        if (this.isCleaningUp) return

        this.isCleaningUp = true
        const startTime = Date.now()

        try {
            const targetSize = this.metrics.currentSize - requiredSize
            const maxSize = this.config.maxMemorySize * 0.8 // Evict to 80% capacity
            const finalTargetSize = Math.min(targetSize, maxSize)

            let evicted = 0
            const entriesToEvict = this.selectEvictionCandidates(finalTargetSize)

            for (const fullKey of entriesToEvict) {
                const entry = this.cache.get(fullKey)
                if (entry) {
                    const namespace = this.getNamespaceFromFullKey(fullKey)
                    const key = this.getKeyFromFullKey(fullKey)
                    await this.delete(key, { namespace })
                    evicted++
                    
                    if (Date.now() - startTime > this.config.maxCleanupTime) {
                        break
                    }
                }
            }

            this.metrics.evictions += evicted
            this.log(`Evicted ${evicted} entries in ${Date.now() - startTime}ms`)

        } catch (error) {
            this.log('Eviction error:', error)
        } finally {
            this.isCleaningUp = false
        }
    }

    selectEvictionCandidates(targetSize) {
        const candidates = []
        const now = Date.now()

        // First pass: collect expired entries
        for (const [fullKey, entry] of this.cache) {
            if (this.isExpired(entry)) {
                candidates.push({ fullKey, priority: 0, expiredAt: entry.expiresAt })
            }
        }

        // Sort expired by expiration time (oldest first)
        candidates.sort((a, b) => a.expiredAt - b.expiredAt)

        // If we still need space, apply eviction strategy
        if (this.metrics.currentSize > targetSize && candidates.length < this.config.evictionBatchSize) {
            const activeEntries = []
            
            for (const [fullKey, entry] of this.cache) {
                if (!this.isExpired(entry)) {
                    const priority = this.calculateEvictionPriority(fullKey, entry)
                    activeEntries.push({ fullKey, priority })
                }
            }

            // Sort by eviction priority (highest priority = first to evict)
            activeEntries.sort((a, b) => b.priority - a.priority)
            
            // Add to candidates until we have enough
            const additionalNeeded = this.config.evictionBatchSize - candidates.length
            candidates.push(...activeEntries.slice(0, additionalNeeded))
        }

        return candidates.slice(0, this.config.evictionBatchSize).map(c => c.fullKey)
    }

    calculateEvictionPriority(fullKey, entry) {
        const now = Date.now()
        const age = now - entry.createdAt
        const timeSinceAccess = now - (this.accessTimes.get(fullKey) || entry.accessedAt)
        const accessCount = this.accessCounts.get(fullKey) || 0

        switch (entry.strategy) {
            case 'lru':
                return timeSinceAccess
            case 'lfu':
                return 1 / Math.max(accessCount, 1)
            case 'fifo':
                return age
            case 'ttl':
                return Math.max(0, entry.expiresAt - now)
            default:
                return timeSinceAccess
        }
    }

    // Utility methods
    needsEviction(additionalSize = 0) {
        return (this.metrics.currentSize + additionalSize > this.config.maxMemorySize) ||
               (this.cache.size >= this.config.maxEntries)
    }

    isExpired(entry) {
        return Date.now() > entry.expiresAt
    }

    getFullKey(namespace, key) {
        return namespace === 'default' ? key : `${namespace}:${key}`
    }

    getNamespaceFromFullKey(fullKey) {
        const colonIndex = fullKey.indexOf(':')
        return colonIndex === -1 ? 'default' : fullKey.substring(0, colonIndex)
    }

    getKeyFromFullKey(fullKey) {
        const colonIndex = fullKey.indexOf(':')
        return colonIndex === -1 ? fullKey : fullKey.substring(colonIndex + 1)
    }

    updateAccessTracking(fullKey) {
        this.accessTimes.set(fullKey, Date.now())
        this.accessCounts.set(fullKey, (this.accessCounts.get(fullKey) || 0) + 1)
    }

    initializeAccessTracking(fullKey) {
        const now = Date.now()
        this.accessTimes.set(fullKey, now)
        this.accessCounts.set(fullKey, 1)
        this.insertionOrder.set(fullKey, this.insertionCounter++)
    }

    updateNamespace(namespace, fullKey) {
        if (!this.namespaces.has(namespace)) {
            this.namespaces.set(namespace, new Set())
        }
        this.namespaces.get(namespace).add(fullKey)
    }

    removeFromNamespace(namespace, fullKey) {
        const namespaceKeys = this.namespaces.get(namespace)
        if (namespaceKeys) {
            namespaceKeys.delete(fullKey)
            if (namespaceKeys.size === 0) {
                this.namespaces.delete(namespace)
            }
        }
    }

    calculateSize(value) {
        if (typeof value === 'string') {
            return value.length * 2 // UTF-16
        }
        if (value instanceof ArrayBuffer) {
            return value.byteLength
        }
        if (ArrayBuffer.isView(value)) {
            return value.byteLength
        }
        // Estimate for objects
        return JSON.stringify(value).length * 2
    }

    // Compression methods
    async compress(data) {
        if (!this.supportsCompression()) {
            return data
        }

        try {
            const jsonString = JSON.stringify(data)
            const encoder = new TextEncoder()
            const input = encoder.encode(jsonString)
            
            const compressionStream = new CompressionStream('gzip')
            const writer = compressionStream.writable.getWriter()
            const reader = compressionStream.readable.getReader()
            
            writer.write(input)
            writer.close()
            
            const chunks = []
            let done = false
            
            while (!done) {
                const { value, done: readerDone } = await reader.read()
                done = readerDone
                if (value) {
                    chunks.push(value)
                }
            }
            
            const compressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
            let offset = 0
            for (const chunk of chunks) {
                compressed.set(chunk, offset)
                offset += chunk.length
            }
            
            return compressed
        } catch (error) {
            this.log('Compression error:', error)
            return data
        }
    }

    async decompress(compressedData) {
        if (!this.supportsCompression()) {
            return compressedData
        }

        try {
            const decompressionStream = new DecompressionStream('gzip')
            const writer = decompressionStream.writable.getWriter()
            const reader = decompressionStream.readable.getReader()
            
            writer.write(compressedData)
            writer.close()
            
            const chunks = []
            let done = false
            
            while (!done) {
                const { value, done: readerDone } = await reader.read()
                done = readerDone
                if (value) {
                    chunks.push(value)
                }
            }
            
            const decompressed = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0))
            let offset = 0
            for (const chunk of chunks) {
                decompressed.set(chunk, offset)
                offset += chunk.length
            }
            
            const decoder = new TextDecoder()
            const jsonString = decoder.decode(decompressed)
            return JSON.parse(jsonString)
        } catch (error) {
            this.log('Decompression error:', error)
            return compressedData
        }
    }

    supportsCompression() {
        return typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined'
    }

    // Persistence methods
    async loadFromPersistence() {
        try {
            if (typeof indexedDB === 'undefined') return

            // Simple localStorage fallback for demo
            const persistedData = localStorage.getItem(this.config.persistenceKey)
            if (persistedData) {
                const { cache, metadata } = JSON.parse(persistedData)
                
                for (const [fullKey, entry] of Object.entries(cache)) {
                    if (!this.isExpired(entry)) {
                        this.cache.set(fullKey, entry)
                        this.initializeAccessTracking(fullKey)
                        this.metrics.currentSize += entry.size
                        
                        // Update namespace
                        const namespace = this.getNamespaceFromFullKey(fullKey)
                        this.updateNamespace(namespace, fullKey)
                    }
                }
                
                this.metrics.persistenceReads++
                this.log(`Loaded ${this.cache.size} entries from persistence`)
            }
        } catch (error) {
            this.log('Persistence load error:', error)
        }
    }

    async saveToPersistence() {
        try {
            if (typeof localStorage === 'undefined') return

            const cacheData = {}
            for (const [fullKey, entry] of this.cache) {
                if (!this.isExpired(entry)) {
                    cacheData[fullKey] = entry
                }
            }

            const persistData = {
                cache: cacheData,
                metadata: {
                    version: 1,
                    timestamp: Date.now(),
                    entryCount: Object.keys(cacheData).length
                }
            }

            localStorage.setItem(this.config.persistenceKey, JSON.stringify(persistData))
            this.metrics.persistenceWrites++
            this.log(`Persisted ${Object.keys(cacheData).length} entries`)

        } catch (error) {
            this.log('Persistence save error:', error)
        }
    }

    schedulePersistence() {
        if (this.persistenceTimeout) {
            clearTimeout(this.persistenceTimeout)
        }

        this.persistenceTimeout = setTimeout(() => {
            this.saveToPersistence()
        }, 5000) // Batch persistence writes
    }

    // Background tasks
    startCleanupTimer() {
        setInterval(() => {
            this.cleanup()
        }, this.config.cleanupInterval)
    }

    startMetricsTimer() {
        if (!this.config.enableMetrics) return

        setInterval(() => {
            this.generateMetricsReport()
        }, this.config.metricsInterval)
    }

    async cleanup() {
        if (this.isCleaningUp) return

        const expiredKeys = []
        const now = Date.now()

        for (const [fullKey, entry] of this.cache) {
            if (this.isExpired(entry)) {
                expiredKeys.push(fullKey)
            }
        }

        for (const fullKey of expiredKeys) {
            const namespace = this.getNamespaceFromFullKey(fullKey)
            const key = this.getKeyFromFullKey(fullKey)
            await this.delete(key, { namespace })
        }

        this.metrics.lastCleanup = now
        
        if (expiredKeys.length > 0) {
            this.log(`Cleaned up ${expiredKeys.length} expired entries`)
        }
    }

    // Metrics and reporting
    generateMetricsReport() {
        const now = Date.now()
        const runtime = now - this.metrics.startTime
        const hitRate = this.metrics.hits / Math.max(this.metrics.hits + this.metrics.misses, 1)
        const avgResponseTime = this.metrics.totalResponseTime / Math.max(this.metrics.operations, 1)

        const report = {
            runtime,
            hitRate: Math.round(hitRate * 100) / 100,
            avgResponseTime: Math.round(avgResponseTime * 100) / 100,
            entries: this.cache.size,
            namespaces: this.namespaces.size,
            memoryUsage: this.metrics.currentSize,
            memoryUtilization: this.metrics.currentSize / this.config.maxMemorySize,
            operations: {
                hits: this.metrics.hits,
                misses: this.metrics.misses,
                sets: this.metrics.sets,
                deletes: this.metrics.deletes,
                evictions: this.metrics.evictions
            },
            compression: {
                compressions: this.metrics.compressions,
                decompressions: this.metrics.decompressions
            },
            persistence: {
                writes: this.metrics.persistenceWrites,
                reads: this.metrics.persistenceReads
            },
            errors: this.metrics.errors,
            timestamp: now
        }

        if (isWorker) {
            self.postMessage({
                type: 'metrics',
                data: report
            })
        } else {
            this.log('Metrics report:', report)
        }

        return report
    }

    recordResponseTime(startTime) {
        const responseTime = Date.now() - startTime
        this.metrics.totalResponseTime += responseTime
        this.metrics.operations++
    }

    getStats() {
        return {
            cache: {
                size: this.cache.size,
                memoryUsage: this.metrics.currentSize,
                hitRate: this.metrics.hits / Math.max(this.metrics.hits + this.metrics.misses, 1)
            },
            metrics: { ...this.metrics },
            config: { ...this.config }
        }
    }

    // Utility methods
    log(...args) {
        if (isWorker) {
            self.postMessage({
                type: 'log',
                data: args
            })
        } else {
            console.log('[CacheManager]', ...args)
        }
    }
}

// Worker message handling
if (isWorker) {
    const cacheManager = new CacheManager()

    self.onmessage = async function(e) {
        const { type, data, id } = e.data

        try {
            let result

            switch (type) {
                case 'get':
                    result = await cacheManager.get(data.key, data.options)
                    break

                case 'set':
                    result = await cacheManager.set(data.key, data.value, data.options)
                    break

                case 'delete':
                    result = await cacheManager.delete(data.key, data.options)
                    break

                case 'clear':
                    result = await cacheManager.clear(data.options)
                    break

                case 'getBatch':
                    result = await cacheManager.getBatch(data.keys, data.options)
                    break

                case 'setBatch':
                    result = await cacheManager.setBatch(data.entries, data.options)
                    break

                case 'deleteBatch':
                    result = await cacheManager.deleteBatch(data.keys, data.options)
                    break

                case 'evict':
                    result = await cacheManager.evict(data.requiredSize)
                    break

                case 'cleanup':
                    result = await cacheManager.cleanup()
                    break

                case 'getStats':
                    result = cacheManager.getStats()
                    break

                case 'configure':
                    cacheManager.config = { ...cacheManager.config, ...data.config }
                    result = { success: true }
                    break

                default:
                    throw new Error(`Unknown message type: ${type}`)
            }

            self.postMessage({
                type: 'result',
                id,
                data: result
            })

        } catch (error) {
            self.postMessage({
                type: 'error',
                id,
                error: error.message
            })
        }
    }

    // Send ready signal
    self.postMessage({ type: 'ready' })
}

// Export for non-worker usage
if (!isWorker && typeof module !== 'undefined' && module.exports) {
    module.exports = CacheManager
}

// Export for ES modules
if (!isWorker && typeof window !== 'undefined') {
    window.CacheManager = CacheManager
}