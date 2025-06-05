package personal.social.shared.security;

// Rate limit result DTO
public record RateLimitResult(
        boolean allowed,
        int currentCount,
        int limit,
        long resetTimeSeconds
) {}
