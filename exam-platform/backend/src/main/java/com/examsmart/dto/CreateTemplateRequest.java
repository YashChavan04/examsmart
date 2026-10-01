package com.examsmart.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateTemplateRequest(
        @NotBlank(message = "Subject is required")
        String subject,

        @NotBlank(message = "Topic is required")
        String topic,

        @NotBlank(message = "Template text is required")
        String templateText,

        @NotBlank(message = "Formula key or question type is required")
        String formulaKey,

        String variableRulesJson,

        String difficulty // EASY, MEDIUM, HARD
) {}
