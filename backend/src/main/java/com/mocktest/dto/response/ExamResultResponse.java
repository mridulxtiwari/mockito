package com.mocktest.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record ExamResultResponse(
        Long attemptId,
        Long testId,
        String testTitle,
        String candidateName,
        Double score,
        Double percentage,
        Integer totalMarks,
        Integer passingMarks,
        Boolean passed,
        Integer totalQuestions,
        Integer correctAnswers,
        Integer wrongAnswers,
        Integer unattempted,
        Double accuracy,
        Integer timeTakenSeconds,
        String status,
        LocalDateTime submittedAt,
        List<QuestionReviewDto> review
) {}
