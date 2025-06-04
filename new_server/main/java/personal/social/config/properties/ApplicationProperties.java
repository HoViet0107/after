package personal.social.config.properties;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.validation.annotation.Validated;

@Configuration
@ConfigurationProperties(prefix = "app")
@Data
@Validated
public class ApplicationProperties {

    private final Cache cache = new Cache();
    private final WebSocket webSocket = new WebSocket();
    private final Message message = new Message();
    private final Security security = new Security();

    @Data
    public static class Cache {
        @Min(1)
        @Max(24)
        private int defaultTtlHours = 1;

        @Min(10)
        @Max(300)
        private int userTtlMinutes = 60;

        @Min(5)
        @Max(120)
        private int messageTtlMinutes = 30;

        private boolean enableStatistics = true;
        private boolean enableCleanup = true;
    }

    @Data
    public static class WebSocket {
        @Min(1000)
        @Max(60000)
        private int heartbeatInterval = 25000;

        @Min(1000)
        @Max(30000)
        private int disconnectDelay = 5000;

        @Min(1)
        @Max(100)
        private int maxSessionsPerUser = 5;

        private boolean enableBroadcast = true;
        private boolean enablePresence = true;
    }

    @Data
    public static class Message {
        @Min(1)
        @Max(1000)
        private int maxPageSize = 100;

        @Min(1)
        @Max(100)
        private int defaultPageSize = 20;

        @Min(1)
        @Max(10)
        private int maxMediaFiles = 5;

        private boolean enableAsync = true;
        private boolean enableBatching = true;
    }

    @Data
    public static class Security {
        @NotBlank
        private String jwtSecret = "default-secret-key";

        @Min(1)
        @Max(168)
        private int jwtExpirationHours = 24;

        private boolean enableRateLimit = true;
        private int rateLimitRequests = 100;
        private int rateLimitWindowMinutes = 1;
    }
}
