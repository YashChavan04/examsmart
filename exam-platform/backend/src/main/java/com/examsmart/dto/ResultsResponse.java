package com.examsmart.dto;

import java.util.List;

public record ResultsResponse(
        int score,
        int total,
        List<String> weakTopics,
        boolean noGaps,
        List<QuestionResponseWithAnswerDTO> revisionQuestions
) {}
