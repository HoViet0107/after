package personal.social.feed.infrastructure.persistence.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import personal.social.feed.domain.model.Post;
import personal.social.feed.domain.model.vo.PostId;
import personal.social.feed.domain.repository.PostRepository;
import personal.social.feed.infrastructure.persistence.PostEntity;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class PostRepositoryImpl implements PostRepository {

    private final PostJpaRepository jpaRepository;
    private final PostEntityMapper mapper;

    @Override
    public Post save(Post post) {
        PostEntity entity = mapper.toEntity(post);
        PostEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Post> findById(PostId id) {
        return jpaRepository.findById(id.value())
                .map(mapper::toDomain);
    }

    @Override
    public List<Post> findByAuthor(UserId authorId) {
        return jpaRepository.findByAuthor_Id(authorId.value())
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<Post> findPublicPosts() {
        return jpaRepository.findByStatusAndVisibility("ACTIVE", PostEntity.PostVisibility.PUBLIC)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void delete(PostId id) {
        jpaRepository.deleteById(id.value());
    }

    @Override
    public boolean existsById(PostId id) {
        return jpaRepository.existsById(id.value());
    }

    @Override
    public List<String> findTrendingPostIds(int hours) {
        return jpaRepository.findTrendingPostIds(hours);
    }
}
