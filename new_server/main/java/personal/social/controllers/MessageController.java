package personal.social.controllers;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import personal.social.dto.message.*;
import personal.social.dto.CursorResponse;
import personal.social.dto.response.CustomApiResponse;
import personal.social.enums.MessageStatus;
import personal.social.enums.MessageType;
import personal.social.helper.CommonHelpers;
import personal.social.model.Users;
import personal.social.services.FileStorageService;
import personal.social.services.MessageService;

import java.nio.file.AccessDeniedException;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/messages")
@RequiredArgsConstructor
@Validated
@Slf4j
@SecurityRequirement(name = "bearerAuth")
public class MessageController {
    private final CommonHelpers helpers;
    private final MessageService messageService;

    @Operation(summary = "Get messages for a conversation",
            description = "Retrieve paginated messages for a specific conversation with cursor-based pagination")
    @ApiResponse(responseCode = "200", description = "Messages retrieved successfully")
    @ApiResponse(responseCode = "403", description = "Access denied to conversation")
    @ApiResponse(responseCode = "404", description = "Conversation not found")
    @GetMapping("/{conversationId}")
    public ResponseEntity<CustomApiResponse<CursorResponse<ChatMessageDTO>>> getMessagesForConversation(
            @Parameter(description = "Conversation ID", required = true)
            @PathVariable Long conversationId,

            @Parameter(description = "Cursor for pagination (ISO DateTime)")
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime cursor,

            @Parameter(description = "Number of messages to retrieve")
            @RequestParam(defaultValue = "20")
            @Min(1) @Max(100) int size,

            HttpServletRequest request) {

        try {
            Users user = helpers.extractToken(request);
            CursorResponse<ChatMessageDTO> response = messageService.getMessagesForConversation(
                    conversationId, user.getId(), cursor, size);

            return ResponseEntity.ok(CustomApiResponse.success(response, "Messages retrieved successfully"));

        } catch (AccessDeniedException e) {
            log.warn("Access denied for user retrieving messages from conversation {}", conversationId);
            return ResponseEntity.status(403)
                    .body(CustomApiResponse.error("Access denied to conversation"));
        } catch (Exception e) {
            log.error("Error retrieving messages for conversation {}: {}", conversationId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(CustomApiResponse.error("Internal server error"));
        }
    }

    // gửi tin nhắn văn bản(có thể có file đính kèm)
    @Operation(summary = "Send a new message",
            description = "Send a text message with optional media attachment to a conversation")
    @ApiResponse(responseCode = "200", description = "Message sent successfully")
    @ApiResponse(responseCode = "400", description = "Invalid request data")
    @ApiResponse(responseCode = "403", description = "Access denied to conversation")
    @PostMapping(value = "/{conversationId}", consumes = "multipart/form-data")
    public ResponseEntity<CustomApiResponse<ChatMessageDTO>> sendMessage(
            @Parameter(description = "Conversation ID", required = true)
            @PathVariable Long conversationId,

            @Parameter(description = "Message request data", required = true)
            @Valid @ModelAttribute SendMessageRequest messageRequest,

            @Parameter(description = "Optional media file")
            @RequestPart(value = "file", required = false) MultipartFile file,

            HttpServletRequest request) {

        try {
            Users sender = helpers.extractToken(request);

            // Build ChatMessageDTO from request
            ChatMessageDTO messageDTO = ChatMessageDTO.builder()
                    .conversationId(conversationId)
                    .content(messageRequest.getContent())
                    .senderId(sender.getId())
                    .type(messageRequest.getType())
                    .status(messageRequest.getStatus())
                    .replyToMessageId(messageRequest.getReplyToMessageId())
                    .isRead(false)
                    .isDeleted(false)
                    .isOwnMessage(false).totalReactions(0).build();

            ChatMessageDTO sentMessage = messageService.sendMessage(messageDTO, sender, file);

            return ResponseEntity.ok(CustomApiResponse.success(sentMessage, "Message sent successfully"));

        } catch (AccessDeniedException e) {
            log.warn("Access denied for user sending message to conversation {}", conversationId);
            return ResponseEntity.status(403)
                    .body(CustomApiResponse.error("Access denied to conversation"));
        } catch (Exception e) {
            log.error("Error sending message to conversation {}: {}", conversationId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(CustomApiResponse.error("Failed to send message"));
        }
    }

    @Operation(summary = "Edit a message", description = "Edit the content of an existing message")
    @ApiResponse(responseCode = "200", description = "Message edited successfully")
    @ApiResponse(responseCode = "403", description = "Access denied to edit message")
    @ApiResponse(responseCode = "404", description = "Message not found")
    @PutMapping("/{messageId}")
    public ResponseEntity<CustomApiResponse<ChatMessageDTO>> editMessage(
            @Parameter(description = "Message ID", required = true)
            @PathVariable Long messageId,

            @Parameter(description = "Edit request data", required = true)
            @Valid @RequestBody EditMessageRequest editRequest,

            HttpServletRequest request) {

        try {
            Users user = helpers.extractToken(request);
            ChatMessageDTO editedMessage = messageService.editMessage(
                    messageId, editRequest.getContent(), user.getId());

            return ResponseEntity.ok(CustomApiResponse.success(editedMessage, "Message edited successfully"));

        } catch (AccessDeniedException e) {
            log.warn("Access denied for user editing message {}", messageId);
            return ResponseEntity.status(403)
                    .body(CustomApiResponse.error("Access denied to edit message"));
        } catch (Exception e) {
            log.error("Error editing message {}: {}", messageId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(CustomApiResponse.error("Failed to edit message"));
        }
    }

    @Operation(summary = "Delete a message", description = "Mark a message as deleted")
    @ApiResponse(responseCode = "204", description = "Message deleted successfully")
    @ApiResponse(responseCode = "403", description = "Access denied to delete message")
    @ApiResponse(responseCode = "404", description = "Message not found")
    @DeleteMapping("/{messageId}")
    public ResponseEntity<CustomApiResponse<Void>> deleteMessage(
            @Parameter(description = "Message ID", required = true)
            @PathVariable Long messageId,

            HttpServletRequest request) {

        try {
            Users user = helpers.extractToken(request);
            messageService.deleteMessage(messageId, user.getId());

            return ResponseEntity.ok(CustomApiResponse.success(null, "Message deleted successfully"));

        } catch (AccessDeniedException e) {
            log.warn("Access denied for user deleting message {}", messageId);
            return ResponseEntity.status(403)
                    .body(CustomApiResponse.error("Access denied to delete message"));
        } catch (Exception e) {
            log.error("Error deleting message {}: {}", messageId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(CustomApiResponse.error("Failed to delete message"));
        }
    }

    @Operation(summary = "Add reaction to message", description = "Add or update a reaction to a message")
    @ApiResponse(responseCode = "200", description = "Reaction added successfully")
    @ApiResponse(responseCode = "404", description = "Message not found")
    @PostMapping("/{messageId}/reactions")
    public ResponseEntity<CustomApiResponse<ReactionDTO>> addReaction(
            @Parameter(description = "Message ID", required = true)
            @PathVariable Long messageId,

            @Parameter(description = "Reaction request data", required = true)
            @Valid @RequestBody MessageReactionRequest reactionRequest,

            HttpServletRequest request) {

        try {
            Users user = helpers.extractToken(request);
            ReactionDTO reaction = messageService.addReaction(
                    messageId, reactionRequest.getReactionType(), user.getId());

            return ResponseEntity.ok(CustomApiResponse.success(reaction, "Reaction added successfully"));

        } catch (Exception e) {
            log.error("Error adding reaction to message {}: {}", messageId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(CustomApiResponse.error("Failed to add reaction"));
        }
    }

    @Operation(summary = "Remove reaction from message", description = "Remove user's reaction from a message")
    @ApiResponse(responseCode = "204", description = "Reaction removed successfully")
    @ApiResponse(responseCode = "404", description = "Message not found")
    @DeleteMapping("/{messageId}/reactions")
    public ResponseEntity<CustomApiResponse<Void>> removeReaction(
            @Parameter(description = "Message ID", required = true)
            @PathVariable Long messageId,

            HttpServletRequest request) {

        try {
            Users user = helpers.extractToken(request);
            messageService.removeReaction(messageId, user.getId());

            return ResponseEntity.ok(CustomApiResponse.success(null, "Reaction removed successfully"));

        } catch (Exception e) {
            log.error("Error removing reaction from message {}: {}", messageId, e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(CustomApiResponse.error("Failed to remove reaction"));
        }
    }
}
