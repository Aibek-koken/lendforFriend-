# CLAUDE.md — LiveAssist AI (Friend)

This is the durable project context for future Claude Code, Cursor, and Codex
sessions. Treat this file plus `README.md` as the current source of truth. Do
not rely on deleted Electron-era docs.

Last updated: 2026-07-09 (Onboarding v2 complete: spotlight tour, demo
seeding, model-readiness gating, overlay mini-tour, Accessibility redesign.
CRM Assistant Phase 1-4 are complete (`TASK-J` integration boundary/sandbox
provider, `TASK-K` apply pipeline wired into the UI). Phase 5 is complete:
`TASK-L` (action history/status timeline + CRM context preview) and `TASK-M`
(reviewed-suggestion risk/evidence/operation-transparency + disallowed-type
blocking) are both done. Phase 6 (`TASK-N`) is now complete too: CRM
Assistant Phase 4-6 (`TASK-J` through `TASK-N`) are all done. Phase 7
`TASK-O` (amoCRM OAuth foundation) is done after a successful human manual
OAuth round-trip and keychain-persistence check against a real amoCRM
account. `TASK-P` (real, read-only amoCRM lead-context integration behind a
live-mode flag) is done, including its own mandatory manual test, confirmed
by a human on 2026-07-09. **`TASK-Q` (real amoCRM WRITE integration) is now
done too** — its mandatory human manual write-and-confirm test passed on
2026-07-09: a human approved and applied a suggested action against a real
test amoCRM lead, confirmed the write appeared correctly in the amoCRM UI and
the desktop app, and confirmed a repeated Apply was safely skipped as a
duplicate rather than creating a second write. A dev-only amoCRM test-data
seeder exists behind Settings + `VITE_CRM_LIVE_MODE=true` and was used to
make that verification practical against an otherwise-empty test account.
The onboarding tour's visual scrim was also fixed to stop intercepting normal
page clicks/scroll; only the tour tooltip remains interactive. A follow-up
CRM Assistant UX cleanup made the live-vs-sandbox lead flow clear and
product-like (mode-aware lead picker, sectioned CRM context preview, dev-only
seed-tag hiding, structured applied/failed/skipped-duplicate write results).
A `TASK-S` follow-up ("CRM-aware Quick Ask for the active amoCRM lead",
including a future overlay redesign with a compact lead-aware row) is
documented as a proposal only, not implemented. Phase 7 is now fully complete:
`TASK-R` (hardening, token-expiry/error taxonomy, Phase 7 handoff) passed its
human manual checklist on 2026-07-10. See the Phase 7 Progress section below
for the full verification note.

## Product Context

LiveAssist AI is a local-first document Q&A desktop app for people who answer
customers live: sales managers, realtors, support operators, call-center agents,
and small teams. The product should feel calm, simple, professional, and
consumer-grade. Avoid developer/admin vibes, oversized dashboard chrome,
decorative hero sections, and childish UI.

The current wedge is:

1. Upload trusted team documents.
2. Ask questions in the desktop app or quick overlay.
3. Get a concise answer with source references.
4. Use it during a call without switching through folders and browser tabs.

AmoCRM OAuth setup, live read, and live write plumbing now exist behind the
explicit Phase 7/live-mode gates. A human has confirmed real note/task/tag
writes in the amoCRM web UI (2026-07-09), including safe duplicate-skip
behavior on a repeated Apply — TASK-Q is done. TASK-R (hardening/handoff)
still requires its own fresh scoping session before it starts.

## Current Status

The app is now a Tauri v2 app with a Rust backend and React renderer. The old
Electron runtime was removed during Phase 6. `src/renderer/` and `proxy/` are
active. `src/main/chunking.ts` and `src/main/searchQuery.ts` remain only as
Vitest characterization oracles.

Recently shipped:

- Onboarding v2, complete: `GuidedTour.tsx` (dim-and-spotlight via
  `data-tour-id`, keyboard nav, auto-skip if a target never mounts), real
  demo-document auto-seeding through a shared `import_document_paths` backend
  helper, model-readiness gating (`model_status`/`model:progress` wired into
  Ask), an overlay mini-tour + hotkey-triggered tour auto-finish
  (`overlay:opened` event), and a redesigned full-screen Accessibility
  permission card. See the Onboarding v2 section below.
- Documents library refresh: folder tree, bulk delete, row click/open, horizontal
  table overflow protection, live missing-file detection, and bounded automatic
  relinking for moved/renamed files.
- Overlay UX refresh: smaller window, no native shadow/halo, subtle renderer ring,
  draggable shell, Tauri `startDragging` permission, compact typography, loading
  dot alignment fix, dynamic height by answer length, and resize that preserves
  the user's dragged position.
- Desktop UI refresh: calmer professional app shell, tighter density,
  simplified Settings, Light/Dark/System Appearance persisted in localStorage.
- Docs cleanup: old parallel stale docs were deleted. Keep this file current
  instead of recreating drift-prone snapshots.

## CRM Assistant Night Runner

Current queue source:

- `Doc/10-crm-assistant-task-queue.md`
- `Doc/17-crm-phase4-context-pack.md`
- `Doc/18-crm-phase5-context-pack.md`
- `Doc/19-crm-phase6-context-pack.md`
- `Doc/22-crm-phase7-context-pack.md`
- `Doc/11-claude-night-runner-protocol.md`
- `Doc/12-claude-night-handoff.md`

Current CRM status:

- `TASK-A` through `TASK-N` are all done. Phase 4 (`TASK-J`, `TASK-K`), Phase 5
  (`TASK-L`, `TASK-M`), and Phase 6 (`TASK-N`) are all complete.
- `TASK-N` added CRM context/apply error-recovery polish plus
  `Doc/20-crm-pilot-readiness-checklist.md` and
  `Doc/21-crm-phase6-final-handoff.md`. See the Phase 6 Progress note below.
- Phase 7 status: `TASK-O` (amoCRM OAuth + secure token storage foundation)
  is `done` after a successful real amoCRM manual OAuth round-trip and
  restart/keychain persistence check. `TASK-P` (real, read-only amoCRM
  lead-context integration behind a live-mode flag) is `done`, and its own
  mandatory manual test (real lead id loads, context preview shows real
  notes/tags/tasks) is confirmed by a human as of 2026-07-09. **`TASK-Q`
  (real amoCRM writes) is `done`** — its own mandatory manual test also
  passed on 2026-07-09: a human approved and applied a suggested action
  against a real test amoCRM lead, confirmed the write appeared correctly in
  the amoCRM web UI and the desktop app, and confirmed a repeated Apply was
  safely skipped as a duplicate rather than creating a second write. **`TASK-R`
  (hardening, token-expiry/error taxonomy, Phase 7 handoff) is now `done`**
  too — its human manual checklist walk passed on 2026-07-10, confirming
  revoke-and-reconnect, offline vs. reconnect, token-expiry refresh,
  rate-limit behavior, and real-write dedup under the TASK-R UI.
- Real amoCRM OAuth (authorization-code exchange, single mutex-guarded
  refresh, OS-keychain token storage) exists in
  `src-tauri/src/amocrm/oauth.rs`. A real, read-only REST v4 client
  (`src-tauri/src/amocrm/client.rs`, TASK-P) now exists too, wired into the
  CRM Assistant UI's context preview (`crm-assistant/integration/
  liveCrmProvider.ts`) behind `VITE_CRM_LIVE_MODE=true` plus a real
  `connected` amoCRM status — sandbox stays the default provider otherwise.
  Real writes now exist through `amocrm_apply_action` and
  `liveCrmProvider.apply()`, still gated behind `VITE_CRM_LIVE_MODE=true`,
  a connected amoCRM account, and a manager-entered real lead id, and are now
  human-verified end to end (TASK-Q). `TASK-R` (hardening/handoff) is now
  done too: its manual live amoCRM checklist pass was recorded on 2026-07-10,
  so Phase 7 is fully complete.

Recommended dry-run:

```bash
scripts/claude-night-runner.sh --dry-run --phases phase7 --max-tasks 99 --max-minutes 28800 --auto-wait-limits --auto-commit
```

Recommended overnight run: none right now — Phase 7 (`TASK-O` through
`TASK-R`) is complete. `TASK-S` remains proposal-only and still requires its
own fresh human scoping session before it starts, per the "Phase 7 is never
inferred automatically" rule below.

Runner behavior to preserve:

- One queue task equals one Claude session.
- `--auto-wait-limits` keeps a task pending on Claude session/usage limit, waits for reset/fallback, and retries the same task.
- `--auto-commit` is runner-side only after validation and safe-approve pass; Claude itself must not commit.
- The runner never performs `git push`.
- Phase 7 is never inferred automatically. It must be requested explicitly, and
  overnight `--auto-commit` is limited to `TASK-P`.

## Architecture Map

```text
db/
  schema.sql                    SQLite schema compiled into Rust
proxy/
  server.js                     Express SSE proxy in front of DeepSeek
resources/sample-docs/
  *.txt                         Onboarding demo docs, bundled via tauri.conf.json
                                and imported by documents_seed_demo_if_needed
src/renderer/
  index.html                    Main desktop window
  overlay.html                  Separate quick-ask overlay window
  src/App.tsx                   Main app: Documents, Ask, Settings, onboarding
  src/overlay.tsx               Overlay UI
  src/GuidedTour.tsx            Onboarding v2 spotlight tour engine
  src/platform.ts               OS-aware quick-ask shortcut label
  src/liveassist-bridge.ts      Tauri invoke/event bridge
  src/theme.ts                  Main-window Appearance state
  src/ui.tsx                    Shared renderer UI primitives
src-tauri/src/
  lib.rs                        Tauri commands, setup, hotkey registration,
                                overlay lifecycle, document upload entrypoint
  hotkey.rs                     macOS NSEvent global monitor
  db/                           rusqlite document/settings/search modules
  extraction/                   PDF/DOCX/TXT extraction and chunking
  embeddings/                   model download, fastembed session, backfill
  retrieval.rs                  hybrid vector + FTS retrieval
  answer.rs                     top-K answer generation and SSE parsing
test/
  *.test.ts                     Characterization tests for retained TS oracles
```

## Commands

```bash
npm install
npm run tauri:dev
npm run typecheck
npm run test
cargo test --manifest-path src-tauri/Cargo.toml
npm run tauri:build
```

`npm run tauri:dev` starts Vite on port `5173`. If that port is busy, find the
stale process with:

```bash
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

Then kill that PID and restart the dev command.

## Environment

The Tauri backend loads `src-tauri/.env` through `dotenvy`:

```env
APP_SECRET=replace_with_app_shared_secret
PROXY_URL=https://live-assist-proxy.vercel.app/generate
PDFIUM_LIB_DIR=./pdfium/lib
```

- `APP_SECRET` must match `APP_SHARED_SECRET` on the proxy. Missing or
  placeholder values hard-fail at answer time.
- `PROXY_URL` defaults to production proxy behavior, but keep it explicit in dev.
- `PDFIUM_LIB_DIR` should point at a folder containing `libpdfium` for local PDF
  extraction. `src-tauri/pdfium/lib` is the expected local path in this checkout.
- `CRM_EXTRACT_PROXY_URL` (optional) overrides the CRM Assistant's AI
  extraction endpoint; it defaults to
  `https://live-assist-proxy.vercel.app/crm-extract`, the same deployed proxy
  `PROXY_URL` points at, just a different route
  (`src-tauri/src/crm_extraction.rs`). It shares the exact same `APP_SECRET`
  gate as `/generate` — a placeholder `APP_SECRET` silently degrades **both**
  features, but differently: Ask masks it via `demoAnswerFallback.ts`'s "demo
  mode" (matches the literal `APP_SECRET is not configured`/`Proxy
  Unauthorized` strings and substitutes a canned answer), while CRM
  Assistant's "Generate suggestions" has no such masking — it visibly falls
  back to the local heuristic path (`CrmAssistantView.tsx`) and, as of this
  fix, shows the real reason inline plus logs it via `console.warn`/
  `log::error!` (`extraction/extractionGateway.ts`,
  `src-tauri/src/crm_extraction.rs`). If you ever see that fallback banner,
  check whether `src-tauri/.env`'s `APP_SECRET` is still the literal
  `replace_with_app_shared_secret` placeholder above — if so, replace it with
  the real value configured as `APP_SHARED_SECRET` on the Vercel proxy
  project (never commit or print that value).

Open production issue: packaged builds ship no `.env`, so production
`APP_SECRET` distribution still needs a real design.

## Documents Library

Core files:

- `src-tauri/src/db/documents.rs`
- `src-tauri/src/lib.rs`
- `src/renderer/src/App.tsx`
- `src/renderer/src/global.d.ts`
- `src/renderer/src/liveassist-bridge.ts`

Current behavior:

- `documents_list` runs `sync_documents` before returning records.
- Missing files are detected live from disk, not stored as a stale DB flag.
- If a file moved, the resolver searches bounded known roots:
  original folder/parents, folders of other known documents, and standard
  Desktop/Downloads/Documents roots when relevant.
- Fingerprints use `file_size` and `file_hash` columns. Existing rows backfill
  these lazily.
- A single safe match updates `original_path`; multiple plausible matches set
  `needsRelink=true`; no match leaves `fileMissing=true`.
- UI shows `Missing` and `Needs relink` as distinct states.
- `documents_open` returns clear errors instead of silently doing nothing.
- Batch delete exists through `documents_delete_batch`.

Do not replace this with a broad file watcher. The current design is intentionally
lazy and bounded.

## Embeddings And Retrieval

Core files:

- `src-tauri/src/embeddings/model_source.rs`
- `src-tauri/src/embeddings/mod.rs`
- `src-tauri/src/embeddings/backfill.rs`
- `src-tauri/src/retrieval.rs`
- `src-tauri/src/answer.rs`

Current behavior:

- First run downloads `Xenova/multilingual-e5-small` int8 ONNX files into
  `app_data_dir/models/<MODEL_ID>/`.
- Downloads are pinned by commit and checked with SHA-256.
- `model_status`/`model:progress` are wired into the renderer via
  `getModelStatus()`/`onModelProgress()` in `liveassist-bridge.ts`. `App.tsx`
  keeps one `modelStatus` subscription and passes it to `AskView`, which shows
  a `MessageBanner` ("Preparing your local AI model… NN%" / "Verifying…" /
  error) while not `ready`, and hides it once ready. The guided tour's
  ask-input step copy also adapts (`buildTourSteps` in `App.tsx`) — this is a
  UX-honesty banner, not a hard gate, since retrieval already degrades to
  FTS-only when embeddings aren't ready yet.
- Query/passages use e5 prefixes (`query:`, `passage:`), mean pooling, and L2
  normalization.
- Retrieval fuses vector and FTS candidates with Reciprocal Rank Fusion.
- Top-K is capped per source so one document cannot fill the whole context.
- If vector scores are uninformative, retrieval degrades to FTS-only rather than
  returning an empty result.

## Answer Streaming

Core files:

- `proxy/server.js`
- `src-tauri/src/answer.rs`
- `src/renderer/src/liveassist-bridge.ts`
- `src/renderer/src/App.tsx`
- `src/renderer/src/overlay.tsx`

Current behavior:

- The renderer generates `requestId` before invoking `answers_generate`.
- Event listeners attach before the command runs. Do not move request id
  generation back into Rust; that reintroduces an early-event race.
- Rust emits `answer:snippets`, `answer:token`, `answer:sources`,
  `answer:done`, and `answer:error` to the requesting webview only.
- Proxy responses must have `Content-Type: text/event-stream`. The Rust client
  now checks this and fails loud if an old JSON proxy deploy is hit.
- `DAILY_REQUEST_LIMIT` is currently `200` in `answer.rs`, tracked in SQLite.

## Quick Ask Overlay

Core files:

- `src-tauri/src/lib.rs`
- `src-tauri/src/hotkey.rs`
- `src-tauri/capabilities/default.json`
- `src/renderer/src/overlay.tsx`
- `src/renderer/src/index.css`

Shortcuts:

- macOS: `⌥ Space`
- Windows/Linux: `Ctrl Alt Space`

Current behavior:

- macOS uses two delivery paths:
  - in-focus Carbon shortcut through `tauri-plugin-global-shortcut`
  - background NSEvent global monitor in `hotkey.rs`, requiring Accessibility
- Overlay requests are enqueued onto a worker thread. OS callbacks never touch
  AppKit directly.
- The overlay is created lazily once and reused with `hide()`/show path.
- Do not close/recreate the overlay on each toggle. wry calls
  `NSApplication.activate()` when attaching a new WKWebView, which causes Space
  switching.
- macOS overlay is swizzled into an `NSPanel` via `tauri-nspanel` and uses
  `NonactivatingPanel`.
- Native shadow is disabled. Renderer owns the border/ring.
- `core:window:allow-start-dragging` is required for dragging.
- `startDragging()` is called explicitly from `overlay.tsx`; buttons/inputs and
  `[data-no-drag]` regions are excluded.
- `-webkit-app-region` CSS is scoped to `html.overlay-document` only. Do not let
  drag-region CSS leak into the main Documents window.
- `overlay_resize` must only resize. Do not call `center()` or recompute AppKit
  origin on every resize; that moves the overlay away from where the user dragged
  it.
- Current dimensions: width `500`, min height `88`, max height `460`, plus a
  `compactWithHint` height (`124`) used only while the first-run hint (below)
  is showing.
- `show_overlay_or_log` emits a global `overlay:opened` event after every
  successful show (pure addition — no window lifecycle change). The main
  window listens for it while the guided tour is active and auto-finishes the
  tour the instant the user presses the real hotkey
  (`onOverlayOpened` in `liveassist-bridge.ts`/`App.tsx`).
- `overlay.tsx` shows a one-time first-run hint under the input in compact
  phase only (`showFirstRunHint`, gated by the `overlay_tour_done` localStorage
  key — shared with the main window, same origin/data store). Dismissed by its
  "Got it" button or automatically the first time a real search runs.

Known side issue: ad-hoc code signatures make macOS treat each rebuild as a new
app, so Accessibility grants may reset after rebuilds. Real code signing is
deferred.

## Desktop UI And Theme

Core files:

- `src/renderer/src/App.tsx`
- `src/renderer/src/ui.tsx`
- `src/renderer/src/index.css`
- `src/renderer/src/theme.ts`
- `tailwind.config.cjs`

Current behavior:

- Main app has Documents, Ask, Settings.
- Settings includes Appearance: `light`, `dark`, `system`.
- Theme is stored under `liveassist_appearance`.
- `theme.ts` only affects the main window. The overlay has its own HTML document
  and should not inherit main-window dark mode accidentally.
- Tailwind dark mode is class-based.

Design direction:

- Audience is non-technical operators.
- Keep density practical and professional.
- Avoid developer labels where possible. If technical health is useful, keep it
  secondary.
- Avoid big decorative cards, hero layouts, gradient blobs, and marketing-page
  composition inside the app.

## Onboarding v2 — Spotlight Tour + Demo Seeding

Core files:

- `src/renderer/src/GuidedTour.tsx`
- `src/renderer/src/App.tsx`
- `src/renderer/src/platform.ts`
- `src-tauri/src/lib.rs` (`import_document_paths`, `documents_seed_demo_if_needed`)
- `src-tauri/tauri.conf.json` (`bundle.resources` ships `resources/sample-docs/`)
- `resources/sample-docs/*.txt`

Current behavior:

- `ONBOARDING_V2_DONE_KEY = onboarding_v2_done` in `App.tsx` replaced the old
  unversioned `onboarding_done` key/3-step tour.
- `GuidedTour` is a config-driven spotlight tour (`TourStep[]`): a four-strip
  DOM dimmer frames the target's `getBoundingClientRect()` (not a mask/clip-path),
  which keeps the real control underneath fully clickable — clicking the real
  Ask nav mid-tour still advances the tour, same as the old bespoke version did.
  Targets are matched purely via `data-tour-id` attributes (`document-row`,
  `upload-button`, `ask-nav`, `ask-input`, `shortcut-hint`) — no prop drilling.
  Skip/Back/Next, Escape/ArrowLeft/ArrowRight/Enter, and focus-follows-step are
  all wired. If a step's target never mounts within 2s, the tour auto-advances
  instead of blocking.
- On first run (`onboarding_v2_done` unset), the renderer calls
  `seedDemoDocumentsIfNeeded()` once, then starts the tour. Seeding copies
  `resources/sample-docs/*.txt` into `app_data_dir/demo-docs/` and imports them
  through the same `import_document_paths` helper real uploads use — verified
  live via `tauri:dev` (resource_dir resolves correctly in dev, docs land in
  SQLite as `indexed`, no duplication on a second call).
- Seeding is idempotent via the `onboarding_demo_seeded_v1` SQLite setting
  (`db::settings`), not a localStorage flag — it's checked server-side so it
  survives a cleared renderer/localStorage state.
- `documents_select_and_upload` is now a thin wrapper (file picker + cap) over
  `import_document_paths`, which both it and demo seeding call. Keep behavior
  changes to that shared helper in sync for both call sites.
- Sample docs no longer say `Cmd+J`; they reference the real shortcut via
  `shortcutLabel()` (`platform.ts`, `navigator.platform`-based).
- `AccessibilityGate`'s permission-request state is a full-screen blurred
  modal (`z-[70]`, above `GuidedTour`'s `z-[60]`) with a glowing card
  (`gate-glow` keyframe in `index.css`) and trimmed copy — one title, one
  line, two buttons, a small pulsing "Waiting for permission…" row. Only the
  *request* card got this treatment; the brief post-grant confirmation stays
  a small top toast since it isn't asking for anything.

Model-readiness gating and the overlay mini-tour (originally deferred) are now
implemented too — see Embeddings And Retrieval and Quick Ask Overlay above.
Nothing left outstanding from the original CLAUDE.md Onboarding v2 plan.

Manual QA checklist:

- clean first launch (clear `onboarding_v2_done` from localStorage and the
  `onboarding_demo_seeded_v1` setting/`demo-docs` folder from app data) seeds
  exactly one demo set and starts the tour
- demo docs do not duplicate on relaunch
- deleted demo docs do not reappear automatically
- Back/Next/Skip/Escape/arrow keys all work; clicking the real Ask nav
  mid-tour also advances it
- macOS shows `⌥ Space`; Windows/Linux shows `Ctrl Alt Space` in both the tour
  and the Ask view's shortcut chip
- dark mode remains readable behind the dimmed strips
- model-status banner appears in Ask while the embedding model downloads/
  verifies and disappears once ready
- pressing the real hotkey while the tour is open dismisses it immediately
- the overlay's first-run hint shows once, dismisses via "Got it" or on first
  search, and never reappears after either
- the Accessibility permission card is a full-screen blur/glow modal with
  short copy; the post-grant confirmation stays a small toast

## CRM Assistant (Phase 1 Prototype, Complete)

Phase 1 builds an isolated, mock-data-only CRM Assistant prototype to validate
the post-call workflow (paste a session note → review suggested CRM actions →
approve/edit → mocked apply) before any real amoCRM integration. Rules and
task queue: `Doc/13-crm-phase1-context-pack.md` and
`Doc/10-crm-assistant-task-queue.md`.

Progress:

- TASK-A done. Created `src/renderer/src/crm-assistant/types.ts` (mock domain
  types: leads, session notes, suggested actions, approval/write status),
  `mockData.ts` (mock leads plus per-lead suggested actions), and
  `SessionNoteInput.tsx` + `CrmAssistantView.tsx` (lead picker, session note
  textarea, read-only suggested-actions list). Mock data only. Not wired into
  `App.tsx` yet.
- Validation run: `npm run typecheck` (passed).
- TASK-B done. Created `src/renderer/src/crm-assistant/LeadSelector.tsx`
  (extracted lead picker + stage pill), `ActionRow.tsx` (per-action
  enable/disable toggle, editable payload fields, write-status/retry UI),
  `WriteResultPanel.tsx` (aggregate applying/success/failure banner), and
  `ApprovalBoard.tsx` (renders the action list plus an "Apply approved
  actions" button). `CrmAssistantView.tsx` got additive edits only: it now
  owns `approvals` and `writeResults` state and a mocked apply flow
  (`runMockApply`/`mockApplyOutcome`) that resolves each enabled action via
  `setTimeout` — deterministically failing ~1/3 of actions on first attempt
  and always succeeding on retry, so the retry UI has something to exercise.
  Mock data only, no backend, not wired into `App.tsx`.
- Validation run: `npm run typecheck` (passed).
- TASK-C done. Wired `CrmAssistantView` into `App.tsx`: added `'crm'` to
  `ViewKey`, a new `CrmIcon` and a fourth "CRM Assistant" nav item (between
  Ask and Settings) in both the sidebar and the mobile compact nav
  (`grid-cols-3` → `grid-cols-4`, with `truncate` added to the compact nav
  button since "CRM Assistant" is longer than the other labels), and a render
  branch for `activeView === 'crm'`. No other `App.tsx` behavior changed.
- Validation run: `npm run typecheck`, `npm run web:build`, `npm run test`
  (26 passed), `git diff --check` (all passed).
- Phase 1 is complete: TASK-A, TASK-B, and TASK-C are all `done`. The CRM
  Assistant prototype (mock data only, no backend, no amoCRM) is reachable
  from the main nav. Phase 2+ (real AI extraction, amoCRM integration,
  write-back) is not started — see `Doc/10-crm-assistant-task-queue.md`
  Later Phase Groups.

### Phase 2 Progress

Shared Phase 2 context: `Doc/14-crm-phase2-context-pack.md`.

- TASK-D done. Created `src/renderer/src/crm-assistant/extraction/types.ts`
  (`SessionExtraction`, `SuggestedCrmAction`, `ExtractedNextStep`,
  `CrmSentiment` — reuses `CrmActionType`/`CrmActionField` from the Phase 1
  `../types.ts` so a future mapping to `ApprovalBoard` stays cheap),
  `contracts.ts` (dependency-free, hand-rolled validation:
  `validateSessionExtraction(input: unknown, expectedLeadId)` returns a
  discriminated `{ ok: true, data }` / `{ ok: false, errors, fallback }`
  result and never throws; `buildFallbackExtraction` produces the safe
  fallback), `fixtures.ts` (3 deterministic valid note/extraction pairs
  covering positive/neutral/negative sentiment, optional `dueDate`, and
  unknown-field stripping, plus `SAMPLE_SESSION_NOTES` derived from them; 12
  `MALFORMED_EXTRACTION_FIXTURES` covering non-object roots, missing/invalid
  fields, out-of-range confidence, unknown action types, and deeply nested
  garbage), and `fixtures.test.ts` (16 tests, all passing when run directly
  with vitest against `vite.config.ts` — note `vitest.config.ts`'s `include`
  is `test/**/*.test.ts` only, so this file is not picked up by the plain
  `npm run test` root script; that's expected for this task, whose only
  required validation is `npm run typecheck`). No backend command, no
  dependency, no proxy change. Not wired into `CrmAssistantView.tsx` yet —
  that's TASK-E.
- Validation run: `npm run typecheck` (passed). Also manually verified
  `NODE_OPTIONS=--experimental-sqlite npx vitest run
  src/renderer/src/crm-assistant/extraction/fixtures.test.ts --config
  vite.config.ts` (16/16 passed) even though it's outside the required
  validation set.
- TASK-E done. Created
  `src/renderer/src/crm-assistant/extraction/localExtractionService.ts`:
  `runLocalExtraction(leadId, noteText)` resolves a validated
  `SessionExtraction` with no network call. An exact match against
  `VALID_SESSION_EXTRACTION_FIXTURES` (same `leadId` and trimmed note text)
  returns that fixture's payload (`source: 'fixture'`); anything else runs a
  small deterministic heuristic (`source: 'heuristic'`) — keyword-based
  sentiment (`POSITIVE_WORDS`/`NEGATIVE_WORDS`), first up-to-3 sentences as
  `keyTopics`, and a single `add_note` `SuggestedCrmAction` built from the
  note text, with a stable id derived from a small deterministic string hash
  (no `Date.now()`/randomness, so the same input always produces the same
  output). Both paths are always passed through `validateSessionExtraction`
  before returning, so a real backend swapped in later (TASK-F+) is held to
  the same contract; the `source: 'fallback'` branch is the existing
  `contracts.ts` safety net and is effectively unreached today since the
  heuristic always builds well-typed output. Wired into
  `CrmAssistantView.tsx`: `handleGenerateSuggestions` now calls
  `runLocalExtraction(selectedLeadId, noteText)` instead of the static
  `getMockSuggestedActions` lookup (that mock import was removed); the
  `MOCK_SUGGESTED_ACTIONS_BY_LEAD` data in `mockData.ts` itself is untouched
  and now unused by the UI but left in place (out of this task's allowed
  files). `SessionNoteInput.tsx` got a one-line copy update reflecting that
  suggestions are now generated locally from the note text, not from static
  per-lead mock data. Added
  `src/renderer/src/crm-assistant/extraction/localExtractionService.test.ts`
  (10 tests: all 3 valid fixtures resolve verbatim by leadId+noteText match,
  a fixture note under the wrong `leadId` falls through to the heuristic
  instead of matching, heuristic determinism, positive/negative/neutral
  sentiment inference, one `add_note` action shape, and empty/whitespace note
  text handled without throwing and with empty `keyTopics`/`suggestedActions`).
- Validation run: `npm run typecheck`, `npm run test` (26 passed — the new
  test file is outside `vitest.config.ts`'s `test/**/*.test.ts` include, same
  situation as `fixtures.test.ts` in TASK-D), `npm run web:build`. Also
  manually verified `NODE_OPTIONS=--experimental-sqlite npx vitest run
  src/renderer/src/crm-assistant/extraction/localExtractionService.test.ts
  --config vite.config.ts` (10/10 passed).
- TASK-F done. Design-only: no real network call, no Tauri command
  registered. Created
  `src/renderer/src/crm-assistant/extraction/extractionGateway.ts`: an
  `ExtractionGateway` interface (`{ name, extract(request) }`) plus
  `localExtractionGateway`, the only implementation, wrapping the existing
  `runLocalExtraction`. `activeExtractionGateway` is the single export a
  future backend gateway would replace; nothing else changed in
  `localExtractionService.ts`, `contracts.ts`, or `types.ts`, and the new
  gateway is not imported by `CrmAssistantView.tsx` yet (that file is outside
  this task's allowed scope) — it still calls `runLocalExtraction` directly.
  Created `Doc/15-crm-phase2-extraction-architecture.md`, explaining why a
  future backend path must be parallel to `answer.rs`/`/generate` rather than
  layered on it (different shape: one JSON object vs. token-streamed SSE,
  and CRM extraction must not share the Q&A `DAILY_REQUEST_LIMIT`), and
  sketching (not implementing) a future `crm_extraction.rs` Rust module, a
  `crm_extract_session` Tauri command, and a `/crm-extract` proxy endpoint.
- Validation run: `npm run typecheck`, `npm run test` (26 passed, unchanged),
  `npm run web:build`, `git diff --check` (all passed).
- TASK-G done. Validation-and-handoff only, no application code touched.
  Reran the full Phase 2 validation set clean (`npm run typecheck`, `npm run
  test` — 26 passed, `npm run web:build`, `git diff --check`). Confirmed via
  `git diff --stat` that no protected path changed during Phase 2 (no
  `overlay.tsx`, `hotkey.rs`, AppKit/NSPanel lifecycle in `lib.rs`,
  `answer.rs`, `proxy/server.js`, `db/schema.sql`, `package.json`,
  `package-lock.json`, or `src-tauri/Cargo.toml`), and via a targeted grep
  across `src/renderer/src/crm-assistant/**` that no `fetch`/`invoke`/OAuth/
  amoCRM/network call exists anywhere in the extraction path — the two hits
  were pre-existing comments stating that boundary, not code. Phase 2
  (TASK-D, TASK-E, TASK-F, TASK-G) is complete: local deterministic
  extraction (fixture-match + heuristic fallback) is wired into the CRM
  Assistant UI, malformed output falls back safely through
  `validateSessionExtraction`, and the future backend gateway
  interface/architecture note exist with no real network call registered.
  Phase 3+ (real amoCRM read integration) is not started.

### Phase 3 Progress

Shared Phase 3 context: `Doc/16-crm-phase3-context-pack.md`.

- TASK-H done. Implemented the Phase 3 AI extraction boundary end-to-end,
  still with no real network call. `extraction/types.ts` gained a shared
  `ExtractionSource` (`'fixture' | 'heuristic' | 'ai' | 'fallback'`),
  `ExtractionResult`, and `ExtractionRequest` — `localExtractionService.ts`
  now aliases its old `LocalExtractionSource`/`LocalExtractionResult` names to
  these instead of redefining them. `contracts.ts` gained
  `applyPartialDefaults` (a pre-validation pass that fills in `summary: ''`,
  `sentiment: 'neutral'`, `keyTopics: []`, `nextSteps: []` only when those
  fields are `undefined`, never when present-but-wrong-typed, so all existing
  Phase 2 malformed-fixture expectations are unchanged) and
  `isLowConfidenceActionSet` (true when every suggested action's confidence
  is `<= LOW_CONFIDENCE_THRESHOLD`, currently `0.5`). `fixtures.ts` gained
  `PARTIAL_EXTRACTION_FIXTURES` (2 cases) and `LOW_CONFIDENCE_EXTRACTION_FIXTURES`
  (1 case), both asserted in `fixtures.test.ts`. Fixed the reported local
  formatting bug: real pasted/dictated notes sometimes glue a sentence-ending
  period directly to the next capital letter (e.g. `"next month.Main
  office..."`); `localExtractionService.ts` now runs a new
  `normalizeSentenceSpacing` pass (`/([.!?])(?=[A-Z])/g` → inserts the missing
  space) on the note before building the heuristic summary/key topics/action
  text, covered by a new regression test in `localExtractionService.test.ts`.
  Added three new modules for the AI boundary, each network-free:
  `aiExtractionPrompt.ts` (`AI_EXTRACTION_SYSTEM_PROMPT` + `buildAiExtractionPrompt`,
  documents the exact `SessionExtraction`-shaped JSON a model must return, no
  test file per the task's allowed-files list), `aiExtractionParser.ts`
  (`parseAiExtractionResponse`: tries a direct `JSON.parse`, then strips
  ```/```json code fences, then extracts the substring between the first `{`
  and last `}`, for stray prose around the JSON; never throws, returns
  `{ ok: false, error }` on failure — 7 tests in
  `aiExtractionParser.test.ts`), and `aiExtractionProvider.ts`
  (`AiExtractionProvider` interface + `unavailableAiExtractionProvider`, which
  always rejects since no real backend exists yet, exported as
  `activeAiExtractionProvider` — 2 tests in `aiExtractionProvider.test.ts`).
  Rewrote `extractionGateway.ts`: `createAiExtractionGateway(provider,
  fallbackGateway = localExtractionGateway)` builds a gateway that calls the
  provider, parses its raw text, and validates the parsed JSON — falling back
  to `fallbackGateway.extract(...)` (prepending AI-side error strings to the
  result) if the provider rejects, the text doesn't parse, or the parsed JSON
  fails `validateSessionExtraction`; even a broken fallback can't make it
  throw (caught and replaced with `buildFallbackExtraction`). `aiExtractionGateway
  = createAiExtractionGateway(activeAiExtractionProvider)` is now
  `activeExtractionGateway` (was `localExtractionGateway`) — 6 tests in the
  new `extractionGateway.test.ts` cover AI success, provider rejection,
  unparseable text, schema-invalid JSON, and the double-failure safety net,
  all via a fake `AiExtractionProvider` (no real provider is exercised since
  none exists). Wired `CrmAssistantView.tsx` through `activeExtractionGateway`
  only: `handleGenerateSuggestions` is now `async`, guarded by a
  `generationRequestIdRef` counter so a stale in-flight response (e.g. the
  user switched leads mid-request) can't overwrite newer state. Added
  `isGenerating`/`generationError`/`extractionNotice` state and wired the
  existing (previously unused) `SessionNoteInput` `isGenerating` prop through.
  New UI states in the Suggested Actions card: a "Generating suggestions…"
  line while awaiting the gateway, a `MessageBanner tone="error"` if the
  gateway call itself throws, a `MessageBanner tone="warning"` when
  `extractionNotice.source === 'fallback'` (safe default used, review
  manually), and a separate low-confidence `MessageBanner tone="warning"`
  (via `isLowConfidenceActionSet`) when every returned suggested action is
  low-confidence — note the heuristic path always produces a single
  `confidence: 0.4` action, so any note that doesn't match one of the 3
  curated fixtures now visibly surfaces as low-confidence, which is intended.
  `SessionNoteInput.tsx` gained a short-note hint (amber text, non-blocking)
  when the trimmed note is under 20 characters, and now disables the textarea
  itself while generating (it already disabled the button).
- Validation run: `npm run typecheck`, `npm run test` (26 passed, unchanged —
  the extraction test files remain outside `vitest.config.ts`'s
  `test/**/*.test.ts` include, same as Phase 2), `npm run web:build`,
  `git diff --check` (all passed). Also manually verified all 5 extraction
  test files together: `NODE_OPTIONS=--experimental-sqlite npx vitest run
  src/renderer/src/crm-assistant/extraction --config vite.config.ts` (46/46
  passed — fixtures.test.ts, localExtractionService.test.ts,
  aiExtractionParser.test.ts, aiExtractionProvider.test.ts,
  extractionGateway.test.ts). Did not launch `npm run tauri:dev` for a live
  manual click-through in this session (overnight/unattended run, and the
  task's own validation list only names the four commands above); the next
  interactive session should exercise the new loading/fallback/low-confidence/
  short-note states live in the running app at least once. No protected file
  was touched — confirmed via `git status --porcelain`. No amoCRM/OAuth/
  write-back/proxy/DB/dependency change was made. TASK-I (final Phase 3
  hardening, docs, and handoff) is next and not started.
- TASK-I done. Phase 3 final hardening, docs, validation, and handoff — no
  application code changed (only docs, per this task's own scope). Confirmed
  via `git diff --stat HEAD~5..HEAD` that zero protected files were touched
  anywhere across the whole CRM assistant commit history (no `overlay.tsx`,
  `hotkey.rs`, `answer.rs`, `proxy/server.js`, `db/schema.sql`,
  `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`), and via a
  targeted grep across `src/renderer/src/crm-assistant/**` that no
  `fetch`/`invoke`/OAuth/amoCRM/axios/XMLHttpRequest call exists anywhere in
  the extraction path (only two pre-existing comments state that boundary).
  No CRM command is registered in `src-tauri/src/lib.rs`. Added a "Phase 3
  Status: Complete" section and a new "Phase 4 Design Guidance" section to
  `Doc/16-crm-phase3-context-pack.md`, answering the three questions this
  task named: reuse the existing Vercel-hosted proxy deployment but add a
  dedicated `POST /crm-extract` route (not layered on `/generate`, per the
  TASK-F sketch in `Doc/15-crm-phase2-extraction-architecture.md`); the
  DeepSeek/model key stays server-side in the proxy exactly like `/generate`
  today, the renderer/Rust side only ever holds `APP_SECRET`; and amoCRM
  OAuth/read/write-back all remain out of scope until a human explicitly
  scopes Phase 4. Corrected a stale claim in
  `Doc/11-claude-night-runner-protocol.md` that said the runner "refuses
  `phase3`" — the runner script (`task_phase`/`validate_phase_filter`) has
  accepted `phase3` since TASK-H; only `phase4`-`phase6` are refused. Updated
  that doc's Phase batching list, phase-specific context-pack list, blocked-
  actions list, and added a status note that Phase 1-3 are all done so a
  fresh `--phase phaseN` run (N=1,2,3) will find no pending task and stop
  immediately, and that Phase 4 needs human-authored detailed task blocks in
  `Doc/10-crm-assistant-task-queue.md` before the runner will accept it
  (confirmed the runner script itself already enforces this — no script
  change was made or needed). Marked TASK-I `done` and added a Phase 3
  completion summary in `Doc/10-crm-assistant-task-queue.md` (mirroring the
  Phase 2 completion summary style already there).
- Validation run: `npm run typecheck`, `npm run test` (26 passed, unchanged),
  `npm run web:build`, `git diff --check` (all passed). Also reran the 5
  extraction test files directly via `NODE_OPTIONS=--experimental-sqlite npx
  vitest run src/renderer/src/crm-assistant/extraction --config
  vite.config.ts` (46/46 passed). Phase 3 (TASK-H, TASK-I) is complete.
  Phase 4 ("Safe write-back") is not started and requires fresh human
  scoping — the runner will not auto-jump into it.

### Phase 4 Progress

Shared Phase 4 overnight context: `Doc/17-crm-phase4-context-pack.md`.

- TASK-J done. Created `src/renderer/src/crm-assistant/integration/`:
  `types.ts` (`CrmIntegrationProvider` contract — connection status, lead
  context, duplicate check, apply — plus the narrower `CrmOperationKind`:
  `create_note | attach_summary | create_task | add_tag`, deliberately
  smaller than the existing `CrmActionType`), `config.ts`
  (`resolveCrmIntegrationConfig` reads `import.meta.env.VITE_CRM_LIVE_MODE`
  as the one explicit live-mode gate, but a hardcoded
  `LIVE_PROVIDER_AVAILABLE = false` means the resolved mode is always
  `'sandbox'` today since no live provider exists — flipping that one
  constant is the intended way to turn on live mode later),
  `sandboxProvider.ts` (`createSandboxCrmProvider()` — isolated in-memory
  per-lead state, no network call; `getConnectionStatus` reports
  `sandbox`/no-credentials by default and `live_disabled` when live mode is
  requested but unavailable; `apply`/`checkForDuplicate` cover all four
  operation kinds and refuse an exact-duplicate note/task/tag as
  `status: 'failed'`, `retryable: false` instead of silently double-writing),
  and `applyPipeline.ts` (`runApplyPipeline` maps each existing
  `CrmActionType` onto one `CrmOperationKind` — `add_note` → `create_note`,
  `schedule_follow_up` → `create_task`, `update_stage` → `add_tag`,
  `update_field` → `attach_summary`, since the sandbox has no real stage/
  field write yet and records those as a tag/note instead of no-opping;
  disabled actions resolve to `'skipped'` locally and never reach the
  provider; retry reuses the same `CrmSuggestedAction` object with an
  optional field override, no extraction regeneration). Added 21 tests
  across `sandboxProvider.test.ts` and `applyPipeline.test.ts` covering
  connection states, disabled-live-mode, no-credentials default, per-
  operation apply results, duplicate detection/refusal, disabled-action
  skip (asserted via a spy provider), partial-failure independence,
  duplicate-warning surfacing, and edited-field retry. `types.ts` and
  `mockData.ts` were left untouched — nothing required a change.
  `ApprovalBoard.tsx`/`ActionRow.tsx`/`CrmAssistantView.tsx` were not
  touched (out of this task's allowed files); wiring the pipeline into the
  UI is `TASK-K`. No Tauri command, no OAuth, no token storage, no real
  network call, no hardcoded credentials.
- Validation run: `npm run typecheck`, `npm run test` (26 passed,
  unchanged — the new integration test files are outside
  `vitest.config.ts`'s `test/**/*.test.ts` include, same as prior CRM
  extraction test files), `npm run web:build`, `git diff --check` (all
  passed). Also ran the new tests directly:
  `NODE_OPTIONS=--experimental-sqlite npx vitest run
  src/renderer/src/crm-assistant/integration --config vite.config.ts`
  (21/21 passed). TASK-K (wire the apply pipeline into the CRM Assistant
  UI) is next and not started.
- TASK-K done. `CrmAssistantView.tsx` no longer uses the old
  `mockApplyOutcome`/`setTimeout` coinflip logic. `handleApply` now builds
  an `ApplyPipelineItem[]` from the live `suggestedActions`/`approvals`
  state (mapping each action's current approval state and, if edited,
  fields) and calls the real `runApplyPipeline` (`TASK-J`) against the
  shared `sandboxCrmProvider` singleton. All actions — enabled and disabled
  — are passed through on every apply click, so the pipeline's own
  disabled-skip logic marks unapproved rows `'skipped'` locally (never
  reaching the provider) rather than the UI re-implementing that filter.
  `handleRetry` re-sends a single action with its current (possibly
  manager-edited) `approval.fields`, reusing the same `CrmSuggestedAction`
  object — no extraction regeneration. Added an `applyRequestIdRef` counter
  mirroring the existing `generationRequestIdRef` pattern so a stale
  in-flight apply/retry can't clobber state after the manager switches
  leads. `types.ts` gained a `'skipped'` `CrmWriteStatus` value and an
  optional `duplicateWarning` on `CrmWriteResult`. `ActionRow.tsx` renders a
  neutral "Skipped" pill for disabled rows that were part of an apply run,
  and distinguishes a duplicate-caused failure with a `warning`-tone
  "Possible duplicate" pill instead of a generic red "Failed" — this is how
  duplicate/conflict warnings from the sandbox surface to the manager.
  `WriteResultPanel.tsx` excludes skipped rows from its applied/failed
  counts, appends a "(N skipped, not approved)" suffix, and reworded
  "(mock)" to "(sandbox)" since apply now goes through the real integration
  boundary. `CrmAssistantView.tsx` also shows a warning banner using
  `connectionStatus.message` if the pipeline ever reports
  `state: 'live_disabled'`, reinforcing that live amoCRM stays off by
  default. `ApprovalBoard.tsx` and `mockData.ts` needed no changes.
  Added two tests: `applyPipeline.test.ts` gained a mixed enabled+disabled
  run asserting only enabled actions reach the provider (apply selection +
  skip together), and `sandboxProvider.test.ts` gained a smoke test on the
  exported `sandboxCrmProvider` singleton (not just
  `createSandboxCrmProvider()`) confirming it works with zero configuration
  (local/demo mode). No Tauri command, no OAuth, no token storage, no real
  network call was added.
- Validation run: `npm run typecheck`, `npm run test` (26 passed, unchanged),
  `npm run web:build`, `git diff --check` (all passed). Also ran
  `NODE_OPTIONS=--experimental-sqlite npx vitest run
  src/renderer/src/crm-assistant/integration --config vite.config.ts`
  (23/23 passed — 21 prior + 2 new) and the extraction suite unchanged
  (46/46 passed via the same direct-vitest command against
  `src/renderer/src/crm-assistant/extraction`). Did not launch
  `npm run tauri:dev` for a live manual click-through in this session; the
  next interactive session should exercise apply/retry/skip/duplicate-
  warning states live in the running app at least once. Phase 4 (`TASK-J`,
  `TASK-K`) is complete. Phase 5 (`TASK-L`, `TASK-M`) is not started.

### Phase 5 Progress

Shared Phase 5 overnight context: `Doc/18-crm-phase5-context-pack.md`.

- TASK-L done. Created `src/renderer/src/crm-assistant/history/actionHistory.ts`:
  a local, in-memory `CrmHistoryEvent` model covering exactly the lifecycle
  this task named (`suggested | edited | approved | skipped | applied |
  failed | retried`), with `recordHistoryEvent` (coalesces consecutive
  `edited` events for the same action+field into one updated entry instead
  of one per keystroke), `historyForLead`/`sortHistoryNewestFirst` (ordering
  keyed off a monotonic `sequence` field so it stays deterministic even on
  timestamp ties), and `historyEventTypeForApplyStatus` (maps
  `runApplyPipeline`'s terminal `applied|failed|skipped` statuses onto
  history event types, `null` for the transient `applying` status it never
  actually observes). The same file also holds `buildContextPreviewViewModel`,
  a pure data-shaping function for the CRM context preview (note/tag/open-task
  counts and lists from the Phase 4 sandbox's `CrmLeadContext`, an `isStale`
  flag so a context fetched for a since-abandoned lead is never shown under
  the newly selected lead, and `isLiveDisabled`/`connectionMessage`
  passthrough for local/demo-mode honesty) — co-located with the history
  model since this task's allowed-files list only named one logic file.
  Added `history/CrmActionHistoryPanel.tsx` (lead-filtered, newest-first
  timeline with a status pill per event and an empty state) and
  `history/CrmContextPreview.tsx` (renders the view model: a "Local sandbox"
  / "Live mode disabled" pill, loading/stale/empty states, notes/tags/open
  task lists, and a persistent "not a live CRM connection" footer line).
  `CrmAssistantView.tsx` wires both in: new `history`/`leadContext`/
  `isContextLoading` state plus a `contextRequestIdRef` guard (mirroring the
  existing request-id-guard pattern) around a new `refreshLeadContext` that
  calls the sandbox provider's `getLeadContext`+`getConnectionStatus`
  together on mount, on every lead change, and after every apply run (since
  sandbox state changes on apply). History events are recorded at every
  existing state-change site — suggestions generated, an action re-enabled
  (not on disable, which only becomes visible as `skipped` if an apply is
  later attempted while it's off, matching the apply pipeline's own
  terminology), a field edited, an apply result per action, and a retry
  request — and history itself is not cleared on lead change, only filtered
  by `leadId` for display, so a manager can see what happened on a
  previously-viewed lead for the life of the session (still in-memory only,
  no persistence). Two new `Card` sections were added to the view: "CRM
  context preview" and "Activity history". No Tauri command, no OAuth, no
  token storage, no live CRM read, no DB change.
  `ApprovalBoard.tsx`/`ActionRow.tsx`/`WriteResultPanel.tsx`/
  `LeadSelector.tsx`/`types.ts`/`mockData.ts`/`integration/*` needed no
  changes. Added 14 tests in `history/actionHistory.test.ts` (event
  id/sequence uniqueness, edit coalescing, per-lead filtering, newest-first
  ordering including a timestamp-tie case, the terminal-status mapping,
  label/tone completeness for all 7 event types, and context-preview view
  model shaping including the stale-lead-mismatch and live-disabled cases).
- Validation run: `npm run typecheck`, `npm run test` (26 passed,
  unchanged — the new test file is outside `vitest.config.ts`'s
  `test/**/*.test.ts` include, same as every other crm-assistant test file),
  `npm run web:build`, `git diff --check` (all passed). Also ran
  `NODE_OPTIONS=--experimental-sqlite npx vitest run
  src/renderer/src/crm-assistant/history --config vite.config.ts` (14/14
  passed) and the full `src/renderer/src/crm-assistant` directory the same
  way (83/83 passed — 69 prior + 14 new, no regression). Did not launch
  `npm run tauri:dev` for a live manual click-through in this session; the
  next interactive session should exercise the context preview and activity
  history panels live in the running app at least once (lead switch,
  generate suggestions, edit a field, approve/disable, apply, retry a
  failure). Phase 5 `TASK-L` is complete. `TASK-M` (richer reviewed-
  suggestion display and Phase 5 review UX) is not started.
- TASK-M done. Created `src/renderer/src/crm-assistant/review/reviewModel.ts`:
  a pure view-model layer computing, per suggested action, `reason`/`evidence`
  (the summary plus specific risk callouts), a `riskLevel`
  (`low`/`medium`/`high`, starting from a per-action-type baseline and
  escalated for low confidence, an unsound `schedule_follow_up` date, or a
  blank editable field), and `operationKind`/`operationDescription` — the
  actual sandbox write `applyPipeline.ts` performs, stated plainly so a
  manager never assumes `update_stage`/`update_field` truly changed the CRM
  stage/field (the sandbox represents both as a tag/note instead, per
  `TASK-J`). `isApplicable`/`blockedReason` come from a new named denylist in
  `types.ts` (`DISALLOWED_CRM_ACTION_TYPES`: `move_lead_stage`,
  `create_new_lead`, `update_contact`, `delete_lead`, `delete_note`,
  `auto_write`, plus `isDisallowedCrmActionType`) — defense-in-depth, since
  `extraction/contracts.ts` already rejects any action outside the 4-value
  `CrmActionType` union during validation, but now the write boundary and
  review UI both have an explicit, testable "no" too. Wired in three places:
  `integration/applyPipeline.ts`'s `runApplyPipeline` checks
  `isDisallowedCrmActionType` first (before the disabled-action check) and
  returns a `status: 'failed', retryable: false` blocked result without ever
  calling the provider, regardless of approval state; `CrmAssistantView.tsx`
  defaults a disallowed action's approval state to `disabled`
  (`buildApprovals`) and computes `reviewedActions =
  buildReviewedActions(suggestedActions, approvals)` fresh every render,
  passed through `ApprovalBoard.tsx` (new `reviewed` prop, matched to each
  action by id) to `ActionRow.tsx`, which now shows a risk pill, an evidence
  bullet list, and — when `isApplicable` is false — a "Not applicable" pill
  instead of the enable/disable toggle plus the `blockedReason` text and no
  editable fields. Also fixed a real ambiguity: `CrmWriteResult` gained an
  optional `retryable` field (undefined = retryable, so nothing existing
  changes behavior); `runApplyPipeline` always produced this but
  `CrmAssistantView.tsx`'s `toWriteResult` was silently dropping it, so
  `ActionRow.tsx` was showing a "Retry" button even for non-retryable
  failures that would just fail again identically — it now only renders
  Retry when `retryable !== false`. Added 20 tests: 16 in the new
  `review/reviewModel.test.ts` (operation transparency for all 4 action
  types, risk escalation including a low-to-high stacking case, and
  disallowed-type handling via an `it.each` over the full denylist plus
  `filterApplicableReviewedActions`) and 2 in
  `integration/applyPipeline.test.ts` (one disallowed action blocked before
  reaching the provider even when approved, and every named disallowed type
  blocked in one batch). No calendar/email/SMS/audio integration, no live
  amoCRM credentials or network call, no dependency change, no DB/proxy/
  overlay/hotkey touch.
- Validation run: `npm run typecheck`, `npm run test` (26 passed,
  unchanged — `review/reviewModel.test.ts` is outside `vitest.config.ts`'s
  `test/**/*.test.ts` include, same as every other crm-assistant test file),
  `npm run web:build`, `git diff --check` (all passed). Also ran
  `NODE_OPTIONS=--experimental-sqlite npx vitest run
  src/renderer/src/crm-assistant --config vite.config.ts` (103/103 passed —
  83 prior + 20 new, no regression). Did not launch `npm run tauri:dev` for
  a live manual click-through in this session; the next interactive session
  should exercise the risk pill, evidence list, and blocked/not-applicable
  rendering live in the running app at least once (the blocked-action
  rendering path itself cannot be triggered through the live UI today, since
  the extraction contract still only ever produces the 4 allowed
  `CrmActionType` values — it's exercised only through unit tests). Phase 5
  (`TASK-L`, `TASK-M`) is complete. Phase 6 (`TASK-N`) is next and not
  started.

### Phase 6 Progress

- TASK-N done. Verified the empty/loading/partial-failure/duplicate/
  low-confidence/blocked-action states already built in Phase 4-5 were still
  correct, and closed the two real robustness gaps found:
  `CrmAssistantView.tsx`'s `refreshLeadContext` and `runApply` had no
  `catch` around their `sandboxCrmProvider`/`runApplyPipeline` calls — a
  rejected provider call (never happens with today's sandbox, but will once
  a live provider is wired in behind the same `CrmIntegrationProvider`
  interface) would have left the CRM context preview stuck on "Loading…"
  and an apply/retry batch stuck on "Applying…" forever. Added a
  `contextError` state plus a "Connection issue" pill/error banner/"Try
  again" button via new `error`/`onRetry` props on
  `history/CrmContextPreview.tsx`, and a catch in `runApply` that marks
  every enabled action in a rejected batch `failed`/`retryable` with a
  matching history entry. No other CRM Assistant file needed changes.
  Created `Doc/20-crm-pilot-readiness-checklist.md` (automated + manual QA
  checklist covering CRM Assistant state coverage and the existing
  Documents/Ask/overlay/onboarding regression surfaces) and
  `Doc/21-crm-phase6-final-handoff.md` (what the prototype does today, this
  session's changes, and the sandbox-to-real-data switch requirements —
  config gate, provider interface, connection-state expansion, credential
  handling — all without enabling any real credential or live call). No
  amoCRM OAuth, no real write-back, no dependency/DB/proxy/overlay/hotkey
  change, no secrets added. Confirmed TASK-A through TASK-M remain `done`.
- Validation run: `npm run typecheck`, `npm run test` (26 passed,
  unchanged), `npm run web:build`, `git diff --check` (all passed). Also ran
  `NODE_OPTIONS=--experimental-sqlite npx vitest run
  src/renderer/src/crm-assistant --config vite.config.ts` (103/103 passed,
  unchanged, no regression). Did not launch `npm run tauri:dev` for a live
  manual click-through this session — see `Doc/21-crm-phase6-final-handoff.md`
  and `Doc/20-crm-pilot-readiness-checklist.md` for the manual QA items a
  human session should still exercise before pilot. Phase 4, 5, and 6
  (`TASK-J` through `TASK-N`) are all complete. Phase 7 is scoped, not
  started.

### Phase 7 Progress

- TASK-O done. Implementation plus the mandatory human manual OAuth
  round-trip against a real amoCRM account are complete: Settings reached
  `Connected — zharylkassynaibek.amocrm.ru`, and after app restart the same
  connected status was restored from the OS keychain. Created
  `src-tauri/src/amocrm/mod.rs` and
  `src-tauri/src/amocrm/oauth.rs`: `AmoCrmManager` is the single owner of the
  amoCRM token lifecycle, holding one `Mutex<TokenState>` across each entire
  check-refresh-persist sequence (`ensure_fresh_access_token`) so no other
  code path can ever call amoCRM's token endpoint independently — amoCRM
  rotates the refresh token on every use (Doc/22 Findings §1), so a second
  concurrent caller could otherwise invalidate this one's token and lock the
  integration out. Credentials (subdomain, domain zone, client_id,
  client_secret, access_token, refresh_token, expires_at) serialize as one
  JSON blob into a single OS-keychain entry via the new `keyring` crate
  (v3.6.3) — no DB, no localStorage, never sent to the renderer, which only
  ever sees the 4-state `AmoCrmConnectionStatus` enum
  (`disconnected | connected | expired | error`). `amocrm_connect_start`
  takes the connect form's subdomain/domain-zone/client_id/client_secret,
  builds the amoCRM authorize URL, and opens it via the existing
  `tauri-plugin-opener` (`opener:default` in `capabilities/default.json`
  already covers `open_url` — no capability file change was needed).
  `amocrm_connect_submit_code(code, referer)` exchanges the user-pasted code
  for a token pair against `{base}/oauth2/access_token`, with `redirect_uri`
  fixed to `https://live-assist-proxy.vercel.app/amocrm/callback` (Doc/22 Findings
  §9 — amoCRM rejects loopback/localhost redirect URIs, so there is no local
  HTTP listener). `amocrm_connect_status` is a pure local check (no network
  call); `amocrm_disconnect` clears both the in-memory state and the
  keychain entry. If a token rotation succeeds against amoCRM but the new
  pair can't be durably persisted, or the refresh call itself fails
  (revoked/invalid refresh token), the manager clears in-memory credentials
  and surfaces a `reconnect_required` message as
  `AmoCrmConnectionStatus::Error` rather than silently retrying with a stale
  token. `proxy/server.js` gained exactly one additive route, `GET
  /amocrm/callback` — a pure, escaped-HTML display page (with copy buttons)
  showing the `code`/`referer` amoCRM redirects with, for the user to paste
  back by hand; it never calls amoCRM and never logs/persists them
  server-side, and does not touch `/generate`/SSE/`DAILY_REQUEST_LIMIT`.
  Renderer: `global.d.ts`/`liveassist-bridge.ts` gained the
  `AmoCrmConnectionStatus` type and four bridge methods
  (`amoCrmConnectStart`, `amoCrmConnectSubmitCode`, `amoCrmConnectStatus`,
  `amoCrmDisconnect`); `App.tsx` gained one new `AmoCrmSettingsCard`
  component inside the existing `SettingsView` (connect form, paste-code
  step, status pill, Disconnect button). Nothing in
  `src/renderer/src/crm-assistant/**` was touched — no lead read, no write,
  no `sandboxProvider.ts`/`applyPipeline.ts` change, matching this task's
  explicit non-goals.
- Manual OAuth verification completed in the user's real amoCRM account:
  callback, pasted `code`/`state`/`referer`, token exchange, connected status,
  and restart/keychain persistence all worked end to end. The separate
  read-only/scoped-access option question was not verified in this manual
  run; do not claim a read-only amoCRM mode until a later dashboard
  walkthrough confirms it.
- TASK-O follow-up fix (interactive session, same day): the browser
  authorize step was hitting `{account}.{zone}/oauth2/authorize`, which
  405s — that path only ever accepts the backend's POST token exchange.
  `oauth.rs` now sends the browser to the real consent-screen entrypoint,
  `oauth_authorize_base_url` = `https://www.{zone}/oauth` (covers
  `amocrm.ru`/`amocrm.com`/`kommo.com` and any future zone via the same
  formula), carrying only `client_id`, `state`, and `mode=popup` — never
  `client_secret`, never `redirect_uri` (that stays backend-only, in the
  token-exchange POST body). Added real anti-CSRF/anti-mixup `state`:
  `generate_state()` (a `uuid` v4, already a dependency) is created fresh in
  `begin_connect` and stored on `PendingConnect`; `complete_connect` now
  takes a third `state` argument and rejects the exchange via `verify_state`
  before any network call if it's missing or doesn't match. Renderer/bridge
  (`App.tsx`, `liveassist-bridge.ts`, `global.d.ts`) and the proxy's
  `/amocrm/callback` display page (`proxy/server.js`) were updated in
  lockstep so the paste-code step now asks for code + state + referer, and
  the callback page displays all three (plus `error`/`error_description` if
  amoCRM redirects with those instead of a code). No lead read/write, no
  CRM Assistant wiring — same boundary as the original TASK-O.
- Separately diagnosed the same day (no fix applied yet, pending human
  action): pressing Connect and completing amoCRM's consent screen 404s at
  `https://www.liveassist.tech/amocrm/callback` in production. Confirmed via
  direct `curl` against the live endpoints — this is two independent
  problems, not one: (1) `www.liveassist.tech` (and the apex, which 308s to
  it) is served by an entirely different Vercel project — the response
  carries Next.js App Router headers (`vary: RSC, Next-Router-State-Tree,
  Next-Router-Prefetch`), not this Express proxy — so `REDIRECT_URI` points
  at a domain that was never attached to the `live-assist-proxy` Vercel
  project (`proxy/.vercel/project.json`) in the first place; (2) even the
  project's own known-good domain, `https://live-assist-proxy.vercel.app`
  (the same one `PROXY_URL` defaults to), *also* 404s on
  `/amocrm/callback` — confirmed via `x-powered-by: express` on that
  domain's 404, and `/generate` there correctly 401s (no `x-app-secret`) —
  meaning it's genuinely this proxy, just running a build older than the
  `/amocrm/callback` route, the same stale-deploy failure mode already
  recorded for Phase 5 (fix there was `cd proxy && vercel --prod`). Both
  gaps need clearing before amoCRM OAuth can complete in production: a fresh
  `vercel --prod` deploy of `proxy/server.js`, **and** attaching a domain
  that this project actually owns to `live-assist-proxy` in the Vercel
  dashboard (`www.liveassist.tech` is already claimed by the other project,
  so `REDIRECT_URI` in `oauth.rs` will need to change to whatever hostname
  is actually assigned, e.g. a dedicated subdomain, once that's decided) —
  and updating the integration's own "Redirect URI" field in amoCRM's
  dashboard to match exactly. Also flagged for manual check: the amoCRM
  integration shows a "Private" status ("account list is limited") — this
  is very likely fine and expected for a single-account desktop client (it
  is not the same thing as a multi-tenant marketplace widget), but a human
  should still confirm in amoCRM's own integration settings that the
  private integration is scoped to the correct account and that its
  configured Redirect URI field matches `REDIRECT_URI` byte-for-byte.
- Hostname decision (same day): `proxy.liveassist.tech` was approved as the
  canonical callback host and `REDIRECT_URI` was updated to it, but the
  amoCRM integration's own Redirect URI field had already been set by hand
  to `https://live-assist-proxy.vercel.app/amocrm/callback` (the project's
  known-good Vercel domain) before that decision — the two-value mismatch
  is exactly what made Submit code fail. Reconciled by reverting
  `REDIRECT_URI` in `oauth.rs` (and every doc reference to it) to
  `https://live-assist-proxy.vercel.app/amocrm/callback`, matching what's
  actually configured in amoCRM. This is a code/docs-only change — a fresh
  `vercel --prod` deploy of `proxy/server.js` is still required so this
  domain's live function actually contains the `/amocrm/callback` route.
- Validation run: `npm run typecheck`, `cargo test --manifest-path
  src-tauri/Cargo.toml` (52 passed, 1 pre-existing ignored — 8 of those 52
  are new `amocrm::oauth::tests`, all pure-logic and deliberately never
  touching the real OS keychain, to avoid any risk of an interactive
  keychain-access prompt hanging an unattended `cargo test` run), `npm run
  web:build`, `git diff --check` (all passed). Also ran `npm run test` (142
  passed, unchanged). TASK-P (real amoCRM READ integration) may now start.
- TASK-P done (unattended overnight session). Added
  `src-tauri/src/amocrm/client.rs`: a typed, read-only client over amoCRM
  REST v4 — `get lead by id` and `get tags` share one `GET
  /leads/{id}?with=tags` call (amoCRM embeds a lead's tags on the lead
  entity itself rather than a separate endpoint), plus `get_lead_notes`
  (`/leads/{id}/notes`) and `get_lead_tasks`
  (`/tasks?filter[entity_type]=leads&filter[entity_id]={id}`, open only). A
  new `AmoCrmRateLimiter` throttles every call to ~4 req/sec (amoCRM's
  reported ceiling is ~7) with backoff on 429. `oauth.rs`'s
  `ensure_fresh_access_token` was refactored into a private `access_token
  (force: bool)` plus a new `force_refresh_access_token` (used on a live
  401) and `account_base_url` — both reuse the same single mutex-guarded
  refresh path from TASK-O, no second refresh implementation was added.
  `amocrm_get_lead_context(lead_id)` returns `AmoCrmLeadContext`, kept
  field-for-field identical to the renderer's `CrmLeadContext`. Also added
  (implemented but intentionally not wired into the read path)
  `get_custom_field_definitions` — nothing in `CrmLeadContext` consumes
  field-id-keyed data yet, so it's ready infrastructure for a future task
  rather than an unused call on the hot path.
  Frontend: `integration/liveCrmProvider.ts` is the first real
  `CrmIntegrationProvider` (`getConnectionStatus`/`getLeadContext` call the
  new command; `checkForDuplicate`/`apply` are safe stubs that fail loudly,
  never silently no-op, since apply/retry still always use
  `sandboxCrmProvider` per this task's scope — TASK-Q wires real writes).
  `integration/types.ts` gained a `'live'` `CrmConnectionState`.
  `integration/config.ts`'s `resolveCrmIntegrationConfig` now takes an
  optional `isAmoCrmConnected` parameter (default `false`, so
  `sandboxProvider.ts` — not in this task's allowed files — keeps compiling
  and behaving exactly as before). `CrmAssistantView.tsx`'s
  `refreshLeadContext` resolves live vs. sandbox per call
  (`resolveContextProvider`); apply/retry (`runApply`) were left untouched.
  `LeadSelector.tsx` gained a manual "amoCRM Lead ID" field + "Load live
  context" button, shown only when `VITE_CRM_LIVE_MODE=true`.
  Known, deliberately-accepted gap: `history/CrmContextPreview.tsx` and
  `history/actionHistory.ts` are not in this task's allowed files, so a
  genuinely live, connected context still renders the status pill as
  "Local sandbox" (no `'live'` branch exists in that view model yet) even
  though the underlying notes/tags/tasks shown are real — only the pill
  label is stale. A future task reopening those two files should add a
  "Live" pill variant.
  Validation run: `npm run typecheck`, `cargo test --manifest-path
  src-tauri/Cargo.toml` (62 passed, 1 pre-existing ignored — 5 new in
  `amocrm::client::tests`, none touching network/keychain), `npm run test`
  (149 passed, including 7 new in `liveCrmProvider.test.ts`), `npm run
  web:build`, `git diff --check` (all passed). The "manual test against one
  real amoCRM lead" validation step was **not** performed in this
  unattended session (no human present to paste a real lead id and
  visually confirm) — per Doc/22's runner sequencing note this is expected
  for a read-only task run overnight; the next interactive session should
  set `VITE_CRM_LIVE_MODE=true`, enter a real amoCRM lead id in the new
  field, click "Load live context", and confirm the shown notes/tags/open
  tasks match that lead in the real account. TASK-Q (real WRITE
  integration) is next and should run interactively, not unattended, the
  first time.
- TASK-Q implemented (interactive session; code + automated validation
  complete; the mandatory manual write test passed in a later session — see
  below and the 2026-07-09 verification note further down).
  `src-tauri/src/amocrm/client.rs` gained the three real write operations
  `create_note`/`create_task`/`add_tag`, all funneled through a new shared
  `amocrm_request` throttled retry loop (401-refresh-once, 429-backoff — the
  same policy TASK-P's `get_json` already used, now shared instead of
  duplicated) and a new `write_json` that deliberately never strictly parses
  a write response body, only its status, so an unanticipated-but-successful
  response can never wrongly read as `failed` and prompt a duplicate-risking
  retry. `add_tag` PATCHes the lead with its just-refetched existing tags
  plus the new one — amoCRM replaces (not appends to) `_embedded.tags` on
  that call, a documented API quirk, not a bug here. `create_task` needs
  amoCRM's required `complete_till` Unix timestamp; a small dependency-free
  `days_from_civil` (Howard Hinnant's public-domain algorithm) turns a
  manager-entered `follow_up_date` field into one, defaulting to now+24h when
  absent/unparseable. The new `amocrm_apply_action(request)` Tauri command
  re-fetches the lead's current context immediately before writing and
  refuses an exact-match duplicate with `status: failed, retryable: false` —
  `note_text_for`/`tag_value_for`/`is_duplicate` in `client.rs` mirror
  `sandboxProvider.ts`'s own pure functions field-for-field, so write
  behavior matches the sandbox exactly. Per the write-retry guardrail,
  `AmoCrmWriteError::retryable` is true only for a network failure, a 5xx, or
  an exhausted 429 — never a plain 4xx (likely "already applied" or
  "invalid," where blind retry risks a duplicate or masks a real error).
  Frontend: `liveCrmProvider.ts`'s `apply()` now calls the real command
  instead of always failing with a "read-only" message, and
  `checkForDuplicate()` is real (not a stub), mirroring `sandboxProvider.ts`
  to annotate `runApplyPipeline`'s `duplicateWarning` — the authoritative
  refusal stays Rust-side, as above. `applyPipeline.ts` needed zero changes:
  its `isDisallowedCrmActionType` check already ran before any provider call
  regardless of which provider, live or sandbox, was passed in. The actual
  functional gap TASK-Q had to close was in `CrmAssistantView.tsx`:
  `runApply`/`handleApply`/`handleRetry` previously always wrote through
  `sandboxCrmProvider` even when live mode was on and connected — apply/retry
  now resolve the provider the same way the context preview already did
  (`resolveContextProvider` renamed to `resolveCrmProvider`, now shared),
  remap the suggested action's `leadId` onto the manager-entered real amoCRM
  Lead ID for a live write, and refuse locally (no provider call) if live
  mode is on but no amoCRM Lead ID has been entered.
  Validation run: `npm run typecheck` (clean), `cargo test --manifest-path
  src-tauri/Cargo.toml` (72 passed, 1 pre-existing ignored — 10 new
  `amocrm::client::tests`, none touching network/keychain), `npm run test`
  (154 passed — `vitest.config.ts` now includes `src/renderer/src/**/
  *.test.ts` directly, so this is the full count, not a partial run),
  `npm run web:build` (clean), `git diff --check` (clean). At the time this
  paragraph was written, the mandatory manual test — write to a real test
  amoCRM lead and confirm in the amoCRM UI itself that exactly the expected
  note/task/tag appeared once, with no duplicate — had not run yet. **It has
  since run and passed (2026-07-09); see the dated verification note later
  in this section.** TASK-Q is now `done`. TASK-R's manual hardening checklist
  has since also run and passed (2026-07-10), so Phase 7 is now complete.
- Phase 7 support fix (interactive follow-up): a dev-only amoCRM test-data
  seeder was added to `src-tauri/src/amocrm/client.rs` and Settings. It is
  rejected outside debug builds, is visible only when amoCRM is connected and
  `VITE_CRM_LIVE_MODE=true`, supports a dry-run plan, requires the exact
  `SEED_TEST_AMOCRM` confirmation string for real creation, tags taggable
  records with `LiveAssistTestSeed` plus a timestamp prefix, and writes a
  local manifest of created IDs only (no secrets). This is a QA helper, not
  a TASK-Q completion signal.
- Main-window click/scroll fix (interactive follow-up): `GuidedTour.tsx`'s
  spotlight scrim strips are visual only (`pointer-events-none`) so they no
  longer intercept normal app clicks or wheel/scroll when the onboarding tour
  is active or waiting on a target. The tour tooltip remains interactive.
- CRM Assistant live/sandbox UX cleanup (interactive follow-up, same day):
  after TASK-Q, the frontend still showed the Phase 1 mock lead dropdown
  (Dana Whitfield/Tomas Berger/etc.) next to the manual amoCRM Lead ID field
  even in live mode, which was confusing and risked reading/writing the
  wrong lead. Fixed without touching OAuth/token storage or live-mode gating:
  `LeadSelector.tsx` is now mode-aware via a pure, unit-tested
  `resolveCrmLeadSelectorMode` — `'live'` shows only the real amoCRM lead ID
  control ("Open amoCRM lead"), `'sandbox'` shows only the mock dropdown
  labeled "Local sandbox", and a transient `'checking'` state (before
  amoCRM's connection status resolves) shows neither, so the mock dropdown
  never flashes on screen before being swapped for the live control.
  `CrmAssistantView.tsx` now derives one `activeLeadId` (the manager-entered
  amoCRM lead id in live mode, the selected mock lead otherwise) used
  everywhere — suggestion generation, context preview, activity history,
  apply/retry — instead of juggling `selectedLeadId`/`amoCrmLeadId`
  separately; a live suggested action's `leadId` is now the real amoCRM id
  from the moment it's generated. A new `handleLoadAmoCrmLead` (the live
  counterpart to the existing `handleLeadChange`) clears stale suggestions/
  write results when the manager loads a different real lead, which
  previously only happened on a mock-lead switch. `history/
  CrmContextPreview.tsx` is restructured into explicit Lead summary/Notes/
  Tags/Open tasks/Recent activity sections, each with its own empty state
  ("No notes found for this lead.", "No open tasks.", "No tags."). Dev-only
  amoCRM seed-data tags/note-prefixes (`LiveAssistTestSeed`/
  `LiveAssistTestSeed-<timestamp>`, see the seeder above) are now hidden from
  the normal context preview by `buildContextPreviewViewModel`
  (`history/actionHistory.ts`) — seed tags filtered from the tags list, seed
  bracket prefixes stripped from note/task text, and a single "Test data"
  badge shown instead when either was found; this is a display-only filter,
  the seeder backend and the real amoCRM tags themselves are untouched.
  `ActionRow.tsx` now shows an explicit "Writes: Note/Task/Tag" pill per
  action (the actual CRM primitive a write performs, from the existing
  `reviewModel.ts` `operationKind`). `WriteResultPanel.tsx` is restructured
  around a new pure, unit-tested `summarizeWriteResults` plus three count
  chips (Applied/Failed/Skipped-duplicate) instead of one sentence-only
  banner — a duplicate-refused write is grouped with skipped (expected,
  by-design) rather than with genuine failures. New tests:
  `LeadSelector.test.ts`, `WriteResultPanel.test.ts`, and additions to
  `history/actionHistory.test.ts` for seed-tag/prefix filtering (17 new
  tests total, 172 passing overall). This cleanup does not change TASK-Q's
  status — the mandatory manual write-and-confirm-in-amoCRM-UI test is still
  outstanding and TASK-Q stays `blocked` until a human completes it. A
  `TASK-S` follow-up ("CRM-aware Quick Ask for the active amoCRM lead") was
  documented in `Doc/10-crm-assistant-task-queue.md` as a proposal only —
  not implemented, and not to be started before TASK-Q/TASK-R.
- CRM extraction JSON validation fix (interactive follow-up, same day): once
  the proxy `APP_SECRET`/deploy issues were fixed, "Generate suggestions"
  started falling back with `nextSteps[0].dueDate must be a string when
  present`, even though DeepSeek was now returning non-empty JSON. Confirmed
  the exact cause by calling the real `/crm-extract` endpoint directly
  (curl, real `APP_SECRET`) with several call notes: DeepSeek sometimes
  returns a literal `"dueDate": null` on a `nextSteps` entry for an
  intentionally-omitted optional field, instead of leaving the key out —
  `validateSessionExtraction` in
  `src/renderer/src/crm-assistant/extraction/contracts.ts` was previously
  treating any non-`undefined`, non-string `dueDate` (including `null`) as a
  hard validation failure, collapsing the *entire* extraction (all
  `suggestedActions` included) to the safe fallback over one harmless field.
  Fixed at the validation boundary, not just the prompt:
  `validateExtractedNextStep` now normalizes `dueDate: null` to `undefined`
  before the type check, so it's treated exactly like "field absent"; any
  other non-string shape (number, object, array, boolean) is still rejected
  exactly as before — this is the correct fix location because
  `contracts.ts` is the single trust boundary every extraction source
  (fixture/heuristic/ai/fallback) already passes through, so the fix covers
  any future AI provider too, not just today's DeepSeek quirk. Also
  hardened both copies of the extraction prompt (`proxy/server.js`'s real
  `CRM_EXTRACTION_SYSTEM_PROMPT` and
  `extraction/aiExtractionPrompt.ts`'s documented mirror) to explicitly say
  never to set `dueDate` to `null`/empty/placeholder and to omit the key
  entirely instead — a defense-in-depth reduction in how often this fires at
  all, not a substitute for the normalization fix, since prompt compliance
  is never guaranteed. Added `extraction/contracts.test.ts` (5 tests: valid
  ISO string accepted, `dueDate` omitted accepted, literal `null` normalized
  and accepted, and 4 non-null/non-string shapes — number/object/array/
  boolean — still rejected with the same error message as before). No
  change to `answer.rs`, `/generate`, amoCRM OAuth/read/write, overlay,
  hotkey, or RAG.
- Validation run: `npm run typecheck`, `npm run test` (199 passed, 8 new),
  `npm run web:build`, `cargo test --manifest-path src-tauri/Cargo.toml` (82
  passed, 1 pre-existing ignored, unchanged — no Rust file was touched by
  this fix), `git diff --check` (all passed).
- **Human verification session, 2026-07-09 (partial — closes TASK-P's
  outstanding manual test, does not close TASK-Q's):** a human confirmed,
  against the real connected amoCRM account: the live amoCRM connection still
  works, real amoCRM lead ID loading works, and the CRM context preview loads
  that lead's real notes/tags/tasks — this is exactly TASK-P's own mandatory
  manual test (`Doc/10`'s TASK-P validation rule), previously only performed
  unattended without it. The same session confirmed the AI extraction path
  now generates suggestions successfully with no fallback, for both a short
  vague note ("send overview soon") and a richer security-focused note that
  produced relevant note/tag/task-shaped suggested actions — confirming the
  `nextSteps[].dueDate` null-normalization fix above actually resolved the
  reported production fallback bug in the live app, not just in unit tests.
  General regression checks for Ask and the global-shortcut overlay also
  passed. **This session did not approve or apply any suggested action, and
  did not confirm any write in the amoCRM UI.** TASK-Q's own mandatory
  manual test (approve + Apply a note/task/tag action against a real test
  lead, confirm each write appears exactly once in the amoCRM web UI, and
  confirm a repeated Apply is refused as a duplicate) is unchanged and is
  still the sole remaining blocker before TASK-Q can be marked `done` — see
  `Doc/10-crm-assistant-task-queue.md`'s TASK-P/TASK-Q entries and
  `Doc/12-claude-night-handoff.md` for the full detail. No code was changed
  in this verification session; only `CLAUDE.md`,
  `Doc/10-crm-assistant-task-queue.md`, `Doc/12-claude-night-handoff.md`, and
  `Doc/22-crm-phase7-context-pack.md` (a stale "TASK-P through TASK-R remain
  pending" status line, corrected for accuracy) were updated.
- **Human verification session, 2026-07-09, continued (closes TASK-Q's
  mandatory manual test — PASSED):** continuing the same overall
  verification effort as the note directly above, a human approved and
  applied a suggested action against a real test amoCRM lead and confirmed:
  the first "Apply approved actions" click wrote successfully to the real
  amoCRM account; the created data is visible both directly in the amoCRM
  web UI and in the desktop app's own CRM context preview for that lead;
  repeating the same Apply did not create a duplicate note/task/tag in
  amoCRM; and the app correctly surfaced the repeated write as a
  skipped/duplicate result rather than a generic failure or a second
  identical record. This satisfies TASK-Q's own mandatory-manual-test
  validation rule in full (successful real write, visible result in both
  amoCRM and the app, safe duplicate-skip on repeat). **`TASK-Q` is now
  `done`.** No product code was changed in that verification session; only
  `CLAUDE.md`, `Doc/10-crm-assistant-task-queue.md`, and
  `Doc/12-claude-night-handoff.md` were updated.
- **TASK-R (2026-07-09, human verification closed 2026-07-10) — amoCRM error
  taxonomy + Phase 7 handoff (`done`):** replaced the
  single opaque amoCRM error string with an explicit, classified taxonomy
  surfaced across the CRM context preview and the apply/retry UI, so a manager
  sees *what to do next* — reconnect / retry later / check network / wait for a
  rate limit — instead of one generic red failure, and nothing spins
  indefinitely. Rust (`src-tauri/src/amocrm/oauth.rs`,
  `src-tauri/src/amocrm/client.rs`): a shared `AmoCrmErrorKind`
  (`not_connected | reconnect_required | rate_limited | offline | api_error |
  unknown`, serialized snake_case to match the frontend union) plus
  `AmoCrmError { kind, message }`. Two pure classifiers —
  `classify_token_endpoint_status` (token endpoint 400/401 → reconnect, 429 →
  rate-limited, else → api_error) and `classify_request_failure` (REST 401
  after a forced refresh → reconnect, 429 → rate-limited, 5xx → api_error, a
  network send failure → offline). `amocrm_get_lead_context` now rejects with
  the classified `AmoCrmError`; `amocrm_apply_action`'s outcome carries an
  optional `errorKind` (`#[serde(skip_serializing_if = "Option::is_none")]` so
  a success/duplicate omits it entirely — keeping the exact applied-outcome
  shape `liveCrmProvider.test.ts` pins). Important behavior fix in
  `AmoCrmManager::access_token`: a **transient** refresh failure (offline /
  amoCRM 5xx / rate limit) no longer wipes the stored credentials — only a
  genuine 400/401 auth rejection (revoked/expired refresh token) or a
  post-rotation persist failure forces the `reconnect_required` state.
  Previously any refresh error logged the user out, so a brief network blip
  during a token refresh wrongly required a full re-auth. Frontend
  (`crm-assistant/integration/types.ts`): a mirrored `CrmErrorKind`/`CrmError`,
  a non-throwing `toCrmError` normalizer, per-kind label/hint/banner-tone/
  pill-tone maps, `isRetryableCrmErrorKind`, and `dominantCrmErrorKind` (picks
  the most-actionable kind across a mixed batch). `CrmApplyOutcome` gained an
  optional `errorKind` that flows through `runApplyPipeline`'s `{ ...outcome }`
  spread untouched, so `applyPipeline.ts` (out of scope) needed no change.
  `history/CrmContextPreview.tsx` renders a classified error block (pill +
  amoCRM message + "what to do next" hint + Try again); `CrmAssistantView.tsx`
  adds a batch-level taxonomy banner above the approval board (from a thrown
  pipeline error or the dominant resolved `errorKind`), marks rows retryable
  only when a retry can succeed (no dead Retry on `reconnect_required`), and —
  when live mode is requested but amoCRM is `disconnected`/`error` — shows an
  honest Not-connected / Reconnect-required preview instead of a silent empty
  sandbox with a misleading message. `liveCrmProvider.ts`/`global.d.ts` carry
  `errorKind`. `ActionRow.tsx`/`WriteResultPanel.tsx` were in the allowed set
  but deliberately not edited: `CrmWriteResult` (in the non-editable
  `crm-assistant/types.ts`) can't carry `errorKind` and `ApprovalBoard.tsx`
  (non-editable) doesn't forward a new prop, so a connection-level kind can't
  reach a per-row control — and connection errors are batch-level by nature, so
  the taxonomy banner lives in `CrmAssistantView.tsx` while per-row rows keep
  their existing Failed/Skipped/duplicate rendering. Docs: added the "Live
  amoCRM (TASK-R)" section to `Doc/20-crm-pilot-readiness-checklist.md` and
  created `Doc/23-crm-phase7-final-handoff.md`. Validation (all clean): `npm run
  typecheck`; `npm run test` (199 passed, unchanged); `npm run web:build`;
  `cargo test --manifest-path src-tauri/Cargo.toml` (90 passed, 1 pre-existing
  ignored — 9 new classifier/serialization tests in `amocrm::oauth`/
  `amocrm::client`); `git diff --check`. A human then walked the full manual
  checklist on 2026-07-10 and confirmed revoke-and-reconnect, offline vs.
  reconnect, token-expiry refresh, rate-limit behavior, and safe duplicate-skip
  against a real test amoCRM account, closing TASK-R. Note:
  `src/renderer/src/App.tsx` carries a pre-existing, unrelated uncommitted
  change (Coming-Soon "Conversation Scripts" / "Autonomous Agent" views) that
  is NOT part of TASK-R and was not touched.

## Release And Packaging Gaps

- `.github/workflows/release.yml`, `electron-builder.yml`, and `build/` are
  old Electron-era release artifacts. Do not extend them for Tauri.
- Tauri packaging/CI is still needed.
- Production `APP_SECRET` distribution for installed builds is still unresolved.
- Code signing is needed before macOS Accessibility grants can persist reliably
  across rebuilds.

## Documentation Rules

- Keep `README.md` as the short contributor/user runbook.
- Keep this file as the detailed agent context.
- Do not recreate `PROJECT_STATE.md`, `TECHNICAL_OVERVIEW_RU.md`, or other broad
  parallel snapshots unless the user explicitly asks. They drifted before.
- When code changes public behavior, update `README.md` and this file in the same
  branch.
- If a plan is not implemented, label it clearly as planned or unfinished.

<!-- claude-night-runner:start -->
## Claude Night Runner Status

- Last update: 2026-07-10T00:00:00Z
- Last task: TASK-R (amoCRM error taxonomy + Phase 7 final handoff) — done, including the human manual checklist pass
- Last status: done (a human walked the "Live amoCRM (TASK-R)" checklist end to end against a real test amoCRM account and confirmed reconnect/offline/rate-limit/dedup behavior)
- Next task: none active. Phase 7 is complete. `TASK-S` ("CRM-aware Quick Ask for the active amoCRM lead") remains proposal-only and still requires its own fresh human scoping session before it starts — Phase 7 tasks are never auto-inferred.
- Last log: see this task's session log
- Validation: npm run typecheck; cargo test --manifest-path src-tauri/Cargo.toml (90 passed, 1 ignored); npm run test (199 passed); npm run web:build; git diff --check — all clean
- Files changed since task start (TASK-R):
  - src-tauri/src/amocrm/oauth.rs
  - src-tauri/src/amocrm/client.rs
  - src/renderer/src/crm-assistant/CrmAssistantView.tsx
  - src/renderer/src/crm-assistant/history/CrmContextPreview.tsx
  - src/renderer/src/crm-assistant/integration/types.ts
  - src/renderer/src/crm-assistant/integration/liveCrmProvider.ts
  - src/renderer/src/global.d.ts
  - CLAUDE.md
  - Doc/10-crm-assistant-task-queue.md
  - Doc/12-claude-night-handoff.md
  - Doc/20-crm-pilot-readiness-checklist.md
  - Doc/22-crm-phase7-context-pack.md
  - Doc/23-crm-phase7-final-handoff.md (new)
- Pre-existing, NOT part of TASK-R (do not attribute to this task or commit as such): `src/renderer/src/App.tsx` (Coming-Soon "Conversation Scripts" / "Autonomous Agent" views) and `src/renderer/src/i18n.tsx` were already modified/untracked in the working tree before this session and were not touched by TASK-R.

Protected files remain out of scope for the active CRM runner phase unless a future task explicitly allows them: overlay UI, hotkey/AppKit/NSPanel lifecycle, document RAG, answer SSE, proxy /generate, DB schema, dependencies, and CI/release config.
<!-- claude-night-runner:end -->
