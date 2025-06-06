package personal.social.message.domain.model.vo;

public record MessageId(String value) {
    public MessageId {
        if (value == null || value.trim().isEmpty()) {
            throw new IllegalArgumentException("Message ID cannot be null or empty");
        }
    }

    public static MessageId of(String value) {
        return new MessageId(value);
    }

    public static MessageId generate() {
        return new MessageId(java.util.UUID.randomUUID().toString());
    }
}
