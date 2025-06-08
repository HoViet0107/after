// Application constants và configuration

// API Configuration
export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000,

    // Endpoints version
    VERSION: 'v1',

    // Request headers
    DEFAULT_HEADERS: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
}

// WebSocket Configuration
export const WEBSOCKET_CONFIG = {
    URL: import.meta.env.VITE_WS_URL || 'ws://localhost:8080',
    RECONNECT_INTERVAL: 1000,
    MAX_RECONNECT_ATTEMPTS: 10,
    HEARTBEAT_INTERVAL: 25000,

    // Event types
    EVENTS: {
        CONNECT: 'connect',
        DISCONNECT: 'disconnect',
        MESSAGE: 'message',
        TYPING: 'typing',
        PRESENCE: 'presence',
        NOTIFICATION: 'notification'
    }
}

// Cache Configuration
export const CACHE_CONFIG = {
    // Cache TTL values (milliseconds)
    TTL: {
        VERY_SHORT: 30 * 1000,      // 30 seconds
        SHORT: 2 * 60 * 1000,       // 2 minutes
        MEDIUM: 5 * 60 * 1000,      // 5 minutes
        LONG: 15 * 60 * 1000,       // 15 minutes
        VERY_LONG: 60 * 60 * 1000   // 1 hour
    },

    // Cache keys
    KEYS: {
        USER_PROFILE: 'user_profile_',
        USER_POSTS: 'user_posts_',
        POST_DETAIL: 'post_detail_',
        FEED_HOME: 'feed_home_',
        FEED_TRENDING: 'feed_trending_',
        CONVERSATIONS: 'conversations_',
        MESSAGES: 'messages_',
        NOTIFICATIONS: 'notifications_',
        SEARCH_RESULTS: 'search_results_'
    },

    // Cache sizes
    MAX_SIZE: {
        LOCAL: 50 * 1024 * 1024,    // 50MB
        SESSION: 10 * 1024 * 1024,  // 10MB
        MEMORY: 100 * 1024 * 1024   // 100MB
    }
}

// File Upload Configuration
export const UPLOAD_CONFIG = {
    // File size limits (bytes)
    MAX_FILE_SIZE: 100 * 1024 * 1024,    // 100MB
    MAX_IMAGE_SIZE: 10 * 1024 * 1024,    // 10MB
    MAX_VIDEO_SIZE: 50 * 1024 * 1024,    // 50MB
    MAX_DOCUMENT_SIZE: 25 * 1024 * 1024, // 25MB

    // Supported file types
    SUPPORTED_IMAGES: [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ],

    SUPPORTED_VIDEOS: [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo'
    ],

    SUPPORTED_DOCUMENTS: [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain',
        'text/csv'
    ],

    // Image compression settings
    COMPRESSION: {
        QUALITY: 0.8,
        MAX_WIDTH: 1920,
        MAX_HEIGHT: 1080,
        AVATAR_SIZE: 512
    },

    // Upload chunk size for large files
    CHUNK_SIZE: 1024 * 1024 // 1MB
}

// User Configuration
export const USER_CONFIG = {
    // Authentication
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    USERNAME_MIN_LENGTH: 3,
    USERNAME_MAX_LENGTH: 30,

    // Profile limits
    BIO_MAX_LENGTH: 500,
    DISPLAY_NAME_MAX_LENGTH: 50,

    // Rate limiting
    LOGIN_ATTEMPTS_MAX: 5,
    LOGIN_LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes

    // Session
    SESSION_TIMEOUT: 30 * 60 * 1000,     // 30 minutes
    SESSION_WARNING_TIME: 5 * 60 * 1000, // 5 minutes before expiry

    // User roles
    ROLES: {
        USER: 'user',
        MODERATOR: 'moderator',
        ADMIN: 'admin',
        SUPER_ADMIN: 'super_admin'
    },

    // User permissions
    PERMISSIONS: {
        // Post permissions
        POST_CREATE: 'post.create',
        POST_EDIT: 'post.edit',
        POST_DELETE: 'post.delete',
        POST_MODERATE: 'post.moderate',

        // User permissions
        USER_VIEW: 'user.view',
        USER_EDIT: 'user.edit',
        USER_BAN: 'user.ban',
        USER_DELETE: 'user.delete',

        // Admin permissions
        ADMIN_DASHBOARD: 'admin.dashboard.view',
        ADMIN_USERS: 'admin.users.manage',
        ADMIN_POSTS: 'admin.posts.manage',
        ADMIN_REPORTS: 'admin.reports.view',
        ADMIN_SETTINGS: 'admin.settings.manage'
    }
}

// Post Configuration
export const POST_CONFIG = {
    // Content limits
    CONTENT_MAX_LENGTH: 5000,
    HASHTAG_MAX_COUNT: 10,
    MENTION_MAX_COUNT: 20,

    // Media limits
    IMAGES_MAX_COUNT: 10,
    VIDEOS_MAX_COUNT: 1,

    // Interaction limits
    LIKES_RATE_LIMIT: 100, // per hour
    COMMENTS_RATE_LIMIT: 50, // per hour

    // Post types
    TYPES: {
        TEXT: 'text',
        IMAGE: 'image',
        VIDEO: 'video',
        LINK: 'link',
        POLL: 'poll'
    },

    // Privacy settings
    PRIVACY: {
        PUBLIC: 'public',
        FRIENDS: 'friends',
        PRIVATE: 'private'
    },

    // Post status
    STATUS: {
        DRAFT: 'draft',
        PUBLISHED: 'published',
        ARCHIVED: 'archived',
        DELETED: 'deleted',
        REPORTED: 'reported'
    }
}

// Comment Configuration
export const COMMENT_CONFIG = {
    // Content limits
    CONTENT_MAX_LENGTH: 1000,
    MAX_NESTING_LEVEL: 3,

    // Rate limiting
    RATE_LIMIT: 30, // comments per hour

    // Comment status
    STATUS: {
        ACTIVE: 'active',
        HIDDEN: 'hidden',
        DELETED: 'deleted',
        REPORTED: 'reported'
    }
}

// Message Configuration
export const MESSAGE_CONFIG = {
    // Content limits
    CONTENT_MAX_LENGTH: 2000,

    // File attachments
    ATTACHMENTS_MAX_COUNT: 5,
    ATTACHMENT_MAX_SIZE: 25 * 1024 * 1024, // 25MB

    // Rate limiting
    RATE_LIMIT: 200, // messages per hour

    // Message types
    TYPES: {
        TEXT: 'text',
        IMAGE: 'image',
        VIDEO: 'video',
        FILE: 'file',
        AUDIO: 'audio',
        LOCATION: 'location',
        SYSTEM: 'system'
    },

    // Message status
    STATUS: {
        SENT: 'sent',
        DELIVERED: 'delivered',
        READ: 'read',
        FAILED: 'failed',
        DELETED: 'deleted'
    },

    // Typing indicator
    TYPING_TIMEOUT: 3000, // 3 seconds
    TYPING_DEBOUNCE: 1000 // 1 second
}

// Conversation Configuration
export const CONVERSATION_CONFIG = {
    // Participant limits
    MAX_PARTICIPANTS: 100,
    MIN_PARTICIPANTS_GROUP: 3,

    // Conversation types
    TYPES: {
        DIRECT: 'direct',
        GROUP: 'group',
        CHANNEL: 'channel'
    },

    // Conversation status
    STATUS: {
        ACTIVE: 'active',
        ARCHIVED: 'archived',
        DELETED: 'deleted',
        MUTED: 'muted'
    }
}

// Notification Configuration
export const NOTIFICATION_CONFIG = {
    // Notification types
    TYPES: {
        LIKE: 'like',
        COMMENT: 'comment',
        FOLLOW: 'follow',
        MENTION: 'mention',
        MESSAGE: 'message',
        POST: 'post',
        SYSTEM: 'system'
    },

    // Priority levels
    PRIORITY: {
        LOW: 'low',
        MEDIUM: 'medium',
        HIGH: 'high',
        URGENT: 'urgent'
    },

    // Delivery methods
    DELIVERY: {
        IN_APP: 'in_app',
        PUSH: 'push',
        EMAIL: 'email',
        SMS: 'sms'
    },

    // Grouping settings
    GROUP_SIMILAR: true,
    GROUP_TIME_WINDOW: 5 * 60 * 1000, // 5 minutes
    MAX_GROUP_SIZE: 10,

    // Rate limiting
    MAX_PER_HOUR: 100,
    MAX_PUSH_PER_DAY: 50
}

// UI Configuration
export const UI_CONFIG = {
    // Theme settings
    THEMES: {
        LIGHT: 'light',
        DARK: 'dark',
        AUTO: 'auto'
    },

    // Breakpoints (Bootstrap 5)
    BREAKPOINTS: {
        XS: 0,
        SM: 576,
        MD: 768,
        LG: 992,
        XL: 1200,
        XXL: 1400
    },

    // Animation durations
    ANIMATION: {
        FAST: 150,
        NORMAL: 300,
        SLOW: 600
    },

    // Toast settings
    TOAST: {
        DURATION: 5000,
        MAX_TOASTS: 5,
        POSITION: 'top-right'
    },

    // Modal settings
    MODAL: {
        BACKDROP: true,
        KEYBOARD: true,
        FOCUS: true
    },

    // Infinite scroll
    INFINITE_SCROLL: {
        THRESHOLD: 200, // pixels from bottom
        BATCH_SIZE: 20,
        MAX_ITEMS: 1000
    }
}

// Error Configuration
export const ERROR_CONFIG = {
    // Error types
    TYPES: {
        NETWORK: 'network',
        AUTH: 'auth',
        VALIDATION: 'validation',
        SERVER: 'server',
        CLIENT: 'client',
        UNKNOWN: 'unknown'
    },

    // HTTP status codes
    HTTP_STATUS: {
        OK: 200,
        CREATED: 201,
        NO_CONTENT: 204,
        BAD_REQUEST: 400,
        UNAUTHORIZED: 401,
        FORBIDDEN: 403,
        NOT_FOUND: 404,
        CONFLICT: 409,
        UNPROCESSABLE_ENTITY: 422,
        TOO_MANY_REQUESTS: 429,
        INTERNAL_SERVER_ERROR: 500,
        BAD_GATEWAY: 502,
        SERVICE_UNAVAILABLE: 503,
        GATEWAY_TIMEOUT: 504
    },

    // Error messages
    MESSAGES: {
        NETWORK_ERROR: 'Lỗi kết nối mạng',
        AUTH_ERROR: 'Lỗi xác thực',
        VALIDATION_ERROR: 'Dữ liệu không hợp lệ',
        SERVER_ERROR: 'Lỗi máy chủ',
        UNKNOWN_ERROR: 'Lỗi không xác định'
    }
}

// Analytics Configuration
export const ANALYTICS_CONFIG = {
    // Google Analytics
    GA_ID: import.meta.env.VITE_GA_ID,

    // Custom events
    EVENTS: {
        PAGE_VIEW: 'page_view',
        USER_SIGNUP: 'user_signup',
        USER_LOGIN: 'user_login',
        POST_CREATE: 'post_create',
        POST_LIKE: 'post_like',
        POST_SHARE: 'post_share',
        MESSAGE_SEND: 'message_send',
        SEARCH: 'search',
        ERROR: 'error'
    },

    // Event categories
    CATEGORIES: {
        USER: 'user',
        CONTENT: 'content',
        SOCIAL: 'social',
        MESSAGING: 'messaging',
        SEARCH: 'search',
        ERROR: 'error'
    }
}

// Security Configuration
export const SECURITY_CONFIG = {
    // CSRF protection
    CSRF_ENABLED: true,

    // Content Security Policy
    CSP_ENABLED: import.meta.env.PROD,

    // Rate limiting
    RATE_LIMITING: {
        ENABLED: true,
        WINDOW_MS: 60 * 1000, // 1 minute
        MAX_REQUESTS: 100
    },

    // Password requirements
    PASSWORD_REQUIREMENTS: {
        MIN_LENGTH: 8,
        REQUIRE_UPPERCASE: true,
        REQUIRE_LOWERCASE: true,
        REQUIRE_NUMBERS: true,
        REQUIRE_SYMBOLS: false
    },

    // Session security
    SESSION_SECURITY: {
        SECURE_COOKIES: import.meta.env.PROD,
        HTTP_ONLY: true,
        SAME_SITE: 'strict'
    }
}

// Feature Flags
export const FEATURE_FLAGS = {
    // Core features
    POSTS_ENABLED: true,
    COMMENTS_ENABLED: true,
    MESSAGES_ENABLED: true,
    NOTIFICATIONS_ENABLED: true,

    // Advanced features
    VIDEO_POSTS: import.meta.env.VITE_FEATURE_VIDEO_POSTS === 'true',
    LIVE_STREAMING: import.meta.env.VITE_FEATURE_LIVE_STREAMING === 'true',
    STORIES: import.meta.env.VITE_FEATURE_STORIES === 'true',
    POLLS: import.meta.env.VITE_FEATURE_POLLS === 'true',

    // Beta features
    AI_MODERATION: import.meta.env.VITE_FEATURE_AI_MODERATION === 'true',
    VOICE_MESSAGES: import.meta.env.VITE_FEATURE_VOICE_MESSAGES === 'true',
    GROUP_VIDEO_CALLS: import.meta.env.VITE_FEATURE_GROUP_VIDEO_CALLS === 'true',

    // Admin features
    ADMIN_ANALYTICS: import.meta.env.VITE_FEATURE_ADMIN_ANALYTICS === 'true',
    BULK_OPERATIONS: import.meta.env.VITE_FEATURE_BULK_OPERATIONS === 'true'
}

// Environment Configuration
export const ENV_CONFIG = {
    IS_DEVELOPMENT: import.meta.env.DEV,
    IS_PRODUCTION: import.meta.env.PROD,
    NODE_ENV: import.meta.env.MODE,

    // API endpoints
    API_URL: import.meta.env.VITE_API_URL,
    WS_URL: import.meta.env.VITE_WS_URL,
    CDN_URL: import.meta.env.VITE_CDN_URL,

    // External services
    GOOGLE_CLIENT_ID: import.meta.env.VITE_GOOGLE_CLIENT_ID,
    FACEBOOK_APP_ID: import.meta.env.VITE_FACEBOOK_APP_ID,
    VAPID_PUBLIC_KEY: import.meta.env.VITE_VAPID_PUBLIC_KEY,

    // Application info
    APP_NAME: import.meta.env.VITE_APP_NAME || 'Social Connect',
    APP_VERSION: import.meta.env.VITE_APP_VERSION || '1.0.0',
    APP_DESCRIPTION: import.meta.env.VITE_APP_DESCRIPTION || 'Kết nối và chia sẻ với bạn bè'
}

// Regex Patterns
export const REGEX_PATTERNS = {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^(\+84|0)[0-9]{9,10}$/,
    PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
    URL: /^https?:\/\/.+/,
    HASHTAG: /#[a-zA-Z0-9_\u00C0-\u017F\u1EA0-\u1EF9]+/g,
    MENTION: /@[a-zA-Z0-9_]+/g,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    MONGODB_ID: /^[0-9a-fA-F]{24}$/
}

// Date/Time Configuration
export const DATE_CONFIG = {
    // Formats
    FORMATS: {
        DATE: 'DD/MM/YYYY',
        TIME: 'HH:mm',
        DATETIME: 'DD/MM/YYYY HH:mm',
        FULL: 'dddd, DD MMMM YYYY [lúc] HH:mm',
        RELATIVE: 'relative',
        AGO: 'ago',
        SMART: 'smart',
        SHORT: 'short',
        ISO: 'iso',
        TIMESTAMP: 'timestamp'
    },

    // Locales
    DEFAULT_LOCALE: 'vi',
    SUPPORTED_LOCALES: ['vi', 'en'],

    // Timezone
    DEFAULT_TIMEZONE: 'Asia/Ho_Chi_Minh'
}

// Storage Keys
export const STORAGE_KEYS = {
    // Authentication
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data',
    REMEMBER_ME: 'remember_me',

    // UI Preferences
    THEME: 'ui_theme',
    LANGUAGE: 'ui_language',
    FONT_SIZE: 'ui_font_size',
    SIDEBAR_COLLAPSED: 'ui_sidebar_collapsed',

    // Notification Settings
    NOTIFICATIONS_ENABLED: 'notifications_enabled',
    SOUND_ENABLED: 'sound_enabled',
    PUSH_ENABLED: 'push_enabled',

    // Cache
    CACHE_VERSION: 'cache_version',
    CACHE_TIMESTAMP: 'cache_timestamp'
}

// Export default configuration object
export default {
    API_CONFIG,
    WEBSOCKET_CONFIG,
    CACHE_CONFIG,
    UPLOAD_CONFIG,
    USER_CONFIG,
    POST_CONFIG,
    COMMENT_CONFIG,
    MESSAGE_CONFIG,
    CONVERSATION_CONFIG,
    NOTIFICATION_CONFIG,
    UI_CONFIG,
    ERROR_CONFIG,
    ANALYTICS_CONFIG,
    SECURITY_CONFIG,
    FEATURE_FLAGS,
    ENV_CONFIG,
    REGEX_PATTERNS,
    DATE_CONFIG,
    STORAGE_KEYS
}