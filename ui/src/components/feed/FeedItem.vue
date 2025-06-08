<template>
    <article class="feed-item">
        <!-- User recommendation (for discover feed) -->
        <div v-if="item.type === 'user_suggestion'" class="user-suggestion">
            <div class="suggestion-header">
                <h6><i class="fas fa-user-plus me-2"></i>Gợi ý kết bạn</h6>
            </div>

            <UserCard :user="item.user" :show-online-status="true" :show-stats="true" @follow="handleFollow"
                @message="handleMessage" />
        </div>

        <!-- Trending topic (for trending feed) -->
        <div v-else-if="item.type === 'trending_topic'" class="trending-topic">
            <div class="trending-header">
                <h6><i class="fas fa-fire me-2"></i>Xu hướng</h6>
                <span class="trending-count">{{ formatNumber(item.postsCount) }} bài viết</span>
            </div>

            <div class="trending-content">
                <h5 class="trending-title">#{{ item.hashtag }}</h5>
                <p class="trending-description">{{ item.description }}</p>

                <div class="trending-preview">
                    <div v-for="post in item.samplePosts.slice(0, 3)" :key="post.id" class="preview-post"
                        @click="viewPost(post)">
                        <img v-if="post.thumbnail" :src="post.thumbnail" :alt="post.title" class="preview-image">
                        <div class="preview-text">{{ truncateText(post.content, 60) }}</div>
                    </div>
                </div>

                <button class="btn btn-outline-primary btn-sm" @click="exploreTrending">
                    Khám phá {{ item.hashtag }}
                </button>
            </div>
        </div>

        <!-- Regular post -->
        <div v-else class="post-item">
            <PostCard :post="item" @like="handleLike" @comment="handleComment" @share="handleShare" @save="handleSave"
                @edit="handleEdit" @delete="handleDelete" @report="handleReport" />

            <!-- Additional feed-specific actions -->
            <div v-if="showFeedActions" class="feed-actions">
                <button class="btn btn-sm btn-outline-secondary" @click="hidePost">
                    <i class="fas fa-eye-slash me-1"></i>Ẩn bài viết
                </button>

                <div class="dropdown">
                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle" data-bs-toggle="dropdown"
                        aria-expanded="false">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                    <ul class="dropdown-menu">
                        <li>
                            <a class="dropdown-item" href="#" @click="hideFromUser">
                                <i class="fas fa-user-slash me-2"></i>Ẩn từ {{ item.author.name }}
                            </a>
                        </li>
                        <li>
                            <a class="dropdown-item" href="#" @click="notInterested">
                                <i class="fas fa-thumbs-down me-2"></i>Không quan tâm
                            </a>
                        </li>
                        <li>
                            <hr class="dropdown-divider">
                        </li>
                        <li>
                            <a class="dropdown-item text-danger" href="#" @click="reportPost">
                                <i class="fas fa-flag me-2"></i>Báo cáo bài viết
                            </a>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </article>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import PostCard from '@/components/post/PostCard.vue'
import UserCard from '@/components/user/UserCard.vue'

const props = defineProps({
    item: {
        type: Object,
        required: true
    },
    feedType: {
        type: String,
        default: 'home'
    }
})

const emit = defineEmits([
    'like', 'comment', 'share', 'save', 'edit', 'delete', 'report',
    'follow', 'message', 'hide', 'not-interested'
])

const router = useRouter()

// Computed
const showFeedActions = computed(() => {
    return props.feedType === 'home' || props.feedType === 'discover'
})

// Actions
const handleLike = () => {
    emit('like', props.item)
}

const handleComment = () => {
    emit('comment', props.item)
}

const handleShare = () => {
    emit('share', props.item)
}

const handleSave = () => {
    emit('save', props.item)
}

const handleEdit = () => {
    emit('edit', props.item)
}

const handleDelete = () => {
    emit('delete', props.item)
}

const handleReport = () => {
    emit('report', props.item)
}

const handleFollow = (user) => {
    emit('follow', user)
}

const handleMessage = (user) => {
    emit('message', user)
}

const hidePost = () => {
    emit('hide', props.item)
}

const hideFromUser = () => {
    emit('hide', props.item, { type: 'user', userId: props.item.author.id })
}

const notInterested = () => {
    emit('not-interested', props.item)
}

const reportPost = () => {
    emit('report', props.item)
}

const viewPost = (post) => {
    router.push(`/app/post/${post.id}`)
}

const exploreTrending = () => {
    router.push(`/app/search?q=%23${props.item.hashtag}`)
}

// Utilities
const formatNumber = (num) => {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
}

const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}
</script>

<style lang="scss" scoped>
.feed-item {
    margin-bottom: 1rem;

    .user-suggestion,
    .trending-topic,
    .post-item {
        background: white;
        border-radius: 0.75rem;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        border: 1px solid var(--bs-border-color);
        overflow: hidden;
    }

    .user-suggestion {
        .suggestion-header {
            padding: 1rem 1rem 0 1rem;

            h6 {
                margin: 0;
                font-weight: 600;
                color: var(--bs-primary);
            }
        }
    }

    .trending-topic {
        .trending-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            border-bottom: 1px solid var(--bs-border-color);

            h6 {
                margin: 0;
                font-weight: 600;
                color: var(--bs-warning);
            }

            .trending-count {
                font-size: 0.875rem;
                color: var(--bs-secondary);
            }
        }

        .trending-content {
            padding: 1rem;

            .trending-title {
                margin: 0 0 0.5rem 0;
                font-weight: 700;
                color: var(--bs-info);
            }

            .trending-description {
                margin: 0 0 1rem 0;
                color: var(--bs-secondary);
                line-height: 1.5;
            }

            .trending-preview {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                gap: 0.75rem;
                margin-bottom: 1rem;

                .preview-post {
                    cursor: pointer;
                    border-radius: 0.5rem;
                    overflow: hidden;
                    border: 1px solid var(--bs-border-color);
                    transition: transform 0.2s ease;

                    &:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
                    }

                    .preview-image {
                        width: 100%;
                        height: 80px;
                        object-fit: cover;
                    }

                    .preview-text {
                        padding: 0.5rem;
                        font-size: 0.75rem;
                        line-height: 1.3;
                        color: var(--bs-body-color);
                    }
                }
            }
        }
    }

    .post-item {
        .feed-actions {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            border-top: 1px solid var(--bs-border-color);
            background: var(--bs-light);
        }
    }
}

// Mobile adjustments
@media (max-width: 768px) {
    .feed-item {
        margin-bottom: 0.75rem;

        .trending-topic {
            .trending-content {
                .trending-preview {
                    grid-template-columns: 1fr;

                    .preview-post {
                        display: flex;

                        .preview-image {
                            width: 80px;
                            height: 60px;
                            flex-shrink: 0;
                        }

                        .preview-text {
                            flex: 1;
                        }
                    }
                }
            }
        }
    }
}
</style>
