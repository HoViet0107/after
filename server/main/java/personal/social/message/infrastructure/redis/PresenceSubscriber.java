package personal.social.message.infrastructure.redis;

@Component
public class PresenceSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate;
    private final ObjectMapper objectMapper;

    public PresenceSubscriber(SimpMessagingTemplate messagingTemplate,
                              ObjectMapper objectMapper) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = objectMapper;
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String messageBody = new String(message.getBody());
            PresenceEvent presenceEvent = objectMapper.readValue(messageBody, PresenceEvent.class);

            messagingTemplate.convertAndSend("/topic/presence", presenceEvent);

        } catch (Exception e) {
            System.err.println("Error processing presence event: " + e.getMessage());
        }
    }
}