package com.mocktest.controller;

import com.mocktest.dto.response.ApiResponse;
import com.mocktest.dto.response.CategoryResponse;
import com.mocktest.service.TestService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final TestService testService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getAllCategories() {
        List<CategoryResponse> categories = testService.getAllCategories();
        return ResponseEntity.ok(ApiResponse.ok(categories));
    }
}
