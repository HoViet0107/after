<template>
    <div v-if="reactions.length > 0" class="message-reactions">
        <button v-for="reaction in groupedReactions" :key="reaction.emoji"
            :class="['reaction-btn', { active: reaction.isUserReacted }]" @click="toggleReaction(reaction.emoji)"
            :title="reaction.tooltip">
            <span class="reaction-emoji">{{ reaction.emoji }}</span>
            <span class="reaction-count">{{ reaction.count }}</span>
        </button>
    </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const props = defineProps({
    reactions: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits(['toggle'])

const authStore = useAuthStore()

// Computed
const groupedReactions = computed(() => {
    const groups = {}

    props.reactions.forEach(reaction => {
        if (!groups[reaction.emoji]) {
            groups[reaction.emoji] = {
                emoji: reaction.emoji,
                count: 0,
                users: [],
                isUserReacted: false
            }
        }

        groups[reaction.emoji].count++
        groups[reaction.emoji].users.push(reaction.user)

        if (reaction.user.id === authStore.userId) {
            groups[reaction.emoji].isUserReacted = true
        }
    })

    return Object.values(groups).map(group => ({
        ...group,
        tooltip: group.users.map(user => user.name).join(', ')
    }))
})

// Actions
const toggleReaction = (emoji) => {
    emit('toggle', emoji)
}
</script>

<style lang="scss" scoped>
.message-reactions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
    margin-top: 0.5rem;

    .reaction-btn {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        background: var(--bs-light);
        border: 1px solid var(--bs-border-color);
        border-radius: 1rem;
        padding: 0.25rem 0.5rem;
        font-size: 0.75rem;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            background: var(--bs-secondary);
            color: white;
        }

        &.active {
            background: var(--bs-primary);
            color: white;
            border-color: var(--bs-primary);
        }

        .reaction-emoji {
            font-size: 0.875rem;
        }

        .reaction-count {
            font-weight: 500;
        }
    }
}
</style>