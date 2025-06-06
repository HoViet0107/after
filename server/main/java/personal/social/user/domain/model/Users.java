package personal.social.user.domain.model;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;
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
@Builder
public class Users extends AggregateRoot<UserId> {
    private final UserId id;
    private final Email email;
    private UserProfile profile;
    private UserStatus status;
    private final LocalDateTime createdAt;
    private LocalDateTime lastActiveAt;
    private boolean isOnline;
    private String passwordHash;

    private Users(UserId id, Email email, UserProfile profile, String passwordHash) {
        this.id = Objects.requireNonNull(id);
        this.email = Objects.requireNonNull(email);
        this.profile = Objects.requireNonNull(profile);
        this.passwordHash = passwordHash;
        this.status = UserStatus.ACTIVE;
        this.createdAt = LocalDateTime.now();
        this.lastActiveAt = LocalDateTime.now();
        this.isOnline = false;

        // Add domain event
        addDomainEvent(new UserCreatedEvent(this.id.toString(), this.email.toString(), this.profile.getFullName()));
    }

    public static Users create(UserId id, Email email, UserProfile profile, String passwordHash) {
        return new Users(id, email, profile, passwordHash);
    }

    // Business Methods
    public void updateProfile(UserProfile newProfile) {
        Objects.requireNonNull(newProfile);

        String oldFullName = this.profile.getFullName();
        this.profile = newProfile;

        // Add domain event if name changed
        if (!oldFullName.equals(newProfile.getFullName())) {
            addDomainEvent(new UserProfileUpdatedEvent(this.id.toString(), newProfile.getFullName()));
        }
    }

    public void goOnline() {
        if (!this.isOnline) {
            this.isOnline = true;
            this.lastActiveAt = LocalDateTime.now();
            addDomainEvent(new UserStatusChangedEvent(this.id.toString(), true));
        }
    }

    public void goOffline() {
        if (this.isOnline) {
            this.isOnline = false;
            this.lastActiveAt = LocalDateTime.now();
            addDomainEvent(new UserStatusChangedEvent(this.id.toString(), false));
        }
    }

    public void updateActivity() {
        this.lastActiveAt = LocalDateTime.now();
        if (!this.isOnline) {
            goOnline();
        }
    }

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

    // Query Methods
    public boolean isActive() {
        return this.status == UserStatus.ACTIVE;
    }

    public boolean canLogin() {
        return this.status == UserStatus.ACTIVE;
    }

    public boolean isRecentlyActive() {
        return this.lastActiveAt.isAfter(LocalDateTime.now().minusMinutes(30));
    }

    @Override
    public UserId getId() {
        return this.id;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Users user = (Users) o;
        return Objects.equals(id, user.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
}
