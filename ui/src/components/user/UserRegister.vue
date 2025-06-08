<!-- Component đăng ký tài khoản người dùng với validation và WebSocket real-time -->

<template>
    <div class="user-register">
        <div class="register-container">
            <!-- Header -->
            <div class="register-header text-center mb-4">
                <div class="logo mb-3">
                    <i class="fas fa-user-plus text-primary fs-1"></i>
                </div>
                <h2 class="h4 fw-bold mb-2">Tạo tài khoản mới</h2>
                <p class="text-muted">Tham gia cộng đồng của chúng tôi ngay hôm nay</p>
            </div>

            <!-- Registration Form -->
            <form @submit.prevent="handleRegister" class="register-form">
                <!-- Step Indicator -->
                <div class="step-indicator mb-4">
                    <div class="steps d-flex justify-content-center">
                        <div class="step" :class="{ active: currentStep >= 1 }">
                            <div class="step-number">1</div>
                            <div class="step-label">Thông tin cơ bản</div>
                        </div>
                        <div class="step-divider"></div>
                        <div class="step" :class="{ active: currentStep >= 2 }">
                            <div class="step-number">2</div>
                            <div class="step-label">Xác minh</div>
                        </div>
                        <div class="step-divider"></div>
                        <div class="step" :class="{ active: currentStep >= 3 }">
                            <div class="step-number">3</div>
                            <div class="step-label">Hoàn thành</div>
                        </div>
                    </div>
                </div>

                <!-- Step 1: Basic Information -->
                <div v-if="currentStep === 1" class="step-content">
                    <!-- Name Fields -->
                    <div class="row mb-3">
                        <div class="col-md-6">
                            <label for="firstName" class="form-label">Họ *</label>
                            <input type="text" id="firstName" v-model="form.firstName" class="form-control"
                                :class="{ 'is-invalid': errors.firstName }" placeholder="Nhập họ của bạn"
                                @blur="validateField('firstName')" @input="clearError('firstName')" />
                            <div v-if="errors.firstName" class="invalid-feedback">
                                {{ errors.firstName }}
                            </div>
                        </div>
                        <div class="col-md-6">
                            <label for="lastName" class="form-label">Tên *</label>
                            <input type="text" id="lastName" v-model="form.lastName" class="form-control"
                                :class="{ 'is-invalid': errors.lastName }" placeholder="Nhập tên của bạn"
                                @blur="validateField('lastName')" @input="clearError('lastName')" />
                            <div v-if="errors.lastName" class="invalid-feedback">
                                {{ errors.lastName }}
                            </div>
                        </div>
                    </div>

                    <!-- Email -->
                    <div class="mb-3">
                        <label for="email" class="form-label">Email *</label>
                        <div class="input-group">
                            <span class="input-group-text">
                                <i class="fas fa-envelope"></i>
                            </span>
                            <input type="email" id="email" v-model="form.email" class="form-control" :class="{
                                'is-invalid': errors.email,
                                'is-valid': emailValidation.isValid && form.email
                            }" placeholder="example@email.com" @blur="validateField('email')"
                                @input="handleEmailInput" />
                            <div v-if="emailValidation.isChecking" class="input-group-text">
                                <div class="spinner-border spinner-border-sm text-secondary" role="status">
                                    <span class="visually-hidden">Đang kiểm tra...</span>
                                </div>
                            </div>
                        </div>
                        <div v-if="errors.email" class="invalid-feedback d-block">
                            {{ errors.email }}
                        </div>
                        <div v-else-if="emailValidation.isAvailable && form.email" class="valid-feedback d-block">
                            <i class="fas fa-check me-1"></i>Email có thể sử dụng
                        </div>
                    </div>

                    <!-- Username -->
                    <div class="mb-3">
                        <label for="username" class="form-label">Tên đăng nhập *</label>
                        <div class="input-group">
                            <span class="input-group-text">@</span>
                            <input type="text" id="username" v-model="form.username" class="form-control" :class="{
                                'is-invalid': errors.username,
                                'is-valid': usernameValidation.isValid && form.username
                            }" placeholder="username" @blur="validateField('username')" @input="handleUsernameInput" />
                            <div v-if="usernameValidation.isChecking" class="input-group-text">
                                <div class="spinner-border spinner-border-sm text-secondary" role="status">
                                    <span class="visually-hidden">Đang kiểm tra...</span>
                                </div>
                            </div>
                        </div>
                        <div v-if="errors.username" class="invalid-feedback d-block">
                            {{ errors.username }}
                        </div>
                        <div v-else-if="usernameValidation.isAvailable && form.username" class="valid-feedback d-block">
                            <i class="fas fa-check me-1"></i>Tên đăng nhập có thể sử dụng
                        </div>
                        <small class="form-text text-muted">
                            Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới
                        </small>
                    </div>

                    <!-- Password -->
                    <div class="mb-3">
                        <label for="password" class="form-label">Mật khẩu *</label>
                        <div class="input-group">
                            <input :type="showPassword ? 'text' : 'password'" id="password" v-model="form.password"
                                class="form-control" :class="{ 'is-invalid': errors.password }"
                                placeholder="Nhập mật khẩu" @blur="validateField('password')"
                                @input="handlePasswordInput" />
                            <button type="button" class="btn btn-outline-secondary" @click="togglePasswordVisibility">
                                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                            </button>
                        </div>
                        <div v-if="errors.password" class="invalid-feedback d-block">
                            {{ errors.password }}
                        </div>

                        <!-- Password Strength -->
                        <div v-if="form.password" class="password-strength mt-2">
                            <div class="progress" style="height: 4px;">
                                <div class="progress-bar" :class="passwordStrength.color"
                                    :style="{ width: passwordStrength.percentage + '%' }"></div>
                            </div>
                            <small class="form-text" :class="passwordStrength.textColor">
                                {{ passwordStrength.text }}
                            </small>
                        </div>
                    </div>

                    <!-- Confirm Password -->
                    <div class="mb-3">
                        <label for="confirmPassword" class="form-label">Xác nhận mật khẩu *</label>
                        <input :type="showConfirmPassword ? 'text' : 'password'" id="confirmPassword"
                            v-model="form.confirmPassword" class="form-control" :class="{
                                'is-invalid': errors.confirmPassword,
                                'is-valid': form.confirmPassword && form.password === form.confirmPassword
                            }" placeholder="Nhập lại mật khẩu" @blur="validateField('confirmPassword')"
                            @input="clearError('confirmPassword')" />
                        <div v-if="errors.confirmPassword" class="invalid-feedback">
                            {{ errors.confirmPassword }}
                        </div>
                    </div>

                    <!-- Terms Agreement -->
                    <div class="mb-4">
                        <div class="form-check">
                            <input type="checkbox" id="agreeTerms" v-model="form.agreeTerms" class="form-check-input"
                                :class="{ 'is-invalid': errors.agreeTerms }" />
                            <label for="agreeTerms" class="form-check-label">
                                Tôi đồng ý với
                                <router-link to="/terms" target="_blank" class="text-primary">
                                    Điều khoản sử dụng
                                </router-link>
                                và
                                <router-link to="/privacy" target="_blank" class="text-primary">
                                    Chính sách bảo mật
                                </router-link>
                            </label>
                            <div v-if="errors.agreeTerms" class="invalid-feedback d-block">
                                {{ errors.agreeTerms }}
                            </div>
                        </div>
                    </div>

                    <!-- Navigation Buttons -->
                    <div class="d-flex justify-content-between">
                        <router-link to="/login" class="btn btn-outline-secondary">
                            <i class="fas fa-arrow-left me-2"></i>Đã có tài khoản?
                        </router-link>
                        <button type="button" class="btn btn-primary" @click="nextStep" :disabled="!canProceedToStep2">
                            Tiếp tục
                            <i class="fas fa-arrow-right ms-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 2: Verification -->
                <div v-if="currentStep === 2" class="step-content">
                    <div class="text-center mb-4">
                        <i class="fas fa-envelope-open-text text-primary fs-1 mb-3"></i>
                        <h5>Xác minh email</h5>
                        <p class="text-muted">
                            Chúng tôi đã gửi mã xác minh đến<br>
                            <strong>{{ form.email }}</strong>
                        </p>
                    </div>

                    <!-- Verification Code -->
                    <div class="mb-3">
                        <label for="verificationCode" class="form-label">Mã xác minh</label>
                        <input type="text" id="verificationCode" v-model="verificationCode"
                            class="form-control text-center" :class="{ 'is-invalid': errors.verificationCode }"
                            placeholder="Nhập mã 6 số" maxlength="6" @input="handleVerificationInput" />
                        <div v-if="errors.verificationCode" class="invalid-feedback">
                            {{ errors.verificationCode }}
                        </div>
                    </div>

                    <!-- Resend Code -->
                    <div class="text-center mb-4">
                        <p class="text-muted small mb-2">Không nhận được mã?</p>
                        <button type="button" class="btn btn-link btn-sm" @click="resendVerificationCode"
                            :disabled="resendCooldown > 0">
                            <span v-if="resendCooldown > 0">
                                Gửi lại sau {{ resendCooldown }}s
                            </span>
                            <span v-else>
                                <i class="fas fa-refresh me-1"></i>Gửi lại mã
                            </span>
                        </button>
                    </div>

                    <!-- Navigation Buttons -->
                    <div class="d-flex justify-content-between">
                        <button type="button" class="btn btn-outline-secondary" @click="previousStep">
                            <i class="fas fa-arrow-left me-2"></i>Quay lại
                        </button>
                        <button type="button" class="btn btn-primary" @click="verifyCode"
                            :disabled="!verificationCode || verificationCode.length !== 6">
                            Xác minh
                            <i class="fas fa-check ms-2"></i>
                        </button>
                    </div>
                </div>

                <!-- Step 3: Success -->
                <div v-if="currentStep === 3" class="step-content text-center">
                    <div class="success-animation mb-4">
                        <i class="fas fa-check-circle text-success fs-1 mb-3"></i>
                        <h5 class="text-success">Đăng ký thành công!</h5>
                        <p class="text-muted">
                            Tài khoản của bạn đã được tạo thành công.<br>
                            Chào mừng bạn đến với cộng đồng của chúng tôi!
                        </p>
                    </div>

                    <div class="d-grid gap-2">
                        <button type="button" class="btn btn-primary btn-lg" @click="goToLogin">
                            <i class="fas fa-sign-in-alt me-2"></i>Đăng nhập ngay
                        </button>
                        <router-link to="/" class="btn btn-outline-secondary">
                            Về trang chủ
                        </router-link>
                    </div>
                </div>
            </form>

            <!-- Loading Overlay -->
            <div v-if="isLoading" class="loading-overlay">
                <div class="loading-content">
                    <div class="spinner-border text-primary mb-3" role="status">
                        <span class="visually-hidden">Đang xử lý...</span>
                    </div>
                    <p class="text-muted">{{ loadingMessage }}</p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'
import { userAPI } from '@/api/userAPI'

// Dependencies
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// State
const currentStep = ref(1)
const isLoading = ref(false)
const loadingMessage = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const verificationCode = ref('')
const resendCooldown = ref(0)

// Form data
const form = ref({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false
})

// Validation states
const errors = ref({})
const emailValidation = ref({
    isChecking: false,
    isValid: false,
    isAvailable: false
})
const usernameValidation = ref({
    isChecking: false,
    isValid: false,
    isAvailable: false
})

// Computed
const canProceedToStep2 = computed(() => {
    return form.value.firstName &&
        form.value.lastName &&
        form.value.email &&
        form.value.username &&
        form.value.password &&
        form.value.confirmPassword &&
        form.value.agreeTerms &&
        emailValidation.value.isAvailable &&
        usernameValidation.value.isAvailable &&
        form.value.password === form.value.confirmPassword &&
        Object.keys(errors.value).length === 0
})

const passwordStrength = computed(() => {
    const password = form.value.password
    if (!password) return { percentage: 0, color: '', text: '', textColor: '' }

    let score = 0
    let feedback = []

    // Length check
    if (password.length >= 8) score += 25
    else feedback.push('ít nhất 8 ký tự')

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 25
    else feedback.push('chữ hoa')

    // Lowercase check
    if (/[a-z]/.test(password)) score += 25
    else feedback.push('chữ thường')

    // Number or special char check
    if (/[\d\W]/.test(password)) score += 25
    else feedback.push('số hoặc ký tự đặc biệt')

    let color, text, textColor
    if (score < 50) {
        color = 'bg-danger'
        text = `Yếu (thiếu: ${feedback.join(', ')})`
        textColor = 'text-danger'
    } else if (score < 75) {
        color = 'bg-warning'
        text = `Trung bình (thiếu: ${feedback.join(', ')})`
        textColor = 'text-warning'
    } else if (score < 100) {
        color = 'bg-info'
        text = 'Khá mạnh'
        textColor = 'text-info'
    } else {
        color = 'bg-success'
        text = 'Rất mạnh'
        textColor = 'text-success'
    }

    return { percentage: score, color, text, textColor }
})

// Methods
const validateField = (field) => {
    switch (field) {
        case 'firstName':
            if (!form.value.firstName.trim()) {
                errors.value.firstName = 'Họ không được để trống'
            } else if (form.value.firstName.length < 2) {
                errors.value.firstName = 'Họ phải có ít nhất 2 ký tự'
            }
            break

        case 'lastName':
            if (!form.value.lastName.trim()) {
                errors.value.lastName = 'Tên không được để trống'
            } else if (form.value.lastName.length < 2) {
                errors.value.lastName = 'Tên phải có ít nhất 2 ký tự'
            }
            break

        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!form.value.email.trim()) {
                errors.value.email = 'Email không được để trống'
            } else if (!emailRegex.test(form.value.email)) {
                errors.value.email = 'Email không hợp lệ'
            }
            break

        case 'username':
            const usernameRegex = /^[a-zA-Z0-9_]+$/
            if (!form.value.username.trim()) {
                errors.value.username = 'Tên đăng nhập không được để trống'
            } else if (form.value.username.length < 3) {
                errors.value.username = 'Tên đăng nhập phải có ít nhất 3 ký tự'
            } else if (!usernameRegex.test(form.value.username)) {
                errors.value.username = 'Tên đăng nhập chỉ chứa chữ cái, số và dấu gạch dưới'
            }
            break

        case 'password':
            if (!form.value.password) {
                errors.value.password = 'Mật khẩu không được để trống'
            } else if (form.value.password.length < 8) {
                errors.value.password = 'Mật khẩu phải có ít nhất 8 ký tự'
            }
            break

        case 'confirmPassword':
            if (!form.value.confirmPassword) {
                errors.value.confirmPassword = 'Vui lòng xác nhận mật khẩu'
            } else if (form.value.password !== form.value.confirmPassword) {
                errors.value.confirmPassword = 'Mật khẩu xác nhận không khớp'
            }
            break

        case 'agreeTerms':
            if (!form.value.agreeTerms) {
                errors.value.agreeTerms = 'Bạn phải đồng ý với điều khoản sử dụng'
            }
            break
    }
}

const clearError = (field) => {
    if (errors.value[field]) {
        delete errors.value[field]
    }
}

const checkEmailAvailability = debounce(async (email) => {
    if (!email || errors.value.email) return

    emailValidation.value.isChecking = true
    try {
        const response = await userAPI.checkEmailAvailability(email)
        emailValidation.value.isAvailable = response.available
        emailValidation.value.isValid = true

        if (!response.available) {
            errors.value.email = 'Email này đã được sử dụng'
        }
    } catch (error) {
        console.error('Error checking email:', error)
        errors.value.email = 'Không thể kiểm tra email, vui lòng thử lại'
    } finally {
        emailValidation.value.isChecking = false
    }
}, 500)

const checkUsernameAvailability = debounce(async (username) => {
    if (!username || errors.value.username) return

    usernameValidation.value.isChecking = true
    try {
        const response = await userAPI.checkUsernameAvailability(username)
        usernameValidation.value.isAvailable = response.available
        usernameValidation.value.isValid = true

        if (!response.available) {
            errors.value.username = 'Tên đăng nhập này đã được sử dụng'
        }
    } catch (error) {
        console.error('Error checking username:', error)
        errors.value.username = 'Không thể kiểm tra tên đăng nhập, vui lòng thử lại'
    } finally {
        usernameValidation.value.isChecking = false
    }
}, 500)

const handleEmailInput = () => {
    clearError('email')
    emailValidation.value.isValid = false
    emailValidation.value.isAvailable = false

    validateField('email')
    if (!errors.value.email) {
        checkEmailAvailability(form.value.email)
    }
}

const handleUsernameInput = () => {
    clearError('username')
    usernameValidation.value.isValid = false
    usernameValidation.value.isAvailable = false

    validateField('username')
    if (!errors.value.username) {
        checkUsernameAvailability(form.value.username)
    }
}

const handlePasswordInput = () => {
    clearError('password')
    validateField('password')

    // Revalidate confirm password if it exists
    if (form.value.confirmPassword) {
        validateField('confirmPassword')
    }
}

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value
}

const nextStep = () => {
    // Validate all fields
    Object.keys(form.value).forEach(field => {
        if (field !== 'confirmPassword') {
            validateField(field)
        }
    })
    validateField('confirmPassword')

    if (canProceedToStep2.value) {
        currentStep.value = 2
        sendVerificationCode()
    } else {
        toast.error('Vui lòng điền đầy đủ thông tin hợp lệ')
    }
}

const previousStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--
    }
}

const sendVerificationCode = async () => {
    isLoading.value = true
    loadingMessage.value = 'Đang gửi mã xác minh...'

    try {
        await userAPI.sendVerificationCode(form.value.email)
        toast.success('Mã xác minh đã được gửi đến email của bạn')
        startResendCooldown()
    } catch (error) {
        console.error('Error sending verification code:', error)
        toast.error('Không thể gửi mã xác minh, vui lòng thử lại')
        currentStep.value = 1
    } finally {
        isLoading.value = false
    }
}

const resendVerificationCode = async () => {
    if (resendCooldown.value > 0) return
    await sendVerificationCode()
}

const startResendCooldown = () => {
    resendCooldown.value = 60
    const timer = setInterval(() => {
        resendCooldown.value--
        if (resendCooldown.value <= 0) {
            clearInterval(timer)
        }
    }, 1000)
}

const handleVerificationInput = () => {
    clearError('verificationCode')
    // Auto-verify when 6 digits entered
    if (verificationCode.value.length === 6) {
        verifyCode()
    }
}

const verifyCode = async () => {
    if (!verificationCode.value || verificationCode.value.length !== 6) {
        errors.value.verificationCode = 'Mã xác minh phải có 6 số'
        return
    }

    isLoading.value = true
    loadingMessage.value = 'Đang xác minh mã...'

    try {
        await userAPI.verifyEmail(form.value.email, verificationCode.value)
        currentStep.value = 3
        await handleRegister()
    } catch (error) {
        console.error('Error verifying code:', error)
        errors.value.verificationCode = 'Mã xác minh không chính xác'
        toast.error('Mã xác minh không chính xác')
    } finally {
        isLoading.value = false
    }
}

const handleRegister = async () => {
    isLoading.value = true
    loadingMessage.value = 'Đang tạo tài khoản...'

    try {
        const registerData = {
            firstName: form.value.firstName,
            lastName: form.value.lastName,
            email: form.value.email,
            username: form.value.username,
            password: form.value.password
        }

        await authStore.register(registerData)
        toast.success('Đăng ký thành công!')

        // Don't auto-login, let user login manually
        // This is more secure for email verification flow
    } catch (error) {
        console.error('Registration error:', error)
        toast.error('Đăng ký thất bại, vui lòng thử lại')
        currentStep.value = 1
    } finally {
        isLoading.value = false
    }
}

const goToLogin = () => {
    router.push('/login')
}

// Lifecycle
onMounted(() => {
    // Focus first input
    const firstInput = document.querySelector('#firstName')
    if (firstInput) {
        firstInput.focus()
    }
})
</script>

<style scoped>
.user-register {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 1rem;
}

.register-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    padding: 2rem;
    width: 100%;
    max-width: 500px;
    position: relative;
}

.step-indicator {
    margin-bottom: 2rem;
}

.steps {
    align-items: center;
    gap: 1rem;
}

.step {
    display: flex;
    flex-direction: column;
    align-items: center;
    opacity: 0.5;
    transition: opacity 0.3s ease;
}

.step.active {
    opacity: 1;
}

.step-number {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--bs-secondary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    margin-bottom: 0.5rem;
    transition: background-color 0.3s ease;
}

.step.active .step-number {
    background: var(--bs-primary);
}

.step-label {
    font-size: 0.75rem;
    text-align: center;
    color: var(--bs-secondary);
    transition: color 0.3s ease;
}

.step.active .step-label {
    color: var(--bs-primary);
}

.step-divider {
    flex: 1;
    height: 2px;
    background: var(--bs-border-color);
    max-width: 50px;
}

.password-strength {
    margin-top: 0.5rem;
}

.loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 1rem;
    z-index: 10;
}

.loading-content {
    text-align: center;
}

.success-animation i {
    animation: checkmark 0.5s ease-in-out;
}

@keyframes checkmark {
    0% {
        transform: scale(0);
    }

    50% {
        transform: scale(1.2);
    }

    100% {
        transform: scale(1);
    }
}

@media (max-width: 768px) {
    .register-container {
        margin: 1rem;
        padding: 1.5rem;
    }

    .steps {
        gap: 0.5rem;
    }

    .step-number {
        width: 30px;
        height: 30px;
        font-size: 0.875rem;
    }

    .step-label {
        font-size: 0.625rem;
    }
}
</style>