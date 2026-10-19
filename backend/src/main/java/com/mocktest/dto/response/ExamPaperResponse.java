package com.mocktest.dto.response;

import java.util.List;

public record ExamPaperResponse(
        Long testId,
        String testTitle,
        String categoryName,
        Integer durationMinutes,
        Integer totalMarks,
        Integer passingMarks,
        Double negativeMarks,
        List<ExamQuestionDto> questions
) {}
