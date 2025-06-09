// Authentication validation logic được chia sẻ

import { ref, reactive, computed } from 'vue'
import {
    validateEmail,
    validatePassword,
    confirmPassword,
    validatePhone,
    FormValidator,
    createLoginValidator,
    createRegisterValidator
} from '@/utils/validators'

export const useAuthValidation = () => {
    const errors = reactive({})
    const isValidating = ref(false)
    const validator = ref(null)

    const validateField = (field, value, rules = {}) => {
        errors[field] = null

        switch (field) {
            case 'email':
                const emailResult = validateEmail(value)
                errors[field] = emailResult.isValid ? null : emailResult.message
                break

            case 'password':
                const passwordResult = validatePassword(value)
                errors[field] = passwordResult.isValid ? null : passwordResult.message
                break

            case 'confirmPassword':
                const confirmResult = confirmPassword(value, rules.password)
                errors[field] = confirmResult.isValid ? null : confirmResult.message
                break

            case 'firstName':
            case 'lastName':
                if (!value) {
                    errors[field] = 'Trường này là bắt buộc'
                } else if (value.length < 2) {
                    errors[field] = 'Phải có ít nhất 2 ký tự'
                } else if (value.length > 50) {
                    errors[field] = 'Không được vượt quá 50 ký tự'
                }
                break

            case 'phone':
                const phoneResult = validatePhone(value)
                errors[field] = phoneResult.isValid ? null : phoneResult.message
                break
        }

        return !errors[field]
    }

    const validateForm = (formData, formType = 'login') => {
        isValidating.value = true

        try {
            // Tạo validator phù hợp với loại form
            switch (formType) {
                case 'login':
                    validator.value = createLoginValidator()
                    break
                case 'register':
                    validator.value = createRegisterValidator()
                    // Thêm validation riêng cho confirmPassword
                    if (formData.confirmPassword !== undefined) {
                        const confirmResult = confirmPassword(formData.confirmPassword, formData.password)
                        if (!confirmResult.isValid) {
                            errors.confirmPassword = confirmResult.message
                        }
                    }
                    break
                default:
                    validator.value = new FormValidator()
            }

            // Validate form data
            const isValid = validator.value.validateFormData(formData)

            // Copy errors from validator to reactive errors object
            const validatorErrors = validator.value.getAllErrors()
            Object.keys(validatorErrors).forEach(field => {
                errors[field] = validatorErrors[field]?.[0] || null
            })

            return isValid && !hasErrors.value
        } catch (error) {
            console.error('Validation error:', error)
            return false
        } finally {
            isValidating.value = false
        }
    }

    const validateFormWithRules = (formData, customRules = {}) => {
        isValidating.value = true

        try {
            const formValidator = new FormValidator()

            // Add custom rules
            Object.entries(customRules).forEach(([field, rules]) => {
                if (Array.isArray(rules)) {
                    formValidator.addRule(field, rules)
                } else {
                    formValidator.addRule(field, [rules])
                }
            })

            const isValid = formValidator.validateFormData(formData)

            // Copy errors
            const validatorErrors = formValidator.getAllErrors()
            Object.keys(validatorErrors).forEach(field => {
                errors[field] = validatorErrors[field]?.[0] || null
            })

            return isValid
        } catch (error) {
            console.error('Custom validation error:', error)
            return false
        } finally {
            isValidating.value = false
        }
    }

    // Real-time validation for specific field
    const validateFieldRealtime = (field, value, trigger = 'blur') => {
        if (!validator.value) return true

        const isValid = validator.value.validateField(field, value, trigger)
        const fieldErrors = validator.value.getFieldErrors(field)

        errors[field] = fieldErrors?.[0] || null

        return isValid
    }

    const clearFieldError = (field) => {
        errors[field] = null
        validator.value?.clearFieldErrors(field)
    }

    const clearErrors = () => {
        Object.keys(errors).forEach(key => {
            errors[key] = null
        })
        validator.value?.clearAllErrors()
    }

    const hasErrors = computed(() => {
        return Object.values(errors).some(error => error !== null && error !== '')
    })

    const getFieldError = (field) => {
        return errors[field] || null
    }

    return {
        errors,
        isValidating,
        validator,
        validateField,
        validateForm,
        validateFormWithRules,
        validateFieldRealtime,
        clearErrors,
        clearFieldError,
        hasErrors,
        getFieldError
    }
}

export default useAuthValidation