package personal.social.shared.security;

import jakarta.servlet.http.HttpServletRequest;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Aspect
@Component
public class RateLimitingAspect {

    private final RateLimitingService rateLimitingService;
    private final HttpServletRequest request;

    public RateLimitingAspect(RateLimitingService rateLimitingService,
                              HttpServletRequest request) {
        this.rateLimitingService = rateLimitingService;
        this.request = request;
    }

    @Around("@annotation(rateLimit)")
    public Object checkRateLimit(ProceedingJoinPoint joinPoint, RateLimit rateLimit)
            throws Throwable {

        String identifier = buildIdentifier(rateLimit);
        Duration window = Duration.ofSeconds(rateLimit.windowSeconds());

        RateLimitResult result = rateLimitingService.checkRateLimit(
                identifier, rateLimit.limit(), window
        );

        if (!result.allowed()) {
            throw new RateLimitExceededException(
                    String.format("Rate limit exceeded. Limit: %d, Current: %d, Reset in: %d seconds",
                            result.limit(), result.currentCount(), result.resetTimeSeconds())
            );
        }

        return joinPoint.proceed();
    }

    private String buildIdentifier(RateLimit rateLimit) {
        StringBuilder identifier = new StringBuilder(rateLimit.keyPrefix());

        if (rateLimit.perUser()) {
            // Get user ID from JWT token or session
            String userId = getCurrentUserId();
            identifier.append(":user:").append(userId);
        } else {
            // Use client IP
            String clientIP = getClientIP();
            identifier.append(":ip:").append(clientIP);
        }

        return identifier.toString();
    }

    private String getCurrentUserId() {
        // Extract user ID from JWT token or session
        return "user123"; // Placeholder
    }

    private String getClientIP() {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
