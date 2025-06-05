package personal.social;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.web.socket.config.annotation.EnableWebSocket;


@SpringBootApplication
@EnableWebSocket
public class SocialApplication implements CommandLineRunner {

    public static void main(String[] args) {
        SpringApplication.run(SocialApplication.class, args);
    }

    @Override
    public void run(String... args) throws Exception {

    }
}
