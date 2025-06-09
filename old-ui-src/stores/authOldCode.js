import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { useToast } from 'vue-toastification'
import router from '@/router'

export const useAuthStore = defineStore('auth', () => {
    // State
    const user = ref(null)
    const token = ref(localStorage.getItem('auth_token'))
    const refreshToken = ref(localStorage.getItem('refresh_token'))
    const isLoading = ref(false)
    const isInitialized = ref(false)
    const lastActivity = ref(Date.now())

    // Getters
    const isAuthenticated = computed(() => !!token.value && !!user.value)
    const userProfile = computed(() => user.value)
    const userId = computed(() => user.value?.id)
    const userName = computed(() => user.value?.username)
    const userEmail = computed(() => user.value?.email)
    const userAvatar = computed(() => user.value?.avatar || '/default-avatar.png')
    const isOnline = computed(() => user.value?.status === 'online')

    // Actions
    const login = async (credentials) => {
        const toast = useToast()
        isLoading.value = true

        try {
            const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, {
                email: credentials.email,
                password: credentials.password
            })

            const { user: userData, token: authToken, refreshToken: refToken } = response.data

            // Set tokens
            setTokens(authToken, refToken)

            // Set user data
            user.value = userData

            // Update activity
            updateActivity()

            toast.success(`Chào mừng ${userData.username}!`)

            // Redirect after login success
            const redirectPath = router.currentRoute.value.query.redirect || '/app/feed'
            router.push(redirectPath)

            return { success: true, user: userData }
        } catch (error) {
            console.error('Login error:', error)

            let message = 'Đăng nhập thất bại'
            if (error.response?.status === 401) {
                message = 'Email hoặc mật khẩu không đúng'
            } else if (error.response?.status === 422) {
                message = 'Thông tin đăng nhập không hợp lệ'
            }

            toast.error(message)
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    const register = async (registrationData) => {
        const toast = useToast()
        isLoading.value = true

        try {
            // Call register API from UserController
            const response = await apiClient.post(ENDPOINTS.USERS.REGISTER, {
                username: registrationData.username,
                email: registrationData.email,
                password: registrationData.password,
                firstName: registrationData.firstName,
                lastName: registrationData.lastName
            })

            const { user: userData, token: authToken, refreshToken: refToken } = response.data

            // Set tokens and user data
            setTokens(authToken, refToken)
            user.value = userData
            updateActivity()

            toast.success('Đăng ký thành công!')
            router.push('/app/feed')

            return { success: true, user: userData }
        } catch (error) {
            console.error('Registration error:', error)

            let message = 'Đăng ký thất bại'
            if (error.response?.status === 400) {
                message = 'Email đã được sử dụng'
            }

            toast.error(message)
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    const logout = async () => {
        const toast = useToast()

        try {
            // Call API logout if token exists
            if (token.value) {
                await apiClient.post(ENDPOINTS.AUTH.LOGOUT)
            }
        } catch (error) {
            console.error('Logout error:', error)
        } finally {
            // Clear state regardless of API success
            clearAuthData()
            toast.info('Đã đăng xuất')
            router.push('/auth/login')
        }
    }

    const refreshAccessToken = async () => {
        if (!refreshToken.value) {
            throw new Error('No refresh token available')
        }

        try {
            const response = await apiClient.post(ENDPOINTS.AUTH.REFRESH, {
                refreshToken: refreshToken.value
            })

            const { token: newToken, refreshToken: newRefreshToken } = response.data
            setTokens(newToken, newRefreshToken)

            return newToken
        } catch (error) {
            console.error('Token refresh error:', error)
            await logout()
            throw error
        }
    }

    /**
     * Initializes the authentication state by validating the current token.
     * 
     * This function checks if the current authentication token is valid by calling
     * the user profile API. If the token is invalid, it attempts to refresh it.
     * If the refresh fails or no refresh token is available, all authentication
     * data is cleared.
     * 
     * The function manages loading and initialization states, and updates user data
     * when authentication is successful.
     * 
     * @async
     * @function initializeAuth
     * @returns {Promise<void>} A promise that resolves when initialization is complete
     * @throws {Error} Errors are caught and handled internally
     */
    const initializeAuth = async () => {
        if (isInitialized.value) return

        isLoading.value = true

        try {
            if (!token.value) {
                isInitialized.value = true
                return
            }

            // Check if token is valid by calling profile API
            const response = await apiClient.get(ENDPOINTS.USERS.PROFILE('me'))
            user.value = response.data
            updateActivity()

        } catch (error) {
            console.error('Auth initialization error:', error)

            // If token is invalid, try to refresh it
            if (refreshToken.value) {
                try {
                    await refreshAccessToken()
                    const response = await apiClient.get(ENDPOINTS.USERS.PROFILE('me'))
                    user.value = response.data
                    updateActivity()
                } catch (refreshError) {
                    clearAuthData()
                }
            } else {
                clearAuthData()
            }
        } finally {
            isLoading.value = false
            isInitialized.value = true
        }
    }

    const updateProfile = async (profileData) => {
        const toast = useToast()
        isLoading.value = true

        try {
            const response = await apiClient.put(
                ENDPOINTS.USERS.PROFILE(userId.value),
                profileData
            )

            user.value = { ...user.value, ...response.data }
            toast.success('Cập nhật hồ sơ thành công!')

            return { success: true, user: user.value }
        } catch (error) {
            console.error('Update profile error:', error)
            toast.error('Cập nhật hồ sơ thất bại')
            return { success: false, error: error.message }
        } finally {
            isLoading.value = false
        }
    }

    const updateUserStatus = async (status) => {
        try {
            await apiClient.post(ENDPOINTS.USERS.STATUS(userId.value), { status })

            if (user.value) {
                user.value.status = status
            }
        } catch (error) {
            console.error('Update status error:', error)
        }
    }

    const changePassword = async (passwordData) => {
        const toast = useToast()
        isLoading.value = true

        try {
            await apiClient.post(ENDPOINTS.AUTH.CHANGE_PASSWORD, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })

            toast.success('Đổi mật khẩu thành công!')
            return { success: true }
        } catch (error) {
            console.error('Change password error:', error)

            let message = 'Đổi mật khẩu thất bại'
            if (error.response?.status === 400) {
                message = 'Mật khẩu hiện tại không đúng'
            }

            toast.error(message)
            return { success: false, error: message }
        } finally {
            isLoading.value = false
        }
    }

    // Helper functions
    const setTokens = (authToken, refToken) => {
        token.value = authToken
        refreshToken.value = refToken

        localStorage.setItem('auth_token', authToken)
        if (refToken) {
            localStorage.setItem('refresh_token', refToken)
        }
    }

    const clearAuthData = () => {
        user.value = null
        token.value = null
        refreshToken.value = null

        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
    }

    const updateActivity = () => {
        lastActivity.value = Date.now()
    }

    // Auto logout after inactivity (30 minutes)
    const checkInactivity = () => {
        const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 minutes

        if (Date.now() - lastActivity.value > INACTIVITY_LIMIT) {
            logout()
        }
    }

    // Setup activity tracking
    if (typeof window !== 'undefined') {
        ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
            document.addEventListener(event, updateActivity, true)
        })

        // Check inactivity every minute
        setInterval(checkInactivity, 60000)
    }

    return {
        // State
        user,
        token,
        refreshToken,
        isLoading,
        isInitialized,
        lastActivity,

        // Getters
        isAuthenticated,
        userProfile,
        userId,
        userName,
        userEmail,
        userAvatar,
        isOnline,

        // Actions
        login,
        register,
        logout,
        refreshAccessToken,
        initializeAuth,
        updateProfile,
        updateUserStatus,
        changePassword,
        updateActivity
    }
})