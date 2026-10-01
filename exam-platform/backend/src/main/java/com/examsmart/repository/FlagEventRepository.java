package com.examsmart.repository;

import com.examsmart.model.FlagEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface FlagEventRepository extends JpaRepository<FlagEvent, UUID> {
    List<FlagEvent> findByAttemptId(UUID attemptId);
    long countByAttemptId(UUID attemptId);
    long countByAttemptIdAndEventType(UUID attemptId, String eventType);
}
