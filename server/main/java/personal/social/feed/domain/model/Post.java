package personal.social.feed.domain.model;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import personal.social.comment.domain.model.PostComment;
import personal.social.comment.domain.model.vo.CommentContent;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.feed.domain.model.enums.PostVisibility;
import personal.social.feed.domain.model.vo.*;
import personal.social.shared.domain.enums.FeedStatus;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@Getter
@Setter
@AllArgsConstructor
public class Post {
    private final PostId id;
    private final UserId authorId;
    private PostContent content;
    private final LocalDateTime createdAt;
    private LocalDateTime editedAt;
    private FeedStatus postStatus;
    private PostVisibility visibility;
    private final List<PostMedia> media;
    private final List<PostHashTag> hashtags;
    private final List<PostLike> likes;
    private final List<PostComment> comments;
    private final List<PostShare> shares;
    private final List<PostBookmark> bookmarks;
    @Setter
    private Location location;
    private final List<UserId> taggedUsers;

    private Post(PostId id, UserId authorId, PostContent content, PostVisibility visibility) {
        this.id = Objects.requireNonNull(id);
        this.authorId = Objects.requireNonNull(authorId);
        this.content = Objects.requireNonNull(content);
        this.visibility = Objects.requireNonNull(visibility);
        this.createdAt = LocalDateTime.now();
        this.editedAt = LocalDateTime.now();
        this.postStatus = FeedStatus.ACTIVE;
        this.media = new ArrayList<>();
        this.hashtags = new ArrayList<>();
        this.likes = new ArrayList<>();
        this.comments = new ArrayList<>();
        this.shares = new ArrayList<>();
        this.bookmarks = new ArrayList<>();
        this.taggedUsers = new ArrayList<>();
    }

    /**
     * Creates a new Post instance with the given id, authorId, content, and visibility.
     *
     * @param id          the unique identifier for the post
     * @param authorId    the unique identifier of the author
     * @param content     the content of the post
     * @param visibility  the visibility level of the post
     * @return            a new Post instance
     */
    public static Post create(PostId id, UserId authorId, PostContent content, PostVisibility visibility) {
        return new Post(id, authorId, content, visibility);
    }

    // Business methods

    /**
     * Edits the content of this Post instance.
     *
     * @param newContent the new content of the post
     */
    public void editContent(PostContent newContent) {
        this.content = Objects.requireNonNull(newContent);
        this.editedAt = LocalDateTime.now();
    }

    /**
     * Adds a media file to this Post instance. A Post can contain up to 4 media files.
     * If the limit is exceeded, an IllegalStateException is thrown.
     *
     * @param media the media file to be added
     */
    public void addMedia(PostMedia media) {
        if (this.media.size() >= 4) {
            throw new IllegalStateException("Cannot add more than 4 media files to a post");
        }
        this.media.add(Objects.requireNonNull(media));
    }

    /**
     * Adds a hashtag to this Post instance. A Post can contain up to 10 hashtags.
     * If the limit is exceeded, an IllegalStateException is thrown.
     *
     * @param hashtag the hashtag to be added
     * @throws IllegalStateException if more than 10 hashtags are added
     * @throws NullPointerException if the hashtag is null
     */
    public void addHashtag(PostHashTag hashtag) {
        if (this.hashtags.size() >= 10) {
            throw new IllegalStateException("Cannot add more than 10 hashtags to a post");
        }
        if (!this.hashtags.contains(hashtag)) {
            this.hashtags.add(Objects.requireNonNull(hashtag));
        }
    }

    /**
     * Adds a like to this Post instance by the specified User.
     *
     * @param userId the ID of the User who likes the post
     * @return the PostLike instance created for this action
     * @throws IllegalStateException if the post is already liked by the user
     */
    public PostLike like(UserId userId) {
        // Check if already liked
        if (isLikedBy(userId)) {
            throw new IllegalStateException("Post already liked by user");
        }
        PostLike like = PostLike.create(userId, this.id);
        this.likes.add(like);
        return like;
    }

    public void unlike(UserId userId) {
        this.likes.removeIf(like -> like.getUserId().equals(userId));
    }

    public boolean isLikedBy(UserId userId) {
        return this.likes.stream().anyMatch(like -> like.getUserId().equals(userId));
    }

    public PostComment addComment(UserId userId, CommentContent content, CommentId parentCommentId, CommentId rootCommentId) {
        PostComment comment = null;
        this.comments.add(comment);
        return comment;
    }

    public PostShare share(UserId userId) {
        PostShare share = PostShare.create(userId, this.id);
        this.shares.add(share);
        return share;
    }

    public PostBookmark bookmark(UserId userId) {
        if (isBookmarkedBy(userId)) {
            throw new IllegalStateException("Post already bookmarked by user");
        }
        PostBookmark bookmark = PostBookmark.create(userId, this.id);
        this.bookmarks.add(bookmark);
        return bookmark;
    }

    public void removeBookmark(UserId userId) {
        this.bookmarks.removeIf(bookmark -> bookmark.getUserId().equals(userId));
    }

    public boolean isBookmarkedBy(UserId userId) {
        return this.bookmarks.stream().anyMatch(bookmark -> bookmark.getUserId().equals(userId));
    }

    public void tagUser(UserId userId) {
        if (!this.taggedUsers.contains(userId)) {
            this.taggedUsers.add(userId);
        }
    }

    public void hiddenByOwner() {
        this.postStatus = FeedStatus.HIDDEN_BY_OWNER;
        this.editedAt = LocalDateTime.now();
    }

    public void deleteByOwner() {
        this.postStatus = FeedStatus.DELETED_BY_OWNER;
        this.editedAt = LocalDateTime.now();
    }

    public void deleteByAdmin() {
        this.postStatus = FeedStatus.DELETED_BY_ADMIN;
        this.editedAt = LocalDateTime.now();
    }

    public void deleteByUser() {
        this.postStatus = FeedStatus.DELETED_BY_USER;
        this.editedAt = LocalDateTime.now();
    }

    // Engagement calculations

    /**
     * Returns the engagement metrics for this post, including the number of likes, comments,
     * shares, and bookmarks. Also calculates the engagement rate, which is a measure of how
     * engaging the post is based on its likes, comments, and shares relative to the number of
     * bookmarks.
     *
     * @return the engagement metrics for this post
     */
    public PostEngagement getEngagement() {
        return PostEngagement.builder()
                .likeCount(likes.size())
                .commentCount(comments.size())
                .shareCount(shares.size())
                .bookmarkCount(bookmarks.size())
                .engagementRate(calculateEngagementRate())
                .build();
    }

    private double calculateEngagementRate() {
        int totalEngagements = likes.size() + comments.size() + shares.size();
        // In a real system, you'd need the post's reach/impressions
        return totalEngagements * 1.0; // Simplified calculation
    }

    public boolean isPublic() {
        return this.visibility == PostVisibility.PUBLIC;
    }

    public boolean isActive() {
        return this.postStatus == FeedStatus.ACTIVE;
    }
}
