// Form validation rules with real-time validation and error messages

import { REGEX_PATTERNS, USER_CONFIG, POST_CONFIG, MESSAGE_CONFIG } from './constants'

// Validation result structure
/**
 * Represents the result of a validation operation.
 * 
 * @param {boolean} isValid - Indicates if the validation was successful.
 * @param {string} [message=''] - An optional message providing additional context about the validation result.
 * @param {string} [field=''] - An optional field name associated with the validation result.
 */
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

/**
 * Validates that a value is not null, undefined, or empty.
 * 
 * @param {*} value - The value to validate.
 * @param {string} [fieldName='Trường này'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
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

/**
 * Validates that a value has a minimum length.
 * 
 * @param {number} min - The minimum length required.
 * @returns {Function} A validator function that takes a value and an optional field name.
 */
export const minLength = (min) => (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success() // Let required handle empty values

    const length = typeof value === 'string' ? value.trim().length : value.toString().length
    if (length < min) {
        return ValidationResult.error(`${fieldName} phải có ít nhất ${min} ký tự`)
    }
    return ValidationResult.success()
}

/**
 * Validates that a value has a maximum length.
 * 
 * @param {number} max - The maximum length allowed.
 * @returns {Function} A validator function that takes a value and an optional field name.
 */
export const maxLength = (max) => (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success()

    const length = typeof value === 'string' ? value.length : value.toString().length
    if (length > max) {
        return ValidationResult.error(`${fieldName} không được vượt quá ${max} ký tự`)
    }
    return ValidationResult.success()
}

/**
 * Validates that a value is greater than or equal to a minimum value.
 * 
 * @param {number} min - The minimum value allowed.
 * @returns {Function} A validator function that takes a value and an optional field name.
 */
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

/**
 * Validates that a value is less than or equal to a maximum value.
 * 
 * @param {number} max - The maximum value allowed.
 * @returns {Function} A validator function that takes a value and an optional field name.
 */
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

/**
 * Validates that a value matches a regular expression.
 * 
 * @param {RegExp} regex - The regular expression to validate against.
 * @param {string} [message=''] - An optional custom error message.
 * @returns {Function} A validator function that takes a value and an optional field name.
 */
export const pattern = (regex, message) => (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success()

    if (!regex.test(value)) {
        return ValidationResult.error(message || `${fieldName} không đúng định dạng`)
    }
    return ValidationResult.success()
}

/**
 * Validates that a value is one of a set of allowed values.
 * 
 * @param {Array} allowedValues - An array of allowed values.
 * @param {string} [message=''] - An optional custom error message.
 * @returns {Function} A validator function that takes a value and an optional field name.
 */
export const oneOf = (allowedValues, message) => (value, fieldName = 'Trường này') => {
    if (!value) return ValidationResult.success()

    if (!allowedValues.includes(value)) {
        return ValidationResult.error(
            message || `${fieldName} phải là một trong: ${allowedValues.join(', ')}`
        )
    }
    return ValidationResult.success()
}

/**
 * Validates a value using a custom validator function.
 * 
 * @param {Function} validatorFn - The validator function to use.
 * @param {string} [message=''] - An optional custom error message.
 * @returns {Function} A validator function that takes a value and an optional field name.
 */
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

/**
 * Validates an email address.
 * 
 * @param {string} value - The value to validate.
 * @param {string} [fieldName='Email'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
export const validateEmail = (value, fieldName = 'Email') => {
    if (!value) return ValidationResult.success()

    if (!REGEX_PATTERNS.EMAIL.test(value.trim())) {
        return ValidationResult.error('Email không đúng định dạng')
    }
    return ValidationResult.success()
}

/**
 * Validates a phone number.
 * 
 * @param {string} value - The value to validate.
 * @param {string} [fieldName='Số điện thoại'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
export const validatePhone = (value, fieldName = 'Số điện thoại') => {
    if (!value) return ValidationResult.success()

    if (!REGEX_PATTERNS.PHONE.test(value.trim())) {
        return ValidationResult.error('Số điện thoại không đúng định dạng')
    }
    return ValidationResult.success()
}

/**
 * Validates a password based on predefined criteria.
 * 
 * @param {string} value - The password value to validate.
 * @param {string} [fieldName='Mật khẩu'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 * 
 * Validates that the password:
 * - Is not empty
 * - Has a minimum length defined by USER_CONFIG.PASSWORD_MIN_LENGTH
 * - Does not exceed a maximum length defined by USER_CONFIG.PASSWORD_MAX_LENGTH
 * - Contains at least one uppercase letter, one lowercase letter, and one digit
 */
export const validatePassword = (value, fieldName = 'Mật khẩu') => {
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

/**
 * Validates that the confirm password value matches the original password value.
 * 
 * @param {string} confirmValue - The confirmation value to validate.
 * @param {string} originalValue - The original password value to compare against.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
export const confirmPassword = (confirmValue, originalValue) => {
    if (!confirmValue) return ValidationResult.success()

    if (confirmValue !== originalValue) {
        return ValidationResult.error('Xác nhận mật khẩu không khớp')
    }
    return ValidationResult.success()
}

/**
 * Validates a URL.
 * 
 * @param {string} value - The URL to validate.
 * @param {string} [fieldName='URL'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
export const url = (value, fieldName = 'URL') => {
    if (!value) return ValidationResult.success()

    if (!REGEX_PATTERNS.URL.test(value.trim())) {
        return ValidationResult.error('URL không đúng định dạng')
    }
    return ValidationResult.success()
}

/**
 * Validates a date.
 * 
 * @param {string} value - The date to validate.
 * @param {string} [fieldName='Ngày'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
export const date = (value, fieldName = 'Ngày') => {
    if (!value) return ValidationResult.success()

    const dateObj = new Date(value)
    if (isNaN(dateObj.getTime())) {
        return ValidationResult.error('Ngày không hợp lệ')
    }
    return ValidationResult.success()
}

/**
 * Validates a date range.
 * 
 * @param {string} startDate - The start date of the range.
 * @param {string} endDate - The end date of the range.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
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

/**
 * Validates that the user's age is at least the specified minimum age.
 * 
 * @param {number} minAgeYears - The minimum age in years.
 * @returns {Function} A validator function that takes a value and an optional field name.
 */
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

/**
 * Validates that the file type is one of the allowed types.
 * 
 * @param {Array} allowedTypes - An array of allowed file types.
 * @returns {Function} A validator function that takes a file and an optional field name.
 */
export const fileType = (allowedTypes) => (file, fieldName = 'File') => {
    if (!file) return ValidationResult.success()

    if (!allowedTypes.includes(file.type)) {
        return ValidationResult.error(`${fieldName} không đúng định dạng cho phép`)
    }
    return ValidationResult.success()
}

/**
 * Validates that the file is an image.
 * 
 * @param {File} file - The file to validate.
 * @param {string} [fieldName='Hình ảnh'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
export const imageFile = (file, fieldName = 'Hình ảnh') => {
    if (!file) return ValidationResult.success()

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        return ValidationResult.error('Chỉ chấp nhận file hình ảnh (JPEG, PNG, GIF, WebP)')
    }
    return ValidationResult.success()
}

/**
 * Validates that the file is a video.
 * 
 * @param {File} file - The file to validate.
 * @param {string} [fieldName='Video'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
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

/**
 * Validates the content of a comment.
 * 
 * @param {string} value - The comment content to validate.
 * @param {string} [fieldName='Bình luận'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
export const commentContent = (value, fieldName = 'Bình luận') => {
    if (!value) return ValidationResult.success()

    const trimmed = value.trim()

    if (trimmed.length > COMMENT_CONFIG.CONTENT_MAX_LENGTH) {
        return ValidationResult.error(`Bình luận không được vượt quá ${COMMENT_CONFIG.CONTENT_MAX_LENGTH} ký tự`)
    }

    return ValidationResult.success()
}

/**
 * Validates the content of a message.
 * 
 * @param {string} value - The message content to validate.
 * @param {string} [fieldName='Tin nhắn'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
export const messageContent = (value, fieldName = 'Tin nhắn') => {
    if (!value) return ValidationResult.success()

    const trimmed = value.trim()

    if (trimmed.length > MESSAGE_CONFIG.CONTENT_MAX_LENGTH) {
        return ValidationResult.error(`Tin nhắn không được vượt quá ${MESSAGE_CONFIG.CONTENT_MAX_LENGTH} ký tự`)
    }

    return ValidationResult.success()
}

/**
 * Validates hashtags in a post.
 * 
 * @param {string} value - The post content to validate hashtags in.
 * @param {string} [fieldName='Hashtags'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
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

/**
 * Validates mentions in a post.
 * 
 * @param {string} value - The post content to validate mentions in.
 * @param {string} [fieldName='Mentions'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
export const mentions = (value, fieldName = 'Mentions') => {
    if (!value) return ValidationResult.success()

    const mentions = value.match(REGEX_PATTERNS.MENTION) || []

    if (mentions.length > POST_CONFIG.MENTION_MAX_COUNT) {
        return ValidationResult.error(`Không được vượt quá ${POST_CONFIG.MENTION_MAX_COUNT} mentions`)
    }

    return ValidationResult.success()
}

/**
 * Validates that the input does not contain any XSS (Cross-Site Scripting) patterns.
 * 
 * @param {string} value - The input value to validate.
 * @param {string} [fieldName='Trường này'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
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

/**
 * Validates that the input does not contain any SQL injection patterns.
 * 
 * @param {string} value - The input value to validate.
 * @param {string} [fieldName='Trường này'] - An optional field name associated with the validation.
 * @returns {ValidationResult} A validation result indicating success or failure.
 */
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

/**
 * Form validation builder
 * 
 * @class
 */
export class FormValidator {
    constructor() {
        this.rules = new Map()
        this.errors = new Map()
        this.isValidating = false
    }

    /**
     * Add validation rule for a field
     * 
     * @param {string} fieldName - The field name to add validation rule for.
     * @param {Function} validator - The validator function to add.
     * @param {string} [trigger='blur'] - The trigger event for validation (default 'blur').
     * @returns {FormValidator} The FormValidator instance.
     */
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

    /**
     * Add multiple validators for a field
     * 
     * @param {string} fieldName - The field name to add validators for.
     * @param {Array} validators - The validators to add.
     * @param {string} [trigger='blur'] - The trigger event for validation (default 'blur').
     * @returns {FormValidator} The FormValidator instance.
     */
    field(fieldName, validators, trigger = 'blur') {
        if (!Array.isArray(validators)) {
            validators = [validators]
        }

        validators.forEach(validator => {
            this.addRule(fieldName, validator, trigger)
        })

        return this
    }

    /**
     * Validate a single field
     * 
     * @param {string} fieldName - The field name to validate.
     * @param {any} value - The value to validate.
     * @param {string} [trigger='blur'] - The trigger event for validation (default 'blur').
     * @returns {Array} An array of error messages.
     */
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

    /**
     * Validate the entire form
     * 
     * @param {Object} formData - The form data to validate.
     * @param {string} [trigger='submit'] - The trigger event for validation (default 'submit').
     * @returns {boolean} `true` if the form is valid, `false` otherwise.
     */
    validateFormData(formData, trigger = 'submit') {
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

    /**
     * Get errors for a field
     * 
     * @param {string} fieldName - The field name to get errors for.
     * @returns {Array} An array of error messages.
     */
    getFieldErrors(fieldName) {
        return this.errors.get(fieldName) || []
    }

    /**
     * Get all errors
     * 
     * @returns {Object} An object containing field names as keys and error messages as values.
     */
    getAllErrors() {
        return Object.fromEntries(this.errors)
    }

    // Check if field has errors
    /**
     * Check if a field has errors
     * 
     * @param {string} fieldName - The field name to check.
     * @returns {boolean} `true` if the field has errors, `false` otherwise.
     */
    hasFieldError(fieldName) {
        return this.errors.has(fieldName)
    }

    /**
     * Check if form has any errors
     * 
     * @returns {boolean} `true` if the form has errors, `false` otherwise.
     */
    hasErrors() {
        return this.errors.size > 0
    }

    /**
     * Clear errors for a field
     * 
     * @param {string} fieldName - The field name to clear errors for.
     */
    clearFieldErrors(fieldName) {
        this.errors.delete(fieldName)
    }

    /**
     * Clear all errors
     */
    clearAllErrors() {
        this.errors.clear()
    }

    /**
     * Reset validator
     */
    reset() {
        this.errors.clear()
        this.isValidating = false
    }
}

/** ========================
 * Pre-built form validators
 * ========================
 */
/**
 * Creates a validator for the login form.
 * 
 * @returns {FormValidator} A form validator configured to validate email and password fields.
 */
export const createLoginValidator = () => {
    return new FormValidator()
        .field('email', [required, validateEmail], 'blur')
        .field('password', [required], 'blur')
}

/**
 * Creates a validator for the register form.
 * 
 * @returns {FormValidator} A form validator configured to validate email, password, confirmPassword, firstName, lastName, birthDate, and agreeTerms fields.
 */
export const createRegisterValidator = () => {
    return new FormValidator()
        .field('email', [required, validateEmail], 'blur')
        .field('password', [required, validatePassword], 'blur')
        .field('confirmPassword', [], 'blur') // Will be handled separately
        .field('firstName', [required, minLength(2), maxLength(50)], 'blur')
        .field('lastName', [required, minLength(2), maxLength(50)], 'blur')
        .field('birthDate', [required, date, minAge(13)], 'blur')
        .field('agreeTerms', [required], 'change')
}

/**
 * Creates a validator for the post form.
 * 
 * @returns {FormValidator} A form validator configured to validate content and privacy fields.
 */
export const createPostValidator = () => {
    return new FormValidator()
        .field('content', [required, postContent, noXSS, hashtags, mentions], 'input')
        .field('privacy', [required, oneOf(['public', 'friends', 'private'])], 'change')
}

/**
 * Creates a validator for the comment form.
 * 
 * @returns {FormValidator} A form validator configured to validate content field.
 */
export const createCommentValidator = () => {
    return new FormValidator()
        .field('content', [required, commentContent, noXSS], 'input')
}

/**
 * Creates a validator for the message form.
 * 
 * @returns {FormValidator} A form validator configured to validate content field.
 */
export const createMessageValidator = () => {
    return new FormValidator()
        .field('content', [required, messageContent, noXSS], 'input')
}

/**
 * Creates a validator for the profile form.
 * 
 * @returns {FormValidator} A form validator configured to validate firstName, lastName, bio, website, and location fields.
 */
export const createProfileValidator = () => {
    return new FormValidator()
        .field('firstName', [required, minLength(2), maxLength(50)], 'blur')
        .field('lastName', [required, minLength(2), maxLength(50)], 'blur')
        .field('bio', [maxLength(USER_CONFIG.BIO_MAX_LENGTH), noXSS], 'blur')
        .field('website', [url], 'blur')
        .field('location', [maxLength(100)], 'blur')
}

/**
 * Creates a validator for the password change form.
 * 
 * @returns {FormValidator} A form validator configured to validate currentPassword, newPassword, and confirmNewPassword fields.
 */
export const createPasswordChangeValidator = () => {
    return new FormValidator()
        .field('currentPassword', [required], 'blur')
        .field('newPassword', [required, validatePassword], 'blur')
        .field('confirmNewPassword', [], 'blur') // Will be handled separately
}

/**
 * Export validation result class
 */
export { ValidationResult }

/** ===============================
 * Utility functions for validation
 * ===============================
 */

/**
 * Combines multiple validators into a single validator function.
 * 
 * @param {...Function} validators - The validators to combine.
 * @returns {Function} A validator function that takes a value and an optional field name.
 */
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

/**
 * Creates a conditional validator.
 * 
 * @param {Function} condition - The condition function to determine if the validator should be applied.
 * @param {Function} validator - The validator function to apply if the condition is true.
 * @returns {Function} A validator function that takes a value, field name, and form data.
 */
export const conditionalValidator = (condition, validator) => {
    return (value, fieldName, formData) => {
        if (condition(value, formData)) {
            return validator(value, fieldName)
        }
        return ValidationResult.success()
    }
}

/**
 * Creates an async validator.
 * 
 * @param {Function} validatorFn - The async validator function to apply.
 * @returns {Function} An async validator function that takes a value and an optional field name.
 */
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

/**
 * Export all validators
 */
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
    email: validateEmail,
    phone: validatePhone,
    password: validatePassword,
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