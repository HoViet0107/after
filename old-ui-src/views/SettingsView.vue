// Trang cài đặt người dùng với các tab settings, theme switching và preference management
<template>
    <div class="settings-view">
        <div class="container-fluid">
            <div class="row">
                <!-- Sidebar Navigation -->
                <div class="col-lg-3 col-md-4">
                    <div class="settings-sidebar bg-white rounded shadow-sm p-3 sticky-top">
                        <h5 class="mb-3">Cài đặt</h5>
                        <nav class="nav nav-pills flex-column">
                            <a
                                v-for="section in sections"
                                :key="section.key"
                                :class="['nav-link', { active: activeSection === section.key }]"
                                href="#"
                                @click.prevent="setActiveSection(section.key)"
                            >
                                <i :class="section.icon" class="me-2"></i>
                                {{ section.title }}
                                <span v-if="section.badge" class="badge bg-danger ms-auto">{{ section.badge }}</span>
                            </a>
                        </nav>
                    </div>
                </div>

                <!-- Main Content -->
                <div class="col-lg-9 col-md-8">
                    <div class="settings-content">
                        <!-- Profile Settings -->
                        <div v-show="activeSection === 'profile'" class="settings-section">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Thông tin cá nhân</h5>
                                </div>
                                <div class="card-body">
                                    <form @submit.prevent="updateProfile">
                                        <div class="row">
                                            <!-- Avatar Upload -->
                                            <div class="col-md-4 text-center mb-4">
                                                <div class="avatar-upload">
                                                    <img
                                                        :src="profileForm.avatar || '/default-avatar.png'"
                                                        alt="Avatar"
                                                        class="rounded-circle mb-3"
                                                        width="120"
                                                        height="120"
                                                    >
                                                    <div>
                                                        <input
                                                            ref="avatarInput"
                                                            type="file"
                                                            accept="image/*"
                                                            class="d-none"
                                                            @change="handleAvatarUpload"
                                                        >
                                                        <button
                                                            type="button"
                                                            class="btn btn-outline-primary btn-sm"
                                                            @click="$refs.avatarInput.click()"
                                                        >
                                                            Thay đổi ảnh
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Profile Form -->
                                            <div class="col-md-8">
                                                <div class="row">
                                                    <div class="col-md-6 mb-3">
                                                        <label class="form-label">Tên hiển thị</label>
                                                        <input
                                                            v-model="profileForm.displayName"
                                                            type="text"
                                                            class="form-control"
                                                            required
                                                        >
                                                    </div>
                                                    <div class="col-md-6 mb-3">
                                                        <label class="form-label">Tên người dùng</label>
                                                        <div class="input-group">
                                                            <span class="input-group-text">@</span>
                                                            <input
                                                                v-model="profileForm.username"
                                                                type="text"
                                                                class="form-control"
                                                                required
                                                            >
                                                        </div>
                                                    </div>
                                                    <div class="col-12 mb-3">
                                                        <label class="form-label">Email</label>
                                                        <input
                                                            v-model="profileForm.email"
                                                            type="email"
                                                            class="form-control"
                                                            required
                                                        >
                                                    </div>
                                                    <div class="col-12 mb-3">
                                                        <label class="form-label">Tiểu sử</label>
                                                        <textarea
                                                            v-model="profileForm.bio"
                                                            class="form-control"
                                                            rows="3"
                                                            maxlength="160"
                                                        ></textarea>
                                                        <div class="form-text">
                                                            {{ profileForm.bio?.length || 0 }}/160 ký tự
                                                        </div>
                                                    </div>
                                                    <div class="col-md-6 mb-3">
                                                        <label class="form-label">Số điện thoại</label>
                                                        <input
                                                            v-model="profileForm.phone"
                                                            type="tel"
                                                            class="form-control"
                                                        >
                                                    </div>
                                                    <div class="col-md-6 mb-3">
                                                        <label class="form-label">Ngày sinh</label>
                                                        <input
                                                            v-model="profileForm.birthDate"
                                                            type="date"
                                                            class="form-control"
                                                        >
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="d-flex justify-content-end">
                                            <button
                                                type="submit"
                                                class="btn btn-primary"
                                                :disabled="isUpdating"
                                            >
                                                <i v-if="isUpdating" class="fas fa-spinner fa-spin me-2"></i>
                                                {{ isUpdating ? 'Đang cập nhật...' : 'Lưu thay đổi' }}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>

                        <!-- Privacy Settings -->
                        <div v-show="activeSection === 'privacy'" class="settings-section">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Cài đặt riêng tư</h5>
                                </div>
                                <div class="card-body">
                                    <div class="privacy-settings">
                                        <div class="setting-item d-flex justify-content-between align-items-center py-3 border-bottom">
                                            <div>
                                                <strong>Tài khoản riêng tư</strong>
                                                <div class="text-muted small">Chỉ những người theo dõi mới có thể xem bài viết của bạn</div>
                                            </div>
                                            <div class="form-check form-switch">
                                                <input
                                                    v-model="privacySettings.isPrivate"
                                                    class="form-check-input"
                                                    type="checkbox"
                                                    @change="updatePrivacySetting('isPrivate', $event.target.checked)"
                                                >
                                            </div>
                                        </div>

                                        <div class="setting-item d-flex justify-content-between align-items-center py-3 border-bottom">
                                            <div>
                                                <strong>Hiển thị trạng thái online</strong>
                                                <div class="text-muted small">Cho phép người khác biết bạn đang online</div>
                                            </div>
                                            <div class="form-check form-switch">
                                                <input
                                                    v-model="privacySettings.showOnlineStatus"
                                                    class="form-check-input"
                                                    type="checkbox"
                                                    @change="updatePrivacySetting('showOnlineStatus', $event.target.checked)"
                                                >
                                            </div>
                                        </div>

                                        <div class="setting-item d-flex justify-content-between align-items-center py-3 border-bottom">
                                            <div>
                                                <strong>Cho phép tìm kiếm bằng email</strong>
                                                <div class="text-muted small">Người khác có thể tìm thấy bạn qua email</div>
                                            </div>
                                            <div class="form-check form-switch">
                                                <input
                                                    v-model="privacySettings.searchableByEmail"
                                                    class="form-check-input"
                                                    type="checkbox"
                                                    @change="updatePrivacySetting('searchableByEmail', $event.target.checked)"
                                                >
                                            </div>
                                        </div>

                                        <div class="setting-item d-flex justify-content-between align-items-center py-3">
                                            <div>
                                                <strong>Cho phép nhắn tin từ người lạ</strong>
                                                <div class="text-muted small">Người không theo dõi bạn có thể gửi tin nhắn</div>
                                            </div>
                                            <div class="form-check form-switch">
                                                <input
                                                    v-model="privacySettings.allowMessagesFromStrangers"
                                                    class="form-check-input"
                                                    type="checkbox"
                                                    @change="updatePrivacySetting('allowMessagesFromStrangers', $event.target.checked)"
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Notification Settings -->
                        <div v-show="activeSection === 'notifications'" class="settings-section">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Cài đặt thông báo</h5>
                                </div>
                                <div class="card-body">
                                    <div class="notification-settings">
                                        <h6>Thông báo Push</h6>
                                        <div class="setting-group mb-4">
                                            <div v-for="notification in notificationTypes" :key="notification.key" 
                                                 class="setting-item d-flex justify-content-between align-items-center py-2">
                                                <div>
                                                    <strong>{{ notification.title }}</strong>
                                                    <div class="text-muted small">{{ notification.description }}</div>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input
                                                        v-model="notificationSettings[notification.key]"
                                                        class="form-check-input"
                                                        type="checkbox"
                                                        @change="updateNotificationSetting(notification.key, $event.target.checked)"
                                                    >
                                                </div>
                                            </div>
                                        </div>

                                        <h6>Thông báo Email</h6>
                                        <div class="setting-group">
                                            <div v-for="email in emailNotificationTypes" :key="email.key" 
                                                 class="setting-item d-flex justify-content-between align-items-center py-2">
                                                <div>
                                                    <strong>{{ email.title }}</strong>
                                                    <div class="text-muted small">{{ email.description }}</div>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input
                                                        v-model="emailSettings[email.key]"
                                                        class="form-check-input"
                                                        type="checkbox"
                                                        @change="updateEmailSetting(email.key, $event.target.checked)"
                                                    >
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Appearance Settings -->
                        <div v-show="activeSection === 'appearance'" class="settings-section">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Giao diện</h5>
                                </div>
                                <div class="card-body">
                                    <div class="appearance-settings">
                                        <div class="mb-4">
                                            <label class="form-label">Chủ đề</label>
                                            <div class="theme-selector d-flex gap-3">
                                                <div
                                                    v-for="theme in themes"
                                                    :key="theme.value"
                                                    :class="['theme-option', { active: appearanceSettings.theme === theme.value }]"
                                                    @click="changeTheme(theme.value)"
                                                >
                                                    <div :class="['theme-preview', theme.value]"></div>
                                                    <span class="theme-name">{{ theme.label }}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="mb-4">
                                            <label class="form-label">Kích thước chữ</label>
                                            <select
                                                v-model="appearanceSettings.fontSize"
                                                class="form-select"
                                                @change="updateAppearanceSetting('fontSize', $event.target.value)"
                                            >
                                                <option value="small">Nhỏ</option>
                                                <option value="medium">Trung bình</option>
                                                <option value="large">Lớn</option>
                                            </select>
                                        </div>

                                        <div class="setting-item d-flex justify-content-between align-items-center py-3">
                                            <div>
                                                <strong>Chế độ nén dữ liệu</strong>
                                                <div class="text-muted small">Giảm dung lượng tải xuống</div>
                                            </div>
                                            <div class="form-check form-switch">
                                                <input
                                                    v-model="appearanceSettings.dataSaver"
                                                    class="form-check-input"
                                                    type="checkbox"
                                                    @change="updateAppearanceSetting('dataSaver', $event.target.checked)"
                                                >
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Security Settings -->
                        <div v-show="activeSection === 'security'" class="settings-section">
                            <div class="card">
                                <div class="card-header">
                                    <h5 class="mb-0">Bảo mật</h5>
                                </div>
                                <div class="card-body">
                                    <div class="security-settings">
                                        <!-- Change Password -->
                                        <div class="mb-4">
                                            <h6>Thay đổi mật khẩu</h6>
                                            <form @submit.prevent="changePassword">
                                                <div class="row">
                                                    <div class="col-md-6 mb-3">
                                                        <label class="form-label">Mật khẩu hiện tại</label>
                                                        <input
                                                            v-model="passwordForm.currentPassword"
                                                            type="password"
                                                            class="form-control"
                                                            required
                                                        >
                                                    </div>
                                                    <div class="col-md-6 mb-3">
                                                        <label class="form-label">Mật khẩu mới</label>
                                                        <input
                                                            v-model="passwordForm.newPassword"
                                                            type="password"
                                                            class="form-control"
                                                            required
                                                        >
                                                    </div>
                                                    <div class="col-12 mb-3">
                                                        <button type="submit" class="btn btn-primary">
                                                            Thay đổi mật khẩu
                                                        </button>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>

                                        <!-- Two Factor Authentication -->
                                        <div class="mb-4">
                                            <div class="d-flex justify-content-between align-items-center">
                                                <div>
                                                    <h6>Xác thực hai yếu tố</h6>
                                                    <small class="text-muted">Bảo vệ tài khoản với lớp bảo mật bổ sung</small>
                                                </div>
                                                <button
                                                    class="btn btn-outline-primary"
                                                    @click="toggle2FA"
                                                >
                                                    {{ securitySettings.twoFactorEnabled ? 'Tắt' : 'Bật' }}
                                                </button>
                                            </div>
                                        </div>

                                        <!-- Active Sessions -->
                                        <div>
                                            <h6>Phiên đăng nhập</h6>
                                            <div class="sessions-list">
                                                <div v-for="session in activeSessions" :key="session.id"
                                                     class="session-item d-flex justify-content-between align-items-center py-3 border-bottom">
                                                    <div>
                                                        <strong>{{ session.device }}</strong>
                                                        <div class="text-muted small">
                                                            {{ session.location }} • {{ formatDate(session.lastActive) }}
                                                        </div>
                                                    </div>
                                                    <button
                                                        v-if="!session.current"
                                                        class="btn btn-outline-danger btn-sm"
                                                        @click="terminateSession(session.id)"
                                                    >
                                                        Kết thúc
                                                    </button>
                                                    <span v-else class="badge bg-success">Hiện tại</span>
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
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useToast } from 'vue-toastification'
import { useAuthStore } from '@/stores/auth'
import { formatDate } from '@/filters/dateFilter'

// Composables
const toast = useToast()
const authStore = useAuthStore()

// Reactive data
const activeSection = ref('profile')
const isUpdating = ref(false)

// Settings data
const profileForm = reactive({
    displayName: '',
    username: '',
    email: '',
    bio: '',
    phone: '',
    birthDate: '',
    avatar: ''
})

const privacySettings = reactive({
    isPrivate: false,
    showOnlineStatus: true,
    searchableByEmail: true,
    allowMessagesFromStrangers: false
})

const notificationSettings = reactive({
    likes: true,
    comments: true,
    follows: true,
    mentions: true,
    messages: true
})

const emailSettings = reactive({
    weeklyDigest: true,
    newFollowers: false,
    marketingEmails: false
})

const appearanceSettings = reactive({
    theme: 'auto',
    fontSize: 'medium',
    dataSaver: false
})

const securitySettings = reactive({
    twoFactorEnabled: false
})

const passwordForm = reactive({
    currentPassword: '',
    newPassword: ''
})

const activeSessions = ref([])

// Static data
const sections = [
    { key: 'profile', title: 'Hồ sơ cá nhân', icon: 'fas fa-user' },
    { key: 'privacy', title: 'Riêng tư', icon: 'fas fa-shield-alt' },
    { key: 'notifications', title: 'Thông báo', icon: 'fas fa-bell' },
    { key: 'appearance', title: 'Giao diện', icon: 'fas fa-palette' },
    { key: 'security', title: 'Bảo mật', icon: 'fas fa-lock' }
]

const themes = [
    { value: 'light', label: 'Sáng' },
    { value: 'dark', label: 'Tối' },
    { value: 'auto', label: 'Tự động' }
]

const notificationTypes = [
    { key: 'likes', title: 'Lượt thích', description: 'Khi ai đó thích bài viết của bạn' },
    { key: 'comments', title: 'Bình luận', description: 'Khi ai đó bình luận bài viết của bạn' },
    { key: 'follows', title: 'Theo dõi', description: 'Khi ai đó theo dõi bạn' },
    { key: 'mentions', title: 'Nhắc đến', description: 'Khi ai đó nhắc đến bạn' },
    { key: 'messages', title: 'Tin nhắn', description: 'Khi có tin nhắn mới' }
]

const emailNotificationTypes = [
    { key: 'weeklyDigest', title: 'Tóm tắt hàng tuần', description: 'Nhận tóm tắt hoạt động qua email' },
    { key: 'newFollowers', title: 'Người theo dõi mới', description: 'Thông báo qua email về người theo dõi mới' },
    { key: 'marketingEmails', title: 'Email tiếp thị', description: 'Nhận thông tin về tính năng mới' }
]

// Methods
const setActiveSection = (section) => {
    activeSection.value = section
}

const updateProfile = async () => {
    try {
        isUpdating.value = true
        
        // TODO: Call API to update profile
        await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
        
        toast.success('Cập nhật thông tin thành công!')
    } catch (error) {
        console.error('Update profile error:', error)
        toast.error('Có lỗi xảy ra khi cập nhật thông tin')
    } finally {
        isUpdating.value = false
    }
}

const handleAvatarUpload = (event) => {
    const file = event.target.files[0]
    if (file) {
        // TODO: Upload avatar and update profileForm.avatar
        const reader = new FileReader()
        reader.onload = (e) => {
            profileForm.avatar = e.target.result
        }
        reader.readAsDataURL(file)
    }
}

const updatePrivacySetting = async (key, value) => {
    try {
        // TODO: Call API to update privacy setting
        toast.success('Cập nhật cài đặt thành công!')
    } catch (error) {
        console.error('Update privacy setting error:', error)
        toast.error('Có lỗi xảy ra')
        // Revert the change
        privacySettings[key] = !value
    }
}

const updateNotificationSetting = async (key, value) => {
    try {
        // TODO: Call API to update notification setting
        toast.success('Cập nhật cài đặt thông báo thành công!')
    } catch (error) {
        console.error('Update notification setting error:', error)
        toast.error('Có lỗi xảy ra')
        notificationSettings[key] = !value
    }
}

const updateEmailSetting = async (key, value) => {
    try {
        // TODO: Call API to update email setting
        toast.success('Cập nhật cài đặt email thành công!')
    } catch (error) {
        console.error('Update email setting error:', error)
        toast.error('Có lỗi xảy ra')
        emailSettings[key] = !value
    }
}

const changeTheme = async (theme) => {
    try {
        appearanceSettings.theme = theme
        // TODO: Apply theme to UI
        document.documentElement.setAttribute('data-theme', theme)
        toast.success('Thay đổi chủ đề thành công!')
    } catch (error) {
        console.error('Change theme error:', error)
        toast.error('Có lỗi xảy ra')
    }
}

const updateAppearanceSetting = async (key, value) => {
    try {
        // TODO: Call API to update appearance setting
        toast.success('Cập nhật giao diện thành công!')
    } catch (error) {
        console.error('Update appearance setting error:', error)
        toast.error('Có lỗi xảy ra')
    }
}

const changePassword = async () => {
    try {
        // TODO: Call API to change password
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        passwordForm.currentPassword = ''
        passwordForm.newPassword = ''
        toast.success('Thay đổi mật khẩu thành công!')
    } catch (error) {
        console.error('Change password error:', error)
        toast.error('Có lỗi xảy ra khi thay đổi mật khẩu')
    }
}

const toggle2FA = async () => {
    try {
        // TODO: Implement 2FA toggle
        securitySettings.twoFactorEnabled = !securitySettings.twoFactorEnabled
        toast.success(`${securitySettings.twoFactorEnabled ? 'Bật' : 'Tắt'} xác thực hai yếu tố thành công!`)
    } catch (error) {
        console.error('Toggle 2FA error:', error)
        toast.error('Có lỗi xảy ra')
    }
}

const terminateSession = async (sessionId) => {
    try {
        // TODO: Call API to terminate session
        activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId)
        toast.success('Kết thúc phiên đăng nhập thành công!')
    } catch (error) {
        console.error('Terminate session error:', error)
        toast.error('Có lỗi xảy ra')
    }
}

// Lifecycle
onMounted(async () => {
    try {
        // Load user settings
        // TODO: Replace with actual API calls
        const user = authStore.user
        if (user) {
            Object.assign(profileForm, {
                displayName: user.displayName || '',
                username: user.username || '',
                email: user.email || '',
                bio: user.bio || '',
                phone: user.phone || '',
                birthDate: user.birthDate || '',
                avatar: user.avatar || ''
            })
        }

        // Load active sessions
        activeSessions.value = [
            {
                id: '1',
                device: 'Chrome on Windows',
                location: 'Hà Nội, Việt Nam',
                lastActive: new Date(),
                current: true
            },
            {
                id: '2',
                device: 'Mobile App',
                location: 'TP. Hồ Chí Minh, Việt Nam',
                lastActive: new Date(Date.now() - 3600000), // 1 hour ago
                current: false
            }
        ]
    } catch (error) {
        console.error('Load settings error:', error)
        toast.error('Có lỗi xảy ra khi tải cài đặt')
    }
})
</script>

<style lang="scss" scoped>
.settings-view {
    min-height: 100vh;
    background-color: #f8f9fa;
    padding: 2rem 0;

    .settings-sidebar {
        top: 2rem;
        
        .nav-link {
            color: #6c757d;
            border: none;
            border-radius: 0.5rem;
            margin-bottom: 0.25rem;
            
            &:hover {
                background-color: #f8f9fa;
                color: #0d6efd;
            }
            
            &.active {
                background-color: #0d6efd;
                color: white;
            }
        }
    }

    .settings-content {
        .card {
            border: none;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }

        .setting-item {
            &:last-child {
                border-bottom: none !important;
            }
        }

        .theme-selector {
            .theme-option {
                cursor: pointer;
                text-align: center;
                padding: 1rem;
                border: 2px solid transparent;
                border-radius: 0.5rem;
                transition: all 0.2s ease;

                &:hover {
                    border-color: #dee2e6;
                }

                &.active {
                    border-color: #0d6efd;
                }

                .theme-preview {
                    width: 60px;
                    height: 40px;
                    border-radius: 0.25rem;
                    margin: 0 auto 0.5rem;

                    &.light {
                        background: linear-gradient(135deg, #ffffff 50%, #f8f9fa 50%);
                        border: 1px solid #dee2e6;
                    }

                    &.dark {
                        background: linear-gradient(135deg, #212529 50%, #343a40 50%);
                    }

                    &.auto {
                        background: linear-gradient(135deg, #ffffff 50%, #212529 50%);
                        border: 1px solid #dee2e6;
                    }
                }

                .theme-name {
                    font-size: 0.875rem;
                    color: #6c757d;
                }
            }
        }

        .avatar-upload {
            img {
                border: 3px solid #fff;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
        }

        .sessions-list {
            .session-item:last-child {
                border-bottom: none !important;
            }
        }
    }
}

@media (max-width: 768px) {
    .settings-view {
        .settings-sidebar {
            position: static !important;
            margin-bottom: 2rem;
            
            .nav {
                flex-direction: row;
                overflow-x: auto;
                
                .nav-link {
                    white-space: nowrap;
                    margin-right: 0.5rem;
                    margin-bottom: 0;
                }
            }
        }

        .theme-selector {
            flex-direction: column;
            
            .theme-option {
                width: 100%;
            }
        }
    }
}
</style>