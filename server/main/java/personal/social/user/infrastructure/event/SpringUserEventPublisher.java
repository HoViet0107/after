package personal.social.user.infrastructure.event;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import lombok.RequiredArgsConstructor;
import personal.social.user.domain.model.Users;
import personal.social.user.domain.port.UserEventPublisher;

/**
 * Implementation of UserEventPublisher that uses Spring's ApplicationEventPublisher
 * to broadcast user-related domain events within the application.
 * <p>
 * This class acts as an adapter between the domain layer's event publishing needs
 * and Spring's event publishing mechanism, allowing for loose coupling between
 * components that generate user events and those that react to them.
 * <p>
 * Events published by this class include:
 * - UserCreatedEvent: When a new user is created
 * - UserProfileUpdatedEvent: When a user's profile information is updated
 * <p>
 * The publisher handles conversion from domain entities (Users) to appropriate
 * event objects containing the relevant data needed by event consumers.
 */
@Component
@RequiredArgsConstructor
public class SpringUserEventPublisher implements UserEventPublisher {

    private final ApplicationEventPublisher eventPublisher;

    /**
     * Publishes a user creation event through the application event publisher.
     * Creates a UserCreatedEvent with essential user information and publishes it
     * to notify any listeners about the new user creation.
     *
     * @param user The newly created user entity containing identity, email and profile information
     */
    @Override
    public void publishUserCreated(Users user) {
        UserCreatedEvent event = new UserCreatedEvent(
                user.getId().value(),
                user.getEmail().value(),
                user.getProfile().getFullName()
        );
        eventPublisher.publishEvent(event);
    }

    /**
     * Publishes a user profile update event through the application event publisher.
     * Creates a UserProfileUpdatedEvent with the user's identity and updated profile information
     * and publishes it to notify any listeners about the profile changes.
     *
     * @param user The user entity with updated profile information
     */
    @Override
    public void publishUserProfileUpdated(Users user) {
        UserProfileUpdatedEvent event = new UserProfileUpdatedEvent(
                user.getId().value(),
                user.getProfile().getFullName()
        );
        eventPublisher.publishEvent(event);
    }

//    @Override
//    public void publishUserStatusChanged(Users user) {
//        UserStatusChangedEvent event = new UserStatusChangedEvent(
//                user.getId().value(),
//                user.isOnline()
//        );
//        eventPublisher.publishEvent(event);
//    }
}
