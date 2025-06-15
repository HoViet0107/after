package personal.social.auth.application.usecase;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import personal.social.auth.domain.repository.SessionRepository;
import personal.social.user.domain.model.vo.UserId;

@Slf4j
@Service
@RequiredArgsConstructor
public class LogoutUseCase {

    private final SessionRepository sessionRepository;

    public void execute(String sessionId) {
        sessionRepository.invalidateSession(sessionId);
        log.info("User logged out. Session: {}", sessionId);
    }

    public void executeAllDevices(UserId userId) {
        sessionRepository.invalidateAllUserSessions(userId);
        log.info("User {} logged out from all devices", userId);
    }
}