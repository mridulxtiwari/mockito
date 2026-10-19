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

    @Override
    public void run(String... args) {
        if (categoryRepository.count() > 0) {
            log.info("Database already seeded. Skipping initial data load.");
            return;
        }

        log.info("Seeding initial mock test data...");

        // 1. Categories
        Category javaCategory = Category.builder()
                .name("Java & Spring Boot")
                .description("Core Java, concurrency, Spring Framework, Spring Boot 3, and microservices architecture.")
                .icon("☕")
                .build();

        Category reactCategory = Category.builder()
                .name("React & Frontend")
                .description("Modern React, hooks, state patterns, JavaScript ES6+, and responsive UI development.")
                .icon("⚛️")
                .build();

        Category dbCategory = Category.builder()
                .name("Databases & SQL")
                .description("Relational data modeling, indexing, SQL queries, transactions, and ACID principles.")
                .icon("🗄️")
                .build();

        categoryRepository.saveAll(List.of(javaCategory, reactCategory, dbCategory));

        // 2. Tests & Questions
        seedJavaTest(javaCategory);
        seedReactTest(reactCategory);
        seedDatabaseTest(dbCategory);

        log.info("Mock test data seeded successfully!");
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

    private record OptionData(String key, String text, boolean isCorrect) {}
}
