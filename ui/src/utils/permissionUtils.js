// src/utils/permissionUtils.js
// Permission checking utilities với role-based access control và caching

import { useAuthStore } from '@/stores/auth'

// Permission constants
export const PERMISSIONS = {
    // User permissions
    USER_VIEW_PROFILE: 'user:view_profile',
    USER_EDIT_PROFILE: 'user:edit_profile',
    USER_DELETE_ACCOUNT: 'user:delete_account',
    USER_CHANGE_PASSWORD: 'user:change_password',
    
    // Post permissions
    POST_CREATE: 'post:create',
    POST_VIEW: 'post:view',
    POST_EDIT: 'post:edit',
    POST_DELETE: 'post:delete',
    POST_LIKE: 'post:like',
    POST_COMMENT: 'post:comment',
    POST_SHARE: 'post:share',
    POST_REPORT: 'post:report',
    
    // Comment permissions
    COMMENT_CREATE: 'comment:create',
    COMMENT_EDIT: 'comment:edit',
    COMMENT_DELETE: 'comment:delete',
    COMMENT_LIKE: 'comment:like',
    COMMENT_REPLY: 'comment:reply',
    COMMENT_REPORT: 'comment:report',
    
    // Message permissions
    MESSAGE_SEND: 'message:send',
    MESSAGE_VIEW: 'message:view',
    MESSAGE_EDIT: 'message:edit',
    MESSAGE_DELETE: 'message:delete',
    MESSAGE_FORWARD: 'message:forward',
    
    // Conversation permissions
    CONVERSATION_CREATE: 'conversation:create',
    CONVERSATION_VIEW: 'conversation:view',
    CONVERSATION_EDIT: 'conversation:edit',
    CONVERSATION_DELETE: 'conversation:delete',
    CONVERSATION_ADD_MEMBER: 'conversation:add_member',
    CONVERSATION_REMOVE_MEMBER: 'conversation:remove_member',
    CONVERSATION_LEAVE: 'conversation:leave',
    
    // Follow permissions
    FOLLOW_USER: 'follow:user',
    UNFOLLOW_USER: 'unfollow:user',
    BLOCK_USER: 'block:user',
    UNBLOCK_USER: 'unblock:user',
    
    // Admin permissions
    ADMIN_VIEW_DASHBOARD: 'admin:view_dashboard',
    ADMIN_MANAGE_USERS: 'admin:manage_users',
    ADMIN_MANAGE_POSTS: 'admin:manage_posts',
    ADMIN_MANAGE_REPORTS: 'admin:manage_reports',
    ADMIN_VIEW_ANALYTICS: 'admin:view_analytics',
    ADMIN_SYSTEM_CONFIG: 'admin:system_config',
    
    // Moderator permissions
    MOD_DELETE_POST: 'mod:delete_post',
    MOD_DELETE_COMMENT: 'mod:delete_comment',
    MOD_BAN_USER: 'mod:ban_user',
    MOD_REVIEW_REPORTS: 'mod:review_reports'
}

// Role definitions với permissions
export const ROLES = {
    GUEST: {
        name: 'Guest',
        permissions: [
            PERMISSIONS.POST_VIEW,
            PERMISSIONS.USER_VIEW_PROFILE
        ]
    },
    USER: {
        name: 'User',
        permissions: [
            // User permissions
            PERMISSIONS.USER_VIEW_PROFILE,
            PERMISSIONS.USER_EDIT_PROFILE,
            PERMISSIONS.USER_DELETE_ACCOUNT,
            PERMISSIONS.USER_CHANGE_PASSWORD,
            
            // Post permissions
            PERMISSIONS.POST_CREATE,
            PERMISSIONS.POST_VIEW,
            PERMISSIONS.POST_EDIT,
            PERMISSIONS.POST_DELETE,
            PERMISSIONS.POST_LIKE,
            PERMISSIONS.POST_COMMENT,
            PERMISSIONS.POST_SHARE,
            PERMISSIONS.POST_REPORT,
            
            // Comment permissions
            PERMISSIONS.COMMENT_CREATE,
            PERMISSIONS.COMMENT_EDIT,
            PERMISSIONS.COMMENT_DELETE,
            PERMISSIONS.COMMENT_LIKE,
            PERMISSIONS.COMMENT_REPLY,
            PERMISSIONS.COMMENT_REPORT,
            
            // Message permissions
            PERMISSIONS.MESSAGE_SEND,
            PERMISSIONS.MESSAGE_VIEW,
            PERMISSIONS.MESSAGE_EDIT,
            PERMISSIONS.MESSAGE_DELETE,
            PERMISSIONS.MESSAGE_FORWARD,
            
            // Conversation permissions
            PERMISSIONS.CONVERSATION_CREATE,
            PERMISSIONS.CONVERSATION_VIEW,
            PERMISSIONS.CONVERSATION_EDIT,
            PERMISSIONS.CONVERSATION_DELETE,
            PERMISSIONS.CONVERSATION_ADD_MEMBER,
            PERMISSIONS.CONVERSATION_REMOVE_MEMBER,
            PERMISSIONS.CONVERSATION_LEAVE,
            
            // Follow permissions
            PERMISSIONS.FOLLOW_USER,
            PERMISSIONS.UNFOLLOW_USER,
            PERMISSIONS.BLOCK_USER,
            PERMISSIONS.UNBLOCK_USER
        ]
    },
    MODERATOR: {
        name: 'Moderator',
        permissions: [
            // Inherit all user permissions
            ...ROLES.USER?.permissions || [],
            
            // Additional moderator permissions
            PERMISSIONS.MOD_DELETE_POST,
            PERMISSIONS.MOD_DELETE_COMMENT,
            PERMISSIONS.MOD_BAN_USER,
            PERMISSIONS.MOD_REVIEW_REPORTS
        ]
    },
    ADMIN: {
        name: 'Admin',
        permissions: [
            // Inherit all moderator permissions
            ...ROLES.MODERATOR?.permissions || [],
            
            // Additional admin permissions
            PERMISSIONS.ADMIN_VIEW_DASHBOARD,
            PERMISSIONS.ADMIN_MANAGE_USERS,
            PERMISSIONS.ADMIN_MANAGE_POSTS,
            PERMISSIONS.ADMIN_MANAGE_REPORTS,
            PERMISSIONS.ADMIN_VIEW_ANALYTICS,
            PERMISSIONS.ADMIN_SYSTEM_CONFIG
        ]
    }
}

// Permission cache để tăng performance
const permissionCache = new Map()
const cacheExpiry = 5 * 60 * 1000 // 5 minutes

/**
 * Get current user từ auth store
 * @returns {Object|null} Current user object
 */
const getCurrentUser = () => {
    try {
        const authStore = useAuthStore()
        return authStore.user
    } catch (error) {
        console.warn('Could not access auth store:', error)
        return null
    }
}

/**
 * Get user roles
 * @param {Object} user - User object
 * @returns {Array<string>} Array of user roles
 */
export const getUserRoles = (user = null) => {
    const currentUser = user || getCurrentUser()
    if (!currentUser) return ['GUEST']
    
    return currentUser.roles || ['USER']
}

/**
 * Get user permissions từ roles
 * @param {Object} user - User object
 * @returns {Array<string>} Array of permissions
 */
export const getUserPermissions = (user = null) => {
    const cacheKey = `permissions_${user?.id || 'guest'}`
    const cached = permissionCache.get(cacheKey)
    
    // Check cache
    if (cached && Date.now() - cached.timestamp < cacheExpiry) {
        return cached.permissions
    }
    
    const roles = getUserRoles(user)
    const permissions = new Set()
    
    roles.forEach(roleName => {
        const role = ROLES[roleName.toUpperCase()]
        if (role && role.permissions) {
            role.permissions.forEach(permission => {
                permissions.add(permission)
            })
        }
    })
    
    const permissionArray = Array.from(permissions)
    
    // Cache result
    permissionCache.set(cacheKey, {
        permissions: permissionArray,
        timestamp: Date.now()
    })
    
    return permissionArray
}

/**
 * Check if user có permission cụ thể
 * @param {string} permission - Permission to check
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user has permission
 */
export const hasPermission = (permission, user = null) => {
    if (!permission) return false
    
    const userPermissions = getUserPermissions(user)
    return userPermissions.includes(permission)
}

/**
 * Check multiple permissions (AND logic)
 * @param {Array<string>} permissions - Permissions to check
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user has ALL permissions
 */
export const hasAllPermissions = (permissions, user = null) => {
    if (!permissions || permissions.length === 0) return true
    
    return permissions.every(permission => hasPermission(permission, user))
}

/**
 * Check multiple permissions (OR logic)
 * @param {Array<string>} permissions - Permissions to check
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user has ANY of the permissions
 */
export const hasAnyPermission = (permissions, user = null) => {
    if (!permissions || permissions.length === 0) return false
    
    return permissions.some(permission => hasPermission(permission, user))
}

/**
 * Check if user có role cụ thể
 * @param {string} role - Role to check
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user has role
 */
export const hasRole = (role, user = null) => {
    const userRoles = getUserRoles(user)
    return userRoles.includes(role.toUpperCase())
}

/**
 * Check multiple roles (AND logic)
 * @param {Array<string>} roles - Roles to check
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user has ALL roles
 */
export const hasAllRoles = (roles, user = null) => {
    if (!roles || roles.length === 0) return true
    
    return roles.every(role => hasRole(role, user))
}

/**
 * Check multiple roles (OR logic)
 * @param {Array<string>} roles - Roles to check
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user has ANY of the roles
 */
export const hasAnyRole = (roles, user = null) => {
    if (!roles || roles.length === 0) return false
    
    return roles.some(role => hasRole(role, user))
}

/**
 * Check if user có thể edit resource
 * @param {Object} resource - Resource object (post, comment, etc.)
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user can edit
 */
export const canEdit = (resource, user = null) => {
    const currentUser = user || getCurrentUser()
    if (!currentUser) return false
    
    // Resource owner can always edit
    if (resource.authorId === currentUser.id || resource.userId === currentUser.id) {
        return true
    }
    
    // Check admin/mod permissions
    if (hasRole('ADMIN', currentUser) || hasRole('MODERATOR', currentUser)) {
        return true
    }
    
    return false
}

/**
 * Check if user có thể delete resource
 * @param {Object} resource - Resource object (post, comment, etc.)
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user can delete
 */
export const canDelete = (resource, user = null) => {
    const currentUser = user || getCurrentUser()
    if (!currentUser) return false
    
    // Resource owner can always delete
    if (resource.authorId === currentUser.id || resource.userId === currentUser.id) {
        return true
    }
    
    // Check admin/mod permissions
    if (hasRole('ADMIN', currentUser) || hasRole('MODERATOR', currentUser)) {
        return true
    }
    
    return false
}

/**
 * Check if user có thể view resource
 * @param {Object} resource - Resource object
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user can view
 */
export const canView = (resource, user = null) => {
    const currentUser = user || getCurrentUser()
    
    // Public resources
    if (resource.visibility === 'public') return true
    
    // Private resources - only owner can view
    if (resource.visibility === 'private') {
        return currentUser && (resource.authorId === currentUser.id || resource.userId === currentUser.id)
    }
    
    // Friends only
    if (resource.visibility === 'friends') {
        if (!currentUser) return false
        
        // Owner can view
        if (resource.authorId === currentUser.id || resource.userId === currentUser.id) {
            return true
        }
        
        // Check if users are friends (would need friendship check logic)
        return checkFriendship(currentUser.id, resource.authorId || resource.userId)
    }
    
    return false
}

/**
 * Check if user có thể access conversation
 * @param {Object} conversation - Conversation object
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user can access
 */
export const canAccessConversation = (conversation, user = null) => {
    const currentUser = user || getCurrentUser()
    if (!currentUser) return false
    
    // Check if user is participant
    if (conversation.participants && conversation.participants.some(p => p.id === currentUser.id)) {
        return true
    }
    
    // Admin access
    if (hasRole('ADMIN', currentUser)) {
        return true
    }
    
    return false
}

/**
 * Check if user có thể manage conversation (add/remove members, etc.)
 * @param {Object} conversation - Conversation object
 * @param {Object} user - User object (optional)
 * @returns {boolean} True if user can manage
 */
export const canManageConversation = (conversation, user = null) => {
    const currentUser = user || getCurrentUser()
    if (!currentUser) return false
    
    // Creator can manage
    if (conversation.createdBy === currentUser.id) {
        return true
    }
    
    // Admin can manage
    if (hasRole('ADMIN', currentUser)) {
        return true
    }
    
    // Check if user is admin of group conversation
    if (conversation.isGroupChat && conversation.admins) {
        return conversation.admins.some(admin => admin.id === currentUser.id)
    }
    
    return false
}

/**
 * Check friendship between two users
 * @param {string} userId1 - First user ID
 * @param {string} userId2 - Second user ID
 * @returns {boolean} True if users are friends
 */
export const checkFriendship = (userId1, userId2) => {
    // This would typically make an API call or check friendship store
    // For now, return false as placeholder
    console.warn('checkFriendship not implemented - assuming no friendship')
    return false
}

/**
 * Get permission-filtered actions cho UI
 * @param {string} resourceType - Type of resource (post, comment, etc.)
 * @param {Object} resource - Resource object
 * @param {Object} user - User object (optional)
 * @returns {Object} Available actions
 */
export const getAvailableActions = (resourceType, resource, user = null) => {
    const actions = {
        view: false,
        edit: false,
        delete: false,
        like: false,
        comment: false,
        share: false,
        report: false
    }
    
    switch (resourceType) {
        case 'post':
            actions.view = canView(resource, user)
            actions.edit = canEdit(resource, user) && hasPermission(PERMISSIONS.POST_EDIT, user)
            actions.delete = canDelete(resource, user) && hasPermission(PERMISSIONS.POST_DELETE, user)
            actions.like = hasPermission(PERMISSIONS.POST_LIKE, user)
            actions.comment = hasPermission(PERMISSIONS.POST_COMMENT, user)
            actions.share = hasPermission(PERMISSIONS.POST_SHARE, user)
            actions.report = hasPermission(PERMISSIONS.POST_REPORT, user)
            break
            
        case 'comment':
            actions.view = true // Comments are generally viewable if post is viewable
            actions.edit = canEdit(resource, user) && hasPermission(PERMISSIONS.COMMENT_EDIT, user)
            actions.delete = canDelete(resource, user) && hasPermission(PERMISSIONS.COMMENT_DELETE, user)
            actions.like = hasPermission(PERMISSIONS.COMMENT_LIKE, user)
            actions.reply = hasPermission(PERMISSIONS.COMMENT_REPLY, user)
            actions.report = hasPermission(PERMISSIONS.COMMENT_REPORT, user)
            break
            
        case 'message':
            actions.view = canView(resource, user)
            actions.edit = canEdit(resource, user) && hasPermission(PERMISSIONS.MESSAGE_EDIT, user)
            actions.delete = canDelete(resource, user) && hasPermission(PERMISSIONS.MESSAGE_DELETE, user)
            actions.forward = hasPermission(PERMISSIONS.MESSAGE_FORWARD, user)
            break
    }
    
    return actions
}

/**
 * Clear permission cache
 */
export const clearPermissionCache = () => {
    permissionCache.clear()
}

/**
 * Clear permission cache cho specific user
 * @param {string} userId - User ID
 */
export const clearUserPermissionCache = (userId) => {
    const cacheKey = `permissions_${userId}`
    permissionCache.delete(cacheKey)
}

/**
 * Preload permissions cho user (để tăng performance)
 * @param {Object} user - User object
 */
export const preloadPermissions = (user) => {
    getUserPermissions(user)
}

/**
 * Create permission directive cho Vue
 * @returns {Object} Vue directive object
 */
export const createPermissionDirective = () => {
    return {
        mounted(el, binding) {
            const { value, modifiers } = binding
            
            if (modifiers.role) {
                // v-permission.role="'ADMIN'"
                if (!hasRole(value)) {
                    el.style.display = 'none'
                }
            } else if (modifiers.any) {
                // v-permission.any="['post:edit', 'post:delete']"
                if (!hasAnyPermission(value)) {
                    el.style.display = 'none'
                }
            } else if (modifiers.all) {
                // v-permission.all="['post:edit', 'post:delete']"
                if (!hasAllPermissions(value)) {
                    el.style.display = 'none'
                }
            } else {
                // v-permission="'post:edit'"
                if (!hasPermission(value)) {
                    el.style.display = 'none'
                }
            }
        },
        
        updated(el, binding) {
            // Re-check permissions on update
            this.mounted(el, binding)
        }
    }
}

/**
 * Permission composable cho Vue Composition API
 * @returns {Object} Permission methods
 */
export const usePermissions = () => {
    return {
        hasPermission,
        hasAllPermissions,
        hasAnyPermission,
        hasRole,
        hasAllRoles,
        hasAnyRole,
        canEdit,
        canDelete,
        canView,
        canAccessConversation,
        canManageConversation,
        getAvailableActions,
        getUserPermissions,
        getUserRoles,
        PERMISSIONS,
        ROLES
    }
}