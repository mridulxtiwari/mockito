package com.mocktest.dto.request;

import com.mocktest.entity.TestAccessType;
import java.util.List;

public record UpdateEnrollmentRequest(
        TestAccessType accessType,
        List<Long> assignedUserIds
) {}
