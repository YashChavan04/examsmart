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
@Table(name = "exams")
@Data
public class Exam {
    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, length = 80)
    private String subject;

    @Column(name = "duration_seconds", nullable = false)
    private int durationSeconds;

    @Column(name = "start_window", nullable = false)
    private Instant startWindow;

    @Column(name = "end_window", nullable = false)
    private Instant endWindow;

    @ManyToOne
    @JoinColumn(name = "created_by")
    private User createdBy;

    @OneToMany(mappedBy = "exam", cascade = CascadeType.ALL)
    private List<ExamTemplate> templates = new ArrayList<>();
}
