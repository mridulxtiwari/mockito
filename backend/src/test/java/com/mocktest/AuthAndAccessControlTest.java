package com.mocktest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

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
        String token = loginAndGetToken("admin@exam.com", "Admin@123");
        assertNotNull(token);
        assertFalse(token.isBlank());

        // Validate token on /api/auth/me
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("admin@exam.com"))
                .andExpect(jsonPath("$.data.role").value("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("Students Alice and Bob can login successfully")
    void testStudentLogins() throws Exception {
        String aliceToken = loginAndGetToken("alice@exam.com", "Alice@123");
        assertNotNull(aliceToken);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("alice@exam.com"))
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"));

        String bobToken = loginAndGetToken("bob@exam.com", "Bob@123");
        assertNotNull(bobToken);

        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.email").value("bob@exam.com"))
                .andExpect(jsonPath("$.data.role").value("ROLE_USER"));
    }

    @Test
    @DisplayName("Invalid login credentials returns 401 Unauthorized")
    void testInvalidLoginCredentials() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@exam.com\",\"password\":\"WrongPassword!\"}"))
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
        String adminToken = loginAndGetToken("admin@exam.com", "Admin@123");
        String aliceToken = loginAndGetToken("alice@exam.com", "Alice@123");

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
        String aliceToken = loginAndGetToken("alice@exam.com", "Alice@123");
        String adminToken = loginAndGetToken("admin@exam.com", "Admin@123");

        String newTestPayload = """
                {
                    "categoryId": 1,
                    "title": "Unauthorized Test Attempt",
                    "description": "Should fail for student",
                    "durationMinutes": 10,
                    "passingMarks": 5,
                    "accessType": "COMMON",
                    "questions": []
                }
                """;

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
        String adminToken = loginAndGetToken("admin@exam.com", "Admin@123");
        String aliceToken = loginAndGetToken("alice@exam.com", "Alice@123");
        String bobToken = loginAndGetToken("bob@exam.com", "Bob@123");

        // Admin sees all tests (contains both Alice's and Bob's tests)
        MvcResult adminResult = mockMvc.perform(get("/api/tests")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andReturn();

        String adminBody = adminResult.getResponse().getContentAsString();
        assertTrue(adminBody.contains("Spring Cloud & Distributed Systems (Batch A)"));
        assertTrue(adminBody.contains("PostgreSQL Query Optimization & EXPLAIN Deep Dive"));

        // Alice sees Spring Cloud (Batch A), but NOT PostgreSQL
        MvcResult aliceResult = mockMvc.perform(get("/api/tests")
                        .header("Authorization", "Bearer " + aliceToken))
                .andExpect(status().isOk())
                .andReturn();

        String aliceBody = aliceResult.getResponse().getContentAsString();
        assertTrue(aliceBody.contains("Spring Cloud & Distributed Systems (Batch A)"), "Alice must see test assigned to her");
        assertFalse(aliceBody.contains("PostgreSQL Query Optimization & EXPLAIN Deep Dive"), "Alice must NOT see test assigned to Bob");

        // Bob sees PostgreSQL, but NOT Spring Cloud (Batch A)
        MvcResult bobResult = mockMvc.perform(get("/api/tests")
                        .header("Authorization", "Bearer " + bobToken))
                .andExpect(status().isOk())
                .andReturn();

        String bobBody = bobResult.getResponse().getContentAsString();
        assertTrue(bobBody.contains("PostgreSQL Query Optimization & EXPLAIN Deep Dive"), "Bob must see test assigned to him");
        assertFalse(bobBody.contains("Spring Cloud & Distributed Systems (Batch A)"), "Bob must NOT see test assigned to Alice");

        // Anonymous/Guest sees only Common tests, none of the assigned ones
        MvcResult guestResult = mockMvc.perform(get("/api/tests"))
                .andExpect(status().isOk())
                .andReturn();

        String guestBody = guestResult.getResponse().getContentAsString();
        assertTrue(guestBody.contains("Java Core & Spring Boot Essentials"), "Guest can see common test");
        assertFalse(guestBody.contains("Spring Cloud & Distributed Systems (Batch A)"), "Guest cannot see assigned test");
        assertFalse(guestBody.contains("PostgreSQL Query Optimization & EXPLAIN Deep Dive"), "Guest cannot see assigned test");
    }
}
