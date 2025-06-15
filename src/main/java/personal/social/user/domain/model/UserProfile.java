package personal.social.user.domain.model;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Represents a user profile in the social media application.
 * Contains personal information such as name, bio, and avatar image.
 */
@Data
public class UserProfile {
    /** The user's first name. Cannot be null. */
    private final String firstName;
    
    /** The user's middle name. Can be null. */
    private final String middleName;
    
    /** The user's last name. Cannot be null. */
    private final String lastName;
    
    /** A brief description of the user. Can be null. */
    private final String bio;

    private final LocalDateTime dob;
    private final String gender;

    /** URL to the user's profile picture. Can be null. */
    private final String avatarUrl;

    /**
     * Creates a new user profile with the specified personal information.
     *
     * @param firstName The user's first name (required, non-null)
     * @param middleName The user's middle name (optional)
     * @param lastName The user's last name (required, non-null)
     * @param bio A brief description of the user (optional)
     * @param avatarUrl URL to the user's profile picture (optional)
     * @throws NullPointerException if firstName or lastName is null
     */
    public UserProfile(String firstName, String middleName, String lastName, String bio, LocalDateTime dob, String gender, String avatarUrl) {
        this.firstName = Objects.requireNonNull(firstName);
        this.middleName = middleName;
        this.lastName = Objects.requireNonNull(lastName);
        this.bio = bio;
        this.dob = Objects.requireNonNull(dob);
        this.gender = Objects.requireNonNull(gender);
        this.avatarUrl = avatarUrl;
    }

    /**
     * Returns the user's full name, including middle name if present.
     *
     * @return The formatted full name
     */
    public String getFullName() {
        return String.format("%s %s %s", firstName,
                middleName != null ? middleName : "", lastName).trim();
    }
}
