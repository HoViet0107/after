package personal.social.user.domain.port;

import personal.social.user.domain.model.Users;

/**
 * Interface for publishing user-related domain events.
 * <p>
 * This interface defines methods for publishing events related to user actions
 * and state changes. Implementations of this interface are responsible for
 * propagating these events to the appropriate event handlers or subscribers.
 * </p>
 */
public interface UserEventPublisher {
    /**
     * Publishes an event when a new user is created in the system.
     * This method should be called after successful user creation to notify other components.
     * 
     * @param user The newly created user entity that will be published in the event
     */
    void publishUserCreated(Users user);


    /**
     * Publishes an event notification when a user's profile has been updated.
     * This method is called after a user profile update operation completes successfully,
     * allowing other system components to react to these changes.
     *
     * @param user The user entity containing the updated profile information
     */
    void publishUserProfileUpdated(Users user);
    
//    void publishUserStatusChanged(Users user);
}
