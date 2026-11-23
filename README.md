# SOS v3 — Scholar's Operating System

> A unified, local-first digital learning operating system and cognitive workspace designed for intense academic reading, synthesis, active recall, and deep scholarly focus.

---

## 📖 Overview

**SOS (Scholar's Operating System)** is an integrated cognitive platform built for scholars, researchers, and autodidacts. It unites reading, structured note-taking, spaced-repetition flashcards, active recall quizzes, interactive whiteboards, and time-block calendar scheduling into a single distraction-free, local-first workspace.

### Key Capabilities
- **Scholarly Library**: Hierarchical knowledge graph, folder management, cover customization, and multi-format document indexing (PDF, DOCX, PPTX, MP4, Markdown).
- **Learning Suite**: Dedicated workspace with unified multi-tool tabs:
  - **Reading / Document Viewer**: PDF and document reader with annotation sync.
  - **BlockNote Editor**: Block-based rich-text note-taking with KaTeX LaTeX math support, callouts, and foldables.
  - **Spaced Repetition & Flashcards**: Active retrieval practice using SuperMemo-style SM-2 intervals.
  - **Interactive Canvas / Whiteboard**: Spatial diagramming, mental model sketching, and freeform mind-mapping.
  - **Examiner / Quiz Engine**: Automated knowledge checks and comprehension self-assessments.
- **Deep Work Tracking & Analytics**: Built-in stopwatch, countdown timer, and Pomodoro sessions with automated telemetry and activity heatmaps.
- **Calendar & Time Blocking**: Multi-view study scheduler (Day, Week, Month) with domain-tagged color coding and duration calculations.
- **Local-First & Offline Resilience**: Instant UI responsiveness backed by IndexedDB (Dexie.js) on the client with background PostgreSQL synchronization.
- **Obsidian Dark Aesthetic**: Strict 1px border geometry, cohesive dark palette (`#080808`, `#111113`, `#1E1E22`), and micro-tactile fluid interactions.

---

## 🛠️ Tech Stack

### Monorepo Structure
- **Package Manager**: `pnpm` workspaces (v12.21+)
- **Language**: TypeScript 7.0+ (ESM-native, Strict Mode, project references `tsc -b`)
- **Testing**: Vitest 5.1+ (Unit & Integration) and Playwright 1.65+ (End-to-End)

### Frontend (`apps/web`)
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS v4 + SOS Obsidian Dark design token system
- **Routing & State**: TanStack React Router, TanStack React Query, Zustand
- **Local Database**: Dexie.js 4 (IndexedDB with automatic offline persistence)
- **Editor & Canvas**: BlockNote Core/React, KaTeX math typesetting, Konva & Excalidraw spatial canvas

### Backend (`apps/api`)
- **Server**: Fastify 5 + TypeScript
- **Database**: PostgreSQL with `postgres.js` client and Drizzle ORM
- **Validation**: Zod schema contracts
- **AI Integration**: Vercel AI SDK + Google Gemini API (server-custody)
- **Document Processing**: `pdf-lib`, `pdfjs-dist`, `adm-zip`, and Gotenberg service integration

### Desktop (`apps/desktop`)
- **Shell**: Electron + electron-vite

### Core Packages (`packages/*`)
- `packages/contracts`: Zod schemas and shared API contracts
- `packages/domain`: Domain entities, validation, and pure business logic
- `packages/persistence`: Database clients and Dexie IndexedDB schemas
- `packages/editor`: Scholarly note editor engine and custom block extensions
- `packages/canvas`: Spatial canvas drawing and annotation layer
- `packages/ui`: Obsidian dark design tokens and UI primitives

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `>= 24.18.0`
- **pnpm**: `>= 12.21.0` (or `npm`)
- **PostgreSQL**: `>= 15.0` (Optional for local-only web testing; required for full API persistence)

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/abdallaa7med/sos-v3.git
cd sos-v3

# Install dependencies using pnpm (recommended)
pnpm install

# Alternatively, using npm:
npm install
```

### 2. Environment Configuration

Copy the example environment file:

```bash
# Root / backend configuration
cp .env.example .env.local
cp apps/api/.env.example apps/api/.env.local
```

Update `.env.local` with your PostgreSQL database credentials and optional `GEMINI_API_KEY`:

```env
DATABASE_URL=postgresql://sos_v3_app:YOUR_LOCAL_PASSWORD@127.0.0.1:5432/sos_v3_dev
PGHOST=127.0.0.1
PGPORT=5432
PGDATABASE=sos_v3_dev
PGUSER=sos_v3_app
PGPASSWORD=YOUR_LOCAL_PASSWORD
API_PORT=3001
HOST=127.0.0.1
# GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Running in Development

Start the development servers:

```bash
# Run web client (default development workflow)
npm run dev
# or: pnpm dev

# Run Fastify API server in watch mode
npm run dev:api
# or: pnpm dev:api

# Run Electron desktop shell
npm run dev:desktop
# or: pnpm dev:desktop
```

Once running:
- **Web App**: [http://localhost:5173](http://localhost:5173)
- **API Server**: [http://localhost:3001](http://localhost:3001)
- **API Documentation**: [http://localhost:3001/documentation](http://localhost:3001/documentation)

---

## 📦 Building for Production

Compile all packages and applications:

```bash
# Full monorepo build across all workspaces
npm run build
# or: pnpm build

# Project-wide TypeScript type checking
npm run typecheck
# or: pnpm typecheck
```

---

## 🧪 Testing

```bash
# Run unit & integration test suites (Vitest)
npm test
# or: pnpm test

# Run unit tests with test coverage
pnpm test:coverage

# Run End-to-End browser tests (Playwright)
pnpm test:e2e
```

---

## 📚 Living Documentation

SOS v3 follows a strict living blueprint standard. Detailed architecture specifications are in [`docs/`](./docs/):
- **[`docs/DESIGN.md`](./docs/DESIGN.md)**: Design system tokens, layout geometry, typography, and motion rules.
- **[`docs/SOS_TECHNICAL_ARCHITECTURE.md`](./docs/SOS_TECHNICAL_ARCHITECTURE.md)**: Database schemas, contracts, state hooks, and audit status.
- **[`docs/SOS_PRODUCT_AND_UX_SPEC.md`](./docs/SOS_PRODUCT_AND_UX_SPEC.md)**: Product specifications, workflows, and UX golden rules.
- **[`AGENTS.md`](./AGENTS.md)**: Developer & AI agent directives, folder structure, constraints, and coding rules.
