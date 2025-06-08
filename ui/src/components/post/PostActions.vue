<template>
    <div class="post-actions">
        <button :class="['action-btn', 'like-btn', { active: post.isLiked }]" @click="handleLike"
            :disabled="isLoading.like">
            <i :class="post.isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
            <span v-if="post.likesCount > 0">{{ formatCount(post.likesCount) }}</span>
        </button>

        <button class="action-btn comment-btn" @click="handleComment">
            <i class="far fa-comment"></i>
            <span v-if="post.commentsCount > 0">{{ formatCount(post.commentsCount) }}</span>
        </button>

        <button class="action-btn share-btn" @click="handleShare" :disabled="isLoading.share">
            <i class="fas fa-share"></i>
            <span v-if="post.sharesCount > 0">{{ formatCount(post.sharesCount) }}</span>
        </button>

        <button :class="['action-btn', 'save-btn', { active: post.isSaved }]" @click="handleSave"
            :disabled="isLoading.save">
            <i :class="post.isSaved ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { usePostStore } from '@/stores/post'
import { useToast } from 'vue-toastification'

const props = defineProps({
    post: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['like', 'comment', 'share', 'save'])

const postStore = usePostStore()
const toast = useToast()

// State
const isLoading = ref({
    like: false,
    share: false,
    save: false
})

// Actions
const handleLike = async () => {
    if (isLoading.value.like) return

    isLoading.value.like = true

    try {
        if (props.post.isLiked) {
            await postStore.unlikePost(props.post.id)
        } else {
            await postStore.likePost(props.post.id)
        }
        emit('like', props.post)
    } catch (error) {
        console.error('Like error:', error)
    } finally {
        isLoading.value.like = false
    }
}

const handleComment = () => {
    emit('comment', props.post)
}

const handleShare = async () => {
    if (isLoading.value.share) return

    // Show share options
    const shareData = {
        title: `Bài viết của ${props.post.author.name}`,
        text: props.post.content,
        url: `${window.location.origin}/app/post/${props.post.id}`
    }

    if (navigator.share) {
        try {
            await navigator.share(shareData)

            // Track share
            isLoading.value.share = true
            await postStore.sharePost(props.post.id)
            emit('share', props.post)
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share error:', error)
            }
        } finally {
            isLoading.value.share = false
        }
    } else {
        // Fallback: copy to clipboard
        try {
            await navigator.clipboard.writeText(shareData.url)
            toast.success('Đã sao chép liên kết!')

            isLoading.value.share = true
            await postStore.sharePost(props.post.id)
            emit('share', props.post)
        } catch (error) {
            toast.error('Không thể chia sẻ bài viết')
        } finally {
            isLoading.value.share = false
        }
    }
}

const handleSave = async () => {
    if (isLoading.value.save) return

    isLoading.value.save = true

    try {
        if (props.post.isSaved) {
            await postStore.unsavePost(props.post.id)
        } else {
            await postStore.savePost(props.post.id)
        }
        emit('save', props.post)
    } catch (error) {
        console.error('Save error:', error)
    } finally {
        isLoading.value.save = false
    }
}

// Utility
const formatCount = (count) => {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1) + 'M'
    } else if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K'
    }
    return count.toString()
}
</script>

<style lang="scss" scoped>
.post-actions {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--bs-border-color);

    .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: none;
        border: none;
        color: var(--bs-secondary);
        font-size: 0.875rem;
        padding: 0.5rem 1rem;
        border-radius: 2rem;
        transition: all 0.2s ease;
        cursor: pointer;

        &:hover {
            background-color: var(--bs-light);
        }

        &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }

        i {
            font-size: 1rem;
        }

        &.like-btn {
            &:hover {
                color: var(--bs-danger);
                background-color: rgba(var(--bs-danger-rgb), 0.1);
            }

            &.active {
                color: var(--bs-danger);

                i {
                    animation: heartbeat 0.6s ease-in-out;
                }
            }
        }

        &.comment-btn {
            &:hover {
                color: var(--bs-primary);
                background-color: rgba(var(--bs-primary-rgb), 0.1);
            }
        }

        &.share-btn {
            &:hover {
                color: var(--bs-success);
                background-color: rgba(var(--bs-success-rgb), 0.1);
            }
        }

        &.save-btn {
            &:hover {
                color: var(--bs-warning);
                background-color: rgba(var(--bs-warning-rgb), 0.1);
            }

            &.active {
                color: var(--bs-warning);
            }
        }
    }
}

@keyframes heartbeat {
    0% {
        transform: scale(1);
    }

    14% {
        transform: scale(1.3);
    }

    28% {
        transform: scale(1);
    }

    42% {
        transform: scale(1.3);
    }

    70% {
        transform: scale(1);
    }
}
</style>