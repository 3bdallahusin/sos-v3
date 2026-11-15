# SOS V3 — Phase 01 Manual Acceptance Testing Guide
**Version:** 1.0 — November 2026  
**Document Status:** Official Manual Testing Guide for Phase 01 Baseline  
**Active Baseline Commit:** `30fea07` (Phase 01 App Shell & Foundations)

---

## 1. Overview & Objectives

This guide is designed for manual testing of **Phase 01 — App Shell & Foundations**. It enables you to verify the persistent three-island layout, client-side routing, guest workspace identity in IndexedDB, Fastify 5 API endpoints, PostgreSQL 18.x connectivity, Electron desktop integration, and the persistent local background servers.

---

## 2. Web Application Endpoints

The Vite development server is actively running and bound to localhost loopback:
- Primary URL: **`http://localhost:5173`**
- Direct IPv4 Loopback: **`http://127.0.0.1:5173`**

### Canonical Primary Destination URLs

| Destination | Exact URL | Intended Phase Scope | Current Phase 01 Behavior |
| :--- | :--- | :--- | :--- |
| **Home** | `http://localhost:5173/` | Phase 02 | Active route with Phase 02 placeholder |
| **Library** | `http://localhost:5173/library` | Phase 03 | Active route with Phase 03 placeholder |
| **Learning** | `http://localhost:5173/learning` | Phase 04 | Active route with Phase 04 placeholder |
| **Tracking** | `http://localhost:5173/tracking` | Phase 05 | Active route with Phase 05 placeholder |
| **Calendar** | `http://localhost:5173/calendar` | Phase 06 | Active route with Phase 06 placeholder |
| **Community** | `http://localhost:5173/community` | Phase 07 | Active route with Phase 07 placeholder |
| **Profile** | `http://localhost:5173/profile` | Phase 08 | Active route with Phase 08 placeholder |
| **Settings** | `http://localhost:5173/settings` | Phase 09 | Active route with Phase 09 placeholder |

---

## 3. Backend API Endpoints

The Fastify 5 server is actively listening on **`http://127.0.0.1:3001`**.

### 3.1 Liveness Probe: `GET http://127.0.0.1:3001/health`
- **Expected Status:** `200 OK`
- **Expected Response Format:**
  ```json
  {
    "status": "ok",
    "timestamp": "2026-11-15T12:00:00.000Z",
    "version": "0.1.0",
    "uptime": 124.5
  }
  ```
- **Meaning:** Fastify process is running, responding to HTTP traffic, and healthy.

### 3.2 Readiness Probe: `GET http://127.0.0.1:3001/ready`
- **Expected Status:** `200 OK`
- **Expected Response Format:**
  ```json
  {
    "status": "ready",
    "database": "connected",
    "databaseName": "sos_v3_dev",
    "databaseUser": "sos_v3_app",
    "timestamp": "2026-11-15T12:00:00.000Z"
  }
  ```
- **Meaning:** Fastify executed a query (`SELECT current_database(), current_user`) directly against PostgreSQL and confirmed connection to the dedicated `sos_v3_dev` database using the restricted `sos_v3_app` role.
- **Troubleshooting a Failed Readiness Check (`503 Service Unavailable`):**
  If `/ready` returns `503 not_ready`:
  1. Check PostgreSQL service status: `Get-Service postgresql*` in PowerShell.
  2. Verify credentials in `apps/api/.env.local`.
  3. Inspect `logs/dev/api.log` for database error messages.
  4. Ensure PostgreSQL is listening on `127.0.0.1:5432`.

---

## 4. Desktop Electron Application

The desktop shell wraps the application inside an isolated Electron 45 window with hardened security settings.

### Launching the Desktop Application
Run from the project root:
```powershell
pnpm --filter @sos/desktop dev
```
*(Alternatively, you can run `pnpm dev:desktop` from the root directory).*

### Verifying Desktop Integration
1. The window should appear titled **`SOS — Studying Operating System`** with an obsidian background.
2. Open DevTools inside Electron using **`Ctrl+Shift+I`**.
3. In the Console tab, run:
   ```javascript
   window.sosDesktop
   ```
4. **Expected Output:**
   ```javascript
   { isDesktop: true, platform: "win32", getVersion: ƒ }
   ```
5. Run:
   ```javascript
   await window.sosDesktop.getVersion()
   ```
   **Expected Output:** `"0.1.0"`.

---

## 5. Comprehensive Manual Testing Checklist

| # | Test Area | What to Do | Expected Behavior | Failure Criteria | Implemented vs. Expected |
|:---|:---|:---|:---|:---|:---|
| **1.1** | **Shell Geometry: Header** | Open `http://localhost:5173/`. Open browser DevTools (`F12`), inspect the top header element (`[data-testid="global-header"]`). | Exact height is `48px`. Borders and background use obsidian zinc tokens (`#222226` border, `#0C0C0E` surface). | Height is not 48px, or element overflows. | **Implemented & Verified** |
| **1.2** | **Shell Geometry: Left Rail** | Inspect Left Rail (`[data-testid="left-rail"]`) in collapsed state. | Exact width is `56px` (`w-[56px]`). Icons are centered vertically in a 40px hit area. | Rail is 64px, or icons misalign. | **Implemented & Verified** |
| **1.3** | **Left Rail: Expand/Collapse** | Click the arrow button in the rail header or press `Ctrl+B`. | Rail smoothly animates from `56px` to `240px` with labels appearing. Clicking again collapses to `56px`. | Jerky animation, incorrect width, or labels remaining visible in 56px mode. | **Implemented & Verified** |
| **1.4** | **Shell Geometry: Right AI Panel** | Inspect Right AI Panel (`[data-testid="right-ai-panel"]`). | Exact width is `340px` (`w-[340px]`). Positioned at right edge of viewport. | Width deviates from 340px or causes central container to collapse. | **Implemented & Verified** |
| **1.5** | **AI Panel Toggle** | Click the collapse button (`X`) on the panel header, or press `Ctrl+J`. | Panel collapses/hides; central workspace smoothly expands to claim remaining horizontal space. Pressing `Ctrl+J` restores it. | Shortcut fails, or central workspace breaks layout. | **Implemented & Verified** |
| **1.6** | **Docked Toolbar Exclusion** | Inspect the DOM across all routes. Search for canvas or docked toolbar. | Zero docked toolbar DOM elements or reserved layout space exist. | A 104px footer or docked toolbar appears anywhere. | **Implemented (Strictly Excluded)** |
| **2.1** | **Navigation Destinations** | Click each of the 8 navigation icons in order from top to bottom. | Active route updates in browser address bar (`/`, `/library`, `/learning`, etc.). Nav icon receives active highlight pill (`#141417` bg, `#2A2A30` border). | Wrong route loaded, or icon doesn't show active state. | **Implemented & Verified** |
| **2.2** | **Direct URL Navigation** | Paste `http://localhost:5173/learning` directly into a new browser tab. | Loads directly into Learning destination with Learning nav icon active and breadcrumb showing `Guest Workspace / Learning`. | Blank screen, 404, or router redirecting to `/`. | **Implemented & Verified** |
| **2.3** | **Browser History (Back/Forward)** | Click through Home -> Library -> Tracking, then press Browser Back button twice. | Navigates back through history cleanly, updating active nav pills and breadcrumbs in lockstep. | Browser gets stuck or UI fails to update. | **Implemented & Verified** |
| **3.1** | **Header Breadcrumb** | Observe left side of the 48px global header. | Displays `Guest Workspace / <Active Destination Name>`. | Breadcrumb missing or shows incorrect destination. | **Implemented & Verified** |
| **3.2** | **Header Timer Mirror** | Observe right side of the global header. | Displays static pill: gray dot, `--:--`, and `IDLE`. Non-clickable mirror. | Timer runs independently or has clickable start/stop controls. | **Implemented (Static Inactive Mirror)** |
| **3.3** | **Search Shortcut Pill** | Click or press `Ctrl+K` on the `⌘K Search` pill. | Button is rendered as a visual cue. No command palette is opened. | N/A (Intentional Phase 01 boundary). | **Visual Cue Only (Phase 01)** |
| **4.1** | **AI Panel Context Status** | Inspect middle stream of AI panel. | Shows "SOS Assistant", "Guest (Local)" green status badge, and "Gemini 2.5 Flash" model indicator. | Panel shows error, or attempts to make outbound AI API calls. | **Implemented (Restrained Shell)** |
| **4.2** | **AI Input Dock** | Inspect bottom input dock of AI panel. | Shows disabled input with placeholder "Ask SOS Assistant...", disabled paperclip and send button. | Input allows submitting queries or triggers failed network requests. | **Implemented (Disabled Phase 01 Dock)** |
| **5.1** | **Guest Workspace Initialization** | Open DevTools (`F12`) -> Application tab -> IndexedDB -> `sos_local_v3` -> `workspaces`. | Exactly 1 record exists with `isGuest: true`, a valid UUIDv7 `id`, `name: "Guest Workspace"`, and ISO timestamps. | No database created, or multiple workspaces created on initial load. | **Implemented & Verified** |
| **5.2** | **Guest Workspace Resumption** | Refresh the browser page (`F5`) 5 times. Re-inspect the `workspaces` table in IndexedDB. | Exactly 1 record remains. The `id` is identical. `lastActiveAt` timestamp is updated to the latest reload time. Zero duplicate records. | Duplicate guest workspaces generated on refresh. | **Implemented & Verified** |
| **5.3** | **Rail Workspace Badge** | Inspect bottom of Left Navigation Rail (both collapsed and expanded). | In collapsed mode: shield check icon with tooltip showing workspace UUID. In expanded mode: shows "Guest Mode" and truncated 8-character workspace ID. | Shows "User" or prompts for login. | **Implemented & Verified** |
| **6.1** | **Backend Liveness Check** | In a browser or curl, navigate to `http://127.0.0.1:3001/health`. | Returns HTTP 200 with JSON payload `{ status: "ok", version: "0.1.0", uptime: ... }`. | Connection refused, 404, or 500 error. | **Implemented & Verified** |
| **6.2** | **Backend Readiness & DB Isolation** | Navigate to `http://127.0.0.1:3001/ready`. | Returns HTTP 200 with `{ status: "ready", database: "connected", databaseName: "sos_v3_dev", databaseUser: "sos_v3_app" }`. | Returns 503, or connects to `sos_v2_*`, or connects as `postgres` superuser. | **Implemented & Verified** |
| **7.1** | **Electron Startup** | Run `pnpm dev:desktop` in a terminal. | Electron window opens, loads Vite web interface seamlessly without console errors. | Window fails to open, white screen, or crash. | **Implemented & Verified** |
| **7.2** | **Electron Security Sandbox** | In Electron DevTools console, run `typeof require` and `typeof process`. | Both return `"undefined"`. Node.js integration is strictly disabled in renderer. | Returns `"function"` or `"object"`. | **Implemented & Verified** |

---

## 6. How to Safely Inspect IndexedDB in DevTools

To inspect guest workspace persistence without deleting or corrupting your data:

1. Open `http://localhost:5173` in Google Chrome, Microsoft Edge, or Brave.
2. Press **`F12`** (or **`Ctrl+Shift+I`**) to open DevTools.
3. Select the **Application** tab in the top tab bar of DevTools.
4. In the left sidebar, expand **Storage** -> **IndexedDB** -> **`sos_local_v3`**.
5. Click on the **`workspaces`** object store:
   - You will see a table row with:
     - `id`: e.g. `0193309a-2e4b-7000-8000-...` (RFC 9562 UUIDv7)
     - `name`: `"Guest Workspace"`
     - `isGuest`: `true`
     - `createdAt`: ISO 8601 string
     - `lastActiveAt`: ISO 8601 string
6. Click on the **`shellPreferences`** object store:
   - Contains saved UI preferences:
     - `shell:railExpanded`: `true` or `false`
     - `shell:aiPanelOpen`: `true` or `false`
7. **Safe Verification Test:** Toggle the left rail expanded, reload the page. Re-inspect `shellPreferences`. The value `shell:railExpanded` will persist as `true`.
8. > [!CAUTION]
   > Do **NOT** click "Clear site data" or right-click `Delete database` unless you intentionally want to test the first-launch generation of a brand-new workspace UUID.

---

## 7. Windows Keyboard Shortcuts Audit

During Phase 01 implementation, all keyboard shortcuts were audited for Windows compatibility:

| Shortcut | Visual Label | Windows Key Combination | Functional Status | Behavior |
|:---|:---:|:---:|:---:|:---|
| **Toggle AI Panel** | `⌘J` | **`Ctrl+J`** | **Fully Functional** | Toggles the 340px Right AI Assistant Panel open and closed. Key listener inspects `(e.metaKey \|\| e.ctrlKey) && e.key === 'j'`. |
| **Toggle Left Rail** | `⌘B` | **`Ctrl+B`** | **Fully Functional** | Toggles the Left Navigation Rail between 56px collapsed and 240px expanded. |
| **Global Search** | `⌘K` | **`Ctrl+K`** | **Visual Indicator Only** | Currently a visual header shortcut pill. No search modal or command palette is attached in Phase 01. |

> [!NOTE]
> The shortcut badges currently display the canonical macOS symbol `⌘` (as specified in `DESIGN.md`). On Windows, the underlying event listener handles `Ctrl` transparently.

---

## 8. What Is NOT Implemented (Intentional Phase Boundaries)

To prevent confusion during acceptance testing, the following features are **intentionally not implemented** in Phase 01:

1. **Home Dashboard (Phase 02):** The Home view displays a Phase 02 placeholder. Focus time metrics, recent activity feeds, and quick-resume rows will be built in Phase 02.
2. **Library Knowledge Base (Phase 03):** Folders, pages, gallery/list/table views, and `.sos` backup/export belong to Phase 03.
3. **All Eight Learning Tools (Phase 04):** Notes editor (Tiptap), spatial Canvas (Konva), PDF Reader (PDF.js), Slides (PPTX), Audio/Video players, integrated Browser, Flashcards (FSRS), and Quiz \| Exam will be implemented in Phase 04.
4. **Docked Canvas Toolbar (Phase 04):** The 104px two-tier docked toolbar is strictly excluded from Phase 01 and will mount only in canvas-enabled tools.
5. **Tracking Engine & Live Timer (Phase 05):** Study tracking sessions, Pomodoro intervals, and drift-free timestamps are Phase 05 scope. The Header Timer is intentionally in an inactive static mirror state (`--:-- Idle`).
6. **Academic Calendar (Phase 06):** Monthly schedules, review queues, and milestone deadlines belong to Phase 06.
7. **Peer Community (Phase 07):** Discovery catalog and independent copy forking belong to Phase 07.
8. **User Profiles & Authentication (Phase 08):** Login, Register, Password Reset, and account migration belong to Phase 08.
9. **Settings & AI Model Registry (Phase 09):** Dynamic Model Registry and storage inspectors belong to Phase 09.
10. **Active AI Conversations:** The Right AI Panel is an obsidian shell. No requests are sent to Gemini in Phase 01.

---

## 9. Persistent Local Development Servers Guide

A native Windows background supervisor ensures the Vite Web server and Fastify API server stay running continuously while your laptop is awake, and automatically start whenever you log into Windows.

### 9.1 Server Control Commands

All management scripts are located in `scripts/dev/`:

| Action | PowerShell Command | Description |
|:---|:---|:---|
| **Check Status** | `& "scripts\dev\status.ps1"` | Displays colorized status of Supervisor, API (3001), Web (5173), `/health`, `/ready`, and auto-start task. |
| **Start Servers** | `& "scripts\dev\start-dev.ps1"` | Launches background supervisor and verifies port bindings. |
| **Stop Servers** | `& "scripts\dev\stop-dev.ps1"` | Gracefully stops the supervisor and terminates process trees on ports 3001 and 5173. |
| **Restart Servers** | `& "scripts\dev\restart-dev.ps1"` | Performs clean stop followed by startup. |
| **Install Auto-start**| `& "scripts\dev\install-autostart.ps1"`| Registers Windows Scheduled Task `SOS_V3_DevServers` at user logon. |
| **Uninstall Auto-start**| `& "scripts\dev\uninstall-autostart.ps1"`| Removes the scheduled task from Windows Task Scheduler. |

### 9.2 How the Persistent Supervisor Operates
1. **Windowless Background Process:** Runs `powershell.exe -WindowStyle Hidden` executing `scripts/dev/supervisor.ps1`. No open command prompt window is required.
2. **Auto-Recovery on Crash:** Every 3 seconds, the supervisor verifies that Fastify API (port 3001) and Vite Web (port 5173) are active. If a process terminates or crashes unexpectedly, the supervisor automatically restarts it.
3. **Duplicate Prevention:** Before spawning child services, the supervisor inspects PID files and port bindings to prevent duplicate instances.
4. **Log Retention:** Output is captured in `logs/dev/`:
   - `logs/dev/supervisor.log`: Lifecycle and restart events.
   - `logs/dev/api.log`: Fastify stdout, request logging, and error output.
   - `logs/dev/web.log`: Vite dev server output and HMR status.
5. **Task Scheduler Detachment:** When installed via `install-autostart.ps1`, the task runs under the user's interactive session directly via Windows Task Scheduler (`AtLogOn`), persisting across sleep/wake cycles.
