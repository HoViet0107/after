package personal.social.feed.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import personal.social.feed.application.dto.MediaDTO;
import personal.social.feed.domain.model.PostMedia;

@Mapper(componentModel = "spring")
public interface MediaMapper {

    @Mapping(target = "id", source = "id.value")
    @Mapping(target = "type", source = "type")
    MediaDTO toMediaDTO(PostMedia media);
}
