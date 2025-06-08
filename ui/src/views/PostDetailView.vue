<!-- Post detail page với detailed view, comments và sharing features -->

<template>
    <div class="post-detail-view">
        <div class="container">
            <div class="row">
                <!-- Main Content -->
                <div class="col-lg-8">
                    <div class="post-detail-container">
                        <!-- Back Navigation -->
                        <div class="back-navigation">
                            <button class="btn btn-ghost" @click="goBack">
                                <i class="fas fa-arrow-left me-2"></i>
                                Quay lại
                            </button>
                            <div class="breadcrumb">
                                <router-link to="/feed" class="breadcrumb-item">Bảng tin</router-link>
                                <span class="breadcrumb-separator">/</span>
                                <span class="breadcrumb-current">Bài viết</span>
                            </div>
                        </div>

                        <!-- Post Content -->
                        <div v-if="isLoading" class="loading-skeleton">
                            <PostSkeleton />
                        </div>

                        <div v-else-if="post" class="post-detail-card">
                            <!-- Post Header -->
                            <div class="post-header">
                                <div class="author-info">
                                    <UserAvatar :user="post.author" size="lg" class="author-avatar" />
                                    <div class="author-details">
                                        <div class="author-name-section">
                                            <h5 class="author-name">
                                                <router-link :to="`/profile/${post.author.username || post.author.id}`">
                                                    {{ post.author.name }}
                                                </router-link>
                                                <i v-if="post.author.isVerified" class="fas fa-check-circle verified-badge" 
                                                   title="Đã xác minh"></i>
                                            </h5>
                                            <div class="post-meta">
                                                <span class="post-time" :title="formatFullDate(post.createdAt)">
                                                    {{ formatTimeAgo(post.createdAt) }}
                                                </span>
                                                <span v-if="post.location" class="post-location">
                                                    <i class="fas fa-map-marker-alt me-1"></i>
                                                    {{ post.location }}
                                                </span>
                                                <span v-if="post.visibility !== 'public'" class="post-visibility">
                                                    <i :class="getVisibilityIcon(post.visibility)" class="me-1"></i>
                                                    {{ getVisibilityText(post.visibility) }}
                                                </span>
                                            </div>
                                        </div>
                                        <div class="author-actions">
                                            <button v-if="!isOwnPost && !isFollowing" class="btn btn-primary btn-sm" 
                                                    @click="followUser" :disabled="isFollowLoading">
                                                <span v-if="isFollowLoading" class="spinner-border spinner-border-sm me-1"></span>
                                                <i v-else class="fas fa-user-plus me-1"></i>
                                                Theo dõi
                                            </button>
                                            <button v-else-if="!isOwnPost && isFollowing" class="btn btn-outline-secondary btn-sm" 
                                                    @click="unfollowUser" :disabled="isFollowLoading">
                                                <span v-if="isFollowLoading" class="spinner-border spinner-border-sm me-1"></span>
                                                <i v-else class="fas fa-user-check me-1"></i>
                                                Đang theo dõi
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div class="post-options">
                                    <div class="dropdown">
                                        <button class="btn btn-ghost dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-h"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li v-if="isOwnPost"><a class="dropdown-item" href="#" @click="editPost">
                                                <i class="fas fa-edit me-2"></i>Chỉnh sửa bài viết</a></li>
                                            <li v-if="isOwnPost"><a class="dropdown-item text-danger" href="#" @click="deletePost">
                                                <i class="fas fa-trash me-2"></i>Xóa bài viết</a></li>
                                            <li v-if="!isOwnPost"><a class="dropdown-item" href="#" @click="savePost">
                                                <i class="fas fa-bookmark me-2"></i>{{ post.isSaved ? 'Bỏ lưu' : 'Lưu bài viết' }}</a></li>
                                            <li v-if="!isOwnPost"><a class="dropdown-item" href="#" @click="reportPost">
                                                <i class="fas fa-flag me-2"></i>Báo cáo bài viết</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item" href="#" @click="copyPostLink">
                                                <i class="fas fa-link me-2"></i>Sao chép liên kết</a></li>
                                            <li><a class="dropdown-item" href="#" @click="shareViaEmail">
                                                <i class="fas fa-envelope me-2"></i>Chia sẻ qua email</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Post Content -->
                            <div class="post-content">
                                <!-- Text Content -->
                                <div v-if="post.content" class="post-text">
                                    <div class="text-content" :class="{ 'expanded': isTextExpanded }">
                                        <p v-html="formatPostContent(post.content)"></p>
                                    </div>
                                    <button v-if="isTextLong" class="btn btn-link text-expand" @click="toggleTextExpansion">
                                        {{ isTextExpanded ? 'Thu gọn' : 'Xem thêm' }}
                                    </button>
                                </div>

                                <!-- Media Content -->
                                <div v-if="post.media && post.media.length > 0" class="post-media">
                                    <MediaGallery :media="post.media" :post-id="post.id" 
                                                  @view="viewMedia" @download="downloadMedia" />
                                </div>

                                <!-- Poll -->
                                <div v-if="post.poll" class="post-poll">
                                    <PollWidget :poll="post.poll" :can-vote="!isOwnPost" 
                                                @vote="handlePollVote" />
                                </div>

                                <!-- Link Preview -->
                                <div v-if="post.linkPreview" class="link-preview">
                                    <LinkPreview :preview="post.linkPreview" @click="openLink" />
                                </div>

                                <!-- Tags -->
                                <div v-if="post.tags && post.tags.length > 0" class="post-tags">
                                    <span v-for="tag in post.tags" :key="tag" class="tag" 
                                          @click="searchTag(tag)">#{{ tag }}</span>
                                </div>
                            </div>

                            <!-- Post Stats -->
                            <div class="post-stats">
                                <div class="stats-left">
                                    <div v-if="post.likesCount > 0" class="stat-item likes-stat" @click="showLikes">
                                        <div class="reaction-icons">
                                            <i class="fas fa-heart text-danger"></i>
                                            <i class="fas fa-thumbs-up text-primary"></i>
                                        </div>
                                        <span class="stat-text">{{ formatNumber(post.likesCount) }}</span>
                                    </div>
                                </div>
                                <div class="stats-right">
                                    <div v-if="post.commentsCount > 0" class="stat-item" @click="focusCommentInput">
                                        <span class="stat-text">{{ formatNumber(post.commentsCount) }} bình luận</span>
                                    </div>
                                    <div v-if="post.sharesCount > 0" class="stat-item">
                                        <span class="stat-text">{{ formatNumber(post.sharesCount) }} lượt chia sẻ</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Post Actions -->
                            <div class="post-actions">
                                <div class="action-buttons">
                                    <button class="action-btn like-btn" :class="{ 'active': post.isLiked }" 
                                            @click="toggleLike">
                                        <i :class="post.isLiked ? 'fas fa-heart' : 'far fa-heart'"></i>
                                        <span>{{ post.isLiked ? 'Đã thích' : 'Thích' }}</span>
                                    </button>
                                    <button class="action-btn comment-btn" @click="focusCommentInput">
                                        <i class="far fa-comment"></i>
                                        <span>Bình luận</span>
                                    </button>
                                    <button class="action-btn share-btn" @click="showShareModal">
                                        <i class="fas fa-share"></i>
                                        <span>Chia sẻ</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Comments Section -->
                        <div class="comments-section">
                            <!-- Comments Header -->
                            <div class="comments-header">
                                <h5 class="comments-title">
                                    Bình luận ({{ post?.commentsCount || 0 }})
                                </h5>
                                <div class="comments-sort">
                                    <div class="dropdown">
                                        <button class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                                                type="button" data-bs-toggle="dropdown">
                                            <i class="fas fa-sort me-1"></i>
                                            {{ getSortText(commentSort) }}
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" @click="setCommentSort('newest')"
                                                   :class="{ active: commentSort === 'newest' }">Mới nhất</a></li>
                                            <li><a class="dropdown-item" href="#" @click="setCommentSort('oldest')"
                                                   :class="{ active: commentSort === 'oldest' }">Cũ nhất</a></li>
                                            <li><a class="dropdown-item" href="#" @click="setCommentSort('popular')"
                                                   :class="{ active: commentSort === 'popular' }">Phổ biến nhất</a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            <!-- Comment Input -->
                            <div class="comment-input-section">
                                <CommentInput :post-id="postId" ref="commentInput"
                                              @submitted="handleCommentSubmitted" />
                            </div>

                            <!-- Comments List -->
                            <div class="comments-list">
                                <div v-if="isLoadingComments" class="loading-comments">
                                    <CommentSkeleton v-for="i in 3" :key="i" />
                                </div>

                                <div v-else-if="comments.length === 0" class="empty-comments">
                                    <div class="empty-content">
                                        <i class="fas fa-comments empty-icon"></i>
                                        <h6 class="empty-title">Chưa có bình luận nào</h6>
                                        <p class="empty-description">Hãy là người đầu tiên bình luận bài viết này!</p>
                                    </div>
                                </div>

                                <div v-else>
                                    <CommentItem v-for="comment in comments" :key="comment.id" 
                                                 :comment="comment" :post-id="postId"
                                                 @reply="handleCommentReply" @like="handleCommentLike"
                                                 @edit="handleCommentEdit" @delete="handleCommentDelete"
                                                 @report="handleCommentReport" />

                                    <!-- Load More Comments -->
                                    <div v-if="hasMoreComments" class="load-more-comments">
                                        <button class="btn btn-outline-primary" @click="loadMoreComments" 
                                                :disabled="isLoadingMoreComments">
                                            <span v-if="isLoadingMoreComments" class="spinner-border spinner-border-sm me-2"></span>
                                            <i v-else class="fas fa-chevron-down me-2"></i>
                                            Xem thêm bình luận
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Sidebar -->
                <div class="col-lg-4 d-none d-lg-block">
                    <div class="post-sidebar">
                        <!-- Author Profile Card -->
                        <div class="author-profile-card">
                            <div class="profile-header">
                                <UserAvatar :user="post?.author" size="xl" class="profile-avatar" />
                                <div class="profile-info">
                                    <h5 class="profile-name">{{ post?.author.name }}</h5>
                                    <p class="profile-username">@{{ post?.author.username }}</p>
                                    <p v-if="post?.author.bio" class="profile-bio">{{ post?.author.bio }}</p>
                                </div>
                            </div>
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <span class="stat-number">{{ formatNumber(post?.author.postsCount || 0) }}</span>
                                    <span class="stat-label">Bài viết</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">{{ formatNumber(post?.author.followersCount || 0) }}</span>
                                    <span class="stat-label">Người theo dõi</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-number">{{ formatNumber(post?.author.followingCount || 0) }}</span>
                                    <span class="stat-label">Đang theo dõi</span>
                                </div>
                            </div>
                            <div class="profile-actions">
                                <router-link :to="`/profile/${post?.author.username || post?.author.id}`" 
                                             class="btn btn-outline-primary w-100">
                                    <i class="fas fa-user me-2"></i>
                                    Xem hồ sơ
                                </router-link>
                            </div>
                        </div>

                        <!-- Related Posts -->
                        <div class="related-posts-card" v-if="relatedPosts.length > 0">
                            <h6 class="card-title">Bài viết liên quan</h6>
                            <div class="related-posts-list">
                                <div v-for="relatedPost in relatedPosts" :key="relatedPost.id" 
                                     class="related-post-item" @click="navigateToPost(relatedPost.id)">
                                    <div class="related-post-image" v-if="relatedPost.thumbnail">
                                        <img :src="relatedPost.thumbnail" :alt="relatedPost.title" class="img-fluid">
                                    </div>
                                    <div class="related-post-content">
                                        <h6 class="related-post-title">{{ relatedPost.title || truncateText(relatedPost.content, 50) }}</h6>
                                        <div class="related-post-meta">
                                            <span class="author">{{ relatedPost.author.name }}</span>
                                            <span class="time">{{ formatTimeAgo(relatedPost.createdAt) }}</span>
                                        </div>
                                        <div class="related-post-stats">
                                            <span class="likes"><i class="fas fa-heart"></i> {{ formatNumber(relatedPost.likesCount) }}</span>
                                            <span class="comments"><i class="fas fa-comment"></i> {{ formatNumber(relatedPost.commentsCount) }}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Trending Tags -->
                        <div class="trending-tags-card">
                            <h6 class="card-title">Tags thịnh hành</h6>
                            <div class="trending-tags-list">
                                <span v-for="tag in trendingTags" :key="tag.name" 
                                      class="trending-tag" @click="searchTag(tag.name)">
                                    #{{ tag.name }}
                                    <small class="tag-count">{{ formatNumber(tag.count) }}</small>
                                </span>
                            </div>
                        </div>

                        <!-- Share Card -->
                        <div class="share-card">
                            <h6 class="card-title">Chia sẻ bài viết</h6>
                            <div class="share-buttons">
                                <button class="share-btn facebook" @click="shareToFacebook">
                                    <i class="fab fa-facebook-f"></i>
                                    <span>Facebook</span>
                                </button>
                                <button class="share-btn twitter" @click="shareToTwitter">
                                    <i class="fab fa-twitter"></i>
                                    <span>Twitter</span>
                                </button>
                                <button class="share-btn linkedin" @click="shareToLinkedIn">
                                    <i class="fab fa-linkedin-in"></i>
                                    <span>LinkedIn</span>
                                </button>
                                <button class="share-btn copy" @click="copyPostLink">
                                    <i class="fas fa-link"></i>
                                    <span>Sao chép link</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <ShareModal v-if="showShareModal" :post="post" 
                    @close="showShareModal = false" @shared="handlePostShared" />

        <LikesModal v-if="showLikesModal" :post-id="postId" 
                    @close="showLikesModal = false" />

        <MediaViewerModal v-if="showMediaViewer" :media="currentMedia" :media-list="post.media"
                          @close="showMediaViewer = false" @navigate="navigateMedia" />

        <ReportModal v-if="showReportModal" :target-type="'post'" :target-id="postId"
                     @close="showReportModal = false" @reported="handlePostReported" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { usePostStore } from '@/stores/post'
import { useCommentStore } from '@/stores/comment'
import { useUserStore } from '@/stores/user'
import { useToast } from 'vue-toastification'
import { formatNumber, formatTime, formatDate, truncateText } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'
import PostSkeleton from '@/components/skeleton/PostSkeleton.vue'
import CommentSkeleton from '@/components/skeleton/CommentSkeleton.vue'
import MediaGallery from '@/components/media/MediaGallery.vue'
import PollWidget from '@/components/post/PollWidget.vue'
import LinkPreview from '@/components/post/LinkPreview.vue'
import CommentInput from '@/components/comment/CommentInput.vue'
import CommentItem from '@/components/comment/CommentItem.vue'
import ShareModal from '@/components/post/ShareModal.vue'
import LikesModal from '@/components/post/LikesModal.vue'
import MediaViewerModal from '@/components/media/MediaViewerModal.vue'
import ReportModal from '@/components/common/ReportModal.vue'

// Router & Stores
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const postStore = usePostStore()
const commentStore = useCommentStore()
const userStore = useUserStore()
const toast = useToast()

// Refs
const commentInput = ref(null)

// State
const post = ref(null)
const comments = ref([])
const isLoading = ref(false)
const isLoadingComments = ref(false)
const isLoadingMoreComments = ref(false)
const isFollowLoading = ref(false)
const hasMoreComments = ref(true)
const commentSort = ref('newest')
const isTextExpanded = ref(false)
const showShareModal = ref(false)
const showLikesModal = ref(false)
const showMediaViewer = ref(false)
const showReportModal = ref(false)
const currentMedia = ref(null)
const isFollowing = ref(false)

// Mock data
const relatedPosts = ref([
    {
        id: 2,
        title: 'Bài viết liên quan 1',
        content: 'Nội dung bài viết liên quan đầu tiên...',
        thumbnail: '/images/related1.jpg',
        author: { id: 2, name: 'Nguyễn Văn A' },
        createdAt: '2025-06-07T10:00:00Z',
        likesCount: 45,
        commentsCount: 12
    },
    {
        id: 3,
        title: 'Bài viết liên quan 2',
        content: 'Nội dung bài viết liên quan thứ hai...',
        thumbnail: '/images/related2.jpg',
        author: { id: 3, name: 'Trần Thị B' },
        createdAt: '2025-06-06T15:30:00Z',
        likesCount: 67,
        commentsCount: 23
    }
])

const trendingTags = ref([
    { name: 'technology', count: 1234 },
    { name: 'travel', count: 987 },
    { name: 'food', count: 756 },
    { name: 'lifestyle', count: 543 },
    { name: 'photography', count: 432 }
])

// Computed
const postId = computed(() => route.params.id)
const currentUser = computed(() => authStore.user)
const isOwnPost = computed(() => post.value?.author.id === currentUser.value?.id)
const isTextLong = computed(() => post.value?.content && post.value.content.length > 300)

// Methods
const loadPost = async () => {
    try {
        isLoading.value = true
        const postData = await postStore.getPost(postId.value)
        post.value = postData
        
        // Check if following author
        if (!isOwnPost.value) {
            isFollowing.value = await userStore.checkFollowing(postData.author.id)
        }
        
        // Load comments
        await loadComments()
        
    } catch (error) {
        console.error('Error loading post:', error)
        toast.error('Không thể tải bài viết')
        router.push('/404')
    } finally {
        isLoading.value = false
    }
}

const loadComments = async (refresh = true) => {
    try {
        isLoadingComments.value = refresh
        const commentsData = await commentStore.loadComments(postId.value, {
            page: refresh ? 0 : Math.floor(comments.value.length / 20),
            sort: commentSort.value,
            refresh
        })
        
        if (refresh) {
            comments.value = commentsData
        } else {
            comments.value.push(...commentsData)
        }
        
        hasMoreComments.value = commentsData.length === 20
        
    } catch (error) {
        console.error('Error loading comments:', error)
        if (refresh) {
            toast.error('Không thể tải bình luận')
        }
    } finally {
        isLoadingComments.value = false
    }
}

const loadMoreComments = async () => {
    if (!hasMoreComments.value || isLoadingMoreComments.value) return
    
    isLoadingMoreComments.value = true
    try {
        await loadComments(false)
    } finally {
        isLoadingMoreComments.value = false
    }
}

// Post actions
const toggleLike = async () => {
    try {
        if (post.value.isLiked) {
            await postStore.unlikePost(postId.value)
            post.value.isLiked = false
            post.value.likesCount = Math.max(0, post.value.likesCount - 1)
        } else {
            await postStore.likePost(postId.value)
            post.value.isLiked = true
            post.value.likesCount += 1
        }
    } catch (error) {
        toast.error('Không thể thực hiện thao tác')
    }
}

const editPost = () => {
    // Handle edit post
    console.log('Edit post')
}

const deletePost = async () => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return
    
    try {
        await postStore.deletePost(postId.value)
        toast.success('Đã xóa bài viết')
        router.push('/feed')
    } catch (error) {
        toast.error('Không thể xóa bài viết')
    }
}

const savePost = async () => {
    try {
        if (post.value.isSaved) {
            await postStore.unsavePost(postId.value)
            post.value.isSaved = false
            toast.success('Đã bỏ lưu bài viết')
        } else {
            await postStore.savePost(postId.value)
            post.value.isSaved = true
            toast.success('Đã lưu bài viết')
        }
    } catch (error) {
        toast.error('Không thể thực hiện thao tác')
    }
}

const reportPost = () => {
    showReportModal.value = true
}

const followUser = async () => {
    try {
        isFollowLoading.value = true
        await userStore.followUser(post.value.author.id)
        isFollowing.value = true
        post.value.author.followersCount += 1
        toast.success(`Đã theo dõi ${post.value.author.name}`)
    } catch (error) {
        toast.error('Không thể theo dõi người dùng')
    } finally {
        isFollowLoading.value = false
    }
}

const unfollowUser = async () => {
    try {
        isFollowLoading.value = true
        await userStore.unfollowUser(post.value.author.id)
        isFollowing.value = false
        post.value.author.followersCount = Math.max(0, post.value.author.followersCount - 1)
        toast.success(`Đã bỏ theo dõi ${post.value.author.name}`)
    } catch (error) {
        toast.error('Không thể bỏ theo dõi người dùng')
    } finally {
        isFollowLoading.value = false
    }
}

// Comment actions
const handleCommentSubmitted = (comment) => {
    comments.value.unshift(comment)
    post.value.commentsCount += 1
    toast.success('Đã thêm bình luận')
}

const handleCommentReply = (comment) => {
    // Handle comment reply
    console.log('Reply to comment:', comment)
}

const handleCommentLike = async (comment) => {
    try {
        if (comment.isLiked) {
            await commentStore.unlikeComment(comment.id)
            comment.isLiked = false
            comment.likesCount = Math.max(0, comment.likesCount - 1)
        } else {
            await commentStore.likeComment(comment.id)
            comment.isLiked = true
            comment.likesCount += 1
        }
    } catch (error) {
        toast.error('Không thể thực hiện thao tác')
    }
}

const handleCommentEdit = (comment) => {
    // Handle comment edit
    console.log('Edit comment:', comment)
}

const handleCommentDelete = async (comment) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return
    
    try {
        await commentStore.deleteComment(comment.id)
        comments.value = comments.value.filter(c => c.id !== comment.id)
        post.value.commentsCount = Math.max(0, post.value.commentsCount - 1)
        toast.success('Đã xóa bình luận')
    } catch (error) {
        toast.error('Không thể xóa bình luận')
    }
}

const handleCommentReport = (comment) => {
    // Handle comment report
    console.log('Report comment:', comment)
}

const setCommentSort = (sort) => {
    commentSort.value = sort
    loadComments(true)
}

const getSortText = (sort) => {
    const sortTexts = {
        newest: 'Mới nhất',
        oldest: 'Cũ nhất', 
        popular: 'Phổ biến nhất'
    }
    return sortTexts[sort] || 'Mới nhất'
}

const focusCommentInput = () => {
    if (commentInput.value) {
        commentInput.value.focus()
    }
}

// UI helpers
const toggleTextExpansion = () => {
    isTextExpanded.value = !isTextExpanded.value
}

const formatPostContent = (content) => {
    // Format mentions, hashtags, links
    return content
        .replace(/@(\w+)/g, '<a href="/profile/$1" class="mention">@$1</a>')
        .replace(/#(\w+)/g, '<a href="/search?q=%23$1" class="hashtag">#$1</a>')
        .replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener" class="link">$1</a>')
}

const formatTimeAgo = (date) => {
    return formatTime(date, 'relative')
}

const formatFullDate = (date) => {
    return formatDate(date, 'full')
}

const getVisibilityIcon = (visibility) => {
    const icons = {
        public: 'fas fa-globe',
        friends: 'fas fa-users',
        private: 'fas fa-lock'
    }
    return icons[visibility] || 'fas fa-globe'
}

const getVisibilityText = (visibility) => {
    const texts = {
        public: 'Công khai',
        friends: 'Bạn bè',
        private: 'Riêng tư'
    }
    return texts[visibility] || 'Công khai'
}

// Media
const viewMedia = (media) => {
    currentMedia.value = media
    showMediaViewer.value = true
}

const navigateMedia = (direction) => {
    const currentIndex = post.value.media.findIndex(m => m.id === currentMedia.value.id)
    if (direction === 'next' && currentIndex < post.value.media.length - 1) {
        currentMedia.value = post.value.media[currentIndex + 1]
    } else if (direction === 'prev' && currentIndex > 0) {
        currentMedia.value = post.value.media[currentIndex - 1]
    }
}

const downloadMedia = (media) => {
    // Handle media download
    const link = document.createElement('a')
    link.href = media.url
    link.download = media.name || 'media'
    link.click()
}

// Poll
const handlePollVote = async (option) => {
    try {
        await postStore.votePoll(post.value.poll.id, option.id)
        // Update poll data
        option.votes += 1
        post.value.poll.totalVotes += 1
        post.value.poll.hasVoted = true
        toast.success('Đã bình chọn')
    } catch (error) {
        toast.error('Không thể bình chọn')
    }
}

// Navigation
const goBack = () => {
    if (window.history.length > 1) {
        router.go(-1)
    } else {
        router.push('/feed')
    }
}

const navigateToPost = (postId) => {
    router.push(`/posts/${postId}`)
}

// Sharing
const showLikes = () => {
    showLikesModal.value = true
}

const showShareModal = () => {
    showShareModal.value = true
}

const handlePostShared = () => {
    post.value.sharesCount += 1
    showShareModal.value = false
    toast.success('Đã chia sẻ bài viết')
}

const copyPostLink = () => {
    const postUrl = `${window.location.origin}/posts/${postId.value}`
    navigator.clipboard.writeText(postUrl)
    toast.success('Đã sao chép liên kết')
}

const shareToFacebook = () => {
    const postUrl = `${window.location.origin}/posts/${postId.value}`
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`
    window.open(facebookUrl, '_blank', 'width=600,height=400')
}

const shareToTwitter = () => {
    const postUrl = `${window.location.origin}/posts/${postId.value}`
    const text = truncateText(post.value.content, 100)
    const twitterUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(text)}`
    window.open(twitterUrl, '_blank', 'width=600,height=400')
}

const shareToLinkedIn = () => {
    const postUrl = `${window.location.origin}/posts/${postId.value}`
    const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`
    window.open(linkedInUrl, '_blank', 'width=600,height=400')
}

const shareViaEmail = () => {
    const postUrl = `${window.location.origin}/posts/${postId.value}`
    const subject = `Chia sẻ bài viết từ ${post.value.author.name}`
    const body = `Tôi muốn chia sẻ bài viết này với bạn:\n\n${postUrl}`
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

// Tags
const searchTag = (tag) => {
    router.push(`/search?q=${encodeURIComponent('#' + tag)}`)
}

// Link preview
const openLink = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer')
}

// Reports
const handlePostReported = () => {
    showReportModal.value = false
    toast.success('Đã gửi báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất.')
}

// Watchers
watch(() => route.params.id, (newId) => {
    if (newId) {
        loadPost()
    }
}, { immediate: true })

// Lifecycle
onMounted(() => {
    // Set page title
    if (post.value) {
        document.title = `${post.value.author.name} - ${truncateText(post.value.content, 50)} | SocialApp`
    }
})
</script>

<style lang="scss" scoped>
.post-detail-view {
    background: var(--bs-light);
    min-height: 100vh;
    padding: 2rem 0;
}

// Back Navigation
.back-navigation {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;

    .btn-ghost {
        background: none;
        border: none;
        color: var(--bs-secondary);
        font-weight: 500;
        padding: 0.5rem 1rem;
        border-radius: 25px;
        transition: all 0.2s ease;

        &:hover {
            background: var(--bs-primary);
            color: white;
        }
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        font-size: 0.9rem;

        .breadcrumb-item {
            color: var(--bs-primary);
            text-decoration: none;

            &:hover {
                text-decoration: underline;
            }
        }

        .breadcrumb-separator {
            margin: 0 0.5rem;
            color: var(--bs-secondary);
        }

        .breadcrumb-current {
            color: var(--bs-secondary);
        }
    }
}

// Post Detail Card
.post-detail-card {
    background: white;
    border-radius: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;

    .post-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--bs-border-color-translucent);
        display: flex;
        justify-content: space-between;
        align-items: flex-start;

        .author-info {
            display: flex;
            gap: 1rem;
            flex: 1;

            .author-details {
                flex: 1;
                display: flex;
                justify-content: space-between;
                align-items: flex-start;

                .author-name-section {
                    .author-name {
                        margin: 0;
                        font-weight: 700;
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;

                        a {
                            color: var(--bs-dark);
                            text-decoration: none;

                            &:hover {
                                color: var(--bs-primary);
                            }
                        }

                        .verified-badge {
                            color: var(--bs-primary);
                            font-size: 0.9rem;
                        }
                    }

                    .post-meta {
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        margin-top: 0.25rem;
                        font-size: 0.9rem;
                        color: var(--bs-secondary);

                        .post-time {
                            cursor: pointer;

                            &:hover {
                                text-decoration: underline;
                            }
                        }

                        .post-location,
                        .post-visibility {
                            display: flex;
                            align-items: center;
                        }
                    }
                }

                .author-actions {
                    .btn {
                        border-radius: 25px;
                        font-weight: 600;
                        padding: 0.4rem 1rem;
                        font-size: 0.85rem;
                    }
                }
            }
        }

        .post-options {
            .btn-ghost {
                background: none;
                border: none;
                padding: 0.5rem;
                border-radius: 50%;
                color: var(--bs-secondary);

                &:hover {
                    background: var(--bs-light);
                    color: var(--bs-primary);
                }
            }
        }
    }

    .post-content {
        padding: 0 1.5rem;

        .post-text {
            margin-bottom: 1rem;

            .text-content {
                font-size: 1.1rem;
                line-height: 1.6;
                color: var(--bs-dark);

                &:not(.expanded) {
                    max-height: 200px;
                    overflow: hidden;
                    position: relative;

                    &::after {
                        content: '';
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        height: 50px;
                        background: linear-gradient(transparent, white);
                    }
                }

                :deep(.mention) {
                    color: var(--bs-primary);
                    text-decoration: none;
                    font-weight: 600;

                    &:hover {
                        text-decoration: underline;
                    }
                }

                :deep(.hashtag) {
                    color: var(--bs-primary);
                    text-decoration: none;
                    font-weight: 600;

                    &:hover {
                        text-decoration: underline;
                    }
                }

                :deep(.link) {
                    color: var(--bs-primary);
                    text-decoration: none;

                    &:hover {
                        text-decoration: underline;
                    }
                }
            }

            .text-expand {
                background: none;
                border: none;
                color: var(--bs-primary);
                font-weight: 600;
                padding: 0;
                margin-top: 0.5rem;

                &:hover {
                    text-decoration: underline;
                }
            }
        }

        .post-media {
            margin-bottom: 1rem;
        }

        .post-poll {
            margin-bottom: 1rem;
        }

        .link-preview {
            margin-bottom: 1rem;
        }

        .post-tags {
            margin-bottom: 1rem;

            .tag {
                display: inline-block;
                background: var(--bs-primary);
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 15px;
                font-size: 0.8rem;
                font-weight: 600;
                margin-right: 0.5rem;
                margin-bottom: 0.5rem;
                cursor: pointer;
                transition: background 0.2s ease;

                &:hover {
                    background: var(--bs-primary-dark);
                }
            }
        }
    }

    .post-stats {
        padding: 0 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid var(--bs-border-color-translucent);
        margin-bottom: 0;

        .stats-left,
        .stats-right {
            display: flex;
            gap: 1rem;
        }

        .stat-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            padding: 0.75rem 0;
            color: var(--bs-secondary);
            font-size: 0.9rem;

            &:hover {
                color: var(--bs-primary);
            }

            .reaction-icons {
                display: flex;
                gap: 0.25rem;

                i {
                    font-size: 0.8rem;
                }
            }
        }
    }

    .post-actions {
        padding: 1rem 1.5rem;

        .action-buttons {
            display: flex;
            justify-content: space-around;

            .action-btn {
                flex: 1;
                background: none;
                border: none;
                padding: 0.75rem 1rem;
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.5rem;
                color: var(--bs-secondary);
                font-weight: 500;
                transition: all 0.2s ease;

                &:hover {
                    background: var(--bs-light);
                    color: var(--bs-primary);
                }

                &.like-btn.active {
                    color: var(--bs-danger);
                }

                i {
                    font-size: 1.1rem;
                }
            }
        }
    }
}

// Comments Section
.comments-section {
    background: white;
    border-radius: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

    .comments-header {
        padding: 1.5rem;
        border-bottom: 1px solid var(--bs-border-color-translucent);
        display: flex;
        justify-content: space-between;
        align-items: center;

        .comments-title {
            margin: 0;
            font-weight: 700;
            color: var(--bs-dark);
        }

        .comments-sort {
            .dropdown-item.active {
                background: var(--bs-primary);
                color: white;
            }
        }
    }

    .comment-input-section {
        padding: 1.5rem;
        border-bottom: 1px solid var(--bs-border-color-translucent);
    }

    .comments-list {
        .empty-comments {
            padding: 3rem 1.5rem;
            text-align: center;

            .empty-content {
                .empty-icon {
                    font-size: 3rem;
                    color: var(--bs-secondary);
                    margin-bottom: 1rem;
                }

                .empty-title {
                    color: var(--bs-dark);
                    margin-bottom: 0.5rem;
                }

                .empty-description {
                    color: var(--bs-secondary);
                    margin: 0;
                }
            }
        }

        .load-more-comments {
            padding: 1.5rem;
            text-align: center;

            .btn {
                border-radius: 25px;
                font-weight: 600;
                padding: 0.75rem 2rem;
            }
        }
    }
}

// Sidebar
.post-sidebar {
    position: sticky;
    top: 2rem;

    .author-profile-card,
    .related-posts-card,
    .trending-tags-card,
    .share-card {
        background: white;
        border-radius: 15px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        margin-bottom: 1.5rem;
        padding: 1.5rem;

        .card-title {
            font-weight: 700;
            color: var(--bs-dark);
            margin-bottom: 1rem;
            font-size: 1rem;
        }
    }

    .author-profile-card {
        .profile-header {
            text-align: center;
            margin-bottom: 1.5rem;

            .profile-info {
                margin-top: 1rem;

                .profile-name {
                    font-weight: 700;
                    color: var(--bs-dark);
                    margin-bottom: 0.25rem;
                }

                .profile-username {
                    color: var(--bs-secondary);
                    margin-bottom: 0.5rem;
                }

                .profile-bio {
                    color: var(--bs-dark);
                    font-size: 0.9rem;
                    margin: 0;
                }
            }
        }

        .profile-stats {
            display: flex;
            justify-content: space-around;
            margin-bottom: 1.5rem;
            padding: 1rem 0;
            border: 1px solid var(--bs-border-color-translucent);
            border-radius: 10px;

            .stat-item {
                text-align: center;

                .stat-number {
                    display: block;
                    font-weight: 700;
                    font-size: 1.2rem;
                    color: var(--bs-primary);
                }

                .stat-label {
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                }
            }
        }

        .profile-actions {
            .btn {
                border-radius: 25px;
                font-weight: 600;
            }
        }
    }

    .related-posts-list {
        .related-post-item {
            display: flex;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 1px solid var(--bs-border-color-translucent);
            cursor: pointer;
            transition: background 0.2s ease;

            &:hover {
                background: var(--bs-light);
                border-radius: 8px;
            }

            &:last-child {
                border-bottom: none;
            }

            .related-post-image {
                width: 80px;
                height: 60px;
                border-radius: 8px;
                overflow: hidden;
                flex-shrink: 0;

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
            }

            .related-post-content {
                flex: 1;
                min-width: 0;

                .related-post-title {
                    font-weight: 600;
                    color: var(--bs-dark);
                    margin-bottom: 0.5rem;
                    font-size: 0.9rem;
                    line-height: 1.3;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                }

                .related-post-meta {
                    display: flex;
                    gap: 0.5rem;
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                    margin-bottom: 0.25rem;

                    .author {
                        font-weight: 500;
                    }
                }

                .related-post-stats {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.8rem;
                    color: var(--bs-secondary);

                    span {
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                    }
                }
            }
        }
    }

    .trending-tags-list {
        .trending-tag {
            display: inline-block;
            background: var(--bs-light);
            color: var(--bs-primary);
            padding: 0.5rem 0.75rem;
            border-radius: 20px;
            font-size: 0.85rem;
            font-weight: 600;
            margin-right: 0.5rem;
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
                background: var(--bs-primary);
                color: white;
            }

            .tag-count {
                opacity: 0.7;
                margin-left: 0.25rem;
            }
        }
    }

    .share-buttons {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0.75rem;

        .share-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            padding: 0.75rem;
            border: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 0.85rem;
            transition: transform 0.2s ease;
            text-decoration: none;

            &:hover {
                transform: translateY(-2px);
            }

            &.facebook {
                background: #1877f2;
                color: white;
            }

            &.twitter {
                background: #1da1f2;
                color: white;
            }

            &.linkedin {
                background: #0077b5;
                color: white;
            }

            &.copy {
                background: var(--bs-secondary);
                color: white;
            }
        }
    }
}

// Loading states
.loading-skeleton {
    background: white;
    border-radius: 15px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    margin-bottom: 2rem;
}

.loading-comments {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

// Responsive
@media (max-width: 992px) {
    .post-detail-view {
        padding: 1rem 0;
    }

    .back-navigation {
        margin-bottom: 1rem;

        .breadcrumb {
            display: none;
        }
    }

    .post-detail-card {
        .post-header {
            padding: 1rem;

            .author-info {
                .author-details {
                    flex-direction: column;
                    gap: 1rem;
                    align-items: flex-start;
                }
            }
        }

        .post-content {
            padding: 0 1rem;
        }

        .post-stats {
            padding: 0 1rem;
        }

        .post-actions {
            padding: 1rem;

            .action-buttons {
                .action-btn {
                    span {
                        display: none;
                    }
                }
            }
        }
    }

    .comments-section {
        .comments-header {
            padding: 1rem;
            flex-direction: column;
            gap: 1rem;
            align-items: flex-start;
        }

        .comment-input-section {
            padding: 1rem;
        }
    }
}

@media (max-width: 576px) {
    .post-detail-card {
        .post-header {
            .author-info {
                gap: 0.75rem;

                .author-details {
                    .author-name-section {
                        .author-name {
                            font-size: 1rem;
                        }

                        .post-meta {
                            flex-direction: column;
                            gap: 0.5rem;
                            align-items: flex-start;
                        }
                    }
                }
            }
        }

        .post-stats {
            flex-direction: column;
            gap: 0.5rem;
            align-items: flex-start;
        }
    }
}
</style>