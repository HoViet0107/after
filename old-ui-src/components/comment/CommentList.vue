<template>
    <div class="comment-list">
        <div class="comments-header">
            <h6>Bình luận ({{ totalComments }})</h6>

            <div class="sort-options">
                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        {{ sortOptions[currentSort] }}
                    </button>
                    <ul class="dropdown-menu">
                        <li v-for="(label, key) in sortOptions" :key="key">
                            <a class="dropdown-item" :class="{ active: currentSort === key }" href="#"
                                @click="changeSort(key)">
                                {{ label }}
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <CommentCreate :post-id="postId" @submit="handleCommentSubmit" />

        <div v-if="isLoading && comments.length === 0" class="loading-container">
            <LoadingSpinner size="medium" show-text text="Đang tải bình luận..." />
        </div>

        <div v-else-if="comments.length === 0" class="empty-state">
            <div class="empty-icon">
                <i class="far fa-comment"></i>
            </div>
            <p class="text-muted">Chưa có bình luận nào. Hãy là người đầu tiên!</p>
        </div>

        <div v-else class="comments-container">
            <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment" :post-id="postId"
                @reply="handleReply" @like="handleLike" @edit="handleEdit" @delete="handleDelete"
                @report="handleReport" />

            <div v-if="hasMore" class="load-more">
                <button class="btn btn-outline-primary btn-sm" @click="loadMore" :disabled="isLoadingMore">
                    <span v-if="isLoadingMore" class="spinner-border spinner-border-sm me-1"></span>
                    {{ isLoadingMore ? 'Đang tải...' : 'Xem thêm bình luận' }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useCommentStore } from '@/stores/comment'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import CommentCreate from './CommentCreate.vue'
import CommentItem from './CommentItem.vue'

const props = defineProps({
    postId: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['comment-created', 'comment-updated', 'comment-deleted'])

const commentStore = useCommentStore()

// State
const currentSort = ref('newest')
const isLoading = ref(false)
const isLoadingMore = ref(false)
const page = ref(0)
const pageSize = ref(20)

// Sort options
const sortOptions = {
    newest: 'Mới nhất',
    oldest: 'Cũ nhất',
    popular: 'Phổ biến nhất'
}

// Computed
const comments = computed(() => commentStore.getPostComments(props.postId))
const totalComments = computed(() => comments.value.length)
const hasMore = computed(() => {
    // This would be determined by the API response
    return false // Placeholder
})

// Actions
const loadComments = async (reset = false) => {
    if (reset) {
        isLoading.value = true
        page.value = 0
    } else {
        isLoadingMore.value = true
    }

    try {
        const params = {
            page: page.value,
            size: pageSize.value,
            sort: getSortParam(currentSort.value)
        }

        await commentStore.fetchComments(props.postId, params)

        if (!reset) {
            page.value++
        }
    } catch (error) {
        console.error('Failed to load comments:', error)
    } finally {
        isLoading.value = false
        isLoadingMore.value = false
    }
}

const loadMore = () => {
    if (!isLoadingMore.value && hasMore.value) {
        page.value++
        loadComments(false)
    }
}

const changeSort = (sortKey) => {
    if (currentSort.value !== sortKey) {
        currentSort.value = sortKey
        loadComments(true)
    }
}

const getSortParam = (sort) => {
    switch (sort) {
        case 'newest':
            return 'createdAt,desc'
        case 'oldest':
            return 'createdAt,asc'
        case 'popular':
            return 'likesCount,desc'
        default:
            return 'createdAt,desc'
    }
}

const handleCommentSubmit = (comment) => {
    emit('comment-created', comment)
}

const handleReply = (comment, reply) => {
    emit('comment-updated', comment)
}

const handleLike = (comment) => {
    emit('comment-updated', comment)
}

const handleEdit = (comment) => {
    emit('comment-updated', comment)
}

const handleDelete = (comment) => {
    emit('comment-deleted', comment)
}

const handleReport = (comment) => {
    // Handle report logic
    console.log('Report comment:', comment)
}

// Watch for post changes
watch(() => props.postId, () => {
    if (props.postId) {
        loadComments(true)
    }
}, { immediate: true })
</script>

<style lang="scss" scoped>
.comment-list {
    .comments-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid var(--bs-border-color);

        h6 {
            margin: 0;
            font-weight: 600;
        }
    }

    .loading-container {
        display: flex;
        justify-content: center;
        padding: 2rem 0;
    }

    .empty-state {
        text-align: center;
        padding: 2rem 0;

        .empty-icon {
            font-size: 2rem;
            color: var(--bs-secondary);
            margin-bottom: 1rem;
        }
    }

    .comments-container {
        .load-more {
            display: flex;
            justify-content: center;
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid var(--bs-border-color);
        }
    }
}
</style>