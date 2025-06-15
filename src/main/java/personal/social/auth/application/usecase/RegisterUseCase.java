package personal.social.auth.application.usecase;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.social.auth.application.service.RegisterRequestValidator;
import personal.social.auth.domain.exception.UserAlreadyExistsException;
import personal.social.shared.application.dto.BaseResponse;
import personal.social.user.domain.model.vo.Email;
import personal.social.user.domain.model.UserProfile;
import personal.social.user.domain.model.Users;
import personal.social.auth.application.service.PasswordEncoder;
import personal.social.shared.domain.event.EventPublisher;
import personal.social.auth.application.dto.in.RegisterRequest;
import personal.social.auth.application.dto.out.RegisterResponse;
import personal.social.user.domain.repository.UserRepository;

/**
 * Service responsible for registering new users in the system.
 * This use case validates that the email is not already in use,
 * creates a new user with the provided profile information,
 * persists it to the repository, and publishes a user creation event.
 * The password is encoded before storage for security.
 */
@Service
@Transactional(rollbackFor = Exception.class)
@RequiredArgsConstructor
@Slf4j
public class RegisterUseCase {

    private final UserRepository userRepository;
    private final EventPublisher eventPublisher;
    private final PasswordEncoder passwordEncoder;

    public BaseResponse<?> execute(RegisterRequest request) {
        // 1. Validate business rules
        Email email = Email.of(request.email());
        if (userRepository.existsByEmail(email)) {
            throw new UserAlreadyExistsException("User with email already exists: " + email.value());
        }
        RegisterRequestValidator.validateRegisterRequest(request);

        // 2. Create domain object
        UserProfile profile = new UserProfile(
                request.firstName(),
                request.middleName(),
                request.lastName(),
                request.bio(),
                request.dob(),
                request.gender(),
                request.avatarUrl()
        );

        String hashedPassword = passwordEncoder.encode(request.password());

        Users user = Users.createWithAutoId(
                email,
                profile,
                hashedPassword,
                request.phoneNumber()
        );

        // 3. Save user
        Users savedUser = userRepository.save(user);

        // 4. Publish events
        eventPublisher.publishEvents(savedUser.getDomainEvents());
        savedUser.clearDomainEvents();

        RegisterResponse response = new RegisterResponse(
                "User registered successfully",
                true
        );
        return new BaseResponse<>(response, "Register successful");
    }
}
