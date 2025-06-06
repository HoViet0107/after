package personal.social.feed.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "post_hashtags",
        uniqueConstraints = @UniqueConstraint(columnNames = {"post_id", "hashtag"}))
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class PostHashtagEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private PostEntity post;

    @Column(nullable = false, length = 100)
    private String hashtag;
}
