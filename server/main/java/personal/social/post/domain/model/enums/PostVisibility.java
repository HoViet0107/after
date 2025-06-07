package personal.social.post.domain.model.enums;

public enum PostVisibility {
    PUBLIC, FRIENDS, PRIVATE;

    @Override
    public String toString() {
        return this.name().toLowerCase();
    }
}
