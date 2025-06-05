package personal.social.user.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Entity class representing a user in the social application.
 * <p>
 * This class maps to the "users" table in the database and contains all necessary
 * user information including personal details, profile data, and timestamps.
 * It is used for persisting user data through JPA/Hibernate.
 * </p>
 *
 * @Entity annotation marks this class as a JPA entity
 * @Table indicates the corresponding database table name
 */
@Entity
@Table(name = "users")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserEntity {
    /**
     * @Id marks this as the entity's primary key
     * @GeneratedValue specifies that the ID is auto-generated
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * User's unique email address
     * Used as a unique identifier for the user in addition to the ID
     */
    @Column(unique = true, nullable = false)
    private String email;

    /**
     * User's first name
     */
    @Column(nullable = false)
    private String firstName;

    /**
     * User's middle name
     */
    @Column(nullable = false)
    private String middleName;

    /**
     * User's last name
     */
    @Column(nullable = false)
    private String lastName;

    /**
     * Optional biography/description of the user
     */
    private String bio;

    /**
     * URL reference to the user's profile picture
     */
    @Column(name = "avatar_url")
    private String avatarUrl;

    /**
     * Timestamp when the user account was created
     * Automatically set during entity creation
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * Timestamp when the user was last active on the platform
     * Updated whenever user activity is detected
     */
    @Column(name = "last_active_at", nullable = false)
    private LocalDateTime lastActiveAt;

    // Constructors
    /**
     * Creates a new user entity with the specified details.
     *
     * @param email     User's email address
     * @param firstName User's first name
     * @param lastName  User's last name
     * @param bio       User's biography
     * @param avatarUrl URL to user's avatar image
     */
    public UserEntity(String email, String firstName, String lastName,
                      String bio, String avatarUrl) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.createdAt = LocalDateTime.now();
        this.lastActiveAt = LocalDateTime.now();
    }

    public String getFullName() {
        return String.format("%s %s %s", firstName, middleName, lastName).trim();
    }
}
