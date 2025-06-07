<template>
    <div class="post-card" :class="{ 'shared-post': post.isShared }">
        <!-- Shared Post Header -->
        <div v-if="post.isShared" class="shared-header">
            <i class="fas fa-share text-muted me-2"></i>
            <span class="text-muted">
                <router-link :to="`/app/profile/${post.sharedBy.id}`" class="text-decoration-none">
                    {{ post.sharedBy.firstName }} {{ post.sharedBy.lastName }}
                </router-link>
                đã chia sẻ
            </span>
            <span class="text-muted ms-2">{{ formatTime(post.sharedAt) }}</span>
        </div>

        <!-- Post Header -->
        <div class="post-header">
            <div class="author-info">
                <router-link :to="`/app/profile/${post.author.id}`" class="author-avatar">
                    <img :src="post.author.avatar || '/default-avatar.png'"
                        :alt="post.author.firstName + ' ' + post.author.lastName" @error="handleAvatarError" />
                    <div v-if="isAuthorOnline" class="online-indicator" title="Đang online"></div>
                </router-link>

                <div class="author-details">
                    <div class="author-name">
                        <router-link :to="`/app/profile/${post.author.id}`" class="text-decoration-none">
                            {{ post.author.firstName }} {{ post.author.lastName }}
                        </router-link>
                        <i v-if="post.author.isVerified" class="fas fa-check-circle text-primary ms-1"
                            title="Đã xác minh"></i>
                    </div>
                    <div class="post-meta">
                        <router-link :to="`/app/post/${post.id}`" class="post-time text-muted text-decoration-none">
                            {{ formatTime(post.createdAt) }}
                        </router-link>
                        <span v-if="post.isEdited" class="text-muted ms-1">(đã chỉnh sửa)</span>
                        <i v-if="post.visibility === 'private'" class="fas fa-lock text-muted ms-2"
                            title="Riêng tư"></i>
                        <i v-else-if="post.visibility === 'friends'" class="fas fa-user-friends text-muted ms-2"
                            title="Bạn bè"></i>
                    </div>
                </div>
            </div>

            <div class="post-actions">
                <div class="dropdown">
                    <button class="btn btn-sm btn-ghost" type="button" data-bs-toggle="dropdown" @click.stop>
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
                        <li v-if="!isOwnPost">
                            <a class="dropdown-item" href="#" @click="handleReport">
                                <i class="fas fa-flag me-2"></i>Báo cáo
                            </a>
                        </li>
                        <li v-if="!isOwnPost">
                            <a class="dropdown-item" href="#" @click="handleHide">
                                <i class="fas fa-eye-slash me-2"></i>Ẩn bài viết
                            </a>
                        </li>
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" @click="copyPostLink">
                                <i class="fas fa-link me-2"></i>Sao chép liên kết
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <!-- Post Content -->
        <div class="post-content">
            <!-- Text Content -->
            <div v-if="post.content" class="post-text">
                <PostContent :content="post.content" :expanded="isExpanded" />
                <button v-if="post.content.length > 300 && !isExpanded" class="btn btn-link btn-sm p-0 mt-1"
                    @click="toggleExpanded">
                    Xem thêm
                </button>
                <button v-if="post.content.length > 300 && isExpanded" class="btn btn-link btn-sm p-0 mt-1"
                    @click="toggleExpanded">
                    Thu gọn
                </button>
            </div>

            <!-- Media Attachments -->
            <div v-if="hasMedia" class="post-media">
                <PostMedia :attachments="post.attachments" :post-id="post.id" @media-click="handleMediaClick" />
            </div>

            <!-- Shared Post Content (if this is a shared post) -->
            <div v-if="post.originalPost" class="shared-post-content">
                <PostCard :post="post.originalPost" :is-nested="true" @like="$emit('like', $event)"
                    @comment="$emit('comment', $event)" @share="$emit('share', $event)" />
            </div>

            <!-- Poll (if post has poll) -->
            <div v-if="post.poll" class="post-poll">
                <PostPoll :poll="post.poll" :post-id="post.id" @vote="handlePollVote" />
            </div>

            <!-- Location -->
            <div v-if="post.location" class="post-location">
                <i class="fas fa-map-marker-alt text-muted me-1"></i>
                <span class="text-muted">{{ post.location.name }}</span>
            </div>
        </div>

        <!-- Post Stats -->
        <div v-if="!isNested" class="post-stats">
            <div class="stats-row">
                <div v-if="post.likesCount > 0" class="stat-item likes-stat" @click="showLikesList">
                    <div class="reactions-preview">
                        <i class="fas fa-heart text-danger"></i>
                        <i v-if="hasMultipleReactions" class="fas fa-thumbs-up text-primary"></i>
                    </div>
                    <span class="stat-count">{{ formatCount(post.likesCount) }}</span>
                </div>

                <div class="stats-right">
                    <div v-if="post.commentsCount > 0" class="stat-item comments-stat" @click="focusCommentInput">
                        {{ formatCount(post.commentsCount) }} bình luận
                    </div>
                    <div v-if="post.sharesCount > 0" class="stat-item shares-stat">
                        {{ formatCount(post.sharesCount) }} chia sẻ
                    </div>
                </div>
            </div>
        </div>

        <!-- Post Actions -->
        <div v-if="!isNested" class="post-interactions">
            <div class="interaction-buttons">
                <button class="interaction-btn" :class="{ 'liked': post.isLiked }" @click="handleLike"
                    :disabled="isLiking">
                    <i class="fas fa-heart"></i>
                    <span>{{ post.isLiked ? 'Đã thích' : 'Thích' }}</span>
                </button>

                <button class="interaction-btn" @click="toggleComments">
                    <i class="fas fa-comment"></i>
                    <span>Bình luận</span>
                </button>

                <button class="interaction-btn" @click="handleShare">
                    <i class="fas fa-share"></i>
                    <span>Chia sẻ</span>
                </button>

                <button class="interaction-btn" @click="handleSave" :class="{ 'saved': post.isSaved }">
                    <i :class="post.isSaved ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
                    <span>{{ post.isSaved ? 'Đã lưu' : 'Lưu' }}</span>
                </button>
            </div>
        </div>

        <!-- Comments Section -->
        <div v-if="showComments && !isNested" class="comments-section">
            <!-- Comment Input -->
            <div class="comment-input-wrapper">
                <div class="comment-input">
                    <img :src="currentUser?.avatar || '/default-avatar.png'" alt="Your avatar" class="comment-avatar" />
                    <div class="comment-form">
                        <textarea ref="commentInput" v-model="newComment" class="form-control"
                            placeholder="Viết bình luận..." rows="1" @keydown="handleCommentKeydown"
                            @input="autoResizeTextarea"></textarea>
                        <div class="comment-actions">
                            <button class="btn btn-primary btn-sm" @click="submitComment"
                                :disabled="!newComment.trim() || isCommenting">
                                <span v-if="isCommenting" class="spinner-border spinner-border-sm me-1"></span>
                                Gửi
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Comments List -->
            <div v-if="comments.length > 0" class="comments-list">
                <CommentList :comments="comments" :post-id="post.id" @reply="handleCommentReply"
                    @like="handleCommentLike" @delete="handleCommentDelete" />

                <!-- Load More Comments -->
                <div v-if="hasMoreComments" class="load-more-comments">
                    <button class="btn btn-outline-secondary btn-sm" @click="loadMoreComments"
                        :disabled="isLoadingComments">
                        <span v-if="isLoadingComments" class="spinner-border spinner-border-sm me-1"></span>
                        Xem thêm bình luận
                    </button>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <MediaModal v-if="showMediaModal" :media="selectedMedia" :attachments="post.attachments"
            @close="closeMediaModal" @previous="previousMedia" @next="nextMedia" />

        <ShareModal v-if="showShareModal" :post="post" @close="closeShareModal" @shared="handleShared" />

        <LikesModal v-if="showLikesModal" :post-id="post.id" @close="closeLikesModal" />
    </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted } from 'vue'
import { usePostStore } from '@/stores/post'
import { useAuthStore } from '@/stores/auth'
import { usePresenceStore } from '@/stores/presence'
import { useToast } from 'vue-toastification'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import PostContent from '@/components/post/PostContent.vue'
import PostMedia from '@/components/post/PostMedia.vue'
import PostPoll from '@/components/post/PostPoll.vue'
import CommentList from '@/components/comment/CommentList.vue'
import MediaModal from '@/components/common/MediaModal.vue'
import ShareModal from '@/components/post/ShareModal.vue'
import LikesModal from '@/components/post/LikesModal.vue'

// Props
const props = defineProps({
    post: {
        type: Object,
        required: true
    },
    isNested: {
        type: Boolean,
        default: false
    },
    showComments: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits([
    'like',
    'comment',
    'share',
    'edit',
    'delete',
    'report',
    'hide'
])

// Dependencies
const postStore = usePostStore()
const authStore = useAuthStore()
const presenceStore = usePresenceStore()
const toast = useToast()

// Refs
const commentInput = ref(null)

// State
const isExpanded = ref(false)
const showComments = ref(props.showComments)
const newComment = ref('')
const comments = ref([])
const isLiking = ref(false)
const isCommenting = ref(false)
const isLoadingComments = ref(false)
const hasMoreComments = ref(false)
const selectedMedia = ref(null)
const showMediaModal = ref(false)
const showShareModal = ref(false)
const showLikesModal = ref(false)

// Computed
const currentUser = computed(() => authStore.userProfile)
const isOwnPost = computed(() => props.post.author.id === authStore.userId)
const canEdit = computed(() => isOwnPost.value && !props.post.isShared)
const canDelete = computed(() => isOwnPost.value)
const hasMedia = computed(() => props.post.attachments && props.post.attachments.length > 0)
const hasMultipleReactions = computed(() => {
    // Check if post has multiple types of reactions
    return props.post.reactions && Object.keys(props.post.reactions).length > 1
})

const isAuthorOnline = computed(() => {
    return presenceStore.isUserOnline(props.post.author.id)
})

// Methods
const toggleExpanded = () => {
    isExpanded.value = !isExpanded.value
}

const toggleComments = () => {
    showComments.value = !showComments.value
    if (showComments.value && comments.value.length === 0) {
        loadComments()
    }
    if (showComments.value) {
        nextTick(() => {
            commentInput.value?.focus()
        })
    }
}

const handleLike = async () => {
    if (isLiking.value) return

    isLiking.value = true
    try {
        if (props.post.isLiked) {
            await postStore.unlikePost(props.post.id)
        } else {
            await postStore.likePost(props.post.id)
        }
        emit('like', props.post.id)
    } catch (error) {
        console.error('Failed to toggle like:', error)
    } finally {
        isLiking.value = false
    }
}

const handleShare = () => {
    showShareModal.value = true
}

const handleSave = async () => {
    try {
        // Implementation for save/unsave post
        toast.success(props.post.isSaved ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết')
    } catch (error) {
        toast.error('Không thể lưu bài viết')
    }
}

const handleEdit = () => {
    emit('edit', props.post)
}

const handleDelete = () => {
    if (confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
        emit('delete', props.post.id)
    }
}

const handleReport = () => {
    emit('report', props.post.id)
}

const handleHide = () => {
    emit('hide', props.post.id)
}

const handleMediaClick = (media, index) => {
    selectedMedia.value = { ...media, index }
    showMediaModal.value = true
}

const closeMediaModal = () => {
    showMediaModal.value = false
    selectedMedia.value = null
}

const previousMedia = () => {
    if (selectedMedia.value.index > 0) {
        const newIndex = selectedMedia.value.index - 1
        selectedMedia.value = {
            ...props.post.attachments[newIndex],
            index: newIndex
        }
    }
}

const nextMedia = () => {
    if (selectedMedia.value.index < props.post.attachments.length - 1) {
        const newIndex = selectedMedia.value.index + 1
        selectedMedia.value = {
            ...props.post.attachments[newIndex],
            index: newIndex
        }
    }
}

const closeShareModal = () => {
    showShareModal.value = false
}

const handleShared = () => {
    showShareModal.value = false
    emit('share', props.post.id)
}

const showLikesList = () => {
    showLikesModal.value = true
}

const closeLikesModal = () => {
    showLikesModal.value = false
}

// Comment handling
const loadComments = async () => {
    isLoadingComments.value = true
    try {
        // Load comments from API
        const result = await postStore.getPostComments(props.post.id)
        if (result.success) {
            comments.value = result.data
        }
    } catch (error) {
        console.error('Failed to load comments:', error)
    } finally {
        isLoadingComments.value = false
    }
}

const submitComment = async () => {
    if (!newComment.value.trim() || isCommenting.value) return

    isCommenting.value = true
    try {
        const result = await postStore.addComment(props.post.id, {
            content: newComment.value.trim()
        })

        if (result.success) {
            comments.value.push(result.data)
            newComment.value = ''
            emit('comment', props.post.id)

            // Reset textarea height
            nextTick(() => {
                if (commentInput.value) {
                    commentInput.value.style.height = 'auto'
                }
            })
        }
    } catch (error) {
        console.error('Failed to submit comment:', error)
    } finally {
        isCommenting.value = false
    }
}

const handleCommentKeydown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        submitComment()
    }
}

const autoResizeTextarea = () => {
    nextTick(() => {
        if (commentInput.value) {
            commentInput.value.style.height = 'auto'
            commentInput.value.style.height = commentInput.value.scrollHeight + 'px'
        }
    })
}

const handleCommentReply = (comment) => {
    newComment.value = `@${comment.author.username} `
    nextTick(() => {
        commentInput.value?.focus()
    })
}

const handleCommentLike = (commentId) => {
    // Handle comment like
}

const handleCommentDelete = (commentId) => {
    comments.value = comments.value.filter(c => c.id !== commentId)
}

const loadMoreComments = async () => {
    // Load more comments
}

const focusCommentInput = () => {
    if (!showComments.value) {
        toggleComments()
    } else {
        commentInput.value?.focus()
    }
}

const handlePollVote = (pollData) => {
    // Handle poll vote
    emit('poll-vote', pollData)
}

// Utility functions
const formatTime = (timestamp) => {
    return formatDistanceToNow(new Date(timestamp), {
        addSuffix: true,
        locale: vi
    })
}

const formatCount = (count) => {
    if (count < 1000) return count.toString()
    if (count < 1000000) return (count / 1000).toFixed(1) + 'K'
    return (count / 1000000).toFixed(1) + 'M'
}

const copyPostLink = async () => {
    try {
        const url = `${window.location.origin}/app/post/${props.post.id}`
        await navigator.clipboard.writeText(url)
        toast.success('Đã sao chép liên kết bài viết!')
    } catch (error) {
        toast.error('Không thể sao chép liên kết')
    }
}

const handleAvatarError = (event) => {
    event.target.src = '/default-avatar.png'
}

// Lifecycle
onMounted(() => {
    if (props.showComments) {
        loadComments()
    }
})
</script>

<style lang="scss" scoped>
.post-card {
    background: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 12px;
    margin-bottom: 1rem;
    transition: box-shadow 0.2s ease;

    &:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    &.shared-post {
        .post-content {
            .shared-post-content {
                margin-top: 1rem;
                padding: 1rem;
                border: 1px solid var(--bs-border-color);
                border-radius: 8px;
                background: var(--bs-gray-50);
            }
        }
    }
}

.shared-header {
    padding: 0.75rem 1rem 0;
    font-size: 0.875rem;
}

.post-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 1rem 1rem 0;
}

.author-info {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.author-avatar {
    position: relative;
    text-decoration: none;

    img {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
    }

    .online-indicator {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 14px;
        height: 14px;
        background: #28a745;
        border: 2px solid white;
        border-radius: 50%;
    }
}

.author-details {
    .author-name {
        font-weight: 600;
        margin-bottom: 0.25rem;

        a {
            color: var(--bs-dark);

            &:hover {
                text-decoration: underline !important;
            }
        }
    }

    .post-meta {
        font-size: 0.875rem;
        color: var(--bs-secondary);
    }
}

.post-actions {
    .btn-ghost {
        background: none;
        border: none;
        color: var(--bs-secondary);
        padding: 0.25rem 0.5rem;
        border-radius: 50%;

        &:hover {
            background: var(--bs-gray-100);
            color: var(--bs-dark);
        }
    }
}

.post-content {
    padding: 0 1rem;
}

.post-text {
    margin: 1rem 0;
    line-height: 1.6;
}

.post-media {
    margin: 1rem 0;
}

.post-location {
    margin-top: 0.5rem;
    font-size: 0.875rem;
}

.post-stats {
    padding: 0.75rem 1rem 0;
    border-bottom: 1px solid var(--bs-border-color);

    .stats-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .stat-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        cursor: pointer;
        font-size: 0.875rem;
        color: var(--bs-secondary);

        &:hover {
            text-decoration: underline;
        }
    }

    .stats-right {
        display: flex;
        gap: 1rem;
    }

    .reactions-preview {
        display: flex;
        gap: 0.25rem;
    }

    .likes-stat {
        .stat-count {
            font-weight: 500;
        }
    }
}

.post-interactions {
    padding: 0.5rem 1rem 1rem;

    .interaction-buttons {
        display: flex;
        gap: 0.5rem;
    }

    .interaction-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: none;
        border: none;
        border-radius: 6px;
        color: var(--bs-secondary);
        font-weight: 500;
        transition: all 0.2s ease;

        &:hover {
            background: var(--bs-gray-100);
            color: var(--bs-dark);
        }

        &.liked {
            color: var(--bs-danger);

            &:hover {
                background: var(--bs-danger-bg-subtle);
            }
        }

        &.saved {
            color: var(--bs-warning);

            &:hover {
                background: var(--bs-warning-bg-subtle);
            }
        }

        i {
            font-size: 1.1rem;
        }
    }
}

.comments-section {
    border-top: 1px solid var(--bs-border-color);
    padding: 1rem;
}

.comment-input-wrapper {
    margin-bottom: 1rem;
}

.comment-input {
    display: flex;
    gap: 0.75rem;

    .comment-avatar {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
    }

    .comment-form {
        flex: 1;

        textarea {
            border: 1px solid var(--bs-border-color);
            border-radius: 20px;
            padding: 0.5rem 1rem;
            resize: none;
            min-height: 36px;
            max-height: 120px;

            &:focus {
                border-color: var(--bs-primary);
                box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
            }
        }

        .comment-actions {
            display: flex;
            justify-content: flex-end;
            margin-top: 0.5rem;
        }
    }
}

.comments-list {
    .load-more-comments {
        text-align: center;
        margin-top: 1rem;
    }
}

// Dark theme
[data-bs-theme="dark"] {
    .post-card {
        background: var(--bs-gray-900);
        border-color: var(--bs-gray-700);

        &.shared-post .post-content .shared-post-content {
            background: var(--bs-gray-800);
        }
    }

    .author-details .author-name a {
        color: var(--bs-light);
    }

    .post-actions .btn-ghost:hover {
        background: var(--bs-gray-700);
        color: var(--bs-light);
    }

    .interaction-btn:hover {
        background: var(--bs-gray-700);
        color: var(--bs-light);
    }
}

// Mobile responsive
@media (max-width: 768px) {
    .post-card {
        border-radius: 0;
        border-left: none;
        border-right: none;
        margin-bottom: 0.5rem;
    }

    .post-header {
        padding: 0.75rem;
    }

    .author-avatar img {
        width: 40px;
        height: 40px;
    }

    .post-content {
        padding: 0 0.75rem;
    }

    .post-stats {
        padding: 0.5rem 0.75rem 0;
    }

    .post-interactions {
        padding: 0.5rem 0.75rem 0.75rem;

        .interaction-btn {
            padding: 0.5rem;
            font-size: 0.875rem;

            span {
                display: none;
            }
        }
    }

    .comments-section {
        padding: 0.75rem;
    }
}
</style>