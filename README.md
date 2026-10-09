🇺🇸 [한국어](./README.ko.md)

# GigLedger (긱렛저) — Track gig income across platforms in one place

GigLedger is a mini app for App-in-Toss that records daily earnings from several gig platforms, such as delivery, driving, and logistics apps, and totals them in one dashboard. It also calculates the real hourly wage for each platform by subtracting expenses and dividing by hours worked. It is built for gig workers and multi-job earners in their 20s to 40s who work across several platforms and need to know this month's total and their effective hourly pay. All data stays on the device in `localStorage`; there is no server and no sign-up.

## Features

- 📝 **Daily income entries**: Record income, expenses, hours worked, and an optional memo (up to 50 characters) per platform. Entries can be edited and deleted.
- 🛵 **Platform management**: Add up to 20 platforms with a name, category, and color. The app starts with 배달, 대리운전, and 쿠팡플렉스.
- 📊 **Home dashboard**: Weekly or monthly net income, progress toward a monthly goal, a 14-day trend chart, and each platform's share of income.
- ⏱️ **Real hourly wage**: Effective hourly pay per platform and an overall average, shown on the Wage tab.
- 🔥 **Streaks**: Current and best consecutive days with at least one entry.
- 📄 **Monthly report**: Per-month breakdown for the last 12 months. Unlocked by watching a rewarded ad.
- 🖼️ **Share**: Copy a text summary to the clipboard, or save a PNG summary card.
- ⚙️ **Settings**: Set a monthly income goal, clear all records, and see the local-storage notice.
- 📢 **Ads**: Banner ads on the Home and Wage screens, rendered through the App-in-Toss SDK.

## Tech Stack

- **Framework**: React 18, TypeScript, Vite 6
- **Routing**: React Router 7 (`react-router-dom`, `BrowserRouter`)
- **UI**: Toss Design System (`@toss/tds-mobile`, `@toss/tds-mobile-ait`), Emotion (`@emotion/react`, `@emotion/styled`); charts are hand-written inline SVG
- **Platform SDK**: `@apps-in-toss/web-framework` (ads, haptics, clipboard, and related APIs)
- **Data**: Browser `localStorage` only (no database, no backend, no login)
- **Testing**: Vitest with jsdom and Testing Library; Playwright for visual smoke tests

## Getting Started

Requirements: Node.js and npm. The project uses npm (`package-lock.json`).

```bash
# Install dependencies
npm install

# Production bundle (output in dist/)
npx vite build

# Type check and unit tests
npx tsc --noEmit
npx vitest run
```

`npm run build` runs `vite build` followed by a check that the dev-only TDS gallery is not in the output.

## Environment Variables

Set these in a `.env` or `.env.local` file at the project root, or in the build environment.

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_TOSS_AD_GROUP_ID` | Ad group ID from the App-in-Toss console, used for the banner and reward ad slots. If it is missing, ad slots render empty. | Yes, for ads |

The app does not read any other environment variables. The IAP component (`src/components/TossPurchase.tsx`) is not used by any screen.

## Project Structure

```
src/
├── App.tsx         # Route table
├── main.tsx        # Entry point (providers and BrowserRouter)
├── pages/          # Screens: Home, Entry, Platforms, Wage, Report, Share, Settings
├── components/     # Reusable TDS-based UI (ScreenScaffold, Card, SummaryHero, FloatingTabBar, ...)
├── hooks/          # State hooks (useLedger, useAppToast, useOnboardingNotice)
├── lib/            # Pure logic: calc, format, date, validate, storage, constants, types
├── styles/         # Global and ad-related CSS
└── __tests__/      # Vitest suites
e2e/                # Playwright visual smoke tests and screenshots
scripts/            # Build and project checks
.ai-factory/        # Product and design documents (PRD, SPEC, task list)
```

## Deployment

Apps-in-Toss hosts the built bundle on the Toss CDN. Only static builds are supported; server-side rendering is not.

1. Confirm that `appName` in `apps-in-toss.config.ts` matches the app name registered in the Apps-in-Toss console, including case. A mismatch causes a deploy error (4031). `package.json`'s `name` should stay the same.
2. Build the Toss bundle:
   ```bash
   npx ait build
   ```
3. Upload the `.ait` bundle through the Apps-in-Toss developer console and submit it for review. Apps must pass the review checklist, which covers:
   - Users must be 19 or older. The app has no minor-targeted content.
   - No navigation to external domains, and no pages that prompt installation of other apps.
   - No console errors and no CORS errors.
   - Android 7+ and iOS 16+ compatibility.

## License

MIT
