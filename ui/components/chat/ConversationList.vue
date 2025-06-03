<template>
    <div class="conversation-list">
        <div class="header">
            <h2>Chats</h2>
            <v-btn icon @click="$emit('create-conversation')">
                <v-icon>add</v-icon>
            </v-btn>
        </div>

        <div v-if="loading" class="loading-container">
            <v-progress-circular indeterminate color="primary" />
        </div>

        <div v-else-if="conversations.length === 0" class="empty-state">
            <v-icon size="large" color="grey">forum</v-icon>
            <p>No conversations yet</p>
            <v-btn @click="$emit('create-conversation')" color="primary">
                Start a conversation
            </v-btn>
        </div>

        <div v-else class="conversations">
            <div v-for="conversation in conversations" :key="conversation.id"
                :class="['conversation-item', { selected: conversation.id === selectedConversationId }]"
                @click="$emit('select-conversation', conversation.id)">
                <v-avatar class="conversation-avatar" size="50">
                    <img :src="getConversationAvatar(conversation)" :alt="conversation.name">
                </v-avatar>

                <div class="conversation-info">
                    <div class="conversation-header">
                        <h3 class="conversation-name">{{ getConversationName(conversation) }}</h3>
                        <span class="conversation-time">{{ formatConversationTime(conversation.lastMessageAt) }}</span>
                    </div>

                    <div class="conversation-preview">
                        <div class="last-message" :class="{ 'unread': conversation.unreadCount > 0 }">
                            {{ getLastMessagePreview(conversation) }}
                        </div>

                        <div v-if="conversation.unreadCount" class="unread-badge">
                            {{ conversation.unreadCount }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { dateUtils } from 'src/utils/common/dateUtils';
import { conversationUtils } from 'src/utils/chat/conversationUtils';
import { formatUtils } from 'src/utils/common/formatUtils';
import { useAuthStore } from 'src/stores/auth';

const _props = defineProps({
    conversations: {
        type: Array,
        default: () => []
    },
    selectedConversationId: {
        type: [String, Number],
        default: null
    },
    loading: {
        type: Boolean,
        default: false
    }
});

defineEmits(['select-conversation', 'create-conversation']);

// Get current user
const authStore = useAuthStore();
const currentUserId = computed(() => authStore.user?.id);

// Methods from utils
const { formatConversationTime } = dateUtils;
const { getDefaultAvatar, getConversationName: getConversationNameUtil } = conversationUtils;
const { truncateText } = formatUtils;

// Methods
const getConversationAvatar = (conversation) => {
    if (conversation.avatar) return conversation.avatar;
    return getDefaultAvatar(conversation);
};

const getConversationName = (conversation) => {
    return getConversationNameUtil(conversation, currentUserId.value);
};

const getLastMessagePreview = (conversation) => {
    if (!conversation.lastMessage) return 'No messages yet';

    let preview = '';
    if (conversation.isGroup && conversation.lastMessage.senderId !== currentUserId.value) {
        preview = `${conversation.lastMessage.senderName}: `;
    }

    preview += conversation.lastMessage.content || '';

    return truncateText(preview, 40);
};
</script>

<style scoped>
.conversation-list {
    width: 350px;
    border-right: 1px solid #e0e0e0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
}

.loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1;
}

.empty-state {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    flex: 1;
    gap: 1rem;
    color: #999;
}

.conversations {
    flex: 1;
    overflow-y: auto;
}

.conversation-item {
    display: flex;
    padding: 1rem;
    border-bottom: 1px solid #f0f0f0;
    cursor: pointer;
    transition: background-color 0.2s;
}

.conversation-item:hover {
    background-color: #f5f5f5;
}

.conversation-item.selected {
    background-color: #e3f2fd;
}

.conversation-avatar {
    margin-right: 1rem;
}

.conversation-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    /* For text truncation */
}

.conversation-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.3rem;
}

.conversation-name {
    font-size: 1rem;
    font-weight: 500;
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.conversation-time {
    font-size: 0.75rem;
    color: #999;
    white-space: nowrap;
    margin-left: 0.5rem;
}

.conversation-preview {
    display: flex;
    justify-content: space-between;
}

.last-message {
    font-size: 0.875rem;
    color: #666;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex: 1;
}

.last-message.unread {
    font-weight: 500;
    color: #000;
}

.unread-badge {
    min-width: 20px;
    height: 20px;
    background-color: #1976d2;
    color: white;
    border-radius: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 0.75rem;
    margin-left: 0.5rem;
    padding: 0 6px;
}
</style>