package personal.social.auth.application.dto.out;

import lombok.Builder;
import lombok.Data;

import java.util.Date;

public record LoginResponse(
        String accessToken,
        String tokenType,
        Date expiresIn,
        String refreshToken,
        String sessionId,
        UserInfo user
) {
    @Data
    @Builder
    public static class UserInfo {
        private String id;
        private String email;
        private String fullName;
    }
}
