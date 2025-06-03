import { ref } from 'vue';

/**
 * useErrorHandling composable for handling errors in the application.
 *
 * @returns {Object} Object containing the last error, error history, and functions for handling errors.
 *
 * @property {Ref} lastError - The last error that occurred in the application.
 * @property {Ref} errorHistory - An array of all errors that have occurred in the application, with the most recent error first.
 * @property {(error: Error, context?: string) => string} handleError - Function to handle an error. Will log the error, format the error message for display, add the error to the history, and store the last error.
 * @property {() => void} clearError - Function to clear the last error.
 * @property {() => void} clearHistory - Function to clear the error history.
 */

export function useErrorHandling() {
    const lastError = ref(null);
    const errorHistory = ref([]);

    /**
     * Handles an error by logging it, formatting an error message, and updating error history.
     * 
     * @param {Object} error - The error object, which may contain a response or request property.
     * @param {string} [context='unknown'] - Optional context indicating where the error occurred.
     * @returns {string} - A user-friendly error message.
     */
    const handleError = (error, context = 'unknown') => {
        console.error(`Error in context: ${context}`, error);

        // Format the error message for display
        let errorMessage = 'An unexpected error occurred';

        if (error.response) {
            // The request was made and the server responded with an error status
            const status = error.response.status;
            const data = error.response.data;

            // Add to history
            errorHistory.value.push({
                context,
                timestamp: new Date(),
                status,
                message: data.message || errorMessage,
                details: data
            });

            // Format error message based on status code
            if (status === 401) {
                errorMessage = 'Unauthorized: Please log in again';
            } else if (status === 403) {
                errorMessage = 'Forbidden: You don\'t have permission to access this resource';
            } else if (status === 404) {
                errorMessage = 'Not found: The requested resource does not exist';
            } else if (status === 422) {
                errorMessage = data.message || 'Validation error: Please check your input';
            } else if (status >= 500) {
                errorMessage = 'Server error: Please try again later';
            } else {
                errorMessage = data.message || errorMessage;
            }
        } else if (error.request) {
            // The request was made but no response was received
            errorMessage = 'Network error: Please check your connection';

            // Add to history
            errorHistory.value.push({
                context,
                timestamp: new Date(),
                message: errorMessage,
                details: error.request
            });
        } else {
            // Something happened in setting up the request
            errorMessage = error.message || errorMessage;

            // Add to history
            errorHistory.value.push({
                context,
                timestamp: new Date(),
                message: errorMessage,
                details: error
            });
        }

        // Store the last error
        lastError.value = {
            context,
            message: errorMessage,
            timestamp: new Date()
        };

        // Keep history size manageable
        if (errorHistory.value.length > 50) {
            errorHistory.value = errorHistory.value.slice(-50);
        }

        return errorMessage;
    };

    const clearError = () => {
        lastError.value = null;
    };

    const clearHistory = () => {
        errorHistory.value = [];
    };

    return {
        lastError,
        errorHistory,
        handleError,
        clearError,
        clearHistory
    };
}