<template>
    <article class="post-card">
        <div class="post-header">
            <UserAvatar :src="post.author.avatar" :name="post.author.name" :show-online-status="true"
                :is-online="post.author.isOnline" size="medium" clickable @click="viewProfile" />

            <div class="post-meta">
                <div class="author-info">
                    <h6 class="author-name" @click="viewProfile">{{ post.author.name }}</h6>
                    <span class="author-username">@{{ post.author.username }}</span>
                </div>

                <div class="post-time">
                    <time :datetime="post.createdAt" :title="formatFullDate(post.createdAt)">
                        {{ formatRelativeTime(post.createdAt) }}
                    </time>
                    <span v-if="post.isEdited" class="edited-indicator" title="Đã chỉnh sửa">
                        <i class="fas fa-edit"></i>
                    </span>
                </div>
            </div>

            <div class="post-actions-menu">
                <div class="dropdown">
                    <button class="btn btn-link btn-sm" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li v-if="canEdit">
                            <a class="dropdown-item" href="#" @click="editPost">
                                <i class="fas fa-edit me-2"></i>Chỉnh sửa
                            </a>
                        </li>
                        <li v-if="canDelete">
                            <a class="dropdown-item text-danger" href="#" @click="deletePost">
                                <i class="fas fa-trash me-2"></i>Xóa
                            </a>
                        </li>
                        <li v-if="!isOwnPost">
                            <a class="dropdown-item" href="#" @click="reportPost">
                                <i class="fas fa-flag me-2"></i>Báo cáo
                            </a>
                        </li>
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" @click="copyLink">
                                <i class="fas fa-link me-2"></i>Sao chép liên kết
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div class="post-content">
            <div v-if="post.content" class="post-text" v-html="formattedContent"></div>

            <PostMedia v-if="post.attachments && post.attachments.length > 0" :attachments="post.attachments"
                @view="viewMedia" />

            <PostHashtags v-if="hashtags.length > 0" :hashtags="hashtags" @click="searchHashtag" />
        </div>

        <PostActions :post="post" @like="handleLike" @comment="handleComment" @share="handleShare" @save="handleSave" />

        <!-- Comments preview -->
        <div v-if="showCommentsPreview && post.commentsCount > 0" class="comments-preview">
            <button class="btn btn-link btn-sm p-0" @click="viewComments">
                Xem tất cả {{ post.commentsCount }} bình luận
            </button>

            <div v-if="post.latestComments" class="latest-comments">
                <div v-for="comment in post.latestComments.slice(0, 2)" :key="comment.id" class="comment-preview">
                    <UserAvatar :src="comment.author.avatar" :name="comment.author.name" size="sm" />
                    <div class="comment-content">
                        <span class="comment-author">{{ comment.author.name }}</span>
                        <span class="comment-text">{{ comment.content }}</span>
                    </div>
                </div>
            </div>
        </div>
    </article>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostStore } from '@/stores/post'
import { useToast } from 'vue-toastification'
import UserAvatar from '@/components/user/UserAvatar.vue'
import PostMedia from './PostMedia.vue'
import PostHashtags from './PostHashtags.vue'
import PostActions from './PostActions.vue'

const props = defineProps({
    post: {
        type: Object,
        required: true
    },
    showCommentsPreview: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['edit', 'delete', 'like', 'comment', 'share', 'save', 'report'])

const router = useRouter()
const authStore = useAuthStore()
const postStore = usePostStore()
const toast = useToast()

// Computed
const isOwnPost = computed(() => {
    return authStore.userId === props.post.author.id
})

const canEdit = computed(() => {
    return isOwnPost.value
})

const canDelete = computed(() => {
    return isOwnPost.value || authStore.user?.role === 'admin'
})

const formattedContent = computed(() => {
    if (!props.post.content) return ''

    let content = props.post.content

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

    // Format URLs
    content = content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="external-link">$1</a>'
    )

    return content
})

const hashtags = computed(() => {
    if (!props.post.content) return []

    const hashtagRegex = /#(\w+)/g
    const matches = [...props.post.content.matchAll(hashtagRegex)]
    return matches.map(match => match[1])
})

// Actions
const viewProfile = () => {
    router.push(`/app/profile/${props.post.author.id}`)
}

const editPost = () => {
    emit('edit', props.post)
}

const deletePost = async () => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
        try {
            await postStore.deletePost(props.post.id)
            emit('delete', props.post)
        } catch (error) {
            console.error('Delete post error:', error)
        }
    }
}

const reportPost = () => {
    emit('report', props.post)
}

const copyLink = async () => {
    const url = `${window.location.origin}/app/post/${props.post.id}`

    try {
        await navigator.clipboard.writeText(url)
        toast.success('Đã sao chép liên kết!')
    } catch (error) {
        toast.error('Không thể sao chép liên kết')
    }
}

const handleLike = () => {
    emit('like', props.post)
}

const handleComment = () => {
    emit('comment', props.post)
    router.push(`/app/post/${props.post.id}`)
}

const handleShare = () => {
    emit('share', props.post)
}

const handleSave = () => {
    emit('save', props.post)
}

const viewComments = () => {
    router.push(`/app/post/${props.post.id}`)
}

const viewMedia = (attachment, index) => {
    // Open media viewer modal
    console.log('View media:', attachment, index)
}

const searchHashtag = (hashtag) => {
    router.push(`/app/search?q=%23${hashtag}`)
}

// Utility functions
const formatRelativeTime = (date) => {
    const now = new Date()
    const postDate = new Date(date)
    const diffInSeconds = Math.floor((now - postDate) / 1000)

    if (diffInSeconds < 60) {
        return 'Vừa xong'
    } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        return `${minutes} phút trước`
    } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        return `${hours} giờ trước`
    } else if (diffInSeconds < 604800) {
        const days = Math.floor(diffInSeconds / 86400)
        return `${days} ngày trước`
    } else {
        return new Intl.DateTimeFormat('vi-VN', {
            day: 'numeric',
            month: 'short'
        }).format(postDate)
    }
}

const formatFullDate = (date) => {
    return new Intl.DateTimeFormat('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date))
}
</script>

<style lang="scss" scoped>
.post-card {
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1rem;
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--bs-primary);
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    }

    .post-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;

        .post-meta {
            flex: 1;
            min-width: 0;

            .author-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;

                .author-name {
                    margin: 0;
                    font-weight: 600;
                    cursor: pointer;

                    &:hover {
                        color: var(--bs-primary);
                    }
                }

                .author-username {
                    color: var(--bs-secondary);
                    font-size: 0.875rem;
                }
            }

            .post-time {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                time {
                    color: var(--bs-secondary);
                    font-size: 0.875rem;
                    cursor: pointer;

                    &:hover {
                        text-decoration: underline;
                    }
                }

                .edited-indicator {
                    color: var(--bs-secondary);
                    font-size: 0.75rem;
                }
            }
        }

        .post-actions-menu {
            .btn-link {
                color: var(--bs-secondary);

                &:hover {
                    color: var(--bs-body-color);
                }
            }
        }
    }

    .post-content {
        margin-bottom: 1rem;

        .post-text {
            line-height: 1.6;
            margin-bottom: 1rem;

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

            :deep(.external-link) {
                color: var(--bs-primary);
                text-decoration: none;

                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }

    .comments-preview {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid var(--bs-border-color);

        .latest-comments {
            margin-top: 0.75rem;

            .comment-preview {
                display: flex;
                align-items: flex-start;
                gap: 0.5rem;
                margin-bottom: 0.5rem;

                .comment-content {
                    flex: 1;
                    min-width: 0;

                    .comment-author {
                        font-weight: 600;
                        margin-right: 0.5rem;
                    }

                    .comment-text {
                        color: var(--bs-body-color);
                    }
                }
            }
        }
    }
}
</style>