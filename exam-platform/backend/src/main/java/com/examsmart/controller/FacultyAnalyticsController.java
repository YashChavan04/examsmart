package com.examsmart.controller;

import com.examsmart.dto.ExamAnalyticsDTO;
import com.examsmart.model.*;
import com.examsmart.repository.*;
import com.examsmart.service.CalibrationService;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/faculty")
public class FacultyAnalyticsController {

    private final ExamRepository examRepository;
    private final ExamAttemptRepository attemptRepository;
    private final StudentAnswerRepository answerRepository;
    private final FlagEventRepository flagEventRepository;
    private final QuestionVariantRepository variantRepository;
    private final QuestionTemplateRepository templateRepository;
    private final CalibrationService calibrationService;

    public FacultyAnalyticsController(ExamRepository examRepository,
                                      ExamAttemptRepository attemptRepository,
                                      StudentAnswerRepository answerRepository,
                                      FlagEventRepository flagEventRepository,
                                      QuestionVariantRepository variantRepository,
                                      QuestionTemplateRepository templateRepository,
                                      CalibrationService calibrationService) {
        this.examRepository = examRepository;
        this.attemptRepository = attemptRepository;
        this.answerRepository = answerRepository;
        this.flagEventRepository = flagEventRepository;
        this.variantRepository = variantRepository;
        this.templateRepository = templateRepository;
        this.calibrationService = calibrationService;
    }

    @GetMapping("/exams/{examId}/analytics")
    public ExamAnalyticsDTO getAnalytics(@PathVariable UUID examId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        List<ExamAttempt> attempts = attemptRepository.findByExamId(examId);
        List<ExamAttempt> submitted = attempts.stream()
                .filter(a -> "SUBMITTED".equals(a.getStatus()))
                .toList();

        int inProgress = (int) attempts.stream()
                .filter(a -> "IN_PROGRESS".equals(a.getStatus()))
                .count();

        // 1. Summary metrics
        double avgScore = 0;
        double avgPct = 0;
        int maxScore = 0;
        int minScore = Integer.MAX_VALUE;

        if (!submitted.isEmpty()) {
            double totalScoreSum = 0;
            double totalPctSum = 0;
            for (ExamAttempt a : submitted) {
                int s = a.getScore() != null ? a.getScore() : 0;
                int total = a.getTotalQuestions() != null && a.getTotalQuestions() > 0 ? a.getTotalQuestions() : 1;
                totalScoreSum += s;
                totalPctSum += ((double) s / total) * 100.0;
                if (s > maxScore) maxScore = s;
                if (s < minScore) minScore = s;
            }
            avgScore = Math.round((totalScoreSum / submitted.size()) * 10.0) / 10.0;
            avgPct = Math.round((totalPctSum / submitted.size()) * 10.0) / 10.0;
        } else {
            minScore = 0;
        }

        // 2. Score distribution buckets: 0-20%, 21-40%, 41-60%, 61-80%, 81-100%
        int[] buckets = new int[5];
        for (ExamAttempt a : submitted) {
            int s = a.getScore() != null ? a.getScore() : 0;
            int total = a.getTotalQuestions() != null && a.getTotalQuestions() > 0 ? a.getTotalQuestions() : 1;
            double pct = ((double) s / total) * 100.0;
            if (pct <= 20) buckets[0]++;
            else if (pct <= 40) buckets[1]++;
            else if (pct <= 60) buckets[2]++;
            else if (pct <= 80) buckets[3]++;
            else buckets[4]++;
        }

        List<ExamAnalyticsDTO.ScoreBucket> scoreDistribution = List.of(
                new ExamAnalyticsDTO.ScoreBucket("0 - 20%", 0, 20, buckets[0]),
                new ExamAnalyticsDTO.ScoreBucket("21 - 40%", 21, 40, buckets[1]),
                new ExamAnalyticsDTO.ScoreBucket("41 - 60%", 41, 60, buckets[2]),
                new ExamAnalyticsDTO.ScoreBucket("61 - 80%", 61, 80, buckets[3]),
                new ExamAnalyticsDTO.ScoreBucket("81 - 100%", 81, 100, buckets[4])
        );

        // 3. Average per topic & Hardest questions
        Map<String, int[]> topicStats = new HashMap<>(); // topic -> [totalAnswered, totalCorrect]
        Map<UUID, int[]> templateStats = new HashMap<>(); // templateId -> [totalAnswered, totalWrong]
        Map<UUID, QuestionTemplate> templateLookup = new HashMap<>();

        for (ExamAttempt a : attempts) {
            List<StudentAnswer> answers = answerRepository.findByAttemptId(a.getId());
            for (StudentAnswer sa : answers) {
                if (sa.getVariant() != null && sa.getVariant().getTemplate() != null && sa.getIsCorrect() != null) {
                    QuestionTemplate tmpl = sa.getVariant().getTemplate();
                    String topic = tmpl.getTopic();
                    boolean correct = Boolean.TRUE.equals(sa.getIsCorrect());

                    topicStats.putIfAbsent(topic, new int[2]);
                    topicStats.get(topic)[0]++;
                    if (correct) topicStats.get(topic)[1]++;

                    templateStats.putIfAbsent(tmpl.getId(), new int[2]);
                    templateStats.get(tmpl.getId())[0]++;
                    if (!correct) templateStats.get(tmpl.getId())[1]++;
                    templateLookup.put(tmpl.getId(), tmpl);
                }
            }
        }

        List<ExamAnalyticsDTO.TopicMetric> topicMetrics = new ArrayList<>();
        topicStats.forEach((topic, counts) -> {
            int answered = counts[0];
            int correct = counts[1];
            double accuracy = answered > 0 ? Math.round(((double) correct / answered) * 1000.0) / 10.0 : 0.0;
            topicMetrics.add(new ExamAnalyticsDTO.TopicMetric(topic, answered, correct, accuracy));
        });
        topicMetrics.sort((a, b) -> Double.compare(a.accuracyRate(), b.accuracyRate()));

        List<ExamAnalyticsDTO.HardestQuestion> hardestQuestions = new ArrayList<>();
        templateStats.forEach((tmplId, counts) -> {
            int answered = counts[0];
            int wrong = counts[1];
            double failureRate = answered > 0 ? Math.round(((double) wrong / answered) * 1000.0) / 10.0 : 0.0;
            QuestionTemplate tmpl = templateLookup.get(tmplId);
            if (tmpl != null) {
                hardestQuestions.add(new ExamAnalyticsDTO.HardestQuestion(
                        tmpl.getId(),
                        tmpl.getTopic(),
                        tmpl.getTemplateText(),
                        tmpl.getDifficulty(),
                        answered,
                        wrong,
                        failureRate
                ));
            }
        });
        hardestQuestions.sort((a, b) -> Double.compare(b.failureRate(), a.failureRate()));

        // 4. List of flagged students
        long totalFlags = 0;
        List<ExamAnalyticsDTO.FlaggedStudent> flaggedStudents = new ArrayList<>();

        for (ExamAttempt a : attempts) {
            List<FlagEvent> flags = flagEventRepository.findByAttemptId(a.getId());
            long flagCount = flags.size();
            totalFlags += flagCount;

            if (flagCount > 0) {
                List<String> types = flags.stream()
                        .map(FlagEvent::getEventType)
                        .distinct()
                        .toList();

                flaggedStudents.add(new ExamAnalyticsDTO.FlaggedStudent(
                        a.getStudent() != null ? a.getStudent().getId() : null,
                        a.getStudent() != null ? a.getStudent().getName() : "Unknown Student",
                        a.getStudent() != null ? a.getStudent().getEmail() : "N/A",
                        a.getId(),
                        a.getStatus(),
                        a.getScore(),
                        a.getTotalQuestions(),
                        flagCount,
                        types,
                        a.getStartedAt(),
                        a.getSubmittedAt()
                ));
            }
        }
        flaggedStudents.sort((a, b) -> Long.compare(b.flagCount(), a.flagCount()));

        ExamAnalyticsDTO.Summary summary = new ExamAnalyticsDTO.Summary(
                attempts.size(),
                submitted.size(),
                inProgress,
                avgScore,
                avgPct,
                maxScore,
                minScore == Integer.MAX_VALUE ? 0 : minScore,
                totalFlags,
                flaggedStudents.size()
        );

        return new ExamAnalyticsDTO(
                exam.getId(),
                exam.getTitle(),
                exam.getSubject(),
                exam.getDurationSeconds(),
                summary,
                scoreDistribution,
                topicMetrics,
                hardestQuestions,
                flaggedStudents
        );
    }

    @GetMapping("/exams/{examId}/export-csv")
    public void exportCsv(@PathVariable UUID examId, HttpServletResponse response) throws IOException {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        List<ExamAttempt> attempts = attemptRepository.findByExamId(examId);

        String cleanTitle = exam.getTitle().replaceAll("[^a-zA-Z0-9.-]", "_");
        response.setContentType("text/csv; charset=UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"exam_" + cleanTitle + "_report.csv\"");

        PrintWriter writer = response.getWriter();
        writer.println("Student Name,Student Email,Status,Score,Total Questions,Percentage,Started At,Submitted At,Total Flags,Flag Types");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss").withZone(ZoneId.systemDefault());

        for (ExamAttempt a : attempts) {
            String name = a.getStudent() != null ? escapeCsv(a.getStudent().getName()) : "Unknown";
            String email = a.getStudent() != null ? escapeCsv(a.getStudent().getEmail()) : "";
            String status = a.getStatus();
            String score = a.getScore() != null ? String.valueOf(a.getScore()) : "0";
            String total = a.getTotalQuestions() != null ? String.valueOf(a.getTotalQuestions()) : "0";

            String pct = "0%";
            if (a.getScore() != null && a.getTotalQuestions() != null && a.getTotalQuestions() > 0) {
                pct = Math.round(((double) a.getScore() / a.getTotalQuestions()) * 100.0) + "%";
            }

            String started = a.getStartedAt() != null ? dtf.format(a.getStartedAt()) : "";
            String submitted = a.getSubmittedAt() != null ? dtf.format(a.getSubmittedAt()) : "";

            List<FlagEvent> flags = flagEventRepository.findByAttemptId(a.getId());
            long flagCount = flags.size();
            String flagTypes = flags.stream().map(FlagEvent::getEventType).distinct().collect(Collectors.joining("; "));

            writer.println(String.join(",",
                    name,
                    email,
                    status,
                    score,
                    total,
                    pct,
                    started,
                    submitted,
                    String.valueOf(flagCount),
                    escapeCsv(flagTypes)
            ));
        }

        writer.flush();
    }

    @PostMapping("/calibrate")
    public ResponseEntity<Map<String, Object>> triggerCalibration() {
        int count = calibrationService.calibrateAll();
        return ResponseEntity.ok(Map.of(
                "message", "Difficulty calibration completed successfully",
                "calibratedTemplatesCount", count
        ));
    }

    private String escapeCsv(String value) {
        if (value == null) return "\"\"";
        return "\"" + value.replace("\"", "\"\"") + "\"";
    }
}
