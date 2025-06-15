package personal.social.post.infrastructure.persistence;

import jakarta.persistence.*;
import lombok.*;
import personal.social.comment.infrastructure.persistence.PostCommentEntity;
import personal.social.shared.domain.enums.FeedStatus;
import personal.social.user.infrastructure.persistence.UserEntity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Getter @Setter @Builder
@NoArgsConstructor @AllArgsConstructor
public class PostEntity {
    @Id
    @Column(name = "id", nullable = false, length = 36)
    private String id;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private UserEntity author;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FeedStatus status = FeedStatus.ACTIVE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PostVisibility visibility = PostVisibility.PUBLIC;

    @Column(name = "location_name")
    private String locationName;

    @Column(name = "location_lat")
    private Double locationLat;

    @Column(name = "location_lng")
    private Double locationLng;

    // Bidirectional relationships
    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostMediaEntity> media = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostHashtagEntity> hashtags = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostLikeEntity> likes = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostCommentEntity> comments = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostShareEntity> shares = new ArrayList<>();

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<PostBookmarkEntity> bookmarks = new ArrayList<>();

    @ManyToMany
    @JoinTable(
            name = "post_tagged_users",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "user_id")
    )
    private List<UserEntity> taggedUsers = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    // Helper methods
    public void addMedia(PostMediaEntity media) {
        this.media.add(media);
        media.setPost(this);
    }

    public void addHashtag(PostHashtagEntity hashtag) {
        this.hashtags.add(hashtag);
        hashtag.setPost(this);
    }

    public void addLike(PostLikeEntity like) {
        this.likes.add(like);
        like.setPost(this);
    }

    public void addComment(PostCommentEntity comment) {
        this.comments.add(comment);
        comment.setPost(this);
    }

    public enum PostVisibility {
        PUBLIC, FRIENDS, PRIVATE
    }
}
