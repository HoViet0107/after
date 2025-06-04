package personal.social.dto.websocket;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketSession {
    private String sessionId;
    private String userEmail;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime connectedAt;
    private LocalDateTime lastActivity;
    private boolean isActive;
}
