package personal.social.user.domain.event;

import personal.social.shared.domain.DomainEvent;

import java.time.LocalDateTime;

/**
 * Event that is published when a new user is created in the system.
 * <p>
 * This event contains the essential information about the newly created user,
 * including their unique identifier, email address, and full name.
 *
 * @param userId   The unique identifier of the created user
 * @param email    The email address of the created user
 * @param fullName The full name of the created user
 * @param occurredOn The timestamp when the event occurred
 */
public record UserCreatedEvent(
        String userId,
        String email,
        String fullName,
        LocalDateTime occurredOn
) implements DomainEvent {

    public UserCreatedEvent(String userId, String email, String fullName) {
        this(userId, email, fullName, LocalDateTime.now());
    }
}
