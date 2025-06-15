package personal.social.post.application.dto;

import lombok.*;

@Getter @Setter @Builder
@NoArgsConstructor
@AllArgsConstructor
public class LocationDTO {
    private String name;
    private Double latitude;
    private Double longitude;
    private String address;
}
