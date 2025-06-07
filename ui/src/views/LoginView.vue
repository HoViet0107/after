<template>
    <div class="login-view">
        <div class="container-fluid h-100">
            <div class="row h-100">
                <!-- Left Side - Branding -->
                <div class="col-lg-6 d-none d-lg-flex login-branding">
                    <div class="branding-content">
                        <div class="brand-logo">
                            <i class="fas fa-comments-dots"></i>
                            <h1>Social Connect</h1>
                        </div>
                        <div class="brand-features">
                            <div class="feature-item">
                                <i class="fas fa-users text-primary"></i>
                                <div>
                                    <h5>Kết nối bạn bè</h5>
                                    <p>Tìm và kết nối với bạn bè, gia đình và đồng nghiệp</p>
                                </div>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-share text-success"></i>
                                <div>
                                    <h5>Chia sẻ khoảnh khắc</h5>
                                    <p>Chia sẻ những khoảnh khắc đáng nhớ với mọi người</p>
                                </div>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-comments text-info"></i>
                                <div>
                                    <h5>Trò chuyện real-time</h5>
                                    <p>Nhắn tin tức thời với bạn bè mọi lúc mọi nơi</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Side - Login Form -->
                <div class="col-lg-6 login-form-section">
                    <div class="login-form-container">
                        <!-- Mobile Logo -->
                        <div class="mobile-logo d-lg-none">
                            <i class="fas fa-comments-dots text-primary"></i>
                            <h2>Social Connect</h2>
                        </div>

                        <!-- Login Form -->
                        <div class="login-form">
                            <div class="form-header">
                                <h3>Đăng nhập</h3>
                                <p class="text-muted">Chào mừng bạn quay trở lại!</p>
                            </div>

                            <!-- Error Alert -->
                            <div v-if="loginErrors.general" class="alert alert-danger" role="alert">
                                <i class="fas fa-exclamation-triangle me-2"></i>
                                {{ loginErrors.general }}
                            </div>

                            <!-- Login Form -->
                            <form @submit.prevent="handleLogin" novalidate>
                                <!-- Email Field -->
                                <div class="mb-3">
                                    <label for="email" class="form-label">Email</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-envelope"></i>
                                        </span>
                                        <input id="email" v-model="loginForm.email" type="email" class="form-control"
                                            :class="{ 'is-invalid': loginErrors.email }"
                                            placeholder="Nhập email của bạn" autocomplete="email" required />
                                    </div>
                                    <div v-if="loginErrors.email" class="invalid-feedback">
                                        {{ loginErrors.email }}
                                    </div>
                                </div>

                                <!-- Password Field -->
                                <div class="mb-3">
                                    <label for="password" class="form-label">Mật khẩu</label>
                                    <div class="input-group">
                                        <span class="input-group-text">
                                            <i class="fas fa-lock"></i>
                                        </span>
                                        <input id="password" v-model="loginForm.password"
                                            :type="showPassword ? 'text' : 'password'" class="form-control"
                                            :class="{ 'is-invalid': loginErrors.password }" placeholder="Nhập mật khẩu"
                                            autocomplete="current-password" required />
                                        <button type="button" class="btn btn-outline-secondary"
                                            @click="togglePasswordVisibility">
                                            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                        </button>
                                    </div>
                                    <div v-if="loginErrors.password" class="invalid-feedback">
                                        {{ loginErrors.password }}
                                    </div>
                                </div>

                                <!-- Remember Me & Forgot Password -->
                                <div class="row mb-3">
                                    <div class="col-6">
                                        <div class="form-check">
                                            <input id="rememberMe" v-model="loginForm.rememberMe"
                                                class="form-check-input" type="checkbox" />
                                            <label class="form-check-label" for="rememberMe">
                                                Ghi nhớ tôi
                                            </label>
                                        </div>
                                    </div>
                                    <div class="col-6 text-end">
                                        <router-link to="/auth/forgot-password" class="text-decoration-none">
                                            Quên mật khẩu?
                                        </router-link>
                                    </div>
                                </div>

                                <!-- Login Button -->
                                <button type="submit" class="btn btn-primary w-100 mb-3" :disabled="isLoggingIn">
                                    <span v-if="isLoggingIn" class="spinner-border spinner-border-sm me-2"></span>
                                    <i v-else class="fas fa-sign-in-alt me-2"></i>
                                    {{ isLoggingIn ? 'Đang đăng nhập...' : 'Đăng nhập' }}
                                </button>

                                <!-- Social Login -->
                                <div class="social-login">
                                    <div class="divider">
                                        <span>hoặc</span>
                                    </div>

                                    <div class="social-buttons">
                                        <button type="button" class="btn btn-outline-danger w-100 mb-2"
                                            @click="loginWithGoogle" :disabled="isLoggingIn">
                                            <i class="fab fa-google me-2"></i>
                                            Đăng nhập với Google
                                        </button>

                                        <button type="button" class="btn btn-outline-primary w-100"
                                            @click="loginWithFacebook" :disabled="isLoggingIn">
                                            <i class="fab fa-facebook-f me-2"></i>
                                            Đăng nhập với Facebook
                                        </button>
                                    </div>
                                </div>
                            </form>

                            <!-- Register Link -->
                            <div class="register-link text-center">
                                <p class="mb-0">
                                    Chưa có tài khoản?
                                    <router-link to="/auth/register" class="text-decoration-none">
                                        Đăng ký ngay
                                    </router-link>
                                </p>
                            </div>
                        </div>

                        <!-- Footer -->
                        <div class="auth-footer">
                            <div class="footer-links">
                                <a href="#" class="text-muted me-3">Điều khoản</a>
                                <a href="#" class="text-muted me-3">Bảo mật</a>
                                <a href="#" class="text-muted">Hỗ trợ</a>
                            </div>
                            <div class="footer-copyright">
                                <small class="text-muted">© 2024 Social Connect. All rights reserved.</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import { useToast } from 'vue-toastification'

// Dependencies
const {
    loginForm,
    loginErrors,
    isLoggingIn,
    handleLogin: authLogin,
    validateLoginForm,
    loadRememberedCredentials
} = useAuth()
const toast = useToast()

// State
const showPassword = ref(false)

// Methods
const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value
}

const handleLogin = async () => {
    // Clear previous errors
    loginErrors.value = {}

    // Validate form
    if (!validateLoginForm()) {
        return
    }

    try {
        const result = await authLogin()

        if (!result.success) {
            if (result.errors) {
                loginErrors.value = result.errors
            } else {
                loginErrors.value.general = result.error || 'Đăng nhập thất bại'
            }
        }
    } catch (error) {
        console.error('Login error:', error)
        loginErrors.value.general = 'Có lỗi xảy ra. Vui lòng thử lại sau.'
    }
}

const loginWithGoogle = async () => {
    try {
        // Implementation for Google OAuth
        toast.info('Tính năng đăng nhập Google sẽ có sớm!')
    } catch (error) {
        toast.error('Không thể đăng nhập với Google')
    }
}

const loginWithFacebook = async () => {
    try {
        // Implementation for Facebook OAuth
        toast.info('Tính năng đăng nhập Facebook sẽ có sớm!')
    } catch (error) {
        toast.error('Không thể đăng nhập với Facebook')
    }
}

// Lifecycle
onMounted(() => {
    // Load remembered credentials
    loadRememberedCredentials()

    // Focus on email field
    document.getElementById('email')?.focus()
})

// Meta
defineOptions({
    name: 'LoginView'
})
</script>

<style lang="scss" scoped>
.login-view {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-branding {
    background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
    backdrop-filter: blur(10px);
    align-items: center;
    justify-content: center;
    padding: 2rem;
}

.branding-content {
    max-width: 500px;
    text-align: center;
    color: white;
}

.brand-logo {
    margin-bottom: 3rem;

    i {
        font-size: 4rem;
        color: white;
        margin-bottom: 1rem;
        display: block;
    }

    h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin: 0;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
}

.brand-features {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    text-align: left;

    i {
        font-size: 2rem;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: white;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
    }

    h5 {
        margin-bottom: 0.5rem;
        font-weight: 600;
    }

    p {
        margin: 0;
        opacity: 0.9;
    }
}

.login-form-section {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    background: white;
}

.login-form-container {
    width: 100%;
    max-width: 400px;
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

.login-form {
    margin-bottom: 2rem;
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

    &:focus+.input-group-text,
    &:focus~.input-group-text {
        border-color: var(--bs-primary);
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

.social-login {
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

.register-link {
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

.auth-footer {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid var(--bs-border-color);
}

.footer-links {
    margin-bottom: 1rem;

    a {
        font-size: 0.875rem;

        &:hover {
            text-decoration: underline !important;
        }
    }
}

// Dark theme
[data-bs-theme="dark"] {
    .login-form-section {
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
}

// Mobile responsive
@media (max-width: 768px) {
    .login-view {
        background: white;
    }

    .login-form-section {
        padding: 1rem;
    }

    .brand-features {
        display: none;
    }

    .feature-item {
        flex-direction: column;
        text-align: center;

        i {
            margin-bottom: 0.5rem;
        }
    }
}

// Animation
.login-form-container {
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

// Focus states
.form-control:focus {
    box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
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