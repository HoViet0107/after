// Date formatting utilities với internationalization và timezone support

import { DATE_CONFIG } from './constants'

// Default locale and timezone
const DEFAULT_LOCALE = DATE_CONFIG.DEFAULT_LOCALE
const DEFAULT_TIMEZONE = DATE_CONFIG.DEFAULT_TIMEZONE

// Vietnamese month names
const VIETNAMESE_MONTHS = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
]

const VIETNAMESE_DAYS = [
    'Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'
]

const VIETNAMESE_SHORT_DAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']

// Format date to string
export function formatDate(date, format = DATE_CONFIG.FORMATS.DATE, locale = DEFAULT_LOCALE, timezone = DEFAULT_TIMEZONE) {
    if (!date) return ''

    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return ''

    try {
        switch (format) {
            case DATE_CONFIG.FORMATS.RELATIVE:
                return formatRelativeTime(dateObj, locale)

            case DATE_CONFIG.FORMATS.AGO:
                return formatTimeAgo(dateObj, locale)

            case DATE_CONFIG.FORMATS.SMART:
                return formatSmartTime(dateObj, locale)

            case DATE_CONFIG.FORMATS.FULL:
                return formatFullDate(dateObj, locale, timezone)

            case DATE_CONFIG.FORMATS.SHORT:
                return formatShortDate(dateObj, locale)

            case DATE_CONFIG.FORMATS.TIME:
                return formatTime(dateObj, locale)

            case DATE_CONFIG.FORMATS.DATETIME:
                return formatDateTime(dateObj, locale, timezone)

            case DATE_CONFIG.FORMATS.ISO:
                return dateObj.toISOString()

            case DATE_CONFIG.FORMATS.TIMESTAMP:
                return dateObj.getTime().toString()

            default:
                // Custom format or standard format
                if (locale === 'vi') {
                    return formatVietnameseDate(dateObj, format)
                }
                return dateObj.toLocaleDateString(locale)
        }
    } catch (error) {
        console.warn('Date formatting error:', error)
        return dateObj.toLocaleDateString()
    }
}

// Format Vietnamese date
export function formatVietnameseDate(date, format = 'DD/MM/YYYY') {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const day = d.getDate().toString().padStart(2, '0')
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const year = d.getFullYear()
    const hour = d.getHours().toString().padStart(2, '0')
    const minute = d.getMinutes().toString().padStart(2, '0')
    const second = d.getSeconds().toString().padStart(2, '0')

    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hour)
        .replace('mm', minute)
        .replace('ss', second)
}

// Format relative time (e.g., "2 hours ago", "in 3 days")
export function formatRelativeTime(date, locale = DEFAULT_LOCALE) {
    if (!date) return ''

    const now = new Date()
    const targetDate = new Date(date)
    const diffMs = targetDate.getTime() - now.getTime()
    const isPast = diffMs < 0
    const absDiffMs = Math.abs(diffMs)

    const seconds = Math.floor(absDiffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (locale === 'vi') {
        return formatVietnameseRelativeTime(seconds, minutes, hours, days, months, years, isPast)
    }

    // English relative time
    if (years > 0) {
        return isPast ? `${years} year${years > 1 ? 's' : ''} ago` : `in ${years} year${years > 1 ? 's' : ''}`
    }
    if (months > 0) {
        return isPast ? `${months} month${months > 1 ? 's' : ''} ago` : `in ${months} month${months > 1 ? 's' : ''}`
    }
    if (days > 0) {
        return isPast ? `${days} day${days > 1 ? 's' : ''} ago` : `in ${days} day${days > 1 ? 's' : ''}`
    }
    if (hours > 0) {
        return isPast ? `${hours} hour${hours > 1 ? 's' : ''} ago` : `in ${hours} hour${hours > 1 ? 's' : ''}`
    }
    if (minutes > 0) {
        return isPast ? `${minutes} minute${minutes > 1 ? 's' : ''} ago` : `in ${minutes} minute${minutes > 1 ? 's' : ''}`
    }

    return isPast ? 'just now' : 'in a moment'
}

// Vietnamese relative time
function formatVietnameseRelativeTime(seconds, minutes, hours, days, months, years, isPast) {
    if (years > 0) {
        return isPast ? `${years} năm trước` : `trong ${years} năm nữa`
    }
    if (months > 0) {
        return isPast ? `${months} tháng trước` : `trong ${months} tháng nữa`
    }
    if (days > 0) {
        if (days === 1) {
            return isPast ? 'hôm qua' : 'ngày mai'
        }
        if (days === 2 && isPast) {
            return 'hôm kia'
        }
        if (days === 2 && !isPast) {
            return 'ngày kia'
        }
        return isPast ? `${days} ngày trước` : `trong ${days} ngày nữa`
    }
    if (hours > 0) {
        return isPast ? `${hours} giờ trước` : `trong ${hours} giờ nữa`
    }
    if (minutes > 0) {
        return isPast ? `${minutes} phút trước` : `trong ${minutes} phút nữa`
    }

    return isPast ? 'vừa xong' : 'ngay bây giờ'
}

// Format time ago (always past tense)
export function formatTimeAgo(date, locale = DEFAULT_LOCALE) {
    if (!date) return ''

    const now = new Date()
    const targetDate = new Date(date)
    const diffMs = now.getTime() - targetDate.getTime()

    if (diffMs < 0) {
        return locale === 'vi' ? 'trong tương lai' : 'in the future'
    }

    const seconds = Math.floor(diffMs / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)
    const months = Math.floor(days / 30)
    const years = Math.floor(days / 365)

    if (locale === 'vi') {
        if (years > 0) return `${years} năm trước`
        if (months > 0) return `${months} tháng trước`
        if (days > 0) {
            if (days === 1) return 'hôm qua'
            if (days === 2) return 'hôm kia'
            return `${days} ngày trước`
        }
        if (hours > 0) return `${hours} giờ trước`
        if (minutes > 0) return `${minutes} phút trước`
        return 'vừa xong'
    }

    // English
    if (years > 0) return `${years}y`
    if (months > 0) return `${months}mo`
    if (days > 0) return `${days}d`
    if (hours > 0) return `${hours}h`
    if (minutes > 0) return `${minutes}m`
    return 'now'
}

// Smart time formatting (relative for recent, absolute for older)
export function formatSmartTime(date, locale = DEFAULT_LOCALE) {
    if (!date) return ''

    const now = new Date()
    const targetDate = new Date(date)
    const diffMs = Math.abs(now.getTime() - targetDate.getTime())
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // For dates within a week, use relative time
    if (days < 7) {
        return formatRelativeTime(targetDate, locale)
    }

    // For dates within this year, show month and day
    if (targetDate.getFullYear() === now.getFullYear()) {
        if (locale === 'vi') {
            return `${targetDate.getDate()} ${VIETNAMESE_MONTHS[targetDate.getMonth()]}`
        }
        return targetDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    }

    // For older dates, show full date
    return formatShortDate(targetDate, locale)
}

// Format full date with day name
export function formatFullDate(date, locale = DEFAULT_LOCALE, timezone = DEFAULT_TIMEZONE) {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    if (locale === 'vi') {
        const dayName = VIETNAMESE_DAYS[d.getDay()]
        const day = d.getDate()
        const month = VIETNAMESE_MONTHS[d.getMonth()]
        const year = d.getFullYear()
        const time = formatTime(d, locale)

        return `${dayName}, ${day} ${month} ${year} lúc ${time}`
    }

    return d.toLocaleString(locale, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
    })
}

// Format short date
export function formatShortDate(date, locale = DEFAULT_LOCALE) {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    if (locale === 'vi') {
        return formatVietnameseDate(d, 'DD/MM/YYYY')
    }

    return d.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    })
}

// Format time only
export function formatTime(date, locale = DEFAULT_LOCALE, format24 = true) {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    if (locale === 'vi' || format24) {
        return formatVietnameseDate(d, 'HH:mm')
    }

    return d.toLocaleTimeString(locale, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: !format24
    })
}

// Format date and time
export function formatDateTime(date, locale = DEFAULT_LOCALE, timezone = DEFAULT_TIMEZONE) {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    if (locale === 'vi') {
        return formatVietnameseDate(d, 'DD/MM/YYYY HH:mm')
    }

    return d.toLocaleString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: timezone
    })
}

// Calendar formatting
export function formatCalendarDate(date, locale = DEFAULT_LOCALE) {
    if (!date) return ''

    const d = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (isSameDay(d, today)) {
        return locale === 'vi' ? 'Hôm nay' : 'Today'
    }

    if (isSameDay(d, yesterday)) {
        return locale === 'vi' ? 'Hôm qua' : 'Yesterday'
    }

    if (isSameDay(d, tomorrow)) {
        return locale === 'vi' ? 'Ngày mai' : 'Tomorrow'
    }

    // Within this week
    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - today.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)

    if (d >= weekStart && d <= weekEnd) {
        if (locale === 'vi') {
            return VIETNAMESE_DAYS[d.getDay()]
        }
        return d.toLocaleDateString(locale, { weekday: 'long' })
    }

    return formatShortDate(d, locale)
}

// Date comparison utilities
export function isSameDay(date1, date2) {
    if (!date1 || !date2) return false

    const d1 = new Date(date1)
    const d2 = new Date(date2)

    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
}

export function isSameWeek(date1, date2) {
    if (!date1 || !date2) return false

    const d1 = new Date(date1)
    const d2 = new Date(date2)

    const weekStart1 = new Date(d1)
    weekStart1.setDate(d1.getDate() - d1.getDay())

    const weekStart2 = new Date(d2)
    weekStart2.setDate(d2.getDate() - d2.getDay())

    return isSameDay(weekStart1, weekStart2)
}

export function isSameMonth(date1, date2) {
    if (!date1 || !date2) return false

    const d1 = new Date(date1)
    const d2 = new Date(date2)

    return d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth()
}

export function isSameYear(date1, date2) {
    if (!date1 || !date2) return false

    const d1 = new Date(date1)
    const d2 = new Date(date2)

    return d1.getFullYear() === d2.getFullYear()
}

// Date manipulation utilities
export function addDays(date, days) {
    if (!date) return null

    const result = new Date(date)
    result.setDate(result.getDate() + days)
    return result
}

export function addWeeks(date, weeks) {
    return addDays(date, weeks * 7)
}

export function addMonths(date, months) {
    if (!date) return null

    const result = new Date(date)
    result.setMonth(result.getMonth() + months)
    return result
}

export function addYears(date, years) {
    if (!date) return null

    const result = new Date(date)
    result.setFullYear(result.getFullYear() + years)
    return result
}

export function startOfDay(date) {
    if (!date) return null

    const result = new Date(date)
    result.setHours(0, 0, 0, 0)
    return result
}

export function endOfDay(date) {
    if (!date) return null

    const result = new Date(date)
    result.setHours(23, 59, 59, 999)
    return result
}

export function startOfWeek(date, weekStartsOn = 1) { // 1 = Monday
    if (!date) return null

    const result = new Date(date)
    const day = result.getDay()
    const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn

    result.setDate(result.getDate() - diff)
    return startOfDay(result)
}

export function endOfWeek(date, weekStartsOn = 1) {
    if (!date) return null

    const result = startOfWeek(date, weekStartsOn)
    result.setDate(result.getDate() + 6)
    return endOfDay(result)
}

export function startOfMonth(date) {
    if (!date) return null

    const result = new Date(date)
    result.setDate(1)
    return startOfDay(result)
}

export function endOfMonth(date) {
    if (!date) return null

    const result = new Date(date)
    result.setMonth(result.getMonth() + 1, 0)
    return endOfDay(result)
}

export function startOfYear(date) {
    if (!date) return null

    const result = new Date(date)
    result.setMonth(0, 1)
    return startOfDay(result)
}

export function endOfYear(date) {
    if (!date) return null

    const result = new Date(date)
    result.setMonth(11, 31)
    return endOfDay(result)
}

// Date range utilities
export function getDaysInMonth(date) {
    if (!date) return 0

    const d = new Date(date)
    return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
}

export function getDayOfYear(date) {
    if (!date) return 0

    const d = new Date(date)
    const start = new Date(d.getFullYear(), 0, 0)
    const diff = d - start
    return Math.floor(diff / (1000 * 60 * 60 * 24))
}

export function getWeekOfYear(date) {
    if (!date) return 0

    const d = new Date(date)
    const firstDay = new Date(d.getFullYear(), 0, 1)
    const pastDaysOfYear = (d - firstDay) / 86400000
    return Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7)
}

export function getAge(birthDate, currentDate = new Date()) {
    if (!birthDate) return 0

    const birth = new Date(birthDate)
    const current = new Date(currentDate)

    let age = current.getFullYear() - birth.getFullYear()
    const monthDiff = current.getMonth() - birth.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && current.getDate() < birth.getDate())) {
        age--
    }

    return age
}

// Date range generators
export function generateDateRange(startDate, endDate, step = 1) {
    const dates = []
    const current = new Date(startDate)
    const end = new Date(endDate)

    while (current <= end) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + step)
    }

    return dates
}

export function generateWeekDays(date, locale = DEFAULT_LOCALE) {
    const weekStart = startOfWeek(date)
    const days = []

    for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i)
        days.push({
            date: day,
            dayName: locale === 'vi' ? VIETNAMESE_SHORT_DAYS[day.getDay()] : day.toLocaleDateString(locale, { weekday: 'short' }),
            dayNumber: day.getDate(),
            isToday: isSameDay(day, new Date()),
            isWeekend: day.getDay() === 0 || day.getDay() === 6
        })
    }

    return days
}

// Validation utilities
export function isValidDate(date) {
    if (!date) return false
    const d = new Date(date)
    return !isNaN(d.getTime())
}

export function isLeapYear(year) {
    return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0)
}

export function isWeekend(date) {
    if (!date) return false
    const day = new Date(date).getDay()
    return day === 0 || day === 6
}

export function isBusinessDay(date) {
    return !isWeekend(date)
}

// Timezone utilities
export function convertToTimezone(date, timezone) {
    if (!date) return null

    try {
        return new Date(new Date(date).toLocaleString('en-US', { timeZone: timezone }))
    } catch (error) {
        console.warn('Timezone conversion error:', error)
        return new Date(date)
    }
}

export function getTimezoneOffset(timezone) {
    try {
        const now = new Date()
        const utc = new Date(now.getTime() + (now.getTimezoneOffset() * 60000))
        const target = new Date(utc.toLocaleString('en-US', { timeZone: timezone }))
        return (utc.getTime() - target.getTime()) / (1000 * 60)
    } catch (error) {
        console.warn('Timezone offset error:', error)
        return 0
    }
}

// Performance optimization - cache formatters
const formattersCache = new Map()

function getCachedFormatter(locale, options) {
    const key = `${locale}-${JSON.stringify(options)}`

    if (!formattersCache.has(key)) {
        formattersCache.set(key, new Intl.DateTimeFormat(locale, options))
    }

    return formattersCache.get(key)
}

// Social media specific formatting
export function formatPostTime(date, locale = DEFAULT_LOCALE) {
    if (!date) return ''

    const now = new Date()
    const postDate = new Date(date)
    const diffMs = now.getTime() - postDate.getTime()
    const hours = Math.floor(diffMs / (1000 * 60 * 60))

    // For posts within 24 hours, show relative time
    if (hours < 24) {
        return formatTimeAgo(postDate, locale)
    }

    // For posts within this year, show month and day
    if (isSameYear(postDate, now)) {
        if (locale === 'vi') {
            return `${postDate.getDate()} ${VIETNAMESE_MONTHS[postDate.getMonth()]}`
        }
        return postDate.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    }

    // For older posts, show year as well
    return formatShortDate(postDate, locale)
}

export function formatMessageTime(date, locale = DEFAULT_LOCALE) {
    if (!date) return ''

    const now = new Date()
    const messageDate = new Date(date)

    // If today, show time only
    if (isSameDay(messageDate, now)) {
        return formatTime(messageDate, locale)
    }

    // If yesterday, show "Hôm qua"
    const yesterday = addDays(now, -1)
    if (isSameDay(messageDate, yesterday)) {
        return locale === 'vi' ? 'Hôm qua' : 'Yesterday'
    }

    // If within this week, show day name
    if (isSameWeek(messageDate, now)) {
        if (locale === 'vi') {
            return VIETNAMESE_DAYS[messageDate.getDay()]
        }
        return messageDate.toLocaleDateString(locale, { weekday: 'long' })
    }

    // Otherwise show date
    return formatShortDate(messageDate, locale)
}

// Export default object with all utilities
export default {
    // Formatting
    formatDate,
    formatVietnameseDate,
    formatRelativeTime,
    formatTimeAgo,
    formatSmartTime,
    formatFullDate,
    formatShortDate,
    formatTime,
    formatDateTime,
    formatCalendarDate,
    formatPostTime,
    formatMessageTime,

    // Comparison
    isSameDay,
    isSameWeek,
    isSameMonth,
    isSameYear,

    // Manipulation
    addDays,
    addWeeks,
    addMonths,
    addYears,
    startOfDay,
    endOfDay,
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,

    // Utilities
    getDaysInMonth,
    getDayOfYear,
    getWeekOfYear,
    getAge,
    generateDateRange,
    generateWeekDays,

    // Validation
    isValidDate,
    isLeapYear,
    isWeekend,
    isBusinessDay,

    // Timezone
    convertToTimezone,
    getTimezoneOffset,

    // Constants
    VIETNAMESE_MONTHS,
    VIETNAMESE_DAYS,
    VIETNAMESE_SHORT_DAYS
}