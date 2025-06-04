package personal.social.services.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import personal.social.services.RedisService;
import personal.social.model.Users;

import java.time.Duration;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class SecurityAuditService {

    private final RedisService redisService;

    private static final String LOGIN_ATTEMPTS_KEY = "security:login_attempts:";
    private static final String SUSPICIOUS_ACTIVITY_KEY = "security:suspicious:";
    private static final String FAILED_LOGIN_KEY = "security:failed_login:";

    public void logSuccessfulLogin(Users user, String ipAddress, String userAgent) {
        try {
            String key = "security:login:" + user.getEmail();
            LoginAttempt attempt = LoginAttempt.builder()
                    .email(user.getEmail())
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .timestamp(LocalDateTime.now())
                    .success(true)
                    .build();

            redisService.lPush(key, attempt);
            redisService.expire(key, Duration.ofDays(30));

            // Clear failed login attempts on successful login
            clearFailedLoginAttempts(user.getEmail());

            log.info("Successful login recorded for user: {} from IP: {}", user.getEmail(), ipAddress);
        } catch (Exception e) {
            log.error("Error logging successful login: {}", e.getMessage());
        }
    }

    public void logFailedLogin(String email, String ipAddress, String userAgent, String reason) {
        try {
            String key = FAILED_LOGIN_KEY + email;
            LoginAttempt attempt = LoginAttempt.builder()
                    .email(email)
                    .ipAddress(ipAddress)
                    .userAgent(userAgent)
                    .timestamp(LocalDateTime.now())
                    .success(false)
                    .reason(reason)
                    .build();

            redisService.lPush(key, attempt);
            redisService.expire(key, Duration.ofHours(24));

            // Check for suspicious activity
            checkSuspiciousActivity(email, ipAddress);

            log.warn("Failed login recorded for user: {} from IP: {} - Reason: {}", email, ipAddress, reason);
        } catch (Exception e) {
            log.error("Error logging failed login: {}", e.getMessage());
        }
    }

    public boolean isAccountLocked(String email) {
        try {
            String key = FAILED_LOGIN_KEY + email;
            var failedAttempts = redisService.lRange(key, 0, -1, LoginAttempt.class);

            // Count failed attempts in last hour
            LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);
            long recentFailures = failedAttempts.stream()
                    .filter(attempt -> attempt.getTimestamp().isAfter(oneHourAgo))
                    .count();

            return recentFailures >= 5; // Lock after 5 failed attempts
        } catch (Exception e) {
            log.error("Error checking account lock status: {}", e.getMessage());
            return false;
        }
    }

    private void checkSuspiciousActivity(String email, String ipAddress) {
        try {
            // Check for multiple failed attempts from same IP
            String ipKey = SUSPICIOUS_ACTIVITY_KEY + "ip:" + ipAddress;
            Long ipAttempts = redisService.increment(ipKey);
            redisService.expire(ipKey, Duration.ofHours(1));

            if (ipAttempts > 10) {
                log.warn("Suspicious activity detected from IP: {} - {} failed attempts", ipAddress, ipAttempts);
                // Here you could trigger additional security measures
            }

            // Check for failed attempts across multiple accounts
            String emailKey = SUSPICIOUS_ACTIVITY_KEY + "email:" + email;
            Long emailAttempts = redisService.increment(emailKey);
            redisService.expire(emailKey, Duration.ofHours(1));

            if (emailAttempts > 3) {
                log.warn("Multiple failed login attempts for email: {} - {} attempts", email, emailAttempts);
            }
        } catch (Exception e) {
            log.error("Error checking suspicious activity: {}", e.getMessage());
        }
    }

    private void clearFailedLoginAttempts(String email) {
        try {
            redisService.delete(FAILED_LOGIN_KEY + email);
        } catch (Exception e) {
            log.error("Error clearing failed login attempts: {}", e.getMessage());
        }
    }

    @lombok.Data
    @lombok.Builder
    @lombok.NoArgsConstructor
    @lombok.AllArgsConstructor
    public static class LoginAttempt {
        private String email;
        private String ipAddress;
        private String userAgent;
        private LocalDateTime timestamp;
        private boolean success;
        private String reason;
    }
}

