package personal.social.user.application.usecase;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import personal.social.user.application.dto.out.UserResponse;
import personal.social.user.domain.exception.UserNotFoundException;
import personal.social.user.domain.model.Users;
import personal.social.user.domain.model.vo.Email;
import personal.social.user.domain.repository.UserRepository;

@Service
@RequiredArgsConstructor
public class GetUserProfileUseCase {
    private final UserRepository userRepository;

    /**
     * Executes the use case to fetch a user profile by email.
     * <p>
     * This method validates the input by checking if the email is null or empty.
     * Then, it fetches the user profile from the repository using the given email.
     * If no user is found, it throws a UserNotFoundException.
     * Finally, it converts the user profile to a response DTO and returns it.
     *
     * @param email the email of the user to fetch
     * @return a response DTO containing the user profile
     * @throws UserNotFoundException if the user is not found
     * @throws IllegalArgumentException if the email is null or empty
     */
    @Transactional
    public UserResponse execute(String email) {
        // Validate input
        if (email == null || email.isEmpty()) {
            throw new IllegalArgumentException("User Email must not be null or empty");
        }

        // Fetch user profile from repository
        Users user = userRepository.findByEmail(Email.of(email))
                .orElseThrow(() -> new UserNotFoundException("User not found: " + email));

        // Convert to response DTO
        return UserResponse.from(user);
    }
}
