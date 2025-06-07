import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { useAuthStore } from '@/stores/auth'
import { useConversationStore } from '@/stores/conversation'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'

export const useMessageStore = defineStore('message', () => {
    // State
    const messagesByConversation = ref(new Map())
    const typingUsers = ref(new Map())
    const isLoading = ref(false)
    const isLoadingMore = ref(false)
    const isSending = ref(false)
    const pagination = ref(new Map()) // conversation pagination
    const messageCache = ref(new Map())
    const tempMessages = ref(new Map()) // temporary messages being sent
    const editingMessage = ref(null)
    const replyingToMessage = ref(null)

    // Dependencies
    const authStore = useAuthStore()
    const conversationStore = useConversationStore()
    const toast = useToast()

    // Getters
    const getMessagesByConversation = computed(() => (conversationId) => {
        return messagesByConversation.value.get(conversationId) || []
    })

    const getTypingUsersForConversation = computed(() => (conversationId) => {
        const typingInConversation = typingUsers.value.get(conversationId) || new Map()
        return Array.from(typingInConversation.values()).filter(user =>
            user.userId !== authStore.userId && user.isTyping
        )
    })

    const hasMoreMessages = computed(() => (conversationId) => {
        const paginationInfo = pagination.value.get(conversationId)
        return paginationInfo ? !paginationInfo.isLast : true
    })

    const getTempMessages = computed(() => (conversationId) => {
        return tempMessages.value.get(conversationId) || []
    })

    const getAllMessages = computed(() => (conversationId) => {
        const regular = getMessagesByConversation.value(conversationId)
        const temp = getTempMessages.value(conversationId)
        return [...regular, ...temp].sort((a, b) =>
            new Date(a.createdAt) - new Date(b.createdAt)
        )
    })

    // Actions
    const fetchMessages = async (conversationId, page = 0, reset = false) => {
        if (!conversationId) return { success: false, error: 'No conversation ID' }

        if (reset) {
            messagesByConversation.value.set(conversationId, [])
            pagination.value.set(conversationId, { page: 0, isLast: false })
        }

        // Check if has more messages
        const paginationInfo = pagination.value.get(conversationId)
        if (paginationInfo?.isLast && !reset) {
            return { success: true, data: [] }
        }

        isLoading.value = page === 0
        isLoadingMore.value = page > 0

        try {
            const response = await apiClient.get(
                ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId),
                {
                    params: {
                        page,
                        size: 50,
                        sort: 'createdAt,desc'
                    }
                }
            )

            const { content, totalPages, number, last } = response.data
            const messages = content.reverse() // Reverse to show oldest first

            // Cache messages
            messages.forEach(message => {
                messageCache.value.set(message.id, message)
            })

            if (reset) {
                messagesByConversation.value.set(conversationId, messages)
            } else {
                const existingMessages = messagesByConversation.value.get(conversationId) || []
                messagesByConversation.value.set(conversationId, [...messages, ...existingMessages])
            }

            // Update pagination
            pagination.value.set(conversationId, {
                page: number,
                totalPages,
                isLast: last
            })

            return { success: true, data: messages }
        } catch (error) {
            console.error('Failed to fetch messages:', error)
            toast.error('Không thể tải tin nhắn')
            return { success: false, error }
        } finally {
            isLoading.value = false
            isLoadingMore.value = false
        }
    }

    const sendMessage = async (conversationId, messageData) => {
        if (!conversationId || !messageData.content?.trim()) {
            return { success: false, error: 'Invalid message data' }
        }

        // Create temporary message for optimistic UI
        const tempId = `temp_${Date.now()}_${Math.random()}`
        const tempMessage = {
            id: tempId,
            content: messageData.content,
            type: messageData.type || 'text',
            senderId: authStore.userId,
            senderName: authStore.userName,
            senderAvatar: authStore.userAvatar,
            conversationId,
            createdAt: new Date().toISOString(),
            status: 'sending',
            replyTo: messageData.replyTo,
            attachments: messageData.attachments || [],
            isTemp: true
        }

        // Add temp message to UI
        addTempMessage(conversationId, tempMessage)

        isSending.value = true

        try {
            const response = await apiClient.post(
                ENDPOINTS.MESSAGES.CONVERSATION_MESSAGES(conversationId),
                {
                    content: messageData.content,
                    type: messageData.type || 'text',
                    replyToId: messageData.replyTo?.id,
                    attachments: messageData.attachments
                }
            )

            const sentMessage = response.data

            // Remove temp message and add real message
            removeTempMessage(conversationId, tempId)
            addMessage(conversationId, sentMessage)

            // Update conversation's last message
            conversationStore.updateLastMessage(conversationId, sentMessage)

            // Clear reply if set
            if (replyingToMessage.value) {
                replyingToMessage.value = null
            }

            return { success: true, data: sentMessage }
        } catch (error) {
            console.error('Failed to send message:', error)

            // Update temp message status to failed
            const tempMessagesList = tempMessages.value.get(conversationId) || []
            const tempMessageIndex = tempMessagesList.findIndex(m => m.id === tempId)
            if (tempMessageIndex !== -1) {
                tempMessagesList[tempMessageIndex].status = 'failed'
            }

            toast.error('Không thể gửi tin nhắn')
            return { success: false, error }
        } finally {
            isSending.value = false
        }
    }

    const editMessage = async (messageId, newContent) => {
        if (!messageId || !newContent?.trim()) {
            return { success: false, error: 'Invalid edit data' }
        }

        try {
            const response = await apiClient.put(
                ENDPOINTS.MESSAGES.EDIT(messageId),
                { content: newContent }
            )

            const editedMessage = response.data

            // Update message in cache and conversation
            updateMessageInState(editedMessage)

            // Clear editing state
            editingMessage.value = null

            toast.success('Đã chỉnh sửa tin nhắn!')
            return { success: true, data: editedMessage }
        } catch (error) {
            console.error('Failed to edit message:', error)
            toast.error('Không thể chỉnh sửa tin nhắn')
            return { success: false, error }
        }
    }

    const deleteMessage = async (messageId) => {
        if (!messageId) return { success: false, error: 'No message ID' }

        try {
            await apiClient.delete(ENDPOINTS.MESSAGES.DELETE(messageId))

            // Find and remove message from all conversations
            for (const [conversationId, messages] of messagesByConversation.value) {
                const messageIndex = messages.findIndex(m => m.id === messageId)
                if (messageIndex !== -1) {
                    messages.splice(messageIndex, 1)
                    break
                }
            }

            // Remove from cache
            messageCache.value.delete(messageId)

            toast.success('Đã xóa tin nhắn!')
            return { success: true }
        } catch (error) {
            console.error('Failed to delete message:', error)
            toast.error('Không thể xóa tin nhắn')
            return { success: false, error }
        }
    }

    const reactToMessage = async (messageId, emoji) => {
        if (!messageId || !emoji) return { success: false, error: 'Invalid reaction data' }

        try {
            const response = await apiClient.post(
                ENDPOINTS.MESSAGES.REACTIONS(messageId),
                { emoji, action: 'toggle' }
            )

            const updatedMessage = response.data

            // Update message in state
            updateMessageInState(updatedMessage)

            return { success: true, data: updatedMessage }
        } catch (error) {
            console.error('Failed to react to message:', error)
            toast.error('Không thể thêm reaction')
            return { success: false, error }
        }
    }

    const markMessageAsRead = async (messageId) => {
        if (!messageId) return

        try {
            await apiClient.post(ENDPOINTS.MESSAGES.MARK_READ(messageId))

            // Update message read status
            const message = messageCache.value.get(messageId)
            if (message) {
                message.isRead = true
                updateMessageInState(message)
            }

            return { success: true }
        } catch (error) {
            console.error('Failed to mark message as read:', error)
            return { success: false, error }
        }
    }

    const searchMessages = async (conversationId, query) => {
        if (!query?.trim()) return { success: true, data: [] }

        try {
            const response = await apiClient.get(ENDPOINTS.MESSAGES.SEARCH, {
                params: {
                    q: query,
                    conversationId,
                    limit: 50
                }
            })

            return { success: true, data: response.data }
        } catch (error) {
            console.error('Failed to search messages:', error)
            toast.error('Không thể tìm kiếm tin nhắn')
            return { success: false, error }
        }
    }

    const forwardMessage = async (messageId, conversationIds) => {
        if (!messageId || !conversationIds?.length) {
            return { success: false, error: 'Invalid forward data' }
        }

        try {
            const response = await apiClient.post(
                ENDPOINTS.MESSAGES.FORWARD(messageId),
                { conversationIds }
            )

            toast.success(`Đã chuyển tiếp tin nhắn đến ${conversationIds.length} cuộc trò chuyện!`)
            return { success: true, data: response.data }
        } catch (error) {
            console.error('Failed to forward message:', error)
            toast.error('Không thể chuyển tiếp tin nhắn')
            return { success: false, error }
        }
    }

    // Typing indicators
    const setTypingStatus = (conversationId, userId, isTyping, userInfo = {}) => {
        if (!conversationId || !userId) return

        let conversationTyping = typingUsers.value.get(conversationId)
        if (!conversationTyping) {
            conversationTyping = new Map()
            typingUsers.value.set(conversationId, conversationTyping)
        }

        if (isTyping) {
            conversationTyping.set(userId, {
                userId,
                isTyping: true,
                timestamp: Date.now(),
                ...userInfo
            })
        } else {
            conversationTyping.delete(userId)
        }

        // Auto-clear typing after 3 seconds
        if (isTyping) {
            setTimeout(() => {
                const currentTyping = typingUsers.value.get(conversationId)?.get(userId)
                if (currentTyping && Date.now() - currentTyping.timestamp >= 3000) {
                    conversationTyping.delete(userId)
                }
            }, 3000)
        }
    }

    // Debounced typing emit function
    const emitTyping = debounce((conversationId, isTyping) => {
        // This will be connected to WebSocket
        console.log('Emitting typing status:', { conversationId, isTyping })
    }, 300)

    // Helper functions
    const addMessage = (conversationId, message) => {
        const messages = messagesByConversation.value.get(conversationId) || []

        // Check if message already exists
        const existingIndex = messages.findIndex(m => m.id === message.id)
        if (existingIndex !== -1) {
            messages[existingIndex] = message
        } else {
            messages.push(message)
        }

        messagesByConversation.value.set(conversationId, messages)
        messageCache.value.set(message.id, message)
    }

    const addTempMessage = (conversationId, tempMessage) => {
        const tempMessagesList = tempMessages.value.get(conversationId) || []
        tempMessagesList.push(tempMessage)
        tempMessages.value.set(conversationId, tempMessagesList)
    }

    const removeTempMessage = (conversationId, tempId) => {
        const tempMessagesList = tempMessages.value.get(conversationId) || []
        const filtered = tempMessagesList.filter(m => m.id !== tempId)
        tempMessages.value.set(conversationId, filtered)
    }

    const updateMessageInState = (updatedMessage) => {
        // Update in cache
        messageCache.value.set(updatedMessage.id, updatedMessage)

        // Update in conversation messages
        for (const [conversationId, messages] of messagesByConversation.value) {
            const messageIndex = messages.findIndex(m => m.id === updatedMessage.id)
            if (messageIndex !== -1) {
                messages[messageIndex] = updatedMessage
                break
            }
        }
    }

    const retryFailedMessage = async (conversationId, tempId) => {
        const tempMessagesList = tempMessages.value.get(conversationId) || []
        const tempMessage = tempMessagesList.find(m => m.id === tempId)

        if (!tempMessage || tempMessage.status !== 'failed') return

        // Update status to sending
        tempMessage.status = 'sending'

        // Retry sending
        const result = await sendMessage(conversationId, {
            content: tempMessage.content,
            type: tempMessage.type,
            replyTo: tempMessage.replyTo,
            attachments: tempMessage.attachments
        })

        if (!result.success) {
            tempMessage.status = 'failed'
        }

        return result
    }

    const clearConversationMessages = (conversationId) => {
        messagesByConversation.value.delete(conversationId)
        tempMessages.value.delete(conversationId)
        typingUsers.value.delete(conversationId)
        pagination.value.delete(conversationId)
    }

    const setEditingMessage = (message) => {
        editingMessage.value = message
    }

    const setReplyingToMessage = (message) => {
        replyingToMessage.value = message
    }

    const clearEditingMessage = () => {
        editingMessage.value = null
    }

    const clearReplyingToMessage = () => {
        replyingToMessage.value = null
    }

    const reset = () => {
        messagesByConversation.value.clear()
        typingUsers.value.clear()
        pagination.value.clear()
        messageCache.value.clear()
        tempMessages.value.clear()
        editingMessage.value = null
        replyingToMessage.value = null
    }

    return {
        // State
        messagesByConversation,
        typingUsers,
        isLoading,
        isLoadingMore,
        isSending,
        editingMessage,
        replyingToMessage,

        // Getters
        getMessagesByConversation,
        getTypingUsersForConversation,
        hasMoreMessages,
        getTempMessages,
        getAllMessages,

        // Actions
        fetchMessages,
        sendMessage,
        editMessage,
        deleteMessage,
        reactToMessage,
        markMessageAsRead,
        searchMessages,
        forwardMessage,

        // Typing
        setTypingStatus,
        emitTyping,

        // Helpers
        addMessage,
        updateMessageInState,
        retryFailedMessage,
        clearConversationMessages,
        setEditingMessage,
        setReplyingToMessage,
        clearEditingMessage,
        clearReplyingToMessage,
        reset
    }
})