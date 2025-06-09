<template>
    <div class="user-profile">
        <div class="profile-header">
            <div class="cover-photo">
                <img v-if="user.coverPhoto" :src="user.coverPhoto" alt="Cover photo" class="cover-image">
                <div v-else class="cover-placeholder"></div>

                <button v-if="isOwnProfile" class="btn btn-light btn-sm cover-edit-btn" @click="editCoverPhoto">
                    <i class="fas fa-camera"></i>
                </button>
            </div>

            <div class="profile-info">
                <div class="avatar-section">
                    <UserAvatar :src="user.avatar" :name="user.name" size="2xl" :show-online-status="true"
                        :is-online="user.isOnline" />
                    <button v-if="isOwnProfile" class="btn btn-light btn-sm avatar-edit-btn" @click="editAvatar">
                        <i class="fas fa-camera"></i>
                    </button>
                </div>

                <div class="user-details">
                    <h1 class="user-name">{{ user.name }}</h1>
                    <p class="user-username">@{{ user.username }}</p>

                    <div v-if="user.bio" class="user-bio">
                        {{ user.bio }}
                    </div>

                    <div class="user-meta">
                        <div v-if="user.location" class="meta-item">
                            <i class="fas fa-map-marker-alt"></i>
                            <span>{{ user.location }}</span>
                        </div>
                        <div v-if="user.website" class="meta-item">
                            <i class="fas fa-link"></i>
                            <a :href="user.website" target="_blank" rel="noopener noreferrer">
                                {{ formatWebsite(user.website) }}
                            </a>
                        </div>
                        <div class="meta-item">
                            <i class="fas fa-calendar-alt"></i>
                            <span>Tham gia {{ formatJoinDate(user.createdAt) }}</span>
                        </div>
                    </div>

                    <div class="user-stats">
                        <div class="stat-item">
                            <span class="stat-value">{{ formatNumber(user.postsCount) }}</span>
                            <span class="stat-label">Bài viết</span>
                        </div>
                        <div class="stat-item" @click="showFollowers">
                            <span class="stat-value">{{ formatNumber(user.followersCount) }}</span>
                            <span class="stat-label">Người theo dõi</span>
                        </div>
                        <div class="stat-item" @click="showFollowing">
                            <span class="stat-value">{{ formatNumber(user.followingCount) }}</span>
                            <span class="stat-label">Đang theo dõi</span>
                        </div>
                    </div>
                </div>

                <div class="profile-actions">
                    <template v-if="isOwnProfile">
                        <button class="btn btn-outline-primary" @click="editProfile">
                            <i class="fas fa-edit me-1"></i>
                            Chỉnh sửa hồ sơ
                        </button>
                    </template>

                    <template v-else>
                        <button :class="['btn', user.isFollowing ? 'btn-outline-primary' : 'btn-primary']"
                            @click="toggleFollow" :disabled="followLoading">
                            <span v-if="followLoading" class="spinner-border spinner-border-sm me-1"></span>
                            {{ user.isFollowing ? 'Đang theo dõi' : 'Theo dõi' }}
                        </button>

                        <button class="btn btn-outline-secondary" @click="sendMessage">
                            <i class="fas fa-envelope me-1"></i>
                            Nhắn tin
                        </button>

                        <div class="dropdown">
                            <button class="btn btn-outline-secondary" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="fas fa-ellipsis-h"></i>
                            </button>
                            <ul class="dropdown-menu">
                                <li>
                                    <a class="dropdown-item" href="#" @click="shareProfile">
                                        <i class="fas fa-share me-2"></i>Chia sẻ hồ sơ
                                    </a>
                                </li>
                                <li>
                                    <hr class="dropdown-divider">
                                </li>
                                <li>
                                    <a class="dropdown-item text-danger" href="#" @click="blockUser">
                                        <i class="fas fa-ban me-2"></i>Chặn người dùng
                                    </a>
                                </li>
                                <li>
                                    <a class="dropdown-item text-danger" href="#" @click="reportUser">
                                        <i class="fas fa-flag me-2"></i>Báo cáo
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { useToast } from 'vue-toastification'
import UserAvatar from './UserAvatar.vue'

const props = defineProps({
    user: {
        type: Object,
        required: true
    }
})

const emit = defineEmits(['edit', 'follow', 'unfollow', 'message', 'block', 'report'])

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const toast = useToast()

// State
const followLoading = ref(false)

// Computed
const isOwnProfile = computed(() => {
    return authStore.userId === props.user.id
})

// Actions
const editProfile = () => {
    emit('edit')
    router.push('/app/settings/profile')
}

const editAvatar = () => {
    // Trigger file upload for avatar
    console.log('Edit avatar')
}

const editCoverPhoto = () => {
    // Trigger file upload for cover photo
    console.log('Edit cover photo')
}

const toggleFollow = async () => {
    if (followLoading.value) return

    followLoading.value = true

    try {
        if (props.user.isFollowing) {
            await userStore.unfollowUser(props.user.id)
            emit('unfollow', props.user)
        } else {
            await userStore.followUser(props.user.id)
            emit('follow', props.user)
        }
    } catch (error) {
        console.error('Toggle follow error:', error)
    } finally {
        followLoading.value = false
    }
}

const sendMessage = () => {
    emit('message', props.user)
    router.push(`/app/chat?userId=${props.user.id}`)
}

const shareProfile = () => {
    if (navigator.share) {
        navigator.share({
            title: `${props.user.name} - Social Connect`,
            url: window.location.href
        })
    } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href)
        toast.success('Đã sao chép link hồ sơ!')
    }
}

const blockUser = () => {
    emit('block', props.user)
}

const reportUser = () => {
    emit('report', props.user)
}

const showFollowers = () => {
    router.push(`/app/profile/${props.user.id}/followers`)
}

const showFollowing = () => {
    router.push(`/app/profile/${props.user.id}/following`)
}

// Utility functions
const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
}

const formatWebsite = (url) => {
    return url.replace(/^https?:\/\//, '')
}

const formatJoinDate = (date) => {
    const joinDate = new Date(date)
    return new Intl.DateTimeFormat('vi-VN', {
        month: 'long',
        year: 'numeric'
    }).format(joinDate)
}
</script>

<style lang="scss" scoped>
.user-profile {
    .profile-header {
        background: white;
        border-radius: 1rem;
        overflow: hidden;
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

        .cover-photo {
            position: relative;
            height: 200px;

            .cover-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .cover-placeholder {
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, var(--bs-primary), var(--bs-info));
            }

            .cover-edit-btn {
                position: absolute;
                bottom: 1rem;
                right: 1rem;
            }
        }

        .profile-info {
            padding: 0 2rem 2rem 2rem;
            position: relative;

            .avatar-section {
                position: relative;
                margin-top: -60px;
                margin-bottom: 1rem;

                .avatar-edit-btn {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    border-radius: 50%;
                    width: 32px;
                    height: 32px;
                    padding: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
            }

            .user-details {
                margin-bottom: 2rem;

                .user-name {
                    font-size: 2rem;
                    font-weight: 700;
                    margin-bottom: 0.25rem;
                }

                .user-username {
                    color: var(--bs-secondary);
                    font-size: 1.125rem;
                    margin-bottom: 1rem;
                }

                .user-bio {
                    font-size: 1rem;
                    line-height: 1.6;
                    margin-bottom: 1rem;
                }

                .user-meta {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 1rem;
                    margin-bottom: 1.5rem;

                    .meta-item {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        color: var(--bs-secondary);
                        font-size: 0.875rem;

                        i {
                            width: 16px;
                            text-align: center;
                        }

                        a {
                            color: var(--bs-primary);
                            text-decoration: none;

                            &:hover {
                                text-decoration: underline;
                            }
                        }
                    }
                }

                .user-stats {
                    display: flex;
                    gap: 2rem;

                    .stat-item {
                        cursor: pointer;
                        transition: color 0.2s ease;

                        &:hover {
                            color: var(--bs-primary);
                        }

                        .stat-value {
                            font-weight: 600;
                            font-size: 1.125rem;
                            margin-right: 0.25rem;
                        }

                        .stat-label {
                            color: var(--bs-secondary);
                            font-size: 0.875rem;
                        }
                    }
                }
            }

            .profile-actions {
                display: flex;
                gap: 0.75rem;
                align-items: center;

                @media (max-width: 768px) {
                    flex-direction: column;
                    align-items: stretch;
                }
            }
        }
    }
}
</style>