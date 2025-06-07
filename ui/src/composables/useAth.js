import { computed, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'

export function useAuth() {
    const authStore = useAuthStore()
    const router = useRouter()
    const toast = useToast()

    // Form states
    const loginForm = ref({
        email: '',
        password: '',
        rememberMe: false
    })

    const registerForm = ref({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstName: '',
        lastName: '',
        agreeToTerms: false
    })

    const passwordForm = ref({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
    })

    // Validation errors
    const loginErrors = ref({})
    const registerErrors = ref({})
    const passwordErrors = ref({})

    // Loading states
    const isLoggingIn = ref(false)
    const isRegistering = ref(false)
    const isChangingPassword = ref(false)

    // Computed
    const isAuthenticated = computed(() => authStore.isAuthenticated)
    const currentUser = computed(() => authStore.userProfile)
    const isLoading = computed(() => authStore.isLoading)

    // Validation functions
    const validateLoginForm = () => {
        const errors = {}

        if (!loginForm.value.email) {
            errors.email = 'Email là bắt buộc'
        } else if (!/\S+@\S+\.\S+/.test(loginForm.value.email)) {
            errors.email = 'Email không hợp lệ'
        }

        if (!loginForm.value.password) {
            errors.password = 'Mật khẩu là bắt buộc'
        } else if (loginForm.value.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        }

        loginErrors.value = errors
        return Object.keys(errors).length === 0
    }

    const validateRegisterForm = () => {
        const errors = {}

        if (!registerForm.value.username) {
            errors.username = 'Tên người dùng là bắt buộc'
        } else if (registerForm.value.username.length < 3) {
            errors.username = 'Tên người dùng phải có ít nhất 3 ký tự'
        } else if (!/^[a-zA-Z0-9_]+$/.test(registerForm.value.username)) {
            errors.username = 'Tên người dùng chỉ chứa chữ cái, số và dấu gạch dưới'
        }

        if (!registerForm.value.email) {
            errors.email = 'Email là bắt buộc'
        } else if (!/\S+@\S+\.\S+/.test(registerForm.value.email)) {
            errors.email = 'Email không hợp lệ'
        }

        if (!registerForm.value.password) {
            errors.password = 'Mật khẩu là bắt buộc'
        } else if (registerForm.value.password.length < 6) {
            errors.password = 'Mật khẩu phải có ít nhất 6 ký tự'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(registerForm.value.password)) {
            errors.password = 'Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
        }

        if (registerForm.value.password !== registerForm.value.confirmPassword) {
            errors.confirmPassword = 'Xác nhận mật khẩu không khớp'
        }

        if (!registerForm.value.firstName) {
            errors.firstName = 'Họ là bắt buộc'
        }

        if (!registerForm.value.lastName) {
            errors.lastName = 'Tên là bắt buộc'
        }

        if (!registerForm.value.agreeToTerms) {
            errors.agreeToTerms = 'Bạn phải đồng ý với điều khoản sử dụng'
        }

        registerErrors.value = errors
        return Object.keys(errors).length === 0
    }

    const validatePasswordForm = () => {
        const errors = {}

        if (!passwordForm.value.currentPassword) {
            errors.currentPassword = 'Mật khẩu hiện tại là bắt buộc'
        }

        if (!passwordForm.value.newPassword) {
            errors.newPassword = 'Mật khẩu mới là bắt buộc'
        } else if (passwordForm.value.newPassword.length < 5) {
            errors.newPassword = 'Mật khẩu mới phải có ít nhất 6 ký tự'
        } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(passwordForm.value.newPassword)) {
            errors.newPassword = 'Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
        }

        if (passwordForm.value.newPassword !== passwordForm.value.confirmNewPassword) {
            errors.confirmNewPassword = 'Xác nhận mật khẩu mới không khớp'
        }

        if (passwordForm.value.currentPassword === passwordForm.value.newPassword) {
            errors.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại'
        }

        passwordErrors.value = errors
        return Object.keys(errors).length === 0
    }

    // Action functions
    const handleLogin = async () => {
        if (!validateLoginForm()) {
            return { success: false, errors: loginErrors.value }
        }

        isLoggingIn.value = true

        try {
            const result = await authStore.login({
                email: loginForm.value.email,
                password: loginForm.value.password
            })

            if (result.success) {
                // Save credentials if remember me is checked
                if (loginForm.value.rememberMe) {
                    localStorage.setItem('remembered_email', loginForm.value.email)
                } else {
                    localStorage.removeItem('remembered_email')
                }

                // Reset form
                resetLoginForm()
            }

            return result
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, error: error.message }
        } finally {
            isLoggingIn.value = false
        }
    }

    const handleRegister = async () => {
        if (!validateRegisterForm()) {
            return { success: false, errors: registerErrors.value }
        }

        isRegistering.value = true

        try {
            const result = await authStore.register(registerForm.value)

            if (result.success) {
                resetRegisterForm()
            }

            return result
        } catch (error) {
            console.error('Registration error:', error)
            return { success: false, error: error.message }
        } finally {
            isRegistering.value = false
        }
    }

    const handleLogout = async () => {
        try {
            await authStore.logout()
        } catch (error) {
            console.error('Logout error:', error)
            toast.error('Có lỗi xảy ra khi đăng xuất')
        }
    }

    const handlePasswordChange = async () => {
        if (!validatePasswordForm()) {
            return { success: false, errors: passwordErrors.value }
        }

        isChangingPassword.value = true

        try {
            const result = await authStore.changePassword({
                currentPassword: passwordForm.value.currentPassword,
                newPassword: passwordForm.value.newPassword
            })

            if (result.success) {
                resetPasswordForm()
            }

            return result
        } catch (error) {
            console.error('Password change error:', error)
            return { success: false, error: error.message }
        } finally {
            isChangingPassword.value = false
        }
    }

    const updateUserStatus = async (status) => {
        try {
            await authStore.updateUserStatus(status)
        } catch (error) {
            console.error('Status update error:', error)
        }
    }

    // Helper functions
    const resetLoginForm = () => {
        loginForm.value = {
            email: '',
            password: '',
            rememberMe: false
        }
        loginErrors.value = {}
    }

    const resetRegisterForm = () => {
        registerForm.value = {
            username: '',
            email: '',
            password: '',
            confirmPassword: '',
            firstName: '',
            lastName: '',
            agreeToTerms: false
        }
        registerErrors.value = {}
    }

    const resetPasswordForm = () => {
        passwordForm.value = {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        }
        passwordErrors.value = {}
    }

    const loadRememberedCredentials = () => {
        const rememberedEmail = localStorage.getItem('remembered_email')
        if (rememberedEmail) {
            loginForm.value.email = rememberedEmail
            loginForm.value.rememberMe = true
        }
    }

    const requireAuth = () => {
        if (!isAuthenticated.value) {
            router.push({
                name: 'Login',
                query: { redirect: router.currentRoute.value.fullPath }
            })
            return false
        }
        return true
    }

    const requireGuest = () => {
        if (isAuthenticated.value) {
            router.push({ name: 'Feed' })
            return false
        }
        return true
    }

    // Auto-update user activity
    const updateActivity = () => {
        if (isAuthenticated.value) {
            authStore.updateActivity()
        }
    }

    // Setup activity tracking
    if (typeof window !== 'undefined') {
        ['click', 'keypress', 'scroll', 'mousemove'].forEach(event => {
            document.addEventListener(event, updateActivity, { passive: true })
        })
    }

    // Load remembered credentials on mount
    loadRememberedCredentials()

    return {
        // State
        loginForm,
        registerForm,
        passwordForm,
        loginErrors,
        registerErrors,
        passwordErrors,
        isLoggingIn,
        isRegistering,
        isChangingPassword,

        // Computed
        isAuthenticated,
        currentUser,
        isLoading,

        // Actions
        handleLogin,
        handleRegister,
        handleLogout,
        handlePasswordChange,
        updateUserStatus,

        // Validation
        validateLoginForm,
        validateRegisterForm,
        validatePasswordForm,

        // Helpers
        resetLoginForm,
        resetRegisterForm,
        resetPasswordForm,
        loadRememberedCredentials,
        requireAuth,
        requireGuest,
        updateActivity
    }
}