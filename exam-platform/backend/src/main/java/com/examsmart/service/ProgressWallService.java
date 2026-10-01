package com.examsmart.service;

import com.examsmart.model.ExamAttempt;
import com.examsmart.repository.ExamAttemptRepository;
import com.examsmart.repository.FlagEventRepository;
import com.examsmart.repository.QuestionVariantRepository;
import com.examsmart.repository.StudentAnswerRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Builds a snapshot of every attempt for an exam (status, % progress,
 * flag count) and pushes it to /topic/progress/{examId}. Call
 * broadcast(examId) any time an attempt changes: on answer, on flag,
 * on submit. Faculty clients get a live view with zero polling.
 */
@Service
public class ProgressWallService {

    private final ExamAttemptRepository attemptRepository;
    private final QuestionVariantRepository variantRepository;
    private final StudentAnswerRepository answerRepository;
    private final FlagEventRepository flagEventRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public ProgressWallService(ExamAttemptRepository attemptRepository,
                                QuestionVariantRepository variantRepository,
                                StudentAnswerRepository answerRepository,
                                FlagEventRepository flagEventRepository,
                                SimpMessagingTemplate messagingTemplate) {
        this.attemptRepository = attemptRepository;
        this.variantRepository = variantRepository;
        this.answerRepository = answerRepository;
        this.flagEventRepository = flagEventRepository;
        this.messagingTemplate = messagingTemplate;
    }

    public void broadcast(UUID examId) {
        List<ExamAttempt> attempts = attemptRepository.findByExamId(examId);

        List<Map<String, Object>> rows = attempts.stream().map(attempt -> {
            int totalQuestions = variantRepository.findByExamAttemptIdOrderByQuestionOrderAsc(attempt.getId()).size();
            int answered = "SUBMITTED".equals(attempt.getStatus()) && attempt.getTotalQuestions() != null
                    ? attempt.getTotalQuestions()
                    : answerRepository.findByAttemptId(attempt.getId()).size();
            long flags = flagEventRepository.countByAttemptId(attempt.getId());

            Map<String, Object> map = new HashMap<>();
            map.put("attemptId", attempt.getId());
            map.put("studentName", attempt.getStudent() != null ? attempt.getStudent().getName() : "Student");
            map.put("studentEmail", attempt.getStudent() != null ? attempt.getStudent().getEmail() : "");
            map.put("status", attempt.getStatus());
            map.put("progressPercent", totalQuestions == 0 ? 0 : Math.min(100, (answered * 100 / Math.max(totalQuestions, 1))));
            map.put("score", attempt.getScore());
            map.put("totalQuestions", totalQuestions);
            map.put("flags", flags);
            map.put("excessiveFlags", flags >= 3);
            return map;
        }).collect(Collectors.toList());

        long submittedCount = attempts.stream().filter(a -> "SUBMITTED".equals(a.getStatus())).count();
        long totalFlags = rows.stream().mapToLong(r -> (Long) r.get("flags")).sum();

        Map<String, Object> payload = Map.of(
                "examId", examId,
                "students", rows,
                "submittedCount", submittedCount,
                "totalCount", attempts.size(),
                "totalFlags", totalFlags
        );

        messagingTemplate.convertAndSend("/topic/progress/" + examId, payload);
    }
}
