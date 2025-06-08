<template>
    <div class="modal fade show d-block" tabindex="-1" role="dialog">
        <div class="modal-backdrop fade show"></div>
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Tạo cuộc trò chuyện mới</h5>
                    <button type="button" class="btn-close" @click="close"></button>
                </div>

                <div class="modal-body">
                    <div class="conversation-type-selector">
                        <div class="form-check">
                            <input id="direct-chat" v-model="conversationType" class="form-check-input" type="radio"
                                value="direct">
                            <label class="form-check-label" for="direct-chat">
                                <i class="fas fa-user me-2"></i>
                                Trò chuyện riêng
                            </label>
                        </div>
                        <div class="form-check">
                            <input id="group-chat" v-model="conversationType" class="form-check-input" type="radio"
                                value="group">
                            <label class="form-check-label" for="group-chat">
                                <i class="fas fa-users me-2"></i>
                                Nhóm chat
                            </label>
                        </div>
                    </div>

                    <div v-if="conversationType === 'group'" class="group-settings">
                        <div class="mb-3">
                            <label class="form-label">Tên nhóm</label>
                            <input v-model="groupName" type="text" class="form-control" placeholder="Nhập tên nhóm...">
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Mô tả (tùy chọn)</label>
                            <textarea v-model="groupDescription" class="form-control" rows="3"
                                placeholder="Mô tả về nhóm..."></textarea>
                        </div>
                    </div>

                    <div class="participant-selection">
                        <label class="form-label">
                            {{ conversationType === 'group' ? 'Thêm thành viên' : 'Chọn người nhận' }}
                        </label>

                        <div class="search-users">
                            <SearchInput placeholder="Tìm kiếm người dùng..." :suggestions="userSuggestions"
                                :is-loading="isSearching" @search="searchUsers" @select="addParticipant" />
                        </div>

                        <div v-if="selectedParticipants.length > 0" class="selected-participants">
                            <h6>Đã chọn ({{ selectedParticipants.length }})</h6>
                            <div class="participants-list">
                                <div v-for="participant in selectedParticipants" :key="participant.id"
                                    class="participant-item">
                                    <UserAvatar :src="participant.avatar" :name="participant.name" size="sm" />
                                    <span class="participant-name">{{ participant.name }}</span>
                                    <button class="btn btn-sm btn-outline-danger"
                                        @click="removeParticipant(participant.id)">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" @click="close">
                        Hủy
                    </button>
                    <button type="button" class="btn btn-primary" @click="createConversation"
                        :disabled="!canCreate || isCreating">
                        <span v-if="isCreating" class="spinner-border spinner-border-sm me-1"></span>
                        Tạo cuộc trò chuyện
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useUserStore } from '@/stores/user'
import { useConversationStore } from '@/stores/conversation'
import { useToast } from 'vue-toastification'
import SearchInput from '@/components/common/SearchInput.vue'
import UserAvatar from '@/components/user/UserAvatar.vue'

const emit = defineEmits(['close', 'created'])

const userStore = useUserStore()
const conversationStore = useConversationStore()
const toast = useToast()

// State
const conversationType = ref('direct')
const groupName = ref('')
const groupDescription = ref('')
const selectedParticipants = ref([])
const userSuggestions = ref([])
const isSearching = ref(false)
const isCreating = ref(false)

// Computed
const canCreate = computed(() => {
    if (conversationType.value === 'direct') {
        return selectedParticipants.value.length === 1
    } else {
        return selectedParticipants.value.length >= 2 && groupName.value.trim()
    }
})

// Actions
const searchUsers = async (query) => {
    if (!query.trim()) {
        userSuggestions.value = []
        return
    }

    isSearching.value = true

    try {
        const results = await userStore.searchUsers(query)

        // Filter out already selected participants
        userSuggestions.value = results
            .filter(user => !selectedParticipants.value.some(p => p.id === user.id))
            .map(user => ({
                id: user.id,
                title: user.name,
                subtitle: `@${user.username}`,
                avatar: user.avatar,
                type: 'user'
            }))

    } catch (error) {
        console.error('Search users error:', error)
        userSuggestions.value = []
    } finally {
        isSearching.value = false
    }
}

const addParticipant = (suggestion) => {
    const user = {
        id: suggestion.id,
        name: suggestion.title,
        username: suggestion.subtitle.replace('@', ''),
        avatar: suggestion.avatar
    }

    // For direct chat, replace the participant
    if (conversationType.value === 'direct') {
        selectedParticipants.value = [user]
    } else {
        // For group chat, add if not already selected
        if (!selectedParticipants.value.some(p => p.id === user.id)) {
            selectedParticipants.value.push(user)
        }
    }

    // Clear suggestions
    userSuggestions.value = []
}

const removeParticipant = (userId) => {
    selectedParticipants.value = selectedParticipants.value.filter(p => p.id !== userId)
}

const createConversation = async () => {
    if (!canCreate.value || isCreating.value) return

    isCreating.value = true

    try {
        const conversationData = {
            participantIds: selectedParticipants.value.map(p => p.id),
            isGroupChat: conversationType.value === 'group'
        }

        if (conversationType.value === 'group') {
            conversationData.title = groupName.value.trim()
            if (groupDescription.value.trim()) {
                conversationData.description = groupDescription.value.trim()
            }
        }

        const conversation = await conversationStore.createConversation(conversationData)

        toast.success('Tạo cuộc trò chuyện thành công!')
        emit('created', conversation)

    } catch (error) {
        toast.error('Không thể tạo cuộc trò chuyện!')
        console.error('Create conversation error:', error)
    } finally {
        isCreating.value = false
    }
}

const close = () => {
    emit('close')
}

// Watchers
watch(conversationType, () => {
    selectedParticipants.value = []
    groupName.value = ''
    groupDescription.value = ''
})
</script>

<style lang="scss" scoped>
.modal {
    background-color: rgba(0, 0, 0, 0.5);
}

.conversation-type-selector {
    display: flex;
    gap: 2rem;
    margin-bottom: 1.5rem;

    .form-check {
        .form-check-label {
            display: flex;
            align-items: center;
            cursor: pointer;
            font-weight: 500;
        }
    }
}

.group-settings {
    margin-bottom: 1.5rem;
    padding: 1rem;
    background: var(--bs-light);
    border-radius: 0.5rem;
}

.participant-selection {
    .search-users {
        margin-bottom: 1rem;
    }

    .selected-participants {
        h6 {
            font-weight: 600;
            margin-bottom: 0.75rem;
        }

        .participants-list {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-height: 200px;
            overflow-y: auto;

            .participant-item {
                display: flex;
                align-items: center;
                gap: 0.75rem;
                padding: 0.75rem;
                background: white;
                border-radius: 0.5rem;
                border: 1px solid var(--bs-border-color);

                .participant-name {
                    flex: 1;
                    font-weight: 500;
                }
            }
        }
    }
}

// Custom scrollbar
.participants-list::-webkit-scrollbar {
    width: 6px;
}

.participants-list::-webkit-scrollbar-track {
    background: transparent;
}

.participants-list::-webkit-scrollbar-thumb {
    background: var(--bs-border-color);
    border-radius: 3px;

    &:hover {
        background: var(--bs-secondary);
    }
}
</style>
