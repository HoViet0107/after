package personal.social.shared.infrastructure.monitoring;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class MetricsService {

    private final MeterRegistry meterRegistry;

    public void recordScheduledTaskExecution(String taskName, long durationMs) {
        Timer.Sample sample = Timer.start(meterRegistry);
        sample.stop(Timer.builder("scheduled.task.duration")
                .tag("task", taskName)
                .tag("status", "success")
                .register(meterRegistry));
    }

    public void recordScheduledTaskError(String taskName) {
        Counter.builder("scheduled.task.errors")
                .tag("task", taskName)
                .register(meterRegistry)
                .increment();
    }

    public void recordGauge(String name, double value) {
        meterRegistry.gauge(name, value);
    }

    public void recordSessionEvent(String eventType, String platform) {
        Counter.builder("session.events")
                .tag("type", eventType)
                .tag("platform", platform)
                .register(meterRegistry)
                .increment();
    }
}