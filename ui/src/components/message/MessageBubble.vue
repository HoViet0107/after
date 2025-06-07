<template>
    <div class="message-bubble-wrapper" :class="{
        'own-message': isOwn,
        'other-message': !isOwn,
        'first-in-group': isFirstInGroup,
        'last-in-group': isLastInGroup,
        'has-reply': message.replyTo
    }" :data-message-id="message.id">
        <!-- Avatar (for other users) -->
        <div v-if="showAvatar && !isOwn" class="message-avatar">
            <img :src="message.senderAvatar || '/default-avatar.png'" :alt="message.senderName"
                @error="handleAvatarError" />
        </div>

        <!-- Message Content -->
        <div class="message-content">
            <!-- Sender Name -->
            <div v-if="showSender && !isOwn" class="message-sender">
                {{ message.senderName }}
            </div>

            <!-- Reply Reference -->
            <div v-if="message.replyTo" class="reply-reference" @click="scrollToReply">
                <div class="reply-line"></div>
                <div class="reply-content">
                    <div class="reply-sender">{{ message.replyTo.senderName }}</div>
                    <div class="reply-text">{{ truncateText(message.replyTo.content, 80) }}</div>
                </div>
            </div>

            <!-- Main Message Bubble -->
            <div class="message-bubble" :class="{
                'own-bubble': isOwn,
                'other-bubble': !isOwn,
                'has-attachments': hasAttachments,
                'system-message': message.type === 'system',
                'deleted-message': message.isDeleted,
                'edited-message': message.isEdited,
                'failed-message': message.status === 'failed',
                'sending-message': message.status === 'sending'
            }" @contextmenu.prevent="showContextMenu" @dblclick="handleDoubleClick">
                <!-- Message Status Icons -->
                <div v-if="isOwn && (message.status === 'sending' || message.status === 'failed')"
                    class="message-status">
                    <i v-if="message.status === 'sending'" class="fas fa-clock text-muted"></i>
                    <i v-else-if="message.status === 'failed'" class="fas fa-exclamation-triangle text-danger"></i>
                </div>

                <!-- Attachments -->
                <div v-if="hasAttachments" class="message-attachments">
                    <div v-for="(attachment, index) in message.attachments" :key="index" class="attachment-item">
                        <!-- Image Attachment -->
                        <div v-if="isImageAttachment(attachment)" class="image-attachment">
                            <img :src="attachment.thumbnailUrl || attachment.url" :alt="attachment.name"
                                class="attachment-image" @click="openImageModal(attachment)"
                                @error="handleImageError" />
                            <div v-if="attachment.isUploading" class="upload-overlay">
                                <div class="upload-progress">
                                    <div class="progress-circle">
                                        <span>{{ attachment.uploadProgress }}%</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Video Attachment -->
                        <div v-else-if="isVideoAttachment(attachment)" class="video-attachment">
                            <video :src="attachment.url" class="attachment-video" controls preload="metadata">
                                Trình duyệt không hỗ trợ video.
                            </video>
                        </div>

                        <!-- File Attachment -->
                        <div v-else class="file-attachment" @click="downloadFile(attachment)">
                            <div class="file-icon">
                                <i :class="getFileIcon(attachment)"></i>
                            </div>
                            <div class="file-info">
                                <div class="file-name">{{ attachment.name }}</div>
                                <div class="file-size">{{ formatFileSize(attachment.size) }}</div>
                            </div>
                            <div class="file-action">
                                <i class="fas fa-download"></i>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Text Content -->
                <div v-if="message.content && !message.isDeleted" class="message-text">
                    <div v-if="message.type === 'system'" class="system-content">
                        {{ message.content }}
                    </div>
                    <div v-else class="text-content">
                        <MessageContent :content="message.content" />
                    </div>
                </div>

                <!-- Deleted Message -->
                <div v-if="message.isDeleted" class="deleted-content">
                    <i class="fas fa-ban me-2"></i>
                    <em>Tin nhắn đã bị xóa</em>
                </div>

                <!-- Edited Indicator -->
                <div v-if="message.isEdited && !message.isDeleted" class="edited-indicator">
                    <small class="text-muted">(đã chỉnh sửa)</small>
                </div>

                <!-- Message Reactions -->
                <div v-if="hasReactions" class="message-reactions">
                    <div v-for="(reaction, emoji) in message.reactions" :key="emoji" class="reaction-item"
                        :class="{ 'own-reaction': reaction.users?.includes(currentUserId) }"
                        @click="toggleReaction(emoji)" :title="getReactionTooltip(reaction)">
                        <span class="reaction-emoji">{{ emoji }}</span>
                        <span class="reaction-count">{{ reaction.count }}</span>
                    </div>

                    <!-- Add Reaction Button -->
                    <button class="add-reaction-btn" @click="showEmojiPicker = !showEmojiPicker" title="Thêm reaction">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>

                <!-- Message Timestamp -->
                <div v-if="showTimestamp" class="message-timestamp">
                    <small class="text-muted">
                        {{ formatMessageTime(message.createdAt) }}
                        <span v-if="isOwn" class="read-status">
                            <i v-if="message.isRead" class="fas fa-check-double text-primary" title="Đã đọc"></i>
                            <i v-else class="fas fa-check text-muted" title="Đã gửi"></i>
                        </span>
                    </small>
                </div>
            </div>
        </div>

        <!-- Quick Actions (on hover) -->
        <div v-if="showQuickActions" class="quick-actions">
            <button class="quick-action-btn" @click="handleReply" title="Trả lời">
                <i class="fas fa-reply"></i>
            </button>

            <button v-if="!hasReactions" class="quick-action-btn" @click="addQuickReaction('👍')" title="Thích">
                <i class="fas fa-thumbs-up"></i>
            </button>

            <button class="quick-action-btn" @click="showEmojiPicker = !showEmojiPicker" title="Reaction">
                <i class="fas fa-smile"></i>
            </button>

            <div class="dropdown">
                <button class="quick-action-btn dropdown-toggle" type="button" data-bs-toggle="dropdown" title="Thêm">
                    <i class="fas fa-ellipsis-h"></i>
                </button>
                <ul class="dropdown-menu">
                    <li>
                        <a class="dropdown-item" href="#" @click="handleForward">
                            <i class="fas fa-share me-2"></i>Chuyển tiếp
                        </a>
                    </li>
                    <li v-if="canEdit">
                        <a class="dropdown-item" href="#" @click="handleEdit">
                            <i class="fas fa-edit me-2"></i>Chỉnh sửa
                        </a>
                    </li>
                    <li v-if="canDelete">
                        <a class="dropdown-item text-danger" href="#" @click="handleDelete">
                            <i class="fas fa-trash me-2"></i>Xóa
                        </a>
                    </li>
                    <li v-if="message.status === 'failed'">
                        <a class="dropdown-item" href="#" @click="handleRetry">
                            <i class="fas fa-redo me-2"></i>Thử lại
                        </a>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Emoji Picker -->
        <div v-if="showEmojiPicker" class="emoji-picker-wrapper">
            <EmojiPicker @emoji-select="addReaction" @close="showEmojiPicker = false" />
        </div>

        <!-- Context Menu -->
        <div v-if="contextMenu.show" class="context-menu" :style="contextMenuStyle">
            <ul class="context-menu-list">
                <li @click="handleReply">
                    <i class="fas fa-reply me-2"></i>Trả lời
                </li>
                <li @click="copyMessage">
                    <i class="fas fa-copy me-2"></i>Sao chép
                </li>
                <li @click="handleForward">
                    <i class="fas fa-share me-2"></i>Chuyển tiếp
                </li>
                <li v-if="canEdit" @click="handleEdit">
                    <i class="fas fa-edit me-2"></i>Chỉnh sửa
                </li>
                <li v-if="canDelete" @click="handleDelete" class="text-danger">
                    <i class="fas fa-trash me-2"></i>Xóa
                </li>
            </ul>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import MessageContent from '@/components/message/MessageContent.vue'
import EmojiPicker from '@/components/common/EmojiPicker.vue'

// Props
const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    isOwn: {
        type: Boolean,
        default: false
    },
    showAvatar: {
        type: Boolean,
        default: false
    },
    showSender: {
        type: Boolean,
        default: false
    },
    showTimestamp: {
        type: Boolean,
        default: true
    },
    isFirstInGroup: {
        type: Boolean,
        default: false
    },
    isLastInGroup: {
        type: Boolean,
        default: false
    },
    conversationId: {
        type: String,
        required: true
    }
})

// Emits
const emit = defineEmits([
    'reply',
    'edit',
    'delete',
    'react',
    'forward',
    'scroll-to',
    'retry'
])

// Dependencies
const authStore = useAuthStore()
const toast = useToast()

// State
const showQuickActions = ref(false)
const showEmojiPicker = ref(false)
const contextMenu = ref({ show: false, x: 0, y: 0 })

// Computed
const currentUserId = computed(() => authStore.userId)

const hasAttachments = computed(() =>
    props.message.attachments && props.message.attachments.length > 0
)

const hasReactions = computed(() =>
    props.message.reactions && Object.keys(props.message.reactions).length > 0
)

const canEdit = computed(() =>
    props.isOwn &&
    !props.message.isDeleted &&
    props.message.type === 'text' &&
    (Date.now() - new Date(props.message.createdAt)) < 15 * 60 * 1000 // 15 minutes
)

const canDelete = computed(() =>
    props.isOwn && !props.message.isDeleted
)

const contextMenuStyle = computed(() => ({
    left: contextMenu.value.x + 'px',
    top: contextMenu.value.y + 'px'
}))

// Methods
const handleReply = () => {
    emit('reply', props.message)
    hideContextMenu()
}

const handleEdit = () => {
    emit('edit', props.message)
    hideContextMenu()
}

const handleDelete = () => {
    if (confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
        emit('delete', props.message)
    }
    hideContextMenu()
}

const handleForward = () => {
    emit('forward', props.message)
    hideContextMenu()
}

const handleRetry = () => {
    emit('retry', props.message)
}

const handleDoubleClick = () => {
    if (canEdit.value) {
        handleEdit()
    }
}

const addReaction = (emoji) => {
    emit('react', props.message, emoji)
    showEmojiPicker.value = false
}

const addQuickReaction = (emoji) => {
    emit('react', props.message, emoji)
}

const toggleReaction = (emoji) => {
    emit('react', props.message, emoji)
}

const scrollToReply = () => {
    if (props.message.replyTo) {
        emit('scroll-to', props.message.replyTo.id)
    }
}

const copyMessage = async () => {
    try {
        await navigator.clipboard.writeText(props.message.content)
        toast.success('Đã sao chép tin nhắn')
    } catch (error) {
        toast.error('Không thể sao chép tin nhắn')
    }
    hideContextMenu()
}

const showContextMenu = (event) => {
    contextMenu.value = {
        show: true,
        x: event.clientX,
        y: event.clientY
    }
}

const hideContextMenu = () => {
    contextMenu.value.show = false
}

// File handling
const isImageAttachment = (attachment) => {
    return attachment.type?.startsWith('image/') ||
        attachment.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
}

const isVideoAttachment = (attachment) => {
    return attachment.type?.startsWith('video/') ||
        attachment.url?.match(/\.(mp4|webm|ogg)$/i)
}

const getFileIcon = (attachment) => {
    const type = attachment.type || ''
    if (type.includes('pdf')) return 'fas fa-file-pdf text-danger'
    if (type.includes('word') || type.includes('document')) return 'fas fa-file-word text-primary'
    if (type.includes('excel') || type.includes('spreadsheet')) return 'fas fa-file-excel text-success'
    if (type.includes('powerpoint') || type.includes('presentation')) return 'fas fa-file-powerpoint text-warning'
    if (type.startsWith('audio/')) return 'fas fa-file-audio text-info'
    if (type.startsWith('video/')) return 'fas fa-file-video text-purple'
    if (type.includes('zip') || type.includes('rar')) return 'fas fa-file-archive text-secondary'
    return 'fas fa-file text-muted'
}

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const downloadFile = (attachment) => {
    const link = document.createElement('a')
    link.href = attachment.url
    link.download = attachment.name
    link.click()
}

const openImageModal = (attachment) => {
    // Implement image modal opening
    console.log('Open image modal:', attachment)
}

const getReactionTooltip = (reaction) => {
    if (!reaction.users || reaction.users.length === 0) return ''

    if (reaction.users.length === 1) {
        return reaction.users[0] === currentUserId.value ? 'Bạn' : 'Một người khác'
    } else if (reaction.users.length <= 3) {
        return reaction.users.map(id =>
            id === currentUserId.value ? 'Bạn' : 'Người khác'
        ).join(', ')
    } else {
        return `${reaction.users.length} người`
    }
}

// Utility functions
const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

const formatMessageTime = (timestamp) => {
    return format(new Date(timestamp), 'HH:mm', { locale: vi })
}

const handleAvatarError = (event) => {
    event.target.src = '/default-avatar.png'
}

const handleImageError = (event) => {
    event.target.src = '/placeholder-image.png'
}

// Click outside to close context menu and emoji picker
const handleClickOutside = (event) => {
    if (contextMenu.value.show && !event.target.closest('.context-menu')) {
        hideContextMenu()
    }
    if (showEmojiPicker.value && !event.target.closest('.emoji-picker-wrapper')) {
        showEmojiPicker.value = false
    }
}

// Lifecycle
onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.message-bubble-wrapper {
    display: flex;
    margin-bottom: 4px;
    position: relative;

    &:hover {
        .quick-actions {
            opacity: 1;
            visibility: visible;
        }
    }

    &.own-message {
        justify-content: flex-end;

        .message-content {
            align-items: flex-end;
        }
    }

    &.other-message {
        justify-content: flex-start;

        .message-content {
            align-items: flex-start;
        }
    }

    &.first-in-group {
        margin-top: 8px;
    }

    &.has-reply {
        margin-top: 4px;
    }
}

.message-avatar {
    width: 32px;
    height: 32px;
    margin-right: 8px;
    margin-top: auto;

    img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
    }
}

.message-content {
    display: flex;
    flex-direction: column;
    max-width: 70%;
    min-width: 120px;
}

.message-sender {
    font-size: 0.8rem;
    font-weight: 500;
    color: var(--bs-primary);
    margin-bottom: 4px;
    margin-left: 12px;
}

.reply-reference {
    background: var(--bs-gray-100);
    border-left: 3px solid var(--bs-primary);
    border-radius: 8px;
    padding: 8px 12px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
        background: var(--bs-gray-200);
    }

    .reply-sender {
        font-size: 0.8rem;
        font-weight: 500;
        color: var(--bs-primary);
        margin-bottom: 2px;
    }

    .reply-text {
        font-size: 0.85rem;
        color: var(--bs-secondary);
        font-style: italic;
    }
}

.message-bubble {
    background: var(--bs-gray-100);
    border-radius: 18px;
    padding: 8px 12px;
    position: relative;
    word-wrap: break-word;

    &.own-bubble {
        background: var(--bs-primary);
        color: white;

        .message-timestamp {
            text-align: right;
        }
    }

    &.other-bubble {
        background: var(--bs-gray-100);
        color: var(--bs-dark);
    }

    &.system-message {
        background: var(--bs-info-bg-subtle);
        color: var(--bs-info);
        text-align: center;
        font-style: italic;
        border-radius: 12px;
        padding: 6px 12px;
    }

    &.deleted-message {
        background: var(--bs-gray-50);
        color: var(--bs-secondary);
        font-style: italic;
    }

    &.failed-message {
        background: var(--bs-danger-bg-subtle);
        border: 1px solid var(--bs-danger-border-subtle);
    }

    &.sending-message {
        opacity: 0.7;
    }
}

.message-status {
    position: absolute;
    top: 4px;
    right: 4px;
    font-size: 0.7rem;
}

.message-attachments {
    margin-bottom: 8px;

    .attachment-item {
        margin-bottom: 8px;

        &:last-child {
            margin-bottom: 0;
        }
    }
}

.image-attachment {
    position: relative;
    border-radius: 12px;
    overflow: hidden;
    max-width: 300px;

    .attachment-image {
        width: 100%;
        height: auto;
        display: block;
        cursor: pointer;
        transition: transform 0.2s;

        &:hover {
            transform: scale(1.02);
        }
    }

    .upload-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;

        .progress-circle {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: var(--bs-primary);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 0.8rem;
            font-weight: 500;
        }
    }
}

.video-attachment {
    border-radius: 12px;
    overflow: hidden;
    max-width: 300px;

    .attachment-video {
        width: 100%;
        height: auto;
        display: block;
    }
}

.file-attachment {
    display: flex;
    align-items: center;
    gap: 12px;
    background: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 8px;
    padding: 12px;
    cursor: pointer;
    transition: background-color 0.2s;
    max-width: 300px;

    &:hover {
        background: var(--bs-gray-50);
    }

    .file-icon {
        font-size: 1.5rem;
        flex-shrink: 0;
    }

    .file-info {
        flex: 1;
        min-width: 0;

        .file-name {
            font-weight: 500;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .file-size {
            font-size: 0.8rem;
            color: var(--bs-secondary);
        }
    }

    .file-action {
        color: var(--bs-primary);
        flex-shrink: 0;
    }
}

.message-text {
    margin-bottom: 4px;

    .text-content {
        line-height: 1.4;
    }

    .system-content {
        text-align: center;
        font-size: 0.9rem;
    }
}

.deleted-content {
    display: flex;
    align-items: center;
    font-size: 0.9rem;
}

.edited-indicator {
    font-size: 0.75rem;
    margin-top: 2px;
}

.message-reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;

    .reaction-item {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--bs-body-bg);
        border: 1px solid var(--bs-border-color);
        border-radius: 12px;
        padding: 2px 8px;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 0.8rem;

        &:hover {
            background: var(--bs-gray-100);
            transform: scale(1.05);
        }

        &.own-reaction {
            background: var(--bs-primary-bg-subtle);
            border-color: var(--bs-primary);
        }

        .reaction-emoji {
            font-size: 0.9rem;
        }

        .reaction-count {
            font-weight: 500;
            min-width: 12px;
            text-align: center;
        }
    }

    .add-reaction-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        background: var(--bs-gray-200);
        border: none;
        color: var(--bs-secondary);
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
            background: var(--bs-gray-300);
            transform: scale(1.1);
        }
    }
}

.message-timestamp {
    margin-top: 4px;

    .read-status {
        margin-left: 4px;
    }
}

.quick-actions {
    position: absolute;
    top: -16px;
    right: 16px;
    display: flex;
    gap: 4px;
    background: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 20px;
    padding: 4px;
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s;
    z-index: 10;

    .quick-action-btn {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        background: none;
        border: none;
        color: var(--bs-secondary);
        cursor: pointer;
        transition: all 0.2s;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            background: var(--bs-gray-100);
            color: var(--bs-primary);
            transform: scale(1.1);
        }
    }
}

.emoji-picker-wrapper {
    position: absolute;
    top: -200px;
    right: 0;
    z-index: 100;
}

.context-menu {
    position: fixed;
    background: var(--bs-body-bg);
    border: 1px solid var(--bs-border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;

    .context-menu-list {
        list-style: none;
        margin: 0;
        padding: 8px 0;

        li {
            padding: 8px 16px;
            cursor: pointer;
            transition: background-color 0.2s;

            &:hover {
                background: var(--bs-gray-100);
            }

            &.text-danger:hover {
                background: var(--bs-danger-bg-subtle);
                color: var(--bs-danger);
            }
        }
    }
}

// Dark theme
[data-bs-theme="dark"] {
    .message-bubble.other-bubble {
        background: var(--bs-gray-800);
        color: var(--bs-light);
    }

    .reply-reference {
        background: var(--bs-gray-800);

        &:hover {
            background: var(--bs-gray-700);
        }
    }

    .file-attachment {
        background: var(--bs-gray-800);

        &:hover {
            background: var(--bs-gray-700);
        }
    }

    .quick-action-btn:hover {
        background: var(--bs-gray-700);
    }

    .context-menu-list li:hover {
        background: var(--bs-gray-700);
    }
}

// Mobile responsive
@media (max-width: 768px) {
    .message-content {
        max-width: 85%;
    }

    .quick-actions {
        right: 8px;
    }

    .image-attachment,
    .video-attachment {
        max-width: 250px;
    }

    .file-attachment {
        max-width: 250px;
    }
}
</style>