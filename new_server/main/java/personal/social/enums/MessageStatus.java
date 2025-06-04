package personal.social.enums;

public enum MessageStatus {
    SENDING, SENT, DELIVERED, DELETED, FAILED, READ;

    public String toString() {
        return name();
    }
}
