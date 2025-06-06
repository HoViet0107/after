package personal.social.api.controller;

import personal.social.message.application.dto.in.SendMessageRequest;
import personal.social.message.application.dto.out.SendMessageResponse;
import personal.social.message.application.service.RealTimeChatService;
import personal.social.shared.security.RateLimit;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/v1/messages")
@CrossOrigin(origins = "*")
public class MessagingController {

    private final RealTimeChatService chatService;

    public MessagingController(RealTimeChatService chatService) {
        this.chatService = chatService;
    }

    @PostMapping
    @RateLimit(limit = 50, windowSeconds = 60)
    public ResponseEntity<SendMessageResponse> sendMessage(
            @Valid @RequestBody SendMessageRequest request,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);

        // Override sender ID with authenticated user
        SendMessageRequest authenticatedRequest = new SendMessageRequest(
                request.conversationId(),
                currentUserId,
                request.content(),
                request.type(),
                request.replyToId()
        );

        SendMessageResponse response = chatService.sendMessage(authenticatedRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/media")
    @RateLimit(limit = 20, windowSeconds = 60)
    public ResponseEntity<SendMessageResponse> sendMediaMessage(
            @RequestParam("conversationId") String conversationId,
            @RequestParam("content") String content,
            @RequestParam("type") String type,
            @RequestParam(value = "replyToId", required = false) String replyToId,
            @RequestPart("file") MultipartFile file,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);

        // Handle file upload and create message
        MediaMessageRequest request = new MediaMessageRequest(
                conversationId, currentUserId, content, type, replyToId, file
        );

        SendMessageResponse response = chatService.sendMediaMessage(request);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{messageId}/read")
    @RateLimit(limit = 100, windowSeconds = 60)
    public ResponseEntity<Void> markAsRead(
            @PathVariable String messageId,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);
        chatService.markMessageAsRead(messageId, currentUserId);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/conversation/{conversationId}")
    @RateLimit(limit = 30, windowSeconds = 60)
    public ResponseEntity<ConversationHistoryResponse> getConversationHistory(
            @PathVariable String conversationId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String cursor,
            HttpServletRequest httpRequest) {

        String currentUserId = getCurrentUserId(httpRequest);

        ConversationHistoryRequest request = new ConversationHistoryRequest(
                conversationId, currentUserId, page, size, cursor
        );

        ConversationHistoryResponse response = chatService.getConversationHistory(request);
        return ResponseEntity.ok(response);
    }

    private String getCurrentUserId(HttpServletRequest request) {
        // Extract user ID from JWT token
        return "user123"; // Placeholder
    }
}
