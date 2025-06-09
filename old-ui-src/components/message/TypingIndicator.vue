// src/components/message/TypingIndicator.vue
// Hiển thị indicator khi user đang gõ tin nhắn với animation và tối ưu performance

<template>
    <transition name="typing-fade" appear>
        <div v-if="visibleTypingUsers.length > 0" class="typing-indicator" :class="{ 'compact': compact }">
            <div class="typing-avatars" v-if="!compact && showAvatars">
                <UserAvatar v-for="user in visibleTypingUsers.slice(0, 3)" :key="user.id" :user="user" size="sm"
                    class="typing-avatar" />
                <div v-if="visibleTypingUsers.length > 3" class="more-users">
                    +{{ visibleTypingUsers.length - 3 }}
                </div>
            </div>

            <div class="typing-content">
                <div class="typing-text">
                    <span v-if="typingText">{{ typingText }}</span>
                    <span v-else>đang gõ tin nhắn</span>
                </div>

                <div class="typing-animation">
                    <div class="typing-dots">
                        <span class="dot" v-for="i in 3" :key="i" :style="{ animationDelay: `${i * 0.3}s` }"></span>
                    </div>
                </div>
            </div>
        </div>
    </transition>
</template>

<script setup>
import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import UserAvatar from '@/components/user/UserAvatar.vue'

// Props
const props = defineProps({
    typingUsers: {
        type: Array,
        default: () => []
    },
    conversationId: {
        type: String,
        required: true
    },
    compact: {
        type: Boolean,
        default: false
    },
    showAvatars: {
        type: Boolean,
        default: true
    },
    maxVisible: {
        type: Number,
        default: 3
    }
})

// Dependencies
const authStore = useAuthStore()

// State
const lastUpdateTime = ref(Date.now())
const typingTimeout = ref(null)

// Computed
const visibleTypingUsers = computed(() => {
    const currentUserId = authStore.user?.id
    return props.typingUsers
        .filter(user => user.id !== currentUserId && user.isTyping)
        .slice(0, props.maxVisible)
})

const typingText = computed(() => {
    const users = visibleTypingUsers.value
    if (users.length === 0) return ''

    if (users.length === 1) {
        return `${users[0].name || users[0].username} đang gõ`
    } else if (users.length === 2) {
        return `${users[0].name || users[0].username} và ${users[1].name || users[1].username} đang gõ`
    } else if (users.length === 3) {
        return `${users[0].name || users[0].username}, ${users[1].name || users[1].username} và ${users[2].name || users[2].username} đang gõ`
    } else {
        return `${users[0].name || users[0].username} và ${users.length - 1} người khác đang gõ`
    }
})

// Auto-hide typing indicator after timeout
const startTypingTimeout = () => {
    clearTimeout(typingTimeout.value)
    typingTimeout.value = setTimeout(() => {
        lastUpdateTime.value = Date.now()
    }, 5000) // 5 seconds timeout
}

// Watchers
watch(() => props.typingUsers, (newUsers) => {
    if (newUsers.length > 0) {
        lastUpdateTime.value = Date.now()
        startTypingTimeout()
    }
}, { deep: true })

// Lifecycle
onMounted(() => {
    if (visibleTypingUsers.value.length > 0) {
        startTypingTimeout()
    }
})

onUnmounted(() => {
    clearTimeout(typingTimeout.value)
})
</script>

<style lang="scss" scoped>
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--bs-light);
    border-radius: 0.75rem;
    margin: 0.5rem 0;
    font-size: 0.875rem;
    color: var(--bs-text-muted);

    &.compact {
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;

        .typing-content {
            gap: 0.5rem;
        }
    }

    .typing-avatars {
        display: flex;
        align-items: center;
        gap: 0.25rem;

        .typing-avatar {
            width: 24px;
            height: 24px;
            border: 2px solid white;
        }

        .more-users {
            background: var(--bs-secondary);
            color: white;
            border-radius: 50%;
            width: 24px;
            height: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.7rem;
            font-weight: 600;
        }
    }

    .typing-content {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex: 1;

        .typing-text {
            font-weight: 500;
        }

        .typing-animation {
            .typing-dots {
                display: flex;
                gap: 0.25rem;

                .dot {
                    width: 4px;
                    height: 4px;
                    background: var(--bs-primary);
                    border-radius: 50%;
                    animation: typing-bounce 1.5s infinite;

                    &:nth-child(2) {
                        animation-delay: 0.3s;
                    }

                    &:nth-child(3) {
                        animation-delay: 0.6s;
                    }
                }
            }
        }
    }
}

// Animations
.typing-fade-enter-active,
.typing-fade-leave-active {
    transition: all 0.3s ease;
}

.typing-fade-enter-from {
    opacity: 0;
    transform: translateY(10px);
}

.typing-fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

@keyframes typing-bounce {

    0%,
    60%,
    100% {
        transform: translateY(0);
        opacity: 0.7;
    }

    30% {
        transform: translateY(-8px);
        opacity: 1;
    }
}

// Responsive
@media (max-width: 768px) {
    .typing-indicator {
        padding: 0.5rem 0.75rem;
        font-size: 0.8rem;

        .typing-avatars {
            .typing-avatar {
                width: 20px;
                height: 20px;
            }

            .more-users {
                width: 20px;
                height: 20px;
                font-size: 0.65rem;
            }
        }
    }
}

// Dark theme support
@media (prefers-color-scheme: dark) {
    .typing-indicator {
        background: var(--bs-dark);
        color: var(--bs-light-text-emphasis);
    }
}
</style>