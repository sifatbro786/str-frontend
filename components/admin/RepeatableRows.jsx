"use client";

import { useRef } from "react";
import { CONTROL } from "./Fields";
import { cn } from "@/lib/utils";

/**
 * Generic array-of-objects editor (techStack, galleryImages).
 *
 * Keys must be stable across reorders. A client-side `_key` stamped from a ref
 * counter is what makes that true — using the array index instead means
 * removing row 2 visually clears row 3's input, because React reuses the DOM
 * node under the same key.
 *
 * `_key` is stripped on submit by stripKeys() below; it must never reach the API.
 */
export default function RepeatableRows({ value = [], onChange, columns, newRow, max = 40, addLabel = "Add row" }) {
  const seq = useRef(0);

  // Stamp any row that arrived from the server without a key.
  const rows = value.map((r) => (r._key ? r : { ...r, _key: `k${++seq.current}` }));

  function update(next) {
    onChange(next);
  }

  function patch(index, key, val) {
    update(rows.map((r, i) => (i === index ? { ...r, [key]: val } : r)));
  }

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= rows.length) return;
    const next = [...rows];
    [next[index], next[target]] = [next[target], next[index]];
    update(next);
  }

  return (
    <div>
      {rows.length > 0 && (
        <ul className="border border-(--line)">
          {rows.map((row, i) => (
            <li key={row._key} className="border-b border-(--line-soft) p-3 last:border-0">
              <div className="flex flex-wrap items-end gap-3">
                {columns.map((c) => (
                  <div key={c.key} className={cn("min-w-40", c.grow !== false && "flex-1")}>
                    <label
                      htmlFor={`${row._key}-${c.key}`}
                      className="label-mono block text-(--text-mute)"
                    >
                      {c.label} {c.required && <span className="text-signal">*</span>}
                    </label>
                    {c.type === "select" ? (
                      <select
                        id={`${row._key}-${c.key}`}
                        value={row[c.key] ?? ""}
                        onChange={(e) => patch(i, c.key, e.target.value)}
                        className={cn(CONTROL, "mt-2")}
                      >
                        {c.options.map((o) => (
                          <option key={o.value} value={o.value}>
                            {o.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        id={`${row._key}-${c.key}`}
                        type="text"
                        value={row[c.key] ?? ""}
                        onChange={(e) => patch(i, c.key, e.target.value)}
                        placeholder={c.placeholder}
                        className={cn(CONTROL, "mt-2")}
                      />
                    )}
                  </div>
                ))}

                <div className="flex shrink-0 gap-1.5">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={`Move row ${i + 1} up`}
                    className="label-mono border border-(--line) px-2.5 py-2.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text) disabled:opacity-30"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === rows.length - 1}
                    aria-label={`Move row ${i + 1} down`}
                    className="label-mono border border-(--line) px-2.5 py-2.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text) disabled:opacity-30"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => update(rows.filter((_, j) => j !== i))}
                    aria-label={`Remove row ${i + 1}`}
                    className="label-mono border border-(--line) px-2.5 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => update([...rows, { ...newRow, _key: `k${++seq.current}` }])}
        disabled={rows.length >= max}
        className="label-mono mt-3 border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal disabled:opacity-40"
      >
        + {addLabel}
      </button>
    </div>
  );
}

/** Drops the client-only _key before a payload goes to the API. */
export function stripKeys(rows = []) {
  return rows.map(({ _key, ...rest }) => rest);
}
