<template>
    <div class="user-list-item">
        <div class="user-content">
            <UserAvatar :src="user.avatar" :name="user.name" :show-online-status="showOnlineStatus"
                :is-online="user.isOnline" size="medium" clickable @click="viewProfile" />

            <div class="user-info">
                <div class="user-main">
                    <h6 class="user-name" @click="viewProfile">{{ user.name }}</h6>
                    <span class="user-username">@{{ user.username }}</span>
                </div>

                <p v-if="user.bio && showBio" class="user-bio">{{ truncatedBio }}</p>

                <div v-if="showMutualInfo && user.mutualFriends" class="mutual-info">
                    <i class="fas fa-users me-1"></i>
                    {{ user.mutualFriends }} bạn chung
                </div>

                <UserStatusIndicator v-if="showStatus" :status="user.status" :last-seen="user.lastSeen" show-text />
            </div>
        </div>

        <div class="user-actions">
            <template v-if="!isCurrentUser">
                <button v-if="showFollowButton"
                    :class="['btn btn-sm', user.isFollowing ? 'btn-outline-primary' : 'btn-primary']"
                    @click="toggleFollow" :disabled="isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
                    {{ user.isFollowing ? 'Đang theo dõi' : 'Theo dõi' }}
                </button>

                <button v-if="showMessageButton" class="btn btn-sm btn-outline-secondary" @click="sendMessage">
                    <i class="fas fa-envelope"></i>
                </button>
            </template>

            <div v-if="showMoreActions" class="dropdown">
                <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown" aria-expanded="false">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li>
                        <a class="dropdown-item" href="#" @click="viewProfile">
                            <i class="fas fa-user me-2"></i>Xem hồ sơ
                        </a>
                    </li>
                    <li v-if="!isCurrentUser">
                        <a class="dropdown-item" href="#" @click="sendMessage">
                            <i class="fas fa-envelope me-2"></i>Nhắn tin
                        </a>
                    </li>
                    <li v-if="!isCurrentUser">
                        <hr class="dropdown-divider">
                    </li>
                    <li v-if="!isCurrentUser">
                        <a class="dropdown-item text-danger" href="#" @click="blockUser">
                            <i class="fas fa-ban me-2"></i>Chặn
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>
<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import UserAvatar from './UserAvatar.vue'
import UserStatusIndicator from './UserStatusIndicator.vue'

const props = defineProps({
    user: {
        type: Object,
        required: true
    },
    showOnlineStatus: {
        type: Boolean,
        default: false
    },
    showBio: {
        type: Boolean,
        default: true
    },
    showStatus: {
        type: Boolean,
        default: false
    },
    showFollowButton: {
        type: Boolean,
        default: true
    },
    showMessageButton: {
        type: Boolean,
        default: true
    },
    showMoreActions: {
        type: Boolean,
        default: true
    },
    showMutualInfo: {
        type: Boolean,
        default: false
    },
    bioMaxLength: {
        type: Number,
        default: 100
    }
})

const emit = defineEmits(['follow', 'unfollow', 'message', 'block', 'click'])

const router = useRouter()
const authStore = useAuthStore()
const userStore = useUserStore()

// State
const isLoading = ref(false)

// Computed
const isCurrentUser = computed(() => {
    return authStore.userId === props.user.id
})

const truncatedBio = computed(() => {
    if (!props.user.bio) return ''

    if (props.user.bio.length <= props.bioMaxLength) {
        return props.user.bio
    }

    return props.user.bio.substring(0, props.bioMaxLength) + '...'
})

// Actions
const viewProfile = () => {
    emit('click', props.user)
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
    router.push(`/app/chat?userId=${props.user.id}`)
}

const blockUser = () => {
    emit('block', props.user)
}
</script>

<style lang="scss" scoped>
.user-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 1rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    background: white;
    transition: all 0.2s ease;

    &:hover {
        border-color: var(--bs-primary);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    }

    .user-content {
        display: flex;
        align-items: center;
        gap: 1rem;
        flex: 1;
        min-width: 0;

        .user-info {
            flex: 1;
            min-width: 0;

            .user-main {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-bottom: 0.25rem;

                .user-name {
                    margin: 0;
                    font-weight: 600;
                    cursor: pointer;

                    &:hover {
                        color: var(--bs-primary);
                    }
                }

                .user-username {
                    color: var(--bs-secondary);
                    font-size: 0.875rem;
                }
            }

            .user-bio {
                margin: 0 0 0.5rem 0;
                font-size: 0.875rem;
                color: var(--bs-body-color);
                line-height: 1.4;
            }

            .mutual-info {
                font-size: 0.75rem;
                color: var(--bs-secondary);
                margin-bottom: 0.25rem;
            }
        }
    }

    .user-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-shrink: 0;
    }
}

// Responsive
@media (max-width: 576px) {
    .user-list-item {
        .user-content .user-info .user-main {
            flex-direction: column;
            align-items: flex-start;
            gap: 0.25rem;
        }

        .user-actions {
            flex-direction: column;
            align-items: flex-end;
        }
    }
}
</style>