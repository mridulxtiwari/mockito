package com.mocktest.controller;

import com.mocktest.dto.request.SubmitExamRequest;
import com.mocktest.dto.response.ApiResponse;
import com.mocktest.dto.response.AttemptHistoryResponse;
import com.mocktest.dto.response.ExamResultResponse;
import com.mocktest.service.ExamEvaluationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/attempts")
@RequiredArgsConstructor
public class AttemptController {

    private final ExamEvaluationService evaluationService;

    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<ExamResultResponse>> submitExam(
            @Valid @RequestBody SubmitExamRequest request
    ) {
        ExamResultResponse result = evaluationService.evaluateAndSubmit(request);
        return ResponseEntity.ok(ApiResponse.ok(result, "Exam submitted and evaluated successfully"));
    }

    @GetMapping("/{id}/result")
    public ResponseEntity<ApiResponse<ExamResultResponse>> getAttemptResult(@PathVariable Long id) {
        ExamResultResponse result = evaluationService.getAttemptResult(id);
        return ResponseEntity.ok(ApiResponse.ok(result));
    }

    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<AttemptHistoryResponse>>> getAttemptHistory() {
        List<AttemptHistoryResponse> attempts = evaluationService.getAllAttempts();
        return ResponseEntity.ok(ApiResponse.ok(attempts));
    }
}
