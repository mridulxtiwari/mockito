package com.mocktest.controller;

import com.mocktest.dto.request.CreateTestRequest;
import com.mocktest.dto.request.UpdateEnrollmentRequest;
import com.mocktest.dto.response.ApiResponse;
import com.mocktest.dto.response.ExamPaperResponse;
import com.mocktest.dto.response.TestSummaryResponse;
import com.mocktest.dto.response.UserDto;
import com.mocktest.service.TestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tests")
@RequiredArgsConstructor
public class TestController {

    private final TestService testService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<TestSummaryResponse>>> getAllTests(
            @RequestParam(required = false) Long categoryId
    ) {
        List<TestSummaryResponse> tests = testService.getAllTests(categoryId);
        return ResponseEntity.ok(ApiResponse.ok(tests));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TestSummaryResponse>> getTestSummary(@PathVariable Long id) {
        TestSummaryResponse summary = testService.getTestSummary(id);
        return ResponseEntity.ok(ApiResponse.ok(summary));
    }

    @GetMapping("/{id}/start")
    public ResponseEntity<ApiResponse<ExamPaperResponse>> startExam(@PathVariable Long id) {
        ExamPaperResponse examPaper = testService.startExam(id);
        return ResponseEntity.ok(ApiResponse.ok(examPaper, "Exam started successfully"));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TestSummaryResponse>> createTest(@Valid @RequestBody CreateTestRequest request) {
        TestSummaryResponse created = testService.createTest(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok(created, "Test created successfully"));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteTest(@PathVariable Long id) {
        testService.deleteTest(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Test deleted successfully"));
    }

    @GetMapping("/{id}/assigned-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<List<UserDto>>> getAssignedUsers(@PathVariable Long id) {
        List<UserDto> users = testService.getAssignedUsersForTest(id);
        return ResponseEntity.ok(ApiResponse.ok(users));
    }

    @PutMapping("/{id}/assigned-users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<TestSummaryResponse>> updateEnrollment(
            @PathVariable Long id,
            @Valid @RequestBody UpdateEnrollmentRequest request
    ) {
        TestSummaryResponse updated = testService.updateTestEnrollment(id, request);
        return ResponseEntity.ok(ApiResponse.ok(updated, "Enrollment updated successfully"));
    }
}
