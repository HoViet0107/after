// src/stores/auth.js
// Authentication store với security, session management và persistent state

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { userService } from '@/api/services/userService'
import router from '@/router'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'

export const useAuthStore = defineStore('auth', () => {
    // Dependencies
    const cache = useCacheStore()
    const toast = useToast()

    // State
    const user = ref(null)
    const token = ref(localStorage.getItem('auth_token'))
    const refreshToken = ref(localStorage.getItem('refresh_token'))
    const isAuthenticated = ref(false)
    const isLoading = ref(false)
    const loginAttempts = ref(0)
    const lastLoginAttempt = ref(null)
    const sessionExpiry = ref(null)
    const deviceId = ref(localStorage.getItem('device_id') || generateDeviceId())
    const rememberMe = ref(localStorage.getItem('remember_me') === 'true')

    // Security settings
    const maxLoginAttempts = 5
    const lockoutDuration = 15 * 60 * 1000 // 15 minutes
    const sessionWarningTime = 5 * 60 * 1000 // 5 minutes before expiry
    const autoLogoutTime = 30 * 60 * 1000 // 30 minutes of inactivity

    // Activity tracking
    const lastActivity = ref(Date.now())
    const isSessionWarningShown = ref(false)

    // Computed
    const isLoggedIn = computed(() => isAuthenticated.value && !!user.value && !!token.value)

    const userProfile = computed(() => user.value)

    const isAccountLocked = computed(() => {
        if (loginAttempts.value >= maxLoginAttempts && lastLoginAttempt.value) {
            const timeSinceLastAttempt = Date.now() - lastLoginAttempt.value
            return timeSinceLastAttempt < lockoutDuration
        }
        return false
    })

    const lockoutTimeRemaining = computed(() => {
        if (!isAccountLocked.value) return 0
        const timeSinceLastAttempt = Date.now() - lastLoginAttempt.value
        return Math.max(0, lockoutDuration - timeSinceLastAttempt)
    })

    const sessionTimeRemaining = computed(() => {
        if (!sessionExpiry.value) return null
        return Math.max(0, sessionExpiry.value - Date.now())
    })

    const isSessionExpiringSoon = computed(() => {
        const remaining = sessionTimeRemaining.value
        return remaining && remaining <= sessionWarningTime
    })

    // Authentication actions
    const login = async (credentials) => {
        try {
            // Check if account is locked
            if (isAccountLocked.value) {
                return {
                    success: false,
                    error: `Tài khoản bị khóa. Thử lại sau ${Math.ceil(lockoutTimeRemaining.value / 60000)} phút.`
                }
            }

            isLoading.value = true

            // Add device info to credentials
            const loginData = {
                ...credentials,
                deviceId: deviceId.value,
                deviceInfo: getDeviceInfo(),
                timestamp: new Date().toISOString()
            }

            const response = await userService.login(loginData)

            if (response.success) {
                // Reset login attempts on successful login
                loginAttempts.value = 0
                lastLoginAttempt.value = null

                // Set authentication data
                await setAuthData(response.data)

                // Update activity
                updateLastActivity()

                // Setup session monitoring
                setupSessionMonitoring()

                // Redirect based on intended route or default
                const intendedRoute = router.currentRoute.value.query.redirect || '/app/feed'
                await router.push(intendedRoute)

                toast.success('Đăng nhập thành công!')

                return { success: true, data: response.data }
            } else {
                // Handle failed login
                loginAttempts.value++
                lastLoginAttempt.value = Date.now()

                // Save login attempts to localStorage to persist across refreshes
                localStorage.setItem('login_attempts', loginAttempts.value.toString())
                localStorage.setItem('last_login_attempt', lastLoginAttempt.value.toString())

                return response
            }
        } catch (error) {
            console.error('Login error:', error)
            return {
                success: false,
                error: 'Đăng nhập thất bại. Vui lòng thử lại sau.'
            }
        } finally {
            isLoading.value = false
        }
    }

    const register = async (userData) => {
        try {
            isLoading.value = true

            const response = await userService.register(userData)

            if (response.success) {
                // Auto-login after successful registration
                if (response.data.autoLogin) {
                    await setAuthData(response.data)
                    setupSessionMonitoring()
                    await router.push('/app/feed')
                } else {
                    // Redirect to email verification or login
                    await router.push('/auth/login?message=registration_success')
                }

                toast.success('Đăng ký thành công!')
                return { success: true, data: response.data }
            } else {
                return response
            }
        } catch (error) {
            console.error('Registration error:', error)
            return {
                success: false,
                error: 'Đăng ký thất bại. Vui lòng thử lại sau.'
            }
        } finally {
            isLoading.value = false
        }
    }

    const logout = async (showMessage = true) => {
        try {
            isLoading.value = true

            // Call logout API
            await userService.logout()

            // Clear auth data
            clearAuthData()

            // Redirect to login
            await router.push('/auth/login')

            if (showMessage) {
                toast.info('Đã đăng xuất thành công')
            }

            return { success: true }
        } catch (error) {
            console.error('Logout error:', error)
            // Clear local data even if API call fails
            clearAuthData()
            await router.push('/auth/login')

            return { success: false, error: error.message }
        } finally {
            isLoading.value = false
        }
    }

    const refreshAuthToken = async () => {
        try {
            if (!refreshToken.value) {
                throw new Error('No refresh token available')
            }

            const response = await userService.refreshToken()

            if (response.success) {
                // Update tokens
                setTokens(response.data.accessToken, response.data.refreshToken)

                // Extend session
                extendSession()

                return { success: true }
            } else {
                // Refresh failed, logout user
                await logout(false)
                return { success: false, error: 'Session expired' }
            }
        } catch (error) {
            console.error('Token refresh error:', error)
            await logout(false)
            return { success: false, error: error.message }
        }
    }

    const updateProfile = async (profileData) => {
        try {
            if (!user.value) {
                throw new Error('User not authenticated')
            }

            isLoading.value = true

            const response = await userService.updateProfile(user.value.id, profileData)

            if (response.success) {
                // Update user data
                user.value = { ...user.value, ...response.data }

                // Update in localStorage if remember me is enabled
                if (rememberMe.value) {
                    localStorage.setItem('user_data', JSON.stringify(user.value))
                }

                // Clear relevant caches
                cache.delete('current-user')
                cache.delete(`user-profile-${user.value.id}`)

                toast.success('Cập nhật profile thành công!')
                return { success: true, data: response.data }
            } else {
                return response
            }
        } catch (error) {
            console.error('Profile update error:', error)
            return {
                success: false,
                error: 'Cập nhật profile thất bại'
            }
        } finally {
            isLoading.value = false
        }
    }

    const changePassword = async (passwordData) => {
        try {
            isLoading.value = true

            const response = await userService.changePassword(passwordData)

            if (response.success) {
                toast.success('Đổi mật khẩu thành công!')
                return { success: true }
            } else {
                return response
            }
        } catch (error) {
            console.error('Password change error:', error)
            return {
                success: false,
                error: 'Đổi mật khẩu thất bại'
            }
        } finally {
            isLoading.value = false
        }
    }

    const verifyEmail = async (verificationToken) => {
        try {
            isLoading.value = true

            const response = await userService.verifyEmail(verificationToken)

            if (response.success) {
                if (user.value) {
                    user.value.emailVerified = true
                }
                toast.success('Email đã được xác thực!')
                return { success: true }
            } else {
                return response
            }
        } catch (error) {
            console.error('Email verification error:', error)
            return {
                success: false,
                error: 'Xác thực email thất bại'
            }
        } finally {
            isLoading.value = false
        }
    }

    // Session management
    const setAuthData = async (authData) => {
        try {
            // Set user data
            user.value = authData.user
            isAuthenticated.value = true

            // Set tokens
            setTokens(authData.accessToken, authData.refreshToken)

            // Set session expiry
            sessionExpiry.value = Date.now() + (authData.expiresIn * 1000)

            // Save to localStorage if remember me
            if (authData.rememberMe || rememberMe.value) {
                rememberMe.value = true
                localStorage.setItem('user_data', JSON.stringify(user.value))
                localStorage.setItem('remember_me', 'true')
                localStorage.setItem('session_expiry', sessionExpiry.value.toString())
            } else {
                // Use sessionStorage for temporary sessions
                sessionStorage.setItem('user_data', JSON.stringify(user.value))
                sessionStorage.setItem('session_expiry', sessionExpiry.value.toString())
            }

            // Cache user data
            cache.set('current-user', user.value, 15 * 60 * 1000) // 15 minutes

        } catch (error) {
            console.error('Error setting auth data:', error)
            throw error
        }
    }

    const setTokens = (accessToken, newRefreshToken) => {
        token.value = accessToken
        refreshToken.value = newRefreshToken

        if (rememberMe.value) {
            localStorage.setItem('auth_token', accessToken)
            if (newRefreshToken) {
                localStorage.setItem('refresh_token', newRefreshToken)
            }
        } else {
            sessionStorage.setItem('auth_token', accessToken)
            if (newRefreshToken) {
                sessionStorage.setItem('refresh_token', newRefreshToken)
            }
        }
    }

    const clearAuthData = () => {
        // Clear state
        user.value = null
        token.value = null
        refreshToken.value = null
        isAuthenticated.value = false
        sessionExpiry.value = null
        isSessionWarningShown.value = false

        // Clear storage
        localStorage.removeItem('auth_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('session_expiry')
        localStorage.removeItem('remember_me')

        sessionStorage.removeItem('auth_token')
        sessionStorage.removeItem('refresh_token')
        sessionStorage.removeItem('user_data')
        sessionStorage.removeItem('session_expiry')

        // Clear caches
        cache.clearAll()
    }

    const restoreSession = async () => {
        try {
            isLoading.value = true

            // Restore login attempts from localStorage
            const savedAttempts = localStorage.getItem('login_attempts')
            const savedLastAttempt = localStorage.getItem('last_login_attempt')

            if (savedAttempts) {
                loginAttempts.value = parseInt(savedAttempts)
            }
            if (savedLastAttempt) {
                lastLoginAttempt.value = parseInt(savedLastAttempt)
            }

            // Try to restore from localStorage first (persistent session)
            let userData = localStorage.getItem('user_data')
            let sessionExpiryStr = localStorage.getItem('session_expiry')
            let authToken = localStorage.getItem('auth_token')
            let refreshTokenValue = localStorage.getItem('refresh_token')

            // If not in localStorage, try sessionStorage (temporary session)
            if (!userData) {
                userData = sessionStorage.getItem('user_data')
                sessionExpiryStr = sessionStorage.getItem('session_expiry')
                authToken = sessionStorage.getItem('auth_token')
                refreshTokenValue = sessionStorage.getItem('refresh_token')
            }

            if (userData && authToken) {
                user.value = JSON.parse(userData)
                token.value = authToken
                refreshToken.value = refreshTokenValue
                isAuthenticated.value = true

                if (sessionExpiryStr) {
                    sessionExpiry.value = parseInt(sessionExpiryStr)
                }

                // Check if session is expired
                if (sessionExpiry.value && Date.now() > sessionExpiry.value) {
                    // Try to refresh token
                    const refreshResult = await refreshAuthToken()
                    if (!refreshResult.success) {
                        clearAuthData()
                        return false
                    }
                }

                // Setup session monitoring
                setupSessionMonitoring()

                // Verify token is still valid
                const currentUser = await userService.getCurrentUser()
                if (currentUser.success) {
                    user.value = currentUser.data
                    updateLastActivity()
                    return true
                } else {
                    // Token invalid, clear session
                    clearAuthData()
                    return false
                }
            }

            return false
        } catch (error) {
            console.error('Session restore error:', error)
            clearAuthData()
            return false
        } finally {
            isLoading.value = false
        }
    }

    // Activity and session monitoring
    const updateLastActivity = () => {
        lastActivity.value = Date.now()
        isSessionWarningShown.value = false
    }

    const setupSessionMonitoring = () => {
        // Monitor user activity
        const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']

        const handleActivity = () => {
            updateLastActivity()
        }

        // Add event listeners
        activityEvents.forEach(event => {
            document.addEventListener(event, handleActivity, true)
        })

        // Session monitoring interval
        const sessionInterval = setInterval(() => {
            if (!isAuthenticated.value) {
                clearInterval(sessionInterval)
                return
            }

            const now = Date.now()
            const timeSinceActivity = now - lastActivity.value

            // Auto logout after inactivity
            if (timeSinceActivity > autoLogoutTime) {
                logout(true)
                toast.warning('Đã đăng xuất do không hoạt động')
                clearInterval(sessionInterval)
                return
            }

            // Session expiry warning
            if (isSessionExpiringSoon.value && !isSessionWarningShown.value) {
                isSessionWarningShown.value = true
                showSessionExpiryWarning()
            }

            // Auto refresh token when nearing expiry
            if (sessionTimeRemaining.value && sessionTimeRemaining.value <= 2 * 60 * 1000) { // 2 minutes
                refreshAuthToken()
            }
        }, 60000) // Check every minute
    }

    const showSessionExpiryWarning = () => {
        toast.warning('Phiên đăng nhập sắp hết hạn. Bạn có muốn gia hạn?', {
            timeout: false,
            closeOnClick: false,
            closeButton: false,
            icon: false,
            position: 'top-center',
            component: 'SessionExpiryDialog', // Custom component
            onAction: (action) => {
                if (action === 'extend') {
                    refreshAuthToken()
                } else {
                    logout(true)
                }
            }
        })
    }

    const extendSession = () => {
        sessionExpiry.value = Date.now() + (30 * 60 * 1000) // Extend by 30 minutes
        updateLastActivity()

        if (rememberMe.value) {
            localStorage.setItem('session_expiry', sessionExpiry.value.toString())
        } else {
            sessionStorage.setItem('session_expiry', sessionExpiry.value.toString())
        }
    }

    // Utility functions
    const generateDeviceId = () => {
        const deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        localStorage.setItem('device_id', deviceId)
        return deviceId
    }

    const getDeviceInfo = () => {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            screenResolution: `${screen.width}x${screen.height}`,
            deviceId: deviceId.value
        }
    }

    // Security helpers
    const checkPermission = (permission) => {
        if (!user.value || !user.value.permissions) return false
        return user.value.permissions.includes(permission)
    }

    const hasRole = (role) => {
        if (!user.value || !user.value.roles) return false
        return user.value.roles.includes(role)
    }

    const canAccess = (resource) => {
        if (!user.value) return false

        // Admin can access everything
        if (hasRole('admin')) return true

        // Check specific permissions
        return checkPermission(resource)
    }

    // Clear login attempts (for admin/support)
    const clearLoginAttempts = () => {
        loginAttempts.value = 0
        lastLoginAttempt.value = null
        localStorage.removeItem('login_attempts')
        localStorage.removeItem('last_login_attempt')
    }

    return {
        // State
        user: computed(() => user.value),
        token: computed(() => token.value),
        isAuthenticated: computed(() => isAuthenticated.value),
        isLoading: computed(() => isLoading.value),
        isLoggedIn,
        userProfile,
        isAccountLocked,
        lockoutTimeRemaining,
        sessionTimeRemaining,
        isSessionExpiringSoon,
        lastActivity: computed(() => lastActivity.value),
        deviceId: computed(() => deviceId.value),

        // Actions
        login,
        register,
        logout,
        refreshAuthToken,
        updateProfile,
        changePassword,
        verifyEmail,
        restoreSession,
        updateLastActivity,
        extendSession,
        clearLoginAttempts,

        // Utilities
        checkPermission,
        hasRole,
        canAccess,
        getDeviceInfo
    }
})