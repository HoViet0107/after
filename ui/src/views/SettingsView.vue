<template>
    <div class="settings-view">
        <div class="container">
            <div class="row">
                <!-- Settings Sidebar -->
                <div class="col-lg-3">
                    <div class="settings-sidebar">
                        <h5 class="sidebar-title">Cài đặt</h5>
                        <nav class="nav nav-pills flex-column">
                            <button v-for="section in settingSections" :key="section.id" class="nav-link"
                                :class="{ active: activeSection === section.id }" @click="setActiveSection(section.id)">
                                <i :class="section.icon" class="me-2"></i>
                                {{ section.title }}
                                <span v-if="section.badge" class="badge bg-danger ms-auto">{{ section.badge }}</span>
                            </button>
                        </nav>
                    </div>
                </div>

                <!-- Settings Content -->
                <div class="col-lg-9">
                    <div class="settings-content">
                        <!-- Profile Settings -->
                        <div v-if="activeSection === 'profile'" class="settings-section">
                            <div class="section-header">
                                <h4>Thông tin cá nhân</h4>
                                <p class="text-muted">Quản lý thông tin hồ sơ của bạn</p>
                            </div>

                            <form @submit.prevent="saveProfile">
                                <!-- Avatar Upload -->
                                <div class="avatar-upload mb-4">
                                    <div class="avatar-preview">
                                        <UserAvatar :user="currentUser" :size="100" />
                                        <button type="button" class="avatar-edit-btn" @click="uploadAvatar">
                                            <i class="fas fa-camera"></i>
                                        </button>
                                    </div>
                                    <div class="avatar-info">
                                        <h6>Ảnh đại diện</h6>
                                        <p class="text-muted">JPG, PNG. Tối đa 5MB</p>
                                    </div>
                                </div>

                                <div class="row">
                                    <div class="col-md-6">
                                        <div class="form-group mb-3">
                                            <label class="form-label">Họ *</label>
                                            <input v-model="profileForm.firstName" type="text" class="form-control"
                                                required>
                                        </div>
                                    </div>
                                    <div class="col-md-6">
                                        <div class="form-group mb-3">
                                            <label class="form-label">Tên *</label>
                                            <input v-model="profileForm.lastName" type="text" class="form-control"
                                                required>
                                        </div>
                                    </div>
                                </div>

                                <div class="form-group mb-3">
                                    <label class="form-label">Tên người dùng *</label>
                                    <input v-model="profileForm.username" type="text" class="form-control" required>
                                </div>

                                <div class="form-group mb-3">
                                    <label class="form-label">Email *</label>
                                    <input v-model="profileForm.email" type="email" class="form-control" required>
                                </div>

                                <div class="form-group mb-3">
                                    <label class="form-label">Tiểu sử</label>
                                    <textarea v-model="profileForm.bio" class="form-control" rows="3" maxlength="160"
                                        placeholder="Viết vài dòng về bản thân..."></textarea>
                                    <small class="form-text text-muted">
                                        {{ profileForm.bio?.length || 0 }}/160 ký tự
                                    </small>
                                </div>

                                <div class="form-group mb-3">
                                    <label class="form-label">Số điện thoại</label>
                                    <input v-model="profileForm.phone" type="tel" class="form-control">
                                </div>

                                <button type="submit" class="btn btn-primary" :disabled="loading.profile">
                                    <i v-if="loading.profile" class="fas fa-spinner fa-spin me-2"></i>
                                    Lưu thay đổi
                                </button>
                            </form>
                        </div>

                        <!-- Privacy Settings -->
                        <div v-if="activeSection === 'privacy'" class="settings-section">
                            <div class="section-header">
                                <h4>Quyền riêng tư</h4>
                                <p class="text-muted">Kiểm soát ai có thể xem thông tin của bạn</p>
                            </div>

                            <form @submit.prevent="savePrivacy">
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Tài khoản riêng tư</h6>
                                        <p class="text-muted">Chỉ những người theo dõi mới có thể xem bài viết của bạn
                                        </p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="privacyForm.isPrivate" type="checkbox" class="form-check-input">
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Hiển thị trạng thái online</h6>
                                        <p class="text-muted">Cho phép người khác biết khi bạn đang online</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="privacyForm.showOnlineStatus" type="checkbox"
                                            class="form-check-input">
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Cho phép tìm kiếm bằng email</h6>
                                        <p class="text-muted">Người khác có thể tìm thấy bạn qua địa chỉ email</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="privacyForm.searchableByEmail" type="checkbox"
                                            class="form-check-input">
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Cho phép tin nhắn từ người lạ</h6>
                                        <p class="text-muted">Nhận tin nhắn từ những người không theo dõi bạn</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="privacyForm.allowMessagesFromStrangers" type="checkbox"
                                            class="form-check-input">
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-primary" :disabled="loading.privacy">
                                    <i v-if="loading.privacy" class="fas fa-spinner fa-spin me-2"></i>
                                    Lưu thay đổi
                                </button>
                            </form>
                        </div>

                        <!-- Notification Settings -->
                        <div v-if="activeSection === 'notifications'" class="settings-section">
                            <div class="section-header">
                                <h4>Thông báo</h4>
                                <p class="text-muted">Chọn loại thông báo bạn muốn nhận</p>
                            </div>

                            <form @submit.prevent="saveNotifications">
                                <h6 class="subsection-title">Thông báo ứng dụng</h6>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Lượt thích</h6>
                                        <p class="text-muted">Khi có người thích bài viết của bạn</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="notificationForm.likes" type="checkbox"
                                            class="form-check-input">
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Bình luận</h6>
                                        <p class="text-muted">Khi có người bình luận bài viết của bạn</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="notificationForm.comments" type="checkbox"
                                            class="form-check-input">
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Người theo dõi mới</h6>
                                        <p class="text-muted">Khi có người bắt đầu theo dõi bạn</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="notificationForm.follows" type="checkbox"
                                            class="form-check-input">
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Tin nhắn</h6>
                                        <p class="text-muted">Khi có tin nhắn mới</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="notificationForm.messages" type="checkbox"
                                            class="form-check-input">
                                    </div>
                                </div>

                                <h6 class="subsection-title mt-4">Thông báo email</h6>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Bản tin hàng tuần</h6>
                                        <p class="text-muted">Nhận tóm tắt hoạt động hàng tuần</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="emailForm.weeklyDigest" type="checkbox"
                                            class="form-check-input">
                                    </div>
                                </div>

                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Người theo dõi mới</h6>
                                        <p class="text-muted">Email khi có người theo dõi mới</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="emailForm.newFollowers" type="checkbox"
                                            class="form-check-input">
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-primary" :disabled="loading.notifications">
                                    <i v-if="loading.notifications" class="fas fa-spinner fa-spin me-2"></i>
                                    Lưu thay đổi
                                </button>
                            </form>
                        </div>

                        <!-- Security Settings -->
                        <div v-if="activeSection === 'security'" class="settings-section">
                            <div class="section-header">
                                <h4>Bảo mật</h4>
                                <p class="text-muted">Quản lý bảo mật tài khoản của bạn</p>
                            </div>

                            <!-- Change Password -->
                            <div class="security-subsection">
                                <h6>Đổi mật khẩu</h6>
                                <form @submit.prevent="changePassword">
                                    <div class="form-group mb-3">
                                        <label class="form-label">Mật khẩu hiện tại</label>
                                        <input v-model="passwordForm.currentPassword" type="password"
                                            class="form-control" required>
                                    </div>

                                    <div class="form-group mb-3">
                                        <label class="form-label">Mật khẩu mới</label>
                                        <input v-model="passwordForm.newPassword" type="password" class="form-control"
                                            minlength="8" required>
                                    </div>

                                    <div class="form-group mb-3">
                                        <label class="form-label">Xác nhận mật khẩu mới</label>
                                        <input v-model="passwordForm.confirmPassword" type="password"
                                            class="form-control" required>
                                    </div>

                                    <button type="submit" class="btn btn-primary" :disabled="loading.password">
                                        <i v-if="loading.password" class="fas fa-spinner fa-spin me-2"></i>
                                        Đổi mật khẩu
                                    </button>
                                </form>
                            </div>

                            <!-- Two Factor Authentication -->
                            <div class="security-subsection">
                                <h6>Xác thực hai yếu tố</h6>
                                <div class="setting-item">
                                    <div class="setting-info">
                                        <h6>Bật xác thực hai yếu tố</h6>
                                        <p class="text-muted">Thêm một lớp bảo mật cho tài khoản của bạn</p>
                                    </div>
                                    <div class="form-check form-switch">
                                        <input v-model="securityForm.twoFactorEnabled" type="checkbox"
                                            class="form-check-input" @change="toggleTwoFactor">
                                    </div>
                                </div>
                            </div>

                            <!-- Active Sessions -->
                            <div class="security-subsection">
                                <h6>Phiên đăng nhập</h6>
                                <div class="sessions-list">
                                    <div v-for="session in activeSessions" :key="session.id" class="session-item">
                                        <div class="session-info">
                                            <div class="session-device">
                                                <i :class="getDeviceIcon(session.device)" class="me-2"></i>
                                                {{ session.device }} - {{ session.browser }}
                                            </div>
                                            <div class="session-meta">
                                                <span class="session-location">{{ session.location }}</span>
                                                <span class="session-time">{{ formatDate(session.lastActive) }}</span>
                                            </div>
                                        </div>
                                        <div class="session-actions">
                                            <span v-if="session.isCurrent" class="badge bg-success">Hiện tại</span>
                                            <button v-else class="btn btn-sm btn-outline-danger"
                                                @click="terminateSession(session.id)">
                                                Đăng xuất
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAppStores } from '@/composables/useAppStores'
import { useLoadingStates } from '@/composables/useLoadingStates'
import { formatDate } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'

const toast = useToast()
const { authStore } = useAppStores()
const { loading, setLoading } = useLoadingStates(['profile', 'privacy', 'notifications', 'password'])

// State
const activeSection = ref('profile')
const activeSessions = ref([])

// Form data
const profileForm = reactive({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    bio: '',
    phone: ''
})

const privacyForm = reactive({
    isPrivate: false,
    showOnlineStatus: true,
    searchableByEmail: true,
    allowMessagesFromStrangers: false
})

const notificationForm = reactive({
    likes: true,
    comments: true,
    follows: true,
    messages: true
})

const emailForm = reactive({
    weeklyDigest: true,
    newFollowers: false
})

const securityForm = reactive({
    twoFactorEnabled: false
})

const passwordForm = reactive({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
})

// Computed
const currentUser = computed(() => authStore.user)

const settingSections = computed(() => [
    {
        id: 'profile',
        title: 'Hồ sơ',
        icon: 'fas fa-user'
    },
    {
        id: 'privacy',
        title: 'Quyền riêng tư',
        icon: 'fas fa-shield-alt'
    },
    {
        id: 'notifications',
        title: 'Thông báo',
        icon: 'fas fa-bell'
    },
    {
        id: 'security',
        title: 'Bảo mật',
        icon: 'fas fa-lock',
        badge: !securityForm.twoFactorEnabled ? '!' : null
    }
])

// Methods
const setActiveSection = (section) => {
    activeSection.value = section
}

const uploadAvatar = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = handleAvatarUpload
    input.click()
}

const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
    }

    try {
        const formData = new FormData()
        formData.append('avatar', file)

        await authStore.uploadAvatar(formData)
        toast.success('Cập nhật ảnh đại diện thành công!')

    } catch (error) {
        console.error('Avatar upload error:', error)
        toast.error('Upload ảnh thất bại. Vui lòng thử lại.')
    }
}

const saveProfile = async () => {
    setLoading('profile', true)
    try {
        await authStore.updateProfile(profileForm)
        toast.success('Cập nhật hồ sơ thành công!')
    } catch (error) {
        console.error('Save profile error:', error)
        toast.error('Cập nhật hồ sơ thất bại')
    } finally {
        setLoading('profile', false)
    }
}

const savePrivacy = async () => {
    setLoading('privacy', true)
    try {
        await authStore.updatePrivacySettings(privacyForm)
        toast.success('Cập nhật cài đặt riêng tư thành công!')
    } catch (error) {
        console.error('Save privacy error:', error)
        toast.error('Cập nhật cài đặt thất bại')
    } finally {
        setLoading('privacy', false)
    }
}

const saveNotifications = async () => {
    setLoading('notifications', true)
    try {
        await authStore.updateNotificationSettings({
            ...notificationForm,
            email: emailForm
        })
        toast.success('Cập nhật cài đặt thông báo thành công!')
    } catch (error) {
        console.error('Save notifications error:', error)
        toast.error('Cập nhật cài đặt thất bại')
    } finally {
        setLoading('notifications', false)
    }
}

const changePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        toast.error('Mật khẩu xác nhận không khớp')
        return
    }

    setLoading('password', true)
    try {
        await authStore.changePassword({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
        })

        // Reset form
        Object.keys(passwordForm).forEach(key => {
            passwordForm[key] = ''
        })

        toast.success('Đổi mật khẩu thành công!')
    } catch (error) {
        console.error('Change password error:', error)
        toast.error('Đổi mật khẩu thất bại')
    } finally {
        setLoading('password', false)
    }
}

const toggleTwoFactor = async () => {
    try {
        if (securityForm.twoFactorEnabled) {
            await authStore.enableTwoFactor()
            toast.success('Đã bật xác thực hai yếu tố')
        } else {
            await authStore.disableTwoFactor()
            toast.success('Đã tắt xác thực hai yếu tố')
        }
    } catch (error) {
        console.error('Toggle 2FA error:', error)
        securityForm.twoFactorEnabled = !securityForm.twoFactorEnabled // Revert
        toast.error('Có lỗi xảy ra')
    }
}

const loadActiveSessions = async () => {
    try {
        const response = await authStore.getActiveSessions()
        activeSessions.value = response.data
    } catch (error) {
        console.error('Load sessions error:', error)
    }
}

const terminateSession = async (sessionId) => {
    try {
        await authStore.terminateSession(sessionId)
        activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId)
        toast.success('Đã đăng xuất phiên')
    } catch (error) {
        console.error('Terminate session error:', error)
        toast.error('Không thể đăng xuất phiên')
    }
}

const getDeviceIcon = (device) => {
    if (device.includes('Mobile')) return 'fas fa-mobile-alt'
    if (device.includes('Tablet')) return 'fas fa-tablet-alt'
    return 'fas fa-desktop'
}

const loadUserSettings = async () => {
    try {
        const user = currentUser.value
        if (user) {
            // Load profile data
            Object.assign(profileForm, {
                firstName: user.firstName || '',
                lastName: user.lastName || '',
                username: user.username || '',
                email: user.email || '',
                bio: user.bio || '',
                phone: user.phone || ''
            })
        }

        // Load other settings from API
        const [privacySettings, notificationSettings, securitySettings] = await Promise.all([
            authStore.getPrivacySettings(),
            authStore.getNotificationSettings(),
            authStore.getSecuritySettings()
        ])

        Object.assign(privacyForm, privacySettings)
        Object.assign(notificationForm, notificationSettings.app)
        Object.assign(emailForm, notificationSettings.email)
        Object.assign(securityForm, securitySettings)

    } catch (error) {
        console.error('Load settings error:', error)
    }
}

// Lifecycle
onMounted(async () => {
    await Promise.all([
        loadUserSettings(),
        loadActiveSessions()
    ])
})
</script>

<style lang="scss" scoped>
.settings-view {
    min-height: 100vh;
    background: #f8f9fa;
    padding: 2rem 0;
}

.settings-sidebar {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
    position: sticky;
    top: 2rem;

    .sidebar-title {
        margin-bottom: 1.5rem;
        font-weight: 600;
    }

    .nav-pills {
        .nav-link {
            color: #6c757d;
            border-radius: 0.5rem;
            margin-bottom: 0.25rem;
            padding: 0.75rem 1rem;
            border: none;
            background: none;
            width: 100%;
            text-align: left;
            display: flex;
            align-items: center;
            transition: all 0.2s ease;

            &:hover {
                background: #f8f9fa;
                color: #495057;
            }

            &.active {
                background: #007bff;
                color: white;
            }

            i {
                width: 20px;
            }
        }
    }
}

.settings-content {
    background: white;
    border-radius: 0.75rem;
    padding: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
}

.section-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid #e9ecef;

    h4 {
        margin-bottom: 0.5rem;
        font-weight: 600;
    }
}

.avatar-upload {
    display: flex;
    align-items: center;
    gap: 1rem;

    .avatar-preview {
        position: relative;

        .avatar-edit-btn {
            position: absolute;
            bottom: 0;
            right: 0;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: #007bff;
            color: white;
            border: 2px solid white;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 0.8rem;

            &:hover {
                background: #0056b3;
            }
        }
    }

    .avatar-info {
        h6 {
            margin-bottom: 0.25rem;
        }

        p {
            margin: 0;
            font-size: 0.9rem;
        }
    }
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 1rem 0;
    border-bottom: 1px solid #f8f9fa;

    &:last-child {
        border-bottom: none;
    }

    .setting-info {
        flex: 1;

        h6 {
            margin-bottom: 0.25rem;
            font-weight: 600;
        }

        p {
            margin: 0;
            color: #6c757d;
            font-size: 0.9rem;
        }
    }

    .form-check-input {
        margin: 0;
    }
}

.subsection-title {
    margin: 2rem 0 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid #f8f9fa;
    font-weight: 600;
}

.security-subsection {
    margin-bottom: 3rem;

    &:last-child {
        margin-bottom: 0;
    }

    h6 {
        margin-bottom: 1rem;
        font-weight: 600;
    }
}

.sessions-list {
    .session-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1rem;
        border: 1px solid #e9ecef;
        border-radius: 0.5rem;
        margin-bottom: 0.75rem;

        &:last-child {
            margin-bottom: 0;
        }

        .session-info {
            flex: 1;

            .session-device {
                font-weight: 600;
                margin-bottom: 0.25rem;
            }

            .session-meta {
                display: flex;
                gap: 1rem;
                color: #6c757d;
                font-size: 0.9rem;
            }
        }

        .session-actions {
            display: flex;
            align-items: center;
        }
    }
}

@media (max-width: 992px) {
    .settings-sidebar {
        position: static;
        margin-bottom: 2rem;

        .nav-pills {
            flex-direction: row;
            overflow-x: auto;
            gap: 0.5rem;

            .nav-link {
                white-space: nowrap;
                margin-bottom: 0;
            }
        }
    }
}

@media (max-width: 768px) {
    .settings-view {
        padding: 1rem 0;
    }

    .settings-content {
        padding: 1.5rem;
    }

    .avatar-upload {
        flex-direction: column;
        text-align: center;
    }

    .setting-item {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }

    .session-item {
        flex-direction: column;
        align-items: stretch;
        gap: 1rem;
    }
}
</style>