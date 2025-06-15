package personal.social.api.controller;

import personal.social.api.dto.FeedResponse;
import personal.social.post.application.dto.in.CreatePostRequest;
import personal.social.post.application.dto.PostWebDTO;
import personal.social.post.application.dto.out.CreatePostResponse;
import personal.social.post.application.service.FeedService;
import personal.social.post.application.dto.*;
import personal.social.shared.application.dto.base.PaginationRequestDTO;
import personal.social.shared.infrastructure.security.RateLimit;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import java.util.Set;

@RestController
@RequestMapping("/api/v1/feed")
@CrossOrigin(origins = "*")
public class FeedController {

    private final FeedService feedService;

    public FeedController(FeedService feedService) {
        this.feedService = feedService;
    }

    @GetMapping
    @RateLimit(limit = 30, windowSeconds = 60)
    public ResponseEntity<?> getFeeds(
            @RequestHeader("User-Agent") String userAgent,
            @RequestHeader(value = "Accept", defaultValue = "application/json") String accept,
            @RequestHeader(value = "X-Client-Type", required = false) String clientType,
            @Valid PaginationRequestDTO pagination,
            @RequestParam(defaultValue = "home") String feedType,
            HttpServletRequest request) {

        String currentUserId = getCurrentUserId(request);

        // Determine client type
        ClientType client = determineClientType(userAgent, accept, clientType);

        switch (client) {
            case MOBILE -> {
                Page<PostMobileDTO> mobileFeed = feedService.getMobileFeed(
                        currentUserId, pagination.toPageable()
                );
                return ResponseEntity.ok(new FeedResponse<>(
                        mobileFeed.getContent(),
                        mobileFeed.getTotalElements(),
                        mobileFeed.hasNext(),
                        "mobile"
                ));
            }
            case WEB -> {
                Page<PostWebDTO> webFeed = feedService.getWebFeed(
                        currentUserId, pagination.toPageable()
                );
                return ResponseEntity.ok(new FeedResponse<>(
                        webFeed.getContent(),
                        webFeed.getTotalElements(),
                        webFeed.hasNext(),
                        "web"
                ));
            }
            default -> {
                return ResponseEntity.badRequest()
                        .body("Unsupported client type");
            }
        }
    }

    @GetMapping("/trending")
    @RateLimit(limit = 20, windowSeconds = 60)
    public ResponseEntity<Page<PostWebDTO>> getTrendingPosts(
            @Valid PaginationRequestDTO pagination) {

        Page<PostWebDTO> trendingPosts = feedService.getTrendingPosts(pagination.toPageable());
        return ResponseEntity.ok(trendingPosts);
    }

    @GetMapping("/discover")
    @RateLimit(limit = 15, windowSeconds = 60)
    public ResponseEntity<Page<PostMobileDTO>> discoverPosts(
            @RequestParam Set<String> hashtags,
            @Valid PaginationRequestDTO pagination) {

        Page<PostMobileDTO> discoveredPosts = feedService.discoverByHashtags(
                hashtags, pagination.toPageable()
        );
        return ResponseEntity.ok(discoveredPosts);
    }

    @PostMapping
    @RateLimit(limit = 10, windowSeconds = 300) // 10 posts per 5 minutes
    public ResponseEntity<?> createPost(
            @Valid @RequestBody CreatePostRequest request,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);
        CreatePostResponse response = feedService.createPost(request, currentUserId);
        return ResponseEntity.ok(response);
    }

    private ClientType determineClientType(String userAgent, String accept, String clientType) {
        if (clientType != null) {
            return ClientType.valueOf(clientType.toUpperCase());
        }

        if (userAgent != null) {
            String ua = userAgent.toLowerCase();
            if (ua.contains("mobile") || ua.contains("android") || ua.contains("iphone")) {
                return ClientType.MOBILE;
            }
        }

        if (accept != null && accept.contains("mobile")) {
            return ClientType.MOBILE;
        }

        return ClientType.WEB;
    }

    private String getCurrentUserId(HttpServletRequest request) {
        // Extract user ID from JWT token
        // This is a placeholder - implement actual JWT extraction
        return "";
    }

    private enum ClientType {
        MOBILE, WEB
    }
}
