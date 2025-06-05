package personal.social.config.websocket;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.web.socket.config.annotation.*;

/**
 * Configuration for WebSocket messaging.
 *
 * <p>
 * This class is responsible for configuring the WebSocket endpoint and
 * message broker for the application.
 * </p>
 */
@Configuration
@EnableWebSocketMessageBroker
@Order(Ordered.HIGHEST_PRECEDENCE + 50)
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final WebSocketAuthInterceptor authInterceptor;
    private final CustomHandshakeHandler handshakeHandler;

    public WebSocketConfig(WebSocketAuthInterceptor authInterceptor,
                           CustomHandshakeHandler handshakeHandler) {
        this.authInterceptor = authInterceptor;
        this.handshakeHandler = handshakeHandler;
    }

    /**
     * Registers STOMP endpoints for WebSocket connections.
     *
     * <p>
     * This method configures a STOMP endpoint at the specified URL path ("/ws").
     * It allows cross-origin requests from any origin and uses a custom handshake
     * handler for the WebSocket connection. The endpoint is also configured to
     * support SockJS as a fallback option for browsers that do not support native
     * WebSocket connections.
     * </p>
     *
     * @param registry the registry to add STOMP endpoints to
     */
    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .setHandshakeHandler(handshakeHandler)
                .withSockJS();
    }

    /**
     * Configure the message broker registry.
     *
     * <p>
     * This method enables a STOMP broker relay that is backed by a Redis
     * message broker, which is necessary for clustering support. It also sets
     * the application and user destination prefixes for the message broker.
     * </p>
     *
     * @param registry the message broker registry to configure
     */
    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // Enable Redis-backed message broker for clustering
        registry.enableStompBrokerRelay("/topic", "/queue", "/user")
                .setRelayHost("localhost")
                .setRelayPort(61613)
                .setClientLogin("guest")
                .setClientPasscode("guest")
                .setSystemLogin("guest")
                .setSystemPasscode("guest")
                .setHeartbeatValue(new long[]{10000, 10000})
                .setVirtualHost("/");

        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    /**
     * Configure the WebSocket transport registry.
     *
     * <p>
     * This method sets performance optimization parameters for the WebSocket
     * transport to support high-concurrent chat. It sets the send time limit to
     * 15 seconds, the send buffer size limit to 512 KB, and the message size
     * limit to 128 KB.
     * </p>
     *
     * @param registration the WebSocket transport registry to configure
     */
    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // Performance optimization cho high-concurrent chat
        registration.setSendTimeLimit(15 * 1000)
                .setSendBufferSizeLimit(512 * 1024)
                .setMessageSizeLimit(128 * 1024);
    }

    /**
     * Configure the client inbound message channel.
     *
     * <p>
     * This method configures the channel that handles incoming messages from
     * clients. It adds the {@link WebSocketAuthInterceptor} to the channel to
     * intercept incoming messages and authenticate the user. It also sets the
     * {@link ThreadPoolTaskExecutor} instance to use for handling incoming
     * messages.
     * </p>
     *
     * @param registration the channel registration to configure
     */
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authInterceptor)
                .taskExecutor(webSocketTaskExecutor());
    }

    /**
     * Configure the client outbound message channel.
     *
     * <p>
     * This method configures the channel that handles outgoing messages to
     * clients. It sets the {@link ThreadPoolTaskExecutor} instance to use for
     * handling outgoing messages.
     * </p>
     *
     * @param registration the channel registration to configure
     */
    @Override
    public void configureClientOutboundChannel(ChannelRegistration registration) {
        registration.taskExecutor(webSocketTaskExecutor());
    }

    /**
     * Provides a {@link ThreadPoolTaskExecutor} instance for use in the
     * WebSocket configuration. This executor is used to handle incoming and
     * outgoing messages on the client inbound and outbound message channels.
     *
     * @return the executor instance
     */
    @Bean
    public ThreadPoolTaskExecutor webSocketTaskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(100);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("websocket-");
        executor.setKeepAliveSeconds(60);
        executor.initialize();
        return executor;
    }
}
