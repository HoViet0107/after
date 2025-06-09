<!-- Footer component toàn cục của ứng dụng với thông tin bản quyền và liên kết -->

<template>
    <footer class="app-footer mt-auto">
        <div class="container-fluid">
            <div class="row">
                <div class="col-12">
                    <div class="footer-content d-flex justify-content-between align-items-center py-3">
                        <!-- Left Section -->
                        <div class="footer-left d-flex align-items-center">
                            <div class="logo-section">
                                <router-link to="/" class="footer-logo text-decoration-none">
                                    <i class="fas fa-comments text-primary me-2"></i>
                                    <span class="fw-bold">{{ $APP_NAME || 'Social Chat' }}</span>
                                </router-link>
                            </div>
                            <div class="copyright ms-3 text-muted d-none d-md-block">
                                © {{ currentYear }} Bản quyền thuộc về công ty.
                            </div>
                        </div>

                        <!-- Center Section - Mobile responsive -->
                        <div class="footer-center d-none d-lg-flex">
                            <nav class="footer-nav">
                                <ul class="nav nav-pills nav-sm">
                                    <li class="nav-item">
                                        <router-link to="/privacy" class="nav-link text-muted">
                                            Chính sách bảo mật
                                        </router-link>
                                    </li>
                                    <li class="nav-item">
                                        <router-link to="/terms" class="nav-link text-muted">
                                            Điều khoản sử dụng
                                        </router-link>
                                    </li>
                                    <li class="nav-item">
                                        <router-link to="/support" class="nav-link text-muted">
                                            Hỗ trợ
                                        </router-link>
                                    </li>
                                    <li class="nav-item">
                                        <router-link to="/about" class="nav-link text-muted">
                                            Về chúng tôi
                                        </router-link>
                                    </li>
                                </ul>
                            </nav>
                        </div>

                        <!-- Right Section -->
                        <div class="footer-right d-flex align-items-center">
                            <!-- Social Links -->
                            <div class="social-links me-3 d-none d-sm-flex">
                                <a href="#" class="social-link me-2" title="Facebook">
                                    <i class="fab fa-facebook-f"></i>
                                </a>
                                <a href="#" class="social-link me-2" title="Twitter">
                                    <i class="fab fa-twitter"></i>
                                </a>
                                <a href="#" class="social-link me-2" title="Instagram">
                                    <i class="fab fa-instagram"></i>
                                </a>
                                <a href="#" class="social-link" title="LinkedIn">
                                    <i class="fab fa-linkedin-in"></i>
                                </a>
                            </div>

                            <!-- Language & Theme -->
                            <div class="footer-controls d-flex align-items-center">
                                <div class="dropdown me-2">
                                    <button class="btn btn-sm btn-outline-secondary dropdown-toggle"
                                        data-bs-toggle="dropdown" aria-expanded="false">
                                        <i class="fas fa-globe me-1"></i>
                                        <span class="d-none d-sm-inline">{{ currentLanguage }}</span>
                                    </button>
                                    <ul class="dropdown-menu dropdown-menu-end">
                                        <li>
                                            <button class="dropdown-item" @click="changeLanguage('vi')">
                                                <i class="fas fa-check text-success me-2"
                                                    v-if="currentLanguage === 'VI'"></i>
                                                Tiếng Việt
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item" @click="changeLanguage('en')">
                                                <i class="fas fa-check text-success me-2"
                                                    v-if="currentLanguage === 'EN'"></i>
                                                English
                                            </button>
                                        </li>
                                    </ul>
                                </div>

                                <button class="btn btn-sm btn-outline-secondary" @click="toggleTheme"
                                    :title="themeTooltip">
                                    <i :class="themeIcon"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Mobile Copyright -->
                    <div class="mobile-copyright text-center text-muted py-2 d-md-none border-top">
                        © {{ currentYear }} {{ $APP_NAME || 'Social Chat' }}
                    </div>

                    <!-- Status Indicator -->
                    <div class="status-bar d-flex justify-content-between align-items-center py-1 border-top">
                        <div class="connection-status">
                            <div class="d-flex align-items-center">
                                <div :class="connectionStatusClass" class="status-dot me-1"></div>
                                <small class="text-muted">{{ connectionStatusText }}</small>
                            </div>
                        </div>

                        <div class="app-info d-none d-md-block">
                            <small class="text-muted">
                                Phiên bản {{ appVersion }} |
                                <span v-if="onlineUsers > 0">{{ onlineUsers }} người trực tuyến</span>
                            </small>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </footer>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useWebSocket } from '@/composables/useWebSocket'
import { usePresenceStore } from '@/stores/presence'
import { useAuthStore } from '@/stores/auth'

// Dependencies
const { isConnected } = useWebSocket()
const presenceStore = usePresenceStore()
const authStore = useAuthStore()

// State
const currentLanguage = ref('VI')
const isDarkTheme = ref(false)
const appVersion = ref('1.0.0')

// Computed
const currentYear = computed(() => new Date().getFullYear())

const onlineUsers = computed(() => presenceStore.onlineUsersCount)

const themeIcon = computed(() =>
    isDarkTheme.value ? 'fas fa-sun' : 'fas fa-moon'
)

const themeTooltip = computed(() =>
    isDarkTheme.value ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'
)

const connectionStatusClass = computed(() => ({
    'status-dot': true,
    'bg-success': isConnected.value,
    'bg-warning': !isConnected.value,
    'animate-pulse': !isConnected.value
}))

const connectionStatusText = computed(() =>
    isConnected.value ? 'Đã kết nối' : 'Đang kết nối lại...'
)

// Methods
const changeLanguage = (lang) => {
    currentLanguage.value = lang.toUpperCase()
    // TODO: Implement language change logic
    console.log('Changing language to:', lang)
}

const toggleTheme = () => {
    isDarkTheme.value = !isDarkTheme.value
    document.documentElement.setAttribute('data-bs-theme', isDarkTheme.value ? 'dark' : 'light')
    localStorage.setItem('theme', isDarkTheme.value ? 'dark' : 'light')
}

// Lifecycle
onMounted(() => {
    // Load saved theme
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme) {
        isDarkTheme.value = savedTheme === 'dark'
        document.documentElement.setAttribute('data-bs-theme', savedTheme)
    }

    // Load app version from package.json or environment
    if (import.meta.env.VITE_APP_VERSION) {
        appVersion.value = import.meta.env.VITE_APP_VERSION
    }
})
</script>

<style scoped>
.app-footer {
    background-color: var(--bs-body-bg);
    border-top: 1px solid var(--bs-border-color);
    margin-top: auto;
}

.footer-logo {
    color: var(--bs-body-color);
    font-size: 1.1rem;
}

.footer-logo:hover {
    color: var(--bs-primary);
}

.social-link {
    color: var(--bs-secondary);
    text-decoration: none;
    transition: color 0.2s ease;
}

.social-link:hover {
    color: var(--bs-primary);
}

.status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    display: inline-block;
}

.animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: .5;
    }
}

.nav-sm .nav-link {
    padding: 0.25rem 0.5rem;
    font-size: 0.875rem;
}

@media (max-width: 768px) {
    .footer-content {
        flex-direction: column;
        gap: 1rem;
    }

    .footer-left,
    .footer-right {
        justify-content: center;
    }
}
</style>