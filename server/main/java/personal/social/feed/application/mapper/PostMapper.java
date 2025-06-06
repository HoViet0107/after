package personal.social.feed.application.mapper;

import org.mapstruct.*;
import org.mapstruct.factory.Mappers;
import personal.social.comment.domain.model.PostComment;
import personal.social.feed.application.dto.PostWebDTO;
import personal.social.feed.domain.model.Post;
import personal.social.feed.application.dto.*;
import personal.social.feed.application.dto.PostMobileDTO;

import java.util.List;

@Mapper(
        componentModel = "spring",
        uses = {UserMapper.class, MediaMapper.class},
        nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE
)
public interface PostMapper {

    PostMapper INSTANCE = Mappers.getMapper(PostMapper.class);

    // Mobile mapping - optimized for bandwidth
    @Mapping(target = "id", source = "post.id.value")
    @Mapping(target = "content", source = "post.content.text")
    @Mapping(target = "authorUsername", source = "post.author.username")
    @Mapping(target = "authorAvatarUrl", source = "post.author.profile.avatarUrl")
    @Mapping(target = "createdAt", source = "post.createdAt")
    @Mapping(target = "likeCount", expression = "java(post.getEngagement().getLikeCount())")
    @Mapping(target = "commentCount", expression = "java(post.getEngagement().getCommentCount())")
    @Mapping(target = "isLikedByCurrentUser", ignore = true) // Set in service layer
    @Mapping(target = "isBookmarked", ignore = true) // Set in service layer
    @Mapping(target = "firstMediaUrl", expression = "java(getFirstMediaUrl(post))")
    @Mapping(target = "mediaType", expression = "java(getMediaType(post))")
    PostMobileDTO toMobileDTO(Post post);

    // Web mapping - full featured
    @Mapping(target = "id", source = "post.id.value")
    @Mapping(target = "content", source = "post.content.text")
    @Mapping(target = "author", source = "post.author")
    @Mapping(target = "createdAt", source = "post.createdAt")
    @Mapping(target = "updatedAt", source = "post.updatedAt")
    @Mapping(target = "engagement", source = "post.engagement")
    @Mapping(target = "media", source = "post.media")
    @Mapping(target = "location", source = "post.location")
    @Mapping(target = "hashtags", expression = "java(extractHashtags(post))")
    @Mapping(target = "taggedUsers", source = "post.taggedUsers")
    @Mapping(target = "topComments", expression = "java(getTopComments(post, 3))")
    @Mapping(target = "isLikedByCurrentUser", ignore = true) // Set in service layer
    @Mapping(target = "isBookmarked", ignore = true) // Set in service layer
    @Mapping(target = "isFollowingAuthor", ignore = true) // Set in service layer
    @Mapping(target = "visibility", source = "post.visibility")
    PostWebDTO toWebDTO(Post post);

    // Context-aware mapping with current user
    @Mapping(target = "isLikedByCurrentUser",
            expression = "java(isLikedByUser(post, currentUserId))")
    @Mapping(target = "isBookmarked",
            expression = "java(isBookmarkedByUser(post, currentUserId))")
    PostMobileDTO toMobileDTO(Post post, @Context Long currentUserId);

    @Mapping(target = "isLikedByCurrentUser",
            expression = "java(isLikedByUser(post, currentUserId))")
    @Mapping(target = "isBookmarked",
            expression = "java(isBookmarkedByUser(post, currentUserId))")
    @Mapping(target = "isFollowingAuthor",
            expression = "java(isFollowingAuthor(post, currentUserId))")
    PostWebDTO toWebDTO(Post post, @Context Long currentUserId);

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

    default List<CommentPreviewDTO> getTopComments(Post post, int limit) {
        return post.getComments().stream()
                .sorted((c1, c2) -> c2.getCreatedAt().compareTo(c1.getCreatedAt()))
                .limit(limit)
                .map(this::toCommentPreview)
                .collect(java.util.stream.Collectors.toList());
    }

    default CommentPreviewDTO toCommentPreview(PostComment comment) {
        CommentPreviewDTO dto = new CommentPreviewDTO();
        dto.setId(comment.getId().value());
        dto.setContent(String.valueOf(comment.getContent()));
        dto.setAuthorUsername(comment.getAuthor().getUsername());
        dto.setCreatedAt(comment.getCreatedAt());
        dto.setLikeCount(comment.getEngagement().likeCount());
        return dto;
    }

    default boolean isLikedByUser(Post post, Long userId) {
        return post.getLikes().stream()
                .anyMatch(like -> like.getUser().getId().getValue().equals(userId));
    }

    default boolean isBookmarkedByUser(Post post, Long userId) {
        return post.getBookmarks().stream()
                .anyMatch(bookmark -> bookmark.getUser().getId().getValue().equals(userId));
    }

    default boolean isFollowingAuthor(Post post, Long userId) {
        // This would need to be injected from service layer
        return false; // Placeholder
    }
}
