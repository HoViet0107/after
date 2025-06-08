<template>
    <div v-if="hashtags.length > 0" class="post-hashtags">
      <span
        v-for="hashtag in hashtags"
        :key="hashtag"
        class="hashtag"
        @click="handleClick(hashtag)"
      >
        #{{ hashtag }}
      </span>
    </div>
  </template>

<script setup>
const props = defineProps({
    hashtags: {
        type: Array,
        required: true
    }
})

const emit = defineEmits(['click'])

const handleClick = (hashtag) => {
    emit('click', hashtag)
}
</script>

<style lang="scss" scoped>
.post-hashtags {
    margin-top: 0.75rem;

    .hashtag {
        display: inline-block;
        color: var(--bs-info);
        font-weight: 500;
        cursor: pointer;
        margin-right: 0.75rem;
        margin-bottom: 0.25rem;
        transition: color 0.2s ease;

        &:hover {
            color: var(--bs-primary);
            text-decoration: underline;
        }
    }
}
</style>

<!-- ui/src/components/post/PostList.vue -->
<template>
    <div class="post-list">
        <PostCreate v-if="showCreatePost" @submit="handlePostCreated" />

        <div v-if="isLoading && posts.length === 0" class="loading-container">
            <LoadingSpinner size="large" show-text text="Đang tải bài viết..." />
        </div>

        <div v-else-if="posts.length === 0" class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-newspaper"></i>
            </div>
            <h5>Chưa có bài viết nào</h5>
            <p class="text-muted">{{ emptyMessage }}</p>
        </div>

        <div v-else class="posts-container">
            <PostCard v-for="post in posts" :key="post.id" :post="post" @like="handlePostLike"
                @comment="handlePostComment" @share="handlePostShare" @save="handlePostSave" @edit="handlePostEdit"
                @delete="handlePostDelete" />

            <!-- Load more trigger -->
            <div v-if="hasMore" ref="loadMoreTrigger" class="load-more-trigger">
                <div v-if="isLoadingMore" class="loading-more">
                    <LoadingSpinner size="medium" />
                    <span class="ms-2">Đang tải thêm...</span>
                </div>
                <button v-else class="btn btn-outline-primary" @click="loadMore">
                    Tải thêm bài viết
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { useInfiniteScroll } from '@/composables/useInfiniteScroll'
  import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
  import PostCreate from './PostCreate.vue'
  import PostCard from './PostCard.vue'
  
  const props = defineProps({
    posts: {
      type: Array,
      default: () => []
    },
    isLoading: {
      type: Boolean,
      default: false
    },
    hasMore: {
      type: Boolean,
      default: false
    },
    showCreatePost: {
      type: Boolean,
      default: true
    },
    emptyMessage: {
      type: String,
      default: 'Hãy bắt đầu theo dõi một số người để xem bài viết của họ tại đây.'
    }
  })
  
  const emit = defineEmits([
    'load-more',
    'post-created',
    'post-like',
    'post-comment',
    'post-share',
    'post-save',
    'post-edit',
    'post-delete'
  ])
  
  // Refs
  const loadMoreTrigger = ref(null)
  
  // Infinite scroll
  const { isLoading: isLoadingMore, loadMore: loadMoreData } = useInfiniteScroll(
    () => emit('load-more'),
    {
      container: loadMoreTrigger,
      threshold: 200,
      disabled: !props.hasMore
    }
  )
  
  // Actions
  const loadMore = () => {
    if (!isLoadingMore.value && props.hasMore) {
      loadMoreData()
    }
  }
  
  const handlePostCreated = (post) => {
    emit('post-created', post)
  }
  
  const handlePostLike = (post) => {
    emit('post-like', post)
  }
  
  const handlePostComment = (post) => {
    emit('post-comment', post)
  }
  
  const handlePostShare = (post) => {
    emit('post-share', post)
  }
  
  const handlePostSave = (post) => {
    emit('post-save', post)
  }
  
  const handlePostEdit = (post) => {
    emit('post-edit', post)
  }
  
  const handlePostDelete = (post) => {
    emit('post-delete', post)
  }
  </script>

<style lang="scss" scoped>
.post-list {
    .loading-container {
        display: flex;
        justify-content: center;
        padding: 3rem 0;
    }

    .empty-state {
        text-align: center;
        padding: 3rem 1rem;

        .empty-icon {
            font-size: 3rem;
            color: var(--bs-secondary);
            margin-bottom: 1rem;
        }

        h5 {
            color: var(--bs-body-color);
            margin-bottom: 0.5rem;
        }
    }

    .posts-container {
        .load-more-trigger {
            display: flex;
            justify-content: center;
            padding: 2rem 0;

            .loading-more {
                display: flex;
                align-items: center;
                color: var(--bs-secondary);
            }
        }
    }
}
</style>