// Form validation rules với real-time validation và error messages

import { REGEX_PATTERNS, USER_CONFIG, POST_CONFIG, MESSAGE_CONFIG } from './constants'

// Validation result structure
class ValidationResult {
    constructor(isValid = true, message = '', field = '') {
        this.isValid = isValid
        this.message = message
        this.field = field
    }

    static success() {
        return new ValidationResult(true)
    }

    static error(message, field = '') {
        return new ValidationResult(false, message, field)
    }
}

// Base validation functions
export const required = (value, fieldName = 'Trường này') => {
    if (value === null || value === undefined || value === '') {
        return ValidationResult.error(`${fieldName} là bắt buộc`)
    }
    if (typeof value === 'string' && value.trim() === '') {
        return ValidationResult.error(`${fieldName} không được để trống`)
    }
    if (Array.isArray(value) && value.length === 0) {
        return ValidationResult.error(`${fieldName} phải có ít nhất một item`)
    }
    return ValidationResult.success()
}

export const minLength = (min) => (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success() // Let required handle empty values

    const length = typeof value === 'string' ? value.trim().length : value.toString().length
    if (length < min) {
        return ValidationResult.error(`${fieldName} phải có ít nhất ${min} ký tự`)
    }
    return ValidationResult.success()
}

export const maxLength = (max) => (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success()

    const length = typeof value === 'string' ? value.length : value.toString().length
    if (length > max) {
        return ValidationResult.error(`${fieldName} không được vượt quá ${max} ký tự`)
    }
    return ValidationResult.success()
}

export const minValue = (min) => (value, fieldName = 'Giá trị') => {
    if (!value && value !== 0) return ValidationResult.success()

    const numValue = Number(value)
    if (isNaN(numValue)) {
        return ValidationResult.error(`${fieldName} phải là số`)
    }
    if (numValue < min) {
        return ValidationResult.error(`${fieldName} phải lớn hơn hoặc bằng ${min}`)
    }
    return ValidationResult.success()
}

export const maxValue = (max) => (value, fieldName = 'Giá trị') => {
    if (!value && value !== 0) return ValidationResult.success()

    const numValue = Number(value)
    if (isNaN(numValue)) {
        return ValidationResult.error(`${fieldName} phải là số`)
    }
    if (numValue > max) {
        return ValidationResult.error(`${fieldName} phải nhỏ hơn hoặc bằng ${max}`)
    }
    return ValidationResult.success()
}

export const pattern = (regex, message) => (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success()

    if (!regex.test(value)) {
        return ValidationResult.error(message || `${fieldName} không đúng định dạng`)
    }
    return ValidationResult.success()
}

export const oneOf = (allowedValues, message) => (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success()

    if (!allowedValues.includes(value)) {
        return ValidationResult.error(
            message || `${fieldName} phải là một trong: ${allowedValues.join(', ')}`
        )
    }
    return ValidationResult.success()
}

export const custom = (validatorFn, message) => (value, fieldName = 'Trường này') => {
    try {
        const isValid = validatorFn(value)
        if (!isValid) {
            return ValidationResult.error(message || `${fieldName} không hợp lệ`)
        }
        return ValidationResult.success()
    } catch (error) {
        return ValidationResult.error(`Lỗi validation: ${error.message}`)
    }
}

// Specific field validators
export const email = (value, fieldName = 'Email') => {
    if (!value) return ValidationResult.success()

    if (!REGEX_PATTERNS.EMAIL.test(value.trim())) {
        return ValidationResult.error('Email không đúng định dạng')
    }
    return ValidationResult.success()
}

export const phone = (value, fieldName = 'Số điện thoại') => {
    if (!value) return ValidationResult.success()

    if (!REGEX_PATTERNS.PHONE.test(value.trim())) {
        return ValidationResult.error('Số điện thoại không đúng định dạng')
    }
    return ValidationResult.success()
}

export const username = (value, fieldName = 'Tên đăng nhập') => {
    if (!value) return ValidationResult.success()

    const trimmed = value.trim()

    if (!REGEX_PATTERNS.USERNAME.test(trimmed)) {
        return ValidationResult.error('Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới')
    }

    if (trimmed.length < USER_CONFIG.USERNAME_MIN_LENGTH) {
        return ValidationResult.error(`Tên đăng nhập phải có ít nhất ${USER_CONFIG.USERNAME_MIN_LENGTH} ký tự`)
    }

    if (trimmed.length > USER_CONFIG.USERNAME_MAX_LENGTH) {
        return ValidationResult.error(`Tên đăng nhập không được vượt quá ${USER_CONFIG.USERNAME_MAX_LENGTH} ký tự`)
    }

    // Check for reserved usernames
    const reservedUsernames = ['admin', 'root', 'api', 'www', 'mail', 'ftp', 'support', 'help']
    if (reservedUsernames.includes(trimmed.toLowerCase())) {
        return ValidationResult.error('Tên đăng nhập này không được sử dụng')
    }

    return ValidationResult.success()
}

export const password = (value, fieldName = 'Mật khẩu') => {
    if (!value) return ValidationResult.success()

    if (value.length < USER_CONFIG.PASSWORD_MIN_LENGTH) {
        return ValidationResult.error(`Mật khẩu phải có ít nhất ${USER_CONFIG.PASSWORD_MIN_LENGTH} ký tự`)
    }

    if (value.length > USER_CONFIG.PASSWORD_MAX_LENGTH) {
        return ValidationResult.error(`Mật khẩu không được vượt quá ${USER_CONFIG.PASSWORD_MAX_LENGTH} ký tự`)
    }

    if (!REGEX_PATTERNS.PASSWORD.test(value)) {
        return ValidationResult.error('Mật khẩu phải chứa ít nhất một chữ hoa, một chữ thường và một số')
    }

    return ValidationResult.success()
}

export const confirmPassword = (confirmValue, originalValue) => {
    if (!confirmValue) return ValidationResult.success()

    if (confirmValue !== originalValue) {
        return ValidationResult.error('Xác nhận mật khẩu không khớp')
    }
    return ValidationResult.success()
}

export const url = (value, fieldName = 'URL') => {
    if (!value) return ValidationResult.success()

    if (!REGEX_PATTERNS.URL.test(value.trim())) {
        return ValidationResult.error('URL không đúng định dạng')
    }
    return ValidationResult.success()
}

export const date = (value, fieldName = 'Ngày') => {
    if (!value) return ValidationResult.success()

    const dateObj = new Date(value)
    if (isNaN(dateObj.getTime())) {
        return ValidationResult.error('Ngày không hợp lệ')
    }
    return ValidationResult.success()
}

export const dateRange = (startDate, endDate) => {
    if (!startDate || !endDate) return ValidationResult.success()

    const start = new Date(startDate)
    const end = new Date(endDate)

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return ValidationResult.error('Ngày không hợp lệ')
    }

    if (start >= end) {
        return ValidationResult.error('Ngày bắt đầu phải nhỏ hơn ngày kết thúc')
    }

    return ValidationResult.success()
}

export const minAge = (minAgeYears) => (value, fieldName = 'Ngày sinh') => {
    if (!value) return ValidationResult.success()

    const birthDate = new Date(value)
    if (isNaN(birthDate.getTime())) {
        return ValidationResult.error('Ngày sinh không hợp lệ')
    }

    const today = new Date()
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
    }

    if (age < minAgeYears) {
        return ValidationResult.error(`Bạn phải ít nhất ${minAgeYears} tuổi`)
    }

    return ValidationResult.success()
}

// File validation
export const fileSize = (maxSizeBytes) => (file, fieldName = 'File') => {
    if (!file) return ValidationResult.success()

    if (file.size > maxSizeBytes) {
        const maxSizeMB = Math.round(maxSizeBytes / (1024 * 1024))
        return ValidationResult.error(`${fieldName} không được vượt quá ${maxSizeMB}MB`)
    }
    return ValidationResult.success()
}

export const fileType = (allowedTypes) => (file, fieldName = 'File') => {
    if (!file) return ValidationResult.success()

    if (!allowedTypes.includes(file.type)) {
        return ValidationResult.error(`${fieldName} không đúng định dạng cho phép`)
    }
    return ValidationResult.success()
}

export const imageFile = (file, fieldName = 'Hình ảnh') => {
    if (!file) return ValidationResult.success()

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        return ValidationResult.error('Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WebP)')
    }
    return ValidationResult.success()
}

export const videoFile = (file, fieldName = 'Video') => {
    if (!file) return ValidationResult.success()

    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime']
    if (!allowedTypes.includes(file.type)) {
        return ValidationResult.error('Chỉ chấp nhận file video (MP4, WebM, QuickTime)')
    }
    return ValidationResult.success()
}

// Content validation
export const postContent = (value, fieldName = 'Nội dung bài viết') => {
    if (!value) return ValidationResult.success()

    const trimmed = value.trim()

    if (trimmed.length > POST_CONFIG.CONTENT_MAX_LENGTH) {
        return ValidationResult.error(`Nội dung không được vượt quá ${POST_CONFIG.CONTENT_MAX_LENGTH} ký tự`)
    }

    // Check for spam patterns
    const spamPatterns = [
        /(.)\1{10,}/, // Repeated characters
        /https?:\/\/[^\s]{50,}/, // Very long URLs
        /\b(buy|sell|click|free|money)\b.*\b(now|today|urgent)\b/i // Spam keywords
    ]

    if (spamPatterns.some(pattern => pattern.test(trimmed))) {
        return ValidationResult.error('Nội dung có vẻ như spam')
    }

    return ValidationResult.success()
}

export const commentContent = (value, fieldName = 'Bình luận') => {
    if (!value) return ValidationResult.success()

    const trimmed = value.trim()

    if (trimmed.length > COMMENT_CONFIG.CONTENT_MAX_LENGTH) {
        return ValidationResult.error(`Bình luận không được vượt quá ${COMMENT_CONFIG.CONTENT_MAX_LENGTH} ký tự`)
    }

    return ValidationResult.success()
}

export const messageContent = (value, fieldName = 'Tin nhắn') => {
    if (!value) return ValidationResult.success()

    const trimmed = value.trim()

    if (trimmed.length > MESSAGE_CONFIG.CONTENT_MAX_LENGTH) {
        return ValidationResult.error(`Tin nhắn không được vượt quá ${MESSAGE_CONFIG.CONTENT_MAX_LENGTH} ký tự`)
    }

    return ValidationResult.success()
}

export const hashtags = (value, fieldName = 'Hashtags') => {
    if (!value) return ValidationResult.success()

    const hashtags = value.match(REGEX_PATTERNS.HASHTAG) || []

    if (hashtags.length > POST_CONFIG.HASHTAG_MAX_COUNT) {
        return ValidationResult.error(`Không được vượt quá ${POST_CONFIG.HASHTAG_MAX_COUNT} hashtags`)
    }

    // Check hashtag length
    for (const hashtag of hashtags) {
        if (hashtag.length > 50) {
            return ValidationResult.error('Hashtag không được vượt quá 50 ký tự')
        }
    }

    return ValidationResult.success()
}

export const mentions = (value, fieldName = 'Mentions') => {
    if (!value) return ValidationResult.success()

    const mentions = value.match(REGEX_PATTERNS.MENTION) || []

    if (mentions.length > POST_CONFIG.MENTION_MAX_COUNT) {
        return ValidationResult.error(`Không được vượt quá ${POST_CONFIG.MENTION_MAX_COUNT} mentions`)
    }

    return ValidationResult.success()
}

// Security validation
export const noXSS = (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success()

    const xssPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe/gi,
        /<object/gi,
        /<embed/gi
    ]

    if (xssPatterns.some(pattern => pattern.test(value))) {
        return ValidationResult.error('Nội dung chứa mã độc hại')
    }

    return ValidationResult.success()
}

export const noSQLInjection = (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success()

    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
        /(\b(OR|AND)\s+\d+\s*=\s*\d+)/gi,
        /(--|\/\*|\*\/)/g,
        /(\bUNION\s+(ALL\s+)?SELECT)/gi
    ]

    if (sqlPatterns.some(pattern => pattern.test(value))) {
        return ValidationResult.error('Nội dung chứa mã SQL độc hại')
    }

    return ValidationResult.success()
}

// Form validation builder
export class FormValidator {
    constructor() {
        this.rules = new Map()
        this.errors = new Map()
        this.isValidating = false
    }

    // Add validation rule for a field
    addRule(fieldName, validator, trigger = 'blur') {
        if (!this.rules.has(fieldName)) {
            this.rules.set(fieldName, [])
        }

        this.rules.get(fieldName).push({
            validator,
            trigger
        })

        return this
    }

    // Add multiple validators for a field
    field(fieldName, validators, trigger = 'blur') {
        if (!Array.isArray(validators)) {
            validators = [validators]
        }

        validators.forEach(validator => {
            this.addRule(fieldName, validator, trigger)
        })

        return this
    }

    // Validate a single field
    validateField(fieldName, value, trigger = 'blur') {
        const fieldRules = this.rules.get(fieldName) || []
        const errors = []

        for (const rule of fieldRules) {
            if (rule.trigger !== trigger && trigger !== 'submit') {
                continue
            }

            const result = rule.validator(value, fieldName)
            if (!result.isValid) {
                errors.push(result.message)
                break // Stop at first error
            }
        }

        if (errors.length > 0) {
            this.errors.set(fieldName, errors)
        } else {
            this.errors.delete(fieldName)
        }

        return errors.length === 0
    }

    // Validate entire form
    validateForm(formData, trigger = 'submit') {
        this.isValidating = true
        let isValid = true

        for (const [fieldName] of this.rules) {
            const fieldValue = formData[fieldName]
            const fieldValid = this.validateField(fieldName, fieldValue, trigger)
            if (!fieldValid) {
                isValid = false
            }
        }

        this.isValidating = false
        return isValid
    }

    // Get errors for a field
    getFieldErrors(fieldName) {
        return this.errors.get(fieldName) || []
    }

    // Get all errors
    getAllErrors() {
        return Object.fromEntries(this.errors)
    }

    // Check if field has errors
    hasFieldError(fieldName) {
        return this.errors.has(fieldName)
    }

    // Check if form has any errors
    hasErrors() {
        return this.errors.size > 0
    }

    // Clear errors for a field
    clearFieldErrors(fieldName) {
        this.errors.delete(fieldName)
    }

    // Clear all errors
    clearAllErrors() {
        this.errors.clear()
    }

    // Reset validator
    reset() {
        this.errors.clear()
        this.isValidating = false
    }
}

// Pre-built form validators
export const createLoginValidator = () => {
    return new FormValidator()
        .field('email', [required, email], 'blur')
        .field('password', [required], 'blur')
}

export const createRegisterValidator = () => {
    return new FormValidator()
        .field('email', [required, email], 'blur')
        .field('username', [required, username], 'blur')
        .field('password', [required, password], 'blur')
        .field('confirmPassword', [], 'blur') // Will be handled separately
        .field('firstName', [required, minLength(2), maxLength(50)], 'blur')
        .field('lastName', [required, minLength(2), maxLength(50)], 'blur')
        .field('birthDate', [required, date, minAge(13)], 'blur')
        .field('agreeTerms', [required], 'change')
}

export const createPostValidator = () => {
    return new FormValidator()
        .field('content', [required, postContent, noXSS, hashtags, mentions], 'input')
        .field('privacy', [required, oneOf(['public', 'friends', 'private'])], 'change')
}

export const createCommentValidator = () => {
    return new FormValidator()
        .field('content', [required, commentContent, noXSS], 'input')
}

export const createMessageValidator = () => {
    return new FormValidator()
        .field('content', [required, messageContent, noXSS], 'input')
}

export const createProfileValidator = () => {
    return new FormValidator()
        .field('firstName', [required, minLength(2), maxLength(50)], 'blur')
        .field('lastName', [required, minLength(2), maxLength(50)], 'blur')
        .field('bio', [maxLength(USER_CONFIG.BIO_MAX_LENGTH), noXSS], 'blur')
        .field('website', [url], 'blur')
        .field('location', [maxLength(100)], 'blur')
}

export const createPasswordChangeValidator = () => {
    return new FormValidator()
        .field('currentPassword', [required], 'blur')
        .field('newPassword', [required, password], 'blur')
        .field('confirmNewPassword', [], 'blur') // Will be handled separately
}

// Export validation result class
export { ValidationResult }

// Utility functions for validation
export const combineValidators = (...validators) => {
    return (value, fieldName) => {
        for (const validator of validators) {
            const result = validator(value, fieldName)
            if (!result.isValid) {
                return result
            }
        }
        return ValidationResult.success()
    }
}

export const conditionalValidator = (condition, validator) => {
    return (value, fieldName, formData) => {
        if (condition(value, formData)) {
            return validator(value, fieldName)
        }
        return ValidationResult.success()
    }
}

export const asyncValidator = (validatorFn) => {
    return async (value, fieldName) => {
        try {
            const isValid = await validatorFn(value)
            if (!isValid) {
                return ValidationResult.error(`${fieldName} không hợp lệ`)
            }
            return ValidationResult.success()
        } catch (error) {
            return ValidationResult.error(`Lỗi validation: ${error.message}`)
        }
    }
}

// Export all validators
export default {
    // Base validators
    required,
    minLength,
    maxLength,
    minValue,
    maxValue,
    pattern,
    oneOf,
    custom,

    // Specific validators
    email,
    phone,
    username,
    password,
    confirmPassword,
    url,
    date,
    dateRange,
    minAge,

    // File validators
    fileSize,
    fileType,
    imageFile,
    videoFile,

    // Content validators
    postContent,
    commentContent,
    messageContent,
    hashtags,
    mentions,

    // Security validators
    noXSS,
    noSQLInjection,

    // Form validator class
    FormValidator,

    // Pre-built validators
    createLoginValidator,
    createRegisterValidator,
    createPostValidator,
    createCommentValidator,
    createMessageValidator,
    createProfileValidator,
    createPasswordChangeValidator,

    // Utils
    combineValidators,
    conditionalValidator,
    asyncValidator,
    ValidationResult
}