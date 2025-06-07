import { ref, computed } from 'vue'
import apiClient, { createUploadConfig } from '@/api/client'
import { ENDPOINTS, UPLOAD_CONSTRAINTS } from '@/api/endpoints'
import { useToast } from 'vue-toastification'
import { errorUtils } from '@/utils/errorHandler'
import Compressor from 'compressorjs'

export function useFileUpload() {
    const toast = useToast()

    // State
    const uploads = ref(new Map()) // uploadId -> upload info
    const isUploading = ref(false)
    const uploadQueue = ref([])

    // Computed
    const activeUploads = computed(() =>
        Array.from(uploads.value.values()).filter(upload =>
            upload.status === 'uploading' || upload.status === 'pending'
        )
    )

    const completedUploads = computed(() =>
        Array.from(uploads.value.values()).filter(upload =>
            upload.status === 'completed'
        )
    )

    const failedUploads = computed(() =>
        Array.from(uploads.value.values()).filter(upload =>
            upload.status === 'failed'
        )
    )

    const totalProgress = computed(() => {
        const active = activeUploads.value
        if (active.length === 0) return 0

        const totalProgress = active.reduce((sum, upload) => sum + upload.progress, 0)
        return Math.round(totalProgress / active.length)
    })

    // File validation
    const validateFile = (file, options = {}) => {
        const {
            maxSize = UPLOAD_CONSTRAINTS.MAX_FILE_SIZE,
            allowedTypes = null,
            customValidation = null
        } = options

        const errors = []

        // Check file size
        if (file.size > maxSize) {
            errors.push(`File quá lớn. Kích thước tối đa: ${formatFileSize(maxSize)}`)
        }

        // Check file type
        if (allowedTypes && !allowedTypes.includes(file.type)) {
            errors.push(`Loại file không được hỗ trợ: ${file.type}`)
        }

        // Check file name
        if (file.name.length > 255) {
            errors.push('Tên file quá dài (tối đa 255 ký tự)')
        }

        // Custom validation
        if (customValidation) {
            const customErrors = customValidation(file)
            if (customErrors) {
                errors.push(...(Array.isArray(customErrors) ? customErrors : [customErrors]))
            }
        }

        return {
            isValid: errors.length === 0,
            errors
        }
    }

    // Image compression
    const compressImage = async (file, options = {}) => {
        const {
            quality = parseFloat(import.meta.env.VITE_IMAGE_QUALITY) || 0.8,
            maxWidth = parseInt(import.meta.env.VITE_IMAGE_MAX_WIDTH) || 1920,
            maxHeight = parseInt(import.meta.env.VITE_IMAGE_MAX_HEIGHT) || 1080,
            convertToJPEG = false
        } = options

        return new Promise((resolve, reject) => {
            new Compressor(file, {
                quality,
                maxWidth,
                maxHeight,
                convertTypes: convertToJPEG ? ['image/png', 'image/webp'] : [],
                convertSize: 1000000, // 1MB threshold for conversion
                success: resolve,
                error: reject
            })
        })
    }

    // Generate thumbnail
    const generateThumbnail = async (file, size = 200) => {
        if (!file.type.startsWith('image/')) {
            return null
        }

        return new Promise((resolve) => {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            const img = new Image()

            img.onload = () => {
                // Calculate dimensions
                let { width, height } = img
                const maxSize = size

                if (width > height) {
                    if (width > maxSize) {
                        height = (height * maxSize) / width
                        width = maxSize
                    }
                } else {
                    if (height > maxSize) {
                        width = (width * maxSize) / height
                        height = maxSize
                    }
                }

                canvas.width = width
                canvas.height = height

                // Draw and convert to blob
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob(resolve, 'image/jpeg', 0.8)
            }

            img.src = URL.createObjectURL(file)
        })
    }

    // Create upload entry
    const createUpload = (file, options = {}) => {
        const uploadId = generateUploadId()

        const upload = {
            id: uploadId,
            file,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            progress: 0,
            status: 'pending', // pending, uploading, completed, failed, cancelled
            startTime: null,
            endTime: null,
            speed: 0,
            remainingTime: 0,
            uploadedBytes: 0,
            error: null,
            result: null,
            cancelToken: null,
            retryCount: 0,
            maxRetries: 3,
            ...options
        }

        uploads.value.set(uploadId, upload)
        return upload
    }

    // Main upload function
    const uploadFile = async (file, options = {}) => {
        const {
            endpoint = null,
            compress = true,
            generateThumb = true,
            validation = {},
            onProgress = null,
            onComplete = null,
            onError = null
        } = options

        // Validate file
        const validationResult = validateFile(file, validation)
        if (!validationResult.isValid) {
            const error = new Error(validationResult.errors.join(', '))
            errorUtils.handleFileUploadError(error, file.name)
            throw error
        }

        // Create upload entry
        const upload = createUpload(file, options)

        try {
            isUploading.value = true
            upload.status = 'uploading'
            upload.startTime = Date.now()

            let fileToUpload = file

            // Compress image if needed
            if (compress && file.type.startsWith('image/')) {
                try {
                    fileToUpload = await compressImage(file, options.compression)
                    upload.file = fileToUpload
                    upload.fileSize = fileToUpload.size
                } catch (compressionError) {
                    console.warn('Image compression failed, using original file:', compressionError)
                }
            }

            // Generate thumbnail
            let thumbnail = null
            if (generateThumb && file.type.startsWith('image/')) {
                try {
                    thumbnail = await generateThumbnail(fileToUpload)
                } catch (thumbnailError) {
                    console.warn('Thumbnail generation failed:', thumbnailError)
                }
            }

            // Prepare form data
            const formData = new FormData()
            formData.append('file', fileToUpload)

            if (thumbnail) {
                formData.append('thumbnail', thumbnail, `thumb_${file.name}`)
            }

            // Add metadata
            formData.append('originalName', file.name)
            formData.append('fileType', file.type)
            formData.append('fileSize', file.size.toString())

            // Determine upload endpoint
            const uploadEndpoint = endpoint || getUploadEndpoint(file.type)

            // Create cancel token
            const cancelSource = createCancelToken()
            upload.cancelToken = cancelSource

            // Upload configuration with progress tracking
            const config = createUploadConfig((progressEvent) => {
                const percentCompleted = Math.round(
                    (progressEvent.loaded * 100) / progressEvent.total
                )

                upload.progress = percentCompleted
                upload.uploadedBytes = progressEvent.loaded

                // Calculate speed and remaining time
                const elapsedTime = Date.now() - upload.startTime
                upload.speed = progressEvent.loaded / (elapsedTime / 1000) // bytes per second

                if (upload.speed > 0) {
                    const remainingBytes = progressEvent.total - progressEvent.loaded
                    upload.remainingTime = remainingBytes / upload.speed // seconds
                }

                // Call progress callback
                onProgress?.(percentCompleted, upload)
            })

            config.cancelToken = cancelSource.token

            // Make upload request
            const response = await apiClient.post(uploadEndpoint, formData, config)

            // Update upload status
            upload.status = 'completed'
            upload.endTime = Date.now()
            upload.progress = 100
            upload.result = response.data

            // Call completion callback
            onComplete?.(response.data, upload)

            toast.success(`Đã tải lên "${file.name}" thành công!`)

            return {
                success: true,
                data: response.data,
                upload
            }

        } catch (error) {
            upload.status = 'failed'
            upload.endTime = Date.now()
            upload.error = error

            // Handle cancellation
            if (error.name === 'CancelledError') {
                upload.status = 'cancelled'
                return { success: false, cancelled: true, upload }
            }

            // Call error callback
            onError?.(error, upload)

            // Log error
            errorUtils.handleFileUploadError(error, file.name, {
                uploadId: upload.id,
                fileSize: file.size,
                fileType: file.type
            })

            return { success: false, error, upload }

        } finally {
            isUploading.value = activeUploads.value.length > 0
        }
    }

    // Bulk upload
    const uploadFiles = async (files, options = {}) => {
        const {
            concurrent = 3,
            ...uploadOptions
        } = options

        const fileArray = Array.from(files)
        const results = []
        const chunks = []

        // Split files into chunks for concurrent upload
        for (let i = 0; i < fileArray.length; i += concurrent) {
            chunks.push(fileArray.slice(i, i + concurrent))
        }

        for (const chunk of chunks) {
            const chunkPromises = chunk.map(file => uploadFile(file, uploadOptions))
            const chunkResults = await Promise.allSettled(chunkPromises)
            results.push(...chunkResults.map(result =>
                result.status === 'fulfilled' ? result.value : { success: false, error: result.reason }
            ))
        }

        const successful = results.filter(r => r.success)
        const failed = results.filter(r => !r.success)

        if (successful.length > 0) {
            toast.success(`Đã tải lên ${successful.length}/${fileArray.length} file thành công!`)
        }

        if (failed.length > 0) {
            toast.error(`${failed.length} file tải lên thất bại`)
        }

        return {
            successful,
            failed,
            total: fileArray.length
        }
    }

    // Retry failed upload
    const retryUpload = async (uploadId) => {
        const upload = uploads.value.get(uploadId)
        if (!upload || upload.status !== 'failed') {
            return { success: false, error: 'Upload not found or not in failed state' }
        }

        if (upload.retryCount >= upload.maxRetries) {
            toast.error('Đã vượt quá số lần thử lại tối đa')
            return { success: false, error: 'Max retries exceeded' }
        }

        upload.retryCount++
        upload.status = 'pending'
        upload.error = null
        upload.progress = 0

        return await uploadFile(upload.file, upload.options)
    }

    // Cancel upload
    const cancelUpload = (uploadId) => {
        const upload = uploads.value.get(uploadId)
        if (!upload || upload.status !== 'uploading') {
            return false
        }

        if (upload.cancelToken) {
            upload.cancelToken.cancel('Upload cancelled by user')
        }

        upload.status = 'cancelled'
        toast.info(`Đã hủy tải lên "${upload.fileName}"`)
        return true
    }

    // Remove upload from list
    const removeUpload = (uploadId) => {
        const upload = uploads.value.get(uploadId)
        if (upload && upload.status === 'uploading') {
            cancelUpload(uploadId)
        }
        uploads.value.delete(uploadId)
    }

    // Clear completed uploads
    const clearCompleted = () => {
        for (const [id, upload] of uploads.value) {
            if (upload.status === 'completed') {
                uploads.value.delete(id)
            }
        }
    }

    // Clear all uploads
    const clearAll = () => {
        // Cancel active uploads first
        for (const [id, upload] of uploads.value) {
            if (upload.status === 'uploading') {
                cancelUpload(id)
            }
        }
        uploads.value.clear()
    }

    // Utility functions
    const getUploadEndpoint = (fileType) => {
        if (fileType.startsWith('image/')) {
            return ENDPOINTS.UPLOAD.IMAGE
        } else if (fileType.startsWith('video/')) {
            return ENDPOINTS.UPLOAD.VIDEO
        } else {
            return ENDPOINTS.UPLOAD.DOCUMENT
        }
    }

    const generateUploadId = () => {
        return `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 B'
        const k = 1024
        const sizes = ['B', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
    }

    const formatTimeRemaining = (seconds) => {
        if (seconds < 60) return `${Math.round(seconds)}s`
        if (seconds < 3600) return `${Math.round(seconds / 60)}m`
        return `${Math.round(seconds / 3600)}h`
    }

    const formatSpeed = (bytesPerSecond) => {
        return formatFileSize(bytesPerSecond) + '/s'
    }

    return {
        // State
        uploads,
        isUploading,
        uploadQueue,

        // Computed
        activeUploads,
        completedUploads,
        failedUploads,
        totalProgress,

        // Actions
        uploadFile,
        uploadFiles,
        retryUpload,
        cancelUpload,
        removeUpload,
        clearCompleted,
        clearAll,

        // Validation
        validateFile,

        // Image processing
        compressImage,
        generateThumbnail,

        // Utilities
        formatFileSize,
        formatTimeRemaining,
        formatSpeed,
        getUploadEndpoint
    }
}