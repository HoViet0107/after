package personal.social.auth.domain.repository;

import personal.social.auth.domain.model.UserSession;
import personal.social.auth.domain.model.enums.Platform;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;
import java.util.Optional;

public interface SessionRepository {
    void saveSession(UserSession session);

    Optional<UserSession> findBySessionId(String sessionId);

    Optional<UserSession> findActiveSessionByUserAndPlatform(UserId userId, Platform platform);

    List<UserSession> findAllActiveSessionsByUser(UserId userId);

    void invalidateSession(String sessionId);

    void invalidateAllUserSessions(UserId userId);

    void invalidateUserSessionByPlatform(UserId userId, Platform platform);

    boolean isSessionActive(String sessionId);

    void updateLastAccessed(String sessionId);

    void cleanupExpiredSessions();

    long countActiveSessions();
}