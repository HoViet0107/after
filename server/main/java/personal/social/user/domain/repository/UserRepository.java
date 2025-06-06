package personal.social.user.domain.repository;

import personal.social.user.domain.model.Users;
import personal.social.user.domain.model.vo.Email;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;
import java.util.Optional;

public interface UserRepository {
    Users save(Users user);
    Optional<Users> findById(UserId id);
    Optional<Users> findByEmail(Email email);
    List<Users> findOnlineUsers();
    void delete(UserId id);
    boolean existsByEmail(Email email);
    List<String> findActiveUserIds();
}
