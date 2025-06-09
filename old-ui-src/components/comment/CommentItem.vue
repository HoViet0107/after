<template>
    <div class="comment-item">
        <div class="comment-main">
            <UserAvatar :src="comment.author.avatar" :name="comment.author.name" size="sm" clickable
                @click="viewProfile" />

            <div class="comment-content">
                <div class="comment-bubble">
                    <div class="comment-header">
                        <span class="author-name" @click="viewProfile">{{ comment.author.name }}</span>
                        <time class="comment-time" :datetime="comment.createdAt">
                            {{ formatRelativeTime(comment.createdAt) }}
                        </time>
                        <span v-if="comment.isEdited" class="edited-indicator" title="Đã chỉnh sửa">
                            <i class="fas fa-edit"></i>
                        </span>
                    </div>

                    <div v-if="!isEditing" class="comment-text" v-html="formattedContent"></div>

                    <form v-else @submit.prevent="submitEdit" class="edit-form">
                        <textarea v-model="editContent" class="form-control form-control-sm" rows="2"
                            @keydown.escape="cancelEdit" @keydown.ctrl.enter="submitEdit" ref="editTextarea"></textarea>
                        <div class="edit-actions">
                            <button type="button" class="btn btn-sm btn-outline-secondary" @click="cancelEdit">
                                Hủy
                            </button>
                            <button type="submit" class="btn btn-sm btn-primary" :disabled="!editContent.trim()">
                                Lưu
                            </button>
                        </div>
                    </form>
                </div>

                <CommentActions :comment="comment" @like="handleLike" @reply="handleReply" @edit="startEdit"
                    @delete="handleDelete" @report="handleReport" />

                <!-- Reply form -->
                <div v-if="showReplyForm" class="reply-form">
                    <CommentCreate :post-id="postId" :parent-id="comment.id"
                        :placeholder="`Trả lời ${comment.author.name}...`" @submit="handleReplySubmit"
                        @cancel="showReplyForm = false" />
                </div>

                <!-- Replies -->
                <div v-if="comment.repliesCount > 0" class="replies-section">
                    <button v-if="!showReplies" class="btn btn-link btn-sm p-0 show-replies-btn" @click="loadReplies">
                        <i class="fas fa-reply me-1"></i>
                        Xem {{ comment.repliesCount }} phản hồi
                    </button>

                    <div v-else class="replies-list">
                        <CommentItem v-for="reply in replies" :key="reply.id" :comment="reply" :post-id="postId"
                            :is-reply="true" @reply="handleReply" @like="handleLike" @edit="handleEdit"
                            @delete="handleDelete" @report="handleReport" />

                        <button v-if="hasMoreReplies" class="btn btn-link btn-sm p-0" @click="loadMoreReplies"
                            :disabled="isLoadingReplies">
                            <span v-if="isLoadingReplies" class="spinner-border spinner-border-sm me-1"></span>
                            {{ isLoadingReplies ? 'Đang tải...' : 'Xem thêm phản hồi' }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useCommentStore } from '@/stores/comment'
import { useToast } from 'vue-toastification'
import UserAvatar from '@/components/user/UserAvatar.vue'
import CommentActions from './CommentActions.vue'
import CommentCreate from './CommentCreate.vue'

const props = defineProps({
    comment: {
        type: Object,
        required: true
    },
    postId: {
        type: String,
        required: true
    },
    isReply: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['reply', 'like', 'edit', 'delete', 'report'])

const router = useRouter()
const authStore = useAuthStore()
const commentStore = useCommentStore()
const toast = useToast()

// Refs
const editTextarea = ref(null)

// State
const isEditing = ref(false)
const editContent = ref('')
const showReplyForm = ref(false)
const showReplies = ref(false)
const replies = ref([])
const isLoadingReplies = ref(false)
const hasMoreReplies = ref(false)

// Computed
const formattedContent = computed(() => {
    if (!props.comment.content) return ''

    let content = props.comment.content

    // Format mentions
    content = content.replace(
        /@(\w+)/g,
        '<a href="/app/profile/$1" class="mention">@$1</a>'
    )

    // Format hashtags
    content = content.replace(
        /#(\w+)/g,
        '<a href="/app/search?q=%23$1" class="hashtag">#$1</a>'
    )

    return content
})

const isOwnComment = computed(() => {
    return authStore.userId === props.comment.author.id
})

// Actions
const viewProfile = () => {
    router.push(`/app/profile/${props.comment.author.id}`)
}

const handleLike = async () => {
    try {
        if (props.comment.isLiked) {
            await commentStore.unlikeComment(props.comment.id)
        } else {
            await commentStore.likeComment(props.comment.id)
        }
        emit('like', props.comment)
    } catch (error) {
        console.error('Like comment error:', error)
    }
}

const handleReply = () => {
    showReplyForm.value = true
}

const handleReplySubmit = (reply) => {
    showReplyForm.value = false
    replies.value.unshift(reply)
    props.comment.repliesCount++
    emit('reply', props.comment, reply)
}

const startEdit = () => {
    if (!isOwnComment.value) return

    isEditing.value = true
    editContent.value = props.comment.content

    nextTick(() => {
        editTextarea.value?.focus()
    })
}

const cancelEdit = () => {
    isEditing.value = false
    editContent.value = ''
}

const submitEdit = async () => {
    if (!editContent.value.trim()) return

    try {
        await commentStore.updateComment(props.comment.id, editContent.value.trim())
        isEditing.value = false
        toast.success('Cập nhật bình luận thành công!')
        emit('edit', props.comment)
    } catch (error) {
        toast.error('Không thể cập nhật bình luận!')
        console.error('Edit comment error:', error)
    }
}

const handleDelete = async () => {
    if (!isOwnComment.value) return

    if (confirm('Bạn có chắc chắn muốn xóa bình luận này?')) {
        try {
            await commentStore.deleteComment(props.comment.id, props.postId)
            emit('delete', props.comment)
        } catch (error) {
            console.error('Delete comment error:', error)
        }
    }
}

const handleReport = () => {
    emit('report', props.comment)
}

const loadReplies = async () => {
    if (isLoadingReplies.value) return

    isLoadingReplies.value = true
    showReplies.value = true

    try {
        const repliesData = await commentStore.fetchReplies(props.comment.id)
        replies.value = repliesData
    } catch (error) {
        console.error('Load replies error:', error)
    } finally {
        isLoadingReplies.value = false
    }
}

const loadMoreReplies = async () => {
    // TODO: Implement pagination for replies
    console.log('Load more replies')
}

// Utility
const formatRelativeTime = (date) => {
    const now = new Date()
    const commentDate = new Date(date)
    const diffInSeconds = Math.floor((now - commentDate) / 1000)

    if (diffInSeconds < 60) {
        return 'Vừa xong'
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} phút`
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} giờ`
    } else {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days} ngày`
    }
}
</script>

<style lang="scss" scoped>
.comment-item {
    margin-bottom: 1rem;

    &:last-child {
        margin-bottom: 0;
    }

    .comment-main {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;

        .comment-content {
            flex: 1;
            min-width: 0;

            .comment-bubble {
                background: var(--bs-light);
                border-radius: 1rem;
                padding: 0.75rem 1rem;
                margin-bottom: 0.5rem;

                .comment-header {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    margin-bottom: 0.5rem;

                    .author-name {
                        font-weight: 600;
                        cursor: pointer;

                        &:hover {
                            color: var(--bs-primary);
                        }
                    }

                    .comment-time {
                        color: var(--bs-secondary);
                        font-size: 0.75rem;
                        cursor: pointer;

                        &:hover {
                            text-decoration: underline;
                        }
                    }

                    .edited-indicator {
                        color: var(--bs-secondary);
                        font-size: 0.625rem;
                    }
                }

                .comment-text {
                    line-height: 1.4;

                    :deep(.mention) {
                        color: var(--bs-primary);
                        text-decoration: none;
                        font-weight: 500;

                        &:hover {
                            text-decoration: underline;
                        }
                    }

                    :deep(.hashtag) {
                        color: var(--bs-info);
                        text-decoration: none;
                        font-weight: 500;

                        &:hover {
                            text-decoration: underline;
                        }
                    }
                }

                .edit-form {
                    .edit-actions {
                        display: flex;
                        gap: 0.5rem;
                        justify-content: flex-end;
                        margin-top: 0.5rem;
                    }
                }
            }

            .reply-form {
                margin: 0.75rem 0;
                padding-left: 1rem;
                border-left: 2px solid var(--bs-border-color);
            }

            .replies-section {
                margin-top: 0.75rem;

                .show-replies-btn {
                    color: var(--bs-secondary);

                    &:hover {
                        color: var(--bs-primary);
                    }
                }

                .replies-list {
                    margin-top: 0.75rem;
                    padding-left: 1rem;
                    border-left: 2px solid var(--bs-border-color);

                    .comment-item {
                        margin-bottom: 0.75rem;

                        .comment-bubble {
                            background: white;
                            border: 1px solid var(--bs-border-color);
                        }
                    }
                }
            }
        }
    }
}
</style>