<template>
    <div v-if="show" class="emoji-picker-overlay" @click="close">
        <div class="emoji-picker" @click.stop>
            <div class="emoji-header">
                <div class="emoji-search">
                    <input v-model="searchQuery" type="text" class="form-control form-control-sm"
                        placeholder="Tìm emoji..." @input="handleSearch">
                </div>
                <button class="btn btn-sm btn-outline-secondary" @click="close">
                    <i class="fas fa-times"></i>
                </button>
            </div>

            <div class="emoji-categories">
                <button v-for="category in categories" :key="category.name"
                    :class="['category-btn', { active: activeCategory === category.name }]"
                    @click="setActiveCategory(category.name)" :title="category.label">
                    {{ category.icon }}
                </button>
            </div>

            <div class="emoji-grid">
                <button v-for="emoji in filteredEmojis" :key="emoji.code" class="emoji-btn" @click="selectEmoji(emoji)"
                    :title="emoji.name">
                    {{ emoji.emoji }}
                </button>
            </div>

            <div v-if="recentEmojis.length > 0" class="recent-emojis">
                <div class="recent-header">Gần đây</div>
                <div class="emoji-grid">
                    <button v-for="emoji in recentEmojis" :key="emoji.code" class="emoji-btn"
                        @click="selectEmoji(emoji)" :title="emoji.name">
                        {{ emoji.emoji }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'

const props = defineProps({
    show: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['select', 'close'])

// Local storage for recent emojis
const recentEmojis = useLocalStorage('recent-emojis', [])

// State
const searchQuery = ref('')
const activeCategory = ref('smileys')

// Emoji data (simplified - in real app, use a proper emoji library)
const categories = [
    { name: 'smileys', label: 'Smileys & Emotion', icon: '😀' },
    { name: 'people', label: 'People & Body', icon: '👋' },
    { name: 'nature', label: 'Animals & Nature', icon: '🐶' },
    { name: 'food', label: 'Food & Drink', icon: '🍎' },
    { name: 'activities', label: 'Activities', icon: '⚽' },
    { name: 'travel', label: 'Travel & Places', icon: '🚗' },
    { name: 'objects', label: 'Objects', icon: '💡' },
    { name: 'symbols', label: 'Symbols', icon: '❤️' },
    { name: 'flags', label: 'Flags', icon: '🏳️' }
]

const emojiData = {
    smileys: [
        { code: '1f600', emoji: '😀', name: 'grinning face' },
        { code: '1f601', emoji: '😁', name: 'beaming face with smiling eyes' },
        { code: '1f602', emoji: '😂', name: 'face with tears of joy' },
        { code: '1f603', emoji: '😃', name: 'grinning face with big eyes' },
        { code: '1f604', emoji: '😄', name: 'grinning face with smiling eyes' },
        { code: '1f605', emoji: '😅', name: 'grinning face with sweat' },
        { code: '1f606', emoji: '😆', name: 'grinning squinting face' },
        { code: '1f609', emoji: '😉', name: 'winking face' },
        { code: '1f60a', emoji: '😊', name: 'smiling face with smiling eyes' },
        { code: '1f60d', emoji: '😍', name: 'smiling face with heart-eyes' }
    ],
    people: [
        { code: '1f44d', emoji: '👍', name: 'thumbs up' },
        { code: '1f44e', emoji: '👎', name: 'thumbs down' },
        { code: '1f44f', emoji: '👏', name: 'clapping hands' },
        { code: '1f64f', emoji: '🙏', name: 'folded hands' }
    ],
    // Add more categories as needed
}

// Computed
const filteredEmojis = computed(() => {
    let emojis = emojiData[activeCategory.value] || []

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        emojis = Object.values(emojiData)
            .flat()
            .filter(emoji => emoji.name.toLowerCase().includes(query))
    }

    return emojis
})

// Actions
const selectEmoji = (emoji) => {
    // Add to recent emojis
    const recent = recentEmojis.value.filter(e => e.code !== emoji.code)
    recent.unshift(emoji)
    recentEmojis.value = recent.slice(0, 20) // Keep only 20 recent

    emit('select', emoji)
    close()
}

const setActiveCategory = (category) => {
    activeCategory.value = category
    searchQuery.value = ''
}

const handleSearch = () => {
    if (searchQuery.value) {
        activeCategory.value = 'search'
    }
}

const close = () => {
    emit('close')
}

// Watch for show prop changes
watch(() => props.show, (newValue) => {
    if (newValue) {
        searchQuery.value = ''
        activeCategory.value = 'smileys'
    }
})
</script>

<style lang="scss" scoped>
.emoji-picker-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1050;
}

.emoji-picker {
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    width: 320px;
    max-height: 400px;
    display: flex;
    flex-direction: column;

    .emoji-header {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 1rem;
        border-bottom: 1px solid var(--bs-border-color);

        .emoji-search {
            flex: 1;
        }
    }

    .emoji-categories {
        display: flex;
        padding: 0.5rem;
        border-bottom: 1px solid var(--bs-border-color);
        gap: 0.25rem;

        .category-btn {
            background: none;
            border: none;
            padding: 0.5rem;
            border-radius: 0.25rem;
            font-size: 1.1rem;
            transition: background-color 0.2s;

            &:hover {
                background-color: var(--bs-light);
            }

            &.active {
                background-color: var(--bs-primary);
                color: white;
            }
        }
    }

    .emoji-grid {
        display: grid;
        grid-template-columns: repeat(8, 1fr);
        gap: 0.25rem;
        padding: 0.5rem;
        max-height: 200px;
        overflow-y: auto;

        .emoji-btn {
            background: none;
            border: none;
            padding: 0.5rem;
            border-radius: 0.25rem;
            font-size: 1.2rem;
            transition: background-color 0.2s;

            &:hover {
                background-color: var(--bs-light);
            }
        }
    }

    .recent-emojis {
        border-top: 1px solid var(--bs-border-color);

        .recent-header {
            font-size: 0.875rem;
            font-weight: 500;
            padding: 0.5rem 1rem;
            color: var(--bs-secondary);
        }
    }
}
</style>