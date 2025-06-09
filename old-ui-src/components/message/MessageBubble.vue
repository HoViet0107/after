<template>
    <div :id="`message-${message.id}`"
        :class="['message-bubble', { 'own-message': isOwn, 'deleted-message': message.isDeleted }]"
        @contextmenu.prevent="showContextMenu">
        <div v-if="message.isDeleted" class="deleted-content">
            <i class="fas fa-trash me-1"></i>
            <span>Tin nhắn đã được xóa</span>
        </div>

        <template v-else>
            <!-- Message content -->
            <div v-if="message.content" class="message-text" v-html="formattedContent"></div>

            <!-- Media attachments -->
            <MessageMedia v-if="message.attachments && message.attachments.length > 0"
                :attachments="message.attachments" @view="viewMedia" />

            <!-- Message reactions -->
            <MessageReaction v-if="message.reactions && message.reactions.length > 0" :reactions="message.reactions"
                @toggle="handleReactionToggle" />

            <!-- Edit indicator -->
            <div v-if="message.isEdited" class="edit-indicator">
                <i class="fas fa-edit"></i>
                <span>đã chỉnh sửa</span>
            </div>
        </template>

        <!-- Context menu -->
        <div v-if="showMenu" ref="contextMenu" class="context-menu" :style="menuStyle" @click.stop>
            <button @click="handleReply" class="menu-item">
                <i class="fas fa-reply me-2"></i>Trả lời
            </button>
            <button @click="handleReact" class="menu-item">
                <i class="fas fa-heart me-2"></i>Thả tim
            </button>
            <button @click="handleForward" class="menu-item">
                <i class="fas fa-share me-2"></i>Chuyển tiếp
            </button>
            <button v-if="isOwn" @click="handleEdit" class="menu-item">
                <i class="fas fa-edit me-2"></i>Chỉnh sửa
            </button>
            <button v-if="isOwn" @click="handleDelete" class="menu-item text-danger">
                <i class="fas fa-trash me-2"></i>Xóa
            </button>
            <button v-if="!isOwn" @click="handleReport" class="menu-item text-danger">
                <i class="fas fa-flag me-2"></i>Báo cáo
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import MessageMedia from './MessageMedia.vue'
import MessageReaction from './MessageReaction.vue'

const props = defineProps({
    message: {
        type: Object,
        required: true
    },
    isOwn: {
        type: Boolean,
        default: false
    }
})

const emit = defineEmits(['react', 'edit', 'delete', 'reply', 'forward'])

// Refs
const contextMenu = ref(null)

// State
const showMenu = ref(false)
const menuPosition = ref({ x: 0, y: 0 })

// Computed
const formattedContent = computed(() => {
    if (!props.message.content) return ''

    let content = props.message.content

    // Format mentions
    content = content.replace(
        /@(\w+)/g,
        '<span class="mention">@$1</span>'
    )

    // Format URLs
    content = content.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer" class="message-link">$1</a>'
    )

    // Format line breaks
    content = content.replace(/\n/g, '<br>')

    return content
})

const menuStyle = computed(() => ({
    left: menuPosition.value.x + 'px',
    top: menuPosition.value.y + 'px'
}))

// Actions
const showContextMenu = (event) => {
    if (props.message.isDeleted) return

    menuPosition.value = {
        x: event.clientX,
        y: event.clientY
    }

    showMenu.value = true

    nextTick(() => {
        const menu = contextMenu.value
        if (menu) {
            const rect = menu.getBoundingClientRect()
            const viewport = {
                width: window.innerWidth,
                height: window.innerHeight
            }

            // Adjust position if menu goes outside viewport
            if (rect.right > viewport.width) {
                menuPosition.value.x = viewport.width - rect.width - 10
            }

            if (rect.bottom > viewport.height) {
                menuPosition.value.y = viewport.height - rect.height - 10
            }
        }
    })
}

const hideContextMenu = () => {
    showMenu.value = false
}

const handleReply = () => {
    hideContextMenu()
    emit('reply')
}

const handleReact = () => {
    hideContextMenu()
    emit('react', '❤️')
}

const handleForward = () => {
    hideContextMenu()
    emit('forward')
}

const handleEdit = () => {
    hideContextMenu()
    emit('edit')
}

const handleDelete = () => {
    hideContextMenu()
    if (confirm('Bạn có chắc chắn muốn xóa tin nhắn này?')) {
        emit('delete')
    }
}

const handleReport = () => {
    hideContextMenu()
    // Handle report logic
    console.log('Report message:', props.message)
}

const handleReactionToggle = (reaction) => {
    emit('react', reaction)
}

const viewMedia = (attachment, index) => {
    // Handle media viewing
    console.log('View media:', attachment, index)
}

// Event listeners
const handleClickOutside = (event) => {
    if (contextMenu.value && !contextMenu.value.contains(event.target)) {
        hideContextMenu()
    }
}

onMounted(() => {
    document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
    document.removeEventListener('click', handleClickOutside)
})
</script>

<style lang="scss" scoped>
.message-bubble {
    position: relative;
    max-width: 100%;
    border-radius: 1rem;
    padding: 0.75rem 1rem;
    word-wrap: break-word;

    &.own-message {
        background: var(--bs-primary);
        color: white;
        border-bottom-right-radius: 0.25rem;

        .message-text {
            :deep(.mention) {
                color: rgba(255, 255, 255, 0.9);
                background: rgba(255, 255, 255, 0.2);
            }

            :deep(.message-link) {
                color: rgba(255, 255, 255, 0.9);
            }
        }
    }

    &:not(.own-message) {
        background: var(--bs-light);
        color: var(--bs-body-color);
        border-bottom-left-radius: 0.25rem;

        .message-text {
            :deep(.mention) {
                color: var(--bs-primary);
                background: rgba(var(--bs-primary-rgb), 0.1);
            }

            :deep(.message-link) {
                color: var(--bs-primary);
            }
        }
    }

    &.deleted-message {
        background: var(--bs-secondary);
        color: white;
        font-style: italic;
        opacity: 0.7;

        .deleted-content {
            display: flex;
            align-items: center;
            font-size: 0.875rem;
        }
    }

    .message-text {
        line-height: 1.4;

        :deep(.mention) {
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-weight: 500;
        }

        :deep(.message-link) {
            text-decoration: underline;

            &:hover {
                text-decoration: none;
            }
        }
    }

    .edit-indicator {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-top: 0.25rem;
        font-size: 0.75rem;
        opacity: 0.7;

        i {
            font-size: 0.625rem;
        }
    }
}

.context-menu {
    position: fixed;
    background: white;
    border: 1px solid var(--bs-border-color);
    border-radius: 0.5rem;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    min-width: 150px;

    .menu-item {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 0.75rem 1rem;
        border: none;
        background: none;
        text-align: left;
        cursor: pointer;
        transition: background-color 0.2s ease;

        &:hover {
            background: var(--bs-light);
        }

        &:first-child {
            border-top-left-radius: 0.5rem;
            border-top-right-radius: 0.5rem;
        }

        &:last-child {
            border-bottom-left-radius: 0.5rem;
            border-bottom-right-radius: 0.5rem;
        }

        &.text-danger:hover {
            background: var(--bs-danger);
            color: white;
        }
    }
}
</style>