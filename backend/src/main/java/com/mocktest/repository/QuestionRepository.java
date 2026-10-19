package com.mocktest.repository;

import com.mocktest.entity.Question;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuestionRepository extends JpaRepository<Question, Long> {
    @Query("SELECT DISTINCT q FROM Question q LEFT JOIN FETCH q.options WHERE q.test.id = :testId ORDER BY q.orderIndex ASC")
    List<Question> findByTestIdWithOptions(@Param("testId") Long testId);
}
