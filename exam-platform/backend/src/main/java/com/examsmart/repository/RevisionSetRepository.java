package com.examsmart.repository;

import com.examsmart.model.RevisionSet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.UUID;

public interface RevisionSetRepository extends JpaRepository<RevisionSet, UUID> {
    Optional<RevisionSet> findByAttemptId(UUID attemptId);
}
