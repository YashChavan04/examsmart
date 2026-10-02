-- V3__add_review_flags.sql
-- Adds review_flags_json column to exam_attempts to persist student flagged-for-review questions across sessions and devices.

ALTER TABLE exam_attempts
  ADD COLUMN review_flags_json TEXT;
