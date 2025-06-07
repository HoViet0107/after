// API Endpoints Constants - synchronized with backend controllers
export const ENDPOINTS = {
    // Authentication
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
        VERIFY_EMAIL: '/auth/verify-email',
        RESET_PASSWORD: '/auth/reset-password',
        CHANGE_PASSWORD: '/auth/change-password'
    },

    // Users - synchronized with UserController backend
    USERS: {
        BASE: '/users',
        REGISTER: '/users/register', // POST
        PROFILE: (userId) => `/users/${userId}/profile`, // GET, PUT
        STATUS: (userId) => `/users/${userId}/status`, // POST - online/offline/active
        SEARCH: '/users/search', // GET
        FOLLOWERS: (userId) => `/users/${userId}/followers`, // GET
        FOLLOWING: (userId) => `/users/${userId}/following`, // GET
        FOLLOW: (userId) => `/users/${userId}/follow`, // POST, PUT
        UNFOLLOW: (userId) => `/users/${userId}/unfollow`, // PUT
        BLOCK: (userId) => `/users/${userId}/block`, // POST, PUT
        UNBLOCK: (userId) => `/users/${userId}/unblock`, // PUT
        AVATAR: (userId) => `/users/${userId}/avatar`, // PUT
        SUGGESTIONS: '/users/suggestions' // GET
    },

    // Posts - synchronized with PostController backend
    POSTS: {
        BASE: '/posts',
        CREATE: '/posts', // POST
        DETAIL: (postId) => `/posts/${postId}`, // GET, PUT, DELETE
        LIKE: (postId) => `/posts/${postId}/like`, // POST
        UNLIKE: (postId) => `/posts/${postId}/like`, // DELETE
        SHARE: (postId) => `/posts/${postId}/share`, // POST
        USER_POSTS: (userId) => `/users/${userId}/posts`, // GET
        FEED: '/posts/feed', // GET
        TRENDING: '/posts/trending' // GET
    },

    // Comments - synchronized with backend comment endpoints
    COMMENTS: {
        BASE: '/comments',
        POST_COMMENTS: (postId) => `/posts/${postId}/comments`, // GET, POST
        DETAIL: (commentId) => `/comments/${commentId}`, // GET, PUT, DELETE
        LIKE: (commentId) => `/comments/${commentId}/like`, // POST
        UNLIKE: (commentId) => `/comments/${commentId}/like`, // DELETE
        REPLIES: (commentId) => `/comments/${commentId}/replies`, // GET
        REPLY: (postId, commentId) => `/posts/${postId}/comments/${commentId}/reply` // POST
    },

    // Conversations
    CONVERSATIONS: {
        BASE: '/conversations',
        CREATE: '/conversations', // POST
        LIST: '/conversations', // GET
        DETAIL: (conversationId) => `/conversations/${conversationId}`, // GET, PUT, DELETE
        PARTICIPANTS: (conversationId) => `/conversations/${conversationId}/participants`, // GET, POST
        ADD_PARTICIPANT: (conversationId) => `/conversations/${conversationId}/participants`, // POST
        REMOVE_PARTICIPANT: (conversationId, userId) => `/conversations/${conversationId}/participants/${userId}`, // DELETE
        LEAVE: (conversationId) => `/conversations/${conversationId}/leave`, // POST
        MUTE: (conversationId) => `/conversations/${conversationId}/mute`, // POST
        UNMUTE: (conversationId) => `/conversations/${conversationId}/unmute`, // POST
        ARCHIVE: (conversationId) => `/conversations/${conversationId}/archive`, // POST
        UNARCHIVE: (conversationId) => `/conversations/${conversationId}/unarchive` // POST
    },

    // Messages
    MESSAGES: {
        BASE: '/messages',
        CONVERSATION_MESSAGES: (conversationId) => `/conversations/${conversationId}/messages`, // GET, POST
        DETAIL: (messageId) => `/messages/${messageId}`, // GET, PUT, DELETE
        EDIT: (messageId) => `/messages/${messageId}`, // PUT
        DELETE: (messageId) => `/messages/${messageId}`, // DELETE
        MARK_READ: (messageId) => `/messages/${messageId}/read`, // POST
        MARK_ALL_READ: (conversationId) => `/conversations/${conversationId}/messages/read`, // POST
        SEARCH: '/messages/search', // GET
        REACTIONS: (messageId) => `/messages/${messageId}/reactions`, // GET, POST, DELETE
        FORWARD: (messageId) => `/messages/${messageId}/forward` // POST
    },

    // Feed - synchronized with FeedService backend
    FEED: {
        HOME: '/feed', // GET
        USER: (userId) => `/feed/user/${userId}`, // GET
        TRENDING: '/feed/trending', // GET
        HASHTAG: (hashtag) => `/feed/hashtag/${hashtag}`, // GET
        EXPLORE: '/feed/explore' // GET
    },

    // Notifications
    NOTIFICATIONS: {
        BASE: '/notifications',
        LIST: '/notifications', // GET
        MARK_READ: (notificationId) => `/notifications/${notificationId}/read`, // POST
        MARK_ALL_READ: '/notifications/mark-all-read', // POST
        SETTINGS: '/notifications/settings', // GET, PUT
        COUNT: '/notifications/count' // GET
    },

    // File Upload - synchronized with file upload config backend
    UPLOAD: {
        BASE: '/upload',
        IMAGE: '/upload/image', // POST
        VIDEO: '/upload/video', // POST
        DOCUMENT: '/upload/document', // POST
        AVATAR: '/upload/avatar', // POST
        MULTIPLE: '/upload/multiple' // POST
    },

    // Search
    SEARCH: {
        GLOBAL: '/search', // GET
        USERS: '/search/users', // GET
        POSTS: '/search/posts', // GET
        HASHTAGS: '/search/hashtags', // GET
        SUGGESTIONS: '/search/suggestions' // GET
    },

    // Analytics & Reports
    ANALYTICS: {
        POST_STATS: (postId) => `/analytics/posts/${postId}`, // GET
        USER_STATS: (userId) => `/analytics/users/${userId}`, // GET
        ENGAGEMENT: '/analytics/engagement' // GET
    },

    // Admin
    ADMIN: {
        USERS: '/admin/users', // GET, POST, PUT, DELETE
        POSTS: '/admin/posts', // GET, DELETE
        REPORTS: '/admin/reports', // GET, PUT
        STATISTICS: '/admin/statistics' // GET
    },

    // WebSocket endpoints
    WS: {
        CHAT: '/ws/chat',
        NOTIFICATIONS: '/ws/notifications',
        PRESENCE: '/ws/presence',
        TYPING: '/ws/typing'
    },

    // Health check
    HEALTH: '/health'
}

// HTTP Methods constants
export const HTTP_METHODS = {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH'
}

// API Response status codes
export const API_STATUS = {
    SUCCESS: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    VALIDATION_ERROR: 422,
    RATE_LIMIT: 429,
    INTERNAL_SERVER_ERROR: 500
}

// Content types
export const CONTENT_TYPES = {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded'
}

// File upload constraints (synchronized with backend config)
export const UPLOAD_CONSTRAINTS = {
    MAX_FILE_SIZE: 10485760, // 10MB
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
    ALLOWED_VIDEO_TYPES: ['video/mp4', 'video/quicktime'],
    ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'application/msword']
}

// Pagination defaults
export const PAGINATION = {
    DEFAULT_PAGE: 0,
    DEFAULT_SIZE: 20,
    MAX_SIZE: 100
}

// Cache keys for Redis
export const CACHE_KEYS = {
    USER_PROFILE: (userId) => `user:profile:${userId}`,
    POST_DETAIL: (postId) => `post:detail:${postId}`,
    CONVERSATION_MESSAGES: (conversationId) => `conversation:messages:${conversationId}`,
    USER_FEED: (userId) => `user:feed:${userId}`,
    TRENDING_POSTS: 'posts:trending',
    USER_PRESENCE: (userId) => `user:presence:${userId}`
}