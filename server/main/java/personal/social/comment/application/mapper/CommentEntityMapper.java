package personal.social.comment.application.mapper;

import org.springframework.stereotype.Component;
import personal.social.comment.domain.model.PostComment;
import personal.social.comment.infrastructure.persistence.PostCommentEntity;
import personal.social.comment.domain.model.vo.CommentContent;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.post.domain.model.vo.PostId;
import personal.social.user.domain.model.vo.UserId;

@Component
public class CommentEntityMapper {

    public PostCommentEntity toEntity(PostComment domain) {
        return PostCommentEntity.builder()
                .id(domain.getId().value())
                .content(domain.getContent().text())
                .createdAt(domain.getCreatedAt())
                .editedAt(domain.getEditedAt())
                .commentStatus(domain.getCommentStatus())
                .build();
        // Note: Post, Author, Parent, Root references need to be set separately
    }

    public PostComment toDomain(PostCommentEntity entity) {
        return PostComment.builder()
                .id(CommentId.of(entity.getId()))
                .postId(PostId.of(entity.getPost().getId()))
                .authorId(UserId.of(entity.getAuthor().getId()))
                .content(CommentContent.of(entity.getContent()))
                .parentCommentId(entity.getParentComment() != null ?
                        CommentId.of(entity.getParentComment().getId()) : null)
                .rootCommentId(entity.getRootCommentId() != null ?
                        CommentId.of(entity.getRootCommentId().getId()) : null)
                .build();
    }
}
