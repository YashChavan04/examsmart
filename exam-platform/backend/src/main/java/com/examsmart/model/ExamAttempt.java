package com.examsmart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "exam_attempts", uniqueConstraints = @UniqueConstraint(columnNames = {"exam_id", "student_id"}))
@Data
public class ExamAttempt {
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne
    @JoinColumn(name = "student_id", nullable = false)
    private User student;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "submitted_at")
    private Instant submittedAt;

    @Column(nullable = false, length = 20)
    private String status = "NOT_STARTED"; // NOT_STARTED | IN_PROGRESS | SUBMITTED

    private Integer score;

    @Column(name = "total_questions")
    private Integer totalQuestions;
}
