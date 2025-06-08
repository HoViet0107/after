<template>
    <div class="image-uploader">
        <div :class="['upload-area', { 'dragover': isDragOver, 'has-error': error }]" @drop="handleDrop"
            @dragover.prevent="handleDragOver" @dragleave="handleDragLeave" @click="openFileDialog">
            <input ref="fileInput" type="file" :accept="acceptedTypes.join(',')" :multiple="multiple"
                @change="handleFileSelect" style="display: none">

            <div v-if="!previews.length" class="upload-prompt">
                <i class="fas fa-cloud-upload-alt upload-icon"></i>
                <p class="mb-1">{{ uploadText }}</p>
                <small class="text-muted">{{ hintText }}</small>
            </div>

            <div v-else class="preview-container">
                <div v-for="(preview, index) in previews" :key="index" class="preview-item">
                    <img :src="preview.url" :alt="preview.name" class="preview-image">
                    <div class="preview-overlay">
                        <button class="btn btn-sm btn-danger" @click.stop="removePreview(index)">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div v-if="preview.progress < 100" class="upload-progress">
                        <div class="progress">
                            <div class="progress-bar" :style="{ width: preview.progress + '%' }" role="progressbar">
                            </div>
                        </div>
                    </div>
                </div>

                <div v-if="multiple && previews.length < maxFiles" class="add-more" @click="openFileDialog">
                    <i class="fas fa-plus"></i>
                </div>
            </div>
        </div>

        <div v-if="error" class="alert alert-danger mt-2">
            {{ error }}
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useFileUpload } from '@/composables/useFileUpload'

const props = defineProps({
    multiple: {
        type: Boolean,
        default: false
    },
    maxFiles: {
        type: Number,
        default: 5
    },
    maxFileSize: {
        type: Number,
        default: 10 * 1024 * 1024 // 10MB
    },
    acceptedTypes: {
        type: Array,
        default: () => ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },
    uploadText: {
        type: String,
        default: 'Nhấp để chọn hoặc kéo thả ảnh vào đây'
    },
    hintText: {
        type: String,
        default: 'Hỗ trợ: JPG, PNG, GIF. Tối đa 10MB.'
    }
})

const emit = defineEmits(['upload', 'remove', 'error'])

// File upload composable
const { files, isUploading, addFiles, removeFile, uploadFiles, formatFileSize } = useFileUpload({
    maxFileSize: props.maxFileSize,
    allowedTypes: props.acceptedTypes,
    multiple: props.multiple,
    autoUpload: false
})

// Local state
const fileInput = ref(null)
const isDragOver = ref(false)
const error = ref('')
const previews = ref([])

// Computed
const uploadText = computed(() => {
    if (isUploading.value) return 'Đang tải lên...'
    return props.uploadText
})

// Actions
const openFileDialog = () => {
    fileInput.value?.click()
}

const handleFileSelect = (event) => {
    const files = event.target.files
    if (files.length > 0) {
        processFiles(files)
    }
}

const handleDrop = (event) => {
    event.preventDefault()
    isDragOver.value = false

    const files = event.dataTransfer.files
    if (files.length > 0) {
        processFiles(files)
    }
}

const handleDragOver = (event) => {
    event.preventDefault()
    isDragOver.value = true
}

const handleDragLeave = () => {
    isDragOver.value = false
}

const processFiles = async (fileList) => {
    error.value = ''

    try {
        const newFiles = await addFiles(fileList)

        // Generate previews
        newFiles.forEach(fileObj => {
            if (fileObj.file.type.startsWith('image/')) {
                const reader = new FileReader()
                reader.onload = (e) => {
                    previews.value.push({
                        id: fileObj.id,
                        url: e.target.result,
                        name: fileObj.file.name,
                        progress: 0
                    })
                }
                reader.readAsDataURL(fileObj.file)
            }
        })

        // Start upload
        if (newFiles.length > 0) {
            await uploadFiles()
            emit('upload', newFiles)
        }

    } catch (err) {
        error.value = err.message
        emit('error', err)
    }
}

const removePreview = (index) => {
    const preview = previews.value[index]
    previews.value.splice(index, 1)

    // Remove from files store
    const fileObj = files.value.find(f => f.id === preview.id)
    if (fileObj) {
        removeFile(fileObj.id)
    }

    emit('remove', preview)
}
</script>

<style lang="scss" scoped>
.image-uploader {
    .upload-area {
        border: 2px dashed var(--bs-border-color);
        border-radius: 0.5rem;
        padding: 2rem;
        text-align: center;
        cursor: pointer;
        transition: all 0.3s ease;
        min-height: 150px;
        display: flex;
        align-items: center;
        justify-content: center;

        &:hover {
            border-color: var(--bs-primary);
            background-color: var(--bs-light);
        }

        &.dragover {
            border-color: var(--bs-success);
            background-color: rgba(var(--bs-success-rgb), 0.1);
        }

        &.has-error {
            border-color: var(--bs-danger);
        }
    }

    .upload-prompt {
        .upload-icon {
            font-size: 2rem;
            color: var(--bs-secondary);
            margin-bottom: 1rem;
        }
    }

    .preview-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
        gap: 1rem;
        width: 100%;
    }

    .preview-item {
        position: relative;
        aspect-ratio: 1;
        border-radius: 0.375rem;
        overflow: hidden;

        .preview-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .preview-overlay {
            position: absolute;
            top: 0.25rem;
            right: 0.25rem;
            opacity: 0;
            transition: opacity 0.3s ease;
        }

        &:hover .preview-overlay {
            opacity: 1;
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

    .add-more {
        aspect-ratio: 1;
        border: 2px dashed var(--bs-border-color);
        border-radius: 0.375rem;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
            border-color: var(--bs-primary);
            background-color: var(--bs-light);
        }

        i {
            font-size: 1.5rem;
            color: var(--bs-secondary);
        }
    }
}
</style>