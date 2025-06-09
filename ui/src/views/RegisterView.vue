<template>
    <div class="register-view">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-8 col-lg-6">
                    <div class="register-card">
                        <!-- Header -->
                        <div class="register-header text-center mb-4">
                            <div class="brand-logo mb-3">
                                <i class="fas fa-user-plus fa-3x text-primary"></i>
                            </div>
                            <h2 class="register-title">Tạo tài khoản</h2>
                            <p class="register-subtitle text-muted">
                                Tham gia cộng đồng và bắt đầu kết nối với mọi người
                            </p>
                        </div>

                        <!-- Multi-step Progress -->
                        <div class="progress-steps mb-4">
                            <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
                                <div class="step-number">1</div>
                                <div class="step-label">Thông tin cơ bản</div>
                            </div>
                            <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
                                <div class="step-number">2</div>
                                <div class="step-label">Tài khoản</div>
                            </div>
                            <div class="step" :class="{ active: currentStep >= 3 }">
                                <div class="step-number">3</div>
                                <div class="step-label">Hoàn thành</div>
                            </div>
                        </div>

                        <!-- Register Form -->
                        <form @submit.prevent="handleSubmit" novalidate>
                            <!-- Step 1: Basic Information -->
                            <div v-if="currentStep === 1" class="step-content">
                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group mb-3">
                                            <label class="form-label">Họ *</label>
                                            <input v-model="form.firstName" type="text" class="form-control"
                                                :class="{ 'is-invalid': errors.firstName }" placeholder="Nhập họ"
                                                @blur="validateField('firstName', form.firstName)" required>
                                            <div v-if="errors.firstName" class="invalid-feedback">
                                                {{ errors.firstName }}
                                            </div>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group mb-3">
                                            <label class="form-label">Tên *</label>
                                            <input v-model="form.lastName" type="text" class="form-control"
                                                :class="{ 'is-invalid': errors.lastName }" placeholder="Nhập tên"
                                                @blur="validateField('lastName', form.lastName)" required>
                                            <div v-if="errors.lastName" class="invalid-feedback">
                                                {{ errors.lastName }}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group mb-3">
                                    <label class="form-label">Ngày sinh</label>
                                    <input v-model="form.dateOfBirth" type="date" class="form-control" :max="maxDate">
                                </div>

                                <div class="form-group mb-4">
                                    <label class="form-label">Giới tính</label>
                                    <div class="gender-options">
                                        <div class="form-check form-check-inline">
                                            <input v-model="form.gender" type="radio" class="form-check-input" id="male"
                                                value="male">
                                            <label class="form-check-label" for="male">Nam</label>
                                        </div>
                                        <div class="form-check form-check-inline">
                                            <input v-model="form.gender" type="radio" class="form-check-input"
                                                id="female" value="female">
                                            <label class="form-check-label" for="female">Nữ</label>
                                        </div>
                                        <div class="form-check form-check-inline">
                                            <input v-model="form.gender" type="radio" class="form-check-input"
                                                id="other" value="other">
                                            <label class="form-check-label" for="other">Khác</label>
                                        </div>
                                    </div>
                                </div>

                                <button type="button" class="btn btn-primary w-100" @click="nextStep"
                                    :disabled="!canProceedStep1">
                                    Tiếp tục
                                </button>
                            </div>

                            <!-- Step 2: Account Information -->
                            <div v-if="currentStep === 2" class="step-content">
                                <div class="form-group mb-3">
                                    <label class="form-label">Email *</label>
                                    <input v-model="form.email" type="email" class="form-control"
                                        :class="{ 'is-invalid': errors.email }" placeholder="Nhập email"
                                        @blur="validateField('email', form.email)" required>
                                    <div v-if="errors.email" class="invalid-feedback">
                                        {{ errors.email }}
                                    </div>
                                </div>

                                <div class="form-group mb-3">
                                    <label class="form-label">Tên người dùng *</label>
                                    <input v-model="form.username" type="text" class="form-control"
                                        :class="{ 'is-invalid': errors.username }" placeholder="Nhập username"
                                        @blur="validateField('username', form.username)" required>
                                    <div v-if="errors.username" class="invalid-feedback">
                                        {{ errors.username }}
                                    </div>
                                    <small class="form-text text-muted">
                                        Username chỉ chứa chữ cái, số và dấu gạch dưới
                                    </small>
                                </div>

                                <div class="form-group mb-3">
                                    <label class="form-label">Mật khẩu *</label>
                                    <div class="input-group">
                                        <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                                            class="form-control" :class="{ 'is-invalid': errors.password }"
                                            placeholder="Nhập mật khẩu"
                                            @blur="validateField('password', form.password, { strength: true })"
                                            required>
                                        <button type="button" class="btn btn-outline-secondary"
                                            @click="showPassword = !showPassword">
                                            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                        </button>
                                    </div>
                                    <div v-if="errors.password" class="invalid-feedback d-block">
                                        {{ errors.password }}
                                    </div>

                                    <!-- Password Strength Indicator -->
                                    <div v-if="form.password" class="password-strength mt-2">
                                        <div class="strength-bar">
                                            <div class="strength-fill" :class="passwordStrengthClass"
                                                :style="{ width: passwordStrengthPercentage + '%' }"></div>
                                        </div>
                                        <small class="strength-text" :class="passwordStrengthClass">
                                            {{ passwordStrengthText }}
                                        </small>
                                    </div>
                                </div>

                                <div class="form-group mb-4">
                                    <label class="form-label">Xác nhận mật khẩu *</label>
                                    <input v-model="form.confirmPassword" type="password" class="form-control"
                                        :class="{ 'is-invalid': errors.confirmPassword }"
                                        placeholder="Nhập lại mật khẩu"
                                        @blur="validateField('confirmPassword', form.confirmPassword, { password: form.password })"
                                        required>
                                    <div v-if="errors.confirmPassword" class="invalid-feedback">
                                        {{ errors.confirmPassword }}
                                    </div>
                                </div>

                                <div class="step-actions">
                                    <button type="button" class="btn btn-outline-secondary me-2" @click="previousStep">
                                        Quay lại
                                    </button>
                                    <button type="button" class="btn btn-primary flex-grow-1" @click="nextStep"
                                        :disabled="!canProceedStep2">
                                        Tiếp tục
                                    </button>
                                </div>
                            </div>

                            <!-- Step 3: Terms and Submit -->
                            <div v-if="currentStep === 3" class="step-content">
                                <div class="terms-section mb-4">
                                    <div class="form-check mb-3">
                                        <input v-model="form.agreeToTerms" type="checkbox" class="form-check-input"
                                            id="agreeTerms" required>
                                        <label class="form-check-label" for="agreeTerms">
                                            Tôi đồng ý với
                                            <a href="/terms" target="_blank">Điều khoản sử dụng</a>
                                            và
                                            <a href="/privacy" target="_blank">Chính sách bảo mật</a>
                                        </label>
                                    </div>

                                    <div class="form-check mb-3">
                                        <input v-model="form.subscribeToNewsletter" type="checkbox"
                                            class="form-check-input" id="newsletter">
                                        <label class="form-check-label" for="newsletter">
                                            Nhận thông tin cập nhật và newsletter
                                        </label>
                                    </div>
                                </div>

                                <div class="step-actions">
                                    <button type="button" class="btn btn-outline-secondary me-2" @click="previousStep">
                                        Quay lại
                                    </button>
                                    <button type="submit" class="btn btn-primary flex-grow-1"
                                        :disabled="!canSubmit || isLoading">
                                        <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                                        {{ isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản' }}
                                    </button>
                                </div>
                            </div>
                        </form>

                        <!-- Login Link -->
                        <div class="login-link text-center mt-4">
                            <span class="text-muted">Đã có tài khoản? </span>
                            <router-link to="/auth/login" class="login-text">
                                Đăng nhập ngay
                            </router-link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthValidation } from '@/composables/useAuthValidation'
import { useAppStores } from '@/composables/useAppStores'
import { validatePassword } from '@/utils/validators'

const router = useRouter()
const toast = useToast()
const { authStore } = useAppStores()
const { errors, validateField, validateForm, hasErrors } = useAuthValidation()

// State
const currentStep = ref(1)
const isLoading = ref(false)
const showPassword = ref(false)

// Form data
const form = reactive({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribeToNewsletter: false
})

// Computed
const maxDate = computed(() => {
    const today = new Date()
    today.setFullYear(today.getFullYear() - 13) // Minimum age 13
    return today.toISOString().split('T')[0]
})

const canProceedStep1 = computed(() => {
    return form.firstName.trim() && form.lastName.trim()
})

const canProceedStep2 = computed(() => {
    return form.email && form.username && form.password &&
        form.confirmPassword && !hasErrors.value
})

const canSubmit = computed(() => {
    return form.agreeToTerms && canProceedStep2.value
})

const passwordStrength = computed(() => {
    if (!form.password) return { score: 0, text: '', class: '', percentage: 0 }
    return validatePassword(form.password)
})

const passwordStrengthClass = computed(() => {
    const score = passwordStrength.value.score
    if (score <= 2) return 'text-danger'
    if (score <= 3) return 'text-warning'
    return 'text-success'
})

const passwordStrengthText = computed(() => {
    const score = passwordStrength.value.score
    if (score <= 1) return 'Rất yếu'
    if (score <= 2) return 'Yếu'
    if (score <= 3) return 'Trung bình'
    if (score <= 4) return 'Mạnh'
    return 'Rất mạnh'
})

const passwordStrengthPercentage = computed(() => {
    return (passwordStrength.value.score / 5) * 100
})

// Methods
const nextStep = () => {
    if (currentStep.value < 3) {
        currentStep.value++
    }
}

const previousStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--
    }
}

const handleSubmit = async () => {
    // Final validation
    const validationRules = {
        password: { strength: true },
        confirmPassword: { password: form.password }
    }

    if (!validateForm(form, validationRules)) {
        return
    }

    if (!form.agreeToTerms) {
        toast.error('Vui lòng đồng ý với điều khoản sử dụng')
        return
    }

    isLoading.value = true

    try {
        const registerData = {
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            email: form.email.trim().toLowerCase(),
            username: form.username.trim().toLowerCase(),
            password: form.password,
            dateOfBirth: form.dateOfBirth || null,
            gender: form.gender || null,
            subscribeToNewsletter: form.subscribeToNewsletter
        }

        await authStore.register(registerData)

        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.')

        // Redirect to login or email verification page
        router.push('/auth/login?registered=true')

    } catch (error) {
        console.error('Register error:', error)

        const errorMessage = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.'
        toast.error(errorMessage)

        // Handle specific errors
        if (error.response?.status === 400) {
            const serverErrors = error.response.data?.errors || {}
            Object.keys(serverErrors).forEach(field => {
                if (errors.hasOwnProperty(field)) {
                    errors[field] = serverErrors[field][0]
                }
            })

            // Go back to appropriate step if there are errors
            if (errors.email || errors.username || errors.password) {
                currentStep.value = 2
            } else if (errors.firstName || errors.lastName) {
                currentStep.value = 1
            }
        }

    } finally {
        isLoading.value = false
    }
}

// Auto-focus first input on mount
onMounted(() => {
    const firstInput = document.querySelector('input[type="text"]')
    if (firstInput) {
        firstInput.focus()
    }
})
</script>

<style lang="scss" scoped>
.register-view {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    padding: 2rem 0;
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('/patterns/auth-pattern.svg') repeat;
        opacity: 0.1;
    }
}

.register-card {
    background: white;
    border-radius: 1rem;
    padding: 2.5rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
}

.brand-logo i {
    animation: bounce 2s infinite;
}

.register-title {
    font-weight: 700;
    color: #333;
    margin-bottom: 0.5rem;
}

.progress-steps {
    display: flex;
    justify-content: space-between;
    margin-bottom: 2rem;

    .step {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        position: relative;

        &:not(:last-child)::after {
            content: '';
            position: absolute;
            top: 15px;
            left: 60%;
            right: -40%;
            height: 2px;
            background: #e9ecef;
            z-index: 0;
        }

        &.active::after,
        &.completed::after {
            background: #667eea;
        }

        .step-number {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #e9ecef;
            color: #6c757d;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            margin-bottom: 0.5rem;
            position: relative;
            z-index: 1;
            transition: all 0.3s ease;
        }

        &.active .step-number,
        &.completed .step-number {
            background: #667eea;
            color: white;
        }

        .step-label {
            font-size: 0.8rem;
            color: #6c757d;
            text-align: center;
        }

        &.active .step-label,
        &.completed .step-label {
            color: #667eea;
            font-weight: 600;
        }
    }
}

.form-group {
    .form-label {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.5rem;
    }

    .form-control {
        border-radius: 0.5rem;
        border: 1px solid #e9ecef;
        padding: 0.75rem;

        &:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }

        &.is-invalid {
            border-color: #dc3545;
        }
    }
}

.gender-options {
    display: flex;
    gap: 2rem;
}

.password-strength {
    .strength-bar {
        height: 4px;
        background: #e9ecef;
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 0.25rem;

        .strength-fill {
            height: 100%;
            transition: width 0.3s ease;

            &.text-danger {
                background: #dc3545;
            }

            &.text-warning {
                background: #ffc107;
            }

            &.text-success {
                background: #28a745;
            }
        }
    }

    .strength-text {
        font-size: 0.75rem;
        font-weight: 600;
    }
}

.step-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea, #764ba2);
    border: none;
    border-radius: 0.5rem;
    padding: 0.75rem;
    font-weight: 600;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }
}

.terms-section {
    .form-check-label {
        a {
            color: #667eea;
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }
    }
}

.login-text {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;

    &:hover {
        text-decoration: underline;
    }
}

@keyframes bounce {

    0%,
    100% {
        transform: translateY(0);
    }

    50% {
        transform: translateY(-10px);
    }
}

@media (max-width: 576px) {
    .register-view {
        padding: 1rem;
    }

    .register-card {
        padding: 2rem 1.5rem;
    }

    .progress-steps {
        .step-label {
            font-size: 0.7rem;
        }
    }

    .gender-options {
        flex-direction: column;
        gap: 0.5rem;
    }

    .step-actions {
        flex-direction: column;
    }
}
</style>