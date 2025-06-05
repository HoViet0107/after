package personal.social.user.infrastructure.persistence;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository interface for managing {@link UserEntity} objects in the database.
 * Provides methods for querying user data using Spring Data JPA.
 * <p>
 * This repository extends JpaRepository, which provides basic CRUD operations
 * and pagination support for the UserEntity class.
 */
public interface UserJpaRepository extends JpaRepository<UserEntity, Long> {
    
    /**
     * Finds a user by their email address.
     *
     * @param email the email address to search for
     * @return an Optional containing the user if found, or empty if not found
     */
    Optional<UserEntity> findByEmail(String email);
    
    /**
     * Checks if a user with the given email address exists in the database.
     *
     * @param email the email address to check
     * @return true if a user with the email exists, false otherwise
     */
    boolean existsByEmail(String email);

    /**
     * Retrieves all users who are currently online.
     *
     * @return a list of online users
     */
    @Query("SELECT u FROM UserEntity u WHERE u.isOnline = true")
    List<UserEntity> findAllOnlineUsers();

    /**
     * Finds users who have been active since the specified time.
     *
     * @param since the timestamp to check activity against
     * @return a list of users active since the specified time
     */
    @Query("SELECT u FROM UserEntity u WHERE u.lastActiveAt > :since")
    List<UserEntity> findActiveUsersSince(@Param("since") LocalDateTime since);
}
