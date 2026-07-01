# LiveAssist AI landing

Next.js landing page for LiveAssist AI, a private desktop overlay that gives customer-facing teams source-backed answers from company documents during live calls.

## Development

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

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
- `app/api/download/[platform]/route.ts` - tracked download redirects.
- `lib/analytics.ts` - server-side analytics capture helper.
- `app/components/ProductMockup.tsx` - animated product demo in the hero.
- `lib/strings.ts` - English and Russian landing copy.
- `app/globals.css` - global Tailwind styles and animation keyframes.

The old standalone `index.html` prototype was removed. The Next.js app is now the single source of truth.
