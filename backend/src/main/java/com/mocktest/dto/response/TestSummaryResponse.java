package com.mocktest.dto.response;

import com.mocktest.entity.TestAccessType;

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
        int totalQuestions,
        TestAccessType accessType,
        boolean isAssignedToCurrentUser,
        int assignedUserCount
) {}
