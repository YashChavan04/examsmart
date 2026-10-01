package com.examsmart.controller;

import com.examsmart.config.AuthenticatedUser;
import com.examsmart.dto.CreateExamRequest;
import com.examsmart.dto.ExamDTO;
import com.examsmart.model.Exam;
import com.examsmart.model.ExamAttempt;
import com.examsmart.model.ExamTemplate;
import com.examsmart.repository.ExamAttemptRepository;
import com.examsmart.repository.ExamRepository;
import com.examsmart.repository.ExamTemplateRepository;
import com.examsmart.repository.QuestionTemplateRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/exams")
public class ExamController {

    private final ExamRepository examRepository;
    private final ExamTemplateRepository examTemplateRepository;
    private final QuestionTemplateRepository questionTemplateRepository;
    private final ExamAttemptRepository attemptRepository;

    public ExamController(ExamRepository examRepository,
                          ExamTemplateRepository examTemplateRepository,
                          QuestionTemplateRepository questionTemplateRepository,
                          ExamAttemptRepository attemptRepository) {
        this.examRepository = examRepository;
        this.examTemplateRepository = examTemplateRepository;
        this.questionTemplateRepository = questionTemplateRepository;
        this.attemptRepository = attemptRepository;
    }

    /** Lists all exams with context for the current user (student attempt status or faculty counts). */
    @GetMapping
    public List<ExamDTO> listExams(@AuthenticationPrincipal AuthenticatedUser authUser) {
        List<Exam> exams = examRepository.findAll();
        UUID currentUserId = authUser != null ? authUser.getId() : null;
        boolean isFaculty = authUser != null && ("FACULTY".equalsIgnoreCase(authUser.getRole()) || "ADMIN".equalsIgnoreCase(authUser.getRole()));

        return exams.stream().map(exam -> {
            List<ExamTemplate> templates = examTemplateRepository.findByExamIdOrderByQuestionOrderAsc(exam.getId());
            int questionCount = templates.size();

            UUID attemptId = null;
            String attemptStatus = "NOT_STARTED";
            Integer score = null;
            Integer totalQuestions = questionCount;
            Long remainingSeconds = null;

            Integer totalAttempts = null;
            Integer submittedAttempts = null;

            if (isFaculty) {
                List<ExamAttempt> attempts = attemptRepository.findByExamId(exam.getId());
                totalAttempts = attempts.size();
                submittedAttempts = (int) attempts.stream().filter(a -> "SUBMITTED".equals(a.getStatus())).count();
            } else if (currentUserId != null) {
                Optional<ExamAttempt> attemptOpt = attemptRepository.findByExamIdAndStudentId(exam.getId(), currentUserId);
                if (attemptOpt.isPresent()) {
                    ExamAttempt attempt = attemptOpt.get();
                    attemptId = attempt.getId();
                    attemptStatus = attempt.getStatus();
                    score = attempt.getScore();
                    if (attempt.getTotalQuestions() != null && attempt.getTotalQuestions() > 0) {
                        totalQuestions = attempt.getTotalQuestions();
                    }
                    if ("IN_PROGRESS".equals(attemptStatus) && attempt.getStartedAt() != null) {
                        long elapsed = Duration.between(attempt.getStartedAt(), Instant.now()).getSeconds();
                        remainingSeconds = Math.max(0, (long) exam.getDurationSeconds() - elapsed);
                    }
                }
            }

            return new ExamDTO(
                    exam.getId(),
                    exam.getTitle(),
                    exam.getSubject(),
                    exam.getDurationSeconds(),
                    exam.getStartWindow(),
                    exam.getEndWindow(),
                    questionCount,
                    attemptId,
                    attemptStatus,
                    score,
                    totalQuestions,
                    remainingSeconds,
                    totalAttempts,
                    submittedAttempts
            );
        }).toList();
    }

    /** FACULTY: create an exam and attach question templates in order. */
    @PostMapping
    public Exam create(@RequestBody CreateExamRequest request, @AuthenticationPrincipal AuthenticatedUser authUser) {
        Exam exam = new Exam();
        exam.setTitle(request.title());
        exam.setSubject(request.subject());
        exam.setDurationSeconds(request.durationSeconds());
        exam.setStartWindow(request.startWindow());
        exam.setEndWindow(request.endWindow());
        if (authUser != null) {
            exam.setCreatedBy(authUser.getUser());
        }
        exam = examRepository.save(exam);

        int order = 0;
        for (UUID templateId : request.templateIdsInOrder()) {
            ExamTemplate et = new ExamTemplate();
            et.setExam(exam);
            et.setTemplate(questionTemplateRepository.findById(templateId)
                    .orElseThrow(() -> new IllegalArgumentException("Template not found: " + templateId)));
            et.setQuestionOrder(order++);
            examTemplateRepository.save(et);
        }
        return exam;
    }

    @GetMapping("/{examId}")
    public ExamDTO get(@PathVariable UUID examId, @AuthenticationPrincipal AuthenticatedUser authUser) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Exam not found"));

        List<ExamTemplate> templates = examTemplateRepository.findByExamIdOrderByQuestionOrderAsc(exam.getId());
        int questionCount = templates.size();

        UUID attemptId = null;
        String attemptStatus = "NOT_STARTED";
        Integer score = null;
        Long remainingSeconds = null;

        if (authUser != null) {
            Optional<ExamAttempt> attemptOpt = attemptRepository.findByExamIdAndStudentId(exam.getId(), authUser.getId());
            if (attemptOpt.isPresent()) {
                ExamAttempt attempt = attemptOpt.get();
                attemptId = attempt.getId();
                attemptStatus = attempt.getStatus();
                score = attempt.getScore();
                if ("IN_PROGRESS".equals(attemptStatus) && attempt.getStartedAt() != null) {
                    long elapsed = Duration.between(attempt.getStartedAt(), Instant.now()).getSeconds();
                    remainingSeconds = Math.max(0, (long) exam.getDurationSeconds() - elapsed);
                }
            }
        }

        return new ExamDTO(
                exam.getId(),
                exam.getTitle(),
                exam.getSubject(),
                exam.getDurationSeconds(),
                exam.getStartWindow(),
                exam.getEndWindow(),
                questionCount,
                attemptId,
                attemptStatus,
                score,
                questionCount,
                remainingSeconds,
                null,
                null
        );
    }
}
