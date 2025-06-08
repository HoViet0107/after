// src/stores/comment.js
// Comment management store với real-time updates, caching và tối ưu performance

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { useAuthStore } from '@/stores/auth'
import { useWebSocket } from '@/composables/useWebSocket'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'

export const useCommentStore = defineStore('comment', () => {
    // Dependencies
    const authStore = useAuthStore()
    const { on, off, emit } = useWebSocket()
    const toast = useToast()

    // State
    const commentsByPost = ref(new Map()) // postId -> comments array
    const replyComments = ref(new Map()) // commentId -> replies array
    const loadingStates = ref(new Map()) // postId -> loading state
    const pagination = ref(new Map()) // postId -> pagination info
    const commentCache = ref(new Map()) // commentId -> comment data
    const optimisticComments = ref(new Map()) // temporary comments being processed
    
    // UI State
    const activeCommentEditor = ref(null) // currently editing comment
    const replyingToComment = ref(null) // comment being replied to
    const showReplies = ref(new Set()) // commentIds with visible replies
    
    // Real-time state
    const typingUsers = ref(new Map()) // commentId -> typing users
    const recentlyUpdated = ref(new Set()) // recently updated comment IDs
    
    // Performance optimization
    const batchTimer = ref(null)
    const pendingUpdates = ref(new Set())
    const cacheExpiry = 5 * 60 * 1000 // 5 minutes

    // Computed
    const getCommentsByPost = computed(() => (postId) => {
        const comments = commentsByPost.value.get(postId) || []
        const optimistic = Array.from(optimisticComments.value.values())
            .filter(comment => comment.postId === postId)
        
        return [...comments, ...optimistic].sort((a, b) => 
            new Date(a.createdAt) - new Date(b.createdAt)
        )
    })

    const getRepliesByComment = computed(() => (commentId) => {
        return replyComments.value.get(commentId) || []
    })

    const getCommentCount = computed(() => (postId) => {
        const comments = getCommentsByPost.value(postId)
        return comments.reduce((total, comment) => {
            const replyCount = getRepliesByComment.value(comment.id).length
            return total + 1 + replyCount
        }, 0)
    })

    const isLoading = computed(() => (postId) => {
        return loadingStates.value.get(postId) || false
    })

    const hasMoreComments = computed(() => (postId) => {
        const paginationInfo = pagination.value.get(postId)
        return paginationInfo ? paginationInfo.hasMore : true
    })

    const getTypingUsers = computed(() => (commentId) => {
        return Array.from(typingUsers.value.get(commentId) || [])
            .filter(userId => userId !== authStore.user?.id)
    })

    // Actions
    const loadComments = async (postId, page = 0, limit = 20) => {
        try {
            loadingStates.value.set(postId, true)

            const response = await apiClient.get(ENDPOINTS.POST_COMMENTS(postId), {
                params: { page, limit, sort: 'createdAt,asc' }
            })

            const comments = response.data.content || []
            
            // Cache comments
            comments.forEach(comment => {
                commentCache.value.set(comment.id, comment)
            })

            if (page === 0) {
                commentsByPost.value.set(postId, comments)
            } else {
                const existingComments = commentsByPost.value.get(postId) || []
                commentsByPost.value.set(postId, [...existingComments, ...comments])
            }

            // Update pagination
            pagination.value.set(postId, {
                currentPage: page,
                totalPages: response.data.totalPages || 0,
                totalElements: response.data.totalElements || 0,
                hasMore: !response.data.last
            })

            // Load replies for comments that have them
            const commentsWithReplies = comments.filter(comment => comment.replyCount > 0)
            await Promise.all(
                commentsWithReplies.map(comment => loadReplies(comment.id))
            )

            return comments
        } catch (error) {
            console.error('Error loading comments:', error)
            toast.error('Không thể tải bình luận')
            throw error
        } finally {
            loadingStates.value.set(postId, false)
        }
    }

    const loadReplies = async (commentId, page = 0, limit = 10) => {
        try {
            const response = await apiClient.get(ENDPOINTS.COMMENT_REPLIES(commentId), {
                params: { page, limit, sort: 'createdAt,asc' }
            })

            const replies = response.data.content || []
            
            // Cache replies
            replies.forEach(reply => {
                commentCache.value.set(reply.id, reply)
            })

            if (page === 0) {
                replyComments.value.set(commentId, replies)
            } else {
                const existingReplies = replyComments.value.get(commentId) || []
                replyComments.value.set(commentId, [...existingReplies, ...replies])
            }

            return replies
        } catch (error) {
            console.error('Error loading replies:', error)
            throw error
        }
    }

    const addComment = async (postId, content, attachments = []) => {
        const tempId = `temp-${Date.now()}`
        const optimisticComment = {
            id: tempId,
            postId,
            content,
            attachments,
            author: authStore.user,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isLiked: false,
            likeCount: 0,
            replyCount: 0,
            isPending: true
        }

        try {
            // Add optimistic comment
            optimisticComments.value.set(tempId, optimisticComment)

            // Send to server
            const response = await apiClient.post(ENDPOINTS.POST_COMMENTS(postId), {
                content,
                attachments: attachments.map(att => att.id || att)
            })

            const newComment = response.data

            // Remove optimistic comment and add real one
            optimisticComments.value.delete(tempId)
            const existingComments = commentsByPost.value.get(postId) || []
            commentsByPost.value.set(postId, [...existingComments, newComment])
            
            // Cache new comment
            commentCache.value.set(newComment.id, newComment)

            // Emit real-time event
            emit('comment:added', {
                postId,
                comment: newComment
            })

            // Update post comment count
            updatePostCommentCount(postId, 1)

            return newComment
        } catch (error) {
            // Remove optimistic comment on error
            optimisticComments.value.delete(tempId)
            console.error('Error adding comment:', error)
            toast.error('Không thể thêm bình luận')
            throw error
        }
    }

    const addReply = async (commentId, postId, content, attachments = []) => {
        const tempId = `temp-reply-${Date.now()}`
        const optimisticReply = {
            id: tempId,
            commentId,
            postId,
            content,
            attachments,
            author: authStore.user,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isLiked: false,
            likeCount: 0,
            isPending: true
        }

        try {
            // Add optimistic reply
            const existingReplies = replyComments.value.get(commentId) || []
            replyComments.value.set(commentId, [...existingReplies, optimisticReply])

            // Send to server
            const response = await apiClient.post(ENDPOINTS.COMMENT_REPLIES(commentId), {
                content,
                attachments: attachments.map(att => att.id || att)
            })

            const newReply = response.data

            // Replace optimistic reply with real one
            const replies = replyComments.value.get(commentId) || []
            const updatedReplies = replies.filter(r => r.id !== tempId)
            replyComments.value.set(commentId, [...updatedReplies, newReply])
            
            // Cache new reply
            commentCache.value.set(newReply.id, newReply)

            // Update parent comment reply count
            updateCommentReplyCount(commentId, 1)

            // Emit real-time event
            emit('reply:added', {
                commentId,
                postId,
                reply: newReply
            })

            return newReply
        } catch (error) {
            // Remove optimistic reply on error
            const replies = replyComments.value.get(commentId) || []
            replyComments.value.set(commentId, replies.filter(r => r.id !== tempId))
            console.error('Error adding reply:', error)
            toast.error('Không thể thêm phản hồi')
            throw error
        }
    }

    const updateComment = async (commentId, content) => {
        try {
            const response = await apiClient.put(ENDPOINTS.COMMENT(commentId), {
                content
            })

            const updatedComment = response.data

            // Update in cache
            commentCache.value.set(commentId, updatedComment)

            // Update in post comments
            for (const [postId, comments] of commentsByPost.value) {
                const index = comments.findIndex(c => c.id === commentId)
                if (index !== -1) {
                    comments[index] = updatedComment
                    break
                }
            }

            // Update in replies
            for (const [parentId, replies] of replyComments.value) {
                const index = replies.findIndex(r => r.id === commentId)
                if (index !== -1) {
                    replies[index] = updatedComment
                    break
                }
            }

            // Emit real-time event
            emit('comment:updated', {
                commentId,
                comment: updatedComment
            })

            activeCommentEditor.value = null
            return updatedComment
        } catch (error) {
            console.error('Error updating comment:', error)
            toast.error('Không thể cập nhật bình luận')
            throw error
        }
    }

    const deleteComment = async (commentId, postId) => {
        try {
            await apiClient.delete(ENDPOINTS.COMMENT(commentId))

            // Remove from post comments
            const comments = commentsByPost.value.get(postId) || []
            const filteredComments = comments.filter(c => c.id !== commentId)
            commentsByPost.value.set(postId, filteredComments)

            // Remove from replies
            for (const [parentId, replies] of replyComments.value) {
                const filteredReplies = replies.filter(r => r.id !== commentId)
                replyComments.value.set(parentId, filteredReplies)
            }

            // Remove from cache
            commentCache.value.delete(commentId)

            // Remove replies if this was a parent comment
            replyComments.value.delete(commentId)

            // Emit real-time event
            emit('comment:deleted', {
                commentId,
                postId
            })

            // Update post comment count
            updatePostCommentCount(postId, -1)

            toast.success('Đã xóa bình luận')
        } catch (error) {
            console.error('Error deleting comment:', error)
            toast.error('Không thể xóa bình luận')
            throw error
        }
    }

    const likeComment = async (commentId) => {
        try {
            const response = await apiClient.post(ENDPOINTS.COMMENT_LIKE(commentId))
            const updatedComment = response.data

            updateCommentInStore(commentId, updatedComment)

            // Emit real-time event
            emit('comment:liked', {
                commentId,
                userId: authStore.user.id
            })

            return updatedComment
        } catch (error) {
            console.error('Error liking comment:', error)
            throw error
        }
    }

    const unlikeComment = async (commentId) => {
        try {
            const response = await apiClient.delete(ENDPOINTS.COMMENT_LIKE(commentId))
            const updatedComment = response.data

            updateCommentInStore(commentId, updatedComment)

            // Emit real-time event
            emit('comment:unliked', {
                commentId,
                userId: authStore.user.id
            })

            return updatedComment
        } catch (error) {
            console.error('Error unliking comment:', error)
            throw error
        }
    }

    // Typing indicators
    const startTyping = debounce((commentId) => {
        emit('comment:typing:start', {
            commentId,
            userId: authStore.user.id
        })
    }, 300)

    const stopTyping = debounce((commentId) => {
        emit('comment:typing:stop', {
            commentId,
            userId: authStore.user.id
        })
    }, 1000)

    // Utility functions
    const updateCommentInStore = (commentId, updatedComment) => {
        // Update in cache
        commentCache.value.set(commentId, updatedComment)

        // Update in post comments
        for (const [postId, comments] of commentsByPost.value) {
            const index = comments.findIndex(c => c.id === commentId)
            if (index !== -1) {
                comments[index] = updatedComment
                return
            }
        }

        // Update in replies
        for (const [parentId, replies] of replyComments.value) {
            const index = replies.findIndex(r => r.id === commentId)
            if (index !== -1) {
                replies[index] = updatedComment
                return
            }
        }
    }

    const updatePostCommentCount = (postId, delta) => {
        // This would typically update the post store
        // For now, just emit an event
        emit('post:comment:count:update', {
            postId,
            delta
        })
    }

    const updateCommentReplyCount = (commentId, delta) => {
        const comment = commentCache.value.get(commentId)
        if (comment) {
            comment.replyCount = Math.max(0, (comment.replyCount || 0) + delta)
            updateCommentInStore(commentId, comment)
        }
    }

    // UI Actions
    const startEditing = (commentId) => {
        activeCommentEditor.value = commentId
    }

    const cancelEditing = () => {
        activeCommentEditor.value = null
    }

    const startReplying = (commentId) => {
        replyingToComment.value = commentId
    }

    const cancelReplying = () => {
        replyingToComment.value = null
    }

    const toggleReplies = (commentId) => {
        if (showReplies.value.has(commentId)) {
            showReplies.value.delete(commentId)
        } else {
            showReplies.value.add(commentId)
            // Load replies if not loaded
            if (!replyComments.value.has(commentId)) {
                loadReplies(commentId)
            }
        }
    }

    // Real-time event handlers
    const setupWebSocket = () => {
        on('comment:added', (data) => {
            if (data.comment.author.id !== authStore.user?.id) {
                const comments = commentsByPost.value.get(data.postId) || []
                commentsByPost.value.set(data.postId, [...comments, data.comment])
                commentCache.value.set(data.comment.id, data.comment)
            }
        })

        on('comment:updated', (data) => {
            updateCommentInStore(data.commentId, data.comment)
            recentlyUpdated.value.add(data.commentId)
            setTimeout(() => recentlyUpdated.value.delete(data.commentId), 3000)
        })

        on('comment:deleted', (data) => {
            // Remove from all stores
            commentCache.value.delete(data.commentId)
            
            for (const [postId, comments] of commentsByPost.value) {
                const filtered = comments.filter(c => c.id !== data.commentId)
                if (filtered.length !== comments.length) {
                    commentsByPost.value.set(postId, filtered)
                }
            }

            for (const [parentId, replies] of replyComments.value) {
                const filtered = replies.filter(r => r.id !== data.commentId)
                if (filtered.length !== replies.length) {
                    replyComments.value.set(parentId, filtered)
                }
            }
        })

        on('comment:typing:start', (data) => {
            const users = typingUsers.value.get(data.commentId) || new Set()
            users.add(data.userId)
            typingUsers.value.set(data.commentId, users)
        })

        on('comment:typing:stop', (data) => {
            const users = typingUsers.value.get(data.commentId)
            if (users) {
                users.delete(data.userId)
                if (users.size === 0) {
                    typingUsers.value.delete(data.commentId)
                }
            }
        })
    }

    // Cache management
    const clearCache = () => {
        commentsByPost.value.clear()
        replyComments.value.clear()
        commentCache.value.clear()
        optimisticComments.value.clear()
        typingUsers.value.clear()
        recentlyUpdated.value.clear()
    }

    const clearExpiredCache = () => {
        const now = Date.now()
        for (const [id, comment] of commentCache.value) {
            const age = now - new Date(comment.cachedAt || comment.createdAt).getTime()
            if (age > cacheExpiry) {
                commentCache.value.delete(id)
            }
        }
    }

    // Auto-clear expired cache every 5 minutes
    setInterval(clearExpiredCache, 5 * 60 * 1000)

    return {
        // State
        commentsByPost,
        replyComments,
        loadingStates,
        pagination,
        commentCache,
        activeCommentEditor,
        replyingToComment,
        showReplies,
        typingUsers,
        recentlyUpdated,

        // Computed
        getCommentsByPost,
        getRepliesByComment,
        getCommentCount,
        isLoading,
        hasMoreComments,
        getTypingUsers,

        // Actions
        loadComments,
        loadReplies,
        addComment,
        addReply,
        updateComment,
        deleteComment,
        likeComment,
        unlikeComment,

        // Typing
        startTyping,
        stopTyping,

        // UI Actions
        startEditing,
        cancelEditing,
        startReplying,
        cancelReplying,
        toggleReplies,

        // WebSocket
        setupWebSocket,

        // Cache
        clearCache,
        clearExpiredCache
    }
})