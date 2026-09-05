"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * App-wide theme context.
 *
 * attribute="class"  → next-themes writes class="dark" | class="light" on <html>,
 *                      which globals.css hooks with @custom-variant + :root:not(.dark).
 * defaultTheme="dark"→ the brand's primary posture. `enableSystem` still lets a
 *                      light-preferring visitor land on light without a flash,
 *                      because next-themes injects its resolver script pre-paint.
 * value={{...}}      → explicit map so class="light" is actually emitted rather
 *                      than the empty-class default; :root:not(.dark) needs it.
 */
export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
      value={{ light: "light", dark: "dark" }}
      storageKey="str-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
