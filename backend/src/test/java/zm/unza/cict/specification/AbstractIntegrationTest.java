package zm.unza.cict.specification;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;
import zm.unza.cict.specification.common.enums.AppRole;
import zm.unza.cict.specification.domain.User;
import zm.unza.cict.specification.domain.UserRoleAssignment;
import zm.unza.cict.specification.hr.HrClient;
import zm.unza.cict.specification.hr.HrStaff;
import zm.unza.cict.specification.repository.UserRepository;
import zm.unza.cict.specification.repository.UserRoleAssignmentRepository;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base for backend integration tests: boots the full Spring context against a real, ephemeral
 * Postgres container (so Flyway migrations — and the real seeded catalogue — run exactly as in
 * production), with {@link HrClient} mocked since tests cannot reach the live UNZA HR API.
 */
@SpringBootTest
@AutoConfigureMockMvc
public abstract class AbstractIntegrationTest {

    /**
     * Singleton-container pattern: started once via this static initializer and never stopped
     * (Testcontainers' Ryuk reaper cleans it up at JVM exit). This is deliberately NOT managed by
     * the {@code @Testcontainers}/{@code @Container} JUnit5 extension — with a static field
     * inherited from an abstract base class shared by multiple concrete test classes, that
     * extension's per-class lifecycle hooks stop the container after the first test class
     * finishes, leaving every later class unable to open a connection.
     */
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>(DockerImageName.parse("postgres:16-alpine"));

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
    }

    @Autowired
    protected MockMvc mockMvc;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    protected UserRepository userRepository;

    @Autowired
    protected UserRoleAssignmentRepository roleAssignmentRepository;

    @MockBean
    protected HrClient hrClient;

    private int identifierSeq = 0;

    @BeforeEach
    void resetSequence() {
        identifierSeq = 0;
    }

    /** A fresh HR identity for this test — avoids account collisions between test methods. */
    protected HrStaff freshStaff(String label) {
        String unique = label + "-" + System.nanoTime();
        return new HrStaff(unique + "@unza.zm", "Test " + label, unique, "Officer", null);
    }

    /** Logs the given HR identity in (mocking the HR API) and returns the issued JWT. */
    protected String loginAs(HrStaff staff) throws Exception {
        when(hrClient.authenticate(staff.email(), "password")).thenReturn(staff);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType("application/json")
                        .content("""
                                {"identifier":"%s","password":"password"}
                                """.formatted(staff.email())))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode body = objectMapper.readTree(result.getResponse().getContentAsString());
        return body.get("token").asText();
    }

    /** Grants a role directly (bypassing the admin-only HTTP endpoint) so tests can set up fixtures fast. */
    protected void grantRole(String email, AppRole role) {
        User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        roleAssignmentRepository.save(UserRoleAssignment.builder().user(user).role(role).build());
    }

    protected String bearer(String token) {
        return "Bearer " + token;
    }

    /** The id of any active equipment category — the catalogue is seeded by Flyway, not by tests. */
    protected String anyEquipmentCategoryId(String token) throws Exception {
        MvcResult result = mockMvc.perform(get("/api/equipment-categories").header("Authorization", bearer(token)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode categories = objectMapper.readTree(result.getResponse().getContentAsString());
        return categories.get(0).get("id").asText();
    }
}
