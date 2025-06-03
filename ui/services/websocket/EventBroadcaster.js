/**
 * EventBroadcaster is a simple event bus implementation for Vue 3 components.
 * It helps with cross-component communication without prop drilling.
 * @class
 * @version 1.0.0
 */
/**
* Prop drilling là hiện tượng phải truyền props qua nhiều tầng/cấp độ component con,
* ngay cả khi các component trung gian không sử dụng props đó.
*/
export class EventBroadcaster {
    /**
     * Creates a new EventBroadcaster instance.
     * @constructor
     */
    constructor() {
        this.listeners = new Map();
    }

    /**
     * Registers an event listener for a specific event.
     * @param {string} eventName - The name of the event to listen to
     * @param {Function} callback - The callback function to be called when the event is emitted
     * @returns {Function} An unsubscribe function to remove the listener
     */
    on(eventName, callback) {
        if (!this.listeners.has(eventName)) {
            this.listeners.set(eventName, new Set());
        }

        this.listeners.get(eventName).add(callback);

        // Return unsubscribe function
        return () => {
            this.off(eventName, callback);
        };
    }

    /**
     * Unregisters an event listener for a specific event.
     * @param {string} eventName - The name of the event to listen to
     * @param {Function} callback - The callback function to be called when the event is emitted
     * @returns {Function} An unsubscribe function to remove the listener
     */
    off(eventName, callback) {
        if (!this.listeners.has(eventName)) return;

        const eventListeners = this.listeners.get(eventName);
        if (callback) {
            eventListeners.delete(callback);
        } else {
            eventListeners.clear();
        }

        // Remove the event entry if there are no listeners
        if (eventListeners.size === 0) {
            this.listeners.delete(eventName);
        }
    }

    /**
     * Emits an event to all registered listeners.
     * @param {string} eventName - The name of the event to emit
     * @param {Object} data - The data to emit with the event
     */
    emit(eventName, data) {
        if (!this.listeners.has(eventName)) return;

        const eventListeners = this.listeners.get(eventName);
        eventListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for ${eventName}:`, error);
            }
        });
    }

    /**
     * Clears all registered listeners.
     */
    clear() {
        this.listeners.clear();
    }
}