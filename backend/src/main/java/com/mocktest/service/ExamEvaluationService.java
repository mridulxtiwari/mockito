package com.mocktest.service;

import com.mocktest.dto.request.SubmitExamRequest;
import com.mocktest.dto.response.ExamResultResponse;
import com.mocktest.dto.response.OptionReviewDto;
import com.mocktest.dto.response.QuestionReviewDto;
import com.mocktest.entity.*;
import com.mocktest.exception.ResourceNotFoundException;
import com.mocktest.repository.MockTestRepository;
import com.mocktest.repository.QuestionRepository;
import com.mocktest.repository.TestAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class ExamEvaluationService {

    private final MockTestRepository testRepository;
    private final QuestionRepository questionRepository;
    private final TestAttemptRepository attemptRepository;

    @Transactional
    public ExamResultResponse evaluateAndSubmit(SubmitExamRequest request) {
        MockTest test = testRepository.findByIdWithCategory(request.testId())
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + request.testId()));

        List<Question> questions = questionRepository.findByTestIdWithOptions(request.testId());

        Map<Long, Long> answersMap = request.answers() != null ? request.answers() : Collections.emptyMap();

        int correctCount = 0;
        int wrongCount = 0;
        int unattemptedCount = 0;
        double totalScore = 0.0;

        List<QuestionReviewDto> reviewList = new ArrayList<>();

        for (Question q : questions) {
            Long selectedOptionId = answersMap.get(q.getId());

            QuestionOption correctOption = q.getOptions().stream()
                    .filter(QuestionOption::getIsCorrect)
                    .findFirst()
                    .orElse(null);

            Long correctOptionId = correctOption != null ? correctOption.getId() : null;
            boolean isAttempted = (selectedOptionId != null);
            boolean isCorrect = isAttempted && Objects.equals(selectedOptionId, correctOptionId);

            if (!isAttempted) {
                unattemptedCount++;
            } else if (isCorrect) {
                correctCount++;
                totalScore += q.getMarks();
            } else {
                wrongCount++;
                if (test.getNegativeMarks() != null && test.getNegativeMarks() > 0) {
                    totalScore -= test.getNegativeMarks();
                }
            }

            List<OptionReviewDto> optionReviewDtos = q.getOptions().stream()
                    .map(opt -> new OptionReviewDto(
                            opt.getId(),
                            opt.getOptionKey(),
                            opt.getOptionText(),
                            opt.getIsCorrect(),
                            Objects.equals(opt.getId(), selectedOptionId)
                    ))
                    .toList();

            reviewList.add(new QuestionReviewDto(
                    q.getId(),
                    q.getQuestionText(),
                    q.getExplanation(),
                    q.getMarks(),
                    q.getOrderIndex(),
                    selectedOptionId,
                    correctOptionId,
                    isCorrect,
                    isAttempted,
                    optionReviewDtos
            ));
        }

        // Prevent negative total scores
        if (totalScore < 0.0) {
            totalScore = 0.0;
        }

        int totalQuestions = questions.size();
        int totalMarks = test.getTotalMarks() > 0 ? test.getTotalMarks() : totalQuestions;
        double percentage = (totalScore / (double) totalMarks) * 100.0;
        percentage = Math.round(percentage * 100.0) / 100.0;

        boolean passed = totalScore >= test.getPassingMarks();
        int totalAnswered = correctCount + wrongCount;
        double accuracy = totalAnswered > 0
                ? Math.round(((double) correctCount / totalAnswered) * 100.0 * 10.0) / 10.0
                : 0.0;

        String candidateName = (request.candidateName() != null && !request.candidateName().isBlank())
                ? request.candidateName()
                : "Guest Candidate";

        TestAttempt attempt = TestAttempt.builder()
                .test(test)
                .candidateName(candidateName)
                .candidateEmail(request.candidateEmail())
                .score(totalScore)
                .percentage(percentage)
                .passed(passed)
                .totalQuestions(totalQuestions)
                .correctAnswers(correctCount)
                .wrongAnswers(wrongCount)
                .unattempted(unattemptedCount)
                .timeTakenSeconds(request.timeTakenSeconds() != null ? request.timeTakenSeconds() : 0)
                .status(Boolean.TRUE.equals(request.timedOut()) ? "TIMED_OUT" : "SUBMITTED")
                .submittedAt(LocalDateTime.now())
                .answers(new ArrayList<>())
                .build();

        for (QuestionReviewDto reviewItem : reviewList) {
            Question qRef = questions.stream()
                    .filter(q -> q.getId().equals(reviewItem.questionId()))
                    .findFirst()
                    .orElse(null);

            AttemptAnswer ans = AttemptAnswer.builder()
                    .attempt(attempt)
                    .question(qRef)
                    .selectedOptionId(reviewItem.userSelectedOptionId())
                    .isCorrect(reviewItem.isCorrect())
                    .build();
            attempt.getAnswers().add(ans);
        }

        TestAttempt savedAttempt = attemptRepository.save(attempt);

        return new ExamResultResponse(
                savedAttempt.getId(),
                test.getId(),
                test.getTitle(),
                savedAttempt.getCandidateName(),
                savedAttempt.getScore(),
                savedAttempt.getPercentage(),
                test.getTotalMarks(),
                test.getPassingMarks(),
                savedAttempt.getPassed(),
                savedAttempt.getTotalQuestions(),
                savedAttempt.getCorrectAnswers(),
                savedAttempt.getWrongAnswers(),
                savedAttempt.getUnattempted(),
                accuracy,
                savedAttempt.getTimeTakenSeconds(),
                savedAttempt.getStatus(),
                savedAttempt.getSubmittedAt(),
                reviewList
        );
    }

    @Transactional(readOnly = true)
    public ExamResultResponse getAttemptResult(Long attemptId) {
        TestAttempt attempt = attemptRepository.findByIdWithAnswers(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt not found with id: " + attemptId));

        MockTest test = testRepository.findByIdWithCategory(attempt.getTest().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Test not found with id: " + attempt.getTest().getId()));

        List<Question> questions = questionRepository.findByTestIdWithOptions(test.getId());

        Map<Long, Long> selectedMap = new HashMap<>();
        if (attempt.getAnswers() != null) {
            for (AttemptAnswer ans : attempt.getAnswers()) {
                if (ans.getQuestion() != null) {
                    selectedMap.put(ans.getQuestion().getId(), ans.getSelectedOptionId());
                }
            }
        }

        List<QuestionReviewDto> reviewList = new ArrayList<>();
        for (Question q : questions) {
            Long selectedOptionId = selectedMap.get(q.getId());

            QuestionOption correctOption = q.getOptions().stream()
                    .filter(QuestionOption::getIsCorrect)
                    .findFirst()
                    .orElse(null);

            Long correctOptionId = correctOption != null ? correctOption.getId() : null;
            boolean isAttempted = (selectedOptionId != null);
            boolean isCorrect = isAttempted && Objects.equals(selectedOptionId, correctOptionId);

            List<OptionReviewDto> optionReviewDtos = q.getOptions().stream()
                    .map(opt -> new OptionReviewDto(
                            opt.getId(),
                            opt.getOptionKey(),
                            opt.getOptionText(),
                            opt.getIsCorrect(),
                            Objects.equals(opt.getId(), selectedOptionId)
                    ))
                    .toList();

            reviewList.add(new QuestionReviewDto(
                    q.getId(),
                    q.getQuestionText(),
                    q.getExplanation(),
                    q.getMarks(),
                    q.getOrderIndex(),
                    selectedOptionId,
                    correctOptionId,
                    isCorrect,
                    isAttempted,
                    optionReviewDtos
            ));
        }

        int totalAnswered = attempt.getCorrectAnswers() + attempt.getWrongAnswers();
        double accuracy = totalAnswered > 0
                ? Math.round(((double) attempt.getCorrectAnswers() / totalAnswered) * 100.0 * 10.0) / 10.0
                : 0.0;

        return new ExamResultResponse(
                attempt.getId(),
                test.getId(),
                test.getTitle(),
                attempt.getCandidateName(),
                attempt.getScore(),
                attempt.getPercentage(),
                test.getTotalMarks(),
                test.getPassingMarks(),
                attempt.getPassed(),
                attempt.getTotalQuestions(),
                attempt.getCorrectAnswers(),
                attempt.getWrongAnswers(),
                attempt.getUnattempted(),
                accuracy,
                attempt.getTimeTakenSeconds(),
                attempt.getStatus(),
                attempt.getSubmittedAt(),
                reviewList
        );
    }

    @Transactional(readOnly = true)
    public List<TestAttempt> getAllAttempts() {
        return attemptRepository.findAllByOrderBySubmittedAtDesc();
    }
}
