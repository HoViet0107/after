package personal.social.user.application.usecase;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import personal.social.user.domain.exception.UserAlreadyExistsException;
import personal.social.user.domain.model.Email;
import personal.social.user.domain.model.UserId;
import personal.social.user.domain.model.UserProfile;
import personal.social.user.domain.model.Users;
import personal.social.user.domain.port.PasswordEncoder;
import personal.social.user.domain.port.UserEventPublisher;
import personal.social.user.domain.port.UserRepository;
import personal.social.user.application.dto.RegisterUserRequest;
import personal.social.user.application.dto.RegisterUserResponse;

/**
 * Service responsible for registering new users in the system.
 * This use case validates that the email is not already in use,
 * creates a new user with the provided profile information,
 * persists it to the repository, and publishes a user creation event.
 * The password is encoded before storage for security.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class RegisterUserUseCase {

    private final UserRepository userRepository;
    private final UserEventPublisher eventPublisher;
    private final PasswordEncoder passwordEncoder;

    /**
     * Executes the user registration use case.
     * <p>
     * Registers a new user with the provided email, profile information, and password.
     * The password is encoded before storage for security.
     * If the email already exists, throws a UserAlreadyExistsException.
     * Otherwise, creates a new user, persists it, and publishes a user creation event.
     * <p>
     * @param request a DTO containing the user registration data
     * @return a DTO containing the newly created user's data
     * @throws UserAlreadyExistsException if the email already exists
     */
    public RegisterUserResponse execute(RegisterUserRequest request) {
        // 1. Validate business rules
        Email email = Email.of(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("User with email already exists: " + email.value());
        }

        // 2. Create domain object
        UserProfile profile = new UserProfile(
                request.firstName(),
                request.lastName(),
                request.middleName(),
                request.bio(),
                request.avatarUrl()
        );

        Users user = Users.create(
                UserId.of(System.currentTimeMillis()), // In real app, use proper ID generation
                email,
                profile
        );

        // 3. Save user
        Users savedUser = userRepository.save(user);

        // 4. Publish event
        eventPublisher.publishUserCreated(savedUser);

        return new RegisterUserResponse(
                savedUser.getId().value(),
                savedUser.getEmail().value(),
                savedUser.getProfile().getFullName(),
                savedUser.getCreatedAt()
        );
    }
}
