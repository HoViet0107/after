<!-- Component trả lời tin nhắn với WebSocket real-time và thread support -->

<template>
    <div class="message-reply">
        <!-- Reply Input Container -->
        <div class="reply-container" :class="{ 'expanded': isExpanded, 'thread-mode': isThreadMode }">
            <!-- Replying To Indicator -->
            <div v-if="replyToMessage" class="replying-to">
                <div class="reply-indicator">
                    <div class="reply-line"></div>
                    <div class="reply-content">
                        <div class="reply-header">
                            <img :src="replyToMessage.sender?.avatar || '/default-avatar.png'"
                                :alt="replyToMessage.sender?.name" class="reply-avatar" />
                            <span class="reply-sender">{{ replyToMessage.sender?.name }}</span>
                            <span class="reply-time">{{ formatTime(replyToMessage.createdAt) }}</span>
                            <button type="button" class="btn-close-reply" @click="cancelReply" title="Hủy trả lời">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                        <div class="reply-preview">
                            <!-- Text Content -->
                            <div v-if="replyToMessage.type === 'text'" class="reply-text">
                                {{ truncateText(replyToMessage.content, 100) }}
                            </div>

                            <!-- Media Content -->
                            <div v-else-if="isMediaMessage(replyToMessage)" class="reply-media">
                                <img v-if="replyToMessage.type === 'image'"
                                    :src="replyToMessage.thumbnail || replyToMessage.url" :alt="replyToMessage.fileName"
                                    class="reply-media-thumb" />
                                <div v-else class="reply-media-icon">
                                    <i :class="getMediaIcon(replyToMessage.type)"></i>
                                </div>
                                <div class="reply-media-info">
                                    <div class="media-type">{{ getMediaTypeText(replyToMessage.type) }}</div>
                                    <div v-if="replyToMessage.fileName" class="media-name">
                                        {{ replyToMessage.fileName }}
                                    </div>
                                </div>
                            </div>

                            <!-- File Content -->
                            <div v-else-if="replyToMessage.type === 'file'" class="reply-file">
                                <div class="file-icon">
                                    <i :class="getFileIcon(replyToMessage.fileExtension)"></i>
                                </div>
                                <div class="file-info">
                                    <div class="file-name">{{ replyToMessage.fileName }}</div>
                                    <div class="file-size">{{ formatFileSize(replyToMessage.fileSize) }}</div>
                                </div>
                            </div>

                            <!-- Location Content -->
                            <div v-else-if="replyToMessage.type === 'location'" class="reply-location">
                                <i class="fas fa-map-marker-alt text-danger"></i>
                                <span>{{ replyToMessage.locationName || 'Vị trí được chia sẻ' }}</span>
                            </div>

                            <!-- Contact Content -->
                            <div v-else-if="replyToMessage.type === 'contact'" class="reply-contact">
                                <i class="fas fa-user text-primary"></i>
                                <span>{{ replyToMessage.contactName || 'Liên hệ được chia sẻ' }}</span>
                            </div>

                            <!-- System Message -->
                            <div v-else class="reply-system">
                                <i class="fas fa-info-circle text-muted"></i>
                                <span class="text-muted">{{ getSystemMessageText(replyToMessage) }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Thread Context (if in thread mode) -->
            <div v-if="isThreadMode && threadMessage" class="thread-context">
                <div class="thread-header">
                    <i class="fas fa-comments text-primary"></i>
                    <span>Trả lời trong chủ đề</span>
                    <span class="thread-count">{{ threadMessage.replyCount || 0 }} phản hồi</span>
                    <button type="button" class="btn btn-sm btn-outline-secondary" @click="viewFullThread">
                        Xem toàn bộ
                    </button>
                </div>
                <div class="thread-preview">
                    <img :src="threadMessage.sender?.avatar || '/default-avatar.png'" :alt="threadMessage.sender?.name"
                        class="thread-avatar" />
                    <div class="thread-content">
                        <div class="thread-sender">{{ threadMessage.sender?.name }}</div>
                        <div class="thread-text">{{ truncateText(threadMessage.content, 80) }}</div>
                    </div>
                </div>
            </div>

            <!-- Reply Input -->
            <div class="reply-input-section">
                <div class="input-container">
                    <!-- Mention Suggestions -->
                    <div v-if="showMentionSuggestions" class="mention-suggestions" :style="mentionSuggestionsStyle">
                        <div v-for="(user, index) in mentionSuggestions" :key="user.id" class="mention-suggestion"
                            :class="{ 'active': index === selectedMentionIndex }" @click="selectMention(user)"
                            @mouseenter="selectedMentionIndex = index">
                            <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
                            <div class="mention-info">
                                <div class="mention-name">{{ user.name }}</div>
                                <div class="mention-username">@{{ user.username }}</div>
                            </div>
                        </div>
                    </div>

                    <!-- Text Input -->
                    <div class="input-wrapper">
                        <textarea ref="replyInput" v-model="replyText" class="reply-textarea" :class="{
                            'expanded': isExpanded,
                            'has-attachments': attachments.length > 0
                        }" :placeholder="getPlaceholder()" :disabled="isSending" @input="handleInput"
                            @keydown="handleKeyDown" @focus="handleFocus" @blur="handleBlur" @paste="handlePaste"
                            rows="1"></textarea>

                        <!-- Input Actions -->
                        <div class="input-actions">
                            <!-- Attachment Button -->
                            <div class="attachment-group">
                                <div class="dropdown">
                                    <button type="button" class="input-action-btn" data-bs-toggle="dropdown"
                                        title="Đính kèm file">
                                        <i class="fas fa-paperclip"></i>
                                    </button>
                                    <ul class="dropdown-menu">
                                        <li>
                                            <button class="dropdown-item" @click="selectFile('image')">
                                                <i class="fas fa-image text-success me-2"></i>Ảnh
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item" @click="selectFile('video')">
                                                <i class="fas fa-video text-info me-2"></i>Video
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item" @click="selectFile('audio')">
                                                <i class="fas fa-microphone text-warning me-2"></i>Âm thanh
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item" @click="selectFile('file')">
                                                <i class="fas fa-file text-secondary me-2"></i>File
                                            </button>
                                        </li>
                                        <li>
                                            <hr class="dropdown-divider">
                                        </li>
                                        <li>
                                            <button class="dropdown-item" @click="shareLocation">
                                                <i class="fas fa-map-marker-alt text-danger me-2"></i>Vị trí
                                            </button>
                                        </li>
                                        <li>
                                            <button class="dropdown-item" @click="shareContact">
                                                <i class="fas fa-user text-primary me-2"></i>Liên hệ
                                            </button>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                            <!-- Emoji Button -->
                            <button type="button" class="input-action-btn" @click="toggleEmojiPicker" title="Emoji">
                                <i class="fas fa-smile"></i>
                            </button>

                            <!-- Voice Record Button -->
                            <button v-if="!replyText.trim() && attachments.length === 0" type="button"
                                class="input-action-btn voice-btn" :class="{ 'recording': isRecording }"
                                @mousedown="startVoiceRecord" @mouseup="stopVoiceRecord" @mouseleave="stopVoiceRecord"
                                @touchstart="startVoiceRecord" @touchend="stopVoiceRecord" title="Giữ để ghi âm">
                                <i :class="isRecording ? 'fas fa-stop' : 'fas fa-microphone'"></i>
                            </button>

                            <!-- Send Button -->
                            <button v-else type="button" class="input-action-btn send-btn"
                                :class="{ 'can-send': canSend }" @click="sendReply" :disabled="!canSend || isSending"
                                title="Gửi (Enter)">
                                <span v-if="isSending" class="spinner-border spinner-border-sm"></span>
                                <i v-else class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                    </div>

                    <!-- Attachments Preview -->
                    <div v-if="attachments.length > 0" class="attachments-preview">
                        <div v-for="(attachment, index) in attachments" :key="index" class="attachment-item">
                            <!-- Image Preview -->
                            <div v-if="attachment.type === 'image'" class="attachment-image">
                                <img :src="attachment.preview" :alt="attachment.name" />
                                <button type="button" class="remove-attachment" @click="removeAttachment(index)">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>

                            <!-- Other File Types -->
                            <div v-else class="attachment-file">
                                <div class="file-icon">
                                    <i :class="getFileIcon(attachment.extension)"></i>
                                </div>
                                <div class="file-info">
                                    <div class="file-name">{{ attachment.name }}</div>
                                    <div class="file-size">{{ formatFileSize(attachment.size) }}</div>
                                </div>
                                <button type="button" class="remove-attachment" @click="removeAttachment(index)">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Voice Recording UI -->
                    <div v-if="isRecording" class="voice-recording">
                        <div class="recording-indicator">
                            <div class="recording-dot"></div>
                            <span>Đang ghi âm...</span>
                            <span class="recording-time">{{ formatRecordingTime(recordingTime) }}</span>
                        </div>
                        <div class="recording-actions">
                            <button type="button" class="btn btn-sm btn-outline-danger" @click="cancelVoiceRecord">
                                <i class="fas fa-trash"></i> Hủy
                            </button>
                            <button type="button" class="btn btn-sm btn-primary" @click="stopVoiceRecord">
                                <i class="fas fa-check"></i> Gửi
                            </button>
                        </div>
                    </div>

                    <!-- Typing Indicator -->
                    <div v-if="showTypingIndicator" class="typing-indicator">
                        <span class="typing-text">{{ currentUser?.name }} đang gõ...</span>
                        <div class="typing-dots">
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                            <div class="typing-dot"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Reply Suggestions -->
            <div v-if="quickReplySuggestions.length > 0 && !replyText.trim()" class="quick-replies">
                <div class="quick-replies-header">
                    <span class="text-muted small">Trả lời nhanh:</span>
                </div>
                <div class="quick-replies-list">
                    <button v-for="suggestion in quickReplySuggestions" :key="suggestion.id" type="button"
                        class="quick-reply-btn" @click="useQuickReply(suggestion.text)">
                        {{ suggestion.text }}
                    </button>
                </div>
            </div>
        </div>

        <!-- File Input (Hidden) -->
        <input ref="fileInput" type="file" multiple style="display: none" @change="handleFileSelect" />

        <!-- Emoji Picker -->
        <div v-if="showEmojiPicker" class="emoji-picker-overlay" @click="closeEmojiPicker">
            <div class="emoji-picker" @click.stop>
                <!-- Emoji picker content similar to MessageActions -->
                <div class="emoji-header">
                    <h6>Chọn emoji</h6>
                    <button type="button" class="btn-close" @click="closeEmojiPicker"></button>
                </div>
                <div class="emoji-grid">
                    <button v-for="emoji in commonEmojis" :key="emoji.code" type="button" class="emoji-btn"
                        @click="insertEmoji(emoji)">
                        {{ emoji.emoji }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessageStore } from '@/stores/message'
import { useUserStore } from '@/stores/user'
import { useWebSocket } from '@/composables/useWebSocket'
import { useToast } from 'vue-toastification'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'
import { debounce } from 'lodash-es'

// Props
const props = defineProps({
    conversationId: {
        type: String,
        required: true
    },
    replyToMessage: {
        type: Object,
        default: null
    },
    threadMessage: {
        type: Object,
        default: null
    },
    isThreadMode: {
        type: Boolean,
        default: false
    },
    placeholder: {
        type: String,
        default: ''
    },
    autoFocus: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits([
    'reply-sent',
    'cancel-reply',
    'view-thread',
    'typing-start',
    'typing-stop',
    'expanded-changed'
])

// Dependencies
const authStore = useAuthStore()
const messageStore = useMessageStore()
const userStore = useUserStore()
const { isConnected } = useWebSocket()
const toast = useToast()

// Refs
const replyInput = ref(null)
const fileInput = ref(null)

// State
const replyText = ref('')
const isExpanded = ref(false)
const isSending = ref(false)
const isRecording = ref(false)
const recordingTime = ref(0)
const attachments = ref([])
const showEmojiPicker = ref(false)
const showMentionSuggestions = ref(false)
const mentionSuggestions = ref([])
const selectedMentionIndex = ref(0)
const mentionSuggestionsStyle = ref({})
const currentMentionQuery = ref('')
const mentionStartPos = ref(-1)
const isTyping = ref(false)
const typingTimeout = ref(null)
const recordingInterval = ref(null)
const mediaRecorder = ref(null)
const audioChunks = ref([])

// Quick reply suggestions
const quickReplySuggestions = ref([
    { id: 1, text: 'Cảm ơn!' },
    { id: 2, text: 'OK' },
    { id: 3, text: 'Được rồi' },
    { id: 4, text: 'Tôi hiểu' },
    { id: 5, text: 'Sẽ làm ngay' }
])

// Common emojis
const commonEmojis = ref([
    { emoji: '😀', code: 'grinning' },
    { emoji: '😃', code: 'smiley' },
    { emoji: '😄', code: 'smile' },
    { emoji: '😁', code: 'grin' },
    { emoji: '😅', code: 'sweat_smile' },
    { emoji: '😂', code: 'joy' },
    { emoji: '❤️', code: 'heart' },
    { emoji: '👍', code: 'thumbs_up' },
    { emoji: '👎', code: 'thumbs_down' },
    { emoji: '👌', code: 'ok_hand' },
    { emoji: '🙏', code: 'pray' },
    { emoji: '🎉', code: 'party' }
])

// Computed
const currentUser = computed(() => authStore.user)

const canSend = computed(() => {
    return (replyText.value.trim() || attachments.value.length > 0) &&
        !isSending.value &&
        isConnected.value
})

const showTypingIndicator = computed(() => {
    return isTyping.value && !isSending.value
})

// Methods
const getPlaceholder = () => {
    if (props.placeholder) return props.placeholder

    if (props.isThreadMode) {
        return 'Trả lời trong chủ đề...'
    } else if (props.replyToMessage) {
        return `Trả lời ${props.replyToMessage.sender?.name}...`
    } else {
        return 'Nhập tin nhắn...'
    }
}

const formatTime = (date) => {
    return formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: vi
    })
}

const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

const isMediaMessage = (message) => {
    return ['image', 'video', 'audio'].includes(message.type)
}

const getMediaIcon = (type) => {
    const icons = {
        image: 'fas fa-image',
        video: 'fas fa-video',
        audio: 'fas fa-volume-up'
    }
    return icons[type] || 'fas fa-file'
}

const getMediaTypeText = (type) => {
    const types = {
        image: 'Hình ảnh',
        video: 'Video',
        audio: 'Âm thanh'
    }
    return types[type] || 'Media'
}

const getFileIcon = (extension) => {
    const icons = {
        pdf: 'fas fa-file-pdf text-danger',
        doc: 'fas fa-file-word text-primary',
        docx: 'fas fa-file-word text-primary',
        xls: 'fas fa-file-excel text-success',
        xlsx: 'fas fa-file-excel text-success',
        ppt: 'fas fa-file-powerpoint text-warning',
        pptx: 'fas fa-file-powerpoint text-warning',
        zip: 'fas fa-file-archive text-secondary',
        rar: 'fas fa-file-archive text-secondary',
        mp3: 'fas fa-file-audio text-info',
        mp4: 'fas fa-file-video text-info',
        jpg: 'fas fa-file-image text-success',
        png: 'fas fa-file-image text-success'
    }
    return icons[extension?.toLowerCase()] || 'fas fa-file text-muted'
}

const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const getSystemMessageText = (message) => {
    // Handle system messages
    switch (message.type) {
        case 'member_joined':
            return `${message.user?.name} đã tham gia nhóm`
        case 'member_left':
            return `${message.user?.name} đã rời khỏi nhóm`
        case 'group_renamed':
            return `Tên nhóm đã được đổi thành "${message.newName}"`
        default:
            return 'Tin nhắn hệ thống'
    }
}

const handleInput = () => {
    // Auto-resize textarea
    const textarea = replyInput.value
    if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'

        // Update expanded state
        const shouldExpand = textarea.scrollHeight > 40 || replyText.value.length > 50
        if (shouldExpand !== isExpanded.value) {
            isExpanded.value = shouldExpand
            emit('expanded-changed', isExpanded.value)
        }
    }

    // Check for mentions
    checkForMentions()

    // Handle typing indicator
    if (!isTyping.value) {
        isTyping.value = true
        emit('typing-start')
    }

    // Reset typing timeout
    if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
    }

    typingTimeout.value = setTimeout(() => {
        isTyping.value = false
        emit('typing-stop')
    }, 2000)
}

const handleKeyDown = (event) => {
    // Handle mention navigation
    if (showMentionSuggestions.value) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                selectedMentionIndex.value = Math.min(
                    selectedMentionIndex.value + 1,
                    mentionSuggestions.value.length - 1
                )
                break
            case 'ArrowUp':
                event.preventDefault()
                selectedMentionIndex.value = Math.max(selectedMentionIndex.value - 1, 0)
                break
            case 'Enter':
            case 'Tab':
                event.preventDefault()
                if (mentionSuggestions.value[selectedMentionIndex.value]) {
                    selectMention(mentionSuggestions.value[selectedMentionIndex.value])
                }
                return
            case 'Escape':
                event.preventDefault()
                hideMentionSuggestions()
                return
        }
    }

    // Handle send on Enter (if not holding Shift)
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        if (canSend.value) {
            sendReply()
        }
    }

    // Handle escape to cancel reply
    if (event.key === 'Escape' && props.replyToMessage) {
        cancelReply()
    }
}

const handleFocus = () => {
    isExpanded.value = true
    emit('expanded-changed', true)
}

const handleBlur = () => {
    // Don't collapse if there's content
    if (!replyText.value.trim() && attachments.value.length === 0) {
        isExpanded.value = false
        emit('expanded-changed', false)
    }

    // Hide mention suggestions after a delay
    setTimeout(() => {
        hideMentionSuggestions()
    }, 150)
}

const handlePaste = (event) => {
    const items = event.clipboardData?.items
    if (!items) return

    for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
            event.preventDefault()
            const file = item.getAsFile()
            if (file) {
                addAttachment(file)
            }
        }
    }
}

const checkForMentions = debounce(() => {
    const textarea = replyInput.value
    if (!textarea) return

    const text = replyText.value
    const cursorPos = textarea.selectionStart

    // Find @ symbol before cursor
    let mentionStart = -1
    for (let i = cursorPos - 1; i >= 0; i--) {
        if (text[i] === '@') {
            mentionStart = i
            break
        }
        if (text[i] === ' ' || text[i] === '\n') break
    }

    if (mentionStart !== -1) {
        const query = text.substring(mentionStart + 1, cursorPos)
        if (query.length <= 50) {
            currentMentionQuery.value = query
            mentionStartPos.value = mentionStart
            await searchMentions(query)
            showMentionSuggestions.value = true
            positionMentionSuggestions()
        }
    } else {
        hideMentionSuggestions()
    }
}, 100)

const searchMentions = async (query) => {
    try {
        const response = await userStore.searchUsers({
            query,
            limit: 10,
            conversationId: props.conversationId
        })
        mentionSuggestions.value = response.users || []
        selectedMentionIndex.value = 0
    } catch (error) {
        console.error('Search mentions error:', error)
        mentionSuggestions.value = []
    }
}

const positionMentionSuggestions = () => {
    const textarea = replyInput.value
    if (!textarea) return

    // Calculate position based on cursor
    const rect = textarea.getBoundingClientRect()
    mentionSuggestionsStyle.value = {
        position: 'absolute',
        top: `${rect.top - 200}px`,
        left: `${rect.left}px`,
        zIndex: 1000
    }
}

const selectMention = (user) => {
    const textarea = replyInput.value
    if (!textarea) return

    const text = replyText.value
    const beforeMention = text.substring(0, mentionStartPos.value)
    const afterMention = text.substring(textarea.selectionStart)

    const mentionText = `@${user.username} `
    replyText.value = beforeMention + mentionText + afterMention

    // Position cursor after mention
    nextTick(() => {
        const newCursorPos = beforeMention.length + mentionText.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
    })

    hideMentionSuggestions()
}

const hideMentionSuggestions = () => {
    showMentionSuggestions.value = false
    mentionSuggestions.value = []
    currentMentionQuery.value = ''
    mentionStartPos.value = -1
    selectedMentionIndex.value = 0
}

const selectFile = (type) => {
    const input = fileInput.value
    if (!input) return

    // Set accept attribute based on type
    switch (type) {
        case 'image':
            input.accept = 'image/*'
            break
        case 'video':
            input.accept = 'video/*'
            break
        case 'audio':
            input.accept = 'audio/*'
            break
        default:
            input.accept = '*/*'
    }

    input.click()
}

const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    files.forEach(file => addAttachment(file))

    // Reset input
    event.target.value = ''
}

const addAttachment = (file) => {
    // Check file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
        toast.error('File không được vượt quá 50MB')
        return
    }

    // Check attachment limit
    if (attachments.value.length >= 10) {
        toast.error('Chỉ có thể đính kèm tối đa 10 file')
        return
    }

    const attachment = {
        file,
        name: file.name,
        size: file.size,
        type: getFileType(file),
        extension: getFileExtension(file.name)
    }

    // Create preview for images
    if (attachment.type === 'image') {
        const reader = new FileReader()
        reader.onload = (e) => {
            attachment.preview = e.target.result
        }
        reader.readAsDataURL(file)
    }

    attachments.value.push(attachment)
}

const removeAttachment = (index) => {
    attachments.value.splice(index, 1)
}

const getFileType = (file) => {
    if (file.type.startsWith('image/')) return 'image'
    if (file.type.startsWith('video/')) return 'video'
    if (file.type.startsWith('audio/')) return 'audio'
    return 'file'
}

const getFileExtension = (filename) => {
    return filename.split('.').pop()?.toLowerCase() || ''
}

const shareLocation = () => {
    // Implement location sharing
    toast.info('Tính năng chia sẻ vị trí đang phát triển')
}

const shareContact = () => {
    // Implement contact sharing
    toast.info('Tính năng chia sẻ liên hệ đang phát triển')
}

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value
}

const closeEmojiPicker = () => {
    showEmojiPicker.value = false
}

const insertEmoji = (emoji) => {
    const textarea = replyInput.value
    if (!textarea) return

    const cursorPos = textarea.selectionStart
    const textBefore = replyText.value.substring(0, cursorPos)
    const textAfter = replyText.value.substring(cursorPos)

    replyText.value = textBefore + emoji.emoji + textAfter

    // Position cursor after emoji
    nextTick(() => {
        const newCursorPos = cursorPos + emoji.emoji.length
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
    })

    closeEmojiPicker()
}

const startVoiceRecord = async () => {
    if (isRecording.value) return

    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        mediaRecorder.value = new MediaRecorder(stream)
        audioChunks.value = []
        recordingTime.value = 0

        mediaRecorder.value.ondataavailable = (event) => {
            audioChunks.value.push(event.data)
        }

        mediaRecorder.value.onstop = () => {
            const audioBlob = new Blob(audioChunks.value, { type: 'audio/wav' })
            const audioFile = new File([audioBlob], `voice_${Date.now()}.wav`, { type: 'audio/wav' })
            addAttachment(audioFile)

            // Stop all tracks
            stream.getTracks().forEach(track => track.stop())
        }

        mediaRecorder.value.start()
        isRecording.value = true

        // Start recording timer
        recordingInterval.value = setInterval(() => {
            recordingTime.value++
        }, 1000)

    } catch (error) {
        console.error('Voice recording error:', error)
        toast.error('Không thể ghi âm. Vui lòng kiểm tra quyền microphone.')
    }
}

const stopVoiceRecord = () => {
    if (!isRecording.value) return

    mediaRecorder.value?.stop()
    isRecording.value = false

    if (recordingInterval.value) {
        clearInterval(recordingInterval.value)
        recordingInterval.value = null
    }
}

const cancelVoiceRecord = () => {
    if (!isRecording.value) return

    mediaRecorder.value?.stop()
    isRecording.value = false
    audioChunks.value = []

    if (recordingInterval.value) {
        clearInterval(recordingInterval.value)
        recordingInterval.value = null
    }
}

const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

const useQuickReply = (text) => {
    replyText.value = text
    nextTick(() => {
        replyInput.value?.focus()
    })
}

const sendReply = async () => {
    if (!canSend.value || isSending.value) return

    isSending.value = true

    try {
        const messageData = {
            content: replyText.value.trim(),
            conversationId: props.conversationId,
            replyToId: props.replyToMessage?.id,
            threadId: props.threadMessage?.id,
            attachments: attachments.value.map(att => att.file)
        }

        await messageStore.sendMessage(messageData)

        // Clear form
        replyText.value = ''
        attachments.value = []
        isExpanded.value = false

        // Stop typing indicator
        if (isTyping.value) {
            isTyping.value = false
            emit('typing-stop')
        }

        emit('reply-sent')

        toast.success('Tin nhắn đã được gửi!')

    } catch (error) {
        console.error('Send reply error:', error)
        toast.error('Gửi tin nhắn thất bại')
    } finally {
        isSending.value = false
    }
}

const cancelReply = () => {
    emit('cancel-reply')
}

const viewFullThread = () => {
    emit('view-thread', props.threadMessage)
}

// Lifecycle
onMounted(() => {
    if (props.autoFocus) {
        nextTick(() => {
            replyInput.value?.focus()
        })
    }
})

onUnmounted(() => {
    if (typingTimeout.value) {
        clearTimeout(typingTimeout.value)
    }

    if (recordingInterval.value) {
        clearInterval(recordingInterval.value)
    }

    if (isRecording.value) {
        cancelVoiceRecord()
    }
})
</script>

<style scoped>
.message-reply {
    position: relative;
}

.reply-container {
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    transition: all 0.2s ease;
}

.reply-container.expanded {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.reply-container.thread-mode {
    border-left: 3px solid var(--bs-primary);
}

.replying-to {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--bs-border-color);
    background-color: var(--bs-light);
}

.reply-indicator {
    display: flex;
    align-items: flex-start;
    gap: 0.75rem;
}

.reply-line {
    width: 3px;
    height: 100%;
    background: var(--bs-primary);
    border-radius: 1.5px;
    flex-shrink: 0;
    margin-top: 0.25rem;
}

.reply-content {
    flex: 1;
    min-width: 0;
}

.reply-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
}

.reply-avatar {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
}

.reply-sender {
    font-weight: 500;
    font-size: 0.875rem;
}

.reply-time {
    font-size: 0.75rem;
    color: var(--bs-secondary);
}

.btn-close-reply {
    background: none;
    border: none;
    color: var(--bs-secondary);
    margin-left: auto;
    padding: 0.25rem;
    border-radius: 50%;
    transition: all 0.2s ease;
}

.btn-close-reply:hover {
    background-color: var(--bs-danger);
    color: white;
}

.reply-preview {
    color: var(--bs-secondary);
    font-size: 0.875rem;
}

.reply-text {
    font-style: italic;
}

.reply-media,
.reply-file,
.reply-location,
.reply-contact,
.reply-system {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.reply-media-thumb {
    width: 32px;
    height: 32px;
    border-radius: 0.25rem;
    object-fit: cover;
}

.reply-media-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--bs-light);
    border-radius: 0.25rem;
    font-size: 1rem;
}

.file-icon {
    font-size: 1.25rem;
}

.thread-context {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--bs-border-color);
    background: linear-gradient(135deg, rgba(var(--bs-primary-rgb), 0.05), rgba(var(--bs-primary-rgb), 0.1));
}

.thread-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.75rem;
    font-size: 0.875rem;
}

.thread-count {
    color: var(--bs-secondary);
    margin-left: auto;
}

.thread-preview {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.thread-avatar {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    object-fit: cover;
}

.thread-sender {
    font-weight: 500;
    font-size: 0.875rem;
}

.thread-text {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.reply-input-section {
    position: relative;
    padding: 1rem;
}

.input-container {
    position: relative;
}

.mention-suggestions {
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    max-height: 200px;
    overflow-y: auto;
    z-index: 1000;
}

.mention-suggestion {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    cursor: pointer;
    border-bottom: 1px solid var(--bs-border-color-translucent);
    transition: background-color 0.2s ease;
}

.mention-suggestion:last-child {
    border-bottom: none;
}

.mention-suggestion:hover,
.mention-suggestion.active {
    background-color: var(--bs-light);
}

.mention-suggestion img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.mention-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.mention-username {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    background: var(--bs-light);
    border-radius: 0.5rem;
    padding: 0.5rem;
    border: 1px solid var(--bs-border-color);
    transition: border-color 0.2s ease;
}

.input-wrapper:focus-within {
    border-color: var(--bs-primary);
    box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
}

.reply-textarea {
    flex: 1;
    border: none;
    background: transparent;
    resize: none;
    outline: none;
    font-size: 0.95rem;
    line-height: 1.4;
    min-height: 24px;
    max-height: 120px;
    padding: 0.25rem 0;
}

.reply-textarea.expanded {
    min-height: 40px;
}

.reply-textarea.has-attachments {
    margin-top: 0.5rem;
}

.input-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-shrink: 0;
}

.input-action-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bs-secondary);
    transition: all 0.2s ease;
}

.input-action-btn:hover {
    background-color: white;
    color: var(--bs-primary);
}

.send-btn.can-send {
    background-color: var(--bs-primary);
    color: white;
}

.send-btn.can-send:hover {
    background-color: var(--bs-primary-dark);
}

.voice-btn.recording {
    background-color: var(--bs-danger);
    color: white;
    animation: pulse 1s infinite;
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }

    50% {
        transform: scale(1.1);
    }

    100% {
        transform: scale(1);
    }
}

.attachments-preview {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 0.5rem;
    flex-wrap: wrap;
}

.attachment-item {
    position: relative;
}

.attachment-image {
    position: relative;
    width: 80px;
    height: 80px;
    border-radius: 0.375rem;
    overflow: hidden;
}

.attachment-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}

.attachment-file {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    min-width: 200px;
}

.remove-attachment {
    position: absolute;
    top: -5px;
    right: -5px;
    width: 20px;
    height: 20px;
    border: none;
    background: var(--bs-danger);
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    cursor: pointer;
}

.voice-recording {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem;
    background: var(--bs-danger);
    color: white;
    border-radius: 0.5rem;
    margin-bottom: 0.5rem;
}

.recording-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.recording-dot {
    width: 8px;
    height: 8px;
    background: white;
    border-radius: 50%;
    animation: blink 1s infinite;
}

@keyframes blink {

    0%,
    50% {
        opacity: 1;
    }

    51%,
    100% {
        opacity: 0.3;
    }
}

.typing-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
    color: var(--bs-secondary);
    font-size: 0.875rem;
}

.typing-dots {
    display: flex;
    gap: 0.2rem;
}

.typing-dot {
    width: 4px;
    height: 4px;
    background: var(--bs-secondary);
    border-radius: 50%;
    animation: typing-bounce 1.4s infinite ease-in-out;
}

.typing-dot:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dot:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing-bounce {

    0%,
    80%,
    100% {
        transform: scale(0.8);
        opacity: 0.5;
    }

    40% {
        transform: scale(1);
        opacity: 1;
    }
}

.quick-replies {
    padding: 0.75rem 1rem;
    border-top: 1px solid var(--bs-border-color);
    background-color: var(--bs-light);
}

.quick-replies-header {
    margin-bottom: 0.5rem;
}

.quick-replies-list {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

.quick-reply-btn {
    padding: 0.375rem 0.75rem;
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.quick-reply-btn:hover {
    background-color: var(--bs-primary);
    color: white;
    border-color: var(--bs-primary);
}

.emoji-picker-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1050;
    display: flex;
    align-items: center;
    justify-content: center;
}

.emoji-picker {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    width: 300px;
    max-height: 400px;
}

.emoji-header {
    padding: 1rem;
    border-bottom: 1px solid var(--bs-border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.emoji-grid {
    padding: 1rem;
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.5rem;
    max-height: 300px;
    overflow-y: auto;
}

.emoji-btn {
    width: 36px;
    height: 36px;
    border: none;
    background: none;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.emoji-btn:hover {
    background-color: var(--bs-light);
}

@media (max-width: 768px) {
    .reply-container {
        border-radius: 0;
        border-left: none;
        border-right: none;
    }

    .input-wrapper {
        border-radius: 0.375rem;
    }

    .attachments-preview {
        gap: 0.25rem;
    }

    .attachment-image {
        width: 60px;
        height: 60px;
    }

    .attachment-file {
        min-width: 150px;
        padding: 0.375rem;
    }

    .quick-replies-list {
        gap: 0.25rem;
    }

    .quick-reply-btn {
        padding: 0.25rem 0.5rem;
        font-size: 0.8rem;
    }

    .emoji-picker {
        width: 280px;
        margin: 1rem;
    }

    .emoji-grid {
        grid-template-columns: repeat(5, 1fr);
    }
}
</style>