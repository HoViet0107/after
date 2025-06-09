<!-- Component danh sách thành viên cuộc trò chuyện với WebSocket real-time presence -->

<template>
    <div class="participant-list">
        <!-- Header -->
        <div class="participant-header">
            <div class="header-title">
                <h6 class="mb-0">
                    <i class="fas fa-users me-2"></i>
                    Thành viên ({{ filteredParticipants.length }})
                </h6>
                <div v-if="onlineCount > 0" class="online-count">
                    {{ onlineCount }} đang online
                </div>
            </div>

            <!-- Search & Filter -->
            <div class="header-actions">
                <!-- Search -->
                <div class="search-container" v-if="showSearch || searchQuery">
                    <div class="input-group input-group-sm">
                        <span class="input-group-text">
                            <i class="fas fa-search"></i>
                        </span>
                        <input type="text" v-model="searchQuery" class="form-control" placeholder="Tìm thành viên..."
                            @focus="showSearch = true" @blur="handleSearchBlur" ref="searchInput" />
                        <button v-if="searchQuery" type="button" class="btn btn-outline-secondary" @click="clearSearch">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                <!-- Search Toggle -->
                <button v-if="!showSearch && !searchQuery" type="button" class="btn btn-sm btn-outline-secondary"
                    @click="toggleSearch" title="Tìm kiếm thành viên">
                    <i class="fas fa-search"></i>
                </button>

                <!-- Filter Menu -->
                <div class="dropdown">
                    <button type="button" class="btn btn-sm btn-outline-secondary dropdown-toggle"
                        data-bs-toggle="dropdown" title="Lọc thành viên">
                        <i class="fas fa-filter"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <h6 class="dropdown-header">Trạng thái</h6>
                        </li>
                        <li>
                            <button class="dropdown-item" :class="{ active: statusFilter === 'all' }"
                                @click="setStatusFilter('all')">
                                <i class="fas fa-users me-2"></i>Tất cả
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item" :class="{ active: statusFilter === 'online' }"
                                @click="setStatusFilter('online')">
                                <i class="fas fa-circle text-success me-2"></i>Đang online
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item" :class="{ active: statusFilter === 'offline' }"
                                @click="setStatusFilter('offline')">
                                <i class="fas fa-circle text-secondary me-2"></i>Offline
                            </button>
                        </li>

                        <li>
                            <hr class="dropdown-divider">
                        </li>

                        <li>
                            <h6 class="dropdown-header">Vai trò</h6>
                        </li>
                        <li>
                            <button class="dropdown-item" :class="{ active: roleFilter === 'all' }"
                                @click="setRoleFilter('all')">
                                <i class="fas fa-user me-2"></i>Tất cả
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item" :class="{ active: roleFilter === 'owner' }"
                                @click="setRoleFilter('owner')">
                                <i class="fas fa-crown text-warning me-2"></i>Chủ nhóm
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item" :class="{ active: roleFilter === 'admin' }"
                                @click="setRoleFilter('admin')">
                                <i class="fas fa-shield-alt text-info me-2"></i>Quản trị viên
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item" :class="{ active: roleFilter === 'member' }"
                                @click="setRoleFilter('member')">
                                <i class="fas fa-user text-secondary me-2"></i>Thành viên
                            </button>
                        </li>
                    </ul>
                </div>

                <!-- Add Member (if allowed) -->
                <button v-if="canAddMembers" type="button" class="btn btn-sm btn-primary" @click="showAddMemberModal"
                    title="Thêm thành viên">
                    <i class="fas fa-plus"></i>
                </button>
            </div>
        </div>

        <!-- Participant List -->
        <div class="participant-list-container">
            <div v-if="isLoading" class="loading-state">
                <div class="d-flex justify-content-center py-3">
                    <div class="spinner-border spinner-border-sm text-primary"></div>
                    <span class="ms-2 text-muted">Đang tải...</span>
                </div>
            </div>

            <div v-else-if="filteredParticipants.length === 0" class="empty-state">
                <div class="text-center py-4">
                    <i class="fas fa-users text-muted fs-2 mb-2"></i>
                    <div class="text-muted">
                        {{ searchQuery ? 'Không tìm thấy thành viên' : 'Chưa có thành viên' }}
                    </div>
                    <button v-if="searchQuery" type="button" class="btn btn-sm btn-outline-primary mt-2"
                        @click="clearSearch">
                        Xóa bộ lọc
                    </button>
                </div>
            </div>

            <div v-else class="participants">
                <!-- Group by status/role -->
                <div v-for="group in groupedParticipants" :key="group.title" class="participant-group">
                    <!-- Group Header -->
                    <div v-if="group.title" class="group-header">
                        <h6 class="group-title">{{ group.title }}</h6>
                        <span class="group-count">{{ group.participants.length }}</span>
                    </div>

                    <!-- Participants -->
                    <div class="group-participants">
                        <div v-for="participant in group.participants" :key="participant.id" class="participant-item"
                            :class="{
                                'current-user': participant.id === currentUser?.id,
                                'online': participant.presence?.status === 'online',
                                'away': participant.presence?.status === 'away',
                                'busy': participant.presence?.status === 'busy'
                            }" @click="selectParticipant(participant)">
                            <!-- Avatar -->
                            <div class="participant-avatar">
                                <img :src="participant.avatar || '/default-avatar.png'" :alt="participant.name"
                                    class="avatar-image" />
                                <div v-if="participant.presence" class="presence-indicator"
                                    :class="participant.presence.status"
                                    :title="getPresenceTooltip(participant.presence)"></div>

                                <!-- Typing indicator -->
                                <div v-if="typingUsers.includes(participant.id)" class="typing-indicator"
                                    title="Đang gõ...">
                                    <div class="typing-dots">
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                        <div class="dot"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Info -->
                            <div class="participant-info">
                                <div class="participant-name">
                                    {{ participant.name }}
                                    <span v-if="participant.id === currentUser?.id" class="current-user-badge">
                                        (Bạn)
                                    </span>
                                </div>

                                <div class="participant-meta">
                                    <!-- Role -->
                                    <span class="participant-role" :class="getRoleClass(participant.role)">
                                        {{ getRoleText(participant.role) }}
                                    </span>

                                    <!-- Status -->
                                    <span v-if="participant.presence" class="participant-status">
                                        • {{ getPresenceText(participant.presence.status) }}
                                    </span>

                                    <!-- Last seen -->
                                    <span
                                        v-if="participant.presence?.lastSeen && participant.presence.status === 'offline'"
                                        class="last-seen">
                                        • {{ formatLastSeen(participant.presence.lastSeen) }}
                                    </span>
                                </div>

                                <!-- Additional info -->
                                <div v-if="participant.joinedAt" class="participant-joined">
                                    <small class="text-muted">
                                        Tham gia {{ formatJoinDate(participant.joinedAt) }}
                                    </small>
                                </div>
                            </div>

                            <!-- Actions -->
                            <div class="participant-actions">
                                <!-- Quick Actions -->
                                <div class="quick-actions">
                                    <!-- Message -->
                                    <button v-if="participant.id !== currentUser?.id" type="button"
                                        class="btn btn-sm btn-outline-secondary action-btn"
                                        @click.stop="sendDirectMessage(participant)" title="Nhắn tin riêng">
                                        <i class="fas fa-comment"></i>
                                    </button>

                                    <!-- Call -->
                                    <button
                                        v-if="participant.id !== currentUser?.id && participant.presence?.status === 'online'"
                                        type="button" class="btn btn-sm btn-outline-secondary action-btn"
                                        @click.stop="callParticipant(participant)" title="Gọi">
                                        <i class="fas fa-phone"></i>
                                    </button>
                                </div>

                                <!-- More Actions Menu -->
                                <div v-if="canManageParticipant(participant)" class="dropdown">
                                    <button type="button"
                                        class="btn btn-sm btn-outline-secondary dropdown-toggle action-btn"
                                        data-bs-toggle="dropdown" @click.stop>
                                        <i class="fas fa-ellipsis-h"></i>
                                    </button>

                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <!-- View Profile -->
                                        <li>
                                            <button class="dropdown-item" @click="viewProfile(participant)">
                                                <i class="fas fa-user me-2"></i>Xem hồ sơ
                                            </button>
                                        </li>

                                        <!-- Make Admin -->
                                        <li v-if="canPromote(participant)">
                                            <button class="dropdown-item" @click="promoteToAdmin(participant)">
                                                <i class="fas fa-arrow-up me-2"></i>Thăng cấp Admin
                                            </button>
                                        </li>

                                        <!-- Remove Admin -->
                                        <li v-if="canDemote(participant)">
                                            <button class="dropdown-item" @click="demoteFromAdmin(participant)">
                                                <i class="fas fa-arrow-down me-2"></i>Hạ cấp thành viên
                                            </button>
                                        </li>

                                        <!-- Transfer Ownership -->
                                        <li v-if="canTransferOwnership(participant)">
                                            <button class="dropdown-item text-warning"
                                                @click="transferOwnership(participant)">
                                                <i class="fas fa-crown me-2"></i>Chuyển quyền chủ nhóm
                                            </button>
                                        </li>

                                        <li>
                                            <hr class="dropdown-divider">
                                        </li>

                                        <!-- Remove Member -->
                                        <li v-if="canRemove(participant)">
                                            <button class="dropdown-item text-danger"
                                                @click="removeMember(participant)">
                                                <i class="fas fa-user-times me-2"></i>Xóa khỏi nhóm
                                            </button>
                                        </li>

                                        <!-- Block Member -->
                                        <li v-if="participant.id !== currentUser?.id">
                                            <button class="dropdown-item text-danger" @click="blockMember(participant)">
                                                <i class="fas fa-ban me-2"></i>Chặn thành viên
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Floating Action Button for Mobile -->
        <button v-if="canAddMembers && isMobile" type="button" class="fab-add-member" @click="showAddMemberModal"
            title="Thêm thành viên">
            <i class="fas fa-plus"></i>
        </button>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { usePresenceStore } from '@/stores/presence'
import { useBreakpoints } from '@/composables/useBreakpoints'
import { useToast } from 'vue-toastification'
import { formatDistanceToNow, format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Props
const props = defineProps({
    conversationId: {
        type: String,
        required: true
    },
    participants: {
        type: Array,
        default: () => []
    },
    typingUsers: {
        type: Array,
        default: () => []
    },
    canAddMembers: {
        type: Boolean,
        default: false
    },
    canManageMembers: {
        type: Boolean,
        default: false
    },
    currentUserRole: {
        type: String,
        default: 'member'
    },
    isGroupChat: {
        type: Boolean,
        default: false
    },
    isLoading: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits([
    'participant-selected',
    'add-member',
    'remove-member',
    'promote-member',
    'demote-member',
    'transfer-ownership',
    'block-member',
    'call-participant',
    'message-participant'
])

// Dependencies
const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const presenceStore = usePresenceStore()
const { isMobile } = useBreakpoints()
const toast = useToast()

// Refs
const searchInput = ref(null)

// State
const searchQuery = ref('')
const showSearch = ref(false)
const statusFilter = ref('all')
const roleFilter = ref('all')

// Computed
const currentUser = computed(() => authStore.user)

const onlineCount = computed(() => {
    return props.participants.filter(p => p.presence?.status === 'online').length
})

const filteredParticipants = computed(() => {
    let participants = [...props.participants]

    // Search filter
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        participants = participants.filter(p =>
            p.name.toLowerCase().includes(query) ||
            p.username?.toLowerCase().includes(query)
        )
    }

    // Status filter
    if (statusFilter.value !== 'all') {
        participants = participants.filter(p => {
            if (statusFilter.value === 'online') {
                return p.presence?.status === 'online'
            } else if (statusFilter.value === 'offline') {
                return !p.presence || p.presence.status === 'offline'
            }
            return true
        })
    }

    // Role filter
    if (roleFilter.value !== 'all') {
        participants = participants.filter(p => p.role === roleFilter.value)
    }

    return participants
})

const groupedParticipants = computed(() => {
    const participants = filteredParticipants.value

    // If filtering by specific criteria, don't group
    if (searchQuery.value || statusFilter.value !== 'all' || roleFilter.value !== 'all') {
        return [{
            title: null,
            participants: sortParticipants(participants)
        }]
    }

    // Group by role for group chats
    if (props.isGroupChat) {
        const groups = []

        // Owner
        const owners = participants.filter(p => p.role === 'owner')
        if (owners.length > 0) {
            groups.push({
                title: 'Chủ nhóm',
                participants: sortParticipants(owners)
            })
        }

        // Admins
        const admins = participants.filter(p => p.role === 'admin')
        if (admins.length > 0) {
            groups.push({
                title: 'Quản trị viên',
                participants: sortParticipants(admins)
            })
        }

        // Members
        const members = participants.filter(p => p.role === 'member' || !p.role)
        if (members.length > 0) {
            groups.push({
                title: 'Thành viên',
                participants: sortParticipants(members)
            })
        }

        return groups
    }

    // For direct chats, just return sorted list
    return [{
        title: null,
        participants: sortParticipants(participants)
    }]
})

// Methods
const sortParticipants = (participants) => {
    return [...participants].sort((a, b) => {
        // Current user first
        if (a.id === currentUser.value?.id) return -1
        if (b.id === currentUser.value?.id) return 1

        // Online users first
        const aOnline = a.presence?.status === 'online' ? 0 : 1
        const bOnline = b.presence?.status === 'online' ? 0 : 1
        if (aOnline !== bOnline) return aOnline - bOnline

        // Alphabetical by name
        return a.name.localeCompare(b.name)
    })
}

const getPresenceText = (status) => {
    const statusMap = {
        online: 'Đang hoạt động',
        away: 'Vắng mặt',
        busy: 'Bận',
        offline: 'Offline'
    }
    return statusMap[status] || 'Offline'
}

const getPresenceTooltip = (presence) => {
    let tooltip = getPresenceText(presence.status)

    if (presence.lastSeen && presence.status === 'offline') {
        tooltip += ` • Lần cuối ${formatLastSeen(presence.lastSeen)}`
    }

    return tooltip
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
        owner: 'text-warning',
        admin: 'text-info',
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
    return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: vi
    })
}

const toggleSearch = () => {
    showSearch.value = true
    nextTick(() => {
        searchInput.value?.focus()
    })
}

const handleSearchBlur = () => {
    if (!searchQuery.value) {
        showSearch.value = false
    }
}

const clearSearch = () => {
    searchQuery.value = ''
    showSearch.value = false
}

const setStatusFilter = (status) => {
    statusFilter.value = status
}

const setRoleFilter = (role) => {
    roleFilter.value = role
}

const selectParticipant = (participant) => {
    emit('participant-selected', participant)
}

const canManageParticipant = (participant) => {
    if (participant.id === currentUser.value?.id) return false
    if (!props.canManageMembers) return false

    // Owner can manage everyone
    if (props.currentUserRole === 'owner') return true

    // Admin can manage members but not other admins or owner
    if (props.currentUserRole === 'admin') {
        return participant.role === 'member' || !participant.role
    }

    return false
}

const canPromote = (participant) => {
    return props.currentUserRole === 'owner' &&
        (participant.role === 'member' || !participant.role)
}

const canDemote = (participant) => {
    return props.currentUserRole === 'owner' && participant.role === 'admin'
}

const canTransferOwnership = (participant) => {
    return props.currentUserRole === 'owner' &&
        participant.id !== currentUser.value?.id
}

const canRemove = (participant) => {
    return canManageParticipant(participant) && participant.role !== 'owner'
}

const showAddMemberModal = () => {
    emit('add-member')
}

const sendDirectMessage = (participant) => {
    emit('message-participant', participant)
}

const callParticipant = (participant) => {
    emit('call-participant', participant)
}

const viewProfile = (participant) => {
    router.push(`/profile/${participant.id}`)
}

const promoteToAdmin = async (participant) => {
    if (!canPromote(participant)) return

    try {
        await conversationStore.updateMemberRole(props.conversationId, participant.id, 'admin')
        emit('promote-member', participant)
        toast.success(`Đã thăng cấp ${participant.name} thành quản trị viên`)
    } catch (error) {
        console.error('Promote member error:', error)
        toast.error('Thăng cấp thành viên thất bại')
    }
}

const demoteFromAdmin = async (participant) => {
    if (!canDemote(participant)) return

    try {
        await conversationStore.updateMemberRole(props.conversationId, participant.id, 'member')
        emit('demote-member', participant)
        toast.success(`Đã hạ cấp ${participant.name} thành thành viên`)
    } catch (error) {
        console.error('Demote member error:', error)
        toast.error('Hạ cấp thành viên thất bại')
    }
}

const transferOwnership = async (participant) => {
    if (!canTransferOwnership(participant)) return

    const confirmed = confirm(
        `Bạn có chắc muốn chuyển quyền chủ nhóm cho ${participant.name}? ` +
        'Bạn sẽ trở thành quản trị viên và không thể hoàn tác.'
    )

    if (!confirmed) return

    try {
        await conversationStore.transferOwnership(props.conversationId, participant.id)
        emit('transfer-ownership', participant)
        toast.success(`Đã chuyển quyền chủ nhóm cho ${participant.name}`)
    } catch (error) {
        console.error('Transfer ownership error:', error)
        toast.error('Chuyển quyền chủ nhóm thất bại')
    }
}

const removeMember = async (participant) => {
    if (!canRemove(participant)) return

    const confirmed = confirm(`Bạn có chắc muốn xóa ${participant.name} khỏi nhóm?`)
    if (!confirmed) return

    try {
        await conversationStore.removeMember(props.conversationId, participant.id)
        emit('remove-member', participant)
        toast.success(`Đã xóa ${participant.name} khỏi nhóm`)
    } catch (error) {
        console.error('Remove member error:', error)
        toast.error('Xóa thành viên thất bại')
    }
}

const blockMember = async (participant) => {
    const confirmed = confirm(`Bạn có chắc muốn chặn ${participant.name}?`)
    if (!confirmed) return

    try {
        await conversationStore.blockMember(props.conversationId, participant.id)
        emit('block-member', participant)
        toast.success(`Đã chặn ${participant.name}`)
    } catch (error) {
        console.error('Block member error:', error)
        toast.error('Chặn thành viên thất bại')
    }
}
</script>

<style scoped>
.participant-list {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: white;
    border-radius: 0.5rem;
    border: 1px solid var(--bs-border-color);
}

.participant-header {
    padding: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
    background-color: var(--bs-light);
}

.header-title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.online-count {
    font-size: 0.875rem;
    color: var(--bs-success);
    font-weight: 500;
}

.header-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.search-container {
    flex: 1;
    max-width: 250px;
}

.participant-list-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem;
}

.participant-group {
    margin-bottom: 1rem;
}

.participant-group:last-child {
    margin-bottom: 0;
}

.group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0.75rem;
    margin-bottom: 0.5rem;
    background-color: var(--bs-light);
    border-radius: 0.375rem;
    border-left: 3px solid var(--bs-primary);
}

.group-title {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--bs-primary);
}

.group-count {
    font-size: 0.75rem;
    color: var(--bs-secondary);
    background: var(--bs-white);
    padding: 0.125rem 0.5rem;
    border-radius: 1rem;
}

.group-participants {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.participant-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    border-radius: 0.375rem;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 1px solid transparent;
}

.participant-item:hover {
    background-color: var(--bs-light);
    border-color: var(--bs-border-color);
}

.participant-item.current-user {
    background-color: rgba(var(--bs-primary-rgb), 0.1);
    border-color: var(--bs-primary);
}

.participant-item.online {
    border-left: 3px solid var(--bs-success);
}

.participant-item.away {
    border-left: 3px solid var(--bs-warning);
}

.participant-item.busy {
    border-left: 3px solid var(--bs-danger);
}

.participant-avatar {
    position: relative;
    margin-right: 0.75rem;
    flex-shrink: 0;
}

.avatar-image {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
}

.presence-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    border: 2px solid white;
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

.typing-indicator {
    position: absolute;
    top: -5px;
    right: -5px;
    background: var(--bs-primary);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.typing-dots {
    display: flex;
    gap: 1px;
}

.dot {
    width: 3px;
    height: 3px;
    background: white;
    border-radius: 50%;
    animation: typing-bounce 1.4s infinite ease-in-out;
}

.dot:nth-child(2) {
    animation-delay: 0.2s;
}

.dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing-bounce {

    0%,
    80%,
    100% {
        transform: scale(0.8);
        opacity: 0.7;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

.participant-info {
    flex: 1;
    min-width: 0;
}

.participant-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.current-user-badge {
    font-weight: normal;
    color: var(--bs-primary);
    font-size: 0.875rem;
}

.participant-meta {
    font-size: 0.875rem;
    color: var(--bs-secondary);
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
}

.participant-role {
    font-weight: 500;
}

.participant-joined {
    margin-top: 0.25rem;
}

.participant-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-left: 0.5rem;
    opacity: 0;
    transition: opacity 0.2s ease;
}

.participant-item:hover .participant-actions {
    opacity: 1;
}

.quick-actions {
    display: flex;
    gap: 0.25rem;
}

.action-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.fab-add-member {
    position: fixed;
    bottom: 1rem;
    right: 1rem;
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: var(--bs-primary);
    color: white;
    border: none;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
    font-size: 1.25rem;
    z-index: 1000;
    transition: all 0.2s ease;
}

.fab-add-member:hover {
    background: var(--bs-primary-dark);
    transform: scale(1.1);
}

.loading-state,
.empty-state {
    padding: 2rem 1rem;
}

.dropdown-item.active {
    background-color: var(--bs-primary);
    color: white;
}

@media (max-width: 768px) {
    .participant-header {
        padding: 0.75rem;
    }

    .header-actions {
        flex-wrap: wrap;
        gap: 0.25rem;
    }

    .search-container {
        max-width: none;
        order: -1;
        width: 100%;
    }

    .participant-item {
        padding: 0.5rem;
    }

    .avatar-image {
        width: 36px;
        height: 36px;
    }

    .participant-actions {
        opacity: 1;
    }

    .quick-actions {
        flex-direction: column;
    }

    .action-btn {
        width: 28px;
        height: 28px;
        font-size: 0.8rem;
    }
}

@media (max-width: 576px) {
    .participant-meta {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.125rem;
    }

    .group-header {
        padding: 0.375rem 0.5rem;
    }

    .participant-item {
        padding: 0.375rem 0.5rem;
    }
}
</style>