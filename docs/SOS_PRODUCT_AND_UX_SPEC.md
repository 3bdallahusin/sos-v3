# SOS v3 — Product Vision & UX Bible

> **Status:** Living Master Product Specification & UX Benchmark  
> **Audience:** Product Managers, UI/UX Designers, Frontend Engineers, and AI Coding Agents  
> **Hardened Benchmark Standard:** The `Library` Module (Audited & Fully Hardened)

---

## 1. Product Vision & Core Concept

### 1.1 What is SOS?
**SOS (Studying Operating System)** is not a generic note-taking app, a cloud drive, or a detached flashcard utility. It is an **integrated digital learning operating system** built specifically for serious researchers, medical students, engineers, and autodidacts who require a single, unified environment for their entire intellectual lifecycle.

Traditional study workflows are fractured: a student downloads a 400-page medical textbook PDF in one app, makes notes in a second app, builds spaced-repetition flashcards in a third app, tracks study time in a fourth app, and manages deadlines in a calendar app. 

**SOS eliminates this tool fragmentation.** Every component—from document storage to active recall, interactive quizzes, focus tracking, and peer study groups—is deeply interconnected:
- Reading a textbook chapter seamlessly produces connected study notes, spaced-repetition decks, and concept maps.
- Every study session automatically feeds into personal retention metrics, focus analytics, and academic scheduling.
- The user operates within a single, distraction-free operating system canvas.

---

## 2. Design Philosophy & Visual Language

SOS enforces an uncompromising, distraction-free aesthetic inspired by the precision of operating systems like macOS and the clean, functional typography of Linear and Vercel.

### 2.1 The Obsidian Dark Palette (Anti-Glare Standard)
Learners spend 8 to 14 hours a day in front of screens. SOS strictly bans harsh contrast, pure white backgrounds, saturated neon gradients, and visual clutter.

| Surface / Token | Hex Value | Purpose |
| :--- | :--- | :--- |
| **Canvas Background** | `#080808` | Deep void canvas minimizing eye fatigue in dark environments |
| **Table & List Surfaces** | `#0C0C0E` | List table rows, secondary flat containers |
| **Elevated Surfaces** | `#111113` | Primary cards, content panes, popovers, and context menus |
| **Nested Chips & Badges**| `#161619` | Secondary chips, execution rows, inner sub-containers |
| **Structural Borders** | `#1E1E22` | Crisp `1px` outer borders separating panels without visual bulk |
| **Hovered Borders** | `#2E2E34` | Micro-tactile border reaction when hovering interactive cards |
| **Primary Crisp Action** | `#FAFAFA` | High-emphasis primary buttons, active text, document headings |
| **Secondary Text & Icons**| `#D4D4D8` / `#A1A1AA` | Body copy, secondary titles, uniform monochrome icons |
| **Muted Metadata** | `#8E8E93` / `#71717A` | File sizes, dates, item counts, monospace metrics |
| **Signature Accent** | `#60A5FA` | Universal accent for selection borders, `bg-[#60A5FA]/10` fills, drop target lines, and marquee box |

### 2.2 Monochrome Visual Discipline
- **Zero Emojis in File Systems**: Standard folder icons and file types use monochrome Lucide icons (`#A1A1AA` / `#D4D4D8`). No yellow folder emojis or colorful rainbow badges.
- **Strict Single `1px` Border Architecture**: Stacking concentric rings (`ring-1`) or double borders is strictly forbidden. Every card or row renders strictly **one** razor-sharp `1px` border.
- **Pure Minimalist Canvas**: Sub-headers, secondary filter bars, and cluttered search strips are eliminated from the top of the central workspace. All operations belong in the Global Top Header or the right-click `CanvasContextMenu`.

---

## 3. Global Navigation & Layout Architecture

```
┌──────────────┬────────────────────────────────────────────┬──────────────┐
│  LEFT RAIL   │             CENTRAL WORKSPACE              │   AI PANEL   │
│  (56px /     │                  (flex-1)                  │   (340px)    │
│   240px)     │                                            │              │
├──────────────┼────────────────────────────────────────────┼──────────────┤
│ 48px Header  │ 48px Header (Title + Breadcrumbs | Icons)  │ 48px Header  │
├──────────────┼────────────────────────────────────────────┼──────────────┤
│ 8 Nav Icons  │ Content Viewport (flex-1)                  │ Conversation │
│ Rail         │ (Document / Player / Canvas / Cards / Tool)│ Stream       │
│              │                                            │              │
├──────────────┼────────────────────────────────────────────┼──────────────┤
│ 104px Bottom │ CONTEXTUAL DOCKED BOTTOM TOOLBAR           │ Bottom Input │
│ Utilities    │ (104px height, 2-tier docked bar mounted   │ Dock         │
│              │  EXCLUSIVELY in canvas-enabled tools)      │              │
└──────────────┴────────────────────────────────────────────┴──────────────┘
```

1. **Left Navigation Rail**:
   - Collapsed (Default): `56px` fixed width with 7 monochrome destination icon buttons: **Home**, **Library**, **Learning**, **Tracking**, **Calendar**, **Profile**, and **Settings**.
   - Expanded: `240px` with section labels and expand toggle.
   - Bottom Utility Stack: `104px` height housing Settings button and User Profile Avatar.
2. **Minimal Global Top Header (48px)**:
   - **Left**: Module title and interactive clickable breadcrumbs (e.g. `Library > Subfolder > File`).
   - **Right**: Global Search (`⌘K`), Messages, and Notifications icons.
   - **Strictly No Secondary Controls**: Action buttons like `+ New Folder`, `Upload`, or `View Settings` are banished from the global top header to keep the interface pristine.
3. **Contextual Docked Bottom Toolbar (104px)**:
   - Mounted **exclusively** within canvas-enabled Learning tools (Notes, PDF Reader, Slides).
   - Never displayed or reserved in Home, Library, Tracking, Calendar, Settings, or Profile.

---

## 4. Module Specifications & Reference Standards

### 4.1 The Library Module (Hardened Master Standard)
The `Library` is the central file and knowledge management hub of SOS. It has been audited, refactored, and hardened to serve as the design and engineering benchmark for all other modules.

#### Functional Principles:
- **Clean Empty Canvas**: No permanent filter bars or action strips cluttering the top.
- **Desktop Context Menu (`CanvasContextMenu.tsx`)**:
  - Right-clicking anywhere on empty canvas reveals the full operating system control center:
    - `+ New Folder`: Opens sleek creation modal with monochrome icon picker.
    - `+ New File ▸`: Cascading submenu with all 11 study artifact types (`Note`, `Flashcards`, `Quiz`, `Exam`, `PDF`, `DOCX`, `Slides`, `Spreadsheet`, `Image`, `Video`, `Audio`).
    - `View ▸`: Instant toggle between `Grid`, `Gallery`, and `List` views.
    - `Size ▸`: `S`, `M`, and `L` layout dimensions.
    - `Sort By ▸`: Position, Name, Date Modified, Size, Type.
    - `Filter ▸`: 14 categories (`All`, `Folders`, `Files`, `PDF`, `DOCX`, `Slides`, `Note`, `Board`, `Video`, `Audio`, `Browser`, `Flashcards`, `Quiz`, `Exam`).
    - `Paste`: Active when items are in clipboard.
    - `Refresh`: Reloads folder contents from database.
- **Desktop-Grade Interactions**:
  - **Single-Click Universal Navigation**: Clicking any folder navigates into it immediately; clicking any file opens it directly in `Learning`. Double-clicking is never required.
  - **Inline Renaming (`F2`)**: Pressing `F2` or choosing `Rename` from the context menu converts the title into an in-place input matching the exact font size, weight, and line-height. Zero modal dialogs for renaming.
  - **Contiguous List Selection**: Adjacent selected rows in List view merge into a single continuous `#60A5FA` outline with subtle inner dividers, matching Windows File Explorer and macOS Finder.
  - **Rubber-Band Marquee Selection**: Dragging on empty canvas draws a `#60A5FA` box with 1-pixel edge touch sensitivity and continuous smooth auto-scroll.
  - **Multi-Item Drag and Drop**: Dragging any selected card moves the entire selection group into the destination folder.
  - **Bulk Operations via Context Menu & Shortcuts**: Multi-item bulk actions are executed strictly via the right-click `ItemContextMenu` (`Copy (N items)`, `Cut (N items)`, `Duplicate (N items)`, `Delete (N items)`) and standard keyboard shortcuts (`Ctrl+A`, `Ctrl+C`, `Ctrl+X`, `Ctrl+V`, `F2`, `Delete`, `Escape`). Strictly zero floating bulk action bar.
  - **Instant Auto-Upload**: Selecting a file in the upload modal or dropping files onto the canvas immediately uploads them with a progress toast and auto-closes the modal.

---

### 4.2 Cross-Module User Journeys

#### Journey 1: Library to Learning Seamless Handoff
1. User browses `Library` and clicks on `Kandel_Principles_of_Neural_Science.pdf`.
2. The router cleanly switches to `/learning`, finds or opens a dedicated tab `[PDF] Principles of Neural Science`.
3. The custom in-browser PDF engine (`pdfjs-dist`) renders the document instantly without external conversion servers.
4. On the right side, the **AI Study Companion** automatically loads the textbook's context, ready to generate chapter summaries, quiz questions, or flashcards.

#### Journey 2: Learning to Library Reverse Synchronization
1. Inside `Learning`, a user creates a new deck `Cellular Plasticity`, creates a whiteboard `Synaptic Plasticity.board`, or writes a study note `Synaptic Transmission`.
2. The system automatically creates a synchronized `LibraryItem` in the user's Library root folder.
3. The newly generated note or deck immediately appears in the `Library` with real metrics (e.g., `42 cards`, `1,250 words`).

#### Journey 3: Study Tracking & Calendar Orchestration
1. When studying a document or reviewing flashcards in `Learning`, the **Tracking** engine automatically records focus minutes, subject domain, and retention difficulty.
2. The **Tracking** dashboard visualizes this in the Annual Activity Heatmap and Mastery Analytics.
3. The **Calendar** schedules the next spaced-repetition review session automatically, linking directly back to the Library resource.

---

### 4.3 Implementation Status of Modules

The **`Library`**, **`Learning`**, **`Tracking`**, and **`Calendar`** modules are 100% audited, hardened, and verified with passing Playwright tests. The remaining modules have active implementations in the codebase that are **Pending Deep Audit & Hardening**:

1. **Learning (`/learning`)** — ✅ **Audited & Hardened**:
   - *Implementation*: Full browser-tab architecture with reordering, blank creation, file uploads, and library selection. Includes Universal Canvas Overlay, Shared PDF viewer with WASM decoders (JBIG2/OpenJPEG) for Arabic and scanned documents, 2-row docked bottom Excalidraw toolbar with 22 tools, dynamic context property bar, hide and bottom-edge hover-reveal sensor, smart Draw-to-Shape recognition, Bucket Fill flood fill, Sticky notes, Board `files_json` PostgreSQL persistence, and global keyboard shortcuts.
2. **Tracking (`/tracking`)** — ✅ **Audited & Hardened**:
   - *Implementation*: Unified with PostgreSQL `study_sessions`, `user_domains`, and `user_topics`. Balanced 50% / 50% split layout (`Row 1`: Left 50% `Today's Sessions`, Right 50% `Focus Timer Hero Card`; `Row 2`: Full-width compact `Annual Activity Heatmap` matching Profile with bottom-left `Current Streak: {streak}d • Total: {total}h` opposite `Less ... More`; `Row 3`: Single unified card with 50/50 internal split for `Learning Hours` on left and `Learning Distribution` on right). Clean session rows with 16px status icons (`planned` hollow ring, `in_progress` pulsing dot, `completed` checkmark, `missed` dashed alert ring), native drag-and-drop reordering with 2px `#60A5FA` drop indicator line and `PATCH /api/study-sessions/reorder` database persistence. Multi-line auto-wrapping title in timer hero. Continuous actual hours curve plotting across week days without shift. Top bar circular breadcrumb navigation (`← Tracking / Session History`), reverse chronological history day groups (`Today` at top), and real status badges. Two independent side-by-side fields (`DOMAIN` and `TOPIC (OPTIONAL)`) with absolute floating `z-50` dropdown menus in all session modals.
3. **Calendar (`/calendar`)** — ✅ **Audited & Hardened**:
   - *Implementation*: Unified with PostgreSQL `study_sessions`. Visual harmony block borders: calm `border-white/[0.08]` with checkmark icon for completed blocks, muted dashed border for missed blocks. Dynamic domain color legend derived directly from unique domains present in active schedule blocks. Overlapping horizontal column subdivision (`computeOverlapColumns`), side-by-side independent creatable domain/topic inputs, daily/weekly recurrence rules with concrete series tracking, Saturday/Monday configurable week start. Persistent State B dock inspection featuring icon-only `Play` focus launcher routing to Tracking. 30-minute interactive slots with subtle `+ Schedule HH:mm` hover hint.
4. **Home (`/home`)**:
   - *Current Implementation*: Greeting header, daily quote card, tasks section, quick resume row, flashcards review alert, and daily article reader modal.
   - *Audit Objective*: Verify real-time synchronization between "Quick Resume" and Library items; audit task completion persistence.
5. **Settings (`/settings`)**:
   - *Current Implementation*: General, Account, Usage, Memory, and AI Skills configuration panels backed by `/api/settings/*`. GeneralTab hardened with "Week Starts On" (Saturday vs. Monday).
   - *Audit Objective*: Complete audit of remaining tabs and PostgreSQL user preference synchronization.
6. **Profile (`/profile`) — Audited & Hardened**:
   - *Design Reference*: Stitch MCP `Profile — Social Media Style` (single-player obsidian dark specification).
   - *Top Header Card (Centered Identity)*:
     - Subtle monochrome cover banner (`180px` height) with top-to-bottom dark gradient overlay (`opacity-70 grayscale contrast-110`).
     - Top-right corner frosted-glass action buttons (`34px` square, `8px` rounded, `#121214/75 backdrop-blur-[8px]`):
       - `Share` button with `share-2` icon: copies canonical profile URL to clipboard and triggers a non-intrusive floating toast.
       - `Edit` button with `pencil` icon: routes directly to `/settings` (no modal dialogs).
     - Overlapping centered circular avatar (`80px`) with `2px #0A0A0A` border ring and `ring-1 ring-white/[0.12]`.
     - Centered display name (`22px` bold `#FAFAFA`), monospace handle (`@username` in `13px #8E8E93`), and 2-line bio (`13.5px #A1A1AA`, max width 600px).
     - Centered horizontal metadata row below bio: `Location` (MapPin), `Joined Date` (Calendar), and `Education` (GraduationCap).
   - *Telemetry Section (12-Column Responsive Bento Grid, 2/3 + 1/3)*:
     - Directly below the centered identity card, renders a responsive bento grid (`grid-cols-1 lg:grid-cols-12`, gap `16px`, `items-stretch`):
     - **Left Side — 2/3 Width (`lg:col-span-8`)**:
       - Shared reusable `<AnnualActivityHeatmap variant="profile" />` component filling full height (`h-full flex flex-col justify-between`).
       - Features soft, refined `#60A5FA` accent opacity ramp: Level 0 (`#161618` with `border border-white/[0.03]`), Level 1 (`rgba(96, 165, 250, 0.22)`), Level 2 (`rgba(96, 165, 250, 0.45)`), Level 3 (`rgba(96, 165, 250, 0.72)`), Level 4 (`#60A5FA`).
       - Compact pill-square cells (`w-full aspect-square max-w-[9px]`, `gap-[3px]`, `rounded-[3px]`) fitting all 52 weeks comfortably inside the 2/3 column without horizontal scrolling.
       - Bottom-right `Less ... More` obsidian legend matching the 5 color ramp tokens.
     - **Right Side — 1/3 Width (`lg:col-span-4`)**:
       - Vertical stack of 3 equal-height telemetry cards (`flex flex-col justify-between gap-3 h-full`):
         1. **Card 1 — `TOTAL STUDY TIME`** (Clock icon): Displays real total study hours computed from database.
         2. **Card 2 — `CURRENT STREAK`** (Flame icon): Displays real consecutive active days (>=600s focus).
         3. **Card 3 — `DAILY AVERAGE`** (Gauge icon): Displays real average study hours per active day (`totalStudyMinutes / 60 / activeDaysCount`).
       - Combined height of the 3 stacked cards matches the outer height of the heatmap on the left for exact top-to-bottom pixel alignment.
   - *Data Persistence & Telemetry Engine*:
     - User identity and settings persisted in PostgreSQL `user_profiles` table, bidirectionally synchronized with `Settings -> Account` and Dexie.js offline cache.
     - Telemetry powered by `GET /api/profile/telemetry`, performing real SQL aggregation over `study_sessions`.

---

## 5. UX Golden Rules (Never Violate)

Every engineer, designer, and AI coding agent working on SOS v3 must follow these non-negotiable UX rules:

1. **No Modal Dialogs for In-Place Actions**:
   - Renaming a folder or file MUST happen inline (`InlineRenameField.tsx`). Never spawn a popup modal to edit a string.
2. **Single-Click Universal Navigation**:
   - Clicking a card, row, or folder MUST execute the primary action immediately on the first click. Never require double-clicking.
   - Secondary selection is achieved via `Ctrl/Cmd + Click`, `Shift + Click`, or rubber-band marquee dragging.
3. **Zero Concentric / Double Borders**:
   - Never stack a border on top of a ring, or wrap a bordered table inside a bordered card. All boundaries must consist of strictly ONE continuous `1px` line (`#1E1E22`, hover `#2E2E34`, selected `!border-[#60A5FA] bg-[#60A5FA]/10`).
4. **Zero Viewport-Clipped Menus**:
   - Cascading submenus and context menus must dynamically measure viewport height and clamp their vertical coordinates (`window.innerHeight - submenuHeight - 12`) so every option is fully visible and reachable.
5. **Native In-Browser Media Rendering**:
   - PDFs, DOCX files, audio tracks, and videos must render directly in the app via browser canvas (`pdfjs-dist`). Never require external conversion servers or third-party webview plugins for basic document viewing.
6. **Instant Auto-Upload**:
   - When a user chooses a file in an upload dialog or drops files onto the canvas, start uploading immediately. Never require clicking a redundant "Start Upload" or "Submit" button.
7. **Strictly Respect the Obsidian Palette**:
   - Zero saturated purple, pink, or neon buttons. Accent colors are strictly reserved for functional signals (`#60A5FA` for focus/selection, `#EF4444` for destructive deletions, `#22C55E` for verified completions).
8. **Zero-FOUC & Hydration Gating**:
   - Never render default, fallback, or unfiltered mock values before local/cached state is hydrated.
   - Synchronously hydrate stores via `localStorage` initializers (`getInitialData()`) so the very first React paint contains real data.
   - In asynchronous loading states, render layout-matched `#121214` dark-mode skeleton placeholders (`<LibrarySkeletonView />`, `<HeroGreetingCard />` progress skeleton) until data is fully resolved, ensuring zero visual jump or layout shift on page mount or hard reload.
