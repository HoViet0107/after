<template>
    <div class="trending-topics">
        <div v-if="isLoading" class="loading-container">
            <LoadingSpinner size="small" />
        </div>

        <div v-else-if="topics.length === 0" class="empty-state">
            <p class="text-muted">Chưa có xu hướng nào</p>
        </div>

        <div v-else class="topics-list">
            <div v-for="(topic, index) in topics" :key="topic.hashtag" class="topic-item" @click="exploreTopic(topic)">
                <div class="topic-rank">{{ index + 1 }}</div>

                <div class="topic-content">
                    <h6 class="topic-title">#{{ topic.hashtag }}</h6>
                    <p class="topic-description">{{ topic.description }}</p>
                    <div class="topic-stats">
                        <span class="posts-count">
                            <i class="fas fa-file-alt me-1"></i>
                            {{ formatNumber(topic.postsCount) }} bài viết
                        </span>
                        <span class="engagement-rate">
                            <i class="fas fa-fire me-1"></i>
                            {{ formatEngagement(topic.engagementRate) }}
                        </span>
                    </div>
                </div>

                <div class="topic-trend">
                    <i :class="getTrendIcon(topic.trend)" :title="getTrendLabel(topic.trend)"></i>
                </div>
            </div>

            <div class="view-more">
                <router-link to="/app/trending" class="btn btn-sm btn-outline-primary w-100">
                    Xem tất cả xu hướng
                </router-link>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { feedService } from '@/api/services/feedService'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

const router = useRouter()

// State
const topics = ref([])
const isLoading = ref(false)
const error = ref(null)

// Actions
const loadTrendingTopics = async () => {
    isLoading.value = true
    error.value = null

    try {
        // Mock data for now
        topics.value = [
            {
                hashtag: 'VietNam',
                description: 'Những câu chuyện về Việt Nam',
                postsCount: 12500,
                engagementRate: 0.85,
                trend: 'up'
            },
            {
                hashtag: 'Technology',
                description: 'Công nghệ và đổi mới',
                postsCount: 8900,
                engagementRate: 0.72,
                trend: 'up'
            },
            {
                hashtag: 'Travel',
                description: 'Du lịch và khám phá',
                postsCount: 6700,
                engagementRate: 0.68,
                trend: 'stable'
            },
            {
                hashtag: 'Food',
                description: 'Ẩm thực và món ngon',
                postsCount: 5400,
                engagementRate: 0.45,
                trend: 'down'
            },
            {
                hashtag: 'Sport',
                description: 'Thể thao và sức khỏe',
                postsCount: 4200,
                engagementRate: 0.56,
                trend: 'up'
            }
        ]

        // Uncomment when API is ready
        // const response = await feedService.getTrendingTopics({ limit: 5 })
        // topics.value = response.data

    } catch (err) {
        error.value = err
        console.error('Failed to load trending topics:', err)
    } finally {
        isLoading.value = false
    }
}

const exploreTopic = (topic) => {
    router.push(`/app/search?q=%23${topic.hashtag}`)
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

const formatEngagement = (rate) => {
    return Math.round(rate * 100) + '%'
}

const getTrendIcon = (trend) => {
    switch (trend) {
        case 'up':
            return 'fas fa-arrow-up text-success'
        case 'down':
            return 'fas fa-arrow-down text-danger'
        case 'stable':
            return 'fas fa-minus text-warning'
        default:
            return 'fas fa-minus text-secondary'
    }
}

const getTrendLabel = (trend) => {
    switch (trend) {
        case 'up':
            return 'Đang tăng'
        case 'down':
            return 'Đang giảm'
        case 'stable':
            return 'Ổn định'
        default:
            return 'Không xác định'
    }
}

// Lifecycle
onMounted(() => {
    loadTrendingTopics()
})
</script>

<style lang="scss" scoped>
.trending-topics {
    .loading-container {
        display: flex;
        justify-content: center;
        padding: 2rem;
    }

    .empty-state {
        text-align: center;
        padding: 2rem;
    }

    .topics-list {
        .topic-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            cursor: pointer;
            border-radius: 0.5rem;
            transition: background-color 0.2s ease;

            &:hover {
                background-color: var(--bs-light);
            }

            .topic-rank {
                width: 24px;
                height: 24px;
                background: var(--bs-primary);
                color: white;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: 600;
                font-size: 0.75rem;
                flex-shrink: 0;
            }

            .topic-content {
                flex: 1;
                min-width: 0;

                .topic-title {
                    margin: 0 0 0.25rem 0;
                    font-weight: 600;
                    font-size: 0.95rem;
                    color: var(--bs-info);
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .topic-description {
                    margin: 0 0 0.5rem 0;
                    font-size: 0.8rem;
                    color: var(--bs-secondary);
                    line-height: 1.3;
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }

                .topic-stats {
                    display: flex;
                    gap: 1rem;
                    font-size: 0.75rem;
                    color: var(--bs-secondary);

                    span {
                        display: flex;
                        align-items: center;
                        white-space: nowrap;
                    }
                }
            }

            .topic-trend {
                flex-shrink: 0;

                i {
                    font-size: 0.875rem;
                }
            }
        }

        .view-more {
            padding: 0.75rem;
            border-top: 1px solid var(--bs-border-color);
            margin-top: 0.5rem;
        }
    }
}
</style>