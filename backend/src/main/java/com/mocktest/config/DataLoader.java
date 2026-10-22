package com.mocktest.config;

import com.mocktest.entity.*;
import com.mocktest.repository.CategoryRepository;
import com.mocktest.repository.MockTestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataLoader implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final MockTestRepository testRepository;
    private final com.mocktest.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        Category javaCategory;
        Category reactCategory;
        Category dbCategory;
        Category jeeCategory;
        Category mhcetCategory;

        if (categoryRepository.count() == 0) {
            log.info("Seeding initial mock test data...");

            // 1. Categories
            javaCategory = Category.builder()
                    .name("Java & Spring Boot")
                    .description("Core Java, concurrency, Spring Framework, Spring Boot 3, and microservices architecture.")
                    .icon("☕")
                    .build();

            reactCategory = Category.builder()
                    .name("React & Frontend")
                    .description("Modern React, hooks, state patterns, JavaScript ES6+, and responsive UI development.")
                    .icon("⚛️")
                    .build();

            dbCategory = Category.builder()
                    .name("Databases & SQL")
                    .description("Relational data modeling, indexing, SQL queries, transactions, and ACID principles.")
                    .icon("🗄️")
                    .build();

            jeeCategory = Category.builder()
                    .name("JEE Mains")
                    .description("Physics, Chemistry, and Mathematics practice problems and mock tests for JEE Main aspirants.")
                    .icon("🎯")
                    .build();

            mhcetCategory = Category.builder()
                    .name("MHCET")
                    .description("Maharashtra Common Entrance Test mock exams covering Physics, Chemistry, and Mathematics.")
                    .icon("📐")
                    .build();

            categoryRepository.saveAll(List.of(javaCategory, reactCategory, dbCategory, jeeCategory, mhcetCategory));

            // 3. Common Tests (Generic for all users)
            seedJavaTest(javaCategory);
            seedReactTest(reactCategory);
            seedDatabaseTest(dbCategory);
            seedJeeMainTest(jeeCategory);
            seedMhcetTest(mhcetCategory);
        } else {
            javaCategory = categoryRepository.findByNameIgnoreCase("Java & Spring Boot").orElse(null);
            reactCategory = categoryRepository.findByNameIgnoreCase("React & Frontend").orElse(null);
            dbCategory = categoryRepository.findByNameIgnoreCase("Databases & SQL").orElse(null);
            jeeCategory = categoryRepository.findByNameIgnoreCase("JEE Mains").orElse(null);
            mhcetCategory = categoryRepository.findByNameIgnoreCase("MHCET").orElse(null);
        }

        // 2. Seed Default Accounts & Assigned Tests if users not yet created
        if (userRepository.count() == 0) {
            log.info("Seeding initial user accounts and assigned tests...");
            User admin = User.builder()
                    .fullName("Admin Instructor")
                    .email("admin@exam.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ROLE_ADMIN)
                    .enabled(true)
                    .build();

            User alice = User.builder()
                    .fullName("Alice Johnson")
                    .email("alice@exam.com")
                    .password(passwordEncoder.encode("Alice@123"))
                    .role(Role.ROLE_USER)
                    .enabled(true)
                    .build();

            User bob = User.builder()
                    .fullName("Bob Smith")
                    .email("bob@exam.com")
                    .password(passwordEncoder.encode("Bob@123"))
                    .role(Role.ROLE_USER)
                    .enabled(true)
                    .build();

            userRepository.saveAll(List.of(admin, alice, bob));
        }

        // 4. Assigned Tests (Targeted to specific students) if not already created
        if (testRepository.findByAccessType(TestAccessType.ASSIGNED).isEmpty()) {
            User alice = userRepository.findByEmailIgnoreCase("alice@exam.com").orElse(null);
            User bob = userRepository.findByEmailIgnoreCase("bob@exam.com").orElse(null);
            if (alice != null && javaCategory != null) {
                seedAssignedAliceTest(javaCategory, alice);
            }
            if (bob != null && dbCategory != null) {
                seedAssignedBobTest(dbCategory, bob);
            }
        }

        log.info("Mock test data and user accounts seeded successfully!");
    }

    private void seedJavaTest(Category category) {
        MockTest test = MockTest.builder()
                .category(category)
                .title("Java Core & Spring Boot Essentials")
                .description("Test your knowledge of Core Java OOP, Java 17 features, and Spring Boot application design.")
                .durationMinutes(10)
                .totalMarks(10)
                .passingMarks(6)
                .negativeMarks(0.25)
                .difficulty("MEDIUM")
                .isActive(true)
                .questions(new ArrayList<>())
                .build();

        addQuestion(test,
                "What is the default scope of a Spring bean if none is explicitly specified?",
                "Spring beans are singleton by default, meaning one shared instance per Spring IoC container.",
                1, 1,
                List.of(
                        new OptionData("A", "prototype", false),
                        new OptionData("B", "singleton", true),
                        new OptionData("C", "request", false),
                        new OptionData("D", "session", false)
                )
        );

        addQuestion(test,
                "In Java 17+, which keyword is used to declare a compact, immutable data carrier class?",
                "The 'record' keyword in Java creates a final class with private final fields, constructor, getters, equals, hashCode, and toString.",
                1, 2,
                List.of(
                        new OptionData("A", "struct", false),
                        new OptionData("B", "data", false),
                        new OptionData("C", "record", true),
                        new OptionData("D", "val", false)
                )
        );

        addQuestion(test,
                "Which collection interface in Java guarantees no duplicate elements?",
                "The Set interface (e.g. HashSet, TreeSet) does not permit duplicate elements.",
                1, 3,
                List.of(
                        new OptionData("A", "List", false),
                        new OptionData("B", "Queue", false),
                        new OptionData("C", "Set", true),
                        new OptionData("D", "Vector", false)
                )
        );

        addQuestion(test,
                "What does the @SpringBootApplication annotation combine?",
                "@SpringBootApplication combines @Configuration, @EnableAutoConfiguration, and @ComponentScan.",
                1, 4,
                List.of(
                        new OptionData("A", "@Configuration, @EnableAutoConfiguration, and @ComponentScan", true),
                        new OptionData("B", "@Service, @Repository, and @Controller", false),
                        new OptionData("C", "@EnableWebMvc, @EntityScan, and @Autowired", false),
                        new OptionData("D", "@Bean, @Component, and @Value", false)
                )
        );

        addQuestion(test,
                "Which HTTP method is defined as idempotent according to REST principles?",
                "PUT is idempotent because multiple identical requests have the same side effect as a single request.",
                1, 5,
                List.of(
                        new OptionData("A", "POST", false),
                        new OptionData("B", "PUT", true),
                        new OptionData("C", "PATCH (non-idempotent in standard specification)", false),
                        new OptionData("D", "CONNECT", false)
                )
        );

        addQuestion(test,
                "What is the default port for embedded Apache Tomcat in a Spring Boot web application?",
                "Spring Boot Web defaults to port 8080 unless configured otherwise via server.port.",
                1, 6,
                List.of(
                        new OptionData("A", "80", false),
                        new OptionData("B", "3000", false),
                        new OptionData("C", "8080", true),
                        new OptionData("D", "9090", false)
                )
        );

        addQuestion(test,
                "Which exception type triggers an automatic transaction rollback in standard Spring @Transactional?",
                "By default, Spring @Transactional rolls back on unchecked (RuntimeException and Error), but not on checked exceptions unless rollbackFor is specified.",
                1, 7,
                List.of(
                        new OptionData("A", "Checked exceptions only", false),
                        new OptionData("B", "Unchecked exceptions (RuntimeException and subclasses)", true),
                        new OptionData("C", "IOException and SQLException", false),
                        new OptionData("D", "Any Throwable automatically", false)
                )
        );

        addQuestion(test,
                "Which interface must be implemented to execute tasks asynchronously using Java's ExecutorService?",
                "Both Runnable and Callable are used, with Callable<V> returning a result and allowing checked exceptions.",
                1, 8,
                List.of(
                        new OptionData("A", "Callable or Runnable", true),
                        new OptionData("B", "Serializable", false),
                        new OptionData("C", "Cloneable", false),
                        new OptionData("D", "Comparable", false)
                )
        );

        testRepository.save(test);
    }

    private void seedReactTest(Category category) {
        MockTest test = MockTest.builder()
                .category(category)
                .title("React Fundamentals & Modern Hooks")
                .description("Assess your understanding of functional React components, hooks (useState, useEffect, useRef), and component lifecycle.")
                .durationMinutes(8)
                .totalMarks(6)
                .passingMarks(4)
                .negativeMarks(0.0)
                .difficulty("EASY")
                .isActive(true)
                .questions(new ArrayList<>())
                .build();

        addQuestion(test,
                "Which React hook is used to execute side effects like data fetching and subscriptions?",
                "useEffect is designed for handling lifecycle events and side effects in functional components.",
                1, 1,
                List.of(
                        new OptionData("A", "useState", false),
                        new OptionData("B", "useEffect", true),
                        new OptionData("C", "useReducer", false),
                        new OptionData("D", "useMemo", false)
                )
        );

        addQuestion(test,
                "Why should you never mutate React state directly (e.g., state.count = 5)?",
                "Direct mutation does not notify React to re-render, leading to stale UI and inconsistent state.",
                1, 2,
                List.of(
                        new OptionData("A", "JavaScript will throw a syntax error", false),
                        new OptionData("B", "React will not trigger a re-render because it relies on shallow reference equality", true),
                        new OptionData("C", "State becomes read-only in memory", false),
                        new OptionData("D", "It breaks HTTP connections", false)
                )
        );

        addQuestion(test,
                "What hook allows storing a mutable value across renders WITHOUT triggering a re-render?",
                "useRef returns a mutable ref object whose .current property can be updated without triggering a re-render.",
                1, 3,
                List.of(
                        new OptionData("A", "useState", false),
                        new OptionData("B", "useCallback", false),
                        new OptionData("C", "useRef", true),
                        new OptionData("D", "useContext", false)
                )
        );

        addQuestion(test,
                "What is the purpose of the 'key' prop when rendering a dynamic array of items in JSX?",
                "The key prop helps React identify which items have changed, been added, or removed, optimizing DOM reconciliation.",
                1, 4,
                List.of(
                        new OptionData("A", "To apply CSS classes uniquely", false),
                        new OptionData("B", "To provide unique identity for efficient reconciliation during Virtual DOM diffing", true),
                        new OptionData("C", "To sort the array automatically", false),
                        new OptionData("D", "To bind click events", false)
                )
        );

        addQuestion(test,
                "When does the cleanup function returned from a useEffect hook execute?",
                "The cleanup function runs right before the component unmounts, and before re-running the effect on subsequent renders.",
                1, 5,
                List.of(
                        new OptionData("A", "Only when the browser window closes", false),
                        new OptionData("B", "Before the effect re-runs and when the component unmounts", true),
                        new OptionData("C", "Immediately before the first render", false),
                        new OptionData("D", "Whenever a parent component's CSS changes", false)
                )
        );

        addQuestion(test,
                "Which build tool offers instant Hot Module Replacement (HMR) powered by native ES modules?",
                "Vite uses native ES modules in development to provide near-instant server start and lightning-fast HMR.",
                1, 6,
                List.of(
                        new OptionData("A", "Webpack 1", false),
                        new OptionData("B", "Vite", true),
                        new OptionData("C", "Grunt", false),
                        new OptionData("D", "Gulp", false)
                )
        );

        testRepository.save(test);
    }

    private void seedDatabaseTest(Category category) {
        MockTest test = MockTest.builder()
                .category(category)
                .title("SQL Queries & Relational Databases")
                .description("Test your skills in SQL queries, JOIN operations, aggregation, and database constraints.")
                .durationMinutes(6)
                .totalMarks(5)
                .passingMarks(3)
                .negativeMarks(0.25)
                .difficulty("EASY")
                .isActive(true)
                .questions(new ArrayList<>())
                .build();

        addQuestion(test,
                "Which SQL clause is used to filter records AFTER an aggregation operation (like GROUP BY)?",
                "HAVING filters groups created by GROUP BY, whereas WHERE filters individual rows before grouping.",
                1, 1,
                List.of(
                        new OptionData("A", "WHERE", false),
                        new OptionData("B", "HAVING", true),
                        new OptionData("C", "ORDER BY", false),
                        new OptionData("D", "FILTER", false)
                )
        );

        addQuestion(test,
                "What does the 'A' in ACID properties of relational databases stand for?",
                "Atomicity guarantees that all operations within a transaction succeed, or none are applied (all or nothing).",
                1, 2,
                List.of(
                        new OptionData("A", "Availability", false),
                        new OptionData("B", "Atomicity", true),
                        new OptionData("C", "Authenticity", false),
                        new OptionData("D", "Asynchronous", false)
                )
        );

        addQuestion(test,
                "Which JOIN returns all records from Table A and the matched records from Table B?",
                "LEFT JOIN (or LEFT OUTER JOIN) returns all records from the left table and matched rows from the right table.",
                1, 3,
                List.of(
                        new OptionData("A", "INNER JOIN", false),
                        new OptionData("B", "RIGHT JOIN", false),
                        new OptionData("C", "LEFT JOIN", true),
                        new OptionData("D", "CROSS JOIN", false)
                )
        );

        addQuestion(test,
                "What is the main benefit of creating a B-Tree index on a database column?",
                "Indexes speed up search and query retrieval times at the cost of slight overhead during INSERT/UPDATE operations.",
                1, 4,
                List.of(
                        new OptionData("A", "To encrypt table data", false),
                        new OptionData("B", "To significantly accelerate data retrieval queries (SELECT)", true),
                        new OptionData("C", "To compress the disk storage size", false),
                        new OptionData("D", "To prevent all duplicate records automatically", false)
                )
        );

        addQuestion(test,
                "Which command quickly empties a table by deallocating pages without logging individual row deletions?",
                "TRUNCATE is a DDL command that quickly removes all rows from a table without firing individual row-level delete triggers.",
                1, 5,
                List.of(
                        new OptionData("A", "DELETE FROM table", false),
                        new OptionData("B", "TRUNCATE TABLE table", true),
                        new OptionData("C", "DROP TABLE table", false),
                        new OptionData("D", "CLEAR TABLE table", false)
                )
        );

        testRepository.save(test);
    }

    private void seedJeeMainTest(Category category) {
        MockTest test = MockTest.builder()
                .category(category)
                .title("JEE Mains - PCM Speed & Accuracy Mock Test")
                .description("Timed mock test covering Physics, Chemistry, and Mathematics fundamentals based on recent JEE Main patterns.")
                .durationMinutes(15)
                .totalMarks(6)
                .passingMarks(4)
                .negativeMarks(0.25)
                .difficulty("HARD")
                .isActive(true)
                .questions(new ArrayList<>())
                .build();

        addQuestion(test,
                "What is the dimensional formula of Planck's constant (h)?",
                "From E = h * ν, [h] = [E] / [ν] = [M L^2 T^-2] / [T^-1] = [M L^2 T^-1].",
                1, 1,
                List.of(
                        new OptionData("A", "[M L^2 T^-1]", true),
                        new OptionData("B", "[M L^2 T^-2]", false),
                        new OptionData("C", "[M L T^-1]", false),
                        new OptionData("D", "[M L^0 T^-1]", false)
                )
        );

        addQuestion(test,
                "What is the value of lim(x -> 0) [sin(3x) / x]?",
                "lim(x -> 0) [sin(3x) / x] = 3 * lim(x -> 0) [sin(3x) / (3x)] = 3 * 1 = 3.",
                1, 2,
                List.of(
                        new OptionData("A", "0", false),
                        new OptionData("B", "1", false),
                        new OptionData("C", "3", true),
                        new OptionData("D", "Does not exist", false)
                )
        );

        addQuestion(test,
                "Which of the following organic compounds possesses an asymmetric (chiral) carbon and exhibits optical isomerism?",
                "2-Chlorobutane has a central carbon bonded to -H, -Cl, -CH3, and -C2H5 (four distinct groups), making it chiral.",
                1, 3,
                List.of(
                        new OptionData("A", "1-Chlorobutane", false),
                        new OptionData("B", "2-Chlorobutane", true),
                        new OptionData("C", "2-Chloropropane", false),
                        new OptionData("D", "Chloromethane", false)
                )
        );

        addQuestion(test,
                "At what angle of projection with the horizontal is the range of a projectile maximum on a flat plane?",
                "Horizontal range R = (u^2 * sin(2θ)) / g. The range is maximized when sin(2θ) = 1, which gives 2θ = 90°, so θ = 45°.",
                1, 4,
                List.of(
                        new OptionData("A", "30°", false),
                        new OptionData("B", "45°", true),
                        new OptionData("C", "60°", false),
                        new OptionData("D", "90°", false)
                )
        );

        addQuestion(test,
                "What is the hybridization and molecular geometry of ethyne (C2H2)?",
                "In ethyne (HC≡CH), each carbon forms one C-H single bond and one C≡C triple bond, corresponding to sp hybridization with linear geometry (180°).",
                1, 5,
                List.of(
                        new OptionData("A", "sp3 and tetrahedral", false),
                        new OptionData("B", "sp2 and trigonal planar", false),
                        new OptionData("C", "sp and linear", true),
                        new OptionData("D", "dsp2 and square planar", false)
                )
        );

        addQuestion(test,
                "If A and B are square matrices of the same order such that AB = BA, what property do they satisfy?",
                "When AB = BA, the two matrices are said to commute under multiplication.",
                1, 6,
                List.of(
                        new OptionData("A", "They commute under matrix multiplication", true),
                        new OptionData("B", "Both must be identity matrices", false),
                        new OptionData("C", "Their determinants must be zero", false),
                        new OptionData("D", "A is the inverse of B", false)
                )
        );

        testRepository.save(test);
    }

    private void seedMhcetTest(Category category) {
        MockTest test = MockTest.builder()
                .category(category)
                .title("MHCET - Engineering & Pharmacy Entrance Test")
                .description("Practice key Physics, Chemistry, and Mathematics questions tailored for the Maharashtra Common Entrance Test.")
                .durationMinutes(10)
                .totalMarks(5)
                .passingMarks(3)
                .negativeMarks(0.0)
                .difficulty("MEDIUM")
                .isActive(true)
                .questions(new ArrayList<>())
                .build();

        addQuestion(test,
                "What is the moment of inertia of a uniform circular disc of mass M and radius R about its transverse central axis?",
                "The moment of inertia of a uniform circular disc perpendicular to its plane and passing through its center is I = (1/2) * M * R^2.",
                1, 1,
                List.of(
                        new OptionData("A", "M * R^2", false),
                        new OptionData("B", "(1/2) * M * R^2", true),
                        new OptionData("C", "(1/4) * M * R^2", false),
                        new OptionData("D", "(2/5) * M * R^2", false)
                )
        );

        addQuestion(test,
                "What is the derivative of f(x) = e^(2x) * cos(x) with respect to x?",
                "Applying the product rule: d/dx[e^(2x) cos(x)] = 2 * e^(2x) * cos(x) - e^(2x) * sin(x) = e^(2x) * (2 cos(x) - sin(x)).",
                1, 2,
                List.of(
                        new OptionData("A", "e^(2x) * (2 cos(x) - sin(x))", true),
                        new OptionData("B", "e^(2x) * (cos(x) - sin(x))", false),
                        new OptionData("C", "2 * e^(2x) * cos(x)", false),
                        new OptionData("D", "-e^(2x) * sin(x)", false)
                )
        );

        addQuestion(test,
                "Which law states that at constant temperature, the solubility of a gas in a liquid is directly proportional to its partial pressure?",
                "Henry's law states that S = K_H * P, establishing the direct proportionality between gas solubility and partial pressure.",
                1, 3,
                List.of(
                        new OptionData("A", "Raoult's Law", false),
                        new OptionData("B", "Henry's Law", true),
                        new OptionData("C", "Boyle's Law", false),
                        new OptionData("D", "Dalton's Law", false)
                )
        );

        addQuestion(test,
                "In a step-up transformer, if the secondary turn count (Ns) exceeds the primary turn count (Np), how do secondary voltage (Vs) and current (Is) compare?",
                "In a step-up transformer, Vs / Vp = Ns / Np. When Ns > Np, voltage is stepped up (Vs > Vp) and current is stepped down (Is < Ip).",
                1, 4,
                List.of(
                        new OptionData("A", "Vs > Vp and Is < Ip", true),
                        new OptionData("B", "Vs < Vp and Is > Ip", false),
                        new OptionData("C", "Vs > Vp and Is > Ip", false),
                        new OptionData("D", "Vs < Vp and Is < Ip", false)
                )
        );

        addQuestion(test,
                "What is the value of the definite integral ∫[0 to π/2] cos(x) dx?",
                "The antiderivative of cos(x) is sin(x). Evaluated between 0 and π/2: sin(π/2) - sin(0) = 1 - 0 = 1.",
                1, 5,
                List.of(
                        new OptionData("A", "0", false),
                        new OptionData("B", "1", true),
                        new OptionData("C", "-1", false),
                        new OptionData("D", "π / 2", false)
                )
        );

        testRepository.save(test);
    }

    private void addQuestion(MockTest test, String text, String explanation, int marks, int orderIndex, List<OptionData> options) {
        Question q = Question.builder()
                .test(test)
                .questionText(text)
                .explanation(explanation)
                .marks(marks)
                .orderIndex(orderIndex)
                .options(new ArrayList<>())
                .build();

        for (OptionData opt : options) {
            QuestionOption option = QuestionOption.builder()
                    .question(q)
                    .optionKey(opt.key())
                    .optionText(opt.text())
                    .isCorrect(opt.isCorrect())
                    .build();
            q.getOptions().add(option);
        }

        test.getQuestions().add(q);
    }

    private void seedAssignedAliceTest(Category category, User alice) {
        MockTest test = MockTest.builder()
                .category(category)
                .title("Spring Cloud & Distributed Systems (Batch A)")
                .description("Specialized batch assessment covering Circuit Breakers, API Gateways, and Distributed Tracing. Assigned exclusively to selected candidates.")
                .durationMinutes(15)
                .totalMarks(4)
                .passingMarks(2)
                .negativeMarks(0.5)
                .difficulty("HARD")
                .isActive(true)
                .accessType(TestAccessType.ASSIGNED)
                .assignedUsers(new java.util.HashSet<>(java.util.List.of(alice)))
                .questions(new ArrayList<>())
                .build();

        addQuestion(test,
                "In a microservices architecture, which Resilience4j component helps prevent cascading failures when a downstream dependency is failing?",
                "The Circuit Breaker pattern opens to fail-fast and prevent recurring timeouts from overloading downstream services.",
                2, 1,
                List.of(
                        new OptionData("A", "RateLimiter", false),
                        new OptionData("B", "CircuitBreaker", true),
                        new OptionData("C", "Retry with infinite backoff", false),
                        new OptionData("D", "Bulkhead only", false)
                )
        );

        addQuestion(test,
                "What is the primary function of a distributed tracing ID (TraceId / SpanId) in Spring Cloud Micrometer Tracing?",
                "TraceId correlates log statements and spans across asynchronous service calls end-to-end.",
                2, 2,
                List.of(
                        new OptionData("A", "Encrypting payload data in transit", false),
                        new OptionData("B", "Correlating asynchronous requests across different microservices", true),
                        new OptionData("C", "Managing database connection pooling", false),
                        new OptionData("D", "Authenticating JWT tokens", false)
                )
        );

        testRepository.save(test);
    }

    private void seedAssignedBobTest(Category category, User bob) {
        MockTest test = MockTest.builder()
                .category(category)
                .title("PostgreSQL Query Optimization & EXPLAIN Deep Dive")
                .description("Targeted performance tuning exam focusing on query execution plans, indexing strategies, and buffer usage.")
                .durationMinutes(15)
                .totalMarks(4)
                .passingMarks(2)
                .negativeMarks(0.5)
                .difficulty("HARD")
                .isActive(true)
                .accessType(TestAccessType.ASSIGNED)
                .assignedUsers(new java.util.HashSet<>(java.util.List.of(bob)))
                .questions(new ArrayList<>())
                .build();

        addQuestion(test,
                "In PostgreSQL, which EXPLAIN option actually executes the query to return real runtimes and row counts?",
                "EXPLAIN ANALYZE actually executes the query, recording actual row counts and execution timing for each node.",
                2, 1,
                List.of(
                        new OptionData("A", "EXPLAIN VERBOSE", false),
                        new OptionData("B", "EXPLAIN (COSTS FALSE)", false),
                        new OptionData("C", "EXPLAIN ANALYZE", true),
                        new OptionData("D", "EXPLAIN FORMAT JSON", false)
                )
        );

        addQuestion(test,
                "Which index type in PostgreSQL is best suited for full-text search and array containment queries?",
                "GIN (Generalized Inverted Index) is optimized for composite values such as arrays, jsonb, and tsvector.",
                2, 2,
                List.of(
                        new OptionData("A", "Standard B-Tree Index", false),
                        new OptionData("B", "GIN (Generalized Inverted Index)", true),
                        new OptionData("C", "Hash Index", false),
                        new OptionData("D", "BRIN Index", false)
                )
        );

        testRepository.save(test);
    }

    private record OptionData(String key, String text, boolean isCorrect) {}
}
