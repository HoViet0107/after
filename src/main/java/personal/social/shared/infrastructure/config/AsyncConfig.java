package personal.social.shared.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.aop.interceptor.AsyncUncaughtExceptionHandler;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

// for background task execution configuration
@Slf4j
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {

    /**
     * @return the executor used for background task execution.
     *         The configuration is as follows:
     *         <ul>
     *         <li>core pool size: 4</li>
     *         <li>max pool size: 10</li>
     *         <li>queue capacity: 100</li>
     *         <li>thread name prefix: <code>async-</code></li>
     *         <li>keep alive seconds: 60</li>
     *         <li>rejected execution handler: {@link ThreadPoolExecutor.CallerRunsPolicy}</li>
     *         <li>wait for tasks to complete on shutdown: <code>true</code></li>
     *         <li>await termination seconds: 60</li>
     *         </ul>
     */
    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(10);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("async-");
        executor.setKeepAliveSeconds(60);
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(60);
        executor.initialize();
        return executor;
    }

    /**
     * The default {@link AsyncUncaughtExceptionHandler} to handle exceptions thrown in background
     * tasks.
     *
     * @return the handler that will log the exception.
     */
    @Override
    public AsyncUncaughtExceptionHandler getAsyncUncaughtExceptionHandler() {
        return (throwable, method, params) -> {
            log.error("Async method {} threw exception", method.getName(), throwable);
            // Có thể gửi notification hoặc alert ở đây
        };
    }
}
