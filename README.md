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

## Project structure

- `app/page.tsx` - main landing page.
- `app/components/ProductMockup.tsx` - animated product demo in the hero.
- `lib/strings.ts` - English and Russian landing copy.
- `app/globals.css` - global Tailwind styles and animation keyframes.

The old standalone `index.html` prototype was removed. The Next.js app is now the single source of truth.
