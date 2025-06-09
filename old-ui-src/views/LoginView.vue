<!-- Login page với form validation, social login và security features -->

<template>
    <div class="login-view">
        <div class="container-fluid">
            <div class="row min-vh-100">
                <!-- Left Side - Branding -->
                <div class="col-lg-6 d-none d-lg-flex">
                    <div class="branding-section">
                        <div class="branding-content">
                            <div class="logo-section">
                                <img src="/images/logo-white.svg" alt="Logo" class="brand-logo">
                                <h1 class="brand-title">SocialApp</h1>
                            </div>
                            
                            <div class="features-showcase">
                                <div class="feature-item" v-for="feature in features" :key="feature.id"
                                     :data-aos="feature.animation" :data-aos-delay="feature.delay">
                                    <div class="feature-icon">
                                        <i :class="feature.icon"></i>
                                    </div>
                                    <div class="feature-content">
                                        <h3>{{ feature.title }}</h3>
                                        <p>{{ feature.description }}</p>
                                    </div>
                                </div>
                            </div>

                            <div class="testimonial" data-aos="fade-up" data-aos-delay="600">
                                <blockquote>
                                    "Ứng dụng tuyệt vời để kết nối với bạn bè và chia sẻ những khoảnh khắc đặc biệt!"
                                </blockquote>
                                <cite>- Người dùng hài lòng</cite>
                            </div>
                        </div>
                        
                        <div class="branding-background">
                            <div class="floating-elements">
                                <div class="floating-shape shape-1"></div>
                                <div class="floating-shape shape-2"></div>
                                <div class="floating-shape shape-3"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Side - Login Form -->
                <div class="col-lg-6">
                    <div class="login-section">
                        <div class="login-container">
                            <!-- Mobile Logo -->
                            <div class="mobile-logo d-lg-none text-center mb-4">
                                <img src="/images/logo.svg" alt="Logo" class="mobile-brand-logo">
                                <h2 class="mobile-brand-title">SocialApp</h2>
                            </div>

                            <!-- Login Header -->
                            <div class="login-header text-center mb-4">
                                <h2 class="login-title">Chào mừng trở lại!</h2>
                                <p class="login-subtitle">Đăng nhập để tiếp tục kết nối với bạn bè</p>
                            </div>

                            <!-- Security Notice -->
                            <div v-if="securityNotice" class="alert alert-warning alert-dismissible fade show" role="alert">
                                <i class="fas fa-shield-alt me-2"></i>
                                {{ securityNotice }}
                                <button type="button" class="btn-close" @click="securityNotice = null"></button>
                            </div>

                            <!-- Login Form -->
                            <form @submit.prevent="handleLogin" class="login-form">
                                <!-- Email/Username Input -->
                                <div class="form-group mb-3">
                                    <label for="email" class="form-label">Email hoặc tên người dùng</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-user"></i>
                                        </span>
                                        <input type="text" v-model="form.email" id="email" class="form-control"
                                               :class="{ 'is-invalid': errors.email }" placeholder="Nhập email hoặc username"
                                               autocomplete="username" required>
                                    </div>
                                    <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
                                </div>

                                <!-- Password Input -->
                                <div class="form-group mb-3">
                                    <label for="password" class="form-label">Mật khẩu</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-lock"></i>
                                        </span>
                                        <input :type="showPassword ? 'text' : 'password'" v-model="form.password" 
                                               id="password" class="form-control" :class="{ 'is-invalid': errors.password }"
                                               placeholder="Nhập mật khẩu" autocomplete="current-password" required>
                                        <button type="button" class="btn btn-outline-secondary" @click="togglePassword">
                                            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                        </button>
                                    </div>
                                    <div v-if="errors.password" class="invalid-feedback">{{ errors.password }}</div>
                                </div>

                                <!-- Remember Me & Forgot Password -->
                                <div class="form-options mb-4">
                                    <div class="form-check">
                                        <input type="checkbox" v-model="form.rememberMe" id="rememberMe" class="form-check-input">
                                        <label for="rememberMe" class="form-check-label">Ghi nhớ đăng nhập</label>
                                    </div>
                                    <router-link to="/forgot-password" class="forgot-password-link">
                                        Quên mật khẩu?
                                    </router-link>
                                </div>

                                <!-- reCAPTCHA -->
                                <div v-if="showCaptcha" class="captcha-section mb-3">
                                    <div ref="recaptcha" class="recaptcha-container"></div>
                                </div>

                                <!-- Login Button -->
                                <button type="submit" class="btn btn-primary btn-lg w-100 mb-3" 
                                        :disabled="isLoading || (showCaptcha && !captchaToken)">
                                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                                    <i v-else class="fas fa-sign-in-alt me-2"></i>
                                    {{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
                                </button>

                                <!-- Social Login Divider -->
                                <div class="divider mb-3">
                                    <span>hoặc đăng nhập với</span>
                                </div>

                                <!-- Social Login Buttons -->
                                <div class="social-login">
                                    <button type="button" class="btn btn-google" @click="loginWithGoogle" :disabled="isLoading">
                                        <i class="fab fa-google me-2"></i>
                                        Google
                                    </button>
                                    <button type="button" class="btn btn-facebook" @click="loginWithFacebook" :disabled="isLoading">
                                        <i class="fab fa-facebook-f me-2"></i>
                                        Facebook
                                    </button>
                                    <button type="button" class="btn btn-github" @click="loginWithGithub" :disabled="isLoading">
                                        <i class="fab fa-github me-2"></i>
                                        GitHub
                                    </button>
                                </div>
                            </form>

                            <!-- Register Link -->
                            <div class="register-link text-center mt-4">
                                <p class="mb-0">
                                    Chưa có tài khoản? 
                                    <router-link to="/register" class="register-text">Đăng ký ngay</router-link>
                                </p>
                            </div>

                            <!-- Security Info -->
                            <div class="security-info mt-4">
                                <div class="row text-center">
                                    <div class="col-4">
                                        <i class="fas fa-shield-alt text-success mb-2"></i>
                                        <small class="text-muted d-block">Bảo mật SSL</small>
                                    </div>
                                    <div class="col-4">
                                        <i class="fas fa-lock text-success mb-2"></i>
                                        <small class="text-muted d-block">Mã hóa dữ liệu</small>
                                    </div>
                                    <div class="col-4">
                                        <i class="fas fa-user-shield text-success mb-2"></i>
                                        <small class="text-muted d-block">Bảo vệ riêng tư</small>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Two Factor Authentication Modal -->
        <TwoFactorModal v-if="showTwoFactorModal" :user-id="tempUserId" 
                        @close="showTwoFactorModal = false" @verified="handleTwoFactorVerified" />

        <!-- Device Verification Modal -->
        <DeviceVerificationModal v-if="showDeviceModal" :verification-data="deviceVerificationData"
                                 @close="showDeviceModal = false" @verified="handleDeviceVerified" />
    </div>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import AOS from 'aos'
import TwoFactorModal from '@/components/auth/TwoFactorModal.vue'
import DeviceVerificationModal from '@/components/auth/DeviceVerificationModal.vue'

// Router & Stores
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const toast = useToast()

// Refs
const recaptcha = ref(null)

// State
const isLoading = ref(false)
const showPassword = ref(false)
const showCaptcha = ref(false)
const captchaToken = ref(null)
const showTwoFactorModal = ref(false)
const showDeviceModal = ref(false)
const tempUserId = ref(null)
const deviceVerificationData = ref(null)
const securityNotice = ref(null)
const loginAttempts = ref(0)

// Form data
const form = reactive({
    email: '',
    password: '',
    rememberMe: false
})

// Validation errors
const errors = reactive({
    email: null,
    password: null
})

// Features data
const features = ref([
    {
        id: 1,
        icon: 'fas fa-users',
        title: 'Kết nối bạn bè',
        description: 'Tìm kiếm và kết nối với những người bạn yêu thích',
        animation: 'fade-right',
        delay: '100'
    },
    {
        id: 2,
        icon: 'fas fa-share-alt',
        title: 'Chia sẻ khoảnh khắc',
        description: 'Đăng và chia sẻ những khoảnh khắc đặc biệt',
        animation: 'fade-right',
        delay: '200'
    },
    {
        id: 3,
        icon: 'fas fa-comments',
        title: 'Chat thời gian thực',
        description: 'Trò chuyện tức thì với bạn bè mọi lúc mọi nơi',
        animation: 'fade-right',
        delay: '300'
    }
])

// Methods
const validateForm = () => {
    // Reset errors
    errors.email = null
    errors.password = null

    let isValid = true

    // Email validation
    if (!form.email.trim()) {
        errors.email = 'Vui lòng nhập email hoặc tên người dùng'
        isValid = false
    } else if (form.email.includes('@') && !isValidEmail(form.email)) {
        errors.email = 'Email không hợp lệ'
        isValid = false
    }

    // Password validation
    if (!form.password) {
        errors.password = 'Vui lòng nhập mật khẩu'
        isValid = false
    } else if (form.password.length < 6) {
        errors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        isValid = false
    }

    return isValid
}

const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

const handleLogin = async () => {
    if (!validateForm()) return

    // Check for rate limiting
    if (loginAttempts.value >= 5) {
        toast.error('Bạn đã thử đăng nhập quá nhiều lần. Vui lòng đợi 15 phút.')
        return
    }

    // Show captcha after 3 failed attempts
    if (loginAttempts.value >= 3 && !captchaToken.value) {
        showCaptcha.value = true
        await nextTick()
        initRecaptcha()
        return
    }

    isLoading.value = true

    try {
        const loginData = {
            email: form.email.trim(),
            password: form.password,
            rememberMe: form.rememberMe,
            captchaToken: captchaToken.value,
            deviceInfo: getDeviceInfo()
        }

        const result = await authStore.login(loginData)

        if (result.requiresTwoFactor) {
            // Show 2FA modal
            tempUserId.value = result.userId
            showTwoFactorModal.value = true
            return
        }

        if (result.requiresDeviceVerification) {
            // Show device verification modal
            deviceVerificationData.value = result.verificationData
            showDeviceModal.value = true
            return
        }

        // Login successful
        handleLoginSuccess()

    } catch (error) {
        handleLoginError(error)
    } finally {
        isLoading.value = false
    }
}

const handleLoginSuccess = () => {
    // Reset attempts
    loginAttempts.value = 0
    captchaToken.value = null
    showCaptcha.value = false

    toast.success('Đăng nhập thành công!')

    // Redirect to intended page or dashboard
    const redirectTo = route.query.redirect || '/feed'
    router.push(redirectTo)
}

const handleLoginError = (error) => {
    loginAttempts.value++

    // Reset captcha
    if (captchaToken.value) {
        resetRecaptcha()
        captchaToken.value = null
    }

    if (error.code === 'INVALID_CREDENTIALS') {
        errors.email = 'Email/username hoặc mật khẩu không đúng'
        errors.password = 'Email/username hoặc mật khẩu không đúng'
    } else if (error.code === 'ACCOUNT_LOCKED') {
        securityNotice.value = 'Tài khoản của bạn đã bị khóa do hoạt động đáng ngờ. Vui lòng liên hệ hỗ trợ.'
    } else if (error.code === 'EMAIL_NOT_VERIFIED') {
        securityNotice.value = 'Vui lòng xác minh email trước khi đăng nhập.'
    } else if (error.code === 'CAPTCHA_REQUIRED') {
        showCaptcha.value = true
        toast.error('Vui lòng xác minh captcha')
    } else {
        toast.error(error.message || 'Đăng nhập thất bại. Vui lòng thử lại.')
    }

    // Show captcha after 3 attempts
    if (loginAttempts.value >= 3) {
        showCaptcha.value = true
        nextTick(() => initRecaptcha())
    }
}

const handleTwoFactorVerified = () => {
    showTwoFactorModal.value = false
    handleLoginSuccess()
}

const handleDeviceVerified = () => {
    showDeviceModal.value = false
    handleLoginSuccess()
}

const togglePassword = () => {
    showPassword.value = !showPassword.value
}

// Social Login
const loginWithGoogle = async () => {
    try {
        isLoading.value = true
        await authStore.loginWithGoogle()
        handleLoginSuccess()
    } catch (error) {
        toast.error('Đăng nhập Google thất bại')
    } finally {
        isLoading.value = false
    }
}

const loginWithFacebook = async () => {
    try {
        isLoading.value = true
        await authStore.loginWithFacebook()
        handleLoginSuccess()
    } catch (error) {
        toast.error('Đăng nhập Facebook thất bại')
    } finally {
        isLoading.value = false
    }
}

const loginWithGithub = async () => {
    try {
        isLoading.value = true
        await authStore.loginWithGithub()
        handleLoginSuccess()
    } catch (error) {
        toast.error('Đăng nhập GitHub thất bại')
    } finally {
        isLoading.value = false
    }
}

// reCAPTCHA
const initRecaptcha = () => {
    if (typeof grecaptcha !== 'undefined' && recaptcha.value) {
        grecaptcha.render(recaptcha.value, {
            sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
            callback: (token) => {
                captchaToken.value = token
            },
            'expired-callback': () => {
                captchaToken.value = null
            }
        })
    }
}

const resetRecaptcha = () => {
    if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset()
    }
}

// Device Info
const getDeviceInfo = () => {
    return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        screen: `${screen.width}x${screen.height}`,
        timestamp: new Date().toISOString()
    }
}

// URL parameters handling
const handleUrlParams = () => {
    // Handle registration success
    if (route.query.registered === 'true') {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
    }

    // Handle password reset
    if (route.query.reset === 'success') {
        toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.')
    }

    // Handle session expired
    if (route.query.session === 'expired') {
        securityNotice.value = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
    }

    // Pre-fill email if provided
    if (route.query.email) {
        form.email = route.query.email
    }
}

// Lifecycle
onMounted(() => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true
    })

    // Handle URL parameters
    handleUrlParams()

    // Load reCAPTCHA script if needed
    if (loginAttempts.value >= 3) {
        loadRecaptchaScript()
    }

    // Check if user is already logged in
    if (authStore.isLoggedIn) {
        const redirectTo = route.query.redirect || '/feed'
        router.replace(redirectTo)
    }
})

onUnmounted(() => {
    AOS.refresh()
})

// Load reCAPTCHA script
const loadRecaptchaScript = () => {
    if (document.querySelector('script[src*="recaptcha"]')) return

    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
}
</script>

<style lang="scss" scoped>
.login-view {
    background: var(--bs-light);
    min-height: 100vh;
}

// Branding Section
.branding-section {
    position: relative;
    background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-secondary) 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;

    .branding-content {
        position: relative;
        z-index: 10;
        max-width: 500px;
        padding: 2rem;

        .logo-section {
            text-align: center;
            margin-bottom: 3rem;

            .brand-logo {
                height: 60px;
                margin-bottom: 1rem;
            }

            .brand-title {
                font-size: 2.5rem;
                font-weight: 700;
                margin: 0;
            }
        }

        .features-showcase {
            margin-bottom: 3rem;

            .feature-item {
                display: flex;
                align-items: center;
                margin-bottom: 2rem;
                padding: 1.5rem;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                backdrop-filter: blur(10px);

                .feature-icon {
                    width: 60px;
                    height: 60px;
                    background: rgba(255, 255, 255, 0.2);
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 1.5rem;
                    flex-shrink: 0;

                    i {
                        font-size: 1.5rem;
                    }
                }

                .feature-content {
                    h3 {
                        font-size: 1.25rem;
                        font-weight: 600;
                        margin-bottom: 0.5rem;
                    }

                    p {
                        margin: 0;
                        opacity: 0.9;
                    }
                }
            }
        }

        .testimonial {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);

            blockquote {
                font-size: 1.1rem;
                font-style: italic;
                margin-bottom: 1rem;
                line-height: 1.6;
            }

            cite {
                font-size: 0.9rem;
                opacity: 0.8;
            }
        }
    }

    .branding-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        .floating-elements {
            position: relative;
            width: 100%;
            height: 100%;

            .floating-shape {
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.1);
                animation: float 6s ease-in-out infinite;

                &.shape-1 {
                    width: 120px;
                    height: 120px;
                    top: 10%;
                    right: 10%;
                    animation-delay: 0s;
                }

                &.shape-2 {
                    width: 80px;
                    height: 80px;
                    bottom: 20%;
                    left: 15%;
                    animation-delay: 2s;
                }

                &.shape-3 {
                    width: 60px;
                    height: 60px;
                    top: 50%;
                    right: 20%;
                    animation-delay: 4s;
                }
            }
        }
    }
}

// Login Section
.login-section {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem 1rem;

    .login-container {
        width: 100%;
        max-width: 420px;

        .mobile-logo {
            .mobile-brand-logo {
                height: 50px;
                margin-bottom: 0.5rem;
            }

            .mobile-brand-title {
                font-size: 1.8rem;
                font-weight: 700;
                color: var(--bs-primary);
                margin: 0;
            }
        }

        .login-header {
            .login-title {
                font-size: 2rem;
                font-weight: 700;
                color: var(--bs-dark);
                margin-bottom: 0.5rem;
            }

            .login-subtitle {
                color: var(--bs-secondary);
                margin: 0;
            }
        }

        .login-form {
            .form-group {
                .form-label {
                    font-weight: 600;
                    color: var(--bs-dark);
                    margin-bottom: 0.5rem;
                }

                .input-group {
                    .input-group-text {
                        background: var(--bs-light);
                        border-right: none;
                        color: var(--bs-secondary);
                    }

                    .form-control {
                        border-left: none;
                        padding-left: 0;

                        &:focus {
                            border-color: var(--bs-primary);
                            box-shadow: none;

                            + .input-group-text {
                                border-color: var(--bs-primary);
                            }
                        }
                    }

                    .btn {
                        border-left: none;
                    }
                }
            }

            .form-options {
                display: flex;
                justify-content: space-between;
                align-items: center;

                .form-check {
                    .form-check-label {
                        color: var(--bs-secondary);
                        font-size: 0.9rem;
                    }
                }

                .forgot-password-link {
                    color: var(--bs-primary);
                    text-decoration: none;
                    font-size: 0.9rem;

                    &:hover {
                        text-decoration: underline;
                    }
                }
            }

            .captcha-section {
                .recaptcha-container {
                    display: flex;
                    justify-content: center;
                }
            }

            .btn-primary {
                border-radius: 25px;
                font-weight: 600;
                padding: 0.75rem 1.5rem;
                background: linear-gradient(135deg, var(--bs-primary), var(--bs-secondary));
                border: none;
                transition: transform 0.2s ease;

                &:hover:not(:disabled) {
                    transform: translateY(-2px);
                }

                &:disabled {
                    opacity: 0.7;
                }
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
                    font-size: 0.9rem;
                }
            }

            .social-login {
                display: grid;
                grid-template-columns: 1fr 1fr 1fr;
                gap: 0.5rem;

                .btn {
                    border-radius: 25px;
                    font-weight: 600;
                    padding: 0.75rem 1rem;
                    font-size: 0.9rem;
                    transition: transform 0.2s ease;

                    &:hover:not(:disabled) {
                        transform: translateY(-2px);
                    }

                    &.btn-google {
                        background: #db4437;
                        border-color: #db4437;
                        color: white;

                        &:hover {
                            background: #c23321;
                            border-color: #c23321;
                        }
                    }

                    &.btn-facebook {
                        background: #3b5998;
                        border-color: #3b5998;
                        color: white;

                        &:hover {
                            background: #2d4373;
                            border-color: #2d4373;
                        }
                    }

                    &.btn-github {
                        background: #333;
                        border-color: #333;
                        color: white;

                        &:hover {
                            background: #222;
                            border-color: #222;
                        }
                    }
                }
            }
        }

        .register-link {
            .register-text {
                color: var(--bs-primary);
                text-decoration: none;
                font-weight: 600;

                &:hover {
                    text-decoration: underline;
                }
            }
        }

        .security-info {
            border-top: 1px solid var(--bs-border-color-translucent);
            padding-top: 1rem;

            i {
                font-size: 1.5rem;
                display: block;
            }

            small {
                font-weight: 500;
            }
        }
    }
}

// Animations
@keyframes float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-20px);
    }
}

// Responsive
@media (max-width: 992px) {
    .login-section {
        padding: 1rem;
        min-height: auto;

        .login-container {
            max-width: 500px;

            .login-form {
                .social-login {
                    grid-template-columns: 1fr;
                    gap: 0.75rem;

                    .btn {
                        padding: 0.75rem 1.5rem;
                        font-size: 1rem;
                    }
                }
            }
        }
    }
}

@media (max-width: 576px) {
    .login-section {
        .login-container {
            .login-header {
                .login-title {
                    font-size: 1.75rem;
                }
            }

            .login-form {
                .form-options {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: flex-start;
                }

                .social-login {
                    .btn {
                        i {
                            margin-right: 0.5rem !important;
                        }
                    }
                }
            }
        }
    }
}

// Dark mode support
@media (prefers-color-scheme: dark) {
    .login-view {
        background: var(--bs-dark);
    }

    .login-section {
        .login-container {
            .login-header {
                .login-title {
                    color: var(--bs-light);
                }
            }

            .login-form {
                .form-group {
                    .form-label {
                        color: var(--bs-light);
                    }
                }

                .divider {
                    span {
                        background: var(--bs-dark);
                        color: var(--bs-light);
                    }
                }
            }

            .security-info {
                border-color: var(--bs-secondary);
            }
        }
    }
}
</style>