<template>
    <div class="message-input">
        <div class="input-container">
            <div class="input-wrapper">
                <button class="btn btn-outline-secondary attachment-btn" @click="openFileDialog" :disabled="isUploading"
                    title="Đính kèm file">
                    <i class="fas fa-paperclip"></i>
                </button>

                <div class="text-input-container">
                    <textarea ref="textareaRef" v-model="message" class="form-control message-textarea"
                        :placeholder="placeholder" rows="1" @input="handleInput" @keydown="handleKeydown"
                        @paste="handlePaste" @focus="handleFocus" @blur="handleBlur"></textarea>

                    <div class="input-actions">
                        <button class="btn btn-sm btn-outline-secondary" @click="toggleEmojiPicker" title="Thêm emoji">
                            <i class="fas fa-smile"></i>
                        </button>

                        <button v-if="supportsVoiceRecording"
                            :class="['btn btn-sm', isRecording ? 'btn-danger' : 'btn-outline-secondary']"
                            @click="toggleVoiceRecording" :title="isRecording ? 'Dừng ghi âm' : 'Ghi âm'">
                            <i :class="isRecording ? 'fas fa-stop' : 'fas fa-microphone'"></i>
                        </button>
                    </div>
                </div>

                <button :class="['btn', 'send-btn', canSend ? 'btn-primary' : 'btn-outline-secondary']"
                    @click="handleSend" :disabled="!canSend || isSending" title="Gửi tin nhắn">
                    <span v-if="isSending" class="spinner-border spinner-border-sm"></span>
                    <i v-else class="fas fa-paper-plane"></i>
                </button>
            </div>

            <!-- Reply preview -->
            <div v-if="replyToMessage" class="reply-preview">
                <div class="reply-content">
                    <div class="reply-header">
                        <span>Trả lời {{ replyToMessage.sender.name }}</span>
                        <button class="btn btn-sm btn-outline-secondary" @click="cancelReply">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="reply-text">{{ truncateText(replyToMessage.content, 100) }}</div>
                </div>
            </div>

            <!-- Attachments preview -->
            <div v-if="attachments.length > 0" class="attachments-preview">
                <div v-for="(attachment, index) in attachments" :key="index" class="attachment-item">
                    <img v-if="attachment.type === 'image'" :src="attachment.preview" :alt="attachment.name"
                        class="attachment-preview">
                    <div v-else class="attachment-file">
                        <i class="fas fa-file"></i>
                        <span>{{ attachment.name }}</span>
                    </div>

                    <button class="btn btn-danger btn-sm attachment-remove" @click="removeAttachment(index)">
                        <i class="fas fa-times"></i>
                    </button>

                    <div v-if="attachment.progress < 100" class="upload-progress">
                        <div class="progress">
                            <div class="progress-bar" :style="{ width: attachment.progress + '%' }"></div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Voice recording indicator -->
            <div v-if="isRecording" class="recording-indicator">
                <div class="recording-animation">
                    <div class="pulse"></div>
                </div>
                <span>{{ recordingDuration }}</span>
                <button class="btn btn-sm btn-outline-secondary" @click="cancelRecording">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </div>

        <input ref="fileInput" type="file" multiple accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            style="display: none" @change="handleFileSelect">

        <EmojiPicker :show="showEmojiPicker" @select="addEmoji" @close="showEmojiPicker = false" />
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useFileUpload } from '@/composables/useFileUpload'
import { useToast } from 'vue-toastification'
import EmojiPicker from '@/components/common/EmojiPicker.vue'

const props = defineProps({
    placeholder: {
        type: String,
        default: 'Nhập tin nhắn...'
    },
    replyToMessage: {
        type: Object,
        default: null
    },
    conversationId: {
        type: String,
        required: true
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['send', 'typing', 'stop-typing', 'cancel-reply'])

const toast = useToast()

// File upload
const { addFiles, uploadFiles, uploadProgress, isUploading } = useFileUpload({
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'video/mp4', 'video/webm',
        'audio/mp3', 'audio/wav', 'audio/ogg',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    multiple: true,
    autoUpload: false
})

// Refs
const textareaRef = ref(null)
const fileInput = ref(null)

// State
const message = ref('')
const attachments = ref([])
const isSending = ref(false)
const showEmojiPicker = ref(false)
const isRecording = ref(false)
const recordingDuration = ref('00:00')
const mediaRecorder = ref(null)
const recordingStream = ref(null)
const typingTimer = ref(null)
const isTyping = ref(false)

// Computed
const canSend = computed(() => {
    return (message.value.trim() || attachments.value.length > 0) && !props.disabled
})

const supportsVoiceRecording = computed(() => {
    return navigator.mediaDevices && navigator.mediaDevices.getUserMedia
})

// Actions
const handleInput = () => {
    autoResize()
    handleTyping()
}

const handleKeydown = (event) => {
    // Send message with Ctrl/Cmd + Enter
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault()
        if (canSend.value) {
            handleSend()
        }
        return
    }

    // New line with Shift + Enter
    if (event.shiftKey && event.key === 'Enter') {
        return
    }

    // Send with Enter (without modifiers)
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault()
        if (canSend.value) {
            handleSend()
        }
    }
}

const handlePaste = async (event) => {
    const items = event.clipboardData.items
    const files = []

    for (let item of items) {
        if (item.type.indexOf('image') !== -1) {
            const file = item.getAsFile()
            if (file) {
                files.push(file)
            }
        }
    }

    if (files.length > 0) {
        event.preventDefault()
        await handleFiles(files)
    }
}

const handleFocus = () => {
    // Focus logic
}

const handleBlur = () => {
    stopTyping()
}

const autoResize = () => {
    nextTick(() => {
        const textarea = textareaRef.value
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
        }
    })
}

const handleTyping = () => {
    if (!isTyping.value) {
        isTyping.value = true
        emit('typing')
    }

    // Clear existing timer
    if (typingTimer.value) {
        clearTimeout(typingTimer.value)
    }

    // Set new timer to stop typing
    typingTimer.value = setTimeout(() => {
        stopTyping()
    }, 1000)
}

const stopTyping = () => {
    if (isTyping.value) {
        isTyping.value = false
        emit('stop-typing')
    }

    if (typingTimer.value) {
        clearTimeout(typingTimer.value)
        typingTimer.value = null
    }
}

const handleSend = async () => {
    if (!canSend.value || isSending.value) return

    isSending.value = true
    stopTyping()

    try {
        // Upload attachments first
        let uploadedAttachments = []
        if (attachments.value.length > 0) {
            const uploadResults = await uploadFiles()
            uploadedAttachments = uploadResults.map(result => ({
                url: result.url,
                type: result.type,
                name: result.name,
                size: result.size
            }))
        }

        const messageData = {
            content: message.value.trim(),
            attachments: uploadedAttachments,
            replyToId: props.replyToMessage?.id
        }

        emit('send', messageData)

        // Reset form
        message.value = ''
        attachments.value = []
        autoResize()

    } catch (error) {
        toast.error('Không thể gửi tin nhắn!')
        console.error('Send message error:', error)
    } finally {
        isSending.value = false
    }
}

const openFileDialog = () => {
    fileInput.value?.click()
}

const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
        await handleFiles(files)
    }
    event.target.value = ''
}

const handleFiles = async (files) => {
    try {
        const fileObjects = await addFiles(files)

        for (const fileObj of fileObjects) {
            if (fileObj.file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    attachments.value.push({
                        id: fileObj.id,
                        type: 'image',
                        name: fileObj.file.name,
                        preview: e.target.result,
                        file: fileObj.file,
                        progress: 0
                    })
                }
                reader.readAsDataURL(fileObj.file)
            } else {
                attachments.value.push({
                    id: fileObj.id,
                    type: 'file',
                    name: fileObj.file.name,
                    file: fileObj.file,
                    progress: 0
                })
            }
        }
    } catch (error) {
        console.error('File handling error:', error)
    }
}

const removeAttachment = (index) => {
    attachments.value.splice(index, 1)
}

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value
}

const addEmoji = (emoji) => {
    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    message.value = message.value.substring(0, start) + emoji.emoji + message.value.substring(end)

    nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.emoji.length, start + emoji.emoji.length)
        autoResize()
    })
}

const toggleVoiceRecording = async () => {
    if (isRecording.value) {
        stopRecording()
    } else {
        await startRecording()
    }
}

const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        recordingStream.value = stream

        mediaRecorder.value = new MediaRecorder(stream)
        const chunks = []

        mediaRecorder.value.ondataavailable = (event) => {
            chunks.push(event.data)
        }

        mediaRecorder.value.onstop = () => {
            const blob = new Blob(chunks, { type: 'audio/wav' })
            const file = new File([blob], `voice-${Date.now()}.wav`, { type: 'audio/wav' })

            // Add voice recording as attachment
            attachments.value.push({
                id: Date.now(),
                type: 'audio',
                name: file.name,
                file: file,
                progress: 100
            })
        }

        mediaRecorder.value.start()
        isRecording.value = true

        // Start timer
        let seconds = 0
        const timer = setInterval(() => {
            seconds++
            const mins = Math.floor(seconds / 60)
            const secs = seconds % 60
            recordingDuration.value = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
        }, 1000)

        // Store timer reference
        mediaRecorder.value.timer = timer

    } catch (error) {
        toast.error('Không thể truy cập microphone!')
        console.error('Recording error:', error)
    }
}

const stopRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
        mediaRecorder.value.stop()
        clearInterval(mediaRecorder.value.timer)

        recordingStream.value?.getTracks().forEach(track => track.stop())

        isRecording.value = false
        recordingDuration.value = '00:00'
    }
}

const cancelRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
        clearInterval(mediaRecorder.value.timer)
        recordingStream.value?.getTracks().forEach(track => track.stop())

        isRecording.value = false
        recordingDuration.value = '00:00'
    }
}

const cancelReply = () => {
    emit('cancel-reply')
}

const truncateText = (text, maxLength) => {
    if (!text || text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

// Cleanup
onUnmounted(() => {
    stopTyping()
    cancelRecording()
})

// Initialize
onMounted(() => {
    autoResize()
    textareaRef.value?.focus()
})
</script>

<style lang="scss" scoped>
.message-input {
    border-top: 1px solid var(--bs-border-color);
    background: white;

    .input-container {
        padding: 1rem;

        .input-wrapper {
            display: flex;
            align-items: flex-end;
            gap: 0.5rem;

            .attachment-btn {
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .text-input-container {
                flex: 1;
                position: relative;

                .message-textarea {
                    border-radius: 1.5rem;
                    padding: 0.75rem 3rem 0.75rem 1rem;
                    resize: none;
                    border: 1px solid var(--bs-border-color);

                    &:focus {
                        border-color: var(--bs-primary);
                        box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
                    }
                }

                .input-actions {
                    position: absolute;
                    right: 0.5rem;
                    bottom: 0.5rem;
                    display: flex;
                    gap: 0.25rem;
                }
            }

            .send-btn {
                flex-shrink: 0;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
        }

        .reply-preview {
            margin-bottom: 0.75rem;
            padding: 0.75rem;
            background: var(--bs-light);
            border-radius: 0.5rem;
            border-left: 4px solid var(--bs-primary);

            .reply-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 0.25rem;

                span {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: var(--bs-primary);
                }
            }

            .reply-text {
                font-size: 0.875rem;
                color: var(--bs-secondary);
            }
        }

        .attachments-preview {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
            gap: 0.5rem;
            margin-bottom: 0.75rem;

            .attachment-item {
                position: relative;
                border-radius: 0.5rem;
                overflow: hidden;
                background: var(--bs-light);

                .attachment-preview {
                    width: 100%;
                    height: 100px;
                    object-fit: cover;
                }

                .attachment-file {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    height: 100px;
                    padding: 0.5rem;
                    text-align: center;

                    i {
                        font-size: 1.5rem;
                        color: var(--bs-secondary);
                        margin-bottom: 0.25rem;
                    }

                    span {
                        font-size: 0.75rem;
                        word-break: break-word;
                    }
                }

                .attachment-remove {
                    position: absolute;
                    top: 0.25rem;
                    right: 0.25rem;
                    width: 24px;
                    height: 24px;
                    padding: 0;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .upload-progress {
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;

                    .progress {
                        height: 4px;
                        border-radius: 0;
                    }
                }
            }
        }

        .recording-indicator {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 0.75rem;
            background: var(--bs-danger);
            color: white;
            border-radius: 0.5rem;
            margin-bottom: 0.75rem;

            .recording-animation {
                position: relative;
                width: 16px;
                height: 16px;

                .pulse {
                    width: 100%;
                    height: 100%;
                    background: white;
                    border-radius: 50%;
                    animation: pulse 1s infinite;
                }
            }

            span {
                font-weight: 600;
                font-family: monospace;
            }
        }
    }
}

@keyframes pulse {
    0% {
        transform: scale(1);
        opacity: 1;
    }

    50% {
        transform: scale(1.2);
        opacity: 0.7;
    }

    100% {
        transform: scale(1);
        opacity: 1;
    }
}
</style>