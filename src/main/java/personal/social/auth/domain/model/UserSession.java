package personal.social.auth.domain.model;

import lombok.Builder;
import lombok.Data;
import personal.social.auth.domain.model.enums.Platform;
import personal.social.user.domain.model.vo.UserId;

import java.io.Serializable;
import java.time.Instant;

@Data
@Builder
public class UserSession implements Serializable {
    private String sessionId;
    private UserId userId;
    private Platform platform;
    private String deviceId;
    private String deviceInfo;
    private String ipAddress;
    private String userAgent;
    private Instant createdAt;
    private Instant lastAccessedAt;
    private Instant expiresAt;
    private boolean isActive;
}