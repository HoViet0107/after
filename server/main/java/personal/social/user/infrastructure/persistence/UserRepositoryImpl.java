package personal.social.user.infrastructure.persistence;

import org.springframework.stereotype.Repository;

import personal.social.user.domain.model.enums.UserStatus;
import personal.social.user.domain.model.vo.Email;
import personal.social.user.domain.model.vo.UserId;
import personal.social.user.domain.model.UserProfile;
import personal.social.user.domain.model.Users;
import personal.social.user.domain.repository.UserRepository;
import lombok.RequiredArgsConstructor;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of the UserRepository interface that uses JPA for database operations.
 * This class serves as an adapter between the domain model and the persistence layer,
 * translating between domain entities (Users) and JPA entities (UserEntity).
 * <p>
 * It handles all database operations related to user management including saving,
 * finding, and deleting users while maintaining the integrity of the domain model.
 * <p>
 * The implementation relies on UserJpaRepository for actual database interactions
 * and provides mapping methods to convert between domain and persistence models.
 *
 * @see UserRepository
 * @see UserJpaRepository
 * @see Users
 * @see UserEntity
 */
@Repository
@RequiredArgsConstructor
public class UserRepositoryImpl implements UserRepository {

    private final UserJpaRepository jpaRepository;

    @Override
    public Users save(Users user) {
        UserEntity entity = toEntity(user);
        UserEntity savedEntity = jpaRepository.save(entity);
        return toDomain(savedEntity);
    }

    @Override
    public Optional<Users> findById(UserId id) {
        return jpaRepository.findById(id.value())
                .map(this::toDomain);
    }

    @Override
    public Optional<Users> findByEmail(Email email) {
        return jpaRepository.findByEmail(email.value())
                .map(this::toDomain);
    }

    @Override
    public List<Users> findOnlineUsers() {
        return jpaRepository.findAllOnlineUsers()
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public void delete(UserId id) {
        jpaRepository.deleteById(id.value());
    }

    @Override
    public boolean existsByEmail(Email email) {
        return jpaRepository.existsByEmail(email.value());
    }

    // Mapping methods
    private UserEntity toEntity(Users user) {
        UserEntity entity = new UserEntity();
        entity.setId(user.getId().value());
        entity.setEmail(user.getEmail().value());
        entity.setPasswordHash(user.getPasswordHash());
        entity.setFirstName(user.getProfile().getFirstName());
        entity.setMiddleName(user.getProfile().getMiddleName());
        entity.setLastName(user.getProfile().getLastName());
        entity.setBio(user.getProfile().getBio());
        entity.setAvatarUrl(user.getProfile().getAvatarUrl());
        entity.setStatus(user.getStatus().name());
        entity.setIsOnline(user.isOnline());
        entity.setCreatedAt(user.getCreatedAt());
        entity.setLastActiveAt(user.getLastActiveAt());
        return entity;
    }

    private Users toDomain(UserEntity entity) {
        UserProfile profile = new UserProfile(
                entity.getFirstName(),
                entity.getMiddleName(),
                entity.getLastName(),
                entity.getBio(),
                entity.getAvatarUrl()
        );

        Users user = Users.builder()
                .id(UserId.of(entity.getId()))
                .email(Email.of(entity.getEmail()))
                .profile(profile)
                .passwordHash(entity.getPasswordHash())
                .status(UserStatus.valueOf(entity.getStatus()))
                .isOnline(entity.getIsOnline())
                .createdAt(entity.getCreatedAt())
                .lastActiveAt(entity.getLastActiveAt())
                .build();

        return user;
    }
}