package personal.social.dto.message;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import personal.social.enums.MessageType;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private Long id;
    private String content;
    private Long senderId;
    private String senderName;
    private Long conversationId;
    private LocalDateTime sendAt;
    private LocalDateTime editedAt;
    private boolean isDeleted;
    private MessageType messageType;
}
