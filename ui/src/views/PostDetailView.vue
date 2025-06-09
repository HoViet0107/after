<template>
    <div class="post-detail-view">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8">
                    <!-- Loading State -->
                    <div v-if="loading.post" class="loading-skeleton">
                        <div class="skeleton-header"></div>
                        <div class="skeleton-content"></div>
                        <div class="skeleton-actions"></div>
                    </div>

                    <!-- Post Content -->
                    <div v-else-if="post" class="post-detail-card">
                        <!-- Post Header -->
                        <div class="post-header">
                            <UserAvatar :user="post.author" :size="48" />
                            <div class="post-author-info">
                                <router-link :to="`/app/profile/${post.author.id}`" class="author-name">
                                    {{ post.author.name }}
                                </router-link>
                                <div class="post-meta">
                                    <span class="post-time">{{ formatTime(post.createdAt) }}</span>
                                    <span v-if="post.location" class="post-location">
                                        <i class="fas fa-map-marker-alt me-1"></i>
                                        {{ post.location }}
                                    </span>
                                </div>
                            </div>
                            <div class="post-actions ms-auto">
                                <div class="dropdown">
                                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle"
                                        data-bs-toggle="dropdown">
                                        <i class="fas fa-ellipsis-h"></i>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li v-if="isOwnPost">
                                            <button class="dropdown-item" @click="editPost">
                                                <i class="fas fa-edit me-2"></i>
                                                Chỉnh sửa
                                            </button>
                                        </li>
                                        <li v-if="isOwnPost">
                                            <button class="dropdown-item text-danger" @click="deletePost">
                                                <i class="fas fa-trash me-2"></i>
                                                Xóa bài viết
                                            </button>
                                        </li>
                                        <li v-else>
                                            <button class="dropdown-item" @click="reportPost">
                                                <i class="fas fa-flag me-2"></i>
                                                Báo cáo
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <!-- Post Content -->
                        <div class="post-content">
                            <div v-if="post.content" class="post-text">
                                <p v-html="formattedContent"></p>
                            </div>

                            <!-- Post Media -->
                            <div v-if="post.media && post.media.length > 0" class="post-media">
                                <MediaGallery :media="post.media" @view="viewMedia" />
                            </div>

                            <!-- Poll -->
                            <div v-if="post.poll" class="post-poll">
                                <PollWidget :poll="post.poll" @vote="handlePollVote" />
                            </div>

                            <!-- Link Preview -->
                            <div v-if="post.linkPreview" class="post-link">
                                <LinkPreview :link="post.linkPreview" />
                            </div>
                        </div>

                        <!-- Post Stats -->
                        <div class="post-stats">
                            <div class="stats-row">
                                <button class="stat-item" @click="showLikesModal = true">
                                    <span class="stat-count">{{ formatNumber(post.likesCount) }}</span>
                                    <span class="stat-label">lượt thích</span>
                                </button>
                                <span class="stat-item">
                                    <span class="stat-count">{{ formatNumber(post.commentsCount) }}</span>
                                    <span class="stat-label">bình luận</span>
                                </span>
                                <span class="stat-item">
                                    <span class="stat-count">{{ formatNumber(post.sharesCount) }}</span>
                                    <span class="stat-label">chia sẻ</span>
                                </span>
                            </div>
                        </div>

                        <!-- Post Actions -->
                        <div class="post-actions-bar">
                            <button class="action-btn" :class="{ active: post.isLiked }" @click="toggleLike">
                                <i :class="post.isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
                                <span>Thích</span>
                            </button>
                            <button class="action-btn" @click="focusCommentInput">
                                <i class="far fa-comment"></i>
                                <span>Bình luận</span>
                            </button>
                            <button class="action-btn" @click="sharePost">
                                <i class="far fa-share-square"></i>
                                <span>Chia sẻ</span>
                            </button>
                            <button class="action-btn" @click="toggleSave">
                                <i :class="post.isSaved ? 'fas fa-bookmark' : 'far fa-bookmark'"></i>
                                <span>Lưu</span>
                            </button>
                        </div>
                    </div>

                    <!-- Comments Section -->
                    <div v-if="post" class="comments-section">
                        <div class="comments-header">
                            <h5>Bình luận ({{ formatNumber(post.commentsCount) }})</h5>
                            <div class="comments-sort">
                                <select v-model="commentsSort" class="form-select form-select-sm"
                                    @change="loadComments(true)">
                                    <option value="newest">Mới nhất</option>
                                    <option value="oldest">Cũ nhất</option>
                                    <option value="popular">Phổ biến</option>
                                </select>
                            </div>
                        </div>

                        <!-- Comment Input -->
                        <div class="comment-input-section">
                            <CommentInput ref="commentInputRef" :post-id="post.id" :reply-to="replyToComment"
                                @submit="handleCommentSubmit" @cancel-reply="replyToComment = null" />
                        </div>

                        <!-- Comments List -->
                        <div class="comments-list">
                            <div v-if="loading.comments" class="loading-skeleton">
                                <div v-for="i in 5" :key="i" class="skeleton-comment"></div>
                            </div>

                            <div v-else-if="comments.length === 0" class="empty-comments">
                                <i class="far fa-comments fa-3x text-muted"></i>
                                <h6 class="mt-3">Chưa có bình luận nào</h6>
                                <p class="text-muted">Hãy là người đầu tiên bình luận về bài viết này</p>
                            </div>

                            <div v-else>
                                <CommentItem v-for="comment in comments" :key="comment.id" :comment="comment"
                                    :post-id="post.id" @like="handleCommentLike" @reply="handleCommentReply"
                                    @edit="handleCommentEdit" @delete="handleCommentDelete" />

                                <!-- Load More Comments -->
                                <div v-if="hasMoreComments" class="load-more-comments">
                                    <button class="btn btn-outline-primary w-100" :disabled="loading.moreComments"
                                        @click="loadMoreComments">
                                        <i v-if="loading.moreComments" class="fas fa-spinner fa-spin me-2"></i>
                                        {{ loading.moreComments ? 'Đang tải...' : 'Tải thêm bình luận' }}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Error State -->
                    <div v-else-if="!loading.post" class="error-state">
                        <i class="fas fa-exclamation-triangle fa-3x text-muted"></i>
                        <h5 class="mt-3">Không tìm thấy bài viết</h5>
                        <p class="text-muted">Bài viết có thể đã bị xóa hoặc bạn không có quyền truy cập</p>
                        <router-link to="/app/feed" class="btn btn-primary">
                            Quay về trang chủ
                        </router-link>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <ShareModal v-if="showShareModal" :post="post" @close="showShareModal = false" @shared="handlePostShared" />

        <LikesModal v-if="showLikesModal" :post-id="postId" @close="showLikesModal = false" />

        <MediaViewerModal v-if="showMediaViewer" :media="currentMedia" :media-list="post?.media"
            @close="showMediaViewer = false" @navigate="navigateMedia" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAppStores } from '@/composables/useAppStores'
import { useLoadingStates } from '@/composables/useLoadingStates'
import { formatNumber, formatTime, linkifyText } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'
import MediaGallery from '@/components/media/MediaGallery.vue'
import PollWidget from '@/components/post/PollWidget.vue'
import LinkPreview from '@/components/post/LinkPreview.vue'
import CommentInput from '@/components/comment/CommentInput.vue'
import CommentItem from '@/components/comment/CommentItem.vue'
import ShareModal from '@/components/modals/ShareModal.vue'
import LikesModal from '@/components/modals/LikesModal.vue'
import MediaViewerModal from '@/components/modals/MediaViewerModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { authStore, postStore, commentStore } = useAppStores()
const { loading, setLoading } = useLoadingStates(['post', 'comments', 'moreComments'])

// Refs
const commentInputRef = ref(null)

// State
const post = ref(null)
const comments = ref([])
const replyToComment = ref(null)
const commentsSort = ref('newest')
const currentMedia = ref(null)
const hasMoreComments = ref(true)
const commentsPage = ref(1)

// Modal states
const showShareModal = ref(false)
const showLikesModal = ref(false)
const showMediaViewer = ref(false)

// Computed
const postId = computed(() => route.params.postId)
const currentUser = computed(() => authStore.user)
const isOwnPost = computed(() => post.value?.author.id === currentUser.value?.id)

const formattedContent = computed(() => {
    if (!post.value?.content) return ''
    return linkifyText(post.value.content)
})

// Methods
const loadPost = async () => {
    setLoading('post', true)
    try {
        const response = await postStore.getPost(postId.value)
        post.value = response.data
    } catch (error) {
        console.error('Load post error:', error)
        if (error.response?.status === 404) {
            post.value = null
        }
    } finally {
        setLoading('post', false)
    }
}

const loadComments = async (refresh = false) => {
    if (refresh) {
        commentsPage.value = 1
        hasMoreComments.value = true
    }

    setLoading('comments', true)
    try {
        const response = await commentStore.getPostComments(postId.value, {
            sort: commentsSort.value,
            page: commentsPage.value,
            limit: 20
        })

        if (refresh) {
            comments.value = response.data
        } else {
            comments.value.push(...response.data)
        }

        hasMoreComments.value = response.hasMore

    } catch (error) {
        console.error('Load comments error:', error)
    } finally {
        setLoading('comments', false)
    }
}

const loadMoreComments = async () => {
    if (loading.moreComments || !hasMoreComments.value) return

    setLoading('moreComments', true)
    commentsPage.value++

    try {
        const response = await commentStore.getPostComments(postId.value, {
            sort: commentsSort.value,
            page: commentsPage.value,
            limit: 20
        })

        comments.value.push(...response.data)
        hasMoreComments.value = response.hasMore

    } catch (error) {
        console.error('Load more comments error:', error)
        commentsPage.value-- // Rollback
    } finally {
        setLoading('moreComments', false)
    }
}

const toggleLike = async () => {
    if (!post.value) return

    try {
        post.value.isLiked = !post.value.isLiked
        post.value.likesCount += post.value.isLiked ? 1 : -1

        await postStore.toggleLike(post.value.id)

    } catch (error) {
        console.error('Toggle like error:', error)
        // Revert optimistic update
        post.value.isLiked = !post.value.isLiked
        post.value.likesCount += post.value.isLiked ? 1 : -1
        toast.error('Có lỗi xảy ra')
    }
}

const toggleSave = async () => {
    if (!post.value) return

    try {
        post.value.isSaved = !post.value.isSaved

        await postStore.toggleSave(post.value.id)

        toast.success(post.value.isSaved ? 'Đã lưu bài viết' : 'Đã bỏ lưu bài viết')

    } catch (error) {
        console.error('Toggle save error:', error)
        // Revert optimistic update
        post.value.isSaved = !post.value.isSaved
        toast.error('Có lỗi xảy ra')
    }
}

const sharePost = () => {
    showShareModal.value = true
}

const handlePostShared = () => {
    if (post.value) {
        post.value.sharesCount++
    }
    showShareModal.value = false
    toast.success('Chia sẻ thành công')
}

const editPost = () => {
    router.push(`/app/post/${post.value.id}/edit`)
}

const deletePost = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return

    try {
        await postStore.deletePost(post.value.id)
        toast.success('Đã xóa bài viết')
        router.push('/app/feed')
    } catch (error) {
        console.error('Delete post error:', error)
        toast.error('Không thể xóa bài viết')
    }
}

const reportPost = () => {
    // Implement report functionality
    toast.info('Cảm ơn báo cáo của bạn. Chúng tôi sẽ xem xét.')
}

const viewMedia = (media, index) => {
    currentMedia.value = { media, index }
    showMediaViewer.value = true
}

const navigateMedia = (direction) => {
    const mediaList = post.value?.media || []
    const currentIndex = currentMedia.value.index
    let newIndex

    if (direction === 'next') {
        newIndex = currentIndex < mediaList.length - 1 ? currentIndex + 1 : 0
    } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : mediaList.length - 1
    }

    currentMedia.value = { media: mediaList[newIndex], index: newIndex }
}

const handlePollVote = async (optionId) => {
    try {
        await postStore.votePoll(post.value.id, optionId)
        // Reload post to get updated poll data
        await loadPost()
        toast.success('Đã bình chọn')
    } catch (error) {
        console.error('Poll vote error:', error)
        toast.error('Có lỗi xảy ra')
    }
}

const focusCommentInput = () => {
    nextTick(() => {
        commentInputRef.value?.focus()
    })
}

const handleCommentSubmit = (newComment) => {
    comments.value.unshift(newComment)
    if (post.value) {
        post.value.commentsCount++
    }
    replyToComment.value = null
}

const handleCommentLike = async (commentId) => {
    try {
        const comment = comments.value.find(c => c.id === commentId)
        if (comment) {
            comment.isLiked = !comment.isLiked
            comment.likesCount += comment.isLiked ? 1 : -1
        }

        await commentStore.toggleLike(commentId)

    } catch (error) {
        console.error('Comment like error:', error)
        // Revert optimistic update
        const comment = comments.value.find(c => c.id === commentId)
        if (comment) {
            comment.isLiked = !comment.isLiked
            comment.likesCount += comment.isLiked ? 1 : -1
        }
    }
}

const handleCommentReply = (comment) => {
    replyToComment.value = comment
    focusCommentInput()
}

const handleCommentEdit = (comment) => {
    // Implement comment editing
    console.log('Edit comment:', comment)
}

const handleCommentDelete = async (commentId) => {
    if (!confirm('Bạn có chắc chắn muốn xóa bình luận này?')) return

    try {
        await commentStore.deleteComment(commentId)
        comments.value = comments.value.filter(c => c.id !== commentId)
        if (post.value) {
            post.value.commentsCount--
        }
        toast.success('Đã xóa bình luận')
    } catch (error) {
        console.error('Delete comment error:', error)
        toast.error('Không thể xóa bình luận')
    }
}

// Watchers
watch(() => route.params.postId, (newPostId) => {
    if (newPostId && newPostId !== postId.value) {
        // Reset state when switching posts
        post.value = null
        comments.value = []
        replyToComment.value = null
        commentsPage.value = 1
        hasMoreComments.value = true

        // Load new post
        loadPost()
    }
})

// Lifecycle
onMounted(async () => {
    await loadPost()
    if (post.value) {
        await loadComments(true)
    }
})
</script>

<style lang="scss" scoped>
.post-detail-view {
    min-height: 100vh;
    background: #f8f9fa;
    padding: 2rem 0;
}

.post-detail-card {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
    margin-bottom: 2rem;
}

.post-header {
    display: flex;
    align-items: flex-start;
    padding: 1.5rem;
    border-bottom: 1px solid #f8f9fa;

    .post-author-info {
        margin-left: 0.75rem;
        flex: 1;

        .author-name {
            font-weight: 600;
            color: #333;
            text-decoration: none;

            &:hover {
                color: #007bff;
            }
        }

        .post-meta {
            display: flex;
            align-items: center;
            gap: 1rem;
            margin-top: 0.25rem;

            .post-time {
                color: #6c757d;
                font-size: 0.9rem;
            }

            .post-location {
                color: #6c757d;
                font-size: 0.9rem;
            }
        }
    }
}

.post-content {
    padding: 1.5rem;

    .post-text {
        margin-bottom: 1.5rem;
        line-height: 1.6;

        p {
            margin: 0;
        }
    }

    .post-media,
    .post-poll,
    .post-link {
        margin-bottom: 1rem;
    }
}

.post-stats {
    padding: 0 1.5rem;
    border-bottom: 1px solid #f8f9fa;

    .stats-row {
        display: flex;
        gap: 2rem;
        padding: 0.75rem 0;

        .stat-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #6c757d;
            font-size: 0.9rem;
            background: none;
            border: none;
            cursor: pointer;

            &:hover {
                color: #495057;
            }

            .stat-count {
                font-weight: 600;
            }
        }
    }
}

.post-actions-bar {
    display: flex;
    padding: 0.75rem 1.5rem;

    .action-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        border: none;
        background: none;
        color: #6c757d;
        border-radius: 0.5rem;
        transition: all 0.2s ease;
        font-weight: 500;

        &:hover {
            background: #f8f9fa;
            color: #495057;
        }

        &.active {
            color: #dc3545;

            &:hover {
                color: #c82333;
            }
        }

        i {
            font-size: 1.1rem;
        }
    }
}

.comments-section {
    background: white;
    border-radius: 0.75rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
}

.comments-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 1.5rem 1rem;
    border-bottom: 1px solid #f8f9fa;

    h5 {
        margin: 0;
        font-weight: 600;
    }

    .comments-sort {
        .form-select {
            min-width: 120px;
        }
    }
}

.comment-input-section {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid #f8f9fa;
}

.comments-list {
    padding: 1rem 1.5rem 1.5rem;
}

.empty-comments {
    text-align: center;
    padding: 3rem 2rem;
    color: #6c757d;
}

.error-state {
    background: white;
    border-radius: 0.75rem;
    padding: 4rem 2rem;
    text-align: center;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    border: 1px solid #e9ecef;
}

.loading-skeleton {

    .skeleton-header,
    .skeleton-content,
    .skeleton-actions,
    .skeleton-comment {
        background: #f8f9fa;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        animation: pulse 1.5s ease-in-out infinite alternate;
    }

    .skeleton-header {
        height: 80px;
    }

    .skeleton-content {
        height: 200px;
    }

    .skeleton-actions {
        height: 60px;
    }

    .skeleton-comment {
        height: 100px;
    }
}

@keyframes pulse {
    0% {
        opacity: 1;
    }

    100% {
        opacity: 0.5;
    }
}

@media (max-width: 768px) {
    .post-detail-view {
        padding: 1rem 0;
    }

    .post-header,
    .post-content,
    .comments-header,
    .comment-input-section,
    .comments-list {
        padding-left: 1rem;
        padding-right: 1rem;
    }

    .post-stats .stats-row {
        gap: 1rem;
    }

    .post-actions-bar {
        flex-wrap: wrap;
        gap: 0.5rem;

        .action-btn {
            flex: 1;
            justify-content: center;
            min-width: 0;
        }
    }

    .comments-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
    }
}
</style>