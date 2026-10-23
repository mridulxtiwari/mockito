package com.mocktest.repository;

import com.mocktest.entity.MockTest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MockTestRepository extends JpaRepository<MockTest, Long> {

    @Query("SELECT DISTINCT t FROM MockTest t LEFT JOIN FETCH t.category WHERE t.isActive = true ORDER BY t.createdAt DESC")
    List<MockTest> findAllActiveWithCategory();

    @Query("SELECT DISTINCT t FROM MockTest t LEFT JOIN FETCH t.category WHERE t.isActive = true AND t.category.id = :categoryId ORDER BY t.createdAt DESC")
    List<MockTest> findAllActiveWithCategoryAndCategoryId(@Param("categoryId") Long categoryId);

    @Query("SELECT DISTINCT t FROM MockTest t " +
            "LEFT JOIN FETCH t.category " +
            "LEFT JOIN t.assignedUsers u " +
            "WHERE t.isActive = true AND (t.accessType = com.mocktest.entity.TestAccessType.COMMON OR u.id = :userId) " +
            "ORDER BY t.createdAt DESC")
    List<MockTest> findAccessibleTestsForUser(@Param("userId") Long userId);

    @Query("SELECT DISTINCT t FROM MockTest t " +
            "LEFT JOIN FETCH t.category " +
            "LEFT JOIN t.assignedUsers u " +
            "WHERE t.isActive = true AND t.category.id = :categoryId AND (t.accessType = com.mocktest.entity.TestAccessType.COMMON OR u.id = :userId) " +
            "ORDER BY t.createdAt DESC")
    List<MockTest> findAccessibleTestsForUserAndCategory(@Param("userId") Long userId, @Param("categoryId") Long categoryId);

    @Query("SELECT DISTINCT t FROM MockTest t " +
            "LEFT JOIN FETCH t.category " +
            "WHERE t.isActive = true AND t.accessType = com.mocktest.entity.TestAccessType.COMMON " +
            "ORDER BY t.createdAt DESC")
    List<MockTest> findCommonTests();

    @Query("SELECT DISTINCT t FROM MockTest t " +
            "LEFT JOIN FETCH t.category " +
            "WHERE t.isActive = true AND t.category.id = :categoryId AND t.accessType = com.mocktest.entity.TestAccessType.COMMON " +
            "ORDER BY t.createdAt DESC")
    List<MockTest> findCommonTestsByCategory(@Param("categoryId") Long categoryId);

    @Query("SELECT t FROM MockTest t LEFT JOIN FETCH t.category WHERE t.id = :id")
    Optional<MockTest> findByIdWithCategory(@Param("id") Long id);

    @Query("SELECT t FROM MockTest t LEFT JOIN FETCH t.category LEFT JOIN FETCH t.assignedUsers WHERE t.id = :id")
    Optional<MockTest> findByIdWithCategoryAndAssignedUsers(@Param("id") Long id);

    List<MockTest> findByAccessType(com.mocktest.entity.TestAccessType accessType);
}
