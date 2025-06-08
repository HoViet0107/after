// Utility helper functions với performance optimization và error handling

import { REGEX_PATTERNS, DATE_CONFIG, UI_CONFIG } from './constants'

// Debounce function for performance optimization
export function debounce(func, wait, immediate = false) {
    let timeout

    return function executedFunction(...args) {
        const later = () => {
            timeout = null
            if (!immediate) func.apply(this, args)
        }

        const callNow = immediate && !timeout
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)

        if (callNow) func.apply(this, args)
    }
}

// Throttle function for performance optimization
export function throttle(func, limit) {
    let inThrottle

    return function executedFunction(...args) {
        if (!inThrottle) {
            func.apply(this, args)
            inThrottle = true
            setTimeout(() => inThrottle = false, limit)
        }
    }
}

// Deep clone function
export function deepClone(obj) {
    if (obj === null || typeof obj !== 'object') return obj
    if (obj instanceof Date) return new Date(obj.getTime())
    if (obj instanceof Array) return obj.map(item => deepClone(item))
    if (obj instanceof Set) return new Set([...obj].map(item => deepClone(item)))
    if (obj instanceof Map) return new Map([...obj].map(([key, val]) => [key, deepClone(val)]))
    if (typeof obj === 'object') {
        const clonedObj = {}
        Object.keys(obj).forEach(key => {
            clonedObj[key] = deepClone(obj[key])
        })
        return clonedObj
    }
    return obj
}

// Shallow clone function (faster for simple objects)
export function shallowClone(obj) {
    if (Array.isArray(obj)) return [...obj]
    if (obj && typeof obj === 'object') return { ...obj }
    return obj
}

// Object comparison
export function isEqual(a, b) {
    if (a === b) return true
    if (a == null || b == null) return false
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false
        return a.every((val, index) => isEqual(val, b[index]))
    }
    if (typeof a === 'object' && typeof b === 'object') {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        if (keysA.length !== keysB.length) return false
        return keysA.every(key => isEqual(a[key], b[key]))
    }
    return false
}

// String utilities
export function capitalize(str) {
    if (!str || typeof str !== 'string') return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

export function capitalizeWords(str) {
    if (!str || typeof str !== 'string') return ''
    return str.split(' ').map(word => capitalize(word)).join(' ')
}

export function camelCase(str) {
    if (!str || typeof str !== 'string') return ''
    return str
        .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
            index === 0 ? word.toLowerCase() : word.toUpperCase()
        )
        .replace(/\s+/g, '')
}

export function kebabCase(str) {
    if (!str || typeof str !== 'string') return ''
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase()
}

export function snakeCase(str) {
    if (!str || typeof str !== 'string') return ''
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase()
}

export function truncate(str, length = 100, suffix = '...') {
    if (!str || typeof str !== 'string') return ''
    if (str.length <= length) return str
    return str.slice(0, length - suffix.length) + suffix
}

export function slugify(str) {
    if (!str || typeof str !== 'string') return ''
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

// Generate random string
export function generateRandomString(length = 10, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
    let result = ''
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return result
}

// Generate UUID
export function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        const r = Math.random() * 16 | 0
        const v = c === 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

// Number utilities
export function formatNumber(num, locale = 'vi-VN') {
    if (typeof num !== 'number' || isNaN(num)) return '0'
    return new Intl.NumberFormat(locale).format(num)
}

export function formatCurrency(amount, currency = 'VND', locale = 'vi-VN') {
    if (typeof amount !== 'number' || isNaN(amount)) return '0'
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency
    }).format(amount)
}

export function formatFileSize(bytes, decimals = 2) {
    if (bytes === 0) return '0 B'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

export function formatCompactNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0'

    const suffixes = ['', 'K', 'M', 'B', 'T']
    const magnitude = Math.floor(Math.log10(Math.abs(num)) / 3)
    const scaledNum = num / Math.pow(1000, magnitude)

    if (magnitude === 0) return num.toString()

    const formatted = scaledNum % 1 === 0 ? scaledNum.toFixed(0) : scaledNum.toFixed(1)
    return formatted + suffixes[magnitude]
}

export function clamp(num, min, max) {
    return Math.min(Math.max(num, min), max)
}

export function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

export function roundToDecimal(num, decimals = 2) {
    return Number(Math.round(num + 'e' + decimals) + 'e-' + decimals)
}

// Array utilities
export function chunk(array, size) {
    if (!Array.isArray(array)) return []
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
        chunks.push(array.slice(i, i + size))
    }
    return chunks
}

export function unique(array, key = null) {
    if (!Array.isArray(array)) return []

    if (key) {
        const seen = new Set()
        return array.filter(item => {
            const value = item[key]
            if (seen.has(value)) return false
            seen.add(value)
            return true
        })
    }

    return [...new Set(array)]
}

export function shuffle(array) {
    if (!Array.isArray(array)) return []
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}

export function groupBy(array, key) {
    if (!Array.isArray(array)) return {}

    return array.reduce((groups, item) => {
        const group = typeof key === 'function' ? key(item) : item[key]
        groups[group] = groups[group] || []
        groups[group].push(item)
        return groups
    }, {})
}

export function sortBy(array, key, direction = 'asc') {
    if (!Array.isArray(array)) return []

    return [...array].sort((a, b) => {
        const aVal = typeof key === 'function' ? key(a) : a[key]
        const bVal = typeof key === 'function' ? key(b) : b[key]

        if (aVal < bVal) return direction === 'asc' ? -1 : 1
        if (aVal > bVal) return direction === 'asc' ? 1 : -1
        return 0
    })
}

export function findIndex(array, predicate) {
    if (!Array.isArray(array)) return -1
    return array.findIndex(predicate)
}

export function remove(array, predicate) {
    if (!Array.isArray(array)) return []
    return array.filter(item => !predicate(item))
}

// Object utilities
export function pick(obj, keys) {
    if (!obj || typeof obj !== 'object') return {}

    const picked = {}
    keys.forEach(key => {
        if (key in obj) {
            picked[key] = obj[key]
        }
    })
    return picked
}

export function omit(obj, keys) {
    if (!obj || typeof obj !== 'object') return {}

    const omitted = { ...obj }
    keys.forEach(key => {
        delete omitted[key]
    })
    return omitted
}

export function isEmpty(value) {
    if (value == null) return true
    if (Array.isArray(value) || typeof value === 'string') return value.length === 0
    if (value instanceof Map || value instanceof Set) return value.size === 0
    if (typeof value === 'object') return Object.keys(value).length === 0
    return false
}

export function get(obj, path, defaultValue = undefined) {
    if (!obj || typeof obj !== 'object') return defaultValue

    const keys = Array.isArray(path) ? path : path.split('.')
    let result = obj

    for (const key of keys) {
        if (result == null || !(key in result)) {
            return defaultValue
        }
        result = result[key]
    }

    return result
}

export function set(obj, path, value) {
    if (!obj || typeof obj !== 'object') return obj

    const keys = Array.isArray(path) ? path : path.split('.')
    let current = obj

    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i]
        if (!(key in current) || typeof current[key] !== 'object') {
            current[key] = {}
        }
        current = current[key]
    }

    current[keys[keys.length - 1]] = value
    return obj
}

// Date utilities
export function formatDate(date, format = DATE_CONFIG.FORMATS.DATE, locale = DATE_CONFIG.DEFAULT_LOCALE) {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    // Basic format implementation (you might want to use a library like date-fns)
    if (format === DATE_CONFIG.FORMATS.RELATIVE) {
        return formatRelativeTime(d)
    }

    return d.toLocaleDateString(locale)
}

export function formatRelativeTime(date) {
    if (!date) return ''

    const now = new Date()
    const diffMs = now - new Date(date)
    const diffSeconds = Math.floor(diffMs / 1000)
    const diffMinutes = Math.floor(diffSeconds / 60)
    const diffHours = Math.floor(diffMinutes / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffSeconds < 60) return 'Vừa xong'
    if (diffMinutes < 60) return `${diffMinutes} phút trước`
    if (diffHours < 24) return `${diffHours} giờ trước`
    if (diffDays < 7) return `${diffDays} ngày trước`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} tuần trước`
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`
    return `${Math.floor(diffDays / 365)} năm trước`
}

export function isValidDate(date) {
    return date instanceof Date && !isNaN(date.getTime())
}

export function addDays(date, days) {
    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

export function isSameDay(date1, date2) {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
}

// URL utilities
export function buildUrl(base, path = '', params = {}) {
    let url = base

    if (path) {
        url += path.startsWith('/') ? path : '/' + path
    }

    const queryString = new URLSearchParams(params).toString()
    if (queryString) {
        url += (url.includes('?') ? '&' : '?') + queryString
    }

    return url
}

export function parseUrl(url) {
    try {
        const parsed = new URL(url)
        return {
            protocol: parsed.protocol,
            host: parsed.host,
            hostname: parsed.hostname,
            port: parsed.port,
            pathname: parsed.pathname,
            search: parsed.search,
            hash: parsed.hash,
            params: Object.fromEntries(parsed.searchParams)
        }
    } catch (error) {
        return null
    }
}

export function isValidUrl(string) {
    try {
        new URL(string)
        return true
    } catch {
        return false
    }
}

// Validation utilities
export function isEmail(email) {
    return REGEX_PATTERNS.EMAIL.test(email)
}

export function isPhone(phone) {
    return REGEX_PATTERNS.PHONE.test(phone)
}

export function isUsername(username) {
    return REGEX_PATTERNS.USERNAME.test(username)
}

export function isStrongPassword(password) {
    return REGEX_PATTERNS.PASSWORD.test(password)
}

export function isUUID(str) {
    return REGEX_PATTERNS.UUID.test(str)
}

// Content utilities
export function extractHashtags(text) {
    if (!text || typeof text !== 'string') return []
    const matches = text.match(REGEX_PATTERNS.HASHTAG)
    return matches ? matches.map(tag => tag.substring(1)) : []
}

export function extractMentions(text) {
    if (!text || typeof text !== 'string') return []
    const matches = text.match(REGEX_PATTERNS.MENTION)
    return matches ? matches.map(mention => mention.substring(1)) : []
}

export function linkify(text) {
    if (!text || typeof text !== 'string') return text

    return text.replace(REGEX_PATTERNS.URL, (url) => {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    })
}

export function sanitizeHtml(html) {
    if (!html || typeof html !== 'string') return ''

    const div = document.createElement('div')
    div.textContent = html
    return div.innerHTML
}

export function stripHtml(html) {
    if (!html || typeof html !== 'string') return ''

    const div = document.createElement('div')
    div.innerHTML = html
    return div.textContent || div.innerText || ''
}

// Storage utilities
export function getStorageItem(key, defaultValue = null, storage = localStorage) {
    try {
        const item = storage.getItem(key)
        return item ? JSON.parse(item) : defaultValue
    } catch (error) {
        console.warn(`Error reading from storage: ${key}`, error)
        return defaultValue
    }
}

export function setStorageItem(key, value, storage = localStorage) {
    try {
        storage.setItem(key, JSON.stringify(value))
        return true
    } catch (error) {
        console.warn(`Error writing to storage: ${key}`, error)
        return false
    }
}

export function removeStorageItem(key, storage = localStorage) {
    try {
        storage.removeItem(key)
        return true
    } catch (error) {
        console.warn(`Error removing from storage: ${key}`, error)
        return false
    }
}

export function clearStorage(prefix = '', storage = localStorage) {
    try {
        if (prefix) {
            Object.keys(storage).forEach(key => {
                if (key.startsWith(prefix)) {
                    storage.removeItem(key)
                }
            })
        } else {
            storage.clear()
        }
        return true
    } catch (error) {
        console.warn('Error clearing storage', error)
        return false
    }
}

// Device utilities
export function getDeviceType() {
    const width = window.innerWidth
    const { BREAKPOINTS } = UI_CONFIG

    if (width < BREAKPOINTS.SM) return 'mobile'
    if (width < BREAKPOINTS.LG) return 'tablet'
    return 'desktop'
}

export function isMobile() {
    return getDeviceType() === 'mobile'
}

export function isTablet() {
    return getDeviceType() === 'tablet'
}

export function isDesktop() {
    return getDeviceType() === 'desktop'
}

export function isTouchDevice() {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

export function getDeviceInfo() {
    return {
        type: getDeviceType(),
        isMobile: isMobile(),
        isTablet: isTablet(),
        isDesktop: isDesktop(),
        isTouchDevice: isTouchDevice(),
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine,
        screenWidth: screen.width,
        screenHeight: screen.height,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight
    }
}

// Performance utilities
export function measurePerformance(fn, label = 'Performance') {
    return async function (...args) {
        const start = performance.now()
        const result = await fn.apply(this, args)
        const end = performance.now()
        console.log(`${label}: ${(end - start).toFixed(2)}ms`)
        return result
    }
}

export function createLazyFunction(factory) {
    let fn = null
    return function (...args) {
        if (!fn) {
            fn = factory()
        }
        return fn.apply(this, args)
    }
}

export function memoize(fn, keyGenerator = (...args) => JSON.stringify(args)) {
    const cache = new Map()

    return function (...args) {
        const key = keyGenerator(...args)

        if (cache.has(key)) {
            return cache.get(key)
        }

        const result = fn.apply(this, args)
        cache.set(key, result)
        return result
    }
}

// Error handling utilities
export function safeJsonParse(str, defaultValue = null) {
    try {
        return JSON.parse(str)
    } catch {
        return defaultValue
    }
}

export function safeJsonStringify(obj, defaultValue = '{}') {
    try {
        return JSON.stringify(obj)
    } catch {
        return defaultValue
    }
}

export function createSafeFunction(fn, fallback = () => { }) {
    return function (...args) {
        try {
            return fn.apply(this, args)
        } catch (error) {
            console.error('Safe function error:', error)
            return fallback.apply(this, args)
        }
    }
}

// Promise utilities
export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export function timeout(promise, ms) {
    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
    )

    return Promise.race([promise, timeoutPromise])
}

export function retry(fn, attempts = 3, delay = 1000) {
    return async function (...args) {
        let lastError

        for (let i = 0; i < attempts; i++) {
            try {
                return await fn.apply(this, args)
            } catch (error) {
                lastError = error
                if (i < attempts - 1) {
                    await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
                }
            }
        }

        throw lastError
    }
}

// Export all utilities as default object
export default {
    // Function utilities
    debounce,
    throttle,
    memoize,
    measurePerformance,
    createLazyFunction,
    createSafeFunction,
    retry,
    delay,
    timeout,

    // Object utilities
    deepClone,
    shallowClone,
    isEqual,
    pick,
    omit,
    isEmpty,
    get,
    set,

    // String utilities
    capitalize,
    capitalizeWords,
    camelCase,
    kebabCase,
    snakeCase,
    truncate,
    slugify,
    generateRandomString,
    generateUUID,

    // Number utilities
    formatNumber,
    formatCurrency,
    formatFileSize,
    formatCompactNumber,
    clamp,
    randomInt,
    roundToDecimal,

    // Array utilities
    chunk,
    unique,
    shuffle,
    groupBy,
    sortBy,
    findIndex,
    remove,

    // Date utilities
    formatDate,
    formatRelativeTime,
    isValidDate,
    addDays,
    isSameDay,

    // URL utilities
    buildUrl,
    parseUrl,
    isValidUrl,

    // Validation utilities
    isEmail,
    isPhone,
    isUsername,
    isStrongPassword,
    isUUID,

    // Content utilities
    extractHashtags,
    extractMentions,
    linkify,
    sanitizeHtml,
    stripHtml,

    // Storage utilities
    getStorageItem,
    setStorageItem,
    removeStorageItem,
    clearStorage,

    // Device utilities
    getDeviceType,
    isMobile,
    isTablet,
    isDesktop,
    isTouchDevice,
    getDeviceInfo,

    // Error handling utilities
    safeJsonParse,
    safeJsonStringify
}