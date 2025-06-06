package personal.social.shared.domain.vo;

import java.util.UUID;

public final class IdGenerator {
    private IdGenerator() {}

    public static String generate() {
        return UUID.randomUUID().toString();
    }

    public static String generateWithPrefix(String prefix) {
        return prefix + "_" + UUID.randomUUID().toString();
    }
}
