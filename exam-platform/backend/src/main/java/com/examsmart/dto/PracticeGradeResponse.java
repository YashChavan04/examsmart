package com.examsmart.dto;

import java.util.List;
import java.util.UUID;

public record PracticeGradeResponse(
        int score,
        int total,
        List<ItemResult> results
) {
    public record ItemResult(
            UUID variantId,
            Integer selectedIndex,
            int correctIndex,
            boolean isCorrect
    ) {}
}
