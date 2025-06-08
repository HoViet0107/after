<template>
    <div class="feed-filter">
        <div class="filter-dropdown">
            <div class="dropdown">
                <button class="btn btn-outline-secondary btn-sm dropdown-toggle filter-btn" data-bs-toggle="dropdown"
                    aria-expanded="false">
                    <i class="fas fa-filter me-1"></i>
                    {{ currentFilterLabel }}
                </button>

                <ul class="dropdown-menu filter-menu">
                    <li class="dropdown-header">Sắp xếp theo</li>
                    <li v-for="filter in filters" :key="filter.value">
                        <a :class="['dropdown-item', { active: currentFilter === filter.value }]" href="#"
                            @click.prevent="selectFilter(filter.value)">
                            <i v-if="filter.icon" :class="filter.icon" class="me-2"></i>
                            {{ filter.label }}
                            <i v-if="currentFilter === filter.value" class="fas fa-check ms-auto"></i>
                        </a>
                    </li>
                </ul>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    currentFilter: {
        type: String,
        required: true
    },
    filters: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['filter-change'])

// Computed
const currentFilterLabel = computed(() => {
    const filter = props.filters.find(f => f.value === props.currentFilter)
    return filter ? filter.label : 'Bộ lọc'
})

// Actions
const selectFilter = (filterValue) => {
    if (filterValue !== props.currentFilter) {
        emit('filter-change', filterValue)
    }
}
</script>

<style lang="scss" scoped>
.feed-filter {
    .filter-btn {
        min-width: 100px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .filter-menu {
        min-width: 180px;

        .dropdown-item {
            display: flex;
            align-items: center;

            &.active {
                background-color: rgba(var(--bs-primary-rgb), 0.1);
                color: var(--bs-primary);
            }

            i:last-child {
                margin-left: auto;
            }
        }
    }
}
</style>
