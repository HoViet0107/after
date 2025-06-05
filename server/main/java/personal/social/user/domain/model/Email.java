package personal.social.user.domain.model;

/**
 * A value object that represents an email address.
 * <p>
 * This record encapsulates an email address string value and ensures
 * it follows a valid format through validation against a regular expression.
 * Invalid or null email addresses will be rejected during instantiation.
 * <p>
 * The validation follows a basic pattern checking format: username@domain
 *
 * @throws IllegalArgumentException if the email value is null or doesn't match the required format
 */
public record Email(String value) {
    private static final String EMAIL_REGEX = "^[A-Za-z0-9+_.-]+@(.+)$";

    /**
     * Constructs an Email instance with validation.
     * <p>
     * This constructor ensures that the provided email address conforms to
     * standard email format requirements. The validation uses a regular expression
     * pattern defined by {@code EMAIL_REGEX}.
     *
     * @param value The email address string to be validated and stored
     * @throws IllegalArgumentException If the email is null or does not match the required format
     */
    public Email {
        if (value == null || !value.matches(EMAIL_REGEX)) {
            throw new IllegalArgumentException("Invalid email format");
        }
    }

    /**
     * Creates a new Email instance from the provided string value.
     *
     * @param value the string representation of the email address
     * @return a new Email object containing the specified value
     * @throws IllegalArgumentException if the provided value is not a valid email format
     */
    public static Email of(String value) {
        return new Email(value);
    }
}
