package zm.unza.cict.specification;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableAsync;
import zm.unza.cict.specification.config.AppProperties;

@EnableAsync
@EnableConfigurationProperties(AppProperties.class)
@SpringBootApplication
public class SpecificationBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpecificationBackendApplication.class, args);
    }
}
