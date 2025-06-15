package personal.social.auth.domain.event;

import lombok.Builder;
import lombok.Data;
import personal.social.auth.domain.model.enums.Platform;

import java.io.Serializable;

@Data
@Builder
public class SessionInvalidatedEvent implements Serializable {
    private Long userId;
    private String sessionId;
    private Platform platform;
    private String reason;
    private Long timestamp;
}