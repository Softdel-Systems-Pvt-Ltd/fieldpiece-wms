# Fieldpiece Warranty Management System: Frontend Build Instructions

**Audience:** Frontend developers (and AI coding assistants) working on the Warranty Management System (WMS) web app
**Stack:** React 18, TypeScript, Vite, Tailwind CSS
**Status:** v1.0, working draft

> **Before you start, read this.** The brand values in Section 3 come from what fieldpiece.com uses today (its live CSS, captured September 2026). They are **not** an official Fieldpiece style guide. The official logo files and guidelines are behind the Fieldpiece Distributor Portal. Get sign-off from the client on colors, logo files and fonts before anything goes to production. Wherever this doc says **[CONFIRM]**, the client still has to verify it.

---

## 1. What we are building

A web app that handles the full life of a Fieldpiece product warranty:

1. **Register** a product: serial number, purchase date, proof of purchase.
2. **Look up** a unit's warranty status by serial number.
3. **File a claim** when a unit fails, and attach evidence.
4. **Review and decide** the claim (approve, reject, ask for more info).
5. **Fulfil** it through an RMA: repair, replacement or credit, with shipment tracking.
6. **Report** on claim volume, failure trends, turnaround time and cost.

### 1.1 User roles

| Role | Who | What they can do |
|---|---|---|
| `technician` | HVACR tech / end customer | Register products, check warranty, file and track their own claims |
| `distributor` | Fieldpiece distributor / dealer | Everything a technician can, for all of their customers, plus bulk registration |
| `claims_agent` | Fieldpiece support staff | Review claims, request info, approve or reject, create RMAs |
| `service_center` | Repair / returns team | Receive RMAs, log inspection results, mark as repaired, replaced or scrapped |
| `admin` | Fieldpiece admin | Manage products, warranty policies, users, roles, settings |

The frontend hides whatever a user can't access. The API still has to enforce every permission. **Never rely on UI hiding for security.**

---

## 2. Tech stack and project setup

### 2.1 Libraries

| Concern | Choice | Why |
|---|---|---|
| Build | Vite 5 | Fast dev server, simple config |
| UI | React 18 + TypeScript (strict) | Team standard |
| Styling | Tailwind CSS 3.4 + CSS variables | Tokens live in one place |
| Headless components | Radix UI primitives | Accessible dialogs, menus, tabs, tooltips |
| Icons | lucide-react | Clean line icons that sit well next to Myriad Pro |
| Routing | React Router 6 (data routers) | Nested layouts, loaders |
| Server state | TanStack Query 5 | Caching, retries, background refresh |
| Client state | Zustand | Auth session, UI prefs only |
| Forms | react-hook-form + zod | Typed schemas shared with API types |
| Tables | TanStack Table 8 | Sorting, filtering, pagination on the server side |
| Charts | Recharts | Reporting dashboard |
| Dates | date-fns | Warranty-period maths |
| File upload | react-dropzone | Proof of purchase, failure photos |
| HTTP | axios (one shared instance) | Interceptors for auth and errors |
| Testing | Vitest, React Testing Library, Playwright, MSW | Unit, component, e2e, API mocks |
| Quality | ESLint, Prettier, Husky + lint-staged | Enforced on commit |

### 2.2 Bootstrap

```bash
npm create vite@latest fieldpiece-wms -- --template react-ts
cd fieldpiece-wms
npm i react-router-dom @tanstack/react-query @tanstack/react-table zustand axios \
      react-hook-form zod @hookform/resolvers date-fns recharts react-dropzone \
      lucide-react clsx tailwind-merge class-variance-authority \
      @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs \
      @radix-ui/react-tooltip @radix-ui/react-select @radix-ui/react-toast
npm i -D tailwindcss postcss autoprefixer @tailwindcss/forms \
      vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event \
      msw @playwright/test eslint prettier prettier-plugin-tailwindcss husky lint-staged
npx tailwindcss init -p
```

### 2.3 Folder structure

```
src/
├── app/                  # App shell, providers, router
│   ├── App.tsx
│   ├── providers.tsx     # QueryClient, Theme, Toast
│   └── router.tsx
├── assets/
│   ├── brand/            # logo files (see 3.1), favicon
│   └── fonts/            # licensed Myriad Pro files (not committed if the licence forbids it)
├── components/
│   ├── ui/               # Design-system primitives: Button, Input, Badge, Card, Table…
│   ├── layout/           # AppHeader, Sidebar, PageHeader, AuthLayout
│   └── feedback/         # EmptyState, ErrorState, Skeleton, Toast
├── features/             # One folder per domain module
│   ├── auth/
│   ├── dashboard/
│   ├── products/
│   ├── registrations/
│   ├── warranty-lookup/
│   ├── claims/
│   ├── rma/
│   ├── customers/
│   ├── reports/
│   └── admin/
│       └── (each feature has) api.ts · hooks.ts · schemas.ts · types.ts · components/ · pages/
├── lib/                  # axios instance, queryClient, formatters, permissions helper
├── styles/
│   ├── tokens.css        # CSS variables (Section 3)
│   └── globals.css
└── types/                # Shared domain types (Section 7)
```

Rule: a feature can import from `components/`, `lib/` and `types/`, but **never from another feature's internals**. If two features need the same thing, move it into shared code.

---

## 3. Brand and design system

### 3.1 Logo

- **Type:** a bold, italic "Fieldpiece" wordmark in black. There is no separate symbol or icon.
- **Default placement:** black wordmark on the brand yellow header bar (this is how fieldpiece.com shows it).
- **Available file:** `https://resources.fieldpiece.com/wp-content/uploads/2020/09/logo.png` (PNG, 306×54). Use it for local development only. **[CONFIRM]** Ask the client for SVG files in these versions: black, white and single-colour.
- **Rules:**
  - Minimum width is 120 px on screen.
  - Clear space on every side should be at least the height of the "F".
  - Only put it on yellow (#F8BC35), white, or black / very dark grey. For dark backgrounds use the white version.
  - Don't stretch, recolour, outline, add shadows or rotate it. Don't put it on busy photos without a solid panel behind it.
  - Add alt text: `alt="Fieldpiece"`. Wrap it in a link to `/` in the app header.
- **Product name lockup:** show the wordmark, a thin 1px divider, then "Warranty" set in Myriad Pro Regular. Example: **Fieldpiece** | Warranty. **[CONFIRM]** the client may prefer a different sub-brand name.

### 3.2 Colour palette

Values measured from the site:

| Token | Hex | Where the site uses it |
|---|---|---|
| Brand yellow | `#F8BC35` | Header bar, headings on dark backgrounds, CTA buttons |
| Black | `#000000` | Wordmark, body text |
| Near-black | `#12130D` | Top bar, dark sections |
| Charcoal | `#292A28` | Secondary dark panels |
| Graphite | `#3E3E3E` | Borders on dark backgrounds |
| Grey 300 | `#C1C1C0` | Muted text on dark backgrounds |
| Grey 100 | `#E8E8E9` | Light panels |
| Accent blue | `#38B6FF` | Links on dark backgrounds |
| Deep blue | `#17318C` | Image overlays (at 70% opacity) |

#### Extended scales for the app

The site doesn't have enough shades for a data-heavy app, so we build scales around the brand colours:

| Step | `brand` (yellow) | `ink` (neutral) |
|---|---|---|
| 50 | `#FEF8EB` | `#F7F7F7` |
| 100 | `#FDEFC9` | `#E8E8E9` |
| 200 | `#FBE093` | `#D4D4D3` |
| 300 | `#FACE5E` | `#C1C1C0` |
| 400 | `#F9C548` | `#8E8E8C` |
| **500** | **`#F8BC35`** (primary) | `#5E5E5C` |
| 600 | `#E0A21F` (hover) | `#3E3E3E` |
| 700 | `#B87F12` (pressed / text on light) | `#292A28` |
| 800 | `#8A5E0E` | `#1C1D19` |
| 900 | `#5C3F0A` | `#12130D` |

#### Status colours (claim and warranty states)

The site doesn't define any of these, so we added them. They're picked to pass WCAG AA on white. **[CONFIRM]**

| Token | Hex | Used for |
|---|---|---|
| `success` | `#1E7F3C` | Active warranty, approved, repaired |
| `warning` | `#B87F12` (text) on `#FDEFC9` (bg) | Expiring soon, needs info |
| `danger` | `#C62828` | Expired, rejected, overdue SLA |
| `info` | `#17318C` | Submitted, in review, in transit |
| `neutral` | `#5E5E5C` | Draft, closed, void |

#### Contrast rules (these are required)

- **Never put yellow text on white or light backgrounds.** #F8BC35 on white is about 1.7:1, which fails. On light backgrounds, use `brand-700` (#B87F12) for accent text, or better, black text with a yellow underline or background.
- Black text on #F8BC35 is about 12:1, which passes. **Primary buttons always use black text on yellow.**
- Yellow text on near-black (#12130D) passes. This is how the site does headings on dark backgrounds.
- #38B6FF only works as a link colour on dark backgrounds. On white, use `info` (#17318C).
- Status is never shown by colour alone. Always pair it with a label and, where useful, an icon.

### 3.3 Typography

| Use | Family | Weight | Size / line height |
|---|---|---|---|
| Display (login, empty states) | Myriad Pro Bold | 700 | 34 / 40 px (same as the site's H1) |
| H1 page title | Myriad Pro Bold | 700 | 28 / 34 |
| H2 section | Myriad Pro Bold | 700 | 22 / 28 |
| H3 card title | Myriad Pro Bold | 700 | 18 / 24 |
| Body | Myriad Pro Regular | 400 | 15 / 22 |
| Small / table | Myriad Pro Regular | 400 | 13 / 18 |
| Label / overline | Myriad Pro Semibold* | 600 | 12 / 16, uppercase, 0.04em tracking |
| Mono (serials, RMA #) | JetBrains Mono / ui-monospace | 500 | 13 / 18 |

*The site only loads Regular and Bold. If Semibold isn't licensed, use Bold at 12 px.

**Font licensing:** Myriad Pro is an Adobe commercial font, and the site loads it as the custom families `MyriadProRegular` and `MyriadProBold`. **[CONFIRM]** whether Softdel can use Fieldpiece's licence or has to host it through Adobe Fonts. Until that's settled, use the fallback stack below. **Source Sans 3** (free, Google Fonts) was designed by the same foundry and is the closest free match.

```css
--font-sans: "Myriad Pro", "MyriadProRegular", "Source Sans 3", "Segoe UI", system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
```

Serial numbers, claim IDs and RMA numbers are always shown in the mono font, so characters like `0/O` and `1/I` can't be confused.

### 3.4 Spacing, radius, elevation

- **Spacing:** 4 px base, using Tailwind's default scale. Page gutter is 24 px on desktop and 16 px on mobile.
- **Radius:** the brand looks rugged and square-ish, so keep corners tight. `sm` 2px (badges), `DEFAULT` 4px (buttons, inputs), `lg` 8px (cards, modals). Don't use pill buttons.
- **Elevation:** use flat shadows. `shadow-card: 0 1px 2px rgba(18,19,13,.08), 0 1px 3px rgba(18,19,13,.06)`. Use `shadow-overlay` for modals and dropdowns only.
- **Borders:** `ink-100` on light surfaces, `ink-600` on dark surfaces.

### 3.5 Imagery and icons

- Product photos show yellow instruments in real job-site settings, usually on dark or neutral backgrounds. For product thumbnails, use a square frame with an `ink-50` background.
- Icons are lucide, 1.75px stroke, at 16 px (inline), 20 px (buttons and nav) or 24 px (empty states).
- Don't use cartoon illustrations. Empty states get an icon, a single line of explanation, and a primary action.

### 3.6 Voice and microcopy

Fieldpiece talks to technicians plainly: short, practical sentences that get to the point. Carry that into the UI.

- Buttons are verbs: "Register product", "File claim", "Approve", not "Submit" or "OK".
- Errors say what went wrong **and** how to fix it: "Serial number not found. Check the label on the back of the unit, or register it first."
- No jargon beyond HVACR terms the user already knows. Don't write "Oops!", don't use exclamation marks in errors, and don't use emoji.
- Dates in the UI are `23 Sep 2026`. In API payloads they are ISO 8601. Money uses the account's currency, formatted with `Intl.NumberFormat`.

---

## 4. Token implementation

### 4.1 `src/styles/tokens.css`

```css
:root {
  /* Brand */
  --brand-50:#FEF8EB; --brand-100:#FDEFC9; --brand-200:#FBE093; --brand-300:#FACE5E;
  --brand-400:#F9C548; --brand-500:#F8BC35; --brand-600:#E0A21F; --brand-700:#B87F12;
  --brand-800:#8A5E0E; --brand-900:#5C3F0A;

  /* Neutrals */
  --ink-0:#FFFFFF; --ink-50:#F7F7F7; --ink-100:#E8E8E9; --ink-200:#D4D4D3; --ink-300:#C1C1C0;
  --ink-400:#8E8E8C; --ink-500:#5E5E5C; --ink-600:#3E3E3E; --ink-700:#292A28;
  --ink-800:#1C1D19; --ink-900:#12130D; --ink-1000:#000000;

  /* Status */
  --success:#1E7F3C; --success-bg:#E6F4EA;
  --warning:#B87F12; --warning-bg:#FDEFC9;
  --danger:#C62828;  --danger-bg:#FDECEC;
  --info:#17318C;    --info-bg:#E8ECF8;
  --link-on-dark:#38B6FF;

  /* Semantic surface tokens (light) */
  --bg:var(--ink-50); --surface:var(--ink-0); --surface-raised:var(--ink-0);
  --text:var(--ink-1000); --text-muted:var(--ink-500); --border:var(--ink-100);
  --header-bg:var(--brand-500); --header-text:var(--ink-1000);
  --topbar-bg:var(--ink-900);

  --font-sans:"Myriad Pro","MyriadProRegular","Source Sans 3","Segoe UI",system-ui,sans-serif;
  --font-display:"Myriad Pro","MyriadProBold","Source Sans 3","Segoe UI",system-ui,sans-serif;
  --font-mono:"JetBrains Mono",ui-monospace,"SFMono-Regular",Menlo,monospace;
}

/* Dark mode: optional, for the service-center and warehouse screens */
[data-theme="dark"] {
  --bg:var(--ink-900); --surface:var(--ink-800); --surface-raised:var(--ink-700);
  --text:var(--ink-0); --text-muted:var(--ink-300); --border:var(--ink-600);
  --header-bg:var(--ink-900); --header-text:var(--brand-500);
}
```

### 4.2 `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const scale = (name: string, steps: (string | number)[]) =>
  Object.fromEntries(steps.map((s) => [s, `var(--${name}-${s})`]));

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: { ...scale("brand", [50,100,200,300,400,500,600,700,800,900]), DEFAULT: "var(--brand-500)" },
        ink: scale("ink", [0,50,100,200,300,400,500,600,700,800,900,1000]),
        success: { DEFAULT: "var(--success)", bg: "var(--success-bg)" },
        warning: { DEFAULT: "var(--warning)", bg: "var(--warning-bg)" },
        danger:  { DEFAULT: "var(--danger)",  bg: "var(--danger-bg)" },
        info:    { DEFAULT: "var(--info)",    bg: "var(--info-bg)" },
        bg: "var(--bg)", surface: "var(--surface)", border: "var(--border)",
        text: { DEFAULT: "var(--text)", muted: "var(--text-muted)" },
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        display: ["34px", { lineHeight: "40px", fontWeight: "700" }],
        h1: ["28px", { lineHeight: "34px", fontWeight: "700" }],
        h2: ["22px", { lineHeight: "28px", fontWeight: "700" }],
        h3: ["18px", { lineHeight: "24px", fontWeight: "700" }],
        body: ["15px", { lineHeight: "22px" }],
        sm: ["13px", { lineHeight: "18px" }],
        xs: ["12px", { lineHeight: "16px" }],
      },
      borderRadius: { sm: "2px", DEFAULT: "4px", lg: "8px" },
      boxShadow: {
        card: "0 1px 2px rgba(18,19,13,.08), 0 1px 3px rgba(18,19,13,.06)",
        overlay: "0 8px 24px rgba(18,19,13,.18)",
      },
      maxWidth: { content: "1440px" },
    },
  },
  plugins: [forms],
} satisfies Config;
```

### 4.3 `src/styles/globals.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
@import "./tokens.css";

@layer base {
  html { font-family: var(--font-sans); color: var(--text); background: var(--bg); }
  h1,h2,h3 { font-family: var(--font-display); }
  :focus-visible { outline: 2px solid var(--ink-1000); outline-offset: 2px; }
  [data-theme="dark"] :focus-visible { outline-color: var(--brand-500); }
}
```

Focus rings are black on light backgrounds and yellow on dark ones. **Don't use yellow focus rings on white**, because they're too faint to see.

---

## 5. Component specs

Build these in `src/components/ui/`. Use `class-variance-authority` for variants and a `cn()` helper (clsx + tailwind-merge).

### 5.1 Button

| Variant | Default | Hover | Pressed | Use for |
|---|---|---|---|---|
| `primary` | bg `brand-500`, text black, bold | bg `brand-600` | bg `brand-700`, text white | One main action per view |
| `secondary` | bg white, 1px `ink-1000` border, text black | bg `ink-50` | bg `ink-100` | Secondary actions |
| `dark` | bg `ink-900`, text white | bg `ink-700` | bg `ink-1000` | Actions on yellow surfaces |
| `ghost` | transparent, text `ink-700` | bg `ink-50` | bg `ink-100` | Toolbar, table row actions |
| `danger` | bg `danger`, text white | 10% darker | | Reject, delete, void |

- Sizes: `sm` 32px, `md` 40px (default), `lg` 48px (the height on mobile / touch screens).
- Radius 4px, horizontal padding 16px, and an optional leading icon at 20px.
- Loading state: spinner in place of the icon, label stays, `aria-busy="true"`, button disabled.
- Disabled state: 40% opacity, `cursor-not-allowed`. Also explain why it's disabled, in a tooltip or helper text.

```tsx
const button = cva(
  "inline-flex items-center justify-center gap-2 rounded font-semibold transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
  {
    variants: {
      variant: {
        primary: "bg-brand-500 text-ink-1000 hover:bg-brand-600 active:bg-brand-700 active:text-ink-0",
        secondary: "bg-ink-0 text-ink-1000 border border-ink-1000 hover:bg-ink-50",
        dark: "bg-ink-900 text-ink-0 hover:bg-ink-700",
        ghost: "text-ink-700 hover:bg-ink-50",
        danger: "bg-danger text-ink-0 hover:brightness-90",
      },
      size: { sm: "h-8 px-3 text-sm", md: "h-10 px-4 text-body", lg: "h-12 px-5 text-body" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  }
);
```

### 5.2 Form fields

- Label sits above the field, `text-sm font-semibold`. Required fields get a `*` plus `aria-required`.
- Inputs are 40px tall with a 1px `ink-200` border. Focus changes the border to `ink-1000` and adds a 1px ring. Errors get a `danger` border and a message below with `aria-describedby`.
- Helper text is `text-xs text-muted`.
- **Serial number input** is its own component: mono font, automatic uppercase, a trim-on-blur, format checked against a configurable regex, and a "Where do I find this?" link that opens a popover with the label location. **[CONFIRM]** the serial format for each product family with Fieldpiece.
- **Date input:** purchase date can't be in the future or before the product's launch date.
- **File upload:** a dropzone that accepts `image/*` and `application/pdf`, max 10 MB per file and 5 files per claim. Show thumbnails, a progress bar and a remove button for each file.

### 5.3 Status badge

A pill-less badge (2px radius) with 12px uppercase semibold text, a tinted background and a leading dot.

```tsx
const statusStyle: Record<ClaimStatus, string> = {
  DRAFT:          "bg-ink-100 text-ink-600",
  SUBMITTED:      "bg-info-bg text-info",
  IN_REVIEW:      "bg-info-bg text-info",
  NEEDS_INFO:     "bg-warning-bg text-warning",
  APPROVED:       "bg-success-bg text-success",
  REJECTED:       "bg-danger-bg text-danger",
  RMA_ISSUED:     "bg-brand-100 text-brand-800",
  IN_TRANSIT:     "bg-info-bg text-info",
  RECEIVED:       "bg-info-bg text-info",
  REPAIRED:       "bg-success-bg text-success",
  REPLACED:       "bg-success-bg text-success",
  CREDITED:       "bg-success-bg text-success",
  CLOSED:         "bg-ink-100 text-ink-600",
};
```

Warranty status badges: `ACTIVE` (success), `EXPIRING_SOON` (warning, within 60 days, configurable), `EXPIRED` (danger), `NOT_REGISTERED` (neutral), `VOID` (neutral, struck through).

### 5.4 Data table

- The header row is `ink-50` with `text-xs` uppercase semibold. Rows are 48px tall with `ink-100` dividers, and turn `brand-50` on hover.
- The ID column is mono and links to the detail page.
- Sorting, filtering and pagination all happen on the server. The page and filters live in the URL query string so views can be shared.
- The toolbar holds a search box, filter chips, a column picker, and a CSV export button.
- Rows can be selected for bulk actions (for example, assigning claims to an agent).
- On screens narrower than 768px, each row turns into a card.
- Loading shows 8 skeleton rows. Empty and error states use the shared `EmptyState` and `ErrorState` components.

### 5.5 Other primitives

| Component | Notes |
|---|---|
| `Card` | White surface, `rounded-lg shadow-card`, 24px padding, with an optional header row |
| `KpiTile` | Label (overline), big number (`text-h1` mono digits), change vs the previous period with an arrow and colour, optional sparkline |
| `Timeline` | Claim history as a vertical list: icon, actor, action, timestamp, optional comment |
| `Stepper` | For the multi-step registration and claim forms. Done steps are black, the current one is yellow, upcoming ones are grey |
| `Modal` | Radix Dialog, max width 560px, a clear title, and a primary action on the right |
| `Toast` | Bottom-right, gone after 5s, and **errors stay until the user dismisses them** |
| `PageHeader` | Breadcrumb, H1, and the primary action on the right |

---

## 6. Layout and navigation

### 6.1 App shell

```
┌──────────────────────────────────────────────────────────────┐
│ top bar  (ink-900, 32px): environment tag · help · language  │
├──────────────────────────────────────────────────────────────┤
│ header   (brand-500, 64px): [Fieldpiece | Warranty]   search │
│                                             notifications 👤 │
├────────────┬─────────────────────────────────────────────────┤
│ sidebar    │ PageHeader (breadcrumb · H1 · primary action)   │
│ (white,    │                                                 │
│  240px,    │ content (max-w-content, 24px gutter)            │
│  collapses │                                                 │
│  to 64px)  │                                                 │
└────────────┴─────────────────────────────────────────────────┘
```

- The yellow header copies fieldpiece.com, so users know right away they're in a Fieldpiece product.
- The active sidebar item gets a 4px `brand-500` bar on its left, bold text, and an `ink-50` background.
- On mobile the sidebar becomes a drawer opened from a hamburger icon in the header (the site does the same).
- Global search (`/` shortcut) finds serial numbers, claim IDs, RMA numbers and customer names.

### 6.2 Routes

| Path | Page | Roles |
|---|---|---|
| `/login`, `/forgot-password` | Auth | public |
| `/check` | Public warranty lookup (serial number only) | public |
| `/` | Dashboard (role-specific) | all authenticated |
| `/registrations`, `/registrations/new`, `/registrations/bulk` | Product registrations | technician, distributor, admin |
| `/claims`, `/claims/new`, `/claims/:id` | Claims | all authenticated (scoped) |
| `/rma`, `/rma/:id` | RMAs | claims_agent, service_center, admin |
| `/customers`, `/customers/:id` | Customer accounts | distributor, claims_agent, admin |
| `/products`, `/products/:sku` | Product catalogue and warranty terms | admin (edit), others (read) |
| `/reports` | Analytics | claims_agent, admin |
| `/admin/users`, `/admin/policies`, `/admin/settings` | Administration | admin |

Protect routes with a `<RequireRole roles={[...]}/>` wrapper that reads the session's permissions.

---

## 7. Domain model (shared TypeScript types)

Put these in `src/types/domain.ts`. Keep them matched to the backend OpenAPI spec, and generate them with `openapi-typescript` once that spec exists.

```ts
export type Role = "technician" | "distributor" | "claims_agent" | "service_center" | "admin";

export interface Product {
  sku: string;               // e.g. "SC680" [CONFIRM real SKU list]
  name: string;
  family: "meters" | "gauges" | "vacuum" | "leak_detection" | "combustion" | "airflow" | "recovery" | "other";
  imageUrl?: string;
  warrantyMonths: number;    // from WarrantyPolicy; never hard-code
  serialPattern?: string;    // regex source
  launchDate?: string;
}

export interface WarrantyPolicy {
  id: string;
  sku: string | "*";
  baseMonths: number;
  extensionMonthsOnRegistration?: number; // [CONFIRM] whether registration extends coverage
  coverage: string[];        // e.g. ["manufacturing_defects"]
  exclusions: string[];      // e.g. ["physical_damage", "misuse", "consumables"]
  effectiveFrom: string;
}

export interface Registration {
  id: string;
  serialNumber: string;
  sku: string;
  customerId: string;
  distributorId?: string;
  purchaseDate: string;
  proofOfPurchase: Attachment[];
  warrantyStart: string;
  warrantyEnd: string;
  status: "ACTIVE" | "EXPIRING_SOON" | "EXPIRED" | "VOID";
  createdAt: string;
}

export type ClaimStatus =
  | "DRAFT" | "SUBMITTED" | "IN_REVIEW" | "NEEDS_INFO" | "APPROVED" | "REJECTED"
  | "RMA_ISSUED" | "IN_TRANSIT" | "RECEIVED" | "REPAIRED" | "REPLACED" | "CREDITED" | "CLOSED";

export interface Claim {
  id: string;                // display as CLM-000123
  registrationId: string;
  serialNumber: string;
  sku: string;
  failureCategory: "no_power" | "inaccurate_reading" | "display" | "connectivity" | "physical" | "leak" | "other";
  description: string;
  failureDate: string;
  attachments: Attachment[];
  status: ClaimStatus;
  resolution?: "repair" | "replace" | "credit" | "none";
  rejectionReason?: string;
  assignedTo?: string;
  slaDueAt?: string;
  history: ClaimEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface ClaimEvent {
  at: string;
  actor: { id: string; name: string; role: Role };
  type: "created" | "status_changed" | "comment" | "attachment_added" | "assigned";
  from?: ClaimStatus; to?: ClaimStatus;
  comment?: string;
  internal?: boolean;        // internal notes are never shown to technician/distributor
}

export interface Rma {
  id: string;                // RMA-000045
  claimId: string;
  type: "repair" | "replace" | "credit";
  shipTo: Address;
  inboundTracking?: string;
  outboundTracking?: string;
  inspectionNotes?: string;
  replacementSerial?: string;
  status: "ISSUED" | "IN_TRANSIT" | "RECEIVED" | "INSPECTED" | "COMPLETED" | "CANCELLED";
}

export interface Attachment { id: string; name: string; mime: string; size: number; url: string; }
export interface Address { line1: string; line2?: string; city: string; region: string; postalCode: string; country: string; }
```

### 7.1 Claim state machine

```
DRAFT → SUBMITTED → IN_REVIEW ─┬→ APPROVED → RMA_ISSUED → IN_TRANSIT → RECEIVED ─┬→ REPAIRED ─┐
                        ↑      │                                                 ├→ REPLACED ─┼→ CLOSED
                        │      ├→ NEEDS_INFO ──(customer responds)──┐            └→ CREDITED ─┘
                        └──────┼─────────────────────────────────────┘
                               └→ REJECTED → CLOSED
```

The frontend only shows the action buttons the current status and role allow. Put that logic in `features/claims/transitions.ts`, keep it in one place, and unit-test it.

### 7.2 Warranty calculation

The frontend only works out warranty dates to **preview** them (for example, "coverage until 14 Mar 2028" on the registration form). **The API's value always wins.**

```ts
warrantyEnd = addMonths(purchaseDate, policy.baseMonths + (policy.extensionMonthsOnRegistration ?? 0))
```

**[CONFIRM]** the real Fieldpiece warranty terms for each product line. Don't hard-code any durations, because they come from `WarrantyPolicy`.

---

## 8. Screen specs

### 8.1 Public warranty check (`/check`)

- One serial input, a "Check warranty" button, and **no login needed**.
- The result card shows a product image, name, SKU, registration status and warranty badge, the end date, and next-step buttons: "Register this product" or "File a claim" (the second one asks for login).
- Rate-limit on the API. The UI shows a friendly message on a 429 response.

### 8.2 Dashboard (`/`)

| Role | What they see |
|---|---|
| technician | "My products" cards, open claims with status, a "Register product" CTA |
| distributor | KPIs (registrations this month, open claims, avg resolution days), customers with expiring warranties, recent claims table |
| claims_agent | My queue (sorted by SLA due), unassigned claims, SLA-breached count (danger), claims by status bar chart |
| service_center | RMAs to receive today, in inspection, awaiting shipment |
| admin | Everything above, plus claim rate by SKU, cost of claims, top failure categories |

Chart colours: series 1 `brand-500`, series 2 `ink-900`, series 3 `info`, series 4 `ink-300`. Status charts use the status colours. Axes and gridlines are `ink-200`, and labels are `text-xs ink-500`.

### 8.3 Register product (`/registrations/new`), a 3-step stepper

1. **Product:** type a serial and the SKU is detected automatically where the pattern allows it. Otherwise the user picks the SKU from a searchable list with product images.
2. **Purchase:** purchase date, seller or distributor (autocomplete), proof-of-purchase upload.
3. **Owner and review:** customer details (pre-filled for a logged-in technician), a summary, a preview of the warranty end date, and a terms checkbox.

- Duplicate serial: show an inline error with "This unit is already registered". If the current user owns it, add a link to it. If not, show "Contact support".
- On success: a confirmation screen with the registration ID, a "Download certificate (PDF)" button, and "Register another".
- **Bulk registration** (distributor): a CSV template download, then upload, then a preview table with a validation result on each row, then import the valid rows and download an error report for the rest.

### 8.4 File a claim (`/claims/new`)

1. Pick a registered unit, or enter its serial. If the warranty is expired, **show a warning but still allow submission**, marked "Out of warranty, paid repair quote". **[CONFIRM]** with the client.
2. Failure details: category, failure date, description (at least 30 characters), photos or video (at least 1 photo for the `physical` and `display` categories).
3. Return address and preferred resolution.
4. Review and submit.

- Save drafts automatically every 10s to the API as `DRAFT`, with a local fallback.
- After submit, show the claim ID in mono, what happens next, and the expected response time.

### 8.5 Claim detail (`/claims/:id`)

- **Header:** claim ID, status badge, SLA countdown (turns warning within 24h and danger when overdue), assignee, and the actions allowed for this role.
- **Left column (2/3):** tabs for Overview (unit, customer, failure details, attachments gallery with a lightbox), Timeline, and RMA.
- **Right column (1/3):** a warranty summary card, customer card, and past claims for this serial.
- **Comment box** at the bottom of the timeline. Agents get an "Internal note" toggle, and internal notes have a yellow left border with an "Internal" label.
- **Reject** opens a modal where a reason (from a list) and a message to the customer are required.
- **Approve** opens a modal to pick the resolution, which creates an RMA.

### 8.6 RMA detail (`/rma/:id`)

- A printable RMA label / packing slip (a print stylesheet, with the black logo on white).
- Tracking number inputs with carrier auto-detection.
- A service-center inspection form: findings, root cause category, parts used, and the outcome.
- For a replacement: enter the replacement serial, which creates a new registration that carries over the remaining warranty. **[CONFIRM]** the business rule.

### 8.7 Reports (`/reports`)

- Filters: date range, SKU / family, region, distributor.
- Charts: claims over time (line), claim rate by SKU (bar, sorted), failure category breakdown (horizontal bar), average resolution time trend, cost by resolution type.
- Every chart has a "View data" table toggle and CSV export.

---

## 9. API integration

- Base URL comes from `VITE_API_BASE_URL`. One axios instance lives in `lib/http.ts`.
- **Auth:** OIDC / OAuth2 with PKCE (e.g. Azure AD B2C or Auth0). **[CONFIRM]** the identity provider. Keep the access token in memory and refresh it with an httpOnly cookie. **Never store tokens in localStorage.**
- **Interceptors:** add the `Authorization` header, refresh once on a 401 and then log out, and map the error body `{ code, message, fieldErrors? }` into form errors or a toast.
- **Query keys:** `['claims', filters]`, `['claim', id]`, `['registration', serial]` and so on, set up in each feature's `hooks.ts`.
- After a mutation, invalidate the related keys. For comments, update the UI optimistically.
- **Uploads:** request a presigned URL from the API, upload straight to storage (Azure Blob or S3), then send the attachment IDs.
- **Pagination:** cursor or `page`/`pageSize`. The response is `{ items, total, page, pageSize }`.
- Use **MSW** handlers in `src/mocks/` for every endpoint, so the frontend can be built before the backend is ready.

---

## 10. Accessibility (WCAG 2.2 AA is required)

- Meet the contrast rules in 3.2. Run axe on every page in CI through Playwright.
- Everything works from the keyboard. Modals trap focus and give it back when they close, and `Esc` closes overlays.
- Form errors are announced (`role="alert"` on the summary, `aria-invalid` on fields). On submit, move focus to the first invalid field.
- Touch targets are at least 44×44 px on mobile, since techs use it in the field, often with gloves on.
- Respect `prefers-reduced-motion`.
- Tables use a proper `<th scope>`, and charts come with a data-table alternative.

---

## 11. Responsive and field use

- Breakpoints use Tailwind defaults: `sm 640`, `md 768`, `lg 1024`, `xl 1280`.
- Technician flows (check, register, file claim) are designed **mobile-first**. Agent and admin screens are designed desktop-first and still work on a tablet.
- The file upload input uses `capture="environment"` so the phone camera opens straight away for photos of the unit or label.
- **Optional (phase 2):** a PWA with offline claim drafts, and scanning the serial barcode or QR code with the camera (`@zxing/browser`). **[CONFIRM]** whether Fieldpiece labels carry a barcode.

---

## 12. Internationalisation

- Use `react-i18next` from day one, with all strings in `src/locales/{en,es,fr}.json`. Fieldpiece sells across North America, so Spanish and French are likely. **[CONFIRM]**
- Dates, numbers and currency go through `Intl`. Keep the layout RTL-safe with logical CSS properties (`ms-`, `me-`).

---

## 13. Quality, testing and definition of done

| Layer | Tool | Minimum |
|---|---|---|
| Unit | Vitest | 90% on `transitions.ts`, warranty maths, formatters, zod schemas |
| Component | RTL + MSW | Every `ui/` primitive, and every form's happy path plus validation errors |
| E2E | Playwright | Register product, file claim, agent approve leading to RMA, public check. Axe scan on each page |
| Visual | Storybook + Chromatic (optional) | All `ui/` components in light and dark |

A feature is done when all of these are true:

- [ ] It matches the tokens and components in this doc, with no hard-coded hex values in components.
- [ ] Loading, empty, error and permission-denied states are all built.
- [ ] It works at 375px and 1440px wide.
- [ ] It works with the keyboard alone, and axe finds no violations.
- [ ] All strings are in the locale files.
- [ ] Tests pass and lint is clean.
- [ ] The client has seen it on the staging environment.

---

## 14. Coding conventions

- Components are PascalCase files. There is one component per file and **no default exports**, except for route pages.
- Use `type` for unions and `interface` for object shapes. `any` isn't allowed; when a type is genuinely unknown, use `unknown` and narrow it.
- Tailwind classes only, with no inline `style` except for dynamic values. Prettier sorts the classes.
- Colours always come from tokens (`bg-brand-500`), **never a raw hex** like `bg-[#F8BC35]`. Add an ESLint rule for it.
- Commits follow Conventional Commits (`feat(claims): add reject modal`).
- Environment variables: `VITE_API_BASE_URL`, `VITE_OIDC_AUTHORITY`, `VITE_OIDC_CLIENT_ID`, `VITE_SENTRY_DSN`. Commit a `.env.example`, never the real `.env`.

---

## 15. Open items to confirm with Fieldpiece

1. Official logo files in SVG, colour sign-off, and a brand guideline PDF from the Distributor Portal.
2. Myriad Pro licensing for this app.
3. Warranty terms for each product family, and whether registration extends coverage.
4. Serial number formats per SKU, and whether labels carry a barcode or QR code.
5. Identity provider and SSO for distributors and staff.
6. Out-of-warranty claim handling (paid repair quotes).
7. Replacement unit warranty rule (does the remaining term carry over, or does a new term start?).
8. Languages and regions to support.
9. SLA targets for claim review and RMA turnaround.
10. Integration points: ERP / CRM (for example SAP or Salesforce), carrier tracking APIs, email / SMS notifications.

---

*The brand values in this document were taken from the public fieldpiece.com site in September 2026. They're a working reference until the client supplies its official brand guidelines.*
