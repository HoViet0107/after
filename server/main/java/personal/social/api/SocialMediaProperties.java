package personal.social.api;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "social.app")
public class SocialMediaProperties {

    private final Cache cache = new Cache();
    private final WebSocket webSocket = new WebSocket();
    private final Security security = new Security();
    private final FileUpload fileUpload = new FileUpload();

    // Getters for nested classes
    public Cache getCache() { return cache; }
    public WebSocket getWebSocket() { return webSocket; }
    public Security getSecurity() { return security; }
    public FileUpload getFileUpload() { return fileUpload; }

    @Setter
    @Getter
    public static class Cache {
        // Getters and setters
        private int defaultTtlMinutes = 30;
        private int feedTtlMinutes = 15;
        private int sessionTtlMinutes = 30;
        private int profileTtlHours = 2;
    }

    @Setter
    @Getter
    public static class WebSocket {
        private int maxConnections = 1000;
        private int heartbeatInterval = 30000;
        private int messageBufferSize = 512;

    }

    @Setter
    @Getter
    public static class Security {
        private int maxLoginAttempts = 5;
        private int lockoutDurationMinutes = 15;
        private boolean enableBruteForceProtection = true;

    }

    @Setter
    @Getter
    public static class FileUpload {
        private String uploadDir = "uploads";
        private long maxFileSize = 10485760; // 10MB
        private String[] allowedTypes = {"image/jpeg", "image/png", "image/gif", "video/mp4"};

    }
}
