package personal.social.feed.domain.model;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import personal.social.comment.domain.model.PostComment;
import personal.social.feed.domain.event.PostCreatedEvent;
import personal.social.feed.domain.event.PostLikedEvent;
import personal.social.feed.domain.event.PostSharedEvent;
import personal.social.feed.domain.model.enums.PostVisibility;
import personal.social.feed.domain.model.vo.*;
import personal.social.shared.domain.AggregateRoot;
import personal.social.shared.domain.enums.FeedStatus;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.*;

@Getter
@Setter
@SuperBuilder(toBuilder = true)
public class Post extends AggregateRoot<PostId> {

    // Auto-generate ID if not provided
    @lombok.Builder.Default
    private final PostId id = PostId.generate();

    // Required fields
    private final UserId authorId;
    private PostContent content;

    // Auto-generate timestamps
    @lombok.Builder.Default
    private final LocalDateTime createdAt = LocalDateTime.now();
    @lombok.Builder.Default
    private LocalDateTime editedAt = LocalDateTime.now();

    // Default status and visibility
    @lombok.Builder.Default
    private FeedStatus postStatus = FeedStatus.ACTIVE;
    @lombok.Builder.Default
    private PostVisibility visibility = PostVisibility.PUBLIC;

    // Collections with default initialization
    @lombok.Builder.Default
    private final List<PostMedia> media = new ArrayList<>();
    @lombok.Builder.Default
    private final Set<PostHashTag> hashtags = new HashSet<>();
    @lombok.Builder.Default
    private final Set<PostLike> likes = new HashSet<>();
    @lombok.Builder.Default
    private final Set<PostShare> shares = new HashSet<>();
    @lombok.Builder.Default
    private final Set<PostBookmark> bookmarks = new HashSet<>();
    @lombok.Builder.Default
    private final Set<UserId> taggedUsers = new HashSet<>();
    @lombok.Builder.Default
    private final List<PostComment> comments = new ArrayList<>();

    private Location location;

    // ================================
    // FACTORY METHODS (Static helpers)
    // ================================

    /**
     * Create new post
     */
    public static Post create(PostId id, UserId authorId, PostContent content, PostVisibility visibility) {
        Post post = Post.builder()
                .id(id)
                .authorId(authorId)
                .content(content)
                .visibility(visibility)
                .build();

        // Add domain event
        post.addDomainEvent(new PostCreatedEvent(post.id, post.authorId));
        return post;
    }

    /**
     * Create public post with auto-generated ID
     */
    public static Post createPublic(UserId authorId, PostContent content) {
        return create(PostId.generate(), authorId, content, PostVisibility.PUBLIC);
    }

    // ================================
    // BUSINESS LOGIC METHODS
    // ================================

    public void editContent(PostContent newContent) {
        Objects.requireNonNull(newContent, "Content cannot be null");

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot edit inactive post");
        }

        this.content = newContent;
        this.editedAt = LocalDateTime.now();
    }

    public void addMedia(PostMedia media) {
        Objects.requireNonNull(media, "Media cannot be null");

        if (this.media.size() >= 4) {
            throw new IllegalStateException("Cannot add more than 4 media files");
        }

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot add media to inactive post");
        }

        this.media.add(media);
    }

    public void addHashtag(PostHashTag hashtag) {
        Objects.requireNonNull(hashtag, "Hashtag cannot be null");

        if (this.hashtags.size() >= 10) {
            throw new IllegalStateException("Cannot add more than 10 hashtags");
        }

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot add hashtag to inactive post");
        }

        this.hashtags.add(hashtag);
    }

    public PostLike like(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot like inactive post");
        }

        if (isLikedBy(userId)) {
            throw new IllegalStateException("Post already liked by user");
        }

        PostLike like = PostLike.create(userId, this.id);
        this.likes.add(like);

        addDomainEvent(new PostLikedEvent(this.id, userId));
        return like;
    }

    public void unlike(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        boolean removed = this.likes.removeIf(like -> like.getUserId().equals(userId));
        if (!removed) {
            throw new IllegalStateException("Post not liked by user");
        }
    }

    public PostShare share(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot share inactive post");
        }

        PostShare share = PostShare.create(userId, this.id);
        this.shares.add(share);

        addDomainEvent(new PostSharedEvent(this.id, userId));
        return share;
    }

    public PostBookmark bookmark(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot bookmark inactive post");
        }

        if (isBookmarkedBy(userId)) {
            throw new IllegalStateException("Post already bookmarked");
        }

        PostBookmark bookmark = PostBookmark.create(userId, this.id);
        this.bookmarks.add(bookmark);
        return bookmark;
    }

    public void removeBookmark(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        this.bookmarks.removeIf(bookmark -> bookmark.getUserId().equals(userId));
    }

    public void tagUser(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot tag user in inactive post");
        }

        this.taggedUsers.add(userId);
    }

    public void untagUser(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        this.taggedUsers.remove(userId);
    }

    // ================================
    // STATUS MANAGEMENT METHODS
    // ================================

    public void hidePost() {
        if (!this.isActive()) {
            throw new IllegalStateException("Post is already inactive");
        }

        this.postStatus = FeedStatus.HIDDEN_BY_OWNER;
        this.editedAt = LocalDateTime.now();
    }

    public void deletePost() {
        this.postStatus = FeedStatus.DELETED_BY_OWNER;
        this.editedAt = LocalDateTime.now();
    }

    public void deleteByAdmin() {
        this.postStatus = FeedStatus.DELETED_BY_ADMIN;
        this.editedAt = LocalDateTime.now();
    }

    public void recoverPost() {
        if (this.postStatus == FeedStatus.DELETED_BY_ADMIN) {
            throw new IllegalStateException("Cannot recover post deleted by admin");
        }

        this.postStatus = FeedStatus.ACTIVE;
        this.editedAt = LocalDateTime.now();
    }

    // ================================
    // QUERY METHODS
    // ================================

    public boolean isActive() {
        return this.postStatus == FeedStatus.ACTIVE;
    }

    public boolean isPublic() {
        return this.visibility == PostVisibility.PUBLIC;
    }

    public boolean isLikedBy(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        return this.likes.stream().anyMatch(like -> like.getUserId().equals(userId));
    }

    public boolean isBookmarkedBy(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        return this.bookmarks.stream().anyMatch(bookmark -> bookmark.getUserId().equals(userId));
    }

    public boolean isTaggedUser(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        return this.taggedUsers.contains(userId);
    }

    public boolean hasMedia() {
        return !this.media.isEmpty();
    }

    public boolean hasHashtags() {
        return !this.hashtags.isEmpty();
    }

    public boolean hasTaggedUsers() {
        return !this.taggedUsers.isEmpty();
    }

    public boolean isEdited() {
        return !this.createdAt.equals(this.editedAt);
    }

    // ================================
    // COUNT METHODS
    // ================================

    public int getLikeCount() {
        return this.likes.size();
    }

    public int getShareCount() {
        return this.shares.size();
    }

    public int getBookmarkCount() {
        return this.bookmarks.size();
    }

    public int getCommentCount() {
        return this.comments.size();
    }

    public int getMediaCount() {
        return this.media.size();
    }

    public int getHashtagCount() {
        return this.hashtags.size();
    }

    public int getTaggedUserCount() {
        return this.taggedUsers.size();
    }

    // ================================
    // ENGAGEMENT CALCULATIONS
    // ================================

    public PostEngagement getEngagement() {
        return PostEngagement.builder()
                .likeCount(likes.size())
                .shareCount(shares.size())
                .bookmarkCount(bookmarks.size())
                .commentCount(comments.size())
                .engagementRate(calculateEngagementRate())
                .build();
    }

    private double calculateEngagementRate() {
        // Calculate engagement rate based on total interactions
        int totalEngagements = likes.size() + shares.size() + comments.size();
        return totalEngagements * 1.0;
    }

    // ================================
    // VALIDATION METHODS
    // ================================

    public void validateCanModify() {
        if (!this.isActive()) {
            throw new IllegalStateException("Cannot modify inactive post");
        }
    }

    public void validateUserCanPerformAction(UserId userId, String action) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        switch (action.toLowerCase()) {
            case "edit", "delete" -> {
                if (!this.authorId.equals(userId)) {
                    throw new IllegalStateException("Only post author can " + action + " their post");
                }
            }
            case "like", "unlike" -> {
                if (this.authorId.equals(userId)) {
                    throw new IllegalStateException("User cannot " + action + " their own post");
                }
            }
        }
    }

    // ================================
    // AGGREGATE ROOT IMPLEMENTATION
    // ================================

    @Override
    public PostId getId() {
        return this.id;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Post that = (Post) obj;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("Post{id=%s, authorId=%s, postStatus=%s, visibility=%s, createdAt=%s}",
                id, authorId, postStatus, visibility, createdAt);
    }
}