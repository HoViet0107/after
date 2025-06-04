package personal.social.model;

import jakarta.persistence.*;
import lombok.*;
import personal.social.enums.MessageStatus;
import personal.social.enums.MessageType;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Messages {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "sent_at", nullable = false)
    private LocalDateTime sentAt;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Column(name = "message_content", nullable = false, columnDefinition = "TEXT")
    private String messageContent;

    @Column(name = "message_status", columnDefinition = "varchar(20) default 'SENT'", nullable = false)
    private String messageStatus;

    @Column(name = "message_type", nullable = false)
    private String messageType;

    @Column(name = "reply_to_message_id")
    private Long replyToMessageId;

    @ManyToOne
    @JoinColumn(name = "sender_id", nullable = false)
    private Users sender;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL)
    private List<MediaRequest> media;

    @OneToMany(mappedBy = "message", cascade = CascadeType.ALL)
    private List<MessageReaction> reactions;

    @ManyToOne
    @JoinColumn(name = "conversation_id", nullable = false)
    private Conversations conversation;
}
