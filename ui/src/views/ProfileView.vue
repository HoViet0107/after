<template>
    <div class="profile-view">
        <div class="container">
            <!-- Profile Header -->
            <div class="profile-header">
                <div class="cover-photo">
                    <img v-if="profile?.coverPhoto" :src="profile.coverPhoto" alt="Cover Photo" class="cover-image">
                    <div v-else class="cover-placeholder"></div>

                    <button v-if="isOwnProfile" class="cover-edit-btn" @click="editCoverPhoto">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>

                <div class="profile-info">
                    <div class="avatar-section">
                        <div class="avatar-container">
                            <UserAvatar :user="profile" :size="120" />
                            <button v-if="isOwnProfile" class="avatar-edit-btn" @click="editAvatar">
                                <i class="fas fa-camera"></i>
                            </button>
                        </div>
                    </div>

                    <div class="user-details">
                        <div class="user-basic">
                            <h1 class="user-name">{{ profile?.name }}</h1>
                            <p class="user-username">@{{ profile?.username }}</p>
                            <p v-if="profile?.bio" class="user-bio">{{ profile.bio }}</p>
                        </div>

                        <div class="user-stats">
                            <div class="stat-item" @click="showFollowersModal = true">
                                <span class="stat-number">{{ formatNumber(profile?.followersCount || 0) }}</span>
                                <span class="stat-label">Người theo dõi</span>
                            </div>
                            <div class="stat-item" @click="showFollowingModal = true">
                                <span class="stat-number">{{ formatNumber(profile?.followingCount || 0) }}</span>
                                <span class="stat-label">Đang theo dõi</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-number">{{ formatNumber(profile?.postsCount || 0) }}</span>
                                <span class="stat-label">Bài viết</span>
                            </div>
                        </div>

                        <div class="user-actions">
                            <button v-if="isOwnProfile" class="btn btn-primary" @click="editProfile">
                                <i class="fas fa-edit me-2"></i>
                                Chỉnh sửa hồ sơ
                            </button>

                            <template v-else>
                                <button class="btn"
                                    :class="profile?.isFollowing ? 'btn-outline-primary' : 'btn-primary'"
                                    :disabled="loading.follow" @click="toggleFollow">
                                    <i v-if="loading.follow" class="fas fa-spinner fa-spin me-2"></i>
                                    <i v-else :class="profile?.isFollowing ? 'fas fa-user-minus' : 'fas fa-user-plus'"
                                        class="me-2"></i>
                                    {{ profile?.isFollowing ? 'Bỏ theo dõi' : 'Theo dõi' }}
                                </button>

                                <button class="btn btn-outline-secondary ms-2" @click="sendMessage">
                                    <i class="fas fa-comment me-2"></i>
                                    Nhắn tin
                                </button>
                            </template>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Profile Tabs -->
            <div class="profile-tabs">
                <ul class="nav nav-tabs">
                    <li class="nav-item">
                        <button class="nav-link" :class="{ active: activeTab === 'posts' }"
                            @click="setActiveTab('posts')">
                            <i class="fas fa-th-large me-2"></i>
                            Bài viết
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" :class="{ active: activeTab === 'photos' }"
                            @click="setActiveTab('photos')">
                            <i class="fas fa-images me-2"></i>
                            Ảnh
                        </button>
                    </li>
                    <li class="nav-item">
                        <button class="nav-link" :class="{ active: activeTab === 'videos' }"
                            @click="setActiveTab('videos')">
                            <i class="fas fa-video me-2"></i>
                            Video
                        </button>
                    </li>
                    <li v-if="isOwnProfile" class="nav-item">
                        <button class="nav-link" :class="{ active: activeTab === 'saved' }"
                            @click="setActiveTab('saved')">
                            <i class="fas fa-bookmark me-2"></i>
                            Đã lưu
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Tab Content -->
            <div class="tab-content">
                <!-- Posts Tab -->
                <div v-if="activeTab === 'posts'" class="tab-pane">
                    <div v-if="loading.posts" class="loading-skeleton">
                        <div v-for="i in 5" :key="i" class="skeleton-post"></div>
                    </div>

                    <div v-else-if="posts.length === 0" class="empty-state">
                        <i class="fas fa-newspaper fa-3x text-muted"></i>
                        <h5 class="mt-3">{{ isOwnProfile ? 'Bạn chưa có bài viết nào' : 'Người dùng chưa có bài viết\
                            nào'}}</h5>
                        <button v-if="isOwnProfile" class="btn btn-primary mt-2" @click="createPost">
                            Tạo bài viết đầu tiên
                        </button>
                    </div>

                    <div v-else class="posts-grid">
                        <PostCard v-for="post in posts" :key="post.id" :post="post" @like="handlePostLike"
                            @comment="handlePostComment" @share="handlePostShare" />

                        <!-- Load More -->
                        <div v-if="hasMorePosts" class="load-more">
                            <button class="btn btn-outline-primary w-100" :disabled="loading.more"
                                @click="loadMorePosts">
                                <i v-if="loading.more" class="fas fa-spinner fa-spin me-2"></i>
                                {{ loading.more ? 'Đang tải...' : 'Tải thêm' }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Photos Tab -->
                <div v-if="activeTab === 'photos'" class="tab-pane">
                    <div v-if="loading.photos" class="loading-skeleton">
                        <div class="photos-skeleton"></div>
                    </div>

                    <div v-else-if="photos.length === 0" class="empty-state">
                        <i class="fas fa-images fa-3x text-muted"></i>
                        <h5 class="mt-3">Chưa có ảnh nào</h5>
                    </div>

                    <div v-else class="photos-grid">
                        <div v-for="(photo, index) in photos" :key="photo.id" class="photo-item"
                            @click="viewPhoto(photo, index)">
                            <img :src="photo.thumbnail || photo.url" :alt="photo.caption" class="img-fluid">
                            <div class="photo-overlay">
                                <i class="fas fa-search-plus"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Videos Tab -->
                <div v-if="activeTab === 'videos'" class="tab-pane">
                    <div v-if="loading.videos" class="loading-skeleton">
                        <div class="videos-skeleton"></div>
                    </div>

                    <div v-else-if="videos.length === 0" class="empty-state">
                        <i class="fas fa-video fa-3x text-muted"></i>
                        <h5 class="mt-3">Chưa có video nào</h5>
                    </div>

                    <div v-else class="videos-grid">
                        <div v-for="video in videos" :key="video.id" class="video-item" @click="playVideo(video)">
                            <img :src="video.thumbnail" :alt="video.title" class="video-thumbnail">
                            <div class="video-overlay">
                                <i class="fas fa-play"></i>
                            </div>
                            <div class="video-duration">{{ formatDuration(video.duration) }}</div>
                        </div>
                    </div>
                </div>

                <!-- Saved Tab -->
                <div v-if="activeTab === 'saved' && isOwnProfile" class="tab-pane">
                    <div v-if="loading.saved" class="loading-skeleton">
                        <div v-for="i in 5" :key="i" class="skeleton-post"></div>
                    </div>

                    <div v-else-if="savedPosts.length === 0" class="empty-state">
                        <i class="fas fa-bookmark fa-3x text-muted"></i>
                        <h5 class="mt-3">Chưa có bài viết đã lưu</h5>
                        <p class="text-muted">Các bài viết bạn lưu sẽ hiển thị ở đây</p>
                    </div>

                    <div v-else class="posts-grid">
                        <PostCard v-for="post in savedPosts" :key="post.id" :post="post" :show-save="true" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <EditProfileModal v-if="showEditModal" :profile="profile" @close="showEditModal = false"
            @updated="handleProfileUpdated" />

        <FollowersModal v-if="showFollowersModal" :user-id="profile?.id" @close="showFollowersModal = false" />

        <FollowingModal v-if="showFollowingModal" :user-id="profile?.id" @close="showFollowingModal = false" />

        <PhotoViewerModal v-if="showPhotoViewer" :photo="currentPhoto" :photos="photos" @close="showPhotoViewer = false"
            @navigate="navigatePhoto" />
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import { useAppStores } from '@/composables/useAppStores'
import { useLoadingStates } from '@/composables/useLoadingStates'
import { formatNumber, formatDuration } from '@/utils/stringUtils'
import UserAvatar from '@/components/user/UserAvatar.vue'
import PostCard from '@/components/post/PostCard.vue'
import EditProfileModal from '@/components/modals/EditProfileModal.vue'
import FollowersModal from '@/components/modals/FollowersModal.vue'
import FollowingModal from '@/components/modals/FollowingModal.vue'
import PhotoViewerModal from '@/components/modals/PhotoViewerModal.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()
const { authStore, userStore, postStore } = useAppStores()
const { loading, setLoading } = useLoadingStates(['profile', 'posts', 'photos', 'videos', 'saved', 'follow', 'more'])

// State
const profile = ref(null)
const posts = ref([])
const photos = ref([])
const videos = ref([])
const savedPosts = ref([])
const activeTab = ref('posts')
const currentPhoto = ref(null)
const hasMorePosts = ref(true)
const currentPage = ref(1)

// Modal states
const showEditModal = ref(false)
const showFollowersModal = ref(false)
const showFollowingModal = ref(false)
const showPhotoViewer = ref(false)

// Computed
const userId = computed(() => route.params.userId || authStore.user?.id)
const currentUser = computed(() => authStore.user)
const isOwnProfile = computed(() => userId.value === currentUser.value?.id)

// Methods
const loadProfile = async () => {
    if (!userId.value) return

    setLoading('profile', true)
    try {
        const response = await userStore.getUserProfile(userId.value)
        profile.value = response.data
    } catch (error) {
        console.error('Load profile error:', error)
        if (error.response?.status === 404) {
            router.push('/404')
        }
    } finally {
        setLoading('profile', false)
    }
}

const loadPosts = async (refresh = false) => {
    if (!userId.value) return

    if (refresh) {
        currentPage.value = 1
        hasMorePosts.value = true
    }

    setLoading('posts', true)
    try {
        const response = await postStore.getUserPosts(userId.value, {
            page: currentPage.value,
            limit: 20
        })

        if (refresh) {
            posts.value = response.data
        } else {
            posts.value.push(...response.data)
        }

        hasMorePosts.value = response.hasMore

    } catch (error) {
        console.error('Load posts error:', error)
    } finally {
        setLoading('posts', false)
    }
}

const loadPhotos = async () => {
    if (!userId.value) return

    setLoading('photos', true)
    try {
        const response = await postStore.getUserMedia(userId.value, { type: 'image' })
        photos.value = response.data
    } catch (error) {
        console.error('Load photos error:', error)
    } finally {
        setLoading('photos', false)
    }
}

const loadVideos = async () => {
    if (!userId.value) return

    setLoading('videos', true)
    try {
        const response = await postStore.getUserMedia(userId.value, { type: 'video' })
        videos.value = response.data
    } catch (error) {
        console.error('Load videos error:', error)
    } finally {
        setLoading('videos', false)
    }
}

const loadSavedPosts = async () => {
    if (!isOwnProfile.value) return

    setLoading('saved', true)
    try {
        const response = await postStore.getSavedPosts()
        savedPosts.value = response.data
    } catch (error) {
        console.error('Load saved posts error:', error)
    } finally {
        setLoading('saved', false)
    }
}

const loadMorePosts = async () => {
    if (loading.more || !hasMorePosts.value) return

    setLoading('more', true)
    currentPage.value++

    try {
        const response = await postStore.getUserPosts(userId.value, {
            page: currentPage.value,
            limit: 20
        })

        posts.value.push(...response.data)
        hasMorePosts.value = response.hasMore

    } catch (error) {
        console.error('Load more posts error:', error)
        currentPage.value-- // Rollback
    } finally {
        setLoading('more', false)
    }
}

const setActiveTab = (tab) => {
    activeTab.value = tab

    // Load data for the active tab
    switch (tab) {
        case 'posts':
            if (posts.value.length === 0) loadPosts(true)
            break
        case 'photos':
            if (photos.value.length === 0) loadPhotos()
            break
        case 'videos':
            if (videos.value.length === 0) loadVideos()
            break
        case 'saved':
            if (savedPosts.value.length === 0) loadSavedPosts()
            break
    }
}

const toggleFollow = async () => {
    if (!profile.value || loading.follow) return

    setLoading('follow', true)
    try {
        if (profile.value.isFollowing) {
            await userStore.unfollowUser(profile.value.id)
            profile.value.isFollowing = false
            profile.value.followersCount--
        } else {
            await userStore.followUser(profile.value.id)
            profile.value.isFollowing = true
            profile.value.followersCount++
        }

        toast.success(profile.value.isFollowing ? 'Đã theo dõi' : 'Đã bỏ theo dõi')

    } catch (error) {
        console.error('Toggle follow error:', error)
        toast.error('Có lỗi xảy ra')
    } finally {
        setLoading('follow', false)
    }
}

const editProfile = () => {
    showEditModal.value = true
}

const editAvatar = () => {
    // Implement avatar upload
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = handleAvatarUpload
    input.click()
}

const editCoverPhoto = () => {
    // Implement cover photo upload
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = handleCoverUpload
    input.click()
}

const handleAvatarUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
        const formData = new FormData()
        formData.append('avatar', file)

        const response = await userStore.uploadAvatar(formData)
        profile.value.avatar = response.avatar

        toast.success('Cập nhật ảnh đại diện thành công')

    } catch (error) {
        console.error('Avatar upload error:', error)
        toast.error('Upload ảnh thất bại')
    }
}

const handleCoverUpload = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    try {
        const formData = new FormData()
        formData.append('coverPhoto', file)

        const response = await userStore.uploadCoverPhoto(formData)
        profile.value.coverPhoto = response.coverPhoto

        toast.success('Cập nhật ảnh bìa thành công')

    } catch (error) {
        console.error('Cover upload error:', error)
        toast.error('Upload ảnh thất bại')
    }
}

const sendMessage = () => {
    router.push(`/app/chat?userId=${profile.value.id}`)
}

const createPost = () => {
    router.push('/app/create-post')
}

const handlePostLike = async (postId) => {
    try {
        const post = posts.value.find(p => p.id === postId)
        if (post) {
            post.isLiked = !post.isLiked
            post.likesCount += post.isLiked ? 1 : -1
        }

        await postStore.toggleLike(postId)
    } catch (error) {
        console.error('Like post error:', error)
        // Revert optimistic update
        const post = posts.value.find(p => p.id === postId)
        if (post) {
            post.isLiked = !post.isLiked
            post.likesCount += post.isLiked ? 1 : -1
        }
    }
}

const handlePostComment = (postId) => {
    router.push(`/app/post/${postId}`)
}

const handlePostShare = async (postId) => {
    try {
        await postStore.sharePost(postId)
        const post = posts.value.find(p => p.id === postId)
        if (post) {
            post.sharesCount++
        }
        toast.success('Chia sẻ thành công')
    } catch (error) {
        console.error('Share post error:', error)
        toast.error('Chia sẻ thất bại')
    }
}

const viewPhoto = (photo, index) => {
    currentPhoto.value = { photo, index }
    showPhotoViewer.value = true
}

const navigatePhoto = (direction) => {
    const currentIndex = currentPhoto.value.index
    let newIndex

    if (direction === 'next') {
        newIndex = currentIndex < photos.value.length - 1 ? currentIndex + 1 : 0
    } else {
        newIndex = currentIndex > 0 ? currentIndex - 1 : photos.value.length - 1
    }

    currentPhoto.value = { photo: photos.value[newIndex], index: newIndex }
}

const playVideo = (video) => {
    // Implement video player
    console.log('Play video:', video)
}

const handleProfileUpdated = (updatedProfile) => {
    profile.value = { ...profile.value, ...updatedProfile }
    showEditModal.value = false
    toast.success('Cập nhật hồ sơ thành công')
}

// Watchers
watch(() => route.params.userId, (newUserId) => {
    if (newUserId && newUserId !== userId.value) {
        // Reset data when switching profiles
        profile.value = null
        posts.value = []
        photos.value = []
        videos.value = []
        savedPosts.value = []
        activeTab.value = 'posts'
        currentPage.value = 1
        hasMorePosts.value = true

        // Load new profile
        loadProfile()
    }
})

// Lifecycle
onMounted(async () => {
    await loadProfile()
    if (profile.value) {
        await loadPosts(true)
    }
})
</script>

<style lang="scss" scoped>
.profile-view {
    min-height: 100vh;
    background: #f8f9fa;
}

.profile-header {
    background: white;
    margin-bottom: 2rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.cover-photo {
    position: relative;
    height: 300px;
    overflow: hidden;

    .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .cover-placeholder {
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .cover-edit-btn {
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.6);
        color: white;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background-color 0.3s ease;

        &:hover {
            background: rgba(0, 0, 0, 0.8);
        }
    }
}

.profile-info {
    padding: 0 2rem 2rem;
    position: relative;

    .avatar-section {
        margin-top: -60px;
        margin-bottom: 1.5rem;

        .avatar-container {
            position: relative;
            display: inline-block;

            .avatar-edit-btn {
                position: absolute;
                bottom: 0;
                right: 0;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                background: #007bff;
                color: white;
                border: 2px solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                font-size: 0.8rem;

                &:hover {
                    background: #0056b3;
                }
            }
        }
    }

    .user-details {
        .user-name {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.25rem;
            color: #333;
        }

        .user-username {
            color: #6c757d;
            margin-bottom: 0.5rem;
        }

        .user-bio {
            margin-bottom: 1.5rem;
            line-height: 1.6;
        }
    }

    .user-stats {
        display: flex;
        gap: 2rem;
        margin-bottom: 1.5rem;

        .stat-item {
            cursor: pointer;
            transition: transform 0.2s ease;

            &:hover {
                transform: translateY(-2px);
            }

            .stat-number {
                display: block;
                font-size: 1.25rem;
                font-weight: 700;
                color: #333;
            }

            .stat-label {
                font-size: 0.9rem;
                color: #6c757d;
            }
        }
    }

    .user-actions {
        display: flex;
        gap: 0.5rem;
    }
}

.profile-tabs {
    background: white;
    border-bottom: 1px solid #e9ecef;

    .nav-tabs {
        border-bottom: none;

        .nav-link {
            border: none;
            color: #6c757d;
            padding: 1rem 1.5rem;
            font-weight: 500;

            &:hover {
                border-color: transparent;
                color: #495057;
            }

            &.active {
                color: #007bff;
                border-bottom: 3px solid #007bff;
                background: none;
            }
        }
    }
}

.tab-content {
    padding: 2rem 0;
}

.posts-grid {
    display: grid;
    gap: 1.5rem;
}

.photos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 1rem;

    .photo-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: 0.5rem;
        overflow: hidden;
        cursor: pointer;

        img {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
        }

        .photo-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            opacity: 0;
            transition: opacity 0.3s ease;

            i {
                font-size: 1.5rem;
            }
        }

        &:hover {
            img {
                transform: scale(1.05);
            }

            .photo-overlay {
                opacity: 1;
            }
        }
    }
}

.videos-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1rem;

    .video-item {
        position: relative;
        aspect-ratio: 16/9;
        border-radius: 0.5rem;
        overflow: hidden;
        cursor: pointer;

        .video-thumbnail {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .video-overlay {
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
            transition: all 0.3s ease;
        }

        .video-duration {
            position: absolute;
            bottom: 0.5rem;
            right: 0.5rem;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 0.25rem 0.5rem;
            border-radius: 0.25rem;
            font-size: 0.8rem;
        }

        &:hover .video-overlay {
            background: rgba(0, 0, 0, 0.9);
            transform: translate(-50%, -50%) scale(1.1);
        }
    }
}

.empty-state {
    text-align: center;
    padding: 4rem 2rem;
    background: white;
    border-radius: 0.75rem;
    border: 1px solid #e9ecef;
}

.loading-skeleton {

    .skeleton-post,
    .photos-skeleton,
    .videos-skeleton {
        height: 200px;
        background: #f8f9fa;
        border-radius: 0.5rem;
        margin-bottom: 1rem;
        animation: pulse 1.5s ease-in-out infinite alternate;
    }

    .photos-skeleton,
    .videos-skeleton {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1rem;

        &::before {
            content: '';
            aspect-ratio: 1;
        }
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
    .profile-info {
        padding: 0 1rem 1.5rem;

        .user-stats {
            gap: 1rem;
        }

        .user-actions {
            flex-direction: column;
        }
    }

    .profile-tabs .nav-tabs {
        flex-wrap: nowrap;
        overflow-x: auto;

        .nav-link {
            white-space: nowrap;
            padding: 1rem;
        }
    }

    .photos-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    }

    .videos-grid {
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    }
}
</style>