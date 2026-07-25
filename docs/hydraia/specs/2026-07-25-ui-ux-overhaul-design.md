# Design Spec — OSINTEYE UI/UX Overhaul + Tech Debt

Date: 2026-07-25
Derived from: `PENDIENTES.md` (committed 2026-07-25, section "Plan de Mejora de Interfaz")

## Goal

Take OSINTEYE's frontend from "functional but basic" to a professional, cohesive
product surface — dashboard, richer catalog cards, tabbed investigation results,
a slide-in AI chat panel, dark/light theming, global state + notifications, and a
dedicated reports view — while paying down the three tech-debt items already
logged in `PENDIENTES.md` (prop-drilling, missing scanner unit tests, undocumented
`holehe` dependency). No backend schema changes and no new external services are
required — all new views compute from data the API already returns.

## Chosen approach + rejected alternatives

**State management for Task 7 (prop-drilling):** `PENDIENTES.md` suggested
"Context o Zustand". Chosen: **React Context + `useReducer`**, no new dependency.
Rejected: Zustand — the app has exactly one shared-state tree (view, investigations,
settings, chat) and one consumer depth (App → view components); Zustand's ergonomic
win over Context only pays off with deeper trees or many independent stores, neither
of which applies here. Adding a state library for this shape would be an
unjustified dependency per the "no premature abstraction" rule.

**Icons (Task 2):** `lucide-react`, exactly as `PENDIENTES.md` specifies — tree-shakeable,
already the de-facto choice in the React ecosystem, no rejected alternative considered
necessary.

**Charts (Task 1 dashboard):** `recharts`, as specified in `PENDIENTES.md`. Rejected:
hand-rolled SVG — a weekly-activity bar/line chart with axes/tooltips is exactly
recharts' sweet spot; hand-rolling it is the premature-reinvention this pipeline
warns against.

**Markdown rendering (Task 5 chat):** `react-markdown`, as specified. Rejected:
`dangerouslySetInnerHTML` with a hand-rolled regex converter — that is an XSS
footgun (see Threat model below) and exactly the kind of thing a maintained,
sanitizing-by-default library exists to prevent.

**Reports view (Task 8):** reuse the existing `exportInvestigation` HTML-generation
logic in `InvestigationsView.tsx:70-119` by extracting it into a shared
`buildReportHtml(inv)` util, rendered in an `<iframe srcDoc={...}>` for in-app
preview instead of only a downloadable blob. Rejected: a second, divergent
HTML-template implementation for the in-app preview — that would drift from the
downloadable report over time; one template, two consumers (download + iframe
preview) is the DRY-correct shape here.

**Out of scope (explicitly, to avoid scope creep beyond `PENDIENTES.md`):**
- The blocked Tauri release-build item (RAM-constrained dev machine) — unrelated
  to UI/UX, already tracked with its own retry recipe in `PENDIENTES.md`.
- Adding authentication/authorization to the FastAPI backend — a real gap (see
  Threat model) but a materially different, unrequested feature; noted as a
  finding, not implemented here.

## Code-graph anchors (blast radius)

`codegraph` is not installed in this environment (confirmed via
`hooks/doctor.sh --check`), so this spec is anchored from direct file reads
instead — Phase 0 fallback per the pipeline's rules.

- `frontend/src/App.tsx` — owns all shared state today (`currentView`,
  `anthropicKey`, `shodanKey`, `categories`, `selectedCategory`, `allSources`,
  `search`, `investigations`, `isChatOpen`) and prop-drills every one of them into
  `Sidebar`, `CatalogView`, `InvestigationsView`, `SettingsView`, `ChatModal`.
  Becomes the `AppProvider` consumer.
- `frontend/src/types.ts` — `ViewType = 'catalog' | 'investigations' | 'settings'`
  gains `'dashboard' | 'reports'`. `Category`, `Source`, `Investigation`,
  `ScanResult`, `ChatMessage`, `INVESTIGATION_TYPES` are read-only anchors for the
  new views — no field changes needed.
- `frontend/src/index.css` — single design-system file (`:root` CSS variables,
  `.glass-card`, `.glass-panel`, `.badge*`, `.chat-*`, `.modal-*`). New views/theme
  reuse these tokens; the light theme adds a `[data-theme="light"]` override block
  at the end of the `:root` section (line ~25).
- `frontend/src/components/CatalogView.tsx:59-84` — the `tools-grid` /
  `glass-card` markup is extracted into `ToolCard.tsx`; filter/search logic stays
  in `CatalogView.tsx`.
- `frontend/src/components/InvestigationsView.tsx` — `exportInvestigation`
  (lines 70-119) becomes the shared `buildReportHtml` util (new file
  `frontend/src/lib/report.ts`); the `results-grid` block (lines 282-300) becomes
  tabbed; `generateGraphData` (139-183) and the `modal-overlay` (309-327) gain
  zoom/pan controls via `react-force-graph-2d`'s existing pan/zoom props (already
  a dependency — confirmed via the `ForceGraph2D` import at line 6).
- `frontend/src/components/Sidebar.tsx` — nav-tabs (lines 24-43) gain icons +
  collapse; the `investigations` badge count reads from the new `AppContext`.
- `frontend/src/components/ChatModal.tsx` — becomes a slide-in panel
  (`ChatPanel.tsx`); `localStorage` key `osintojo_chat_history` (line 13/28) is
  kept as-is (renaming it would silently drop existing users' saved chat history —
  not worth the churn for a cosmetic rename).
- `backend/scanner/modules/*.py` (9 modules: `crtsh`, `whois_mod`, `dns_mod`,
  `port_scan`, `web_analyzer`, `shodan_mod`, `geoip_mod`, `phone_mod`,
  `email_check`) — zero test coverage today (confirmed: no `backend/tests/`
  directory exists). `backend/requirements.txt` has no test runner listed.

## Global constraints

- **No backend/schema changes.** Every new view (`Dashboard`, `Reports`) computes
  from `/categories/`, `/sources/`, `/investigations/` — already fetched in
  `App.tsx`. No new endpoints.
- **New frontend dependencies (exactly as `PENDIENTES.md` specifies):**
  `lucide-react`, `recharts`, `react-markdown`. No others (no Zustand — see above).
- **New backend dependency:** `pytest` (dev-only, for the scanner unit tests) —
  added to `backend/requirements.txt` under a clear `# dev/test` comment, not
  mixed with runtime deps.
- **CSS tokens only** — no new styling system (no Tailwind, no CSS-in-JS); every
  new component uses `index.css` custom properties and the existing
  `.glass-card`/`.glass-panel` utility classes for visual consistency with the
  current app.
- **Existing `localStorage` keys are preserved** (`osintojo_chat_history`); new
  keys added are `osinteye_theme` (theme preference) and
  `osinteye_notifications_enabled` (Web Notification opt-in).
- **Priority order** follows `PENDIENTES.md`'s table exactly: Task 3 (catalog
  cards) → Task 4 (investigation view) → Task 2 (sidebar) → Task 5 (chat) →
  Task 1 (dashboard) → Task 6 (theme) → Task 7 (notifications/global state) →
  Task 8 (reports). Task 7 is reordered earlier in the *execution plan* only
  where a hard dependency exists (Sidebar's active-investigation badge needs the
  shared context to exist first) — see Phase 3 plan for the resulting task graph.

## Threat model + mitigations

Blast radius: this change touches only the React frontend and adds no new network
egress, no new secrets, and no new backend endpoints. Attack surface review:

1. **XSS via AI chat markdown rendering (new surface).** Rendering the AI's
   response as Markdown (Task 5) means any HTML/script the model echoes back
   (e.g. reflecting attacker-supplied text a user pasted in) could execute if
   rendered unsanitized. **Mitigation:** use `react-markdown` with no
   `rehype-raw`/`dangerouslySetInnerHTML` plugin enabled — its default renderer
   does not execute embedded HTML or `javascript:` URLs. This is a plan
   requirement, not an afterthought (see Task F below).
2. **XSS via report iframe preview (new surface, Task 8).** The in-app report
   preview renders investigation data (which includes attacker-influenceable
   OSINT scan output — e.g. a domain's TXT record, a web page `<title>`) via
   `iframe srcDoc`. **Mitigation:** the existing `exportInvestigation` template
   already interpolates this same data into an HTML string for direct download
   (pre-existing risk, not introduced by this change) — but an `<iframe>` render
   inside the app's own DOM context is a materially different exposure than a
   separately downloaded file the user opens deliberately. Mitigate by giving the
   preview `<iframe>` the `sandbox="allow-same-origin"` attribute (no
   `allow-scripts`), so even if the interpolated OSINT data contains a `<script>`
   tag it cannot execute. This is a plan requirement for Task H.
3. **Stored data in `localStorage` (pre-existing, unchanged surface).** Chat
   history already persists to `localStorage` unencrypted; theme/notification
   prefs added here are non-sensitive (no PII, no secrets) so no new mitigation
   needed.
4. **Web Notifications API (new surface, Task 7).** Requesting browser
   notification permission is user-initiated and opt-in only — no mitigation
   needed beyond requiring an explicit user action (a toggle), never
   auto-requesting on load.
5. **Backend has no authN/authZ (pre-existing, out of scope — documented
   finding).** `backend/main.py` exposes all CRUD + investigation-launch
   endpoints with no auth, and `/settings/` returns stored API keys
   (`anthropic_api_key`, `shodan_api_key`) in plaintext GET responses
   (`main.py:134-136`, consumed by `App.tsx:87-98`). This is acceptable *only*
   under the app's current threat model (single-user local desktop/dev tool,
   CORS restricted to `tauri://localhost` / `localhost:5173`) — it becomes a
   real vulnerability the moment this backend is ever bound to `0.0.0.0` or
   deployed multi-tenant. **Not remediated in this change** (unrequested,
   out-of-scope architectural work per "Out of scope" above) — flagged here so
   Phase 5's `security-reviewer` treats it as a known, accepted, already-tracked
   finding rather than rediscovering it as a surprise blocker.
6. **New backend test dependency (`pytest`).** Dev-only, not shipped in any
   built artifact (`requirements.txt` split keeps it out of the Tauri
   bundle's runtime path) — no production attack-surface change.

OWASP categories touched: **A03:2021-Injection** (XSS vectors 1 & 2, both
mitigated as above), **A01:2021-Broken Access Control** (finding 5, accepted/
out-of-scope). No other OWASP Top 10 category is newly implicated.

## Design adversarial pass (self-review, one pass)

- *"Isn't Context+useReducer just prop-drilling with extra steps for 8 view
  props?"* — No: today every leaf component receives props it doesn't use
  itself but must forward (e.g. `Sidebar` never reads `search` but `App.tsx`
  must still thread it structurally through state co-location). Context removes
  the need to thread anything through components that don't consume it;
  `useReducer` keeps state transitions centralized and testable in one place
  instead of scattered `useState` setters. This is the right-sized fix — a
  full Redux/Zustand store would be over-engineering for one provider tree.
- *"Recharts adds bundle weight for one chart — is it justified?"* — Yes,
  `PENDIENTES.md` explicitly named it and a single well-supported charting
  dependency is cheaper long-term than a hand-rolled SVG chart that needs its
  own axis/tooltip/responsive logic maintained forever.
- *"Does the iframe sandbox break legitimate report features (e.g. any future
  interactive report element)?"* — The current report template is static HTML
  (headings, `<pre>` JSON blocks) with zero interactivity requirements; `sandbox`
  without `allow-scripts` costs nothing functionally today. If a future report
  needs interactivity, that is a new design decision for that change, not this
  one.
- *"Is the `/settings/` plaintext-API-key finding actually a blocker for this
  PR?"* — No: it predates this change, is unrelated to the UI/UX surface being
  touched, and remediating it (masked display, backend auth) is a distinct,
  unrequested architectural change. Flagging it prevents Phase 5 from either
  silently ignoring it or blocking this unrelated PR on it.

No further gaps found in this pass.
