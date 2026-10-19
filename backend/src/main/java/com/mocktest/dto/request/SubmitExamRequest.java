package com.mocktest.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record SubmitExamRequest(
        @NotNull(message = "testId is required")
        Long testId,

        String candidateName,

        String candidateEmail,

        Integer timeTakenSeconds,

        Boolean timedOut,

        // Map of questionId -> selectedOptionId
        Map<Long, Long> answers
) {}
