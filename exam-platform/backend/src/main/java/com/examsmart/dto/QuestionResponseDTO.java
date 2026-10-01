package com.examsmart.dto;

import java.util.List;
import java.util.UUID;

/** Sent to the student. Deliberately has NO correct answer or correct index. */
public record QuestionResponseDTO(UUID variantId, String topic, String text, List<String> options, int order) {}
