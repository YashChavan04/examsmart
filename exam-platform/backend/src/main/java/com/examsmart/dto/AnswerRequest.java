package com.examsmart.dto;

import java.util.UUID;

public record AnswerRequest(UUID variantId, Integer selectedIndex, Integer timeSpentSeconds) {}
