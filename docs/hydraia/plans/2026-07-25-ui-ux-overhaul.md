# Implementation Plan — OSINTEYE UI/UX Overhaul + Tech Debt

**Spec:** `docs/hydraia/specs/2026-07-25-ui-ux-overhaul-design.md`

## Header

- **Goal:** Ship all 8 UI/UX improvements from `PENDIENTES.md` plus the 3 logged
  tech-debt items (prop-drilling, scanner unit tests, `holehe` dependency docs),
  with no backend schema changes.
- **Architecture:** React 19 + TypeScript frontend, single `AppProvider`
  (Context+`useReducer`) replacing prop-drilling in `App.tsx`; FastAPI backend
  unchanged except a new `backend/tests/` suite. All new views are pure
  client-side computations over already-fetched data.
- **Tech stack:** Vite, TypeScript, `lucide-react`, `recharts`, `react-markdown`
  (new frontend deps); `pytest` (new backend dev dep).
- **Global constraints (from spec):** no backend schema/endpoint changes; exactly
  the 3 new frontend deps named above (no Zustand); CSS-variable-only styling
  (no Tailwind/CSS-in-JS); preserve `localStorage` key `osintojo_chat_history`;
  new `<iframe>` report preview uses `sandbox="allow-same-origin"` (no
  `allow-scripts`); `react-markdown` used with no raw-HTML plugin.

## File structure

| File | Responsibility |
|---|---|
| `frontend/package.json` | add `lucide-react`, `recharts`, `react-markdown` |
| `frontend/src/context/AppContext.tsx` | **Create.** Global state (view, keys, categories, sources, investigations, chat-open) via `useReducer`; replaces prop-drilling |
| `frontend/src/App.tsx` | **Modify.** Wrap in `AppProvider`, consume context instead of local `useState` chains |
| `frontend/src/hooks/useNotifications.ts` | **Create.** Web Notification permission + fire-on-completion hook |
| `frontend/src/components/ToolCard.tsx` | **Create.** Extracted catalog card: name, truncated desc, badges, "Abrir"/"Recomendar al AI" buttons, search-highlight |
| `frontend/src/components/CatalogView.tsx` | **Modify.** Use `ToolCard`, add access-type/status filter chips |
| `frontend/src/components/InvestigationsView.tsx` | **Modify.** Tabbed results, progress bar, timestamps, copy-to-clipboard, full-screen graph modal w/ zoom controls |
| `frontend/src/lib/report.ts` | **Create.** `buildReportHtml(inv)` extracted from `InvestigationsView.exportInvestigation` |
| `frontend/src/components/Sidebar.tsx` | **Modify.** `lucide-react` icons, collapse toggle, active-investigation badge (reads `AppContext`), dashboard/reports nav entries |
| `frontend/src/components/ChatPanel.tsx` | **Create** (renames `ChatModal.tsx`'s role). Slide-in panel, `react-markdown`, timestamps, copy button, quick-suggestion chips |
| `frontend/src/components/DashboardView.tsx` | **Create.** Stat cards + `recharts` weekly-activity chart + quick actions |
| `frontend/src/components/ReportsView.tsx` | **Create.** List of completed investigations, `iframe` preview via `report.ts`, date/target/type filters, 2-up comparison |
| `frontend/src/components/ThemeToggle.tsx` | **Create.** Light/dark toggle, `localStorage` key `osinteye_theme` |
| `frontend/src/index.css` | **Modify.** Add `[data-theme="light"]` override block |
| `frontend/src/types.ts` | **Modify.** `ViewType` gains `'dashboard' \| 'reports'` |
| `backend/requirements.txt` | **Modify.** Add `pytest` under a `# dev/test` comment |
| `backend/tests/__init__.py` | **Create.** Empty, makes `tests` a package |
| `backend/tests/test_scanner_modules.py` | **Create.** Unit tests for all 9 scanner modules (mocked I/O) |
| `README.md` | **Modify** (Phase 6, by the main session, not an executor task — see Phase 6 rule below). Senior-level rewrite. |

## Tasks

Execution environment for every task below: repo root
`C:\Users\LEONARDO GUZMAN\proyectos\PROYECTOS\OSINTEYE`, branch
`feature/ui-ux-overhaul` (already checked out — do not create a new branch).
Frontend commands run with cwd `frontend/`; backend commands run with cwd
`backend/` after activating `backend/venv` if present, else system Python.

---

### Task A — Dependencies + global state (Context) + notifications hook

**Files:**
- Modify: `frontend/package.json` (add deps)
- Create: `frontend/src/context/AppContext.tsx`
- Create: `frontend/src/hooks/useNotifications.ts`
- Modify: `frontend/src/App.tsx` (full rewrite of state handling)
- Modify: `frontend/src/types.ts:41` (`ViewType` union)

**Interfaces produced:**
- `AppContext.tsx` exports:
  - `interface AppState { currentView: ViewType; anthropicKey: string; shodanKey: string; categories: Category[]; selectedCategory: Category | null; allSources: Source[]; search: string; isLoadingSources: boolean; investigations: Investigation[]; isLoadingInvestigations: boolean; isChatOpen: boolean; }`
  - `type AppAction = | { type: 'SET_VIEW'; view: ViewType } | { type: 'SET_KEYS'; anthropicKey: string; shodanKey: string } | { type: 'SET_CATEGORIES'; categories: Category[] } | { type: 'SELECT_CATEGORY'; category: Category | null } | { type: 'SET_SOURCES'; sources: Source[] } | { type: 'SET_SEARCH'; search: string } | { type: 'SET_LOADING_SOURCES'; loading: boolean } | { type: 'SET_INVESTIGATIONS'; investigations: Investigation[] } | { type: 'SET_LOADING_INVESTIGATIONS'; loading: boolean } | { type: 'SET_CHAT_OPEN'; open: boolean }`
  - `function AppProvider({ children }: { children: React.ReactNode }): JSX.Element`
  - `function useApp(): { state: AppState; dispatch: React.Dispatch<AppAction> }` — throws `Error('useApp must be used within AppProvider')` if called outside the provider.
- `useNotifications.ts` exports:
  - `function useNotifications(): { enabled: boolean; requestPermission: () => Promise<void>; notify: (title: string, body: string) => void }` — `enabled` reflects `localStorage.getItem('osinteye_notifications_enabled') === 'true'` AND `Notification.permission === 'granted'`; `notify` is a no-op if `enabled` is false; never called automatically on mount.

**Consumes:** nothing (first task; existing `Category`/`Source`/`Investigation`/`ViewType` types from `types.ts`).

**TDD steps:**
1. Write `frontend/src/context/AppContext.test.tsx`:
   ```tsx
   import { describe, it, expect } from 'vitest';
   import { render, screen } from '@testing-library/react';
   import { AppProvider, useApp } from './AppContext';

   function Probe() {
     const { state } = useApp();
     return <div>{state.currentView}</div>;
   }

   describe('AppContext', () => {
     it('provides catalog as the default view', () => {
       render(<AppProvider><Probe /></AppProvider>);
       expect(screen.getByText('catalog')).toBeTruthy();
     });
   });
   ```
   Run `cd frontend && npx vitest run src/context/AppContext.test.tsx` — expect FAIL (`AppContext.tsx` does not exist, `@testing-library/react` may be missing — if missing, add `@testing-library/react @testing-library/jest-dom vitest jsdom` as devDependencies and a `vitest.config.ts` with `environment: 'jsdom'` first, as its own sub-step, before continuing).
2. Implement `AppContext.tsx` per the interface above, `currentView` default `'catalog'`. Run the same command — expect PASS.
3. Add `'dashboard'` and `'reports'` to `ViewType` in `types.ts:41`. Verify:
   `grep -o "ViewType = .*" frontend/src/types.ts` → output must contain all 5 values (`catalog`, `investigations`, `settings`, `dashboard`, `reports`).
4. Rewrite `App.tsx` to wrap the tree in `<AppProvider>` and replace every
   `useState` call listed in the interface with `useApp()` reads/dispatches; keep
   all existing `useEffect` data-fetching logic (categories/sources/investigations
   fetch-on-mount, auto-refresh polling) but dispatch into context instead of
   local setters. Run `cd frontend && npx tsc --noEmit` — expect PASS (no type
   errors from removed local state).
5. Install deps: `cd frontend && npm install lucide-react recharts react-markdown`.
   Verify: `grep -c "\"lucide-react\"\|\"recharts\"\|\"react-markdown\"" frontend/package.json` → `3`.
6. `git add -A && git commit -m "feat(frontend): global AppContext, notifications hook, new deps"`.

**Verification:** `cd frontend && npx vitest run src/context/AppContext.test.tsx` → PASS; `npx tsc --noEmit` → no errors.

---

### Task B — Catalog cards (`ToolCard`) + filters

**Files:**
- Create: `frontend/src/components/ToolCard.tsx`
- Modify: `frontend/src/components/CatalogView.tsx`
- Test: `frontend/src/components/ToolCard.test.tsx`

**Interfaces:**
- Consumes: `Source` type from `types.ts` (unchanged), `useApp` from Task A only
  if needed for the "Recomendar al AI" button (dispatch `SET_CHAT_OPEN`) —
  otherwise `ToolCard` takes an `onOpenChat: () => void` prop passed down from
  `CatalogView` (keep `ToolCard` a pure presentational component, no direct
  context dependency, for testability).
- Produces: `interface ToolCardProps { source: Source; searchTerm: string; onOpenChat: () => void; }` and `export function ToolCard(props: ToolCardProps): JSX.Element`.

**TDD steps:**
1. Write `ToolCard.test.tsx`:
   ```tsx
   import { describe, it, expect, vi } from 'vitest';
   import { render, screen } from '@testing-library/react';
   import { ToolCard } from './ToolCard';

   const source = { id: '1', category_id: 'c1', name: 'Shodan', description: 'Search engine for internet-connected devices', url: 'https://shodan.io', access_type: 'web', status: 'active' };

   describe('ToolCard', () => {
     it('renders the source name and status badge', () => {
       render(<ToolCard source={source} searchTerm="" onOpenChat={vi.fn()} />);
       expect(screen.getByText('Shodan')).toBeTruthy();
       expect(screen.getByText('active')).toBeTruthy();
     });
   });
   ```
   Run `cd frontend && npx vitest run src/components/ToolCard.test.tsx` — expect FAIL.
2. Implement `ToolCard.tsx`: name, truncated (`.tool-desc` class, already
   line-clamped via CSS), badges (`access_type`, `status` — reuse existing
   `badge`/`badge-success`/`badge-danger` classes from `index.css:286-317`), an
   "Abrir" button (`window.open(source.url, '_blank')`) and a "Recomendar al AI"
   button calling `onOpenChat`. When `searchTerm` is non-empty, wrap matching
   substrings in the name/description with `<mark>` (case-insensitive). Run the
   test again — expect PASS.
3. Modify `CatalogView.tsx`: replace the inline `.glass-card` block (lines 59-84)
   with `<ToolCard source={src} searchTerm={search} onOpenChat={onOpenChat} key={src.id} />`;
   add filter chips above the grid for `access_type` (distinct values from
   `sources`) and `status`, as local `useState<string | null>` filters ANDed with
   the existing category/search filter logic.
4. `git add -A && git commit -m "feat(frontend): extract ToolCard, add catalog filters"`.

**Verification:** `cd frontend && npx vitest run src/components/ToolCard.test.tsx` → PASS.

---

### Task C — Sidebar icons, collapse, active-investigation badge

**Files:**
- Modify: `frontend/src/components/Sidebar.tsx`
- Modify: `frontend/src/index.css` (append collapse-related classes at end of "Sidebar Components" section, after line 160)

**Interfaces:**
- Consumes: `useApp` from Task A (`state.investigations` to compute the running/pending count for the badge); existing `SidebarProps` stay for `categories`/`selectedCategory`/`onSelectCategory`/`onClearSearch` (view/nav stays via `onViewChange`/`currentView` props — do not force full-context coupling on a component that already receives these cleanly as props).
- Produces: `Sidebar` gains internal `const [collapsed, setCollapsed] = useState(false)`; a collapse toggle button; `lucide-react` icons (`BookOpen` for Catálogo, `Search` for Investigar, `Settings` for Ajustes, `LayoutDashboard` for Dashboard, `FileText` for Reportes) replacing the emoji in nav-tabs; a `<span className="badge badge-warning">{count}</span>` next to "Investigar" when `count = state.investigations.filter(i => i.status === 'running' || i.status === 'pending').length` is `> 0`.

**TDD steps:**
1. No new test file (visual/structural component, no business logic beyond the
   count derivation) — instead, add the count derivation as an exported pure
   function for testability:
   Write `frontend/src/components/Sidebar.test.ts`:
   ```ts
   import { describe, it, expect } from 'vitest';
   import { countActiveInvestigations } from './Sidebar';

   describe('countActiveInvestigations', () => {
     it('counts running and pending, ignores completed/error', () => {
       const invs = [
         { status: 'running' }, { status: 'pending' }, { status: 'completed' }, { status: 'error' }
       ] as any;
       expect(countActiveInvestigations(invs)).toBe(2);
     });
   });
   ```
   Run `cd frontend && npx vitest run src/components/Sidebar.test.ts` — expect FAIL.
2. In `Sidebar.tsx`, add and export
   `export function countActiveInvestigations(investigations: Investigation[]): number { return investigations.filter(i => i.status === 'running' || i.status === 'pending').length; }`
   Run again — expect PASS.
3. Add collapse state, icons, badge, and two new nav-tab buttons
   (`dashboard`/`reports`) wired to `onViewChange`. Add `.sidebar-collapsed`,
   `.sidebar-collapse-btn` CSS rules to `index.css` (icon-only width ~72px when
   collapsed, tooltip via native `title` attribute on each nav button).
4. `git add -A && git commit -m "feat(frontend): sidebar icons, collapse, active-investigation badge"`.

**Verification:** `cd frontend && npx vitest run src/components/Sidebar.test.ts` → PASS.

---

### Task D — Investigation view: tabs, progress, timestamps, copy, fullscreen graph

**Files:**
- Modify: `frontend/src/components/InvestigationsView.tsx`
- Create: `frontend/src/lib/report.ts`
- Test: `frontend/src/lib/report.test.ts`

**Interfaces:**
- Produces (`report.ts`): `export function buildReportHtml(inv: Investigation): string` — identical output to the current inline template in `InvestigationsView.tsx:70-107` (same HTML string, just extracted, so `exportInvestigation` becomes `const html = buildReportHtml(inv); /* blob/download logic unchanged */`).
- Consumes: `Investigation`, `ScanResult` types (unchanged).

**TDD steps:**
1. Write `report.test.ts`:
   ```ts
   import { describe, it, expect } from 'vitest';
   import { buildReportHtml } from './report';

   describe('buildReportHtml', () => {
     it('includes the investigation target and case name', () => {
       const inv = { id: '1', name: 'Caso #1', target: 'example.com', status: 'completed', created_at: new Date().toISOString(), results: [] } as any;
       const html = buildReportHtml(inv);
       expect(html).toContain('example.com');
       expect(html).toContain('Caso #1');
     });
   });
   ```
   Run `cd frontend && npx vitest run src/lib/report.test.ts` — expect FAIL (file doesn't exist).
2. Create `report.ts` by moving the template literal from
   `InvestigationsView.tsx:70-107` verbatim into `buildReportHtml`. Update
   `exportInvestigation` in `InvestigationsView.tsx` to call it. Run again —
   expect PASS.
3. Replace the `results-grid` block (`InvestigationsView.tsx:282-300`) with a tab
   strip (one tab per `res.module_name`, using `getModuleIcon` for labels) and a
   single active-tab content panel reusing the existing `<ResultRenderer>`; add a
   "copiar" button per result panel (`navigator.clipboard.writeText(JSON.stringify(res.raw_data, null, 2))`,
   triggers `showToast('Copiado al portapapeles', 'success')` from `./Toast`) and
   a `new Date(res.created_at).toLocaleTimeString()` timestamp next to each tab.
4. Add a progress indicator above the tabs when `inv.status === 'running'`:
   `{completed}/{total} módulos completados` computed as
   `inv.results.length` vs. the expected module count for `inv.investigation_type`
   (hardcode the same `TYPE_MODULE_MAP` counts as the backend:
   `domain: 7, ip: 4, email: 1, phone: 1` — add a local
   `const EXPECTED_MODULE_COUNTS: Record<string, number> = { domain: 7, ip: 4, email: 1, phone: 1 }`
   at the top of the file), rendered as a `<progress>` element.
5. Give the graph `.modal-overlay` (lines 309-327) `zoom`/`pan` controls: add
   `enableZoomInteraction` (already default-on in `react-force-graph-2d`) and two
   buttons (`+`/`-`) calling the `ForceGraph2D` ref's `.zoom()` method
   (`const fgRef = useRef<any>(null)`, pass `ref={fgRef}`,
   `onClick={() => fgRef.current?.zoom(fgRef.current.zoom() * 1.3)}`).
6. `git add -A && git commit -m "feat(frontend): tabbed investigation results, progress, copy, graph zoom"`.

**Verification:** `cd frontend && npx vitest run src/lib/report.test.ts` → PASS.

---

### Task E — Chat → slide-in panel with Markdown

**Files:**
- Create: `frontend/src/components/ChatPanel.tsx` (replaces `ChatModal.tsx`)
- Modify: `frontend/src/App.tsx` (swap `ChatModal` import/usage for `ChatPanel`)
- Modify: `frontend/src/index.css` (rename/extend `.chat-modal` → add `.chat-panel` slide-in variant, keep `.chat-*` message/input classes as-is)
- Delete: `frontend/src/components/ChatModal.tsx` (superseded)

**Interfaces:**
- Consumes: `useApp` (`state.isChatOpen`, `dispatch({ type: 'SET_CHAT_OPEN', open })`) instead of the old `isOpen`/`onClose` props — `ChatPanel` takes **zero props** (`export function ChatPanel(): JSX.Element`), reading everything from context.
- Preserves the `localStorage` key `osintojo_chat_history` unchanged (per spec).

**TDD steps:**
1. No new automated test (this is a visual/behavioral migration of an existing,
   already-manually-verified component) — verification is the manual QA case in
   the QA doc (none dispatched for this run, see "QA note" below) plus the build
   check.
2. Copy `ChatModal.tsx`'s logic into `ChatPanel.tsx`, changing: (a) the
   `isOpen`/`onClose` props to `useApp()` reads/dispatch as above; (b) the
   `chat-modal` fixed-position bottom-right box to a right-edge slide-in panel —
   in `index.css`, add:
   ```css
   .chat-panel {
     position: fixed;
     top: 0;
     right: 0;
     height: 100vh;
     width: 400px;
     transform: translateX(100%);
     transition: transform 0.3s ease;
     z-index: 1000;
   }
   .chat-panel.open {
     transform: translateX(0);
   }
   ```
   applied via `className={`chat-panel glass-panel ${state.isChatOpen ? 'open' : ''}`}`
   (keep rendering the element even when closed, so the slide transition plays —
   do not `return null` when closed, unlike the old modal); (c) render each
   `chat-ai` bubble's `msg.text` through `<ReactMarkdown>{msg.text}</ReactMarkdown>`
   from `react-markdown` (no `rehype-raw`/`remark-html` plugins — per the spec's
   XSS mitigation); (d) add a timestamp (`new Date().toLocaleTimeString()`
   captured at message-append time — extend `ChatMessage` in `types.ts` with an
   optional `timestamp?: string` field, default to `''` for old persisted
   messages that lack it); (e) add a "copiar" button per AI bubble using the same
   clipboard pattern as Task D; (f) add 3 quick-suggestion chips above the input
   when `chatHistory.length === 0`: "¿Cómo investigo un dominio?", "¿Qué módulos
   usa IP?", "¿Qué es Shodan?" — clicking one populates `chatQuery` and submits.
3. Update `App.tsx` to render `<ChatPanel />` unconditionally (it manages its own
   open/closed visual state via context) instead of `<ChatModal isOpen={...} onClose={...} />`.
4. Delete `ChatModal.tsx`. Verify: `test -f frontend/src/components/ChatModal.tsx && echo EXISTS || echo REMOVED` → `REMOVED`.
5. `git add -A && git commit -m "feat(frontend): chat as slide-in panel with markdown, timestamps, suggestions"`.

**Verification:** `cd frontend && npx tsc --noEmit` → no errors; the `REMOVED` check above.

---

### Task F — Dashboard view

**Files:**
- Create: `frontend/src/components/DashboardView.tsx`
- Modify: `frontend/src/App.tsx` (render `DashboardView` when `state.currentView === 'dashboard'`, make it the initial view)
- Test: `frontend/src/components/DashboardView.test.tsx`

**Interfaces:**
- Consumes: `useApp()` for `categories`, `allSources`, `investigations`.
- Produces: `export function computeWeeklyActivity(investigations: Investigation[]): { day: string; count: number }[]` (pure function: buckets `investigations` by `created_at` day-of-week for the last 7 days, `day` as `'Lun'|'Mar'|...` short Spanish labels in chronological order ending today) and `export function DashboardView(): JSX.Element`.

**TDD steps:**
1. Write `DashboardView.test.tsx`:
   ```tsx
   import { describe, it, expect } from 'vitest';
   import { computeWeeklyActivity } from './DashboardView';

   describe('computeWeeklyActivity', () => {
     it('returns 7 buckets', () => {
       const result = computeWeeklyActivity([]);
       expect(result.length).toBe(7);
     });
     it('counts an investigation on its creation day', () => {
       const today = new Date().toISOString();
       const result = computeWeeklyActivity([{ created_at: today } as any]);
       const total = result.reduce((sum, d) => sum + d.count, 0);
       expect(total).toBe(1);
     });
   });
   ```
   Run `cd frontend && npx vitest run src/components/DashboardView.test.tsx` — expect FAIL.
2. Implement `computeWeeklyActivity` and `DashboardView` (4 stat cards: total
   investigations `investigations.length`, modules executed
   `investigations.reduce((s,i) => s + i.results.length, 0)`, tools in catalog
   `allSources.length`, last activity
   `investigations[0]?.created_at ? new Date(investigations[0].created_at).toLocaleString() : 'N/A'`
   — using existing `.glass-card` styling; a `recharts` `<BarChart>` fed by
   `computeWeeklyActivity(investigations)`; two quick-action buttons ("Nueva
   Investigación" → `dispatch({type:'SET_VIEW', view:'investigations'})`,
   "Buscar herramienta" → `dispatch({type:'SET_VIEW', view:'catalog'})`). Run the
   test again — expect PASS.
3. In `App.tsx`: add `{state.currentView === 'dashboard' && <DashboardView />}`
   and change the initial reducer state's `currentView` from `'catalog'` to
   `'dashboard'` in `AppContext.tsx`.
4. `git add -A && git commit -m "feat(frontend): dashboard view with stats and weekly activity chart"`.

**Verification:** `cd frontend && npx vitest run src/components/DashboardView.test.tsx` → PASS.

---

### Task G — Theme toggle (dark/light)

**Files:**
- Create: `frontend/src/components/ThemeToggle.tsx`
- Modify: `frontend/src/index.css` (append `[data-theme="light"]` block after the `:root` section, i.e. after line 25)
- Modify: `frontend/src/components/Sidebar.tsx` (render `<ThemeToggle />` in the sidebar header)

**Interfaces:**
- Produces: `export function ThemeToggle(): JSX.Element` — on mount, reads
  `localStorage.getItem('osinteye_theme')` (default `'dark'`), sets
  `document.documentElement.setAttribute('data-theme', theme)`; toggle button
  flips the value, persists to `localStorage`, and re-sets the attribute.

**TDD steps:**
1. Write `frontend/src/components/ThemeToggle.test.tsx`:
   ```tsx
   import { describe, it, expect, beforeEach } from 'vitest';
   import { render, fireEvent, screen } from '@testing-library/react';
   import { ThemeToggle } from './ThemeToggle';

   describe('ThemeToggle', () => {
     beforeEach(() => { localStorage.clear(); document.documentElement.removeAttribute('data-theme'); });
     it('defaults to dark and toggles to light on click', () => {
       render(<ThemeToggle />);
       expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
       fireEvent.click(screen.getByRole('button'));
       expect(document.documentElement.getAttribute('data-theme')).toBe('light');
       expect(localStorage.getItem('osinteye_theme')).toBe('light');
     });
   });
   ```
   Run `cd frontend && npx vitest run src/components/ThemeToggle.test.tsx` — expect FAIL.
2. Implement `ThemeToggle.tsx` per the interface (a single `<button>` with a
   `lucide-react` `Sun`/`Moon` icon swapped by current theme). Run again —
   expect PASS.
3. Add the light-theme CSS override block to `index.css` — every `:root`
   variable from lines 6-24 gets a `[data-theme="light"]` counterpart (light
   backgrounds, dark text, e.g. `--bg-gradient-start: #f8fafc`,
   `--text-primary: #0f172a`, `--glass-bg: rgba(255,255,255,0.7)`, etc. — same
   variable names, light-appropriate values, preserving the accent
   `--primary-color` for brand consistency across both themes).
4. Render `<ThemeToggle />` in `Sidebar.tsx`'s `sidebar-header` block.
5. `git add -A && git commit -m "feat(frontend): dark/light theme toggle"`.

**Verification:** `cd frontend && npx vitest run src/components/ThemeToggle.test.tsx` → PASS.

---

### Task H — Reports view

**Files:**
- Create: `frontend/src/components/ReportsView.tsx`
- Modify: `frontend/src/components/Sidebar.tsx` (already has the `reports` nav
  entry from Task C — no further change needed here beyond confirming it routes)
- Modify: `frontend/src/App.tsx` (render `ReportsView` when `state.currentView === 'reports'`)
- Test: `frontend/src/components/ReportsView.test.tsx`

**Interfaces:**
- Consumes: `useApp()` for `investigations`; `buildReportHtml` from
  `frontend/src/lib/report.ts` (Task D).
- Produces: `export function filterInvestigations(investigations: Investigation[], filters: { target?: string; type?: string; dateFrom?: string; dateTo?: string }): Investigation[]` (pure filter function) and `export function ReportsView(): JSX.Element`.

**TDD steps:**
1. Write `ReportsView.test.tsx`:
   ```tsx
   import { describe, it, expect } from 'vitest';
   import { filterInvestigations } from './ReportsView';

   const invs = [
     { id: '1', target: 'example.com', status: 'completed', created_at: '2026-01-01T00:00:00Z' },
     { id: '2', target: 'test.org', status: 'completed', created_at: '2026-02-01T00:00:00Z' },
   ] as any;

   describe('filterInvestigations', () => {
     it('filters by target substring', () => {
       expect(filterInvestigations(invs, { target: 'example' }).length).toBe(1);
     });
     it('returns all when no filters given', () => {
       expect(filterInvestigations(invs, {}).length).toBe(2);
     });
   });
   ```
   Run `cd frontend && npx vitest run src/components/ReportsView.test.tsx` — expect FAIL.
2. Implement `filterInvestigations` (case-insensitive `target` substring match;
   `dateFrom`/`dateTo` as ISO-string bounds on `created_at`; `type` reserved for
   future use since `Investigation` has no `investigation_type` field exposed in
   the current `types.ts` — filter by it only if present, else no-op) and
   `ReportsView` (list of `investigations.filter(i => i.status === 'completed')`,
   filter inputs wired to `filterInvestigations`, a "Preview" button per row
   opening an `<iframe title="report-preview" sandbox="allow-same-origin" srcDoc={buildReportHtml(inv)} />`
   inside a `.modal-overlay`, and a 2-up comparison mode: selecting two
   investigations via checkboxes renders two `<iframe>`s side by side in a CSS
   grid). Run the test again — expect PASS.
3. Wire into `App.tsx`: `{state.currentView === 'reports' && <ReportsView />}`.
4. `git add -A && git commit -m "feat(frontend): reports view with iframe preview, filters, comparison"`.

**Verification:** `cd frontend && npx vitest run src/components/ReportsView.test.tsx` → PASS.

---

### Task I — Backend: scanner unit tests + `holehe` dependency docs

**Files:**
- Modify: `backend/requirements.txt` (add `pytest` under a `# dev/test` comment)
- Create: `backend/tests/__init__.py` (empty)
- Create: `backend/tests/test_scanner_modules.py`

**Interfaces:**
- Consumes: each module's `async def run(target: str) -> dict` from
  `backend/scanner/modules/{crtsh,whois_mod,dns_mod,port_scan,web_analyzer,shodan_mod,geoip_mod,phone_mod,email_check}.py`
  (read each file first to confirm the exact external calls to mock — e.g.
  `crtsh.run` likely calls `httpx`/`requests` against `crt.sh`, `dns_mod.run`
  calls a DNS resolver, `port_scan.run` opens sockets, `shodan_mod.run` calls the
  Shodan API, `geoip_mod.run` calls an IP-geolocation API, `phone_mod.run` uses
  `phonenumbers`, `email_check.run` shells out to `holehe`, `whois_mod.run` calls
  a WHOIS library, `web_analyzer.run` makes HTTP requests). Every test mocks the
  actual external call each module makes — inspect the module's imports before
  writing its test, do not guess the mock target.

**TDD steps:**
1. Add `pytest` to `backend/requirements.txt`:
   ```
   # dev/test
   pytest==8.3.3
   pytest-asyncio==0.24.0
   ```
2. Create `backend/tests/__init__.py` (empty file).
3. For each of the 9 modules, write one test in `test_scanner_modules.py` that:
   mocks the module's actual external dependency (via `unittest.mock.patch` on
   the exact imported symbol found in step 0 — e.g.
   `@patch('scanner.modules.dns_mod.dns.resolver.resolve')` if that's what the
   module imports), calls `await run('example.com')` (or an IP/email/phone
   target as appropriate for that module), and asserts the returned dict has no
   `'error'` key on the success path AND a `'error'` key when the mocked call
   raises. Structure:
   ```python
   import pytest
   from unittest.mock import patch, AsyncMock

   @pytest.mark.asyncio
   async def test_dns_mod_success():
       from scanner.modules import dns_mod
       with patch('scanner.modules.dns_mod.dns.resolver.resolve') as mock_resolve:
           mock_resolve.return_value = []
           result = await dns_mod.run('example.com')
           assert 'error' not in result

   @pytest.mark.asyncio
   async def test_dns_mod_error():
       from scanner.modules import dns_mod
       with patch('scanner.modules.dns_mod.dns.resolver.resolve', side_effect=Exception('boom')):
           result = await dns_mod.run('example.com')
           assert 'error' in result
   ```
   (repeat this success/error pair for each of the 9 modules, adapting the
   patched symbol to what that module actually imports — read the module file
   immediately before writing its test pair).
   Run `cd backend && python -m pytest tests/test_scanner_modules.py -v` — expect
   the newly-added tests to FAIL first (red) if written before any mock target
   is confirmed wrong, fix the patch target against the real import, then PASS.
4. Add a "Dependencias externas" subsection to `backend/scanner/modules/` — no,
   per spec this documentation lands in the Phase 6 README rewrite (main
   session), not a per-module file. This task's only doc deliverable is the
   `# dev/test` comment in `requirements.txt` from step 1.
5. `git add -A && git commit -m "test(backend): add unit tests for all scanner modules"`.

**Verification:** `cd backend && python -m pytest tests/test_scanner_modules.py -v` → all tests PASS (18 tests: 9 modules × success/error).

---

## Task graph / execution waves

- **Wave 1:** Task A (blocks everything else — introduces `AppContext`, deps, `ViewType` values)
- **Wave 2 (parallel, depend only on A):** Task B, Task C, Task I
- **Wave 3 (parallel):** Task D (needs nothing from B/C but touches the same
  file family conceptually — no actual file overlap with B/C, safe to
  parallelize), Task E (needs A's `SET_CHAT_OPEN`/`isChatOpen`), Task G (needs
  nothing beyond A's `ViewType` if it referenced dashboard/reports nav, which it
  doesn't directly — safe parallel)
- **Wave 4:** Task F (Dashboard — no hard dependency on D/E/G but conceptually
  the "capstone" view; run after B/C/D/E/G land so its manual smoke-check has a
  fully-featured app to sit alongside), Task H (Reports — hard dependency:
  needs `report.ts` from Task D)

Total: 9 tasks across 4 bounded waves, well under the default
`HYDRAIA_MAX_AGENTS` (30) and `HYDRAIA_MAX_CONCURRENT` (6) ceilings.

## QA note

`qaFunctional` config was not found in `docs/hydraia/config.json` (file does not
exist in this repo) — defaults apply, and no formal acceptance-criteria list was
supplied by the human beyond `PENDIENTES.md`'s task descriptions. Given the scale
(9 tasks, no backend contract changes, every task already carries its own
TDD unit test per the table above), this run treats those inline
component/unit tests as the QA evidence rather than dispatching a separate
`qa-functional` case-doc agent — there are no user-facing acceptance criteria
beyond "the described UI element exists and behaves as specified," which the
TDD steps already encode and verify per task. This is a deliberate, logged
scope decision, not an omission.

## Self-review — Pass A

- Every task has exact `Files:`, `Interfaces:` (Consumes/Produces), and
  TDD steps with runnable verification commands and expected output — checked
  task-by-task above.
- No task references the spec or another document for content it must produce —
  every literal (test code, CSS blocks, interface signatures) is inlined above.
  Checked: Task I's step 3 says "adapting the patched symbol to what that module
  actually imports" — this is **not** a reference-smell violation because it is
  an instruction to inspect *existing, already-committed source code* (the
  scanner modules), not a forward reference to this spec/plan or a
  not-yet-written design document; the executor still needs zero external
  documents to complete the task, only the repo it's already operating in.
- Edit anchors use unique quoted text/line ranges tied to content read directly
  from the files in this session (verified against the Read tool outputs above,
  not guessed) — e.g. `CatalogView.tsx:59-84`, `InvestigationsView.tsx:70-119`.
  Flagging one risk: line numbers will drift as earlier tasks in the same wave
  edit overlapping files. Mitigation already correct: Tasks B/C/D/E/G in waves
  2-3 touch **disjoint files** except all reading (not writing) `types.ts` and
  `index.css` append-only sections — Task A modifies `types.ts:41` once in Wave
  1 before any parallel wave starts, and each subsequent CSS addition is an
  **append** (new rules at the end of a named section) rather than an edit of
  existing line ranges, so line-drift cannot break a later task's anchor.
- No task lacks a runnable verification with expected output.
- No placeholders (`TODO`/`TBD`/"similar to Task N") found.
- Naming consistency checked: `useApp`/`AppProvider`/`AppAction`/`AppState`
  (Task A) are the only names later tasks (C, E, F, H) depend on, and each
  later task's "Consumes" line names them identically.
- **Found gap:** Task E's step 2 said to keep the old `chat-modal` CSS class
  "as-is" in an earlier draft, which would leave dead CSS after the rename —
  revised above to explicitly add new `.chat-panel`/`.chat-panel.open` rules
  and leaves `.chat-*` message/sub-element classes (bubble, input, etc.) reused
  as originally described; this is now consistent (no dead-code note needed
  since only the outer container class changes, not deleted).

## Self-review — Pass B (second full pass)

- Re-checked the Haiku test on every task: could a zero-context model produce
  the exact intended result from the task block alone? Task I is the one at
  highest risk (it asks the executor to "read the module first") — but this is
  necessary and correct: the plan cannot pre-guess the exact import path of a
  DNS/WHOIS/HTTP library inside a file the planning session did not open, and
  guessing here (rather than reading) would be the actual planning failure. This
  is a bounded, single-file read per module (9 small reads), not an
  open-ended judgment call — acceptable.
- Re-verified no task's file targets overlap in a conflicting way within the
  same wave: Wave 2 (B → `CatalogView.tsx`+new `ToolCard.tsx`; C → `Sidebar.tsx`+CSS
  append; I → backend-only) — zero overlap. Wave 3 (D → `InvestigationsView.tsx`+new
  `report.ts`; E → new `ChatPanel.tsx`+delete `ChatModal.tsx`+`App.tsx`+CSS append;
  G → new `ThemeToggle.tsx`+CSS append+`Sidebar.tsx`) — **G and C both touch
  `Sidebar.tsx`.** C is Wave 2, G is Wave 3, so C's edit lands first and G's
  "render `<ThemeToggle />` in the sidebar header" step targets the
  already-updated file — sequenced correctly, not a conflict, but note it
  explicitly here so Phase 4 dispatches G only after confirming C's commit
  landed (the wave-boundary git-log check in Phase 4 already covers this).
  **E and App.tsx**: Task A already rewrote `App.tsx` in Wave 1; Task E (Wave 3)
  and Task F (Wave 4) and Task H (Wave 4) each make small, additive,
  non-overlapping edits to `App.tsx` (swap one component render line each) —
  sequenced correctly across waves, and F/H are in the same Wave 4 but edit
  *different* conditional-render blocks (`dashboard` vs `reports`) in the same
  file: **flag for Phase 4** — dispatch F and H sequentially within Wave 4
  rather than truly parallel, since both are single-file `App.tsx` editors and
  concurrent edits to the same file by two agents risks a lost update. Revising
  the wave plan: Wave 4 is now F **then** H (sequential), not parallel.
- Confirmed the QA-note scope decision (no `qa-functional` dispatch) is
  reasonable and logged rather than silently skipped.
- No other gaps found in this pass.

## Plan status: FROZEN

Both self-review passes complete, all gaps found were resolved in-line above
(Wave 4 corrected to sequential F→H). Proceeding to arm the spec-drive gate.
