package com.examsmart.service;

import com.examsmart.model.*;
import com.examsmart.repository.QuestionVariantRepository;
import com.examsmart.repository.StudentAnswerRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class GradingService {

    private final QuestionVariantRepository variantRepository;
    private final StudentAnswerRepository answerRepository;
    private final CalibrationService calibrationService;

    public GradingService(QuestionVariantRepository variantRepository,
                          StudentAnswerRepository answerRepository,
                          CalibrationService calibrationService) {
        this.variantRepository = variantRepository;
        this.answerRepository = answerRepository;
        this.calibrationService = calibrationService;
    }

    /**
     * Grades every answer for this attempt against the stored correct_index
     * on each QuestionVariant (never against a freshly recomputed value),
     * and returns the final score. Called by AttemptController on submit.
     */
    public int grade(ExamAttempt attempt) {
        List<QuestionVariant> variants = variantRepository.findByExamAttemptIdOrderByQuestionOrderAsc(attempt.getId());
        List<StudentAnswer> answers = answerRepository.findByAttemptId(attempt.getId());

        int score = 0;
        for (QuestionVariant variant : variants) {
            StudentAnswer answer = answers.stream()
                    .filter(a -> a.getVariant().getId().equals(variant.getId()))
                    .findFirst().orElse(null);

            boolean correct = answer != null && answer.getSelectedIndex() != null
                    && answer.getSelectedIndex() == variant.getCorrectIndex();

            if (answer != null) {
                answer.setIsCorrect(correct);
                answerRepository.save(answer);
                calibrationService.recordAnswer(variant.getTemplate(), correct);
            }
            if (correct) score++;
        }

        attempt.setScore(score);
        attempt.setTotalQuestions(variants.size());
        attempt.setStatus("SUBMITTED");
        attempt.setSubmittedAt(Instant.now());
        return score;
    }
}
