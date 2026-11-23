import { defineTheme } from "c15t/next";

/**
 * Consent UI theme, wired to the site's own design tokens in globals.css.
 *
 * Colors reference the shadcn CSS variables rather than hard-coded values, so
 * they already flip when next-themes puts `.dark` on <html>. The `dark` group
 * repeats them only to stop c15t's built-in dark palette from taking over.
 *
 * @see https://c15t.com/docs/customization/theming
 */
const colors = {
  primary: "var(--primary)",
  primaryHover: "color-mix(in oklch, var(--primary) 90%, transparent)",
  surface: "var(--card)",
  surfaceHover: "var(--accent)",
  border: "var(--border)",
  borderHover: "var(--input)",
  text: "var(--foreground)",
  textMuted: "var(--muted-foreground)",
  // Set explicitly: c15t can't derive a contrast color from a var() reference.
  textOnPrimary: "var(--primary-foreground)",
  overlay: "oklch(0 0 0 / 0.5)",
  switchTrack: "var(--input)",
  switchTrackActive: "var(--primary)",
  switchThumb: "var(--background)",
};

export const theme = defineTheme({
  colors,
  dark: colors,
  typography: {
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
  },
  radius: {
    sm: "calc(var(--radius) - 4px)",
    md: "calc(var(--radius) - 2px)",
    lg: "calc(var(--radius) + 4px)",
    full: "9999px",
  },
  slots: {
    consentBannerCard:
      "border border-border bg-card/95 text-card-foreground backdrop-blur-sm shadow-sm",
    // c15t paints this with surfaceHover (--accent), a solid grey band that
    // sits heavy under the translucent card; use a hairline + faint tint instead.
    consentBannerFooter: "border-t border-border bg-muted/40 dark:bg-muted/20",
    consentDialogCard:
      "border border-border bg-card/95 text-card-foreground backdrop-blur-md shadow-lg",
    buttonPrimary:
      "rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-all",
    buttonSecondary:
      "rounded-md border border-border bg-background font-medium shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50 transition-all",
    consentBannerTitle: "text-foreground font-semibold",
    consentBannerDescription: "text-muted-foreground",
    consentDialogTitle: "text-foreground font-semibold",
    consentDialogDescription: "text-muted-foreground",
  },
});
