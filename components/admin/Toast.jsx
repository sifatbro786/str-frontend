"use client";

import { cn } from "@/lib/utils";

/**
 * Fixed bottom-right stack. Rendered by ToastProvider, never mounted directly.
 * role="status" + aria-live="polite" announces without stealing focus.
 */
export default function ToastStack({ toasts, onDismiss }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-5 right-5 z-100 flex w-[min(22rem,calc(100vw-2.5rem))] flex-col gap-2"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-3 border bg-(--raised) px-4 py-3 text-[0.875rem]",
            t.tone === "error" ? "border-signal text-(--text)" : "border-(--line) text-(--text)"
          )}
        >
          <span className={cn("label-mono mt-0.5", t.tone === "error" ? "text-signal" : "text-leaf")}>
            {t.tone === "error" ? "Error" : "OK"}
          </span>
          <p className="min-w-0 flex-1 leading-snug">{t.message}</p>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Dismiss"
            className="label-mono shrink-0 text-(--text-mute) transition-colors hover:text-(--text)"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
