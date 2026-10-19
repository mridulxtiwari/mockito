package com.mocktest.service;

import com.mocktest.dto.request.CreateOptionRequest;
import com.mocktest.dto.request.CreateQuestionRequest;
import com.mocktest.dto.request.CreateTestRequest;
import com.mocktest.dto.response.*;
import com.mocktest.entity.*;
import com.mocktest.exception.BadRequestException;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.repository.CategoryRepository;
import com.mocktest.repository.MockTestRepository;
import com.mocktest.repository.QuestionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TestService {

    private final CategoryRepository categoryRepository;
    private final MockTestRepository testRepository;
    private final QuestionRepository questionRepository;

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
        List<MockTest> tests = (categoryId != null)
                ? testRepository.findByCategoryIdAndIsActiveTrue(categoryId)
                : testRepository.findByIsActiveTrue();

        return tests.stream().map(this::mapToSummary).toList();
    }

    @Transactional(readOnly = true)
    public TestSummaryResponse getTestSummary(Long testId) {
        MockTest test = testRepository.findByIdWithCategory(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));
        return mapToSummary(test);
    }

    @Transactional(readOnly = true)
    public ExamPaperResponse startExam(Long testId) {
        MockTest test = testRepository.findByIdWithCategory(testId)
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + testId));

        if (!Boolean.TRUE.equals(test.getIsActive())) {
            throw new BadRequestException("This test is currently inactive.");
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

        MockTest test = MockTest.builder()
                .category(category)
                .title(request.title())
                .description(request.description())
                .durationMinutes(request.durationMinutes())
                .passingMarks(request.passingMarks())
                .negativeMarks(request.negativeMarks() != null ? request.negativeMarks() : 0.0)
                .difficulty(request.difficulty() != null ? request.difficulty() : "MEDIUM")
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
        return mapToSummary(saved);
    }

    @Transactional
    public void deleteTest(Long testId) {
        if (!testRepository.existsById(testId)) {
            throw new ResourceNotFoundException("Test not found with id: " + testId);
        }
        testRepository.deleteById(testId);
    }

    private TestSummaryResponse mapToSummary(MockTest test) {
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
                test.getQuestions() != null ? test.getQuestions().size() : 0
        );
    }
}
