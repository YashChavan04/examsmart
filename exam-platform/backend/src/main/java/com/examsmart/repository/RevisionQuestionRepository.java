package com.examsmart.repository;

import com.examsmart.model.RevisionQuestion;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface RevisionQuestionRepository extends JpaRepository<RevisionQuestion, RevisionQuestion.PK> {
    List<RevisionQuestion> findByRevisionSetId(UUID revisionSetId);
}
