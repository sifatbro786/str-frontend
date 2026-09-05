"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

/**
 * Two hard-edged glyphs, no rotating-sun animation.
 *
 * next-themes cannot know the resolved theme until after hydration, so the
 * button renders a fixed-size inert placeholder on the server. Rendering the
 * real icon early is what produces the classic hydration-mismatch warning.
 */
export default function ThemeToggle({ className = "" }) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";
  const base =
    "inline-flex h-9 w-9 items-center justify-center border border-(--line) text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)";

  if (!mounted) {
    return <span aria-hidden="true" className={`${base} ${className}`} />;
  }

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={`${base} ${className}`}
    >
      {isDark ? (
        /* sun — straight rays, no rounded caps */
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <circle cx="8" cy="8" r="3.1" />
          <path d="M8 .8v2.1M8 13.1v2.1M.8 8h2.1M13.1 8h2.1M2.9 2.9l1.5 1.5M11.6 11.6l1.5 1.5M13.1 2.9l-1.5 1.5M4.4 11.6l-1.5 1.5" />
        </svg>
      ) : (
        /* moon */
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden="true">
          <path d="M13.4 9.9A5.9 5.9 0 0 1 6.1 2.6 5.9 5.9 0 1 0 13.4 9.9Z" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
