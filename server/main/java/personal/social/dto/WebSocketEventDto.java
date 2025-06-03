package personal.social.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebSocketEventDto {
    private String type;
    private Long conversationId;
    private Long messageId;
    private Long userId;
    private String email;
    private Long timestamp;
    private Object data;
}
