package personal.social.dto.websocket;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import personal.social.enums.WebSocketEventType;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketMessage<T> {
    private WebSocketEventType type;
    private Long conversationId;
    private Long userId;
    private String userEmail;
    private T payload;
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();
    private String sessionId;
}
