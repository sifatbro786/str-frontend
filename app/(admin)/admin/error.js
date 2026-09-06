"use client";

/**
 * Client error boundary for the admin subtree. A 502 from the stats endpoint
 * (Express down) renders a retry here instead of the Next error overlay.
 */
export default function AdminError({ error, reset }) {
  return (
    <div className="border border-(--line) px-6 py-14 text-center">
      <p className="label-mono text-signal">Something failed</p>
      <h2 className="mt-4 text-[1.5rem] font-semibold tracking-[-0.02em] text-(--text)">
        This page could not load.
      </h2>
      <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-(--text-mute)">
        {error?.message === "fetch failed" || error?.message?.includes("unreachable")
          ? "The API server is not responding. Check that str-backend is running on its port."
          : error?.message || "An unexpected error occurred."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="label-mono mt-8 border border-(--line) px-5 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
      >
        Try again
      </button>
    </div>
  );
}
