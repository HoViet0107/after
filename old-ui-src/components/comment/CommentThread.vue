<template>
    <div class="comment-thread">
        <div class="thread-header">
            <h6>Chuỗi bình luận</h6>
            <button class="btn btn-sm btn-outline-secondary" @click="$emit('close')">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <div class="thread-content">
            <!-- Parent comments leading to this comment -->
            <div v-if="parentComments.length > 0" class="parent-comments">
                <CommentItem v-for="parent in parentComments" :key="parent.id" :comment="parent" :post-id="postId"
                    :show-replies="false" class="parent-comment" />
            </div>

            <!-- Main comment -->
            <div class="main-comment">
                <CommentItem :comment="mainComment" :post-id="postId" :highlighted="true" />
            </div>

            <!-- Replies to this comment -->
            <div v-if="replies.length > 0" class="replies">
                <CommentItem v-for="reply in replies" :key="reply.id" :comment="reply" :post-id="postId"
                    :is-reply="true" />
            </div>

            <!-- Reply form -->
            <div class="reply-form">
                <CommentCreate :post-id="postId" :parent-id="mainComment.id"
                    :placeholder="`Trả lời ${mainComment.author.name}...`" @submit="handleReplySubmit" />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCommentStore } from '@/stores/comment'
import CommentItem from './CommentItem.vue'
import CommentCreate from './CommentCreate.vue'

const props = defineProps({
    commentId: {
        type: String,
        required: true
    },
    postId: {
        type: String,
        required: true
    }
})

const emit = defineEmits(['close', 'reply-added'])

const commentStore = useCommentStore()

// State
const mainComment = ref(null)
const parentComments = ref([])
const replies = ref([])
const isLoading = ref(false)

// Actions
const loadCommentThread = async () => {
    isLoading.value = true

    try {
        // Load the main comment
        // This would require an API endpoint to get comment by ID
        // mainComment.value = await commentStore.getCommentById(props.commentId)

        // Load parent comments (if this is a reply)
        // parentComments.value = await commentStore.getParentComments(props.commentId)

        // Load replies
        replies.value = await commentStore.fetchReplies(props.commentId)

    } catch (error) {
        console.error('Failed to load comment thread:', error)
    } finally {
        isLoading.value = false
    }
}

const handleReplySubmit = (reply) => {
    replies.value.push(reply)
    emit('reply-added', reply)
}

onMounted(() => {
    loadCommentThread()
})
</script>

<style lang="scss" scoped>
.comment-thread {
    .thread-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);

        h6 {
            margin: 0;
            font-weight: 600;
        }
    }

    .thread-content {
        padding: 1rem;
        max-height: 60vh;
        overflow-y: auto;

        .parent-comments {
            margin-bottom: 1rem;

            .parent-comment {
                opacity: 0.7;
                margin-bottom: 0.5rem;
            }
        }

        .main-comment {
            margin-bottom: 1rem;
            padding: 1rem;
            background: rgba(var(--bs-primary-rgb), 0.1);
            border-radius: 0.5rem;
            border-left: 4px solid var(--bs-primary);
        }

        .replies {
            margin-bottom: 1rem;
            padding-left: 1rem;
            border-left: 2px solid var(--bs-border-color);
        }

        .reply-form {
            border-top: 1px solid var(--bs-border-color);
            padding-top: 1rem;
        }
    }
}
</style>