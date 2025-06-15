Overview
This document provides comprehensive information about the server implementation of our real-time chat social media platform. The server is built with modern technologies focusing on scalability, performance, and real-time communication capabilities.

Technologies Used
Programming Language: Java 17
Database: MySQL 8.0 (relational data storage)
Caching & Real-time Communication: Redis
Build Tool: Maven
Container Support: Docker
API Types: REST APIs and WebSockets
Frameworks and Dependencies
Core Frameworks
Spring Boot: Main application framework
Spring Data JPA: Database access and ORM
Spring WebSocket: Real-time messaging infrastructure
Spring Security: Authentication and authorization
Spring Data Redis: Redis integration
Spring Cache: Caching framework
Libraries and Tools
MapStruct (1.5.5.Final): Object mapping between layers
Lombok: Boilerplate code reduction
JJWT (0.11.5): JWT implementation
Micrometer Prometheus: Metrics collection
Logstash Logback Encoder (7.2): Structured logging
Spring Boot Actuator: Health checks and monitoring endpoints
TestContainers: Integration testing with containerized dependencies
System Architecture
The system follows Domain-Driven Design (DDD) and Clean Architecture principles with clear separation of concerns across different layers.

Layer Structure
1. Domain Layer
Contains business models, value objects, and repository interfaces.

2. Application Layer
Contains use cases, service implementations, DTOs, and business workflows.

3. Infrastructure Layer
Contains repository implementations, web controllers, and configuration.

Module Organization
User Module
personal.social.user.domain.model.Users: Core user entity
personal.social.user.domain.model.vo.UserId: Value object for user ID
Message Module
personal.social.message.domain.model.ChatMessage: Entity representing chat messages
personal.social.message.application.service.RealTimeChatService: Core service for chat functionality
personal.social.message.application.service.PresenceService: Manages user online/offline status
personal.social.message.application.service.TypingIndicatorService: Handles typing indicators
personal.social.message.infrastructure.web.ChatWebSocketController: WebSocket controller for real-time chat
Post Module
personal.social.post.infrastructure.web.PostController: REST controller for posts
Comment Module
personal.social.comment.infrastructure.web.CommentController: REST controller for comments
personal.social.comment.application.service.CommentApplicationService: Service for comment operations
personal.social.comment.application.usecase.CommentPostUseCase: Use case for commenting on posts
Auth Module
personal.social.auth.application.usecase.LoginUseCase: Login functionality
personal.social.auth.infrastructure.persistence.repository.RedisSessionRepository: Session management in Redis
personal.social.auth.infrastructure.security.JwtAuthenticationFilter: JWT authentication filter
personal.social.auth.infrastructure.event.SessionEventPublisher: Publishes session events
Configuration
personal.social.config.cache.SocialMediaCacheConfig: Cache configuration
personal.social.shared.infrastructure.config.AsyncConfig: Async operation configuration
personal.social.api.SocialMediaProperties: Application properties configuration
Key Techniques Implemented
1. Real-Time Communication
WebSocket Implementation
Connection Management: User connection and disconnection events handled in ChatWebSocketController
Message Routing: STOMP topics for individual users and conversations
Rate Limiting: @RateLimit annotation on WebSocket endpoints to prevent abuse
Cross-Server Communication: Redis pub/sub for communication across multiple server instances
Presence System
Online Status Tracking: PresenceService manages user online/offline status in Redis
Real-time Status Updates: Status changes broadcasted to interested clients
TTL-based Presence: Automatic expiration of presence information
2. Message Handling
Message Types: Support for text, system, and media messages
Message States: Tracking sent, delivered, and read states
Caching: Recent messages cached in Redis lists with appropriate TTLs
Thread Support: Reply functionality with references to parent messages
3. Security Implementation
JWT Authentication: Secure token-based authentication
Session Management: Multi-device session tracking with platform awareness
Redis-based Sessions: Fast validation and lookup of active sessions
Session Invalidation: Cross-server session invalidation via Redis pub/sub
4. Performance Optimization
Strategic Caching: Different TTLs for different types of data:
User profiles: 2 hours
Conversations: 2 hours
User feeds: 15 minutes with background refresh
Posts: 6 hours
Pagination: Efficient data loading in small chunks
Database Optimization: Custom queries and stored procedures for complex operations
5. Monitoring and Maintenance
Metrics Collection: Via Micrometer and Prometheus
Structured Logging: Using Logback with JSON formatting
Health Checks: Spring Boot Actuator endpoints
Background Jobs: Scheduled tasks for cleanup and maintenance
Session Cleanup: SessionCleanupService for expired session management
Achievements
Scalable Architecture

Horizontally scalable design through stateless REST endpoints and Redis-synchronized WebSockets
Event-driven communication between services
Clear separation of concerns through DDD and Clean Architecture
Robust Real-Time Messaging

Low-latency message delivery
Support for typing indicators, read receipts, and presence information
Cross-server message distribution
Comprehensive Security

Token-based authentication with proper expiration
Multi-device login support with platform-specific session management
Rate limiting to prevent API abuse
Secure session storage in Redis
Optimized Data Access

Tiered caching strategy with appropriate TTLs
Efficient Redis data structures for different use cases
Background data refreshing for heavily accessed resources
Developer Experience

Clean code organization following DDD principles
Comprehensive error handling
Well-defined interfaces between layers
Testable architecture with dependency injection
Future Enhancements
End-to-end encryption for messages
Media message optimization and compression
Advanced message search functionality
Enhanced group conversation features
Message reactions and rich content
Deployment
The application supports deployment via Docker with separate configurations for development and production environments. Environment variables control critical settings through the .env file.
