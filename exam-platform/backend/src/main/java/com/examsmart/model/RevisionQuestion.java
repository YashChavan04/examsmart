package com.examsmart.model;

import jakarta.persistence.*;
import lombok.Data;
import java.util.UUID;

@Entity
@Table(name = "revision_questions")
@Data
@IdClass(RevisionQuestion.PK.class)
public class RevisionQuestion {
    @Id
    @ManyToOne
    @JoinColumn(name = "revision_set_id")
    private RevisionSet revisionSet;

    @Id
    @ManyToOne
    @JoinColumn(name = "variant_id")
    private QuestionVariant variant;

    public static class PK implements java.io.Serializable {
        private UUID revisionSet;
        private UUID variant;

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (!(o instanceof PK pk)) return false;
            return java.util.Objects.equals(revisionSet, pk.revisionSet)
                    && java.util.Objects.equals(variant, pk.variant);
        }

        @Override
        public int hashCode() { return java.util.Objects.hash(revisionSet, variant); }
    }
}
