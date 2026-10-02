package com.examsmart.repository;

import com.examsmart.model.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, UUID> {
    List<ExamAttempt> findByExamId(UUID examId);
    Optional<ExamAttempt> findByExamIdAndStudentId(UUID examId, UUID studentId);
    List<ExamAttempt> findByStudentIdAndStatus(UUID studentId, String status);
    Optional<ExamAttempt> findFirstByStudentIdAndStatusOrderByStartedAtDesc(UUID studentId, String status);
}
