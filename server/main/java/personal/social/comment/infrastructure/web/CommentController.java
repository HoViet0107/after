package personal.social.comment.infrastructure.web;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import personal.social.comment.application.dto.*;
import personal.social.comment.application.service.CommentApplicationService;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.feed.domain.model.vo.PostId;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;

@RestController
@RequestMapping("/api/v1/comments")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CommentController {

    private final CommentApplicationService commentService;

    @PostMapping
    public ResponseEntity<CommentDto> createComment(@Valid @RequestBody CreateCommentRequest request) {
        CommentDto comment = commentService.createComment(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(comment);
    }

    @GetMapping("/post/{postId}")
    public ResponseEntity<List<CommentDto>> getCommentsByPost(
            @PathVariable String postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir) {

        List<CommentDto> comments = commentService.getCommentsByPostId(PostId.of(postId));
        return ResponseEntity.ok(comments);
    }

    @GetMapping("/{commentId}")
    public ResponseEntity<CommentDto> getComment(@PathVariable String commentId) {
        CommentDto comment = commentService.getCommentById(CommentId.of(commentId));
        return ResponseEntity.ok(comment);
    }

    @GetMapping("/{commentId}/replies")
    public ResponseEntity<List<CommentDto>> getCommentReplies(@PathVariable String commentId) {
        List<CommentDto> replies = commentService.getRepliesByCommentId(CommentId.of(commentId));
        return ResponseEntity.ok(replies);
    }

    @PutMapping("/{commentId}")
    public ResponseEntity<CommentDto> editComment(
            @PathVariable String commentId,
            @Valid @RequestBody EditCommentRequest request) {

        CommentDto comment = commentService.editComment(CommentId.of(commentId), request);
        return ResponseEntity.ok(comment);
    }

    @PostMapping("/{commentId}/like")
    public ResponseEntity<Void> likeComment(
            @PathVariable String commentId,
            @RequestParam String userId) {

        commentService.likeComment(CommentId.of(commentId), UserId.of(userId));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{commentId}/like")
    public ResponseEntity<Void> unlikeComment(
            @PathVariable String commentId,
            @RequestParam String userId) {

        commentService.unlikeComment(CommentId.of(commentId), UserId.of(userId));
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String commentId,
            @RequestParam String userId) {

        commentService.deleteComment(CommentId.of(commentId), UserId.of(userId));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{commentId}/tag")
    public ResponseEntity<Void> tagUser(
            @PathVariable String commentId,
            @RequestParam String userId) {

        commentService.tagUser(CommentId.of(commentId), UserId.of(userId));
        return ResponseEntity.ok().build();
    }
}
