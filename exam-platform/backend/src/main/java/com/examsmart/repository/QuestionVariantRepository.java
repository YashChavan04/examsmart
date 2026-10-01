package com.examsmart.repository;

import com.examsmart.model.QuestionVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface QuestionVariantRepository extends JpaRepository<QuestionVariant, UUID> {
    List<QuestionVariant> findByExamAttemptIdOrderByQuestionOrderAsc(UUID attemptId);
}
