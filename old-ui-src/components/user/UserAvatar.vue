<template>
    <div :class="['user-avatar', sizeClass, { online: showOnlineStatus && isOnline }]">
        <img v-if="src" :src="src" :alt="alt" :class="['avatar-img', { clickable }]" @click="handleClick"
            @error="handleImageError">
        <div v-else :class="['avatar-placeholder', { clickable }]" @click="handleClick">
            {{ initials }}
        </div>

        <div v-if="showOnlineStatus" class="online-indicator"></div>

        <div v-if="badge" class="avatar-badge">
            {{ badge }}
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
    src: {
        type: String,
        default: ''
    },
    alt: {
        type: String,
        default: 'User Avatar'
    },
    name: {
        type: String,
        default: ''
    },
    size: {
        type: String,
        default: 'medium',
        validator: (value) => ['xs', 'sm', 'medium', 'lg', 'xl', '2xl'].includes(value)
    },
    showOnlineStatus: {
        type: Boolean,
        default: false
    },
    isOnline: {
        type: Boolean,
        default: false
    },
    clickable: {
        type: Boolean,
        default: false
    },
    badge: {
        type: [String, Number],
        default: null
    }
})

const emit = defineEmits(['click', 'error'])

// State
const imageError = ref(false)

// Computed
const sizeClass = computed(() => `avatar-${props.size}`)

const initials = computed(() => {
    if (!props.name) return '?'

    const names = props.name.split(' ')
    if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase()
    }
    return props.name.slice(0, 2).toUpperCase()
})

// Actions
const handleClick = () => {
    if (props.clickable) {
        emit('click')
    }
}

const handleImageError = () => {
    imageError.value = true
    emit('error')
}
</script>

<style lang="scss" scoped>
.user-avatar {
    position: relative;
    display: inline-block;

    &.avatar-xs {
        width: 24px;
        height: 24px;

        .avatar-img,
        .avatar-placeholder {
            width: 24px;
            height: 24px;
            font-size: 0.625rem;
        }

        .online-indicator {
            width: 6px;
            height: 6px;
            border-width: 1px;
        }
    }

    &.avatar-sm {
        width: 32px;
        height: 32px;

        .avatar-img,
        .avatar-placeholder {
            width: 32px;
            height: 32px;
            font-size: 0.75rem;
        }

        .online-indicator {
            width: 8px;
            height: 8px;
            border-width: 2px;
        }
    }

    &.avatar-medium {
        width: 40px;
        height: 40px;

        .avatar-img,
        .avatar-placeholder {
            width: 40px;
            height: 40px;
            font-size: 0.875rem;
        }

        .online-indicator {
            width: 10px;
            height: 10px;
            border-width: 2px;
        }
    }

    &.avatar-lg {
        width: 56px;
        height: 56px;

        .avatar-img,
        .avatar-placeholder {
            width: 56px;
            height: 56px;
            font-size: 1.125rem;
        }

        .online-indicator {
            width: 12px;
            height: 12px;
            border-width: 2px;
        }
    }

    &.avatar-xl {
        width: 80px;
        height: 80px;

        .avatar-img,
        .avatar-placeholder {
            width: 80px;
            height: 80px;
            font-size: 1.5rem;
        }

        .online-indicator {
            width: 16px;
            height: 16px;
            border-width: 3px;
        }
    }

    &.avatar-2xl {
        width: 120px;
        height: 120px;

        .avatar-img,
        .avatar-placeholder {
            width: 120px;
            height: 120px;
            font-size: 2rem;
        }

        .online-indicator {
            width: 20px;
            height: 20px;
            border-width: 3px;
        }
    }

    .avatar-img,
    .avatar-placeholder {
        border-radius: 50%;
        object-fit: cover;

        &.clickable {
            cursor: pointer;
            transition: transform 0.2s ease;

            &:hover {
                transform: scale(1.05);
            }
        }
    }

    .avatar-placeholder {
        background: linear-gradient(135deg, var(--bs-primary), var(--bs-info));
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        user-select: none;
    }

    .online-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        background-color: var(--bs-success);
        border: 2px solid white;
        border-radius: 50%;
    }

    .avatar-badge {
        position: absolute;
        top: -4px;
        right: -4px;
        background-color: var(--bs-danger);
        color: white;
        border-radius: 50%;
        min-width: 16px;
        height: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.625rem;
        font-weight: 600;
        border: 2px solid white;
    }
}
</style>