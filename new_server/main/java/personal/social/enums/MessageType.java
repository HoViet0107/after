package personal.social.enums;

public enum MessageType {
    TEXT,
    MESSAGE_READ,
    MESSAGE_DELETED,
    USER_TYPING,
    USER_ONLINE,
    USER_OFFLINE,
    NEW_CONVERSATION;

    public String toString() {
        return name();
    }
}
