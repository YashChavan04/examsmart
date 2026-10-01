package com.examsmart.dto;

import java.time.Instant;
import java.util.UUID;

public record ExamDTO(
        UUID id,
        String title,
        String subject,
        int durationSeconds,
        Instant startWindow,
        Instant endWindow,
        int questionCount,
        // Student attempt context (null if faculty or not attempted)
        UUID attemptId,
        String attemptStatus, // NOT_STARTED, IN_PROGRESS, SUBMITTED
        Integer score,
        Integer totalQuestions,
        Long remainingSeconds,
        // Faculty metrics context
        Integer totalAttempts,
        Integer submittedAttempts
) {}
