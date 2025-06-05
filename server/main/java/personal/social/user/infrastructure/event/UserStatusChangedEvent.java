package personal.social.user.infrastructure.event;

/**
 * An event that represents a change in a user's online status.
 * This event is triggered whenever a user's online/offline status changes in the system.
 *
 * @param userId The unique identifier of the user whose status has changed
 * @param isOnline The new status of the user: true if the user is now online, false if offline
 */
public record UserStatusChangedEvent (Long userId, boolean isOnline) {}
