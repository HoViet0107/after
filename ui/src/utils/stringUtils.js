// String manipulation utilities with performance optimization and internationalization

/**
 * Truncate string with ellipsis
 * @param {string} str - String need to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix (default '...')
 * @returns {string} Truncated string
 */
export const truncate = (str, length = 100, suffix = '...') => {
    if (!str || typeof str !== 'string') return ''
    if (str.length <= length) return str
    return str.substring(0, length - suffix.length) + suffix
}

/**
 * Truncate by word (word-safe truncation)
 * @param {string} str - String need to truncate
 * @param {number} length - Maximum length
 * @param {string} suffix - Suffix (default '...')
 * @returns {string} Truncated string
 */
export const truncateWords = (str, length = 100, suffix = '...') => {
    if (!str || typeof str !== 'string') return ''
    if (str.length <= length) return str
    
    const truncated = str.substring(0, length - suffix.length)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    
    if (lastSpaceIndex > 0) {
        return truncated.substring(0, lastSpaceIndex) + suffix
    }
    
    return truncated + suffix
}

/**
 * Capitalize first letter
 * @param {string} str - String need to capitalize
 * @returns {string} String capitalized
 */
export const capitalize = (str) => {
    if (!str || typeof str !== 'string') return ''
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * Capitalize first letter of each word (title case) (e.g john doe -> John Doe)
 * @param {string} str - String need to title case
 * @returns {string} String title cased
 */
export const titleCaseCapitalize = (str) => {
    if (!str || typeof str !== 'string') return ''
    return str.replace(/\w\S*/g, (txt) => 
        txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    )
}

/**
 * Convert to kebab-case (e.g Nguyễn! Văn A -> nguyễn!-văn-a)
 * @param {string} str - String need to convert
 * @returns {string} kebab-case string
 */
export const kebabCase = (str) => {
    if (!str || typeof str !== 'string') return ''
    return str
        .replace(/([a-z])([A-Z])/g, '$1-$2')
        .replace(/\s+/g, '-')
        .toLowerCase()
}

/**
 * Convert to snake_case (e.g Nguyễn Văn A -> nguyễn_văn_a)
 * @param {string} str - String need to convert
 * @returns {string} snake_case string
 */
export const snakeCase = (str) => {
    if (!str || typeof str !== 'string') return ''
    return str
        .replace(/([a-z])([A-Z])/g, '$1_$2')
        .replace(/\s+/g, '_')
        .toLowerCase()
}

/**
 * Generate slug from string (e.g Nguyễn Văn A -> nguyen-van-a)
 * @param {string} str - String need to slugify
 * @param {string} separator - Separator (default '-')
 * @returns {string} Slug string
 */
export const slugify = (str, separator = '-') => {
    if (!str || typeof str !== 'string') return ''
    
    return str
        .toLowerCase()
        .trim()
        // Remove Vietnamese diacritics
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        // Replace special characters
        .replace(/[^\w\s-]/g, '')
        // Replace whitespace and multiple separators with single separator
        .replace(/[\s_-]+/g, separator)
        // Remove leading/trailing separators
        .replace(new RegExp(`^${separator}+|${separator}+$`, 'g'), '')
}

/**
 * Extract mentions from text (@username)
 * @param {string} text - Text need to extract mentions. 
 * e.g "Cảm ơn @viet_dev và @ho.quynh đã hỗ trợ!"
 * 
 * @returns {Array} Array of mentions. 
 * e.g [{ username: 'viet_dev', startIndex: 6, endIndex: 14, fullMatch: '@viet_dev' }, { username: 'ho.quynh', startIndex: 16, endIndex: 24, fullMatch: '@ho.quynh' }]
 */
export const extractMentions = (text) => {
    if (!text || typeof text !== 'string') return []
    
    const mentionRegex = /@([a-zA-Z0-9._-]+)/g
    const mentions = []
    let match
    
    while ((match = mentionRegex.exec(text)) !== null) {
        mentions.push({
            username: match[1],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            fullMatch: match[0]
        })
    }
    
    return mentions
}

/**
 * Extract hashtags from text (#hashtag)
 * @param {string} text - Text need to extract hashtags
 * @returns {Array} Array of hashtags
 */
export const extractHashtags = (text) => {
    if (!text || typeof text !== 'string') return []
    
    const hashtagRegex = /#([a-zA-Z0-9_]+)/g
    const hashtags = []
    let match
    
    while ((match = hashtagRegex.exec(text)) !== null) {
        hashtags.push({
            tag: match[1],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            fullMatch: match[0]
        })
    }
    
    return hashtags
}

/**
 * Extract URLs from text
 * @param {string} text - Text need to extract URLs
 * @returns {Array} Array of URLs
 */
export const extractUrls = (text) => {
    if (!text || typeof text !== 'string') return []
    
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const urls = []
    let match
    
    while ((match = urlRegex.exec(text)) !== null) {
        urls.push({
            url: match[1],
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            fullMatch: match[0]
        })
    }
    
    return urls
}

/**
 * Escape HTML characters
 * @param {string} str - String need to escape
 * @returns {string} Escaped string
 */
export const escapeHtml = (str) => {
    if (!str || typeof str !== 'string') return ''
    
    const htmlEscapes = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;'
    }
    
    return str.replace(/[&<>"'/]/g, (match) => htmlEscapes[match])
}

/**
 * Unescape HTML characters
 * @param {string} str - String need to unescape
 * @returns {string} Unescaped string
 */
export const unescapeHtml = (str) => {
    if (!str || typeof str !== 'string') return ''
    
    const htmlUnescapes = {
        '&amp;': '&',
        '&lt;': '<',
        '&gt;': '>',
        '&quot;': '"',
        '&#x27;': "'",
        '&#x2F;': '/'
    }
    
    return str.replace(/&(amp|lt|gt|quot|#x27|#x2F);/g, (match) => htmlUnescapes[match])
}

/**
 * Generate random string
 * @param {number} length - String length
 * @param {string} charset - Character set used
 * @returns {string} Random string
 */
export const randomString = (length = 8, charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') => {
    let result = ''
    for (let i = 0; i < length; i++) {
        result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return result
}

/**
 * Generate UUID v4
 * @returns {string} UUID v4 string
 */
export const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0
        const v = c == 'x' ? r : (r & 0x3 | 0x8)
        return v.toString(16)
    })
}

/**
 * Format file size
 * @param {number} bytes - Size in bytes
 * @param {number} decimals - Số decimal places
 * @returns {string} Formatted size string
 */
export const formatFileSize = (bytes, decimals = 2) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}

/**
 * Format number with commas
 * @param {number} num - Number need to format
 * @param {string} locale - Locale (default 'vi-VN')
 * @returns {string} Formatted number string
 */
export const formatNumber = (num, locale = 'vi-VN') => {
    if (typeof num !== 'number') return '0'
    return new Intl.NumberFormat(locale).format(num)
}

/**
 * Parse query string to object
 * @param {string} queryString - Query string
 * @returns {Object} Parsed query object
 */
export const parseQueryString = (queryString) => {
    if (!queryString) return {}
    
    const params = new URLSearchParams(queryString.startsWith('?') ? queryString.slice(1) : queryString)
    const result = {}
    
    for (const [key, value] of params) {
        if (result[key]) {
            // Handle multiple values for same key
            if (Array.isArray(result[key])) {
                result[key].push(value)
            } else {
                result[key] = [result[key], value]
            }
        } else {
            result[key] = value
        }
    }
    
    return result
}

/**
 * Convert object to query string
 * @param {Object} obj - Object need to convert
 * @returns {string} Query string
 */
export const objectToQueryString = (obj) => {
    if (!obj || typeof obj !== 'object') return ''
    
    const params = new URLSearchParams()
    
    for (const [key, value] of Object.entries(obj)) {
        if (value !== null && value !== undefined) {
            if (Array.isArray(value)) {
                value.forEach(v => params.append(key, v))
            } else {
                params.append(key, value)
            }
        }
    }
    
    return params.toString()
}

/**
 * Validate email format
 * @param {string} email - Email need to validate
 * @returns {boolean} True if valid email
 */
export const isValidEmail = (email) => {
    if (!email || typeof email !== 'string') return false
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

/**
 * Validate URL format
 * @param {string} url - URL need to validate
 * @returns {boolean} True if valid URL
 */
export const isValidUrl = (url) => {
    if (!url || typeof url !== 'string') return false
    
    try {
        new URL(url)
        return true
    } catch {
        return false
    }
}

/**
 * Mask sensitive information
 * @param {string} str - String need to mask
 * @param {number} visibleStart - Number of visible characters at the start
 * @param {number} visibleEnd - Number of visible characters at the end
 * @param {string} maskChar - Mask character
 * @returns {string} Masked string
 */
export const maskString = (str, visibleStart = 3, visibleEnd = 3, maskChar = '*') => {
    if (!str || typeof str !== 'string') return ''
    if (str.length <= visibleStart + visibleEnd) return str
    
    const start = str.substring(0, visibleStart)
    const end = str.substring(str.length - visibleEnd)
    const middle = maskChar.repeat(str.length - visibleStart - visibleEnd)
    
    return start + middle + end
}

/**
 * Remove Vietnamese diacritics
 * @param {string} str - String need to remove diacritics
 * @returns {string} String without diacritics
 */
export const removeDiacritics = (str) => {
    if (!str || typeof str !== 'string') return ''
    
    return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
}

/**
 * Highlight search terms in text
 * @param {string} text - Text need to highlight
 * @param {string} searchTerm - Search term
 * @param {string} highlightClass - CSS class for highlight
 * @returns {string} HTML string with highlight
 */
export const highlightSearchTerm = (text, searchTerm, highlightClass = 'highlight') => {
    if (!text || !searchTerm) return text
    
    const regex = new RegExp(`(${escapeRegExp(searchTerm)})`, 'gi')
    return text.replace(regex, `<span class="${highlightClass}">$1</span>`)
}

/**
 * Escape special regex characters
 * @param {string} str - String need to escape
 * @returns {string} Escaped string
 */
export const escapeRegExp = (str) => {
    if (!str || typeof str !== 'string') return ''
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Check if string is empty or whitespace only
 * @param {string} str - String need to check
 * @returns {boolean} True if empty or whitespace
 */
export const isEmpty = (str) => {
    return !str || typeof str !== 'string' || str.trim().length === 0
}

/**
 * Count words in string
 * @param {string} str - String need to count
 * @returns {number} Word count
 */
export const wordCount = (str) => {
    if (!str || typeof str !== 'string') return 0
    return str.trim().split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Estimate reading time
 * @param {string} text - Text need to estimate
 * @param {number} wordsPerMinute - Words per minute (default 200)
 * @returns {number} Reading time in minutes
 */
export const estimateReadingTime = (text, wordsPerMinute = 200) => {
    const words = wordCount(text)
    return Math.ceil(words / wordsPerMinute)
}