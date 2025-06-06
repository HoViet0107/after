package personal.social.user.application.usecase;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.social.user.domain.event.UserEventPublisher;
import personal.social.user.domain.exception.UserNotFoundException;
import personal.social.user.domain.model.Users;
import personal.social.user.domain.model.vo.UserId;
import personal.social.user.domain.repository.UserRepository;

@Service
@Transactional
@RequiredArgsConstructor
public class UpdateUserStatusUseCase {

    private final UserRepository userRepository;
    private final UserEventPublisher eventPublisher;

    public void userGoesOnline(String userId) {
        UserId id = UserId.of(userId);
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        user.goOnline();
        Users savedUser = userRepository.save(user);

        eventPublisher.publishEvents(savedUser.getDomainEvents());
        savedUser.clearDomainEvents();
    }

    public void userGoesOffline(String userId) {
        UserId id = UserId.of(userId);
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        user.goOffline();
        Users savedUser = userRepository.save(user);

        eventPublisher.publishEvents(savedUser.getDomainEvents());
        savedUser.clearDomainEvents();
    }

    public void updateUserActivity(String userId) {
        UserId id = UserId.of(userId);
        Users user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found: " + userId));

        user.updateActivity();
        userRepository.save(user);
    }
}
