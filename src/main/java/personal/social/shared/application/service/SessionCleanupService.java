package personal.social.shared.application.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import personal.social.auth.domain.repository.SessionRepository;
import personal.social.shared.infrastructure.monitoring.MetricsService;

import java.time.Duration;
import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionCleanupService {

    private final SessionRepository sessionRepository;
    private final MetricsService metricsService;

    /**
     * Cleanup expired sessions every 6 hours
     */
    @Scheduled(cron = "0 0 */6 * * *")
    public void cleanupExpiredSessions() {
        Instant startTime = Instant.now();
        log.info("Starting session cleanup task at {}", startTime);

        try {
            sessionRepository.cleanupExpiredSessions();

            Duration duration = Duration.between(startTime, Instant.now());
            log.info("Session cleanup completed in {} ms", duration.toMillis());

            // Record metrics
            metricsService.recordScheduledTaskExecution("session_cleanup", duration.toMillis());

        } catch (Exception e) {
            log.error("Error during session cleanup", e);
            metricsService.recordScheduledTaskError("session_cleanup");
        }
    }

    /**
     * Health check - đếm số session active mỗi giờ
     */
    @Scheduled(cron = "0 0 * * * *")
    public void monitorActiveSessions() {
        try {
            long activeSessionCount = sessionRepository.countActiveSessions();
            log.info("Current active sessions: {}", activeSessionCount);

            metricsService.recordGauge("active_sessions", activeSessionCount);

            // Alert nếu quá nhiều sessions
            if (activeSessionCount > 10000) {
                log.warn("High number of active sessions detected: {}", activeSessionCount);
                // Có thể gửi alert
            }
        } catch (Exception e) {
            log.error("Error monitoring active sessions", e);
        }
    }
}