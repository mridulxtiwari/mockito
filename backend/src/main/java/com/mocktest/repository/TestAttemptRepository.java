package com.mocktest.repository;

import com.mocktest.entity.TestAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestAttemptRepository extends JpaRepository<TestAttempt, Long> {
    List<TestAttempt> findByTestIdOrderBySubmittedAtDesc(Long testId);
    List<TestAttempt> findAllByOrderBySubmittedAtDesc();

    @Query("SELECT a FROM TestAttempt a JOIN FETCH a.test t LEFT JOIN FETCH t.category ORDER BY a.submittedAt DESC")
    List<TestAttempt> findAllWithTestAndCategoryOrderBySubmittedAtDesc();

    @Query("SELECT DISTINCT a FROM TestAttempt a LEFT JOIN FETCH a.answers WHERE a.id = :id")
    Optional<TestAttempt> findByIdWithAnswers(@Param("id") Long id);
}
