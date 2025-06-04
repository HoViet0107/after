package personal.social.aspect;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.stereotype.Component;

@Aspect
@Component
@Slf4j
public class PerformanceMonitoringAspect {

    @Around("execution(* personal.social.services..*(..))")
    public Object monitorServicePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();

        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;

            if (executionTime > 1000) { // Log slow operations (>1s)
                log.warn("Slow service operation detected: {} took {}ms", methodName, executionTime);
            } else if (executionTime > 500) { // Log moderate operations (>500ms)
                log.info("Service operation: {} took {}ms", methodName, executionTime);
            } else {
                log.debug("Service operation: {} took {}ms", methodName, executionTime);
            }

            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            log.error("Service operation failed: {} after {}ms - {}",
                    methodName, executionTime, e.getMessage());
            throw e;
        }
    }

    @Around("execution(* personal.social.services.cache..*(..))")
    public Object monitorCachePerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        String methodName = joinPoint.getSignature().toShortString();

        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;

            if (executionTime > 100) { // Log slow cache operations (>100ms)
                log.warn("Slow cache operation: {} took {}ms", methodName, executionTime);
            } else {
                log.debug("Cache operation: {} took {}ms", methodName, executionTime);
            }

            return result;
        } catch (Exception e) {
            long executionTime = System.currentTimeMillis() - startTime;
            log.error("Cache operation failed: {} after {}ms - {}",
                    methodName, executionTime, e.getMessage());
            throw e;
        }
    }
}
