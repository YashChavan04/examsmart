package com.examsmart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Data;
import java.time.Instant;
import java.util.UUID;

/**
 * A question TEMPLATE, not a concrete question. Concrete, per-student
 * questions are QuestionVariant rows generated at attempt-start time.
 *
 * variableRulesJson example: {"a": {"min":10,"max":60}, "b": {"min":100,"max":900}}
 * Stored as a json column but mapped as String here and (de)serialized
 * with Jackson's ObjectMapper in the service layer - keeps the entity
 * dependency-free (no extra Hibernate-types library needed).
 */
@Entity
@Table(name = "question_templates")
@Data
public class QuestionTemplate {
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @Column(nullable = false, length = 80)
    private String subject;

    @Column(nullable = false, length = 80)
    private String topic;

    @Column(name = "template_text", nullable = false, columnDefinition = "TEXT")
    private String templateText; // e.g. "What is {a}% of {b}?"

    @Column(name = "formula_key", nullable = false, length = 80)
    private String formulaKey; // maps to QuestionGeneratorService.Formula enum

    @Column(name = "variable_rules", columnDefinition = "json", nullable = false)
    private String variableRulesJson;

    @Column(length = 20)
    private String difficulty = "MEDIUM";

    @Column(name = "created_at")
    private Instant createdAt = Instant.now();
}
