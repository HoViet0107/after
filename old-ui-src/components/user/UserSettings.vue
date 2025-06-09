<!-- src/components/user/UserSettings.vue -->
<!-- Component cài đặt người dùng với Redis caching và WebSocket real-time sync -->

<template>
    <div class="user-settings">
        <div class="container-fluid">
            <div class="row">
                <!-- Settings Navigation -->
                <div class="col-lg-3 col-md-4">
                    <div class="settings-nav">
                        <div class="nav-header">
                            <h5 class="mb-0">
                                <i class="fas fa-cog me-2"></i>Cài đặt
                            </h5>
                        </div>

                        <nav class="nav nav-pills flex-column">
                            <button v-for="section in settingSections" :key="section.id" class="nav-link text-start"
                                :class="{ active: activeSection === section.id }" @click="setActiveSection(section.id)">
                                <i :class="section.icon" class="me-2"></i>
                                {{ section.title }}
                                <span v-if="section.badge" class="badge bg-danger ms-auto">
                                    {{ section.badge }}
                                </span>
                            </button>
                        </nav>
                    </div>
                </div>

                <!-- Settings Content -->
                <div class="col-lg-9 col-md-8">
                    <div class="settings-content">
                        <!-- Profile Settings -->
                        <div v-if="activeSection === 'profile'" class="settings-section">
                            <div class="section-header">
                                <h4>Thông tin cá nhân</h4>
                                <p class="text-muted">Quản lý thông tin hồ sơ và tài khoản của bạn</p>
                            </div>

                            <div class="card">
                                <div class="card-body">
                                    <!-- Avatar Upload -->
                                    <div class="row mb-4">
                                        <div class="col-md-3 text-center">
                                            <div class="avatar-upload">
                                                <div class="avatar-preview">
                                                    <img :src="profile.avatar || '/default-avatar.png'"
                                                        :alt="profile.name" class="avatar-img" />
                                                    <div class="avatar-overlay">
                                                        <i class="fas fa-camera"></i>
                                                    </div>
                                                </div>
                                                <input type="file" ref="avatarInput" accept="image/*"
                                                    @change="handleAvatarUpload" style="display: none" />
                                                <button type="button" class="btn btn-sm btn-outline-primary mt-2"
                                                    @click="$refs.avatarInput.click()" :disabled="isUploading">
                                                    <span v-if="isUploading"
                                                        class="spinner-border spinner-border-sm me-1"></span>
                                                    {{ isUploading ? 'Đang tải...' : 'Thay đổi ảnh' }}
                                                </button>
                                            </div>
                                        </div>

                                        <div class="col-md-9">
                                            <form @submit.prevent="updateProfile">
                                                <div class="row">
                                                    <div class="col-md-6 mb-3">
                                                        <label for="firstName" class="form-label">Họ</label>
                                                        <input type="text" id="firstName" v-model="profile.firstName"
                                                            class="form-control"
                                                            :class="{ 'is-invalid': errors.firstName }" />
                                                        <div v-if="errors.firstName" class="invalid-feedback">
                                                            {{ errors.firstName }}
                                                        </div>
                                                    </div>

                                                    <div class="col-md-6 mb-3">
                                                        <label for="lastName" class="form-label">Tên</label>
                                                        <input type="text" id="lastName" v-model="profile.lastName"
                                                            class="form-control"
                                                            :class="{ 'is-invalid': errors.lastName }" />
                                                        <div v-if="errors.lastName" class="invalid-feedback">
                                                            {{ errors.lastName }}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div class="mb-3">
                                                    <label for="bio" class="form-label">Giới thiệu bản thân</label>
                                                    <textarea id="bio" v-model="profile.bio" class="form-control"
                                                        rows="3" placeholder="Viết vài dòng về bản thân..."
                                                        maxlength="500"></textarea>
                                                    <div class="form-text">
                                                        {{ profile.bio?.length || 0 }}/500 ký tự
                                                    </div>
                                                </div>

                                                <div class="row">
                                                    <div class="col-md-6 mb-3">
                                                        <label for="phone" class="form-label">Số điện thoại</label>
                                                        <input type="tel" id="phone" v-model="profile.phone"
                                                            class="form-control" placeholder="+84 xxx xxx xxx" />
                                                    </div>

                                                    <div class="col-md-6 mb-3">
                                                        <label for="website" class="form-label">Website</label>
                                                        <input type="url" id="website" v-model="profile.website"
                                                            class="form-control" placeholder="https://example.com" />
                                                    </div>
                                                </div>

                                                <div class="mb-3">
                                                    <label for="location" class="form-label">Địa điểm</label>
                                                    <input type="text" id="location" v-model="profile.location"
                                                        class="form-control" placeholder="Thành phố, Quốc gia" />
                                                </div>

                                                <div class="d-flex justify-content-end">
                                                    <button type="submit" class="btn btn-primary" :disabled="isSaving">
                                                        <span v-if="isSaving"
                                                            class="spinner-border spinner-border-sm me-1"></span>
                                                        {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Privacy Settings -->
                        <div v-if="activeSection === 'privacy'" class="settings-section">
                            <div class="section-header">
                                <h4>Quyền riêng tư & Bảo mật</h4>
                                <p class="text-muted">Kiểm soát ai có thể nhìn thấy thông tin của bạn</p>
                            </div>

                            <div class="card">
                                <div class="card-body">
                                    <!-- Profile Visibility -->
                                    <div class="setting-item">
                                        <div class="setting-info">
                                            <h6>Hiển thị hồ sơ</h6>
                                            <p class="text-muted small mb-0">
                                                Ai có thể xem hồ sơ của bạn
                                            </p>
                                        </div>
                                        <div class="setting-control">
                                            <select v-model="privacy.profileVisibility" class="form-select">
                                                <option value="public">Công khai</option>
                                                <option value="friends">Chỉ bạn bè</option>
                                                <option value="private">Riêng tư</option>
                                            </select>
                                        </div>
                                    </div>

                                    <!-- Online Status -->
                                    <div class="setting-item">
                                        <div class="setting-info">
                                            <h6>Trạng thái trực tuyến</h6>
                                            <p class="text-muted small mb-0">
                                                Cho phép người khác biết khi bạn đang online
                                            </p>
                                        </div>
                                        <div class="setting-control">
                                            <div class="form-check form-switch">
                                                <input type="checkbox" id="showOnlineStatus"
                                                    v-model="privacy.showOnlineStatus" class="form-check-input" />
                                                <label for="showOnlineStatus" class="form-check-label"></label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Message Requests -->
                                    <div class="setting-item">
                                        <div class="setting-info">
                                            <h6>Yêu cầu nhắn tin</h6>
                                            <p class="text-muted small mb-0">
                                                Ai có thể gửi tin nhắn cho bạn
                                            </p>
                                        </div>
                                        <div class="setting-control">
                                            <select v-model="privacy.messageRequests" class="form-select">
                                                <option value="everyone">Mọi người</option>
                                                <option value="friends">Chỉ bạn bè</option>
                                                <option value="none">Không ai</option>
                                            </select>
                                        </div>
                                    </div>

                                    <!-- Read Receipts -->
                                    <div class="setting-item">
                                        <div class="setting-info">
                                            <h6>Xác nhận đã đọc</h6>
                                            <p class="text-muted small mb-0">
                                                Cho phép người khác biết khi bạn đã đọc tin nhắn
                                            </p>
                                        </div>
                                        <div class="setting-control">
                                            <div class="form-check form-switch">
                                                <input type="checkbox" id="readReceipts" v-model="privacy.readReceipts"
                                                    class="form-check-input" />
                                                <label for="readReceipts" class="form-check-label"></label>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Typing Indicators -->
                                    <div class="setting-item">
                                        <div class="setting-info">
                                            <h6>Hiển thị đang gõ</h6>
                                            <p class="text-muted small mb-0">
                                                Cho phép người khác biết khi bạn đang gõ tin nhắn
                                            </p>
                                        </div>
                                        <div class="setting-control">
                                            <div class="form-check form-switch">
                                                <input type="checkbox" id="typingIndicators"
                                                    v-model="privacy.typingIndicators" class="form-check-input" />
                                                <label for="typingIndicators" class="form-check-label"></label>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="d-flex justify-content-end mt-4">
                                        <button type="button" class="btn btn-primary" @click="updatePrivacySettings"
                                            :disabled="isSaving">
                                            <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
                                            {{ isSaving ? 'Đang lưu...' : 'Lưu cài đặt' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Notification Settings -->
                        <div v-if="activeSection === 'notifications'" class="settings-section">
                            <div class="section-header">
                                <h4>Thông báo</h4>
                                <p class="text-muted">Quản lý cách bạn nhận thông báo</p>
                            </div>

                            <div class="card">
                                <div class="card-body">
                                    <!-- Push Notifications -->
                                    <div class="setting-group">
                                        <h6 class="setting-group-title">Thông báo đẩy</h6>

                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <h6>Tin nhắn mới</h6>
                                                <p class="text-muted small mb-0">Thông báo khi có tin nhắn mới</p>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" id="pushMessages"
                                                        v-model="notifications.push.messages"
                                                        class="form-check-input" />
                                                    <label for="pushMessages" class="form-check-label"></label>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <h6>Yêu cầu kết bạn</h6>
                                                <p class="text-muted small mb-0">Thông báo khi có yêu cầu kết bạn</p>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" id="pushFriendRequests"
                                                        v-model="notifications.push.friendRequests"
                                                        class="form-check-input" />
                                                    <label for="pushFriendRequests" class="form-check-label"></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Email Notifications -->
                                    <div class="setting-group">
                                        <h6 class="setting-group-title">Thông báo email</h6>

                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <h6>Tin nhắn khi offline</h6>
                                                <p class="text-muted small mb-0">Gửi email khi có tin nhắn mà bạn chưa
                                                    đọc</p>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" id="emailMessages"
                                                        v-model="notifications.email.messages"
                                                        class="form-check-input" />
                                                    <label for="emailMessages" class="form-check-label"></label>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <h6>Báo cáo hàng tuần</h6>
                                                <p class="text-muted small mb-0">Tóm tắt hoạt động hàng tuần</p>
                                            </div>
                                            <div class="setting-control">
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" id="emailWeeklyReport"
                                                        v-model="notifications.email.weeklyReport"
                                                        class="form-check-input" />
                                                    <label for="emailWeeklyReport" class="form-check-label"></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Sound Settings -->
                                    <div class="setting-group">
                                        <h6 class="setting-group-title">Âm thanh</h6>

                                        <div class="setting-item">
                                            <div class="setting-info">
                                                <h6>Âm thanh thông báo</h6>
                                                <p class="text-muted small mb-0">Phát âm thanh khi có thông báo</p>
                                            </div>
                                            <div class="setting-control">
                                                <div class="input-group">
                                                    <div class="form-check form-switch">
                                                        <input type="checkbox" id="soundEnabled"
                                                            v-model="notifications.sound.enabled"
                                                            class="form-check-input" />
                                                        <label for="soundEnabled" class="form-check-label"></label>
                                                    </div>
                                                    <select v-model="notifications.sound.type" class="form-select ms-3"
                                                        :disabled="!notifications.sound.enabled">
                                                        <option value="default">Mặc định</option>
                                                        <option value="gentle">Nhẹ nhàng</option>
                                                        <option value="alert">Cảnh báo</option>
                                                    </select>
                                                    <button type="button" class="btn btn-outline-secondary"
                                                        @click="testSound" :disabled="!notifications.sound.enabled">
                                                        <i class="fas fa-volume-up"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="d-flex justify-content-end mt-4">
                                        <button type="button" class="btn btn-primary"
                                            @click="updateNotificationSettings" :disabled="isSaving">
                                            <span v-if="isSaving" class="spinner-border spinner-border-sm me-1"></span>
                                            {{ isSaving ? 'Đang lưu...' : 'Lưu cài đặt' }}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Security Settings -->
                        <div v-if="activeSection === 'security'" class="settings-section">
                            <div class="section-header">
                                <h4>Bảo mật</h4>
                                <p class="text-muted">Bảo vệ tài khoản của bạn</p>
                            </div>

                            <!-- Change Password -->
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="card-title mb-0">
                                        <i class="fas fa-key me-2"></i>Đổi mật khẩu
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <form @submit.prevent="changePassword">
                                        <div class="mb-3">
                                            <label for="currentPassword" class="form-label">Mật khẩu hiện tại</label>
                                            <input type="password" id="currentPassword"
                                                v-model="passwordForm.currentPassword" class="form-control"
                                                :class="{ 'is-invalid': errors.currentPassword }" />
                                            <div v-if="errors.currentPassword" class="invalid-feedback">
                                                {{ errors.currentPassword }}
                                            </div>
                                        </div>

                                        <div class="mb-3">
                                            <label for="newPassword" class="form-label">Mật khẩu mới</label>
                                            <input type="password" id="newPassword" v-model="passwordForm.newPassword"
                                                class="form-control" :class="{ 'is-invalid': errors.newPassword }" />
                                            <div v-if="errors.newPassword" class="invalid-feedback">
                                                {{ errors.newPassword }}
                                            </div>
                                        </div>

                                        <div class="mb-3">
                                            <label for="confirmNewPassword" class="form-label">Xác nhận mật khẩu
                                                mới</label>
                                            <input type="password" id="confirmNewPassword"
                                                v-model="passwordForm.confirmNewPassword" class="form-control"
                                                :class="{ 'is-invalid': errors.confirmNewPassword }" />
                                            <div v-if="errors.confirmNewPassword" class="invalid-feedback">
                                                {{ errors.confirmNewPassword }}
                                            </div>
                                        </div>

                                        <div class="d-flex justify-content-end">
                                            <button type="submit" class="btn btn-primary" :disabled="isSaving">
                                                <span v-if="isSaving"
                                                    class="spinner-border spinner-border-sm me-1"></span>
                                                {{ isSaving ? 'Đang đổi...' : 'Đổi mật khẩu' }}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>

                            <!-- Two Factor Authentication -->
                            <div class="card mb-3">
                                <div class="card-header">
                                    <h6 class="card-title mb-0">
                                        <i class="fas fa-shield-alt me-2"></i>Xác thực hai yếu tố
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <div>
                                            <h6>Xác thực hai yếu tố {{ security.twoFactorEnabled ? 'đã bật' : 'chưa bật'
                                                }}</h6>
                                            <p class="text-muted small mb-0">
                                                Tăng cường bảo mật với xác thực hai yếu tố
                                            </p>
                                        </div>
                                        <button type="button" class="btn btn-outline-primary" @click="toggleTwoFactor"
                                            :disabled="isSaving">
                                            {{ security.twoFactorEnabled ? 'Tắt' : 'Bật' }}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Active Sessions -->
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="card-title mb-0">
                                        <i class="fas fa-laptop me-2"></i>Phiên đăng nhập
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="session-list">
                                        <div v-for="session in activeSessions" :key="session.id" class="session-item">
                                            <div class="session-info">
                                                <div class="session-device">
                                                    <i :class="getDeviceIcon(session.device)" class="me-2"></i>
                                                    {{ session.device }} - {{ session.browser }}
                                                </div>
                                                <div class="session-meta">
                                                    <small class="text-muted">
                                                        {{ session.location }} • {{ formatDate(session.lastActive) }}
                                                        <span v-if="session.isCurrent"
                                                            class="badge bg-success ms-2">Hiện tại</span>
                                                    </small>
                                                </div>
                                            </div>
                                            <div class="session-actions">
                                                <button v-if="!session.isCurrent" type="button"
                                                    class="btn btn-sm btn-outline-danger"
                                                    @click="terminateSession(session.id)">
                                                    Đăng xuất
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="text-center mt-3">
                                        <button type="button" class="btn btn-outline-danger"
                                            @click="terminateAllSessions">
                                            Đăng xuất tất cả thiết bị khác
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Save Success Toast -->
        <div v-if="showSaveSuccess" class="position-fixed bottom-0 end-0 p-3" style="z-index: 1050">
            <div class="toast show" role="alert">
                <div class="toast-header">
                    <i class="fas fa-check-circle text-success me-2"></i>
                    <strong class="me-auto">Thành công</strong>
                    <button type="button" class="btn-close" @click="showSaveSuccess = false"></button>
                </div>
                <div class="toast-body">
                    Cài đặt đã được lưu thành công!
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

// Dependencies
const authStore = useAuthStore()
const cacheStore = useCacheStore()
const toast = useToast()

// State
const activeSection = ref('profile')
const isUploading = ref(false)
const isSaving = ref(false)
const showSaveSuccess = ref(false)
const errors = ref({})

// Form data
const profile = ref({
    firstName: '',
    lastName: '',
    bio: '',
    phone: '',
    website: '',
    location: '',
    avatar: ''
})

const privacy = ref({
    profileVisibility: 'public',
    showOnlineStatus: true,
    messageRequests: 'friends',
    readReceipts: true,
    typingIndicators: true
})

const notifications = ref({
    push: {
        messages: true,
        friendRequests: true
    },
    email: {
        messages: false,
        weeklyReport: true
    },
    sound: {
        enabled: true,
        type: 'default'
    }
})

const security = ref({
    twoFactorEnabled: false
})

const passwordForm = ref({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
})

const activeSessions = ref([])

// Settings sections configuration
const settingSections = [
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
        badge: security.value.twoFactorEnabled ? null : '!'
    }
]

// Methods
const setActiveSection = (section) => {
    activeSection.value = section
}

const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    // Validate file
    if (!file.type.startsWith('image/')) {
        toast.error('Vui lòng chọn file hình ảnh')
        return
    }

    if (file.size > 5 * 1024 * 1024) {
        toast.error('Kích thước file không được vượt quá 5MB')
        return
    }

    isUploading.value = true

    try {
        const formData = new FormData()
        formData.append('avatar', file)

        const response = await authStore.uploadAvatar(formData)
        profile.value.avatar = response.avatar

        toast.success('Cập nhật ảnh đại diện thành công!')

        // Update cache
        cacheStore.set('user_avatar', response.avatar, 30 * 60 * 1000) // 30 minutes

    } catch (error) {
        console.error('Avatar upload error:', error)
        toast.error('Upload ảnh thất bại. Vui lòng thử lại.')
    } finally {
        isUploading.value = false
    }
}

const updateProfile = async () => {
    // Validate
    errors.value = {}

    if (!profile.value.firstName?.trim()) {
        errors.value.firstName = 'Họ không được để trống'
    }

    if (!profile.value.lastName?.trim()) {
        errors.value.lastName = 'Tên không được để trống'
    }

    if (Object.keys(errors.value).length > 0) return

    isSaving.value = true

    try {
        await authStore.updateProfile(profile.value)
        showSaveSuccess.value = true

        // Update cache
        cacheStore.set('user_profile', profile.value, 60 * 60 * 1000) // 1 hour

        setTimeout(() => {
            showSaveSuccess.value = false
        }, 3000)

    } catch (error) {
        console.error('Profile update error:', error)
        toast.error('Cập nhật hồ sơ thất bại')
    } finally {
        isSaving.value = false
    }
}

const updatePrivacySettings = async () => {
    isSaving.value = true

    try {
        await authStore.updatePrivacySettings(privacy.value)
        toast.success('Cập nhật cài đặt quyền riêng tư thành công!')

        // Update cache
        cacheStore.set('privacy_settings', privacy.value, 60 * 60 * 1000)

    } catch (error) {
        console.error('Privacy settings update error:', error)
        toast.error('Cập nhật cài đặt thất bại')
    } finally {
        isSaving.value = false
    }
}

const updateNotificationSettings = async () => {
    isSaving.value = true

    try {
        await authStore.updateNotificationSettings(notifications.value)
        toast.success('Cập nhật cài đặt thông báo thành công!')

        // Update cache
        cacheStore.set('notification_settings', notifications.value, 60 * 60 * 1000)

    } catch (error) {
        console.error('Notification settings update error:', error)
        toast.error('Cập nhật cài đặt thất bại')
    } finally {
        isSaving.value = false
    }
}

const testSound = () => {
    // Play notification sound
    const audio = new Audio(`/sounds/${notifications.value.sound.type}.mp3`)
    audio.play().catch(() => {
        toast.warning('Không thể phát âm thanh thử nghiệm')
    })
}

const changePassword = async () => {
    // Validate
    errors.value = {}

    if (!passwordForm.value.currentPassword) {
        errors.value.currentPassword = 'Vui lòng nhập mật khẩu hiện tại'
    }

    if (!passwordForm.value.newPassword) {
        errors.value.newPassword = 'Vui lòng nhập mật khẩu mới'
    } else if (passwordForm.value.newPassword.length < 8) {
        errors.value.newPassword = 'Mật khẩu mới phải có ít nhất 8 ký tự'
    }

    if (passwordForm.value.newPassword !== passwordForm.value.confirmNewPassword) {
        errors.value.confirmNewPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (Object.keys(errors.value).length > 0) return

    isSaving.value = true

    try {
        await authStore.changePassword(passwordForm.value)
        toast.success('Đổi mật khẩu thành công!')

        // Reset form
        passwordForm.value = {
            currentPassword: '',
            newPassword: '',
            confirmNewPassword: ''
        }

    } catch (error) {
        console.error('Password change error:', error)
        if (error.response?.status === 401) {
            errors.value.currentPassword = 'Mật khẩu hiện tại không chính xác'
        } else {
            toast.error('Đổi mật khẩu thất bại')
        }
    } finally {
        isSaving.value = false
    }
}

const toggleTwoFactor = async () => {
    isSaving.value = true

    try {
        if (security.value.twoFactorEnabled) {
            await authStore.disableTwoFactor()
            security.value.twoFactorEnabled = false
            toast.success('Đã tắt xác thực hai yếu tố')
        } else {
            const result = await authStore.enableTwoFactor()
            // Show QR code modal or setup instructions
            security.value.twoFactorEnabled = true
            toast.success('Đã bật xác thực hai yếu tố')
        }
    } catch (error) {
        console.error('Two factor toggle error:', error)
        toast.error('Cập nhật xác thực hai yếu tố thất bại')
    } finally {
        isSaving.value = false
    }
}

const loadActiveSessions = async () => {
    try {
        const sessions = await authStore.getActiveSessions()
        activeSessions.value = sessions
    } catch (error) {
        console.error('Load sessions error:', error)
    }
}

const terminateSession = async (sessionId) => {
    try {
        await authStore.terminateSession(sessionId)
        activeSessions.value = activeSessions.value.filter(s => s.id !== sessionId)
        toast.success('Đã đăng xuất phiên làm việc')
    } catch (error) {
        console.error('Terminate session error:', error)
        toast.error('Đăng xuất phiên làm việc thất bại')
    }
}

const terminateAllSessions = async () => {
    try {
        await authStore.terminateAllOtherSessions()
        activeSessions.value = activeSessions.value.filter(s => s.isCurrent)
        toast.success('Đã đăng xuất tất cả thiết bị khác')
    } catch (error) {
        console.error('Terminate all sessions error:', error)
        toast.error('Đăng xuất thiết bị khác thất bại')
    }
}

const getDeviceIcon = (device) => {
    const deviceLower = device.toLowerCase()
    if (deviceLower.includes('mobile') || deviceLower.includes('phone')) {
        return 'fas fa-mobile-alt'
    } else if (deviceLower.includes('tablet')) {
        return 'fas fa-tablet-alt'
    } else {
        return 'fas fa-laptop'
    }
}

const formatDate = (date) => {
    return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: vi
    })
}

const loadUserSettings = async () => {
    try {
        // Try to load from cache first
        const cachedProfile = cacheStore.get('user_profile')
        const cachedPrivacy = cacheStore.get('privacy_settings')
        const cachedNotifications = cacheStore.get('notification_settings')

        if (cachedProfile) {
            profile.value = { ...profile.value, ...cachedProfile }
        }

        if (cachedPrivacy) {
            privacy.value = { ...privacy.value, ...cachedPrivacy }
        }

        if (cachedNotifications) {
            notifications.value = { ...notifications.value, ...cachedNotifications }
        }

        // Load fresh data from server
        const [profileData, privacyData, notificationData, securityData] = await Promise.all([
            authStore.getUserProfile(),
            authStore.getPrivacySettings(),
            authStore.getNotificationSettings(),
            authStore.getSecuritySettings()
        ])

        profile.value = { ...profile.value, ...profileData }
        privacy.value = { ...privacy.value, ...privacyData }
        notifications.value = { ...notifications.value, ...notificationData }
        security.value = { ...security.value, ...securityData }

        // Update cache
        cacheStore.set('user_profile', profile.value, 60 * 60 * 1000)
        cacheStore.set('privacy_settings', privacy.value, 60 * 60 * 1000)
        cacheStore.set('notification_settings', notifications.value, 60 * 60 * 1000)

    } catch (error) {
        console.error('Load settings error:', error)
        toast.error('Không thể tải cài đặt')
    }
}

// Lifecycle
onMounted(async () => {
    await loadUserSettings()
    await loadActiveSessions()
})

// Watch for changes to sync with cache
watch(() => profile.value, (newProfile) => {
    cacheStore.set('user_profile', newProfile, 60 * 60 * 1000)
}, { deep: true })

watch(() => privacy.value, (newPrivacy) => {
    cacheStore.set('privacy_settings', newPrivacy, 60 * 60 * 1000)
}, { deep: true })

watch(() => notifications.value, (newNotifications) => {
    cacheStore.set('notification_settings', newNotifications, 60 * 60 * 1000)
}, { deep: true })
</script>

<style scoped>
.user-settings {
    padding: 2rem 0;
}

.settings-nav {
    background: white;
    border-radius: 0.5rem;
    border: 1px solid var(--bs-border-color);
    padding: 1rem;
    position: sticky;
    top: 2rem;
}

.nav-header {
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
    margin-bottom: 1rem;
}

.nav-pills .nav-link {
    color: var(--bs-body-color);
    border-radius: 0.375rem;
    margin-bottom: 0.25rem;
    transition: all 0.2s ease;
}

.nav-pills .nav-link:hover {
    background-color: var(--bs-light);
}

.nav-pills .nav-link.active {
    background-color: var(--bs-primary);
    color: white;
}

.settings-content {
    background: white;
    border-radius: 0.5rem;
    border: 1px solid var(--bs-border-color);
    padding: 2rem;
}

.section-header {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.avatar-upload {
    position: relative;
}

.avatar-preview {
    position: relative;
    width: 120px;
    height: 120px;
    margin: 0 auto;
    cursor: pointer;
}

.avatar-img {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--bs-border-color);
}

.avatar-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.avatar-preview:hover .avatar-overlay {
    opacity: 1;
}

.setting-item {
    display: flex;
    justify-content: between;
    align-items: flex-start;
    padding: 1rem 0;
    border-bottom: 1px solid var(--bs-border-color);
}

.setting-item:last-child {
    border-bottom: none;
}

.setting-info {
    flex: 1;
    margin-right: 1rem;
}

.setting-info h6 {
    margin-bottom: 0.25rem;
    font-weight: 500;
}

.setting-control {
    min-width: 200px;
}

.setting-group {
    margin-bottom: 2rem;
}

.setting-group-title {
    color: var(--bs-primary);
    font-weight: 600;
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.session-list {
    max-height: 400px;
    overflow-y: auto;
}

.session-item {
    display: flex;
    justify-content: between;
    align-items: center;
    padding: 1rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
}

.session-info {
    flex: 1;
}

.session-device {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.session-meta {
    font-size: 0.875rem;
}

@media (max-width: 768px) {
    .settings-nav {
        position: static;
        margin-bottom: 1rem;
    }

    .settings-content {
        padding: 1rem;
    }

    .setting-item {
        flex-direction: column;
        align-items: stretch;
    }

    .setting-info {
        margin-right: 0;
        margin-bottom: 1rem;
    }

    .setting-control {
        min-width: auto;
    }

    .session-item {
        flex-direction: column;
        align-items: stretch;
    }

    .session-actions {
        margin-top: 0.5rem;
        text-align: right;
    }
}
</style>