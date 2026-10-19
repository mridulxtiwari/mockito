package com.mocktest.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record CreateOptionRequest(
        @NotBlank String optionKey,
        @NotBlank String optionText,
        boolean isCorrect
) {}
