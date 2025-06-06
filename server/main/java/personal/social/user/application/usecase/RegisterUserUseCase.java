package personal.social.user.application.usecase;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import personal.social.user.domain.exception.UserAlreadyExistsException;
import personal.social.user.domain.model.vo.Email;
import personal.social.user.domain.model.vo.UserId;
import personal.social.user.domain.model.UserProfile;
import personal.social.user.domain.model.Users;
import personal.social.user.application.service.PasswordEncoder;
import personal.social.user.domain.event.UserEventPublisher;
import personal.social.user.domain.repository.UserRepository;
import personal.social.user.application.dto.in.RegisterUserRequest;
import personal.social.user.application.dto.out.RegisterUserResponse;

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

    public RegisterUserResponse execute(RegisterUserRequest request) {
        // 1. Validate business rules
        Email email = Email.of(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("User with email already exists: " + email.value());
        }

        // 2. Create domain object
        UserProfile profile = new UserProfile(
                request.firstName(),
                request.middleName(),
                request.lastName(),
                request.bio(),
                request.avatarUrl()
        );

        String hashedPassword = passwordEncoder.encode(request.password());

        Users user = Users.create(
                UserId.generate(),
                email,
                profile,
                hashedPassword
        );

        // 3. Save user
        Users savedUser = userRepository.save(user);

        // 4. Publish events
        eventPublisher.publishEvents(savedUser.getDomainEvents());
        savedUser.clearDomainEvents();

        return new RegisterUserResponse(
                savedUser.getId().value(),
                savedUser.getEmail().value(),
                savedUser.getProfile().getFullName(),
                savedUser.getCreatedAt()
        );
    }
}
