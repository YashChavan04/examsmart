package com.examsmart.repository;

import com.examsmart.model.QuestionTemplate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface QuestionTemplateRepository extends JpaRepository<QuestionTemplate, UUID> {
    List<QuestionTemplate> findBySubject(String subject);
}
