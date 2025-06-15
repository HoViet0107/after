package personal.social.post.application.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.springframework.stereotype.Component;
import personal.social.post.application.dto.MediaDTO;
import personal.social.post.domain.model.PostMedia;

@Mapper(componentModel = "spring")
@Component("postMediaMapper")
public interface MediaMapper {

    @Mapping(target = "id", source = "id.value")
    @Mapping(target = "type", source = "type")
    MediaDTO toMediaDTO(PostMedia media);
}
