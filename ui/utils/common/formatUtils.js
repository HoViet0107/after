export const formatUtils = {
    /**
     * Truncate a text to a specified length.
     * @param {string} text - Text to truncate
     * @param {number} [maxLength=50] - Maximum length of the text
     * @returns {string} Truncated text
     */
    truncateText(text, maxLength = 50) {
        if (!text || typeof text !== 'string') return '';
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength - 3)}...`;
    },

    /**
     * Capitalize the first letter of a string.
     * @param {string} text - Text to capitalize
     * @returns {string} Capitalized text
     */
    capitalize(text) {
        if (!text || typeof text !== 'string') return '';
        return text.charAt(0).toUpperCase() + text.slice(1);
    },

    /**
     * Convert a string to a slug.
     * @param {string} text - Text to slugify
     * @returns {string} Slugged text
     */
    slugify(text) {
        if (!text || typeof text !== 'string') return '';
        return text
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]+/g, '')
            .replace(/--+/g, '-')
            .replace(/^-+|-+$/g, '');
    },

    /**
     * Format a user's name.
     * @param {Object} user - User object
     * @returns {string} Formatted user name
     */
    formatUserName(user) {
        if (!user) return 'Unknown';
        if (user.fullName) return user.fullName;
        if (user.firstName && user.lastName) return `${user.firstName} ${user.lastName}`;
        if (user.firstName) return user.firstName;
        if (user.email) return user.email;
        return 'Unknown';
    }
};