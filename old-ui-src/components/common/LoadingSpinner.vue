<template>
    <div :class="['loading-spinner', sizeClass, { 'with-text': showText }]">
        <div class="spinner-border" :class="colorClass" role="status">
            <span class="visually-hidden">{{ text }}</span>
        </div>
        <span v-if="showText" class="loading-text">{{ text }}</span>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    size: {
        type: String,
        default: 'medium',
        validator: (value) => ['small', 'medium', 'large'].includes(value)
    },
    color: {
        type: String,
        default: 'primary',
        validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark'].includes(value)
    },
    text: {
        type: String,
        default: 'Đang tải...'
    },
    showText: {
        type: Boolean,
        default: false
    }
})

const sizeClass = computed(() => {
    switch (props.size) {
        case 'small': return 'spinner-sm'
        case 'large': return 'spinner-lg'
        default: return ''
    }
})

const colorClass = computed(() => `text-${props.color}`)
</script>

<style lang="scss" scoped>
.loading-spinner {
    display: flex;
    align-items: center;
    justify-content: center;

    &.with-text {
        flex-direction: column;
        gap: 0.5rem;

        .loading-text {
            font-size: 0.875rem;
            color: var(--bs-secondary);
        }
    }

    .spinner-border {
        &.spinner-sm {
            width: 1rem;
            height: 1rem;
        }

        &.spinner-lg {
            width: 3rem;
            height: 3rem;
        }
    }
}
</style>