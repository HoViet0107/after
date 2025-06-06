package personal.social.user.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import personal.social.user.infrastructure.persistence.UserFollowEntity;

import java.util.Set;

public interface UserFollowRepository extends JpaRepository<UserFollowEntity, Long> {

    @Query("SELECT f.followedId FROM UserFollowEntity f WHERE f.followerId = :userId")
    Set<String> findFollowedUserIds(@Param("userId") String userId);

    boolean existsByFollowerIdAndFollowedId(String followerId, String followedId);
}
