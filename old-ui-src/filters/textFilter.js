// Bộ lọc xử lý text formatting, truncation, highlight và validation
class TextProcessor {
    constructor() {
        this.config = {
            // Truncation settings
            defaultTruncateLength: 100,
            truncateSuffix: '...',
            
            // HTML settings
            allowedTags: ['b', 'i', 'u', 'strong', 'em', 'a', 'br', 'p'],
            allowedAttributes: {
                'a': ['href', 'title', 'target'],
                '*': ['class', 'id']
            },
            
            // Mention/hashtag patterns
            mentionPattern: /@([a-zA-Z0-9_]+)/g,
            hashtagPattern: /#([a-zA-Z0-9_]+)/g,
            urlPattern: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
            emailPattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            
            // Vietnamese specific
            vietnameseChars: 'àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ',
            
            // Text analysis
            readingSpeed: 200, // words per minute
            
            // Formatting options
            preserveLineBreaks: true,
            autoLink: true,
            highlightTerms: true
        }

        this.init()
    }

    init() {
        // Create regex patterns for better performance
        this.patterns = {
            mention: new RegExp(this.config.mentionPattern),
            hashtag: new RegExp(this.config.hashtagPattern),
            url: new RegExp(this.config.urlPattern),
            email: new RegExp(this.config.emailPattern),
            vietnamese: new RegExp(`[${this.config.vietnameseChars}${this.config.vietnameseChars.toUpperCase()}]`, 'g')
        }

        // HTML sanitizer
        this.htmlSanitizer = this.createHtmlSanitizer()
    }

    // Core text processing methods
    truncate(text, length = null, options = {}) {
        if (!text || typeof text !== 'string') return ''
        
        const maxLength = length || this.config.defaultTruncateLength
        const suffix = options.suffix || this.config.truncateSuffix
        const preserveWords = options.preserveWords !== false
        const stripHtml = options.stripHtml !== false

        let processedText = stripHtml ? this.stripHtml(text) : text
        
        if (processedText.length <= maxLength) {
            return processedText
        }

        if (preserveWords) {
            // Find last complete word within limit
            const truncated = processedText.substring(0, maxLength)
            const lastSpaceIndex = truncated.lastIndexOf(' ')
            
            if (lastSpaceIndex > 0 && lastSpaceIndex > maxLength * 0.8) {
                return truncated.substring(0, lastSpaceIndex) + suffix
            }
        }

        return processedText.substring(0, maxLength) + suffix
    }

    highlight(text, terms, options = {}) {
        if (!text || !terms) return text

        const className = options.className || 'highlight'
        const caseSensitive = options.caseSensitive || false
        const wholeWords = options.wholeWords || false

        const searchTerms = Array.isArray(terms) ? terms : [terms]
        let result = text

        searchTerms.forEach(term => {
            if (!term || term.trim() === '') return

            const flags = caseSensitive ? 'g' : 'gi'
            const pattern = wholeWords ? 
                new RegExp(`\\b(${this.escapeRegex(term)})\\b`, flags) :
                new RegExp(`(${this.escapeRegex(term)})`, flags)

            result = result.replace(pattern, `<span class="${className}">$1</span>`)
        })

        return result
    }

    stripHtml(text) {
        if (!text) return ''
        return text.replace(/<[^>]*>/g, '')
    }

    sanitizeHtml(html, options = {}) {
        if (!html) return ''
        
        const allowedTags = options.allowedTags || this.config.allowedTags
        const allowedAttributes = options.allowedAttributes || this.config.allowedAttributes

        return this.htmlSanitizer(html, allowedTags, allowedAttributes)
    }

    // Text transformation methods
    capitalize(text) {
        if (!text || typeof text !== 'string') return ''
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
    }

    titleCase(text) {
        if (!text || typeof text !== 'string') return ''
        
        return text.replace(/\w\S*/g, (txt) => {
            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        })
    }

    camelCase(text) {
        if (!text || typeof text !== 'string') return ''
        
        return text
            .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
                return index === 0 ? word.toLowerCase() : word.toUpperCase()
            })
            .replace(/\s+/g, '')
    }

    kebabCase(text) {
        if (!text || typeof text !== 'string') return ''
        
        return text
            .replace(/([a-z])([A-Z])/g, '$1-$2')
            .replace(/[\s_]+/g, '-')
            .toLowerCase()
    }

    snakeCase(text) {
        if (!text || typeof text !== 'string') return ''
        
        return text
            .replace(/([a-z])([A-Z])/g, '$1_$2')
            .replace(/[\s-]+/g, '_')
            .toLowerCase()
    }

    // Vietnamese text processing
    removeVietnameseAccents(text) {
        if (!text || typeof text !== 'string') return ''
        
        const accentsMap = {
            'à': 'a', 'á': 'a', 'ạ': 'a', 'ả': 'a', 'ã': 'a',
            'â': 'a', 'ầ': 'a', 'ấ': 'a', 'ậ': 'a', 'ẩ': 'a', 'ẫ': 'a',
            'ă': 'a', 'ằ': 'a', 'ắ': 'a', 'ặ': 'a', 'ẳ': 'a', 'ẵ': 'a',
            'è': 'e', 'é': 'e', 'ẹ': 'e', 'ẻ': 'e', 'ẽ': 'e',
            'ê': 'e', 'ề': 'e', 'ế': 'e', 'ệ': 'e', 'ể': 'e', 'ễ': 'e',
            'ì': 'i', 'í': 'i', 'ị': 'i', 'ỉ': 'i', 'ĩ': 'i',
            'ò': 'o', 'ó': 'o', 'ọ': 'o', 'ỏ': 'o', 'õ': 'o',
            'ô': 'o', 'ồ': 'o', 'ố': 'o', 'ộ': 'o', 'ổ': 'o', 'ỗ': 'o',
            'ơ': 'o', 'ờ': 'o', 'ớ': 'o', 'ợ': 'o', 'ở': 'o', 'ỡ': 'o',
            'ù': 'u', 'ú': 'u', 'ụ': 'u', 'ủ': 'u', 'ũ': 'u',
            'ư': 'u', 'ừ': 'u', 'ứ': 'u', 'ự': 'u', 'ử': 'u', 'ữ': 'u',
            'ỳ': 'y', 'ý': 'y', 'ỵ': 'y', 'ỷ': 'y', 'ỹ': 'y',
            'đ': 'd'
        }

        return text.replace(/./g, char => {
            const lowerChar = char.toLowerCase()
            const replacement = accentsMap[lowerChar]
            if (replacement) {
                return char === lowerChar ? replacement : replacement.toUpperCase()
            }
            return char
        })
    }

    vietnameseSlug(text) {
        if (!text || typeof text !== 'string') return ''
        
        return this.removeVietnameseAccents(text)
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
    }

    // Content analysis
    wordCount(text) {
        if (!text || typeof text !== 'string') return 0
        
        const cleanText = this.stripHtml(text).trim()
        if (cleanText === '') return 0
        
        return cleanText.split(/\s+/).length
    }

    characterCount(text, options = {}) {
        if (!text || typeof text !== 'string') return 0
        
        const includeSpaces = options.includeSpaces !== false
        const stripHtml = options.stripHtml !== false
        
        let processedText = stripHtml ? this.stripHtml(text) : text
        
        if (!includeSpaces) {
            processedText = processedText.replace(/\s/g, '')
        }
        
        return processedText.length
    }

    readingTime(text, options = {}) {
        if (!text || typeof text !== 'string') return 0
        
        const wordsPerMinute = options.wordsPerMinute || this.config.readingSpeed
        const words = this.wordCount(text)
        
        const minutes = Math.ceil(words / wordsPerMinute)
        return Math.max(1, minutes)
    }

    extractMentions(text) {
        if (!text || typeof text !== 'string') return []
        
        const matches = text.match(this.patterns.mention)
        return matches ? matches.map(match => match.substring(1)) : []
    }

    extractHashtags(text) {
        if (!text || typeof text !== 'string') return []
        
        const matches = text.match(this.patterns.hashtag)
        return matches ? matches.map(match => match.substring(1)) : []
    }

    extractUrls(text) {
        if (!text || typeof text !== 'string') return []
        
        const matches = text.match(this.patterns.url)
        return matches || []
    }

    extractEmails(text) {
        if (!text || typeof text !== 'string') return []
        
        const matches = text.match(this.patterns.email)
        return matches || []
    }

    // Text formatting
    autoLink(text, options = {}) {
        if (!text || typeof text !== 'string') return text
        
        const linkClass = options.linkClass || 'auto-link'
        const target = options.target || '_blank'
        const maxLength = options.maxLength || 50
        
        let result = text
        
        // Link URLs
        result = result.replace(this.patterns.url, (url) => {
            const displayUrl = url.length > maxLength ? 
                url.substring(0, maxLength) + '...' : url
            return `<a href="${url}" class="${linkClass}" target="${target}" rel="noopener noreferrer">${displayUrl}</a>`
        })
        
        // Link emails
        result = result.replace(this.patterns.email, (email) => {
            return `<a href="mailto:${email}" class="${linkClass}">${email}</a>`
        })
        
        return result
    }

    formatMentions(text, options = {}) {
        if (!text || typeof text !== 'string') return text
        
        const mentionClass = options.mentionClass || 'mention'
        const baseUrl = options.baseUrl || '/profile'
        
        return text.replace(this.patterns.mention, (match, username) => {
            return `<a href="${baseUrl}/${username}" class="${mentionClass}">@${username}</a>`
        })
    }

    formatHashtags(text, options = {}) {
        if (!text || typeof text !== 'string') return text
        
        const hashtagClass = options.hashtagClass || 'hashtag'
        const baseUrl = options.baseUrl || '/search?q='
        
        return text.replace(this.patterns.hashtag, (match, hashtag) => {
            return `<a href="${baseUrl}${encodeURIComponent(hashtag)}" class="${hashtagClass}">#${hashtag}</a>`
        })
    }

    formatLineBreaks(text) {
        if (!text || typeof text !== 'string') return text
        
        return text.replace(/\n/g, '<br>')
    }

    // Validation methods
    isEmail(text) {
        if (!text || typeof text !== 'string') return false
        return this.patterns.email.test(text)
    }

    isUrl(text) {
        if (!text || typeof text !== 'string') return false
        return this.patterns.url.test(text)
    }

    isVietnameseText(text) {
        if (!text || typeof text !== 'string') return false
        return this.patterns.vietnamese.test(text)
    }

    hasSpecialCharacters(text) {
        if (!text || typeof text !== 'string') return false
        return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(text)
    }

    // Text comparison
    similarity(text1, text2) {
        if (!text1 || !text2) return 0
        
        const longer = text1.length > text2.length ? text1 : text2
        const shorter = text1.length > text2.length ? text2 : text1
        
        if (longer.length === 0) return 1.0
        
        const distance = this.levenshteinDistance(longer, shorter)
        return (longer.length - distance) / longer.length
    }

    levenshteinDistance(str1, str2) {
        const matrix = []
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i]
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1]
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    )
                }
            }
        }
        
        return matrix[str2.length][str1.length]
    }

    // Utility methods
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    }

    escapeHtml(text) {
        if (!text || typeof text !== 'string') return ''
        
        const div = document.createElement('div')
        div.textContent = text
        return div.innerHTML
    }

    unescapeHtml(html) {
        if (!html || typeof html !== 'string') return ''
        
        const div = document.createElement('div')
        div.innerHTML = html
        return div.textContent || div.innerText || ''
    }

    createHtmlSanitizer() {
        return (html, allowedTags, allowedAttributes) => {
            const div = document.createElement('div')
            div.innerHTML = html
            
            const walker = document.createTreeWalker(
                div,
                NodeFilter.SHOW_ELEMENT,
                null,
                false
            )
            
            const nodesToRemove = []
            let node = walker.nextNode()
            
            while (node) {
                const tagName = node.tagName.toLowerCase()
                
                if (!allowedTags.includes(tagName)) {
                    nodesToRemove.push(node)
                } else {
                    // Clean attributes
                    const allowedAttrs = allowedAttributes[tagName] || allowedAttributes['*'] || []
                    const attributes = Array.from(node.attributes)
                    
                    attributes.forEach(attr => {
                        if (!allowedAttrs.includes(attr.name)) {
                            node.removeAttribute(attr.name)
                        }
                    })
                }
                
                node = walker.nextNode()
            }
            
            // Remove disallowed nodes
            nodesToRemove.forEach(node => {
                if (node.parentNode) {
                    node.parentNode.removeChild(node)
                }
            })
            
            return div.innerHTML
        }
    }

    // Text formatting pipeline
    formatText(text, options = {}) {
        if (!text || typeof text !== 'string') return ''
        
        let result = text
        
        // Sanitize HTML if needed
        if (options.sanitize) {
            result = this.sanitizeHtml(result, options)
        }
        
        // Auto-link URLs and emails
        if (options.autoLink !== false && this.config.autoLink) {
            result = this.autoLink(result, options)
        }
        
        // Format mentions
        if (options.formatMentions) {
            result = this.formatMentions(result, options)
        }
        
        // Format hashtags
        if (options.formatHashtags) {
            result = this.formatHashtags(result, options)
        }
        
        // Preserve line breaks
        if (options.preserveLineBreaks !== false && this.config.preserveLineBreaks) {
            result = this.formatLineBreaks(result)
        }
        
        // Highlight terms
        if (options.highlight && this.config.highlightTerms) {
            result = this.highlight(result, options.highlight, options)
        }
        
        // Truncate if needed
        if (options.truncate) {
            result = this.truncate(result, options.truncate, options)
        }
        
        return result
    }
}

// Create global instance
const textProcessor = new TextProcessor()

// Export individual filter functions
export const truncate = (text, length, options) => textProcessor.truncate(text, length, options)
export const highlight = (text, terms, options) => textProcessor.highlight(text, terms, options)
export const stripHtml = (text) => textProcessor.stripHtml(text)
export const sanitizeHtml = (html, options) => textProcessor.sanitizeHtml(html, options)
export const capitalize = (text) => textProcessor.capitalize(text)
export const titleCase = (text) => textProcessor.titleCase(text)
export const camelCase = (text) => textProcessor.camelCase(text)
export const kebabCase = (text) => textProcessor.kebabCase(text)
export const snakeCase = (text) => textProcessor.snakeCase(text)
export const removeVietnameseAccents = (text) => textProcessor.removeVietnameseAccents(text)
export const vietnameseSlug = (text) => textProcessor.vietnameseSlug(text)
export const wordCount = (text) => textProcessor.wordCount(text)
export const characterCount = (text, options) => textProcessor.characterCount(text, options)
export const readingTime = (text, options) => textProcessor.readingTime(text, options)
export const extractMentions = (text) => textProcessor.extractMentions(text)
export const extractHashtags = (text) => textProcessor.extractHashtags(text)
export const extractUrls = (text) => textProcessor.extractUrls(text)
export const extractEmails = (text) => textProcessor.extractEmails(text)
export const autoLink = (text, options) => textProcessor.autoLink(text, options)
export const formatMentions = (text, options) => textProcessor.formatMentions(text, options)
export const formatHashtags = (text, options) => textProcessor.formatHashtags(text, options)
export const formatLineBreaks = (text) => textProcessor.formatLineBreaks(text)
export const formatText = (text, options) => textProcessor.formatText(text, options)
export const isEmail = (text) => textProcessor.isEmail(text)
export const isUrl = (text) => textProcessor.isUrl(text)
export const similarity = (text1, text2) => textProcessor.similarity(text1, text2)
export const escapeHtml = (text) => textProcessor.escapeHtml(text)
export const unescapeHtml = (html) => textProcessor.unescapeHtml(html)

// Export processor instance
export default textProcessor
export { TextProcessor }