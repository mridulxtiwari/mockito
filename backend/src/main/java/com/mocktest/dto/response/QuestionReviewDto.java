package com.mocktest.dto.response;

import java.util.List;

public record QuestionReviewDto(
        Long questionId,
        String questionText,
        String explanation,
        Integer marks,
        Integer orderIndex,
        Long userSelectedOptionId,
        Long correctOptionId,
        Boolean isCorrect,
        Boolean isAttempted,
        List<OptionReviewDto> options
) {}
