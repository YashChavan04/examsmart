package com.examsmart.service;

import com.examsmart.model.*;
import com.examsmart.repository.QuestionVariantRepository;
import com.examsmart.repository.RevisionQuestionRepository;
import com.examsmart.repository.RevisionSetRepository;
import com.examsmart.repository.StudentAnswerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Builds the auto-generated personalized revision plan after an attempt
 * is graded: groups wrong answers by topic, then asks
 * QuestionGeneratorService to render 2-3 fresh variants per weak topic.
 * If there are no weak topics, generates one bonus/stretch question
 * instead so the plan is never empty.
 */
@Service
public class RevisionPlanService {

    private static final int QUESTIONS_PER_WEAK_TOPIC = 2;

    private final StudentAnswerRepository answerRepository;
    private final QuestionVariantRepository variantRepository;
    private final QuestionGeneratorService generatorService;
    private final RevisionSetRepository revisionSetRepository;
    private final RevisionQuestionRepository revisionQuestionRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RevisionPlanService(StudentAnswerRepository answerRepository,
                               QuestionVariantRepository variantRepository,
                               QuestionGeneratorService generatorService,
                               RevisionSetRepository revisionSetRepository,
                               RevisionQuestionRepository revisionQuestionRepository) {
        this.revisionSetRepository = revisionSetRepository;
        this.answerRepository = answerRepository;
        this.variantRepository = variantRepository;
        this.generatorService = generatorService;
        this.revisionQuestionRepository = revisionQuestionRepository;
    }

    @Transactional
    public RevisionSet build(ExamAttempt attempt) {
        // If revision set already exists for this attempt, return it
        Optional<RevisionSet> existing = revisionSetRepository.findByAttemptId(attempt.getId());
        if (existing.isPresent()) {
            return existing.get();
        }

        List<StudentAnswer> answers = answerRepository.findByAttemptId(attempt.getId());

        List<String> weakTopics = answers.stream()
                .filter(a -> Boolean.FALSE.equals(a.getIsCorrect()))
                .map(a -> a.getVariant().getTemplate().getTopic())
                .distinct()
                .collect(Collectors.toList());

        RevisionSet revisionSet = new RevisionSet();
        revisionSet.setAttempt(attempt);
        revisionSet.setWeakTopicsJson(writeJson(weakTopics));
        RevisionSet savedSet = revisionSetRepository.save(revisionSet);

        List<QuestionVariant> generatedVariants = new ArrayList<>();

        if (weakTopics.isEmpty() && !answers.isEmpty()) {
            // No gaps detected - give one bonus, harder-style question instead.
            QuestionTemplate anyTemplate = answers.get(0).getVariant().getTemplate();
            QuestionVariant bonus = generatorService.generate(anyTemplate, attempt, 0);
            generatedVariants.add(bonus);
        } else {
            int order = 0;
            for (String topic : weakTopics) {
                QuestionTemplate template = answers.stream()
                        .map(a -> a.getVariant().getTemplate())
                        .filter(t -> t.getTopic().equals(topic))
                        .findFirst().orElseThrow();

                for (int i = 0; i < QUESTIONS_PER_WEAK_TOPIC; i++) {
                    QuestionVariant variant = generatorService.generate(template, attempt, order++);
                    generatedVariants.add(variant);
                }
            }
        }

        // Persist the RevisionQuestion join rows
        for (QuestionVariant variant : generatedVariants) {
            RevisionQuestion rq = new RevisionQuestion();
            rq.setRevisionSet(savedSet);
            rq.setVariant(variant);
            revisionQuestionRepository.save(rq);
        }

        return savedSet;
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}