package personal.social.user.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import personal.social.shared.infrastructure.security.RateLimit;
import personal.social.user.application.dto.in.RegisterUserRequest;
import personal.social.user.application.dto.in.UserStatusUpdateRequest;
import personal.social.user.application.dto.out.EditUserProfileResponse;
import personal.social.user.application.dto.out.RegisterUserResponse;
import personal.social.user.application.dto.in.UpdateUserProfileRequest;
import personal.social.user.application.usecase.RegisterUserUseCase;
import personal.social.user.application.usecase.UpdateUserProfileUseCase;
import personal.social.user.application.usecase.UpdateUserStatusUseCase;
import personal.social.user.domain.exception.UserAlreadyExistsException;
import personal.social.user.domain.exception.UserNotFoundException;

@RestController
@RequestMapping("/api/v1/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class UserController {

    private final RegisterUserUseCase registerUserUseCase;
    private final UpdateUserProfileUseCase updateUserProfileUseCase;
    private final UpdateUserStatusUseCase updateUserStatusUseCase;

    @PostMapping("/register")
    @RateLimit(limit = 5, windowSeconds = 300) // 5 registrations per 5 minutes
    public ResponseEntity<RegisterUserResponse> register(
            @Valid @RequestBody RegisterUserRequest request) {
        try {
            RegisterUserResponse response = registerUserUseCase.execute(request);
            return ResponseEntity.ok(response);
        } catch (UserAlreadyExistsException e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{userId}/profile")
    @RateLimit(limit = 10, windowSeconds = 60)
    public ResponseEntity<EditUserProfileResponse> updateProfile(
            @PathVariable String userId,
            @Valid @RequestBody UpdateUserProfileRequest request) {
        try {
            EditUserProfileResponse response = updateUserProfileUseCase.execute(request);
            return ResponseEntity.ok(response);
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{userId}/status")
    @RateLimit(limit = 60, windowSeconds = 60) // High limit for status updates
    public ResponseEntity<Void> updateStatus(
            @PathVariable String userId,
            @Valid @RequestBody UserStatusUpdateRequest request) {
        try {
            switch (request.status().toLowerCase()) {
                case "online" -> updateUserStatusUseCase.userGoesOnline(userId);
                case "offline" -> updateUserStatusUseCase.userGoesOffline(userId);
                case "active" -> updateUserStatusUseCase.updateUserActivity(userId);
                default -> throw new IllegalArgumentException("Invalid status: " + request.status());
            }
            return ResponseEntity.ok().build();
        } catch (UserNotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
