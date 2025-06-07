package personal.social.post.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import personal.social.comment.application.dto.CommentDto;
import personal.social.post.application.dto.out.CreatePostResponse;
import personal.social.post.application.dto.out.PostResponse;
import personal.social.post.application.dto.in.CreatePostRequest;
import personal.social.post.application.usecase.CommentPostUseCase;
import personal.social.post.application.usecase.CreatePostUseCase;
import personal.social.post.application.usecase.LikePostUseCase;
import personal.social.shared.infrastructure.security.RateLimit;

import jakarta.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/api/v1/posts")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class PostController {

    private final CreatePostUseCase createPostUseCase;
    private final LikePostUseCase likePostUseCase;
    private final CommentPostUseCase commentPostUseCase;

    @PostMapping
    @RateLimit(limit = 10, windowSeconds = 300) // 10 posts per 5 minutes
    public ResponseEntity<CreatePostResponse> createPost(
            @Valid @RequestBody CreatePostRequest request,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);

        // Override author ID with authenticated user
        CreatePostRequest authenticatedRequest = new CreatePostRequest(
                currentUserId,
                request.content(),
                request.visibility(),
                request.hashtags(),
                request.taggedUserIds()
        );

        PostResponse response = createPostUseCase.execute(authenticatedRequest);

        CreatePostResponse createResponse = new CreatePostResponse(
                response.id(),
                response.authorId(),
                response.content(),
                response.visibility(),
                response.createdAt(),
                0, // hashtag count
                0  // tagged users count
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(createResponse);
    }

    @PostMapping("/{postId}/like")
    @RateLimit(limit = 60, windowSeconds = 60)
    public ResponseEntity<Void> likePost(
            @PathVariable String postId,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);
        likePostUseCase.execute(postId, currentUserId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{postId}/like")
    @RateLimit(limit = 60, windowSeconds = 60)
    public ResponseEntity<Void> unlikePost(
            @PathVariable String postId,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);
        likePostUseCase.unlike(postId, currentUserId);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{postId}/comments")
    @RateLimit(limit = 30, windowSeconds = 60)
    public ResponseEntity<CommentDto> commentOnPost(
            @PathVariable String postId,
            @RequestBody CommentRequest request,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);

        CommentDto comment = commentPostUseCase.execute(
                postId,
                currentUserId,
                request.content(),
                request.parentCommentId()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @PostMapping("/{postId}/comments/{commentId}/reply")
    @RateLimit(limit = 30, windowSeconds = 60)
    public ResponseEntity<CommentDto> replyToComment(
            @PathVariable String postId,
            @PathVariable String commentId,
            @RequestBody CommentRequest request,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);

        CommentDto reply = commentPostUseCase.replyToComment(
                postId,
                currentUserId,
                request.content(),
                commentId,
                request.rootCommentId()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(reply);
    }

    @PostMapping("/comments/{commentId}/like")
    @RateLimit(limit = 60, windowSeconds = 60)
    public ResponseEntity<Void> likeComment(
            @PathVariable String commentId,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);
        commentPostUseCase.likeComment(commentId, currentUserId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comments/{commentId}/like")
    @RateLimit(limit = 60, windowSeconds = 60)
    public ResponseEntity<Void> unlikeComment(
            @PathVariable String commentId,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);
        commentPostUseCase.unlikeComment(commentId, currentUserId);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/comments/{commentId}")
    @RateLimit(limit = 30, windowSeconds = 60)
    public ResponseEntity<Void> deleteComment(
            @PathVariable String commentId,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);
        commentPostUseCase.deleteComment(commentId, currentUserId);
        return ResponseEntity.ok().build();
    }

    private String getCurrentUserId(HttpServletRequest request) {
        // Extract user ID from JWT token
        // This is a placeholder - implement actual JWT extraction
        return "user123";
    }

    // Request DTOs
    public record CommentRequest(
            String content,
            String parentCommentId,
            String rootCommentId
    ) {}
}
