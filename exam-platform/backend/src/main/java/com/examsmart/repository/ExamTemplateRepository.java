package com.examsmart.repository;

import com.examsmart.model.ExamTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface ExamTemplateRepository extends JpaRepository<ExamTemplate, ExamTemplate.PK> {
    List<ExamTemplate> findByExamIdOrderByQuestionOrderAsc(UUID examId);
}
