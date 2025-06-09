// src/stores/index.js
// Pinia store configuration với plugins, devtools và tối ưu performance

import { createPinia } from 'pinia'
import { markRaw } from 'vue'
import router from '@/router'

// Pinia Plugins
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

// Create Pinia instance
const pinia = createPinia()

// Router plugin for stores
const routerPlugin = ({ store }) => {
    store.router = markRaw(router)
}

// Performance monitoring plugin
const performancePlugin = ({ store, options }) => {
    if (process.env.NODE_ENV === 'development') {
        const startTime = performance.now()
        
        store.$onAction(({
            name, // name of the action
            store, // store instance
            args, // array of parameters passed to the action
            after, // hook after the action returns or resolves
            onError, // hook if the action throws or rejects
        }) => {
            const actionStartTime = performance.now()
            console.group(`🔥 Action "${name}" on ${store.$id}`)
            console.log('Arguments:', args)
            
            after((result) => {
                const actionEndTime = performance.now()
                console.log('Result:', result)
                console.log(`⏱️ Action took ${(actionEndTime - actionStartTime).toFixed(2)}ms`)
                console.groupEnd()
            })
            
            onError((error) => {
                const actionEndTime = performance.now()
                console.error('Error:', error)
                console.log(`❌ Action failed after ${(actionEndTime - actionStartTime).toFixed(2)}ms`)
                console.groupEnd()
            })
        })
    }
}

// Cache management plugin
const cachePlugin = ({ store }) => {
    // Auto-clear cache on specific actions
    if (store.clearCache && typeof store.clearCache === 'function') {
        store.$onAction(({ name, after }) => {
            const clearCacheActions = ['logout', 'clearAllData', 'reset']
            if (clearCacheActions.includes(name)) {
                after(() => {
                    store.clearCache()
                })
            }
        })
    }
}

// Error handling plugin
const errorHandlingPlugin = ({ store }) => {
    store.$onAction(({ name, onError }) => {
        onError((error) => {
            console.error(`Action ${name} failed in store ${store.$id}:`, error)
            
            // Global error handling
            if (error.response?.status === 401) {
                // Redirect to login on unauthorized
                router.push('/login')
            } else if (error.response?.status >= 500) {
                // Show toast for server errors
                if (typeof window !== 'undefined' && window.$toast) {
                    window.$toast.error('Đã xảy ra lỗi server. Vui lòng thử lại sau.')
                }
            }
        })
    })
}

// State persistence configuration
const persistConfig = {
    storage: localStorage,
    key: 'social-app',
    paths: ['auth.token', 'auth.user', 'settings.theme', 'settings.language'],
    beforeRestore: (context) => {
        console.log('Restoring state:', context.store.$id)
    },
    afterRestore: (context) => {
        console.log('State restored:', context.store.$id)
    }
}

// Development tools
const devtoolsPlugin = ({ store }) => {
    if (process.env.NODE_ENV === 'development') {
        // Add store debugging helpers
        store.$debug = {
            logState: () => console.log('Current state:', store.$state),
            logActions: () => console.log('Available actions:', Object.keys(store)),
            exportState: () => JSON.stringify(store.$state, null, 2),
            importState: (state) => store.$patch(JSON.parse(state))
        }
    }
}

// WebSocket integration plugin
const websocketPlugin = ({ store }) => {
    if (store.setupWebSocket && typeof store.setupWebSocket === 'function') {
        // Auto-setup WebSocket connection when store is created
        store.setupWebSocket()
    }
}

// Install plugins
pinia.use(routerPlugin)
pinia.use(performancePlugin)
pinia.use(cachePlugin)
pinia.use(errorHandlingPlugin)
pinia.use(devtoolsPlugin)
pinia.use(websocketPlugin)

// Install persistence plugin with config
pinia.use(piniaPluginPersistedstate.createPersistedState(persistConfig))

// Hot Module Replacement for development
if (import.meta.hot) {
    // Accepts updates to the current module
    import.meta.hot.accept(() => {
        console.log('🔄 Pinia store reloaded')
    })
}

// Store registry for debugging
if (process.env.NODE_ENV === 'development') {
    window.__PINIA_STORES__ = pinia._s
}

// Export configured pinia instance
export default pinia

// Export store utilities
export const useStoreUtils = () => {
    return {
        resetAllStores: () => {
            pinia._s.forEach(store => {
                if (store.$reset) {
                    store.$reset()
                }
            })
        },
        getStoreById: (id) => {
            return pinia._s.get(id)
        },
        getAllStores: () => {
            return Array.from(pinia._s.values())
        },
        exportAllStates: () => {
            const states = {}
            pinia._s.forEach((store, id) => {
                states[id] = store.$state
            })
            return JSON.stringify(states, null, 2)
        }
    }
}

// Store composition helpers
export const createStoreComposition = (storeId, options = {}) => {
    return {
        id: storeId,
        persist: {
            enabled: true,
            storage: localStorage,
            paths: options.persistPaths || [],
            ...options.persist
        },
        ...options
    }
}

// Reactive store registry
export const storeRegistry = new Proxy({}, {
    get(target, prop) {
        return pinia._s.get(prop)
    },
    has(target, prop) {
        return pinia._s.has(prop)
    },
    ownKeys(target) {
        return Array.from(pinia._s.keys())
    }
})