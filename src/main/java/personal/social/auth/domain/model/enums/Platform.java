package personal.social.auth.domain.model.enums;

import lombok.Getter;

@Getter
public enum Platform {
    WEB("WEB"),
    MOBILE("MOBILE");

    private final String value;

    Platform(String value) {
        this.value = value;
    }

    public static Platform fromValue(String value) {
        for (Platform platform : Platform.values()) {
            if (platform.value.equalsIgnoreCase(value)) {
                return platform;
            }
        }
        throw new IllegalArgumentException("Invalid platform: " + value);
    }
}