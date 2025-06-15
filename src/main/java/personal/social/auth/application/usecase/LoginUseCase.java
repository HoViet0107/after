package personal.social.auth.application.usecase;

import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import personal.social.auth.application.dto.in.LoginRequest;
import personal.social.auth.application.dto.out.LoginResponse;
import personal.social.auth.application.service.LoginRequestValidator;
import personal.social.auth.domain.model.UserSession;
import personal.social.auth.domain.model.enums.Platform;
import personal.social.auth.domain.repository.SessionRepository;
import personal.social.config.JwtTokenProvider;
import personal.social.shared.application.dto.BaseResponse;
import personal.social.user.domain.model.Users;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LoginUseCase {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final SessionRepository sessionRepository;

    public BaseResponse<?> execute(LoginRequest request, HttpServletRequest httpRequest) {
        // Validate business rules
        LoginRequestValidator.validateLoginRequest(request);

        // Authenticate user
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        Users user = (Users) authentication.getPrincipal();
        Platform platform = Platform.fromValue(request.platform());

        // Check và invalidate session cũ của platform này
        sessionRepository.findActiveSessionByUserAndPlatform(user.getId(), platform)
                .ifPresent(oldSession -> {
                    log.info("Invalidating old session {} for user {} on platform {}",
                            oldSession.getSessionId(), user.getId(), platform);
                    sessionRepository.invalidateSession(oldSession.getSessionId());
                });

        // Tạo session mới
        String sessionId = UUID.randomUUID().toString();
        Instant now = Instant.now();
        Instant expiresAt = now.plus(30, ChronoUnit.DAYS);

        UserSession session = UserSession.builder()
                .sessionId(sessionId)
                .userId(user.getId())
                .platform(platform)
                .deviceId(request.deviceId())
                .deviceInfo(request.deviceInfo())
                .ipAddress(getClientIp(httpRequest))
                .userAgent(httpRequest.getHeader("User-Agent"))
                .createdAt(now)
                .lastAccessedAt(now)
                .expiresAt(expiresAt)
                .isActive(true)
                .build();

        // Lưu session vào Redis
        sessionRepository.saveSession(session);

        // Generate tokens
        String accessToken = tokenProvider.generateAccessToken(user, sessionId);
        String refreshToken = tokenProvider.generateRefreshToken(user, sessionId);

        LoginResponse loginResponse = new LoginResponse(
                accessToken,
                "Bearer",
                tokenProvider.getAccessTokenExpirationMs(accessToken),
                refreshToken,
                sessionId,
                LoginResponse.UserInfo.builder()
                        .id(user.getId().value())
                        .email(String.valueOf(user.getEmail()))
                        .fullName(user.getFullName())
                        .build()
        );

        return new BaseResponse<>(loginResponse, "Login successful");
    }

    private String getClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0];
    }
}
