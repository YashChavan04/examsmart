package com.examsmart.repository;

import com.examsmart.model.StudentAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StudentAnswerRepository extends JpaRepository<StudentAnswer, UUID> {
    List<StudentAnswer> findByAttemptId(UUID attemptId);
    Optional<StudentAnswer> findByAttemptIdAndVariantId(UUID attemptId, UUID variantId);
}
