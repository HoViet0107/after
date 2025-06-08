<!-- Component hiển thị thông tin chi tiết cuộc trò chuyện với WebSocket real-time -->

<template>
    <div class="conversation-info">
        <!-- Modal for conversation info -->
        <div class="modal fade" tabindex="-1" ref="modal" @hidden.bs.modal="handleModalHidden">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <!-- Modal Header -->
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i :class="conversation?.isGroupChat ? 'fas fa-users' : 'fas fa-user'" class="me-2"></i>
                            Thông tin {{ conversation?.isGroupChat ? 'nhóm' : 'cuộc trò chuyện' }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body">
                        <div v-if="isLoading" class="text-center py-4">
                            <div class="spinner-border text-primary" role="status">
                                <span class="visually-hidden">Đang tải...</span>
                            </div>
                            <div class="text-muted mt-2">Đang tải thông tin...</div>
                        </div>

                        <div v-else-if="conversation" class="conversation-details">
                            <!-- Conversation Header -->
                            <div class="conversation-header text-center mb-4">
                                <div class="conversation-avatar-container">
                                    <!-- Group Avatar or User Avatar -->
                                    <div v-if="conversation.isGroupChat" class="group-avatar">
                                        <img :src="conversation.avatar || '/default-group-avatar.png'"
                                            :alt="conversation.name" class="group-image" />
                                        <div class="member-count-badge">
                                            {{ conversation.memberCount }}
                                        </div>
                                    </div>

                                    <div v-else class="user-avatar">
                                        <img :src="otherParticipant?.avatar || '/default-avatar.png'"
                                            :alt="otherParticipant?.name" class="user-image" />
                                        <div v-if="otherParticipant?.presence" class="presence-indicator"
                                            :class="otherParticipant.presence.status"></div>
                                    </div>
                                </div>

                                <h4 class="conversation-name mt-3 mb-1">
                                    {{ conversation.isGroupChat ? conversation.name : otherParticipant?.name }}
                                </h4>

                                <div class="conversation-meta text-muted">
                                    <div v-if="conversation.isGroupChat">
                                        {{ conversation.memberCount }} thành viên
                                        <span v-if="onlineMembers > 0"> • {{ onlineMembers }} đang online</span>
                                    </div>
                                    <div v-else-if="otherParticipant?.presence">
                                        {{ getPresenceText(otherParticipant.presence.status) }}
                                        <span v-if="otherParticipant.presence.lastSeen" class="last-seen">
                                            • Lần cuối {{ formatLastSeen(otherParticipant.presence.lastSeen) }}
                                        </span>
                                    </div>
                                </div>

                                <div v-if="conversation.description" class="conversation-description mt-2">
                                    <p class="text-muted">{{ conversation.description }}</p>
                                </div>
                            </div>

                            <!-- Quick Actions -->
                            <div class="quick-actions mb-4">
                                <div class="row g-2">
                                    <div class="col-3">
                                        <button type="button"
                                            class="btn btn-outline-primary w-100 d-flex flex-column align-items-center py-3"
                                            @click="startCall('audio')" :disabled="!canCall">
                                            <i class="fas fa-phone mb-1"></i>
                                            <small>Gọi</small>
                                        </button>
                                    </div>
                                    <div class="col-3">
                                        <button type="button"
                                            class="btn btn-outline-primary w-100 d-flex flex-column align-items-center py-3"
                                            @click="startCall('video')" :disabled="!canCall">
                                            <i class="fas fa-video mb-1"></i>
                                            <small>Video</small>
                                        </button>
                                    </div>
                                    <div class="col-3">
                                        <button type="button"
                                            class="btn btn-outline-primary w-100 d-flex flex-column align-items-center py-3"
                                            @click="openMediaGallery">
                                            <i class="fas fa-images mb-1"></i>
                                            <small>Media</small>
                                        </button>
                                    </div>
                                    <div class="col-3">
                                        <button type="button"
                                            class="btn btn-outline-primary w-100 d-flex flex-column align-items-center py-3"
                                            @click="searchInConversation">
                                            <i class="fas fa-search mb-1"></i>
                                            <small>Tìm kiếm</small>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <!-- Tabs Navigation -->
                            <ul class="nav nav-tabs nav-fill mb-3" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#members-tab"
                                        type="button" role="tab">
                                        <i class="fas fa-users me-2"></i>
                                        {{ conversation.isGroupChat ? 'Thành viên' : 'Thông tin' }}
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#media-tab"
                                        type="button" role="tab">
                                        <i class="fas fa-photo-video me-2"></i>
                                        Media
                                        <span v-if="mediaCount > 0" class="badge bg-secondary ms-1">{{ mediaCount
                                        }}</span>
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#files-tab"
                                        type="button" role="tab">
                                        <i class="fas fa-file me-2"></i>
                                        Files
                                        <span v-if="fileCount > 0" class="badge bg-secondary ms-1">{{ fileCount
                                        }}</span>
                                    </button>
                                </li>
                                <li v-if="conversation.isGroupChat" class="nav-item" role="presentation">
                                    <button class="nav-link" data-bs-toggle="tab" data-bs-target="#settings-tab"
                                        type="button" role="tab">
                                        <i class="fas fa-cog me-2"></i>
                                        Cài đặt
                                    </button>
                                </li>
                            </ul>

                            <!-- Tab Content -->
                            <div class="tab-content">
                                <!-- Members Tab -->
                                <div class="tab-pane fade show active" id="members-tab" role="tabpanel">
                                    <div v-if="conversation.isGroupChat">
                                        <!-- Add Member Button (for admins) -->
                                        <div v-if="canAddMembers" class="mb-3">
                                            <button type="button" class="btn btn-outline-primary w-100"
                                                @click="showAddMemberModal">
                                                <i class="fas fa-user-plus me-2"></i>
                                                Thêm thành viên
                                            </button>
                                        </div>

                                        <!-- Members List -->
                                        <div class="members-list">
                                            <div v-for="member in sortedMembers" :key="member.id" class="member-item">
                                                <div class="member-info">
                                                    <div class="member-avatar-container">
                                                        <img :src="member.avatar || '/default-avatar.png'"
                                                            :alt="member.name" class="member-avatar" />
                                                        <div v-if="member.presence" class="presence-indicator"
                                                            :class="member.presence.status"></div>
                                                    </div>

                                                    <div class="member-details">
                                                        <div class="member-name">
                                                            {{ member.name }}
                                                            <span v-if="member.id === currentUser?.id"
                                                                class="text-muted">(Bạn)</span>
                                                        </div>
                                                        <div class="member-meta">
                                                            <span class="member-role"
                                                                :class="getRoleClass(member.role)">
                                                                {{ getRoleText(member.role) }}
                                                            </span>
                                                            <span v-if="member.presence" class="member-status">
                                                                • {{ getPresenceText(member.presence.status) }}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Member Actions -->
                                                <div v-if="canManageMembers && member.id !== currentUser?.id"
                                                    class="member-actions">
                                                    <div class="dropdown">
                                                        <button type="button"
                                                            class="btn btn-sm btn-outline-secondary dropdown-toggle"
                                                            data-bs-toggle="dropdown">
                                                            <i class="fas fa-ellipsis-h"></i>
                                                        </button>
                                                        <ul class="dropdown-menu dropdown-menu-end">
                                                            <li>
                                                                <button class="dropdown-item"
                                                                    @click="viewMemberProfile(member)">
                                                                    <i class="fas fa-user me-2"></i>Xem hồ sơ
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <button class="dropdown-item"
                                                                    @click="sendDirectMessage(member)">
                                                                    <i class="fas fa-comment me-2"></i>Nhắn tin riêng
                                                                </button>
                                                            </li>
                                                            <li v-if="canPromoteMembers && member.role !== 'admin'">
                                                                <button class="dropdown-item"
                                                                    @click="promoteMember(member)">
                                                                    <i class="fas fa-arrow-up me-2"></i>Thăng cấp
                                                                </button>
                                                            </li>
                                                            <li v-if="canDemoteMembers && member.role === 'admin'">
                                                                <button class="dropdown-item"
                                                                    @click="demoteMember(member)">
                                                                    <i class="fas fa-arrow-down me-2"></i>Hạ cấp
                                                                </button>
                                                            </li>
                                                            <li>
                                                                <hr class="dropdown-divider">
                                                            </li>
                                                            <li v-if="canRemoveMembers">
                                                                <button class="dropdown-item text-danger"
                                                                    @click="removeMember(member)">
                                                                    <i class="fas fa-user-times me-2"></i>Xóa khỏi nhóm
                                                                </button>
                                                            </li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Direct Chat Info -->
                                    <div v-else class="direct-chat-info">
                                        <div class="info-section">
                                            <h6 class="section-title">Thông tin liên hệ</h6>
                                            <div class="info-items">
                                                <div class="info-item">
                                                    <i class="fas fa-at text-muted me-3"></i>
                                                    <div>
                                                        <div class="info-label">Tên đăng nhập</div>
                                                        <div class="info-value">@{{ otherParticipant?.username }}</div>
                                                    </div>
                                                </div>

                                                <div v-if="otherParticipant?.phone" class="info-item">
                                                    <i class="fas fa-phone text-muted me-3"></i>
                                                    <div>
                                                        <div class="info-label">Số điện thoại</div>
                                                        <div class="info-value">{{ otherParticipant.phone }}</div>
                                                    </div>
                                                </div>

                                                <div v-if="otherParticipant?.email" class="info-item">
                                                    <i class="fas fa-envelope text-muted me-3"></i>
                                                    <div>
                                                        <div class="info-label">Email</div>
                                                        <div class="info-value">{{ otherParticipant.email }}</div>
                                                    </div>
                                                </div>

                                                <div class="info-item">
                                                    <i class="fas fa-calendar text-muted me-3"></i>
                                                    <div>
                                                        <div class="info-label">Tham gia</div>
                                                        <div class="info-value">{{
                                                            formatJoinDate(conversation.createdAt) }}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Mutual Friends -->
                                        <div v-if="mutualFriends.length > 0" class="info-section">
                                            <h6 class="section-title">Bạn bè chung ({{ mutualFriends.length }})</h6>
                                            <div class="mutual-friends-grid">
                                                <div v-for="friend in mutualFriends" :key="friend.id"
                                                    class="mutual-friend" @click="viewMutualFriend(friend)">
                                                    <img :src="friend.avatar || '/default-avatar.png'"
                                                        :alt="friend.name" />
                                                    <div class="friend-name">{{ friend.name }}</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <!-- Media Tab -->
                                <div class="tab-pane fade" id="media-tab" role="tabpanel">
                                    <div v-if="isLoadingMedia" class="text-center py-4">
                                        <div class="spinner-border spinner-border-sm text-secondary"></div>
                                        <div class="text-muted mt-2">Đang tải media...</div>
                                    </div>

                                    <div v-else-if="mediaItems.length > 0" class="media-grid">
                                        <div v-for="media in mediaItems" :key="media.id" class="media-item"
                                            @click="openMediaViewer(media)">
                                            <img :src="media.thumbnail || media.url" :alt="media.name" />
                                            <div class="media-overlay">
                                                <i :class="getMediaIcon(media.type)" class="media-icon"></i>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-else class="empty-state text-center py-4">
                                        <i class="fas fa-photo-video text-muted fs-1 mb-3"></i>
                                        <h6 class="text-muted">Chưa có media</h6>
                                        <p class="text-muted small">Hình ảnh và video sẽ hiển thị tại đây</p>
                                    </div>
                                </div>

                                <!-- Files Tab -->
                                <div class="tab-pane fade" id="files-tab" role="tabpanel">
                                    <div v-if="isLoadingFiles" class="text-center py-4">
                                        <div class="spinner-border spinner-border-sm text-secondary"></div>
                                        <div class="text-muted mt-2">Đang tải files...</div>
                                    </div>

                                    <div v-else-if="fileItems.length > 0" class="files-list">
                                        <div v-for="file in fileItems" :key="file.id" class="file-item"
                                            @click="downloadFile(file)">
                                            <div class="file-icon">
                                                <i :class="getFileIcon(file.type)" class="fs-2"></i>
                                            </div>
                                            <div class="file-details">
                                                <div class="file-name">{{ file.name }}</div>
                                                <div class="file-meta">
                                                    {{ formatFileSize(file.size) }} • {{ formatDate(file.createdAt) }}
                                                </div>
                                            </div>
                                            <div class="file-actions">
                                                <button type="button" class="btn btn-sm btn-outline-primary"
                                                    @click.stop="downloadFile(file)">
                                                    <i class="fas fa-download"></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div v-else class="empty-state text-center py-4">
                                        <i class="fas fa-file text-muted fs-1 mb-3"></i>
                                        <h6 class="text-muted">Chưa có files</h6>
                                        <p class="text-muted small">File đã chia sẻ sẽ hiển thị tại đây</p>
                                    </div>
                                </div>

                                <!-- Settings Tab (Group only) -->
                                <div v-if="conversation.isGroupChat" class="tab-pane fade" id="settings-tab"
                                    role="tabpanel">
                                    <div class="group-settings">
                                        <!-- Group Information -->
                                        <div class="settings-section">
                                            <h6 class="section-title">Thông tin nhóm</h6>

                                            <div class="form-group mb-3">
                                                <label class="form-label">Tên nhóm</label>
                                                <input type="text" v-model="editableGroupName" class="form-control"
                                                    :readonly="!canEditGroup" @blur="updateGroupName" />
                                            </div>

                                            <div class="form-group mb-3">
                                                <label class="form-label">Mô tả nhóm</label>
                                                <textarea v-model="editableGroupDescription" class="form-control"
                                                    rows="3" :readonly="!canEditGroup"
                                                    @blur="updateGroupDescription"></textarea>
                                            </div>
                                        </div>

                                        <!-- Privacy Settings -->
                                        <div class="settings-section">
                                            <h6 class="section-title">Cài đặt quyền riêng tư</h6>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <strong>Ai có thể thêm thành viên</strong>
                                                    <div class="text-muted small">Kiểm soát ai có thể mời người khác vào
                                                        nhóm</div>
                                                </div>
                                                <select v-model="groupSettings.whoCanAddMembers" class="form-select"
                                                    :disabled="!canEditGroup" @change="updateGroupSettings">
                                                    <option value="admins">Chỉ quản trị viên</option>
                                                    <option value="all">Tất cả thành viên</option>
                                                </select>
                                            </div>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <strong>Ai có thể chỉnh sửa thông tin nhóm</strong>
                                                    <div class="text-muted small">Kiểm soát ai có thể thay đổi tên và mô
                                                        tả nhóm</div>
                                                </div>
                                                <select v-model="groupSettings.whoCanEditInfo" class="form-select"
                                                    :disabled="!canEditGroup" @change="updateGroupSettings">
                                                    <option value="admins">Chỉ quản trị viên</option>
                                                    <option value="all">Tất cả thành viên</option>
                                                </select>
                                            </div>
                                        </div>

                                        <!-- Notification Settings -->
                                        <div class="settings-section">
                                            <h6 class="section-title">Thông báo</h6>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <strong>Thông báo tin nhắn</strong>
                                                    <div class="text-muted small">Nhận thông báo khi có tin nhắn mới
                                                    </div>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="notificationSettings.messages"
                                                        class="form-check-input" @change="updateNotificationSettings" />
                                                </div>
                                            </div>

                                            <div class="setting-item">
                                                <div class="setting-info">
                                                    <strong>Âm thanh thông báo</strong>
                                                    <div class="text-muted small">Phát âm thanh khi có thông báo</div>
                                                </div>
                                                <div class="form-check form-switch">
                                                    <input type="checkbox" v-model="notificationSettings.sound"
                                                        class="form-check-input" @change="updateNotificationSettings" />
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Danger Zone -->
                                        <div v-if="canLeaveGroup || canDeleteGroup"
                                            class="settings-section danger-zone">
                                            <h6 class="section-title text-danger">Vùng nguy hiểm</h6>

                                            <div v-if="canLeaveGroup" class="mb-3">
                                                <button type="button" class="btn btn-outline-warning w-100"
                                                    @click="confirmLeaveGroup">
                                                    <i class="fas fa-sign-out-alt me-2"></i>
                                                    Rời khỏi nhóm
                                                </button>
                                            </div>

                                            <div v-if="canDeleteGroup">
                                                <button type="button" class="btn btn-outline-danger w-100"
                                                    @click="confirmDeleteGroup">
                                                    <i class="fas fa-trash me-2"></i>
                                                    Xóa nhóm
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="error-state text-center py-4">
                            <i class="fas fa-exclamation-triangle text-warning fs-1 mb-3"></i>
                            <h6 class="text-muted">Không thể tải thông tin</h6>
                            <button type="button" class="btn btn-outline-primary" @click="loadConversationInfo">
                                <i class="fas fa-refresh me-2"></i>Thử lại
                            </button>
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Đóng
                        </button>
                        <button v-if="conversation?.isGroupChat && canEditGroup" type="button" class="btn btn-primary"
                            @click="saveChanges" :disabled="isSaving">
                            <span v-if="isSaving" class="spinner-border spinner-border-sm me-2"></span>
                            {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useUserStore } from '@/stores/user'
import { usePresenceStore } from '@/stores/presence'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'
import { formatDistanceToNow, format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { Modal } from 'bootstrap'

// Props
const props = defineProps({
    conversationId: {
        type: String,
        required: true
    },
    show: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits([
    'close',
    'leave',
    'delete',
    'member-added',
    'member-removed',
    'call-started'
])

// Dependencies
const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const userStore = useUserStore()
const presenceStore = usePresenceStore()
const cacheStore = useCacheStore()
const toast = useToast()

// Refs
const modal = ref(null)

// State
const conversation = ref(null)
const isLoading = ref(false)
const isLoadingMedia = ref(false)
const isLoadingFiles = ref(false)
const isSaving = ref(false)
const mediaItems = ref([])
const fileItems = ref([])
const mutualFriends = ref([])
const editableGroupName = ref('')
const editableGroupDescription = ref('')

// Settings
const groupSettings = ref({
    whoCanAddMembers: 'admins',
    whoCanEditInfo: 'admins'
})

const notificationSettings = ref({
    messages: true,
    sound: true
})

// Modal instance
let modalInstance = null

// Computed
const currentUser = computed(() => authStore.user)

const otherParticipant = computed(() => {
    if (!conversation.value || conversation.value.isGroupChat) return null
    return conversation.value.participants?.find(p => p.id !== currentUser.value?.id)
})

const sortedMembers = computed(() => {
    if (!conversation.value?.participants) return []

    return [...conversation.value.participants].sort((a, b) => {
        // Owner first, then admins, then members
        const roleOrder = { owner: 0, admin: 1, member: 2 }
        const aOrder = roleOrder[a.role] || 2
        const bOrder = roleOrder[b.role] || 2

        if (aOrder !== bOrder) return aOrder - bOrder

        // Then by online status
        const aOnline = a.presence?.status === 'online' ? 0 : 1
        const bOnline = b.presence?.status === 'online' ? 0 : 1

        if (aOnline !== bOnline) return aOnline - bOnline

        // Then alphabetically
        return a.name.localeCompare(b.name)
    })
})

const onlineMembers = computed(() => {
    return conversation.value?.participants?.filter(p => p.presence?.status === 'online').length || 0
})

const mediaCount = computed(() => mediaItems.value.length)
const fileCount = computed(() => fileItems.value.length)

const currentUserMember = computed(() => {
    return conversation.value?.participants?.find(p => p.id === currentUser.value?.id)
})

const canCall = computed(() => {
    return !conversation.value?.isGroupChat || conversation.value?.participants?.length <= 8
})

const canAddMembers = computed(() => {
    if (!conversation.value?.isGroupChat || !currentUserMember.value) return false

    const userRole = currentUserMember.value.role
    const settings = conversation.value.settings || {}

    return userRole === 'owner' ||
        userRole === 'admin' ||
        (settings.whoCanAddMembers === 'all' && userRole === 'member')
})

const canManageMembers = computed(() => {
    const userRole = currentUserMember.value?.role
    return userRole === 'owner' || userRole === 'admin'
})

const canPromoteMembers = computed(() => {
    return currentUserMember.value?.role === 'owner'
})

const canDemoteMembers = computed(() => {
    return currentUserMember.value?.role === 'owner'
})

const canRemoveMembers = computed(() => {
    return canManageMembers.value
})

const canEditGroup = computed(() => {
    if (!conversation.value?.isGroupChat || !currentUserMember.value) return false

    const userRole = currentUserMember.value.role
    const settings = conversation.value.settings || {}

    return userRole === 'owner' ||
        userRole === 'admin' ||
        (settings.whoCanEditInfo === 'all' && userRole === 'member')
})

const canLeaveGroup = computed(() => {
    return conversation.value?.isGroupChat && currentUserMember.value?.role !== 'owner'
})

const canDeleteGroup = computed(() => {
    return conversation.value?.isGroupChat && currentUserMember.value?.role === 'owner'
})

// Methods
const getPresenceText = (status) => {
    const statusMap = {
        online: 'Đang online',
        away: 'Vắng mặt',
        busy: 'Bận',
        offline: 'Offline'
    }
    return statusMap[status] || 'Offline'
}

const getRoleText = (role) => {
    const roleMap = {
        owner: 'Chủ nhóm',
        admin: 'Quản trị viên',
        member: 'Thành viên'
    }
    return roleMap[role] || 'Thành viên'
}

const getRoleClass = (role) => {
    const roleClasses = {
        owner: 'text-danger',
        admin: 'text-warning',
        member: 'text-secondary'
    }
    return roleClasses[role] || 'text-secondary'
}

const formatLastSeen = (date) => {
    return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: vi
    })
}

const formatJoinDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy', { locale: vi })
}

const formatDate = (date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: vi })
}

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getMediaIcon = (type) => {
    const icons = {
        image: 'fas fa-image',
        video: 'fas fa-play-circle',
        audio: 'fas fa-volume-up'
    }
    return icons[type] || 'fas fa-file'
}

const getFileIcon = (type) => {
    const icons = {
        pdf: 'fas fa-file-pdf text-danger',
        doc: 'fas fa-file-word text-primary',
        docx: 'fas fa-file-word text-primary',
        xls: 'fas fa-file-excel text-success',
        xlsx: 'fas fa-file-excel text-success',
        ppt: 'fas fa-file-powerpoint text-warning',
        pptx: 'fas fa-file-powerpoint text-warning',
        zip: 'fas fa-file-archive text-secondary',
        rar: 'fas fa-file-archive text-secondary'
    }
    return icons[type] || 'fas fa-file text-muted'
}

const loadConversationInfo = async () => {
    isLoading.value = true

    try {
        // Try cache first
        const cacheKey = `conversation_info_${props.conversationId}`
        const cachedInfo = cacheStore.get(cacheKey)

        if (cachedInfo) {
            conversation.value = cachedInfo
            editableGroupName.value = conversation.value.name || ''
            editableGroupDescription.value = conversation.value.description || ''
        }

        // Load fresh data
        const response = await conversationStore.getConversationDetails(props.conversationId)
        conversation.value = response

        editableGroupName.value = conversation.value.name || ''
        editableGroupDescription.value = conversation.value.description || ''

        if (conversation.value.settings) {
            groupSettings.value = { ...groupSettings.value, ...conversation.value.settings }
        }

        // Cache for 10 minutes
        cacheStore.set(cacheKey, conversation.value, 10 * 60 * 1000)

        // Load additional data
        await Promise.all([
            loadMediaItems(),
            loadFileItems(),
            loadMutualFriends()
        ])

    } catch (error) {
        console.error('Load conversation info error:', error)
        toast.error('Không thể tải thông tin cuộc trò chuyện')
    } finally {
        isLoading.value = false
    }
}

const loadMediaItems = async () => {
    isLoadingMedia.value = true

    try {
        const response = await conversationStore.getConversationMedia(props.conversationId, {
            types: ['image', 'video'],
            limit: 50
        })
        mediaItems.value = response.items
    } catch (error) {
        console.error('Load media error:', error)
    } finally {
        isLoadingMedia.value = false
    }
}

const loadFileItems = async () => {
    isLoadingFiles.value = true

    try {
        const response = await conversationStore.getConversationFiles(props.conversationId, {
            limit: 50
        })
        fileItems.value = response.items
    } catch (error) {
        console.error('Load files error:', error)
    } finally {
        isLoadingFiles.value = false
    }
}

const loadMutualFriends = async () => {
    if (conversation.value?.isGroupChat || !otherParticipant.value) return

    try {
        const response = await userStore.getMutualFriends(otherParticipant.value.id)
        mutualFriends.value = response.friends
    } catch (error) {
        console.error('Load mutual friends error:', error)
    }
}

const startCall = (type) => {
    emit('call-started', { type, conversationId: props.conversationId })
    closeModal()
}

const openMediaGallery = () => {
    // Implementation for media gallery
    toast.info('Tính năng đang phát triển')
}

const searchInConversation = () => {
    // Implementation for conversation search
    toast.info('Tính năng đang phát triển')
}

const showAddMemberModal = () => {
    // Implementation for add member modal
    toast.info('Tính năng đang phát triển')
}

const viewMemberProfile = (member) => {
    router.push(`/profile/${member.id}`)
    closeModal()
}

const sendDirectMessage = (member) => {
    router.push(`/chat/${member.id}`)
    closeModal()
}

const promoteMember = async (member) => {
    try {
        await conversationStore.updateMemberRole(props.conversationId, member.id, 'admin')
        toast.success(`Đã thăng cấp ${member.name} thành quản trị viên`)
        await loadConversationInfo()
    } catch (error) {
        console.error('Promote member error:', error)
        toast.error('Thăng cấp thành viên thất bại')
    }
}

const demoteMember = async (member) => {
    try {
        await conversationStore.updateMemberRole(props.conversationId, member.id, 'member')
        toast.success(`Đã hạ cấp ${member.name} thành thành viên`)
        await loadConversationInfo()
    } catch (error) {
        console.error('Demote member error:', error)
        toast.error('Hạ cấp thành viên thất bại')
    }
}

const removeMember = async (member) => {
    if (!confirm(`Bạn có chắc muốn xóa ${member.name} khỏi nhóm?`)) return

    try {
        await conversationStore.removeMember(props.conversationId, member.id)
        toast.success(`Đã xóa ${member.name} khỏi nhóm`)
        emit('member-removed', member)
        await loadConversationInfo()
    } catch (error) {
        console.error('Remove member error:', error)
        toast.error('Xóa thành viên thất bại')
    }
}

const viewMutualFriend = (friend) => {
    router.push(`/profile/${friend.id}`)
    closeModal()
}

const openMediaViewer = (media) => {
    // Implementation for media viewer
    toast.info('Tính năng đang phát triển')
}

const downloadFile = (file) => {
    // Implementation for file download
    const link = document.createElement('a')
    link.href = file.url
    link.download = file.name
    link.click()
}

const updateGroupName = async () => {
    if (!canEditGroup.value || editableGroupName.value === conversation.value.name) return

    try {
        await conversationStore.updateConversation(props.conversationId, {
            name: editableGroupName.value
        })
        conversation.value.name = editableGroupName.value
        toast.success('Đã cập nhật tên nhóm')
    } catch (error) {
        console.error('Update group name error:', error)
        toast.error('Cập nhật tên nhóm thất bại')
        editableGroupName.value = conversation.value.name
    }
}

const updateGroupDescription = async () => {
    if (!canEditGroup.value || editableGroupDescription.value === conversation.value.description) return

    try {
        await conversationStore.updateConversation(props.conversationId, {
            description: editableGroupDescription.value
        })
        conversation.value.description = editableGroupDescription.value
        toast.success('Đã cập nhật mô tả nhóm')
    } catch (error) {
        console.error('Update group description error:', error)
        toast.error('Cập nhật mô tả nhóm thất bại')
        editableGroupDescription.value = conversation.value.description
    }
}

const updateGroupSettings = async () => {
    if (!canEditGroup.value) return

    try {
        await conversationStore.updateConversationSettings(props.conversationId, groupSettings.value)
        toast.success('Đã cập nhật cài đặt nhóm')
    } catch (error) {
        console.error('Update group settings error:', error)
        toast.error('Cập nhật cài đặt nhóm thất bại')
    }
}

const updateNotificationSettings = async () => {
    try {
        await conversationStore.updateNotificationSettings(props.conversationId, notificationSettings.value)
        toast.success('Đã cập nhật cài đặt thông báo')
    } catch (error) {
        console.error('Update notification settings error:', error)
        toast.error('Cập nhật cài đặt thông báo thất bại')
    }
}

const confirmLeaveGroup = () => {
    if (confirm('Bạn có chắc muốn rời khỏi nhóm này?')) {
        leaveGroup()
    }
}

const leaveGroup = async () => {
    try {
        await conversationStore.leaveConversation(props.conversationId)
        toast.success('Đã rời khỏi nhóm')
        emit('leave', conversation.value)
        closeModal()
    } catch (error) {
        console.error('Leave group error:', error)
        toast.error('Rời nhóm thất bại')
    }
}

const confirmDeleteGroup = () => {
    if (confirm('Bạn có chắc muốn xóa nhóm này? Hành động này không thể hoàn tác.')) {
        deleteGroup()
    }
}

const deleteGroup = async () => {
    try {
        await conversationStore.deleteConversation(props.conversationId)
        toast.success('Đã xóa nhóm')
        emit('delete', conversation.value)
        closeModal()
    } catch (error) {
        console.error('Delete group error:', error)
        toast.error('Xóa nhóm thất bại')
    }
}

const saveChanges = async () => {
    isSaving.value = true

    try {
        await Promise.all([
            updateGroupName(),
            updateGroupDescription(),
            updateGroupSettings()
        ])
        toast.success('Đã lưu tất cả thay đổi')
    } catch (error) {
        console.error('Save changes error:', error)
        toast.error('Lưu thay đổi thất bại')
    } finally {
        isSaving.value = false
    }
}

const showModal = () => {
    if (modalInstance) {
        modalInstance.show()
    }
}

const closeModal = () => {
    if (modalInstance) {
        modalInstance.hide()
    }
}

const handleModalHidden = () => {
    emit('close')
}

// Watchers
watch(() => props.show, (show) => {
    if (show) {
        showModal()
        loadConversationInfo()
    } else {
        closeModal()
    }
})

watch(() => props.conversationId, (newId) => {
    if (newId && props.show) {
        loadConversationInfo()
    }
})

// Lifecycle
onMounted(() => {
    // Initialize Bootstrap modal
    if (modal.value) {
        modalInstance = new Modal(modal.value)
    }

    // Load conversation info if showing
    if (props.show) {
        showModal()
        loadConversationInfo()
    }
})

onUnmounted(() => {
    if (modalInstance) {
        modalInstance.dispose()
    }
})

// Expose methods
defineExpose({
    show: showModal,
    hide: closeModal,
    refresh: loadConversationInfo
})
</script>

<style scoped>
.conversation-info {
    /* Modal styles handled by Bootstrap */
}

.conversation-avatar-container {
    position: relative;
    display: inline-block;
}

.group-avatar {
    position: relative;
}

.group-image {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--bs-border-color);
}

.member-count-badge {
    position: absolute;
    bottom: 0;
    right: 0;
    background: var(--bs-primary);
    color: white;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
    border: 2px solid white;
}

.user-avatar {
    position: relative;
}

.user-image {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid var(--bs-border-color);
}

.presence-indicator {
    position: absolute;
    bottom: 5px;
    right: 5px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 3px solid white;
}

.presence-indicator.online {
    background-color: var(--bs-success);
}

.presence-indicator.away {
    background-color: var(--bs-warning);
}

.presence-indicator.busy {
    background-color: var(--bs-danger);
}

.presence-indicator.offline {
    background-color: var(--bs-secondary);
}

.quick-actions .btn {
    min-height: 70px;
}

.members-list {
    max-height: 400px;
    overflow-y: auto;
}

.member-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 0;
    border-bottom: 1px solid var(--bs-border-color-translucent);
}

.member-item:last-child {
    border-bottom: none;
}

.member-info {
    display: flex;
    align-items: center;
    flex: 1;
}

.member-avatar-container {
    position: relative;
    margin-right: 0.75rem;
}

.member-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.member-avatar-container .presence-indicator {
    width: 12px;
    height: 12px;
    bottom: 0;
    right: 0;
    border: 2px solid white;
}

.member-details {
    flex: 1;
}

.member-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.member-meta {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.info-section {
    margin-bottom: 2rem;
}

.section-title {
    margin-bottom: 1rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--bs-border-color);
    color: var(--bs-primary);
}

.info-items {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.info-item {
    display: flex;
    align-items: flex-start;
}

.info-label {
    font-size: 0.875rem;
    color: var(--bs-secondary);
    margin-bottom: 0.25rem;
}

.info-value {
    font-weight: 500;
}

.mutual-friends-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 1rem;
}

.mutual-friend {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.mutual-friend:hover {
    transform: translateY(-2px);
}

.mutual-friend img {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 0.5rem;
}

.friend-name {
    font-size: 0.875rem;
    text-align: center;
    font-weight: 500;
}

.media-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
    gap: 0.5rem;
}

.media-item {
    position: relative;
    aspect-ratio: 1;
    border-radius: 0.375rem;
    overflow: hidden;
    cursor: pointer;
    transition: transform 0.2s ease;
}

.media-item:hover {
    transform: scale(1.05);
}

.media-item img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.media-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.media-item:hover .media-overlay {
    opacity: 1;
}

.media-icon {
    color: white;
    font-size: 1.5rem;
}

.files-list {
    max-height: 400px;
    overflow-y: auto;
}

.file-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.file-item:hover {
    background-color: var(--bs-light);
}

.file-icon {
    margin-right: 1rem;
    width: 40px;
    text-align: center;
}

.file-details {
    flex: 1;
}

.file-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.file-meta {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.empty-state {
    padding: 3rem 1rem;
}

.settings-section {
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.settings-section:last-child {
    border-bottom: none;
}

.setting-item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 1rem;
    gap: 1rem;
}

.setting-info {
    flex: 1;
}

.setting-item .form-select {
    max-width: 200px;
}

.danger-zone {
    border-color: var(--bs-danger) !important;
}

.danger-zone .section-title {
    color: var(--bs-danger) !important;
}

@media (max-width: 768px) {
    .quick-actions .row {
        gap: 0.5rem;
    }

    .quick-actions .btn {
        min-height: 60px;
        padding: 0.5rem;
    }

    .media-grid {
        grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    }

    .mutual-friends-grid {
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    }

    .setting-item {
        flex-direction: column;
        align-items: stretch;
    }

    .setting-item .form-select {
        max-width: none;
    }
}
</style>