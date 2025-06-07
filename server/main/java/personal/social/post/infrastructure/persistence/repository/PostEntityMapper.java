package personal.social.post.infrastructure.persistence.repository;

import org.springframework.stereotype.Component;
import personal.social.post.domain.model.Post;
import personal.social.post.domain.model.enums.PostVisibility;
import personal.social.post.domain.model.vo.PostContent;
import personal.social.post.domain.model.vo.PostId;
import personal.social.post.infrastructure.persistence.PostEntity;
import personal.social.user.domain.model.vo.UserId;

@Component
public class PostEntityMapper {

    public PostEntity toEntity(Post domain) {
        return PostEntity.builder()
                .id(domain.getId().value())
                .content(domain.getContent().text())
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getEditedAt())
                .status(domain.getPostStatus())
                .visibility(mapVisibility(domain.getVisibility()))
                .locationName(domain.getLocation() != null ? domain.getLocation().name() : null)
                .locationLat(domain.getLocation() != null ? domain.getLocation().latitude() : null)
                .locationLng(domain.getLocation() != null ? domain.getLocation().longitude() : null)
                .build();
    }

    public Post toDomain(PostEntity entity) {
        return Post.builder()
                .id(PostId.of(entity.getId()))
                .authorId(UserId.of(entity.getAuthor().getId()))
                .content(PostContent.of(entity.getContent()))
                .createdAt(entity.getCreatedAt())
                .editedAt(entity.getUpdatedAt())
                .postStatus(entity.getStatus())
                .visibility(mapVisibility(entity.getVisibility()))
                .build();
    }

    private PostEntity.PostVisibility mapVisibility(PostVisibility visibility) {
        return switch (visibility) {
            case PUBLIC -> PostEntity.PostVisibility.PUBLIC;
            case FRIENDS -> PostEntity.PostVisibility.FRIENDS;
            case PRIVATE -> PostEntity.PostVisibility.PRIVATE;
        };
    }

    private PostVisibility mapVisibility(PostEntity.PostVisibility visibility) {
        return switch (visibility) {
            case PUBLIC -> PostVisibility.PUBLIC;
            case FRIENDS -> PostVisibility.FRIENDS;
            case PRIVATE -> PostVisibility.PRIVATE;
        };
    }
}
