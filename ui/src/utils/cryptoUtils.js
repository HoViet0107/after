// Encryption utilities với AES, RSA, hashing và secure token generation

/**
 * Generate cryptographically secure random string
 * @param {number} length - Length of random string
 * @param {string} charset - Character set to use
 * @returns {string} Random string(e.g: 'vFMBSRKASMHgDQTEhNyzipBx3guhkjds')
 */
export const generateSecureRandom = (length = 32, charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        const array = new Uint8Array(length)
        window.crypto.getRandomValues(array)
        
        return Array.from(array, byte => charset[byte % charset.length]).join('')
    } else {
        // Fallback for environments without crypto.getRandomValues
        console.warn('crypto.getRandomValues not available, using less secure fallback')
        let result = ''
        for (let i = 0; i < length; i++) {
            result += charset.charAt(Math.floor(Math.random() * charset.length))
        }
        return result
    }
}

/**
 * Generate UUID v4 using crypto.getRandomValues
 * @returns {string} UUID v4 string
 */
export const generateSecureUUID = () => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        )
    } else {
        // Fallback
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0
            const v = c == 'x' ? r : (r & 0x3 | 0x8)
            return v.toString(16)
        })
    }
}

/**
 * Hash string using SHA-256
 * @param {string} message - Message to hash
 * @returns {Promise<string>} SHA-256 hash in hex format
 */
export const sha256 = async (message) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(message)
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Hash string using SHA-1 (less secure, for compatibility)
 * @param {string} message - Message to hash
 * @returns {Promise<string>} SHA-1 hash in hex format
 */
export const sha1 = async (message) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const msgBuffer = new TextEncoder().encode(message)
        const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer)
        const hashArray = Array.from(new Uint8Array(hashBuffer))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Generate HMAC
 * @param {string} message - Message to authenticate
 * @param {string} secret - Secret key
 * @param {string} algorithm - Hash algorithm (SHA-256, SHA-1, etc.)
 * @returns {Promise<string>} HMAC in hex format
 */
export const generateHMAC = async (message, secret, algorithm = 'SHA-256') => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const key = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(secret),
            { name: 'HMAC', hash: algorithm },
            false,
            ['sign']
        )
        
        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            new TextEncoder().encode(message)
        )
        
        const hashArray = Array.from(new Uint8Array(signature))
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Generate AES key
 * @param {number} length - Key length (128, 192, or 256)
 * @returns {Promise<CryptoKey>} AES key
 */
export const generateAESKey = async (length = 256) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        return await crypto.subtle.generateKey(
            {
                name: 'AES-GCM',
                length: length
            },
            true,
            ['encrypt', 'decrypt']
        )
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Encrypt data using AES-GCM
 * @param {string} plaintext - Data to encrypt
 * @param {CryptoKey} key - AES key
 * @param {Uint8Array} iv - Initialization vector (optional)
 * @returns {Promise<Object>} Encrypted data với IV
 */
export const encryptAES = async (plaintext, key, iv = null) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(plaintext)
        
        // Generate IV if not provided
        const initVector = iv || crypto.getRandomValues(new Uint8Array(12))
        
        const encrypted = await crypto.subtle.encrypt(
            {
                name: 'AES-GCM',
                iv: initVector
            },
            key,
            data
        )
        
        return {
            ciphertext: Array.from(new Uint8Array(encrypted)),
            iv: Array.from(initVector)
        }
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Decrypt data using AES-GCM
 * @param {Array} ciphertext - Encrypted data
 * @param {CryptoKey} key - AES key
 * @param {Array} iv - Initialization vector
 * @returns {Promise<string>} Decrypted plaintext
 */
export const decryptAES = async (ciphertext, key, iv) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const decrypted = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: new Uint8Array(iv)
            },
            key,
            new Uint8Array(ciphertext)
        )
        
        const decoder = new TextDecoder()
        return decoder.decode(decrypted)
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Export AES key to raw format
 * @param {CryptoKey} key - AES key
 * @returns {Promise<ArrayBuffer>} Raw key data
 */
export const exportAESKey = async (key) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        return await crypto.subtle.exportKey('raw', key)
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Import AES key from raw format
 * @param {ArrayBuffer} keyData - Raw key data
 * @returns {Promise<CryptoKey>} AES key
 */
export const importAESKey = async (keyData) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        return await crypto.subtle.importKey(
            'raw',
            keyData,
            { name: 'AES-GCM' },
            true,
            ['encrypt', 'decrypt']
        )
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Derive key from password using PBKDF2
 * @param {string} password - Password
 * @param {Uint8Array} salt - Salt (optional)
 * @param {number} iterations - Number of iterations
 * @param {number} keyLength - Key length in bits
 * @returns {Promise<Object>} Derived key và salt
 */
export const deriveKeyFromPassword = async (password, salt = null, iterations = 100000, keyLength = 256) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        // Generate salt if not provided
        const keySalt = salt || crypto.getRandomValues(new Uint8Array(16))
        
        // Import password as key material
        const keyMaterial = await crypto.subtle.importKey(
            'raw',
            new TextEncoder().encode(password),
            { name: 'PBKDF2' },
            false,
            ['deriveKey']
        )
        
        // Derive key
        const derivedKey = await crypto.subtle.deriveKey(
            {
                name: 'PBKDF2',
                salt: keySalt,
                iterations: iterations,
                hash: 'SHA-256'
            },
            keyMaterial,
            { name: 'AES-GCM', length: keyLength },
            true,
            ['encrypt', 'decrypt']
        )
        
        return {
            key: derivedKey,
            salt: Array.from(keySalt)
        }
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Generate RSA key pair
 * @param {number} keySize - Key size in bits (2048, 4096)
 * @returns {Promise<Object>} RSA key pair
 */
export const generateRSAKeyPair = async (keySize = 2048) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        return await crypto.subtle.generateKey(
            {
                name: 'RSA-OAEP',
                modulusLength: keySize,
                publicExponent: new Uint8Array([1, 0, 1]),
                hash: 'SHA-256'
            },
            true,
            ['encrypt', 'decrypt']
        )
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Encrypt data using RSA-OAEP
 * @param {string} plaintext - Data to encrypt
 * @param {CryptoKey} publicKey - RSA public key
 * @returns {Promise<Array>} Encrypted data
 */
export const encryptRSA = async (plaintext, publicKey) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(plaintext)
        
        const encrypted = await crypto.subtle.encrypt(
            { name: 'RSA-OAEP' },
            publicKey,
            data
        )
        
        return Array.from(new Uint8Array(encrypted))
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Decrypt data using RSA-OAEP
 * @param {Array} ciphertext - Encrypted data
 * @param {CryptoKey} privateKey - RSA private key
 * @returns {Promise<string>} Decrypted plaintext
 */
export const decryptRSA = async (ciphertext, privateKey) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'RSA-OAEP' },
            privateKey,
            new Uint8Array(ciphertext)
        )
        
        const decoder = new TextDecoder()
        return decoder.decode(decrypted)
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Sign data using RSA-PSS
 * @param {string} message - Message to sign
 * @param {CryptoKey} privateKey - RSA private key
 * @returns {Promise<Array>} Digital signature
 */
export const signRSA = async (message, privateKey) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(message)
        
        const signature = await crypto.subtle.sign(
            {
                name: 'RSA-PSS',
                saltLength: 32
            },
            privateKey,
            data
        )
        
        return Array.from(new Uint8Array(signature))
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Verify RSA signature
 * @param {string} message - Original message
 * @param {Array} signature - Digital signature
 * @param {CryptoKey} publicKey - RSA public key
 * @returns {Promise<boolean>} True if signature is valid
 */
export const verifyRSA = async (message, signature, publicKey) => {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        const encoder = new TextEncoder()
        const data = encoder.encode(message)
        
        return await crypto.subtle.verify(
            {
                name: 'RSA-PSS',
                saltLength: 32
            },
            publicKey,
            new Uint8Array(signature),
            data
        )
    } else {
        throw new Error('Web Crypto API not available')
    }
}

/**
 * Generate digital fingerprint của data
 * @param {string} data - Data to fingerprint
 * @returns {Promise<string>} Fingerprint hash
 */
export const generateFingerprint = async (data) => {
    const hash = await sha256(data)
    // Format as readable fingerprint (group by 4 characters)
    return hash.match(/.{1,4}/g).join(':').toUpperCase()
}

/**
 * Simple Base64 encoding (URL-safe)
 * @param {string} data - Data to encode
 * @returns {string} Base64 encoded string
 */
export const base64Encode = (data) => {
    if (typeof window !== 'undefined' && window.btoa) {
        return btoa(data)
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '')
    } else {
        throw new Error('btoa not available')
    }
}

/**
 * Simple Base64 decoding (URL-safe)
 * @param {string} encoded - Base64 encoded string
 * @returns {string} Decoded data
 */
export const base64Decode = (encoded) => {
    if (typeof window !== 'undefined' && window.atob) {
        // Add padding if needed
        let padded = encoded.replace(/-/g, '+').replace(/_/g, '/')
        while (padded.length % 4) {
            padded += '='
        }
        return atob(padded)
    } else {
        throw new Error('atob not available')
    }
}

/**
 * Generate secure session token
 * @param {number} length - Token length
 * @returns {string} Session token
 */
export const generateSessionToken = (length = 32) => {
    return generateSecureRandom(length, 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789')
}

/**
 * Generate API key
 * @param {string} prefix - Key prefix (optional)
 * @returns {string} API key
 */
export const generateAPIKey = (prefix = 'sk') => {
    const keyPart = generateSecureRandom(32)
    return `${prefix}_${keyPart}`
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result với score và feedback
 */
export const validatePasswordStrength = (password) => {
    let score = 0
    const feedback = []
    
    if (!password) {
        return { score: 0, strength: 'Very Weak', feedback: ['Password is required'] }
    }
    
    // Length check
    if (password.length >= 8) score += 1
    else feedback.push('Password should be at least 8 characters')
    
    if (password.length >= 12) score += 1
    
    // Character variety
    if (/[a-z]/.test(password)) score += 1
    else feedback.push('Add lowercase letters')
    
    if (/[A-Z]/.test(password)) score += 1
    else feedback.push('Add uppercase letters')
    
    if (/[0-9]/.test(password)) score += 1
    else feedback.push('Add numbers')
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1
    else feedback.push('Add special characters')
    
    // Common patterns (penalize)
    if (/(.)\1{2,}/.test(password)) {
        score -= 1
        feedback.push('Avoid repeated characters')
    }
    
    if (/123|abc|qwe/i.test(password)) {
        score -= 1
        feedback.push('Avoid common sequences')
    }
    
    // Determine strength
    let strength
    if (score < 2) strength = 'Very Weak'
    else if (score < 3) strength = 'Weak'
    else if (score < 4) strength = 'Fair'
    else if (score < 5) strength = 'Good'
    else strength = 'Strong'
    
    return {
        score: Math.max(0, score),
        strength,
        feedback: feedback.length ? feedback : ['Password looks good!']
    }
}

/**
 * Generate secure password
 * @param {number} length - Password length
 * @param {Object} options - Generation options
 * @returns {string} Generated password
 */
export const generateSecurePassword = (length = 16, options = {}) => {
    const {
        includeUppercase = true,
        includeLowercase = true,
        includeNumbers = true,
        includeSymbols = true,
        excludeSimilar = true,
        excludeAmbiguous = true
    } = options
    
    let charset = ''
    
    if (includeLowercase) charset += 'abcdefghijklmnopqrstuvwxyz'
    if (includeUppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (includeNumbers) charset += '0123456789'
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    if (excludeSimilar) {
        charset = charset.replace(/[il1Lo0O]/g, '')
    }
    
    if (excludeAmbiguous) {
        charset = charset.replace(/[{}[\]()\/\\'"~,;.<>]/g, '')
    }
    
    if (!charset) {
        throw new Error('No valid characters available for password generation')
    }
    
    return generateSecureRandom(length, charset)
}

/**
 * Encrypt object for local storage
 * @param {Object} obj - Object to encrypt
 * @param {string} password - Encryption password
 * @returns {Promise<string>} Encrypted data string
 */
export const encryptForStorage = async (obj, password) => {
    try {
        const jsonString = JSON.stringify(obj)
        const { key, salt } = await deriveKeyFromPassword(password)
        const { ciphertext, iv } = await encryptAES(jsonString, key)
        
        return JSON.stringify({
            ciphertext,
            iv,
            salt
        })
    } catch (error) {
        throw new Error('Failed to encrypt data for storage')
    }
}

/**
 * Decrypt object from local storage
 * @param {string} encryptedData - Encrypted data string
 * @param {string} password - Decryption password
 * @returns {Promise<Object>} Decrypted object
 */
export const decryptFromStorage = async (encryptedData, password) => {
    try {
        const { ciphertext, iv, salt } = JSON.parse(encryptedData)
        const { key } = await deriveKeyFromPassword(password, new Uint8Array(salt))
        const decryptedString = await decryptAES(ciphertext, key, iv)
        
        return JSON.parse(decryptedString)
    } catch (error) {
        throw new Error('Failed to decrypt data from storage')
    }
}

/**
 * Time-safe string comparison để prevent timing attacks
 * @param {string} a - First string
 * @param {string} b - Second string
 * @returns {boolean} True if strings are equal
 */
export const timeSafeCompare = (a, b) => {
    if (a.length !== b.length) {
        return false
    }
    
    let result = 0
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i)
    }
    
    return result === 0
}