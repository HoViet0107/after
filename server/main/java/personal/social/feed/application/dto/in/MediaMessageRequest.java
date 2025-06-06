package personal.social.feed.application.dto.in;

import org.springframework.web.multipart.MultipartFile;

public record MediaMessageRequest(
        String conversationId,
        String senderId,
        String content,
        String type,
        String replyToId,
        MultipartFile file
) {}
