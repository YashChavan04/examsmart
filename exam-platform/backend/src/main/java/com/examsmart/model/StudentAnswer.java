package com.examsmart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "student_answers")
@Data
public class StudentAnswer {
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "attempt_id", nullable = false)
    private ExamAttempt attempt;

    @ManyToOne
    @JoinColumn(name = "variant_id", nullable = false)
    private QuestionVariant variant;

    @Column(name = "selected_index")
    private Integer selectedIndex;

    @Column(name = "is_correct")
    private Boolean isCorrect;

    @Column(name = "time_spent_seconds")
    private Integer timeSpentSeconds;

    @Column(name = "answered_at")
    private Instant answeredAt = Instant.now();
}
