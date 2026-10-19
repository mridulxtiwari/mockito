package com.mocktest.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateTestRequest(
        @NotNull Long categoryId,
        @NotBlank String title,
        String description,
        @NotNull Integer durationMinutes,
        @NotNull Integer passingMarks,
        Double negativeMarks,
        String difficulty,
        List<CreateQuestionRequest> questions
) {}
