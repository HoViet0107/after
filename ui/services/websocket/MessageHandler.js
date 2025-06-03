import { messageUtils } from 'src/utils/chat/messageUtils';

/**
 * Handles messages from the WebSocket connection.
 * 
 * This class is responsible for processing messages from the WebSocket connection.
 * It supports queuing messages if the queue is not being processed, and emits events
 * when a message is processed.
 * 
 * @class MessageHandler
 * @constructor
 * @param {Object} [options] - Options for the message handler
 */
export class MessageHandler {
  constructor() {
    this.messageQueue = [];
    this.queueTimeoutId = null;
  }
  
  /**
   * Handles a message from the WebSocket connection.
   * 
   * This method processes the message based on its type and calls the appropriate
   * handler. If no handler is registered for the message type, it emits a warning.
   * 
   * @param {Object} data - The message data
   * @param {Map<string, Function>} handlers - Map of message types to handlers
   */
  handle(data, handlers) {
    if (!data || !data.type) {
      console.error('Invalid message format:', data);
      return;
    }
    
    // Process the message based on its type
    try {
      const handlersList = handlers.get(data.type) || [];
      
      if (handlersList.length > 0) {
        // If there are registered handlers for this message type, call them
        handlersList.forEach(handler => {
          try {
            handler(data);
          } catch (error) {
            console.error(`Error in handler for ${data.type}:`, error);
          }
        });
      } else {
        console.warn(`No handler registered for message type: ${data.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }
  
  /**
   * Adds a message to the queue and processes it if needed.
   * 
   * @param {Object} message - The message to add to the queue
   */
  queueMessage(message) {
    this.messageQueue.push(message);
    this.processQueueIfNeeded();
  }
  
  /**
   * Processes the message queue if needed.
   * 
   * This method checks if the queue is being processed and starts processing it if needed.
   */
  processQueueIfNeeded() {
    // If the queue is not being processed, start processing it
    if (!this.queueTimeoutId) {
      this.processQueue();
    }
  }
  
  /**
   * Processes the message queue.
   * 
   * This method processes the message queue by removing the first message from the queue
   * and processing it. If the queue is empty, it sets the queue timeout to null.
   */
  processQueue() {
    // Clear any existing timeout
    if (this.queueTimeoutId) {
      clearTimeout(this.queueTimeoutId);
    }
    
    // If the queue is empty, don't do anything
    if (this.messageQueue.length === 0) {
      this.queueTimeoutId = null;
      return;
    }
    
    // Process the first message in the queue
    const message = this.messageQueue.shift();
    const processedMessage = messageUtils.processMessage(message);
    
    // Emit an event with the processed message
    // (This would be handled by EventBroadcaster in a real implementation)
    this.emitEvent('message', processedMessage);
    
    // Set a timeout to process the next message
    this.queueTimeoutId = setTimeout(() => {
      this.processQueue();
    }, 100); // Process next message after a short delay
  }
  
  /**
   * Emits an event with the processed message.
   * 
   * This method emits an event with the processed message to listeners.
   * 
   * @param {string} eventName - The name of the event to emit
   * @param {Object} data - The data to emit with the event
   */
  emitEvent(eventName, data) {
    // This is a placeholder - in a real implementation, 
    // this would dispatch the event to listeners
    console.log(`Event emitted: ${eventName}`, data);
    // EventBroadcaster.emit(eventName, data);
  }
}