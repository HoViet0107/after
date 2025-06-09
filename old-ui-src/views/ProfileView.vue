<!-- User profile page với posts, photos, friends và profile editing -->

<template>
    <div class="profile-view">
        <div class="container">
            <!-- Profile Header -->
            <div class="profile-header">
                <div class="cover-photo" :style="{ backgroundImage: `url(${profile.coverPhoto || '/images/default-cover.jpg'})` }">
                    <div class="cover-overlay"></div>
                    <button v-if="isOwnProfile" class="btn btn-outline-light cover-edit-btn" @click="editCoverPhoto">
                        <i class="fas fa-camera me-2"></i>
                        Chỉnh sửa ảnh bìa
                    </button>
                </div>

                <div class="profile-info-section">
                    <div class="row align-items-end">
                        <div class="col-md-8">
                            <div class="profile-main-info">
                                <div class="profile-avatar-container">
                                    <UserAvatar :user="profile" size="xl" class="profile-avatar" />
                                    <button v-if="isOwnProfile" class="avatar-edit-btn" @click="editAvatar">
                                        <i class="fas fa-camera"></i>
                                    </button>
                                    <div v-if="profile.isOnline && !isOwnProfile" class="online-indicator"></div>
                                </div>

                                <div class="profile-details">
                                    <h1 class="profile-name">
                                        {{ profile.name || profile.username }}
                                        <i v-if="profile.isVerified" class="fas fa-check-circle text-primary ms-2" title="Đã xác minh"></i>
                                    </h1>
                                    <p class="profile-username">@{{ profile.username }}</p>
                                    <p v-if="profile.bio" class="profile-bio">{{ profile.bio }}</p>
                                    
                                    <div class="profile-meta">
                                        <span v-if="profile.location" class="meta-item">
                                            <i class="fas fa-map-marker-alt me-1"></i>
                                            {{ profile.location }}
                                        </span>
                                        <span v-if="profile.website" class="meta-item">
                                            <i class="fas fa-link me-1"></i>
                                            <a :href="profile.website" target="_blank" rel="noopener">{{ formatWebsite(profile.website) }}</a>
                                        </span>
                                        <span class="meta-item">
                                            <i class="fas fa-calendar-alt me-1"></i>
                                            Tham gia {{ formatDate(profile.createdAt, 'MMMM YYYY') }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-4">
                            <div class="profile-actions">
                                <div v-if="isOwnProfile" class="own-profile-actions">
                                    <button class="btn btn-primary" @click="editProfile">
                                        <i class="fas fa-edit me-2"></i>
                                        Chỉnh sửa trang cá nhân
                                    </button>
                                    <div class="dropdown">
                                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" 
                                                data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-h"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li><a class="dropdown-item" href="#" @click="viewActivityLog">
                                                <i class="fas fa-history me-2"></i>Nhật ký hoạt động</a></li>
                                            <li><a class="dropdown-item" href="#" @click="viewArchive">
                                                <i class="fas fa-archive me-2"></i>Kho lưu trữ</a></li>
                                            <li><hr class="dropdown-divider"></li>
                                            <li><a class="dropdown-item" href="#" @click="exportData">
                                                <i class="fas fa-download me-2"></i>Xuất dữ liệu</a></li>
                                        </ul>
                                    </div>
                                </div>

                                <div v-else class="other-profile-actions">
                                    <button v-if="!friendship.isBlocked" class="btn btn-primary me-2" 
                                            @click="toggleFollow" :disabled="friendship.isLoading">
                                        <span v-if="friendship.isLoading" class="spinner-border spinner-border-sm me-2"></span>
                                        <i v-else-if="friendship.isFollowing" class="fas fa-user-check me-2"></i>
                                        <i v-else class="fas fa-user-plus me-2"></i>
                                        {{ friendship.isFollowing ? 'Đang theo dõi' : 'Theo dõi' }}
                                    </button>

                                    <button class="btn btn-outline-primary me-2" @click="sendMessage">
                                        <i class="fas fa-comment me-2"></i>
                                        Nhắn tin
                                    </button>

                                    <div class="dropdown">
                                        <button class="btn btn-outline-secondary dropdown-toggle" type="button" 
                                                data-bs-toggle="dropdown">
                                            <i class="fas fa-ellipsis-h"></i>
                                        </button>
                                        <ul class="dropdown-menu">
                                            <li v-if="!friendship.isBlocked">
                                                <a class="dropdown-item" href="#" @click="blockUser">
                                                    <i class="fas fa-ban me-2"></i>Chặn người dùng
                                                </a>
                                            </li>
                                            <li v-else>
                                                <a class="dropdown-item" href="#" @click="unblockUser">
                                                    <i class="fas fa-unlock me-2"></i>Bỏ chặn
                                                </a>
                                            </li>
                                            <li><a class="dropdown-item" href="#" @click="reportUser">
                                                <i class="fas fa-flag me-2"></i>Báo cáo
                                            </a></li>
                                            <li><a class="dropdown-item" href="#" @click="copyProfileLink">
                                                <i class="fas fa-copy me-2"></i>Sao chép liên kết
                                            </a></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Profile Stats -->
                    <div class="profile-stats">
                        <div class="stat-item" @click="showFollowers">
                            <span class="stat-number">{{ formatNumber(profile.followersCount || 0) }}</span>
                            <span class="stat-label">Người theo dõi</span>
                        </div>
                        <div class="stat-item" @click="showFollowing">
                            <span class="stat-number">{{ formatNumber(profile.followingCount || 0) }}</span>
                            <span class="stat-label">Đang theo dõi</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">{{ formatNumber(profile.postsCount || 0) }}</span>
                            <span class="stat-label">Bài viết</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-number">{{ formatNumber(profile.photosCount || 0) }}</span>
                            <span class="stat-label">Ảnh</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profile Content -->
            <div class="profile-content">
                <div class="row">
                    <!-- Main Content -->
                    <div class="col-lg-8">
                        <!-- Profile Navigation -->
                        <div class="profile-nav">
                            <nav class="nav nav-pills">
                                <button class="nav-link" :class="{ active: activeTab === 'posts' }" 
                                        @click="setActiveTab('posts')">
                                    <i class="fas fa-newspaper me-2"></i>
                                    Bài viết
                                </button>
                                <button class="nav-link" :class="{ active: activeTab === 'photos' }" 
                                        @click="setActiveTab('photos')">
                                    <i class="fas fa-images me-2"></i>
                                    Ảnh
                                </button>
                                <button class="nav-link" :class="{ active: activeTab === 'videos' }" 
                                        @click="setActiveTab('videos')">
                                    <i class="fas fa-video me-2"></i>
                                    Video
                                </button>
                                <button v-if="isOwnProfile" class="nav-link" :class="{ active: activeTab === 'saved' }" 
                                        @click="setActiveTab('saved')">
                                    <i class="fas fa-bookmark me-2"></i>
                                    Đã lưu
                                </button>
                            </nav>
                        </div>

                        <!-- Tab Content -->
                        <div class="tab-content">
                            <!-- Posts Tab -->
                            <div v-show="activeTab === 'posts'" class="tab-pane">
                                <div v-if="isLoading && posts.length === 0" class="loading-skeleton">
                                    <PostSkeleton v-for="i in 3" :key="i" />
                                </div>

                                <div v-else-if="posts.length === 0" class="empty-state text-center py-5">
                                    <i class="fas fa-newspaper fs-1 text-muted mb-3"></i>
                                    <h5 class="text-muted">
                                        {{ isOwnProfile ? 'Bạn chưa có bài viết nào' : 'Người dùng chưa có bài viết nào' }}
                                    </h5>
                                    <p class="text-muted">
                                        {{ isOwnProfile ? 'Hãy chia sẻ khoảnh khắc đầu tiên của bạn!' : 'Hãy quay lại sau để xem thêm nội dung.' }}
                                    </p>
                                    <router-link v-if="isOwnProfile" to="/feed" class="btn btn-primary">
                                        <i class="fas fa-plus me-2"></i>
                                        Tạo bài viết đầu tiên
                                    </router-link>
                                </div>

                                <div v-else class="posts-list">
                                    <PostCard v-for="post in posts" :key="post.id" :post="post" 
                                              @like="handleLikePost" @unlike="handleUnlikePost"
                                              @comment="handleCommentPost" @share="handleSharePost"
                                              @edit="handleEditPost" @delete="handleDeletePost"
                                              class="mb-3" />

                                    <div ref="loadMoreTrigger" class="load-more-trigger" v-show="hasMorePosts">
                                        <div v-if="isLoadingMore" class="text-center py-3">
                                            <div class="spinner-border text-primary" role="status">
                                                <span class="visually-hidden">Đang tải...</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Photos Tab -->
                            <div v-show="activeTab === 'photos'" class="tab-pane">
                                <div v-if="photos.length === 0" class="empty-state text-center py-5">
                                    <i class="fas fa-images fs-1 text-muted mb-3"></i>
                                    <h5 class="text-muted">Chưa có ảnh nào</h5>
                                </div>

                                <div v-else class="photos-grid">
                                    <div v-for="photo in photos" :key="photo.id" class="photo-item" 
                                         @click="viewPhoto(photo)">
                                        <img :src="photo.thumbnail || photo.url" :alt="photo.caption" class="img-fluid">
                                        <div class="photo-overlay">
                                            <div class="photo-stats">
                                                <span><i class="fas fa-heart"></i> {{ photo.likesCount }}</span>
                                                <span><i class="fas fa-comment"></i> {{ photo.commentsCount }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Videos Tab -->
                            <div v-show="activeTab === 'videos'" class="tab-pane">
                                <div v-if="videos.length === 0" class="empty-state text-center py-5">
                                    <i class="fas fa-video fs-1 text-muted mb-3"></i>
                                    <h5 class="text-muted">Chưa có video nào</h5>
                                </div>

                                <div v-else class="videos-grid">
                                    <div v-for="video in videos" :key="video.id" class="video-item" 
                                         @click="playVideo(video)">
                                        <div class="video-thumbnail">
                                            <img :src="video.thumbnail" :alt="video.title" class="img-fluid">
                                            <div class="video-play-btn">
                                                <i class="fas fa-play"></i>
                                            </div>
                                            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
                                        </div>
                                        <div class="video-overlay">
                                            <div class="video-stats">
                                                <span><i class="fas fa-heart"></i> {{ video.likesCount }}</span>
                                                <span><i class="fas fa-comment"></i> {{ video.commentsCount }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Saved Tab -->
                            <div v-show="activeTab === 'saved'" class="tab-pane">
                                <div v-if="savedPosts.length === 0" class="empty-state text-center py-5">
                                    <i class="fas fa-bookmark fs-1 text-muted mb-3"></i>
                                    <h5 class="text-muted">Chưa có bài viết đã lưu</h5>
                                    <p class="text-muted">Bài viết bạn lưu sẽ hiển thị ở đây</p>
                                </div>

                                <div v-else class="saved-posts">
                                    <PostCard v-for="post in savedPosts" :key="post.id" :post="post" 
                                              @like="handleLikePost" @unlike="handleUnlikePost"
                                              @comment="handleCommentPost" @share="handleSharePost"
                                              @unsave="handleUnsavePost"
                                              class="mb-3" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Sidebar -->
                    <div class="col-lg-4">
                        <div class="profile-sidebar">
                            <!-- About Section -->
                            <div class="about-section">
                                <h6 class="section-title">Giới thiệu</h6>
                                <div class="about-content">
                                    <div v-if="profile.bio" class="about-item">
                                        <p>{{ profile.bio }}</p>
                                    </div>
                                    
                                    <div v-if="profile.work" class="about-item">
                                        <i class="fas fa-briefcase me-2"></i>
                                        <span>{{ profile.work }}</span>
                                    </div>
                                    
                                    <div v-if="profile.education" class="about-item">
                                        <i class="fas fa-graduation-cap me-2"></i>
                                        <span>{{ profile.education }}</span>
                                    </div>
                                    
                                    <div v-if="profile.location" class="about-item">
                                        <i class="fas fa-map-marker-alt me-2"></i>
                                        <span>{{ profile.location }}</span>
                                    </div>
                                    
                                    <div v-if="profile.relationship" class="about-item">
                                        <i class="fas fa-heart me-2"></i>
                                        <span>{{ profile.relationship }}</span>
                                    </div>
                                    
                                    <div class="about-item">
                                        <i class="fas fa-calendar-alt me-2"></i>
                                        <span>Tham gia {{ formatDate(profile.createdAt, 'MMMM YYYY') }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Friends Preview -->
                            <div v-if="friends.length > 0" class="friends-section">
                                <div class="section-header">
                                    <h6 class="section-title">Bạn bè</h6>
                                    <a href="#" @click.prevent="showAllFriends" class="see-all-link">Xem tất cả</a>
                                </div>
                                <div class="friends-preview">
                                    <div class="friend-item" v-for="friend in friends.slice(0, 9)" :key="friend.id"
                                         @click="viewFriend(friend)">
                                        <UserAvatar :user="friend" size="md" />
                                        <span class="friend-name">{{ friend.name }}</span>
                                    </div>
                                </div>
                            </div>

                            <!-- Recent Photos -->
                            <div v-if="recentPhotos.length > 0" class="recent-photos-section">
                                <div class="section-header">
                                    <h6 class="section-title">Ảnh gần đây</h6>
                                    <a href="#" @click.prevent="setActiveTab('photos')" class="see-all-link">Xem tất cả</a>
                                </div>
                                <div class="photos-preview">
                                    <div class="photo-preview-item" v-for="photo in recentPhotos.slice(0, 6)" :key="photo.id"
                                         @click="viewPhoto(photo)">
                                        <img :src="photo.thumbnail || photo.url" :alt="photo.caption" class="img-fluid">
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <EditProfileModal v-if="showEditProfileModal" :profile="profile" 
                          @close="showEditProfileModal = false" @updated="handleProfileUpdated" />

        <FollowersModal v-if="showFollowersModal" :user-id="profile.id" 
                        @close="showFollowersModal = false" />

        <FollowingModal v-if="showFollowingModal" :user-id="profile.id" 
                        @close="showFollowingModal = false" />

        <PhotoViewerModal v-if="showPhotoViewer" :photo="currentPhoto" :photos="photos"
                          @close="showPhotoViewer = false" @next="nextPhoto" @previous="previousPhoto" />

        <VideoPlayerModal v-if="showVideoPlayer" :video="currentVideo" 
                          @close="showVideoPlayer = false" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { usePostStore } from '@/stores/post'
import { useToast } from 'vue-toastification'
import { formatNumber, formatDate } from '@/utils/stringUtils'
import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
import UserAvatar from '@/components/user/UserAvatar.vue'
import PostCard from '@/components/post/PostCard.vue'
import PostSkeleton from '@/components/skeleton/PostSkeleton.vue'
import EditProfileModal from '@/components/profile/EditProfileModal.vue'
import FollowersModal from '@/components/profile/FollowersModal.vue'
import FollowingModal from '@/components/profile/FollowingModal.vue'
import PhotoViewerModal from '@/components/media/PhotoViewerModal.vue'
import VideoPlayerModal from '@/components/media/VideoPlayerModal.vue'

// Router & Stores
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const postStore = usePostStore()
const toast = useToast()

// Refs
const loadMoreTrigger = ref(null)

// State
const isLoading = ref(false)
const isLoadingMore = ref(false)
const activeTab = ref('posts')
const showEditProfileModal = ref(false)
const showFollowersModal = ref(false)
const showFollowingModal = ref(false)
const showPhotoViewer = ref(false)
const showVideoPlayer = ref(false)
const currentPhoto = ref(null)
const currentVideo = ref(null)

const profile = ref({})
const posts = ref([])
const photos = ref([])
const videos = ref([])
const savedPosts = ref([])
const friends = ref([])
const recentPhotos = ref([])

const friendship = ref({
    isFollowing: false,
    isBlocked: false,
    isLoading: false
})

// Computed
const currentUser = computed(() => authStore.user)
const isOwnProfile = computed(() => profile.value.id === currentUser.value?.id)
const hasMorePosts = computed(() => postStore.hasMoreUserPosts(profile.value.id))

// Infinite scroll
const { setupInfiniteScroll, cleanup: cleanupInfiniteScroll } = useInfiniteScroll(
    loadMoreTrigger,
    loadMorePosts,
    { threshold: 100 }
)

// Methods
const loadProfile = async (userId) => {
    try {
        isLoading.value = true
        
        // Load profile data
        const userData = await userStore.getUserProfile(userId)
        profile.value = userData
        
        // Load friendship status if not own profile
        if (!isOwnProfile.value) {
            const friendshipData = await userStore.getFriendshipStatus(userId)
            friendship.value = {
                ...friendship.value,
                ...friendshipData
            }
        }
        
        // Load initial content
        await loadTabContent(activeTab.value)
        
    } catch (error) {
        console.error('Error loading profile:', error)
        toast.error('Không thể tải thông tin người dùng')
        router.push('/404')
    } finally {
        isLoading.value = false
    }
}

const loadTabContent = async (tab) => {
    try {
        switch (tab) {
            case 'posts':
                await loadUserPosts()
                break
            case 'photos':
                await loadUserPhotos()
                break
            case 'videos':
                await loadUserVideos()
                break
            case 'saved':
                if (isOwnProfile.value) {
                    await loadSavedPosts()
                }
                break
        }
    } catch (error) {
        console.error(`Error loading ${tab}:`, error)
    }
}

const loadUserPosts = async (refresh = true) => {
    if (refresh) {
        posts.value = []
    }
    
    const userPosts = await postStore.loadUserPosts(profile.value.id, { refresh })
    if (refresh) {
        posts.value = userPosts
    } else {
        posts.value.push(...userPosts)
    }
}

const loadUserPhotos = async () => {
    photos.value = await userStore.getUserPhotos(profile.value.id)
    recentPhotos.value = photos.value.slice(0, 6)
}

const loadUserVideos = async () => {
    videos.value = await userStore.getUserVideos(profile.value.id)
}

const loadSavedPosts = async () => {
    savedPosts.value = await postStore.loadSavedPosts()
}

const loadMorePosts = async () => {
    if (!hasMorePosts.value || isLoadingMore.value) return
    
    isLoadingMore.value = true
    try {
        await loadUserPosts(false)
    } finally {
        isLoadingMore.value = false
    }
}

const setActiveTab = async (tab) => {
    if (activeTab.value === tab) return
    
    activeTab.value = tab
    await loadTabContent(tab)
    
    // Setup infinite scroll for posts tab
    if (tab === 'posts') {
        await nextTick()
        setupInfiniteScroll()
    } else {
        cleanupInfiniteScroll()
    }
}

const editProfile = () => {
    showEditProfileModal.value = true
}

const editCoverPhoto = () => {
    // Open cover photo edit dialog
    console.log('Edit cover photo')
}

const editAvatar = () => {
    // Open avatar edit dialog
    console.log('Edit avatar')
}

const toggleFollow = async () => {
    if (friendship.value.isLoading) return
    
    friendship.value.isLoading = true
    try {
        if (friendship.value.isFollowing) {
            await userStore.unfollowUser(profile.value.id)
            friendship.value.isFollowing = false
            profile.value.followersCount = Math.max(0, (profile.value.followersCount || 0) - 1)
            toast.success('Đã bỏ theo dõi')
        } else {
            await userStore.followUser(profile.value.id)
            friendship.value.isFollowing = true
            profile.value.followersCount = (profile.value.followersCount || 0) + 1
            toast.success('Đã theo dõi')
        }
    } catch (error) {
        toast.error('Không thể thực hiện thao tác')
    } finally {
        friendship.value.isLoading = false
    }
}

const sendMessage = () => {
    router.push(`/chat?user=${profile.value.id}`)
}

const blockUser = async () => {
    if (!confirm('Bạn có chắc muốn chặn người dùng này?')) return
    
    try {
        await userStore.blockUser(profile.value.id)
        friendship.value.isBlocked = true
        toast.success('Đã chặn người dùng')
    } catch (error) {
        toast.error('Không thể chặn người dùng')
    }
}

const unblockUser = async () => {
    try {
        await userStore.unblockUser(profile.value.id)
        friendship.value.isBlocked = false
        toast.success('Đã bỏ chặn người dùng')
    } catch (error) {
        toast.error('Không thể bỏ chặn người dùng')
    }
}

const reportUser = () => {
    // Open report modal
    console.log('Report user')
}

const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile/${profile.value.username || profile.value.id}`
    navigator.clipboard.writeText(profileUrl)
    toast.success('Đã sao chép liên kết trang cá nhân')
}

const showFollowers = () => {
    showFollowersModal.value = true
}

const showFollowing = () => {
    showFollowingModal.value = true
}

const showAllFriends = () => {
    router.push(`/profile/${profile.value.username || profile.value.id}/friends`)
}

const viewFriend = (friend) => {
    router.push(`/profile/${friend.username || friend.id}`)
}

const viewPhoto = (photo) => {
    currentPhoto.value = photo
    showPhotoViewer.value = true
}

const nextPhoto = () => {
    const currentIndex = photos.value.findIndex(p => p.id === currentPhoto.value.id)
    if (currentIndex < photos.value.length - 1) {
        currentPhoto.value = photos.value[currentIndex + 1]
    }
}

const previousPhoto = () => {
    const currentIndex = photos.value.findIndex(p => p.id === currentPhoto.value.id)
    if (currentIndex > 0) {
        currentPhoto.value = photos.value[currentIndex - 1]
    }
}

const playVideo = (video) => {
    currentVideo.value = video
    showVideoPlayer.value = true
}

const viewActivityLog = () => {
    router.push('/settings/activity')
}

const viewArchive = () => {
    router.push('/archive')
}

const exportData = () => {
    // Open data export dialog
    console.log('Export data')
}

const handleProfileUpdated = (updatedProfile) => {
    profile.value = { ...profile.value, ...updatedProfile }
    showEditProfileModal.value = false
    toast.success('Đã cập nhật thông tin trang cá nhân')
}

// Post handlers
const handleLikePost = async (post) => {
    try {
        await postStore.likePost(post.id)
    } catch (error) {
        toast.error('Không thể thích bài viết')
    }
}

const handleUnlikePost = async (post) => {
    try {
        await postStore.unlikePost(post.id)
    } catch (error) {
        toast.error('Không thể bỏ thích bài viết')
    }
}

const handleCommentPost = (post) => {
    router.push(`/posts/${post.id}`)
}

const handleSharePost = async (post) => {
    try {
        await postStore.sharePost(post.id)
        toast.success('Đã chia sẻ bài viết!')
    } catch (error) {
        toast.error('Không thể chia sẻ bài viết')
    }
}

const handleEditPost = (post) => {
    // Open edit post modal
    console.log('Edit post:', post)
}

const handleDeletePost = async (post) => {
    if (!confirm('Bạn có chắc muốn xóa bài viết này?')) return
    
    try {
        await postStore.deletePost(post.id)
        posts.value = posts.value.filter(p => p.id !== post.id)
        toast.success('Đã xóa bài viết!')
    } catch (error) {
        toast.error('Không thể xóa bài viết')
    }
}

const handleUnsavePost = async (post) => {
    try {
        await postStore.unsavePost(post.id)
        savedPosts.value = savedPosts.value.filter(p => p.id !== post.id)
        toast.success('Đã bỏ lưu bài viết!')
    } catch (error) {
        toast.error('Không thể bỏ lưu bài viết')
    }
}

// Utility functions
const formatWebsite = (url) => {
    return url.replace(/^https?:\/\//, '').replace(/\/$/, '')
}

const formatDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

// Watchers
watch(() => route.params.userId, (newUserId) => {
    if (newUserId) {
        loadProfile(newUserId)
    }
}, { immediate: true })

// Lifecycle
onMounted(async () => {
    const userId = route.params.userId || currentUser.value?.id
    if (userId) {
        await loadProfile(userId)
        
        // Setup infinite scroll for posts tab
        if (activeTab.value === 'posts') {
            await nextTick()
            setupInfiniteScroll()
        }
    }
})
</script>

<style lang="scss" scoped>
.profile-view {
    background: var(--bs-light);
    min-height: 100vh;
}

// Profile Header
.profile-header {
    background: white;
    margin-bottom: 2rem;

    .cover-photo {
        height: 320px;
        background-size: cover;
        background-position: center;
        position: relative;
        border-radius: 0 0 15px 15px;

        .cover-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.1));
            border-radius: 0 0 15px 15px;
        }

        .cover-edit-btn {
            position: absolute;
            bottom: 1rem;
            right: 1rem;
            z-index: 10;
        }
    }

    .profile-info-section {
        padding: 0 2rem 2rem;
        margin-top: -80px;
        position: relative;
        z-index: 10;

        .profile-main-info {
            display: flex;
            align-items: flex-end;
            gap: 1.5rem;

            .profile-avatar-container {
                position: relative;

                .profile-avatar {
                    border: 4px solid white;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
                }

                .avatar-edit-btn {
                    position: absolute;
                    bottom: 8px;
                    right: 8px;
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    border: none;
                    background: var(--bs-dark);
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

                    &:hover {
                        background: var(--bs-primary);
                    }
                }

                .online-indicator {
                    position: absolute;
                    bottom: 15px;
                    right: 15px;
                    width: 20px;
                    height: 20px;
                    background: var(--bs-success);
                    border: 3px solid white;
                    border-radius: 50%;
                }
            }

            .profile-details {
                flex: 1;
                padding-bottom: 0.5rem;

                .profile-name {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                    color: var(--bs-dark);
                    display: flex;
                    align-items: center;
                }

                .profile-username {
                    font-size: 1.1rem;
                    color: var(--bs-secondary);
                    margin-bottom: 0.75rem;
                }

                .profile-bio {
                    font-size: 1rem;
                    color: var(--bs-dark);
                    margin-bottom: 0.75rem;
                    line-height: 1.5;
                }

                .profile-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;

                    .meta-item {
                        color: var(--bs-secondary);
                        font-size: 0.9rem;
                        display: flex;
                        align-items: center;

                        a {
                            color: var(--bs-primary);
                            text-decoration: none;

                            &:hover {
                                text-decoration: underline;
                            }
                        }
                    }
                }
            }
        }

        .profile-actions {
            display: flex;
            gap: 0.5rem;
            align-items: center;
            justify-content: flex-end;
            padding-bottom: 0.5rem;

            .btn {
                border-radius: 25px;
                font-weight: 600;
                padding: 0.5rem 1.5rem;
            }
        }

        .profile-stats {
            display: flex;
            gap: 2rem;
            margin-top: 1.5rem;
            padding-top: 1.5rem;
            border-top: 1px solid var(--bs-border-color-translucent);

            .stat-item {
                text-align: center;
                cursor: pointer;
                transition: color 0.2s ease;

                &:hover {
                    color: var(--bs-primary);
                }

                .stat-number {
                    display: block;
                    font-size: 1.5rem;
                    font-weight: 700;
                    color: var(--bs-dark);
                }

                .stat-label {
                    font-size: 0.9rem;
                    color: var(--bs-secondary);
                }
            }
        }
    }
}

// Profile Content
.profile-content {
    .profile-nav {
        background: white;
        border-radius: 15px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

        .nav {
            .nav-link {
                border: none;
                background: none;
                color: var(--bs-secondary);
                font-weight: 600;
                padding: 0.75rem 1.5rem;
                border-radius: 25px;
                transition: all 0.2s ease;

                &:hover {
                    background: var(--bs-light);
                    color: var(--bs-primary);
                }

                &.active {
                    background: var(--bs-primary);
                    color: white;
                }
            }
        }
    }

    .tab-content {
        .empty-state {
            background: white;
            border-radius: 15px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .photos-grid,
        .videos-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 1rem;

            .photo-item,
            .video-item {
                position: relative;
                aspect-ratio: 1;
                border-radius: 15px;
                overflow: hidden;
                cursor: pointer;
                transition: transform 0.2s ease;

                &:hover {
                    transform: scale(1.05);

                    .photo-overlay,
                    .video-overlay {
                        opacity: 1;
                    }
                }

                img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }

                .photo-overlay,
                .video-overlay {
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.7));
                    opacity: 0;
                    transition: opacity 0.2s ease;
                    display: flex;
                    align-items: flex-end;
                    padding: 1rem;

                    .photo-stats,
                    .video-stats {
                        color: white;
                        display: flex;
                        gap: 1rem;

                        span {
                            display: flex;
                            align-items: center;
                            gap: 0.25rem;
                            font-size: 0.9rem;
                        }
                    }
                }
            }

            .video-item {
                .video-thumbnail {
                    position: relative;
                    width: 100%;
                    height: 100%;

                    .video-play-btn {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        width: 60px;
                        height: 60px;
                        background: rgba(0, 0, 0, 0.7);
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: white;
                        font-size: 1.5rem;
                    }

                    .video-duration {
                        position: absolute;
                        bottom: 0.5rem;
                        right: 0.5rem;
                        background: rgba(0, 0, 0, 0.7);
                        color: white;
                        padding: 0.25rem 0.5rem;
                        border-radius: 4px;
                        font-size: 0.8rem;
                    }
                }
            }
        }

        .load-more-trigger {
            height: 20px;
        }
    }
}

// Profile Sidebar
.profile-sidebar {
    .section-title {
        font-weight: 600;
        color: var(--bs-dark);
        margin-bottom: 1rem;
        font-size: 1rem;
    }

    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;

        .see-all-link {
            color: var(--bs-primary);
            text-decoration: none;
            font-size: 0.9rem;

            &:hover {
                text-decoration: underline;
            }
        }
    }

    .about-section,
    .friends-section,
    .recent-photos-section {
        background: white;
        border-radius: 15px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
    }

    .about-content {
        .about-item {
            display: flex;
            align-items: center;
            margin-bottom: 1rem;
            color: var(--bs-dark);

            &:last-child {
                margin-bottom: 0;
            }

            i {
                color: var(--bs-secondary);
                margin-right: 0.75rem;
                width: 16px;
            }

            p {
                margin: 0;
            }
        }
    }

    .friends-preview {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 1rem;

        .friend-item {
            text-align: center;
            cursor: pointer;
            transition: transform 0.2s ease;

            &:hover {
                transform: scale(1.05);
            }

            .friend-name {
                display: block;
                font-size: 0.8rem;
                margin-top: 0.5rem;
                color: var(--bs-dark);
                font-weight: 500;
            }
        }
    }

    .photos-preview {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 0.5rem;

        .photo-preview-item {
            aspect-ratio: 1;
            border-radius: 8px;
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s ease;

            &:hover {
                transform: scale(1.05);
            }

            img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
        }
    }
}

// Responsive
@media (max-width: 992px) {
    .profile-header {
        .cover-photo {
            height: 250px;
        }

        .profile-info-section {
            padding: 0 1rem 1.5rem;
            margin-top: -60px;

            .profile-main-info {
                flex-direction: column;
                align-items: center;
                text-align: center;
                gap: 1rem;
            }

            .profile-actions {
                justify-content: center;
                margin-top: 1rem;
            }

            .profile-stats {
                justify-content: center;
                gap: 1.5rem;
            }
        }
    }

    .profile-content {
        .profile-nav {
            padding: 0.75rem;

            .nav {
                .nav-link {
                    padding: 0.5rem 1rem;
                    font-size: 0.9rem;
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .profile-header {
        .cover-photo {
            height: 200px;
        }

        .profile-info-section {
            .profile-details {
                .profile-name {
                    font-size: 1.5rem;
                }

                .profile-meta {
                    flex-direction: column;
                    gap: 0.5rem;
                }
            }

            .profile-actions {
                .btn {
                    font-size: 0.9rem;
                    padding: 0.5rem 1rem;
                }
            }

            .profile-stats {
                gap: 1rem;

                .stat-item {
                    .stat-number {
                        font-size: 1.2rem;
                    }

                    .stat-label {
                        font-size: 0.8rem;
                    }
                }
            }
        }
    }

    .profile-content {
        .tab-content {
            .photos-grid,
            .videos-grid {
                grid-template-columns: repeat(2, 1fr);
            }
        }
    }

    .profile-sidebar {
        .friends-preview {
            grid-template-columns: repeat(2, 1fr);
        }

        .photos-preview {
            grid-template-columns: repeat(2, 1fr);
        }
    }
}
</style>