package com.mocktest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mocktest.entity.Category;
import com.mocktest.entity.MockTest;
import com.mocktest.entity.Role;
import com.mocktest.entity.TestAccessType;
import com.mocktest.entity.User;
import com.mocktest.repository.CategoryRepository;
import com.mocktest.repository.MockTestRepository;
import com.mocktest.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashSet;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthAndAccessControlTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private MockTestRepository testRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "mridulxtiwari@gmail.com";
    private static final String ADMIN_PASSWORD = "1234567890";
    private static final String ALICE_EMAIL = "alice.test@exam.com";
    private static final String BOB_EMAIL = "bob.test@exam.com";
    private static final String STUDENT_PASS = "Student@123";

    @BeforeEach
    void setUpTestFixtures() {
        // Ensure admin user exists for tests
        userRepository.findByEmailIgnoreCase(ADMIN_EMAIL)
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Mridul Tiwari")
                        .email(ADMIN_EMAIL)
                        .password(passwordEncoder.encode(ADMIN_PASSWORD))
                        .role(Role.ROLE_ADMIN)
                        .enabled(true)
                        .build()));
        // Setup isolated student test users for RBAC testing
        User alice = userRepository.findByEmailIgnoreCase(ALICE_EMAIL)
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Alice Test")
                        .email(ALICE_EMAIL)
                        .password(passwordEncoder.encode(STUDENT_PASS))
                        .role(Role.ROLE_USER)
                        .enabled(true)
                        .build()));

        User bob = userRepository.findByEmailIgnoreCase(BOB_EMAIL)
                .orElseGet(() -> userRepository.save(User.builder()
                        .fullName("Bob Test")
                        .email(BOB_EMAIL)
                        .password(passwordEncoder.encode(STUDENT_PASS))
                        .role(Role.ROLE_USER)
                        .enabled(true)
                        .build()));

        Category category = categoryRepository.findAll().stream().findFirst()
                .orElseGet(() -> categoryRepository.save(Category.builder()
                        .name("JEE Main")
                        .description("Test Category")
                        .icon("🎯")
                        .build()));

        // Ensure common test exists for testAssignedTestIsolation
        if (testRepository.findCommonTests().isEmpty()) {
            testRepository.save(MockTest.builder()
                    .category(category)
                    .title("JEE Main - PCM Speed & Accuracy Mock Test")
                    .description("Sample mock test")
                    .durationMinutes(15)
                    .totalMarks(6)
                    .passingMarks(4)
                    .accessType(TestAccessType.COMMON)
                    .isActive(true)
                    .build());
        }

        // Ensure assigned test fixtures exist for Alice and Bob
        if (testRepository.findByAccessType(TestAccessType.ASSIGNED).isEmpty()) {
            MockTest aliceTest = MockTest.builder()
                    .category(category)
                    .title("Advanced Assessment (Batch A)")
                    .description("Specialized assessment assigned to Alice")
                    .durationMinutes(15)
                    .totalMarks(4)
                    .passingMarks(2)
                    .accessType(TestAccessType.ASSIGNED)
                    .assignedUsers(new HashSet<>(List.of(alice)))
                    .isActive(true)
                    .build();
            testRepository.save(aliceTest);

            MockTest bobTest = MockTest.builder()
                    .category(category)
                    .title("Advanced Assessment (Batch B)")
                    .description("Specialized assessment assigned to Bob")
                    .durationMinutes(15)
                    .totalMarks(4)
                    .passingMarks(2)
                    .accessType(TestAccessType.ASSIGNED)
                    .assignedUsers(new HashSet<>(List.of(bob)))
                    .isActive(true)
                    .build();
            testRepository.save(bobTest);
        }
    }

    private String loginAndGetToken(String email, String password) throws Exception {
        String payload = String.format("{\"email\":\"%s\",\"password\":\"%s\"}", email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode json = objectMapper.readTree(result.getResponse().getContentAsString());
        assertTrue(json.get("success").asBoolean());
        return json.get("data").get("token").asText();
    }

    @Test
    @DisplayName("Admin can login and receives ROLE_ADMIN token")
    void testAdminLogin() throws Exception {
        String token = loginAndGetToken(ADMIN_EMAIL, ADMIN_PASSWORD);
        assertNotNull(token);
        assertFalse(token.isBlank());

        // Validate token on /api/auth/me
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(ADMIN_EMAIL))
                .andExpect(jsonPath("$.data.role").value("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("Students Alice and Bob can login successfully")
    void testStudentLogins() throws Exception {
        String aliceToken = loginAndGetToken(ALICE_EMAIL, STUDENT_PASS);
        assertNotNull(aliceToken);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(ALICE_EMAIL))
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"));

        String bobToken = loginAndGetToken(BOB_EMAIL, STUDENT_PASS);
        assertNotNull(bobToken);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value(BOB_EMAIL))
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"));
    }

    @Test
    @DisplayName("Invalid login credentials returns 401 Unauthorized")
    void testInvalidLoginCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("{\"email\":\"%s\",\"password\":\"WrongPassword!\"}", ADMIN_EMAIL)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("New candidate can register and immediately gets a valid JWT")
    void testCandidateRegistration() throws Exception {
        String newEmail = "candidate" + System.currentTimeMillis() + "@exam.com";
        String payload = String.format("{\"fullName\":\"Test Candidate\",\"email\":\"%s\",\"password\":\"Pass@123\"}", newEmail);

        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.token").isNotEmpty())
                .andExpect(jsonPath("$.data.user.role").value("ROLE_USER"))
                .andReturn();

        // Duplicate registration must fail with 400 Bad Request
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }

    @Test
    @DisplayName("Admin only endpoint: GET /api/users is allowed for Admin but forbidden for students")
    void testUserManagementRbac() throws Exception {
        String adminToken = loginAndGetToken(ADMIN_EMAIL, ADMIN_PASSWORD);
        String aliceToken = loginAndGetToken(ALICE_EMAIL, STUDENT_PASS);

        // Admin succeeds
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray());

        // Alice (Student) is blocked with 403 Forbidden
        mockMvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Test Creation RBAC: Only Admin can create tests; Student is blocked with 403")
    void testCreateTestRbac() throws Exception {
        String aliceToken = loginAndGetToken(ALICE_EMAIL, STUDENT_PASS);
        String adminToken = loginAndGetToken(ADMIN_EMAIL, ADMIN_PASSWORD);

        Long catId = categoryRepository.findAll().stream().findFirst().orElseThrow().getId();

        String newTestPayload = String.format("""
                {
                    "categoryId": %d,
                    "title": "Unauthorized Test Attempt",
                    "description": "Should fail for student",
                    "durationMinutes": 10,
                    "passingMarks": 5,
                    "accessType": "COMMON",
                    "questions": []
                }
                """, catId);

        // Student (Alice) fails with 403 Forbidden
        mockMvc.perform(post("/api/tests")
                        .header("Authorization", "Bearer " + aliceToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newTestPayload))
                .andExpect(status().isForbidden());

        // Admin succeeds with 201 Created
        mockMvc.perform(post("/api/tests")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(newTestPayload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Unauthorized Test Attempt"));
    }

    @Test
    @DisplayName("Visibility: Alice sees her assigned test, Bob sees his assigned test, but not each other's")
    void testAssignedTestIsolation() throws Exception {
        String adminToken = loginAndGetToken(ADMIN_EMAIL, ADMIN_PASSWORD);
        String aliceToken = loginAndGetToken(ALICE_EMAIL, STUDENT_PASS);
        String bobToken = loginAndGetToken(BOB_EMAIL, STUDENT_PASS);

        // Admin sees all tests (contains both Alice's and Bob's tests)
        MvcResult adminResult = mockMvc.perform(get("/api/tests")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        String adminBody = adminResult.getResponse().getContentAsString();
        assertTrue(adminBody.contains("Advanced Assessment (Batch A)"));
        assertTrue(adminBody.contains("Advanced Assessment (Batch B)"));

        // Alice sees Advanced Assessment (Batch A), but NOT Batch B
        MvcResult aliceResult = mockMvc.perform(get("/api/tests")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andReturn();

        String aliceBody = aliceResult.getResponse().getContentAsString();
        assertTrue(aliceBody.contains("Advanced Assessment (Batch A)"), "Alice must see test assigned to her");
        assertFalse(aliceBody.contains("Advanced Assessment (Batch B)"), "Alice must NOT see test assigned to Bob");

        // Bob sees Advanced Assessment (Batch B), but NOT Batch A
        MvcResult bobResult = mockMvc.perform(get("/api/tests")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andReturn();

        String bobBody = bobResult.getResponse().getContentAsString();
        assertTrue(bobBody.contains("Advanced Assessment (Batch B)"), "Bob must see test assigned to him");
        assertFalse(bobBody.contains("Advanced Assessment (Batch A)"), "Bob must NOT see test assigned to Alice");

        // Anonymous/Guest sees only Common tests, none of the assigned ones
        MvcResult guestResult = mockMvc.perform(get("/api/tests"))
                .andExpect(status().isOk())
                .andReturn();

        String guestBody = guestResult.getResponse().getContentAsString();
        assertTrue(guestBody.contains("JEE Main") || guestBody.contains("MHCET"), "Guest can see common test");
        assertFalse(guestBody.contains("Advanced Assessment (Batch A)"), "Guest cannot see assigned test");
        assertFalse(guestBody.contains("Advanced Assessment (Batch B)"), "Guest cannot see assigned test");
    }
}
