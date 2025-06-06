package personal.social.auth.application.dto.out;

public record LoginResponse(
        String accessToken,
        String tokenType,
        Long expiresIn
) {}
