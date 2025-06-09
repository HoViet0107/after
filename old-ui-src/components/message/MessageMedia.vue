<template>
    <div class="message-media">
        <!-- Images -->
        <div v-if="images.length > 0" class="media-images">
            <div v-if="images.length === 1" class="single-image">
                <img :src="images[0].url" :alt="images[0].name" class="media-image" @click="viewMedia(images[0], 0)">
            </div>

            <div v-else :class="['image-grid', `grid-${Math.min(images.length, 4)}`]">
                <div v-for="(image, index) in images.slice(0, 4)" :key="index" class="grid-item"
                    @click="viewMedia(image, index)">
                    <img :src="image.url" :alt="image.name" class="media-image">

                    <div v-if="index === 3 && images.length > 4" class="more-overlay">
                        <span>+{{ images.length - 4 }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Videos -->
        <div v-if="videos.length > 0" class="media-videos">
            <video v-for="(video, index) in videos" :key="`video-${index}`" :src="video.url" class="media-video"
                controls preload="metadata">
                Your browser does not support the video tag.
            </video>
        </div>

        <!-- Audio -->
        <div v-if="audios.length > 0" class="media-audios">
            <div v-for="(audio, index) in audios" :key="`audio-${index}`" class="audio-player">
                <div class="audio-info">
                    <i class="fas fa-music"></i>
                    <span>{{ audio.name || 'Âm thanh' }}</span>
                </div>
                <audio :src="audio.url" controls class="audio-element">
                    Your browser does not support the audio tag.
                </audio>
            </div>
        </div>

        <!-- Documents -->
        <div v-if="documents.length > 0" class="media-documents">
            <div v-for="(doc, index) in documents" :key="`doc-${index}`" class="document-item"
                @click="downloadDocument(doc)">
                <div class="document-icon">
                    <i :class="getDocumentIcon(doc.type)"></i>
                </div>
                <div class="document-info">
                    <div class="document-name">{{ doc.name }}</div>
                    <div class="document-size">{{ formatFileSize(doc.size) }}</div>
                </div>
                <button class="btn btn-sm btn-outline-primary">
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
        att.type?.startsWith('image/') || att.url?.match(/\.(jpg|jpeg|png|gif|webp)$/i)
    )
})

const videos = computed(() => {
    return props.attachments.filter(att =>
        att.type?.startsWith('video/') || att.url?.match(/\.(mp4|webm|ogg)$/i)
    )
})

const audios = computed(() => {
    return props.attachments.filter(att =>
        att.type?.startsWith('audio/') || att.url?.match(/\.(mp3|wav|ogg|m4a)$/i)
    )
})

const documents = computed(() => {
    return props.attachments.filter(att =>
        !images.value.includes(att) &&
        !videos.value.includes(att) &&
        !audios.value.includes(att)
    )
})

// Actions
const viewMedia = (media, index) => {
    emit('view', media, index)
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
        'application/pdf': 'fas fa-file-pdf text-danger',
        'application/msword': 'fas fa-file-word text-primary',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'fas fa-file-word text-primary',
        'application/vnd.ms-excel': 'fas fa-file-excel text-success',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'fas fa-file-excel text-success',
        'text/plain': 'fas fa-file-alt text-secondary'
    }

    return typeMap[type] || 'fas fa-file text-secondary'
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
.message-media {
    max-width: 300px;

    .media-images {
        .single-image {
            .media-image {
                width: 100%;
                max-height: 200px;
                object-fit: cover;
                border-radius: 0.5rem;
                cursor: pointer;
            }
        }

        .image-grid {
            display: grid;
            gap: 0.125rem;
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
                    font-size: 1.25rem;
                    font-weight: 600;
                }
            }
        }
    }

    .media-videos {
        .media-video {
            width: 100%;
            max-height: 200px;
            border-radius: 0.5rem;
        }
    }

    .media-audios {
        .audio-player {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            padding: 0.75rem;
            background: var(--bs-light);
            border-radius: 0.5rem;

            .audio-info {
                display: flex;
                align-items: center;
                gap: 0.5rem;

                i {
                    color: var(--bs-primary);
                }

                span {
                    font-weight: 500;
                    font-size: 0.875rem;
                }
            }

            .audio-element {
                width: 100%;
                height: 32px;
            }
        }
    }

    .media-documents {
        .document-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: var(--bs-light);
            border-radius: 0.5rem;
            cursor: pointer;
            transition: background-color 0.2s ease;

            &:hover {
                background: var(--bs-secondary);
                color: white;
            }

            .document-icon {
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;

                i {
                    font-size: 1.25rem;
                }
            }

            .document-info {
                flex: 1;
                min-width: 0;

                .document-name {
                    font-weight: 500;
                    font-size: 0.875rem;
                    word-break: break-word;
                }

                .document-size {
                    font-size: 0.75rem;
                    opacity: 0.8;
                }
            }
        }
    }
}
</style>