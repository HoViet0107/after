package personal.social.services.impl;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.extern.slf4j.Slf4j;
import personal.social.dto.message.ChatMessageDTO;

@Service
@Slf4j
public class RedisMessageSubscriber implements MessageListener {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            // Convert Redis message to ChatMessageDto
            String json = redisTemplate.getStringSerializer().deserialize(message.getBody());
            ChatMessageDTO chatMessageDto = objectMapper.readValue(json, ChatMessageDTO.class);

            // Forward to WebSocket clients
            messagingTemplate.convertAndSend(
                    "/topic/chat/" + chatMessageDto.getConversationId(),
                    chatMessageDto
            );

            log.info("Forwarded Redis message to WebSocket: {}", chatMessageDto);
        } catch (Exception e) {
            log.error("Error processing Redis message", e);
        }
    }
}
