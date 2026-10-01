package com.examsmart.dto;

import java.util.List;
import java.util.UUID;

public record PracticeGradeRequest(List<Item> answers) {
    public record Item(UUID variantId, Integer selectedIndex) {}
}
