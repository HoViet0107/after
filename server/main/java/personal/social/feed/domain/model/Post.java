package personal.social.feed.domain.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
import personal.social.comment.domain.model.PostComment;
import personal.social.comment.domain.model.vo.CommentContent;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.feed.domain.event.PostCreatedEvent;
import personal.social.feed.domain.event.PostLikedEvent;
import personal.social.feed.domain.event.PostSharedEvent;
import personal.social.feed.domain.model.enums.PostVisibility;
import personal.social.feed.domain.model.vo.*;
import personal.social.shared.domain.enums.FeedStatus;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.*;

@Getter
@Setter
@Builder
public class Post {
    private final PostId id;
    private final UserId authorId;
    private PostContent content;
    private final LocalDateTime createdAt;
    private LocalDateTime editedAt;
    private FeedStatus postStatus;
    private PostVisibility visibility;

    @Builder.Default
    private final List<PostMedia> media = new ArrayList<>();
    @Builder.Default
    private final Set<PostHashTag> hashtags = new HashSet<>();
    @Builder.Default
    private final Set<PostLike> likes = new HashSet<>();
    @Builder.Default
    private final Set<PostShare> shares = new HashSet<>();
    @Builder.Default
    private final Set<PostBookmark> bookmarks = new HashSet<>();
    @Builder.Default
    private final Set<UserId> taggedUsers = new HashSet<>();

    private Location location;

    private Post(PostId id, UserId authorId, PostContent content, PostVisibility visibility) {
        this.id = Objects.requireNonNull(id);
        this.authorId = Objects.requireNonNull(authorId);
        this.content = Objects.requireNonNull(content);
        this.visibility = Objects.requireNonNull(visibility);
        this.createdAt = LocalDateTime.now();
        this.editedAt = LocalDateTime.now();
        this.postStatus = FeedStatus.ACTIVE;

        // Add domain event
        addDomainEvent(new PostCreatedEvent(this.id, this.authorId));
    }

    public static Post create(PostId id, UserId authorId, PostContent content, PostVisibility visibility) {
        return new Post(id, authorId, content, visibility);
    }

    // Business Methods
    public void editContent(PostContent newContent) {
        Objects.requireNonNull(newContent);
        this.content = newContent;
        this.editedAt = LocalDateTime.now();
    }

    public void addMedia(PostMedia media) {
        if (this.media.size() >= 4) {
            throw new IllegalStateException("Cannot add more than 4 media files");
        }
        this.media.add(Objects.requireNonNull(media));
    }

    public void addHashtag(PostHashTag hashtag) {
        if (this.hashtags.size() >= 10) {
            throw new IllegalStateException("Cannot add more than 10 hashtags");
        }
        this.hashtags.add(Objects.requireNonNull(hashtag));
    }

    public PostLike like(UserId userId) {
        if (isLikedBy(userId)) {
            throw new IllegalStateException("Post already liked by user");
        }

        PostLike like = PostLike.create(userId, this.id);
        this.likes.add(like);

        addDomainEvent(new PostLikedEvent(this.id, userId));
        return like;
    }

    public void unlike(UserId userId) {
        boolean removed = this.likes.removeIf(like -> like.getUserId().equals(userId));
        if (!removed) {
            throw new IllegalStateException("Post not liked by user");
        }
    }

    public PostShare share(UserId userId) {
        PostShare share = PostShare.create(userId, this.id);
        this.shares.add(share);

        addDomainEvent(new PostSharedEvent(this.id, userId));
        return share;
    }

    public PostBookmark bookmark(UserId userId) {
        if (isBookmarkedBy(userId)) {
            throw new IllegalStateException("Post already bookmarked");
        }

        PostBookmark bookmark = PostBookmark.create(userId, this.id);
        this.bookmarks.add(bookmark);
        return bookmark;
    }

    public void removeBookmark(UserId userId) {
        this.bookmarks.removeIf(bookmark -> bookmark.getUserId().equals(userId));
    }

    public void tagUser(UserId userId) {
        this.taggedUsers.add(userId);
    }

    public void hidePost() {
        this.postStatus = FeedStatus.HIDDEN_BY_OWNER;
        this.editedAt = LocalDateTime.now();
    }

    public void deletePost() {
        this.postStatus = FeedStatus.DELETED_BY_OWNER;
        this.editedAt = LocalDateTime.now();
    }

    // Query Methods
    public boolean isLikedBy(UserId userId) {
        return this.likes.stream().anyMatch(like -> like.getUserId().equals(userId));
    }

    public boolean isBookmarkedBy(UserId userId) {
        return this.bookmarks.stream().anyMatch(bookmark -> bookmark.getUserId().equals(userId));
    }

    public boolean isActive() {
        return this.postStatus == FeedStatus.ACTIVE;
    }

    public boolean isPublic() {
        return this.visibility == PostVisibility.PUBLIC;
    }

    public PostEngagement getEngagement() {
        return PostEngagement.builder()
                .likeCount(likes.size())
                .shareCount(shares.size())
                .bookmarkCount(bookmarks.size())
                .engagementRate(calculateEngagementRate())
                .commentCount(0).build();
    }

    private double calculateEngagementRate() {
        return (likes.size() + shares.size()) * 1.0;
    }
}