package com.mocktest.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateQuestionRequest(
        @NotBlank String questionText,
        String explanation,
        @NotNull Integer marks,
        Integer orderIndex,
        @NotEmpty List<CreateOptionRequest> options
) {}
