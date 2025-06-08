// src/utils/imageUtils.js
// Image processing utilities với compression, resizing và optimization

/**
 * Compress image với quality control
 * @param {File} file - Image file
 * @param {number} quality - Compression quality (0-1)
 * @param {number} maxWidth - Max width
 * @param {number} maxHeight - Max height
 * @returns {Promise<Blob>} Compressed image blob
 */
export const compressImage = (file, quality = 0.8, maxWidth = 1920, maxHeight = 1080) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('File không phải là hình ảnh'))
            return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            // Calculate new dimensions
            let { width, height } = calculateDimensions(
                img.width, 
                img.height, 
                maxWidth, 
                maxHeight
            )

            canvas.width = width
            canvas.height = height

            // Enable image smoothing for better quality
            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            // Draw and compress
            ctx.drawImage(img, 0, 0, width, height)

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Không thể compress hình ảnh'))
                }
            }, file.type, quality)
        }

        img.onerror = () => reject(new Error('Không thể load hình ảnh'))
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Resize image theo dimensions cụ thể
 * @param {File} file - Image file
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {boolean} maintainAspectRatio - Giữ aspect ratio
 * @returns {Promise<Blob>} Resized image blob
 */
export const resizeImage = (file, width, height, maintainAspectRatio = true) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('File không phải là hình ảnh'))
            return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            let targetWidth = width
            let targetHeight = height

            if (maintainAspectRatio) {
                const dimensions = calculateDimensions(img.width, img.height, width, height)
                targetWidth = dimensions.width
                targetHeight = dimensions.height
            }

            canvas.width = targetWidth
            canvas.height = targetHeight

            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Không thể resize hình ảnh'))
                }
            }, file.type, 0.9)
        }

        img.onerror = () => reject(new Error('Không thể load hình ảnh'))
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Create thumbnail từ image
 * @param {File} file - Image file
 * @param {number} size - Thumbnail size (square)
 * @param {boolean} crop - Crop to square or fit
 * @returns {Promise<Blob>} Thumbnail blob
 */
export const createThumbnail = (file, size = 150, crop = true) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('File không phải là hình ảnh'))
            return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            canvas.width = size
            canvas.height = size

            ctx.imageSmoothingEnabled = true
            ctx.imageSmoothingQuality = 'high'

            if (crop) {
                // Crop to center square
                const minDimension = Math.min(img.width, img.height)
                const sx = (img.width - minDimension) / 2
                const sy = (img.height - minDimension) / 2
                
                ctx.drawImage(
                    img, 
                    sx, sy, minDimension, minDimension,
                    0, 0, size, size
                )
            } else {
                // Fit within square
                const dimensions = calculateDimensions(img.width, img.height, size, size)
                const x = (size - dimensions.width) / 2
                const y = (size - dimensions.height) / 2
                
                ctx.drawImage(img, x, y, dimensions.width, dimensions.height)
            }

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Không thể tạo thumbnail'))
                }
            }, 'image/jpeg', 0.8)
        }

        img.onerror = () => reject(new Error('Không thể load hình ảnh'))
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Calculate dimensions giữ aspect ratio
 * @param {number} originalWidth - Original width
 * @param {number} originalHeight - Original height
 * @param {number} maxWidth - Max width
 * @param {number} maxHeight - Max height
 * @returns {Object} New dimensions {width, height}
 */
export const calculateDimensions = (originalWidth, originalHeight, maxWidth, maxHeight) => {
    const aspectRatio = originalWidth / originalHeight

    let width = originalWidth
    let height = originalHeight

    // Scale down if necessary
    if (width > maxWidth) {
        width = maxWidth
        height = width / aspectRatio
    }

    if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
    }

    return {
        width: Math.round(width),
        height: Math.round(height)
    }
}

/**
 * Validate image file
 * @param {File} file - File cần validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
export const validateImage = (file, options = {}) => {
    const {
        maxSize = 10 * 1024 * 1024, // 10MB
        minSize = 1024, // 1KB
        allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
        maxWidth = 4096,
        maxHeight = 4096,
        minWidth = 50,
        minHeight = 50
    } = options

    const errors = []

    // Check if file exists
    if (!file) {
        errors.push('Không có file được chọn')
        return { isValid: false, errors }
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
        errors.push(`Loại file không được hỗ trợ. Chỉ chấp nhận: ${allowedTypes.join(', ')}`)
    }

    // Check file size
    if (file.size > maxSize) {
        errors.push(`File quá lớn. Kích thước tối đa: ${formatFileSize(maxSize)}`)
    }

    if (file.size < minSize) {
        errors.push(`File quá nhỏ. Kích thước tối thiểu: ${formatFileSize(minSize)}`)
    }

    return {
        isValid: errors.length === 0,
        errors,
        // Return promise to validate dimensions
        validateDimensions: () => validateImageDimensions(file, { maxWidth, maxHeight, minWidth, minHeight })
    }
}

/**
 * Validate image dimensions
 * @param {File} file - Image file
 * @param {Object} options - Dimension options
 * @returns {Promise<Object>} Validation result
 */
export const validateImageDimensions = (file, options = {}) => {
    const { maxWidth = 4096, maxHeight = 4096, minWidth = 50, minHeight = 50 } = options

    return new Promise((resolve) => {
        const img = new Image()
        
        img.onload = () => {
            const errors = []

            if (img.width > maxWidth) {
                errors.push(`Chiều rộng quá lớn. Tối đa: ${maxWidth}px`)
            }

            if (img.height > maxHeight) {
                errors.push(`Chiều cao quá lớn. Tối đa: ${maxHeight}px`)
            }

            if (img.width < minWidth) {
                errors.push(`Chiều rộng quá nhỏ. Tối thiểu: ${minWidth}px`)
            }

            if (img.height < minHeight) {
                errors.push(`Chiều cao quá nhỏ. Tối thiểu: ${minHeight}px`)
            }

            resolve({
                isValid: errors.length === 0,
                errors,
                dimensions: {
                    width: img.width,
                    height: img.height,
                    aspectRatio: img.width / img.height
                }
            })

            URL.revokeObjectURL(img.src)
        }

        img.onerror = () => {
            resolve({
                isValid: false,
                errors: ['Không thể đọc dimensions của hình ảnh'],
                dimensions: null
            })
            URL.revokeObjectURL(img.src)
        }

        img.src = URL.createObjectURL(file)
    })
}

/**
 * Convert image to different format
 * @param {File} file - Original image file
 * @param {string} targetFormat - Target format (image/jpeg, image/png, etc.)
 * @param {number} quality - Quality for lossy formats
 * @returns {Promise<Blob>} Converted image blob
 */
export const convertImageFormat = (file, targetFormat = 'image/jpeg', quality = 0.9) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('File không phải là hình ảnh'))
            return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height

            // Fill white background for JPEG
            if (targetFormat === 'image/jpeg') {
                ctx.fillStyle = '#FFFFFF'
                ctx.fillRect(0, 0, canvas.width, canvas.height)
            }

            ctx.drawImage(img, 0, 0)

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Không thể convert hình ảnh'))
                }
            }, targetFormat, quality)
        }

        img.onerror = () => reject(new Error('Không thể load hình ảnh'))
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Extract EXIF data từ image
 * @param {File} file - Image file
 * @returns {Promise<Object>} EXIF data
 */
export const extractExifData = (file) => {
    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('File không phải là hình ảnh'))
            return
        }

        const reader = new FileReader()
        
        reader.onload = (e) => {
            try {
                const arrayBuffer = e.target.result
                const dataView = new DataView(arrayBuffer)
                
                // Simple EXIF extraction (basic implementation)
                const exifData = {
                    hasExif: false,
                    orientation: 1,
                    make: null,
                    model: null,
                    dateTime: null
                }

                // Check for EXIF marker
                if (dataView.getUint16(0) === 0xFFD8 && dataView.getUint16(2) === 0xFFE1) {
                    exifData.hasExif = true
                    // More detailed EXIF parsing would go here
                }

                resolve(exifData)
            } catch (error) {
                reject(new Error('Không thể đọc EXIF data'))
            }
        }

        reader.onerror = () => reject(new Error('Không thể đọc file'))
        reader.readAsArrayBuffer(file)
    })
}

/**
 * Apply image filters
 * @param {File} file - Image file
 * @param {Object} filters - Filter options
 * @returns {Promise<Blob>} Filtered image blob
 */
export const applyImageFilters = (file, filters = {}) => {
    const {
        brightness = 100,
        contrast = 100,
        saturation = 100,
        hue = 0,
        blur = 0,
        grayscale = 0,
        sepia = 0
    } = filters

    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('File không phải là hình ảnh'))
            return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            canvas.width = img.width
            canvas.height = img.height

            // Apply CSS filters
            ctx.filter = `
                brightness(${brightness}%)
                contrast(${contrast}%)
                saturate(${saturation}%)
                hue-rotate(${hue}deg)
                blur(${blur}px)
                grayscale(${grayscale}%)
                sepia(${sepia}%)
            `

            ctx.drawImage(img, 0, 0)

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Không thể apply filters'))
                }
            }, file.type, 0.9)
        }

        img.onerror = () => reject(new Error('Không thể load hình ảnh'))
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Create image collage từ multiple images
 * @param {Array<File>} files - Array of image files
 * @param {Object} options - Collage options
 * @returns {Promise<Blob>} Collage image blob
 */
export const createImageCollage = (files, options = {}) => {
    const {
        width = 800,
        height = 600,
        padding = 10,
        backgroundColor = '#ffffff'
    } = options

    return new Promise((resolve, reject) => {
        if (!files || files.length === 0) {
            reject(new Error('Không có hình ảnh để tạo collage'))
            return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        canvas.width = width
        canvas.height = height

        // Fill background
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, width, height)

        const loadImages = files.map(file => {
            return new Promise((resolveImg) => {
                const img = new Image()
                img.onload = () => resolveImg(img)
                img.onerror = () => resolveImg(null)
                img.src = URL.createObjectURL(file)
            })
        })

        Promise.all(loadImages).then(images => {
            const validImages = images.filter(img => img !== null)
            
            if (validImages.length === 0) {
                reject(new Error('Không thể load hình ảnh nào'))
                return
            }

            // Calculate layout
            const cols = Math.ceil(Math.sqrt(validImages.length))
            const rows = Math.ceil(validImages.length / cols)
            
            const cellWidth = (width - padding * (cols + 1)) / cols
            const cellHeight = (height - padding * (rows + 1)) / rows

            validImages.forEach((img, index) => {
                const col = index % cols
                const row = Math.floor(index / cols)
                
                const x = padding + col * (cellWidth + padding)
                const y = padding + row * (cellHeight + padding)

                // Calculate dimensions to fit in cell
                const dimensions = calculateDimensions(
                    img.width, 
                    img.height, 
                    cellWidth, 
                    cellHeight
                )

                const centerX = x + (cellWidth - dimensions.width) / 2
                const centerY = y + (cellHeight - dimensions.height) / 2

                ctx.drawImage(img, centerX, centerY, dimensions.width, dimensions.height)
            })

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Không thể tạo collage'))
                }
            }, 'image/jpeg', 0.9)
        })
    })
}

/**
 * Generate image placeholder
 * @param {number} width - Placeholder width
 * @param {number} height - Placeholder height
 * @param {string} text - Placeholder text
 * @param {Object} options - Style options
 * @returns {string} Data URL of placeholder
 */
export const generatePlaceholder = (width = 300, height = 200, text = '', options = {}) => {
    const {
        backgroundColor = '#f0f0f0',
        textColor = '#666666',
        fontSize = 16,
        fontFamily = 'Arial, sans-serif'
    } = options

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    canvas.width = width
    canvas.height = height

    // Fill background
    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, width, height)

    // Draw text
    if (text) {
        ctx.fillStyle = textColor
        ctx.font = `${fontSize}px ${fontFamily}`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(text, width / 2, height / 2)
    }

    return canvas.toDataURL()
}

/**
 * Crop image theo coordinates
 * @param {File} file - Image file
 * @param {Object} cropData - Crop coordinates {x, y, width, height}
 * @returns {Promise<Blob>} Cropped image blob
 */
export const cropImage = (file, cropData) => {
    const { x, y, width, height } = cropData

    return new Promise((resolve, reject) => {
        if (!file || !file.type.startsWith('image/')) {
            reject(new Error('File không phải là hình ảnh'))
            return
        }

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()

        img.onload = () => {
            canvas.width = width
            canvas.height = height

            ctx.drawImage(
                img,
                x, y, width, height,
                0, 0, width, height
            )

            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob)
                } else {
                    reject(new Error('Không thể crop hình ảnh'))
                }
            }, file.type, 0.9)
        }

        img.onerror = () => reject(new Error('Không thể load hình ảnh'))
        img.src = URL.createObjectURL(file)
    })
}

/**
 * Helper function - Format file size
 */
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}