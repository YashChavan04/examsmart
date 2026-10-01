package com.examsmart.dto;

import java.util.List;
import java.util.UUID;

public record StartAttemptResponse(UUID attemptId, int durationSeconds, List<QuestionResponseDTO> questions) {}
