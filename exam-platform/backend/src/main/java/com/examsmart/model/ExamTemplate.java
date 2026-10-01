package com.examsmart.model;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.util.Objects;
import java.util.UUID;

@Entity
@Table(name = "exam_templates")
@Data
@IdClass(ExamTemplate.PK.class)
public class ExamTemplate {

    @Id
    @ManyToOne
    @JoinColumn(name = "exam_id")
    private Exam exam;

    @Id
    @ManyToOne
    @JoinColumn(name = "template_id")
    private QuestionTemplate template;

    @Column(name = "question_order", nullable = false)
    private int questionOrder;

    @Data
    public static class PK implements Serializable {
        private UUID exam;
        private UUID template;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return Objects.equals(exam, pk.exam) && Objects.equals(template, pk.template);
        }

        @Override
        public int hashCode() { return Objects.hash(exam, template); }
    }
}
