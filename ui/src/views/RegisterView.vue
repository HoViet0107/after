<template>
    <div class="register-view">
        <div class="container-fluid h-100">
            <div class="row h-100">
                <!-- Left Side - Registration Form -->
                <div class="col-lg-6 register-form-section">
                    <div class="register-form-container">
                        <!-- Mobile Logo -->
                        <div class="mobile-logo d-lg-none">
                            <i class="fas fa-comments-dots text-primary"></i>
                            <h2>Social Connect</h2>
                        </div>

                        <!-- Registration Form -->
                        <div class="register-form">
                            <div class="form-header">
                                <h3>Tạo tài khoản</h3>
                                <p class="text-muted">Tham gia cộng đồng của chúng tôi</p>
                            </div>

                            <!-- Error Alert -->
                            <div v-if="registerErrors.general" class="alert alert-danger" role="alert">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                {{ registerErrors.general }}
                            </div>

                            <!-- Registration Form -->
                            <form @submit.prevent="handleRegister" novalidate>
                                <!-- Name Fields -->
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <label for="firstName" class="form-label">Họ</label>
                                        <input id="firstName" v-model="registerForm.firstName" type="text"
                                            class="form-control" :class="{ 'is-invalid': registerErrors.firstName }"
                                            placeholder="Nhập họ" autocomplete="given-name" required />
                                        <div v-if="registerErrors.firstName" class="invalid-feedback">
                                            {{ registerErrors.firstName }}
                                        </div>
                                    </div>
                                    <div class="col-6">
                                        <label for="lastName" class="form-label">Tên</label>
                                        <input id="lastName" v-model="registerForm.lastName" type="text"
                                            class="form-control" :class="{ 'is-invalid': registerErrors.lastName }"
                                            placeholder="Nhập tên" autocomplete="family-name" required />
                                        <div v-if="registerErrors.lastName" class="invalid-feedback">
                                            {{ registerErrors.lastName }}
                                        </div>
                                    </div>
                                </div>

                                <!-- Username Field -->
                                <div class="mb-3">
                                    <label for="username" class="form-label">Tên người dùng</label>
                                    <div class="input-group">
                                        <span class="input-group-text">@</span>
                                        <input id="username" v-model="registerForm.username" type="text"
                                            class="form-control" :class="{ 'is-invalid': registerErrors.username }"
                                            placeholder="Tên người dùng" autocomplete="username" required
                                            @input="checkUsernameAvailability" />
                                    </div>
                                    <div v-if="registerErrors.username" class="invalid-feedback">
                                        {{ registerErrors.username }}
                                    </div>
                                    <div v-else-if="usernameStatus.checking" class="form-text">
                                        <i class="fas fa-spinner fa-spin me-1"></i>
                                        Đang kiểm tra...
                                    </div>
                                    <div v-else-if="usernameStatus.available" class="form-text text-success">
                                        <i class="fas fa-check me-1"></i>
                                        Tên người dùng khả dụng
                                    </div>
                                    <div v-else-if="usernameStatus.taken" class="form-text text-danger">
                                        <i class="fas fa-times me-1"></i>
                                        Tên người dùng đã được sử dụng
                                    </div>
                                </div>

                                <!-- Email Field -->
                                <div class="mb-3">
                                    <label for="email" class="form-label">Email</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-envelope"></i>
                                        </span>
                                        <input id="email" v-model="registerForm.email" type="email" class="form-control"
                                            :class="{ 'is-invalid': registerErrors.email }" placeholder="Nhập email"
                                            autocomplete="email" required />
                                    </div>
                                    <div v-if="registerErrors.email" class="invalid-feedback">
                                        {{ registerErrors.email }}
                                    </div>
                                </div>

                                <!-- Password Field -->
                                <div class="mb-3">
                                    <label for="password" class="form-label">Mật khẩu</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-lock"></i>
                                        </span>
                                        <input id="password" v-model="registerForm.password"
                                            :type="showPassword ? 'text' : 'password'" class="form-control"
                                            :class="{ 'is-invalid': registerErrors.password }"
                                            placeholder="Nhập mật khẩu" autocomplete="new-password" required />
                                        <button type="button" class="btn btn-outline-secondary"
                                            @click="togglePasswordVisibility">
                                            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                        </button>
                                    </div>
                                    <div v-if="registerErrors.password" class="invalid-feedback">
                                        {{ registerErrors.password }}
                                    </div>

                                    <!-- Password Strength Indicator -->
                                    <div v-if="registerForm.password" class="password-strength mt-2">
                                        <div class="strength-bar">
                                            <div class="strength-fill" :class="passwordStrength.class"
                                                :style="{ width: passwordStrength.width }"></div>
                                        </div>
                                        <small :class="passwordStrength.textClass">
                                            {{ passwordStrength.text }}
                                        </small>
                                    </div>
                                </div>

                                <!-- Confirm Password Field -->
                                <div class="mb-3">
                                    <label for="confirmPassword" class="form-label">Xác nhận mật khẩu</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-lock"></i>
                                        </span>
                                        <input id="confirmPassword" v-model="registerForm.confirmPassword"
                                            :type="showConfirmPassword ? 'text' : 'password'" class="form-control"
                                            :class="{ 'is-invalid': registerErrors.confirmPassword }"
                                            placeholder="Nhập lại mật khẩu" autocomplete="new-password" required />
                                        <button type="button" class="btn btn-outline-secondary"
                                            @click="toggleConfirmPasswordVisibility">
                                            <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                        </button>
                                    </div>
                                    <div v-if="registerErrors.confirmPassword" class="invalid-feedback">
                                        {{ registerErrors.confirmPassword }}
                                    </div>
                                </div>

                                <!-- Terms Agreement -->
                                <div class="mb-3">
                                    <div class="form-check">
                                        <input id="agreeToTerms" v-model="registerForm.agreeToTerms"
                                            class="form-check-input"
                                            :class="{ 'is-invalid': registerErrors.agreeToTerms }" type="checkbox"
                                            required />
                                        <label class="form-check-label" for="agreeToTerms">
                                            Tôi đồng ý với
                                            <a href="#" @click.prevent="showTerms = true">Điều khoản sử dụng</a>
                                            và
                                            <a href="#" @click.prevent="showPrivacy = true">Chính sách bảo mật</a>
                                        </label>
                                    </div>
                                    <div v-if="registerErrors.agreeToTerms" class="invalid-feedback d-block">
                                        {{ registerErrors.agreeToTerms }}
                                    </div>
                                </div>

                                <!-- Register Button -->
                                <button type="submit" class="btn btn-primary w-100 mb-3"
                                    :disabled="isRegistering || !isFormValid">
                                    <span v-if="isRegistering" class="spinner-border spinner-border-sm me-2"></span>
                                    <i v-else class="fas fa-user-plus me-2"></i>
                                    {{ isRegistering ? 'Đang tạo tài khoản...' : 'Tạo tài khoản' }}
                                </button>

                                <!-- Social Registration -->
                                <div class="social-register">
                                    <div class="divider">
                                        <span>hoặc</span>
                                    </div>

                                    <div class="social-buttons">
                                        <button type="button" class="btn btn-outline-danger w-100 mb-2"
                                            @click="registerWithGoogle" :disabled="isRegistering">
                                            <i class="fab fa-google me-2"></i>
                                            Đăng ký với Google
                                        </button>

                                        <button type="button" class="btn btn-outline-primary w-100"
                                            @click="registerWithFacebook" :disabled="isRegistering">
                                            <i class="fab fa-facebook-f me-2"></i>
                                            Đăng ký với Facebook
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <!-- Login Link -->
                            <div class="login-link text-center">
                                <p class="mb-0">
                                    Đã có tài khoản?
                                    <router-link to="/auth/login" class="text-decoration-none">
                                        Đăng nhập ngay
                                    </router-link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Side - Benefits -->
                <div class="col-lg-6 d-none d-lg-flex register-benefits">
                    <div class="benefits-content">
                        <div class="benefits-header">
                            <i class="fas fa-star text-warning"></i>
                            <h2>Tại sao chọn Social Connect?</h2>
                            <p>Trải nghiệm mạng xã hội hoàn toàn mới</p>
                        </div>

                        <div class="benefits-list">
                            <div class="benefit-item">
                                <div class="benefit-icon">
                                    <i class="fas fa-shield-alt"></i>
                                </div>
                                <div class="benefit-content">
                                    <h5>Bảo mật tuyệt đối</h5>
                                    <p>Thông tin cá nhân được bảo vệ với công nghệ mã hóa tiên tiến</p>
                                </div>
                            </div>

                            <div class="benefit-item">
                                <div class="benefit-icon">
                                    <i class="fas fa-rocket"></i>
                                </div>
                                <div class="benefit-content">
                                    <h5>Tốc độ vượt trội</h5>
                                    <p>Trải nghiệm nhanh chóng và mượt mà trên mọi thiết bị</p>
                                </div>
                            </div>

                            <div class="benefit-item">
                                <div class="benefit-icon">
                                    <i class="fas fa-heart"></i>
                                </div>
                                <div class="benefit-content">
                                    <h5>Kết nối ý nghĩa</h5>
                                    <p>Tìm kiếm và duy trì những mối quan hệ thật sự có giá trị</p>
                                </div>
                            </div>

                            <div class="benefit-item">
                                <div class="benefit-icon">
                                    <i class="fas fa-cog"></i>
                                </div>
                                <div class="benefit-content">
                                    <h5>Tùy chỉnh linh hoạt</h5>
                                    <p>Cá nhân hóa trải nghiệm theo sở thích của riêng bạn</p>
                                </div>
                            </div>
                        </div>

                        <div class="benefits-footer">
                            <div class="stats">
                                <div class="stat-item">
                                    <strong>1M+</strong>
                                    <span>Người dùng</span>
                                </div>
                                <div class="stat-item">
                                    <strong>50M+</strong>
                                    <span>Tin nhắn</span>
                                </div>
                                <div class="stat-item">
                                    <strong>99.9%</strong>
                                    <span>Uptime</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Terms Modal -->
        <div v-if="showTerms" class="modal d-block" tabindex="-1" @click.self="showTerms = false">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Điều khoản sử dụng</h5>
                        <button type="button" class="btn-close" @click="showTerms = false"></button>
                    </div>
                    <div class="modal-body">
                        <p>Đây là nội dung điều khoản sử dụng...</p>
                        <!-- Add full terms content here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="showTerms = false">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Privacy Modal -->
        <div v-if="showPrivacy" class="modal d-block" tabindex="-1" @click.self="showPrivacy = false">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Chính sách bảo mật</h5>
                        <button type="button" class="btn-close" @click="showPrivacy = false"></button>
                    </div>
                    <div class="modal-body">
                        <p>Đây là nội dung chính sách bảo mật...</p>
                        <!-- Add full privacy policy content here -->
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="showPrivacy = false">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'

// Dependencies
const {
    registerForm,
    registerErrors,
    isRegistering,
    handleRegister: authRegister,
    validateRegisterForm
} = useAuth()
const toast = useToast()

// State
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showTerms = ref(false)
const showPrivacy = ref(false)
const usernameStatus = ref({
    checking: false,
    available: null,
    taken: null
})

// Computed
const isFormValid = computed(() => {
    return registerForm.value.firstName &&
        registerForm.value.lastName &&
        registerForm.value.username &&
        registerForm.value.email &&
        registerForm.value.password &&
        registerForm.value.confirmPassword &&
        registerForm.value.agreeToTerms &&
        !usernameStatus.value.taken
})

const passwordStrength = computed(() => {
    const password = registerForm.value.password
    if (!password) return { width: '0%', class: '', textClass: '', text: '' }

    let score = 0
    let feedback = []

    // Length check
    if (password.length >= 8) score += 1
    else feedback.push('Ít nhất 8 ký tự')

    // Uppercase check
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Chữ hoa')

    // Lowercase check
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Chữ thường')

    // Number check
    if (/\d/.test(password)) score += 1
    else feedback.push('Số')

    // Special character check
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else feedback.push('Ký tự đặc biệt')

    const strength = {
        0: { width: '20%', class: 'strength-very-weak', textClass: 'text-danger', text: 'Rất yếu' },
        1: { width: '20%', class: 'strength-very-weak', textClass: 'text-danger', text: 'Rất yếu' },
        2: { width: '40%', class: 'strength-weak', textClass: 'text-warning', text: 'Yếu' },
        3: { width: '60%', class: 'strength-medium', textClass: 'text-info', text: 'Trung bình' },
        4: { width: '80%', class: 'strength-strong', textClass: 'text-success', text: 'Mạnh' },
        5: { width: '100%', class: 'strength-very-strong', textClass: 'text-success', text: 'Rất mạnh' }
    }

    return strength[score]
})

// Methods
const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value
}

const toggleConfirmPasswordVisibility = () => {
    showConfirmPassword.value = !showConfirmPassword.value
}

const checkUsernameAvailability = debounce(async () => {
    const username = registerForm.value.username
    if (!username || username.length < 3) {
        usernameStatus.value = { checking: false, available: null, taken: null }
        return
    }

    usernameStatus.value.checking = true

    try {
        // Simulate API call - replace with actual API
        await new Promise(resolve => setTimeout(resolve, 500))

        // Mock response - replace with actual API call
        const isTaken = ['admin', 'user', 'test'].includes(username.toLowerCase())

        usernameStatus.value = {
            checking: false,
            available: !isTaken,
            taken: isTaken
        }
    } catch (error) {
        usernameStatus.value = { checking: false, available: null, taken: null }
    }
}, 500)

const handleRegister = async () => {
    // Clear previous errors
    registerErrors.value = {}

    // Validate form
    if (!validateRegisterForm()) {
        return
    }

    // Check username availability
    if (usernameStatus.value.taken) {
        registerErrors.value.username = 'Tên người dùng đã được sử dụng'
        return
    }

    try {
        const result = await authRegister()

        if (!result.success) {
            if (result.errors) {
                registerErrors.value = result.errors
            } else {
                registerErrors.value.general = result.error || 'Đăng ký thất bại'
            }
        }
    } catch (error) {
        console.error('Registration error:', error)
        registerErrors.value.general = 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    }
}

const registerWithGoogle = async () => {
    try {
        // Implementation for Google OAuth
        toast.info('Tính năng đăng ký Google sẽ có sớm!')
    } catch (error) {
        toast.error('Không thể đăng ký với Google')
    }
}

const registerWithFacebook = async () => {
    try {
        // Implementation for Facebook OAuth
        toast.info('Tính năng đăng ký Facebook sẽ có sớm!')
    } catch (error) {
        toast.error('Không thể đăng ký với Facebook')
    }
}

// Meta
defineOptions({
    name: 'RegisterView'
})
</script>

<style lang="scss" scoped>
.register-view {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.register-form-section {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: white;
}

.register-form-container {
    width: 100%;
    max-width: 450px;
}

.mobile-logo {
    text-align: center;
    margin-bottom: 2rem;

    i {
        font-size: 3rem;
        margin-bottom: 0.5rem;
        display: block;
    }

    h2 {
        font-weight: 700;
        color: var(--bs-dark);
        margin: 0;
    }
}

.form-header {
    text-align: center;
    margin-bottom: 2rem;

    h3 {
        font-weight: 700;
        color: var(--bs-dark);
        margin-bottom: 0.5rem;
    }

    p {
        margin: 0;
    }
}

.input-group-text {
    background: var(--bs-gray-100);
    border-right: none;
    color: var(--bs-secondary);
}

.form-control {
    border-left: none;

    &:focus {
        border-color: var(--bs-primary);
        box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
    }
}

.password-strength {
    .strength-bar {
        height: 4px;
        background: var(--bs-gray-200);
        border-radius: 2px;
        overflow: hidden;
        margin-bottom: 4px;
    }

    .strength-fill {
        height: 100%;
        transition: all 0.3s ease;

        &.strength-very-weak {
            background: #dc3545;
        }

        &.strength-weak {
            background: #fd7e14;
        }

        &.strength-medium {
            background: #ffc107;
        }

        &.strength-strong {
            background: #20c997;
        }

        &.strength-very-strong {
            background: #198754;
        }
    }
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border: none;
    padding: 0.75rem 1.5rem;
    font-weight: 600;
    border-radius: 8px;
    transition: all 0.3s ease;

    &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }

    &:disabled {
        opacity: 0.7;
    }
}

.social-register {
    margin: 1.5rem 0;
}

.divider {
    position: relative;
    text-align: center;
    margin: 1.5rem 0;

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: var(--bs-border-color);
    }

    span {
        background: white;
        padding: 0 1rem;
        color: var(--bs-secondary);
        font-size: 0.875rem;
    }
}

.social-buttons {
    .btn {
        border-radius: 8px;
        padding: 0.75rem 1.5rem;
        font-weight: 500;
        transition: all 0.3s ease;

        &:hover:not(:disabled) {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }
    }
}

.login-link {
    padding-top: 1.5rem;
    border-top: 1px solid var(--bs-border-color);

    a {
        color: var(--bs-primary);
        font-weight: 600;

        &:hover {
            color: var(--bs-primary-dark);
        }
    }
}

.register-benefits {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    backdrop-filter: blur(10px);
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.benefits-content {
    max-width: 500px;
    color: white;
}

.benefits-header {
    text-align: center;
    margin-bottom: 3rem;

    i {
        font-size: 3rem;
        margin-bottom: 1rem;
        display: block;
    }

    h2 {
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
    }

    p {
        font-size: 1.1rem;
        opacity: 0.9;
        margin: 0;
    }
}

.benefits-list {
    margin-bottom: 3rem;
}

.benefit-item {
    display: flex;
    align-items: flex-start;
    gap: 1rem;
    margin-bottom: 2rem;

    .benefit-icon {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        i {
            font-size: 1.5rem;
            color: white;
        }
    }

    .benefit-content {
        h5 {
            margin-bottom: 0.5rem;
            font-weight: 600;
        }

        p {
            margin: 0;
            opacity: 0.9;
            line-height: 1.5;
        }
    }
}

.benefits-footer {
    .stats {
        display: flex;
        justify-content: space-around;
        text-align: center;

        .stat-item {
            strong {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 0.25rem;
            }

            span {
                font-size: 0.9rem;
                opacity: 0.8;
            }
        }
    }
}

// Modal backdrop
.modal {
    background: rgba(0, 0, 0, 0.5);
}

// Dark theme
[data-bs-theme="dark"] {
    .register-form-section {
        background: var(--bs-gray-900);
    }

    .mobile-logo h2 {
        color: var(--bs-light);
    }

    .form-header h3 {
        color: var(--bs-light);
    }

    .input-group-text {
        background: var(--bs-gray-800);
        border-color: var(--bs-gray-700);
        color: var(--bs-gray-300);
    }

    .form-control {
        background: var(--bs-gray-800);
        border-color: var(--bs-gray-700);
        color: var(--bs-light);

        &::placeholder {
            color: var(--bs-gray-400);
        }
    }

    .divider span {
        background: var(--bs-gray-900);
    }

    .strength-bar {
        background: var(--bs-gray-700);
    }
}

// Mobile responsive
@media (max-width: 768px) {
    .register-view {
        background: white;
    }

    .register-form-section {
        padding: 1rem;
    }

    .register-form-container {
        max-width: 100%;
    }
}

// Animation
.register-form-container {
    animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

// Validation states
.is-invalid {
    border-color: var(--bs-danger) !important;
}

.invalid-feedback {
    display: block;
    width: 100%;
    margin-top: 0.25rem;
    font-size: 0.875rem;
    color: var(--bs-danger);
}
</style>