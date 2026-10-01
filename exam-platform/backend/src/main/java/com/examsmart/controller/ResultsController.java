package com.examsmart.controller;

import com.examsmart.dto.PracticeGradeRequest;
import com.examsmart.dto.PracticeGradeResponse;
import com.examsmart.dto.QuestionResponseWithAnswerDTO;
import com.examsmart.dto.ResultsResponse;
import com.examsmart.model.ExamAttempt;
import com.examsmart.model.QuestionVariant;
import com.examsmart.model.RevisionQuestion;
import com.examsmart.model.RevisionSet;
import com.examsmart.repository.ExamAttemptRepository;
import com.examsmart.repository.QuestionVariantRepository;
import com.examsmart.repository.RevisionQuestionRepository;
import com.examsmart.repository.RevisionSetRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/attempts")
public class ResultsController {

    private final ExamAttemptRepository attemptRepository;
    private final RevisionSetRepository revisionSetRepository;
    private final RevisionQuestionRepository revisionQuestionRepository;
    private final QuestionVariantRepository variantRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ResultsController(ExamAttemptRepository attemptRepository,
                             RevisionSetRepository revisionSetRepository,
                             RevisionQuestionRepository revisionQuestionRepository,
                             QuestionVariantRepository variantRepository) {
        this.attemptRepository = attemptRepository;
        this.revisionSetRepository = revisionSetRepository;
        this.revisionQuestionRepository = revisionQuestionRepository;
        this.variantRepository = variantRepository;
    }

    @GetMapping("/{attemptId}/results")
    public ResultsResponse results(@PathVariable UUID attemptId) throws Exception {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found"));

        RevisionSet revisionSet = revisionSetRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Revision set not yet generated - has this attempt been submitted?"));

        @SuppressWarnings("unchecked")
        List<String> weakTopics = objectMapper.readValue(revisionSet.getWeakTopicsJson(), List.class);

        // Fetch persisted revision questions
        List<RevisionQuestion> revisionQuestionsList = revisionQuestionRepository.findByRevisionSetId(revisionSet.getId());
        List<QuestionResponseWithAnswerDTO> revisionQuestions = new ArrayList<>();

        for (RevisionQuestion rq : revisionQuestionsList) {
            QuestionVariant v = rq.getVariant();
            if (v != null) {
                @SuppressWarnings("unchecked")
                List<String> options = objectMapper.readValue(v.getOptionsJson(), List.class);
                revisionQuestions.add(new QuestionResponseWithAnswerDTO(
                        v.getId(),
                        v.getTemplate() != null ? v.getTemplate().getTopic() : "Revision",
                        v.getRenderedText(),
                        options,
                        v.getCorrectIndex()
                ));
            }
        }

        return new ResultsResponse(
                attempt.getScore() != null ? attempt.getScore() : 0,
                attempt.getTotalQuestions() != null ? attempt.getTotalQuestions() : 0,
                weakTopics,
                weakTopics.isEmpty(),
                revisionQuestions
        );
    }

    @PostMapping("/{attemptId}/practice-grade")
    public PracticeGradeResponse gradePractice(
            @PathVariable UUID attemptId,
            @RequestBody PracticeGradeRequest request) {

        if (!attemptRepository.existsById(attemptId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Attempt not found");
        }

        int score = 0;
        List<PracticeGradeResponse.ItemResult> itemResults = new ArrayList<>();

        if (request != null && request.answers() != null) {
            for (PracticeGradeRequest.Item item : request.answers()) {
                QuestionVariant variant = variantRepository.findById(item.variantId()).orElse(null);
                if (variant != null) {
                    boolean isCorrect = item.selectedIndex() != null && item.selectedIndex() == variant.getCorrectIndex();
                    if (isCorrect) score++;
                    itemResults.add(new PracticeGradeResponse.ItemResult(
                            item.variantId(),
                            item.selectedIndex(),
                            variant.getCorrectIndex(),
                            isCorrect
                    ));
                }
            }
        }

        return new PracticeGradeResponse(score, itemResults.size(), itemResults);
    }
}
