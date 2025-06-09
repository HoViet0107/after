<template>
    <div :class="['conversation-item', { active: isActive, unread: hasUnreadMessages }]" @click="handleClick">
        <div class="conversation-avatar">
            <UserAvatar v-if="!conversation.isGroupChat" :src="otherParticipant?.avatar" :name="otherParticipant?.name"
                :show-online-status="true" :is-online="otherParticipant?.isOnline" size="medium" />

            <div v-else class="group-avatar">
                <div class="group-avatars">
                    <UserAvatar v-for="(participant, index) in conversation.participants.slice(0, 2)"
                        :key="participant.id" :src="participant.avatar" :name="participant.name" size="sm"
                        :style="{ transform: `translateX(${index * -8}px)`, zIndex: 2 - index }" />
                </div>
                <div v-if="conversation.participants.length > 2" class="participant-count">
                    +{{ conversation.participants.length - 2 }}
                </div>
            </div>
        </div>

        <div class="conversation-content">
            <div class="conversation-header">
                <h6 class="conversation-title">{{ conversationTitle }}</h6>
                <div class="conversation-meta">
                    <time class="last-message-time">{{ formatLastMessageTime }}</time>
                    <div v-if="conversation.isMuted" class="mute-indicator" title="Đã tắt thông báo">
                        <i class="fas fa-volume-mute"></i>
                    </div>
                </div>
            </div>

            <div class="conversation-preview">
                <div class="last-message">
                    <span v-if="lastMessageSender" class="sender-name">
                        {{ lastMessageSender }}:
                    </span>
                    <span class="message-content">{{ lastMessagePreview }}</span>
                </div>

                <div class="conversation-indicators">
                    <div v-if="hasUnreadMessages" class="unread-badge">
                        {{ conversation.unreadCount > 99 ? '99+' : conversation.unreadCount }}
                    </div>

                    <div v-if="isTyping" class="typing-indicator">
                        <div class="typing-dots">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="conversation-actions">
            <div class="dropdown">
                <button class="btn btn-sm btn-ghost" data-bs-toggle="dropdown" aria-expanded="false" @click.stop>
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                        <a class="dropdown-item" href="#" @click.stop="markAsRead">
                            <i class="fas fa-check me-2"></i>Đánh dấu đã đọc
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.stop="toggleMute">
                            <i :class="conversation.isMuted ? 'fas fa-volume-up' : 'fas fa-volume-mute'"
                                class="me-2"></i>
                            {{ conversation.isMuted ? 'Bật thông báo' : 'Tắt thông báo' }}
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item" href="#" @click.stop="archiveConversation">
                            <i class="fas fa-archive me-2"></i>Lưu trữ
                        </a>
                    </li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li>
                        <a class="dropdown-item text-danger" href="#" @click.stop="deleteConversation">
                            <i class="fas fa-trash me-2"></i>Xóa
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/user/UserAvatar.vue'

const props = defineProps({
    conversation: {
        type: Object,
        required: true
    },
    isActive: {
        type: Boolean,
        default: false
    },
    typingUsers: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['click', 'archive', 'mute', 'delete', 'mark-read'])

const authStore = useAuthStore()

// Computed
const otherParticipant = computed(() => {
    if (props.conversation.isGroupChat) return null

    return props.conversation.participants?.find(
        p => p.id !== authStore.userId
    )
})

const conversationTitle = computed(() => {
    if (props.conversation.title) {
        return props.conversation.title
    }

    if (props.conversation.isGroupChat) {
        const names = props.conversation.participants
            ?.filter(p => p.id !== authStore.userId)
            ?.map(p => p.name)
            ?.join(', ')
        return names || 'Nhóm chat'
    }

    return otherParticipant.value?.name || 'Người dùng'
})

const lastMessageSender = computed(() => {
    const lastMessage = props.conversation.lastMessage
    if (!lastMessage) return ''

    if (lastMessage.sender.id === authStore.userId) {
        return 'Bạn'
    }

    if (props.conversation.isGroupChat) {
        return lastMessage.sender.name
    }

    return ''
})

const lastMessagePreview = computed(() => {
    const lastMessage = props.conversation.lastMessage
    if (!lastMessage) return 'Chưa có tin nhắn'

    if (lastMessage.attachments?.length > 0) {
        const attachment = lastMessage.attachments[0]
        if (attachment.type?.startsWith('image/')) {
            return '📷 Hình ảnh'
        } else if (attachment.type?.startsWith('video/')) {
            return '🎥 Video'
        } else if (attachment.type?.startsWith('audio/')) {
            return '🎵 Âm thanh'
        } else {
            return '📎 File đính kèm'
        }
    }

    return lastMessage.content || 'Tin nhắn'
})

const formatLastMessageTime = computed(() => {
    if (!props.conversation.lastMessageAt) return ''

    const messageDate = new Date(props.conversation.lastMessageAt)
    const now = new Date()
    const diffInSeconds = Math.floor((now - messageDate) / 1000)

    if (diffInSeconds < 60) {
        return 'Vừa xong'
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} phút`
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} giờ`
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days} ngày`
    } else {
        return new Intl.DateTimeFormat('vi-VN', {
            day: 'numeric',
            month: 'short'
        }).format(messageDate)
    }
})

const hasUnreadMessages = computed(() => {
    return props.conversation.unreadCount > 0
})

const isTyping = computed(() => {
    return props.typingUsers.length > 0
})

// Actions
const handleClick = () => {
    emit('click', props.conversation)
}

const markAsRead = () => {
    emit('mark-read', props.conversation)
}

const toggleMute = () => {
    emit('mute', props.conversation)
}

const archiveConversation = () => {
    emit('archive', props.conversation)
}

const deleteConversation = () => {
    emit('delete', props.conversation)
}
</script>

<style lang="scss" scoped>
.conversation-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    cursor: pointer;
    border-bottom: 1px solid var(--bs-border-color);
    transition: all 0.2s ease;
    position: relative;

    &:hover {
        background-color: var(--bs-light);
    }

    &.active {
        background-color: rgba(var(--bs-primary-rgb), 0.1);
        border-right: 3px solid var(--bs-primary);
    }

    &.unread {
        background-color: rgba(var(--bs-info-rgb), 0.05);

        .conversation-title {
            font-weight: 700;
        }
    }

    .conversation-avatar {
        flex-shrink: 0;

        .group-avatar {
            position: relative;
            width: 40px;
            height: 40px;

            .group-avatars {
                position: relative;
                width: 100%;
                height: 100%;
            }

            .participant-count {
                position: absolute;
                bottom: -2px;
                right: -2px;
                background: var(--bs-primary);
                color: white;
                font-size: 0.625rem;
                font-weight: 600;
                padding: 0.125rem 0.25rem;
                border-radius: 0.75rem;
                min-width: 16px;
                text-align: center;
                border: 2px solid white;
            }
        }
    }

    .conversation-content {
        flex: 1;
        min-width: 0;

        .conversation-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 0.25rem;

            .conversation-title {
                margin: 0;
                font-weight: 600;
                font-size: 0.95rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .conversation-meta {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                .last-message-time {
                    font-size: 0.75rem;
                    color: var(--bs-secondary);
                    white-space: nowrap;
                }

                .mute-indicator {
                    color: var(--bs-secondary);
                    font-size: 0.75rem;
                }
            }
        }

        .conversation-preview {
            display: flex;
            align-items: center;
            justify-content: space-between;

            .last-message {
                flex: 1;
                min-width: 0;
                font-size: 0.875rem;

                .sender-name {
                    color: var(--bs-secondary);
                    font-weight: 500;
                }

                .message-content {
                    color: var(--bs-body-color);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
            }

            .conversation-indicators {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                .unread-badge {
                    background: var(--bs-primary);
                    color: white;
                    font-size: 0.75rem;
                    font-weight: 600;
                    padding: 0.25rem 0.5rem;
                    border-radius: 1rem;
                    min-width: 20px;
                    text-align: center;
                }

                .typing-indicator {
                    .typing-dots {
                        display: flex;
                        gap: 0.125rem;

                        span {
                            width: 4px;
                            height: 4px;
                            background: var(--bs-primary);
                            border-radius: 50%;
                            animation: typing 1.4s infinite;

                            &:nth-child(1) {
                                animation-delay: 0s;
                            }

                            &:nth-child(2) {
                                animation-delay: 0.2s;
                            }

                            &:nth-child(3) {
                                animation-delay: 0.4s;
                            }
                        }
                    }
                }
            }
        }
    }

    .conversation-actions {
        .btn-ghost {
            background: none;
            border: none;
            color: var(--bs-secondary);
            opacity: 0;
            transition: opacity 0.2s ease;

            &:hover {
                background: rgba(var(--bs-secondary-rgb), 0.1);
                color: var(--bs-body-color);
            }
        }
    }

    &:hover .btn-ghost {
        opacity: 1;
    }
}

@keyframes typing {

    0%,
    60%,
    100% {
        transform: translateY(0);
    }

    30% {
        transform: translateY(-8px);
    }
}
</style>
