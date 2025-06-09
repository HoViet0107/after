import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'

export const useConversationStore = defineStore('conversation', () => {
    // State
    const conversations = ref([])
    const activeConversation = ref(null)
    const participants = ref([])
    const isLoading = ref(false)
    const isLoadingMore = ref(false)
    const searchQuery = ref('')
    const currentPage = ref(0)
    const hasMore = ref(true)
    const conversationCache = ref(new Map())

    // Dependencies
    const authStore = useAuthStore()
    const toast = useToast()

    // Getters
    const filteredConversations = computed(() => {
        if (!searchQuery.value) return conversations.value

        const query = searchQuery.value.toLowerCase()
        return conversations.value.filter(conv =>
            conv.title.toLowerCase().includes(query) ||
            conv.participants?.some(p =>
                p.username?.toLowerCase().includes(query) ||
                p.firstName?.toLowerCase().includes(query) ||
                p.lastName?.toLowerCase().includes(query)
            )
        )
    })

    const directMessages = computed(() =>
        conversations.value.filter(conv => !conv.isGroupChat && conv.participants?.length === 2)
    )

    const groupChats = computed(() =>
        conversations.value.filter(conv => conv.isGroupChat && conv.participants?.length > 2)
    )

    const unreadConversations = computed(() =>
        conversations.value.filter(conv => conv.unreadCount > 0)
    )

    const totalUnreadCount = computed(() =>
        conversations.value.reduce((total, conv) => total + (conv.unreadCount || 0), 0)
    )

    const activeConversationParticipants = computed(() => {
        if (!activeConversation.value) return []
        return activeConversation.value.participants || []
    })

    const getConversationById = computed(() => (id) => {
        return conversations.value.find(conv => conv.id === id) ||
            conversationCache.value.get(id)
    })

    // Actions
    const fetchConversations = async (page = 0, reset = false) => {
        if (reset) {
            currentPage.value = 0
            hasMore.value = true
            conversations.value = []
        }

        if (!hasMore.value && !reset) return

        isLoading.value = page === 0
        isLoadingMore.value = page > 0

        try {
            const response = await apiClient.get(ENDPOINTS.CONVERSATIONS.LIST, {
                params: {
                    page,
                    size: 20,
                    sort: 'lastMessageAt,desc'
                }
            })

            const { content, totalPages, number, last } = response.data

            if (reset) {
                conversations.value = content
            } else {
                conversations.value.push(...content)
            }

            // Cache conversations
            content.forEach(conv => {
                conversationCache.value.set(conv.id, conv)
            })

            currentPage.value = number
            hasMore.value = !last

            return { success: true, data: content }
        } catch (error) {
            console.error('Failed to fetch conversations:', error)
            toast.error('Không thể tải danh sách cuộc trò chuyện')
            return { success: false, error }
        } finally {
            isLoading.value = false
            isLoadingMore.value = false
        }
    }

    const fetchConversationById = async (conversationId) => {
        // Check cache first
        const cached = conversationCache.value.get(conversationId)
        if (cached) {
            return { success: true, data: cached }
        }

        isLoading.value = true

        try {
            const response = await apiClient.get(ENDPOINTS.CONVERSATIONS.DETAIL(conversationId))
            const conversation = response.data

            // Update cache
            conversationCache.value.set(conversationId, conversation)

            // Update in conversations list if exists
            const index = conversations.value.findIndex(conv => conv.id === conversationId)
            if (index !== -1) {
                conversations.value[index] = conversation
            }

            return { success: true, data: conversation }
        } catch (error) {
            console.error('Failed to fetch conversation:', error)
            toast.error('Không thể tải thông tin cuộc trò chuyện')
            return { success: false, error }
        } finally {
            isLoading.value = false
        }
    }

    const createConversation = async (conversationData) => {
        isLoading.value = true

        try {
            const response = await apiClient.post(ENDPOINTS.CONVERSATIONS.CREATE, {
                title: conversationData.title,
                isGroupChat: conversationData.isGroupChat || false,
                participantIds: conversationData.participantIds,
                description: conversationData.description
            })

            const newConversation = response.data

            // Add to conversations list
            conversations.value.unshift(newConversation)

            // Cache conversation
            conversationCache.value.set(newConversation.id, newConversation)

            toast.success(
                newConversation.isGroupChat
                    ? 'Đã tạo nhóm chat thành công!'
                    : 'Đã bắt đầu cuộc trò chuyện!'
            )

            return { success: true, data: newConversation }
        } catch (error) {
            console.error('Failed to create conversation:', error)
            toast.error('Không thể tạo cuộc trò chuyện')
            return { success: false, error }
        } finally {
            isLoading.value = false
        }
    }

    const selectConversation = async (conversationId) => {
        if (!conversationId) {
            activeConversation.value = null
            participants.value = []
            return
        }

        // Get conversation data
        const result = await fetchConversationById(conversationId)
        if (result.success) {
            activeConversation.value = result.data
            participants.value = result.data.participants || []

            // Mark as read
            await markConversationAsRead(conversationId)
        }

        return result
    }

    const updateConversation = async (conversationId, updates) => {
        isLoading.value = true

        try {
            const response = await apiClient.put(
                ENDPOINTS.CONVERSATIONS.DETAIL(conversationId),
                updates
            )

            const updatedConversation = response.data

            // Update in conversations list
            const index = conversations.value.findIndex(conv => conv.id === conversationId)
            if (index !== -1) {
                conversations.value[index] = updatedConversation
            }

            // Update cache
            conversationCache.value.set(conversationId, updatedConversation)

            // Update active conversation if it's the same
            if (activeConversation.value?.id === conversationId) {
                activeConversation.value = updatedConversation
            }

            toast.success('Đã cập nhật cuộc trò chuyện!')
            return { success: true, data: updatedConversation }
        } catch (error) {
            console.error('Failed to update conversation:', error)
            toast.error('Không thể cập nhật cuộc trò chuyện')
            return { success: false, error }
        } finally {
            isLoading.value = false
        }
    }

    const deleteConversation = async (conversationId) => {
        try {
            await apiClient.delete(ENDPOINTS.CONVERSATIONS.DETAIL(conversationId))

            // Remove from conversations list
            conversations.value = conversations.value.filter(conv => conv.id !== conversationId)

            // Remove from cache
            conversationCache.value.delete(conversationId)

            // Clear active conversation if it's the deleted one
            if (activeConversation.value?.id === conversationId) {
                activeConversation.value = null
                participants.value = []
            }

            toast.success('Đã xóa cuộc trò chuyện!')
            return { success: true }
        } catch (error) {
            console.error('Failed to delete conversation:', error)
            toast.error('Không thể xóa cuộc trò chuyện')
            return { success: false, error }
        }
    }

    const addParticipant = async (conversationId, userId) => {
        try {
            const response = await apiClient.post(
                ENDPOINTS.CONVERSATIONS.ADD_PARTICIPANT(conversationId),
                { userId }
            )

            const updatedConversation = response.data

            // Update conversation
            updateConversationInState(conversationId, updatedConversation)

            toast.success('Đã thêm thành viên vào cuộc trò chuyện!')
            return { success: true, data: updatedConversation }
        } catch (error) {
            console.error('Failed to add participant:', error)
            toast.error('Không thể thêm thành viên')
            return { success: false, error }
        }
    }

    const removeParticipant = async (conversationId, userId) => {
        try {
            await apiClient.delete(
                ENDPOINTS.CONVERSATIONS.REMOVE_PARTICIPANT(conversationId, userId)
            )

            // Update conversation by removing participant
            const conversation = getConversationById.value(conversationId)
            if (conversation) {
                conversation.participants = conversation.participants.filter(p => p.id !== userId)
                updateConversationInState(conversationId, conversation)
            }

            toast.success('Đã xóa thành viên khỏi cuộc trò chuyện!')
            return { success: true }
        } catch (error) {
            console.error('Failed to remove participant:', error)
            toast.error('Không thể xóa thành viên')
            return { success: false, error }
        }
    }

    const leaveConversation = async (conversationId) => {
        try {
            await apiClient.post(ENDPOINTS.CONVERSATIONS.LEAVE(conversationId))

            // Remove from conversations list
            conversations.value = conversations.value.filter(conv => conv.id !== conversationId)

            // Remove from cache
            conversationCache.value.delete(conversationId)

            // Clear active conversation if it's the one we left
            if (activeConversation.value?.id === conversationId) {
                activeConversation.value = null
                participants.value = []
            }

            toast.success('Đã rời khỏi cuộc trò chuyện!')
            return { success: true }
        } catch (error) {
            console.error('Failed to leave conversation:', error)
            toast.error('Không thể rời khỏi cuộc trò chuyện')
            return { success: false, error }
        }
    }

    const muteConversation = async (conversationId) => {
        try {
            await apiClient.post(ENDPOINTS.CONVERSATIONS.MUTE(conversationId))

            // Update conversation
            const conversation = getConversationById.value(conversationId)
            if (conversation) {
                conversation.isMuted = true
                updateConversationInState(conversationId, conversation)
            }

            toast.success('Đã tắt thông báo cuộc trò chuyện!')
            return { success: true }
        } catch (error) {
            console.error('Failed to mute conversation:', error)
            toast.error('Không thể tắt thông báo')
            return { success: false, error }
        }
    }

    const unmuteConversation = async (conversationId) => {
        try {
            await apiClient.post(ENDPOINTS.CONVERSATIONS.UNMUTE(conversationId))

            // Update conversation
            const conversation = getConversationById.value(conversationId)
            if (conversation) {
                conversation.isMuted = false
                updateConversationInState(conversationId, conversation)
            }

            toast.success('Đã bật thông báo cuộc trò chuyện!')
            return { success: true }
        } catch (error) {
            console.error('Failed to unmute conversation:', error)
            toast.error('Không thể bật thông báo')
            return { success: false, error }
        }
    }

    const markConversationAsRead = async (conversationId) => {
        try {
            await apiClient.post(ENDPOINTS.MESSAGES.MARK_ALL_READ(conversationId))

            // Update unread count
            const conversation = getConversationById.value(conversationId)
            if (conversation) {
                conversation.unreadCount = 0
                updateConversationInState(conversationId, conversation)
            }

            return { success: true }
        } catch (error) {
            console.error('Failed to mark conversation as read:', error)
            return { success: false, error }
        }
    }

    const searchConversations = async (query) => {
        if (!query.trim()) {
            searchQuery.value = ''
            return
        }

        searchQuery.value = query

        try {
            const response = await apiClient.get(ENDPOINTS.SEARCH.CONVERSATIONS, {
                params: { q: query, limit: 20 }
            })

            return { success: true, data: response.data }
        } catch (error) {
            console.error('Failed to search conversations:', error)
            return { success: false, error }
        }
    }

    // Helper functions
    const updateConversationInState = (conversationId, updatedConversation) => {
        // Update in conversations list
        const index = conversations.value.findIndex(conv => conv.id === conversationId)
        if (index !== -1) {
            conversations.value[index] = updatedConversation
        }

        // Update cache
        conversationCache.value.set(conversationId, updatedConversation)

        // Update active conversation if it's the same
        if (activeConversation.value?.id === conversationId) {
            activeConversation.value = updatedConversation
            participants.value = updatedConversation.participants || []
        }
    }

    const incrementUnreadCount = (conversationId) => {
        const conversation = getConversationById.value(conversationId)
        if (conversation) {
            conversation.unreadCount = (conversation.unreadCount || 0) + 1
            updateConversationInState(conversationId, conversation)
        }
    }

    const updateLastMessage = (conversationId, message) => {
        const conversation = getConversationById.value(conversationId)
        if (conversation) {
            conversation.lastMessage = message
            conversation.lastMessageAt = message.createdAt

            // Move to top of list
            const index = conversations.value.findIndex(conv => conv.id === conversationId)
            if (index !== -1) {
                const [conv] = conversations.value.splice(index, 1)
                conversations.value.unshift(conv)
            }

            updateConversationInState(conversationId, conversation)
        }
    }

    const reset = () => {
        conversations.value = []
        activeConversation.value = null
        participants.value = []
        searchQuery.value = ''
        currentPage.value = 0
        hasMore.value = true
        conversationCache.value.clear()
    }

    return {
        // State
        conversations,
        activeConversation,
        participants,
        isLoading,
        isLoadingMore,
        searchQuery,
        currentPage,
        hasMore,

        // Getters
        filteredConversations,
        directMessages,
        groupChats,
        unreadConversations,
        totalUnreadCount,
        activeConversationParticipants,
        getConversationById,

        // Actions
        fetchConversations,
        fetchConversationById,
        createConversation,
        selectConversation,
        updateConversation,
        deleteConversation,
        addParticipant,
        removeParticipant,
        leaveConversation,
        muteConversation,
        unmuteConversation,
        markConversationAsRead,
        searchConversations,

        // Helpers
        updateConversationInState,
        incrementUnreadCount,
        updateLastMessage,
        reset
    }
})