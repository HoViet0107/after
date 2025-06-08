<template>
    <div class="comment-actions">
        <button :class="['action-btn', 'like-btn', { active: comment.isLiked }]" @click="handleLike">
            <i :class="comment.isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
            <span v-if="comment.likesCount > 0">{{ comment.likesCount }}</span>
        </button>

        <button class="action-btn reply-btn" @click="handleReply">
            <i class="fas fa-reply"></i>
            <span>Trả lời</span>
        </button>

        <div v-if="showMoreActions" class="dropdown">
            <button class="action-btn more-btn" data-bs-toggle="dropdown" aria-expanded="false">
                <i class="fas fa-ellipsis-h"></i>
            </button>
            <ul class="dropdown-menu dropdown-menu-end">
                <li v-if="canEdit">
                    <a class="dropdown-item" href="#" @click="handleEdit">
                        <i class="fas fa-edit me-2"></i>Chỉnh sửa
                    </a>
                </li>
                <li v-if="canDelete">
                    <a class="dropdown-item text-danger" href="#" @click="handleDelete">
                        <i class="fas fa-trash me-2"></i>Xóa
                    </a>
                </li>
                <li v-if="!isOwnComment">
                    <a class="dropdown-item" href="#" @click="handleReport">
                        <i class="fas fa-flag me-2"></i>Báo cáo
                    </a>
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
    comment: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['like', 'reply', 'edit', 'delete', 'report'])

const authStore = useAuthStore()

// Computed
const isOwnComment = computed(() => {
    return authStore.userId === props.comment.author.id
})

const canEdit = computed(() => {
    return isOwnComment.value
})

const canDelete = computed(() => {
    return isOwnComment.value || authStore.user?.role === 'admin'
})

const showMoreActions = computed(() => {
    return canEdit.value || canDelete.value || !isOwnComment.value
})

// Actions
const handleLike = () => {
    emit('like')
}

const handleReply = () => {
    emit('reply')
}

const handleEdit = () => {
    emit('edit')
}

const handleDelete = () => {
    emit('delete')
}

const handleReport = () => {
    emit('report')
}
</script>

<style lang="scss" scoped>
.comment-actions {
    display: flex;
    align-items: center;
    gap: 1rem;

    .action-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        background: none;
        border: none;
        color: var(--bs-secondary);
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 1rem;
        transition: all 0.2s ease;
        cursor: pointer;

        &:hover {
            background-color: var(--bs-light);
        }

        i {
            font-size: 0.875rem;
        }

        &.like-btn {
            &:hover {
                color: var(--bs-danger);
                background-color: rgba(var(--bs-danger-rgb), 0.1);
            }

            &.active {
                color: var(--bs-danger);
            }
        }

        &.reply-btn {
            &:hover {
                color: var(--bs-primary);
                background-color: rgba(var(--bs-primary-rgb), 0.1);
            }
        }

        &.more-btn {
            &:hover {
                color: var(--bs-body-color);
                background-color: var(--bs-light);
            }
        }
    }
}
</style>