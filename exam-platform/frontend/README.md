# ExamSmart Frontend

React + Vite frontend for the Smart Online Examination & Assessment
Platform. Talks to the Spring Boot backend (`../backend`) over REST and a
STOMP/SockJS WebSocket for the live progress wall.

## Prerequisites

- Node.js 20.19+ or 22.12+ (Vite 8's minimum - these versions support
  `require(esm)` without a flag). Node 24, the current Active LTS, is recommended.
- The backend running on `http://localhost:8080` (see `backend/README.md`)

### Why React 18, not 19

This intentionally stays on React 18.3.x rather than jumping to 19. React 18
is the version the community currently treats as the safe, stable baseline;
early React 19 releases with Server Components had a disclosed vulnerability
(informally "React2Shell"), patched in 19.2.1+. Since this app doesn't use
Server Components at all, there's no upside to 19 here - only migration
risk with no compiler available in this sandbox to catch issues. Revisit
this once you're ready to test a 19 upgrade yourself.

## Setup

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. API calls to `/api/...` and the
`/ws` WebSocket are proxied to `localhost:8080` by `vite.config.js` — change
the `target` there if your backend runs elsewhere.

## Pages

| Route | Purpose |
|---|---|
| `/student` | Enter an exam ID + student ID and start an attempt (placeholder until auth exists) |
| `/student/exam/:attemptId` | Take the exam — timer, one question at a time, tab-switch flagging, submit |
| `/student/results/:attemptId` | Score, weak topics, and the auto-generated revision plan |
| `/faculty` | Create an exam by pasting question template IDs |
| `/faculty/progress/:examId` | Live progress wall — updates in real time over WebSocket |

## How the 3 unique features show up here

- **Randomized questions** — `ExamPage` just renders whatever
  `StartExamPage` received from `POST /attempts/start`; it never generates
  or sees correct answers itself, only the server-generated variant text/options.
- **Auto revision plan** — `ResultsPage` reads `weakTopics` and
  `revisionQuestions` straight from `GET /attempts/{id}/results` and
  renders them with `QuestionCard` in "reveal" mode.
- **Live progress wall** — `useProgressWall` hook opens one STOMP
  connection per faculty session and re-renders `ProgressWallPage` on every
  push from `ProgressWallService` — no polling.
- **Downloadable PDF report card** — `ResultsPage` links straight to
  `GET /attempts/{id}/report-card` (via `api.reportCardUrl`), so clicking
  it downloads the backend-generated PDF directly, no extra frontend PDF
  library needed.

## Known gotcha: "global is not defined"

If you ever see this in the browser console (usually from `sockjs-client.js`),
it means `vite.config.js`'s `define: { global: 'globalThis' }` isn't being
picked up - restart `npm run dev` after any vite.config.js change, since
Vite doesn't always hot-reload config changes. If a *different* Node-global
error shows up (e.g. "process is not defined" or "Buffer is not defined"),
the same fix pattern applies: add the missing global to that same `define`
block in vite.config.js.

## What's intentionally left out

- **Auth** — no login screen; `studentId`/exam creation assume you already
  have IDs (e.g. from a DB query), matching the backend scaffold's current state.
- **Revision question rendering** depends on the backend finishing the
  `RevisionQuestion` hydration noted as a TODO in `ResultsController` —
  until then, `/results` returns an empty `revisionQuestions` array and the
  page shows a placeholder note instead of crashing.
- Not yet tested against a live backend in this sandbox (no Node/npm
  available here to run it) — run `npm install && npm run dev` locally as
  your first step.

## Project layout

```
frontend/
├── package.json
├── vite.config.js
├── index.html
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── styles.css
    ├── api/client.js
    ├── hooks/useProgressWall.js
    ├── components/ (Timer, QuestionCard, ProgressBar)
    └── pages/
        ├── student/ (StartExamPage, ExamPage, ResultsPage)
        └── faculty/ (CreateExamPage, ProgressWallPage)
```
