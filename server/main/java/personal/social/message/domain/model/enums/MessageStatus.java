package personal.social.message.domain.model.enums;

public enum MessageStatus {
    SENT, DELIVERED, READ;

    @Override
    public String toString() {
        return name().toLowerCase();
    }
}
