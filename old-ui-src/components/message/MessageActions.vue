<!-- Component hành động tin nhắn với WebSocket real-time và Redis caching -->

<template>
    <div class="message-actions">
        <!-- Quick Actions (Always Visible) -->
        <div class="quick-actions" :class="{ 'show': showQuickActions || alwaysShowActions }">
            <!-- React/Emoji -->
            <div class="action-group reactions-group">
                <div class="dropdown">
                    <button type="button" class="action-btn reaction-btn" :class="{ 'active': hasUserReaction }"
                        data-bs-toggle="dropdown" data-bs-auto-close="outside" title="Thêm biểu cảm"
                        @click="handleReactionClick">
                        <i class="fas fa-smile"></i>
                    </button>

                    <!-- Emoji Picker Dropdown -->
                    <div class="dropdown-menu emoji-picker">
                        <div class="emoji-picker-header">
                            <h6 class="mb-0">Chọn biểu cảm</h6>
                            <div class="emoji-categories">
                                <button v-for="category in emojiCategories" :key="category.id" type="button"
                                    class="category-btn" :class="{ active: activeEmojiCategory === category.id }"
                                    @click="setEmojiCategory(category.id)" :title="category.name">
                                    {{ category.icon }}
                                </button>
                            </div>
                        </div>

                        <div class="emoji-picker-body">
                            <div class="emoji-grid">
                                <button v-for="emoji in currentCategoryEmojis" :key="emoji.code" type="button"
                                    class="emoji-btn" @click="addReaction(emoji)" :title="emoji.name">
                                    {{ emoji.emoji }}
                                </button>
                            </div>
                        </div>

                        <!-- Frequently Used -->
                        <div v-if="frequentEmojis.length > 0" class="emoji-frequent">
                            <div class="frequent-header">Thường dùng</div>
                            <div class="frequent-emojis">
                                <button v-for="emoji in frequentEmojis" :key="emoji.code" type="button"
                                    class="emoji-btn" @click="addReaction(emoji)" :title="emoji.name">
                                    {{ emoji.emoji }}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Quick Reactions (Most Common) -->
                <div class="quick-reactions">
                    <button v-for="quickEmoji in quickReactions" :key="quickEmoji.code" type="button"
                        class="action-btn quick-reaction-btn" :class="{ 'active': hasReaction(quickEmoji.code) }"
                        @click="toggleReaction(quickEmoji)" :title="quickEmoji.name">
                        {{ quickEmoji.emoji }}
                    </button>
                </div>
            </div>

            <!-- Reply -->
            <button type="button" class="action-btn reply-btn" @click="replyToMessage" title="Trả lời">
                <i class="fas fa-reply"></i>
            </button>

            <!-- Forward -->
            <button v-if="canForward" type="button" class="action-btn forward-btn" @click="forwardMessage"
                title="Chuyển tiếp">
                <i class="fas fa-share"></i>
            </button>

            <!-- More Actions -->
            <div class="dropdown">
                <button type="button" class="action-btn more-btn dropdown-toggle" data-bs-toggle="dropdown"
                    title="Thêm hành động">
                    <i class="fas fa-ellipsis-h"></i>
                </button>

                <ul class="dropdown-menu dropdown-menu-end">
                    <!-- Copy -->
                    <li>
                        <button class="dropdown-item" @click="copyMessage">
                            <i class="fas fa-copy me-2"></i>Sao chép
                        </button>
                    </li>

                    <!-- Quote -->
                    <li>
                        <button class="dropdown-item" @click="quoteMessage">
                            <i class="fas fa-quote-right me-2"></i>Trích dẫn
                        </button>
                    </li>

                    <!-- Pin/Unpin -->
                    <li v-if="canPin">
                        <button class="dropdown-item" @click="togglePin">
                            <i :class="message?.isPinned ? 'fas fa-thumbtack text-warning' : 'far fa-thumbtack'"
                                class="me-2"></i>
                            {{ message?.isPinned ? 'Bỏ ghim' : 'Ghim tin nhắn' }}
                        </button>
                    </li>

                    <!-- Star/Unstar -->
                    <li>
                        <button class="dropdown-item" @click="toggleStar">
                            <i :class="message?.isStarred ? 'fas fa-star text-warning' : 'far fa-star'"
                                class="me-2"></i>
                            {{ message?.isStarred ? 'Bỏ đánh dấu' : 'Đánh dấu' }}
                        </button>
                    </li>

                    <!-- Remind -->
                    <li>
                        <button class="dropdown-item" @click="setReminder">
                            <i class="fas fa-bell me-2"></i>Nhắc nhở
                        </button>
                    </li>

                    <li>
                        <hr class="dropdown-divider">
                    </li>

                    <!-- Message Info -->
                    <li>
                        <button class="dropdown-item" @click="showMessageInfo">
                            <i class="fas fa-info-circle me-2"></i>Thông tin tin nhắn
                        </button>
                    </li>

                    <!-- Translation -->
                    <li v-if="canTranslate">
                        <button class="dropdown-item" @click="translateMessage">
                            <i class="fas fa-language me-2"></i>Dịch tin nhắn
                        </button>
                    </li>

                    <!-- Report (for others' messages) -->
                    <li v-if="!isOwnMessage">
                        <button class="dropdown-item text-warning" @click="reportMessage">
                            <i class="fas fa-flag me-2"></i>Báo cáo
                        </button>
                    </li>

                    <!-- Edit (own messages) -->
                    <li v-if="canEdit">
                        <button class="dropdown-item" @click="editMessage">
                            <i class="fas fa-edit me-2"></i>Chỉnh sửa
                        </button>
                    </li>

                    <!-- Delete -->
                    <li v-if="canDelete">
                        <button class="dropdown-item text-danger" @click="deleteMessage">
                            <i class="fas fa-trash me-2"></i>
                            {{ isOwnMessage ? 'Xóa tin nhắn' : 'Xóa cho tôi' }}
                        </button>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Existing Reactions Display -->
        <div v-if="messageReactions.length > 0" class="reactions-display">
            <div v-for="reaction in groupedReactions" :key="reaction.emoji" class="reaction-item"
                :class="{ 'user-reacted': reaction.userReacted }"
                @click="toggleReaction({ emoji: reaction.emoji, code: reaction.emoji })"
                :title="getReactionTooltip(reaction)">
                <span class="reaction-emoji">{{ reaction.emoji }}</span>
                <span class="reaction-count">{{ reaction.count }}</span>
            </div>

            <!-- Add More Reactions -->
            <div class="dropdown">
                <button type="button" class="reaction-item add-reaction" data-bs-toggle="dropdown"
                    title="Thêm biểu cảm">
                    <i class="fas fa-plus"></i>
                </button>

                <div class="dropdown-menu emoji-picker-mini">
                    <div class="emoji-grid-mini">
                        <button v-for="emoji in quickReactions" :key="emoji.code" type="button" class="emoji-btn-mini"
                            @click="addReaction(emoji)" :title="emoji.name">
                            {{ emoji.emoji }}
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Message Status Indicators -->
        <div class="message-status">
            <!-- Edited Indicator -->
            <span v-if="message?.isEdited" class="status-indicator edited" title="Tin nhắn đã chỉnh sửa">
                <i class="fas fa-edit"></i>
            </span>

            <!-- Pinned Indicator -->
            <span v-if="message?.isPinned" class="status-indicator pinned" title="Tin nhắn đã ghim">
                <i class="fas fa-thumbtack"></i>
            </span>

            <!-- Starred Indicator -->
            <span v-if="message?.isStarred" class="status-indicator starred" title="Tin nhắn đã đánh dấu">
                <i class="fas fa-star"></i>
            </span>

            <!-- Read Status (for sent messages) -->
            <div v-if="isOwnMessage && message?.readBy" class="read-status">
                <div class="read-avatars">
                    <img v-for="reader in message.readBy.slice(0, 3)" :key="reader.id"
                        :src="reader.avatar || '/default-avatar.png'" :alt="reader.name" class="read-avatar"
                        :title="`Đã đọc bởi ${reader.name}`" />
                    <span v-if="message.readBy.length > 3" class="read-count"
                        :title="`Và ${message.readBy.length - 3} người khác`">
                        +{{ message.readBy.length - 3 }}
                    </span>
                </div>
            </div>
        </div>

        <!-- Modals -->
        <!-- Message Info Modal -->
        <div v-if="showInfoModal" class="modal fade show d-block" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Thông tin tin nhắn</h5>
                        <button type="button" class="btn-close" @click="showInfoModal = false"></button>
                    </div>
                    <div class="modal-body">
                        <div class="message-info-content">
                            <div class="info-section">
                                <h6>Chi tiết</h6>
                                <div class="info-item">
                                    <span class="info-label">Người gửi:</span>
                                    <span class="info-value">{{ message?.sender?.name }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Thời gian gửi:</span>
                                    <span class="info-value">{{ formatDetailedTime(message?.createdAt) }}</span>
                                </div>
                                <div v-if="message?.editedAt" class="info-item">
                                    <span class="info-label">Chỉnh sửa lần cuối:</span>
                                    <span class="info-value">{{ formatDetailedTime(message?.editedAt) }}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Loại tin nhắn:</span>
                                    <span class="info-value">{{ getMessageTypeText(message?.type) }}</span>
                                </div>
                            </div>

                            <div v-if="message?.readBy?.length > 0" class="info-section">
                                <h6>Đã đọc bởi ({{ message.readBy.length }})</h6>
                                <div class="readers-list">
                                    <div v-for="reader in message.readBy" :key="reader.id" class="reader-item">
                                        <img :src="reader.avatar || '/default-avatar.png'" :alt="reader.name" />
                                        <div class="reader-info">
                                            <div class="reader-name">{{ reader.name }}</div>
                                            <div class="reader-time">{{ formatDetailedTime(reader.readAt) }}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="showInfoModal = false">
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Reminder Modal -->
        <div v-if="showReminderModal" class="modal fade show d-block" tabindex="-1">
            <div class="modal-dialog">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title">Đặt nhắc nhở</h5>
                        <button type="button" class="btn-close" @click="showReminderModal = false"></button>
                    </div>
                    <div class="modal-body">
                        <div class="reminder-options">
                            <div class="quick-reminder-options">
                                <h6>Nhắc nhở nhanh</h6>
                                <div class="quick-options">
                                    <button v-for="option in quickReminderOptions" :key="option.value" type="button"
                                        class="btn btn-outline-primary btn-sm" @click="setQuickReminder(option.value)">
                                        {{ option.label }}
                                    </button>
                                </div>
                            </div>

                            <div class="custom-reminder">
                                <h6>Tùy chỉnh</h6>
                                <div class="row">
                                    <div class="col-6">
                                        <label for="reminderDate" class="form-label">Ngày</label>
                                        <input type="date" id="reminderDate" v-model="reminderDate" class="form-control"
                                            :min="today" />
                                    </div>
                                    <div class="col-6">
                                        <label for="reminderTime" class="form-label">Giờ</label>
                                        <input type="time" id="reminderTime" v-model="reminderTime"
                                            class="form-control" />
                                    </div>
                                </div>
                                <div class="mt-3">
                                    <label for="reminderNote" class="form-label">Ghi chú (tùy chọn)</label>
                                    <textarea id="reminderNote" v-model="reminderNote" class="form-control" rows="2"
                                        placeholder="Thêm ghi chú cho nhắc nhở..."></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" @click="showReminderModal = false">
                            Hủy
                        </button>
                        <button type="button" class="btn btn-primary" @click="saveReminder"
                            :disabled="!reminderDate || !reminderTime">
                            Đặt nhắc nhở
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useMessageStore } from '@/stores/message'
import { useConversationStore } from '@/stores/conversation'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

// Props
const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    conversationId: {
        type: String,
        required: true
    },
    showQuickActions: {
        type: Boolean,
        default: false
    },
    alwaysShowActions: {
        type: Boolean,
        default: false
    },
    canEdit: {
        type: Boolean,
        default: false
    },
    canDelete: {
        type: Boolean,
        default: false
    },
    canPin: {
        type: Boolean,
        default: false
    },
    canForward: {
        type: Boolean,
        default: true
    },
    canTranslate: {
        type: Boolean,
        default: true
    }
})

// Emits
const emit = defineEmits([
    'reply',
    'edit',
    'delete',
    'forward',
    'pin',
    'star',
    'reaction-added',
    'reaction-removed',
    'quote',
    'report',
    'translate'
])

// Dependencies
const authStore = useAuthStore()
const messageStore = useMessageStore()
const conversationStore = useConversationStore()
const cacheStore = useCacheStore()
const toast = useToast()

// State
const activeEmojiCategory = ref('recent')
const showInfoModal = ref(false)
const showReminderModal = ref(false)
const reminderDate = ref('')
const reminderTime = ref('')
const reminderNote = ref('')
const messageReactions = ref(props.message?.reactions || [])
const frequentEmojis = ref([])

// Emoji Categories
const emojiCategories = ref([
    { id: 'recent', name: 'Gần đây', icon: '🕒' },
    { id: 'smileys', name: 'Mặt cười', icon: '😀' },
    { id: 'gestures', name: 'Cử chỉ', icon: '👍' },
    { id: 'hearts', name: 'Trái tim', icon: '❤️' },
    { id: 'activities', name: 'Hoạt động', icon: '⚽' },
    { id: 'food', name: 'Đồ ăn', icon: '🍕' },
    { id: 'travel', name: 'Du lịch', icon: '✈️' },
    { id: 'objects', name: 'Đồ vật', icon: '📱' }
])

// Quick Reactions
const quickReactions = ref([
    { emoji: '👍', code: 'thumbs_up', name: 'Thích' },
    { emoji: '❤️', code: 'heart', name: 'Yêu' },
    { emoji: '😂', code: 'joy', name: 'Cười' },
    { emoji: '😮', code: 'surprised', name: 'Ngạc nhiên' },
    { emoji: '😢', code: 'sad', name: 'Buồn' },
    { emoji: '😡', code: 'angry', name: 'Tức giận' }
])

// Quick Reminder Options
const quickReminderOptions = ref([
    { label: '1 giờ', value: 60 },
    { label: '3 giờ', value: 180 },
    { label: '1 ngày', value: 1440 },
    { label: '3 ngày', value: 4320 },
    { label: '1 tuần', value: 10080 }
])

// Emoji Data (simplified)
const emojiData = ref({
    recent: [],
    smileys: [
        { emoji: '😀', code: 'grinning', name: 'Cười toe toét' },
        { emoji: '😃', code: 'smiley', name: 'Cười' },
        { emoji: '😄', code: 'smile', name: 'Cười tươi' },
        { emoji: '😁', code: 'grin', name: 'Cười nha' },
        { emoji: '😆', code: 'laughing', name: 'Cười lớn' },
        { emoji: '😅', code: 'sweat_smile', name: 'Cười ngượng' },
        { emoji: '🤣', code: 'rofl', name: 'Cười ngã' },
        { emoji: '😂', code: 'joy', name: 'Cười đến khóc' }
    ],
    gestures: [
        { emoji: '👍', code: 'thumbs_up', name: 'Thích' },
        { emoji: '👎', code: 'thumbs_down', name: 'Không thích' },
        { emoji: '👌', code: 'ok_hand', name: 'OK' },
        { emoji: '✌️', code: 'victory', name: 'Chiến thắng' },
        { emoji: '🤞', code: 'crossed_fingers', name: 'Chúc may mắn' },
        { emoji: '🤟', code: 'love_you', name: 'Yêu bạn' },
        { emoji: '👏', code: 'clap', name: 'Vỗ tay' },
        { emoji: '🙌', code: 'raised_hands', name: 'Giơ tay' }
    ],
    hearts: [
        { emoji: '❤️', code: 'heart', name: 'Trái tim đỏ' },
        { emoji: '🧡', code: 'orange_heart', name: 'Trái tim cam' },
        { emoji: '💛', code: 'yellow_heart', name: 'Trái tim vàng' },
        { emoji: '💚', code: 'green_heart', name: 'Trái tim xanh' },
        { emoji: '💙', code: 'blue_heart', name: 'Trái tim xanh dương' },
        { emoji: '💜', code: 'purple_heart', name: 'Trái tim tím' },
        { emoji: '🖤', code: 'black_heart', name: 'Trái tim đen' },
        { emoji: '💖', code: 'sparkling_heart', name: 'Trái tim lấp lánh' }
    ]
})

// Computed
const currentUser = computed(() => authStore.user)

const isOwnMessage = computed(() => {
    return props.message?.sender?.id === currentUser.value?.id
})

const hasUserReaction = computed(() => {
    return messageReactions.value.some(reaction =>
        reaction.users.some(user => user.id === currentUser.value?.id)
    )
})

const groupedReactions = computed(() => {
    const groups = {}

    messageReactions.value.forEach(reaction => {
        if (!groups[reaction.emoji]) {
            groups[reaction.emoji] = {
                emoji: reaction.emoji,
                count: 0,
                users: [],
                userReacted: false
            }
        }

        groups[reaction.emoji].count += reaction.users.length
        groups[reaction.emoji].users.push(...reaction.users)

        if (reaction.users.some(user => user.id === currentUser.value?.id)) {
            groups[reaction.emoji].userReacted = true
        }
    })

    return Object.values(groups).sort((a, b) => b.count - a.count)
})

const currentCategoryEmojis = computed(() => {
    return emojiData.value[activeEmojiCategory.value] || []
})

const today = computed(() => {
    return format(new Date(), 'yyyy-MM-dd')
})

// Methods
const hasReaction = (emojiCode) => {
    return messageReactions.value.some(reaction =>
        reaction.emoji === emojiCode &&
        reaction.users.some(user => user.id === currentUser.value?.id)
    )
}

const getReactionTooltip = (reaction) => {
    if (reaction.count === 1) {
        return reaction.users[0].name
    } else if (reaction.count <= 3) {
        return reaction.users.map(u => u.name).join(', ')
    } else {
        return `${reaction.users.slice(0, 2).map(u => u.name).join(', ')} và ${reaction.count - 2} người khác`
    }
}

const setEmojiCategory = (categoryId) => {
    activeEmojiCategory.value = categoryId
}

const handleReactionClick = (event) => {
    // Prevent dropdown from closing if user already has reactions
    if (hasUserReaction.value) {
        event.stopPropagation()
    }
}

const addReaction = async (emoji) => {
    try {
        await messageStore.addReaction(props.message.id, emoji.code, emoji.emoji)

        // Update local reactions
        const existingReaction = messageReactions.value.find(r => r.emoji === emoji.emoji)
        if (existingReaction) {
            if (!existingReaction.users.find(u => u.id === currentUser.value.id)) {
                existingReaction.users.push(currentUser.value)
            }
        } else {
            messageReactions.value.push({
                emoji: emoji.emoji,
                users: [currentUser.value]
            })
        }

        emit('reaction-added', { emoji, message: props.message })

        // Update frequent emojis
        updateFrequentEmojis(emoji)

    } catch (error) {
        console.error('Add reaction error:', error)
        toast.error('Không thể thêm biểu cảm')
    }
}

const toggleReaction = async (emoji) => {
    const hasReactionNow = hasReaction(emoji.emoji || emoji.code)

    if (hasReactionNow) {
        await removeReaction(emoji)
    } else {
        await addReaction(emoji)
    }
}

const removeReaction = async (emoji) => {
    try {
        await messageStore.removeReaction(props.message.id, emoji.code || emoji.emoji)

        // Update local reactions
        const reactionIndex = messageReactions.value.findIndex(r => r.emoji === emoji.emoji)
        if (reactionIndex !== -1) {
            const reaction = messageReactions.value[reactionIndex]
            const userIndex = reaction.users.findIndex(u => u.id === currentUser.value.id)
            if (userIndex !== -1) {
                reaction.users.splice(userIndex, 1)
                if (reaction.users.length === 0) {
                    messageReactions.value.splice(reactionIndex, 1)
                }
            }
        }

        emit('reaction-removed', { emoji, message: props.message })

    } catch (error) {
        console.error('Remove reaction error:', error)
        toast.error('Không thể xóa biểu cảm')
    }
}

const updateFrequentEmojis = (emoji) => {
    // Update frequently used emojis
    const existing = frequentEmojis.value.find(e => e.code === emoji.code)
    if (existing) {
        existing.count = (existing.count || 0) + 1
    } else {
        frequentEmojis.value.push({ ...emoji, count: 1 })
    }

    // Sort by usage and keep top 12
    frequentEmojis.value.sort((a, b) => (b.count || 0) - (a.count || 0))
    frequentEmojis.value = frequentEmojis.value.slice(0, 12)

    // Update recent emojis
    emojiData.value.recent = frequentEmojis.value

    // Save to localStorage
    localStorage.setItem('frequentEmojis', JSON.stringify(frequentEmojis.value))
}

const replyToMessage = () => {
    emit('reply', props.message)
}

const editMessage = () => {
    emit('edit', props.message)
}

const deleteMessage = () => {
    const confirmMessage = isOwnMessage.value
        ? 'Bạn có chắc muốn xóa tin nhắn này?'
        : 'Xóa tin nhắn này chỉ cho bạn?'

    if (confirm(confirmMessage)) {
        emit('delete', props.message)
    }
}

const forwardMessage = () => {
    emit('forward', props.message)
}

const quoteMessage = () => {
    emit('quote', props.message)
}

const copyMessage = async () => {
    try {
        await navigator.clipboard.writeText(props.message.content)
        toast.success('Đã sao chép tin nhắn!')
    } catch (error) {
        console.error('Copy error:', error)
        toast.error('Không thể sao chép tin nhắn')
    }
}

const togglePin = async () => {
    try {
        if (props.message.isPinned) {
            await messageStore.unpinMessage(props.message.id)
            toast.success('Đã bỏ ghim tin nhắn')
        } else {
            await messageStore.pinMessage(props.message.id)
            toast.success('Đã ghim tin nhắn')
        }

        emit('pin', props.message)

    } catch (error) {
        console.error('Pin message error:', error)
        toast.error('Không thể ghim/bỏ ghim tin nhắn')
    }
}

const toggleStar = async () => {
    try {
        if (props.message.isStarred) {
            await messageStore.unstarMessage(props.message.id)
            toast.success('Đã bỏ đánh dấu tin nhắn')
        } else {
            await messageStore.starMessage(props.message.id)
            toast.success('Đã đánh dấu tin nhắn')
        }

        emit('star', props.message)

    } catch (error) {
        console.error('Star message error:', error)
        toast.error('Không thể đánh dấu tin nhắn')
    }
}

const showMessageInfo = () => {
    showInfoModal.value = true
}

const setReminder = () => {
    showReminderModal.value = true

    // Set default to 1 hour from now
    const now = new Date()
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000)

    reminderDate.value = format(oneHourLater, 'yyyy-MM-dd')
    reminderTime.value = format(oneHourLater, 'HH:mm')
}

const setQuickReminder = (minutes) => {
    const reminderDateTime = new Date(Date.now() + minutes * 60 * 1000)

    reminderDate.value = format(reminderDateTime, 'yyyy-MM-dd')
    reminderTime.value = format(reminderDateTime, 'HH:mm')
}

const saveReminder = async () => {
    try {
        const reminderDateTime = new Date(`${reminderDate.value}T${reminderTime.value}`)

        await messageStore.setMessageReminder(props.message.id, {
            reminderAt: reminderDateTime,
            note: reminderNote.value
        })

        toast.success('Đã đặt nhắc nhở thành công!')
        showReminderModal.value = false

        // Reset form
        reminderDate.value = ''
        reminderTime.value = ''
        reminderNote.value = ''

    } catch (error) {
        console.error('Set reminder error:', error)
        toast.error('Không thể đặt nhắc nhở')
    }
}

const translateMessage = () => {
    emit('translate', props.message)
}

const reportMessage = () => {
    emit('report', props.message)
}

const formatDetailedTime = (date) => {
    return format(new Date(date), 'dd/MM/yyyy HH:mm:ss', { locale: vi })
}

const getMessageTypeText = (type) => {
    const types = {
        text: 'Văn bản',
        image: 'Hình ảnh',
        video: 'Video',
        audio: 'Âm thanh',
        file: 'File',
        location: 'Vị trí',
        contact: 'Liên hệ'
    }
    return types[type] || 'Không xác định'
}

const loadFrequentEmojis = () => {
    try {
        const saved = localStorage.getItem('frequentEmojis')
        if (saved) {
            frequentEmojis.value = JSON.parse(saved)
            emojiData.value.recent = frequentEmojis.value
        }
    } catch (error) {
        console.error('Load frequent emojis error:', error)
    }
}

// Lifecycle
onMounted(() => {
    loadFrequentEmojis()
})

// Watch for message reactions changes
const unwatchReactions = messageStore.$subscribe((mutation, state) => {
    if (mutation.events?.some(event =>
        event.target === state.reactions &&
        event.key === props.message.id
    )) {
        messageReactions.value = state.reactions[props.message.id] || []
    }
})

onUnmounted(() => {
    if (unwatchReactions) {
        unwatchReactions()
    }
})
</script>

<style scoped>
.message-actions {
    position: relative;
}

.quick-actions {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    opacity: 0;
    visibility: hidden;
    transition: all 0.2s ease;
}

.quick-actions.show {
    opacity: 1;
    visibility: visible;
}

.action-group {
    display: flex;
    align-items: center;
    gap: 0.25rem;
}

.reactions-group {
    border-right: 1px solid var(--bs-border-color);
    padding-right: 0.5rem;
    margin-right: 0.25rem;
}

.action-btn {
    width: 32px;
    height: 32px;
    border: none;
    background: none;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--bs-secondary);
    transition: all 0.2s ease;
    font-size: 0.875rem;
}

.action-btn:hover {
    background-color: var(--bs-light);
    color: var(--bs-primary);
}

.action-btn.active {
    background-color: var(--bs-primary);
    color: white;
}

.quick-reactions {
    display: flex;
    gap: 0.125rem;
}

.quick-reaction-btn {
    font-size: 1rem;
}

.emoji-picker {
    width: 280px;
    max-height: 320px;
    padding: 0;
    border: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.emoji-picker-header {
    padding: 0.75rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.emoji-categories {
    display: flex;
    gap: 0.25rem;
    margin-top: 0.5rem;
}

.category-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.875rem;
    transition: background-color 0.2s ease;
}

.category-btn:hover,
.category-btn.active {
    background-color: var(--bs-primary);
    color: white;
}

.emoji-picker-body {
    padding: 0.5rem;
    max-height: 200px;
    overflow-y: auto;
}

.emoji-grid {
    display: grid;
    grid-template-columns: repeat(8, 1fr);
    gap: 0.125rem;
}

.emoji-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    transition: background-color 0.2s ease;
}

.emoji-btn:hover {
    background-color: var(--bs-light);
}

.emoji-frequent {
    border-top: 1px solid var(--bs-border-color);
    padding: 0.5rem;
}

.frequent-header {
    font-size: 0.875rem;
    font-weight: 500;
    margin-bottom: 0.5rem;
    color: var(--bs-secondary);
}

.frequent-emojis {
    display: flex;
    gap: 0.125rem;
    flex-wrap: wrap;
}

.reactions-display {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;
}

.reaction-item {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.5rem;
    background: var(--bs-light);
    border: 1px solid var(--bs-border-color);
    border-radius: 1rem;
    font-size: 0.875rem;
    cursor: pointer;
    transition: all 0.2s ease;
}

.reaction-item:hover {
    background-color: var(--bs-primary);
    color: white;
    border-color: var(--bs-primary);
}

.reaction-item.user-reacted {
    background-color: var(--bs-primary);
    color: white;
    border-color: var(--bs-primary);
}

.add-reaction {
    background: white;
    border: 1px dashed var(--bs-border-color);
    color: var(--bs-secondary);
}

.add-reaction:hover {
    background-color: var(--bs-light);
    border-style: solid;
    color: var(--bs-primary);
}

.reaction-emoji {
    font-size: 1rem;
}

.reaction-count {
    font-size: 0.75rem;
    font-weight: 500;
}

.emoji-picker-mini {
    width: 200px;
    padding: 0.5rem;
}

.emoji-grid-mini {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.125rem;
}

.emoji-btn-mini {
    width: 24px;
    height: 24px;
    border: none;
    background: none;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    transition: background-color 0.2s ease;
}

.emoji-btn-mini:hover {
    background-color: var(--bs-light);
}

.message-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.25rem;
}

.status-indicator {
    color: var(--bs-secondary);
    font-size: 0.75rem;
}

.status-indicator.edited {
    color: var(--bs-info);
}

.status-indicator.pinned {
    color: var(--bs-warning);
}

.status-indicator.starred {
    color: var(--bs-warning);
}

.read-status {
    margin-left: auto;
}

.read-avatars {
    display: flex;
    align-items: center;
    gap: 0.125rem;
}

.read-avatar {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    object-fit: cover;
    border: 1px solid white;
}

.read-count {
    font-size: 0.75rem;
    color: var(--bs-secondary);
    margin-left: 0.25rem;
}

/* Modal Styles */
.modal {
    background: rgba(0, 0, 0, 0.5);
}

.message-info-content {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.info-section h6 {
    color: var(--bs-primary);
    margin-bottom: 0.75rem;
    font-weight: 600;
}

.info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--bs-border-color-translucent);
}

.info-item:last-child {
    border-bottom: none;
}

.info-label {
    font-weight: 500;
    color: var(--bs-secondary);
}

.info-value {
    color: var(--bs-body-color);
}

.readers-list {
    max-height: 200px;
    overflow-y: auto;
}

.reader-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--bs-border-color-translucent);
}

.reader-item:last-child {
    border-bottom: none;
}

.reader-item img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.reader-info {
    flex: 1;
}

.reader-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.reader-time {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.reminder-options {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.quick-reminder-options h6,
.custom-reminder h6 {
    color: var(--bs-primary);
    margin-bottom: 0.75rem;
}

.quick-options {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
}

@media (max-width: 768px) {
    .quick-actions {
        flex-wrap: wrap;
        padding: 0.5rem;
    }

    .reactions-group {
        border-right: none;
        border-bottom: 1px solid var(--bs-border-color);
        padding-right: 0;
        padding-bottom: 0.5rem;
        margin-right: 0;
        margin-bottom: 0.25rem;
        width: 100%;
    }

    .emoji-picker {
        width: 260px;
    }

    .emoji-grid {
        grid-template-columns: repeat(6, 1fr);
    }

    .reactions-display {
        gap: 0.125rem;
    }

    .reaction-item {
        font-size: 0.8rem;
        padding: 0.125rem 0.375rem;
    }
}
</style>