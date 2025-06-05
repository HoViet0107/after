package personal.social.messaging.infrastructure.redis;

@Component
public class TypingIndicatorSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public TypingIndicatorSubscriber(SimpMessagingTemplate messagingTemplate,
                                     ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String channel = new String(message.getChannel());
            String messageBody = new String(message.getBody());

            TypingIndicator typingIndicator = objectMapper.readValue(messageBody, TypingIndicator.class);

            // Extract conversation ID from channel name
            String conversationId = channel.replace("chat.typing.", "");

            messagingTemplate.convertAndSend(
                    "/topic/conversation/" + conversationId + "/typing",
                    typingIndicator
            );

        } catch (Exception e) {
            System.err.println("Error processing typing indicator: " + e.getMessage());
        }
    }
}
