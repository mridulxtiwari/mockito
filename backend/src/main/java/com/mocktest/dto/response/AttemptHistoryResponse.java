package com.mocktest.dto.response;

import java.time.LocalDateTime;

public record AttemptHistoryResponse(
        Long id,
        Long testId,
        String testTitle,
        String categoryName,
        String candidateName,
        String candidateEmail,
        Double score,
        Double percentage,
        Boolean passed,
        Integer totalQuestions,
        Integer correctAnswers,
        Integer wrongAnswers,
        Integer unattempted,
        Integer timeTakenSeconds,
        String status,
        LocalDateTime submittedAt
) {}
