package personal.social.user.domain.model;

/**
 * Represents a unique identifier for a user in the system.
 * This is a value object that wraps a positive Long value ensuring its validity.
 * <p>
 * The UserId is immutable and validates that the ID value is positive and non-null during creation.
 *
 * @param value the numeric value of the user ID
 */
public record UserId(Long value) {
    /**
     * Compact constructor that validates the user ID value.
     *
     * @throws IllegalArgumentException if value is null or not positive
     */
    public UserId {
        if (value == null || value <= 0) {
            throw new IllegalArgumentException("User ID must be positive");
        }
    }

    /**
     * Static factory method to create a new UserId.
     *
     * @param value the numeric value of the user ID
     * @return a new UserId instance with the provided value
     * @throws IllegalArgumentException if value is null or not positive
     */
    public static UserId of(Long value) {
        return new UserId(value);
    }
}
