/**
 * Named theme tokens, extracted from docs/html_design_template/ (the
 * "Frozen" design reference) rather than left as literal colors on each
 * component. Every component should reference a token (via the Tailwind
 * classes in tailwind.config.ts, or this object directly for inline
 * styles) and never a raw rgb()/hex value.
 *
 * This is one fixed default theme for every tenant - dynamic per-tenant
 * branding is out of scope for this change (no Settings/Theme API exists
 * yet; see design.md "Non-Goals"). Swapping these values for tenant-
 * sourced ones later should not require touching any component.
 */
export const theme = {
  colors: {
    primary: "#FFCF40",
    primaryHover: "#FFAC33",
    ink: "#1A1A1A",
    inkHover: "#373737",
    text: "#2F2F2F",
    textMuted: "#737373",
    linkHover: "#E5A000",
    background: "#FFFFFF",
    surface: "#F0F0F0",
    border: "#E6E6E6",
    success: "#54A349",
  },
  fonts: {
    heading: "Montserrat",
    body: "Inter",
  },
} as const;
