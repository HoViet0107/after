// File upload service với compression, progress tracking và error handling

import apiClient from '@/api/client'
import { ENDPOINTS } from '@/api/endpoints'
import Compressor from 'compressorjs'

class UploadService {
    constructor() {
        this.uploadQueue = new Map()
        this.activeUploads = new Map()
        this.maxConcurrentUploads = 3
        this.maxFileSize = 100 * 1024 * 1024 // 100MB
        this.maxImageSize = 10 * 1024 * 1024  // 10MB for images
        this.maxVideoSize = 50 * 1024 * 1024  // 50MB for videos

        // Supported file types
        this.supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        this.supportedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime']
        this.supportedDocumentTypes = [
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'text/plain'
        ]

        // Compression settings
        this.compressionSettings = {
            image: {
                quality: 0.8,
                maxWidth: 1920,
                maxHeight: 1080,
                convertSize: 2 * 1024 * 1024 // Convert to JPEG if larger than 2MB
            },
            video: {
                maxDuration: 300, // 5 minutes
                maxBitrate: 2000000 // 2Mbps
            }
        }
    }

    // Main upload method
    async uploadFile(file, options = {}) {
        try {
            // Validate file
            const validation = this.validateFile(file)
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error
                }
            }

            // Generate upload ID
            const uploadId = this.generateUploadId()

            // Process file if needed
            const processedFile = await this.processFile(file, options)

            // Create upload task
            const uploadTask = {
                id: uploadId,
                file: processedFile,
                options,
                startTime: Date.now(),
                status: 'pending',
                progress: 0,
                bytesUploaded: 0,
                totalBytes: processedFile.size
            }

            // Add to queue
            this.uploadQueue.set(uploadId, uploadTask)

            // Start upload
            const result = await this.executeUpload(uploadTask)

            return {
                success: true,
                data: result,
                uploadId
            }
        } catch (error) {
            console.error('Upload error:', error)
            return {
                success: false,
                error: error.message || 'Upload failed'
            }
        }
    }

    // Upload multiple files
    async uploadFiles(files, options = {}) {
        const results = []
        const uploadPromises = []

        for (const file of files) {
            const uploadPromise = this.uploadFile(file, options)
            uploadPromises.push(uploadPromise)

            // Limit concurrent uploads
            if (uploadPromises.length >= this.maxConcurrentUploads) {
                const batchResults = await Promise.allSettled(uploadPromises)
                results.push(...batchResults.map(r => r.value || { success: false, error: r.reason }))
                uploadPromises.length = 0
            }
        }

        // Upload remaining files
        if (uploadPromises.length > 0) {
            const batchResults = await Promise.allSettled(uploadPromises)
            results.push(...batchResults.map(r => r.value || { success: false, error: r.reason }))
        }

        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)

        return {
            success: failed.length === 0,
            results,
            summary: {
                total: files.length,
                successful: successful.length,
                failed: failed.length
            }
        }
    }

    // Upload image with compression
    async uploadImage(imageFile, options = {}) {
        try {
            // Compress image if needed
            const compressedFile = await this.compressImage(imageFile, options.compression)

            const result = await this.uploadFile(compressedFile, {
                ...options,
                type: 'image',
                generateThumbnail: options.generateThumbnail !== false
            })

            return result
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Image upload failed'
            }
        }
    }

    // Upload video with processing
    async uploadVideo(videoFile, options = {}) {
        try {
            // Validate video
            const validation = this.validateVideo(videoFile)
            if (!validation.valid) {
                return {
                    success: false,
                    error: validation.error
                }
            }

            const result = await this.uploadFile(videoFile, {
                ...options,
                type: 'video',
                generateThumbnail: true,
                processVideo: true
            })

            return result
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Video upload failed'
            }
        }
    }

    // Upload document
    async uploadDocument(documentFile, options = {}) {
        try {
            const result = await this.uploadFile(documentFile, {
                ...options,
                type: 'document',
                extractText: options.extractText !== false
            })

            return result
        } catch (error) {
            return {
                success: false,
                error: error.message || 'Document upload failed'
            }
        }
    }

    // Upload avatar with special handling
    async uploadAvatar(imageFile, options = {}) {
        try {
            // Special compression for avatars
            const compressedFile = await this.compressImage(imageFile, {
                quality: 0.9,
                maxWidth: 512,
                maxHeight: 512,
                convertToSquare: true
            })

            const formData = new FormData()
            formData.append('avatar', compressedFile)
            if (options.userId) {
                formData.append('userId', options.userId)
            }

            const response = await apiClient.post(ENDPOINTS.UPLOAD.AVATAR, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: options.onProgress,
                showLoading: true
            })

            return {
                success: true,
                data: response.data.data,
                message: response.data.message
            }
        } catch (error) {
            return {
                success: false,
                error: error.response?.data?.message || 'Avatar upload failed'
            }
        }
    }

    // File validation
    validateFile(file) {
        if (!file) {
            return { valid: false, error: 'Không có file được chọn' }
        }

        if (file.size > this.maxFileSize) {
            return {
                valid: false,
                error: `File quá lớn. Giới hạn ${this.formatFileSize(this.maxFileSize)}`
            }
        }

        const fileType = this.getFileType(file)
        if (!this.isSupportedFileType(file.type)) {
            return {
                valid: false,
                error: `Loại file ${file.type} không được hỗ trợ`
            }
        }

        // Type-specific validation
        if (fileType === 'image' && file.size > this.maxImageSize) {
            return {
                valid: false,
                error: `Ảnh quá lớn. Giới hạn ${this.formatFileSize(this.maxImageSize)}`
            }
        }

        if (fileType === 'video' && file.size > this.maxVideoSize) {
            return {
                valid: false,
                error: `Video quá lớn. Giới hạn ${this.formatFileSize(this.maxVideoSize)}`
            }
        }

        return { valid: true }
    }

    // Video-specific validation
    validateVideo(videoFile) {
        const basicValidation = this.validateFile(videoFile)
        if (!basicValidation.valid) {
            return basicValidation
        }

        // Additional video validations could be added here
        // e.g., duration check, resolution check, etc.

        return { valid: true }
    }

    // Process file before upload
    async processFile(file, options = {}) {
        const fileType = this.getFileType(file)

        try {
            switch (fileType) {
                case 'image':
                    if (options.compression !== false) {
                        return await this.compressImage(file, options.compression)
                    }
                    break

                case 'video':
                    // Video processing could be added here
                    return file

                default:
                    return file
            }

            return file
        } catch (error) {
            console.warn('File processing failed, using original:', error)
            return file
        }
    }

    // Image compression
    async compressImage(imageFile, compressionOptions = {}) {
        return new Promise((resolve, reject) => {
            const options = {
                ...this.compressionSettings.image,
                ...compressionOptions,
                success: resolve,
                error: reject
            }

            new Compressor(imageFile, options)
        })
    }

    // Execute upload
    async executeUpload(uploadTask) {
        const { id, file, options } = uploadTask

        try {
            // Mark as active
            this.activeUploads.set(id, uploadTask)
            uploadTask.status = 'uploading'

            // Prepare form data
            const formData = new FormData()
            formData.append('file', file)
            formData.append('type', options.type || this.getFileType(file))

            if (options.description) {
                formData.append('description', options.description)
            }

            if (options.tags) {
                formData.append('tags', JSON.stringify(options.tags))
            }

            if (options.generateThumbnail) {
                formData.append('generateThumbnail', 'true')
            }

            if (options.processVideo) {
                formData.append('processVideo', 'true')
            }

            if (options.extractText) {
                formData.append('extractText', 'true')
            }

            // Determine endpoint based on file type
            const endpoint = this.getUploadEndpoint(file, options)

            // Upload with progress tracking
            const response = await apiClient.post(endpoint, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round(
                        (progressEvent.loaded * 100) / progressEvent.total
                    )

                    uploadTask.progress = percentCompleted
                    uploadTask.bytesUploaded = progressEvent.loaded

                    if (options.onProgress) {
                        options.onProgress({
                            uploadId: id,
                            progress: percentCompleted,
                            bytesUploaded: progressEvent.loaded,
                            totalBytes: progressEvent.total,
                            speed: this.calculateUploadSpeed(uploadTask)
                        })
                    }
                },
                timeout: 5 * 60 * 1000 // 5 minutes timeout
            })

            // Upload completed
            uploadTask.status = 'completed'
            uploadTask.progress = 100
            uploadTask.endTime = Date.now()
            uploadTask.result = response.data.data

            // Clean up
            this.activeUploads.delete(id)
            this.uploadQueue.delete(id)

            return response.data.data
        } catch (error) {
            uploadTask.status = 'failed'
            uploadTask.error = error.message

            // Clean up
            this.activeUploads.delete(id)
            this.uploadQueue.delete(id)

            throw error
        }
    }

    // Cancel upload
    cancelUpload(uploadId) {
        const uploadTask = this.activeUploads.get(uploadId) || this.uploadQueue.get(uploadId)

        if (uploadTask) {
            uploadTask.status = 'cancelled'

            // If there's an axios cancel token, use it
            if (uploadTask.cancelToken) {
                uploadTask.cancelToken.cancel('Upload cancelled by user')
            }

            this.activeUploads.delete(uploadId)
            this.uploadQueue.delete(uploadId)

            return true
        }

        return false
    }

    // Get upload status
    getUploadStatus(uploadId) {
        const uploadTask = this.activeUploads.get(uploadId) || this.uploadQueue.get(uploadId)

        if (!uploadTask) {
            return null
        }

        return {
            id: uploadTask.id,
            status: uploadTask.status,
            progress: uploadTask.progress,
            bytesUploaded: uploadTask.bytesUploaded,
            totalBytes: uploadTask.totalBytes,
            speed: this.calculateUploadSpeed(uploadTask),
            timeRemaining: this.calculateTimeRemaining(uploadTask),
            fileName: uploadTask.file.name,
            fileSize: uploadTask.file.size
        }
    }

    // Get all active uploads
    getActiveUploads() {
        return Array.from(this.activeUploads.values()).map(task =>
            this.getUploadStatus(task.id)
        )
    }

    // Utility methods
    generateUploadId() {
        return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    getFileType(file) {
        if (this.supportedImageTypes.includes(file.type)) {
            return 'image'
        }
        if (this.supportedVideoTypes.includes(file.type)) {
            return 'video'
        }
        if (this.supportedDocumentTypes.includes(file.type)) {
            return 'document'
        }
        return 'other'
    }

    isSupportedFileType(mimeType) {
        return [
            ...this.supportedImageTypes,
            ...this.supportedVideoTypes,
            ...this.supportedDocumentTypes
        ].includes(mimeType)
    }

    getUploadEndpoint(file, options) {
        const fileType = this.getFileType(file)

        switch (fileType) {
            case 'image':
                return ENDPOINTS.UPLOAD.IMAGE
            case 'video':
                return ENDPOINTS.UPLOAD.VIDEO
            case 'document':
                return ENDPOINTS.UPLOAD.DOCUMENT
            default:
                return ENDPOINTS.UPLOAD.FILE || '/upload'
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B'

        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    calculateUploadSpeed(uploadTask) {
        if (!uploadTask.startTime || uploadTask.bytesUploaded === 0) {
            return 0
        }

        const elapsedTime = (Date.now() - uploadTask.startTime) / 1000 // seconds
        return uploadTask.bytesUploaded / elapsedTime // bytes per second
    }

    calculateTimeRemaining(uploadTask) {
        const speed = this.calculateUploadSpeed(uploadTask)
        if (speed === 0) return null

        const remainingBytes = uploadTask.totalBytes - uploadTask.bytesUploaded
        return remainingBytes / speed // seconds
    }

    formatUploadSpeed(bytesPerSecond) {
        return this.formatFileSize(bytesPerSecond) + '/s'
    }

    formatTimeRemaining(seconds) {
        if (!seconds || seconds < 0) return null

        if (seconds < 60) {
            return `${Math.round(seconds)}s`
        } else if (seconds < 3600) {
            return `${Math.round(seconds / 60)}m`
        } else {
            return `${Math.round(seconds / 3600)}h`
        }
    }

    // Batch upload with progress tracking
    async uploadBatch(files, options = {}) {
        const batchId = this.generateUploadId()
        const batchProgress = {
            id: batchId,
            totalFiles: files.length,
            completedFiles: 0,
            failedFiles: 0,
            overallProgress: 0,
            results: []
        }

        const results = []

        for (let i = 0; i < files.length; i++) {
            const file = files[i]

            try {
                const result = await this.uploadFile(file, {
                    ...options,
                    onProgress: (progress) => {
                        // Update batch progress
                        const fileProgress = progress.progress / 100
                        const completedFiles = batchProgress.completedFiles
                        const currentFileProgress = fileProgress

                        batchProgress.overallProgress =
                            (completedFiles + currentFileProgress) / files.length * 100

                        if (options.onBatchProgress) {
                            options.onBatchProgress({
                                ...batchProgress,
                                currentFile: i + 1,
                                currentFileName: file.name,
                                currentFileProgress: progress.progress
                            })
                        }
                    }
                })

                results.push(result)

                if (result.success) {
                    batchProgress.completedFiles++
                } else {
                    batchProgress.failedFiles++
                }

            } catch (error) {
                results.push({
                    success: false,
                    error: error.message,
                    fileName: file.name
                })
                batchProgress.failedFiles++
            }
        }

        batchProgress.results = results
        batchProgress.overallProgress = 100

        return {
            success: batchProgress.failedFiles === 0,
            batchId,
            summary: batchProgress,
            results
        }
    }

    // Resume upload functionality (for future implementation)
    async resumeUpload(uploadId, file, chunkIndex = 0) {
        // Implementation for resumable uploads
        // This would require backend support for chunked uploads
        console.log('Resume upload not implemented yet')
        return { success: false, error: 'Resume upload not implemented' }
    }

    // Cleanup old upload data
    cleanup() {
        const now = Date.now()
        const maxAge = 24 * 60 * 60 * 1000 // 24 hours

        // Clean up old completed/failed uploads
        for (const [id, task] of this.uploadQueue.entries()) {
            if (task.endTime && (now - task.endTime) > maxAge) {
                this.uploadQueue.delete(id)
            }
        }
    }

    // Get upload statistics
    getUploadStats() {
        const active = this.activeUploads.size
        const queued = this.uploadQueue.size - active

        return {
            activeUploads: active,
            queuedUploads: queued,
            totalBandwidthUsed: this.calculateTotalBandwidth(),
            averageUploadSpeed: this.calculateAverageSpeed()
        }
    }

    calculateTotalBandwidth() {
        let total = 0

        for (const task of this.activeUploads.values()) {
            total += task.bytesUploaded
        }

        return total
    }

    calculateAverageSpeed() {
        const speeds = []

        for (const task of this.activeUploads.values()) {
            const speed = this.calculateUploadSpeed(task)
            if (speed > 0) {
                speeds.push(speed)
            }
        }

        if (speeds.length === 0) return 0
        return speeds.reduce((sum, speed) => sum + speed, 0) / speeds.length
    }
}

// Auto cleanup every hour
if (typeof window !== 'undefined') {
    setInterval(() => {
        if (uploadService) {
            uploadService.cleanup()
        }
    }, 60 * 60 * 1000) // 1 hour
}

// Export singleton instance
export const uploadService = new UploadService()
export default uploadService