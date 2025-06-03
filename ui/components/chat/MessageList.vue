<template>
    <div class="message-list" ref="messageContainer">
        <div v-if="loading" class="loading-indicator">
            <v-progress-circular indeterminate color="primary" />
        </div>

        <template v-else>
            <div v-if="messages.length === 0" class="no-messages">
                <div class="no-messages-content">
                    <v-icon size="large" color="grey">chat_bubble_outline</v-icon>
                    <p>No messages yet. Start the conversation!</p>
                </div>
            </div>

            <div v-else class="messages-container">
                <div v-for="(message, index) in messages" :key="message.id">
                    <!-- Date separator -->
                    <div v-if="shouldShowDateSeparator(message, messages[index - 1], index)" class="date-separator">
                        <div class="date-line"></div>
                        <div class="date-text">{{ formatMessageDate(message.sentAt) }}</div>
                        <div class="date-line"></div>
                    </div>

                    <!-- System message -->
                    <div v-if="isSystemMessage(message)" class="system-message">
                        <v-icon size="small" class="system-icon">
                            {{ getSystemMessageIcon(message) }}
                        </v-icon>
                        <span>{{ message.content }}</span>
                    </div>

                    <!-- Regular message -->
                    <div v-else :class="[
                        'message',
                        { 'message-own': message.senderId === currentUserId },
                        { 'message-grouped': shouldGroupWithPrevious(message, messages[index - 1], index) }
                    ]">
                        <!-- Avatar (only show for first message in a group) -->
                        <div v-if="message.senderId !== currentUserId && !shouldGroupWithPrevious(message, messages[index - 1], index)"
                            class="avatar">
                            <v-avatar size="40">
                                <img :src="getAvatarUrl(message.senderName)" :alt="message.senderName">
                            </v-avatar>
                        </div>
                        <div v-else-if="message.senderId !== currentUserId" class="avatar-placeholder"></div>

                        <div class="message-content-wrapper">
                            <!-- Sender name (only show for first message in a group) -->
                            <div v-if="message.senderId !== currentUserId && !shouldGroupWithPrevious(message, messages[index - 1], index)"
                                class="sender-name">
                                {{ message.senderName }}
                            </div>

                            <!-- Message content -->
                            <div class="message-content">
                                <div class="content-text" :class="{ 'deleted': message.deleted }">
                                    {{ message.content }}
                                </div>

                                <div class="message-meta">
                                    <span class="message-time">{{ formatMessageTime(message.sentAt) }}</span>

                                    <span v-if="message.edited" class="edited-indicator">(edited)</span>

                                    <v-icon v-if="message.senderId === currentUserId" size="small"
                                        class="message-status" :color="message.status === 'READ' ? 'success' : ''">
                                        {{ getStatusIcon(message.status) }}
                                    </v-icon>
                                </div>

                                <!-- Message actions -->
                                <div v-if="message.senderId === currentUserId && !message.deleted"
                                    class="message-actions">
                                    <v-btn icon variant="text" size="small" @click="$emit('edit-message', message)">
                                        <v-icon size="small">edit</v-icon>
                                    </v-btn>

                                    <v-btn icon variant="text" size="small"
                                        @click="$emit('delete-message', message.id)">
                                        <v-icon size="small">delete</v-icon>
                                    </v-btn>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
import { ref, onMounted, onUpdated, watch } from 'vue';
import { dateUtils } from 'src/utils/common/dateUtils';
import { messageUtils } from 'src/utils/chat/messageUtils';

const props = defineProps({
    messages: {
        type: Array,
        default: () => []
    },
    currentUserId: {
        type: [String, Number],
        required: true
    },
    loading: {
        type: Boolean,
        default: false
    }
});

const _emit = defineEmits(['edit-message', 'delete-message']);

// References
const messageContainer = ref(null);

// Import helpers from utils
const {
    formatMessageTime,
    formatMessageDate,
    shouldShowDateSeparator,
    shouldGroupWithPrevious
} = dateUtils;

const {
    isSystemMessage,
    getSystemMessageIcon,
    getStatusIcon,
    getAvatarUrl
} = messageUtils;

// Scroll to bottom when messages change
watch(
    () => props.messages.length,
    () => {
        scrollToBottom();
    }
);

// Scroll to bottom on mount and update
onMounted(() => {
    scrollToBottom();
});

onUpdated(() => {
    scrollToBottom();
});

// Scroll to bottom
const scrollToBottom = () => {
    if (messageContainer.value) {
        messageContainer.value.scrollTop = messageContainer.value.scrollHeight;
    }
};
</script>

<style scoped>
.message-list {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
}

.loading-indicator {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.no-messages {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
}

.no-messages-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    color: #999;
}

.messages-container {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.date-separator {
    display: flex;
    align-items: center;
    margin: 1.5rem 0;
    gap: 1rem;
}

.date-line {
    flex: 1;
    height: 1px;
    background-color: rgba(0, 0, 0, 0.1);
}

.date-text {
    font-size: 0.8rem;
    color: #666;
    white-space: nowrap;
}

.system-message {
    align-self: center;
    display: flex;
    align-items: center;
    background-color: #f0f0f0;
    border-radius: 1rem;
    padding: 0.4rem 1rem;
    max-width: 80%;
    margin: 0.5rem 0;
    gap: 0.5rem;
    color: #666;
    font-size: 0.9rem;
}

.message {
    display: flex;
    margin-bottom: 0.5rem;
}

.message-own {
    flex-direction: row-reverse;
}

.message-grouped {
    margin-top: 0.2rem;
}

.avatar {
    margin-right: 0.5rem;
    margin-top: 0.5rem;
}

.avatar-placeholder {
    width: 40px;
    margin-right: 0.5rem;
}

.message-content-wrapper {
    display: flex;
    flex-direction: column;
    max-width: 70%;
}

.sender-name {
    font-size: 0.8rem;
    color: #666;
    margin-bottom: 0.2rem;
}

.message-content {
    position: relative;
    padding: 0.7rem 1rem;
    border-radius: 1rem;
    background-color: #f5f5f5;
    word-break: break-word;
}

.message-own .message-content {
    background-color: #e3f2fd;
}

.content-text {
    margin-right: 1rem;
}

.deleted {
    color: #999;
    font-style: italic;
}

.message-meta {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-size: 0.7rem;
    color: #999;
    margin-top: 0.3rem;
    gap: 0.3rem;
}

.edited-indicator {
    font-size: 0.7rem;
    color: #999;
}

.message-actions {
    position: absolute;
    top: 0;
    right: 0;
    display: none;
    background-color: white;
    border-radius: 1rem;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.message-content:hover .message-actions {
    display: flex;
}
</style>