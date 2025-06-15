package personal.social.auth.infrastructure.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import personal.social.auth.application.dto.in.LoginRequest;
import personal.social.auth.application.usecase.LoginUseCase;
import personal.social.auth.application.usecase.LogoutUseCase;
import personal.social.config.JwtTokenProvider;
import personal.social.shared.application.dto.BaseResponse;
import personal.social.shared.infrastructure.security.RateLimit;
import personal.social.auth.application.dto.in.RegisterRequest;
import personal.social.auth.application.usecase.RegisterUseCase;
import personal.social.user.domain.model.Users;

@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AuthController {

    private final JwtTokenProvider tokenProvider;
    private final RegisterUseCase registerUseCase;
    private final LoginUseCase loginUseCase;
    private final LogoutUseCase logoutUseCase;

    @PostMapping("/login")
    @RateLimit(limit = 5, windowSeconds = 60)
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        return ResponseEntity.ok(loginUseCase.execute(request, httpRequest));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String sessionId = tokenProvider.getSessionIdFromToken(token);
        logoutUseCase.execute(sessionId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/logout-all")
    public ResponseEntity<Void> logoutAllDevices(@AuthenticationPrincipal Users user) {
        logoutUseCase.executeAllDevices(user.getId());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/register")
    @RateLimit(limit = 5, windowSeconds = 15, perUser = false)
    public ResponseEntity<BaseResponse<?>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(registerUseCase.execute(request));
    }
}
