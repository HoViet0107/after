<template>
    <div :class="['message-item', messageAlignment, { 'message-group': !showAvatar }]">
        <div v-if="!isOwnMessage && showAvatar" class="message-avatar">
            <UserAvatar :src="message.sender.avatar" :name="message.sender.name" size="sm" clickable
                @click="viewProfile" />
        </div>

        <div class="message-content">
            <div v-if="message.replyTo" class="reply-reference" @click="scrollToMessage(message.replyTo.id)">
                <div class="reply-bar"></div>
                <div class="reply-content">
                    <span class="reply-author">{{ message.replyTo.sender.name }}</span>
                    <span class="reply-text">{{ truncateText(message.replyTo.content, 50) }}</span>
                </div>
            </div>

            <MessageBubble :message="message" :is-own="isOwnMessage" @react="handleReact" @edit="handleEdit"
                @delete="handleDelete" @reply="handleReply" @forward="handleForward" />

            <div v-if="showTime" class="message-meta">
                <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                <MessageStatus v-if="isOwnMessage" :status="message.status" :read-by="message.readBy" />
            </div>
        </div>

        <div v-if="isOwnMessage && showAvatar" class="message-avatar">
            <UserAvatar :src="message.sender.avatar" :name="message.sender.name" size="sm" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/user/UserAvatar.vue'
import MessageBubble from './MessageBubble.vue'
import MessageStatus from './MessageStatus.vue'

const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    showAvatar: {
        type: Boolean,
        default: true
    },
    showTime: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['reply', 'edit', 'delete', 'react', 'forward'])

const router = useRouter()
const authStore = useAuthStore()

// Computed
const isOwnMessage = computed(() => {
    return authStore.userId === props.message.sender.id
})

const messageAlignment = computed(() => {
    return isOwnMessage.value ? 'message-own' : 'message-other'
})

// Actions
const viewProfile = () => {
    router.push(`/app/profile/${props.message.sender.id}`)
}

const scrollToMessage = (messageId) => {
    const element = document.getElementById(`message-${messageId}`)
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        element.classList.add('highlight')
        setTimeout(() => {
            element.classList.remove('highlight')
        }, 2000)
    }
}

const handleReact = (reaction) => {
    emit('react', props.message, reaction)
}

const handleEdit = () => {
    emit('edit', props.message)
}

const handleDelete = () => {
    emit('delete', props.message)
}

const handleReply = () => {
    emit('reply', props.message)
}

const handleForward = () => {
    emit('forward', props.message)
}

// Utilities
const formatTime = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date))
}

const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}
</script>

<style lang="scss" scoped>
.message-item {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    margin-bottom: 1rem;

    &.message-group {
        margin-bottom: 0.25rem;
    }

    &.message-own {
        flex-direction: row-reverse;

        .message-content {
            align-items: flex-end;
        }

        .message-meta {
            text-align: right;
        }
    }

    &.message-other {
        flex-direction: row;

        .message-content {
            align-items: flex-start;
        }

        .message-meta {
            text-align: left;
        }
    }

    .message-avatar {
        flex-shrink: 0;
    }

    .message-content {
        flex: 1;
        max-width: 70%;
        display: flex;
        flex-direction: column;
        gap: 0.25rem;

        .reply-reference {
            background: rgba(var(--bs-secondary-rgb), 0.1);
            border-radius: 0.5rem;
            padding: 0.5rem;
            margin-bottom: 0.25rem;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: background-color 0.2s ease;

            &:hover {
                background: rgba(var(--bs-secondary-rgb), 0.2);
            }

            .reply-bar {
                width: 4px;
                height: 100%;
                background: var(--bs-primary);
                border-radius: 2px;
            }

            .reply-content {
                flex: 1;
                min-width: 0;

                .reply-author {
                    display: block;
                    font-weight: 600;
                    font-size: 0.75rem;
                    color: var(--bs-primary);
                    margin-bottom: 0.125rem;
                }

                .reply-text {
                    display: block;
                    font-size: 0.875rem;
                    color: var(--bs-secondary);
                    word-break: break-word;
                }
            }
        }

        .message-meta {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-top: 0.25rem;

            .message-time {
                font-size: 0.75rem;
                color: var(--bs-secondary);
            }
        }
    }
}

// Highlight animation for referenced messages
:global(.highlight) {
    animation: highlight 2s ease-out;
}

@keyframes highlight {
    0% {
        background-color: rgba(var(--bs-warning-rgb), 0.3);
    }

    100% {
        background-color: transparent;
    }
}

// Mobile responsiveness
@media (max-width: 768px) {
    .message-item .message-content {
        max-width: 85%;
    }
}
</style>