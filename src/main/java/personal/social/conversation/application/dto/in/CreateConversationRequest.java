package personal.social.conversation.application.dto.in;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

public record CreateConversationRequest(
        @NotBlank(message = "Creator ID is required")
        String createdBy,

        String title,
        String avatarUrl,

        @NotNull(message = "Group chat flag is required")
        boolean isGroupChat,

        @NotEmpty(message = "At least one participant is required")
        List<String> participantIds
) {}
