<template>
    <div class="search-input-container">
        <div class="input-group">
            <span class="input-group-text">
                <i class="fas fa-search"></i>
            </span>
            <input ref="searchInput" v-model="query" type="text" class="form-control" :placeholder="placeholder"
                @input="handleInput" @focus="handleFocus" @blur="handleBlur" @keydown.enter="handleEnter"
                @keydown.escape="handleEscape" @keydown.arrow-down="handleArrowDown" @keydown.arrow-up="handleArrowUp">
            <button v-if="query" class="btn btn-outline-secondary" @click="clear">
                <i class="fas fa-times"></i>
            </button>
        </div>

        <!-- Search suggestions dropdown -->
        <div v-if="showDropdown && (suggestions.length > 0 || isLoading)" class="search-dropdown">
            <div v-if="isLoading" class="dropdown-item">
                <LoadingSpinner size="small" />
                <span class="ms-2">Đang tìm kiếm...</span>
            </div>

            <div v-else>
                <div v-for="(suggestion, index) in suggestions" :key="suggestion.id"
                    :class="['dropdown-item', 'search-suggestion', { active: selectedIndex === index }]"
                    @click="selectSuggestion(suggestion)" @mouseenter="selectedIndex = index">
                    <div class="suggestion-content">
                        <img v-if="suggestion.avatar" :src="suggestion.avatar" :alt="suggestion.title"
                            class="suggestion-avatar">
                        <div class="suggestion-icon" v-else>
                            <i :class="suggestion.icon || 'fas fa-search'"></i>
                        </div>
                        <div class="suggestion-text">
                            <div class="suggestion-title" v-html="highlightMatch(suggestion.title)"></div>
                            <div v-if="suggestion.subtitle" class="suggestion-subtitle">
                                {{ suggestion.subtitle }}
                            </div>
                        </div>
                    </div>
                    <div v-if="suggestion.type" class="suggestion-type">
                        {{ suggestion.type }}
                    </div>
                </div>
            </div>

            <div v-if="!isLoading && suggestions.length === 0 && query" class="dropdown-item text-muted">
                Không tìm thấy kết quả
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useDebounce } from '@/composables/useDebounce'
import LoadingSpinner from './LoadingSpinner.vue'

const props = defineProps({
    placeholder: {
        type: String,
        default: 'Tìm kiếm...'
    },
    debounceDelay: {
        type: Number,
        default: 300
    },
    showSuggestions: {
        type: Boolean,
        default: true
    },
    suggestions: {
        type: Array,
        default: () => []
    },
    isLoading: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['search', 'select', 'clear', 'focus', 'blur'])

// Refs
const searchInput = ref(null)

// State
const query = ref('')
const showDropdown = ref(false)
const selectedIndex = ref(-1)

// Debounced query
const debouncedQuery = useDebounce(query, props.debounceDelay)

// Computed
const showDropdown = computed(() => {
    return props.showSuggestions && showDropdown.value && (props.suggestions.length > 0 || props.isLoading)
})

// Watchers
watch(debouncedQuery, (newValue) => {
    if (newValue) {
        emit('search', newValue)
    }
})

watch(() => props.suggestions, () => {
    selectedIndex.value = -1
})

// Actions
const handleInput = () => {
    selectedIndex.value = -1
}

const handleFocus = () => {
    showDropdown.value = true
    emit('focus')
}

const handleBlur = () => {
    // Delay hiding dropdown to allow for clicks
    setTimeout(() => {
        showDropdown.value = false
        emit('blur')
    }, 200)
}

const handleEnter = () => {
    if (selectedIndex.value >= 0 && props.suggestions[selectedIndex.value]) {
        selectSuggestion(props.suggestions[selectedIndex.value])
    } else {
        emit('search', query.value)
        showDropdown.value = false
    }
}

const handleEscape = () => {
    showDropdown.value = false
    searchInput.value?.blur()
}

const handleArrowDown = (event) => {
    event.preventDefault()
    if (selectedIndex.value < props.suggestions.length - 1) {
        selectedIndex.value++
    }
}

const handleArrowUp = (event) => {
    event.preventDefault()
    if (selectedIndex.value > 0) {
        selectedIndex.value--
    }
}

const selectSuggestion = (suggestion) => {
    query.value = suggestion.title
    showDropdown.value = false
    emit('select', suggestion)
}

const clear = () => {
    query.value = ''
    selectedIndex.value = -1
    emit('clear')
    nextTick(() => {
        searchInput.value?.focus()
    })
}

const highlightMatch = (text) => {
    if (!query.value) return text

    const regex = new RegExp(`(${query.value})`, 'gi')
    return text.replace(regex, '<mark>$1</mark>')
}

// Public methods
const focus = () => {
    searchInput.value?.focus()
}

defineExpose({
    focus,
    clear
})
</script>

<style lang="scss" scoped>
.search-input-container {
    position: relative;

    .search-dropdown {
        position: absolute;
        top: 100%;
        left: 0;
        right: 0;
        background: white;
        border: 1px solid var(--bs-border-color);
        border-top: none;
        border-radius: 0 0 0.375rem 0.375rem;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        max-height: 300px;
        overflow-y: auto;
        z-index: 1000;

        .search-suggestion {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0.75rem 1rem;
            cursor: pointer;
            border: none;

            &:hover,
            &.active {
                background-color: var(--bs-light);
            }

            .suggestion-content {
                display: flex;
                align-items: center;
                flex: 1;

                .suggestion-avatar {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                }

                .suggestion-icon {
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background-color: var(--bs-light);
                    border-radius: 50%;
                    color: var(--bs-secondary);
                }

                .suggestion-text {
                    margin-left: 0.75rem;

                    .suggestion-title {
                        font-weight: 500;

                        :deep(mark) {
                            background-color: yellow;
                            padding: 0;
                        }
                    }

                    .suggestion-subtitle {
                        font-size: 0.875rem;
                        color: var(--bs-secondary);
                    }
                }
            }

            .suggestion-type {
                font-size: 0.75rem;
                color: var(--bs-secondary);
                text-transform: uppercase;
                font-weight: 500;
            }
        }
    }
}
</style>