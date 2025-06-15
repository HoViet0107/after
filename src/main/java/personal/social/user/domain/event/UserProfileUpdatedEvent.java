package personal.social.user.domain.event;

import personal.social.shared.domain.DomainEvent;

import java.time.LocalDateTime;

/**
 * Event representing the update of a user's profile information.
 * This event is triggered when a user's profile data, specifically their full name, has been modified.
 *
 * @param userId The unique identifier of the user whose profile was updated
 * @param fullName The updated full name of the user
 * @param occurredOn The timestamp when the event occurred
 */
public record UserProfileUpdatedEvent(
        String userId,
        String fullName,
        LocalDateTime occurredOn
) implements DomainEvent {

    public UserProfileUpdatedEvent(String userId, String fullName) {
        this(userId, fullName, LocalDateTime.now());
    }
}

