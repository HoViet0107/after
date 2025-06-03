import { useRouter } from 'vue-router';

/**
 * Provides functions for navigating to different parts of the chat UI.
 *
 * @returns {{ navigateToConversation: Function, navigateToNewConversation: Function, navigateToSettings: Function, navigateBack: Function, navigateToChatsList: Function }}
 */

export function useChatNavigation() {
    const router = useRouter();

    /**
     * Navigates to a specific conversation.
     *
     * @param {string} conversationId - The ID of the conversation to navigate to.
     */
    const navigateToConversation = (conversationId) => {
        router.push({
            name: 'conversation',
            params: { conversationId }
        });
    };

    /**
     * Navigates to the new conversation page.
     */
    const navigateToNewConversation = () => {
        router.push({
            name: 'new-conversation'
        });
    };

    /**
     * Navigates to the settings page.
     */
    const navigateToSettings = () => {
        router.push({
            name: 'settings'
        });
    };

    /**
     * Navigates back to the previous page.
     */
    const navigateBack = () => {
        router.back();
    };

    /**
     * Navigates to the chats list page.
     */
    const navigateToChatsList = () => {
        router.push({
            name: 'chats'
        });
    };

    return {
        navigateToConversation,
        navigateToNewConversation,
        navigateToSettings,
        navigateBack,
        navigateToChatsList
    };
}