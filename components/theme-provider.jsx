"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * App-wide theme context.
 *
 * attribute="class"  → next-themes writes class="dark" | class="light" on <html>,
 *                      which globals.css hooks with @custom-variant + :root:not(.dark).
 * defaultTheme="light"→ the brand's primary posture. `enableSystem` still lets a
 *                      dark-preferring visitor land on dark without a flash,
 *                      because next-themes injects its resolver script pre-paint.
 * value={{...}}      → explicit map so class="light" is actually emitted rather
 *                      than the empty-class default. globals.css puts the light
 *                      ramp on bare `:root`, so an emitted class is not strictly
 *                      required any more, but ThemeToggle reads back the same
 *                      map and an empty class there makes the button lie about
 *                      which theme is active.
 */
export default function ThemeProvider({ children }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
            value={{ light: "light", dark: "dark" }}
            storageKey="str-theme"
        >
            {children}
        </NextThemesProvider>
    );
}
