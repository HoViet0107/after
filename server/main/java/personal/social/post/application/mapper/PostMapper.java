package personal.social.post.application.mapper;

import org.mapstruct.*;
import org.mapstruct.factory.Mappers;
import personal.social.post.application.dto.PostWebDTO;
import personal.social.post.domain.model.Post;
import personal.social.post.application.dto.*;
import personal.social.post.application.dto.PostMobileDTO;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {UserMapper.class, MediaMapper.class},
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface PostMapper {

    PostMapper INSTANCE = Mappers.getMapper(PostMapper.class);

    // Mobile mapping - simplified
    @Mapping(target = "id", source = "id.value")
    @Mapping(target = "content", source = "content.text")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "likeCount", expression = "java(post.getLikes().size())")
    @Mapping(target = "commentCount", expression = "java(post.getComments().size())")
    @Mapping(target = "isLikedByCurrentUser", constant = "false") // Set in service layer
    @Mapping(target = "isBookmarked", constant = "false") // Set in service layer
    @Mapping(target = "firstMediaUrl", expression = "java(getFirstMediaUrl(post))")
    @Mapping(target = "mediaType", expression = "java(getMediaType(post))")
    @Mapping(target = "authorUsername", constant = "unknown")
    @Mapping(target = "authorAvatarUrl", constant = "")
    PostMobileDTO toMobileDTO(Post post);

    // Web mapping - simplified
    @Mapping(target = "id", source = "id.value")
    @Mapping(target = "content", source = "content.text")
    @Mapping(target = "createdAt", source = "createdAt")
    @Mapping(target = "updatedAt", source = "editedAt")
    @Mapping(target = "engagement", source = "engagement")
    @Mapping(target = "media", source = "media")
    @Mapping(target = "location", source = "location")
    @Mapping(target = "hashtags", expression = "java(extractHashtags(post))")
    @Mapping(target = "isLikedByCurrentUser", constant = "false") // Set in service layer
    @Mapping(target = "isBookmarked", constant = "false") // Set in service layer
    @Mapping(target = "isFollowingAuthor", constant = "false") // Set in service layer
    @Mapping(target = "visibility", source = "visibility")
    @Mapping(target = "author", ignore = true) // Set manually
    @Mapping(target = "taggedUsers", ignore = true) // Set manually
    @Mapping(target = "topComments", ignore = true)
    // Set manually
    PostWebDTO toWebDTO(Post post);

    // Helper methods
    default String getFirstMediaUrl(Post post) {
        return post.getMedia().isEmpty() ? null : post.getMedia().get(0).getUrl();
    }

    default String getMediaType(Post post) {
        if (post.getMedia().isEmpty()) return "NONE";
        return post.getMedia().get(0).getType().name();
    }

    default List<String> extractHashtags(Post post) {
        return post.getHashtags().stream()
                .map(hashtag -> hashtag.getValue())
                .collect(java.util.stream.Collectors.toList());
    }
}
