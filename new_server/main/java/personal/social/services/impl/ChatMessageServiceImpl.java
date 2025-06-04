package personal.social.services.impl;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import personal.social.dto.message.ChatMessageDTO;
import personal.social.enums.MessageStatus;
import personal.social.enums.MessageType;
import personal.social.helper.CommonHelpers;
import personal.social.helper.Utilities;
import personal.social.model.Messages;
import personal.social.repository.ConversationRepository;
import personal.social.repository.MessageRepository;
import personal.social.repository.UserRepository;
import personal.social.services.ChatMessageService;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ChatMessageServiceImpl implements ChatMessageService {
    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final CommonHelpers helpers;
    private final RedisTemplate<String, Object> redisTemplate;

    public ChatMessageServiceImpl(MessageRepository messageRepository, ConversationRepository conversationRepository, UserRepository userRepository, SimpMessagingTemplate messagingTemplate, CommonHelpers helpers, RedisTemplate<String, Object> redisTemplate) {
        this.messageRepository = messageRepository;
        this.conversationRepository = conversationRepository;
        this.userRepository = userRepository;
        this.messagingTemplate = messagingTemplate;
        this.helpers = helpers;
        this.redisTemplate = redisTemplate;
    }

    @Override
    public ChatMessageDTO saveMessage(ChatMessageDTO chatMessageDto) {
        // Set timestamp if not provided
        if (chatMessageDto.getSentAt() == null) {
            chatMessageDto.setSentAt(LocalDateTime.now());
        }

        // Set initial status
        chatMessageDto.setStatus(MessageStatus.SENT.name());

        // Save to database
        Messages chatMessage = convertToEntity(chatMessageDto);
        Messages savedMessage = messageRepository.save(chatMessage);

        // Convert back to DTO
        ChatMessageDTO savedDto = convertToDto(savedMessage);

        // Publish to WebSocket
        messagingTemplate.convertAndSend(
                "/topic/chat/" + chatMessageDto.getConversationId(),
                savedDto
        );

        // Publish to Redis for other services
        redisTemplate.convertAndSend("chat", savedDto);

        return savedDto;
    }

    @Override
    public List<ChatMessageDTO> getMessagesByConversationId(Long conversationId) {
        List<Messages> messages = messageRepository.findByConversationIdOrderBySentAtAsc(conversationId);
        return messages.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public void markMessagesAsRead(Long conversationId, Long userId) {
        List<Messages> messages = messageRepository.findUnreadMessagesInConversation(
                conversationId, userId, MessageStatus.SENT.name());

        messages.forEach(message -> {
            message.setMessageStatus(MessageStatus.READ.name());
        });

        helpers.saveAllEntities(messages, messageRepository, "markMessagesAsRead");

        // Notify sender that messages were read
        messagingTemplate.convertAndSend(
                "/topic/chat/" + conversationId + "/status",
                "Messages read by user " + userId
        );
    }

    @Override
    public List<ChatMessageDTO> getUnreadMessages(Long userId) {
//        List<Messages> messages = messageRepository.findBySenderIdNotAndStatus(userId, MessageStatus.SENT.name());
//        return messages.stream()
//                .map(this::convertToDto)
//                .collect(Collectors.toList());
        return null;
    }

    private ChatMessageDTO convertToDto(Messages entity) {
        return ChatMessageDTO.builder()
                .id(entity.getId())
                .content(entity.getMessageContent())
                .senderId(entity.getSender().getId())
                .senderName(Utilities.buildFullName(entity.getSender()))
                .senderAvatar(entity.getSender().getAvatarUrl())
                .conversationId(entity.getConversation().getId())
                .type(entity.getMessageType())
                .sentAt(entity.getSentAt())
                .status(entity.getMessageStatus())
                .build();
    }

    private Messages convertToEntity(ChatMessageDTO dto) {
        return Messages.builder()
                .id(dto.getId())
                .messageContent(dto.getContent())
                .sender(userRepository.findById(dto.getSenderId()).orElse(null))
                .messageType(dto.getType() != null ? dto.getType() : MessageType.TEXT.name())
                .sentAt(dto.getSentAt())
                .messageStatus(dto.getStatus())
                .conversation(conversationRepository.findByConvId(dto.getConversationId()))
                .build();
    }
}