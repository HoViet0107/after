package personal.social.shared.application.dto.cache;

import java.util.List;

// FeedResponse.java (base class for cache service)
public record FeedResponse(
        List<Object> content,
        long totalElements,
        boolean hasNext,
        String feedType
) {}
