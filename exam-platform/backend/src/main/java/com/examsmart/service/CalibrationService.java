package com.examsmart.service;

import com.examsmart.model.QuestionTemplate;
import com.examsmart.model.StudentAnswer;
import com.examsmart.model.TopicStats;
import com.examsmart.repository.QuestionTemplateRepository;
import com.examsmart.repository.StudentAnswerRepository;
import com.examsmart.repository.TopicStatsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@Service
public class CalibrationService {

    private static final Logger log = LoggerFactory.getLogger(CalibrationService.class);

    private final TopicStatsRepository statsRepository;
    private final QuestionTemplateRepository templateRepository;
    private final StudentAnswerRepository answerRepository;

    public CalibrationService(TopicStatsRepository statsRepository,
                              QuestionTemplateRepository templateRepository,
                              StudentAnswerRepository answerRepository) {
        this.statsRepository = statsRepository;
        this.templateRepository = templateRepository;
        this.answerRepository = answerRepository;
    }

    @Transactional
    public void recordAnswer(QuestionTemplate template, boolean isCorrect) {
        if (template == null || template.getId() == null) return;

        TopicStats stats = statsRepository.findByTemplateId(template.getId())
                .orElseGet(() -> {
                    TopicStats newStats = new TopicStats();
                    newStats.setTemplate(template);
                    newStats.setTimesAnswered(0);
                    newStats.setTimesCorrect(0);
                    return newStats;
                });

        int answered = (stats.getTimesAnswered() != null ? stats.getTimesAnswered() : 0) + 1;
        int correct = (stats.getTimesCorrect() != null ? stats.getTimesCorrect() : 0) + (isCorrect ? 1 : 0);
        double diffIndex = (double) correct / answered;

        stats.setTimesAnswered(answered);
        stats.setTimesCorrect(correct);
        stats.setDifficultyIndex(BigDecimal.valueOf(Math.round(diffIndex * 1000.0) / 1000.0));
        stats.setLastCalibrated(Instant.now());
        statsRepository.save(stats);

        // Calibrate difficulty tag on question template
        // Facility value >= 0.70 is Easy (high pass rate), <= 0.40 is Hard, otherwise Medium
        if (answered >= 2) {
            String newDiff;
            if (diffIndex >= 0.70) {
                newDiff = "EASY";
            } else if (diffIndex <= 0.40) {
                newDiff = "HARD";
            } else {
                newDiff = "MEDIUM";
            }
            if (!newDiff.equalsIgnoreCase(template.getDifficulty())) {
                template.setDifficulty(newDiff);
                templateRepository.save(template);
                log.info("Calibrated template [{}] ({}) difficulty from {} to {} (accuracy: {}%)",
                        template.getId(), template.getTopic(), template.getDifficulty(), newDiff, Math.round(diffIndex * 100));
            }
        }
    }

    @Transactional
    public int calibrateAll() {
        List<QuestionTemplate> templates = templateRepository.findAll();
        List<StudentAnswer> allAnswers = answerRepository.findAll();
        int calibratedCount = 0;

        for (QuestionTemplate template : templates) {
            List<StudentAnswer> answersForTemplate = allAnswers.stream()
                    .filter(a -> a.getVariant() != null && a.getVariant().getTemplate() != null
                            && a.getVariant().getTemplate().getId().equals(template.getId())
                            && a.getIsCorrect() != null)
                    .toList();

            TopicStats stats = statsRepository.findByTemplateId(template.getId())
                    .orElseGet(() -> {
                        TopicStats newStats = new TopicStats();
                        newStats.setTemplate(template);
                        return newStats;
                    });

            int answered = answersForTemplate.size();
            long correct = answersForTemplate.stream().filter(a -> Boolean.TRUE.equals(a.getIsCorrect())).count();
            double diffIndex = answered > 0 ? (double) correct / answered : 0.5;

            stats.setTimesAnswered(answered);
            stats.setTimesCorrect((int) correct);
            stats.setDifficultyIndex(BigDecimal.valueOf(Math.round(diffIndex * 1000.0) / 1000.0));
            stats.setLastCalibrated(Instant.now());
            statsRepository.save(stats);

            if (answered >= 2) {
                String newDiff;
                if (diffIndex >= 0.70) {
                    newDiff = "EASY";
                } else if (diffIndex <= 0.40) {
                    newDiff = "HARD";
                } else {
                    newDiff = "MEDIUM";
                }
                template.setDifficulty(newDiff);
                templateRepository.save(template);
                calibratedCount++;
            }
        }
        return calibratedCount;
    }
}
