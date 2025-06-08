<template>
    <div class="message-status">
        <i :class="statusIcon" :title="statusText" class="status-icon"></i>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    status: {
        type: String,
        default: 'sent',
        validator: (value) => ['sending', 'sent', 'delivered', 'read', 'failed'].includes(value)
    },
    readBy: {
        type: Array,
        default: () => []
    }
})

// Computed
const statusIcon = computed(() => {
    switch (props.status) {
        case 'sending':
            return 'fas fa-clock text-secondary'
        case 'sent':
            return 'fas fa-check text-secondary'
        case 'delivered':
            return 'fas fa-check-double text-secondary'
        case 'read':
            return 'fas fa-check-double text-primary'
        case 'failed':
            return 'fas fa-exclamation-triangle text-danger'
        default:
            return 'fas fa-clock text-secondary'
    }
})

const statusText = computed(() => {
    switch (props.status) {
        case 'sending':
            return 'Đang gửi...'
        case 'sent':
            return 'Đã gửi'
        case 'delivered':
            return 'Đã nhận'
        case 'read':
            if (props.readBy.length > 0) {
                return `Đã đọc bởi ${props.readBy.length} người`
            }
            return 'Đã đọc'
        case 'failed':
            return 'Gửi thất bại'
        default:
            return ''
    }
})
</script>

<style lang="scss" scoped>
.message-status {
    .status-icon {
        font-size: 0.75rem;
        cursor: help;
    }
}
</style>
