# ExamSmart Backend

Spring Boot backend for the Smart Online Examination & Assessment Platform.
Implements the schema and architecture from `docs/architecture.md`, focused
on the three unique features:

- **Randomized questions** — `QuestionGeneratorService` renders a unique
  `QuestionVariant` per student from a `QuestionTemplate`, computing the
  answer and shuffling options server-side only.
- **Auto-generated revision plan** — `RevisionPlanService` groups wrong
  answers by topic after grading and generates fresh practice variants
  for each weak topic (or one bonus question if there are no gaps).
- **Live progress wall** — `ProgressWallService` pushes a snapshot of
  every student's status/progress/flags to `/topic/progress/{examId}`
  over WebSocket (STOMP) any time an attempt changes.
- **Downloadable PDF report card** — `ReportCardService` (using the
  open-source OpenPDF library) builds a PDF with score, weak topics, and
  a pointer to the online revision plan; `ReportCardController` serves it
  as a file download from `GET /attempts/{id}/report-card`.

## Prerequisites

- Java 25 (current LTS) - the project targets this explicitly in pom.xml.
  Older JDKs back to 17 will likely still compile (nothing here uses
  Java 25-only language features) but haven't been the target of the
  pinned Lombok version; if you're stuck on an older JDK, see the
  "Lombok/JDK mismatch" note below.
- Maven 3.9+
- MySQL 8.0+ running locally

## Setup

1. Create the database and user:

   ```sql
   CREATE DATABASE examsmart;
   CREATE USER 'examsmart'@'localhost' IDENTIFIED BY 'examsmart';
   GRANT ALL PRIVILEGES ON examsmart.* TO 'examsmart'@'localhost';
   FLUSH PRIVILEGES;
   ```

2. Adjust `src/main/resources/application.properties` if your DB credentials differ.

3. Run the app — Flyway will create all tables and seed the 5 sample
   question templates automatically on first boot:

   ```bash
   mvn spring-boot:run
   ```

4. API is available at `http://localhost:8080/api/...`, WebSocket at
   `ws://localhost:8080/ws`.

## Trying it end-to-end (no frontend yet)

```bash
# 1. Create a faculty + student user directly in the DB, or add an
#    AuthController (not included in this scaffold - see architecture.md).

# 2. Create an exam referencing the 5 seeded templates (get their IDs
#    from `SELECT id, topic FROM question_templates;`), then:
curl -X POST localhost:8080/api/exams -H "Content-Type: application/json" -d '{
  "title": "Unit Test 2",
  "subject": "Aptitude",
  "durationSeconds": 180,
  "startWindow": "2025-01-01T00:00:00Z",
  "endWindow": "2025-12-31T00:00:00Z",
  "templateIdsInOrder": ["<template-id-1>", "<template-id-2>", "..."]
}'

# 3. Start an attempt as a student (studentId query param is a stand-in
#    for the authenticated principal until Spring Security auth wired up):
curl -X POST "localhost:8080/api/attempts/start?studentId=<user-id>" \
  -H "Content-Type: application/json" -d '{"examId":"<exam-id>"}'

# 4. Answer, flag, submit, then fetch results:
curl -X POST localhost:8080/api/attempts/<attemptId>/answer -d '{...}'
curl -X POST localhost:8080/api/attempts/<attemptId>/submit
curl localhost:8080/api/attempts/<attemptId>/results

# 5. Download the PDF report card (only works after step 4's submit):
curl -o report-card.pdf localhost:8080/api/attempts/<attemptId>/report-card
```

## Not yet compiled

This was written in a sandbox without Maven/a JDK compiler available, so it
has **not** been run through `mvn compile` or tested against a real
database instance. Run `mvn clean compile` first thing after downloading —
there may be small fixes needed (e.g. `RevisionQuestion.PK` is missing
`equals`/`hashCode`, which Hibernate composite keys require).

`application.properties` sets `hibernate.type.preferred_uuid_jdbc_type=CHAR`
globally - without it, Hibernate 6 defaults every `UUID` column (including
every foreign key, not just primary keys) to `BINARY(16)` on MySQL, which
doesn't match the `CHAR(36)` columns in `V1__init.sql` and causes a
`SchemaManagementException` at startup (`wrong column type ... found
[char], but expecting [binary(16)]`) the first time Hibernate validates
each table that has a foreign key.

The jump to Spring Boot 3.5.16 / Java 25 / Lombok 1.18.48 was chosen based
on current compatibility documentation (Spring Boot 3.5.x officially
supports Java 17-25; Lombok's own JDK matrix lists 1.18.48 for JDK 27+,
comfortably covering 25), not from an actual successful build in this
sandbox. It's a much smaller jump than the 3.2.5 version this started on,
but still worth a close look at the first `mvn clean compile` output.

## What's intentionally left out of this scaffold

This is a first working skeleton, not the finished platform. Not yet implemented:

- **Auth** — no `AuthController`/JWT filter yet; `studentId` is passed as a
  raw query param as a placeholder. Wire up Spring Security + JWT next.
- **RevisionQuestion persistence** — `RevisionPlanService` generates the
  variants but doesn't yet save the `RevisionQuestion` join rows or return
  them fully hydrated in `ResultsController` — both are marked with `TODO`-style
  comments in the code.
- **Auto-calibrating difficulty** (`topic_stats`) — table exists in the
  migration but no service reads/writes it yet; this was the "stretch"
  feature from the architecture doc, not one of your chosen 3.
- **Frontend** — React app isn't part of this scaffold; endpoints above are
  ready for it to call.

## Project layout

```
backend/
├── pom.xml
├── src/main/java/com/examsmart/
│   ├── ExamSmartApplication.java
│   ├── config/WebSocketConfig.java
│   ├── model/            # JPA entities matching architecture.md's ERD
│   ├── repository/       # Spring Data JPA repositories
│   ├── service/          # QuestionGeneratorService, GradingService,
│   │                        RevisionPlanService, ProgressWallService
│   ├── controller/       # AttemptController, ExamController, ResultsController
│   └── dto/               # request/response records
└── src/main/resources/
    ├── application.properties
    └── db/migration/      # Flyway: V1__init.sql, V2__seed_templates.sql
```
