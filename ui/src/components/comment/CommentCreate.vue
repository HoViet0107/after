<template>
    <div class="comment-create">
        <div class="create-form">
            <UserAvatar :src="currentUser.avatar" :name="currentUser.name" size="sm" />

            <div class="input-container">
                <textarea ref="textareaRef" v-model="content" class="form-control comment-input"
                    :placeholder="placeholder" rows="1" @input="handleInput" @keydown="handleKeydown"
                    @focus="handleFocus" @blur="handleBlur"></textarea>

                <div v-if="isFocused || content" class="input-actions">
                    <div class="media-actions">
                        <button class="btn btn-sm btn-outline-secondary" @click="toggleEmojiPicker" type="button"
                            title="Thêm emoji">
                            <i class="fas fa-smile"></i>
                        </button>

                        <button class="btn btn-sm btn-outline-secondary" @click="openFileDialog" type="button"
                            title="Thêm ảnh">
                            <i class="fas fa-image"></i>
                        </button>

                        <input ref="fileInput" type="file" accept="image/*" style="display: none"
                            @change="handleFileSelect">
                    </div>

                    <div class="submit-actions">
                        <button v-if="showCancel" class="btn btn-sm btn-outline-secondary" @click="handleCancel"
                            type="button">
                            Hủy
                        </button>

                        <button class="btn btn-sm btn-primary" @click="handleSubmit" :disabled="!canSubmit || isLoading"
                            type="button">
                            <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
                            {{ submitText }}
                        </button>
                    </div>
                </div>

                <div v-if="attachments.length > 0" class="attachments-preview">
                    <div v-for="(attachment, index) in attachments" :key="index" class="attachment-item">
                        <img :src="attachment.preview" :alt="attachment.name" class="attachment-image">
                        <button class="btn btn-danger btn-sm attachment-remove" @click="removeAttachment(index)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <EmojiPicker :show="showEmojiPicker" @select="addEmoji" @close="showEmojiPicker = false" />
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useCommentStore } from '@/stores/comment'
import { useFileUpload } from '@/composables/useFileUpload'
import { useToast } from 'vue-toastification'
import UserAvatar from '@/components/user/UserAvatar.vue'
import EmojiPicker from '@/components/common/EmojiPicker.vue'

const props = defineProps({
    postId: {
        type: String,
        required: true
    },
    parentId: {
        type: String,
        default: null
    },
    placeholder: {
        type: String,
        default: 'Viết bình luận...'
    },
    maxLength: {
        type: Number,
        default: 500
    },
    showCancel: {
        type: Boolean,
        default: false
    },
    submitText: {
        type: String,
        default: 'Bình luận'
    }
})

const emit = defineEmits(['submit', 'cancel'])

const authStore = useAuthStore()
const commentStore = useCommentStore()
const toast = useToast()

// File upload
const { addFiles, uploadFiles } = useFileUpload({
    maxFileSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif'],
    multiple: false,
    autoUpload: false
})

// Refs
const textareaRef = ref(null)
const fileInput = ref(null)

// State
const content = ref('')
const attachments = ref([])
const isFocused = ref(false)
const isLoading = ref(false)
const showEmojiPicker = ref(false)

// Computed
const currentUser = computed(() => authStore.user)

const canSubmit = computed(() => {
    return (content.value.trim().length > 0 || attachments.value.length > 0) &&
        content.value.length <= props.maxLength
})

// Actions
const handleInput = () => {
    autoResize()
}

const handleKeydown = (event) => {
    // Ctrl/Cmd + Enter to submit
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (canSubmit.value) {
            handleSubmit()
        }
        return
    }

    // Escape to cancel
    if (event.key === 'Escape' && props.showCancel) {
        handleCancel()
    }
}

const handleFocus = () => {
    isFocused.value = true
}

const handleBlur = () => {
    // Delay to allow for button clicks
    setTimeout(() => {
        if (!content.value && attachments.value.length === 0) {
            isFocused.value = false
        }
    }, 200)
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

const toggleEmojiPicker = () => {
    showEmojiPicker.value = !showEmojiPicker.value
}

const addEmoji = (emoji) => {
    const textarea = textareaRef.value
    const start = textarea.selectionStart
    const end = textarea.selectionEnd

    content.value = content.value.substring(0, start) + emoji.emoji + content.value.substring(end)

    nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.emoji.length, start + emoji.emoji.length)
        autoResize()
    })
}

const openFileDialog = () => {
    fileInput.value?.click()
}

const handleFileSelect = async (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
        try {
            const fileObjects = await addFiles(files)

            // Generate preview
            for (const fileObj of fileObjects) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    attachments.value.push({
                        id: fileObj.id,
                        name: fileObj.file.name,
                        preview: e.target.result,
                        file: fileObj.file
                    })
                }
                reader.readAsDataURL(fileObj.file)
            }
        } catch (error) {
            console.error('File selection error:', error)
        }
    }

    // Reset input
    event.target.value = ''
}

const removeAttachment = (index) => {
    attachments.value.splice(index, 1)
}

const handleSubmit = async () => {
    if (!canSubmit.value || isLoading.value) return

    isLoading.value = true

    try {
        // Upload attachments if any
        let uploadedAttachments = []
        if (attachments.value.length > 0) {
            const uploadResults = await uploadFiles()
            uploadedAttachments = uploadResults.map(result => ({
                url: result.url,
                type: result.type,
                name: result.name
            }))
        }

        const commentData = {
            content: content.value.trim(),
            attachments: uploadedAttachments,
            parentId: props.parentId
        }

        const comment = await commentStore.createComment(props.postId, commentData)

        // Reset form
        content.value = ''
        attachments.value = []
        isFocused.value = false
        autoResize()

        emit('submit', comment)

    } catch (error) {
        toast.error('Không thể gửi bình luận!')
        console.error('Submit comment error:', error)
    } finally {
        isLoading.value = false
    }
}

const handleCancel = () => {
    content.value = ''
    attachments.value = []
    isFocused.value = false
    autoResize()
    emit('cancel')
}

// Initialize
nextTick(() => {
    autoResize()
})
</script>

<style lang="scss" scoped>
.comment-create {
    .create-form {
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;

        .input-container {
            flex: 1;

            .comment-input {
                border: 1px solid var(--bs-border-color);
                border-radius: 1.5rem;
                padding: 0.75rem 1rem;
                resize: none;
                transition: all 0.2s ease;

                &:focus {
                    border-color: var(--bs-primary);
                    box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
                }

                &::placeholder {
                    color: var(--bs-secondary);
                }
            }

            .input-actions {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-top: 0.5rem;
                padding: 0 1rem;

                .media-actions {
                    display: flex;
                    gap: 0.25rem;
                }

                .submit-actions {
                    display: flex;
                    gap: 0.5rem;
                }
            }

            .attachments-preview {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
                gap: 0.5rem;
                margin-top: 0.75rem;
                padding: 0 1rem;

                .attachment-item {
                    position: relative;
                    aspect-ratio: 1;
                    border-radius: 0.5rem;
                    overflow: hidden;

                    .attachment-image {
                        width: 100%;
                        height: 100%;
                        object-fit: cover;
                    }

                    .attachment-remove {
                        position: absolute;
                        top: 0.25rem;
                        right: 0.25rem;
                        width: 20px;
                        height: 20px;
                        padding: 0;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 0.75rem;
                    }
                }
            }
        }
    }
}
</style>