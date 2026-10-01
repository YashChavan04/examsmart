package com.examsmart.controller;

import com.examsmart.model.ExamAttempt;
import com.examsmart.model.RevisionSet;
import com.examsmart.repository.ExamAttemptRepository;
import com.examsmart.repository.RevisionSetRepository;
import com.examsmart.service.ReportCardService;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/attempts")
public class ReportCardController {

    private final ExamAttemptRepository attemptRepository;
    private final RevisionSetRepository revisionSetRepository;
    private final ReportCardService reportCardService;

    public ReportCardController(ExamAttemptRepository attemptRepository,
                                 RevisionSetRepository revisionSetRepository,
                                 ReportCardService reportCardService) {
        this.attemptRepository = attemptRepository;
        this.revisionSetRepository = revisionSetRepository;
        this.reportCardService = reportCardService;
    }

    /**
     * Streams a downloadable PDF report card for a submitted attempt.
     * The Content-Disposition header alone is enough to make the browser
     * download it rather than try to navigate to it.
     */
    @GetMapping(value = "/{attemptId}/report-card", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> reportCard(@PathVariable UUID attemptId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Attempt not found"));

        if (!"SUBMITTED".equals(attempt.getStatus())) {
            throw new IllegalStateException("Report card is only available after the exam has been submitted");
        }

        RevisionSet revisionSet = revisionSetRepository.findByAttemptId(attemptId)
                .orElseThrow(() -> new IllegalArgumentException("Revision set not found for this attempt"));

        byte[] pdf = reportCardService.generate(attempt, revisionSet);
        String filename = "report-card-" + attemptId + ".pdf";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename(filename).build().toString())
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }
}
