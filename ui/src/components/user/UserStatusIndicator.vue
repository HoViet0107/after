<template>
    <div :class="['user-status-indicator', statusClass]" :title="statusText">
        <div class="status-dot"></div>
        <span v-if="showText" class="status-text">{{ statusText }}</span>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    status: {
        type: String,
        default: 'offline',
        validator: (value) => ['online', 'away', 'busy', 'offline'].includes(value)
    },
    showText: {
        type: Boolean,
        default: false
    },
    lastSeen: {
        type: [String, Date],
        default: null
    }
})

// Computed
const statusClass = computed(() => `status-${props.status}`)

const statusText = computed(() => {
    switch (props.status) {
        case 'online':
            return 'Đang hoạt động'
        case 'away':
            return 'Vắng mặt'
        case 'busy':
            return 'Bận'
        case 'offline':
            if (props.lastSeen) {
                const lastSeenDate = new Date(props.lastSeen)
                const now = new Date()
                const diffInMinutes = Math.floor((now - lastSeenDate) / (1000 * 60))

                if (diffInMinutes < 1) {
                    return 'Vừa truy cập'
                } else if (diffInMinutes < 60) {
                    return `${diffInMinutes} phút trước`
                } else if (diffInMinutes < 1440) {
                    const hours = Math.floor(diffInMinutes / 60)
                    return `${hours} giờ trước`
                } else {
                    const days = Math.floor(diffInMinutes / 1440)
                    return `${days} ngày trước`
                }
            }
            return 'Ngoại tuyến'
        default:
            return 'Không xác định'
    }
})
</script>

<style lang="scss" scoped>
.user-status-indicator {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .status-text {
        font-size: 0.75rem;
        color: var(--bs-secondary);
    }

    &.status-online .status-dot {
        background-color: var(--bs-success);
        box-shadow: 0 0 4px rgba(var(--bs-success-rgb), 0.5);
    }

    &.status-away .status-dot {
        background-color: var(--bs-warning);
        box-shadow: 0 0 4px rgba(var(--bs-warning-rgb), 0.5);
    }

    &.status-busy .status-dot {
        background-color: var(--bs-danger);
        box-shadow: 0 0 4px rgba(var(--bs-danger-rgb), 0.5);
    }

    &.status-offline .status-dot {
        background-color: var(--bs-secondary);
    }
}
</style>