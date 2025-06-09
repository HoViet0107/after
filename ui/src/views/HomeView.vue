<template>
    <div class="home-view">
        <!-- Hero Section -->
        <section class="hero-section">
            <div class="container">
                <div class="row align-items-center min-vh-100">
                    <div class="col-lg-6">
                        <div class="hero-content">
                            <h1 class="hero-title">Kết nối và chia sẻ với thế giới</h1>
                            <p class="hero-subtitle">
                                Nền tảng mạng xã hội hiện đại, giúp bạn kết nối với bạn bè,
                                chia sẻ khoảnh khắc và khám phá những điều thú vị mỗi ngày.
                            </p>
                            <div class="hero-actions">
                                <router-link to="/auth/register" class="btn btn-primary btn-lg me-3">
                                    Bắt đầu ngay
                                </router-link>
                                <router-link to="/auth/login" class="btn btn-outline-primary btn-lg">
                                    Đăng nhập
                                </router-link>
                            </div>
                            <div class="hero-stats mt-4">
                                <div class="row">
                                    <div class="col-4">
                                        <div class="stat-item">
                                            <h3 class="stat-number">1M+</h3>
                                            <p class="stat-label">Người dùng</p>
                                        </div>
                                    </div>
                                    <div class="col-4">
                                        <div class="stat-item">
                                            <h3 class="stat-number">10M+</h3>
                                            <p class="stat-label">Bài viết</p>
                                        </div>
                                    </div>
                                    <div class="col-4">
                                        <div class="stat-item">
                                            <h3 class="stat-number">50M+</h3>
                                            <p class="stat-label">Kết nối</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-lg-6">
                        <div class="hero-visual">
                            <div class="hero-mockup">
                                <img src="/images/app-mockup.png" alt="App Preview" class="img-fluid">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="features-section py-5">
            <div class="container">
                <div class="text-center mb-5">
                    <h2 class="section-title">Tính năng nổi bật</h2>
                    <p class="section-subtitle">
                        Khám phá những tính năng tuyệt vời giúp bạn kết nối và chia sẻ dễ dàng hơn
                    </p>
                </div>

                <div class="row">
                    <div v-for="feature in features" :key="feature.id" class="col-lg-4 col-md-6 mb-4">
                        <div class="feature-card h-100">
                            <div class="feature-icon">
                                <i :class="feature.icon"></i>
                            </div>
                            <h4 class="feature-title">{{ feature.title }}</h4>
                            <p class="feature-description">{{ feature.description }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section py-5">
            <div class="container">
                <div class="row justify-content-center">
                    <div class="col-lg-8 text-center">
                        <h2 class="cta-title text-white">Sẵn sàng tham gia?</h2>
                        <p class="cta-description text-white mb-4">
                            Tham gia cộng đồng hàng triệu người dùng và bắt đầu hành trình kết nối của bạn ngay hôm nay
                        </p>
                        <router-link to="/auth/register" class="btn btn-light btn-lg">
                            Đăng ký miễn phí
                        </router-link>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useHead } from '@unhead/vue'

// Meta tags
useHead({
    title: 'Trang chủ - Social Connect',
    meta: [
        { name: 'description', content: 'Nền tảng mạng xã hội hiện đại để kết nối và chia sẻ' },
        { property: 'og:title', content: 'Social Connect - Kết nối và chia sẻ' },
        { property: 'og:description', content: 'Tham gia cộng đồng và kết nối với bạn bè' }
    ]
})

// Data
const features = ref([
    {
        id: 1,
        icon: 'fas fa-users',
        title: 'Kết nối bạn bè',
        description: 'Tìm và kết nối với bạn bè, đồng nghiệp và những người có cùng sở thích.'
    },
    {
        id: 2,
        icon: 'fas fa-share-alt',
        title: 'Chia sẻ khoảnh khắc',
        description: 'Chia sẻ những khoảnh khắc đẹp trong cuộc sống với ảnh, video và story.'
    },
    {
        id: 3,
        icon: 'fas fa-comments',
        title: 'Nhắn tin thời gian thực',
        description: 'Trò chuyện tức thời với bạn bè qua tin nhắn cá nhân và nhóm chat.'
    },
    {
        id: 4,
        icon: 'fas fa-globe',
        title: 'Khám phá thế giới',
        description: 'Khám phá nội dung thú vị từ khắp nơi trên thế giới qua feed cá nhân hóa.'
    },
    {
        id: 5,
        icon: 'fas fa-shield-alt',
        title: 'Bảo mật tuyệt đối',
        description: 'Thông tin cá nhân được bảo vệ với công nghệ mã hóa tiên tiến nhất.'
    },
    {
        id: 6,
        icon: 'fas fa-mobile-alt',
        title: 'Đa nền tảng',
        description: 'Sử dụng mọi lúc mọi nơi trên điện thoại, máy tính bảng và desktop.'
    }
])

// Lifecycle
onMounted(() => {
    // Add entrance animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in')
            }
        })
    }, observerOptions)

    document.querySelectorAll('.feature-card, .hero-content').forEach(el => {
        observer.observe(el)
    })
})
</script>

<style lang="scss" scoped>
.home-view {
    overflow-x: hidden;
}

// Hero Section
.hero-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;

    &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: url('/patterns/hero-pattern.svg') no-repeat center;
        background-size: cover;
        opacity: 0.1;
    }

    .hero-content {
        position: relative;
        z-index: 2;
        color: white;

        .hero-title {
            font-size: 3.5rem;
            font-weight: 700;
            margin-bottom: 1.5rem;
            line-height: 1.2;

            @media (max-width: 768px) {
                font-size: 2.5rem;
            }
        }

        .hero-subtitle {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.95;
            line-height: 1.6;
        }

        .hero-actions {
            margin-bottom: 3rem;

            .btn {
                border-radius: 50px;
                padding: 0.75rem 2rem;
                font-weight: 600;
                transition: all 0.3s ease;

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }
            }
        }
    }

    .hero-visual {
        position: relative;

        .hero-mockup {
            animation: float 6s ease-in-out infinite;

            img {
                filter: drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3));
            }
        }
    }

    .hero-stats {
        .stat-item {
            text-align: center;

            .stat-number {
                font-size: 2rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
                color: #fff;
            }

            .stat-label {
                font-size: 0.9rem;
                opacity: 0.8;
                margin: 0;
            }
        }
    }
}

// Features Section
.features-section {
    background: #f8f9fa;

    .section-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: #333;
        margin-bottom: 1rem;
    }

    .section-subtitle {
        font-size: 1.1rem;
        color: #6c757d;
        max-width: 600px;
        margin: 0 auto;
    }

    .feature-card {
        background: white;
        border-radius: 1rem;
        padding: 2rem;
        text-align: center;
        transition: all 0.3s ease;
        border: 1px solid #e9ecef;
        opacity: 0;
        transform: translateY(30px);

        &.animate-in {
            opacity: 1;
            transform: translateY(0);
        }

        &:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border-color: #667eea;
        }

        .feature-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;

            i {
                font-size: 2rem;
                color: white;
            }
        }

        .feature-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: #333;
        }

        .feature-description {
            color: #6c757d;
            line-height: 1.6;
            margin: 0;
        }
    }
}

// CTA Section
.cta-section {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

    .cta-title {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 1rem;
    }

    .cta-description {
        font-size: 1.1rem;
        opacity: 0.95;
        line-height: 1.6;
    }

    .btn {
        border-radius: 50px;
        padding: 0.75rem 2rem;
        font-weight: 600;
        transition: all 0.3s ease;

        &:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
        }
    }
}

// Animations
@keyframes float {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-20px);
    }
}

// Responsive
@media (max-width: 768px) {
    .hero-section {
        .hero-content {
            text-align: center;
            margin-bottom: 3rem;
        }
    }

    .features-section {
        .feature-card {
            margin-bottom: 2rem;
        }
    }
}
</style>