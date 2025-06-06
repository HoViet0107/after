package personal.social.feed.application.usecase;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.social.comment.application.dto.CommentDto;
import personal.social.comment.application.dto.CreateCommentRequest;
import personal.social.comment.application.service.CommentApplicationService;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.feed.domain.exception.PostNotFoundException;
import personal.social.feed.domain.model.Post;
import personal.social.feed.domain.model.vo.PostId;
import personal.social.feed.domain.repository.PostRepository;
import personal.social.user.domain.model.vo.UserId;

@Service
@Transactional
@RequiredArgsConstructor
public class CommentPostUseCase {

    private final PostRepository postRepository;
    private final CommentApplicationService commentService;

    public CommentDto execute(String postId, String authorId, String content, String parentCommentId) {
        // Verify post exists
        Post post = postRepository.findById(PostId.of(postId))
                .orElseThrow(() -> new PostNotFoundException("Post not found: " + postId));

        // Create comment request
        CreateCommentRequest request = new CreateCommentRequest(
                postId,
                authorId,
                content,
                parentCommentId,
                null // rootCommentId will be set by service if needed
        );

        // Create comment using comment service
        return commentService.createComment(request);
    }

    public CommentDto replyToComment(String postId, String authorId, String content,
                                     String parentCommentId, String rootCommentId) {
        // Verify post exists
        Post post = postRepository.findById(PostId.of(postId))
                .orElseThrow(() -> new PostNotFoundException("Post not found: " + postId));

        // Create reply request
        CreateCommentRequest request = new CreateCommentRequest(
                postId,
                authorId,
                content,
                parentCommentId,
                rootCommentId
        );

        return commentService.createComment(request);
    }

    public void deleteComment(String commentId, String userId) {
        commentService.deleteComment(CommentId.of(commentId), UserId.of(userId));
    }

    public void likeComment(String commentId, String userId) {
        commentService.likeComment(CommentId.of(commentId), UserId.of(userId));
    }

    public void unlikeComment(String commentId, String userId) {
        commentService.unlikeComment(CommentId.of(commentId), UserId.of(userId));
    }
}
