package personal.social.feed.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import personal.social.shared.domain.enums.FeedMediaType;

import java.time.LocalDateTime;

@Entity
@Table(name = "post_media")
@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class PostMediaEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private PostEntity post;

    @Column(name = "media_url", columnDefinition = "TEXT", nullable = false)
    private String mediaUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false)
    private FeedMediaType feedMediaType;

    @Column(name = "thumbnail_url", columnDefinition = "TEXT")
    private String thumbnailUrl;

    @Column(name = "alt_text")
    private String altText;

    private Integer width;
    private Integer height;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
