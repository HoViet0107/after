package personal.social.comment.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import personal.social.feed.infrastructure.persistence.PostEntity;
import personal.social.shared.domain.enums.FeedStatus;
import personal.social.user.infrastructure.persistence.UserEntity;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "comments", indexes = {
        @Index(name = "idx_comment_post_id", columnList = "post_id"),
        @Index(name = "idx_comment_author_id", columnList = "author_id"),
        @Index(name = "idx_comment_parent_id", columnList = "parent_comment_id"),
        @Index(name = "idx_comment_root_id", columnList = "root_comment_id"),
        @Index(name = "idx_comment_created_at", columnList = "created_at")
})
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class PostCommentEntity {
    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private PostEntity post;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "edited_at")
    private LocalDateTime editedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FeedStatus commentStatus = FeedStatus.ACTIVE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_comment_id")
    private PostCommentEntity parentComment;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "root_comment_id")
    private PostCommentEntity rootCommentId;

    @OneToMany(mappedBy = "parentComment", cascade = CascadeType.ALL)
    private List<PostCommentEntity> replies = new ArrayList<>();

    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL)
    private Set<CommentLikeEntity> likes = new HashSet<>();

    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<CommentMediaEntity> media = new ArrayList<>();

    @OneToMany(mappedBy = "comment", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<CommentTagEntity> taggedUsers = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        editedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        editedAt = LocalDateTime.now();
    }
}
