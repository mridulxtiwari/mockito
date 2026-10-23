package com.mocktest.service;

import com.mocktest.dto.request.CreateOptionRequest;
import com.mocktest.dto.request.CreateQuestionRequest;
import com.mocktest.dto.request.CreateTestRequest;
import com.mocktest.dto.request.UpdateEnrollmentRequest;
import com.mocktest.dto.response.*;
import com.mocktest.entity.*;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.repository.CategoryRepository;
import com.mocktest.repository.MockTestRepository;
import com.mocktest.repository.QuestionRepository;
import com.mocktest.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class TestService {

    private final CategoryRepository categoryRepository;
    private final MockTestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllCategories() {
        return categoryRepository.findAll().stream()
                .map(cat -> new CategoryResponse(
                        cat.getId(),
                        cat.getName(),
                        cat.getDescription(),
                        cat.getIcon(),
                        cat.getTests() != null ? cat.getTests().size() : 0
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<TestSummaryResponse> getAllTests(Long categoryId) {
        User currentUser = getCurrentAuthenticatedUser();

        List<MockTest> tests;
        if (currentUser != null && currentUser.getRole() == Role.ROLE_ADMIN) {
            // Admin sees all tests (Common + all Assigned tests)
            tests = (categoryId != null)
                    ? testRepository.findAllActiveWithCategoryAndCategoryId(categoryId)
                    : testRepository.findAllActiveWithCategory();
        } else if (currentUser != null) {
            // Logged-in student sees Common tests + tests specifically assigned to them
            tests = (categoryId != null)
                    ? testRepository.findAccessibleTestsForUserAndCategory(currentUser.getId(), categoryId)
                    : testRepository.findAccessibleTestsForUser(currentUser.getId());
        } else {
            // Unauthenticated guest sees only Common/Generic tests
            tests = (categoryId != null)
                    ? testRepository.findCommonTestsByCategory(categoryId)
                    : testRepository.findCommonTests();
        }

        return tests.stream().map(test -> mapToSummary(test, currentUser)).toList();
    }

    @Transactional(readOnly = true)
    public TestSummaryResponse getTestSummary(Long testId) {
        MockTest test = testRepository.findByIdWithCategoryAndAssignedUsers(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        User currentUser = getCurrentAuthenticatedUser();

        if (test.getAccessType() == TestAccessType.ASSIGNED) {
            validateAccessToAssignedTest(test, currentUser);
        }

        return mapToSummary(test, currentUser);
    }

    @Transactional(readOnly = true)
    public ExamPaperResponse startExam(Long testId) {
        MockTest test = testRepository.findByIdWithCategoryAndAssignedUsers(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        if (!Boolean.TRUE.equals(test.getIsActive())) {
            throw new BadRequestException("This test is currently inactive.");
        }

        User currentUser = getCurrentAuthenticatedUser();

        if (test.getAccessType() == TestAccessType.ASSIGNED) {
            validateAccessToAssignedTest(test, currentUser);
        }

        List<Question> questions = questionRepository.findByTestIdWithOptions(testId);

        List<ExamQuestionDto> questionDtos = questions.stream()
                .map(q -> {
                    List<ExamOptionDto> optionDtos = q.getOptions().stream()
                            .map(o -> new ExamOptionDto(o.getId(), o.getOptionKey(), o.getOptionText()))
                            .toList();

                    return new ExamQuestionDto(
                            q.getId(),
                            q.getQuestionText(),
                            q.getMarks(),
                            q.getOrderIndex(),
                            optionDtos
                    );
                })
                .toList();

        return new ExamPaperResponse(
                test.getId(),
                test.getTitle(),
                test.getCategory().getName(),
                test.getDurationMinutes(),
                test.getTotalMarks(),
                test.getPassingMarks(),
                test.getNegativeMarks(),
                questionDtos
        );
    }

    @Transactional
    public TestSummaryResponse createTest(CreateTestRequest request) {
        Category category = categoryRepository.findById(request.categoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found with id: " + request.categoryId()));

        TestAccessType accessType = request.accessType() != null ? request.accessType() : TestAccessType.COMMON;
        Set<User> assignedUsers = new HashSet<>();

        if (accessType == TestAccessType.ASSIGNED && request.assignedUserIds() != null && !request.assignedUserIds().isEmpty()) {
            List<User> foundUsers = userRepository.findAllById(request.assignedUserIds());
            assignedUsers.addAll(foundUsers);
        }

        MockTest test = MockTest.builder()
                .category(category)
                .title(request.title())
                .description(request.description())
                .durationMinutes(request.durationMinutes())
                .passingMarks(request.passingMarks())
                .negativeMarks(request.negativeMarks() != null ? request.negativeMarks() : 0.0)
                .difficulty(request.difficulty() != null ? request.difficulty() : "MEDIUM")
                .accessType(accessType)
                .assignedUsers(assignedUsers)
                .isActive(true)
                .totalMarks(0)
                .questions(new ArrayList<>())
                .build();

        int computedTotalMarks = 0;

        if (request.questions() != null && !request.questions().isEmpty()) {
            int order = 1;
            for (CreateQuestionRequest qReq : request.questions()) {
                Question question = Question.builder()
                        .test(test)
                        .questionText(qReq.questionText())
                        .explanation(qReq.explanation())
                        .marks(qReq.marks() != null ? qReq.marks() : 1)
                        .orderIndex(order++)
                        .options(new ArrayList<>())
                        .build();

                computedTotalMarks += question.getMarks();

                for (CreateOptionRequest optReq : qReq.options()) {
                    QuestionOption option = QuestionOption.builder()
                            .question(question)
                            .optionKey(optReq.optionKey())
                            .optionText(optReq.optionText())
                            .isCorrect(optReq.isCorrect())
                            .build();
                    question.getOptions().add(option);
                }

                test.getQuestions().add(question);
            }
        }

        test.setTotalMarks(computedTotalMarks > 0 ? computedTotalMarks : request.passingMarks());
        MockTest saved = testRepository.save(test);
        User currentUser = getCurrentAuthenticatedUser();
        return mapToSummary(saved, currentUser);
    }

    @Transactional
    public void deleteTest(Long testId) {
        if (!testRepository.existsById(testId)) {
            throw new ResourceNotFoundException("Test not found with id: " + testId);
        }
        testRepository.deleteById(testId);
    }

    @Transactional(readOnly = true)
    public List<UserDto> getAssignedUsersForTest(Long testId) {
        MockTest test = testRepository.findByIdWithCategoryAndAssignedUsers(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));
        if (test.getAssignedUsers() == null) {
            return List.of();
        }
        return test.getAssignedUsers().stream()
                .map(u -> new UserDto(u.getId(), u.getFullName(), u.getEmail(), u.getRole().name()))
                .toList();
    }

    @Transactional
    public TestSummaryResponse updateTestEnrollment(Long testId, UpdateEnrollmentRequest request) {
        MockTest test = testRepository.findByIdWithCategoryAndAssignedUsers(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        if (request.accessType() != null) {
            test.setAccessType(request.accessType());
        }

        if (test.getAccessType() == TestAccessType.COMMON) {
            test.getAssignedUsers().clear();
        } else if (request.assignedUserIds() != null) {
            List<User> students = userRepository.findAllById(request.assignedUserIds());
            test.setAssignedUsers(new HashSet<>(students));
        }

        MockTest saved = testRepository.save(test);
        return mapToSummary(saved, getCurrentAuthenticatedUser());
    }

    private void validateAccessToAssignedTest(MockTest test, User currentUser) {
        if (currentUser == null) {
            throw new AccessDeniedException("Authentication required: This test is restricted to assigned students.");
        }
        boolean isAdmin = currentUser.getRole() == Role.ROLE_ADMIN;
        boolean isAssigned = test.getAssignedUsers() != null &&
                test.getAssignedUsers().stream().anyMatch(u -> u.getId().equals(currentUser.getId()));

        if (!isAdmin && !isAssigned) {
            throw new AccessDeniedException("Access denied: You are not assigned to take this test.");
        }
    }

    private User getCurrentAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof User user) {
            return user;
        }
        return null;
    }

    private TestSummaryResponse mapToSummary(MockTest test, User currentUser) {
        boolean isAssignedToCurrentUser = false;
        if (currentUser != null && test.getAccessType() == TestAccessType.ASSIGNED) {
            isAssignedToCurrentUser = test.getAssignedUsers() != null &&
                    test.getAssignedUsers().stream().anyMatch(u -> u.getId().equals(currentUser.getId()));
        }
        int assignedCount = test.getAssignedUsers() != null ? test.getAssignedUsers().size() : 0;

        return new TestSummaryResponse(
                test.getId(),
                test.getCategory().getId(),
                test.getCategory().getName(),
                test.getTitle(),
                test.getDescription(),
                test.getDurationMinutes(),
                test.getTotalMarks(),
                test.getPassingMarks(),
                test.getNegativeMarks(),
                test.getDifficulty(),
                test.getQuestions() != null ? test.getQuestions().size() : 0,
                test.getAccessType(),
                isAssignedToCurrentUser,
                assignedCount
        );
    }
}
