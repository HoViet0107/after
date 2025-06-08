<template>
    <div class="auth-layout">
        <div class="auth-container">
            <!-- Background decoration -->
            <div class="auth-background">
                <div class="bg-pattern"></div>
                <div class="bg-gradient"></div>
            </div>

            <!-- Content -->
            <div class="auth-content">
                <!-- Left side - Branding -->
                <div class="auth-branding">
                    <div class="brand-content">
                        <div class="brand-logo">
                            <i class="fas fa-comments"></i>
                            <h1>Social Connect</h1>
                        </div>

                        <div class="brand-description">
                            <h2>Kết nối, chia sẻ và giao tiếp</h2>
                            <p>Tham gia cộng đồng của chúng tôi để kết nối với bạn bè, chia sẻ khoảnh khắc đáng nhớ và
                                khám phá những điều thú vị mới mỗi ngày.</p>
                        </div>

                        <div class="brand-features">
                            <div class="feature-item">
                                <i class="fas fa-users"></i>
                                <span>Kết nối với bạn bè</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-share-alt"></i>
                                <span>Chia sẻ khoảnh khắc</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-comments"></i>
                                <span>Trò chuyện real-time</span>
                            </div>
                            <div class="feature-item">
                                <i class="fas fa-globe"></i>
                                <span>Khám phá thế giới</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right side - Form -->
                <div class="auth-form-container">
                    <div class="auth-form-wrapper">
                        <!-- Language selector -->
                        <div class="language-selector">
                            <div class="dropdown">
                                <button class="btn btn-sm btn-outline-secondary dropdown-toggle"
                                    data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="fas fa-globe me-1"></i>
                                    Tiếng Việt
                                </button>
                                <ul class="dropdown-menu">
                                    <li><a class="dropdown-item" href="#">Tiếng Việt</a></li>
                                    <li><a class="dropdown-item" href="#">English</a></li>
                                </ul>
                            </div>
                        </div>

                        <!-- Form content -->
                        <div class="auth-form-content">
                            <router-view />
                        </div>

                        <!-- Footer links -->
                        <div class="auth-footer">
                            <div class="footer-links">
                                <a href="/privacy">Chính sách bảo mật</a>
                                <a href="/terms">Điều khoản sử dụng</a>
                                <a href="/help">Trợ giúp</a>
                            </div>
                            <div class="footer-social">
                                <span>Theo dõi chúng tôi:</span>
                                <a href="#" class="social-link">
                                    <i class="fab fa-facebook"></i>
                                </a>
                                <a href="#" class="social-link">
                                    <i class="fab fa-twitter"></i>
                                </a>
                                <a href="#" class="social-link">
                                    <i class="fab fa-instagram"></i>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Global error/success messages -->
        <div id="auth-notifications"></div>
    </div>
</template>

<script setup>
import { onMounted } from 'vue'

onMounted(() => {
    // Add animation classes or other setup
    document.body.classList.add('auth-page')
})

onUnmounted(() => {
    document.body.classList.remove('auth-page')
})
</script>

<style lang="scss" scoped>
.auth-layout {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    position: relative;
    overflow: hidden;

    .auth-container {
        width: 100%;
        max-width: 1200px;
        margin: 0 auto;
        position: relative;
        z-index: 1;
    }

    .auth-background {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 0;

        .bg-pattern {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image:
                radial-gradient(circle at 25% 25%, rgba(255, 255, 255, 0.1) 2px, transparent 2px),
                radial-gradient(circle at 75% 75%, rgba(255, 255, 255, 0.1) 2px, transparent 2px);
            background-size: 60px 60px;
            animation: float 20s ease-in-out infinite;
        }

        .bg-gradient {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(45deg,
                    rgba(102, 126, 234, 0.8) 0%,
                    rgba(118, 75, 162, 0.8) 100%);
        }
    }

    .auth-content {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 2rem;
        min-height: 80vh;
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 2rem;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        overflow: hidden;

        @media (max-width: 768px) {
            grid-template-columns: 1fr;
            margin: 1rem;
            min-height: auto;
        }
    }

    .auth-branding {
        background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-info) 100%);
        color: white;
        padding: 3rem;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;

        &::before {
            content: '';
            position: absolute;
            top: -50%;
            left: -50%;
            width: 200%;
            height: 200%;
            background: repeating-linear-gradient(45deg,
                    transparent,
                    transparent 2px,
                    rgba(255, 255, 255, 0.05) 2px,
                    rgba(255, 255, 255, 0.05) 4px);
            animation: slide 10s linear infinite;
        }

        .brand-content {
            position: relative;
            z-index: 1;
            text-align: center;
            max-width: 400px;

            .brand-logo {
                margin-bottom: 2rem;

                i {
                    font-size: 4rem;
                    margin-bottom: 1rem;
                    display: block;
                    animation: pulse 2s ease-in-out infinite;
                }

                h1 {
                    font-size: 2.5rem;
                    font-weight: 700;
                    margin: 0;
                    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
                }
            }

            .brand-description {
                margin-bottom: 3rem;

                h2 {
                    font-size: 1.5rem;
                    font-weight: 600;
                    margin-bottom: 1rem;
                }

                p {
                    font-size: 1.1rem;
                    line-height: 1.6;
                    opacity: 0.9;
                }
            }

            .brand-features {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 1.5rem;

                .feature-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;

                    i {
                        font-size: 1.25rem;
                        opacity: 0.8;
                    }

                    span {
                        font-weight: 500;
                    }
                }
            }
        }

        @media (max-width: 768px) {
            display: none;
        }
    }

    .auth-form-container {
        padding: 3rem;
        display: flex;
        flex-direction: column;
        justify-content: center;

        @media (max-width: 768px) {
            padding: 2rem;
        }

        .auth-form-wrapper {
            max-width: 400px;
            margin: 0 auto;
            width: 100%;

            .language-selector {
                text-align: right;
                margin-bottom: 2rem;
            }

            .auth-form-content {
                margin-bottom: 2rem;
            }

            .auth-footer {
                text-align: center;

                .footer-links {
                    display: flex;
                    justify-content: center;
                    gap: 1rem;
                    margin-bottom: 1rem;
                    flex-wrap: wrap;

                    a {
                        color: var(--bs-secondary);
                        text-decoration: none;
                        font-size: 0.875rem;

                        &:hover {
                            color: var(--bs-primary);
                            text-decoration: underline;
                        }
                    }
                }

                .footer-social {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;

                    span {
                        font-size: 0.875rem;
                        color: var(--bs-secondary);
                    }

                    .social-link {
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 32px;
                        height: 32px;
                        border-radius: 50%;
                        background: var(--bs-light);
                        color: var(--bs-secondary);
                        text-decoration: none;
                        transition: all 0.2s ease;

                        &:hover {
                            background: var(--bs-primary);
                            color: white;
                            transform: translateY(-2px);
                        }
                    }
                }
            }
        }
    }
}

@keyframes float {

    0%,
    100% {
        transform: translateY(0px);
    }

    50% {
        transform: translateY(-20px);
    }
}

@keyframes slide {
    0% {
        transform: translateX(-50%);
    }

    100% {
        transform: translateX(50%);
    }
}

@keyframes pulse {

    0%,
    100% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.05);
    }
}

// Dark mode adjustments
:global(.dark-mode) {
    .auth-layout {
        .auth-content {
            background: rgba(33, 37, 41, 0.95);
            color: var(--bs-light);
        }
    }
}
</style>