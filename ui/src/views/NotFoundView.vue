// Trang lỗi 404 với gợi ý điều hướng và search functionality
<template>
    <div class="not-found-view">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8 col-md-10">
                    <div class="error-content text-center">
                        <!-- 404 Animation -->
                        <div class="error-animation mb-4">
                            <div class="error-number">
                                <span class="digit">4</span>
                                <span class="digit middle">0</span>
                                <span class="digit">4</span>
                            </div>
                            <div class="error-icon mt-3">
                                <i class="fas fa-search fa-3x text-muted"></i>
                            </div>
                        </div>

                        <!-- Error Message -->
                        <div class="error-message mb-4">
                            <h2 class="error-title mb-3">Trang không tìm thấy</h2>
                            <p class="error-description text-muted">
                                Xin lỗi, trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
                                Hãy kiểm tra lại đường dẫn hoặc sử dụng các liên kết bên dưới.
                            </p>
                        </div>

                        <!-- Search Box -->
                        <div class="error-search mb-5">
                            <div class="search-box">
                                <div class="input-group">
                                    <input
                                        v-model="searchQuery"
                                        type="text"
                                        class="form-control form-control-lg"
                                        placeholder="Tìm kiếm nội dung..."
                                        @keyup.enter="performSearch"
                                    >
                                    <button 
                                        class="btn btn-primary"
                                        @click="performSearch"
                                        :disabled="!searchQuery.trim()"
                                    >
                                        <i class="fas fa-search"></i>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Quick Actions -->
                        <div class="error-actions mb-5">
                            <h5 class="mb-3">Hoặc thử các trang sau:</h5>
                            <div class="row g-3">
                                <div class="col-md-3 col-6">
                                    <router-link 
                                        :to="{ name: 'Home' }" 
                                        class="action-card d-block text-decoration-none"
                                    >
                                        <div class="card h-100 text-center">
                                            <div class="card-body">
                                                <i class="fas fa-home fa-2x text-primary mb-2"></i>
                                                <h6 class="card-title">Trang chủ</h6>
                                                <small class="text-muted">Quay về trang chủ</small>
                                            </div>
                                        </div>
                                    </router-link>
                                </div>

                                <div class="col-md-3 col-6">
                                    <router-link 
                                        :to="{ name: 'Feed' }" 
                                        class="action-card d-block text-decoration-none"
                                    >
                                        <div class="card h-100 text-center">
                                            <div class="card-body">
                                                <i class="fas fa-stream fa-2x text-success mb-2"></i>
                                                <h6 class="card-title">Bảng tin</h6>
                                                <small class="text-muted">Xem bài viết mới</small>
                                            </div>
                                        </div>
                                    </router-link>
                                </div>

                                <div class="col-md-3 col-6">
                                    <router-link 
                                        :to="{ name: 'Search' }" 
                                        class="action-card d-block text-decoration-none"
                                    >
                                        <div class="card h-100 text-center">
                                            <div class="card-body">
                                                <i class="fas fa-search fa-2x text-info mb-2"></i>
                                                <h6 class="card-title">Tìm kiếm</h6>
                                                <small class="text-muted">Tìm người hoặc nội dung</small>
                                            </div>
                                        </div>
                                    </router-link>
                                </div>

                                <div class="col-md-3 col-6" v-if="isAuthenticated">
                                    <router-link 
                                        :to="{ name: 'Profile', params: { userId: currentUser?.id } }" 
                                        class="action-card d-block text-decoration-none"
                                    >
                                        <div class="card h-100 text-center">
                                            <div class="card-body">
                                                <i class="fas fa-user fa-2x text-warning mb-2"></i>
                                                <h6 class="card-title">Hồ sơ</h6>
                                                <small class="text-muted">Xem hồ sơ của bạn</small>
                                            </div>
                                        </div>
                                    </router-link>
                                </div>

                                <div class="col-md-3 col-6" v-else>
                                    <router-link 
                                        :to="{ name: 'Login' }" 
                                        class="action-card d-block text-decoration-none"
                                    >
                                        <div class="card h-100 text-center">
                                            <div class="card-body">
                                                <i class="fas fa-sign-in-alt fa-2x text-warning mb-2"></i>
                                                <h6 class="card-title">Đăng nhập</h6>
                                                <small class="text-muted">Truy cập tài khoản</small>
                                            </div>
                                        </div>
                                    </router-link>
                                </div>
                            </div>
                        </div>

                        <!-- Additional Help -->
                        <div class="error-help">
                            <div class="row">
                                <div class="col-md-6 mb-3">
                                    <div class="help-section">
                                        <h6><i class="fas fa-question-circle me-2"></i>Cần trợ giúp?</h6>
                                        <p class="small text-muted mb-2">
                                            Nếu bạn cho rằng đây là lỗi của hệ thống, vui lòng liên hệ với chúng tôi.
                                        </p>
                                        <button class="btn btn-outline-secondary btn-sm" @click="reportIssue">
                                            <i class="fas fa-bug me-1"></i>
                                            Báo cáo lỗi
                                        </button>
                                    </div>
                                </div>

                                <div class="col-md-6 mb-3">
                                    <div class="help-section">
                                        <h6><i class="fas fa-history me-2"></i>Lịch sử duyệt</h6>
                                        <p class="small text-muted mb-2">
                                            Quay lại trang trước đó hoặc xem lịch sử duyệt web.
                                        </p>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-outline-secondary btn-sm" @click="goBack">
                                                <i class="fas fa-arrow-left me-1"></i>
                                                Quay lại
                                            </button>
                                            <button class="btn btn-outline-secondary btn-sm" @click="reloadPage">
                                                <i class="fas fa-redo me-1"></i>
                                                Tải lại
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Popular Content -->
                        <div v-if="popularContent.length > 0" class="popular-content mt-5">
                            <h5 class="mb-3">Nội dung phổ biến</h5>
                            <div class="row g-3">
                                <div 
                                    v-for="item in popularContent" 
                                    :key="item.id"
                                    class="col-md-4"
                                >
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="d-flex align-items-start">
                                                <img
                                                    :src="item.author.avatar"
                                                    :alt="item.author.name"
                                                    class="rounded-circle me-2"
                                                    width="32"
                                                    height="32"
                                                >
                                                <div class="flex-grow-1">
                                                    <h6 class="card-title small mb-1">
                                                        {{ item.author.name }}
                                                    </h6>
                                                    <p class="card-text small text-muted">
                                                        {{ truncateText(item.content, 60) }}
                                                    </p>
                                                    <router-link 
                                                        :to="{ name: 'PostDetail', params: { postId: item.id } }"
                                                        class="btn btn-outline-primary btn-sm"
                                                    >
                                                        Xem chi tiết
                                                    </router-link>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

// Composables
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Reactive data
const searchQuery = ref('')
const popularContent = ref([])

// Computed
const isAuthenticated = computed(() => authStore.isAuthenticated)
const currentUser = computed(() => authStore.user)

// Methods
const performSearch = () => {
    if (searchQuery.value.trim()) {
        router.push({
            name: 'Search',
            query: { q: searchQuery.value.trim() }
        })
    }
}

const goBack = () => {
    if (window.history.length > 1) {
        router.go(-1)
    } else {
        router.push({ name: 'Home' })
    }
}

const reloadPage = () => {
    window.location.reload()
}

const reportIssue = () => {
    // TODO: Implement issue reporting functionality
    toast.info('Tính năng báo cáo lỗi sẽ được triển khai sớm')
}

const truncateText = (text, length) => {
    if (text.length <= length) return text
    return text.substring(0, length) + '...'
}

const loadPopularContent = async () => {
    try {
        // TODO: Replace with actual API call
        // Simulate popular content
        popularContent.value = [
            {
                id: '1',
                content: 'Những xu hướng công nghệ mới nhất trong năm 2025 đang tạo ra nhiều cơ hội thú vị...',
                author: {
                    id: '1',
                    name: 'Nguyễn Văn A',
                    avatar: '/default-avatar.png'
                }
            },
            {
                id: '2',
                content: 'Hướng dẫn học lập trình hiệu quả cho người mới bắt đầu từ cơ bản đến nâng cao...',
                author: {
                    id: '2',
                    name: 'Trần Thị B',
                    avatar: '/default-avatar.png'
                }
            },
            {
                id: '3',
                content: 'Kinh nghiệm du lịch tiết kiệm và an toàn trong thời kỳ mới...',
                author: {
                    id: '3',
                    name: 'Lê Văn C',
                    avatar: '/default-avatar.png'
                }
            }
        ]
    } catch (error) {
        console.error('Load popular content error:', error)
    }
}

// Lifecycle
onMounted(() => {
    loadPopularContent()
    
    // Add some entrance animation delay
    setTimeout(() => {
        document.querySelector('.error-content')?.classList.add('animate-in')
    }, 100)
})
</script>

<style lang="scss" scoped>
.not-found-view {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    padding: 2rem 0;

    .error-content {
        background: rgba(255, 255, 255, 0.95);
        border-radius: 1rem;
        padding: 3rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        backdrop-filter: blur(10px);
        opacity: 0;
        transform: translateY(30px);
        transition: all 0.6s ease;

        &.animate-in {
            opacity: 1;
            transform: translateY(0);
        }
    }

    .error-animation {
        .error-number {
            display: flex;
            justify-content: center;
            gap: 1rem;

            .digit {
                font-size: 6rem;
                font-weight: 900;
                color: #667eea;
                text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
                animation: bounce 2s infinite;

                &.middle {
                    animation-delay: 0.1s;
                }

                &:last-child {
                    animation-delay: 0.2s;
                }
            }
        }

        .error-icon {
            animation: float 3s ease-in-out infinite;
        }
    }

    .error-title {
        color: #333;
        font-weight: 700;
    }

    .error-description {
        font-size: 1.1rem;
        line-height: 1.6;
    }

    .search-box {
        max-width: 500px;
        margin: 0 auto;

        .input-group {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border-radius: 50px;
            overflow: hidden;

            .form-control {
                border: none;
                padding: 1rem 1.5rem;
                font-size: 1.1rem;

                &:focus {
                    box-shadow: none;
                }
            }

            .btn {
                border: none;
                padding: 1rem 1.5rem;
                background: linear-gradient(45deg, #667eea, #764ba2);
                border-radius: 0 50px 50px 0;

                &:hover {
                    background: linear-gradient(45deg, #5a6fd8, #6a4190);
                }
            }
        }
    }

    .action-card {
        transition: all 0.3s ease;

        &:hover {
            transform: translateY(-5px);
            text-decoration: none;

            .card {
                box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
            }
        }

        .card {
            border: none;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;

            .card-body {
                padding: 1.5rem;
            }

            .card-title {
                margin-bottom: 0.5rem;
                color: #333;
            }
        }
    }

    .help-section {
        h6 {
            color: #333;
            margin-bottom: 0.75rem;
        }

        .btn-group {
            .btn {
                font-size: 0.875rem;
            }
        }
    }

    .popular-content {
        .card {
            border: none;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            transition: all 0.3s ease;

            &:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            }

            .card-body {
                padding: 1rem;
            }

            .card-title {
                font-size: 0.875rem;
                color: #333;
            }

            .card-text {
                font-size: 0.8rem;
                line-height: 1.4;
            }
        }
    }
}

// Animations
@keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
        transform: translateY(0);
    }
    40% {
        transform: translateY(-10px);
    }
    60% {
        transform: translateY(-5px);
    }
}

@keyframes float {
    0% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-10px);
    }
    100% {
        transform: translateY(0px);
    }
}

@media (max-width: 768px) {
    .not-found-view {
        padding: 1rem 0;

        .error-content {
            padding: 2rem 1.5rem;
            margin: 0 1rem;
        }

        .error-animation {
            .error-number {
                .digit {
                    font-size: 4rem;
                }
            }
        }

        .error-title {
            font-size: 1.5rem;
        }

        .error-description {
            font-size: 1rem;
        }

        .action-card {
            margin-bottom: 1rem;
        }
    }
}
</style>