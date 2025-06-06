package personal.social.user.domain.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import personal.social.user.domain.model.vo.Email;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Represents a user entity in the social application domain model.
 * <p>
 * This class is a core domain model that encapsulates the essential attributes and behaviors
 * of a user within the system. It follows immutable design principles for critical fields
 * such as id and email, while allowing for profile updates.
 * <p>
 * Users are identified uniquely by their {@link UserId} and can be created only through
 * the factory method {@link #create(UserId, Email, UserProfile)}.
 *
 * @author Social Application Team
 * @since 1.0
 */
@Getter
@Setter
@Builder
public class Users {
    private final UserId id;
    private final Email email;
    private UserProfile profile;
    private final LocalDateTime createdAt;
    private LocalDateTime lastActiveAt;

    /**
     * Private constructor for creating a new Users instance.
     * <p>
     * This constructor initializes a user entity with the provided identity, email, and profile.
     * It automatically sets the creation and last activity timestamps to the current time.
     * All parameters are validated to ensure they are not null.
     *
     * @param id      the unique identifier for this user, must not be null
     * @param email   the email address of the user, must not be null
     * @param profile the user's profile information, must not be null
     * @throws NullPointerException if any parameter is null
     */
    private Users(UserId id, Email email, UserProfile profile) {
        this.id = Objects.requireNonNull(id);
        this.email = Objects.requireNonNull(email);
        this.profile = Objects.requireNonNull(profile);
        this.createdAt = LocalDateTime.now();
        this.lastActiveAt = LocalDateTime.now();
    }

    /**
     * Creates a new Users instance with the specified ID, email, and profile.
     *
     * @param id      the unique identifier for the user
     * @param email   the email address of the user
     * @param profile the profile information of the user
     * @return a new Users instance
     */
    public static Users create(UserId id, Email email, UserProfile profile) {
        return new Users(id, email, profile);
    }

    /**
     * Updates the user's profile with a new profile.
     * 
     * @param newProfile The new profile information to update the user with
     */
    public void updateProfile(UserProfile newProfile) {
        this.profile = newProfile;
    }
}