package com.examsmart.dto;

import java.util.List;

public record UpdateReviewFlagsRequest(
        List<String> flaggedVariantIds
) {}
