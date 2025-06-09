// Combine all stores imports to avoid duplication

import { useAuthStore } from '@/stores/auth'
import { usePostStore } from '@/stores/post'
import { useUserStore } from '@/stores/user'
import { useConversationStore } from '@/stores/conversation'
import { useMessageStore } from '@/stores/message'
import { useNotificationStore } from '@/stores/notification'
import { useCommentStore } from '@/stores/comment'
import { usePresenceStore } from '@/stores/presence'

export const useAppStores = () => {
    return {
        authStore: useAuthStore(),
        postStore: usePostStore(),
        userStore: useUserStore(),
        conversationStore: useConversationStore(),
        messageStore: useMessageStore(),
        notificationStore: useNotificationStore(),
        commentStore: useCommentStore(),
        presenceStore: usePresenceStore()
    }
}

export default useAppStores