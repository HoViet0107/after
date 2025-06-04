package personal.social.dto.base;

import lombok.Data;
import lombok.experimental.SuperBuilder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public abstract class BaseAuditDTO {
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
