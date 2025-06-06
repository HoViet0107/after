package personal.social.user.domain.model.enums;

public enum UserStatus {
    ACTIVE,
    DEACTIVATED,
    SUSPENDED,
    PENDING_VERIFICATION,
    BANNED,
    DELETED;

    @Override
    public String toString() {
        return this.name().toLowerCase();
    }
}
