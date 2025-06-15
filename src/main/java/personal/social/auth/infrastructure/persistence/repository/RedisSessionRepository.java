package personal.social.auth.infrastructure.persistence.repository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;
import personal.social.auth.domain.model.UserSession;
import personal.social.auth.domain.model.enums.Platform;
import personal.social.auth.domain.repository.SessionRepository;
import personal.social.user.domain.model.vo.UserId;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Slf4j
@Repository
@RequiredArgsConstructor
public class RedisSessionRepository implements SessionRepository {

    private final RedisTemplate<String, Object> redisTemplate;

    private static final String SESSION_KEY_PREFIX = "session:";
    private static final String USER_SESSION_KEY_PREFIX = "user:sessions:";
    private static final String USER_PLATFORM_SESSION_KEY_PREFIX = "user:platform:session:";
    private static final String SESSION_INDEX_KEY = "sessions:index";

    @Override
    public void saveSession(UserSession session) {
        String sessionKey = SESSION_KEY_PREFIX + session.getSessionId();
        String userSessionKey = USER_SESSION_KEY_PREFIX + session.getUserId();
        String userPlatformKey = USER_PLATFORM_SESSION_KEY_PREFIX +
                session.getUserId() + ":" + session.getPlatform().getValue();

        // Tính TTL
        long ttl = Duration.between(Instant.now(), session.getExpiresAt()).getSeconds();

        // Lưu session data
        redisTemplate.opsForValue().set(sessionKey, session, ttl, TimeUnit.SECONDS);

        // Thêm vào set của user
        redisTemplate.opsForSet().add(userSessionKey, session.getSessionId());
        redisTemplate.expire(userSessionKey, ttl, TimeUnit.SECONDS);

        // Lưu mapping platform -> sessionId
        redisTemplate.opsForValue().set(userPlatformKey, session.getSessionId(), ttl, TimeUnit.SECONDS);

        // Thêm vào global index để cleanup
        redisTemplate.opsForZSet().add(SESSION_INDEX_KEY, session.getSessionId(),
                session.getExpiresAt().toEpochMilli());

        log.info("Saved session: {} for user: {} on platform: {}",
                session.getSessionId(), session.getUserId(), session.getPlatform());
    }

    @Override
    public Optional<UserSession> findBySessionId(String sessionId) {
        String sessionKey = SESSION_KEY_PREFIX + sessionId;
        UserSession session = (UserSession) redisTemplate.opsForValue().get(sessionKey);
        return Optional.ofNullable(session);
    }

    @Override
    public Optional<UserSession> findActiveSessionByUserAndPlatform(UserId userId, Platform platform) {
        String userPlatformKey = USER_PLATFORM_SESSION_KEY_PREFIX + userId + ":" + platform.getValue();
        String sessionId = (String) redisTemplate.opsForValue().get(userPlatformKey);

        return findBySessionId(sessionId)
                .filter(UserSession::isActive);
    }

    @Override
    public List<UserSession> findAllActiveSessionsByUser(UserId userId) {
        String userSessionKey = USER_SESSION_KEY_PREFIX + userId;
        Set<Object> sessionIds = redisTemplate.opsForSet().members(userSessionKey);

        if (sessionIds == null || sessionIds.isEmpty()) {
            return Collections.emptyList();
        }

        return sessionIds.stream()
                .map(id -> findBySessionId((String) id))
                .filter(Optional::isPresent)
                .map(Optional::get)
                .filter(UserSession::isActive)
                .collect(Collectors.toList());
    }

    @Override
    public void invalidateSession(String sessionId) {
        findBySessionId(sessionId).ifPresent(session -> {
            // Deactivate session
            session.setActive(false);
            String sessionKey = SESSION_KEY_PREFIX + sessionId;
            redisTemplate.opsForValue().set(sessionKey, session, 60, TimeUnit.SECONDS); // Keep for 60s for logging

            // Remove from user's session set
            String userSessionKey = USER_SESSION_KEY_PREFIX + session.getUserId();
            redisTemplate.opsForSet().remove(userSessionKey, sessionId);

            // Remove platform mapping
            String userPlatformKey = USER_PLATFORM_SESSION_KEY_PREFIX +
                    session.getUserId() + ":" + session.getPlatform().getValue();
            redisTemplate.delete(userPlatformKey);

            // Remove from index
            redisTemplate.opsForZSet().remove(SESSION_INDEX_KEY, sessionId);

            log.info("Invalidated session: {} for user: {}", sessionId, session.getUserId());
        });
    }

    @Override
    public void invalidateAllUserSessions(UserId userId) {
        List<UserSession> sessions = findAllActiveSessionsByUser(userId);
        sessions.forEach(session -> invalidateSession(session.getSessionId()));

        // Clean up user session set
        String userSessionKey = USER_SESSION_KEY_PREFIX + userId;
        redisTemplate.delete(userSessionKey);
    }

    @Override
    public void invalidateUserSessionByPlatform(UserId userId, Platform platform) {
        findActiveSessionByUserAndPlatform(userId, platform)
                .ifPresent(session -> invalidateSession(session.getSessionId()));
    }

    @Override
    public boolean isSessionActive(String sessionId) {
        return findBySessionId(sessionId)
                .map(UserSession::isActive)
                .orElse(false);
    }

    @Override
    public void updateLastAccessed(String sessionId) {
        findBySessionId(sessionId).ifPresent(session -> {
            session.setLastAccessedAt(Instant.now());
            String sessionKey = SESSION_KEY_PREFIX + sessionId;
            long ttl = Duration.between(Instant.now(), session.getExpiresAt()).getSeconds();
            redisTemplate.opsForValue().set(sessionKey, session, ttl, TimeUnit.SECONDS);
        });
    }

    @Override
    public void cleanupExpiredSessions() {
        long now = Instant.now().toEpochMilli();
        // Get expired sessions
        Set<Object> expiredSessions = redisTemplate.opsForZSet()
                .rangeByScore(SESSION_INDEX_KEY, 0, now);

        if (expiredSessions != null && !expiredSessions.isEmpty()) {
            expiredSessions.forEach(sessionId -> {
                findBySessionId((String) sessionId)
                        .ifPresent(session -> invalidateSession(session.getSessionId()));
            });

            // Remove from index
            redisTemplate.opsForZSet().removeRangeByScore(SESSION_INDEX_KEY, 0, now);

            log.info("Cleaned up {} expired sessions", expiredSessions.size());
        }
    }

    @Override
    public long countActiveSessions() {
        // Đếm tổng số sessions trong index có expiry > now
        long now = Instant.now().toEpochMilli();
        Long count = redisTemplate.opsForZSet().count(SESSION_INDEX_KEY, now, Double.MAX_VALUE);
        return count != null ? count : 0;
    }
}