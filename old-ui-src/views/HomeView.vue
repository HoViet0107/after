<!-- Landing page với hero section, features showcase và call-to-action -->

<template>
    <div class="home-view">
        <!-- Hero Section -->
        <section class="hero-section" :class="{ 'hero-animate': heroLoaded }">
            <div class="hero-background">
                <div class="hero-particles" ref="particlesContainer"></div>
                <div class="hero-gradient"></div>
            </div>

            <div class="container">
                <div class="row align-items-center min-vh-100">
                    <div class="col-lg-6">
                        <div class="hero-content" data-aos="fade-up" data-aos-delay="100">
                            <h1 class="hero-title">
                                Kết nối và chia sẻ
                                <span class="text-gradient">mọi khoảnh khắc</span>
                            </h1>
                            <p class="hero-description">
                                Tham gia cộng đồng social media hiện đại, nơi bạn có thể kết nối với bạn bè, 
                                chia sẻ khoảnh khắc đặc biệt và khám phá những điều thú vị mỗi ngày.
                            </p>

                            <div class="hero-actions">
                                <router-link to="/register" class="btn btn-primary btn-lg me-3">
                                    <i class="fas fa-rocket me-2"></i>
                                    Bắt đầu ngay
                                </router-link>
                                <router-link to="/login" class="btn btn-outline-primary btn-lg">
                                    <i class="fas fa-sign-in-alt me-2"></i>
                                    Đăng nhập
                                </router-link>
                            </div>

                            <div class="hero-stats" data-aos="fade-up" data-aos-delay="200">
                                <div class="stat-item">
                                    <div class="stat-number" ref="usersCount">0</div>
                                    <div class="stat-label">Người dùng</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number" ref="postsCount">0</div>
                                    <div class="stat-label">Bài viết</div>
                                </div>
                                <div class="stat-item">
                                    <div class="stat-number" ref="connectionsCount">0</div>
                                    <div class="stat-label">Kết nối</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-6">
                        <div class="hero-visual" data-aos="fade-left" data-aos-delay="300">
                            <div class="mockup-container">
                                <div class="mockup-phone">
                                    <div class="mockup-screen">
                                        <img src="/images/app-preview.png" alt="App Preview" class="img-fluid" 
                                             @error="handleImageError">
                                    </div>
                                </div>
                                <div class="floating-elements">
                                    <div class="floating-card" v-for="card in floatingCards" :key="card.id" 
                                         :style="card.style">
                                        <i :class="card.icon"></i>
                                        <span>{{ card.text }}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Features Section -->
        <section class="features-section py-5">
            <div class="container">
                <div class="text-center mb-5" data-aos="fade-up">
                    <h2 class="section-title">Tính năng nổi bật</h2>
                    <p class="section-subtitle">
                        Khám phá những tính năng tuyệt vời giúp bạn kết nối và chia sẻ một cách dễ dàng
                    </p>
                </div>

                <div class="row g-4">
                    <div class="col-lg-4 col-md-6" v-for="(feature, index) in features" :key="feature.id"
                         data-aos="fade-up" :data-aos-delay="index * 100">
                        <div class="feature-card h-100" @click="handleFeatureClick(feature)">
                            <div class="feature-icon">
                                <i :class="feature.icon"></i>
                            </div>
                            <h3 class="feature-title">{{ feature.title }}</h3>
                            <p class="feature-description">{{ feature.description }}</p>
                            <div class="feature-tags">
                                <span class="tag" v-for="tag in feature.tags" :key="tag">{{ tag }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        <!-- Screenshots Section -->
        <section class="screenshots-section py-5 bg-light">
            <div class="container">
                <div class="text-center mb-5" data-aos="fade-up">
                    <h2 class="section-title">Giao diện thân thiện</h2>
                    <p class="section-subtitle">
                        Thiết kế hiện đại, dễ sử dụng trên mọi thiết bị
                    </p>
                </div>

                <div class="screenshots-carousel" data-aos="fade-up" data-aos-delay="200">
                    <div class="swiper" ref="screenshotsSwiper">
                        <div class="swiper-wrapper">
                            <div class="swiper-slide" v-for="screenshot in screenshots" :key="screenshot.id">
                                <div class="screenshot-item">
                                    <img :src="screenshot.image" :alt="screenshot.title" class="img-fluid rounded">
                                    <div class="screenshot-overlay">
                                        <h4>{{ screenshot.title }}</h4>
                                        <p>{{ screenshot.description }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="swiper-pagination"></div>
                        <div class="swiper-button-next"></div>
                        <div class="swiper-button-prev"></div>
                    </div>
                </div>
            </div>
        </section>

        <!-- CTA Section -->
        <section class="cta-section py-5">
            <div class="container">
                <div class="cta-content text-center" data-aos="zoom-in">
                    <h2 class="cta-title">Sẵn sàng tham gia?</h2>
                    <p class="cta-description">
                        Tạo tài khoản miễn phí ngay hôm nay và bắt đầu hành trình kết nối mới
                    </p>
                    <div class="cta-actions">
                        <router-link to="/register" class="btn btn-primary btn-lg me-3">
                            <i class="fas fa-user-plus me-2"></i>
                            Đăng ký miễn phí
                        </router-link>
                        <button class="btn btn-outline-primary btn-lg" @click="scrollToFeatures">
                            <i class="fas fa-info-circle me-2"></i>
                            Tìm hiểu thêm
                        </button>
                    </div>
                </div>
            </div>
        </section>

        <!-- Newsletter Section -->
        <section class="newsletter-section py-4 bg-dark text-white">
            <div class="container">
                <div class="row align-items-center">
                    <div class="col-lg-6">
                        <h3 class="newsletter-title">Cập nhật tin tức mới nhất</h3>
                        <p class="newsletter-subtitle mb-lg-0">
                            Đăng ký nhận thông báo về các tính năng và cập nhật mới
                        </p>
                    </div>
                    <div class="col-lg-6">
                        <form @submit.prevent="subscribeNewsletter" class="newsletter-form">
                            <div class="input-group">
                                <input type="email" v-model="newsletter.email" class="form-control" 
                                       placeholder="Nhập email của bạn" required>
                                <button type="submit" class="btn btn-primary" :disabled="newsletter.isLoading">
                                    <span v-if="newsletter.isLoading" class="spinner-border spinner-border-sm me-2"></span>
                                    <i v-else class="fas fa-paper-plane me-2"></i>
                                    Đăng ký
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'vue-toastification'
import AOS from 'aos'
import { Swiper, Navigation, Pagination, Autoplay } from 'swiper'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'

// Router & Toast
const router = useRouter()
const toast = useToast()

// Refs
const particlesContainer = ref(null)
const screenshotsSwiper = ref(null)
const usersCount = ref(null)
const postsCount = ref(null)
const connectionsCount = ref(null)

// State
const heroLoaded = ref(false)
const swiperInstance = ref(null)
const newsletter = ref({
    email: '',
    isLoading: false
})

// Data
const features = ref([
    {
        id: 1,
        icon: 'fas fa-users',
        title: 'Kết nối bạn bè',
        description: 'Tìm kiếm và kết nối với bạn bè, gia đình và những người có cùng sở thích.',
        tags: ['Social', 'Network', 'Friends']
    },
    {
        id: 2,
        icon: 'fas fa-share-alt',
        title: 'Chia sẻ khoảnh khắc',
        description: 'Đăng và chia sẻ những khoảnh khắc đặc biệt với hình ảnh, video và câu chuyện.',
        tags: ['Share', 'Photos', 'Stories']
    },
    {
        id: 3,
        icon: 'fas fa-comments',
        title: 'Chat thời gian thực',
        description: 'Trò chuyện tức thì với bạn bè qua tin nhắn văn bản, hình ảnh và video.',
        tags: ['Chat', 'Real-time', 'Messaging']
    },
    {
        id: 4,
        icon: 'fas fa-heart',
        title: 'Tương tác phong phú',
        description: 'Like, comment, share và phản ứng với nội dung theo nhiều cách thú vị.',
        tags: ['Like', 'Comment', 'React']
    },
    {
        id: 5,
        icon: 'fas fa-shield-alt',
        title: 'Bảo mật cao',
        description: 'Thông tin cá nhân được bảo vệ tối đa với các tính năng bảo mật tiên tiến.',
        tags: ['Security', 'Privacy', 'Protection']
    },
    {
        id: 6,
        icon: 'fas fa-mobile-alt',
        title: 'Đa nền tảng',
        description: 'Sử dụng trên web, mobile và tablet với trải nghiệm đồng nhất.',
        tags: ['Mobile', 'Web', 'Cross-platform']
    }
])

const screenshots = ref([
    {
        id: 1,
        image: '/images/screenshot-feed.jpg',
        title: 'Bảng tin thông minh',
        description: 'Khám phá nội dung phù hợp với sở thích của bạn'
    },
    {
        id: 2,
        image: '/images/screenshot-chat.jpg',
        title: 'Chat đa phương tiện',
        description: 'Trò chuyện với tin nhắn, hình ảnh và video'
    },
    {
        id: 3,
        image: '/images/screenshot-profile.jpg',
        title: 'Hồ sơ cá nhân',
        description: 'Thể hiện cá tính qua trang cá nhân độc đáo'
    },
    {
        id: 4,
        image: '/images/screenshot-discover.jpg',
        title: 'Khám phá',
        description: 'Tìm kiếm và khám phá nội dung mới mỗi ngày'
    }
])

const floatingCards = ref([
    {
        id: 1,
        icon: 'fas fa-heart text-danger',
        text: '+1.2k likes',
        style: {
            top: '20%',
            right: '10%',
            animationDelay: '0s'
        }
    },
    {
        id: 2,
        icon: 'fas fa-comment text-primary',
        text: '47 comments',
        style: {
            top: '50%',
            right: '5%',
            animationDelay: '1s'
        }
    },
    {
        id: 3,
        icon: 'fas fa-share text-success',
        text: 'Share',
        style: {
            bottom: '30%',
            right: '15%',
            animationDelay: '2s'
        }
    }
])

// Methods
const handleImageError = (event) => {
    event.target.src = '/images/placeholder-app.svg'
}

const handleFeatureClick = (feature) => {
    toast.info(`Tính năng: ${feature.title}`)
}

const subscribeNewsletter = async () => {
    newsletter.value.isLoading = true
    
    try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        toast.success('Đăng ký newsletter thành công!')
        newsletter.value.email = ''
    } catch (error) {
        toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
        newsletter.value.isLoading = false
    }
}

const scrollToFeatures = () => {
    const featuresSection = document.querySelector('.features-section')
    featuresSection?.scrollIntoView({ behavior: 'smooth' })
}

const animateCounters = () => {
    const animateCounter = (element, target, duration = 2000) => {
        let start = 0
        const increment = target / (duration / 16)
        
        const timer = setInterval(() => {
            start += increment
            if (start >= target) {
                element.textContent = target.toLocaleString()
                clearInterval(timer)
            } else {
                element.textContent = Math.floor(start).toLocaleString()
            }
        }, 16)
    }
    
    if (usersCount.value) animateCounter(usersCount.value, 50000)
    if (postsCount.value) animateCounter(postsCount.value, 1200000)
    if (connectionsCount.value) animateCounter(connectionsCount.value, 2500000)
}

const initializeSwiper = () => {
    if (screenshotsSwiper.value) {
        swiperInstance.value = new Swiper(screenshotsSwiper.value, {
            modules: [Navigation, Pagination, Autoplay],
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            autoplay: {
                delay: 3000,
                disableOnInteraction: false
            },
            pagination: {
                el: '.swiper-pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.swiper-button-next',
                prevEl: '.swiper-button-prev'
            },
            breakpoints: {
                768: {
                    slidesPerView: 2
                },
                1024: {
                    slidesPerView: 3
                }
            }
        })
    }
}

const createParticles = () => {
    if (!particlesContainer.value) return
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div')
        particle.className = 'particle'
        particle.style.left = Math.random() * 100 + '%'
        particle.style.top = Math.random() * 100 + '%'
        particle.style.animationDelay = Math.random() * 4 + 's'
        particle.style.animationDuration = (Math.random() * 3 + 2) + 's'
        particlesContainer.value.appendChild(particle)
    }
}

// Lifecycle
onMounted(async () => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true,
        offset: 100
    })
    
    await nextTick()
    
    // Initialize components
    heroLoaded.value = true
    createParticles()
    initializeSwiper()
    
    // Animate counters when they come into view
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters()
                observer.disconnect()
            }
        })
    })
    
    if (usersCount.value) {
        observer.observe(usersCount.value)
    }
})

onUnmounted(() => {
    if (swiperInstance.value) {
        swiperInstance.value.destroy()
    }
    AOS.refresh()
})
</script>

<style lang="scss" scoped>
.home-view {
    overflow-x: hidden;
}

// Hero Section
.hero-section {
    position: relative;
    min-height: 100vh;
    display: flex;
    align-items: center;
    color: white;

    .hero-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-secondary) 100%);
        z-index: -1;

        .hero-particles {
            position: absolute;
            width: 100%;
            height: 100%;
        }

        .hero-gradient {
            position: absolute;
            width: 100%;
            height: 100%;
            background: linear-gradient(45deg, rgba(0, 0, 0, 0.1) 0%, rgba(255, 255, 255, 0.1) 100%);
        }
    }

    .hero-content {
        .hero-title {
            font-size: 3.5rem;
            font-weight: 700;
            line-height: 1.2;
            margin-bottom: 1.5rem;

            .text-gradient {
                background: linear-gradient(45deg, #ffd700, #ff6b6b);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
            }
        }

        .hero-description {
            font-size: 1.25rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        .hero-actions {
            margin-bottom: 3rem;

            .btn {
                border-radius: 50px;
                padding: 0.75rem 2rem;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.3s ease;

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }
            }
        }

        .hero-stats {
            display: flex;
            gap: 2rem;

            .stat-item {
                text-align: center;

                .stat-number {
                    font-size: 2rem;
                    font-weight: 700;
                    color: #ffd700;
                    display: block;
                }

                .stat-label {
                    font-size: 0.9rem;
                    opacity: 0.8;
                }
            }
        }
    }

    .hero-visual {
        .mockup-container {
            position: relative;
            display: flex;
            justify-content: center;
            align-items: center;

            .mockup-phone {
                background: #333;
                border-radius: 30px;
                padding: 20px;
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
                transform: perspective(1000px) rotateY(-5deg);

                .mockup-screen {
                    background: white;
                    border-radius: 20px;
                    overflow: hidden;
                    width: 250px;
                    height: 500px;

                    img {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }
                }
            }

            .floating-elements {
                position: absolute;
                width: 100%;
                height: 100%;

                .floating-card {
                    position: absolute;
                    background: white;
                    color: var(--bs-dark);
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
                    animation: float 3s ease-in-out infinite;
                    font-size: 0.8rem;
                    font-weight: 600;

                    i {
                        margin-right: 0.5rem;
                    }
                }
            }
        }
    }

    &.hero-animate {
        .hero-content {
            animation: slideInLeft 1s ease-out;
        }

        .hero-visual {
            animation: slideInRight 1s ease-out;
        }
    }
}

// Features Section
.features-section {
    .section-title {
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--bs-dark);
        margin-bottom: 1rem;
    }

    .section-subtitle {
        font-size: 1.1rem;
        color: var(--bs-secondary);
        max-width: 600px;
        margin: 0 auto;
    }

    .feature-card {
        background: white;
        border: 1px solid var(--bs-border-color);
        border-radius: 20px;
        padding: 2rem;
        text-align: center;
        transition: all 0.3s ease;
        cursor: pointer;

        &:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
            border-color: var(--bs-primary);
        }

        .feature-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, var(--bs-primary), var(--bs-secondary));
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
            font-size: 1.5rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--bs-dark);
        }

        .feature-description {
            color: var(--bs-secondary);
            margin-bottom: 1.5rem;
        }

        .feature-tags {
            .tag {
                display: inline-block;
                background: var(--bs-light);
                color: var(--bs-primary);
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.8rem;
                margin: 0.25rem;
                font-weight: 600;
            }
        }
    }
}

// Screenshots Section
.screenshots-section {
    .screenshots-carousel {
        .swiper {
            padding: 2rem 0;

            .swiper-slide {
                .screenshot-item {
                    position: relative;
                    border-radius: 15px;
                    overflow: hidden;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.15);
                    transition: transform 0.3s ease;

                    &:hover {
                        transform: scale(1.05);

                        .screenshot-overlay {
                            opacity: 1;
                        }
                    }

                    img {
                        width: 100%;
                        height: 300px;
                        object-fit: cover;
                    }

                    .screenshot-overlay {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                        background: linear-gradient(transparent, rgba(0, 0, 0, 0.8));
                        color: white;
                        padding: 2rem;
                        opacity: 0;
                        transition: opacity 0.3s ease;

                        h4 {
                            margin-bottom: 0.5rem;
                        }

                        p {
                            margin: 0;
                            font-size: 0.9rem;
                        }
                    }
                }
            }
        }
    }
}

// CTA Section
.cta-section {
    background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-secondary) 100%);
    color: white;

    .cta-content {
        .cta-title {
            font-size: 2.5rem;
            font-weight: 700;
            margin-bottom: 1rem;
        }

        .cta-description {
            font-size: 1.1rem;
            margin-bottom: 2rem;
            opacity: 0.9;
        }

        .cta-actions {
            .btn {
                border-radius: 50px;
                padding: 0.75rem 2rem;
                font-weight: 600;
                text-decoration: none;
                transition: all 0.3s ease;

                &:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
                }
            }
        }
    }
}

// Newsletter Section
.newsletter-section {
    .newsletter-title {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }

    .newsletter-subtitle {
        opacity: 0.8;
    }

    .newsletter-form {
        .input-group {
            .form-control {
                border-radius: 50px 0 0 50px;
                border: none;
                padding: 0.75rem 1.5rem;
            }

            .btn {
                border-radius: 0 50px 50px 0;
                padding: 0.75rem 1.5rem;
                font-weight: 600;
            }
        }
    }
}

// Animations
@keyframes slideInLeft {
    from {
        opacity: 0;
        transform: translateX(-50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes slideInRight {
    from {
        opacity: 0;
        transform: translateX(50px);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

@keyframes float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-10px);
    }
}

// Particles
:deep(.particle) {
    position: absolute;
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    animation: particleFloat 4s ease-in-out infinite;
}

@keyframes particleFloat {
    0%, 100% {
        transform: translateY(0px) translateX(0px);
        opacity: 1;
    }
    50% {
        transform: translateY(-20px) translateX(10px);
        opacity: 0.5;
    }
}

// Responsive
@media (max-width: 768px) {
    .hero-section {
        .hero-content {
            text-align: center;
            margin-bottom: 3rem;

            .hero-title {
                font-size: 2.5rem;
            }

            .hero-stats {
                justify-content: center;
                gap: 1rem;
            }
        }

        .hero-visual {
            .mockup-phone {
                transform: none;

                .mockup-screen {
                    width: 200px;
                    height: 400px;
                }
            }
        }
    }

    .features-section {
        .section-title {
            font-size: 2rem;
        }
    }

    .cta-section {
        .cta-title {
            font-size: 2rem;
        }

        .cta-actions {
            .btn {
                display: block;
                width: 100%;
                margin-bottom: 1rem;

                &:last-child {
                    margin-bottom: 0;
                }
            }
        }
    }

    .newsletter-section {
        .newsletter-form {
            margin-top: 1rem;

            .input-group {
                flex-direction: column;

                .form-control {
                    border-radius: 50px;
                    margin-bottom: 1rem;
                }

                .btn {
                    border-radius: 50px;
                }
            }
        }
    }
}
</style>