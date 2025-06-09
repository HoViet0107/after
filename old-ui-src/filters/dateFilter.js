// Bộ lọc xử lý date formatting, time ago, relative time với hỗ trợ đa ngôn ngữ
class DateFormatter {
    constructor() {
        this.locale = 'vi-VN'
        this.timezone = 'Asia/Ho_Chi_Minh'
        this.config = {
            // Default formats
            dateFormat: 'dd/MM/yyyy',
            timeFormat: 'HH:mm',
            datetimeFormat: 'dd/MM/yyyy HH:mm',
            
            // Relative time settings
            relativeThresholds: {
                second: 60,
                minute: 3600,
                hour: 86400,
                day: 604800,
                week: 2592000,
                month: 31536000
            },
            
            // Languages
            languages: {
                'vi-VN': {
                    just_now: 'vừa xong',
                    seconds_ago: '{count} giây trước',
                    minute_ago: '1 phút trước',
                    minutes_ago: '{count} phút trước',
                    hour_ago: '1 giờ trước',
                    hours_ago: '{count} giờ trước',
                    day_ago: '1 ngày trước',
                    days_ago: '{count} ngày trước',
                    week_ago: '1 tuần trước',
                    weeks_ago: '{count} tuần trước',
                    month_ago: '1 tháng trước',
                    months_ago: '{count} tháng trước',
                    year_ago: '1 năm trước',
                    years_ago: '{count} năm trước',
                    
                    // Future
                    in_seconds: 'trong {count} giây',
                    in_minute: 'trong 1 phút',
                    in_minutes: 'trong {count} phút',
                    in_hour: 'trong 1 giờ',
                    in_hours: 'trong {count} giờ',
                    in_day: 'trong 1 ngày',
                    in_days: 'trong {count} ngày',
                    in_week: 'trong 1 tuần',
                    in_weeks: 'trong {count} tuần',
                    in_month: 'trong 1 tháng',
                    in_months: 'trong {count} tháng',
                    in_year: 'trong 1 năm',
                    in_years: 'trong {count} năm',
                    
                    // Days of week
                    monday: 'Thứ 2',
                    tuesday: 'Thứ 3',
                    wednesday: 'Thứ 4',
                    thursday: 'Thứ 5',
                    friday: 'Thứ 6',
                    saturday: 'Thứ 7',
                    sunday: 'Chủ nhật',
                    
                    // Months
                    january: 'Tháng 1',
                    february: 'Tháng 2',
                    march: 'Tháng 3',
                    april: 'Tháng 4',
                    may: 'Tháng 5',
                    june: 'Tháng 6',
                    july: 'Tháng 7',
                    august: 'Tháng 8',
                    september: 'Tháng 9',
                    october: 'Tháng 10',
                    november: 'Tháng 11',
                    december: 'Tháng 12',
                    
                    // Periods
                    today: 'Hôm nay',
                    yesterday: 'Hôm qua',
                    tomorrow: 'Ngày mai',
                    this_week: 'Tuần này',
                    last_week: 'Tuần trước',
                    next_week: 'Tuần sau',
                    this_month: 'Tháng này',
                    last_month: 'Tháng trước',
                    next_month: 'Tháng sau',
                    this_year: 'Năm nay',
                    last_year: 'Năm trước',
                    next_year: 'Năm sau'
                },
                
                'en-US': {
                    just_now: 'just now',
                    seconds_ago: '{count} seconds ago',
                    minute_ago: '1 minute ago',
                    minutes_ago: '{count} minutes ago',
                    hour_ago: '1 hour ago',
                    hours_ago: '{count} hours ago',
                    day_ago: '1 day ago',
                    days_ago: '{count} days ago',
                    week_ago: '1 week ago',
                    weeks_ago: '{count} weeks ago',
                    month_ago: '1 month ago',
                    months_ago: '{count} months ago',
                    year_ago: '1 year ago',
                    years_ago: '{count} years ago',
                    
                    // Future
                    in_seconds: 'in {count} seconds',
                    in_minute: 'in 1 minute',
                    in_minutes: 'in {count} minutes',
                    in_hour: 'in 1 hour',
                    in_hours: 'in {count} hours',
                    in_day: 'in 1 day',
                    in_days: 'in {count} days',
                    in_week: 'in 1 week',
                    in_weeks: 'in {count} weeks',
                    in_month: 'in 1 month',
                    in_months: 'in {count} months',
                    in_year: 'in 1 year',
                    in_years: 'in {count} years'
                }
            }
        }

        this.init()
    }

    init() {
        // Check browser Intl support
        this.supportsIntl = typeof Intl !== 'undefined'
        
        // Cache formatters for performance
        this.formatters = new Map()
        
        // Set default locale
        this.setLocale(this.locale)
    }

    setLocale(locale) {
        this.locale = locale
        this.clearFormatters()
    }

    setTimezone(timezone) {
        this.timezone = timezone
        this.clearFormatters()
    }

    clearFormatters() {
        this.formatters.clear()
    }

    // Main formatting methods
    formatDate(date, format = null, options = {}) {
        const dateObj = this.parseDate(date)
        if (!dateObj) return ''

        const finalFormat = format || this.config.dateFormat
        const locale = options.locale || this.locale
        const timezone = options.timezone || this.timezone

        try {
            if (this.supportsIntl && this.isStandardFormat(finalFormat)) {
                return this.formatWithIntl(dateObj, finalFormat, locale, timezone)
            } else {
                return this.formatWithPattern(dateObj, finalFormat, locale, timezone)
            }
        } catch (error) {
            console.error('Date formatting error:', error)
            return dateObj.toString()
        }
    }

    formatTime(date, format = null, options = {}) {
        const dateObj = this.parseDate(date)
        if (!dateObj) return ''

        const finalFormat = format || this.config.timeFormat
        return this.formatDate(dateObj, finalFormat, options)
    }

    formatDateTime(date, format = null, options = {}) {
        const dateObj = this.parseDate(date)
        if (!dateObj) return ''

        const finalFormat = format || this.config.datetimeFormat
        return this.formatDate(dateObj, finalFormat, options)
    }

    // Relative time formatting
    formatTimeAgo(date, options = {}) {
        const dateObj = this.parseDate(date)
        if (!dateObj) return ''

        const now = new Date()
        const diffInSeconds = Math.floor((now - dateObj) / 1000)
        const locale = options.locale || this.locale
        const lang = this.config.languages[locale] || this.config.languages['vi-VN']

        // Future dates
        if (diffInSeconds < 0) {
            return this.formatFutureTime(Math.abs(diffInSeconds), lang)
        }

        // Past dates
        if (diffInSeconds < 10) {
            return lang.just_now
        } else if (diffInSeconds < this.config.relativeThresholds.second) {
            return lang.seconds_ago.replace('{count}', diffInSeconds)
        } else if (diffInSeconds < this.config.relativeThresholds.minute) {
            const minutes = Math.floor(diffInSeconds / 60)
            return minutes === 1 ? lang.minute_ago : lang.minutes_ago.replace('{count}', minutes)
        } else if (diffInSeconds < this.config.relativeThresholds.hour) {
            const hours = Math.floor(diffInSeconds / 3600)
            return hours === 1 ? lang.hour_ago : lang.hours_ago.replace('{count}', hours)
        } else if (diffInSeconds < this.config.relativeThresholds.day) {
            const days = Math.floor(diffInSeconds / 86400)
            return days === 1 ? lang.day_ago : lang.days_ago.replace('{count}', days)
        } else if (diffInSeconds < this.config.relativeThresholds.week) {
            const weeks = Math.floor(diffInSeconds / 604800)
            return weeks === 1 ? lang.week_ago : lang.weeks_ago.replace('{count}', weeks)
        } else if (diffInSeconds < this.config.relativeThresholds.month) {
            const months = Math.floor(diffInSeconds / 2592000)
            return months === 1 ? lang.month_ago : lang.months_ago.replace('{count}', months)
        } else {
            const years = Math.floor(diffInSeconds / 31536000)
            return years === 1 ? lang.year_ago : lang.years_ago.replace('{count}', years)
        }
    }

    formatFutureTime(diffInSeconds, lang) {
        if (diffInSeconds < this.config.relativeThresholds.second) {
            return lang.in_seconds.replace('{count}', diffInSeconds)
        } else if (diffInSeconds < this.config.relativeThresholds.minute) {
            const minutes = Math.floor(diffInSeconds / 60)
            return minutes === 1 ? lang.in_minute : lang.in_minutes.replace('{count}', minutes)
        } else if (diffInSeconds < this.config.relativeThresholds.hour) {
            const hours = Math.floor(diffInSeconds / 3600)
            return hours === 1 ? lang.in_hour : lang.in_hours.replace('{count}', hours)
        } else if (diffInSeconds < this.config.relativeThresholds.day) {
            const days = Math.floor(diffInSeconds / 86400)
            return days === 1 ? lang.in_day : lang.in_days.replace('{count}', days)
        } else if (diffInSeconds < this.config.relativeThresholds.week) {
            const weeks = Math.floor(diffInSeconds / 604800)
            return weeks === 1 ? lang.in_week : lang.in_weeks.replace('{count}', weeks)
        } else if (diffInSeconds < this.config.relativeThresholds.month) {
            const months = Math.floor(diffInSeconds / 2592000)
            return months === 1 ? lang.in_month : lang.in_months.replace('{count}', months)
        } else {
            const years = Math.floor(diffInSeconds / 31536000)
            return years === 1 ? lang.in_year : lang.in_years.replace('{count}', years)
        }
    }

    // Smart relative formatting
    formatSmart(date, options = {}) {
        const dateObj = this.parseDate(date)
        if (!dateObj) return ''

        const now = new Date()
        const diffInDays = Math.floor((now - dateObj) / (1000 * 60 * 60 * 24))
        const locale = options.locale || this.locale
        const lang = this.config.languages[locale] || this.config.languages['vi-VN']

        // Today
        if (this.isSameDay(dateObj, now)) {
            return `${lang.today} ${this.formatTime(dateObj)}`
        }
        
        // Yesterday
        if (diffInDays === 1) {
            return `${lang.yesterday} ${this.formatTime(dateObj)}`
        }
        
        // This week
        if (diffInDays < 7 && this.isSameWeek(dateObj, now)) {
            return `${this.formatDayOfWeek(dateObj, locale)} ${this.formatTime(dateObj)}`
        }
        
        // This year
        if (dateObj.getFullYear() === now.getFullYear()) {
            return this.formatDate(dateObj, 'dd/MM')
        }
        
        // Other years
        return this.formatDate(dateObj, 'dd/MM/yyyy')
    }

    // Calendar formatting
    formatCalendar(date, options = {}) {
        const dateObj = this.parseDate(date)
        if (!dateObj) return ''

        const now = new Date()
        const locale = options.locale || this.locale
        const lang = this.config.languages[locale] || this.config.languages['vi-VN']

        if (this.isSameDay(dateObj, now)) {
            return lang.today
        }
        
        const yesterday = new Date(now)
        yesterday.setDate(yesterday.getDate() - 1)
        if (this.isSameDay(dateObj, yesterday)) {
            return lang.yesterday
        }
        
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        if (this.isSameDay(dateObj, tomorrow)) {
            return lang.tomorrow
        }
        
        // Within a week
        const diffInDays = Math.floor((dateObj - now) / (1000 * 60 * 60 * 24))
        if (Math.abs(diffInDays) <= 7) {
            return this.formatDayOfWeek(dateObj, locale)
        }
        
        // Same year
        if (dateObj.getFullYear() === now.getFullYear()) {
            return this.formatDate(dateObj, 'dd MMM')
        }
        
        return this.formatDate(dateObj, 'dd MMM yyyy')
    }

    // Utility methods
    parseDate(input) {
        if (!input) return null
        
        if (input instanceof Date) {
            return isNaN(input.getTime()) ? null : input
        }
        
        if (typeof input === 'string') {
            const date = new Date(input)
            return isNaN(date.getTime()) ? null : date
        }
        
        if (typeof input === 'number') {
            // Handle both seconds and milliseconds timestamps
            const timestamp = input < 10000000000 ? input * 1000 : input
            const date = new Date(timestamp)
            return isNaN(date.getTime()) ? null : date
        }
        
        return null
    }

    isStandardFormat(format) {
        // Check if format can be handled by Intl.DateTimeFormat
        const standardFormats = [
            'short', 'medium', 'long', 'full',
            'numeric', '2-digit',
            'dd/MM/yyyy', 'MM/dd/yyyy', 'yyyy-MM-dd',
            'HH:mm', 'HH:mm:ss', 'h:mm a'
        ]
        return standardFormats.includes(format)
    }

    formatWithIntl(date, format, locale, timezone) {
        const cacheKey = `${format}-${locale}-${timezone}`
        
        if (!this.formatters.has(cacheKey)) {
            let options = { timeZone: timezone }
            
            switch (format) {
                case 'dd/MM/yyyy':
                    options = { ...options, day: '2-digit', month: '2-digit', year: 'numeric' }
                    break
                case 'MM/dd/yyyy':
                    options = { ...options, month: '2-digit', day: '2-digit', year: 'numeric' }
                    break
                case 'yyyy-MM-dd':
                    options = { ...options, year: 'numeric', month: '2-digit', day: '2-digit' }
                    break
                case 'HH:mm':
                    options = { ...options, hour: '2-digit', minute: '2-digit', hour12: false }
                    break
                case 'HH:mm:ss':
                    options = { ...options, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }
                    break
                case 'h:mm a':
                    options = { ...options, hour: 'numeric', minute: '2-digit', hour12: true }
                    break
                default:
                    options = { ...options, dateStyle: format }
            }
            
            this.formatters.set(cacheKey, new Intl.DateTimeFormat(locale, options))
        }
        
        return this.formatters.get(cacheKey).format(date)
    }

    formatWithPattern(date, pattern, locale, timezone) {
        // Custom pattern formatting
        const pad = (num, size = 2) => String(num).padStart(size, '0')
        
        return pattern
            .replace(/yyyy/g, date.getFullYear())
            .replace(/yy/g, String(date.getFullYear()).slice(-2))
            .replace(/MM/g, pad(date.getMonth() + 1))
            .replace(/M/g, date.getMonth() + 1)
            .replace(/dd/g, pad(date.getDate()))
            .replace(/d/g, date.getDate())
            .replace(/HH/g, pad(date.getHours()))
            .replace(/H/g, date.getHours())
            .replace(/hh/g, pad(date.getHours() % 12 || 12))
            .replace(/h/g, date.getHours() % 12 || 12)
            .replace(/mm/g, pad(date.getMinutes()))
            .replace(/m/g, date.getMinutes())
            .replace(/ss/g, pad(date.getSeconds()))
            .replace(/s/g, date.getSeconds())
            .replace(/a/g, date.getHours() >= 12 ? 'PM' : 'AM')
    }

    formatDayOfWeek(date, locale) {
        const lang = this.config.languages[locale] || this.config.languages['vi-VN']
        const days = [
            lang.sunday, lang.monday, lang.tuesday, lang.wednesday,
            lang.thursday, lang.friday, lang.saturday
        ]
        return days[date.getDay()]
    }

    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate()
    }

    isSameWeek(date1, date2) {
        const startOfWeek1 = new Date(date1)
        startOfWeek1.setDate(date1.getDate() - date1.getDay())
        startOfWeek1.setHours(0, 0, 0, 0)
        
        const startOfWeek2 = new Date(date2)
        startOfWeek2.setDate(date2.getDate() - date2.getDay())
        startOfWeek2.setHours(0, 0, 0, 0)
        
        return startOfWeek1.getTime() === startOfWeek2.getTime()
    }

    // Duration formatting
    formatDuration(milliseconds, options = {}) {
        const seconds = Math.floor(milliseconds / 1000)
        const minutes = Math.floor(seconds / 60)
        const hours = Math.floor(minutes / 60)
        const days = Math.floor(hours / 24)

        if (options.format === 'full') {
            const parts = []
            if (days > 0) parts.push(`${days} ngày`)
            if (hours % 24 > 0) parts.push(`${hours % 24} giờ`)
            if (minutes % 60 > 0) parts.push(`${minutes % 60} phút`)
            if (seconds % 60 > 0) parts.push(`${seconds % 60} giây`)
            return parts.join(' ')
        }

        if (days > 0) return `${days}d ${hours % 24}h`
        if (hours > 0) return `${hours}h ${minutes % 60}m`
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`
        return `${seconds}s`
    }

    // Age calculation
    calculateAge(birthDate, options = {}) {
        const birth = this.parseDate(birthDate)
        if (!birth) return null

        const now = options.referenceDate ? this.parseDate(options.referenceDate) : new Date()
        if (!now) return null

        let age = now.getFullYear() - birth.getFullYear()
        const monthDiff = now.getMonth() - birth.getMonth()
        
        if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
            age--
        }
        
        return age
    }
}

// Create global instance
const dateFormatter = new DateFormatter()

// Export individual filter functions
export const formatDate = (date, format, options) => dateFormatter.formatDate(date, format, options)
export const formatTime = (date, format, options) => dateFormatter.formatTime(date, format, options)
export const formatDateTime = (date, format, options) => dateFormatter.formatDateTime(date, format, options)
export const formatTimeAgo = (date, options) => dateFormatter.formatTimeAgo(date, options)
export const formatSmart = (date, options) => dateFormatter.formatSmart(date, options)
export const formatCalendar = (date, options) => dateFormatter.formatCalendar(date, options)
export const formatDuration = (milliseconds, options) => dateFormatter.formatDuration(milliseconds, options)
export const calculateAge = (birthDate, options) => dateFormatter.calculateAge(birthDate, options)

// Export formatter instance
export default dateFormatter
export { DateFormatter }