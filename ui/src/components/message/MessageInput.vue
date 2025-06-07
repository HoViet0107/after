<template>
    <div class="message-input-container">
        <!-- Reply Preview -->
        <div v-if="replyingTo" class="reply-preview">
            <div class="reply-content">
                <div class="reply-user">
                    <i class="fas fa-reply me-1"></i>
                    Trả lời {{ replyingTo.senderName }}
                </div>
                <div class="reply-message">{{ truncateText(replyingTo.content, 100) }}</div>
            </div>
            <button type="button" class="btn-close reply-close" @click="clearReply" aria-label="Hủy trả lời"></button>
        </div>

        <!-- Edit Preview -->
        <div v-if="editingMessage" class="edit-preview">
            <div class="edit-content">
                <div class="edit-label">
                    <i class="fas fa-edit me-1"></i>
                    Chỉnh sửa tin nhắn
                </div>
            </div>
            <button type="button" class="btn-close edit-close" @click="clearEdit" aria-label="Hủy chỉnh sửa"></button>
        </div>

        <!-- File Preview -->
        <div v-if="attachments.length > 0" class="attachments-preview">
            <div class="attachments-list">
                <div v-for="(file, index) in attachments" :key="index" class="attachment-item">
                    <div class="attachment-preview">
                        <img v-if="isImage(file)" :src="getFilePreview(file)" alt="Preview" class="attachment-image" />
                        <div v-else class="attachment-file">
                            <i :class="getFileIcon(file)" class="file-icon"></i>
                            <span class="file-name">{{ file.name }}</span>
                        </div>
                    </div>
                    <button type="button" class="btn btn-sm btn-outline-danger attachment-remove"
                        @click="removeAttachment(index)">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Main Input Area -->
        <div class="input-wrapper">
            <div class="input-controls">
                <!-- Attachment Button -->
                <button type="button" class="btn btn-outline-secondary btn-sm me-2" @click="triggerFileInput"
                    :disabled="disabled || isUploading" title="Đính kèm file">
                    <i class="fas fa-paperclip"></i>
                </button>

                <!-- Emoji Button -->
                <button type="button" class="btn btn-outline-secondary btn-sm me-2" @click="toggleEmojiPicker"
                    :disabled="disabled" title="Chọn emoji">
                    <i class="fas fa-smile"></i>
                </button>
            </div>

            <!-- Text Input -->
            <div class="input-field-wrapper">
                <textarea ref="textInput" v-model="messageText" class="form-control message-input"
                    :placeholder="placeholder" :disabled="disabled" rows="1" @keydown="handleKeyDown"
                    @input="handleInput" @paste="handlePaste" @focus="handleFocus" @blur="handleBlur"></textarea>

                <!-- Send Button -->
                <button type="button" class="btn btn-primary send-button" @click="sendMessage"
                    :disabled="!canSend || disabled || isSending" title="Gửi tin nhắn (Ctrl + Enter)">
                    <span v-if="isSending" class="spinner-border spinner-border-sm"></span>
                    <i v-else-if="editingMessage" class="fas fa-check"></i>
                    <i v-else class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>

        <!-- Emoji Picker -->
        <div v-if="showEmojiPicker" class="emoji-picker-wrapper">
            <EmojiPicker @emoji-select="insertEmoji" @close="closeEmojiPicker" />
        </div>

        <!-- File Input -->
        <input ref="fileInput" type="file" class="d-none" multiple :accept="acceptedFileTypes"
            @change="handleFileSelect" />

        <!-- Upload Progress -->
        <div v-if="isUploading" class="upload-progress">
            <div class="progress">
                <div class="progress-bar" role="progressbar" :style="{ width: uploadProgress + '%' }"
                    :aria-valuenow="uploadProgress" aria-valuemin="0" aria-valuemax="100">
                    {{ uploadProgress }}%
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useMessageStore } from '@/stores/message'
import { useWebSocket } from '@/composables/useWebSocket'
import { useFileUpload } from '@/composables/useFileUpload'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'
import EmojiPicker from '@/components/common/EmojiPicker.vue'

// Props
const props = defineProps({
    conversationId: {
        type: String,
        required: true
    },
    placeholder: {
        type: String,
        default: 'Nhập tin nhắn...'
    },
    disabled: {
        type: Boolean,
        default: false
    },
    maxLength: {
        type: Number,
        default: 4000
    },
    acceptedFileTypes: {
        type: String,
        default: 'image/*,video/*,.pdf,.doc,.docx,.txt'
    }
})

// Emits
const emit = defineEmits([
    'send-message',
    'typing-start',
    'typing-stop',
    'focus',
    'blur'
])

// Dependencies
const messageStore = useMessageStore()
const { emitTyping } = useWebSocket()
const { uploadFile } = useFileUpload()
const toast = useToast()

// Refs
const textInput = ref(null)
const fileInput = ref(null)

// State
const messageText = ref('')
const attachments = ref([])
const showEmojiPicker = ref(false)
const isTyping = ref(false)
const isSending = ref(false)
const isUploading = ref(false)
const uploadProgress = ref(0)

// Computed
const replyingTo = computed(() => messageStore.replyingToMessage)
const editingMessage = computed(() => messageStore.editingMessage)

const canSend = computed(() => {
    return (messageText.value.trim().length > 0 || attachments.value.length > 0) &&
        messageText.value.length <= props.maxLength
})

const characterCount = computed(() => messageText.value.length)
const isNearLimit = computed(() => characterCount.value > props.maxLength * 0.8)
const isOverLimit = computed(() => characterCount.value > props.maxLength)

// Watch for editing message
watch(editingMessage, (newMessage) => {
    if (newMessage) {
        messageText.value = newMessage.content
        nextTick(() => {
            textInput.value?.focus()
            textInput.value?.setSelectionRange(messageText.value.length, messageText.value.length)
        })
    }
})

// Typing indicator
const handleTypingStart = debounce(() => {
    if (!isTyping.value && messageText.value.trim()) {
        isTyping.value = true
        emitTyping(props.conversationId, true)
        emit('typing-start')
    }
}, 100)

const handleTypingStop = debounce(() => {
    if (isTyping.value) {
        isTyping.value = false
        emitTyping(props.conversationId, false)
        emit('typing-stop')
    }
}, 1000)

// Event handlers
const handleKeyDown = (event) => {
    if (event.key === 'Enter') {
        if (event.ctrlKey || event.metaKey) {
            event.preventDefault()
            sendMessage()
        } else if (!event.shiftKey) {
            event.preventDefault()
            sendMessage()
        }
    }

    if (event.key === 'Escape') {
        if (editingMessage.value) {
            clearEdit()
        } else if (replyingTo.value) {
            clearReply()
        }
    }
}

const handleInput = () => {
    // Auto-resize textarea
    nextTick(() => {
        if (textInput.value) {
            textInput.value.style.height = 'auto'
            textInput.value.style.height = Math.min(textInput.value.scrollHeight, 120) + 'px'
        }
    })

    // Handle typing indicators
    if (messageText.value.trim()) {
        handleTypingStart()
    }
    handleTypingStop()
}

const handlePaste = async (event) => {
    const items = event.clipboardData?.items
    if (!items) return

    for (const item of items) {
        if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) {
                await uploadAndAttachFile(file)
            }
        }
    }
}

const handleFocus = () => {
    emit('focus')
}

const handleBlur = () => {
    emit('blur')
    // Stop typing when input loses focus
    if (isTyping.value) {
        handleTypingStop.flush()
    }
}

const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length === 0) return

    for (const file of files) {
        await uploadAndAttachFile(file)
    }

    // Clear file input
    event.target.value = ''
}

// Message actions
const sendMessage = async () => {
    if (!canSend.value || isSending.value) return

    const content = messageText.value.trim()
    if (!content && attachments.value.length === 0) return

    isSending.value = true

    try {
        const messageData = {
            content,
            type: 'text',
            attachments: attachments.value,
            replyTo: replyingTo.value
        }

        if (editingMessage.value) {
            // Edit existing message
            await messageStore.editMessage(editingMessage.value.id, content)
            clearEdit()
        } else {
            // Send new message
            const result = await messageStore.sendMessage(props.conversationId, messageData)

            if (result.success) {
                emit('send-message', result.data)
            }
        }

        // Reset input
        resetInput()

    } catch (error) {
        console.error('Failed to send message:', error)
        toast.error('Không thể gửi tin nhắn')
    } finally {
        isSending.value = false
    }
}

const resetInput = () => {
    messageText.value = ''
    attachments.value = []
    clearReply()

    // Reset textarea height
    nextTick(() => {
        if (textInput.value) {
            textInput.value.style.height = 'auto'
        }
    })

    // Stop typing indicator
    if (isTyping.value) {
        handleTypingStop.flush()
    }
}

// Reply/Edit actions
const clearReply = () => {
    messageStore.clearReplyingToMessage()
}

const clearEdit = () => {
    messageStore.clearEditingMessage()
    messageText.value = ''
}

// File handling
const triggerFileInput = () => {
    fileInput.value?.click()
}

const uploadAndAttachFile = async (file) => {
    if (!file) return

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
        toast.error('File quá lớn. Giới hạn 10MB.')
        return
    }

    isUploading.value = true
    uploadProgress.value = 0

    try {
        const result = await uploadFile(file, (progress) => {
            uploadProgress.value = progress
        })

        if (result.success) {
            attachments.value.push({
                id: result.data.id,
                name: file.name,
                type: file.type,
                size: file.size,
                url: result.data.url,
                thumbnailUrl: result.data.thumbnailUrl
            })

            toast.success('Đã đính kèm file thành công!')
        }
    } catch (error) {
        console.error('File upload failed:', error)
        toast.error('Không thể tải file lên')
    } finally {
        isUploading.value = false
        uploadProgress.value = 0
    }
}

const removeAttachment = (index) => {
    attachments.value.splice(index, 1)
}

// Emoji handling
const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value
}

const closeEmojiPicker = () => {
    showEmojiPicker.value = false
}

const insertEmoji = (emoji) => {
    const cursorPosition = textInput.value?.selectionStart || messageText.value.length
    const beforeCursor = messageText.value.substring(0, cursorPosition)
    const afterCursor = messageText.value.substring(cursorPosition)

    messageText.value = beforeCursor + emoji + afterCursor

    nextTick(() => {
        const newPosition = cursorPosition + emoji.length
        textInput.value?.setSelectionRange(newPosition, newPosition)
        textInput.value?.focus()
    })

    closeEmojiPicker()
}

// Utility functions
const isImage = (file) => {
    return file.type?.startsWith('image/') || file.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
}

const getFilePreview = (file) => {
    if (file.url) return file.thumbnailUrl || file.url
    if (file instanceof File) return URL.createObjectURL(file)
    return ''
}

const getFileIcon = (file) => {
    const type = file.type || ''
    if (type.startsWith('video/')) return 'fas fa-video'
    if (type.startsWith('audio/')) return 'fas fa-music'
    if (type.includes('pdf')) return 'fas fa-file-pdf'
    if (type.includes('word') || type.includes('document')) return 'fas fa-file-word'
    if (type.includes('excel') || type.includes('spreadsheet')) return 'fas fa-file-excel'
    return 'fas fa-file'
}

const truncateText = (text, maxLength) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

// Lifecycle
onMounted(() => {
    // Focus input when component mounts
    nextTick(() => {
        textInput.value?.focus()
    })
})

onUnmounted(() => {
    // Clean up typing indicator
    if (isTyping.value) {
        handleTypingStop.flush()
    }
})

// Expose methods for parent components
defineExpose({
    focus: () => textInput.value?.focus(),
    clear: resetInput,
    setText: (text) => { messageText.value = text }
})
</script>

<style lang="scss" scoped>
.message-input-container {
    border-top: 1px solid var(--bs-border-color);
    background: var(--bs-body-bg);
}

.reply-preview,
.edit-preview {
    display: flex;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--bs-border-color);
    background: var(--bs-gray-50);

    .reply-content,
    .edit-content {
        flex: 1;
        min-width: 0;
    }

    .reply-user,
    .edit-label {
        font-size: 0.875rem;
        font-weight: 500;
        color: var(--bs-primary);
        margin-bottom: 4px;
    }

    .reply-message {
        font-size: 0.875rem;
        color: var(--bs-secondary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .reply-close,
    .edit-close {
        margin-left: 12px;
    }
}

.attachments-preview {
    padding: 12px 16px;
    border-bottom: 1px solid var(--bs-border-color);
    background: var(--bs-gray-50);

    .attachments-list {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
    }

    .attachment-item {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: white;
        border: 1px solid var(--bs-border-color);
        border-radius: 8px;
    }

    .attachment-preview {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .attachment-image {
        width: 40px;
        height: 40px;
        object-fit: cover;
        border-radius: 4px;
    }

    .attachment-file {
        display: flex;
        align-items: center;
        gap: 8px;

        .file-icon {
            font-size: 1.25rem;
            color: var(--bs-secondary);
        }

        .file-name {
            font-size: 0.875rem;
            max-width: 150px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }
    }

    .attachment-remove {
        padding: 4px 8px;
    }
}

.input-wrapper {
    display: flex;
    align-items: flex-end;
    padding: 12px 16px;
    gap: 12px;
}

.input-controls {
    display: flex;
    align-items: center;
}

.input-field-wrapper {
    flex: 1;
    display: flex;
    align-items: flex-end;
    gap: 8px;
}

.message-input {
    border: 1px solid var(--bs-border-color);
    border-radius: 20px;
    padding: 8px 16px;
    resize: none;
    min-height: 38px;
    max-height: 120px;
    font-size: 0.875rem;

    &:focus {
        border-color: var(--bs-primary);
        box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
    }
}

.send-button {
    border-radius: 50%;
    width: 38px;
    height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    &:disabled {
        opacity: 0.5;
    }
}

.emoji-picker-wrapper {
    position: absolute;
    bottom: 100%;
    right: 16px;
    z-index: 1000;
    margin-bottom: 8px;
}

.upload-progress {
    padding: 8px 16px;
    background: var(--bs-gray-50);
    border-bottom: 1px solid var(--bs-border-color);
}

// Character count indicator
.character-count {
    position: absolute;
    bottom: -20px;
    right: 16px;
    font-size: 0.75rem;
    color: var(--bs-secondary);

    &.near-limit {
        color: var(--bs-warning);
    }

    &.over-limit {
        color: var(--bs-danger);
    }
}

// Dark theme
[data-bs-theme="dark"] {

    .reply-preview,
    .edit-preview,
    .attachments-preview {
        background: var(--bs-gray-800);
    }

    .attachment-item {
        background: var(--bs-gray-900);
    }

    .upload-progress {
        background: var(--bs-gray-800);
    }
}

// Mobile responsive
@media (max-width: 576px) {
    .input-wrapper {
        padding: 8px 12px;
        gap: 8px;
    }

    .input-controls {
        flex-direction: column;
        gap: 4px;
    }

    .emoji-picker-wrapper {
        right: 12px;
    }
}
</style>