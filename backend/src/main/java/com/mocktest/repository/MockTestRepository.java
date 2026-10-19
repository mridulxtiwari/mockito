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
    List<MockTest> findByIsActiveTrue();
    List<MockTest> findByCategoryIdAndIsActiveTrue(Long categoryId);

    @Query("SELECT t FROM MockTest t LEFT JOIN FETCH t.category WHERE t.id = :id")
    Optional<MockTest> findByIdWithCategory(@Param("id") Long id);
}
