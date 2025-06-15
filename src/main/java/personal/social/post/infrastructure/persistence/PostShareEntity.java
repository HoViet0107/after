package personal.social.post.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import personal.social.user.infrastructure.persistence.UserEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_shares")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class PostShareEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private PostEntity post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
