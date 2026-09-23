# Fieldpiece WMS: Frontend

Web app for the Fieldpiece Warranty Management System. Built to
[FIELDPIECE_WARRANTY_FRONTEND_INSTRUCTIONS.md](FIELDPIECE_WARRANTY_FRONTEND_INSTRUCTIONS.md) (the "build guide"). Read it before changing anything.

**Stack:** React 18, TypeScript (strict), Vite 5, Tailwind CSS 3.4, Radix UI, TanStack Query/Table, React Router 6,
Zustand, react-hook-form + zod, Recharts, i18next, MSW, Vitest, Playwright.

## Getting started

```bash
cd frontend
npm install
npm run dev:mock     # runs against MSW mocks, no backend needed -> http://localhost:5173
```

In mock mode the sign-in screen has a **Sign in as** picker, so you can try every role. Any email and password work.
Useful mock serials: `SC680-100037` (registered), `ZZZ-999999` (not found), `RATELIMIT` (429 response).

To run against a real API, copy `.env.example` to `.env.local`, set `VITE_API_BASE_URL`, and run `npm run dev`.

## Scripts

| Script                       | What it does                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| `npm run dev` / `dev:mock`   | Dev server (real API / MSW mocks)                                                              |
| `npm run build`              | Type-check and production build                                                                |
| `npm run typecheck`          | `tsc -b` only                                                                                  |
| `npm run lint`               | ESLint, zero warnings allowed                                                                  |
| `npm run format`             | Prettier (sorts Tailwind classes)                                                              |
| `npm test` / `test:coverage` | Vitest unit + component tests (coverage gates on transitions, warranty maths, formatters)      |
| `npm run e2e`                | Playwright at 1440px and 375px with an axe scan (first run: `npx playwright install chromium`) |

Husky runs lint-staged on commit and checks commit messages against Conventional Commits
(`feat(claims): add reject modal`). The existing `WMS-123: ...` ticket style is also accepted.

## Layout

```
src/
├── app/            providers, router (route table = Section 6.2), RequireRole, layouts
├── components/
│   ├── ui/         design-system primitives (Button, FormField, SerialNumberInput, DataTable, Modal, ...)
│   ├── layout/     AppShell, TopBar, AppHeader, Sidebar, PageHeader, AuthLayout, ScaffoldPage
│   └── feedback/   EmptyState, ErrorState, Skeleton, Toast
├── features/<name>/ api.ts · hooks.ts · schemas.ts · types.ts · components/ · pages/
├── lib/            http (axios), query client, session, permissions, warranty maths, formatters, i18n
├── mocks/          MSW handlers + fixtures for every endpoint
├── locales/        en / es / fr strings
├── styles/         tokens.css (the ONLY place hex values live), globals.css
└── types/          shared domain + API types (Section 7)
```

## Rules the tooling enforces

- **No raw hex colours** in TS/TSX. Use tokens (`bg-brand-500`). ESLint fails the build otherwise.
- **Features don't import each other's internals** (`@/features/x/...` is blocked inside `features/`). Shared code
  goes in `components/`, `lib/` or `types/`.
- **No default exports**, except route pages. **No `any`.**
- **Claim actions come only from `features/claims/transitions.ts`.** Don't hard-code status checks in components.
- **Tokens stay in memory.** Never put an access token in `localStorage`.
- **UI hiding isn't security.** `lib/permissions.ts` and `RequireRole` only decide what to show; the API enforces access.

## Build status

| Area                                                                                                   | State                                                               |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Shell, nav, theming, i18n, auth session + refresh, error mapping, toasts                               | Done                                                                |
| Design-system primitives (Section 5)                                                                   | Done                                                                |
| Public warranty check (8.1)                                                                            | Done                                                                |
| Claims list, claim detail with state-machine actions, approve/reject modals, timeline + internal notes | Done                                                                |
| Register product (8.3), file claim (8.4)                                                               | Working flows; uploads, SKU picker images and address step are TODO |
| Dashboard (8.2)                                                                                        | KPIs + status chart; role-specific lists TODO                       |
| RMA detail, reports, customers, products detail, admin, bulk registration                              | Routed placeholders with the checklist from the build guide         |

Search the code for `TODO` and `[CONFIRM]` to find open work.

## Deviations from the build guide

1. **Status colours (Section 3.2).** Two pairs failed the mandatory WCAG AA check (Section 10) and were adjusted in
   `tokens.css`: `success-bg` #E6F4EA → #EDF7F0 (was 4.45:1), and `warning` #B87F12 → #8A5E0E (was 3.02:1 on its
   background). #B87F12 (`brand-700`) is also only 3.45:1 on white, so it **can't be used for body-size accent text**,
   despite what Section 3.2 says. Use `brand-800` or black instead. This needs client sign-off.
2. **`globals.css`** imports `tokens.css` before the `@tailwind` directives (PostCSS requires `@import` first).
3. **Opacity modifiers** such as `bg-ink-900/60` don't work on CSS-variable colours in Tailwind 3, so `scrim` and
   `tint` tokens were added for overlays.
4. **Logo.** `src/assets/brand/fieldpiece-logo-dev.png` is the PNG from fieldpiece.com, for development only. Dark
   mode inverts it until the official white SVG arrives.

## Open items for Fieldpiece

See Section 15 of the build guide. Items that block frontend work: identity provider (auth is mocked behind
`features/auth/api.ts`), serial formats per SKU (`lib/serial.ts`), warranty terms, out-of-warranty claims, replacement
warranty rule, Myriad Pro licence (Source Sans 3 is the fallback), and the languages to support (es/fr are stubs and
fall back to English).
