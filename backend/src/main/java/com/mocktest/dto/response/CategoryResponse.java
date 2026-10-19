package com.mocktest.dto.response;

public record CategoryResponse(
        Long id,
        String name,
        String description,
        String icon,
        int totalTests
) {}
