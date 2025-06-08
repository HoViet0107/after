// Bộ lọc xử lý number formatting, currency, percentage và mathematical operations
class NumberProcessor {
    constructor() {
        this.config = {
            // Default locale and currency
            locale: 'vi-VN',
            currency: 'VND',
            
            // Formatting options
            defaultDecimalPlaces: 2,
            thousandsSeparator: ',',
            decimalSeparator: '.',
            
            // Currency settings
            currencyPosition: 'suffix', // 'prefix' or 'suffix'
            currencySymbols: {
                'VND': '₫',
                'USD': '$',
                'EUR': '€',
                'JPY': '¥',
                'GBP': '£',
                'CNY': '¥',
                'KRW': '₩'
            },
            
            // Vietnamese specific
            vietnameseCurrencyWords: {
                0: 'không',
                1: 'một',
                2: 'hai', 
                3: 'ba',
                4: 'bốn',
                5: 'năm',
                6: 'sáu',
                7: 'bảy',
                8: 'tám',
                9: 'chín',
                10: 'mười',
                11: 'mười một',
                12: 'mười hai',
                13: 'mười ba',
                14: 'mười bốn',
                15: 'mười lăm',
                16: 'mười sáu',
                17: 'mười bảy',
                18: 'mười tám',
                19: 'mười chín',
                20: 'hai mười',
                100: 'một trăm',
                1000: 'một nghìn',
                1000000: 'một triệu',
                1000000000: 'một tỷ'
            },
            
            // File size units
            fileSizeUnits: ['B', 'KB', 'MB', 'GB', 'TB', 'PB'],
            fileSizeBase: 1024,
            
            // Compact notation
            compactUnits: [
                { value: 1e12, symbol: 'T' },
                { value: 1e9, symbol: 'B' },
                { value: 1e6, symbol: 'M' },
                { value: 1e3, symbol: 'K' }
            ],
            
            // Performance settings
            enableCaching: true,
            cacheSize: 1000
        }

        this.init()
    }

    init() {
        // Check browser Intl support
        this.supportsIntl = typeof Intl !== 'undefined' && Intl.NumberFormat
        
        // Initialize formatters cache
        this.formatters = new Map()
        this.cache = new Map()
        
        // Set up default formatters
        this.createDefaultFormatters()
    }

    createDefaultFormatters() {
        if (!this.supportsIntl) return

        // Currency formatter
        this.formatters.set('currency', new Intl.NumberFormat(this.config.locale, {
            style: 'currency',
            currency: this.config.currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }))

        // Percentage formatter
        this.formatters.set('percent', new Intl.NumberFormat(this.config.locale, {
            style: 'percent',
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        }))

        // Decimal formatter
        this.formatters.set('decimal', new Intl.NumberFormat(this.config.locale, {
            minimumFractionDigits: this.config.defaultDecimalPlaces,
            maximumFractionDigits: this.config.defaultDecimalPlaces
        }))

        // Integer formatter
        this.formatters.set('integer', new Intl.NumberFormat(this.config.locale, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }))
    }

    // Core formatting methods
    formatNumber(value, options = {}) {
        const num = this.parseNumber(value)
        if (num === null) return ''

        const cacheKey = this.getCacheKey('number', num, options)
        if (this.config.enableCaching && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }

        let result
        const decimalPlaces = options.decimalPlaces ?? this.config.defaultDecimalPlaces
        const locale = options.locale || this.config.locale

        if (this.supportsIntl) {
            const formatter = new Intl.NumberFormat(locale, {
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces,
                useGrouping: options.useGrouping !== false
            })
            result = formatter.format(num)
        } else {
            result = this.formatNumberFallback(num, decimalPlaces, options)
        }

        this.setCache(cacheKey, result)
        return result
    }

    formatCurrency(value, options = {}) {
        const num = this.parseNumber(value)
        if (num === null) return ''

        const cacheKey = this.getCacheKey('currency', num, options)
        if (this.config.enableCaching && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }

        const currency = options.currency || this.config.currency
        const locale = options.locale || this.config.locale
        const symbol = options.symbol || this.config.currencySymbols[currency] || currency
        const position = options.position || this.config.currencyPosition
        const showDecimals = options.showDecimals !== false

        let result
        if (this.supportsIntl && !options.customFormat) {
            const formatter = new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: showDecimals ? 0 : 0,
                maximumFractionDigits: showDecimals ? 2 : 0
            })
            result = formatter.format(num)
        } else {
            const formattedNum = this.formatNumber(num, {
                decimalPlaces: showDecimals ? 2 : 0,
                locale,
                useGrouping: true
            })
            
            if (position === 'prefix') {
                result = `${symbol}${formattedNum}`
            } else {
                result = `${formattedNum} ${symbol}`
            }
        }

        this.setCache(cacheKey, result)
        return result
    }

    formatPercentage(value, options = {}) {
        const num = this.parseNumber(value)
        if (num === null) return ''

        const cacheKey = this.getCacheKey('percent', num, options)
        if (this.config.enableCaching && this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey)
        }

        const decimalPlaces = options.decimalPlaces ?? 1
        const locale = options.locale || this.config.locale
        const multiply = options.multiply !== false // Whether to multiply by 100

        const percentValue = multiply ? num * 100 : num

        let result
        if (this.supportsIntl) {
            const formatter = new Intl.NumberFormat(locale, {
                style: 'percent',
                minimumFractionDigits: decimalPlaces,
                maximumFractionDigits: decimalPlaces
            })
            result = multiply ? formatter.format(num) : formatter.format(num / 100)
        } else {
            const formattedNum = this.formatNumber(percentValue, {
                decimalPlaces,
                locale,
                useGrouping: false
            })
            result = `${formattedNum}%`
        }

        this.setCache(cacheKey, result)
        return result
    }

    // Specialized formatting
    formatFileSize(bytes, options = {}) {
        const num = this.parseNumber(bytes)
        if (num === null || num < 0) return ''

        const base = options.base || this.config.fileSizeBase
        const units = options.units || this.config.fileSizeUnits
        const decimalPlaces = options.decimalPlaces ?? 1

        if (num === 0) return `0 ${units[0]}`

        const unitIndex = Math.min(
            Math.floor(Math.log(num) / Math.log(base)),
            units.length - 1
        )

        const value = num / Math.pow(base, unitIndex)
        const formattedValue = this.formatNumber(value, {
            decimalPlaces: unitIndex === 0 ? 0 : decimalPlaces
        })

        return `${formattedValue} ${units[unitIndex]}`
    }

    formatCompact(value, options = {}) {
        const num = this.parseNumber(value)
        if (num === null) return ''

        const units = options.units || this.config.compactUnits
        const decimalPlaces = options.decimalPlaces ?? 1

        if (Math.abs(num) < 1000) {
            return this.formatNumber(num, { decimalPlaces: 0 })
        }

        for (const unit of units) {
            if (Math.abs(num) >= unit.value) {
                const value = num / unit.value
                const formattedValue = this.formatNumber(value, { decimalPlaces })
                return `${formattedValue}${unit.symbol}`
            }
        }

        return this.formatNumber(num, { decimalPlaces: 0 })
    }

    formatOrdinal(value, options = {}) {
        const num = this.parseNumber(value)
        if (num === null || !Number.isInteger(num)) return ''

        const locale = options.locale || this.config.locale

        if (this.supportsIntl && Intl.PluralRules) {
            try {
                const ordinalRules = new Intl.PluralRules(locale, { type: 'ordinal' })
                const rule = ordinalRules.select(num)
                
                const suffixes = {
                    'vi-VN': { other: 'th' }, // Vietnamese doesn't typically use ordinal suffixes
                    'en-US': { one: 'st', two: 'nd', few: 'rd', other: 'th' }
                }
                
                const localeSuffixes = suffixes[locale] || suffixes['en-US']
                const suffix = localeSuffixes[rule] || localeSuffixes.other
                
                return `${num}${suffix}`
            } catch (error) {
                // Fallback
                return this.formatOrdinalFallback(num, locale)
            }
        } else {
            return this.formatOrdinalFallback(num, locale)
        }
    }

    formatOrdinalFallback(num, locale) {
        if (locale === 'vi-VN') {
            return `thứ ${num}`
        }
        
        // English fallback
        const lastDigit = num % 10
        const lastTwoDigits = num % 100
        
        if (lastTwoDigits >= 11 && lastTwoDigits <= 13) {
            return `${num}th`
        }
        
        switch (lastDigit) {
            case 1: return `${num}st`
            case 2: return `${num}nd`
            case 3: return `${num}rd`
            default: return `${num}th`
        }
    }

    formatRoman(value) {
        const num = this.parseNumber(value)
        if (num === null || num <= 0 || num >= 4000) return ''

        const romanNumerals = [
            { value: 1000, symbol: 'M' },
            { value: 900, symbol: 'CM' },
            { value: 500, symbol: 'D' },
            { value: 400, symbol: 'CD' },
            { value: 100, symbol: 'C' },
            { value: 90, symbol: 'XC' },
            { value: 50, symbol: 'L' },
            { value: 40, symbol: 'XL' },
            { value: 10, symbol: 'X' },
            { value: 9, symbol: 'IX' },
            { value: 5, symbol: 'V' },
            { value: 4, symbol: 'IV' },
            { value: 1, symbol: 'I' }
        ]

        let result = ''
        let remaining = Math.floor(num)

        for (const numeral of romanNumerals) {
            while (remaining >= numeral.value) {
                result += numeral.symbol
                remaining -= numeral.value
            }
        }

        return result
    }

    // Vietnamese number to words
    numberToVietnameseWords(value) {
        const num = this.parseNumber(value)
        if (num === null) return ''

        if (num === 0) return 'không'
        if (num < 0) return 'âm ' + this.numberToVietnameseWords(-num)

        const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ']
        const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
        const tens = ['', '', 'hai mười', 'ba mười', 'bốn mười', 'năm mười', 'sáu mười', 'bảy mười', 'tám mười', 'chín mười']

        function convertHundreds(n) {
            let result = ''
            
            if (n >= 100) {
                result += ones[Math.floor(n / 100)] + ' trăm'
                n %= 100
                if (n > 0) result += ' '
            }
            
            if (n >= 20) {
                result += tens[Math.floor(n / 10)]
                n %= 10
                if (n > 0) result += ' ' + ones[n]
            } else if (n >= 10) {
                if (n === 15) {
                    result += 'mười lăm'
                } else {
                    result += 'mười' + (n > 10 ? ' ' + ones[n % 10] : '')
                }
            } else if (n > 0) {
                result += ones[n]
            }
            
            return result
        }

        const groups = []
        let tempNum = Math.floor(num)
        
        while (tempNum > 0) {
            groups.push(tempNum % 1000)
            tempNum = Math.floor(tempNum / 1000)
        }

        let result = ''
        for (let i = groups.length - 1; i >= 0; i--) {
            if (groups[i] > 0) {
                if (result) result += ' '
                result += convertHundreds(groups[i])
                if (i > 0) result += ' ' + units[i]
            }
        }

        return result
    }

    // Mathematical operations
    add(a, b, decimalPlaces = null) {
        const numA = this.parseNumber(a)
        const numB = this.parseNumber(b)
        if (numA === null || numB === null) return null

        const result = numA + numB
        return decimalPlaces !== null ? this.round(result, decimalPlaces) : result
    }

    subtract(a, b, decimalPlaces = null) {
        const numA = this.parseNumber(a)
        const numB = this.parseNumber(b)
        if (numA === null || numB === null) return null

        const result = numA - numB
        return decimalPlaces !== null ? this.round(result, decimalPlaces) : result
    }

    multiply(a, b, decimalPlaces = null) {
        const numA = this.parseNumber(a)
        const numB = this.parseNumber(b)
        if (numA === null || numB === null) return null

        const result = numA * numB
        return decimalPlaces !== null ? this.round(result, decimalPlaces) : result
    }

    divide(a, b, decimalPlaces = null) {
        const numA = this.parseNumber(a)
        const numB = this.parseNumber(b)
        if (numA === null || numB === null || numB === 0) return null

        const result = numA / numB
        return decimalPlaces !== null ? this.round(result, decimalPlaces) : result
    }

    round(value, decimalPlaces = 0) {
        const num = this.parseNumber(value)
        if (num === null) return null

        const factor = Math.pow(10, decimalPlaces)
        return Math.round(num * factor) / factor
    }

    floor(value, decimalPlaces = 0) {
        const num = this.parseNumber(value)
        if (num === null) return null

        const factor = Math.pow(10, decimalPlaces)
        return Math.floor(num * factor) / factor
    }

    ceil(value, decimalPlaces = 0) {
        const num = this.parseNumber(value)
        if (num === null) return null

        const factor = Math.pow(10, decimalPlaces)
        return Math.ceil(num * factor) / factor
    }

    // Statistical functions
    average(values) {
        const numbers = values.map(v => this.parseNumber(v)).filter(n => n !== null)
        if (numbers.length === 0) return null

        const sum = numbers.reduce((acc, val) => acc + val, 0)
        return sum / numbers.length
    }

    median(values) {
        const numbers = values.map(v => this.parseNumber(v)).filter(n => n !== null)
        if (numbers.length === 0) return null

        const sorted = numbers.sort((a, b) => a - b)
        const middle = Math.floor(sorted.length / 2)

        if (sorted.length % 2 === 0) {
            return (sorted[middle - 1] + sorted[middle]) / 2
        } else {
            return sorted[middle]
        }
    }

    sum(values) {
        const numbers = values.map(v => this.parseNumber(v)).filter(n => n !== null)
        return numbers.reduce((acc, val) => acc + val, 0)
    }

    min(values) {
        const numbers = values.map(v => this.parseNumber(v)).filter(n => n !== null)
        return numbers.length > 0 ? Math.min(...numbers) : null
    }

    max(values) {
        const numbers = values.map(v => this.parseNumber(v)).filter(n => n !== null)
        return numbers.length > 0 ? Math.max(...numbers) : null
    }

    // Utility methods
    parseNumber(value) {
        if (value === null || value === undefined || value === '') return null
        if (typeof value === 'number') return isNaN(value) ? null : value
        if (typeof value === 'string') {
            // Remove common formatting characters
            const cleaned = value.replace(/[,\s₫$€¥£]/g, '')
            const parsed = parseFloat(cleaned)
            return isNaN(parsed) ? null : parsed
        }
        return null
    }

    isNumber(value) {
        return this.parseNumber(value) !== null
    }

    isInteger(value) {
        const num = this.parseNumber(value)
        return num !== null && Number.isInteger(num)
    }

    isPositive(value) {
        const num = this.parseNumber(value)
        return num !== null && num > 0
    }

    isNegative(value) {
        const num = this.parseNumber(value)
        return num !== null && num < 0
    }

    clamp(value, min, max) {
        const num = this.parseNumber(value)
        const minNum = this.parseNumber(min)
        const maxNum = this.parseNumber(max)
        
        if (num === null) return null
        if (minNum !== null && num < minNum) return minNum
        if (maxNum !== null && num > maxNum) return maxNum
        return num
    }

    formatNumberFallback(num, decimalPlaces, options = {}) {
        const useGrouping = options.useGrouping !== false
        let result = num.toFixed(decimalPlaces)

        if (useGrouping) {
            const parts = result.split('.')
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, this.config.thousandsSeparator)
            result = parts.join(this.config.decimalSeparator)
        }

        return result
    }

    // Cache management
    getCacheKey(type, value, options) {
        return `${type}-${value}-${JSON.stringify(options)}`
    }

    setCache(key, value) {
        if (!this.config.enableCaching) return

        if (this.cache.size >= this.config.cacheSize) {
            const firstKey = this.cache.keys().next().value
            this.cache.delete(firstKey)
        }

        this.cache.set(key, value)
    }

    clearCache() {
        this.cache.clear()
        this.formatters.clear()
        this.createDefaultFormatters()
    }
}

// Create global instance
const numberProcessor = new NumberProcessor()

// Export individual filter functions
export const formatNumber = (value, options) => numberProcessor.formatNumber(value, options)
export const formatCurrency = (value, options) => numberProcessor.formatCurrency(value, options)
export const formatPercentage = (value, options) => numberProcessor.formatPercentage(value, options)
export const formatFileSize = (bytes, options) => numberProcessor.formatFileSize(bytes, options)
export const formatCompact = (value, options) => numberProcessor.formatCompact(value, options)
export const formatOrdinal = (value, options) => numberProcessor.formatOrdinal(value, options)
export const formatRoman = (value) => numberProcessor.formatRoman(value)
export const numberToVietnameseWords = (value) => numberProcessor.numberToVietnameseWords(value)
export const round = (value, decimalPlaces) => numberProcessor.round(value, decimalPlaces)
export const floor = (value, decimalPlaces) => numberProcessor.floor(value, decimalPlaces)
export const ceil = (value, decimalPlaces) => numberProcessor.ceil(value, decimalPlaces)
export const add = (a, b, decimalPlaces) => numberProcessor.add(a, b, decimalPlaces)
export const subtract = (a, b, decimalPlaces) => numberProcessor.subtract(a, b, decimalPlaces)
export const multiply = (a, b, decimalPlaces) => numberProcessor.multiply(a, b, decimalPlaces)
export const divide = (a, b, decimalPlaces) => numberProcessor.divide(a, b, decimalPlaces)
export const average = (values) => numberProcessor.average(values)
export const median = (values) => numberProcessor.median(values)
export const sum = (values) => numberProcessor.sum(values)
export const min = (values) => numberProcessor.min(values)
export const max = (values) => numberProcessor.max(values)
export const clamp = (value, min, max) => numberProcessor.clamp(value, min, max)
export const isNumber = (value) => numberProcessor.isNumber(value)
export const isInteger = (value) => numberProcessor.isInteger(value)
export const isPositive = (value) => numberProcessor.isPositive(value)
export const isNegative = (value) => numberProcessor.isNegative(value)

// Export processor instance
export default numberProcessor
export { NumberProcessor }