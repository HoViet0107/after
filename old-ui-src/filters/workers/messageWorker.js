// Web Worker để xử lý message processing, text analysis và content filtering

// Check if running in worker context
const isWorker = typeof importScripts === 'function'

class MessageProcessor {
    constructor() {
        this.config = {
            // Text processing
            maxMessageLength: 5000,
            maxUrlsPerMessage: 10,
            maxMentionsPerMessage: 20,
            maxHashtagsPerMessage: 10,
            
            // Content filtering
            profanityFilter: true,
            spamDetection: true,
            linkValidation: true,
            
            // Performance settings
            batchSize: 100,
            processingTimeout: 5000,
            
            // Language detection
            enableLanguageDetection: true,
            supportedLanguages: ['vi', 'en', 'ja', 'ko', 'zh'],
            
            // Sentiment analysis
            enableSentimentAnalysis: true,
            sentimentThreshold: 0.5
        }

        this.init()
    }

    init() {
        // Initialize regex patterns
        this.patterns = {
            url: /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g,
            email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
            mention: /@([a-zA-Z0-9_]+)/g,
            hashtag: /#([a-zA-Z0-9_]+)/g,
            phone: /(\+\d{1,3}[- ]?)?\d{10,11}/g,
            
            // Vietnamese patterns
            vietnamese: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
            
            // Suspicious patterns
            repeatedChars: /(.)\1{4,}/g,
            allCaps: /^[A-Z\s\d!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]{10,}$/,
            excessivePunctuation: /[!?]{3,}/g,
            
            // Code detection
            codeBlock: /```[\s\S]*?```/g,
            inlineCode: /`[^`]+`/g,
            
            // Formatting
            bold: /\*\*(.*?)\*\*/g,
            italic: /\*(.*?)\*/g,
            strikethrough: /~~(.*?)~~/g
        }

        // Profanity word list (sample - should be comprehensive)
        this.profanityWords = new Set([
            // Vietnamese
            'đồ chó', 'con lợn', 'thằng ngu', 'đồ khốn',
            // English
            'damn', 'shit', 'fuck', 'bitch',
            // Add more as needed
        ])

        // Spam indicators
        this.spamIndicators = new Set([
            'click here', 'free money', 'make money fast',
            'limited time', 'act now', 'guarantee',
            'nhấp vào đây', 'miễn phí', 'kiếm tiền nhanh'
        ])

        // Initialize sentiment lexicon (simplified)
        this.sentimentLexicon = {
            positive: new Set([
                'good', 'great', 'awesome', 'excellent', 'amazing',
                'tốt', 'tuyệt', 'tuyệt vời', 'xuất sắc', 'tuyệt hảo'
            ]),
            negative: new Set([
                'bad', 'terrible', 'awful', 'horrible', 'worst',
                'tệ', 'khủng khiếp', 'tồi tệ', 'kinh khủng', 'dở'
            ])
        }

        // Language detection patterns
        this.languagePatterns = {
            vi: /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i,
            en: /^[a-zA-Z\s\d\.,!?;:'"()\-]*$/,
            ja: /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/,
            ko: /[\uAC00-\uD7AF]/,
            zh: /[\u4E00-\u9FFF]/
        }

        this.log('MessageProcessor initialized')
    }

    // Main processing method
    async processMessage(message, options = {}) {
        try {
            const startTime = Date.now()
            
            // Validate input
            if (!message || typeof message !== 'object') {
                throw new Error('Invalid message format')
            }

            const content = message.content || ''
            const metadata = message.metadata || {}

            // Create processing result
            const result = {
                id: message.id,
                content: content,
                originalContent: content,
                metadata: {
                    ...metadata,
                    processedAt: Date.now(),
                    processingTime: 0
                },
                analysis: {},
                flags: [],
                actions: [],
                filtered: false,
                approved: true
            }

            // Basic validation
            const validation = this.validateMessage(content, options)
            if (!validation.valid) {
                result.approved = false
                result.flags.push(...validation.flags)
                result.analysis.validation = validation
                return result
            }

            // Content analysis
            result.analysis = await this.analyzeContent(content, options)

            // Apply filters
            const filterResult = this.applyFilters(content, result.analysis, options)
            result.filtered = filterResult.filtered
            result.flags.push(...filterResult.flags)
            result.actions.push(...filterResult.actions)

            if (filterResult.filtered) {
                result.content = filterResult.content
                result.approved = false
            }

            // Performance tracking
            result.metadata.processingTime = Date.now() - startTime

            this.log('Message processed:', result.id, `${result.metadata.processingTime}ms`)
            return result

        } catch (error) {
            this.log('Message processing error:', error)
            return {
                id: message.id || 'unknown',
                content: message.content || '',
                originalContent: message.content || '',
                metadata: { processedAt: Date.now(), error: error.message },
                analysis: {},
                flags: ['processing_error'],
                actions: [],
                filtered: true,
                approved: false
            }
        }
    }

    // Batch processing
    async processBatch(messages, options = {}) {
        const results = []
        const batchSize = options.batchSize || this.config.batchSize

        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize)
            const batchPromises = batch.map(message => this.processMessage(message, options))
            
            try {
                const batchResults = await Promise.all(batchPromises)
                results.push(...batchResults)
            } catch (error) {
                this.log('Batch processing error:', error)
                // Add error results for failed batch
                batch.forEach(message => {
                    results.push({
                        id: message.id || 'unknown',
                        content: message.content || '',
                        originalContent: message.content || '',
                        metadata: { processedAt: Date.now(), error: error.message },
                        analysis: {},
                        flags: ['batch_processing_error'],
                        actions: [],
                        filtered: true,
                        approved: false
                    })
                })
            }
        }

        return results
    }

    // Content validation
    validateMessage(content, options = {}) {
        const flags = []
        
        // Length validation
        if (!content || content.trim() === '') {
            flags.push('empty_content')
        }
        
        if (content.length > this.config.maxMessageLength) {
            flags.push('content_too_long')
        }

        // URL count validation
        const urls = this.extractUrls(content)
        if (urls.length > this.config.maxUrlsPerMessage) {
            flags.push('too_many_urls')
        }

        // Mention count validation
        const mentions = this.extractMentions(content)
        if (mentions.length > this.config.maxMentionsPerMessage) {
            flags.push('too_many_mentions')
        }

        // Hashtag count validation
        const hashtags = this.extractHashtags(content)
        if (hashtags.length > this.config.maxHashtagsPerMessage) {
            flags.push('too_many_hashtags')
        }

        // Suspicious patterns
        if (this.patterns.repeatedChars.test(content)) {
            flags.push('repeated_characters')
        }

        if (this.patterns.allCaps.test(content)) {
            flags.push('all_caps')
        }

        if (this.patterns.excessivePunctuation.test(content)) {
            flags.push('excessive_punctuation')
        }

        return {
            valid: flags.length === 0,
            flags
        }
    }

    // Content analysis
    async analyzeContent(content, options = {}) {
        const analysis = {
            wordCount: this.getWordCount(content),
            characterCount: content.length,
            urls: this.extractUrls(content),
            mentions: this.extractMentions(content),
            hashtags: this.extractHashtags(content),
            emails: this.extractEmails(content),
            phones: this.extractPhones(content),
            hasFormatting: this.hasFormatting(content),
            hasCode: this.hasCode(content)
        }

        // Language detection
        if (this.config.enableLanguageDetection) {
            analysis.language = this.detectLanguage(content)
        }

        // Sentiment analysis
        if (this.config.enableSentimentAnalysis) {
            analysis.sentiment = this.analyzeSentiment(content)
        }

        // Content type classification
        analysis.contentType = this.classifyContentType(content, analysis)

        // Readability metrics
        analysis.readability = this.calculateReadability(content)

        return analysis
    }

    // Content filtering
    applyFilters(content, analysis, options = {}) {
        const flags = []
        const actions = []
        let filteredContent = content
        let isFiltered = false

        // Profanity filter
        if (this.config.profanityFilter) {
            const profanityResult = this.filterProfanity(content)
            if (profanityResult.found) {
                flags.push('profanity_detected')
                actions.push('content_censored')
                filteredContent = profanityResult.filtered
                isFiltered = true
            }
        }

        // Spam detection
        if (this.config.spamDetection) {
            const spamScore = this.calculateSpamScore(content, analysis)
            if (spamScore > 0.7) {
                flags.push('spam_detected')
                actions.push('content_blocked')
                isFiltered = true
            } else if (spamScore > 0.4) {
                flags.push('potential_spam')
                actions.push('content_flagged')
            }
        }

        // Link validation
        if (this.config.linkValidation && analysis.urls.length > 0) {
            const linkValidation = this.validateLinks(analysis.urls)
            if (linkValidation.suspicious.length > 0) {
                flags.push('suspicious_links')
                actions.push('links_blocked')
                filteredContent = this.removeLinks(filteredContent, linkValidation.suspicious)
                isFiltered = true
            }
        }

        return {
            filtered: isFiltered,
            content: filteredContent,
            flags,
            actions
        }
    }

    // Text extraction methods
    extractUrls(content) {
        const matches = content.match(this.patterns.url)
        return matches || []
    }

    extractMentions(content) {
        const matches = content.match(this.patterns.mention)
        return matches ? matches.map(match => match.substring(1)) : []
    }

    extractHashtags(content) {
        const matches = content.match(this.patterns.hashtag)
        return matches ? matches.map(match => match.substring(1)) : []
    }

    extractEmails(content) {
        const matches = content.match(this.patterns.email)
        return matches || []
    }

    extractPhones(content) {
        const matches = content.match(this.patterns.phone)
        return matches || []
    }

    // Content analysis helpers
    getWordCount(content) {
        return content.trim().split(/\s+/).filter(word => word.length > 0).length
    }

    hasFormatting(content) {
        return this.patterns.bold.test(content) ||
               this.patterns.italic.test(content) ||
               this.patterns.strikethrough.test(content)
    }

    hasCode(content) {
        return this.patterns.codeBlock.test(content) ||
               this.patterns.inlineCode.test(content)
    }

    detectLanguage(content) {
        const scores = {}
        
        for (const [lang, pattern] of Object.entries(this.languagePatterns)) {
            const matches = content.match(pattern)
            scores[lang] = matches ? matches.length / content.length : 0
        }

        // Get language with highest score
        const detectedLang = Object.keys(scores).reduce((a, b) => 
            scores[a] > scores[b] ? a : b
        )

        return {
            detected: detectedLang,
            confidence: scores[detectedLang],
            scores
        }
    }

    analyzeSentiment(content) {
        const words = content.toLowerCase().split(/\s+/)
        let positiveScore = 0
        let negativeScore = 0
        
        words.forEach(word => {
            if (this.sentimentLexicon.positive.has(word)) {
                positiveScore++
            }
            if (this.sentimentLexicon.negative.has(word)) {
                negativeScore++
            }
        })

        const total = positiveScore + negativeScore
        if (total === 0) {
            return { score: 0, label: 'neutral' }
        }

        const score = (positiveScore - negativeScore) / total
        let label = 'neutral'
        
        if (score > this.config.sentimentThreshold) {
            label = 'positive'
        } else if (score < -this.config.sentimentThreshold) {
            label = 'negative'
        }

        return { score, label, positive: positiveScore, negative: negativeScore }
    }

    classifyContentType(content, analysis) {
        if (analysis.urls.length > analysis.wordCount * 0.3) {
            return 'link_heavy'
        }
        
        if (analysis.hashtags.length > analysis.wordCount * 0.2) {
            return 'hashtag_heavy'
        }
        
        if (analysis.mentions.length > analysis.wordCount * 0.2) {
            return 'mention_heavy'
        }
        
        if (analysis.hasCode) {
            return 'code'
        }
        
        if (analysis.wordCount < 5) {
            return 'short'
        }
        
        if (analysis.wordCount > 100) {
            return 'long'
        }
        
        return 'normal'
    }

    calculateReadability(content) {
        const words = this.getWordCount(content)
        const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0).length
        const characters = content.replace(/\s/g, '').length

        // Simple readability metrics
        const avgWordsPerSentence = words / Math.max(sentences, 1)
        const avgCharsPerWord = characters / Math.max(words, 1)

        let complexity = 'simple'
        if (avgWordsPerSentence > 20 || avgCharsPerWord > 6) {
            complexity = 'complex'
        } else if (avgWordsPerSentence > 15 || avgCharsPerWord > 5) {
            complexity = 'moderate'
        }

        return {
            words,
            sentences,
            characters,
            avgWordsPerSentence: Math.round(avgWordsPerSentence * 10) / 10,
            avgCharsPerWord: Math.round(avgCharsPerWord * 10) / 10,
            complexity
        }
    }

    // Filtering methods
    filterProfanity(content) {
        let filtered = content
        let found = false

        this.profanityWords.forEach(word => {
            const regex = new RegExp(`\\b${word}\\b`, 'gi')
            if (regex.test(filtered)) {
                found = true
                filtered = filtered.replace(regex, '*'.repeat(word.length))
            }
        })

        return { found, filtered }
    }

    calculateSpamScore(content, analysis) {
        let score = 0

        // Check spam indicators
        this.spamIndicators.forEach(indicator => {
            if (content.toLowerCase().includes(indicator)) {
                score += 0.3
            }
        })

        // URL ratio
        if (analysis.urls.length > 0) {
            const urlRatio = analysis.urls.length / analysis.wordCount
            score += Math.min(urlRatio * 2, 0.5)
        }

        // Repeated characters
        if (this.patterns.repeatedChars.test(content)) {
            score += 0.2
        }

        // All caps
        if (this.patterns.allCaps.test(content)) {
            score += 0.3
        }

        // Excessive punctuation
        if (this.patterns.excessivePunctuation.test(content)) {
            score += 0.2
        }

        return Math.min(score, 1)
    }

    validateLinks(urls) {
        const suspicious = []
        const safe = []

        // Suspicious domain patterns
        const suspiciousDomains = [
            /bit\.ly/, /tinyurl/, /t\.co/, /goo\.gl/,
            /[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}/, // IP addresses
            /[a-z0-9]{10,}\.com/ // Random domains
        ]

        urls.forEach(url => {
            let isSuspicious = false
            
            suspiciousDomains.forEach(pattern => {
                if (pattern.test(url)) {
                    isSuspicious = true
                }
            })

            if (isSuspicious) {
                suspicious.push(url)
            } else {
                safe.push(url)
            }
        })

        return { suspicious, safe }
    }

    removeLinks(content, linksToRemove) {
        let filtered = content
        
        linksToRemove.forEach(link => {
            filtered = filtered.replace(link, '[link removed]')
        })

        return filtered
    }

    // Utility methods
    log(...args) {
        if (isWorker) {
            // In worker context, send log to main thread
            self.postMessage({
                type: 'log',
                data: args
            })
        } else {
            console.log('[MessageProcessor]', ...args)
        }
    }
}

// Worker message handling
if (isWorker) {
    const processor = new MessageProcessor()

    self.onmessage = async function(e) {
        const { type, data, id } = e.data

        try {
            let result

            switch (type) {
                case 'process_message':
                    result = await processor.processMessage(data.message, data.options)
                    break

                case 'process_batch':
                    result = await processor.processBatch(data.messages, data.options)
                    break

                case 'analyze_content':
                    result = await processor.analyzeContent(data.content, data.options)
                    break

                case 'validate_message':
                    result = processor.validateMessage(data.content, data.options)
                    break

                case 'configure':
                    processor.config = { ...processor.config, ...data.config }
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
    module.exports = MessageProcessor
}

// Export for ES modules
if (!isWorker && typeof window !== 'undefined') {
    window.MessageProcessor = MessageProcessor
}