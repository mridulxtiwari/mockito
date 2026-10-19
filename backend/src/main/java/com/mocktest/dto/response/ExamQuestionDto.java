package com.mocktest.dto.response;

import java.util.List;

public record ExamQuestionDto(
        Long id,
        String questionText,
        Integer marks,
        Integer orderIndex,
        List<ExamOptionDto> options
) {}
