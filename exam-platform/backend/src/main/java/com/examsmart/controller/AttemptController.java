package com.examsmart.controller;

import com.examsmart.config.AuthenticatedUser;
import com.examsmart.dto.*;
import com.examsmart.model.*;
import com.examsmart.repository.*;
import com.examsmart.service.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/attempts")
public class AttemptController {

    private static final Logger log = LoggerFactory.getLogger(AttemptController.class);

    private final ExamRepository examRepository;
    private final ExamTemplateRepository examTemplateRepository;
    private final ExamAttemptRepository attemptRepository;
    private final QuestionVariantRepository variantRepository;
    private final StudentAnswerRepository answerRepository;
    private final FlagEventRepository flagEventRepository;
    private final QuestionGeneratorService generatorService;
    private final GradingService gradingService;
    private final RevisionPlanService revisionPlanService;
    private final ProgressWallService progressWallService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AttemptController(ExamRepository examRepository,
                             ExamTemplateRepository examTemplateRepository,
                             ExamAttemptRepository attemptRepository,
                             QuestionVariantRepository variantRepository,
                             StudentAnswerRepository answerRepository,
                             FlagEventRepository flagEventRepository,
                             QuestionGeneratorService generatorService,
                             GradingService gradingService,
                             RevisionPlanService revisionPlanService,
                             ProgressWallService progressWallService) {
        this.examRepository = examRepository;
        this.examTemplateRepository = examTemplateRepository;
        this.attemptRepository = attemptRepository;
        this.variantRepository = variantRepository;
        this.answerRepository = answerRepository;
        this.flagEventRepository = flagEventRepository;
        this.generatorService = generatorService;
        this.gradingService = gradingService;
        this.revisionPlanService = revisionPlanService;
        this.progressWallService = progressWallService;
    }

    /**
     * Starts a new attempt or resumes an existing in-progress attempt.
     * Uses the authenticated student identity from JWT principal - no ID spoofing.
     */
    @PostMapping("/start")
    public StartAttemptResponse start(
            @RequestBody StartAttemptRequest request,
            @AuthenticationPrincipal AuthenticatedUser authUser) {

        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User must be authenticated");
        }

        User student = authUser.getUser();
        Exam exam = examRepository.findById(request.examId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        // Check if an attempt already exists
        Optional<ExamAttempt> existingOpt = attemptRepository.findByExamIdAndStudentId(exam.getId(), student.getId());
        if (existingOpt.isPresent()) {
            ExamAttempt existing = existingOpt.get();
            if ("SUBMITTED".equals(existing.getStatus())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You have already completed this exam");
            }
            // If in progress, return existing questions
            List<QuestionVariant> existingVariants = variantRepository.findByExamAttemptIdOrderByQuestionOrderAsc(existing.getId());
            List<QuestionResponseDTO> questions = existingVariants.stream().map(v -> {
                List<String> optionStrings = parseOptions(v.getOptionsJson());
                return new QuestionResponseDTO(v.getId(), v.getTemplate().getTopic(),
                        v.getRenderedText(), optionStrings, v.getQuestionOrder());
            }).collect(Collectors.toList());

            long elapsed = Duration.between(existing.getStartedAt(), Instant.now()).getSeconds();
            int remaining = Math.max(0, exam.getDurationSeconds() - (int) elapsed);
            return new StartAttemptResponse(existing.getId(), remaining, questions);
        }

        // Create new attempt
        ExamAttempt newAttempt = new ExamAttempt();
        newAttempt.setExam(exam);
        newAttempt.setStudent(student);
        newAttempt.setStatus("IN_PROGRESS");
        newAttempt.setStartedAt(Instant.now());
        final ExamAttempt savedAttempt = attemptRepository.save(newAttempt);

        List<ExamTemplate> templates = examTemplateRepository.findByExamIdOrderByQuestionOrderAsc(exam.getId());
        List<QuestionResponseDTO> questions = templates.stream().map(et -> {
            QuestionVariant variant = generatorService.generate(et.getTemplate(), savedAttempt, et.getQuestionOrder());
            List<String> optionStrings = parseOptions(variant.getOptionsJson());
            return new QuestionResponseDTO(variant.getId(), et.getTemplate().getTopic(),
                    variant.getRenderedText(), optionStrings, variant.getQuestionOrder());
        }).collect(Collectors.toList());

        progressWallService.broadcast(exam.getId());
        return new StartAttemptResponse(savedAttempt.getId(), exam.getDurationSeconds(), questions);
    }

    /**
     * Finds and returns the student's currently active in-progress exam attempt if one exists.
     * Essential for the "Resume after disconnect" flow when a tab or browser is closed/crashed mid-exam.
     */
    @GetMapping("/active")
    public ResponseEntity<AttemptDetailsResponse> getActiveAttempt(@AuthenticationPrincipal AuthenticatedUser authUser) {
        if (authUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User must be authenticated");
        }

        Optional<ExamAttempt> activeOpt = attemptRepository.findFirstByStudentIdAndStatusOrderByStartedAtDesc(
                authUser.getId(), "IN_PROGRESS"
        );

        if (activeOpt.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        ExamAttempt attempt = activeOpt.get();
        Exam exam = attempt.getExam();
        long elapsed = Duration.between(attempt.getStartedAt(), Instant.now()).getSeconds();
        long remaining = Math.max(0, (long) exam.getDurationSeconds() - elapsed);

        if (remaining <= 0) {
            log.info("Active attempt {} timed out on resume. Auto-submitting.", attempt.getId());
            autoSubmit(attempt, "AUTO_SUBMIT_TIMEOUT");
            return ResponseEntity.noContent().build();
        }

        List<QuestionVariant> variants = variantRepository.findByExamAttemptIdOrderByQuestionOrderAsc(attempt.getId());
        List<QuestionResponseDTO> questions = variants.stream().map(v -> {
            List<String> optionStrings = parseOptions(v.getOptionsJson());
            return new QuestionResponseDTO(v.getId(), v.getTemplate().getTopic(),
                    v.getRenderedText(), optionStrings, v.getQuestionOrder());
        }).collect(Collectors.toList());

        List<StudentAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
        Map<String, Integer> savedAnswers = new HashMap<>();
        for (StudentAnswer a : answers) {
            if (a.getVariant() != null && a.getSelectedIndex() != null) {
                savedAnswers.put(a.getVariant().getId().toString(), a.getSelectedIndex());
            }
        }

        long flagCount = flagEventRepository.countByAttemptId(attempt.getId());
        List<String> reviewFlags = parseReviewFlags(attempt.getReviewFlagsJson());

        AttemptDetailsResponse response = new AttemptDetailsResponse(
                attempt.getId(),
                exam.getId(),
                exam.getTitle(),
                exam.getDurationSeconds(),
                remaining,
                attempt.getStatus(),
                questions,
                savedAnswers,
                flagCount,
                reviewFlags
        );

        return ResponseEntity.ok(response);
    }

    /**
     * Get attempt details with server-side time verification, saved answers, and review flags for resuming.
     */
    @GetMapping("/{attemptId}")
    public AttemptDetailsResponse getAttempt(
            @PathVariable UUID attemptId,
            @AuthenticationPrincipal AuthenticatedUser authUser) {

        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        Exam exam = attempt.getExam();
        long elapsed = Duration.between(attempt.getStartedAt(), Instant.now()).getSeconds();
        long remaining = Math.max(0, (long) exam.getDurationSeconds() - elapsed);

        // Server-side timeout enforcement
        if (remaining <= 0 && "IN_PROGRESS".equals(attempt.getStatus())) {
            log.info("Attempt {} timed out. Auto-submitting.", attemptId);
            autoSubmit(attempt, "AUTO_SUBMIT_TIMEOUT");
        }

        List<QuestionVariant> variants = variantRepository.findByExamAttemptIdOrderByQuestionOrderAsc(attempt.getId());
        List<QuestionResponseDTO> questions = variants.stream().map(v -> {
            List<String> optionStrings = parseOptions(v.getOptionsJson());
            return new QuestionResponseDTO(v.getId(), v.getTemplate().getTopic(),
                    v.getRenderedText(), optionStrings, v.getQuestionOrder());
        }).collect(Collectors.toList());

        List<StudentAnswer> answers = answerRepository.findByAttemptId(attempt.getId());
        Map<String, Integer> savedAnswers = new HashMap<>();
        for (StudentAnswer a : answers) {
            if (a.getVariant() != null && a.getSelectedIndex() != null) {
                savedAnswers.put(a.getVariant().getId().toString(), a.getSelectedIndex());
            }
        }

        long flagCount = flagEventRepository.countByAttemptId(attempt.getId());
        List<String> reviewFlags = parseReviewFlags(attempt.getReviewFlagsJson());

        return new AttemptDetailsResponse(
                attempt.getId(),
                exam.getId(),
                exam.getTitle(),
                exam.getDurationSeconds(),
                remaining,
                attempt.getStatus(),
                questions,
                savedAnswers,
                flagCount,
                reviewFlags
        );
    }

    /**
     * Persists student flagged-for-review questions on the backend so they survive disconnects and browser restarts.
     */
    @PostMapping("/{attemptId}/review-flags")
    public Map<String, Object> updateReviewFlags(
            @PathVariable UUID attemptId,
            @RequestBody UpdateReviewFlagsRequest request,
            @AuthenticationPrincipal AuthenticatedUser authUser) {

        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        List<String> flags = request.flaggedVariantIds() != null ? request.flaggedVariantIds() : List.of();
        try {
            attempt.setReviewFlagsJson(objectMapper.writeValueAsString(flags));
        } catch (Exception e) {
            attempt.setReviewFlagsJson("[]");
        }
        attemptRepository.save(attempt);
        return Map.of("success", true, "reviewFlags", flags);
    }

    @PostMapping("/{attemptId}/answer")
    public void answer(
            @PathVariable UUID attemptId,
            @RequestBody AnswerRequest request,
            @AuthenticationPrincipal AuthenticatedUser authUser) {

        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if (!"IN_PROGRESS".equals(attempt.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exam is not in progress");
        }

        // Server-side time enforcement (allow 10 seconds grace period for network latency)
        long elapsed = Duration.between(attempt.getStartedAt(), Instant.now()).getSeconds();
        if (elapsed > attempt.getExam().getDurationSeconds() + 10) {
            autoSubmit(attempt, "LATE_ANSWER_TIMEOUT");
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Exam time expired. Attempt auto-submitted.");
        }

        QuestionVariant variant = variantRepository.findById(request.variantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Variant not found"));

        // If selectedIndex is null or negative, student cleared/deselected their answer
        if (request.selectedIndex() == null || request.selectedIndex() < 0) {
            answerRepository.findByAttemptIdAndVariantId(attempt.getId(), variant.getId())
                    .ifPresent(answerRepository::delete);
            progressWallService.broadcast(attempt.getExam().getId());
            return;
        }

        // Upsert student answer to avoid duplicate entries for the same variant
        StudentAnswer answer = answerRepository.findByAttemptIdAndVariantId(attempt.getId(), variant.getId())
                .orElseGet(() -> {
                    StudentAnswer a = new StudentAnswer();
                    a.setAttempt(attempt);
                    a.setVariant(variant);
                    return a;
                });

        answer.setSelectedIndex(request.selectedIndex());
        answer.setTimeSpentSeconds(request.timeSpentSeconds());
        answerRepository.save(answer);

        progressWallService.broadcast(attempt.getExam().getId());
    }

    /**
     * Records a suspicious-activity event and triggers automatic excessive tab-switch detection.
     */
    @PostMapping("/{attemptId}/flag")
    public Map<String, Object> flag(
            @PathVariable UUID attemptId,
            @RequestBody FlagRequest request) {

        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        FlagEvent event = new FlagEvent();
        event.setAttempt(attempt);
        event.setEventType(request.eventType());
        flagEventRepository.save(event);

        long tabSwitches = flagEventRepository.countByAttemptIdAndEventType(attemptId, "TAB_SWITCH");
        boolean isExcessive = false;

        // Auto-flagging after repeated tab switches (threshold >= 3)
        if (tabSwitches >= 3) {
            long existingExcessive = flagEventRepository.countByAttemptIdAndEventType(attemptId, "EXCESSIVE_TAB_SWITCHES");
            if (existingExcessive == 0) {
                FlagEvent excessiveEvent = new FlagEvent();
                excessiveEvent.setAttempt(attempt);
                excessiveEvent.setEventType("EXCESSIVE_TAB_SWITCHES");
                flagEventRepository.save(excessiveEvent);
            }
            isExcessive = true;
        }

        progressWallService.broadcast(attempt.getExam().getId());

        long totalFlags = flagEventRepository.countByAttemptId(attemptId);
        return Map.of(
                "totalFlags", totalFlags,
                "tabSwitches", tabSwitches,
                "isExcessive", isExcessive
        );
    }

    @PostMapping("/{attemptId}/submit")
    public SubmitResponse submit(@PathVariable UUID attemptId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        if ("SUBMITTED".equals(attempt.getStatus())) {
            return new SubmitResponse(
                    attempt.getScore() != null ? attempt.getScore() : 0,
                    attempt.getTotalQuestions() != null ? attempt.getTotalQuestions() : 0
            );
        }

        int score = gradingService.grade(attempt);
        attemptRepository.save(attempt);
        revisionPlanService.build(attempt);

        progressWallService.broadcast(attempt.getExam().getId());
        return new SubmitResponse(score, attempt.getTotalQuestions());
    }

    private void autoSubmit(ExamAttempt attempt, String flagReason) {
        FlagEvent event = new FlagEvent();
        event.setAttempt(attempt);
        event.setEventType(flagReason);
        flagEventRepository.save(event);

        int score = gradingService.grade(attempt);
        attemptRepository.save(attempt);
        revisionPlanService.build(attempt);
        progressWallService.broadcast(attempt.getExam().getId());
    }

    private List<String> parseOptions(String optionsJson) {
        try {
            if (optionsJson == null || optionsJson.isBlank()) return List.of();
            List<?> list = objectMapper.readValue(optionsJson, List.class);
            return list.stream().map(String::valueOf).toList();
        } catch (Exception e) {
            return List.of(optionsJson.replaceAll("[\\[\\]\"]", "").split(","));
        }
    }

    private List<String> parseReviewFlags(String reviewFlagsJson) {
        if (reviewFlagsJson == null || reviewFlagsJson.isBlank()) {
            return List.of();
        }
        try {
            return objectMapper.readValue(reviewFlagsJson, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
