package com.examsmart.dto;

import java.time.Instant;
import java.util.UUID;

public record QuestionTemplateDTO(
        UUID id,
        String subject,
        String topic,
        String templateText,
        String formulaKey,
        String variableRulesJson,
        String difficulty,
        Instant createdAt,
        Integer timesAnswered,
        Integer timesCorrect,
        Double accuracyRate,
        String calibratedDifficulty
) {}
