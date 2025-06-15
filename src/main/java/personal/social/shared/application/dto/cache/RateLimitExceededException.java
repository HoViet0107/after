package personal.social.shared.application.dto.cache;

// Rate limit exception
public class RateLimitExceededException extends RuntimeException {
    public RateLimitExceededException(String message) {
        super(message);
    }
}
