export const validationUtils = {
    /**
     * Validate a message.
     * @param {string} content - Message content
     * @returns {Object} Validation result
     */
    validateMessage(content) {
        if (!content || typeof content !== 'string') {
            return {
                isValid: false,
                error: 'Message content is required'
            };
        }

        if (content.trim().length === 0) {
            return {
                isValid: false,
                error: 'Message cannot be empty'
            };
        }

        if (content.length > 1000) {
            return {
                isValid: false,
                error: 'Message is too long (max 1000 characters)'
            };
        }

        return {
            isValid: true
        };
    },

    /**
     * Validate a conversation.
     * @param {Object} conversation - Conversation object
     * @param {string} userId - User ID
     * @returns {Object} Validation result
     */
    validateConversation(conversation, userId) {
        if (!conversation) {
            return {
                isValid: false,
                error: 'Conversation not found'
            };
        }

        // Check if the user is a participant
        const isParticipant = conversation.participants?.some(p => p.id === userId);
        if (!isParticipant) {
            return {
                isValid: false,
                error: 'You are not a participant in this conversation'
            };
        }

        return {
            isValid: true
        };
    },

    /**
     * Validate a participant.
     * @param {Object} participant - Participant object
     * @returns {Object} Validation result
     */
    validateParticipant(participant) {
        if (!participant) {
            return {
                isValid: false,
                error: 'Participant is required'
            };
        }

        if (!participant.id) {
            return {
                isValid: false,
                error: 'Participant ID is required'
            };
        }

        return {
            isValid: true
        };
    },

    /**
     * Validate group creation.
     * @param {string} name - Group name
     * @param {Array} participants - Array of participant objects
     * @returns {Object} Validation result
     */
    validateGroupCreation(name, participants) {
        const errors = [];

        if (!name || name.trim().length === 0) {
            errors.push('Group name is required');
        }

        if (!participants || !Array.isArray(participants) || participants.length === 0) {
            errors.push('At least one participant is required');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
};