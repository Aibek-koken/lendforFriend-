# LiveAssist AI landing

Next.js landing page for LiveAssist AI, a private desktop overlay that gives customer-facing teams source-backed answers from company documents during live calls.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Signup and Google authentication

1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from the Supabase project API settings.
3. Run `supabase/signup.sql` in the Supabase SQL editor.
4. In Supabase Auth, enable Google and add the Google OAuth client ID and secret.
5. Add these application redirect URLs to the Supabase URL configuration:
   - local: `http://localhost:3000/auth/callback`
   - production: `https://<your-production-domain>/auth/callback`
6. In Google Cloud Console, use Supabase's provider callback as the authorized redirect URI:
   - `https://<project-ref>.supabase.co/auth/v1/callback`
7. Run `npm run dev` and open `http://localhost:3000/signup`.

The signup uses Supabase SSR cookies and Row Level Security. It does not expose a service-role key to the browser. If the public Supabase variables are absent, the project still builds; development shows a clear unconfigured-auth message instead of creating a fake session.

### Signup database

`supabase/signup.sql` creates profiles, companies, owner/member relationships, CRM connection state, isolated demo records, RLS policies, and idempotent transactional RPCs for real and demo workspace creation. Apply it after `supabase/waitlist.sql` if the waitlist is also used.

The real-company flow stores supported CRM choices as `pending`. It does not claim a CRM is connected until a later, real OAuth integration confirms it.

Signup and account setup stay on the website. The desktop app only consumes the
resulting desktop session and manages that session locally from its own
Settings/Profile surface.

### Signup analytics

PostHog receives the Supabase user id as the anonymous-safe distinct id after authentication. The only signup product events are:

- `signup_completed` — once when a workspace and owner membership are created;
- `demo_started` — once when a demo workspace is created;
- `crm_connected` — emitted by `POST /api/desktop` only when the caller's own
  `crm_connections` row genuinely transitions to `connected` (a real
  pending/failed → connected database change). Idempotent retries and
  already-connected calls never re-emit it, and it is never emitted for
  `pending`.

Do not add email, company names, OAuth tokens, CRM account names, documents, leads, call notes, questions, or answers to analytics properties.

## Account & CRM setup (web-first)

Status: **implemented, no manual QA yet.**

Signup, workspace setup, account management **and CRM setup** live here, not in
the desktop app. The desktop shows a status card and links back to these pages.

- `/account` — workspace, CRM status, sign out, download link.
- `/account/integrations` — the amoCRM setup guide plus the credential form
  (subdomain, region, client ID, client secret).

### Setup

1. Run `supabase/crm-connect.sql` in the SQL editor, after `supabase/signup.sql`.
2. Set `CRM_SECRETS_ENCRYPTION_KEY` (`openssl rand -base64 32`) and
   `NEXT_PUBLIC_SITE_URL`. See `.env.example`.
3. In the customer's amoCRM integration, set the Redirect URI to
   `{NEXT_PUBLIC_SITE_URL}/api/crm/amocrm/callback` — the page shows the exact
   string with a copy button, and amoCRM compares it byte-for-byte.

### Where the secrets live

Two tables, two trust levels:

| | `crm_connections` | `crm_connection_secrets` |
|---|---|---|
| holds | provider, status, subdomain, domain zone, client id, account id, connected_at, last error | client secret, access token, refresh token |
| RLS | company members can read | **on, with no policy** — grants revoked |
| readable by | the web account page, and the desktop over `GET /api/desktop` | the service-role key only, from server-side routes |
| at rest | plaintext (none of it is secret) | AES-256-GCM (`lib/crm/crypto.ts`) |

Nothing secret goes into localStorage, renderer state, a URL query param, the
desktop app, or a log line. `GET /api/desktop` has no code path to the secrets
table, so a compromised desktop session cannot yield a token.

`GET /api/crm/amocrm/callback` is the only place an authorization code is
exchanged. It consumes an httpOnly `state` cookie and compares it in constant
time **before any network call** — without that, a crafted callback URL could
bind an attacker's amoCRM account to a victim's workspace.

Only a **400/401 from amoCRM's token endpoint** marks a connection `failed`. A
429, a 5xx, or an unreachable amoCRM is transient: flipping the row would send
the customer to re-enter credentials that were never wrong.

## Desktop handoff (Stage 2)

Status: **implemented, not yet verified at runtime.** Web-side automated checks pass (`npm run typecheck`, `npm run test`, `npm run build`), but the end-to-end deep link into the Tauri app has not been exercised by a human. Do not describe desktop sign-in as shipped until the manual QA below passes.

### Setup

Run `supabase/desktop-auth.sql` in the Supabase SQL editor, after `supabase/signup.sql`. The exchange route needs `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (already used by the waitlist) — no new secret.

### How it works

1. The desktop app generates a random nonce and opens `/signup?desktop_state=<nonce>` in the system browser.
2. The user signs in with Google. The nonce rides through the OAuth round trip on our own `desktop_state` param — never OAuth's `state`, which Supabase owns.
3. On the final screen, **Open LiveAssist** calls the `issueDesktopHandoff` server action, which mints a one-time code, stores `sha256(code)` and `sha256(nonce)` in `desktop_auth_codes`, and returns the deep link `liveassist://auth/callback?code=…&state=…`.
4. The desktop app POSTs `{ code, state }` to `POST /api/desktop/auth/exchange`, which atomically consumes the code (service-role) and returns the profile/workspace snapshot plus an opaque desktop session token.

### Desktop CRM status reconciliation (`POST /api/desktop`)

The desktop app reconciles its LOCAL amoCRM connection state (the OS-keychain
truth) to the workspace's `crm_connections.status` with a bearer desktop
session token and an optional JSON body `{ provider: "amocrm", status:
"connected" | "pending" | "failed" }` (a body-less POST means
amocrm/connected, preserving the original completion contract). Transitions
are authorized by the pure `decideCrmStatusTransition`
(`lib/signup/crmCompletion.ts`): only the caller-owned company's amoCRM row
can move, identity transitions are idempotent, and `demo`/`unsupported` rows
are never desktop-writable. No amoCRM token or integration secret ever
reaches this endpoint — it carries only a status word.

### Security properties

- The deep link carries **only** `code` and `state`. No Supabase `access_token` or `refresh_token` ever reaches it.
- Only sha256 digests of the code, the nonce, and the session token are stored. A database leak yields nothing usable.
- Codes expire after 5 minutes (`AUTH_CODE_TTL_SECONDS`) and are strictly single-use — consumption is one atomic `UPDATE … WHERE consumed_at IS NULL AND expires_at > now()`, so two concurrent exchanges cannot both win.
- The code is bound to the desktop's nonce. A crafted `liveassist://` link cannot sign someone's app into an attacker's workspace: the server checks the nonce hash, and the desktop independently refuses any callback it did not itself start.
- Every rejection (expired / consumed / unknown / state mismatch) returns the same opaque `invalid_code`, so the endpoint cannot be probed.
- The code, state, and session token are never logged. `lib/desktop-auth/secrets.ts` (node:crypto) is server-only; client components import `lib/desktop-auth/handoff.ts`, which is crypto-free by construction and covered by a test.
- The service-role key stays server-side, in the route handler only.

### Known boundaries

- **Desktop-initiated only.** A signup started in a browser (no `desktop_state`) shows "Finish in the desktop app" instead of a handoff button, because there is no nonce to bind a code to. Pressing **Sign in to start** in the app is the supported path.
- **Session revocation is not enforced yet.** `desktop_sessions` stores the token hash so revocation is *possible*, but the desktop trusts its locally stored session until expiry and does not re-validate on launch. A `GET /api/desktop/auth/session` check is the next step.
- **No rate limit on the exchange route.** Codes are 256-bit and single-use, so brute force is not a practical threat, but a per-IP limit is still worth adding before wide release.

### Manual QA (Stage 2)

- [ ] Fresh desktop state → **Sign in to start** → the browser opens `/signup?desktop_state=…`.
- [ ] Google login → final screen shows **Open LiveAssist** (not the "Finish in the desktop app" card).
- [ ] **Open LiveAssist** → the desktop app comes to the front and becomes authenticated.
- [ ] Re-opening the *same* deep link is rejected as already used (replay).
- [ ] Waiting out the 5-minute TTL, then pressing **Open LiveAssist** from a stale tab, is rejected as expired.
- [ ] Visiting `/signup` directly (no `desktop_state`) shows the "Finish in the desktop app" card and no deep-link button.
- [ ] Inspect the browser network tab and server logs: no `code`, `state`, or session token appears in any log line.

## Manual signup QA checklist

- [ ] New user → Google → demo; refresh the final screen and confirm no second workspace is created.
- [ ] New user → Google → real company; confirm CRM remains `pending` or `unsupported`, never fake-connected.
- [ ] Cancel Google OAuth and retry from `/signup`.
- [ ] Simulate a Google OAuth error and confirm the calm inline retry state.
- [ ] Sign in again and confirm `/signup` resumes the company step or opens the final screen.
- [ ] Refresh auth, mode, company, and complete steps.
- [ ] Check 375 px, 768 px, and 1280 px layouts plus keyboard focus order.
- [ ] Check all primary screens in Russian and English.
- [ ] In Supabase, test RLS as two users: neither user can read or join the other's company or demo rows.
- [ ] In PostHog, confirm signup emits only `signup_completed`, `demo_started`, and a future confirmed `crm_connected`; inspect payloads for prohibited data.

## Production build

```bash
npm run build
```

## Waitlist -> Supabase

1. Copy `.env.example` to `.env.local` and fill in `SUPABASE_URL` plus `SUPABASE_SERVICE_ROLE_KEY`.
2. Run the SQL from `supabase/waitlist.sql` in your Supabase SQL editor.
3. The landing page form posts to `POST /api/waitlist`, and the server stores signups in `waitlist_signups`.

Use the project URL format `https://<project-ref>.supabase.co`, not the `/rest/v1` endpoint.

`SUPABASE_SERVICE_ROLE_KEY` is only used on the server inside the route handler. Do not expose it in client-side code.

## Anonymous analytics

Set `POSTHOG_API_KEY` and `POSTHOG_HOST` in `.env.local` to enable basic funnel analytics.

Tracked landing events:

- `landing_viewed`
- `download_clicked`
- `download_redirected`

The landing page stores a random browser id in `localStorage` only to connect landing and download events. It does not send emails, document content, filenames, questions, answers, or other private product data.

## Project structure

- `app/page.tsx` - main landing page.
- `app/signup` - Google authentication and workspace onboarding flow.
- `lib/supabase` - Supabase browser/server/middleware clients.
- `supabase/signup.sql` - signup schema, RLS, demo seed data, and transactional RPCs.
- `app/api/download/[platform]/route.ts` - tracked download redirects.
- `lib/analytics.ts` - server-side analytics capture helper.
- `app/components/ProductMockup.tsx` - animated product demo in the hero.
- `lib/strings.ts` - English and Russian landing copy.
- `app/globals.css` - global Tailwind styles and animation keyframes.

The old standalone `index.html` prototype was removed. The Next.js app is now the single source of truth.
