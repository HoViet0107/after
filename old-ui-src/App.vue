<template>
  <div id="app" :class="['app', themeClass]">
    <div v-if="isLoading" class="loading-overlay">
      <LoadingSpinner size="large" />
    </div>

    <ErrorBoundary>
      <router-view />
    </ErrorBoundary>

    <!-- Global Components -->
    <ToastNotification />
    <ConfirmDialog />

    <!-- Connection Status -->
    <div v-if="!isOnline" class="connection-status offline" role="alert" aria-live="polite">
      <i class="fas fa-wifi-slash me-2"></i>
      You are currently offline. Please check your internet connection.
    </div>

    <div v-if="isReconnecting" class="connection-status reconnecting" role="alert" aria-live="polite">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      Reconnecting...
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUIStore } from '@/stores/ui'
import { useWebSocket } from '@/composables/useWebSocket'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorBoundary from '@/components/common/ErrorBoundary.vue'
import ToastNotification from '@/components/common/ToastNotification.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

// Stores
const authStore = useAuthStore()
const uiStore = useUIStore()

// WebSocket connection
const { isConnected, isReconnecting, connect, disconnect } = useWebSocket()

// Reactive state
const isLoading = ref(false)
const isOnline = ref(navigator.onLine)

// Computed
const themeClass = computed(() => uiStore.theme)

// Network status handlers
const handleOnline = () => {
  isOnline.value = true
  if (authStore.isAuthenticated) {
    connect()
  }
}

const handleOffline = () => {
  isOnline.value = false
  disconnect()
}

// Keyboard shortcuts
const handleKeydown = (event) => {
  // Ctrl/Cmd + K to toggle search
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    uiStore.toggleSearch()
  }

  // Escape to close modals
  if (event.key === 'Escape') {
    uiStore.closeAllModals()
  }
}

// Lifecycle
onMounted(async () => {
  // Setup network listeners
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
  window.addEventListener('keydown', handleKeydown)

  // Initialize auth state
  try {
    isLoading.value = true
    await authStore.initializeAuth()

    // Connect WebSocket if authenticated
    if (authStore.isAuthenticated && isOnline.value) {
      connect()
    }
  } catch (error) {
    console.error('Failed to initialize app:', error)
  } finally {
    isLoading.value = false
  }

  // Setup performance monitoring
  if (import.meta.env.PROD) {
    // Monitor core web vitals
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
      getCLS(console.log)
      getFID(console.log)
      getFCP(console.log)
      getLCP(console.log)
      getTTFB(console.log)
    }).catch(() => {
      // Ignore if web-vitals not available
    })
  }
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
  window.removeEventListener('keydown', handleKeydown)
  disconnect()
})
</script>

<style lang="scss" scoped>
.app {
  min-height: 100vh;
  transition: background-color 0.3s ease;

  &.light {
    background-color: var(--bs-light);
    color: var(--bs-dark);
  }

  &.dark {
    background-color: var(--bs-dark);
    color: var(--bs-light);
  }
}

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(2px);
}

.connection-status {
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 1050;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;

  &.offline {
    background: #dc3545;
    color: white;
  }

  &.reconnecting {
    background: #ffc107;
    color: #212529;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

// Performance optimizations
.app {
  transform: translateZ(0); // Force hardware acceleration
}

// Accessibility improvements
@media (prefers-reduced-motion: reduce) {

  .app,
  .connection-status {
    transition: none;
    animation: none;
  }
}
</style>