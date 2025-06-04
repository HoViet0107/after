package personal.social.services;
import personal.social.dto.message.ChatMessageDTO;

import java.util.List;

public interface ChatMessageService {
    ChatMessageDTO saveMessage(ChatMessageDTO chatMessageDto);

    List<ChatMessageDTO> getMessagesByConversationId(Long conversationId);

    void markMessagesAsRead(Long conversationId, Long userId);

    List<ChatMessageDTO> getUnreadMessages(Long userId);
}