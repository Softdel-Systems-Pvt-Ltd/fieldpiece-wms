import forms from "@tailwindcss/forms";
import type { Config } from "tailwindcss";

// Every colour resolves to a CSS variable in src/styles/tokens.css (Section 4 of the build guide).
const scale = (name: string, steps: (string | number)[]) =>
  Object.fromEntries(steps.map((s) => [s, `var(--${name}-${s})`]));

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: {
          ...scale("brand", [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
          DEFAULT: "var(--brand-500)",
        },
        ink: scale("ink", [0, 50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]),
        success: { DEFAULT: "var(--success)", bg: "var(--success-bg)" },
        warning: { DEFAULT: "var(--warning)", bg: "var(--warning-bg)" },
        danger: { DEFAULT: "var(--danger)", bg: "var(--danger-bg)" },
        info: { DEFAULT: "var(--info)", bg: "var(--info-bg)" },
        "link-on-dark": "var(--link-on-dark)",
        bg: "var(--bg)",
        surface: { DEFAULT: "var(--surface)", raised: "var(--surface-raised)" },
        border: "var(--border)",
        text: { DEFAULT: "var(--text)", muted: "var(--text-muted)" },
        header: { DEFAULT: "var(--header-bg)", text: "var(--header-text)" },
        topbar: "var(--topbar-bg)",
        scrim: "var(--scrim)",
        tint: { DEFAULT: "var(--tint)", strong: "var(--tint-strong)" },
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
      width: { sidebar: "240px", "sidebar-collapsed": "64px" },
      height: { topbar: "32px", header: "64px" },
    },
  },
  plugins: [forms],
} satisfies Config;
