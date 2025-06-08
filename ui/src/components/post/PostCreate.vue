<template>
    <div class="post-create">
        <div class="create-header">
            <UserAvatar :src="currentUser.avatar" :name="currentUser.name" size="medium" />

            <div class="create-content">
                <textarea ref="textareaRef" v-model="content" class="form-control create-textarea"
                    :placeholder="placeholder" @input="handleInput" @paste="handlePaste"
                    @keydown="handleKeydown"></textarea>

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
                    </div>
                </div>

                <div v-if="isLoading" class="upload-progress">
                    <div class="progress">
                        <div class="progress-bar" :style="{ width: uploadProgress + '%' }" role="progressbar"></div>
                    </div>
                    <small class="text-muted">Đang tải lên... {{ uploadProgress }}%</small>
                </div>
            </div>
        </div>

        <div class="create-actions">
            <div class="media-actions">
                <input ref="fileInput" type="file" accept="image/*,video/*" multiple style="display: none"
                    @change="handleFileSelect">

                <button class="btn btn-outline-secondary btn-sm" @click="openFileDialog" :disabled="isLoading"
                    title="Thêm ảnh/video">
                    <i class="fas fa-image"></i>
                </button>

                <button class="btn btn-outline-secondary btn-sm" @click="toggleEmojiPicker" :disabled="isLoading"
                    title="Thêm emoji">
                    <i class="fas fa-smile"></i>
                </button>

                <button class="btn btn-outline-secondary btn-sm" @click="addPoll" :disabled="isLoading"
                    title="Tạo bình chọn">
                    <i class="fas fa-poll"></i>
                </button>
            </div>

            <div class="post-actions">
                <div class="character-count">
                    <small :class="{ 'text-danger': remainingChars < 0 }">
                        {{ remainingChars }}
                    </small>
                </div>

                <button class="btn btn-primary" @click="submitPost" :disabled="!canPost || isLoading">
                    <span v-if="isLoading" class="spinner-border spinner-border-sm me-1"></span>
                    {{ isEditing ? 'Cập nhật' : 'Đăng' }}
                </button>
            </div>
        </div>

        <EmojiPicker :show="showEmojiPicker" @select="addEmoji" @close="showEmojiPicker = false" />
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePostStore } from '@/stores/post'
import { useFileUpload } from '@/composables/useFileUpload'
import { useToast } from 'vue-toastification'
import UserAvatar from '@/components/user/UserAvatar.vue'
import EmojiPicker from '@/components/common/EmojiPicker.vue'

const props = defineProps({
    placeholder: {
        type: String,
        default: 'Bạn đang nghĩ gì?'
    },
    maxLength: {
        type: Number,
        default: 280
    },
    editPost: {
        type: Object,
        default: null
    }
})

const emit = defineEmits(['submit', 'cancel'])

const authStore = useAuthStore()
const postStore = usePostStore()
const toast = useToast()

// File upload
const { addFiles, uploadFiles, uploadProgress, isUploading } = useFileUpload({
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    multiple: true,
    autoUpload: false
})

// Refs
const textareaRef = ref(null)
const fileInput = ref(null)

// State
const content = ref('')
const attachments = ref([])
const isLoading = ref(false)
const showEmojiPicker = ref(false)

// Computed
const currentUser = computed(() => authStore.user)
const isEditing = computed(() => !!props.editPost)
const remainingChars = computed(() => props.maxLength - content.value.length)

const canPost = computed(() => {
    return (content.value.trim().length > 0 || attachments.value.length > 0) &&
        content.value.length <= props.maxLength &&
        !isLoading.value
})

// Watchers
watch(() => props.editPost, (newPost) => {
    if (newPost) {
        content.value = newPost.content || ''
        attachments.value = newPost.attachments || []
    }
}, { immediate: true })

// Actions
const handleInput = () => {
    autoResize()
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

const handleKeydown = (event) => {
    // Ctrl/Cmd + Enter to submit
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        if (canPost.value) {
            submitPost()
        }
    }
}

const autoResize = () => {
    nextTick(() => {
        const textarea = textareaRef.value
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = textarea.scrollHeight + 'px'
        }
    })
}

const openFileDialog = () => {
    fileInput.value?.click()
}

const handleFileSelect = (event) => {
    const files = Array.from(event.target.files)
    if (files.length > 0) {
        handleFiles(files)
    }
    // Reset input
    event.target.value = ''
}

const handleFiles = async (files) => {
    try {
        const fileObjects = await addFiles(files)

        // Generate previews and add to attachments
        for (const fileObj of fileObjects) {
            if (fileObj.file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    attachments.value.push({
                        id: fileObj.id,
                        type: 'image',
                        name: fileObj.file.name,
                        preview: e.target.result,
                        file: fileObj.file
                    })
                }
                reader.readAsDataURL(fileObj.file)
            } else {
                attachments.value.push({
                    id: fileObj.id,
                    type: 'file',
                    name: fileObj.file.name,
                    file: fileObj.file
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

    content.value = content.value.substring(0, start) + emoji.emoji + content.value.substring(end)

    nextTick(() => {
        textarea.focus()
        textarea.setSelectionRange(start + emoji.emoji.length, start + emoji.emoji.length)
    })
}

const addPoll = () => {
    // TODO: Implement poll creation
    toast.info('Tính năng bình chọn sẽ sớm được cập nhật!')
}

const submitPost = async () => {
    if (!canPost.value) return

    isLoading.value = true

    try {
        // Upload attachments first
        let uploadedAttachments = []
        if (attachments.value.length > 0) {
            const uploadResults = await uploadFiles()
            uploadedAttachments = uploadResults.map(result => ({
                url: result.url,
                type: result.type,
                name: result.name
            }))
        }

        const postData = {
            content: content.value.trim(),
            attachments: uploadedAttachments
        }

        let result
        if (isEditing.value) {
            result = await postStore.updatePost(props.editPost.id, postData)
        } else {
            result = await postStore.createPost(postData)
        }

        // Reset form
        content.value = ''
        attachments.value = []
        autoResize()

        emit('submit', result)

    } catch (error) {
        console.error('Submit post error:', error)
    } finally {
        isLoading.value = false
    }
}

// Initialize
nextTick(() => {
    autoResize()
    textareaRef.value?.focus()
})
</script>

<style lang="scss" scoped>
.post-create {
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.75rem;
    padding: 1.5rem;
    margin-bottom: 1rem;

    .create-header {
        display: flex;
        align-items: flex-start;
        gap: 1rem;
        margin-bottom: 1rem;

        .create-content {
            flex: 1;

            .create-textarea {
                border: none;
                resize: none;
                min-height: 100px;
                font-size: 1.125rem;

                &:focus {
                    box-shadow: none;
                    border: none;
                }

                &::placeholder {
                    color: var(--bs-secondary);
                }
            }

            .attachments-preview {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
                gap: 1rem;
                margin-top: 1rem;

                .attachment-item {
                    position: relative;
                    border-radius: 0.5rem;
                    overflow: hidden;

                    .attachment-preview {
                        width: 100%;
                        height: 150px;
                        object-fit: cover;
                    }

                    .attachment-file {
                        display: flex;
                        align-items: center;
                        gap: 0.5rem;
                        padding: 1rem;
                        background: var(--bs-light);
                        height: 150px;

                        i {
                            font-size: 2rem;
                            color: var(--bs-secondary);
                        }

                        span {
                            font-size: 0.875rem;
                            word-break: break-word;
                        }
                    }

                    .attachment-remove {
                        position: absolute;
                        top: 0.5rem;
                        right: 0.5rem;
                        width: 24px;
                        height: 24px;
                        padding: 0;
                        border-radius: 50%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                }
            }

            .upload-progress {
                margin-top: 1rem;

                .progress {
                    height: 4px;
                    margin-bottom: 0.5rem;
                }
            }
        }
    }

    .create-actions {
        display: flex;
        align-items: center;
        justify-content: space-between;

        .media-actions {
            display: flex;
            gap: 0.5rem;
        }

        .post-actions {
            display: flex;
            align-items: center;
            gap: 1rem;

            .character-count {
                font-weight: 500;
            }
        }
    }
}
</style>