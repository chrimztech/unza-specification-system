package zm.unza.cict.specification.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import zm.unza.cict.specification.config.AppProperties;

/**
 * Thin wrapper over {@link JavaMailSender}. Email is opt-in (app.mail.enabled, off by
 * default) since it needs real SMTP credentials this deployment may not have yet — when
 * disabled, or when a send fails, this logs and returns rather than throwing, so email
 * is always a secondary effect that can never break the request/notification flow it's
 * attached to.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private final AppProperties appProperties;

    public boolean isEnabled() {
        return appProperties.mail() != null && appProperties.mail().enabled();
    }

    public void send(String to, String subject, String body) {
        if (!isEnabled()) {
            log.debug("Email disabled — skipping '{}' to {}", subject, to);
            return;
        }
        if (to == null || to.isBlank()) return;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(appProperties.mail().from());
            message.setTo(to);
            message.setSubject(subject);
            message.setText(body);
            mailSender.send(message);
        } catch (Exception e) {
            log.warn("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
