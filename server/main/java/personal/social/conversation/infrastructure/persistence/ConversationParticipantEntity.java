package personal.social.conversation.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import personal.social.conversation.domain.model.vo.ParticipantRole;
import personal.social.user.infrastructure.persistence.UserEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "conversation_participants")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
@IdClass(ConversationParticipantId.class)
public class ConversationParticipantEntity {

    @Id
    @Column(name = "conversation_id")
    private String conversationId;

    @Id
    @Column(name = "user_id")
    private String userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "conversation_id", insertable = false, updatable = false)
    private ConversationEntity conversation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", insertable = false, updatable = false)
    private UserEntity user;

    @Enumerated(EnumType.STRING)
    @Column(name = "participant_role", nullable = false)
    private ParticipantRole role;

    @Column(name = "joined_at", nullable = false)
    private LocalDateTime joinedAt;

    @Column(name = "is_online")
    private boolean isOnline;

    @Column(name = "is_active")
    private boolean isActive = true;

    @PrePersist
    protected void onCreate() {
        joinedAt = LocalDateTime.now();
    }
}
