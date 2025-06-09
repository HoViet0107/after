<!-- Registration page với multi-step form, validation và social registration -->

<template>
    <div class="register-view">
        <div class="container-fluid">
            <div class="row min-vh-100">
                <!-- Left Side - Registration Form -->
                <div class="col-lg-8">
                    <div class="register-section">
                        <div class="register-container">
                            <!-- Header -->
                            <div class="register-header text-center mb-4">
                                <div class="logo-section mb-3">
                                    <img src="/images/logo.svg" alt="Logo" class="brand-logo">
                                    <h2 class="brand-title">SocialApp</h2>
                                </div>
                                <h1 class="register-title">Tạo tài khoản mới</h1>
                                <p class="register-subtitle">Tham gia cộng đồng và kết nối với bạn bè</p>
                            </div>

                            <!-- Progress Steps -->
                            <div class="progress-steps mb-4">
                                <div class="step" :class="{ active: currentStep >= 1, completed: currentStep > 1 }">
                                    <div class="step-number">1</div>
                                    <span class="step-label">Thông tin cơ bản</span>
                                </div>
                                <div class="step" :class="{ active: currentStep >= 2, completed: currentStep > 2 }">
                                    <div class="step-number">2</div>
                                    <span class="step-label">Tài khoản</span>
                                </div>
                                <div class="step" :class="{ active: currentStep >= 3, completed: currentStep > 3 }">
                                    <div class="step-number">3</div>
                                    <span class="step-label">Xác minh</span>
                                </div>
                            </div>

                            <!-- Registration Form -->
                            <form @submit.prevent="handleSubmit" class="register-form">
                                <!-- Step 1: Basic Information -->
                                <div v-show="currentStep === 1" class="step-content">
                                    <h3 class="step-title">Thông tin cơ bản</h3>
                                    
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group mb-3">
                                                <label for="firstName" class="form-label">Họ và tên đệm *</label>
                                                <input type="text" v-model="form.firstName" id="firstName" 
                                                       class="form-control" :class="{ 'is-invalid': errors.firstName }"
                                                       placeholder="Nhập họ và tên đệm" required>
                                                <div v-if="errors.firstName" class="invalid-feedback">{{ errors.firstName }}</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group mb-3">
                                                <label for="lastName" class="form-label">Tên *</label>
                                                <input type="text" v-model="form.lastName" id="lastName" 
                                                       class="form-control" :class="{ 'is-invalid': errors.lastName }"
                                                       placeholder="Nhập tên" required>
                                                <div v-if="errors.lastName" class="invalid-feedback">{{ errors.lastName }}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="form-group mb-3">
                                                <label for="dateOfBirth" class="form-label">Ngày sinh *</label>
                                                <input type="date" v-model="form.dateOfBirth" id="dateOfBirth" 
                                                       class="form-control" :class="{ 'is-invalid': errors.dateOfBirth }"
                                                       :max="maxBirthDate" required>
                                                <div v-if="errors.dateOfBirth" class="invalid-feedback">{{ errors.dateOfBirth }}</div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="form-group mb-3">
                                                <label for="gender" class="form-label">Giới tính *</label>
                                                <select v-model="form.gender" id="gender" class="form-select" 
                                                        :class="{ 'is-invalid': errors.gender }" required>
                                                    <option value="">Chọn giới tính</option>
                                                    <option value="male">Nam</option>
                                                    <option value="female">Nữ</option>
                                                    <option value="other">Khác</option>
                                                    <option value="prefer_not_to_say">Không muốn tiết lộ</option>
                                                </select>
                                                <div v-if="errors.gender" class="invalid-feedback">{{ errors.gender }}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="form-group mb-3">
                                        <label for="phone" class="form-label">Số điện thoại</label>
                                        <div class="input-group">
                                            <select v-model="form.phoneCountryCode" class="form-select phone-country">
                                                <option value="+84">🇻🇳 +84</option>
                                                <option value="+1">🇺🇸 +1</option>
                                                <option value="+86">🇨🇳 +86</option>
                                                <option value="+81">🇯🇵 +81</option>
                                                <option value="+82">🇰🇷 +82</option>
                                            </select>
                                            <input type="tel" v-model="form.phone" id="phone" 
                                                   class="form-control" :class="{ 'is-invalid': errors.phone }"
                                                   placeholder="Nhập số điện thoại">
                                        </div>
                                        <div v-if="errors.phone" class="invalid-feedback">{{ errors.phone }}</div>
                                    </div>
                                </div>

                                <!-- Step 2: Account Information -->
                                <div v-show="currentStep === 2" class="step-content">
                                    <h3 class="step-title">Thông tin tài khoản</h3>
                                    
                                    <div class="form-group mb-3">
                                        <label for="email" class="form-label">Email *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i class="fas fa-envelope"></i>
                                            </span>
                                            <input type="email" v-model="form.email" id="email" 
                                                   class="form-control" :class="{ 'is-invalid': errors.email }"
                                                   placeholder="Nhập địa chỉ email" autocomplete="email" 
                                                   @blur="checkEmailAvailability" required>
                                        </div>
                                        <div v-if="errors.email" class="invalid-feedback">{{ errors.email }}</div>
                                        <div v-else-if="emailCheckStatus === 'checking'" class="form-text">
                                            <i class="fas fa-spinner fa-spin me-1"></i>
                                            Đang kiểm tra tính khả dụng...
                                        </div>
                                        <div v-else-if="emailCheckStatus === 'available'" class="form-text text-success">
                                            <i class="fas fa-check me-1"></i>
                                            Email khả dụng
                                        </div>
                                    </div>

                                    <div class="form-group mb-3">
                                        <label for="username" class="form-label">Tên người dùng *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">@</span>
                                            <input type="text" v-model="form.username" id="username" 
                                                   class="form-control" :class="{ 'is-invalid': errors.username }"
                                                   placeholder="Nhập tên người dùng" autocomplete="username"
                                                   @blur="checkUsernameAvailability" required>
                                        </div>
                                        <div v-if="errors.username" class="invalid-feedback">{{ errors.username }}</div>
                                        <div v-else-if="usernameCheckStatus === 'checking'" class="form-text">
                                            <i class="fas fa-spinner fa-spin me-1"></i>
                                            Đang kiểm tra tính khả dụng...
                                        </div>
                                        <div v-else-if="usernameCheckStatus === 'available'" class="form-text text-success">
                                            <i class="fas fa-check me-1"></i>
                                            Tên người dùng khả dụng
                                        </div>
                                        <div v-else class="form-text text-muted">
                                            Chỉ sử dụng chữ cái, số và dấu gạch dưới. Tối thiểu 3 ký tự.
                                        </div>
                                    </div>

                                    <div class="form-group mb-3">
                                        <label for="password" class="form-label">Mật khẩu *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i class="fas fa-lock"></i>
                                            </span>
                                            <input :type="showPassword ? 'text' : 'password'" v-model="form.password" 
                                                   id="password" class="form-control" :class="{ 'is-invalid': errors.password }"
                                                   placeholder="Nhập mật khẩu" autocomplete="new-password" 
                                                   @input="checkPasswordStrength" required>
                                            <button type="button" class="btn btn-outline-secondary" @click="togglePassword">
                                                <i :class="showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                            </button>
                                        </div>
                                        <div v-if="errors.password" class="invalid-feedback">{{ errors.password }}</div>
                                        
                                        <!-- Password Strength Indicator -->
                                        <div v-if="form.password" class="password-strength mt-2">
                                            <div class="strength-bar">
                                                <div class="strength-fill" :class="passwordStrength.class" 
                                                     :style="{ width: passwordStrength.percentage + '%' }"></div>
                                            </div>
                                            <div class="strength-text">
                                                <span :class="passwordStrength.class">{{ passwordStrength.text }}</span>
                                                <small class="text-muted ms-auto">{{ passwordStrength.score }}/5</small>
                                            </div>
                                            <ul class="password-requirements">
                                                <li :class="{ valid: passwordChecks.length }">
                                                    <i :class="passwordChecks.length ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
                                                    Ít nhất 8 ký tự
                                                </li>
                                                <li :class="{ valid: passwordChecks.lowercase }">
                                                    <i :class="passwordChecks.lowercase ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
                                                    Chữ cái thường
                                                </li>
                                                <li :class="{ valid: passwordChecks.uppercase }">
                                                    <i :class="passwordChecks.uppercase ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
                                                    Chữ cái hoa
                                                </li>
                                                <li :class="{ valid: passwordChecks.number }">
                                                    <i :class="passwordChecks.number ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
                                                    Chữ số
                                                </li>
                                                <li :class="{ valid: passwordChecks.special }">
                                                    <i :class="passwordChecks.special ? 'fas fa-check text-success' : 'fas fa-times text-danger'"></i>
                                                    Ký tự đặc biệt
                                                </li>
                                            </ul>
                                        </div>
                                    </div>

                                    <div class="form-group mb-3">
                                        <label for="confirmPassword" class="form-label">Xác nhận mật khẩu *</label>
                                        <div class="input-group">
                                            <span class="input-group-text">
                                                <i class="fas fa-lock"></i>
                                            </span>
                                            <input :type="showConfirmPassword ? 'text' : 'password'" 
                                                   v-model="form.confirmPassword" id="confirmPassword" 
                                                   class="form-control" :class="{ 'is-invalid': errors.confirmPassword }"
                                                   placeholder="Nhập lại mật khẩu" autocomplete="new-password" required>
                                            <button type="button" class="btn btn-outline-secondary" @click="toggleConfirmPassword">
                                                <i :class="showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'"></i>
                                            </button>
                                        </div>
                                        <div v-if="errors.confirmPassword" class="invalid-feedback">{{ errors.confirmPassword }}</div>
                                    </div>
                                </div>

                                <!-- Step 3: Verification & Terms -->
                                <div v-show="currentStep === 3" class="step-content">
                                    <h3 class="step-title">Xác minh và điều khoản</h3>
                                    
                                    <!-- reCAPTCHA -->
                                    <div class="form-group mb-4">
                                        <div ref="recaptcha" class="recaptcha-container d-flex justify-content-center"></div>
                                        <div v-if="errors.captcha" class="invalid-feedback d-block">{{ errors.captcha }}</div>
                                    </div>

                                    <!-- Terms and Privacy -->
                                    <div class="form-group mb-3">
                                        <div class="form-check">
                                            <input type="checkbox" v-model="form.agreeToTerms" id="agreeToTerms" 
                                                   class="form-check-input" :class="{ 'is-invalid': errors.agreeToTerms }" required>
                                            <label for="agreeToTerms" class="form-check-label">
                                                Tôi đồng ý với 
                                                <a href="/terms" target="_blank" class="text-primary">Điều khoản sử dụng</a> 
                                                và 
                                                <a href="/privacy" target="_blank" class="text-primary">Chính sách bảo mật</a>
                                            </label>
                                        </div>
                                        <div v-if="errors.agreeToTerms" class="invalid-feedback">{{ errors.agreeToTerms }}</div>
                                    </div>

                                    <div class="form-group mb-3">
                                        <div class="form-check">
                                            <input type="checkbox" v-model="form.subscribeToNewsletter" id="subscribeToNewsletter" 
                                                   class="form-check-input">
                                            <label for="subscribeToNewsletter" class="form-check-label">
                                                Đăng ký nhận thông báo về tính năng mới và cập nhật
                                            </label>
                                        </div>
                                    </div>

                                    <div class="form-group mb-4">
                                        <div class="form-check">
                                            <input type="checkbox" v-model="form.allowMarketing" id="allowMarketing" 
                                                   class="form-check-input">
                                            <label for="allowMarketing" class="form-check-label">
                                                Cho phép nhận email marketing và khuyến mãi
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <!-- Form Actions -->
                                <div class="form-actions">
                                    <button v-if="currentStep > 1" type="button" class="btn btn-outline-secondary me-3" 
                                            @click="previousStep" :disabled="isLoading">
                                        <i class="fas fa-arrow-left me-2"></i>
                                        Quay lại
                                    </button>
                                    
                                    <button v-if="currentStep < 3" type="button" class="btn btn-primary" 
                                            @click="nextStep" :disabled="!canProceedToNextStep">
                                        Tiếp theo
                                        <i class="fas fa-arrow-right ms-2"></i>
                                    </button>
                                    
                                    <button v-else type="submit" class="btn btn-success" 
                                            :disabled="isLoading || !canSubmit">
                                        <span v-if="isLoading" class="spinner-border spinner-border-sm me-2"></span>
                                        <i v-else class="fas fa-user-plus me-2"></i>
                                        {{ isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản' }}
                                    </button>
                                </div>
                            </form>

                            <!-- Social Register Divider -->
                            <div class="divider my-4">
                                <span>hoặc đăng ký với</span>
                            </div>

                            <!-- Social Register Buttons -->
                            <div class="social-register">
                                <button type="button" class="btn btn-google" @click="registerWithGoogle" :disabled="isLoading">
                                    <i class="fab fa-google me-2"></i>
                                    Google
                                </button>
                                <button type="button" class="btn btn-facebook" @click="registerWithFacebook" :disabled="isLoading">
                                    <i class="fab fa-facebook-f me-2"></i>
                                    Facebook
                                </button>
                                <button type="button" class="btn btn-github" @click="registerWithGithub" :disabled="isLoading">
                                    <i class="fab fa-github me-2"></i>
                                    GitHub
                                </button>
                            </div>

                            <!-- Login Link -->
                            <div class="login-link text-center mt-4">
                                <p class="mb-0">
                                    Đã có tài khoản? 
                                    <router-link to="/login" class="login-text">Đăng nhập ngay</router-link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Right Side - Benefits -->
                <div class="col-lg-4 d-none d-lg-block">
                    <div class="benefits-section">
                        <div class="benefits-content">
                            <h3 class="benefits-title">Tại sao chọn SocialApp?</h3>
                            
                            <div class="benefit-item" v-for="(benefit, index) in benefits" :key="benefit.id"
                                 data-aos="fade-left" :data-aos-delay="index * 100">
                                <div class="benefit-icon">
                                    <i :class="benefit.icon"></i>
                                </div>
                                <div class="benefit-content">
                                    <h4>{{ benefit.title }}</h4>
                                    <p>{{ benefit.description }}</p>
                                </div>
                            </div>

                            <div class="stats-section" data-aos="fade-up" data-aos-delay="400">
                                <h4 class="stats-title">Tham gia cộng đồng</h4>
                                <div class="stats-grid">
                                    <div class="stat-item" v-for="stat in stats" :key="stat.id">
                                        <div class="stat-number">{{ stat.number }}</div>
                                        <div class="stat-label">{{ stat.label }}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Email Verification Modal -->
        <EmailVerificationModal v-if="showEmailVerificationModal" :email="form.email"
                                @close="showEmailVerificationModal = false" @verified="handleEmailVerified" />
    </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToast } from 'vue-toastification'
import { validatePasswordStrength } from '@/utils/cryptoUtils'
import { debounce } from 'lodash-es'
import AOS from 'aos'
import EmailVerificationModal from '@/components/auth/EmailVerificationModal.vue'

// Router & Stores
const router = useRouter()
const authStore = useAuthStore()
const toast = useToast()

// Refs
const recaptcha = ref(null)

// State
const currentStep = ref(1)
const isLoading = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const captchaToken = ref(null)
const emailCheckStatus = ref('') // '', 'checking', 'available', 'unavailable'
const usernameCheckStatus = ref('') // '', 'checking', 'available', 'unavailable'
const showEmailVerificationModal = ref(false)

// Form data
const form = reactive({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    phone: '',
    phoneCountryCode: '+84',
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    agreeToTerms: false,
    subscribeToNewsletter: false,
    allowMarketing: false
})

// Validation errors
const errors = reactive({})

// Password strength
const passwordStrength = ref({ score: 0, text: '', class: '', percentage: 0 })
const passwordChecks = ref({
    length: false,
    lowercase: false,
    uppercase: false,
    number: false,
    special: false
})

// Data
const benefits = ref([
    {
        id: 1,
        icon: 'fas fa-users',
        title: 'Kết nối toàn cầu',
        description: 'Kết nối với hàng triệu người dùng trên khắp thế giới'
    },
    {
        id: 2,
        icon: 'fas fa-shield-alt',
        title: 'Bảo mật tuyệt đối',
        description: 'Thông tin của bạn được bảo vệ với công nghệ bảo mật hàng đầu'
    },
    {
        id: 3,
        icon: 'fas fa-mobile-alt',
        title: 'Đa nền tảng',
        description: 'Sử dụng trên mọi thiết bị, mọi lúc mọi nơi'
    },
    {
        id: 4,
        icon: 'fas fa-heart',
        title: 'Miễn phí',
        description: 'Tất cả tính năng cơ bản hoàn toàn miễn phí'
    }
])

const stats = ref([
    { id: 1, number: '2M+', label: 'Người dùng' },
    { id: 2, number: '50M+', label: 'Bài viết' },
    { id: 3, number: '150+', label: 'Quốc gia' },
    { id: 4, number: '99.9%', label: 'Uptime' }
])

// Computed
const maxBirthDate = computed(() => {
    const today = new Date()
    const minAge = new Date(today.getFullYear() - 13, today.getMonth(), today.getDate())
    return minAge.toISOString().split('T')[0]
})

const canProceedToNextStep = computed(() => {
    if (currentStep.value === 1) {
        return validateStep1()
    } else if (currentStep.value === 2) {
        return validateStep2()
    }
    return false
})

const canSubmit = computed(() => {
    return validateStep3() && captchaToken.value && !isLoading.value
})

// Methods
const validateStep1 = () => {
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender']
    return requiredFields.every(field => form[field].trim())
}

const validateStep2 = () => {
    return form.email && form.username && form.password && form.confirmPassword &&
           emailCheckStatus.value === 'available' && usernameCheckStatus.value === 'available' &&
           passwordStrength.value.score >= 3 && form.password === form.confirmPassword
}

const validateStep3 = () => {
    return form.agreeToTerms && captchaToken.value
}

const validateCurrentStep = () => {
    clearErrors()
    
    if (currentStep.value === 1) {
        return validateFormStep1()
    } else if (currentStep.value === 2) {
        return validateFormStep2()
    } else if (currentStep.value === 3) {
        return validateFormStep3()
    }
    
    return true
}

const validateFormStep1 = () => {
    let isValid = true

    if (!form.firstName.trim()) {
        errors.firstName = 'Vui lòng nhập họ và tên đệm'
        isValid = false
    }

    if (!form.lastName.trim()) {
        errors.lastName = 'Vui lòng nhập tên'
        isValid = false
    }

    if (!form.dateOfBirth) {
        errors.dateOfBirth = 'Vui lòng chọn ngày sinh'
        isValid = false
    } else {
        const birthDate = new Date(form.dateOfBirth)
        const today = new Date()
        const age = today.getFullYear() - birthDate.getFullYear()
        
        if (age < 13) {
            errors.dateOfBirth = 'Bạn phải từ 13 tuổi trở lên để đăng ký'
            isValid = false
        }
    }

    if (!form.gender) {
        errors.gender = 'Vui lòng chọn giới tính'
        isValid = false
    }

    if (form.phone && !validatePhone(form.phone)) {
        errors.phone = 'Số điện thoại không hợp lệ'
        isValid = false
    }

    return isValid
}

const validateFormStep2 = () => {
    let isValid = true

    if (!form.email) {
        errors.email = 'Vui lòng nhập email'
        isValid = false
    } else if (!isValidEmail(form.email)) {
        errors.email = 'Email không hợp lệ'
        isValid = false
    } else if (emailCheckStatus.value === 'unavailable') {
        errors.email = 'Email này đã được sử dụng'
        isValid = false
    }

    if (!form.username) {
        errors.username = 'Vui lòng nhập tên người dùng'
        isValid = false
    } else if (!isValidUsername(form.username)) {
        errors.username = 'Tên người dùng chỉ được chứa chữ cái, số và dấu gạch dưới'
        isValid = false
    } else if (form.username.length < 3) {
        errors.username = 'Tên người dùng phải có ít nhất 3 ký tự'
        isValid = false
    } else if (usernameCheckStatus.value === 'unavailable') {
        errors.username = 'Tên người dùng này đã được sử dụng'
        isValid = false
    }

    if (!form.password) {
        errors.password = 'Vui lòng nhập mật khẩu'
        isValid = false
    } else if (passwordStrength.value.score < 3) {
        errors.password = 'Mật khẩu chưa đủ mạnh'
        isValid = false
    }

    if (!form.confirmPassword) {
        errors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
        isValid = false
    } else if (form.password !== form.confirmPassword) {
        errors.confirmPassword = 'Mật khẩu xác nhận không khớp'
        isValid = false
    }

    return isValid
}

const validateFormStep3 = () => {
    let isValid = true

    if (!captchaToken.value) {
        errors.captcha = 'Vui lòng hoàn thành xác minh captcha'
        isValid = false
    }

    if (!form.agreeToTerms) {
        errors.agreeToTerms = 'Bạn phải đồng ý với điều khoản sử dụng'
        isValid = false
    }

    return isValid
}

const clearErrors = () => {
    Object.keys(errors).forEach(key => {
        delete errors[key]
    })
}

const nextStep = () => {
    if (validateCurrentStep() && canProceedToNextStep.value) {
        currentStep.value++
        
        if (currentStep.value === 3) {
            nextTick(() => initRecaptcha())
        }
    }
}

const previousStep = () => {
    if (currentStep.value > 1) {
        currentStep.value--
    }
}

const handleSubmit = async () => {
    if (!validateCurrentStep() || !canSubmit.value) return

    isLoading.value = true

    try {
        const registrationData = {
            ...form,
            fullName: `${form.firstName} ${form.lastName}`.trim(),
            captchaToken: captchaToken.value
        }

        const result = await authStore.register(registrationData)

        if (result.requiresEmailVerification) {
            showEmailVerificationModal.value = true
        } else {
            handleRegistrationSuccess()
        }

    } catch (error) {
        handleRegistrationError(error)
    } finally {
        isLoading.value = false
    }
}

const handleRegistrationSuccess = () => {
    toast.success('Đăng ký thành công!')
    router.push('/login?registered=true')
}

const handleRegistrationError = (error) => {
    if (error.field) {
        errors[error.field] = error.message
    } else {
        toast.error(error.message || 'Đăng ký thất bại. Vui lòng thử lại.')
    }

    // Reset captcha
    resetRecaptcha()
    captchaToken.value = null
}

const handleEmailVerified = () => {
    showEmailVerificationModal.value = false
    handleRegistrationSuccess()
}

// Validation helpers
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

const isValidUsername = (username) => {
    const usernameRegex = /^[a-zA-Z0-9_]+$/
    return usernameRegex.test(username)
}

const validatePhone = (phone) => {
    const phoneRegex = /^\d{9,15}$/
    return phoneRegex.test(phone.replace(/\s/g, ''))
}

// Availability checks
const checkEmailAvailability = debounce(async () => {
    if (!form.email || !isValidEmail(form.email)) return

    emailCheckStatus.value = 'checking'
    
    try {
        const isAvailable = await authStore.checkEmailAvailability(form.email)
        emailCheckStatus.value = isAvailable ? 'available' : 'unavailable'
        
        if (!isAvailable) {
            errors.email = 'Email này đã được sử dụng'
        }
    } catch (error) {
        emailCheckStatus.value = ''
    }
}, 500)

const checkUsernameAvailability = debounce(async () => {
    if (!form.username || !isValidUsername(form.username) || form.username.length < 3) return

    usernameCheckStatus.value = 'checking'
    
    try {
        const isAvailable = await authStore.checkUsernameAvailability(form.username)
        usernameCheckStatus.value = isAvailable ? 'available' : 'unavailable'
        
        if (!isAvailable) {
            errors.username = 'Tên người dùng này đã được sử dụng'
        }
    } catch (error) {
        usernameCheckStatus.value = ''
    }
}, 500)

// Password strength
const checkPasswordStrength = () => {
    if (!form.password) {
        passwordStrength.value = { score: 0, text: '', class: '', percentage: 0 }
        passwordChecks.value = {
            length: false,
            lowercase: false,
            uppercase: false,
            number: false,
            special: false
        }
        return
    }

    const result = validatePasswordStrength(form.password)
    passwordStrength.value = {
        score: result.score,
        text: result.strength,
        class: getStrengthClass(result.score),
        percentage: (result.score / 5) * 100
    }

    passwordChecks.value = {
        length: form.password.length >= 8,
        lowercase: /[a-z]/.test(form.password),
        uppercase: /[A-Z]/.test(form.password),
        number: /[0-9]/.test(form.password),
        special: /[^A-Za-z0-9]/.test(form.password)
    }
}

const getStrengthClass = (score) => {
    if (score < 2) return 'text-danger'
    if (score < 3) return 'text-warning'
    if (score < 4) return 'text-info'
    return 'text-success'
}

// Password visibility
const togglePassword = () => {
    showPassword.value = !showPassword.value
}

const toggleConfirmPassword = () => {
    showConfirmPassword.value = !showConfirmPassword.value
}

// Social registration
const registerWithGoogle = async () => {
    try {
        isLoading.value = true
        await authStore.registerWithGoogle()
        handleRegistrationSuccess()
    } catch (error) {
        toast.error('Đăng ký Google thất bại')
    } finally {
        isLoading.value = false
    }
}

const registerWithFacebook = async () => {
    try {
        isLoading.value = true
        await authStore.registerWithFacebook()
        handleRegistrationSuccess()
    } catch (error) {
        toast.error('Đăng ký Facebook thất bại')
    } finally {
        isLoading.value = false
    }
}

const registerWithGithub = async () => {
    try {
        isLoading.value = true
        await authStore.registerWithGithub()
        handleRegistrationSuccess()
    } catch (error) {
        toast.error('Đăng ký GitHub thất bại')
    } finally {
        isLoading.value = false
    }
}

// reCAPTCHA
const initRecaptcha = () => {
    if (typeof grecaptcha !== 'undefined' && recaptcha.value) {
        grecaptcha.render(recaptcha.value, {
            sitekey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
            callback: (token) => {
                captchaToken.value = token
                delete errors.captcha
            },
            'expired-callback': () => {
                captchaToken.value = null
            }
        })
    }
}

const resetRecaptcha = () => {
    if (typeof grecaptcha !== 'undefined') {
        grecaptcha.reset()
    }
}

// Lifecycle
onMounted(() => {
    // Initialize AOS
    AOS.init({
        duration: 800,
        once: true
    })

    // Load reCAPTCHA script
    loadRecaptchaScript()

    // Check if user is already logged in
    if (authStore.isLoggedIn) {
        router.replace('/feed')
    }
})

// Load reCAPTCHA script
const loadRecaptchaScript = () => {
    if (document.querySelector('script[src*="recaptcha"]')) return

    const script = document.createElement('script')
    script.src = 'https://www.google.com/recaptcha/api.js'
    script.async = true
    script.defer = true
    document.head.appendChild(script)
}
</script>

<style lang="scss" scoped>
.register-view {
    background: var(--bs-light);
    min-height: 100vh;
}

// Register Section
.register-section {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem 1rem;

    .register-container {
        width: 100%;
        max-width: 600px;

        .register-header {
            .logo-section {
                .brand-logo {
                    height: 50px;
                    margin-bottom: 0.5rem;
                }

                .brand-title {
                    font-size: 1.8rem;
                    font-weight: 700;
                    color: var(--bs-primary);
                    margin: 0;
                }
            }

            .register-title {
                font-size: 2rem;
                font-weight: 700;
                color: var(--bs-dark);
                margin-bottom: 0.5rem;
            }

            .register-subtitle {
                color: var(--bs-secondary);
                margin: 0;
            }
        }

        .progress-steps {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2rem;

            .step {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;

                &:not(:last-child)::after {
                    content: '';
                    position: absolute;
                    top: 20px;
                    left: 60%;
                    right: -40%;
                    height: 2px;
                    background: var(--bs-border-color);
                    z-index: 1;
                }

                &.completed::after {
                    background: var(--bs-success);
                }

                .step-number {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    background: var(--bs-light);
                    color: var(--bs-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                    position: relative;
                    z-index: 2;
                    transition: all 0.3s ease;
                }

                .step-label {
                    font-size: 0.9rem;
                    color: var(--bs-secondary);
                    text-align: center;
                    font-weight: 500;
                }

                &.active {
                    .step-number {
                        background: var(--bs-primary);
                        color: white;
                    }

                    .step-label {
                        color: var(--bs-primary);
                        font-weight: 600;
                    }
                }

                &.completed {
                    .step-number {
                        background: var(--bs-success);
                        color: white;
                    }

                    .step-label {
                        color: var(--bs-success);
                    }
                }
            }
        }

        .register-form {
            background: white;
            border-radius: 15px;
            padding: 2rem;
            box-shadow: 0 5px 15px rgba(0, 0, 0, 0.08);
            margin-bottom: 1rem;

            .step-content {
                .step-title {
                    font-size: 1.5rem;
                    font-weight: 600;
                    color: var(--bs-dark);
                    margin-bottom: 1.5rem;
                    text-align: center;
                }

                .form-group {
                    .form-label {
                        font-weight: 600;
                        color: var(--bs-dark);
                        margin-bottom: 0.5rem;
                    }

                    .input-group {
                        .input-group-text {
                            background: var(--bs-light);
                            border-right: none;
                            color: var(--bs-secondary);
                        }

                        .form-control,
                        .form-select {
                            border-left: none;

                            &:focus {
                                border-color: var(--bs-primary);
                                box-shadow: none;
                            }
                        }

                        .phone-country {
                            max-width: 120px;
                            border-right: none;
                        }
                    }

                    .password-strength {
                        .strength-bar {
                            height: 4px;
                            background: var(--bs-light);
                            border-radius: 2px;
                            overflow: hidden;
                            margin-bottom: 0.5rem;

                            .strength-fill {
                                height: 100%;
                                transition: all 0.3s ease;
                                border-radius: 2px;

                                &.text-danger {
                                    background: var(--bs-danger);
                                }

                                &.text-warning {
                                    background: var(--bs-warning);
                                }

                                &.text-info {
                                    background: var(--bs-info);
                                }

                                &.text-success {
                                    background: var(--bs-success);
                                }
                            }
                        }

                        .strength-text {
                            display: flex;
                            justify-content: space-between;
                            margin-bottom: 0.5rem;
                            font-size: 0.9rem;
                        }

                        .password-requirements {
                            list-style: none;
                            padding: 0;
                            margin: 0;
                            display: grid;
                            grid-template-columns: repeat(2, 1fr);
                            gap: 0.25rem;

                            li {
                                font-size: 0.8rem;
                                display: flex;
                                align-items: center;
                                gap: 0.5rem;

                                &.valid {
                                    color: var(--bs-success);
                                }
                            }
                        }
                    }

                    .recaptcha-container {
                        transform: scale(0.9);
                        transform-origin: center;
                    }
                }
            }

            .form-actions {
                display: flex;
                justify-content: center;
                margin-top: 2rem;

                .btn {
                    border-radius: 25px;
                    font-weight: 600;
                    padding: 0.75rem 2rem;
                    transition: transform 0.2s ease;

                    &:hover:not(:disabled) {
                        transform: translateY(-2px);
                    }

                    &.btn-primary {
                        background: linear-gradient(135deg, var(--bs-primary), var(--bs-secondary));
                        border: none;
                    }

                    &.btn-success {
                        background: linear-gradient(135deg, var(--bs-success), #198754);
                        border: none;
                    }
                }
            }
        }

        .divider {
            position: relative;
            text-align: center;
            margin: 1.5rem 0;

            &::before {
                content: '';
                position: absolute;
                top: 50%;
                left: 0;
                right: 0;
                height: 1px;
                background: var(--bs-border-color);
            }

            span {
                background: var(--bs-light);
                padding: 0 1rem;
                color: var(--bs-secondary);
                font-size: 0.9rem;
            }
        }

        .social-register {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
            margin-bottom: 1rem;

            .btn {
                border-radius: 25px;
                font-weight: 600;
                padding: 0.75rem 1rem;
                transition: transform 0.2s ease;

                &:hover:not(:disabled) {
                    transform: translateY(-2px);
                }

                &.btn-google {
                    background: #db4437;
                    border-color: #db4437;
                    color: white;

                    &:hover {
                        background: #c23321;
                        border-color: #c23321;
                    }
                }

                &.btn-facebook {
                    background: #3b5998;
                    border-color: #3b5998;
                    color: white;

                    &:hover {
                        background: #2d4373;
                        border-color: #2d4373;
                    }
                }

                &.btn-github {
                    background: #333;
                    border-color: #333;
                    color: white;

                    &:hover {
                        background: #222;
                        border-color: #222;
                    }
                }
            }
        }

        .login-link {
            .login-text {
                color: var(--bs-primary);
                text-decoration: none;
                font-weight: 600;

                &:hover {
                    text-decoration: underline;
                }
            }
        }
    }
}

// Benefits Section
.benefits-section {
    background: linear-gradient(135deg, var(--bs-primary) 0%, var(--bs-secondary) 100%);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    padding: 2rem;

    .benefits-content {
        max-width: 400px;

        .benefits-title {
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 2rem;
            text-align: center;
        }

        .benefit-item {
            display: flex;
            align-items: flex-start;
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);

            .benefit-icon {
                width: 50px;
                height: 50px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 1rem;
                flex-shrink: 0;

                i {
                    font-size: 1.25rem;
                }
            }

            .benefit-content {
                h4 {
                    font-size: 1.1rem;
                    font-weight: 600;
                    margin-bottom: 0.5rem;
                }

                p {
                    margin: 0;
                    opacity: 0.9;
                    font-size: 0.9rem;
                    line-height: 1.5;
                }
            }
        }

        .stats-section {
            text-align: center;
            padding: 2rem;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);

            .stats-title {
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 1.5rem;
            }

            .stats-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;

                .stat-item {
                    .stat-number {
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #ffd700;
                        display: block;
                        margin-bottom: 0.25rem;
                    }

                    .stat-label {
                        font-size: 0.8rem;
                        opacity: 0.9;
                    }
                }
            }
        }
    }
}

// Responsive
@media (max-width: 992px) {
    .register-section {
        .register-container {
            max-width: 500px;

            .register-form {
                .step-content {
                    .password-requirements {
                        grid-template-columns: 1fr;
                    }
                }

                .social-register {
                    grid-template-columns: 1fr;
                    gap: 0.5rem;
                }
            }
        }
    }
}

@media (max-width: 768px) {
    .register-section {
        padding: 1rem;

        .register-container {
            .progress-steps {
                .step {
                    .step-label {
                        font-size: 0.8rem;
                    }
                }
            }

            .register-form {
                padding: 1.5rem;

                .form-actions {
                    flex-direction: column;
                    gap: 1rem;

                    .btn {
                        width: 100%;
                    }
                }
            }
        }
    }
}

@media (max-width: 576px) {
    .register-section {
        .register-container {
            .progress-steps {
                .step {
                    .step-number {
                        width: 30px;
                        height: 30px;
                        font-size: 0.8rem;
                    }

                    .step-label {
                        display: none;
                    }

                    &:not(:last-child)::after {
                        top: 15px;
                    }
                }
            }

            .register-header {
                .register-title {
                    font-size: 1.75rem;
                }
            }

            .register-form {
                .step-content {
                    .step-title {
                        font-size: 1.25rem;
                    }

                    .password-strength {
                        .recaptcha-container {
                            transform: scale(0.8);
                        }
                    }
                }
            }
        }
    }
}
</style>