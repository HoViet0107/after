# Complete Social Media Project Structure

## Project Directory Structure

```
social-media-app/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/
│   │   │       └── social/
│   │   │           ├── SocialMediaApplication.java
│   │   │           ├── user/
│   │   │           │   ├── domain/
│   │   │           │   │   ├── model/
│   │   │           │   │   │   ├── User.java
│   │   │           │   │   │   ├── UserId.java
│   │   │           │   │   │   ├── Email.java
│   │   │           │   │   │   └── UserProfile.java
│   │   │           │   │   ├── port/
│   │   │           │   │   │   ├── UserRepository.java
│   │   │           │   │   │   ├── UserEventPublisher.java
│   │   │           │   │   │   └── PasswordEncoder.java
│   │   │           │   │   └── exception/
│   │   │           │   │       ├── UserAlreadyExistsException.java
│   │   │           │   │       └── UserNotFoundException.java
│   │   │           │   ├── application/
│   │   │           │   │   ├── usecase/
│   │   │           │   │   │   ├── RegisterUserUseCase.java
│   │   │           │   │   │   └── UpdateUserProfileUseCase.java
│   │   │           │   │   ├── dto/
│   │   │           │   │   │   ├── RegisterUserRequest.java
│   │   │           │   │   │   ├── RegisterUserResponse.java
│   │   │           │   │   │   ├── UpdateUserProfileRequest.java
│   │   │           │   │   │   └── UpdateUserProfileResponse.java
│   │   │           │   │   └── mapper/
│   │   │           │   │       └── UserMapper.java
│   │   │           │   └── infrastructure/
│   │   │           │       ├── persistence/
│   │   │           │       │   ├── UserEntity.java
│   │   │           │       │   ├── UserJpaRepository.java
│   │   │           │       │   └── UserRepositoryImpl.java
│   │   │           │       ├── web/
│   │   │           │       │   └── UserController.java
│   │   │           │       └── event/
│   │   │           │           ├── SpringUserEventPublisher.java
│   │   │           │           ├── UserCreatedEvent.java
│   │   │           │           ├── UserProfileUpdatedEvent.java
│   │   │           │           └── UserStatusChangedEvent.java
│   │   │           ├── messaging/
│   │   │           │   ├── domain/
│   │   │           │   │   └── model/
│   │   │           │   │       ├── ChatMessage.java
│   │   │           │   │       ├── MessageId.java
│   │   │           │   │       ├── ConversationId.java
│   │   │           │   │       ├── MessageContent.java
│   │   │           │   │       ├── MessageType.java
│   │   │           │   │       └── MessageStatus.java
│   │   │           │   ├── application/
│   │   │           │   │   ├── service/
│   │   │           │   │   │   ├── RealTimeChatService.java
│   │   │           │   │   │   ├── TypingIndicatorService.java
│   │   │           │   │   │   └── PresenceService.java
│   │   │           │   │   └── dto/
│   │   │           │   │       ├── SendMessageRequest.java
│   │   │           │   │       ├── SendMessageResponse.java
│   │   │           │   │       ├── MessageEvent.java
│   │   │           │   │       ├── TypingIndicator.java
│   │   │           │   │       ├── PresenceEvent.java
│   │   │           │   │       └── UserPresence.java
│   │   │           │   └── infrastructure/
│   │   │           │       ├── redis/
│   │   │           │       │   ├── ChatMessageSubscriber.java
│   │   │           │       │   ├── TypingIndicatorSubscriber.java
│   │   │           │       │   └── PresenceSubscriber.java
│   │   │           │       └── web/
│   │   │           │           └── ChatWebSocketController.java
│   │   │           ├── feed/
│   │   │           │   ├── domain/
│   │   │           │   │   └── model/
│   │   │           │   │       └── Post.java
│   │   │           │   ├── application/
│   │   │           │   │   ├── service/
│   │   │           │   │   │   └── OptimizedFeedService.java
│   │   │           │   │   ├── dto/
│   │   │           │   │   │   ├── CreatePostRequestDTO.java
│   │   │           │   │   │   ├── PostMobileDTO.java
│   │   │           │   │   │   ├── PostWebDTO.java
│   │   │           │   │   │   ├── UserSummaryDTO.java
│   │   │           │   │   │   ├── EngagementDTO.java
│   │   │           │   │   │   ├── MediaDTO.java
│   │   │           │   │   │   ├── LocationDTO.java
│   │   │           │   │   │   └── CommentPreviewDTO.java
│   │   │           │   │   └── mapper/
│   │   │           │   │       └── PostMapper.java
│   │   │           │   └── infrastructure/
│   │   │           │       └── persistence/
│   │   │           │           └── PostJpaRepository.java
│   │   │           ├── shared/
│   │   │           │   ├── dto/
│   │   │           │   │   └── base/
│   │   │           │   │       ├── BaseResponseDTO.java
│   │   │           │   │       └── PaginationRequestDTO.java
│   │   │           │   ├── service/
│   │   │           │   │   └── cache/
│   │   │           │   │       ├── SocialMediaCacheService.java
│   │   │           │   │       ├── CacheWarmingService.java
│   │   │           │   │       └── FeedCacheService.java
│   │   │           │   ├── monitoring/
│   │   │           │   │   ├── SocialMediaMetrics.java
│   │   │           │   │   └── SocialMediaHealthIndicator.java
│   │   │           │   ├── logging/
│   │   │           │   │   ├── StructuredLogger.java
│   │   │           │   │   └── LoggingAspect.java
│   │   │           │   ├── security/
│   │   │           │   │   ├── RateLimitingService.java
│   │   │           │   │   ├── RateLimitingAspect.java
│   │   │           │   │   ├── RateLimit.java
│   │   │           │   │   └── RateLimitExceededException.java
│   │   │           │   └── exception/
│   │   │           │       ├── GlobalExceptionHandler.java
│   │   │           │       └── ErrorResponse.java
│   │   │           ├── config/
│   │   │           │   ├── websocket/
│   │   │           │   │   ├── WebSocketConfig.java
│   │   │           │   │   ├── WebSocketAuthInterceptor.java
│   │   │           │   │   └── CustomHandshakeHandler.java
│   │   │           │   ├── redis/
│   │   │           │   │   └── RedisConfig.java
│   │   │           │   ├── cache/
│   │   │           │   │   └── SocialMediaCacheConfig.java
│   │   │           │   ├── security/
│   │   │           │   │   └── WebSocketSecurityConfig.java
│   │   │           │   ├── logging/
│   │   │           │   │   └── LoggingConfig.java
│   │   │           │   ├── JwtTokenProvider.java
│   │   │           │   └── SocialMediaProperties.java
│   │   │           └── api/
│   │   │               ├── controller/
│   │   │               │   ├── FeedController.java
│   │   │               │   └── MessagingController.java
│   │   │               └── dto/
│   │   │                   └── FeedResponse.java
│   │   └── resources/
│   │       ├── db/
│   │       │   └── migration/
│   │       │       ├── V1__Initial_Schema.sql
│   │       │       ├── V2__Performance_Indexes.sql
│   │       │       └── V3__Stored_Procedures.sql
│   │       ├── application.yml
│   │       ├── application-test.yml
│   │       ├── application-production.yml
│   │       └── logback-spring.xml
│   └── test/
│       └── java/
│           └── com/
│               └── social/
│                   ├── integration/
│                   │   ├── SocialMediaIntegrationTest.java
│                   │   └── WebSocketIntegrationTest.java
│                   └── performance/
│                       └── PerformanceTest.java
├── docker/
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── init.sql
├── scripts/
│   ├── build.sh
│   ├── deploy.sh
│   └── setup-dev.sh
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT.md
├── pom.xml
├── README.md
└── .gitignore
```

## How to Create the Project

### Step 1: Create Spring Boot Project
```bash
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,data-redis,websocket,security,actuator,validation \
  -d javaVersion=17 \
  -d type=maven-project \
  -d groupId=com.social \
  -d artifactId=social-media-app \
  -d name=social-media-app \
  -o social-media-app.zip

unzip social-media-app.zip
cd social-media-app
```

### Step 2: Update pom.xml
Add these dependencies to your existing pom.xml:

```xml
<dependencies>
    <!-- Existing Spring Boot dependencies -->
    
    <!-- MapStruct -->
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct</artifactId>
        <version>1.5.5.Final</version>
    </dependency>
    <dependency>
        <groupId>org.mapstruct</groupId>
        <artifactId>mapstruct-processor</artifactId>
        <version>1.5.5.Final</version>
        <scope>provided</scope>
    </dependency>
    
    <!-- MySQL -->
    <dependency>
        <groupId>mysql</groupId>
        <artifactId>mysql-connector-java</artifactId>
        <scope>runtime</scope>
    </dependency>
    
    <!-- JWT -->
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.11.5</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.11.5</version>
        <scope>runtime</scope>
    </dependency>
    
    <!-- Micrometer Prometheus -->
    <dependency>
        <groupId>io.micrometer</groupId>
        <artifactId>micrometer-registry-prometheus</artifactId>
    </dependency>
    
    <!-- TestContainers for testing -->
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>junit-jupiter</artifactId>
        <scope>test</scope>
    </dependency>
    <dependency>
        <groupId>org.testcontainers</groupId>
        <artifactId>mysql</artifactId>
        <scope>test</scope>
    </dependency>
    
    <!-- Logback JSON encoder -->
    <dependency>
        <groupId>net.logstash.logback</groupId>
        <artifactId>logstash-logback-encoder</artifactId>
        <version>7.2</version>
    </dependency>
</dependencies>
```

### Step 3: Quick Setup Script

Create `setup-project.sh`:

```bash
#!/bin/bash

echo "Setting up Social Media Project..."

# Create directory structure
mkdir -p src/main/java/com/social/{user,messaging,feed,shared,config,api}/{domain,application,infrastructure}
mkdir -p src/main/java/com/social/user/{domain/{model,port,exception},application/{usecase,dto,mapper},infrastructure/{persistence,web,event}}
mkdir -p src/main/java/com/social/messaging/{domain/model,application/{service,dto},infrastructure/{redis,web}}
mkdir -p src/main/java/com/social/feed/{domain/model,application/{service,dto,mapper},infrastructure/persistence}
mkdir -p src/main/java/com/social/shared/{dto/base,service/cache,monitoring,logging,security,exception}
mkdir -p src/main/java/com/social/config/{websocket,redis,cache,security,logging}
mkdir -p src/main/java/com/social/api/{controller,dto}

mkdir -p src/main/resources/db/migration
mkdir -p src/test/java/com/social/{integration,performance}

mkdir -p docker
mkdir -p scripts
mkdir -p docs

echo "Project structure created successfully!"
echo "Now copy the code files from the artifacts into their respective directories."
```

### Step 4: Copy Files from Artifacts

You need to copy each Java class from the artifacts I created into the appropriate directory:

1. **Clean Architecture Structure** → Copy to respective domain/application/infrastructure folders
2. **WebSocket Implementation** → Copy to messaging and config folders  
3. **DTO Optimization** → Copy to application/dto folders
4. **Redis Caching** → Copy to shared/service/cache and config folders
5. **Security & Monitoring** → Copy to shared/security and monitoring folders
6. **Database scripts** → Copy to src/main/resources/db/migration/
7. **Configuration files** → Copy to src/main/resources/
8. **Docker files** → Copy to docker/ folder

### Step 5: Build and Run

```bash
# Build the project
./mvnw clean compile

# Run tests
./mvnw test

# Run the application
./mvnw spring-boot:run

# Or with Docker
docker-compose up -d
```

## Key Configuration Files

### application.yml
```yaml
# Copy the complete application.yml from the "Logging Configuration" artifact
```

### Docker Compose
```yaml
# Copy the docker-compose.yml from the same artifact
```

### Database Migration Scripts
```sql
-- Copy all SQL scripts from the artifacts to db/migration/
```

## Quick Start Commands

```bash
# 1. Create project structure
chmod +x setup-project.sh
./setup-project.sh

# 2. Copy all Java files from artifacts to appropriate directories

# 3. Start dependencies
docker-compose up -d mysql redis

# 4. Run application
./mvnw spring-boot:run
```

## Testing the Setup

1. **Check Health**: http://localhost:8080/actuator/health
2. **WebSocket**: Connect to ws://localhost:8080/ws
3. **API**: http://localhost:8080/api/v1/feed
4. **Metrics**: http://localhost:8080/actuator/prometheus

## Next Steps

1. Customize the configuration for your environment
2. Add your specific business logic
3. Deploy to your preferred cloud platform
4. Set up CI/CD pipelines
5. Configure monitoring and alerting

The project is designed to be production-ready with comprehensive testing, monitoring, and deployment configurations included.
