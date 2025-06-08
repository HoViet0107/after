import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import App from '@/App.vue'

// Bootstrap CSS và JS
import 'bootstrap'
import 'bootstrap/dist/css/bootstrap.min.css'

// Custom styles
import '@/styles/main.scss'

// Plugins
import '@/plugins/bootstrap'
import '@/plugins/websocket'
import '@/plugins/notifications'

// Toast notifications
import Toast from 'vue-toastification'
import 'vue-toastification/dist/index.css'

// Global error handler
import { setupErrorHandler } from '@/utils/errorHandler'

// API interceptors
import '@/api/interceptors'

const app = createApp(App)
const pinia = createPinia()

// Setup stores
app.use(pinia)
app.use(router)

// Setup Toast notifications
app.use(Toast, {
    position: 'top-right',
    timeout: 5000,
    closeOnClick: true,
    pauseOnFocusLoss: true,
    pauseOnHover: true,
    draggable: true,
    draggablePercent: 0.6,
    showCloseButtonOnHover: false,
    hideProgressBar: false,
    closeButton: 'button',
    icon: true,
    rtl: false
})

// Setup global error handling
setupErrorHandler(app)

// Global properties
app.config.globalProperties.$APP_NAME = 'Social Media Platform'
app.config.globalProperties.$API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1'

// Performance monitoring
if (import.meta.env.PROD) {
    app.config.performance = true
}

// Error handling
app.config.errorHandler = (err, vm, info) => {
    console.error('Global error:', err)
    console.error('Component:', vm)
    console.error('Info:', info)

    // Send error to logging service in production
    if (import.meta.env.PROD) {
        // sendErrorToLoggingService(err, vm, info)
    }
}

app.mount('#app')