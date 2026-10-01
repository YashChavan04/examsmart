package com.examsmart.dto;

import java.util.List;
import java.util.UUID;

/** Used for revision-plan display and interactive practice. */
public record QuestionResponseWithAnswerDTO(
        UUID variantId,
        String topic,
        String text,
        List<String> options,
        int correctIndex
) {}
