package personal.social.message.domain.model.enums;

public enum MessageType {
    TEXT, IMAGE, FILE, SYSTEM;

    @Override
    public String toString() {
        return name().toLowerCase();
    }
}
