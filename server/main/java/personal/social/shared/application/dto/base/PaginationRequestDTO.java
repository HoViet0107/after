package personal.social.shared.application.dto.base;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

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

    public Pageable toPageable() {
        Sort.Direction direction =
                "ASC".equalsIgnoreCase(sortDirection) ?
                        Sort.Direction.ASC :
                        Sort.Direction.DESC;

        return org.springframework.data.domain.PageRequest.of(
                page, size, direction, sortBy
        );
    }
}
