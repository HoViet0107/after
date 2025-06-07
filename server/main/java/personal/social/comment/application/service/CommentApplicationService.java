package personal.social.comment.application.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import personal.social.comment.application.dto.CommentDto;
import personal.social.comment.application.dto.CreateCommentRequest;
import personal.social.comment.application.dto.EditCommentRequest;
import personal.social.comment.domain.model.PostComment;
import personal.social.comment.domain.model.vo.CommentContent;
import personal.social.comment.domain.model.vo.CommentId;
import personal.social.comment.domain.repository.CommentRepository;
import personal.social.comment.infrastructure.messaging.CommentEventPublisher;
import personal.social.post.domain.model.vo.PostId;
import personal.social.user.domain.model.vo.UserId;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CommentApplicationService {

    private final CommentRepository commentRepository;
    private final CommentEventPublisher eventPublisher;

    public CommentDto createComment(CreateCommentRequest request) {
        PostComment comment = PostComment.builder()
                .postId(PostId.of(request.postId()))
                .authorId(UserId.of(request.authorId()))
                .content(CommentContent.of(request.content()))
                .parentCommentId(request.parentCommentId() != null ?
                        CommentId.of(request.parentCommentId()) : null)
                .rootCommentId(request.rootCommentId() != null ?
                        CommentId.of(request.rootCommentId()) : null)
                .build();

        PostComment savedComment = commentRepository.save(comment);

        // Publish events
        eventPublisher.publishEvents(savedComment.getDomainEvents());
        savedComment.clearDomainEvents();

        return CommentDto.from(savedComment);
    }

    public CommentDto editComment(CommentId commentId, EditCommentRequest request) {
        PostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        comment.editContent(CommentContent.of(request.content()));

        PostComment savedComment = commentRepository.save(comment);

        // Publish events
        eventPublisher.publishEvents(savedComment.getDomainEvents());
        savedComment.clearDomainEvents();

        return CommentDto.from(savedComment);
    }

    public void likeComment(CommentId commentId, UserId userId) {
        PostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        comment.like(userId);

        PostComment savedComment = commentRepository.save(comment);

        // Publish events
        eventPublisher.publishEvents(savedComment.getDomainEvents());
        savedComment.clearDomainEvents();
    }

    public void unlikeComment(CommentId commentId, UserId userId) {
        PostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        comment.unlike(userId);
        commentRepository.save(comment);
    }

    @Transactional(readOnly = true)
    public List<CommentDto> getCommentsByPostId(PostId postId) {
        return commentRepository.findByPostId(postId)
                .stream()
                .map(CommentDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CommentDto getCommentById(CommentId commentId) {
        return commentRepository.findById(commentId)
                .map(CommentDto::from)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
    }

    public void deleteComment(CommentId commentId, UserId userId) {
        PostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!comment.getAuthorId().equals(userId)) {
            throw new IllegalArgumentException("User not authorized to delete this comment");
        }

        comment.deleteByOwner();
        commentRepository.save(comment);
    }

    public List<CommentDto> getRepliesByCommentId(CommentId of) {
        return null; // Implementation for fetching replies by comment ID
    }

    public void tagUser(CommentId commentId, UserId userId) {
        PostComment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));
    }
}
