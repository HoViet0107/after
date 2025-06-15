package personal.social.shared.infrastructure.security;

// Rate limit result DTO
public record RateLimitResult(
        boolean allowed,
        int currentCount,
        int limit,
        long resetTimeSeconds
) {}
