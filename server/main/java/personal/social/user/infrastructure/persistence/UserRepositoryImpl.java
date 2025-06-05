package personal.social.user.infrastructure.persistence;

import org.springframework.stereotype.Repository;

import personal.social.user.domain.model.Email;
import personal.social.user.domain.model.UserId;
import personal.social.user.domain.model.UserProfile;
import personal.social.user.domain.model.Users;
import personal.social.user.domain.port.UserRepository;
import lombok.RequiredArgsConstructor;

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
 * @author Hoviet
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
    public void delete(UserId id) {
        jpaRepository.deleteById(id.value());
    }

    @Override
    public boolean existsByEmail(Email email) {
        return jpaRepository.existsByEmail(email.value());
    }

    // Mapping methods

    /**
     * Converts a domain User object to a JPA UserEntity for persistence.
     *
     * @param user the domain user object to convert
     * @return UserEntity ready for JPA operations
     * @throws IllegalArgumentException if user is null
     */
    private UserEntity toEntity(Users user) {
        UserEntity entity = new UserEntity();
        if (user.getId() != null) {
            entity.setId(user.getId().value());
        }
        entity.setEmail(user.getEmail().value());
        entity.setFirstName(user.getProfile().getFirstName());
        entity.setLastName(user.getProfile().getLastName());
        entity.setBio(user.getProfile().getBio());
        entity.setAvatarUrl(user.getProfile().getAvatarUrl());
        entity.setCreatedAt(user.getCreatedAt());
        entity.setLastActiveAt(user.getLastActiveAt());
        return entity;
    }

    /**
     * Converts a JPA UserEntity to a domain User object.
     *
     * @param entity the JPA entity to convert
     * @return Users domain object
     * @throws IllegalArgumentException if entity is null or has invalid data
     */
    private Users toDomain(UserEntity entity) {
        UserProfile profile = new UserProfile(
                entity.getFirstName(),
                entity.getMiddleName(),
                entity.getLastName(),
                entity.getBio(),
                entity.getAvatarUrl()
        );

        Users user = Users.create(
                UserId.of(entity.getId()),
                Email.of(entity.getEmail()),
                profile
        );

        return user;
    }
}
