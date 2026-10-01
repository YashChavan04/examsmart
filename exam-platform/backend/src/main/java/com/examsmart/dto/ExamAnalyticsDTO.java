package com.examsmart.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ExamAnalyticsDTO(
        UUID examId,
        String examTitle,
        String subject,
        int durationSeconds,
        Summary summary,
        List<ScoreBucket> scoreDistribution,
        List<TopicMetric> topicAverages,
        List<HardestQuestion> hardestQuestions,
        List<FlaggedStudent> flaggedStudents
) {
    public record Summary(
            int totalAttempts,
            int submittedAttempts,
            int inProgressAttempts,
            double averageScore,
            double averagePercentage,
            int highestScore,
            int lowestScore,
            long totalFlags,
            int totalFlaggedStudents
    ) {}

    public record ScoreBucket(
            String label,
            int minPercent,
            int maxPercent,
            int count
    ) {}

    public record TopicMetric(
            String topic,
            int totalAnswered,
            int totalCorrect,
            double accuracyRate
    ) {}

    public record HardestQuestion(
            UUID templateId,
            String topic,
            String templateText,
            String difficulty,
            int timesAnswered,
            int timesWrong,
            double failureRate
    ) {}

    public record FlaggedStudent(
            UUID studentId,
            String studentName,
            String studentEmail,
            UUID attemptId,
            String status,
            Integer score,
            Integer totalQuestions,
            long flagCount,
            List<String> flagTypes,
            Instant startedAt,
            Instant submittedAt
    ) {}
}
