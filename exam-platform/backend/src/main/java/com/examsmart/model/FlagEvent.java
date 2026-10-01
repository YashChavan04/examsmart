package com.examsmart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "flag_events")
@Data
public class FlagEvent {
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @Column(name = "event_type", nullable = false, length = 30)
    private String eventType; // TAB_SWITCH | COPY_PASTE | MULTI_SESSION

    @Column(name = "occurred_at")
    private Instant occurredAt = Instant.now();
}
