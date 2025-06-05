package personal.social.user.domain.port;

/**
 * Interface for encoding passwords and verifying password matches.
 * <p>
 * This interface is used to abstract the implementation details of password
 * encryption and validation algorithms.
 * </p>
 */
public interface PasswordEncoder {
    /**
     * Encodes a raw password.
     * 
     * @param rawPassword the password to encode, must not be null
     * @return the encoded password
     */
    String encode(String rawPassword);
    
    /**
     * Verifies that the raw password matches the encoded password.
     * 
     * @param rawPassword the raw password to check
     * @param encodedPassword the encoded password to check against
     * @return true if the passwords match, false otherwise
     */
    boolean matches(String rawPassword, String encodedPassword);
}
