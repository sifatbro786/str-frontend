"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * App-wide theme context.
 * attribute="class" → next-themes writes `class="dark"` on <html>,
 * which our globals.css @custom-variant hooks into.
 */
export default function ThemeProvider({ children }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
