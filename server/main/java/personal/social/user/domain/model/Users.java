package personal.social.user.domain.model;

import lombok.Getter;
import lombok.Setter;
import lombok.experimental.SuperBuilder;
import personal.social.shared.domain.AggregateRoot;
import personal.social.user.domain.event.UserProfileUpdatedEvent;
import personal.social.user.domain.event.UserStatusChangedEvent;
import personal.social.user.domain.model.enums.UserStatus;
import personal.social.user.domain.model.vo.Email;
import personal.social.user.domain.model.vo.UserId;
import personal.social.user.domain.event.UserCreatedEvent;

import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@SuperBuilder(toBuilder = true)
public class Users extends AggregateRoot<UserId> {

    // Auto-generate ID if not provided
    @lombok.Builder.Default
    private final UserId id = UserId.generate();

    // Required fields
    private final Email email;
    private UserProfile profile;
    private String passwordHash;

    // Default status
    @lombok.Builder.Default
    private UserStatus status = UserStatus.ACTIVE;

    // Auto-generate timestamps
    @lombok.Builder.Default
    private final LocalDateTime createdAt = LocalDateTime.now();
    @lombok.Builder.Default
    private LocalDateTime lastActiveAt = LocalDateTime.now();

    // Default online status
    @lombok.Builder.Default
    private boolean isOnline = false;

    // ================================
    // FACTORY METHODS (Static helpers)
    // ================================

    /**
     * Create new user
     */
    public static Users create(UserId id, Email email, UserProfile profile, String passwordHash) {
        Users user = Users.builder()
                .id(id)
                .email(email)
                .profile(profile)
                .passwordHash(passwordHash)
                .build();

        // Add domain event
        user.addDomainEvent(new UserCreatedEvent(user.id.value(), user.email.value(), user.profile.getFullName()));
        return user;
    }

    /**
     * Create user with auto-generated ID
     */
    public static Users createWithAutoId(Email email, UserProfile profile, String passwordHash) {
        return create(UserId.generate(), email, profile, passwordHash);
    }

    /**
     * Create basic user profile
     */
    public static Users createBasicUser(Email email, String firstName, String lastName, String passwordHash) {
        UserProfile profile = new UserProfile(firstName, null, lastName, null, null);
        return createWithAutoId(email, profile, passwordHash);
    }

    // ================================
    // BUSINESS LOGIC METHODS
    // ================================

    public void updateProfile(UserProfile newProfile) {
        Objects.requireNonNull(newProfile, "Profile cannot be null");

        String oldFullName = this.profile.getFullName();
        this.profile = newProfile;

        // Add domain event if name changed
        if (!oldFullName.equals(newProfile.getFullName())) {
            addDomainEvent(new UserProfileUpdatedEvent(this.id.value(), newProfile.getFullName()));
        }
    }

    public void updatePassword(String newPasswordHash) {
        Objects.requireNonNull(newPasswordHash, "Password hash cannot be null");

        if (!this.isActive()) {
            throw new IllegalStateException("Cannot update password for inactive user");
        }

        this.passwordHash = newPasswordHash;
    }

    public void goOnline() {
        if (!this.isOnline) {
            this.isOnline = true;
            this.lastActiveAt = LocalDateTime.now();
            addDomainEvent(new UserStatusChangedEvent(this.id.value(), true));
        }
    }

    public void goOffline() {
        if (this.isOnline) {
            this.isOnline = false;
            this.lastActiveAt = LocalDateTime.now();
            addDomainEvent(new UserStatusChangedEvent(this.id.value(), false));
        }
    }

    public void updateActivity() {
        this.lastActiveAt = LocalDateTime.now();
        if (!this.isOnline) {
            goOnline();
        }
    }

    // ================================
    // STATUS MANAGEMENT METHODS
    // ================================

    public void deactivateAccount() {
        if (this.status == UserStatus.ACTIVE) {
            this.status = UserStatus.DEACTIVATED;
            goOffline();
        }
    }

    public void reactivateAccount() {
        if (this.status == UserStatus.DEACTIVATED) {
            this.status = UserStatus.ACTIVE;
        }
    }

    public void suspendAccount() {
        this.status = UserStatus.SUSPENDED;
        goOffline();
    }

    public void banAccount() {
        this.status = UserStatus.BANNED;
        goOffline();
    }

    public void deleteAccount() {
        this.status = UserStatus.DELETED;
        goOffline();

        // Clear sensitive data
        this.passwordHash = null;
    }

    public void markAsVerified() {
        if (this.status == UserStatus.PENDING_VERIFICATION) {
            this.status = UserStatus.ACTIVE;
        }
    }

    // ================================
    // QUERY METHODS
    // ================================

    public boolean isActive() {
        return this.status == UserStatus.ACTIVE;
    }

    public boolean canLogin() {
        return this.status == UserStatus.ACTIVE || this.status == UserStatus.PENDING_VERIFICATION;
    }

    public boolean isRecentlyActive() {
        return this.lastActiveAt.isAfter(LocalDateTime.now().minusMinutes(30));
    }

    public boolean isSuspended() {
        return this.status == UserStatus.SUSPENDED;
    }

    public boolean isBanned() {
        return this.status == UserStatus.BANNED;
    }

    public boolean isDeleted() {
        return this.status == UserStatus.DELETED;
    }

    public boolean isPendingVerification() {
        return this.status == UserStatus.PENDING_VERIFICATION;
    }

    public boolean hasPassword() {
        return this.passwordHash != null && !this.passwordHash.trim().isEmpty();
    }

    public boolean hasCompletedProfile() {
        return this.profile != null &&
                this.profile.getFirstName() != null &&
                this.profile.getLastName() != null;
    }

    // ================================
    // UTILITY METHODS
    // ================================

    public String getFullName() {
        return this.profile != null ? this.profile.getFullName() : "Unknown User";
    }

    public String getDisplayName() {
        if (this.profile == null) return "Unknown User";

        String firstName = this.profile.getFirstName();
        String lastName = this.profile.getLastName();

        if (firstName != null && lastName != null) {
            return firstName + " " + lastName;
        } else if (firstName != null) {
            return firstName;
        } else if (lastName != null) {
            return lastName;
        } else {
            return "Unknown User";
        }
    }

    public long getAccountAgeInDays() {
        return java.time.Duration.between(this.createdAt, LocalDateTime.now()).toDays();
    }

    public long getInactiveTimeInMinutes() {
        return java.time.Duration.between(this.lastActiveAt, LocalDateTime.now()).toMinutes();
    }

    // ================================
    // VALIDATION METHODS
    // ================================

    public void validateCanPerformAction(String action) {
        switch (action.toLowerCase()) {
            case "login" -> {
                if (!canLogin()) {
                    throw new IllegalStateException("User cannot login: " + this.status);
                }
            }
            case "post", "comment", "like" -> {
                if (!isActive()) {
                    throw new IllegalStateException("User cannot perform action: " + this.status);
                }
            }
            case "update_profile" -> {
                if (isDeleted() || isBanned()) {
                    throw new IllegalStateException("User cannot update profile: " + this.status);
                }
            }
        }
    }

    public void validatePasswordRequirements(String password) {
        if (password == null || password.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters long");
        }
        // Add more password validation rules as needed
    }

    // ================================
    // AGGREGATE ROOT IMPLEMENTATION
    // ================================

    @Override
    public UserId getId() {
        return this.id;
    }

    @Override
    public boolean equals(Object obj) {
        if (this == obj) return true;
        if (obj == null || getClass() != obj.getClass()) return false;
        Users that = (Users) obj;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return String.format("Users{id=%s, email=%s, status=%s, isOnline=%s, createdAt=%s}",
                id, email, status, isOnline, createdAt);
    }
}
