-- V2__seed_templates.sql (MySQL)
-- Sample templates matching the 5 formulas implemented in QuestionGeneratorService.
-- id has no database-side default (see V1's note on UUID handling), so
-- MySQL's UUID() function supplies one directly in the INSERT.
-- Replace created_by with a real faculty user id once users exist.

INSERT INTO question_templates (id, subject, topic, template_text, formula_key, variable_rules, difficulty)
VALUES
(UUID(), 'Aptitude', 'Percentage', 'What is {a}% of {b}?', 'PERCENTAGE',
  '{"a": {"min":10,"max":60}, "b": {"min":100,"max":900}}', 'MEDIUM'),

(UUID(), 'Aptitude', 'Simple Interest', 'Find the Simple Interest on {p} at {r}% p.a. for {t} year(s).', 'SIMPLE_INTEREST',
  '{"p": {"min":1000,"max":9000}, "r": {"min":4,"max":12}, "t": {"min":1,"max":4}}', 'MEDIUM'),

(UUID(), 'Aptitude', 'Average', 'Find the average of {a}, {b}, and {c}.', 'AVERAGE',
  '{"a": {"min":10,"max":40}, "b": {"min":10,"max":40}, "c": {"min":10,"max":40}}', 'EASY'),

(UUID(), 'Aptitude', 'Profit & Loss', 'An item costs {cp}. If sold at a profit of {pct}%, find the selling price.', 'PROFIT_LOSS',
  '{"cp": {"min":200,"max":900}, "pct": {"min":10,"max":40}}', 'MEDIUM'),

(UUID(), 'Aptitude', 'Time-Speed-Distance', 'A car travels at {s} km/h for {t} hours. Find the distance covered.', 'TIME_SPEED_DISTANCE',
  '{"s": {"min":30,"max":90}, "t": {"min":2,"max":6}}', 'EASY');
