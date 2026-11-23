# SOS v3 — Technical Architecture Specification

> **Status:** Living Master Architectural Specification & Forensic Reference  
> **Last Verified:** November 23, 2026  
> **Audited & Hardened Baseline:** `Library`, `Learning`, `Tracking`, `Calendar`, `Profile` (Certified Production Grade)  
> **Pending Deep Audit Modules:** `Home`, `Settings`

---

## 1. System & Monorepo Topology

SOS v3 is engineered as a high-throughput, strictly typed TypeScript monorepo managed via **pnpm workspaces**. It enforces rigorous separation of concerns across presentation, domain models, offline-first persistence, shared contracts, and backend services.

```
SOS v3/
├── apps/
│   ├── web/                    # React 19 SPA (Vite 8, TanStack Router, Zustand, Tailwind CSS)
│   ├── api/                    # Fastify 5 REST API & Server (Node.js, PostgreSQL with postgres.js)
│   └── desktop/                # Electron 34 Desktop Shell (electron-vite wrapper around apps/web)
├── packages/
│   ├── contracts/              # Shared Zod validation schemas & API request/response DTOs
│   ├── domain/                 # Pure TypeScript domain models, entity interfaces & types
│   ├── persistence/            # Dexie.js (IndexedDB) client database, schemas & SWR synchronizers
│   ├── editor/                 # Custom BlockNote / Tiptap rich-text & study block engine
│   ├── canvas/                 # React Konva / Excalidraw infinite whiteboard & diagramming engine
│   └── ui/                     # Design system primitives, SOSCard, typography tokens, KaTeX wrappers
├── docs/                       # Living architectural blueprints, design system & UX specifications
│   ├── DESIGN.md               # Authoritative SOS Obsidian Dark Design System
│   ├── SOS_PRODUCT_AND_UX_SPEC.md # Product vision, module UX specifications & UX Golden Rules
│   └── SOS_TECHNICAL_ARCHITECTURE.md # Topology, schemas, API contracts & Module Audit Tracker
├── e2e/                        # Playwright automated End-to-End test suites (e.g. library.spec.ts)
├── uploads/                    # Local persistent storage volume for user files and media
│   └── library/
│       ├── files/              # Uploaded documents (PDFs, DOCX, audio, video, slides)
│       └── covers/             # Uploaded custom folder & file banner cover art
└── scripts/                    # Test harnesses, screen capture scripts, and route verification tools
```

### Monorepo Package Responsibilities & Boundaries

| Package | Responsibility | Primary Consumers |
| :--- | :--- | :--- |
| `@sos/domain` | Pure TypeScript domain models, enums, entity definitions (`LibraryItem`, `LibraryAncestor`, `SOSFileType`, `LibraryItemKind`, `LearningTab`, `StudySession`, `UserProfile`, `CalendarBlock`). Zero external runtime dependencies. | All apps and packages |
| `@sos/contracts` | Shared Zod runtime validation schemas for HTTP endpoints, query parameters, mutations, and WebSocket payloads. Guarantees compile-time and runtime type safety between `api` and `web`. | `apps/api`, `apps/web` |
| `@sos/persistence` | Dexie.js offline-first IndexedDB database layer (`localLibraryItems`, `localNotes`, `localDecks`). Implements client-side caching, Stale-While-Revalidate (SWR) synchronization, and offline queueing. | `apps/web`, `apps/desktop` |
| `@sos/ui` | Core visual design system primitives (`SOSCard`, `PageContainer`, color tokens, micro-tactile motion classes, KaTeX LaTeX math renderers). Enforces the Obsidian Dark palette. | `apps/web`, `packages/editor` |
| `@sos/editor` | Native rich-text BlockNote / Tiptap study engine with custom callouts, flashcard blocks, inline math, and folder links. | `apps/web` (`Learning`, `Library`) |
| `@sos/canvas` | Infinite whiteboard engine powered by React Konva / Excalidraw for visual study boards, mind-maps, and anatomical diagrams. | `apps/web` (`Learning`) |

---

## 2. Tech Stack & Infrastructure

### 2.1 Frontend (`apps/web`)
- **Framework & Runtime**: React 19, TypeScript 5.8, Vite 8 (native ES modules and high-speed HMR).
- **Styling**: Tailwind CSS with customized design tokens (`#080808` canvas, `#0C0C0E` tables, `#111113` cards, `#1E1E22` borders, `#60A5FA` signature accent).
- **Routing**: Client-side hash/path router with code-split views, dynamic query parameters, and tab persistence.
- **Client State Management**:
  - `zustand`: Modular domain stores (`useLibraryStore`, `useLearningStore`, `useHomeStore`, `useTrackingStore`, `useCalendarStore`, `useSettingsStore`, `useShellStore`).
- **Client Offline Storage**: `dexie` (IndexedDB) with schema versioning and bulk transaction support.
- **Iconography & Rendering**: `lucide-react` (strictly monochrome Lucide icons, zero emojis), `pdfjs-dist` (native in-app PDF rendering without external conversion servers), `@blocknote/react`, `katex`.

### 2.2 Backend (`apps/api`)
- **Framework**: Fastify 5 with native TypeScript support.
- **Database Engine**: PostgreSQL connected via `postgres.js` with raw SQL template tags and automatic connection pooling (`sos_v3_dev`).
- **Middlewares & Security**:
  - `@fastify/multipart`: High-throughput binary streaming upload pipeline with 100MB limit.
  - `@fastify/helmet`: Security headers, frameguard, anti-mime sniffing.
  - `@fastify/cors`: Strict origin validation allowing web SPA and desktop shell origins.
  - Direct disk storage in `uploads/library/files/` and `uploads/library/covers/`.

### 2.3 Desktop Shell (`apps/desktop`)
- **Framework**: Electron 34 with `electron-vite`.
- **Architecture**: Isolated context bridge (`preload/index.cjs`), hardened IPC channels, native file system integration.

### 2.4 Testing & Verification
- **Unit & Integration**: Vitest for utility, contract, persistence, and store test coverage.
- **End-to-End**: Playwright test suite (`e2e/library.spec.ts`) executing 12 comprehensive automated tests against headless Chromium.

---

## 3. Database Architecture & Data Models

### 3.1 The `library_items` Schema (`apps/api/src/routes/library.ts`)
The `library_items` table is the architectural backbone for user knowledge assets, combining an **Adjacency List** (`parent_id`) with a **Materialized Path** (`ancestors` JSONB) for fast hierarchical queries without recursive CTEs.

```sql
CREATE TABLE IF NOT EXISTS library_items (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL DEFAULT 'default-user',
  name TEXT NOT NULL,
  item_kind TEXT NOT NULL,           -- 'folder' | 'file'
  file_type TEXT NOT NULL,           -- 'folder' | 'pdf' | 'docx' | 'slides' | 'spreadsheet' | 'image' | 'video' | 'audio' | 'note' | 'flashcards' | 'quiz' | 'exam' | 'board' | 'browser'
  parent_id TEXT REFERENCES library_items(id) ON DELETE CASCADE,
  ancestors JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array<{ id: string; name: string }>
  icon TEXT,                         -- Monochrome Lucide icon identifier (e.g. 'folder', 'book', 'microscope')
  cover_image TEXT,                  -- Relative URL or asset path to banner cover art
  position INTEGER NOT NULL DEFAULT 0, -- Lexicographical / manual drag-and-drop sort order
  storage JSONB DEFAULT '{}'::jsonb, -- Storage metadata (size, mime, local path, sha256)
  artifact_data JSONB DEFAULT '{}'::jsonb, -- Learning artifact metadata (metrics, question count, externalUrl)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_lib_user_id ON library_items(user_id);
CREATE INDEX IF NOT EXISTS idx_lib_position ON library_items(position);
CREATE INDEX IF NOT EXISTS idx_lib_parent_id ON library_items(parent_id);
CREATE INDEX IF NOT EXISTS idx_lib_name ON library_items(name);
CREATE INDEX IF NOT EXISTS idx_lib_item_kind ON library_items(item_kind);
```

#### Detailed Column Specifications:
- `user_id`: Multi-tenant isolation boundary. All queries enforce `WHERE user_id = $1`.
- `ancestors`: Pre-computed JSON array `[{"id":"root","name":"Library"},{"id":"f1","name":"Medicine"}]` allowing instant client breadcrumb generation without recursive queries.
- `position`: Sequential order index. When reordering items via drag-and-drop, positions are updated with `UPDATE library_items SET position = $1 WHERE id = $2`.
- `storage`: JSON structure for physical assets:
  ```json
  {
    "storageKey": "1795175497325_lecture.pdf",
    "originalFileName": "lecture.pdf",
    "mimeType": "application/pdf",
    "sizeBytes": 4404019,
    "storageProvider": "local"
  }
  ```
- `artifact_data`: JSON structure for synthesized learning tools:
  ```json
  {
    "linkedArtifactId": "deck-camkii",
    "externalUrl": "https://example.com/article",
    "metrics": {
      "cardCount": 42,
      "questionCount": 20,
      "wordCount": 1420
    }
  }
  ```

### 3.2 Database Schemas for Other Modules (`apps/api/src/db-init.ts`)

| Table Name | Primary Purpose | Key Schema Fields |
| :--- | :--- | :--- |
| `user_profiles` | Scholar identity and profile persistence | `id`, `name`, `username`, `email`, `bio`, `location`, `education`, `cover_image`, `avatar_url`, `learning_focus`, `plan`, `joined_date`, `created_at`, `updated_at` |
| `learning_tabs` | Open study sessions in Learning center workspace | `id`, `tool_type`, `title`, `resource_id`, `active`, `saved_state JSONB`, `position`, `created_at`, `updated_at` |
| `flashcard_decks` | Spaced-repetition card decks | `id`, `title`, `topic`, `total_cards`, `learning_count`, `review_count`, `mastered_count`, `created_at`, `updated_at` |
| `flashcards` | Individual cards with SM-2 spaced repetition | `id`, `deck_id`, `question`, `answer`, `ease_factor`, `interval`, `repetitions`, `next_review_date`, `status`, `order_index` |
| `quizzes` | Self-assessment test containers | `id`, `title`, `module`, `total_questions`, `created_at` |
| `quiz_questions` | Multiple-choice questions with rationales | `id`, `quiz_id`, `question_number`, `question`, `options JSONB`, `correct_option`, `explanation`, `distractor_rationales JSONB` |
| `exam_sessions` | Proctored exam timers & answers | `id`, `title`, `module`, `session_token`, `total_questions`, `time_remaining_seconds`, `status`, `score`, `answers JSONB`, `flagged JSONB`, `integrity_logs JSONB` |
| `media_items` | Audio and video lecture streams | `id`, `type`, `title`, `subtitle`, `instructor`, `media_url`, `duration_seconds`, `current_timestamp_seconds`, `chapters JSONB`, `tags JSONB`, `banner_url` |
| `transcript_segments` | Timestamped transcript text | `id`, `media_id`, `start_time`, `end_time`, `formatted_time`, `text`, `speaker`, `order_index` |
| `learning_documents` | Dual-layer rich-text notes | `id`, `tab_id`, `title`, `subtitle`, `cover_url`, `blocks_json JSONB`, `created_at`, `updated_at` |
| `learning_canvas_scenes` | Universal canvas drawing stages | `id`, `resource_id`, `resource_type`, `elements_json JSONB`, `app_state_json JSONB`, `version`, `created_at`, `updated_at` |
| `learning_blocks` | Scheduled calendar time blocks | `id`, `title`, `domain`, `topic`, `date`, `start_time`, `end_time`, `duration_minutes`, `created_at`, `updated_at` |

---

## 4. API Contracts & File Pipeline

### 4.1 `/api/library/*` Endpoint Reference (Verified Against `apps/api/src/routes/library.ts`)

| Method | Route Path | Request Payload / Params | Status | Description |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/library/items` | Query: `parentId?`, `search?`, `filter?`, `sortBy?`, `sortOrder?` | `200`, `500` | Fetch folders and files under a given folder with metadata |
| `GET` | `/api/library/items/:id` | URL param: `:id` | `200`, `404` | Fetch a single library item by ID with full storage metadata |
| `PATCH`| `/api/library/items/reorder` | `{ itemIds: string[], parentId?: string \| null }` | `200`, `400` | Bulk update position ordering indexes for sibling items |
| `POST` | `/api/library/folders` | `{ name: string, parentId?: string \| null, icon?: string \| null }` | `201`, `400` | Create a new directory and compute ancestor path |
| `POST` | `/api/library/upload` | `multipart/form-data` (`file`, `parentId?`) | `201`, `400`, `415` | Stream and store binary file to disk with auto-renaming collision avoidance |
| `POST` | `/api/library/artifacts` | `{ title: string, type: SOSFileType, parentId?: string \| null, icon?: string \| null, data?: Record<string, unknown> }` | `201`, `400` | Create or sync a learning study artifact (Notes, Board, Deck, Quiz, Exam) |
| `PATCH`| `/api/library/items/:id` | `{ name?, parentId?, icon?, position? }` | `200`, `400`, `404` | Update item name, move to destination folder, or update position |
| `POST` | `/api/library/items/:id/cover` | `multipart/form-data` or `{ coverUrl: string }` | `200`, `400`, `404` | Upload or set custom banner cover image for a folder or card |
| `DELETE`| `/api/library/items/:id/cover` | URL param: `:id` | `200`, `404` | Remove custom banner cover image from an item |
| `POST` | `/api/library/items/:id/duplicate`| `{ parentId?: string \| null }` | `201`, `400`, `404` | Duplicate an item with `(Copy)` naming suffix |
| `DELETE`| `/api/library/items/:id` | URL param: `:id` | `200`, `404` | Cascade delete folder/file and unlink physical disk files |

### 4.2 Multi-Item Bulk Operations Architecture
In `apps/web/src/stores/library-store.ts`, multi-item bulk operations leverage the atomic REST endpoints through concurrent promises with optimistic client-side cache updates:
- **Bulk Delete (`deleteItems(ids)`)**: Dispatches `bulkDeleteLocalLibraryItems(ids)` to Dexie and runs `Promise.all(ids.map(id => fetch(/api/library/items/${id}, { method: 'DELETE' })))`.
- **Bulk Move (`moveItems(ids, targetParentId)`)**: Runs `Promise.all(ids.map(id => fetch(/api/library/items/${id}, { method: 'PATCH', body: { parentId: targetParentId } })))`.
- **Bulk Duplicate (`duplicateItems(ids, targetParentId)`)**: Runs `Promise.all(ids.map(id => fetch(/api/library/items/${id}/duplicate, { method: 'POST', body: { parentId: targetParentId } })))`.
- **Bulk Reorder (`reorderItems(orderedIds)`)**: Sends single `PATCH /api/library/items/reorder` with `{ parentId, orderedIds }`.

### 4.3 File Upload & Storage Pipeline
1. **Extension Validation**: Rejects forbidden executable or dangerous extensions (`.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.js`, `.html`, `.svg`, `.ps1`) with `415 Unsupported Media Type`.
2. **Streaming Binary Pipeline**: Uses `@fastify/multipart` streaming directly to disk (`uploads/library/files/`) via `node:stream/promises` pipeline to minimize server memory footprint.
3. **Collision Avoidance**: If `lecture.pdf` exists in the destination folder, the server automatically saves `lecture (1).pdf` without overwriting prior user data.
4. **Physical Disk Unlink**: Deleting a file unlinks its physical binary from `uploads/library/files/` via `fs.unlinkSync()`.

---

## 5. Frontend State Management & Rendering Patterns

### 5.1 `useLibraryStore` (Zustand + Dexie SWR Caching)
The store coordinates client state with an offline-first **Stale-While-Revalidate (SWR)** flow:
1. **Instant Read from IndexedDB**: When navigating into a folder, `loadItems(folderId)` reads from Dexie's `localLibraryItems` table immediately, rendering zero-spinner UI.
2. **Background API Sync**: Dispatches `GET /api/library/items`. On arrival, differences are merged, Dexie is updated, and the UI re-renders without layout shifts.
3. **Optimistic Operations**: Creating, deleting, renaming, moving, and reordering items mutate local store state instantly; API mutations occur in the background with rollback on failure.
4. **Layout Preferences Persistence**: View (`grid` | `gallery` | `list`), card size (`S` | `M` | `L`), and sort options are saved to `localStorage` keys (`sos_library_view`, `sos_library_size`).

### 5.2 Desktop-Grade Marquee Selection (`useMarqueeSelection.ts`)
The marquee selection engine provides native operating system desktop fidelity:
- **Shared Viewport Coordinate Space**: Both the visual overlay (rendered with `position: fixed`) and item hit-tests (`el.getBoundingClientRect()`) use identical viewport-relative coordinates.
- **Strict 1-Pixel Edge Overlap**:
  ```ts
  const isIntersecting = !(
    marqueeRect.right < itemRect.left ||
    marqueeRect.left > itemRect.right ||
    marqueeRect.bottom < itemRect.top ||
    marqueeRect.top > itemRect.bottom
  );
  ```
  Touching even a single pixel of any card edge immediately highlights it in `#60A5FA`.
- **Continuous Edge Auto-Scroll Loop**: While `isMarqueeActive === true`, a `requestAnimationFrame` loop monitors a `36px` boundary inside the container edges and scrolls proportionally (`2px` to `8px` per frame), halting when reaching the true content `scrollHeight`.
- **ScrollHeight Inflation Elimination**: The marquee overlay is rendered outside the scrollable flow, ensuring the visual box cannot expand `canvasRef.scrollHeight`.
- **Hover Suppression**: Cards are wrapped in `pointer-events-none` during active drag, preventing `:hover` visual glitches, tooltip popups, and cursor flickering.
- **Click Suppression**: On `mouseup`, a transient `justFinishedMarqueeRef` flag suppresses the browser's synthetic click event for 120ms, preventing accidental file opening.

### 5.3 Cross-Module Synchronization Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│                          LIBRARY MODULE                         │
│                                                                 │
│  User clicks on:                                                │
│  - lecture.pdf   ──┐                                            │
│  - deck-camkii   ──┼──> LibraryPage.tsx: handleOpenFile()       │
│  - study-note    ──┘    Resolves toolType & linkedArtifactId    │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                         LEARNING MODULE                         │
│                                                                 │
│  LearningPage.tsx:                                              │
│  1. Checks useLearningStore.getState().tabs                     │
│  2. If tab for resource exists ──> switchTab(tabId)             │
│  3. If not, dispatches openTab(toolType, title, resourceId)     │
│  4. Mounts specialized view (PDF.js, SM-2, BlockNote, Excalidraw)│
│  5. AI Companion Panel opens on right rail with file context     │
└────────────────────────────────────┬────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                      REVERSE SYNC TO LIBRARY                    │
│                                                                 │
│  When a new note/deck/quiz/board is created in Learning:        │
│  Dispatches POST /api/learning/boards or /api/library/artifacts │
│  Item appears immediately in Library root folder               │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Zero-FOUC Hydration & Skeleton Architecture
To prevent Flash of Unstyled/Default Content (FOUC) and visual layout jumping during initial page mount or hard reload:
- **Synchronous Store Hydration**: `useSettingsStore` and `useLibraryStore` read their initial cached states directly from synchronous `localStorage` (`sos_user_settings_v3` and `sos_library_cache_root`) at store definition time, allowing React 19's very first render pass to contain genuine user data without flashing hardcoded defaults.
- **Pre-Render Filtering Pipeline**: In `useLibraryStore.loadItems()`, items retrieved from Dexie.js or the REST API are strictly run through `filterAndSortLibraryItems` (resolving `parentId`, `filter`, and `searchQuery`) *before* updating Zustand state, preventing temporary un-filtered paint passes.
- **Gated Skeleton Fallback**: Where asynchronous network or IndexedDB queries must be awaited, views render layout-matched `#121214` dark-mode skeleton loaders (`<LibrarySkeletonView />` with grid/gallery/list dimension matching, and `<HeroGreetingCard />` progress skeleton) whenever `isLoading && !isHydrated` or when displaying 0 items during an active fetch, guaranteeing zero layout shift.

---

## 6. Non-Negotiable Engineering Guardrails

1. **Zero Shortcuts or Stubs**: Every API route, modal, button, and context menu item must be 100% wired to live logic. Zero `TODO` comments or mock data fallbacks in production paths.
2. **Strict TypeScript Typing**: No `// @ts-nocheck` or `as any` escape hatches. All contracts must be shared via `@sos/contracts` and `@sos/domain`.
3. **Mandatory Verification Gates**: Every module audit or refactor must pass:
   ```bash
   pnpm typecheck   # tsc -b with 0 errors
   pnpm -r build    # Production build of all packages and applications
   pnpm test        # Vitest unit & integration test suites
   pnpm test:e2e    # Playwright end-to-end tests for all modules
   ```
4. **Preserve SOS Brand Geometry**: All cards must inherit `#111113` background, `#1E1E22` 1px border, `rounded-[12px]`, and `#60A5FA` accent.

---

## 7. Module Audit Status Tracker

| Module | Audit Status | Key Files | Known Technical Debt / Next Objectives |
| :--- | :--- | :--- | :--- |
| **Library** | ✅ **Audited & Hardened** | `LibraryPage.tsx`, `LibraryGridView.tsx`, `LibraryGalleryView.tsx`, `LibraryListView.tsx`, `CanvasContextMenu.tsx`, `ItemContextMenu.tsx`, `useMarqueeSelection.ts`, `routes/library.ts` | Complete master standard. 12/12 Playwright E2E tests passing. Single-click open, drag-and-drop reorder, bulk marquee operations, zero double-borders. |
| **Learning** | ✅ **Audited & Hardened** | `LearningPage.tsx`, `LearningTabBar.tsx`, `UniversalCanvasHost.tsx`, `DockedAnnotationToolbar.tsx`, `SharedPdfViewer.tsx`, `LearningBoardView.tsx`, `LearningContextMenu.tsx`, `LearningWorkspaceGuideModal.tsx`, `routes/learning.ts` | Complete 2-row docked toolbar with 22 Excalidraw tools, dynamic context property bar, hide & hover-sensor reveal, Draw-to-Shape recognition, Bucket Fill, Sticky notes, WASM JBIG2/OpenJPEG Arabic PDF decoding, board `files_json` PostgreSQL persistence, and global keyboard shortcuts. |
| **Home** | ⏳ **Pending Audit** | `HomePage.tsx`, `home-store.ts`, `DailyQuoteCard.tsx`, `TasksSection.tsx`, `CentralWorkspace.tsx` | Verify real synchronization between Home "Recent Materials" and Library items; audit task completion state persistence. |
| **Tracking** | ✅ **Audited & Hardened** | `TrackingPage.tsx`, `tracking-store.ts`, `TrackingHeroCard.tsx`, `TrackingTodaySessions.tsx`, `AnnualActivityHeatmap.tsx`, `TrackingAnalyticsSection.tsx`, `SessionHistoryView.tsx`, `CreatableDomainTopicCombobox.tsx`, `routes/tracking.ts`, `routes/study-sessions.ts` | Fully unified with PostgreSQL `study_sessions`, `user_domains`, and `user_topics`. Balanced 50% / 50% split grid (Row 1: 50% Today's Sessions, 50% Focus Timer; Row 2: Compact Annual Activity Heatmap matching Profile with bottom-left streak & total metrics; Row 3: Single unified 50/50 card with Learning Hours on left and Learning Distribution on right). Clean session rows with 16px status icons (planned ring, in_progress pulsing dot, completed checkmark, missed alert ring), native drag-and-drop reordering with 2px `#60A5FA` indicator and `PATCH /api/study-sessions/reorder` persistence. Multi-line auto-wrapping title in timer hero. Continuous actual hours curve plotting. Top Bar circular breadcrumb navigation (`← Tracking / Session History`), reverse chronological history day groups (`Today` at top), and real status badges. Two independent side-by-side fields (`DOMAIN` and `TOPIC`) with absolute floating `z-50` dropdowns in all session modals. |
| **Calendar** | ✅ **Audited & Hardened** | `CalendarPage.tsx`, `calendar-store.ts`, `CalendarWeekView.tsx`, `CalendarDayView.tsx`, `CalendarMonthView.tsx`, `CalendarBottomDock.tsx`, `ScheduleLearningBlockModal.tsx`, `routes/study-sessions.ts`, `routes/calendar.ts` | Fully unified with PostgreSQL `study_sessions`. Visual harmony block borders: calm `border-white/[0.08]` with checkmark icon for completed blocks, muted dashed border for missed blocks. Dynamic domain color legend derived directly from unique domains present in active schedule blocks. Overlapping horizontal column subdivision (`computeOverlapColumns`), side-by-side independent creatable domain/topic inputs, daily/weekly recurrence rules with series tracking, Saturday/Monday configurable week start. Persistent State B dock inspection featuring icon-only `Play` focus launcher routing to Tracking. 30-minute interactive slots with subtle `+ Schedule HH:mm` hover hint. |
| **Settings** | ⏳ **Pending Audit** | `SettingsPage.tsx`, `settings-store.ts`, `routes/settings.ts`, `SettingsLayout.tsx`, `GeneralTab.tsx` | GeneralTab hardened with "Week Starts On" (Saturday vs. Monday); remaining tabs pending audit. |
| **Profile** | ✅ **Audited & Hardened** | `ProfilePage.tsx`, `AnnualActivityHeatmap.tsx`, `AccountTab.tsx`, `LeftRail.tsx`, `routes/profile.ts`, `routes/settings.ts`, `e2e/profile.spec.ts`, `e2e/profile-fixes.spec.ts` | Fully aligned with Stitch MCP `Profile — Social Media Style` single-player specification. Backed by PostgreSQL `user_profiles` schema and real telemetry aggregation engine (`/api/profile/telemetry`). Centered 80px circular avatar with ring border, frosted action buttons (`Share` with clipboard toast, `Edit` routing to `/settings`), centered bio and metadata (`Location`, `Joined Date`, `Education`). 12-column responsive Bento Grid below identity card: Left 2/3 (`lg:col-span-8`) houses `<AnnualActivityHeatmap />` with soft `#60A5FA` opacity ramp (`#161618` empty to `rgba(96,165,250,*)` and `#60A5FA` peak) and `3px` rounded pill-square cells fitting 52 weeks without horizontal scroll; Right 1/3 (`lg:col-span-4`) houses 3 equal-height stacked telemetry cards (`TOTAL STUDY TIME`, `CURRENT STREAK`, `DAILY AVERAGE`) aligned pixel-for-pixel to the heatmap. 9/9 Playwright E2E tests passing. |
