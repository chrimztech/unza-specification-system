package zm.unza.cict.specification.service;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Year;

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
}
