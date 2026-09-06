"use client";

import { cn } from "@/lib/utils";

/**
 * Generic admin table.
 *
 * Loading renders the LAST KNOWN rows at reduced opacity with aria-busy rather
 * than a skeleton — a shimmer is animation, and Phase 4 §0.4 forbids it. It is
 * also less jarring: the table does not collapse and reflow on every keystroke.
 */
export default function DataTable({
  columns,
  rows,
  rowKey,
  status,
  error,
  onRetry,
  empty = "Nothing here yet.",
  emptyAction,
  actions,
}) {
  const busy = status === "loading";
  const colCount = columns.length + (actions ? 1 : 0);

  if (status === "error") {
    return (
      <div className="border border-(--line) px-5 py-10 text-center">
        <p className="text-[0.9375rem] text-(--text)">{error?.message ?? "Could not load this list."}</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="label-mono mt-5 border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-(--line)">
      <table aria-busy={busy || undefined} className={cn("w-full min-w-[48rem] border-collapse text-left", busy && "opacity-60")}>
        <thead>
          <tr className="border-b border-(--line)">
            {columns.map((c) => (
              <th
                key={c.key}
                scope="col"
                style={c.width ? { width: c.width } : undefined}
                className={cn("label-mono px-4 py-3 font-medium text-(--text-mute)", c.className)}
              >
                {c.header}
              </th>
            ))}
            {actions && (
              <th scope="col" className="label-mono px-4 py-3 text-right font-medium text-(--text-mute)">
                Actions
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={colCount} className="px-4 py-14 text-center">
                <p className="text-[0.9375rem] text-(--text-mute)">{busy ? "Loading…" : empty}</p>
                {!busy && emptyAction}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-(--line-soft) transition-colors last:border-0 hover:bg-(--raised-2)">
                {columns.map((c) => (
                  <td key={c.key} className={cn("px-4 py-3.5 align-middle text-[0.9375rem] text-(--text-dim)", c.className)}>
                    {c.render ? c.render(row) : (row[c.key] ?? "—")}
                  </td>
                ))}
                {actions && <td className="px-4 py-3.5 align-middle">{actions(row)}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
