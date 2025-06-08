<template>
    <div v-if="users.length > 0" class="typing-indicator">
        <div class="typing-avatars">
            <UserAvatar v-for="user in visibleUsers" :key="user.id" :src="user.avatar" :name="user.name" size="xs" />
        </div>

        <div class="typing-content">
            <span class="typing-text">{{ typingText }}</span>
            <div class="typing-animation">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import UserAvatar from '@/components/user/UserAvatar.vue'

const props = defineProps({
    users: {
        type: Array,
        default: () => []
    }
})

// Computed
const visibleUsers = computed(() => {
    return props.users.slice(0, 3) // Show max 3 avatars
})

const typingText = computed(() => {
    const count = props.users.length

    if (count === 0) return ''

    if (count === 1) {
        return `${props.users[0].name} đang nhập`
    } else if (count === 2) {
        return `${props.users[0].name} và ${props.users[1].name} đang nhập`
    } else if (count === 3) {
        return `${props.users[0].name}, ${props.users[1].name} và ${props.users[2].name} đang nhập`
    } else {
        return `${props.users[0].name}, ${props.users[1].name} và ${count - 2} người khác đang nhập`
    }
})
</script>

<style lang="scss" scoped>
.typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    margin-bottom: 1rem;

    .typing-avatars {
        display: flex;
        gap: 0.25rem;
    }

    .typing-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: var(--bs-light);
        padding: 0.5rem 0.75rem;
        border-radius: 1rem;

        .typing-text {
            font-size: 0.875rem;
            color: var(--bs-secondary);
            font-style: italic;
        }

        .typing-animation {
            display: flex;
            gap: 0.125rem;

            span {
                width: 4px;
                height: 4px;
                background: var(--bs-secondary);
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

@keyframes typing {

    0%,
    60%,
    100% {
        transform: translateY(0);
    }

    30% {
        transform: translateY(-4px);
    }
}
</style>
