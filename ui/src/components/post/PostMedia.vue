<template>
    <div class="post-media">
        <div v-if="images.length === 1" class="single-image">
            <img :src="images[0].url" :alt="images[0].alt || 'Post image'" class="media-image"
                @click="viewImage(images[0], 0)">
        </div>

        <div v-else-if="images.length > 1" :class="['image-grid', `grid-${Math.min(images.length, 4)}`]">
            <div v-for="(image, index) in images.slice(0, 4)" :key="index" class="grid-item"
                @click="viewImage(image, index)">
                <img :src="image.url" :alt="image.alt || `Post image ${index + 1}`" class="media-image">

                <div v-if="index === 3 && images.length > 4" class="more-overlay">
                    <span>+{{ images.length - 4 }}</span>
                </div>
            </div>
        </div>

        <div v-if="videos.length > 0" class="video-container">
            <video v-for="(video, index) in videos" :key="`video-${index}`" :src="video.url" class="media-video"
                controls preload="metadata" @click="viewVideo(video, index)">
                Your browser does not support the video tag.
            </video>
        </div>

        <div v-if="documents.length > 0" class="documents-list">
            <div v-for="(doc, index) in documents" :key="`doc-${index}`" class="document-item"
                @click="downloadDocument(doc)">
                <div class="document-icon">
                    <i :class="getDocumentIcon(doc.type)"></i>
                </div>
                <div class="document-info">
                    <div class="document-name">{{ doc.name }}</div>
                    <div class="document-size">{{ formatFileSize(doc.size) }}</div>
                </div>
                <button class="btn btn-outline-primary btn-sm">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    attachments: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['view', 'download'])

// Computed
const images = computed(() => {
    return props.attachments.filter(att =>
        att.type === 'image' || att.mimeType?.startsWith('image/')
    )
})

const videos = computed(() => {
    return props.attachments.filter(att =>
        att.type === 'video' || att.mimeType?.startsWith('video/')
    )
})

const documents = computed(() => {
    return props.attachments.filter(att =>
        !att.type?.includes('image') &&
        !att.type?.includes('video') &&
        !att.mimeType?.startsWith('image/') &&
        !att.mimeType?.startsWith('video/')
    )
})

// Actions
const viewImage = (image, index) => {
    emit('view', image, index)
}

const viewVideo = (video, index) => {
    emit('view', video, index)
}

const downloadDocument = (document) => {
    emit('download', document)

    // Create download link
    const link = document.createElement('a')
    link.href = document.url
    link.download = document.name
    link.target = '_blank'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
}

// Utilities
const getDocumentIcon = (type) => {
    const typeMap = {
        'application/pdf': 'fas fa-file-pdf',
        'application/msword': 'fas fa-file-word',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word',
        'application/vnd.ms-excel': 'fas fa-file-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fas fa-file-excel',
        'application/vnd.ms-powerpoint': 'fas fa-file-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'fas fa-file-powerpoint',
        'application/zip': 'fas fa-file-archive',
        'application/x-rar-compressed': 'fas fa-file-archive',
        'text/plain': 'fas fa-file-alt'
    }

    return typeMap[type] || 'fas fa-file'
}

const formatFileSize = (bytes) => {
    if (!bytes) return '0 B'

    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
</script>

<style lang="scss" scoped>
.post-media {
    .single-image {
        .media-image {
            width: 100%;
            max-height: 500px;
            object-fit: cover;
            border-radius: 0.5rem;
            cursor: pointer;
            transition: transform 0.2s ease;

            &:hover {
                transform: scale(1.02);
            }
        }
    }

    .image-grid {
        display: grid;
        gap: 0.25rem;
        border-radius: 0.5rem;
        overflow: hidden;

        &.grid-2 {
            grid-template-columns: 1fr 1fr;
        }

        &.grid-3 {
            grid-template-columns: 2fr 1fr;
            grid-template-rows: 1fr 1fr;

            .grid-item:first-child {
                grid-row: 1 / 3;
            }
        }

        &.grid-4 {
            grid-template-columns: 1fr 1fr;
            grid-template-rows: 1fr 1fr;
        }

        .grid-item {
            position: relative;
            aspect-ratio: 1;
            cursor: pointer;
            overflow: hidden;

            .media-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.2s ease;
            }

            &:hover .media-image {
                transform: scale(1.05);
            }

            .more-overlay {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 1.5rem;
                font-weight: 600;
            }
        }
    }

    .video-container {
        .media-video {
            width: 100%;
            max-height: 500px;
            border-radius: 0.5rem;
            margin-bottom: 0.5rem;

            &:last-child {
                margin-bottom: 0;
            }
        }
    }

    .documents-list {
        .document-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border: 1px solid var(--bs-border-color);
            border-radius: 0.5rem;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-bottom: 0.5rem;

            &:hover {
                border-color: var(--bs-primary);
                background-color: var(--bs-light);
            }

            &:last-child {
                margin-bottom: 0;
            }

            .document-icon {
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                background-color: var(--bs-light);
                border-radius: 0.375rem;

                i {
                    font-size: 1.25rem;
                    color: var(--bs-primary);
                }
            }

            .document-info {
                flex: 1;
                min-width: 0;

                .document-name {
                    font-weight: 500;
                    word-break: break-word;
                }

                .document-size {
                    font-size: 0.875rem;
                    color: var(--bs-secondary);
                }
            }
        }
    }
}
</style>
