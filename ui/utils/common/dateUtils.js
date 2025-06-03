import { format, formatDistanceToNow, isToday, isYesterday, differenceInMinutes } from 'date-fns';

export const dateUtils = {
    // Extracted from messageFormatter.js + MessageList.vue + ConversationList.vue
    /**
     * Format a timestamp for display in message bubbles
     * @param {string|Date} timestamp - Date object or ISO string
     * @param {Object} options - Configuration options
     * @param {boolean} [options.showSeconds=false] - Whether to include seconds in formatted time
     * @returns {string} Formatted time string
     * @example
     * // Format a timestamp without seconds
     * formatMessageTime('2022-01-01T12:00:00.000Z')
     * // '12:00 PM'
     *
     * // Format a timestamp with seconds
     * formatMessageTime('2022-01-01T12:00:00.000Z', { showSeconds: true })
     * // '12:00:00 PM'
     */
    formatMessageTime(timestamp, options = {}) {
        if (!timestamp) return '';
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        const { showSeconds = false } = options;
        const timeFormat = showSeconds ? 'h:mm:ss a' : 'h:mm a';
        return format(date, timeFormat);
    },

    formatMessageDate(timestamp) {
        if (!timestamp) return '';
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'MMMM d, yyyy');
    },

    /**
     * Format a relative time for last seen/activity indicators
     * @param {string|Date} timestamp - Date object or ISO string
     * @returns {string} Formatted relative time (e.g., "2 hours ago")
     */
    formatRelativeTime(timestamp) {
        if (!timestamp) return '';
        const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
        return formatDistanceToNow(date, { addSuffix: true });
    },

    /**
     * Check whether to show a date separator between two messages
     * @param {Object} currentMessage - Current message object
     * @param {Object} previousMessage - Previous message object
     * @param {number} index - Index of the current message
     * @returns {boolean} Whether to show a date separator
     */
    shouldShowDateSeparator(currentMessage, previousMessage, index) {
        if (index === 0) return true;
        if (!currentMessage || !previousMessage) return false;

        const currentDate = new Date(currentMessage.sentAt).toDateString();
        const previousDate = new Date(previousMessage.sentAt).toDateString();
        return currentDate !== previousDate;
    },

    /**
     * Check whether to group the current message with the previous one
     * @param {Object} currentMessage - Current message object
     * @param {Object} previousMessage - Previous message object
     * @param {number} index - Index of the current message
     * @returns {boolean} Whether to group the messages
     */
    shouldGroupWithPrevious(currentMessage, previousMessage, index) {
        if (index === 0 || !currentMessage || !previousMessage) return false;

        return currentMessage.senderId === previousMessage.senderId &&
            differenceInMinutes(new Date(currentMessage.sentAt), new Date(previousMessage.sentAt)) < 5;
    },

    /**
     * Format a timestamp for display in conversation list
     * @param {string|Date} timestamp - Date object or ISO string
     * @returns {string} Formatted time string
     */
    formatConversationTime(timestamp) {
        if (!timestamp) return '';

        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = (now - date) / (1000 * 60 * 60);

        if (diffInHours < 24) {
            return date.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } else if (diffInHours < 168) { // 7 days
            return date.toLocaleDateString('en-US', { weekday: 'short' });
        } else {
            return date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
        }
    }
};