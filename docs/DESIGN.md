# SOS V3 — Design System & Visual Specification

**Status:** Authoritative Visual & Interaction Design Specification  
**Baseline Source:** Google Stitch Project (`projects/1366384921760863805`, "Studying Operating System UX Architecture") + Hardened SOS Reference Implementation.  
**Design Principles:** Obsidian Dark, Restrained Monochrome Contrast, Three-Island Shell, Single `1px` Border Architecture, Viewport-Clamped Cascading Controls, Focus-First Scholarly Workspace.

---

## 1. Design Philosophy & Core Tenets

The visual and spatial design of SOS V3 is built on five core tenets:
- **Obsidian Dark Palette**: Grounded on deep canvas black (`#080808`), table/list surfaces (`#0C0C0E`), and elevated cards & menus (`#111113`).
- **Restrained Monochrome & Signature Accent**: Chrome, typography, and iconography remain strictly monochrome (`#FAFAFA`, `#D4D4D8`, `#A1A1AA`, `#8E8E93`, `#71717A`). The signature accent `#60A5FA` is reserved for focus, active selection borders, `bg-[#60A5FA]/10` selection fills, marquee rubber-band drag boxes, and drag-and-drop insertion indicators.
- **Strict Single `1px` Border Architecture**: Every card, row, and popover enforces strictly ONE crisp `1px` boundary (`#1E1E22`, hover `#2E2E34`). Never stack borders on top of rings or wrap bordered tables inside bordered cards.
- **Minimalist Canvas Philosophy**: Top-level views feature a pure, distraction-free canvas with zero redundant sub-toolbars or permanent filter strips. Global navigation is handled by the Global Top Header breadcrumbs, while local creation, sorting, filtering, and view switches are delegated to the desktop right-click `CanvasContextMenu`.
- **Three-Island Shell & Contextual Toolbars**: The viewport is structured into three floating rounded islands separated by an 8px uniform spatial gap. The 104px docked bottom toolbar is mounted **contextually** exclusively in canvas-enabled Learning tools (Notes, PDF, Slides); non-canvas modules never reserve or display this footer.

---

## 2. Color Palette & Surface Tokens

### 2.1 Surfaces & Backgrounds
| Token Name | Hex / Value | Usage |
| :--- | :--- | :--- |
| `sos-base` | `#080808` | Primary canvas base, global workspace viewport |
| `sos-sidebar` | `#09090B` | Left navigation rail, right AI panel background, island container base |
| `sos-surface-list` | `#0C0C0E` | Table rows, list view surfaces, secondary flat containers |
| `sos-card` | `#111113` | Authoritative card surface token, elevated popovers, context menus |
| `sos-surface-chip` | `#161619` | Embedded action chips, metadata pills, internal sub-rows |
| `sos-hover` | `rgba(255, 255, 255, 0.05)` | Default hover state across buttons, menu items, and list rows |
| `sos-active` | `rgba(255, 255, 255, 0.09)` | Active / pressed state across interactive controls |

### 2.2 Borders & Dividers
| Token Name | Hex / Value | Usage |
| :--- | :--- | :--- |
| `sos-borderSubtle` | `#1E1E22` | Canonical hairline border for cards, rows, island borders, and dividers |
| `sos-borderHover` | `#2E2E34` | Hovered interactive card and row borders |
| `sos-borderSelected` | `#60A5FA` | Active selection border (`!border-[#60A5FA]` with `bg-[#60A5FA]/10` fill) |
| `sos-borderDefault` | `#27272A` | Secondary component borders, search input borders, modal outlines |
| `sos-borderFocus` | `#FAFAFA` | High-contrast keyboard focus indicators |

### 2.3 Typography & Foreground Colors
| Token Name | Hex / Value | Usage |
| :--- | :--- | :--- |
| `sos-primary` | `#FAFAFA` | Headings, active icons, primary titles, high-contrast action buttons |
| `sos-secondary` | `#A1A1AA` | Body copy, secondary titles, icon standard state |
| `sos-icon` | `#D4D4D8` | Crisp monochrome Lucide iconography across file trees and cards |
| `sos-muted` | `#8E8E93` / `#71717A` | Monospace metadata, word counts, timestamps, file sizes, item counters |
| `sos-disabled` | `#4B4B52` | Disabled buttons and non-interactive icons |
| `sos-placeholder` | `#63636B` | Input field placeholders |

### 2.4 Signature & Semantic Accents
| Token Name | Hex / Value | Usage |
| :--- | :--- | :--- |
| `sos-accent` | `#60A5FA` | Signature selection borders, `bg-[#60A5FA]/10` fills, marquee box, drop target lines |
| `sos-pomodoro` | `#F97316` | Active Pomodoro timer pulse, high-yield alert indicators |
| `sos-success` | `#22C55E` | Completed tasks, streak milestones, verified answers |
| `sos-error` | `#EF4444` | Incorrect answers, destructive deletions |
| `sos-warning` | `#F59E0B` | Pending reviews, deadline countdown warnings |

### 2.5 Academic Ink Swatches (Canvas Layer in Learning)
The two-tier docked bottom toolbar in canvas-enabled Learning tools specifies 5 muted academic ink swatches:
1. **Off-White**: `#FAFAFA` (default drawing stroke)
2. **Muted Amber**: `#D97706` (highlighting & key clinical points)
3. **Terracotta**: `#DC2626` (clinical alerts & errors)
4. **Slate Blue**: `#3B82F6` (diagram connectors & structures)
5. **Sage Green**: `#16A34A` (definitions & confirmed knowledge)

---

## 3. Typography & Iconography Standards

### 3.1 Font Families
- **Sans-Serif (Primary UI & System)**:
  `'Inter', 'IBM Plex Sans Arabic', -apple-system, BlinkMacSystemFont, sans-serif`  
  Used for all UI chrome, navigation, buttons, headings, card titles, and system dialogs.
- **Monospace (Data, Code & Tabular Metrics)**:
  `'JetBrains Mono', monospace`  
  Used for timers (`tnum`), timestamps, source code blocks, item counts (`0 items`), file sizes (`1.2 MB`), card metrics (`42 cards`), and math equations.

### 3.2 Iconography Rules
- **Strictly Uniform Monochrome Lucide Icons**: All file icons, folder icons, action triggers, and status indicators must use Lucide icons with uniform grayscale tones (`text-[#D4D4D8]` or `text-[#A1A1AA]`).
- **Zero Unicode Emojis**: Emojis (📁, 📂, 📄, 💡, 🚀) are strictly prohibited as folder or file icons in the file system, cards, or headers.
- **Zero Saturated Color Coding**: Do not color-code folder icons with arbitrary pastel or neon colors. The interface remains pure obsidian dark and monochrome.

---

## 4. Card, List & Menu Geometry

### 4.1 Strict Single `1px` Border Rule & Card Clipping Protection
- Every card, list item, and container uses strictly ONE continuous `1px` border:
  `border border-[#1E1E22] hover:border-[#2E2E34]`
- When selected, the element receives a crisp single `1px` accent border with soft tinted background:
  `!border-[#60A5FA] bg-[#60A5FA]/10`
- Redundant outer rings (`ring-1 ring-[#60A5FA]`) and inner border glows (`inset-[1px]`) are prohibited to prevent double-border defects.
- **Card Clipping Protection (`overflow-hidden`)**: All cards and elevated surfaces enforce `overflow-hidden` so inner image thumbnails, banners, and spotlight sheens never bleed past the rounded `12px` border radius, ensuring the outer `1px` border remains razor-sharp at all corners.

### 4.2 Unified 2-Row Card Structure (Grid & Gallery Views)
All card variants (`LibraryGridView.tsx` and `LibraryGalleryView.tsx`) follow the exact same two-row structure:
- **Row 1 (Identity)**:
  `<div className="flex items-center gap-2 min-w-0">`  
  Contains the monochrome Lucide icon (`w-4 h-4 text-[#D4D4D8] shrink-0`) and the title (`text-[13px] font-medium text-[#FAFAFA] truncate`).
- **Row 2 (Metadata & Action)**:
  `<div className="flex items-center justify-between mt-1 text-[11px] text-[#8E8E93] font-mono">`  
  Left side contains the metadata (`0 items`, `1.4 MB`, `32 cards`) left-aligned directly beneath the icon. Right side contains the `...` options button (`p-1 hover:bg-[#1E1E22] rounded text-[#A1A1AA] hover:text-[#FAFAFA]`), revealed on card hover or keyboard focus.

### 4.3 Contiguous Group Selection in List View
When multiple adjacent items are selected in `LibraryListView.tsx`, their borders merge into a single continuous `#60A5FA` outline:
- **First Item in Selected Run**: `!border-t !border-x !border-[#60A5FA] rounded-t-[10px]`
- **Intermediate Items**: `!border-x !border-[#60A5FA] border-t border-[#1E1E22] rounded-none`
- **Last Item in Selected Run**: `!border-b !border-x !border-[#60A5FA] rounded-b-[10px]`
- **Single Isolated Selection**: `!border !border-[#60A5FA] rounded-[10px]`

### 4.4 Viewport-Clamped Cascading Context Menus
All contextual menus (`CanvasContextMenu.tsx`, `ItemContextMenu.tsx`) adhere to strict positioning standards:
- **Container Styling**: `bg-[#111113] border border-[#1E1E22] rounded-[10px] shadow-[0_12px_32px_rgba(0,0,0,0.6)] py-1 min-w-[200px] z-50`
- **Vertical Clamping**: Submenus dynamically calculate their rendered height and clamp vertical coordinates to never exceed `window.innerHeight - submenuHeight - 12`, preventing menu overflow off the bottom of the screen.

---

## 5. Three-Island Shell Anatomy & Workspace Minimalism

### 5.1 Spatial Geometry
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

1. **Outer Viewport**: `padding: 8px` (`p-2`), background `#080808`.
2. **Gap Between Islands**: Uniform `8px` (`gap-2`).
3. **Left Navigation Rail**:
   - Collapsed: `56px` fixed width with 8 monochrome destination icon buttons.
   - Expanded: `240px` with section labels and expand toggle.
   - Bottom Utility Stack: `104px` height housing Settings button (`w-10 h-10`) and User Profile Avatar (`w-8 h-8`).
4. **Central Workspace Island**:
   - `flex-1 min-w-0`, background `#09090B`, border `#1E1E22`, radius `24px`.
   - **Global Top Header (48px)**: Left contains Title + interactive breadcrumbs (`Library > Subfolder`); right contains Global Search (`⌘K`), Messages, Notifications.
   - **Zero Sub-Toolbars**: Secondary action strips, permanent filter bars, and duplicate upload/view buttons are prohibited.
5. **Right AI Assistant Panel**:
   - `w-[340px]` fixed width, collapsible via `⌘J`.
   - Middle Chat Stream: Conversation with context badges.
   - Bottom Input Dock: Dynamic Model Selector, attachment trigger, prompt input.

### 5.2 Contextual Docked Bottom Toolbar (2-Row Excalidraw Parity)
- Mounted **exclusively** in canvas-enabled Learning tools (Notes, PDF Reader, Slides, Board).
- Anchored to bottom edge (`border-t border-[#27272A] bg-[#0E0E11]/98 backdrop-blur-md z-30`).
- **Collapsible with Hover-Sensor Reveal**: Clicking the `ChevronDown` button collapses the toolbar (`isDockHidden = true`) to free 100% of workspace height. An invisible bottom-edge hover sensor (`h-8 z-40`) reveals a floating pill (`Show Toolbar ↑`) to immediately restore the toolbar.
- **Two-Row Architecture**:
  - **Row 1 (40px Tool Palette)**: Multi-page navigation (`< 01 / 635 >`), Tool Lock (`Q`), Pan (`H`), Select (`V`/`1`), Rectangle (`R`/`2`), Diamond (`D`/`3`), Ellipse (`O`/`4`), Arrow (`A`/`5`), Line (`L`/`6`), Pen (`P`/`7`), Highlighter, Draw-to-Shape (smart stroke recognition), Bucket Fill (flood-fill), Text (`T`/`8`), Sticky Note (`S`/`9`), Insert Image (`I`), Eraser (`E`/`0`), Laser Pointer (`K`), Canvas Library, Undo (`Ctrl+Z`), Redo (`Ctrl+Y`), Workspace Guide (`?`), Collapse Dock.
  - **Row 2 (36px Dynamic Property Bar)**: Context-sensitive property controls reflecting native Excalidraw options for the active tool or selection:
    - *Shapes*: Stroke palette + custom hex picker, Fill color palette, Fill style (`Solid`, `Hachure`, `Cross-Hatch`), Stroke width (`1px`, `2px`, `4px`), Stroke style (`Solid`, `Dashed`, `Dotted`), Sloppiness (`Clean`, `Artist`, `Cartoon`), Edges (`Sharp`, `Round`), Opacity slider (`10-100%`), Layering (`Send to Back`, `Bring to Front`).
    - *Pen / Highlighter / Draw-to-Shape*: Stroke palette, stroke width, pressure simulation toggle, opacity slider.
    - *Text / Sticky Note*: Font family (`Virgil`, `Inter`, `Mono`, `Serif`), Font size (`S 16px`, `M 20px`, `L 28px`, `XL 36px`), Alignment (`Left`, `Center`, `Right`), Sticky card background palette.
    - *Bucket Fill*: Fill palette, Fill style, Opacity slider.
    - *Default / Select / Hand / Eraser / Laser*: Context guidance tip + quick actions (`Select All`, `Clear Canvas`).

---

## 6. Multi-Item Selection & Bulk Operations

### 6.1 Rubber-Band Marquee Selection
- **Visual Presentation**: Crisp `#60A5FA` border (`border border-[#60A5FA] bg-[#60A5FA]/10 pointer-events-none z-40`).
- **Coordinate Mathematics**: Renders via `position: fixed` using strict viewport-relative coordinates (`clientX`, `clientY`).
- **Hit-Testing**: Strict 1-pixel edge touch intersection against `item.getBoundingClientRect()`.
- **Edge Auto-Scroll**: RequestAnimationFrame-driven continuous auto-scroll when dragging within 40px of container edges.

### 6.2 Bulk Operations Architecture
- Multi-item bulk operations (Copy, Cut, Duplicate, Delete) are executed strictly through:
  1. The right-click **`ItemContextMenu`** (`Copy (N items)`, `Cut (N items)`, `Duplicate (N items)`, `Delete (N items)`).
  2. Standard keyboard shortcuts (`Ctrl+C`, `Ctrl+X`, `Ctrl+V`, `Delete`).
- **Zero Floating Bulk Bars**: The UI does not render floating action bars or toast strips for bulk operations, keeping the canvas unburdened.

---

## 7. Authentication Suite & Guest Mode

- **Floating Centered Modal Container**: `max-w-[980px]`, `rounded-[24px]`, border `1px solid #27272A`, `bg-[#0E0E11]/95`, backdrop-blur `20px`.
- **50/50 Desktop Split Layout**:
  - **Left Showcase Panel**: Minimalist scholarly photography with obsidian readability gradient overlay (`from-black/80 via-black/40 to-transparent`), SOS logo mark, headline (*"The Scholar's Operating System"*), and core value pillars.
  - **Right Form Panel**: Clean sign-in / registration form card with segmented mode switcher (`Login` / `Register`), floating input fields, social auth row (Google, Apple, GitHub), and high-contrast submit button.
- **Authoritative "Guest Mode →" Option**:
  ```html
  <a href="#/home" class="mt-[14px] text-[12.5px] text-[#71717A] hover:text-[#FAFAFA] font-medium text-center transition-colors">
    Guest Mode →
  </a>
  ```
  Provides immediate one-click access into the application without requiring credentials. All user data is persisted locally in IndexedDB/Dexie under an anonymous Guest profile.

### 7.1 Profile Module Design Specifications (Stitch MCP Social Media Style)
- **Top Header Identity Card**:
  - Surface: `#121214`, border: `1px solid rgba(255, 255, 255, 0.08)`, border-radius: `16px` (`rounded-2xl`).
  - Monochrome Cover Banner: `180px` height, `#161619` base, `opacity-70 grayscale contrast-110` with gradient `from-[#121214] via-[#121214]/35 to-black/25`.
  - Frosted-Glass Action Buttons: `34px x 34px`, `rounded-[8px]`, `bg-[#121214]/75`, `backdrop-blur-[8px]`, `border border-white/[0.1]` hover `border-white/[0.22]`, `text-[#E4E4E7]` hover `text-[#FFFFFF]`.
  - Centered Circular Avatar: `80px` diameter, `border-2 border-[#0A0A0A]`, `ring-1 ring-white/[0.12]`, overlapping banner by `40px` (`-mt-10`).
  - Typography: Display name in `22px` bold `#FAFAFA`, handle in `13px` monospace `#8E8E93`, bio in `13.5px #A1A1AA` (max width `600px`).
  - Metadata Row: Centered horizontal row with `13px #8E8E93` and `14px` Lucide icons (`MapPin`, `Calendar`, `GraduationCap`).
- **Annual Activity Heatmap Card**:
  - Full-width `bg-[#121214]` card, `52` columns x `7` rows, `3px` gap, 5-level obsidian legend (`#18181B`, `#1E3A5F`, `#1D4ED8`, `#2563EB`, `#60A5FA`). Bottom-right legend only, zero bottom-left metric clutter.
- **2-Column Telemetry Cards**:
  - Equal `grid-cols-2` layout, `p-5 bg-[#121214]`, uppercase monospace header labels (`11px #8E8E93`), `22px` bold white tabular numbers.

---

## 8. Accessibility (WCAG 2.2 AA) & Micro-tactile Motion

### 8.1 Accessibility Standards
- **Color Contrast**: Primary text (`#FAFAFA`) on dark surfaces (`#080808`, `#09090B`) exceeds `14:1` contrast ratio. Secondary text (`#A1A1AA`) exceeds `5.8:1`.
- **Keyboard Navigation**: High-contrast focus rings (`outline: 2px solid #FAFAFA`, `outline-offset: 2px`) on all buttons, inputs, tabs, and menu items.
- **Shortcuts**: `⌘K` global search, `⌘J` AI panel, `F2` inline rename, `Ctrl+A` select all, `Delete` delete selection.
- **Motion Safeguards**: Full support for `prefers-reduced-motion: reduce`.

### 8.2 Micro-tactile Motion (Linear/Vercel Standard)
- Standard transitions globally set to `150ms ease-out` across `transform, border-color, background-color, box-shadow, opacity`.
- Media and cover thumbnails: `group-hover:scale-[1.015]`.
- Interactive buttons and triggers: `hover:scale-[1.02]` and `active:scale-[0.98]`.
- Activity heatmap cells: `hover:scale-[1.15]`.
- Modals: `.animate-scale-up` (`scaleUp 0.12s ease-out both`) with `.animate-fade-in` (`fadeIn 0.12s ease-out both`) backdrop.
- Ambient indicators: Gentle opacity pulse (1.0 to 0.65) for active timers.

---

## 9. Standard Modal Shell & Dynamic Input Patterns

### 9.1 Standardized Modal Overlay Shell (`SOSModalShell`)
- Single source of truth for all centered application dialogs across Tracking, Calendar, and Settings.
- **Backdrop**: `bg-black/70 backdrop-blur-xs`, `z-50`.
- **Card Container**: `bg-[#111113]`, `border 1px solid #1E1E22`, `rounded-[16px]`, `p-6`, shadow-2xl.
- Strictly eliminates duplicate backdrop CSS, mismatched corner radiuses, and redundant inner scroll containers.

### 9.2 Dynamic Creatable Domain & Topic Combobox (`CreatableDomainTopicCombobox`)
- Fully replaces static domain/topic select lists with dynamic PostgreSQL-backed options from `/api/domains`.
- Features real-time search filtering, domain selection, topic drill-down, and inline creation (`+ Create Domain`, `+ Add Topic`).

### 9.3 Calendar Grid Geometry & Overlapping Subdivision
- **Time Axis**: Uniform 64px hourly rows (24h axis 00:00 to 24:00).
- **Overlapping Subdivision Algorithm (`computeOverlapColumns`)**:
  - Overlapping concurrent blocks within any day column divide the width evenly:
    - `left: calc((colIndex / totalCols) * 100% + 2px)`
    - `width: calc((1 / totalCols) * 100% - 4px)`
- **Visual Status Signals**:
  - `completed`: Subtle emerald border (`rgba(52,211,153,0.4)`), checkmark icon pill.
  - `missed`: Subtle rose border (`rgba(244,63,94,0.4)`), alert exclamation icon.
  - `planned`: Standard `#2C2C34` border with crisp 2.5px domain accent strip.
- **Selected Block Inspector (`CalendarBottomDock` State B)**:
  - Replaces disruptive modal popovers with calm persistent bottom dock inspection. Displays session details, domain pill, time range pill, duration pill, and icon-only `▶ Start Focus Session` button (seamless router handoff to active hero timer in Tracking), Edit, and scoped Delete (`single` vs. `following`).
- **Interactive 30-Minute Time Slots**:
  - Each 64px hourly row is subdivided into two 32px interactive slots (`:00` and `:30`) featuring subtle `hover:bg-white/[0.035]` and hover-revealed `+ Schedule HH:mm` hint.

### 9.4 Tracking Master Asymmetric 2/3 vs. 1/3 Grid Architecture
- **Row 1 (Execution Tier)**:
  - Left 2/3 (`lg:col-span-8`): `TrackingTodaySessions` with 4 distinct 16px status icons (`planned` ring, `in_progress` pulsing dot, `completed` checkmark, `missed` dashed alert ring), outside gutter drag handle, 2px `#60A5FA` drop indicator line, and `PATCH /api/study-sessions/reorder` database persistence.
  - Right 1/3 (`lg:col-span-4`): `TrackingHeroCard` (Circular Focus/Break Timer with editable session title and domain/topic subtitle).
- **Row 2 (Annual Consistency Tier)**:
  - Full Width (`lg:col-span-12`): `AnnualActivityHeatmap` preserving the full 52-week horizontal aspect ratio without squishing columns.
- **Row 3 (Analytics Tier)**:
  - Left 2/3 (`lg:col-span-8`): `LearningHoursCard` with Nice Numbers integer Y-axis algorithm (`0h, 2h, 4h, 6h, 8h`), spaced X-axis labels in month mode (`1, 5, 10, 15, 20, 25, 30`), subtle `#60A5FA` area gradient fill, and hover vertical crosshair + dark floating popover.
  - Right 1/3 (`lg:col-span-4`): `LearningDistributionCard` with 132px SVG donut chart and aligned domain breakdown list with `tabular-nums` hours and percentages.

