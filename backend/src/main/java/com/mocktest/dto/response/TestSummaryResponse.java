package com.mocktest.dto.response;

public record TestSummaryResponse(
        Long id,
        Long categoryId,
        String categoryName,
        String title,
        String description,
        Integer durationMinutes,
        Integer totalMarks,
        Integer passingMarks,
        Double negativeMarks,
        String difficulty,
        int totalQuestions
) {}
