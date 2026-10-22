package com.mocktest.dto.response;

public record UserDto(
        Long id,
        String fullName,
        String email,
        String role
) {}
