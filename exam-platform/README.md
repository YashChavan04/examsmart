# ExamSmart — Merged Full-Stack Project

This folder contains both halves as siblings so Maven can build them
together into **one runnable JAR**:

```
exam-platform/
├── backend/    Spring Boot API (see backend/README.md for schema/architecture details)
└── frontend/   React app (see frontend/README.md for page-by-page details)
```

## Why "merged" doesn't mean one source file

A real Java backend (compiled classes, one class per file) and a React
frontend (JSX compiled by Vite) can't physically live in a single source
file — that's not how either language's tooling works. What *can* be
merged is the **deployable output**: the compiled React app becomes static
files, and Spring Boot can serve static files itself, so the two become
**one JAR that does everything** once built. That's what's wired up here.

## How the merge works

1. `frontend/vite.config.js` builds straight into
   `backend/src/main/resources/static/` instead of `frontend/dist/`.
2. `backend/pom.xml` has the `frontend-maven-plugin` added, which runs
   `npm install` and `npm run build` automatically during `mvn package`,
   *before* Maven copies `resources/` into the JAR.
3. `SpaFallbackController.java` forwards browser refreshes on client-side
   routes (like `/student/exam/123`) back to `index.html`, so React Router
   can still take over — otherwise Spring Boot would 404 on any route it
   doesn't recognize as a real server endpoint.
4. Result: `java -jar backend/target/exam-platform-backend-0.1.0.jar`
   starts one process that serves the API (`/api/...`), the WebSocket
   (`/ws`), **and** the whole React app, all on `http://localhost:8080`.

## Building & running the merged JAR

```bash
cd backend
mvn clean package        # builds the React app too, via frontend-maven-plugin
java -jar target/exam-platform-backend-0.1.0.jar
```

Then open `http://localhost:8080` — that's the whole app, frontend and
backend, from one process.

To skip rebuilding the frontend (e.g. while iterating on Java only):

```bash
mvn clean package -DskipFrontend
```

## Local development (unchanged, still two processes)

Day-to-day coding is still nicer as two separate dev servers with hot
reload, exactly as before:

```bash
# terminal 1
cd backend && mvn spring-boot:run

# terminal 2
cd frontend && npm run dev   # http://localhost:5173, proxies /api and /ws to :8080
```

Use the merged JAR for actual deployment/sharing a single artifact; use
the two-terminal setup while actively developing.

## Not yet verified

Same caveat as everything else generated in this sandbox: there's no
network access here, so `mvn clean package` (which needs to download the
frontend-maven-plugin, Node, and all npm packages) has **not actually been
run**. Try it locally as the real first test — the two most likely snags
are Maven not finding an internet connection for the plugin download, and
Node version conflicts if you already have a different Node installed
globally (the plugin installs its own local copy, so this is usually fine).
