package com.examsmart.service;

import com.examsmart.model.ExamAttempt;
import com.examsmart.model.QuestionTemplate;
import com.examsmart.model.QuestionVariant;
import com.examsmart.repository.QuestionVariantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.expression.ExpressionParser;
import org.springframework.expression.spel.standard.SpelExpressionParser;
import org.springframework.expression.spel.support.StandardEvaluationContext;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

/**
 * Generates a unique, concrete QuestionVariant from a QuestionTemplate.
 * Supports:
 * 1. Hardcoded aptitude formulas (PERCENTAGE, SIMPLE_INTEREST, AVERAGE, PROFIT_LOSS, TIME_SPEED_DISTANCE)
 * 2. Custom mathematical expressions (MATH_EXPRESSION, EXPRESSION)
 * 3. Conceptual / Multiple Choice questions for any subject (MULTIPLE_CHOICE, CONCEPTUAL)
 */
@Service
public class QuestionGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(QuestionGeneratorService.class);

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final QuestionVariantRepository variantRepository;
    private final Random random = new Random();
    private final ExpressionParser expressionParser = new SpelExpressionParser();

    public QuestionGeneratorService(QuestionVariantRepository variantRepository) {
        this.variantRepository = variantRepository;
    }

    public QuestionVariant generate(QuestionTemplate template, ExamAttempt attempt, int order) {
        String formulaKey = template.getFormulaKey() != null ? template.getFormulaKey().toUpperCase() : "PERCENTAGE";
        Map<String, Object> rules = readRules(template.getVariableRulesJson());

        // Check if this is a multiple choice / conceptual question
        if ("MULTIPLE_CHOICE".equals(formulaKey) || "CONCEPTUAL".equals(formulaKey)) {
            return generateMultipleChoiceVariant(template, attempt, order, rules);
        }

        // Numeric or formula based questions
        Map<String, Integer> values = new HashMap<>();
        Map<String, Object> ranges = extractRanges(rules);

        ranges.forEach((key, rawRange) -> {
            if (rawRange instanceof Map<?, ?> rangeMap) {
                Object minObj = rangeMap.get("min");
                Object maxObj = rangeMap.get("max");
                int min = minObj instanceof Number numMin ? numMin.intValue() : 1;
                int max = maxObj instanceof Number numMax ? numMax.intValue() : 100;
                if (max < min) max = min + 10;
                values.put(key, min + random.nextInt(max - min + 1));
            }
        });

        BigDecimal correctAnswer = compute(formulaKey, values, rules);
        String renderedText = render(template.getTemplateText(), values);
        List<String> options = buildNumericOptions(correctAnswer);
        int correctIndex = options.indexOf(correctAnswer.stripTrailingZeros().toPlainString());
        if (correctIndex < 0) {
            options.set(0, correctAnswer.stripTrailingZeros().toPlainString());
            correctIndex = 0;
        }

        QuestionVariant variant = new QuestionVariant();
        variant.setTemplate(template);
        variant.setExamAttempt(attempt);
        variant.setVariableValuesJson(writeJson(values));
        variant.setRenderedText(renderedText);
        variant.setCorrectAnswer(correctAnswer);
        variant.setOptionsJson(writeJson(options));
        variant.setCorrectIndex(correctIndex);
        variant.setQuestionOrder(order);

        return variantRepository.save(variant);
    }

    private QuestionVariant generateMultipleChoiceVariant(QuestionTemplate template, ExamAttempt attempt, int order, Map<String, Object> rules) {
        String correct = (String) rules.getOrDefault("correct", "Option A");
        List<?> rawDistractors = (List<?>) rules.getOrDefault("distractors", List.of("Option B", "Option C", "Option D"));

        List<String> distractors = new ArrayList<>();
        for (Object d : rawDistractors) {
            distractors.add(String.valueOf(d));
        }

        List<String> options = new ArrayList<>();
        options.add(correct);
        options.addAll(distractors);

        // Ensure 4 options
        while (options.size() < 4) {
            options.add("None of the above");
        }
        if (options.size() > 4) {
            options = options.subList(0, 4);
        }

        Collections.shuffle(options, random);
        int correctIndex = options.indexOf(correct);
        if (correctIndex < 0) {
            options.set(0, correct);
            correctIndex = 0;
        }

        QuestionVariant variant = new QuestionVariant();
        variant.setTemplate(template);
        variant.setExamAttempt(attempt);
        variant.setVariableValuesJson("{}");
        variant.setRenderedText(template.getTemplateText());
        variant.setCorrectAnswer(BigDecimal.valueOf(correctIndex));
        variant.setOptionsJson(writeJson(options));
        variant.setCorrectIndex(correctIndex);
        variant.setQuestionOrder(order);

        return variantRepository.save(variant);
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> extractRanges(Map<String, Object> rules) {
        if (rules.containsKey("ranges") && rules.get("ranges") instanceof Map) {
            return (Map<String, Object>) rules.get("ranges");
        }
        Map<String, Object> ranges = new HashMap<>();
        rules.forEach((k, v) -> {
            if (!"expression".equalsIgnoreCase(k) && !"correct".equalsIgnoreCase(k) && !"distractors".equalsIgnoreCase(k)) {
                ranges.put(k, v);
            }
        });
        return ranges;
    }

    private BigDecimal compute(String formulaKey, Map<String, Integer> v, Map<String, Object> rules) {
        try {
            switch (formulaKey) {
                case "PERCENTAGE" -> {
                    double a = v.getOrDefault("a", 10);
                    double b = v.getOrDefault("b", 100);
                    return BigDecimal.valueOf(Math.round(a / 100.0 * b));
                }
                case "SIMPLE_INTEREST" -> {
                    double p = v.getOrDefault("p", 1000);
                    double r = v.getOrDefault("r", 5);
                    double t = v.getOrDefault("t", 2);
                    return BigDecimal.valueOf(Math.round(p * r * t / 100.0));
                }
                case "AVERAGE" -> {
                    double a = v.getOrDefault("a", 10);
                    double b = v.getOrDefault("b", 20);
                    double c = v.getOrDefault("c", 30);
                    return BigDecimal.valueOf(Math.round((a + b + c) / 3.0));
                }
                case "PROFIT_LOSS" -> {
                    double cp = v.getOrDefault("cp", 100);
                    double pct = v.getOrDefault("pct", 10);
                    return BigDecimal.valueOf(Math.round(cp * (1 + pct / 100.0)));
                }
                case "TIME_SPEED_DISTANCE" -> {
                    long s = v.getOrDefault("s", 50);
                    long t = v.getOrDefault("t", 2);
                    return BigDecimal.valueOf(s * t);
                }
                case "MATH_EXPRESSION", "EXPRESSION", "CUSTOM" -> {
                    String expr = (String) rules.getOrDefault("expression", "a + b");
                    StandardEvaluationContext ctx = new StandardEvaluationContext();
                    v.forEach(ctx::setVariable);
                    // Prepend # to variable tokens if not present
                    String spelExpr = expr;
                    for (String varName : v.keySet()) {
                        spelExpr = spelExpr.replaceAll("\\b" + varName + "\\b", "#" + varName);
                    }
                    Object val = expressionParser.parseExpression(spelExpr).getValue(ctx);
                    if (val instanceof Number n) {
                        return BigDecimal.valueOf(Math.round(n.doubleValue()));
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Error computing formula [{}]: {}", formulaKey, e.getMessage());
        }

        // Default fallback if unknown formula or expression calculation failed
        if (!v.isEmpty()) {
            long sum = v.values().stream().mapToLong(Integer::longValue).sum();
            return BigDecimal.valueOf(sum);
        }
        return BigDecimal.TEN;
    }

    private String render(String templateText, Map<String, Integer> values) {
        String result = templateText;
        for (var entry : values.entrySet()) {
            result = result.replace("{" + entry.getKey() + "}", String.valueOf(entry.getValue()));
        }
        return result;
    }

    private List<String> buildNumericOptions(BigDecimal correct) {
        Set<String> options = new LinkedHashSet<>();
        String correctStr = correct.stripTrailingZeros().toPlainString();
        options.add(correctStr);

        long correctVal = Math.max(1, correct.longValue());
        int attempts = 0;
        while (options.size() < 4 && attempts < 50) {
            attempts++;
            double pct = 0.1 + random.nextDouble() * 0.35;
            long delta = Math.max(1, Math.round(correctVal * pct)) * (random.nextBoolean() ? 1 : -1);
            long candidate = correctVal + delta;
            if (candidate > 0) {
                options.add(String.valueOf(candidate));
            }
        }
        long offset = 1;
        while (options.size() < 4) {
            options.add(String.valueOf(correctVal + (offset++)));
        }

        List<String> shuffled = new ArrayList<>(options);
        Collections.shuffle(shuffled, random);
        return shuffled;
    }

    private Map<String, Object> readRules(String json) {
        try {
            if (json == null || json.isBlank()) return Collections.emptyMap();
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            log.warn("Invalid variable_rules JSON on template: {}", json);
            return Collections.emptyMap();
        }
    }

    private String writeJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize JSON", e);
        }
    }
}
