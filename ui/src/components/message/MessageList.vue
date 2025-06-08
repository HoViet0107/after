<template>
    <div class="message-list" ref="messageContainer">
        <div v-if="isLoading && messages.length === 0" class="loading-container">
            <LoadingSpinner size="medium" show-text text="Đang tải tin nhắn..." />
        </div>

        <div v-else-if="messages.length === 0" class="empty-state">
            <div class="empty-icon">
                <i class="far fa-comment"></i>
            </div>
            <h6>Chưa có tin nhắn nào</h6>
            <p class="text-muted">Hãy bắt đầu cuộc trò chuyện!</p>
        </div>

        <div v-else class="messages-container">
            <div v-for="(message, index) in messages" :key="message.id" :class="['message-wrapper', {
                'same-sender': index > 0 && messages[index - 1].sender.id === message.sender.id,
                'different-day': index > 0 && !isSameDay(messages[index - 1].createdAt, message.createdAt)
            }]">
                <!-- Date separator -->
                <div v-if="index === 0 || !isSameDay(messages[index - 1].createdAt, message.createdAt)"
                    class="date-separator">
                    <span>{{ formatDateSeparator(message.createdAt) }}</span>
                </div>

                <MessageItem :message="message" :show-avatar="!isSameSender(index)"
                    :show-time="!isSameSender(index) || isTimeDifferent(index)" @reply="handleReply" @edit="handleEdit"
                    @delete="handleDelete" @react="handleReact" @forward="handleForward" />
            </div>

            <!-- Typing indicator -->
            <TypingIndicator v-if="typingUsers.length > 0" :users="typingUsers" />

            <!-- New message indicator -->
            <div v-if="hasNewMessages" class="new-message-indicator" @click="scrollToBottom">
                <i class="fas fa-arrow-down me-1"></i>
                {{ newMessagesCount }} tin nhắn mới
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import MessageItem from './MessageItem.vue'
import TypingIndicator from './TypingIndicator.vue'

const props = defineProps({
    messages: {
        type: Array,
        default: () => []
    },
    typingUsers: {
        type: Array,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['reply', 'edit', 'delete', 'react', 'forward', 'load-more'])

const authStore = useAuthStore()

// Refs
const messageContainer = ref(null)

// State
const hasNewMessages = ref(false)
const newMessagesCount = ref(0)
const lastSeenMessageId = ref(null)

// Computed
const currentUserId = computed(() => authStore.userId)

// Actions
const scrollToBottom = (smooth = true) => {
    nextTick(() => {
        const container = messageContainer.value
        if (container) {
            container.scrollTo({
                top: container.scrollHeight,
                behavior: smooth ? 'smooth' : 'auto'
            })
        }
    })
}

const scrollToTop = () => {
    nextTick(() => {
        const container = messageContainer.value
        if (container) {
            container.scrollTo({
                top: 0,
                behavior: 'smooth'
            })
        }
    })
}

const handleScroll = () => {
    const container = messageContainer.value
    if (!container) return

    // Check if scrolled to top for loading more
    if (container.scrollTop === 0) {
        emit('load-more')
    }

    // Check if scrolled to bottom to clear new message indicator
    const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50
    if (isAtBottom) {
        hasNewMessages.value = false
        newMessagesCount.value = 0
    }
}

const isSameDay = (date1, date2) => {
    const d1 = new Date(date1)
    const d2 = new Date(date2)
    return d1.toDateString() === d2.toDateString()
}

const isSameSender = (index) => {
    if (index === 0) return false
    return props.messages[index - 1].sender.id === props.messages[index].sender.id
}

const isTimeDifferent = (index) => {
    if (index === 0) return true
    const current = new Date(props.messages[index].createdAt)
    const previous = new Date(props.messages[index - 1].createdAt)
    return (current - previous) > 5 * 60 * 1000 // 5 minutes
}

const formatDateSeparator = (date) => {
    const messageDate = new Date(date)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (messageDate.toDateString() === today.toDateString()) {
        return 'Hôm nay'
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
        return 'Hôm qua'
    } else {
        return new Intl.DateTimeFormat('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }).format(messageDate)
    }
}

// Event handlers
const handleReply = (message) => {
    emit('reply', message)
}

const handleEdit = (message) => {
    emit('edit', message)
}

const handleDelete = (message) => {
    emit('delete', message)
}

const handleReact = (message, reaction) => {
    emit('react', message, reaction)
}

const handleForward = (message) => {
    emit('forward', message)
}

// Watchers
watch(() => props.messages.length, (newLength, oldLength) => {
    if (newLength > oldLength) {
        const container = messageContainer.value
        if (container) {
            const isAtBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 50

            if (isAtBottom) {
                scrollToBottom()
            } else {
                hasNewMessages.value = true
                newMessagesCount.value = newLength - oldLength
            }
        }
    }
})

// Lifecycle
onMounted(() => {
    const container = messageContainer.value
    if (container) {
        container.addEventListener('scroll', handleScroll)
    }

    // Scroll to bottom initially
    scrollToBottom(false)
})

onUnmounted(() => {
    const container = messageContainer.value
    if (container) {
        container.removeEventListener('scroll', handleScroll)
    }
})

// Expose methods
defineExpose({
    scrollToBottom,
    scrollToTop
})
</script>

<style lang="scss" scoped>
.message-list {
    height: 100%;
    overflow-y: auto;
    padding: 1rem;
    position: relative;

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

        .empty-icon {
            font-size: 3rem;
            color: var(--bs-secondary);
            margin-bottom: 1rem;
        }

        h6 {
            margin-bottom: 0.5rem;
        }
    }

    .messages-container {
        .message-wrapper {
            margin-bottom: 1rem;

            &.same-sender {
                margin-bottom: 0.25rem;
            }

            &.different-day {
                margin-top: 2rem;
            }
        }

        .date-separator {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 2rem 0 1rem 0;

            span {
                background: var(--bs-light);
                color: var(--bs-secondary);
                padding: 0.5rem 1rem;
                border-radius: 1rem;
                font-size: 0.875rem;
                font-weight: 500;
            }
        }

        .new-message-indicator {
            position: fixed;
            bottom: 120px;
            right: 2rem;
            background: var(--bs-primary);
            color: white;
            padding: 0.75rem 1rem;
            border-radius: 2rem;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 10;
            animation: bounce 2s infinite;

            &:hover {
                background: var(--bs-primary);
                transform: translateY(-2px);
            }
        }
    }
}

@keyframes bounce {

    0%,
    20%,
    50%,
    80%,
    100% {
        transform: translateY(0);
    }

    40% {
        transform: translateY(-5px);
    }

    60% {
        transform: translateY(-3px);
    }
}

// Custom scrollbar
.message-list::-webkit-scrollbar {
    width: 6px;
}

.message-list::-webkit-scrollbar-track {
    background: transparent;
}

.message-list::-webkit-scrollbar-thumb {
    background: var(--bs-border-color);
    border-radius: 3px;

    &:hover {
        background: var(--bs-secondary);
    }
}
</style>