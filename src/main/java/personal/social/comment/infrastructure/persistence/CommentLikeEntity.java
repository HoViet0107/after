package personal.social.comment.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import personal.social.user.infrastructure.persistence.UserEntity;

import java.time.LocalDateTime;

@Entity
@Table(name = "comment_likes",
        uniqueConstraints = @UniqueConstraint(columnNames = {"comment_id", "user_id"}),
        indexes = {
                @Index(name = "idx_comment_like_comment_id", columnList = "comment_id"),
                @Index(name = "idx_comment_like_user_id", columnList = "user_id")
        })
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class CommentLikeEntity {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private PostCommentEntity comment;

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
