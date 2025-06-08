<template>
    <div v-if="show" class="modal fade show d-block" tabindex="-1" role="dialog" aria-modal="true">
        <div class="modal-backdrop fade show"></div>
        <div class="modal-dialog modal-dialog-centered" role="document">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i v-if="icon" :class="iconClass" class="me-2"></i>
                        {{ title }}
                    </h5>
                    <button type="button" class="btn-close" @click="handleCancel" aria-label="Close"></button>
                </div>

                <div class="modal-body">
                    <p>{{ message }}</p>
                    <div v-if="details" class="text-muted small">
                        {{ details }}
                    </div>
                </div>

                <div class="modal-footer">
                    <button type="button" :class="cancelButtonClass" @click="handleCancel">
                        {{ cancelText }}
                    </button>
                    <button type="button" :class="confirmButtonClass" @click="handleConfirm" :disabled="loading">
                        <span v-if="loading" class="spinner-border spinner-border-sm me-1" role="status"></span>
                        {{ confirmText }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    },
    title: {
        type: String,
        default: 'Xác nhận'
    },
    message: {
        type: String,
        required: true
    },
    details: {
        type: String,
        default: ''
    },
    confirmText: {
        type: String,
        default: 'Xác nhận'
    },
    cancelText: {
        type: String,
        default: 'Hủy'
    },
    type: {
        type: String,
        default: 'danger',
        validator: (value) => ['primary', 'secondary', 'success', 'danger', 'warning', 'info'].includes(value)
    },
    icon: {
        type: String,
        default: 'fas fa-question-circle'
    },
    loading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['confirm', 'cancel'])

// Computed
const iconClass = computed(() => {
    const typeColors = {
        primary: 'text-primary',
        secondary: 'text-secondary',
        success: 'text-success',
        danger: 'text-danger',
        warning: 'text-warning',
        info: 'text-info'
    }
    return `${props.icon} ${typeColors[props.type]}`
})

const confirmButtonClass = computed(() => `btn btn-${props.type}`)
const cancelButtonClass = computed(() => 'btn btn-outline-secondary')

// Actions
const handleConfirm = () => {
    emit('confirm')
}

const handleCancel = () => {
    emit('cancel')
}
</script>

<style lang="scss" scoped>
.modal {
    background-color: rgba(0, 0, 0, 0.5);
}
</style>