package com.examsmart.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "topic_stats")
@Data
public class TopicStats {

    @Id
    @GeneratedValue
    @JdbcTypeCode(SqlTypes.CHAR)
    private UUID id;

    @OneToOne
    @JoinColumn(name = "template_id", unique = true)
    private QuestionTemplate template;

    @Column(name = "times_answered")
    private Integer timesAnswered = 0;

    @Column(name = "times_correct")
    private Integer timesCorrect = 0;

    @Column(name = "difficulty_index")
    private BigDecimal difficultyIndex;

    @Column(name = "discrimination_index")
    private BigDecimal discriminationIndex;

    @Column(name = "last_calibrated")
    private Instant lastCalibrated;
}
