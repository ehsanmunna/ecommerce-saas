import type { Config } from "tailwindcss";

/**
 * Theme tokens, not literal colors. Values today equal the "Frozen" design
 * reference (docs/html_design_template/) - swapping to per-tenant values
 * later is a token-source change, not a component rewrite. See
 * openspec/changes/add-storefront-frontend/design.md.
 */
const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "var(--color-primary)",
        "primary-hover": "var(--color-primary-hover)",
        ink: "var(--color-ink)",
        "ink-hover": "var(--color-ink-hover)",
        text: "var(--color-text)",
        "text-muted": "var(--color-text-muted)",
        "link-hover": "var(--color-link-hover)",
        background: "var(--color-background)",
        surface: "var(--color-surface)",
        border: "var(--color-border)",
        success: "var(--color-success)",
      },
      fontFamily: {
        heading: ["var(--font-heading)", "Helvetica", "Arial", "sans-serif"],
        body: ["var(--font-body)", "Helvetica", "Arial", "sans-serif"],
      },
      borderRadius: {
        card: "25px",
      },
    },
  },
  plugins: [],
};
export default config;
