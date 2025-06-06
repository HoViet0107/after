package personal.social.comment.domain.model;

import ch.qos.logback.core.net.SMTPAppenderBase;
import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import personal.social.comment.domain.event.CommentCreatedEvent;
import personal.social.comment.domain.event.CommentEditedEvent;
import personal.social.comment.domain.event.CommentLikedEvent;
import personal.social.comment.domain.model.vo.CommentContent;
import personal.social.comment.domain.model.vo.CommentEngagement;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.comment.domain.event.CommentUnlikedEvent;
import personal.social.feed.domain.model.vo.PostId;
import personal.social.shared.domain.AggregateRoot;
import personal.social.shared.domain.enums.FeedStatus;
import personal.social.user.domain.model.vo.UserId;

import java.time.LocalDateTime;
import java.util.*;

@Getter
@Setter
@SuperBuilder
public class PostComment extends AggregateRoot<CommentId> {
    private static final int MAX_MEDIA_COUNT = 4;

    // Auto-generate ID if not provided
    @lombok.Builder.Default
    private final CommentId id = CommentId.generate();

    // Required fields
    private final PostId postId;
    private final UserId authorId;
    private CommentContent content;

    // Auto-generate timestamps
    @lombok.Builder.Default
    private final LocalDateTime createdAt = LocalDateTime.now();
    @lombok.Builder.Default
    private LocalDateTime editedAt = LocalDateTime.now();

    // Default status
    @lombok.Builder.Default
    private FeedStatus commentStatus = FeedStatus.ACTIVE;

    private CommentId parentCommentId;
    private final CommentId rootCommentId;


    private final List<CommentMedia> media;
    private final Set<CommentLike> likes;
    private final Set<UserId> taggedUsers;

    // Custom builder method để add domain event creation
    public static PostCommentBuilder builder() {
        return new PostCommentBuilderImpl() {
            @Override
            public PostComment build() {
                PostComment comment = super.build();
                // Add domain event after creation
                comment.addDomainEvent(new CommentCreatedEvent(
                        comment.getId(),
                        comment.getPostId(),
                        comment.getAuthorId()
                ));
                return comment;
            }
        };
    }

    // ================================
    // BUSINESS LOGIC METHODS
    // ================================

    public void editContent(CommentContent newContent) {
        Objects.requireNonNull(newContent, "Content cannot be null");

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot edit inactive comment");
        }

        this.content = newContent;
        this.editedAt = LocalDateTime.now();

        // Raise domain event
        addDomainEvent(new CommentEditedEvent(this.id, this.postId));
    }

    public void addMedia(CommentMedia media) {
        Objects.requireNonNull(media, "Media cannot be null");

        if (this.media.size() >= MAX_MEDIA_COUNT) {
            throw new IllegalStateException("Cannot add more than " + MAX_MEDIA_COUNT + " media files to a comment");
        }

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot add media to inactive comment");
        }

        this.media.add(media);
    }

    public void removeMedia(CommentMedia media) {
        Objects.requireNonNull(media, "Media cannot be null");
        this.media.remove(media);
    }

    /**
     * Adds a like to this Post instance by the specified User.
     *
     * @param userId the ID of the User who likes the post
     * @return the PostLike instance created for this action
     * @throws IllegalStateException if the post is already liked by the user
     */
    public CommentLike like(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot like inactive comment");
        }

        if (isLikedBy(userId)) {
            throw new IllegalStateException("Comment already liked by user");
        }

        CommentLike like = CommentLike.create(userId, this.id);
        this.likes.add(like);

        // Raise domain event
        addDomainEvent(new CommentLikedEvent(this.id, userId, this.postId));

        return like;
    }

    public void unlike(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        if (!isLikedBy(userId)) {
            throw new IllegalStateException("Comment not liked by user");
        }

        this.likes.removeIf(like -> like.getUserId().equals(userId));

        // Raise domain event
        addDomainEvent(new CommentUnlikedEvent(this.id, userId, this.postId));
    }

    /**
     * Check if comment is liked by specific user
     *
     * @param userId the ID of the User to check
     */
    public boolean isLikedBy(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        return this.likes.stream()
                .anyMatch(like -> like.getUserId().equals(userId));
    }

    /**
     * Tag user in comment
     *
     * @param userId the ID of the User to tag
     */
    public void tagUser(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot tag user in inactive comment");
        }

        this.taggedUsers.add(userId);
    }

    /**
     * Untag user from comment
     *
     * @param userId the ID of the User to untag
     */
    public void untagUser(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        this.taggedUsers.remove(userId);
    }

    /**
     * Check if user is tagged in comment
     *
     * @param userId the ID of the User to check
     */
    public boolean isUserTagged(UserId userId) {
        Objects.requireNonNull(userId, "User ID cannot be null");
        return this.taggedUsers.contains(userId);
    }

    // ================================
    // STATUS MANAGEMENT METHODS
    // ================================

    /**
     * Hide the owner of the comment (hide by user)
     */
    public void deactivate() {
        if (!this.isActive()) {
            throw new IllegalStateException("Comment is already inactive");
        }

        this.commentStatus = FeedStatus.HIDDEN_BY_USER;
        this.editedAt = LocalDateTime.now();
    }

    /**
     * Hide the comment by the owner of the post
     */
    public void hideByAdmin() {
        if (!this.isActive()) {
            throw new IllegalStateException("Comment is already inactive");
        }

        this.commentStatus = FeedStatus.HIDDEN_BY_OWNER;
        this.editedAt = LocalDateTime.now();
    }

    public void deleteByOwner() {
        this.commentStatus = FeedStatus.DELETED_BY_OWNER;
        this.editedAt = LocalDateTime.now();
    }

    public void deleteByAdmin() {
        this.commentStatus = FeedStatus.DELETED_BY_ADMIN;
        this.editedAt = LocalDateTime.now();
    }

    public void deleteByUser() {
        this.commentStatus = FeedStatus.DELETED_BY_USER;
        this.editedAt = LocalDateTime.now();
    }

    /**
     * Reactivate comment
     */
    public void recoveryComment() {
        if (this.commentStatus == FeedStatus.DELETED_BY_ADMIN ||
                this.commentStatus == FeedStatus.DELETED_BY_USER) {
            throw new IllegalStateException("Cannot reactivate permanently deleted comment");
        }

        this.commentStatus = FeedStatus.ACTIVE;
        this.editedAt = LocalDateTime.now();
    }

    // ================================
    // QUERY METHODS
    // ================================

    public boolean isActive() {
        return this.commentStatus == FeedStatus.ACTIVE;
    }

    /**
     * Check if comment is a reply to another comment
     */
    public boolean isReply() {
        return this.parentCommentId != null;
    }

    /**
     * Check if comment is top-level (not a reply)
     */
    public boolean isTopLevel() {
        return this.parentCommentId == null;
    }

    /**
     * Check if comment is deleted
     */
    public boolean isDeleted() {
        return this.commentStatus == FeedStatus.DELETED_BY_OWNER ||
                this.commentStatus == FeedStatus.DELETED_BY_ADMIN ||
                this.commentStatus == FeedStatus.DELETED_BY_USER;
    }

    /**
     * Check if comment is hidden
     */
    public boolean isHidden() {
        return this.commentStatus == FeedStatus.HIDDEN_BY_USER ||
                this.commentStatus == FeedStatus.HIDDEN_BY_OWNER;
    }

    /**
     * Check if comment is edited
     */
    public boolean isEdited() {
        return !this.createdAt.equals(this.editedAt);
    }

    /**
     * Check if comment has media
     */
    public boolean hasMedia() {
        return !this.media.isEmpty();
    }

    /**
     * Check if comment has tagged users
     */
    public boolean hasTaggedUsers() {
        return !this.taggedUsers.isEmpty();
    }

    /**
     * Get like count
     */
    public int getLikeCount() {
        return this.likes.size();
    }

    /**
     * Get media count
     */
    public int getMediaCount() {
        return this.media.size();
    }

    /**
     * Get tagged users count
     */
    public int getTaggedUsersCount() {
        return this.taggedUsers.size();
    }

    // ================================
    // ENGAGEMENT CALCULATIONS
    // ================================

    public CommentEngagement getEngagement() {
        return CommentEngagement.builder()
                .likeCount(this.likes.size())
                .replyCount(0) // Will be calculated by repository
                .engagementRate(calculateEngagementRate())
                .build();
    }

    /**
     * Calculate engagement rate (simple implementation)
     */
    private double calculateEngagementRate() {
        // Simple calculation: likes count as base engagement
        // Can be enhanced with more sophisticated algorithms
        int totalEngagements = this.likes.size() + this.taggedUsers.size();
        return totalEngagements * 1.0;
    }


    public SMTPAppenderBase<Object> getAuthor() {
        // TODO: Implement this method to return the author of the comment
        return null; // Placeholder return statement
    }

    // ================================
    // VALIDATION METHODS
    // ================================

    /**
     * Validate comment can be modified
     */
    public void validateCanModify() {
        if (!this.isActive()) {
            throw new IllegalStateException("Cannot modify inactive comment");
        }
    }

    /**
     * Validate user can perform action
     */
    public void validateUserCanPerformAction(UserId userId, String action) {
        Objects.requireNonNull(userId, "User ID cannot be null");

        switch (action.toLowerCase()) {
            case "edit", "delete" -> {
                if (!this.authorId.equals(userId)) {
                    throw new IllegalStateException("Only comment author can " + action + " their comment");
                }
            }
            case "like", "unlike" -> {
                if (this.authorId.equals(userId)) {
                    throw new IllegalStateException("User cannot " + action + " their own comment");
                }
            }
        }
    }

    // ================================
    // AGGREGATE ROOT IMPLEMENTATION
    // ================================

    @Override
    public CommentId getId() {
        return this.id;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        PostComment that = (PostComment) obj;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("PostComment{id=%s, postId=%s, authorId=%s, commentStatus=%s, createdAt=%s}",
                id, postId, authorId, commentStatus, createdAt);
    }

    // ================================
    // FACTORY METHODS (Static helpers)
    // ================================

    /**
     * Create top-level comment
     */
    public static PostComment createTopLevel(PostId postId, UserId authorId, CommentContent content) {
        return PostComment.builder()
                .postId(postId)
                .authorId(authorId)
                .content(content)
                .build();
    }

    /**
     * Create reply comment
     */
    public static PostComment createReply(PostId postId, UserId authorId, CommentContent content,
                                          CommentId parentCommentId, CommentId rootCommentId) {
        return PostComment.builder()
                .postId(postId)
                .authorId(authorId)
                .content(content)
                .parentCommentId(parentCommentId)
                .rootCommentId(rootCommentId != null ? rootCommentId : parentCommentId)
                .build();
    }
}
