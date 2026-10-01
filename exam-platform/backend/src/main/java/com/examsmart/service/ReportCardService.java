package com.examsmart.service;

import com.examsmart.model.ExamAttempt;
import com.examsmart.model.RevisionSet;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Builds the downloadable PDF report card: score, weak topics, and a note
 * pointing the student to their personalized revision plan online. Called
 * by ReportCardController once an attempt has been graded.
 */
@Service
public class ReportCardService {

    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final Color BRAND_BLUE = new Color(0x1F, 0x4E, 0x79);
    private static final Color ACCENT_BLUE = new Color(0x2F, 0x5F, 0xD6);
    private static final Color MUTED_GRAY = new Color(0x5B, 0x64, 0x72);

    public byte[] generate(ExamAttempt attempt, RevisionSet revisionSet) {
        try {
            Document document = new Document(PageSize.A4, 54, 54, 60, 54);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            PdfWriter.getInstance(document, out);
            document.open();

            Font titleFont = new Font(Font.HELVETICA, 20, Font.BOLD, BRAND_BLUE);
            Font examFont = new Font(Font.HELVETICA, 13, Font.BOLD);
            Font labelFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
            Font headingFont = new Font(Font.HELVETICA, 13, Font.BOLD);
            Font bodyFont = new Font(Font.HELVETICA, 11, Font.NORMAL);
            Font scoreFont = new Font(Font.HELVETICA, 30, Font.BOLD, ACCENT_BLUE);
            Font mutedFont = new Font(Font.HELVETICA, 9, Font.ITALIC, MUTED_GRAY);

            Paragraph title = new Paragraph("ExamSmart \u2014 Exam Report Card", titleFont);
            title.setAlignment(Element.ALIGN_CENTER);
            title.setSpacingAfter(4);
            document.add(title);

            Paragraph examTitle = new Paragraph(attempt.getExam().getTitle(), examFont);
            examTitle.setAlignment(Element.ALIGN_CENTER);
            examTitle.setSpacingAfter(24);
            document.add(examTitle);

            document.add(new Paragraph("Student: " + attempt.getStudent().getName(), labelFont));
            document.add(new Paragraph("Subject: " + attempt.getExam().getSubject(), labelFont));
            if (attempt.getSubmittedAt() != null) {
                String submitted = DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm")
                        .format(attempt.getSubmittedAt().atZone(ZoneId.systemDefault()));
                document.add(new Paragraph("Submitted: " + submitted, labelFont));
            }
            document.add(new Paragraph(" "));

            Paragraph scoreHeading = new Paragraph("Score", headingFont);
            scoreHeading.setSpacingBefore(6);
            document.add(scoreHeading);
            document.add(new Paragraph(attempt.getScore() + " / " + attempt.getTotalQuestions(), scoreFont));
            document.add(new Paragraph(" "));

            Paragraph weakHeading = new Paragraph("Weak Topics", headingFont);
            weakHeading.setSpacingBefore(10);
            document.add(weakHeading);

            @SuppressWarnings("unchecked")
            List<String> weakTopics = objectMapper.readValue(revisionSet.getWeakTopicsJson(), List.class);

            if (weakTopics.isEmpty()) {
                document.add(new Paragraph("No weak topics detected \u2014 great work!", bodyFont));
            } else {
                for (String topic : weakTopics) {
                    document.add(new Paragraph("\u2022 " + topic, bodyFont));
                }
            }
            document.add(new Paragraph(" "));

            Paragraph planHeading = new Paragraph("Personalized Revision Plan", headingFont);
            planHeading.setSpacingBefore(10);
            document.add(planHeading);
            document.add(new Paragraph(
                    weakTopics.isEmpty()
                            ? "Keep up the momentum \u2014 a bonus challenge question is waiting in your online results."
                            : "Targeted practice questions for the topics above are available on your online results page.",
                    bodyFont));

            Paragraph footer = new Paragraph("Generated automatically by ExamSmart", mutedFont);
            footer.setSpacingBefore(36);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

            document.close();
            return out.toByteArray();
        } catch (Exception e) {
            throw new IllegalStateException("Failed to generate report card PDF", e);
        }
    }
}
