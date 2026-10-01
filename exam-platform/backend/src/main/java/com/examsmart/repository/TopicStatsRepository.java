package com.examsmart.repository;

import com.examsmart.model.QuestionTemplate;
import com.examsmart.model.TopicStats;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface TopicStatsRepository extends JpaRepository<TopicStats, UUID> {
    Optional<TopicStats> findByTemplateId(UUID templateId);
    Optional<TopicStats> findByTemplate(QuestionTemplate template);
}
