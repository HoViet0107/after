package personal.social.shared.domain.enums;

public enum FeedMediaType {
    IMAGE, VIDEO, GIF;

    @Override
    public String toString() {
        return this.name().toLowerCase();
    }
}
