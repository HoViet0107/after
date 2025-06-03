import { ref } from 'vue';
import { useErrorHandling } from 'src/composables/common/useErrorHandling';
import { useNotifications } from 'src/composables/common/useNotifications';
import { ConversationServices, MessageServices } from 'src/services/api';
import { validationUtils } from 'src/utils/common/validationUtils';
import { messageUtils } from 'src/utils/chat/messageUtils';

/**
 * Provides various chat-related actions for managing messages and conversations.
 * 
 * @param {string} token - The authentication token for API requests.
 * @returns {Object} An object containing functions to handle chat actions such as
 * sending, editing, and deleting messages, managing participants, and more.
 * The object includes properties to track the state of sending, editing, and deleting messages.
 */
export function useChatActions(token) {
    const { handleError } = useErrorHandling();
    const { success, error: showError } = useNotifications();

    const sendingMessages = ref(new Set());
    const editingMessages = ref(new Set());
    const deletingMessages = ref(new Set());

    const sendMessage = async (conversationId, content, currentUserId, currentSenderName, type = 'TEXT') => {
        // Validate the message
        const validation = validationUtils.validateMessage(content);
        if (!validation.isValid) {
            showError('Invalid message', validation.error);
            return null;
        }

        // Create a temporary ID for the message
        const tempId = `temp-${Date.now()}-${Math.random()}`;

        // Mark this message as sending
        sendingMessages.value.add(tempId);

        try {
            const formData = new FormData();
            formData.append('content', content.trim());
            formData.append('status', 'SENT');
            formData.append('mediaType', type);

            // Create a local message object for immediate display
            const tempMessage = messageUtils.processMessage({
                id: tempId,
                content: content.trim(),
                senderId: currentUserId,
                senderName: currentSenderName,
                conversationId,
                sendAt: new Date().toISOString(),
                type,
                status: 'SENDING'
            });

            // Return the temporary message for immediate display
            const response = await MessageServices.sendMessage(conversationId, formData, token);

            // Remove from sending messages
            sendingMessages.value.delete(tempId);

            success('Message sent');
            return {
                tempMessage,
                serverMessage: response.data
            };
        } catch (err) {
            // Remove from sending messages
            sendingMessages.value.delete(tempId);

            const errorMessage = handleError(err, 'send_message');
            showError('Failed to send message', errorMessage);
            throw err;
        }
    };

    /**
     * Edits a message by validating the new content and updating it on the server.
     * Tracks the editing state and provides feedback on success or failure.
     * 
     * @param {string|number} messageId - The ID of the message to edit.
     * @param {string} newContent - The new content for the message.
     * @returns {Promise<boolean>} - Resolves to true if the message is edited successfully, otherwise false.
     * @throws Will throw an error if the edit operation fails.
     */
    const editMessage = async (messageId, newContent) => {
        // Validate the message
        const validation = validationUtils.validateMessage(newContent);
        if (!validation.isValid) {
            showError('Invalid message', validation.error);
            return false;
        }

        // Mark this message as editing
        editingMessages.value.add(messageId);

        try {
            await MessageServices.editMessage(messageId, newContent, token);

            // Remove from editing messages
            editingMessages.value.delete(messageId);

            success('Message edited successfully');
            return true;
        } catch (err) {
            // Remove from editing messages
            editingMessages.value.delete(messageId);

            const errorMessage = handleError(err, 'edit_message');
            showError('Failed to edit message', errorMessage);
            throw err;
        }
    };

    /**
     * Deletes a message by validating the message ID and deleting it on the server.
     * Tracks the deleting state and provides feedback on success or failure.
     * 
     * @param {string|number} messageId - The ID of the message to delete.
     * @returns {Promise<boolean>} - Resolves to true if the message is deleted successfully, otherwise false.
     * @throws Will throw an error if the delete operation fails.
     */
    const deleteMessage = async (messageId) => {
        // Mark this message as deleting
        deletingMessages.value.add(messageId);

        try {
            await MessageServices.deleteMessage(messageId, token);

            // Remove from deleting messages
            deletingMessages.value.delete(messageId);

            success('Message deleted successfully');
            return true;
        } catch (err) {
            // Remove from deleting messages
            deletingMessages.value.delete(messageId);

            const errorMessage = handleError(err, 'delete_message');
            showError('Failed to delete message', errorMessage);
            throw err;
        }
    };

    /**
     * Leaves a conversation by removing the current user from the conversation.
     * Tracks the leaving state and provides feedback on success or failure.
     * 
     * @param {string|number} conversationId - The ID of the conversation to leave.
     * @returns {Promise<Object>} - Resolves to the response data from the server.
     * @throws Will throw an error if the leave operation fails.
     */
    const leaveConversation = async (conversationId) => {
        try {
            const response = await ConversationServices.leaveConversation(conversationId, token);
            success('You have left the conversation');
            return response.data;
        } catch (err) {
            const errorMessage = handleError(err, 'leave_conversation');
            showError('Failed to leave conversation', errorMessage);
            throw err;
        }
    };

    /**
     * Creates a new conversation with the specified name, participant IDs, and group status.
     * Tracks the creation state and provides feedback on success or failure.
     * 
     * @param {string} name - The name of the conversation.
     * @param {Array<string|number>} participantIds - An array of participant IDs.
     * @param {boolean} isGroup - Whether the conversation is a group conversation.
     * @returns {Promise<Object>} - Resolves to the response data from the server.
     * @throws Will throw an error if the create operation fails.
     */
    const createConversation = async (name, participantIds, isGroup = true) => {
        try {
            const response = await ConversationServices.createConversation({
                name,
                participantIds,
                isGroup
            }, token);

            success('Conversation created successfully');
            return response.data;
        } catch (err) {
            const errorMessage = handleError(err, 'create_conversation');
            showError('Failed to create conversation', errorMessage);
            throw err;
        }
    };

    /**
     * Adds participants to a conversation.
     * Tracks the adding state and provides feedback on success or failure.
     * 
     * @param {string|number} conversationId - The ID of the conversation to add participants to.
     * @param {Array<string|number>} participantIds - An array of participant IDs to add.
     * @returns {Promise<Object>} - Resolves to the response data from the server.
     * @throws Will throw an error if the add operation fails.
     */
    const addParticipants = async (conversationId, participantIds) => {
        try {
            const response = await ConversationServices.addParticipants(conversationId, participantIds, token);
            success('Participants added successfully');
            return response.data;
        } catch (err) {
            const errorMessage = handleError(err, 'add_participants');
            showError('Failed to add participants', errorMessage);
            throw err;
        }
    };

    /**
     * Removes a participant from a conversation.
     * Tracks the removing state and provides feedback on success or failure.
     * 
     * @param {string|number} conversationId - The ID of the conversation to remove the participant from.
     * @param {Array<string|number>} participantIds - An array of participant IDs to remove.
     * @returns {Promise<Object>} - Resolves to the response data from the server.
     * @throws Will throw an error if the remove operation fails.
     */
    const removeParticipant = async (conversationId, participantIds) => {
        try {
            const response = await ConversationServices.removeParticipant(conversationId, participantIds, token);
            success('Participant removed successfully');
            return response.data;
        } catch (err) {
            const errorMessage = handleError(err, 'remove_participant');
            showError('Failed to remove participant', errorMessage);
            throw err;
        }
    };

    /**
     * Marks a message as read.
     * 
     * @param {string|number} conversationId - The ID of the conversation.
     * @param {Array<string|number>} messageIds - An array of message IDs to mark as read.
     * @returns {Promise<boolean>} - Resolves to true if the message is marked as read successfully, otherwise false.
     * @throws Will throw an error if the mark as read operation fails.
     */
    const markAsRead = async (conversationId, messageIds) => {
        try {
            await MessageServices.markAsRead(conversationId, messageIds, token);
            return true;
        } catch (err) {
            const errorMessage = handleError(err, 'mark_as_read');
            console.error('Failed to mark message as read', errorMessage);
            // Don't show error notification for this action
            return false;
        }
    };

    return {
        sendMessage,
        editMessage,
        deleteMessage,
        leaveConversation,
        createConversation,
        addParticipants,
        removeParticipant,
        markAsRead,
        sendingMessages,
        editingMessages,
        deletingMessages
    };
}