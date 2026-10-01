package com.examsmart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

/**
 * The concrete, per-student question actually shown: a specific set of
 * generated values, rendered text, shuffled options, and the correct
 * index. Never regenerated after creation - grading always checks
 * against exactly what this student saw.
 */
@Entity
@Table(name = "question_variants")
@Data
public class QuestionVariant {
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "template_id", nullable = false)
    private QuestionTemplate template;

    @ManyToOne
    @JoinColumn(name = "exam_attempt_id", nullable = false)
    private ExamAttempt examAttempt;

    @Column(name = "variable_values", columnDefinition = "json", nullable = false)
    private String variableValuesJson;

    @Column(name = "rendered_text", nullable = false, columnDefinition = "TEXT")
    private String renderedText;

    @Column(name = "correct_answer", nullable = false)
    private BigDecimal correctAnswer;

    @Column(name = "options", columnDefinition = "json", nullable = false)
    private String optionsJson; // JSON array of 4 numeric options, shuffled

    @Column(name = "correct_index", nullable = false)
    private int correctIndex;

    @Column(name = "question_order", nullable = false)
    private int questionOrder;
}
