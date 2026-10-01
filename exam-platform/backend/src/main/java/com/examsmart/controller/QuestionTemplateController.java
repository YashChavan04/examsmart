package com.examsmart.controller;

import com.examsmart.config.AuthenticatedUser;
import com.examsmart.dto.CreateTemplateRequest;
import com.examsmart.dto.QuestionTemplateDTO;
import com.examsmart.model.QuestionTemplate;
import com.examsmart.model.TopicStats;
import com.examsmart.repository.QuestionTemplateRepository;
import com.examsmart.repository.TopicStatsRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/question-templates")
public class QuestionTemplateController {

    private final QuestionTemplateRepository templateRepository;
    private final TopicStatsRepository statsRepository;

    public QuestionTemplateController(QuestionTemplateRepository templateRepository,
                                      TopicStatsRepository statsRepository) {
        this.templateRepository = templateRepository;
        this.statsRepository = statsRepository;
    }

    @GetMapping
    public List<QuestionTemplateDTO> listAll() {
        List<QuestionTemplate> templates = templateRepository.findAll();
        Map<UUID, TopicStats> statsMap = statsRepository.findAll().stream()
                .filter(s -> s.getTemplate() != null)
                .collect(Collectors.toMap(s -> s.getTemplate().getId(), s -> s, (s1, s2) -> s1));

        return templates.stream().map(t -> {
            TopicStats stats = statsMap.get(t.getId());
            Integer timesAnswered = stats != null ? stats.getTimesAnswered() : 0;
            Integer timesCorrect = stats != null ? stats.getTimesCorrect() : 0;
            Double accuracyRate = (timesAnswered != null && timesAnswered > 0)
                    ? (double) timesCorrect / timesAnswered
                    : null;

            String calibratedDifficulty = t.getDifficulty();
            if (accuracyRate != null && timesAnswered >= 2) {
                if (accuracyRate >= 0.70) calibratedDifficulty = "EASY";
                else if (accuracyRate <= 0.40) calibratedDifficulty = "HARD";
                else calibratedDifficulty = "MEDIUM";
            }

            return new QuestionTemplateDTO(
                    t.getId(),
                    t.getSubject(),
                    t.getTopic(),
                    t.getTemplateText(),
                    t.getFormulaKey(),
                    t.getVariableRulesJson(),
                    t.getDifficulty(),
                    t.getCreatedAt(),
                    timesAnswered,
                    timesCorrect,
                    accuracyRate,
                    calibratedDifficulty
            );
        }).toList();
    }

    @GetMapping("/{id}")
    public QuestionTemplate getById(@PathVariable UUID id) {
        return templateRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found"));
    }

    @PostMapping
    public ResponseEntity<QuestionTemplate> create(
            @Valid @RequestBody CreateTemplateRequest request,
            @AuthenticationPrincipal AuthenticatedUser authUser) {

        QuestionTemplate template = new QuestionTemplate();
        template.setSubject(request.subject().trim());
        template.setTopic(request.topic().trim());
        template.setTemplateText(request.templateText().trim());
        template.setFormulaKey(request.formulaKey().trim().toUpperCase());

        String rulesJson = request.variableRulesJson();
        if (rulesJson == null || rulesJson.isBlank()) {
            rulesJson = "{}";
        }
        template.setVariableRulesJson(rulesJson.trim());

        String diff = request.difficulty();
        if (diff == null || diff.isBlank()) diff = "MEDIUM";
        template.setDifficulty(diff.trim().toUpperCase());

        QuestionTemplate saved = templateRepository.save(template);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PostMapping("/bulk")
    public ResponseEntity<List<QuestionTemplate>> createBulk(
            @Valid @RequestBody List<CreateTemplateRequest> requests,
            @AuthenticationPrincipal AuthenticatedUser authUser) {

        List<QuestionTemplate> toSave = requests.stream().map(request -> {
            QuestionTemplate template = new QuestionTemplate();
            template.setSubject(request.subject() != null ? request.subject().trim() : "General");
            template.setTopic(request.topic() != null ? request.topic().trim() : "General");
            template.setTemplateText(request.templateText().trim());
            template.setFormulaKey(request.formulaKey() != null ? request.formulaKey().trim().toUpperCase() : "MULTIPLE_CHOICE");

            String rulesJson = request.variableRulesJson();
            if (rulesJson == null || rulesJson.isBlank()) {
                rulesJson = "{}";
            }
            template.setVariableRulesJson(rulesJson.trim());

            String diff = request.difficulty();
            if (diff == null || diff.isBlank()) diff = "MEDIUM";
            template.setDifficulty(diff.trim().toUpperCase());
            return template;
        }).toList();

        List<QuestionTemplate> saved = templateRepository.saveAll(toSave);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        if (!templateRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Template not found");
        }
        templateRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
