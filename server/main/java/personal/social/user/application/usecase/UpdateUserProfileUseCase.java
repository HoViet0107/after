package personal.social.user.application.usecase;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import personal.social.user.domain.exception.UserNotFoundException;
import personal.social.user.domain.model.vo.UserId;
import personal.social.user.domain.model.UserProfile;
import personal.social.user.domain.model.Users;
import personal.social.user.domain.event.UserEventPublisher;
import personal.social.user.domain.repository.UserRepository;
import personal.social.user.application.dto.UpdateUserProfileRequest;
import personal.social.user.application.dto.UpdateUserProfileResponse;

import java.time.LocalDateTime;

/**
 * Service responsible for updating a user's profile information.
 * This use case finds a user by ID, updates their profile with new information,
 * saves the changes to the repository, and publishes a profile update event.
 * Throws UserNotFoundException if the specified user doesn't exist.
 */
@Service
@Transactional
@RequiredArgsConstructor
public class UpdateUserProfileUseCase {

    private final UserRepository userRepository;
    private final UserEventPublisher eventPublisher;

    /**
     * Updates a user's profile information.
     * <p>
     * Throws UserNotFoundException if the specified user doesn't exist.
     *
     * @param request a DTO containing the user ID and updated profile data
     * @return a DTO containing the updated user ID, full name, and the time the profile was updated
     */
    public UpdateUserProfileResponse execute(UpdateUserProfileRequest request) {
        // 1. Find user
        UserId userId = UserId.of(request.userId());
        Users user = userRepository.findById(userId)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId.value()));

        // 2. Update profile
        UserProfile newProfile = new UserProfile(
                request.firstName(),
                request.lastName(),
                request.middleName(),
                request.bio(),
                request.avatarUrl()
        );
        user.updateProfile(newProfile);

        // 3. Save changes
        Users updatedUser = userRepository.save(user);

        // 4. Publish event
        eventPublisher.publishUserProfileUpdated(updatedUser);

        return new UpdateUserProfileResponse(
                updatedUser.getId().value(),
                updatedUser.getProfile().getFullName(),
                LocalDateTime.now()
        );
    }
}
