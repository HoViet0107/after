package personal.social.shared.application.dto.base;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter @Setter
public abstract class BaseResponseDTO {
    private LocalDateTime timestamp;
    private String version;

    protected BaseResponseDTO() {
        this.timestamp = LocalDateTime.now();
        this.version = "1.0";
    }
}
