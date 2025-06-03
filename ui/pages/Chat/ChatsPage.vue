<template>
  <div class="chat-container">
    <!-- SideBar Component -->
    <ConversationList :conversations="sortedConversations" :selectedConversationId="selectedConversationId"
      :loading="loading.conversations" @select-conversation="handleSelectConversation"
      @create-conversation="handleCreateConversation" />

    <!-- Main Chat Area -->
    <div class="chat-content">
      <template v-if="selectedConversation">
        <ConversationHeader :conversation="selectedConversation" @leave-conversation="handleLeaveConversation"
          @show-info="showConversationInfo = true" />

        <MessageList :messages="sortedMessages" :currentUserId="currentUserId" :loading="loading.messages"
          @edit-message="handleEditMessage" @delete-message="handleDeleteMessage" />

        <MessageComposer :conversationId="selectedConversationId" :disabled="!isConnected"
          @send-message="handleSendMessage" @typing-started="handleTypingStarted"
          @typing-stopped="handleTypingStopped" />
      </template>

      <EmptyState v-else />
    </div>

    <!-- Modal components -->
    <ConversationInfoModal v-if="showConversationInfo" :conversation="selectedConversation"
      @close="showConversationInfo = false" @add-participants="handleAddParticipants"
      @remove-participant="handleRemoveParticipant" />

    <EditMessageModal v-if="editingMessageData" :message="editingMessageData" @save="handleSaveEditedMessage"
      @cancel="editingMessageData = null" />

    <CreateConversationModal v-if="showCreateConversationModal" @create="handleCreateConversationSubmit"
      @cancel="showCreateConversationModal = false" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { useChatState } from 'src/composables/chat/useChatState';
import { useChatActions } from 'src/composables/chat/useChatActions';
import { useWebSocketConnection } from 'src/composables/websocket/useWebSocketConnection';
import { useWebSocketHandlers } from 'src/composables/websocket/useWebSocketHandlers';
import { useChatNavigation } from 'src/composables/chat/useChatNavigation';
import { useAuthStore } from 'src/stores/auth';
import { ConversationServices, MessageServices } from 'src/services/api';

// Components
import ConversationList from 'src/components/ConversationList.vue';
import ConversationHeader from 'src/components/ConversationHeader.vue';
import MessageList from 'src/components/MessageList.vue';
import MessageComposer from 'src/components/MessageComposer.vue';
import EmptyState from 'src/components/EmptyState.vue';
import ConversationInfoModal from 'src/components/modals/ConversationInfoModal.vue';
import EditMessageModal from 'src/components/modals/EditMessageModal.vue';
import CreateConversationModal from 'src/components/modals/CreateConversationModal.vue';

// Stores
const authStore = useAuthStore();
const token = authStore.getToken();
const currentUserId = authStore.user?.id;

// Chat State
const {
  conversations,
  selectedConversationId,
  messages,
  loading,
  selectedConversation,
  sortedMessages,
  sortedConversations,
  setSelectedConversation,
  addMessage,
  updateConversation,
  removeConversation,
  updateConversationWithMessage,
  setLoading,
  clearMessages
} = useChatState();

// Chat Actions
const {
  sendMessage,
  editMessage,
  deleteMessage,
  leaveConversation,
  createConversation,
  addParticipants,
  removeParticipant,
  markAsRead,
  _sendingMessages,
  _editingMessages,
  _deletingMessages
} = useChatActions(token);

// WebSocket Connection
const {
  isConnected,
  _connectionError,
  connect,
  disconnect,
  _joinConversation,
  wsManager
} = useWebSocketConnection(token);

// Chat Navigation
const { navigateToConversation, navigateToChatsList } = useChatNavigation();

// Local state
const showConversationInfo = ref(false);
const editingMessageData = ref(null);
const showCreateConversationModal = ref(false);

// Setup WebSocket handlers
const { registerHandlers } = useWebSocketHandlers(wsManager.value, {
  messages,
  conversations,
  selectedConversationId,
  addMessage,
  updateConversation,
  removeConversation,
  setSelectedConversation,
  updateConversationWithMessage
});

// Lifecycle hooks
onMounted(async () => {
  // Kết nối WebSocket
  await connect();

  // Đăng ký các event handlers
  registerHandlers();

  // Tải danh sách cuộc hội thoại
  await loadConversations();

  // Kiểm tra URL để xem có nên chọn cuộc trò chuyện nào không
  const urlParams = new URLSearchParams(window.location.search);
  const conversationIdFromUrl = urlParams.get('conversationId');

  if (conversationIdFromUrl) {
    handleSelectConversation(conversationIdFromUrl);
  }
});

onUnmounted(() => {
  disconnect();
});

// Watch cho selectedConversationId để tải tin nhắn và đánh dấu là đã đọc
watch(selectedConversationId, async (newId, oldId) => {
  // Rời khỏi cuộc trò chuyện cũ nếu có
  if (oldId) {
    wsManager.value.leaveConversation(oldId);
  }

  // Nếu có cuộc trò chuyện được chọn
  if (newId) {
    // Xóa các tin nhắn cũ
    clearMessages();

    // Tải tin nhắn mới
    await loadMessages(newId);

    // Tham gia cuộc trò chuyện (WebSocket)
    wsManager.value.joinConversation(newId);

    // Đánh dấu là đã đọc
    await markConversationAsRead(newId);

    // Cập nhật URL
    updateUrlWithConversationId(newId);
  } else {
    // Nếu không có cuộc trò chuyện nào được chọn, xóa query parameter
    updateUrlWithConversationId(null);
  }
}, { immediate: false });

// Data loading methods
const loadConversations = async () => {
  try {
    setLoading('conversations', true);

    const response = await ConversationServices.getConversations(token);
    conversations.value = response.data;

    return response.data;
  } catch (error) {
    console.error('Failed to load conversations:', error);
    return [];
  } finally {
    setLoading('conversations', false);
  }
};

const loadMessages = async (conversationId) => {
  try {
    setLoading('messages', true);

    const response = await MessageServices.getMessages(conversationId, token);
    const loadedMessages = response.data;

    // Thêm tin nhắn vào state
    loadedMessages.forEach(msg => addMessage(msg));

    return loadedMessages;
  } catch (error) {
    console.error('Failed to load messages:', error);
    return [];
  } finally {
    setLoading('messages', false);
  }
};

const markConversationAsRead = async (conversationId) => {
  try {
    const conversation = conversations.value.find(c => c.id === conversationId);
    if (!conversation) return;

    // Nếu có tin nhắn chưa đọc
    if (conversation.unreadCount > 0) {
      // Đánh dấu tất cả các tin nhắn là đã đọc
      const lastMessage = conversation.lastMessage;
      if (lastMessage) {
        await markAsRead(conversationId, lastMessage.id);
      }

      // Cập nhật unreadCount trên UI
      updateConversation(conversationId, { unreadCount: 0 });
    }
  } catch (error) {
    console.error('Failed to mark conversation as read:', error);
  }
};

// URL handling
const updateUrlWithConversationId = (conversationId) => {
  const url = new URL(window.location.href);

  if (conversationId) {
    url.searchParams.set('conversationId', conversationId);
  } else {
    url.searchParams.delete('conversationId');
  }

  window.history.pushState({}, '', url);
};

// Event handlers
const handleSelectConversation = async (conversationId) => {
  setSelectedConversation(conversationId);
  navigateToConversation(conversationId);
};

const handleSendMessage = async (content, type = 'TEXT') => {
  if (!selectedConversationId.value || !content.trim()) return;

  try {
    // Tạo tin nhắn tạm thời để hiển thị ngay lập tức
    const tempId = `temp-${Date.now()}`;
    const tempMessage = {
      id: tempId,
      content,
      senderId: currentUserId,
      senderName: authStore.user?.name || 'Me',
      conversationId: selectedConversationId.value,
      sentAt: new Date().toISOString(),
      status: 'SENDING'
    };

    // Thêm vào danh sách tin nhắn
    addMessage(tempMessage);

    // Gửi tin nhắn thông qua API
    const result = await sendMessage(selectedConversationId.value, content, type);

    // Cập nhật tin nhắn tạm thời với dữ liệu từ server
    if (result?.serverMessage) {
      // Thay thế tin nhắn tạm thời bằng tin nhắn từ server
      addMessage({
        ...result.serverMessage,
        status: 'SENT'
      });
    }

  } catch (error) {
    console.error('Error sending message:', error);
  }
};

const handleEditMessage = (message) => {
  editingMessageData.value = message;
};

const handleSaveEditedMessage = async (messageId, newContent) => {
  try {
    await editMessage(messageId, newContent);

    // Cập nhật tin nhắn trong state
    const messageIndex = messages.value.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      messages.value[messageIndex] = {
        ...messages.value[messageIndex],
        content: newContent,
        edited: true,
        editedAt: new Date().toISOString()
      };
    }

    // Đóng modal
    editingMessageData.value = null;
  } catch (error) {
    console.error('Error editing message:', error);
  }
};

const handleDeleteMessage = async (messageId) => {
  try {
    await deleteMessage(messageId);

    // Cập nhật tin nhắn trong state để hiển thị thông báo đã xóa
    const messageIndex = messages.value.findIndex(m => m.id === messageId);
    if (messageIndex !== -1) {
      messages.value[messageIndex] = {
        ...messages.value[messageIndex],
        content: 'This message has been deleted',
        deleted: true,
        deletedAt: new Date().toISOString()
      };
    }
  } catch (error) {
    console.error('Error deleting message:', error);
  }
};

const handleLeaveConversation = async () => {
  if (!selectedConversationId.value) return;

  try {
    await leaveConversation(selectedConversationId.value);

    // Xóa cuộc trò chuyện khỏi danh sách
    removeConversation(selectedConversationId.value);

    // Xóa lựa chọn
    setSelectedConversation(null);

    // Quay lại trang chính
    navigateToChatsList();
  } catch (error) {
    console.error('Error leaving conversation:', error);
  }
};

const handleCreateConversation = () => {
  showCreateConversationModal.value = true;
};

const handleCreateConversationSubmit = async (data) => {
  try {
    const { name, participants, isGroup } = data;

    // Tạo cuộc trò chuyện mới
    const newConversation = await createConversation(name, participants, isGroup);

    // Thêm vào danh sách
    conversations.value.push(newConversation);

    // Chọn cuộc trò chuyện mới tạo
    setSelectedConversation(newConversation.id);

    // Đóng modal
    showCreateConversationModal.value = false;
  } catch (error) {
    console.error('Error creating conversation:', error);
  }
};

const handleAddParticipants = async (participantIds) => {
  if (!selectedConversationId.value) return;

  try {
    await addParticipants(selectedConversationId.value, participantIds);

    // Reload cuộc trò chuyện để cập nhật danh sách thành viên
    const updatedConversation = await ConversationServices.getConversation(selectedConversationId.value, token);
    updateConversation(selectedConversationId.value, updatedConversation.data);
  } catch (error) {
    console.error('Error adding participants:', error);
  }
};

const handleRemoveParticipant = async (participantId) => {
  if (!selectedConversationId.value) return;

  try {
    await removeParticipant(selectedConversationId.value, participantId);

    // Reload cuộc trò chuyện để cập nhật danh sách thành viên
    const updatedConversation = await ConversationServices.getConversation(selectedConversationId.value, token);
    updateConversation(selectedConversationId.value, updatedConversation.data);
  } catch (error) {
    console.error('Error removing participant:', error);
  }
};

const handleTypingStarted = () => {
  if (!selectedConversationId.value) return;

  wsManager.value.send({
    type: 'TYPING_STARTED',
    conversationId: selectedConversationId.value
  });
};

const handleTypingStopped = () => {
  if (!selectedConversationId.value) return;

  wsManager.value.send({
    type: 'TYPING_STOPPED',
    conversationId: selectedConversationId.value
  });
};
</script>

<style scoped>
.chat-container {
  display: flex;
  height: 100vh;
  width: 100%;
}

.chat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}
</style>