package com.examsmart.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record CreateExamRequest(
        String title,
        String subject,
        int durationSeconds,
        Instant startWindow,
        Instant endWindow,
        List<UUID> templateIdsInOrder
) {}
