package com.mocktest.dto.response;

public record OptionReviewDto(
        Long id,
        String optionKey,
        String optionText,
        Boolean isCorrect,
        Boolean isSelected
) {}
