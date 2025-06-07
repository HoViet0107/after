<template>
    <div :class="spinnerClasses" role="status" :aria-label="message">
        <div v-if="type === 'spinner'" class="spinner-border" :class="sizeClass">
            <span class="visually-hidden">{{ message }}</span>
        </div>

        <div v-else-if="type === 'dots'" class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
        </div>

        <div v-else-if="type === 'pulse'" class="loading-pulse">
            <div class="pulse-circle"></div>
        </div>

        <div v-else-if="type === 'skeleton'" class="loading-skeleton">
            <div class="skeleton-line" v-for="n in skeletonLines" :key="n"></div>
        </div>

        <div v-if="showMessage && message" class="loading-message">
            {{ message }}
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

// Props
const props = defineProps({
    type: {
        type: String,
        default: 'spinner',
        validator: (value) => ['spinner', 'dots', 'pulse', 'skeleton'].includes(value)
    },
    size: {
        type: String,
        default: 'medium',
        validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    message: {
        type: String,
        default: 'Đang tải...'
    },
    showMessage: {
        type: Boolean,
        default: false
    },
    centered: {
        type: Boolean,
        default: false
    },
    color: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].includes(value)
    },
    overlay: {
        type: Boolean,
        default: false
    },
    skeletonLines: {
        type: Number,
        default: 3
    }
})

// Computed
const spinnerClasses = computed(() => [
    'loading-spinner',
    {
        'd-flex flex-column align-items-center justify-content-center': props.centered,
        'loading-overlay': props.overlay
    }
])

const sizeClass = computed(() => {
    const sizeMap = {
        small: 'spinner-border-sm',
        medium: '',
        large: 'spinner-border-lg'
    }
    return [sizeMap[props.size], `text-${props.color}`]
})
</script>

<style lang="scss" scoped>
.loading-spinner {
    &.loading-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        z-index: 9999;
        backdrop-filter: blur(2px);
    }
}

.loading-message {
    margin-top: 12px;
    font-size: 14px;
    color: var(--bs-secondary);
    text-align: center;
}

// Custom spinner sizes
.spinner-border-lg {
    width: 3rem;
    height: 3rem;
}

// Dots animation
.loading-dots {
    display: flex;
    align-items: center;
    gap: 4px;

    .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--bs-primary);
        animation: dotPulse 1.4s infinite ease-in-out both;

        &:nth-child(1) {
            animation-delay: -0.32s;
        }

        &:nth-child(2) {
            animation-delay: -0.16s;
        }

        &:nth-child(3) {
            animation-delay: 0s;
        }
    }
}

@keyframes dotPulse {

    0%,
    80%,
    100% {
        transform: scale(0);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

// Pulse animation
.loading-pulse {
    .pulse-circle {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: var(--bs-primary);
        animation: pulse 2s infinite;
    }
}

@keyframes pulse {
    0% {
        transform: scale(0);
        opacity: 1;
    }

    100% {
        transform: scale(1);
        opacity: 0;
    }
}

// Skeleton animation
.loading-skeleton {
    width: 100%;

    .skeleton-line {
        height: 12px;
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: skeleton 1.5s infinite;
        margin-bottom: 8px;
        border-radius: 4px;

        &:nth-child(1) {
            width: 100%;
        }

        &:nth-child(2) {
            width: 80%;
        }

        &:nth-child(3) {
            width: 90%;
        }

        &:last-child {
            margin-bottom: 0;
        }
    }
}

@keyframes skeleton {
    0% {
        background-position: -200% 0;
    }

    100% {
        background-position: 200% 0;
    }
}

// Dark theme support
[data-bs-theme="dark"] {
    .loading-skeleton .skeleton-line {
        background: linear-gradient(90deg, #2d3748 25%, #4a5568 50%, #2d3748 75%);
        background-size: 200% 100%;
    }

    .loading-spinner.loading-overlay {
        background: rgba(0, 0, 0, 0.9);
    }
}

// Accessibility
@media (prefers-reduced-motion: reduce) {

    .loading-dots .dot,
    .loading-pulse .pulse-circle,
    .loading-skeleton .skeleton-line {
        animation: none;
    }

    .spinner-border {
        animation: none;
        border: 2px solid var(--bs-primary);
        border-top-color: transparent;
    }
}
</style>