package com.examsmart.dto;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record AttemptDetailsResponse(
        UUID attemptId,
        UUID examId,
        String examTitle,
        int durationSeconds,
        long remainingSeconds,
        String status,
        List<QuestionResponseDTO> questions,
        Map<String, Integer> savedAnswers,
        long flagCount,
        List<String> reviewFlags
) {}
