package personal.social.services.monitoring;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.actuator.health.Health;
import org.springframework.boot.actuator.health.HealthIndicator;
import org.springframework.stereotype.Component;
import personal.social.services.RedisService;
import personal.social.services.cache.RedisService;

import javax.sql.DataSource;
import java.sql.Connection;

@Component("customHealthCheck")
@RequiredArgsConstructor
@Slf4j
public class CustomHealthIndicator implements HealthIndicator {

    private final RedisService redisService;
    private final DataSource dataSource;

    @Override
    public Health health() {
        try {
            // Check database connectivity
            boolean dbHealthy = checkDatabase();

            // Check Redis connectivity
            boolean redisHealthy = checkRedis();

            if (dbHealthy && redisHealthy) {
                return Health.up()
                        .withDetail("database", "UP")
                        .withDetail("redis", "UP")
                        .withDetail("timestamp", System.currentTimeMillis())
                        .build();
            } else {
                return Health.down()
                        .withDetail("database", dbHealthy ? "UP" : "DOWN")
                        .withDetail("redis", redisHealthy ? "UP" : "DOWN")
                        .withDetail("timestamp", System.currentTimeMillis())
                        .build();
            }
        } catch (Exception e) {
            log.error("Health check failed: {}", e.getMessage());
            return Health.down()
                    .withDetail("error", e.getMessage())
                    .withDetail("timestamp", System.currentTimeMillis())
                    .build();
        }
    }

    private boolean checkDatabase() {
        try (Connection connection = dataSource.getConnection()) {
            return connection.isValid(5); // 5 second timeout
        } catch (Exception e) {
            log.error("Database health check failed: {}", e.getMessage());
            return false;
        }
    }

    private boolean checkRedis() {
        try {
            String testKey = "health:check:" + System.currentTimeMillis();
            redisService.set(testKey, "test");
            String result = redisService.get(testKey, String.class);
            redisService.delete(testKey);
            return "test".equals(result);
        } catch (Exception e) {
            log.error("Redis health check failed: {}", e.getMessage());
            return false;
        }
    }
}
