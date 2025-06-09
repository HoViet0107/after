<template>
    <div v-if="hasError" class="error-boundary">
        <div class="alert alert-danger" role="alert">
            <div class="d-flex align-items-center mb-2">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <h5 class="mb-0">{{ title }}</h5>
            </div>
            <p class="mb-3">{{ message }}</p>
            <div class="d-flex gap-2">
                <button class="btn btn-outline-danger btn-sm" @click="retry">
                    <i class="fas fa-redo me-1"></i>
                    Thử lại
                </button>
                <button v-if="showDetails" class="btn btn-outline-secondary btn-sm" @click="toggleDetails">
                    <i class="fas fa-info-circle me-1"></i>
                    {{ showErrorDetails ? 'Ẩn' : 'Hiện' }} chi tiết
                </button>
            </div>

            <div v-if="showErrorDetails && error" class="mt-3">
                <div class="card card-body bg-light">
                    <h6>Chi tiết lỗi:</h6>
                    <pre class="mb-0"><code>{{ errorDetails }}</code></pre>
                </div>
            </div>
        </div>
    </div>

    <slot v-else />
</template>

<script setup>
import { ref, computed, onErrorCaptured } from 'vue'

const props = defineProps({
    title: {
        type: String,
        default: 'Có lỗi xảy ra'
    },
    message: {
        type: String,
        default: 'Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.'
    },
    showDetails: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['error', 'retry'])

// State
const hasError = ref(false)
const error = ref(null)
const showErrorDetails = ref(false)

// Computed
const errorDetails = computed(() => {
    if (!error.value) return ''

    return JSON.stringify({
        message: error.value.message,
        stack: error.value.stack,
        name: error.value.name
    }, null, 2)
})

// Actions
const retry = () => {
    hasError.value = false
    error.value = null
    showErrorDetails.value = false
    emit('retry')
}

const toggleDetails = () => {
    showErrorDetails.value = !showErrorDetails.value
}

// Error handling
onErrorCaptured((err, instance, info) => {
    console.error('ErrorBoundary caught error:', err)
    console.error('Component instance:', instance)
    console.error('Error info:', info)

    hasError.value = true
    error.value = err

    emit('error', { error: err, instance, info })

    // Prevent error from propagating
    return false
})
</script>

<style lang="scss" scoped>
.error-boundary {
    .alert {
        border-left: 4px solid var(--bs-danger);
    }

    pre {
        font-size: 0.75rem;
        max-height: 200px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-word;
    }
}
</style>
