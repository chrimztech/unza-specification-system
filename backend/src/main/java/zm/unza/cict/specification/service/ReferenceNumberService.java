package zm.unza.cict.specification.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.Year;
import java.time.format.DateTimeFormatter;

/**
 * Generates year-scoped, human-readable reference codes like
 * UNZA/CICT/EVAL/2026/0001, backed by a generic (prefix, year) upsert
 * counter table so each prefix gets its own sequence.
 */
@Service
public class ReferenceNumberService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public String next(String prefix) {
        int year = Year.now().getValue();
        Number seq = (Number) entityManager.createNativeQuery("""
                insert into reference_sequences (prefix, year, last_value) values (:prefix, :year, 1)
                on conflict (prefix, year) do update set last_value = reference_sequences.last_value + 1
                returning last_value
                """)
                .setParameter("prefix", prefix)
                .setParameter("year", year)
                .getSingleResult();
        return "UNZA/CICT/" + prefix + "/" + year + "/" + String.format("%04d", seq.longValue());
    }

    /**
     * Generates the equipment specification request's own reference number, day-scoped:
     * yyyyMMdd followed by a 4-digit sequence that resets every calendar day (e.g. 202609140001).
     */
    @Transactional
    public String nextRequestNumber() {
        LocalDate today = LocalDate.now();
        Number seq = (Number) entityManager.createNativeQuery("""
                insert into request_number_sequences (seq_date, last_value) values (:d, 1)
                on conflict (seq_date) do update set last_value = request_number_sequences.last_value + 1
                returning last_value
                """)
                .setParameter("d", today)
                .getSingleResult();
        return today.format(DateTimeFormatter.ofPattern("yyyyMMdd")) + String.format("%04d", seq.longValue());
    }
}
