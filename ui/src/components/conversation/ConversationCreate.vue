<!-- Component tạo cuộc trò chuyện mới với WebSocket real-time và Redis caching -->

<template>
    <div class="conversation-create">
        <!-- Modal for creating conversation -->
        <div class="modal fade" tabindex="-1" ref="modal" @hidden.bs.modal="handleModalHidden">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <!-- Modal Header -->
                    <div class="modal-header">
                        <h5 class="modal-title">
                            <i class="fas fa-comments me-2"></i>
                            {{ isGroupChat ? 'Tạo nhóm chat mới' : 'Bắt đầu cuộc trò chuyện' }}
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                    </div>

                    <!-- Modal Body -->
                    <div class="modal-body">
                        <!-- Conversation Type Selection -->
                        <div class="conversation-type mb-4">
                            <div class="form-check-group">
                                <div class="form-check">
                                    <input type="radio" id="directChat" v-model="conversationType" value="direct"
                                        class="form-check-input" />
                                    <label for="directChat" class="form-check-label">
                                        <div class="check-option">
                                            <i class="fas fa-user-friends text-primary"></i>
                                            <div>
                                                <strong>Trò chuyện trực tiếp</strong>
                                                <div class="text-muted small">Chat 1-1 với một người</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div class="form-check">
                                    <input type="radio" id="groupChat" v-model="conversationType" value="group"
                                        class="form-check-input" />
                                    <label for="groupChat" class="form-check-label">
                                        <div class="check-option">
                                            <i class="fas fa-users text-success"></i>
                                            <div>
                                                <strong>Nhóm chat</strong>
                                                <div class="text-muted small">Chat với nhiều người</div>
                                            </div>
                                        </div>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <!-- Group Name (for group chats) -->
                        <div v-if="isGroupChat" class="mb-4">
                            <label for="groupName" class="form-label">
                                Tên nhóm <span class="text-danger">*</span>
                            </label>
                            <input type="text" id="groupName" v-model="groupName" class="form-control"
                                :class="{ 'is-invalid': errors.groupName }" placeholder="Nhập tên nhóm..."
                                maxlength="100" />
                            <div v-if="errors.groupName" class="invalid-feedback">
                                {{ errors.groupName }}
                            </div>
                            <div class="form-text">{{ groupName.length }}/100 ký tự</div>
                        </div>

                        <!-- Group Description (for group chats) -->
                        <div v-if="isGroupChat" class="mb-4">
                            <label for="groupDescription" class="form-label">Mô tả nhóm</label>
                            <textarea id="groupDescription" v-model="groupDescription" class="form-control" rows="3"
                                placeholder="Mô tả về nhóm chat này..." maxlength="500"></textarea>
                            <div class="form-text">{{ groupDescription.length }}/500 ký tự</div>
                        </div>

                        <!-- Participant Search -->
                        <div class="participant-section mb-4">
                            <label class="form-label">
                                {{ isGroupChat ? 'Thành viên nhóm' : 'Người nhận' }}
                                <span class="text-danger">*</span>
                            </label>

                            <!-- Search Input -->
                            <div class="search-container">
                                <div class="input-group">
                                    <span class="input-group-text">
                                        <i class="fas fa-search"></i>
                                    </span>
                                    <input type="text" v-model="searchQuery" class="form-control"
                                        placeholder="Tìm kiếm bạn bè..." @input="handleSearchInput"
                                        @focus="showSearchResults = true" />
                                </div>

                                <!-- Search Results -->
                                <div v-if="showSearchResults && (searchResults.length > 0 || isSearching)"
                                    class="search-results">
                                    <!-- Loading -->
                                    <div v-if="isSearching" class="search-loading">
                                        <div class="d-flex align-items-center justify-content-center py-3">
                                            <div class="spinner-border spinner-border-sm me-2"></div>
                                            <span class="text-muted">Đang tìm kiếm...</span>
                                        </div>
                                    </div>

                                    <!-- Results -->
                                    <div v-else class="search-items">
                                        <div v-for="user in filteredSearchResults" :key="user.id" class="search-item"
                                            @click="toggleParticipant(user)">
                                            <div class="user-info">
                                                <img :src="user.avatar || '/default-avatar.png'" :alt="user.name"
                                                    class="user-avatar" />
                                                <div class="user-details">
                                                    <div class="user-name">{{ user.name }}</div>
                                                    <div class="user-meta">
                                                        @{{ user.username }}
                                                        <span v-if="user.presence" class="presence-status"
                                                            :class="user.presence.status">
                                                            • {{ getPresenceText(user.presence.status) }}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="user-actions">
                                                <div class="form-check">
                                                    <input type="checkbox" :id="`user-${user.id}`"
                                                        :checked="isSelected(user.id)" class="form-check-input"
                                                        @change="toggleParticipant(user)" />
                                                    <label :for="`user-${user.id}`" class="form-check-label"></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- No Results -->
                                    <div v-if="!isSearching && searchQuery && searchResults.length === 0"
                                        class="no-results">
                                        <div class="text-center py-3">
                                            <i class="fas fa-search text-muted fs-4 mb-2"></i>
                                            <div class="text-muted">Không tìm thấy kết quả</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Recent Contacts -->
                            <div v-if="!searchQuery && recentContacts.length > 0" class="recent-contacts mt-3">
                                <h6 class="text-muted mb-2">Liên hệ gần đây</h6>
                                <div class="recent-list">
                                    <div v-for="contact in recentContacts" :key="contact.id" class="recent-contact"
                                        @click="toggleParticipant(contact)">
                                        <img :src="contact.avatar || '/default-avatar.png'" :alt="contact.name"
                                            class="contact-avatar" />
                                        <div class="contact-name">{{ contact.name }}</div>
                                        <div v-if="isSelected(contact.id)" class="selected-indicator">
                                            <i class="fas fa-check-circle text-success"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Selected Participants -->
                        <div v-if="selectedParticipants.length > 0" class="selected-participants mb-4">
                            <h6 class="text-muted mb-2">
                                Đã chọn ({{ selectedParticipants.length }})
                                <span v-if="isGroupChat && selectedParticipants.length < 2" class="text-danger">
                                    - Cần ít nhất 2 thành viên
                                </span>
                            </h6>

                            <div class="participants-grid">
                                <div v-for="participant in selectedParticipants" :key="participant.id"
                                    class="participant-tag">
                                    <img :src="participant.avatar || '/default-avatar.png'" :alt="participant.name"
                                        class="tag-avatar" />
                                    <span class="tag-name">{{ participant.name }}</span>
                                    <button type="button" class="btn-remove" @click="removeParticipant(participant.id)"
                                        title="Xóa khỏi danh sách">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Group Settings (for group chats) -->
                        <div v-if="isGroupChat" class="group-settings">
                            <h6 class="text-muted mb-3">Cài đặt nhóm</h6>

                            <div class="row">
                                <div class="col-md-6">
                                    <div class="form-check form-switch mb-3">
                                        <input type="checkbox" id="allowInvites"
                                            v-model="groupSettings.allowMemberInvites" class="form-check-input" />
                                        <label for="allowInvites" class="form-check-label">
                                            Cho phép thành viên mời người khác
                                        </label>
                                    </div>
                                </div>

                                <div class="col-md-6">
                                    <div class="form-check form-switch mb-3">
                                        <input type="checkbox" id="requireApproval"
                                            v-model="groupSettings.requireApproval" class="form-check-input" />
                                        <label for="requireApproval" class="form-check-label">
                                            Yêu cầu phê duyệt khi tham gia
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div class="mb-3">
                                <label for="groupPrivacy" class="form-label">Quyền riêng tư</label>
                                <select id="groupPrivacy" v-model="groupSettings.privacy" class="form-select">
                                    <option value="public">Công khai - Mọi người có thể tìm thấy</option>
                                    <option value="private">Riêng tư - Chỉ thành viên mới thấy</option>
                                    <option value="secret">Bí mật - Hoàn toàn ẩn</option>
                                </select>
                            </div>
                        </div>

                        <!-- Error Messages -->
                        <div v-if="errors.general" class="alert alert-danger">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            {{ errors.general }}
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
                            Hủy
                        </button>
                        <button type="button" class="btn btn-primary" @click="createConversation"
                            :disabled="!canCreate || isCreating">
                            <span v-if="isCreating" class="spinner-border spinner-border-sm me-2"></span>
                            <i v-else class="fas fa-plus me-2"></i>
                            {{ isCreating ? 'Đang tạo...' : (isGroupChat ? 'Tạo nhóm' : 'Bắt đầu chat') }}
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
import { useWebSocket } from '@/composables/useWebSocket'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'
import { Modal } from 'bootstrap'

// Props
const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    initialParticipants: {
        type: Array,
        default: () => []
    },
    conversationType: {
        type: String,
        default: 'direct', // 'direct' or 'group'
        validator: value => ['direct', 'group'].includes(value)
    }
})

// Emits
const emit = defineEmits([
    'created',
    'close',
    'participant-added',
    'participant-removed'
])

// Dependencies
const router = useRouter()
const authStore = useAuthStore()
const conversationStore = useConversationStore()
const userStore = useUserStore()
const presenceStore = usePresenceStore()
const cacheStore = useCacheStore()
const { isConnected } = useWebSocket()
const toast = useToast()

// Refs
const modal = ref(null)

// State
const conversationType = ref(props.conversationType)
const groupName = ref('')
const groupDescription = ref('')
const searchQuery = ref('')
const selectedParticipants = ref([...props.initialParticipants])
const searchResults = ref([])
const recentContacts = ref([])
const showSearchResults = ref(false)
const isSearching = ref(false)
const isCreating = ref(false)
const errors = ref({})

// Group settings
const groupSettings = ref({
    allowMemberInvites: true,
    requireApproval: false,
    privacy: 'private'
})

// Modal instance
let modalInstance = null

// Computed
const currentUser = computed(() => authStore.user)

const isGroupChat = computed(() => conversationType.value === 'group')

const filteredSearchResults = computed(() => {
    return searchResults.value.filter(user =>
        user.id !== currentUser.value?.id && // Exclude current user
        !selectedParticipants.value.find(p => p.id === user.id) // Exclude already selected
    )
})

const canCreate = computed(() => {
    if (isGroupChat.value) {
        return groupName.value.trim() &&
            selectedParticipants.value.length >= 2 && // Minimum 2 participants for group
            !Object.keys(errors.value).length
    } else {
        return selectedParticipants.value.length === 1 && // Exactly 1 participant for direct chat
            !Object.keys(errors.value).length
    }
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

const isSelected = (userId) => {
    return selectedParticipants.value.find(p => p.id === userId) !== undefined
}

const toggleParticipant = (user) => {
    const existingIndex = selectedParticipants.value.findIndex(p => p.id === user.id)

    if (existingIndex !== -1) {
        removeParticipant(user.id)
    } else {
        addParticipant(user)
    }
}

const addParticipant = (user) => {
    // For direct chat, only allow 1 participant
    if (!isGroupChat.value && selectedParticipants.value.length >= 1) {
        selectedParticipants.value = [user]
    } else if (isGroupChat.value && selectedParticipants.value.length >= 50) {
        toast.warning('Nhóm chat chỉ cho phép tối đa 50 thành viên')
        return
    } else {
        selectedParticipants.value.push(user)
    }

    emit('participant-added', user)

    // Add to recent contacts
    addToRecentContacts(user)
}

const removeParticipant = (userId) => {
    const index = selectedParticipants.value.findIndex(p => p.id === userId)
    if (index !== -1) {
        const removed = selectedParticipants.value.splice(index, 1)[0]
        emit('participant-removed', removed)
    }
}

const handleSearchInput = debounce(() => {
    if (searchQuery.value.trim()) {
        performSearch()
    } else {
        searchResults.value = []
        showSearchResults.value = false
    }
}, 300)

const performSearch = async () => {
    if (!searchQuery.value.trim()) return

    isSearching.value = true
    showSearchResults.value = true

    try {
        // Try cache first
        const cacheKey = `conversation_user_search_${searchQuery.value}`
        const cachedResults = cacheStore.get(cacheKey)

        if (cachedResults) {
            searchResults.value = cachedResults
            return
        }

        const searchParams = {
            query: searchQuery.value,
            limit: 20,
            onlyFriends: true, // Only show friends for conversations
            includePresence: true
        }

        const response = await userStore.searchUsers(searchParams)
        searchResults.value = response.users

        // Cache for 5 minutes
        cacheStore.set(cacheKey, searchResults.value, 5 * 60 * 1000)

    } catch (error) {
        console.error('Search users error:', error)
        toast.error('Tìm kiếm thất bại')
    } finally {
        isSearching.value = false
    }
}

const loadRecentContacts = async () => {
    try {
        // Try cache first
        const cachedContacts = cacheStore.get('recent_contacts')
        if (cachedContacts) {
            recentContacts.value = cachedContacts
            return
        }

        const response = await conversationStore.getRecentContacts({ limit: 8 })
        recentContacts.value = response.contacts

        // Cache for 10 minutes
        cacheStore.set('recent_contacts', recentContacts.value, 10 * 60 * 1000)

    } catch (error) {
        console.error('Load recent contacts error:', error)
    }
}

const addToRecentContacts = (user) => {
    // Remove if already exists
    recentContacts.value = recentContacts.value.filter(c => c.id !== user.id)

    // Add to front
    recentContacts.value.unshift(user)

    // Keep only 8 recent
    recentContacts.value = recentContacts.value.slice(0, 8)

    // Update cache
    cacheStore.set('recent_contacts', recentContacts.value, 10 * 60 * 1000)
}

const validateForm = () => {
    errors.value = {}

    if (isGroupChat.value) {
        if (!groupName.value.trim()) {
            errors.value.groupName = 'Tên nhóm không được để trống'
        } else if (groupName.value.length < 3) {
            errors.value.groupName = 'Tên nhóm phải có ít nhất 3 ký tự'
        }

        if (selectedParticipants.value.length < 2) {
            errors.value.general = 'Nhóm chat cần ít nhất 2 thành viên'
        }
    } else {
        if (selectedParticipants.value.length !== 1) {
            errors.value.general = 'Vui lòng chọn một người để bắt đầu trò chuyện'
        }
    }

    return Object.keys(errors.value).length === 0
}

const createConversation = async () => {
    if (!validateForm() || isCreating.value) return

    isCreating.value = true

    try {
        const conversationData = {
            type: conversationType.value,
            participants: selectedParticipants.value.map(p => p.id)
        }

        if (isGroupChat.value) {
            conversationData.name = groupName.value.trim()
            conversationData.description = groupDescription.value.trim()
            conversationData.settings = groupSettings.value
        }

        const conversation = await conversationStore.createConversation(conversationData)

        toast.success(
            isGroupChat.value
                ? `Đã tạo nhóm "${groupName.value}" thành công!`
                : 'Đã bắt đầu cuộc trò chuyện!'
        )

        // Clear cache to refresh conversation list
        cacheStore.remove('conversations_list')

        emit('created', conversation)
        closeModal()

        // Navigate to the new conversation
        router.push(`/chat/${conversation.id}`)

    } catch (error) {
        console.error('Create conversation error:', error)

        if (error.response?.status === 409) {
            errors.value.general = 'Cuộc trò chuyện với người này đã tồn tại'
        } else {
            errors.value.general = 'Tạo cuộc trò chuyện thất bại. Vui lòng thử lại.'
        }

        toast.error(errors.value.general)
    } finally {
        isCreating.value = false
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
    // Reset form when modal is hidden
    resetForm()
    emit('close')
}

const resetForm = () => {
    conversationType.value = props.conversationType
    groupName.value = ''
    groupDescription.value = ''
    searchQuery.value = ''
    selectedParticipants.value = [...props.initialParticipants]
    searchResults.value = []
    showSearchResults.value = false
    errors.value = {}

    groupSettings.value = {
        allowMemberInvites: true,
        requireApproval: false,
        privacy: 'private'
    }
}

// Watchers
watch(() => props.show, (show) => {
    if (show) {
        showModal()
    } else {
        closeModal()
    }
})

watch(() => props.initialParticipants, (participants) => {
    selectedParticipants.value = [...participants]
}, { deep: true })

watch(() => props.conversationType, (type) => {
    conversationType.value = type
})

watch(conversationType, (newType) => {
    // Reset participants when switching between direct and group
    if (newType === 'direct' && selectedParticipants.value.length > 1) {
        selectedParticipants.value = selectedParticipants.value.slice(0, 1)
    }

    // Clear errors
    errors.value = {}
})

// Lifecycle
onMounted(async () => {
    // Initialize Bootstrap modal
    if (modal.value) {
        modalInstance = new Modal(modal.value)
    }

    // Load initial data
    await loadRecentContacts()

    // Show modal if initially requested
    if (props.show) {
        showModal()
    }
})

onUnmounted(() => {
    if (modalInstance) {
        modalInstance.dispose()
    }
})

// Expose methods for parent component
defineExpose({
    show: showModal,
    hide: closeModal,
    addParticipant,
    removeParticipant,
    setType: (type) => { conversationType.value = type }
})
</script>

<style scoped>
.conversation-create {
    /* Modal styles handled by Bootstrap */
}

.conversation-type .form-check-group {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
}

.form-check {
    margin-bottom: 0;
}

.form-check-label {
    cursor: pointer;
    width: 100%;
}

.check-option {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid var(--bs-border-color);
    border-radius: 0.5rem;
    transition: all 0.2s ease;
    gap: 1rem;
}

.form-check-input:checked + .form-check-label .check-option {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.1);
}

.check-option i {
    font-size: 1.5rem;
}

.search-container {
    position: relative;
}

.search-results {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
    z-index: 1000;
    margin-top: 0.25rem;
}

.search-items {
    max-height: 250px;
    overflow-y: auto;
}

.search-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--bs-border-color-translucent);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.search-item:last-child {
    border-bottom: none;
}

.search-item:hover {
    background-color: var(--bs-light);
}

.user-info {
    display: flex;
    align-items: center;
    flex: 1;
}

.user-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    margin-right: 0.75rem;
}

.user-details {
    flex: 1;
}

.user-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.user-meta {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.presence-status.online {
    color: var(--bs-success);
}

.presence-status.away {
    color: var(--bs-warning);
}

.presence-status.offline {
    color: var(--bs-secondary);
}

.recent-contacts {
    border-top: 1px solid var(--bs-border-color);
    padding-top: 1rem;
}

.recent-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 0.75rem;
}

.recent-contact {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.75rem 0.5rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
}

.recent-contact:hover {
    border-color: var(--bs-primary);
    background-color: rgba(var(--bs-primary-rgb), 0.1);
}

.contact-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    object-fit: cover;
    margin-bottom: 0.5rem;
}

.contact-name {
    font-size: 0.875rem;
    text-align: center;
    font-weight: 500;
}

.selected-indicator {
    position: absolute;
    top: -5px;
    right: -5px;
    background: white;
    border-radius: 50%;
    padding: 2px;
}

.selected-participants {
    border-top: 1px solid var(--bs-border-color);
    padding-top: 1rem;
}

.participants-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.participant-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    background-color: var(--bs-primary);
    color: white;
    border-radius: 1.5rem;
    gap: 0.5rem;
}

.tag-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
}

.tag-name {
    font-weight: 500;
    font-size: 0.875rem;
}

.btn-remove {
    background: none;
    border: none;
    color: white;
    padding: 0.125rem;
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    transition: background-color 0.2s ease;
}

.btn-remove:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.group-settings {
    border-top: 1px solid var(--bs-border-color);
    padding-top: 1rem;
}

.search-loading {
    padding: 1rem;
}

.no-results {
    padding: 1rem;
}

@media (max-width: 768px) {
    .conversation-type .form-check-group {
        grid-template-columns: 1fr;
    }

    .recent-list {
        grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
    }

    .participants-grid {
        gap: 0.25rem;
    }

    .participant-tag {
        font-size: 0.8rem;
        padding: 0.25rem 0.5rem;
    }

    .tag-avatar {
        width: 20px;
        height: 20px;
    }
}
</style>