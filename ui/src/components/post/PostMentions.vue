<!-- Component quản lý mention trong bài đăng với WebSocket real-time và Redis caching -->

<template>
    <div class="post-mentions">
        <!-- Mention Input/Trigger -->
        <div class="mention-input-container" ref="mentionContainer">
            <div ref="editableDiv" contenteditable="true" class="mention-input"
                :class="{ 'focused': isFocused, 'has-error': hasError }" @input="handleInput" @keydown="handleKeyDown"
                @focus="handleFocus" @blur="handleBlur" @paste="handlePaste" :placeholder="placeholder"></div>

            <!-- Mention Suggestions Dropdown -->
            <div v-if="showSuggestions && filteredSuggestions.length > 0" class="mention-suggestions"
                :style="suggestionStyle">
                <div class="suggestions-header">
                    <span class="text-muted small">Gợi ý mention</span>
                    <span class="badge bg-secondary">{{ filteredSuggestions.length }}</span>
                </div>

                <div class="suggestions-list">
                    <div v-for="(user, index) in filteredSuggestions" :key="user.id" class="suggestion-item"
                        :class="{ 'active': index === selectedSuggestionIndex }" @click="selectSuggestion(user)"
                        @mouseenter="selectedSuggestionIndex = index">
                        <div class="suggestion-avatar">
                            <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
                            <div v-if="user.presence" class="presence-indicator" :class="user.presence.status"></div>
                        </div>

                        <div class="suggestion-content">
                            <div class="suggestion-name">
                                <span v-html="highlightSearchTerm(user.name, currentMentionQuery)"></span>
                                <i v-if="user.isVerified" class="fas fa-check-circle text-primary ms-1"></i>
                            </div>
                            <div class="suggestion-meta">
                                <span class="username">@{{ user.username }}</span>
                                <span v-if="user.mutualFriends > 0" class="mutual-friends">
                                    • {{ user.mutualFriends }} bạn chung
                                </span>
                            </div>
                        </div>

                        <div class="suggestion-badge">
                            <span v-if="user.isFollowing" class="badge bg-success">Đang theo dõi</span>
                            <span v-else-if="user.isFriend" class="badge bg-primary">Bạn bè</span>
                        </div>
                    </div>
                </div>

                <div v-if="isLoadingMoreSuggestions" class="suggestions-loading">
                    <div class="text-center py-2">
                        <div class="spinner-border spinner-border-sm me-2"></div>
                        <span class="small text-muted">Đang tải thêm...</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Current Mentions Display -->
        <div v-if="mentions.length > 0" class="current-mentions">
            <div class="mentions-header">
                <span class="text-muted small">Đã mention ({{ mentions.length }})</span>
                <button type="button" class="btn btn-sm btn-link text-muted" @click="clearAllMentions">
                    Xóa tất cả
                </button>
            </div>

            <div class="mentions-list">
                <div v-for="mention in mentions" :key="mention.id" class="mention-tag">
                    <img :src="mention.avatar || '/default-avatar.png'" :alt="mention.name" />
                    <span class="mention-name">{{ mention.name }}</span>
                    <button type="button" class="btn-remove" @click="removeMention(mention.id)" title="Xóa mention">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        </div>

        <!-- Mention Analytics (for post owner) -->
        <div v-if="showAnalytics && mentionStats" class="mention-analytics">
            <div class="analytics-header">
                <h6 class="mb-0">Thống kê Mention</h6>
            </div>

            <div class="analytics-stats">
                <div class="stat-item">
                    <div class="stat-value">{{ mentionStats.totalMentions }}</div>
                    <div class="stat-label">Tổng mentions</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{{ mentionStats.uniqueUsers }}</div>
                    <div class="stat-label">Người được mention</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">{{ mentionStats.responsiveRate }}%</div>
                    <div class="stat-label">Tỷ lệ phản hồi</div>
                </div>
            </div>
        </div>

        <!-- Recent Mentions (Quick Access) -->
        <div v-if="showRecentMentions && recentMentions.length > 0" class="recent-mentions">
            <div class="recent-header">
                <span class="text-muted small">Mention gần đây</span>
            </div>

            <div class="recent-list">
                <button v-for="user in recentMentions" :key="user.id" type="button" class="recent-mention-btn"
                    @click="quickMention(user)" :title="`Mention ${user.name}`">
                    <img :src="user.avatar || '/default-avatar.png'" :alt="user.name" />
                    <span>{{ user.name }}</span>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useUserStore } from '@/stores/user'
import { usePresenceStore } from '@/stores/presence'
import { useCacheStore } from '@/stores/cache'
import { useToast } from 'vue-toastification'
import { debounce } from 'lodash-es'

// Props
const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    placeholder: {
        type: String,
        default: 'Viết gì đó... (@ để mention ai đó)'
    },
    maxMentions: {
        type: Number,
        default: 10
    },
    showAnalytics: {
        type: Boolean,
        default: false
    },
    showRecentMentions: {
        type: Boolean,
        default: true
    },
    postId: {
        type: String,
        default: null
    },
    disabled: {
        type: Boolean,
        default: false
    }
})

// Emits
const emit = defineEmits([
    'update:modelValue',
    'mentions-changed',
    'mention-added',
    'mention-removed'
])

// Dependencies
const authStore = useAuthStore()
const userStore = useUserStore()
const presenceStore = usePresenceStore()
const cacheStore = useCacheStore()
const toast = useToast()

// Refs
const editableDiv = ref(null)
const mentionContainer = ref(null)

// State
const isFocused = ref(false)
const hasError = ref(false)
const showSuggestions = ref(false)
const currentMentionQuery = ref('')
const mentionStartPos = ref(-1)
const selectedSuggestionIndex = ref(0)
const suggestionStyle = ref({})
const isLoadingMoreSuggestions = ref(false)

// Data
const mentions = ref([])
const suggestions = ref([])
const recentMentions = ref([])
const mentionStats = ref(null)

// Computed
const currentUser = computed(() => authStore.user)

const filteredSuggestions = computed(() => {
    if (!currentMentionQuery.value) return suggestions.value

    return suggestions.value.filter(user => {
        const query = currentMentionQuery.value.toLowerCase()
        return (
            user.name.toLowerCase().includes(query) ||
            user.username.toLowerCase().includes(query)
        )
    }).slice(0, 8) // Limit to 8 suggestions
})

// Methods
const highlightSearchTerm = (text, term) => {
    if (!term || !text) return text
    const regex = new RegExp(`(${term})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
}

const handleInput = (event) => {
    const content = event.target.textContent
    emit('update:modelValue', content)

    // Check for mention trigger
    checkForMention(event.target)
}

const handleKeyDown = (event) => {
    if (showSuggestions.value) {
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault()
                selectedSuggestionIndex.value = Math.min(
                    selectedSuggestionIndex.value + 1,
                    filteredSuggestions.value.length - 1
                )
                break

            case 'ArrowUp':
                event.preventDefault()
                selectedSuggestionIndex.value = Math.max(selectedSuggestionIndex.value - 1, 0)
                break

            case 'Enter':
            case 'Tab':
                event.preventDefault()
                if (filteredSuggestions.value[selectedSuggestionIndex.value]) {
                    selectSuggestion(filteredSuggestions.value[selectedSuggestionIndex.value])
                }
                break

            case 'Escape':
                event.preventDefault()
                hideSuggestions()
                break
        }
    }
}

const handleFocus = () => {
    isFocused.value = true
}

const handleBlur = () => {
    isFocused.value = false
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
        hideSuggestions()
    }, 150)
}

const handlePaste = (event) => {
    event.preventDefault()
    const text = event.clipboardData.getData('text/plain')
    document.execCommand('insertText', false, text)
}

const checkForMention = debounce((element) => {
    const selection = window.getSelection()
    if (selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const text = element.textContent
    const cursorPos = range.startOffset

    // Find @ symbol before cursor
    let mentionStart = -1
    for (let i = cursorPos - 1; i >= 0; i--) {
        if (text[i] === '@') {
            mentionStart = i
            break
        }
        if (text[i] === ' ' || text[i] === '\n') break
    }

    if (mentionStart !== -1) {
        const query = text.substring(mentionStart + 1, cursorPos)

        // Only show suggestions if query is reasonable
        if (query.length <= 50) {
            currentMentionQuery.value = query
            mentionStartPos.value = mentionStart
            showMentionSuggestions()
        }
    } else {
        hideSuggestions()
    }
}, 100)

const showMentionSuggestions = async () => {
    showSuggestions.value = true
    selectedSuggestionIndex.value = 0

    // Position suggestions
    await nextTick()
    positionSuggestions()

    // Load suggestions
    await loadSuggestions(currentMentionQuery.value)
}

const positionSuggestions = () => {
    if (!editableDiv.value || !mentionContainer.value) return

    const selection = window.getSelection()
    if (selection.rangeCount === 0) return

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    const containerRect = mentionContainer.value.getBoundingClientRect()

    suggestionStyle.value = {
        position: 'absolute',
        top: `${rect.bottom - containerRect.top + 5}px`,
        left: `${rect.left - containerRect.left}px`,
        zIndex: 1000
    }
}

const loadSuggestions = async (query) => {
    try {
        // Try cache first
        const cacheKey = `mention_suggestions_${query || 'all'}`
        const cachedSuggestions = cacheStore.get(cacheKey)

        if (cachedSuggestions) {
            suggestions.value = cachedSuggestions
            return
        }

        const searchParams = {
            query,
            limit: 20,
            excludeIds: mentions.value.map(m => m.id),
            prioritizeFriends: true
        }

        const response = await userStore.searchUsersForMention(searchParams)
        suggestions.value = response.users

        // Cache for 5 minutes
        cacheStore.set(cacheKey, suggestions.value, 5 * 60 * 1000)

    } catch (error) {
        console.error('Load mention suggestions error:', error)
    }
}

const selectSuggestion = async (user) => {
    if (mentions.value.length >= props.maxMentions) {
        toast.warning(`Chỉ có thể mention tối đa ${props.maxMentions} người`)
        return
    }

    // Check if already mentioned
    if (mentions.value.find(m => m.id === user.id)) {
        toast.warning(`${user.name} đã được mention`)
        hideSuggestions()
        return
    }

    // Replace @ query with mention
    const element = editableDiv.value
    const text = element.textContent
    const beforeMention = text.substring(0, mentionStartPos.value)
    const afterMention = text.substring(mentionStartPos.value + currentMentionQuery.value.length + 1)

    // Create mention element
    const mentionText = `@${user.username}`
    const newText = beforeMention + mentionText + ' ' + afterMention

    element.textContent = newText

    // Position cursor after mention
    const range = document.createRange()
    const sel = window.getSelection()
    const cursorPos = beforeMention.length + mentionText.length + 1

    range.setStart(element.firstChild || element, cursorPos)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)

    // Add to mentions list
    const mentionData = {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        position: mentionStartPos.value,
        length: mentionText.length
    }

    mentions.value.push(mentionData)

    // Add to recent mentions
    addToRecentMentions(user)

    // Update model value
    emit('update:modelValue', newText)
    emit('mentions-changed', mentions.value)
    emit('mention-added', mentionData)

    // Send real-time notification
    await sendMentionNotification(user)

    hideSuggestions()

    toast.success(`Đã mention ${user.name}`)
}

const removeMention = (userId) => {
    const mentionIndex = mentions.value.findIndex(m => m.id === userId)
    if (mentionIndex === -1) return

    const mention = mentions.value[mentionIndex]

    // Remove from text
    const element = editableDiv.value
    const text = element.textContent
    const mentionText = `@${mention.username}`
    const newText = text.replace(mentionText, '').replace(/\s+/g, ' ').trim()

    element.textContent = newText

    // Remove from mentions list
    mentions.value.splice(mentionIndex, 1)

    // Update model value
    emit('update:modelValue', newText)
    emit('mentions-changed', mentions.value)
    emit('mention-removed', mention)
}

const clearAllMentions = () => {
    mentions.value = []

    // Remove all mentions from text
    let text = editableDiv.value.textContent
    mentions.value.forEach(mention => {
        text = text.replace(`@${mention.username}`, '')
    })

    editableDiv.value.textContent = text.replace(/\s+/g, ' ').trim()

    emit('update:modelValue', editableDiv.value.textContent)
    emit('mentions-changed', [])
}

const quickMention = (user) => {
    if (mentions.value.find(m => m.id === user.id)) {
        toast.warning(`${user.name} đã được mention`)
        return
    }

    // Add mention at cursor position
    const element = editableDiv.value
    const selection = window.getSelection()
    const range = selection.getRangeAt(0)

    const mentionText = `@${user.username} `

    // Insert mention
    range.deleteContents()
    range.insertNode(document.createTextNode(mentionText))
    range.collapse(false)

    // Add to mentions list
    const mentionData = {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        position: range.startOffset - mentionText.length,
        length: mentionText.length - 1
    }

    mentions.value.push(mentionData)

    // Update model value
    emit('update:modelValue', element.textContent)
    emit('mentions-changed', mentions.value)
    emit('mention-added', mentionData)

    // Send notification
    sendMentionNotification(user)

    element.focus()
    toast.success(`Đã mention ${user.name}`)
}

const hideSuggestions = () => {
    showSuggestions.value = false
    currentMentionQuery.value = ''
    mentionStartPos.value = -1
    selectedSuggestionIndex.value = 0
}

const addToRecentMentions = (user) => {
    // Remove if already exists
    recentMentions.value = recentMentions.value.filter(u => u.id !== user.id)

    // Add to front
    recentMentions.value.unshift({
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar
    })

    // Keep only 6 recent
    recentMentions.value = recentMentions.value.slice(0, 6)

    // Save to localStorage
    localStorage.setItem('recentMentions', JSON.stringify(recentMentions.value))
}

const loadRecentMentions = () => {
    try {
        const saved = localStorage.getItem('recentMentions')
        if (saved) {
            recentMentions.value = JSON.parse(saved).slice(0, 6)
        }
    } catch (error) {
        console.error('Load recent mentions error:', error)
    }
}

const sendMentionNotification = async (user) => {
    try {
        await userStore.sendMentionNotification({
            userId: user.id,
            postId: props.postId,
            content: editableDiv.value.textContent.substring(0, 100)
        })
    } catch (error) {
        console.error('Send mention notification error:', error)
    }
}

const loadMentionStats = async () => {
    if (!props.showAnalytics || !props.postId) return

    try {
        const stats = await userStore.getMentionStats(props.postId)
        mentionStats.value = stats
    } catch (error) {
        console.error('Load mention stats error:', error)
    }
}

// Watchers
watch(() => props.modelValue, (newValue) => {
    if (editableDiv.value && editableDiv.value.textContent !== newValue) {
        editableDiv.value.textContent = newValue
    }
})

watch(() => props.disabled, (disabled) => {
    if (editableDiv.value) {
        editableDiv.value.contentEditable = !disabled
    }
})

// Lifecycle
onMounted(async () => {
    loadRecentMentions()

    if (props.modelValue) {
        editableDiv.value.textContent = props.modelValue
    }

    if (props.disabled) {
        editableDiv.value.contentEditable = false
    }

    await loadMentionStats()
})

// Cleanup
onUnmounted(() => {
    hideSuggestions()
})
</script>

<style scoped>
.post-mentions {
    position: relative;
}

.mention-input-container {
    position: relative;
}

.mention-input {
    min-height: 80px;
    max-height: 200px;
    padding: 0.75rem;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    outline: none;
    overflow-y: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
    line-height: 1.5;
    transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.mention-input:empty::before {
    content: attr(placeholder);
    color: var(--bs-secondary);
    pointer-events: none;
}

.mention-input.focused {
    border-color: var(--bs-primary);
    box-shadow: 0 0 0 0.2rem rgba(var(--bs-primary-rgb), 0.25);
}

.mention-input.has-error {
    border-color: var(--bs-danger);
    box-shadow: 0 0 0 0.2rem rgba(var(--bs-danger-rgb), 0.25);
}

.mention-suggestions {
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.375rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    max-height: 300px;
    overflow-y: auto;
    min-width: 280px;
    z-index: 1000;
}

.suggestions-header {
    padding: 0.5rem 0.75rem;
    border-bottom: 1px solid var(--bs-border-color);
    background-color: var(--bs-light);
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.suggestions-list {
    max-height: 250px;
    overflow-y: auto;
}

.suggestion-item {
    display: flex;
    align-items: center;
    padding: 0.75rem;
    cursor: pointer;
    border-bottom: 1px solid var(--bs-border-color-translucent);
    transition: background-color 0.2s ease;
}

.suggestion-item:last-child {
    border-bottom: none;
}

.suggestion-item:hover,
.suggestion-item.active {
    background-color: var(--bs-light);
}

.suggestion-avatar {
    position: relative;
    margin-right: 0.75rem;
}

.suggestion-avatar img {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
}

.presence-indicator {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    border: 1px solid white;
}

.presence-indicator.online {
    background-color: var(--bs-success);
}

.presence-indicator.away {
    background-color: var(--bs-warning);
}

.presence-indicator.offline {
    background-color: var(--bs-secondary);
}

.suggestion-content {
    flex: 1;
    min-width: 0;
}

.suggestion-name {
    font-weight: 500;
    margin-bottom: 0.25rem;
}

.suggestion-name :deep(mark) {
    background-color: var(--bs-warning);
    padding: 0.1em 0.2em;
    border-radius: 0.2em;
}

.suggestion-meta {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.suggestion-badge {
    margin-left: 0.5rem;
}

.suggestion-badge .badge {
    font-size: 0.75rem;
}

.suggestions-loading {
    padding: 0.5rem;
    border-top: 1px solid var(--bs-border-color);
}

.current-mentions {
    margin-top: 1rem;
}

.mentions-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
}

.mentions-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.mention-tag {
    display: inline-flex;
    align-items: center;
    padding: 0.25rem 0.5rem;
    background-color: var(--bs-primary);
    color: white;
    border-radius: 1rem;
    font-size: 0.875rem;
    gap: 0.5rem;
}

.mention-tag img {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    object-fit: cover;
}

.mention-name {
    font-weight: 500;
}

.btn-remove {
    background: none;
    border: none;
    color: white;
    padding: 0.125rem;
    border-radius: 50%;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    transition: background-color 0.2s ease;
}

.btn-remove:hover {
    background-color: rgba(255, 255, 255, 0.2);
}

.mention-analytics {
    margin-top: 1rem;
    padding: 1rem;
    background-color: var(--bs-light);
    border-radius: 0.375rem;
}

.analytics-header {
    margin-bottom: 0.75rem;
    padding-bottom: 0.5rem;
    border-bottom: 1px solid var(--bs-border-color);
}

.analytics-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 1rem;
}

.stat-item {
    text-align: center;
}

.stat-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--bs-primary);
}

.stat-label {
    font-size: 0.875rem;
    color: var(--bs-secondary);
}

.recent-mentions {
    margin-top: 1rem;
}

.recent-header {
    margin-bottom: 0.5rem;
}

.recent-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.recent-mention-btn {
    display: inline-flex;
    align-items: center;
    padding: 0.375rem 0.75rem;
    background-color: var(--bs-light);
    border: 1px solid var(--bs-border-color);
    border-radius: 1rem;
    font-size: 0.875rem;
    gap: 0.5rem;
    transition: all 0.2s ease;
    cursor: pointer;
}

.recent-mention-btn:hover {
    background-color: var(--bs-primary);
    color: white;
    border-color: var(--bs-primary);
}

.recent-mention-btn img {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    object-fit: cover;
}

@media (max-width: 768px) {
    .mention-suggestions {
        min-width: 250px;
    }

    .suggestion-item {
        padding: 0.5rem;
    }

    .analytics-stats {
        grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
        gap: 0.5rem;
    }

    .mentions-list {
        gap: 0.25rem;
    }

    .mention-tag {
        font-size: 0.8rem;
        padding: 0.125rem 0.375rem;
    }
}
</style>