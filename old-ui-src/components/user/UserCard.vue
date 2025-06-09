<template>
    <div class="user-card">
        <div class="user-card-header">
            <UserAvatar :src="user.avatar" :name="user.name" :show-online-status="showOnlineStatus"
                :is-online="user.isOnline" size="lg" clickable @click="viewProfile" />

            <div class="user-info">
                <h6 class="user-name" @click="viewProfile">{{ user.name }}</h6>
                <p class="user-username">@{{ user.username }}</p>
                <p v-if="user.bio" class="user-bio">{{ user.bio }}</p>
            </div>

            <div class="user-actions">
                <button v-if="!isCurrentUser" :class="['btn', user.isFollowing ? 'btn-outline-primary' : 'btn-primary']"
                    @click="toggleFollow" :disabled="isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
                    {{ user.isFollowing ? 'Đang theo dõi' : 'Theo dõi' }}
                </button>

                <div class="dropdown" v-if="showActions">
                    <button class="btn btn-outline-secondary btn-sm" data-bs-toggle="dropdown" aria-expanded="false">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" href="#" @click="sendMessage">
                                <i class="fas fa-envelope me-2"></i>Nhắn tin
                            </a></li>
                        <li><a class="dropdown-item" href="#" @click="viewProfile">
                                <i class="fas fa-user me-2"></i>Xem hồ sơ
                            </a></li>
                        <li v-if="!isCurrentUser">
                            <hr class="dropdown-divider">
                        </li>
                        <li v-if="!isCurrentUser">
                            <a class="dropdown-item text-danger" href="#" @click="blockUser">
                                <i class="fas fa-ban me-2"></i>Chặn người dùng
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>

        <div v-if="showStats" class="user-stats">
            <div class="stat-item">
                <span class="stat-value">{{ formatNumber(user.postsCount) }}</span>
                <span class="stat-label">Bài viết</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">{{ formatNumber(user.followersCount) }}</span>
                <span class="stat-label">Người theo dõi</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">{{ formatNumber(user.followingCount) }}</span>
                <span class="stat-label">Đang theo dõi</span>
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
    },
    showOnlineStatus: {
        type: Boolean,
        default: false
    },
    showStats: {
        type: Boolean,
        default: true
    },
    showActions: {
        type: Boolean,
        default: true
    }
})

const emit = defineEmits(['follow', 'unfollow', 'message', 'block'])

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()
const toast = useToast()

// State
const isLoading = ref(false)

// Computed
const isCurrentUser = computed(() => {
    return authStore.userId === props.user.id
})

// Actions
const viewProfile = () => {
    router.push(`/app/profile/${props.user.id}`)
}

const toggleFollow = async () => {
    if (isLoading.value) return

    isLoading.value = true

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
        isLoading.value = false
    }
}

const sendMessage = () => {
    emit('message', props.user)
    // Navigate to chat with this user
    router.push(`/app/chat?userId=${props.user.id}`)
}

const blockUser = async () => {
    if (confirm(`Bạn có chắc chắn muốn chặn ${props.user.name}?`)) {
        try {
            await userStore.blockUser(props.user.id)
            emit('block', props.user)
            toast.success(`Đã chặn ${props.user.name}`)
        } catch (error) {
            toast.error('Không thể chặn người dùng này')
        }
    }
}

const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
}
</script>

<style lang="scss" scoped>
.user-card {
    background: white;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    border: 1px solid var(--bs-border-color);

    .user-card-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;

        .user-info {
            flex: 1;
            min-width: 0;

            .user-name {
                margin: 0 0 0.25rem 0;
                font-weight: 600;
                cursor: pointer;

                &:hover {
                    color: var(--bs-primary);
                }
            }

            .user-username {
                margin: 0 0 0.5rem 0;
                color: var(--bs-secondary);
                font-size: 0.875rem;
            }

            .user-bio {
                margin: 0;
                font-size: 0.875rem;
                color: var(--bs-body-color);
                line-height: 1.4;
            }
        }

        .user-actions {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    }

    .user-stats {
        display: flex;
        justify-content: space-around;
        margin-top: 1.5rem;
        padding-top: 1rem;
        border-top: 1px solid var(--bs-border-color);

        .stat-item {
            text-align: center;

            .stat-value {
                display: block;
                font-size: 1.25rem;
                font-weight: 600;
                color: var(--bs-body-color);
            }

            .stat-label {
                display: block;
                font-size: 0.75rem;
                color: var(--bs-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        }
    }
}
</style>