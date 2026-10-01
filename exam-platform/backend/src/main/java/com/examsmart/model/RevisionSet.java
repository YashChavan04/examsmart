package com.examsmart.model;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.Data;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "revision_sets")
@Data
public class RevisionSet {
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "attempt_id", nullable = false, unique = true)
    private ExamAttempt attempt;

    @Column(name = "weak_topics", columnDefinition = "json", nullable = false)
    private String weakTopicsJson; // JSON array of topic names

    @Column(name = "generated_at")
    private Instant generatedAt = Instant.now();

    @OneToMany(mappedBy = "revisionSet", cascade = CascadeType.ALL)
    private List<RevisionQuestion> questions = new ArrayList<>();
}
