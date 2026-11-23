# SOS v3 — AI Agent & Developer Directive (AGENTS.md)

Welcome to the **Scholar's Operating System (SOS v3)** codebase. This document outlines the technical guidelines, architecture constraints, and rules of engagement for AI agents (including Meta's Muse, Cursor, Antigravity, and other automated contributors) and human developers.

---

## 🏛️ 1. Single Source of Truth & Living Documentation

Before inspecting, writing, refactoring, or reviewing any code in this repository, you **MUST** consult the three authoritative living blueprints in [`docs/`](./docs/):

1. **[`docs/DESIGN.md`](./docs/DESIGN.md)**: The authoritative **SOS Obsidian Dark Design System**, color tokens, typography, iconography, single `1px` border geometry, 104px contextual toolbar, and micro-tactile motion rules. Mandatory reading before ANY UI changes.
2. **[`docs/SOS_TECHNICAL_ARCHITECTURE.md`](./docs/SOS_TECHNICAL_ARCHITECTURE.md)**: Monorepo topology, tech stack, database schemas, API contracts, state management, engineering guardrails, and module audit status tracker.
3. **[`docs/SOS_PRODUCT_AND_UX_SPEC.md`](./docs/SOS_PRODUCT_AND_UX_SPEC.md)**: Core concept, obsidian dark design tokens, layout geometry, module UX specifications, and UX Golden Rules.

> [!IMPORTANT]
> Whenever you complete an audit, refactoring, or major feature addition, you **MUST** update these three living documents to keep them strictly accurate with the codebase.

---

## 🌐 2. Project Overview

SOS v3 is a unified, local-first digital learning operating system and cognitive workspace designed for intense academic reading, active recall, knowledge synthesis, and deep scholarly focus.

### Core Modules
- **Home**: Daily briefing, quotes, reading resumes, tasks, and habit tracking.
- **Library**: Hierarchical knowledge graph, folder management, cover customization, and multi-format document indexing (PDF, DOCX, PPTX, MP4, Markdown).
- **Learning**: Tabbed multi-tool study suite with PDF document reading, BlockNote rich-text notes with LaTeX math, spaced repetition flashcards, spatial canvas whiteboards, and quizzes.
- **Tracking**: Deep-work timer (stopwatch, countdown, Pomodoro) with session history and analytics.
- **Calendar**: Time-blocking study schedule with multi-view calendar (Day, Week, Month) and duration calculations.
- **Profile & Settings**: Scholar telemetry, annual activity heatmaps, memory settings, and data management.

---

## 📂 3. Folder Structure

```
sos-v3/
├── apps/
│   ├── web/                     # React 19 + Vite 8 SPA Client
│   │   ├── src/
│   │   │   ├── components/      # Feature components (home, library, learning, canvas, calendar, tracking, profile, shell, ui)
│   │   │   ├── hooks/           # Custom React hooks
│   │   │   ├── pages/           # Route views (HomePage, LibraryPage, LearningPage, etc.)
│   │   │   ├── stores/          # Zustand state stores (shell, home, library, learning, tracking, calendar)
│   │   │   ├── styles/          # Global CSS and Tailwind v4 theme
│   │   │   ├── main.tsx         # Application entry point
│   │   │   └── router.tsx       # TanStack Router configuration
│   │   └── vite.config.ts       # Vite build configuration & API proxy
│   ├── api/                     # Fastify 5 + PostgreSQL Backend
│   │   ├── src/
│   │   │   ├── routes/          # REST API route handlers (library, learning, tracking, calendar, profile, settings, dev)
│   │   │   ├── db.ts            # PostgreSQL client connection pool
│   │   │   ├── db-init.ts       # Database schema initialization
│   │   │   ├── server.ts        # Fastify server instance & plugin registration
│   │   │   └── index.ts         # Backend service entry point
│   │   └── test/                # API integration test suites
│   └── desktop/                 # Electron desktop wrapper
│       └── src/                 # Electron main and preload processes
├── packages/
│   ├── contracts/               # Shared Zod validation schemas & API contracts
│   ├── domain/                  # Core domain entities, algorithms, and pure business logic
│   ├── persistence/             # Local database client (Dexie.js IndexedDB) & Postgres models
│   ├── editor/                  # Scholarly note editor engine & custom block extensions
│   ├── canvas/                  # Spatial diagramming and canvas annotation layer
│   └── ui/                      # Shared Obsidian Dark design tokens and primitives
├── docs/                        # Authoritative product and architecture specifications
├── e2e/                         # Playwright end-to-end browser tests
├── uploads/                     # Runtime uploads (demo seeds & local storage)
├── .env.example                 # Environment configuration template
├── package.json                 # Monorepo scripts and root dev dependencies
├── pnpm-workspace.yaml          # PNPM workspaces configuration
└── tsconfig.base.json           # Base TypeScript compiler options
```

---

## ⚡ 4. Main Commands

```bash
# Installation
pnpm install                   # Install all monorepo dependencies (recommended)
npm install                    # Alternative npm installation

# Development
npm run dev                    # Start web client (http://localhost:5173)
npm run dev:api                # Start backend API (http://localhost:3001)
npm run dev:desktop            # Start Electron desktop app

# Quality Assurance & Testing
npm run typecheck              # Run project-wide TypeScript type check (tsc -b)
npm test                       # Run all unit and integration tests (Vitest)
pnpm test:coverage             # Run test suite with coverage report
pnpm test:e2e                  # Run Playwright end-to-end tests

# Build
npm run build                  # Build all workspace packages and applications
```

---

## 📐 5. Coding Rules & Architectural Guardrails

1. **TypeScript Rigor**:
   - Strictly follow TypeScript project references (`tsc -b`).
   - Never use `// @ts-nocheck` or loose `any` bypasses.
   - All shared data models across web and api must be validated using Zod contracts in `packages/contracts`.
2. **Obsidian Dark Aesthetic**:
   - Strictly adhere to established color tokens:
     - Root background: `#080808`
     - Panels & cards: `#111113`
     - Elevated surfaces: `#1E1E22`
     - Borders: single `1px solid #2E2E34` (never double borders or heavy shadows)
     - High-contrast text: `#FAFAFA`
     - Muted text: `#8E8E93`
     - Accent: Electric blue (`#60A5FA`)
   - All central workspace views must adhere to `<PageContainer>` layout geometry.
3. **Local-First Data Flow**:
   - The UI must remain responsive offline via Dexie.js IndexedDB.
   - Fastify/PostgreSQL acts as the persistent system of record and background sync target.
4. **No Placeholders or Dummy Mocks**:
   - Do not write mock stubs or leave empty `TODO` implementations.
   - All tests (`pnpm typecheck`, `pnpm build`, `pnpm test`) must pass cleanly before committing code.

---

## 🚫 6. What NOT to Change

1. **Do NOT Regress Hardened Modules**:
   - The **`Library`** module is fully **Audited & Hardened** and serves as the benchmark implementation standard. Do not modify its architecture, contracts, or UX patterns without explicit user authorization.
2. **Do NOT Change Design Tokens or Palette**:
   - Do not replace the Obsidian Dark palette or introduce arbitrary colors/border styles without updating `docs/DESIGN.md`.
3. **Do NOT Expose API Keys on the Client**:
   - All AI integration (Gemini / LLM keys) must remain strictly under Fastify server custody (`apps/api`). Never expose API keys in client-side bundles or `apps/web`.
4. **Do NOT Remove Existing Living Documentation**:
   - Files in `docs/` (`DESIGN.md`, `SOS_TECHNICAL_ARCHITECTURE.md`, `SOS_PRODUCT_AND_UX_SPEC.md`) are the authoritative blueprints. Never delete or overwrite them with conflicting architecture.
5. **Do NOT Commit Secrets or Build Outputs**:
   - Never commit `.env`, `.env.local`, `dist`, `node_modules`, `test-results`, or runtime uploaded files.
