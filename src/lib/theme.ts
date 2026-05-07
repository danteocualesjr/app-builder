export type ThemePreference = "light" | "dark" | "system"

export const THEME_STORAGE_KEY = "app-builder.theme"

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "light" || value === "dark" || value === "system"
}

export function resolveTheme(preference: ThemePreference): "light" | "dark" {
  if (preference === "system") {
    if (typeof window === "undefined") {
      return "light"
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light"
  }
  return preference
}

export function applyTheme(preference: ThemePreference) {
  if (typeof document === "undefined") {
    return
  }
  const resolved = resolveTheme(preference)
  document.documentElement.classList.toggle("dark", resolved === "dark")
  document.documentElement.style.colorScheme = resolved
}

// Inline script that applies the saved theme before hydration to avoid a
// flash of light content. This must run synchronously in the document head.
export const themeBootstrapScript = `
(function() {
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    var preference = stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : "system";
    var resolved = preference;
    if (preference === "system") {
      resolved = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    var root = document.documentElement;
    root.classList.toggle("dark", resolved === "dark");
    root.style.colorScheme = resolved;
  } catch (error) {
    // Theme bootstrap is best-effort; fall back to default styles on failure.
  }
})();
`.trim()
