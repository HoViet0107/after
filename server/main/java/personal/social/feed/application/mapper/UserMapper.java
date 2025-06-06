package personal.social.feed.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import personal.social.feed.application.dto.UserSummaryDTO;
import personal.social.user.domain.model.Users;

@Mapper(componentModel = "spring")
public interface UserMapper {

    @Mapping(target = "id", source = "id.value")
    @Mapping(target = "username", source = "email.value") // Using email as username
    @Mapping(target = "displayName", source = "profile.fullName")
    @Mapping(target = "avatarUrl", source = "profile.avatarUrl")
    @Mapping(target = "isVerified", constant = "false") // Default value
    @Mapping(target = "isFollowing", constant = "false") // Will be set in service layer
    UserSummaryDTO toUserSummaryDTO(Users user);
}
