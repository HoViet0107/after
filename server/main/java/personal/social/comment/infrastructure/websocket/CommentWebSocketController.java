package personal.social.comment.infrastructure.websocket;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import personal.social.comment.application.dto.CommentDto;
import personal.social.comment.application.dto.CommentLikeRequest;
import personal.social.comment.application.dto.CreateCommentRequest;
import personal.social.comment.application.service.CommentApplicationService;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.user.domain.model.vo.UserId;

@Controller
@RequiredArgsConstructor
public class CommentWebSocketController {

    private final CommentApplicationService commentService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/comment.create")
    public void createComment(@Payload CreateCommentRequest request) {
        CommentDto comment = commentService.createComment(request);

        // Broadcast to all subscribers of this post
        messagingTemplate.convertAndSend(
                "/topic/post/" + request.postId() + "/comments",
                comment
        );
    }

    @MessageMapping("/comment.like")
    public void likeComment(@Payload CommentLikeRequest request) {
        commentService.likeComment(
                CommentId.of(request.commentId()),
                UserId.of(request.userId())
        );

        // Broadcast like update
        messagingTemplate.convertAndSend(
                "/topic/comment/" + request.commentId() + "/like",
                request
        );
    }
}
