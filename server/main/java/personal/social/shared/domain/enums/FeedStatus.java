package personal.social.shared.domain.enums;

/**
 * Enum representing the various statuses a feed item (post or comment) can have.
 * This is used to manage visibility and lifecycle of feed items in the social platform.
 */
public enum FeedStatus {
    ACTIVE,             // Always visible, not hidden or deleted
    HIDDEN_BY_USER,     // Hidden by the user (comment)
    HIDDEN_BY_OWNER,    // Hidden by the owner of the Post (post or comment)
    DELETED_BY_OWNER,   // Deleted by the owner of the Post (post or comment)
    DELETED_BY_USER,    // Deleted by the user (comment)
    DELETED_BY_ADMIN,   // Deleted by an admin
    FLAGGED,            // Reported by other users
    SPAM,               // Spam marking system
    BLOCKED;            // Display blocked( e.g., user blocked a specific post)

    @Override
    public String toString() {
        return this.name().toLowerCase();
    }
}
