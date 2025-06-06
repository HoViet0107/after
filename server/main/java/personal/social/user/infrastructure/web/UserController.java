package personal.social.user.infrastructure.web;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import personal.social.user.application.dto.RegisterUserRequest;
import personal.social.user.application.dto.RegisterUserResponse;
import personal.social.user.application.dto.UpdateUserProfileRequest;
import personal.social.user.application.dto.UpdateUserProfileResponse;
import personal.social.user.application.usecase.RegisterUserUseCase;
import personal.social.user.application.usecase.UpdateUserProfileUseCase;
import personal.social.user.domain.exception.UserAlreadyExistsException;
import personal.social.user.domain.exception.UserNotFoundException;

/**
 * REST controller that handles user-related HTTP requests.
 * Provides endpoints for user registration and profile updates.
 * Delegates business logic to appropriate use cases and handles exceptions
 * by returning appropriate HTTP responses.
 */
@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
public class UserController {

    private final RegisterUserUseCase registerUserUseCase;
    private final UpdateUserProfileUseCase updateUserProfileUseCase;

    public UserController(RegisterUserUseCase registerUserUseCase,
                          UpdateUserProfileUseCase updateUserProfileUseCase) {
        this.registerUserUseCase = registerUserUseCase;
        this.updateUserProfileUseCase = updateUserProfileUseCase;
    }

    /**
     * Handles a user registration request.
     * <p>
     * Registers a user if the email does not exist.
     * If the email already exists, returns HTTP 400.
     *
     * @param request a DTO containing the user registration data
     * @return a DTO containing the newly created user's data
     * @throws UserAlreadyExistsException if the email already exists
     */
    @PostMapping("/register")
    public ResponseEntity<RegisterUserResponse> register(
            @Valid @RequestBody RegisterUserRequest request) {
        try {
            RegisterUserResponse response = registerUserUseCase.execute(request);
            return ResponseEntity.ok(response);
        } catch (UserAlreadyExistsException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Updates a user's profile information.
     *
     * @param userId  The unique identifier of the user whose profile is being updated
     * @param request The request object containing the updated profile information, must be valid
     * @return ResponseEntity containing the updated profile information if successful
     * @throws UserNotFoundException if no user exists with the specified userId
     */
    @PutMapping("/{userId}/profile")
    public ResponseEntity<UpdateUserProfileResponse> updateProfile(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        try {
            UpdateUserProfileResponse response = updateUserProfileUseCase.execute(request);
            return ResponseEntity.ok(response);
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
