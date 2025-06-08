// WebSocket plugin với auto-reconnection, event management và performance optimization

import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

class WebSocketManager {
    constructor() {
        this.socket = null
        this.isConnected = false
        this.isConnecting = false
        this.connectionAttempts = 0
        this.maxReconnectAttempts = 10
        this.reconnectInterval = 1000 // Start with 1 second
        this.maxReconnectInterval = 30000 // Max 30 seconds
        this.reconnectTimer = null
        this.heartbeatTimer = null
        this.heartbeatInterval = 25000 // 25 seconds
        this.eventListeners = new Map()
        this.pendingMessages = []
        this.messageQueue = []
        this.isOnline = navigator.onLine
        this.lastPingTime = null
        this.latency = 0

        // Configuration
        this.config = {
            url: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
            transports: ['websocket', 'polling'],
            upgrade: true,
            rememberUpgrade: true,
            timeout: 20000,
            forceNew: false,
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 30000,
            randomizationFactor: 0.5,
            maxReconnectionAttempts: Infinity
        }

        this.toast = useToast()
        this.setupNetworkListeners()
    }

    // Initialize WebSocket connection
    async connect(force = false) {
        if ((this.isConnected || this.isConnecting) && !force) {
            return Promise.resolve()
        }

        if (force && this.socket) {
            this.disconnect()
        }

        return new Promise((resolve, reject) => {
            try {
                this.isConnecting = true

                // Get auth token
                const authStore = useAuthStore()
                const token = authStore.token

                if (!token) {
                    console.warn('No auth token available for WebSocket connection')
                }

                // Create socket instance
                this.socket = io(this.config.url, {
                    ...this.config,
                    auth: {
                        token
                    },
                    query: {
                        clientId: this.generateClientId(),
                        version: import.meta.env.VITE_APP_VERSION || '1.0.0',
                        platform: 'web'
                    }
                })

                // Connection event handlers
                this.socket.on('connect', () => {
                    console.log('✅ WebSocket connected:', this.socket.id)
                    this.isConnected = true
                    this.isConnecting = false
                    this.connectionAttempts = 0
                    this.reconnectInterval = 1000

                    // Clear reconnect timer
                    if (this.reconnectTimer) {
                        clearTimeout(this.reconnectTimer)
                        this.reconnectTimer = null
                    }

                    // Start heartbeat
                    this.startHeartbeat()

                    // Process pending messages
                    this.processPendingMessages()

                    // Emit connection success
                    this.emit('ws:connected', { socketId: this.socket.id })

                    resolve()
                })

                this.socket.on('disconnect', (reason) => {
                    console.warn('❌ WebSocket disconnected:', reason)
                    this.isConnected = false
                    this.isConnecting = false

                    // Stop heartbeat
                    this.stopHeartbeat()

                    // Emit disconnection event
                    this.emit('ws:disconnected', { reason })

                    // Handle different disconnect reasons
                    if (reason === 'io server disconnect') {
                        // Server initiated disconnect, don't reconnect automatically
                        console.log('Server disconnected the client')
                    } else if (reason === 'transport close' || reason === 'ping timeout') {
                        // Network issues, try to reconnect
                        this.scheduleReconnect()
                    }
                })

                this.socket.on('connect_error', (error) => {
                    console.error('❌ WebSocket connection error:', error.message)
                    this.isConnecting = false
                    this.connectionAttempts++

                    if (this.connectionAttempts === 1) {
                        this.toast.error('Không thể kết nối real-time. Một số tính năng có thể bị hạn chế.')
                    }

                    // Emit connection error
                    this.emit('ws:error', { error: error.message, attempts: this.connectionAttempts })

                    // Schedule reconnect if max attempts not reached
                    if (this.connectionAttempts < this.maxReconnectAttempts) {
                        this.scheduleReconnect()
                    } else {
                        console.error('Max reconnection attempts reached')
                        this.emit('ws:max_attempts_reached')
                        reject(new Error('Max reconnection attempts reached'))
                    }
                })

                this.socket.on('reconnect', (attempt) => {
                    console.log('🔄 WebSocket reconnected after', attempt, 'attempts')
                    this.toast.success('Đã khôi phục kết nối real-time')
                    this.emit('ws:reconnected', { attempts: attempt })
                })

                this.socket.on('reconnect_error', (error) => {
                    console.error('❌ WebSocket reconnection error:', error.message)
                    this.emit('ws:reconnect_error', { error: error.message })
                })

                this.socket.on('reconnect_failed', () => {
                    console.error('❌ WebSocket reconnection failed')
                    this.toast.error('Không thể khôi phục kết nối real-time')
                    this.emit('ws:reconnect_failed')
                })

                // Heartbeat handlers
                this.socket.on('pong', () => {
                    if (this.lastPingTime) {
                        this.latency = Date.now() - this.lastPingTime
                        this.emit('ws:latency_updated', { latency: this.latency })
                    }
                })

                // Server-initiated events
                this.socket.on('server:message', (data) => {
                    this.handleServerMessage(data)
                })

                this.socket.on('server:broadcast', (data) => {
                    this.handleServerBroadcast(data)
                })

                this.socket.on('server:maintenance', (data) => {
                    this.handleMaintenanceNotice(data)
                })

                // Error handling
                this.socket.on('error', (error) => {
                    console.error('WebSocket error:', error)
                    this.emit('ws:error', { error })
                })

                // Auto-connect if enabled
                if (this.config.autoConnect) {
                    this.socket.connect()
                }

            } catch (error) {
                console.error('Failed to create WebSocket connection:', error)
                this.isConnecting = false
                reject(error)
            }
        })
    }

    // Disconnect WebSocket
    disconnect() {
        if (this.socket) {
            console.log('🔌 Disconnecting WebSocket')

            // Stop heartbeat
            this.stopHeartbeat()

            // Clear reconnect timer
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer)
                this.reconnectTimer = null
            }

            // Disconnect socket
            this.socket.disconnect()
            this.socket = null
            this.isConnected = false
            this.isConnecting = false

            // Emit disconnection event
            this.emit('ws:manual_disconnect')
        }
    }

    // Send message to server
    emit(event, data = {}) {
        if (!this.isConnected || !this.socket) {
            // Queue message for later if important
            if (this.isImportantEvent(event)) {
                this.queueMessage(event, data)
            }
            return Promise.reject(new Error('WebSocket not connected'))
        }

        return new Promise((resolve, reject) => {
            try {
                // Add metadata
                const messageData = {
                    ...data,
                    timestamp: Date.now(),
                    clientId: this.socket.id
                }

                // Send with acknowledgment for important events
                if (this.isImportantEvent(event)) {
                    this.socket.emit(event, messageData, (response) => {
                        if (response?.success) {
                            resolve(response)
                        } else {
                            reject(new Error(response?.error || 'Unknown error'))
                        }
                    })
                } else {
                    this.socket.emit(event, messageData)
                    resolve()
                }
            } catch (error) {
                reject(error)
            }
        })
    }

    // Listen for events
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, new Set())
        }

        this.eventListeners.get(event).add(callback)

        // If socket exists, register the listener
        if (this.socket) {
            this.socket.on(event, callback)
        }

        // Return unsubscribe function
        return () => this.off(event, callback)
    }

    // Remove event listener
    off(event, callback) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.get(event).delete(callback)

            if (this.eventListeners.get(event).size === 0) {
                this.eventListeners.delete(event)
            }
        }

        if (this.socket) {
            this.socket.off(event, callback)
        }
    }

    // Remove all listeners for an event
    removeAllListeners(event) {
        if (this.eventListeners.has(event)) {
            this.eventListeners.delete(event)
        }

        if (this.socket) {
            this.socket.removeAllListeners(event)
        }
    }

    // Join a room
    joinRoom(roomId, data = {}) {
        return this.emit('join_room', { roomId, ...data })
    }

    // Leave a room
    leaveRoom(roomId, data = {}) {
        return this.emit('leave_room', { roomId, ...data })
    }

    // Send message to room
    sendToRoom(roomId, event, data = {}) {
        return this.emit('room_message', { roomId, event, data })
    }

    // Heartbeat management
    startHeartbeat() {
        this.stopHeartbeat() // Clear any existing heartbeat

        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected && this.socket) {
                this.lastPingTime = Date.now()
                this.socket.emit('ping')
            }
        }, this.heartbeatInterval)
    }

    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer)
            this.heartbeatTimer = null
        }
    }

    // Reconnection management
    scheduleReconnect() {
        if (this.reconnectTimer || this.connectionAttempts >= this.maxReconnectAttempts) {
            return
        }

        console.log(`🔄 Scheduling reconnect in ${this.reconnectInterval}ms (attempt ${this.connectionAttempts + 1})`)

        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null

            if (!this.isOnline) {
                console.log('Device is offline, skipping reconnect attempt')
                this.scheduleReconnect()
                return
            }

            this.connect().catch(() => {
                // Exponential backoff with jitter
                this.reconnectInterval = Math.min(
                    this.reconnectInterval * 2 + Math.random() * 1000,
                    this.maxReconnectInterval
                )
                this.scheduleReconnect()
            })
        }, this.reconnectInterval)
    }

    // Message queueing for offline/disconnected state
    queueMessage(event, data) {
        this.messageQueue.push({
            event,
            data,
            timestamp: Date.now(),
            retries: 0
        })

        // Limit queue size
        if (this.messageQueue.length > 100) {
            this.messageQueue.shift()
        }
    }

    processPendingMessages() {
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift()

            // Skip old messages (older than 5 minutes)
            if (Date.now() - message.timestamp > 5 * 60 * 1000) {
                continue
            }

            this.emit(message.event, message.data).catch(() => {
                // Re-queue if failed and under retry limit
                if (message.retries < 3) {
                    message.retries++
                    this.messageQueue.push(message)
                }
            })
        }
    }

    // Network status management
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Network back online')
            this.isOnline = true

            if (!this.isConnected && !this.isConnecting) {
                console.log('Attempting to reconnect after network restoration')
                this.connect()
            }
        })

        window.addEventListener('offline', () => {
            console.log('🌐 Network went offline')
            this.isOnline = false

            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer)
                this.reconnectTimer = null
            }
        })
    }

    // Server message handlers
    handleServerMessage(data) {
        console.log('📨 Server message:', data)

        switch (data.type) {
            case 'notification':
                this.toast.info(data.message)
                break
            case 'warning':
                this.toast.warning(data.message)
                break
            case 'error':
                this.toast.error(data.message)
                break
            default:
                console.log('Unknown server message type:', data.type)
        }
    }

    handleServerBroadcast(data) {
        console.log('📢 Server broadcast:', data)

        // Emit local event for broadcast
        this.emit('server:broadcast', data)
    }

    handleMaintenanceNotice(data) {
        console.log('🔧 Maintenance notice:', data)

        this.toast.warning(
            `Hệ thống sẽ bảo trì trong ${data.minutes} phút. Vui lòng lưu công việc.`,
            { timeout: 0 }
        )
    }

    // Utility methods
    isImportantEvent(event) {
        const importantEvents = [
            'message:send',
            'post:create',
            'comment:create',
            'user:update',
            'notification:read'
        ]

        return importantEvents.includes(event)
    }

    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Status getters
    getConnectionStatus() {
        return {
            connected: this.isConnected,
            connecting: this.isConnecting,
            attempts: this.connectionAttempts,
            latency: this.latency,
            online: this.isOnline,
            socketId: this.socket?.id
        }
    }

    getStats() {
        return {
            connectionAttempts: this.connectionAttempts,
            latency: this.latency,
            queuedMessages: this.messageQueue.length,
            activeListeners: this.eventListeners.size,
            isOnline: this.isOnline
        }
    }

    // Clean up
    destroy() {
        this.disconnect()
        this.eventListeners.clear()
        this.messageQueue = []

        // Remove network listeners
        window.removeEventListener('online', this.handleOnline)
        window.removeEventListener('offline', this.handleOffline)
    }
}

// Create singleton instance
const websocketManager = new WebSocketManager()

// Auto-connect when authenticated
const authStore = useAuthStore()
authStore.$subscribe((mutation, state) => {
    if (state.isAuthenticated && state.token) {
        websocketManager.connect()
    } else {
        websocketManager.disconnect()
    }
})

// Vue plugin installation
export default {
    install(app) {
        // Provide WebSocket manager globally
        app.config.globalProperties.$ws = websocketManager
        app.provide('websocket', websocketManager)

        // Auto-initialize
        if (authStore.isAuthenticated) {
            websocketManager.connect()
        }
    }
}

// Export manager for composables
export { websocketManager }