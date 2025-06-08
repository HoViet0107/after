<template>
    <div ref="scrollTrigger" class="infinite-scroll">
        <div v-if="isLoading" class="loading-state">
            <slot name="loading">
                <div class="default-loading">
                    <LoadingSpinner size="medium" />
                    <span class="ms-2">Đang tải...</span>
                </div>
            </slot>
        </div>

        <div v-else-if="!hasMore" class="no-more-state">
            <slot name="no-more">
                <div class="default-no-more">
                    <i class="fas fa-check-circle me-2"></i>
                    Đã tải hết
                </div>
            </slot>
        </div>

        <div v-else class="load-more-state">
            <slot name="load-more">
                <button class="btn btn-outline-primary load-more-btn" @click="triggerLoadMore" :disabled="isLoading">
                    Tải thêm
                </button>
            </slot>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const props = defineProps({
    isLoading: {
        type: Boolean,
        default: false
    },
    hasMore: {
        type: Boolean,
        default: true
    },
    threshold: {
        type: Number,
        default: 100
    },
    container: {
        type: [String, Object],
        default: null
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['load-more'])

// Refs
const scrollTrigger = ref(null)

// State
let observer = null

// Actions
const triggerLoadMore = () => {
    if (!props.isLoading && props.hasMore && !props.disabled) {
        emit('load-more')
    }
}

const setupIntersectionObserver = () => {
    if (!scrollTrigger.value) return

    observer = new IntersectionObserver(
        (entries) => {
            const entry = entries[0]
            if (entry.isIntersecting) {
                triggerLoadMore()
            }
        },
        {
            root: props.container ? document.querySelector(props.container) : null,
            rootMargin: `${props.threshold}px`,
            threshold: 0.1
        }
    )

    observer.observe(scrollTrigger.value)
}

const cleanupObserver = () => {
    if (observer) {
        observer.disconnect()
        observer = null
    }
}

// Lifecycle
onMounted(() => {
    setupIntersectionObserver()
})

onUnmounted(() => {
    cleanupObserver()
})
</script>

<style lang="scss" scoped>
.infinite-scroll {
    padding: 1rem;
    text-align: center;

    .loading-state,
    .no-more-state,
    .load-more-state {

        .default-loading,
        .default-no-more {
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--bs-secondary);
            font-size: 0.875rem;
        }

        .load-more-btn {
            min-width: 120px;
        }
    }

    .no-more-state {
        opacity: 0.7;
    }
}
</style>
