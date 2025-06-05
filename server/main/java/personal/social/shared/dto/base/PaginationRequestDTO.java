package personal.social.shared.dto.base;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class PaginationRequestDTO {
    @Min(value = 0, message = "Page number must be non-negative")
    private int page = 0;

    @Min(value = 1, message = "Page size must be positive")
    @Max(value = 100, message = "Page size must not exceed 100")
    private int size = 20;

    private String sortBy = "createdAt";
    private String sortDirection = "DESC";

    public org.springframework.data.domain.Pageable toPageable() {
        org.springframework.data.domain.Sort.Direction direction =
                "ASC".equalsIgnoreCase(sortDirection) ?
                        org.springframework.data.domain.Sort.Direction.ASC :
                        org.springframework.data.domain.Sort.Direction.DESC;

        return org.springframework.data.domain.PageRequest.of(
                page, size, direction, sortBy
        );
    }
}
