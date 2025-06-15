package personal.social.message.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import personal.social.message.domain.model.enums.MessageStatus;
import personal.social.message.domain.model.enums.MessageType;

import java.time.LocalDateTime;

@Entity
@Table(name = "messages")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class MessageEntity {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "conversation_id", nullable = false)
    private String conversationId;

    @Column(name = "sender_id", nullable = false)
    private String senderId;

    @Column(name = "message_content", columnDefinition = "TEXT", nullable = false)
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_type", nullable = false)
    private MessageType type;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "reply_to_message_id")
    private String replyToId;

    @Enumerated(EnumType.STRING)
    @Column(name = "message_status", nullable = false)
    private MessageStatus status;

    @Column(name = "is_deleted")
    private boolean isDeleted = false;

    @PrePersist
    protected void onCreate() {
        if (sentAt == null) {
            sentAt = LocalDateTime.now();
        }
    }
}
