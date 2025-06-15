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
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String firstName;

    @Column(nullable = false)
    private String lastName;

    @Column(nullable = false)
    private LocalDateTime dob;

    @Column(nullable = false)
    private String gender;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "last_active_at", nullable = false)
    private LocalDateTime lastActiveAt;

    // Allows null
    private String middleName;
    private String bio;
    private String avatarUrl;

    // Default values for status and online status
    @Column(name = "status", nullable = false)
    private String status = "ACTIVE";
    @Column(name = "is_online", nullable = false)
    private Boolean isOnline = false;

    public UserEntity(String email, String firstName, String lastName,
                      String bio, String avatarUrl, String gender) {
        this.email = email;
        this.firstName = firstName;
        this.lastName = lastName;
        this.bio = bio;
        this.avatarUrl = avatarUrl;
        this.gender = gender;
        this.createdAt = LocalDateTime.now();
        this.lastActiveAt = LocalDateTime.now();
    }

    public String getFullName() {
        return String.format("%s %s %s", firstName, middleName, lastName).trim();
    }
}