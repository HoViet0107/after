<!-- Component đăng nhập người dùng với WebSocket và Redis caching -->

<template>
    <div class="user-login">
        <div class="login-container">
            <!-- Header -->
            <div class="login-header text-center mb-4">
                <div class="logo mb-3">
                    <i class="fas fa-sign-in-alt text-primary fs-1"></i>
                </div>
                <h2 class="h4 fw-bold mb-2">Đăng nhập</h2>
                <p class="text-muted">Chào mừng bạn quay trở lại!</p>
            </div>

            <!-- Quick Login Options -->
            <div class="quick-login mb-4" v-if="recentLogins.length > 0">
                <p class="small text-muted mb-2">Đăng nhập nhanh:</p>
                <div class="recent-accounts">
                    <div v-for="account in recentLogins" :key="account.id" class="recent-account"
                        @click="selectRecentAccount(account)">
                        <img :src="account.avatar" :alt="account.name" class="account-avatar" />
                        <div class="account-info">
                            <div class="account-name">{{ account.name }}</div>
                            <div class="account-email">{{ account.email }}</div>
                        </div>
                        <button type="button" class="btn-remove" @click.stop="removeRecentAccount(account.id)"
                            title="Xóa khỏi danh sách">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>

            <!-- Login Form -->
            <form @submit.prevent="handleLogin" class="login-form">
                <!-- Email/Username -->
                <div class="mb-3">
                    <label for="identifier" class="form-label">Email hoặc tên đăng nhập</label>
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="fas fa-user"></i>
                        </span>
                        <input type="text" id="identifier" v-model="form.identifier" class="form-control"
                            :class="{ 'is-invalid': errors.identifier }" placeholder="Nhập email hoặc tên đăng nhập"
                            autocomplete="username" @blur="validateField('identifier')"
                            @input="clearError('identifier')" :disabled="isLoading" />
                    </div>
                    <div v-if="errors.identifier" class="invalid-feedback d-block">
                        {{ errors.identifier }}
                    </div>
                </div>

                <!-- Password -->
                <div class="mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <label for="password" class="form-label">Mật khẩu</label>
                        <router-link to="/forgot-password" class="text-primary small text-decoration-none">
                            Quên mật khẩu?
                        </router-link>
                    </div>
                    <div class="input-group">
                        <span class="input-group-text">
                            <i class="fas fa-lock"></i>
                        </span>
                        <input :type="showPassword ? 'text' : 'password'" id="password" v-model="form.password"
                            class="form-control" :class="{ 'is-invalid': errors.password }" placeholder="Nhập mật khẩu"
                            autocomplete="current-password" @blur="validateField('password')"
                            @input="clearError('password')" @keypress.enter="handleLogin" :disabled="isLoading" />
                        <button type="button" class="btn btn-outline-secondary" @click="togglePasswordVisibility"
                            :disabled="isLoading">
                            <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                        </button>
                    </div>
                    <div v-if="errors.password" class="invalid-feedback d-block">
                        {{ errors.password }}
                    </div>
                </div>

                <!-- Remember Me & Options -->
                <div class="row mb-4">
                    <div class="col-6">
                        <div class="form-check">
                            <input type="checkbox" id="rememberMe" v-model="form.rememberMe" class="form-check-input"
                                :disabled="isLoading" />
                            <label for="rememberMe" class="form-check-label small">
                                Ghi nhớ đăng nhập
                            </label>
                        </div>
                    </div>
                    <div class="col-6">
                        <div class="form-check">
                            <input type="checkbox" id="stayInvisible" v-model="form.stayInvisible"
                                class="form-check-input" :disabled="isLoading" />
                            <label for="stayInvisible" class="form-check-label small">
                                Ẩn trạng thái online
                            </label>
                        </div>
                    </div>
                </div>

                <!-- Two-Factor Authentication -->
                <div v-if="showTwoFactor" class="two-factor-section mb-4">
                    <div class="alert alert-info">
                        <i class="fas fa-shield-alt me-2"></i>
                        Tài khoản của bạn được bảo vệ bằng xác thực hai yếu tố
                    </div>

                    <div class="mb-3">
                        <label for="twoFactorCode" class="form-label">Mã xác thực 6 số</label>
                        <input type="text" id="twoFactorCode" v-model="twoFactorCode" class="form-control text-center"
                            :class="{ 'is-invalid': errors.twoFactorCode }" placeholder="000000" maxlength="6"
                            autocomplete="one-time-code" @input="handleTwoFactorInput" :disabled="isLoading" />
                        <div v-if="errors.twoFactorCode" class="invalid-feedback">
                            {{ errors.twoFactorCode }}
                        </div>
                        <small class="form-text text-muted">
                            Nhập mã từ ứng dụng xác thực của bạn
                        </small>
                    </div>

                    <!-- Backup Codes Option -->
                    <div class="text-center">
                        <button type="button" class="btn btn-link btn-sm" @click="showBackupCodes = !showBackupCodes"
                            :disabled="isLoading">
                            Sử dụng mã dự phòng
                        </button>
                    </div>

                    <div v-if="showBackupCodes" class="backup-codes mt-3">
                        <label for="backupCode" class="form-label">Mã dự phòng</label>
                        <input type="text" id="backupCode" v-model="backupCode" class="form-control"
                            :class="{ 'is-invalid': errors.backupCode }" placeholder="Nhập mã dự phòng 8 ký tự"
                            maxlength="8" :disabled="isLoading" />
                        <div v-if="errors.backupCode" class="invalid-feedback">
                            {{ errors.backupCode }}
                        </div>
                    </div>
                </div>

                <!-- Login Button -->
                <div class="d-grid gap-2 mb-3">
                    <button type="submit" class="btn btn-primary btn-lg" :disabled="isLoading || !canSubmit">
                        <span v-if="isLoading" class="spinner-border spinner-border-sm me-2" role="status">
                            <span class="visually-hidden">Đang đăng nhập...</span>
                        </span>
                        <i v-else class="fas fa-sign-in-alt me-2"></i>
                        {{ loginButtonText }}
                    </button>
                </div>

                <!-- Social Login -->
                <div class="social-login">
                    <div class="divider mb-3">
                        <span class="divider-text">Hoặc đăng nhập với</span>
                    </div>

                    <div class="row g-2">
                        <div class="col-6">
                            <button type="button" class="btn btn-outline-danger w-100" @click="loginWithGoogle"
                                :disabled="isLoading">
                                <i class="fab fa-google me-2"></i>
                                Google
                            </button>
                        </div>
                        <div class="col-6">
                            <button type="button" class="btn btn-outline-primary w-100" @click="loginWithFacebook"
                                :disabled="isLoading">
                                <i class="fab fa-facebook-f me-2"></i>
                                Facebook
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Register Link -->
                <div class="text-center mt-4">
                    <p class="text-muted mb-0">
                        Chưa có tài khoản?
                        <router-link to="/register" class="text-primary text-decoration-none">
                            Đăng ký ngay
                        </router-link>
                    </p>
                </div>
            </form>

            <!-- Connection Status -->
            <div class="connection-status mt-3">
                <div class="d-flex align-items-center justify-content-center">
                    <div :class="connectionStatusClass" class="status-dot me-2"></div>
                    <small class="text-muted">{{ connectionStatusText }}</small>
                </div>
            </div>

            <!-- Failed Attempts Warning -->
            <div v-if="failedAttempts >= 3" class="alert alert-warning mt-3">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>Cảnh báo:</strong> Bạn đã đăng nhập sai {{ failedAttempts }} lần.
                Tài khoản sẽ bị khóa tạm thời sau {{ maxAttempts - failedAttempts }} lần thử nữa.
            </div>

            <!-- Rate Limit Warning -->
            <div v-if="isRateLimited" class="alert alert-danger mt-3">
                <i class="fas fa-ban me-2"></i>
                <strong>Tài khoản tạm khóa:</strong> Quá nhiều lần đăng nhập sai.
                Vui lòng thử lại sau {{ rateLimitTime }} giây.
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePresenceStore } from '@/stores/presence'
import { useWebSocket } from '@/composables/useWebSocket'
import { useToast } from 'vue-toastification'

// Dependencies
const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const presenceStore = usePresenceStore()
const { isConnected } = useWebSocket()
const toast = useToast()

// State
const isLoading = ref(false)
const showPassword = ref(false)
const showTwoFactor = ref(false)
const showBackupCodes = ref(false)
const twoFactorCode = ref('')
const backupCode = ref('')
const failedAttempts = ref(0)
const maxAttempts = ref(5)
const isRateLimited = ref(false)
const rateLimitTime = ref(0)
const recentLogins = ref([])

// Form data
const form = ref({
    identifier: '',
    password: '',
    rememberMe: false,
    stayInvisible: false
})

// Validation
const errors = ref({})

// Computed
const canSubmit = computed(() => {
    if (showTwoFactor.value) {
        return form.value.identifier &&
            form.value.password &&
            (twoFactorCode.value.length === 6 || backupCode.value.length === 8) &&
            !isRateLimited.value
    }
    return form.value.identifier &&
        form.value.password &&
        Object.keys(errors.value).length === 0 &&
        !isRateLimited.value
})

const loginButtonText = computed(() => {
    if (isLoading.value) return 'Đang đăng nhập...'
    if (showTwoFactor.value) return 'Xác thực & Đăng nhập'
    return 'Đăng nhập'
})

const connectionStatusClass = computed(() => ({
    'status-dot': true,
    'bg-success': isConnected.value,
    'bg-warning': !isConnected.value,
    'animate-pulse': !isConnected.value
}))

const connectionStatusText = computed(() =>
    isConnected.value ? 'Đã kết nối server' : 'Đang kết nối...'
)

// Methods
const validateField = (field) => {
    switch (field) {
        case 'identifier':
            if (!form.value.identifier.trim()) {
                errors.value.identifier = 'Email hoặc tên đăng nhập không được để trống'
            }
            break

        case 'password':
            if (!form.value.password) {
                errors.value.password = 'Mật khẩu không được để trống'
            }
            break
    }
}

const clearError = (field) => {
    if (errors.value[field]) {
        delete errors.value[field]
    }
}

const togglePasswordVisibility = () => {
    showPassword.value = !showPassword.value
}

const handleTwoFactorInput = () => {
    clearError('twoFactorCode')

    // Auto-submit when 6 digits entered
    if (twoFactorCode.value.length === 6) {
        setTimeout(() => {
            if (canSubmit.value) {
                handleLogin()
            }
        }, 100)
    }
}

const selectRecentAccount = (account) => {
    form.value.identifier = account.email
    document.getElementById('password').focus()
}

const removeRecentAccount = (accountId) => {
    recentLogins.value = recentLogins.value.filter(acc => acc.id !== accountId)
    saveRecentLogins()
}

const saveRecentLogins = () => {
    localStorage.setItem('recentLogins', JSON.stringify(recentLogins.value))
}

const loadRecentLogins = () => {
    try {
        const saved = localStorage.getItem('recentLogins')
        if (saved) {
            recentLogins.value = JSON.parse(saved).slice(0, 3) // Max 3 recent accounts
        }
    } catch (error) {
        console.error('Error loading recent logins:', error)
        recentLogins.value = []
    }
}

const addRecentLogin = (user) => {
    // Remove existing entry if exists
    recentLogins.value = recentLogins.value.filter(acc => acc.id !== user.id)

    // Add to front
    recentLogins.value.unshift({
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar || '/default-avatar.png'
    })

    // Keep only 3 most recent
    recentLogins.value = recentLogins.value.slice(0, 3)
    saveRecentLogins()
}

const startRateLimitTimer = () => {
    rateLimitTime.value = 60 // 1 minute
    isRateLimited.value = true

    const timer = setInterval(() => {
        rateLimitTime.value--
        if (rateLimitTime.value <= 0) {
            clearInterval(timer)
            isRateLimited.value = false
            failedAttempts.value = 0
        }
    }, 1000)
}

const handleLogin = async () => {
    if (!canSubmit.value || isLoading.value) return

    // Validate form
    Object.keys(form.value).slice(0, 2).forEach(validateField)
    if (Object.keys(errors.value).length > 0) return

    isLoading.value = true

    try {
        const loginData = {
            identifier: form.value.identifier,
            password: form.value.password,
            rememberMe: form.value.rememberMe,
            stayInvisible: form.value.stayInvisible
        }

        // Add 2FA data if applicable
        if (showTwoFactor.value) {
            if (twoFactorCode.value) {
                loginData.twoFactorCode = twoFactorCode.value
            } else if (backupCode.value) {
                loginData.backupCode = backupCode.value
            }
        }

        const result = await authStore.login(loginData)

        // Handle 2FA requirement
        if (result.requiresTwoFactor && !showTwoFactor.value) {
            showTwoFactor.value = true
            toast.info('Vui lòng nhập mã xác thực hai yếu tố')
            return
        }

        // Login successful
        toast.success('Đăng nhập thành công!')

        // Add to recent logins
        addRecentLogin(result.user)

        // Update presence if not staying invisible
        if (!form.value.stayInvisible) {
            presenceStore.setOnline()
        }

        // Redirect to intended page or dashboard
        const redirectTo = route.query.redirect || '/dashboard'
        router.push(redirectTo)

        // Reset failed attempts
        failedAttempts.value = 0

    } catch (error) {
        console.error('Login error:', error)

        failedAttempts.value++

        if (error.response?.status === 401) {
            if (showTwoFactor.value) {
                errors.value.twoFactorCode = 'Mã xác thực không chính xác'
                twoFactorCode.value = ''
                backupCode.value = ''
            } else {
                errors.value.password = 'Email/tên đăng nhập hoặc mật khẩu không chính xác'
            }
        } else if (error.response?.status === 423) {
            // Account locked
            toast.error('Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.')
        } else if (error.response?.status === 429) {
            // Rate limited
            startRateLimitTimer()
            toast.error('Quá nhiều lần đăng nhập sai. Vui lòng thử lại sau.')
        } else {
            toast.error('Đăng nhập thất bại. Vui lòng thử lại.')
        }

        // Auto-lock after max attempts
        if (failedAttempts.value >= maxAttempts.value) {
            startRateLimitTimer()
        }
    } finally {
        isLoading.value = false
    }
}

const loginWithGoogle = async () => {
    if (isLoading.value) return

    isLoading.value = true
    try {
        await authStore.loginWithGoogle()
        toast.success('Đăng nhập Google thành công!')
        router.push(route.query.redirect || '/dashboard')
    } catch (error) {
        console.error('Google login error:', error)
        toast.error('Đăng nhập Google thất bại')
    } finally {
        isLoading.value = false
    }
}

const loginWithFacebook = async () => {
    if (isLoading.value) return

    isLoading.value = true
    try {
        await authStore.loginWithFacebook()
        toast.success('Đăng nhập Facebook thành công!')
        router.push(route.query.redirect || '/dashboard')
    } catch (error) {
        console.error('Facebook login error:', error)
        toast.error('Đăng nhập Facebook thất bại')
    } finally {
        isLoading.value = false
    }
}

// Lifecycle
onMounted(() => {
    loadRecentLogins()

    // Auto-focus first empty field
    if (!form.value.identifier) {
        document.getElementById('identifier')?.focus()
    } else {
        document.getElementById('password')?.focus()
    }

    // Check if redirected from registration
    if (route.query.registered === 'true') {
        toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
    }

    // Check if logged out
    if (route.query.logout === 'true') {
        toast.info('Bạn đã đăng xuất thành công.')
    }
})

// Watch for connection status changes
watch(isConnected, (newValue) => {
    if (!newValue) {
        toast.warning('Mất kết nối server. Đang thử kết nối lại...')
    }
})
</script>

<style scoped>
.user-login {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 2rem 1rem;
}

.login-container {
    background: white;
    border-radius: 1rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    padding: 2rem;
    width: 100%;
    max-width: 450px;
}

.recent-accounts {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.recent-account {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.recent-account:hover {
    background-color: var(--bs-light);
    border-color: var(--bs-primary);
}

.account-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 0.75rem;
}

.account-info {
    flex: 1;
}

.account-name {
    font-weight: 500;
    font-size: 0.875rem;
}

.account-email {
    font-size: 0.75rem;
    color: var(--bs-secondary);
}

.btn-remove {
    background: none;
    border: none;
    color: var(--bs-secondary);
    padding: 0.25rem;
    border-radius: 50%;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: all 0.2s ease;
}

.recent-account:hover .btn-remove {
    opacity: 1;
}

.btn-remove:hover {
    background-color: var(--bs-danger);
    color: white;
}

.divider {
    position: relative;
    text-align: center;
}

.divider::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 0;
    right: 0;
    height: 1px;
    background-color: var(--bs-border-color);
}

.divider-text {
    background-color: white;
    padding: 0 1rem;
    color: var(--bs-secondary);
    font-size: 0.875rem;
}

.two-factor-section {
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    padding: 1rem;
    background-color: var(--bs-light);
}

.backup-codes {
    padding-top: 1rem;
    border-top: 1px solid var(--bs-border-color);
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: .5;
    }
}

@media (max-width: 768px) {
    .login-container {
        margin: 1rem;
        padding: 1.5rem;
    }
}
</style>