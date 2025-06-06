package personal.social.comment.infrastructure.persistence.repository;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import personal.social.comment.domain.model.PostComment;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.comment.domain.repository.CommentRepository;
import personal.social.comment.infrastructure.persistence.PostCommentEntity;
import personal.social.comment.application.mapper.CommentEntityMapper;
import personal.social.feed.domain.model.vo.PostId;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;
import java.util.Optional;

@Repository
@RequiredArgsConstructor
public class JpaCommentRepository implements CommentRepository {

    private final JpaCommentEntityRepository jpaRepository;
    private final CommentEntityMapper mapper;

    @Override
    public PostComment save(PostComment comment) {
        PostCommentEntity entity = mapper.toEntity(comment);
        PostCommentEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<PostComment> findById(CommentId commentId) {
        return jpaRepository.findById(commentId.value())
                .map(mapper::toDomain);
    }

    @Override
    public List<PostComment> findByPostId(PostId postId) {
        return jpaRepository.findByPostIdAndStatusOrderByCreatedAtDesc(postId.value(), "ACTIVE")
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<PostComment> findRepliesByParentId(CommentId parentId) {
        return jpaRepository.findByParentCommentIdAndStatusOrderByCreatedAtAsc(parentId.value(), "ACTIVE")
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public List<PostComment> findByAuthorId(UserId authorId) {
        return jpaRepository.findByAuthorIdAndStatusOrderByCreatedAtDesc(authorId.value(), "ACTIVE")
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    public void delete(CommentId commentId) {
        jpaRepository.deleteById(commentId.value());
    }

    @Override
    public long countRepliesByCommentId(CommentId commentId) {
        return jpaRepository.countByParentCommentIdAndStatus(commentId.value(), "ACTIVE");
    }

    @Override
    public boolean existsById(CommentId commentId) {
        return jpaRepository.existsById(commentId.value());
    }
}
