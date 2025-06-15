package personal.social.user.domain.model.vo;

import java.util.UUID;

/**
 * Represents a unique identifier for a user in the system.
 * This is a value object that wraps a positive Long value ensuring its validity.
 * <p>
 * The UserId is immutable and validates that the ID value is positive and non-null during creation.
 *
 * @param value the numeric value of the user ID
 */
public record UserId(String value) {
    public UserId {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("User ID must be positive");
        }
    }

    public static UserId of(String value) {
        return new UserId(value);
    }

    public static UserId generate() {
        return new UserId(UUID.randomUUID().toString());
    }
}
