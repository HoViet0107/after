package personal.social.config;

import jakarta.annotation.PostConstruct;
import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration class for JWT properties.
 * <p>
 * Loads JWT-related settings from application properties with the prefix "app.jwt".
 * Ensures the secret key is at least 32 characters long and provides default values
 * for token expiration, issuer, and audience.
 */
@Configuration
@ConfigurationProperties(prefix = "app.jwt")
@Data
public class JwtConfig {
    private String secret;
    private long accessTokenExpiration = 86400000; // 24 hours
    private long refreshTokenExpiration = 604800000; // 7 days
    private String issuer = "social-app";
    private String audience = "social-app-users";

    @PostConstruct
    public void init() {
        if (secret == null || secret.length() < 32) {
            throw new IllegalStateException("JWT secret must be at least 32 characters long");
        }
    }
}
