package personal.social.interceptors;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;
import personal.social.services.security.RateLimitingService;
import personal.social.helper.CommonHelpers;

@Component
@RequiredArgsConstructor
@Slf4j
public class RateLimitingInterceptor implements HandlerInterceptor {

    private final RateLimitingService rateLimitingService;
    private final CommonHelpers commonHelpers;

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        try {
            // Extract user identifier
            String userIdentifier = extractUserIdentifier(request);
            String action = extractAction(request);

            // Check rate limit
            rateLimitingService.checkRateLimit(userIdentifier, action);

            // Add remaining requests to response headers
            long remaining = rateLimitingService.getRemainingRequests(userIdentifier, action);
            response.setHeader("X-RateLimit-Remaining", String.valueOf(remaining));

            return true;
        } catch (Exception e) {
            log.error("Rate limiting error: {}", e.getMessage());
            return true; // Fail open
        }
    }

    private String extractUserIdentifier(HttpServletRequest request) {
        try {
            var user = commonHelpers.extractToken(request);
            return user.getEmail();
        } catch (Exception e) {
            // Fall back to IP address for unauthenticated requests
            return getClientIpAddress(request);
        }
    }

    private String extractAction(HttpServletRequest request) {
        String method = request.getMethod();
        String path = request.getRequestURI();

        // Create action identifier from method and path
        return method + ":" + path.replaceAll("/\\d+", "/{id}");
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }

        return request.getRemoteAddr();
    }
}
