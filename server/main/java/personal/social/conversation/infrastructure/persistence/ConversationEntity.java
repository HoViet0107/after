package personal.social.conversation.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import personal.social.conversation.domain.model.vo.ParticipantRole;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "conversations")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class ConversationEntity {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "title", nullable = false)
    private String title;

    @Column(name = "avatar_url")
    private String avatarUrl;

    @Column(name = "is_group_chat", nullable = false)
    private boolean isGroupChat;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_message_id")
    private String lastMessageId;

    @OneToMany(mappedBy = "conversation", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<ConversationParticipantEntity> participants = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
