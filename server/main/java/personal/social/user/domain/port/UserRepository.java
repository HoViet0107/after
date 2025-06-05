package personal.social.user.domain.port;

import personal.social.user.domain.model.Email;
import personal.social.user.domain.model.UserId;
import personal.social.user.domain.model.Users;

import java.util.Optional;

/**
 * Repository interface for managing user entities in the persistence layer.
 * Provides operations to create, read, and delete user data.
 */
public interface UserRepository {
    /**
     * Saves a user to the repository.
     *
     * @param user The user entity to be saved
     * @return The saved user entity, possibly with updated information
     */
    Users save(Users user);
    
    /**
     * Finds a user by their unique identifier.
     *
     * @param id The user's unique identifier
     * @return An Optional containing the found user, or empty if no user exists with the given ID
     */
    Optional<Users> findById(UserId id);
    
    /**
     * Finds a user by their email address.
     *
     * @param email The email address to search for
     * @return An Optional containing the found user, or empty if no user exists with the given email
     */
    Optional<Users> findByEmail(Email email);
    
    /**
     * Deletes a user from the repository.
     *
     * @param id The unique identifier of the user to delete
     */
    void delete(UserId id);
    
    /**
     * Checks if a user with the given email exists in the repository.
     *
     * @param email The email address to check
     * @return true if a user with the email exists, false otherwise
     */
    boolean existsByEmail(Email email);
}
