// src/utils/fileUtils.js
// File handling utilities với upload, download và validation

import { formatFileSize } from './stringUtils'

/**
 * Validate file theo restrictions
 * @param {File} file - File cần validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateFile = (file, options = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB
        minSize = 0,
        allowedTypes = [],
        allowedExtensions = [],
        requireExtension = false
    } = options

    const errors = []

    // Check if file exists
    if (!file) {
        errors.push('Không có file được chọn')
        return { isValid: false, errors, file: null }
    }

    // Get file extension
    const extension = getFileExtension(file.name).toLowerCase()

    // Check file size
    if (file.size > maxSize) {
        errors.push(`File quá lớn. Kích thước tối đa: ${formatFileSize(maxSize)}`)
    }

    if (file.size < minSize) {
        errors.push(`File quá nhỏ. Kích thước tối thiểu: ${formatFileSize(minSize)}`)
    }

    // Check file type
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.type)) {
        errors.push(`Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`)
    }

    // Check file extension
    if (allowedExtensions.length > 0 && !allowedExtensions.includes(extension)) {
        errors.push(`Phần mở rộng không được hỗ trợ. Chỉ chấp nhận: ${allowedExtensions.join(', ')}`)
    }

    // Require extension check
    if (requireExtension && !extension) {
        errors.push('File phải có phần mở rộng')
    }

    return {
        isValid: errors.length === 0,
        errors,
        file,
        metadata: {
            name: file.name,
            size: file.size,
            type: file.type,
            extension,
            lastModified: file.lastModified
        }
    }
}

/**
 * Upload file với progress tracking
 * @param {File} file - File cần upload
 * @param {string} uploadUrl - Upload endpoint
 * @param {Object} options - Upload options
 * @returns {Promise} Upload promise với progress
 */
export const uploadFile = (file, uploadUrl, options = {}) => {
    const {
        method = 'POST',
        headers = {},
        fieldName = 'file',
        additionalData = {},
        onProgress = null,
        onSuccess = null,
        onError = null,
        timeout = 30000
    } = options

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        const formData = new FormData()

        // Add file to form data
        formData.append(fieldName, file)

        // Add additional data
        Object.keys(additionalData).forEach(key => {
            formData.append(key, additionalData[key])
        })

        // Setup progress handler
        if (onProgress) {
            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = {
                        loaded: event.loaded,
                        total: event.total,
                        percentage: Math.round((event.loaded / event.total) * 100)
                    }
                    onProgress(progress)
                }
            })
        }

        // Setup completion handlers
        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const response = {
                    status: xhr.status,
                    data: xhr.responseText ? JSON.parse(xhr.responseText) : null,
                    headers: parseResponseHeaders(xhr.getAllResponseHeaders())
                }
                
                if (onSuccess) onSuccess(response)
                resolve(response)
            } else {
                const error = new Error(`Upload failed with status ${xhr.status}`)
                error.status = xhr.status
                error.response = xhr.responseText
                
                if (onError) onError(error)
                reject(error)
            }
        })

        xhr.addEventListener('error', () => {
            const error = new Error('Upload failed due to network error')
            if (onError) onError(error)
            reject(error)
        })

        xhr.addEventListener('timeout', () => {
            const error = new Error('Upload timed out')
            if (onError) onError(error)
            reject(error)
        })

        // Setup and send request
        xhr.open(method, uploadUrl)
        xhr.timeout = timeout

        // Set headers
        Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key])
        })

        xhr.send(formData)
    })
}

/**
 * Upload multiple files với batch processing
 * @param {Array<File>} files - Files cần upload
 * @param {string} uploadUrl - Upload endpoint
 * @param {Object} options - Upload options
 * @returns {Promise} Batch upload promise
 */
export const uploadMultipleFiles = async (files, uploadUrl, options = {}) => {
    const {
        concurrent = 3,
        onFileProgress = null,
        onOverallProgress = null,
        stopOnError = false
    } = options

    const results = []
    const errors = []
    let completed = 0

    // Create upload queue
    const uploadQueue = files.map((file, index) => ({
        file,
        index,
        status: 'pending'
    }))

    // Process uploads in batches
    const processBatch = async (batch) => {
        const promises = batch.map(async (item) => {
            try {
                item.status = 'uploading'
                
                const result = await uploadFile(item.file, uploadUrl, {
                    ...options,
                    onProgress: onFileProgress ? (progress) => {
                        onFileProgress(item.index, progress)
                    } : null
                })

                item.status = 'completed'
                results[item.index] = result
                completed++

                if (onOverallProgress) {
                    onOverallProgress({
                        completed,
                        total: files.length,
                        percentage: Math.round((completed / files.length) * 100)
                    })
                }

                return result
            } catch (error) {
                item.status = 'error'
                errors.push({ index: item.index, error })
                completed++

                if (onOverallProgress) {
                    onOverallProgress({
                        completed,
                        total: files.length,
                        percentage: Math.round((completed / files.length) * 100)
                    })
                }

                if (stopOnError) {
                    throw error
                }

                return null
            }
        })

        return Promise.all(promises)
    }

    // Process in concurrent batches
    for (let i = 0; i < uploadQueue.length; i += concurrent) {
        const batch = uploadQueue.slice(i, i + concurrent)
        await processBatch(batch)
    }

    return {
        results: results.filter(r => r !== null),
        errors,
        totalFiles: files.length,
        successCount: results.filter(r => r !== null).length,
        errorCount: errors.length
    }
}

/**
 * Download file từ URL
 * @param {string} url - File URL
 * @param {string} filename - Target filename
 * @param {Object} options - Download options
 * @returns {Promise} Download promise
 */
export const downloadFile = (url, filename, options = {}) => {
    const {
        onProgress = null,
        headers = {},
        timeout = 30000
    } = options

    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = {
                    loaded: event.loaded,
                    total: event.total,
                    percentage: Math.round((event.loaded / event.total) * 100)
                }
                onProgress(progress)
            }
        })

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                const blob = new Blob([xhr.response])
                const downloadUrl = window.URL.createObjectURL(blob)
                
                const link = document.createElement('a')
                link.href = downloadUrl
                link.download = filename
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                
                window.URL.revokeObjectURL(downloadUrl)
                resolve({ success: true, filename })
            } else {
                reject(new Error(`Download failed with status ${xhr.status}`))
            }
        })

        xhr.addEventListener('error', () => {
            reject(new Error('Download failed due to network error'))
        })

        xhr.addEventListener('timeout', () => {
            reject(new Error('Download timed out'))
        })

        xhr.open('GET', url)
        xhr.responseType = 'blob'
        xhr.timeout = timeout

        // Set headers
        Object.keys(headers).forEach(key => {
            xhr.setRequestHeader(key, headers[key])
        })

        xhr.send()
    })
}

/**
 * Create download link cho blob/file
 * @param {Blob|File} blob - Blob data
 * @param {string} filename - Download filename
 * @param {boolean} autoClick - Auto click download link
 */
export const createDownloadLink = (blob, filename, autoClick = true) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    
    link.href = url
    link.download = filename
    link.style.display = 'none'
    
    document.body.appendChild(link)
    
    if (autoClick) {
        link.click()
    }
    
    // Cleanup after a delay to ensure download starts
    setTimeout(() => {
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
    }, 100)
    
    return link
}

/**
 * Read file content
 * @param {File} file - File cần đọc
 * @param {string} readAs - Read method (text, dataURL, arrayBuffer, binaryString)
 * @returns {Promise} File content
 */
export const readFile = (file, readAs = 'text') => {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject(new Error('No file provided'))
            return
        }

        const reader = new FileReader()

        reader.onload = (event) => {
            resolve(event.target.result)
        }

        reader.onerror = () => {
            reject(new Error('Failed to read file'))
        }

        switch (readAs) {
            case 'text':
                reader.readAsText(file)
                break
            case 'dataURL':
                reader.readAsDataURL(file)
                break
            case 'arrayBuffer':
                reader.readAsArrayBuffer(file)
                break
            case 'binaryString':
                reader.readAsBinaryString(file)
                break
            default:
                reject(new Error(`Unsupported read method: ${readAs}`))
        }
    })
}

/**
 * Convert file to base64
 * @param {File} file - File cần convert
 * @returns {Promise<string>} Base64 string
 */
export const fileToBase64 = (file) => {
    return readFile(file, 'dataURL')
}

/**
 * Convert base64 to blob
 * @param {string} base64 - Base64 string
 * @param {string} mimeType - MIME type
 * @returns {Blob} Blob object
 */
export const base64ToBlob = (base64, mimeType = '') => {
    const byteCharacters = atob(base64.split(',')[1] || base64)
    const byteNumbers = new Array(byteCharacters.length)
    
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
}

/**
 * Get file extension từ filename
 * @param {string} filename - Filename
 * @returns {string} File extension
 */
export const getFileExtension = (filename) => {
    if (!filename || typeof filename !== 'string') return ''
    const lastDotIndex = filename.lastIndexOf('.')
    return lastDotIndex !== -1 ? filename.slice(lastDotIndex + 1) : ''
}

/**
 * Get filename without extension
 * @param {string} filename - Full filename
 * @returns {string} Filename without extension
 */
export const getFileNameWithoutExtension = (filename) => {
    if (!filename || typeof filename !== 'string') return ''
    const lastDotIndex = filename.lastIndexOf('.')
    return lastDotIndex !== -1 ? filename.slice(0, lastDotIndex) : filename
}

/**
 * Get MIME type từ file extension
 * @param {string} extension - File extension
 * @returns {string} MIME type
 */
export const getMimeTypeFromExtension = (extension) => {
    const mimeTypes = {
        // Images
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        bmp: 'image/bmp',
        ico: 'image/x-icon',

        // Documents
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ppt: 'application/vnd.ms-powerpoint',
        pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        
        // Text
        txt: 'text/plain',
        html: 'text/html',
        css: 'text/css',
        js: 'text/javascript',
        json: 'application/json',
        xml: 'text/xml',
        csv: 'text/csv',

        // Audio
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        ogg: 'audio/ogg',
        m4a: 'audio/mp4',

        // Video
        mp4: 'video/mp4',
        avi: 'video/x-msvideo',
        mov: 'video/quicktime',
        wmv: 'video/x-ms-wmv',
        flv: 'video/x-flv',
        webm: 'video/webm',

        // Archives
        zip: 'application/zip',
        rar: 'application/x-rar-compressed',
        '7z': 'application/x-7z-compressed',
        tar: 'application/x-tar',
        gz: 'application/gzip'
    }

    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream'
}

/**
 * Check if file là image
 * @param {File|string} file - File object hoặc MIME type string
 * @returns {boolean} True if image
 */
export const isImageFile = (file) => {
    const mimeType = typeof file === 'string' ? file : file.type
    return mimeType.startsWith('image/')
}

/**
 * Check if file là video
 * @param {File|string} file - File object hoặc MIME type string
 * @returns {boolean} True if video
 */
export const isVideoFile = (file) => {
    const mimeType = typeof file === 'string' ? file : file.type
    return mimeType.startsWith('video/')
}

/**
 * Check if file là audio
 * @param {File|string} file - File object hoặc MIME type string
 * @returns {boolean} True if audio
 */
export const isAudioFile = (file) => {
    const mimeType = typeof file === 'string' ? file : file.type
    return mimeType.startsWith('audio/')
}

/**
 * Check if file là document
 * @param {File|string} file - File object hoặc MIME type string
 * @returns {boolean} True if document
 */
export const isDocumentFile = (file) => {
    const mimeType = typeof file === 'string' ? file : file.type
    const documentTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'text/plain',
        'text/csv'
    ]
    return documentTypes.includes(mimeType)
}

/**
 * Generate unique filename để tránh conflicts
 * @param {string} originalName - Original filename
 * @param {Array<string>} existingNames - Existing filenames
 * @returns {string} Unique filename
 */
export const generateUniqueFilename = (originalName, existingNames = []) => {
    if (!existingNames.includes(originalName)) {
        return originalName
    }

    const nameWithoutExt = getFileNameWithoutExtension(originalName)
    const extension = getFileExtension(originalName)
    let counter = 1

    while (existingNames.includes(`${nameWithoutExt}(${counter}).${extension}`)) {
        counter++
    }

    return `${nameWithoutExt}(${counter}).${extension}`
}

/**
 * Chunk file thành parts nhỏ cho upload
 * @param {File} file - File cần chunk
 * @param {number} chunkSize - Size of each chunk in bytes
 * @returns {Array<Blob>} Array of file chunks
 */
export const chunkFile = (file, chunkSize = 1024 * 1024) => { // 1MB default
    const chunks = []
    let start = 0

    while (start < file.size) {
        const end = Math.min(start + chunkSize, file.size)
        chunks.push(file.slice(start, end))
        start = end
    }

    return chunks
}

/**
 * Parse response headers thành object
 * @param {string} headerString - Raw header string
 * @returns {Object} Parsed headers
 */
const parseResponseHeaders = (headerString) => {
    const headers = {}
    if (!headerString) return headers

    headerString.split('\r\n').forEach(line => {
        const parts = line.split(': ')
        if (parts.length === 2) {
            headers[parts[0].toLowerCase()] = parts[1]
        }
    })

    return headers
}

/**
 * Create file input element programmatically
 * @param {Object} options - Input options
 * @returns {HTMLInputElement} File input element
 */
export const createFileInput = (options = {}) => {
    const {
        accept = '',
        multiple = false,
        capture = false,
        onChange = null
    } = options

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = accept
    input.multiple = multiple
    if (capture) input.capture = capture
    input.style.display = 'none'

    if (onChange) {
        input.addEventListener('change', onChange)
    }

    return input
}

/**
 * Trigger file selection dialog
 * @param {Object} options - Selection options
 * @returns {Promise<FileList>} Selected files
 */
export const selectFiles = (options = {}) => {
    return new Promise((resolve) => {
        const input = createFileInput({
            ...options,
            onChange: (event) => {
                resolve(event.target.files)
                document.body.removeChild(input)
            }
        })

        document.body.appendChild(input)
        input.click()
    })
}