package personal.social.post.domain.model.vo;

public record Location(String name, Double latitude, Double longitude, String address) {
    public Location {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Location name cannot be empty");
        }
    }
}
