package personal.social.dto.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import personal.social.enums.MessageType;
import java.time.LocalDateTime;

import lombok.experimental.SuperBuilder;
import personal.social.dto.base.BaseEntityDTO;
import personal.social.dto.MediaDTO;
import personal.social.enums.MessageStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ChatMessageDTO extends BaseEntityDTO {
    @NotNull
    private Long conversationId;

    @NotNull
    private Long senderId;

    private String senderName;
    private String senderAvatar;

    @NotBlank
    private String content;

    private LocalDateTime sendAt;
    private LocalDateTime editedAt;

    @Builder.Default
    private boolean isRead = false;

    @Builder.Default
    private MessageStatus status = MessageStatus.SENT;

    @Builder.Default
    private MessageType type = MessageType.TEXT;

    private List<MediaDTO> medias;
    private List<ReactionDTO> reactions;
    private Long replyToMessageId;
    private ChatMessageDTO replyMessage;

    @Builder.Default
    private boolean isDeleted = false;

    // Computed fields for UI
    private boolean isOwnMessage=false;
    private String readableTimestamp;
    private int totalReactions=0;
}