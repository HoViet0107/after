import { ref } from 'vue';

/**
 * Composable to manage notifications
 *
 * @returns {{
 *   notifications: import('vue').Ref<Notification[]>,
 *   createNotification: (message: string, type?: 'info' | 'success' | 'warning' | 'error', timeout?: number) => number,
 *   removeNotification: (id: number) => void,
 *   success: (message: string, timeout?: number) => number,
 *   error: (message: string, details?: string, timeout?: number) => number,
 *   warning: (message: string, timeout?: number) => number,
 *   info: (message: string, timeout?: number) => number,
 *   clearAll: () => void
 * }}
 */

export function useNotifications() {
    const notifications = ref([]);
    const maxNotifications = 5;

    /**
     * Create a new notification and add it to the list.
     * Automatically removes the oldest notification if the limit is exceeded.
     * Auto-removes the notification after the specified timeout duration.
     *
     * @param {string} message - The message to display in the notification.
     * @param {'info' | 'success' | 'warning' | 'error'} [type='info'] - The type of notification.
     * @param {number} [timeout=5000] - Duration in milliseconds before the notification is automatically removed.
     *                                   Set to 0 for no auto-removal.
     * @returns {number} - The unique identifier of the created notification.
     */
    const createNotification = (message, type = 'info', timeout = 5000) => {
        const id = Date.now() + Math.random();
        const notification = {
            id,
            message,
            type,
            timestamp: new Date(),
            timeout,
            visible: true
        };

        // Add to list
        notifications.value.push(notification);

        // Limit number of notifications displayed
        if (notifications.value.length > maxNotifications) {
            const toRemove = notifications.value.shift();
            clearTimeout(toRemove.timeoutId);
        }

        // Auto-remove after timeout
        if (timeout > 0) {
            notification.timeoutId = setTimeout(() => {
                removeNotification(id);
            }, timeout);
        }

        return id;
    };

    /**
     * Remove a notification from the list by its ID.
     * Clears the timeout if it exists.
     *
     * @param {number} id - The unique identifier of the notification to remove.
     */
    const removeNotification = (id) => {
        const index = notifications.value.findIndex(n => n.id === id);
        if (index !== -1) {
            // Clear timeout if exists
            const notification = notifications.value[index];
            if (notification.timeoutId) {
                clearTimeout(notification.timeoutId);
            }

            // Remove from list
            notifications.value.splice(index, 1);
        }
    };

    /**
     * Helper methods for common notification types
     *
     * @param {string} message - The message to display in the notification.
     * @param {number} [timeout=5000] - Duration in milliseconds before the notification is automatically removed.
     *                                   Set to 0 for no auto-removal.
     * @returns {number} - The unique identifier of the created notification.
     */
    const success = (message, timeout = 5000) => {
        return createNotification(message, 'success', timeout);
    };

    const error = (message, details = '', timeout = 8000) => {
        const displayMessage = details ? `${message}: ${details}` : message;
        return createNotification(displayMessage, 'error', timeout);
    };

    const warning = (message, timeout = 7000) => {
        return createNotification(message, 'warning', timeout);
    };

    const info = (message, timeout = 5000) => {
        return createNotification(message, 'info', timeout);
    };

    /**
     * Clear all notifications
     */
    const clearAll = () => {
        notifications.value.forEach(notification => {
            if (notification.timeoutId) {
                clearTimeout(notification.timeoutId);
            }
        });
        notifications.value = [];
    };

    return {
        notifications,
        createNotification,
        removeNotification,
        success,
        error,
        warning,
        info,
        clearAll
    };
}