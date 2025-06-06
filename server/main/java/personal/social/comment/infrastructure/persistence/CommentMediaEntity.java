package personal.social.comment.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import personal.social.shared.domain.enums.FeedMediaType;

import java.time.LocalDateTime;

@Entity
@Table(name = "comment_media",
        indexes = @Index(name = "idx_comment_media_comment_id", columnList = "comment_id"))
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class CommentMediaEntity {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "comment_id", nullable = false)
    private PostCommentEntity comment;

    @Column(name = "url", nullable = false)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private FeedMediaType type;

    @Column(name = "thumbnail_url")
    private String thumbnailUrl;

    @Column(name = "alt_text")
    private String altText;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

