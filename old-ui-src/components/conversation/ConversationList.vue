<template>
    <div class="conversation-list">
        <div class="conversations-header">
            <h5>Tin nhắn</h5>
            <button class="btn btn-primary btn-sm" @click="showNewConversationModal = true">
                <i class="fas fa-plus me-1"></i>
                Mới
            </button>
        </div>

        <div class="search-section">
            <SearchInput placeholder="Tìm kiếm cuộc trò chuyện..." @search="handleSearch" @clear="handleSearchClear" />
        </div>

        <div v-if="isLoading && conversations.length === 0" class="loading-container">
            <LoadingSpinner size="medium" show-text text="Đang tải cuộc trò chuyện..." />
        </div>

        <div v-else-if="filteredConversations.length === 0" class="empty-state">
            <div class="empty-icon">
                <i class="far fa-comment"></i>
            </div>
            <h6>{{ searchQuery ? 'Không tìm thấy cuộc trò chuyện' : 'Chưa có cuộc trò chuyện nào' }}</h6>
            <p class="text-muted">
                {{ searchQuery ? 'Thử tìm kiếm với từ khóa khác' : 'Bắt đầu trò chuyện với bạn bè của bạn' }}
            </p>
        </div>

        <div v-else class="conversations-container">
            <ConversationItem v-for="conversation in filteredConversations" :key="conversation.id"
                :conversation="conversation" :is-active="activeConversationId === conversation.id"
                @click="selectConversation" @archive="handleArchive" @mute="handleMute" @delete="handleDelete" />

            <div v-if="hasMore" class="load-more">
                <button class="btn btn-outline-primary btn-sm" @click="loadMore" :disabled="isLoadingMore">
                    <span v-if="isLoadingMore" class="spinner-border spinner-border-sm me-1"></span>
                    {{ isLoadingMore ? 'Đang tải...' : 'Tải thêm' }}
                </button>
            </div>
        </div>

        <!-- New Conversation Modal -->
        <NewConversationModal v-if="showNewConversationModal" @close="showNewConversationModal = false"
            @created="handleConversationCreated" />
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useConversationStore } from '@/stores/conversation'
import { useDebounce } from '@/composables/useDebounce'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import SearchInput from '@/components/common/SearchInput.vue'
import ConversationItem from './ConversationItem.vue'
import NewConversationModal from './NewConversationModal.vue'

const props = defineProps({
    activeConversationId: {
        type: String,
        default: null
    }
})

const emit = defineEmits(['conversation-selected', 'conversation-created'])

const conversationStore = useConversationStore()

// State
const searchQuery = ref('')
const isLoading = ref(false)
const isLoadingMore = ref(false)
const hasMore = ref(true)
const showNewConversationModal = ref(false)

// Debounced search
const debouncedSearch = useDebounce(searchQuery, 300)

// Computed
const conversations = computed(() => conversationStore.conversationsList)

const filteredConversations = computed(() => {
    if (!searchQuery.value) {
        return conversations.value
    }

    const query = searchQuery.value.toLowerCase()
    return conversations.value.filter(conversation => {
        // Search in conversation title
        if (conversation.title?.toLowerCase().includes(query)) {
            return true
        }

        // Search in participant names
        if (conversation.participants?.some(p =>
            p.name?.toLowerCase().includes(query) ||
            p.username?.toLowerCase().includes(query)
        )) {
            return true
        }

        // Search in last message
        if (conversation.lastMessage?.content?.toLowerCase().includes(query)) {
            return true
        }

        return false
    })
})

// Actions
const loadConversations = async (reset = false) => {
    if (reset) {
        isLoading.value = true
    } else {
        isLoadingMore.value = true
    }

    try {
        await conversationStore.fetchConversations({
            search: searchQuery.value
        })
    } catch (error) {
        console.error('Failed to load conversations:', error)
    } finally {
        isLoading.value = false
        isLoadingMore.value = false
    }
}

const loadMore = () => {
    if (!isLoadingMore.value && hasMore.value) {
        loadConversations(false)
    }
}

const handleSearch = (query) => {
    searchQuery.value = query
}

const handleSearchClear = () => {
    searchQuery.value = ''
}

const selectConversation = (conversation) => {
    emit('conversation-selected', conversation)
}

const handleConversationCreated = (conversation) => {
    showNewConversationModal.value = false
    emit('conversation-created', conversation)
}

const handleArchive = async (conversation) => {
    try {
        // API call to archive conversation
        console.log('Archive conversation:', conversation)
    } catch (error) {
        console.error('Failed to archive conversation:', error)
    }
}

const handleMute = async (conversation) => {
    try {
        // API call to mute/unmute conversation
        console.log('Toggle mute conversation:', conversation)
    } catch (error) {
        console.error('Failed to toggle mute:', error)
    }
}

const handleDelete = async (conversation) => {
    if (confirm('Bạn có chắc chắn muốn xóa cuộc trò chuyện này?')) {
        try {
            // API call to delete conversation
            console.log('Delete conversation:', conversation)
        } catch (error) {
            console.error('Failed to delete conversation:', error)
        }
    }
}

// Watchers
watch(debouncedSearch, () => {
    loadConversations(true)
})

// Lifecycle
onMounted(() => {
    loadConversations(true)
})
</script>

<style lang="scss" scoped>
.conversation-list {
    height: 100%;
    display: flex;
    flex-direction: column;

    .conversations-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);

        h5 {
            margin: 0;
            font-weight: 600;
        }
    }

    .search-section {
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);
    }

    .loading-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
    }

    .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 300px;
        text-align: center;
        padding: 2rem;

        .empty-icon {
            font-size: 3rem;
            color: var(--bs-secondary);
            margin-bottom: 1rem;
        }

        h6 {
            margin-bottom: 0.5rem;
        }
    }

    .conversations-container {
        flex: 1;
        overflow-y: auto;

        .load-more {
            display: flex;
            justify-content: center;
            padding: 1rem;
        }
    }
}

// Custom scrollbar
.conversations-container::-webkit-scrollbar {
    width: 6px;
}

.conversations-container::-webkit-scrollbar-track {
    background: transparent;
}

.conversations-container::-webkit-scrollbar-thumb {
    background: var(--bs-border-color);
    border-radius: 3px;

    &:hover {
        background: var(--bs-secondary);
    }
}
</style>