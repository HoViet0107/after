package personal.social.user.infrastructure.event;

/**
 * Event representing the update of a user's profile information.
 * This event is triggered when a user's profile data, specifically their full name, has been modified.
 * 
 * @param userId The unique identifier of the user whose profile was updated
 * @param fullName The updated full name of the user
 */
public record UserProfileUpdatedEvent(String userId, String fullName) {}
