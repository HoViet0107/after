<template>
    <div class="login-view">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-md-6 col-lg-5">
                    <div class="login-card">
                        <!-- Header -->
                        <div class="login-header text-center mb-4">
                            <div class="brand-logo mb-3">
                                <i class="fas fa-users-cog fa-3x text-primary"></i>
                            </div>
                            <h2 class="login-title">Đăng nhập</h2>
                            <p class="login-subtitle text-muted">
                                Chào mừng bạn quay trở lại! Vui lòng đăng nhập vào tài khoản của bạn.
                            </p>
                        </div>

                        <!-- Login Form -->
                        <form @submit.prevent="handleLogin" novalidate>
                            <!-- Email Field -->
                            <div class="form-group mb-3">
                                <label class="form-label">Email hoặc tên người dùng</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="fas fa-envelope"></i>
                                    </span>
                                    <input v-model="form.email" type="text" class="form-control"
                                        :class="{ 'is-invalid': errors.email }" placeholder="Nhập email hoặc username"
                                        @blur="validateField('email', form.email)" required>
                                </div>
                                <div v-if="errors.email" class="invalid-feedback d-block">
                                    {{ errors.email }}
                                </div>
                            </div>

                            <!-- Password Field -->
                            <div class="form-group mb-3">
                                <label class="form-label">Mật khẩu</label>
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="fas fa-lock"></i>
                                    </span>
                                    <input v-model="form.password" :type="showPassword ? 'text' : 'password'"
                                        class="form-control" :class="{ 'is-invalid': errors.password }"
                                        placeholder="Nhập mật khẩu" @blur="validateField('password', form.password)"
                                        required>
                                    <button type="button" class="btn btn-outline-secondary"
                                        @click="showPassword = !showPassword">
                                        <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                    </button>
                                </div>
                                <div v-if="errors.password" class="invalid-feedback d-block">
                                    {{ errors.password }}
                                </div>
                            </div>

                            <!-- Options -->
                            <div class="form-options mb-4">
                                <div class="form-check">
                                    <input v-model="form.rememberMe" type="checkbox" class="form-check-input"
                                        id="rememberMe">
                                    <label class="form-check-label" for="rememberMe">
                                        Ghi nhớ đăng nhập
                                    </label>
                                </div>
                                <router-link to="/auth/forgot-password" class="forgot-password-link">
                                    Quên mật khẩu?
                                </router-link>
                            </div>

                            <!-- Submit Button -->
                            <button type="submit" class="btn btn-primary w-100 mb-4" :disabled="isLoading || hasErrors">
                                <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                                {{ isLoading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
                            </button>

                            <!-- Social Login -->
                            <div class="social-login">
                                <div class="divider mb-3">
                                    <span>Hoặc đăng nhập với</span>
                                </div>
                                <div class="social-buttons">
                                    <button type="button" class="btn btn-google">
                                        <i class="fab fa-google me-2"></i>
                                        Google
                                    </button>
                                    <button type="button" class="btn btn-facebook">
                                        <i class="fab fa-facebook-f me-2"></i>
                                        Facebook
                                    </button>
                                </div>
                            </div>
                        </form>

                        <!-- Register Link -->
                        <div class="register-link text-center mt-4">
                            <span class="text-muted">Chưa có tài khoản? </span>
                            <router-link to="/auth/register" class="register-text">
                                Đăng ký ngay
                            </router-link>
                        </div>

                        <!-- Security Info -->
                        <div class="security-info text-center mt-4 pt-3">
                            <small class="text-muted d-flex align-items-center justify-content-center">
                                <i class="fas fa-shield-alt me-1"></i>
                                Thông tin của bạn được bảo vệ an toàn
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAuthValidation } from '@/composables/useAuthValidation'
import { useAppStores } from '@/composables/useAppStores'

const router = useRouter()
const toast = useToast()
const { authStore } = useAppStores()
const { errors, validateField, validateForm, hasErrors } = useAuthValidation()

// State
const isLoading = ref(false)
const showPassword = ref(false)

// Form data
const form = reactive({
    email: '',
    password: '',
    rememberMe: false
})

// Methods
const handleLogin = async () => {
    // Validate form
    if (!validateForm(form)) {
        return
    }

    isLoading.value = true

    try {
        const loginData = {
            email: form.email.trim(),
            password: form.password,
            rememberMe: form.rememberMe
        }

        await authStore.login(loginData)

        toast.success('Đăng nhập thành công!')

        // Redirect to intended page or feed
        const redirectTo = router.currentRoute.value.query.redirect || '/app/feed'
        router.push(redirectTo)

    } catch (error) {
        console.error('Login error:', error)

        const errorMessage = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.'
        toast.error(errorMessage)

        // Handle specific errors
        if (error.response?.status === 401) {
            errors.email = 'Email hoặc mật khẩu không chính xác'
            errors.password = 'Email hoặc mật khẩu không chính xác'
        } else if (error.response?.status === 423) {
            errors.email = 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.'
        } else if (error.response?.status === 400) {
            // Handle validation errors from server
            const serverErrors = error.response.data?.errors || {}
            Object.keys(serverErrors).forEach(field => {
                if (errors.hasOwnProperty(field)) {
                    errors[field] = serverErrors[field][0] // Take first error message
                }
            })
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
.login-view {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    padding: 2rem 0;
    position: relative;

    // Background pattern
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

.login-card {
    background: white;
    border-radius: 1rem;
    padding: 2.5rem;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
    position: relative;
    z-index: 1;
}

.brand-logo {
    i {
        animation: pulse 2s infinite;
    }
}

.login-title {
    font-weight: 700;
    color: #333;
    margin-bottom: 0.5rem;
}

.login-subtitle {
    line-height: 1.6;
}

.form-group {
    .form-label {
        font-weight: 600;
        color: #333;
        margin-bottom: 0.5rem;
    }

    .input-group {
        .input-group-text {
            background: #f8f9fa;
            border-right: none;
            color: #6c757d;
        }

        .form-control {
            border-left: none;

            &:focus {
                border-color: #667eea;
                box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
            }

            &.is-invalid {
                border-color: #dc3545;
            }
        }
    }
}

.form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .forgot-password-link {
        color: #667eea;
        text-decoration: none;
        font-size: 0.9rem;

        &:hover {
            text-decoration: underline;
        }
    }
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

    &:disabled {
        opacity: 0.7;
        transform: none;
    }
}

.divider {
    position: relative;
    text-align: center;

    &::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 0;
        right: 0;
        height: 1px;
        background: #e9ecef;
    }

    span {
        background: white;
        padding: 0 1rem;
        color: #6c757d;
        font-size: 0.9rem;
    }
}

.social-buttons {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;

    .btn {
        border-radius: 0.5rem;
        font-weight: 600;
        padding: 0.75rem;
        transition: transform 0.2s ease;

        &:hover {
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
    }
}

.register-text {
    color: #667eea;
    text-decoration: none;
    font-weight: 600;

    &:hover {
        text-decoration: underline;
    }
}

.security-info {
    border-top: 1px solid #e9ecef;

    small {
        font-weight: 500;
    }
}

// Animations
@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

// Responsive
@media (max-width: 576px) {
    .login-view {
        padding: 1rem;
    }

    .login-card {
        padding: 2rem 1.5rem;
    }

    .social-buttons {
        grid-template-columns: 1fr;
    }

    .form-options {
        flex-direction: column;
        gap: 1rem;
        align-items: flex-start;
    }
}
</style>