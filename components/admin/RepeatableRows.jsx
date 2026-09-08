"use client";

import { useRef } from "react";
import { CONTROL } from "./Fields";
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from "./icons";
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

/** The three per-row controls, so they cannot drift apart. */
const ROW_BUTTON =
    "grid size-9 place-items-center rounded-lg border border-(--line) text-(--text-mute) transition-colors hover:bg-(--raised-2) hover:text-(--text) disabled:opacity-30 disabled:hover:bg-transparent";

export default function RepeatableRows({
    value = [],
    onChange,
    columns,
    newRow,
    max = 40,
    addLabel = "Add row",
}) {
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
                <ul className="overflow-hidden rounded-xl border border-(--line)">
                    {rows.map((row, i) => (
                        <li
                            key={row._key}
                            className="border-b border-(--line-soft) p-3 last:border-0"
                        >
                            <div className="flex flex-wrap items-end gap-3">
                                {columns.map((c) => (
                                    <div
                                        key={c.key}
                                        className={cn("min-w-40", c.grow !== false && "flex-1")}
                                    >
                                        <label
                                            htmlFor={`${row._key}-${c.key}`}
                                            className="block text-[0.8125rem] font-medium text-(--text-mute)"
                                        >
                                            {c.label}{" "}
                                            {c.required && <span className="text-signal">*</span>}
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

                                {/* aria-label on every one of these: the icon is
                                    the only content, so without it a screen
                                    reader announces three unlabelled buttons per
                                    row. The row number is in the label because
                                    "Move up" repeated eight times is no more
                                    useful than nothing. */}
                                <div className="flex shrink-0 gap-1">
                                    <button
                                        type="button"
                                        onClick={() => move(i, -1)}
                                        disabled={i === 0}
                                        aria-label={`Move row ${i + 1} up`}
                                        className={ROW_BUTTON}
                                    >
                                        <ChevronUpIcon className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => move(i, 1)}
                                        disabled={i === rows.length - 1}
                                        aria-label={`Move row ${i + 1} down`}
                                        className={ROW_BUTTON}
                                    >
                                        <ChevronDownIcon className="size-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => update(rows.filter((_, j) => j !== i))}
                                        aria-label={`Remove row ${i + 1}`}
                                        className={cn(ROW_BUTTON, "hover:!text-signal")}
                                    >
                                        <TrashIcon className="size-4" />
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
                className="mt-3 inline-flex items-center gap-2 rounded-lg border border-(--line) px-3.5 py-2 text-[0.875rem] font-medium text-(--text-dim) transition-colors hover:border-brand hover:text-brand disabled:opacity-40"
            >
                <PlusIcon className="size-4" />
                {addLabel}
            </button>
        </div>
    );
}

/** Drops the client-only _key before a payload goes to the API. */
export function stripKeys(rows = []) {
    return rows.map(({ _key, ...rest }) => rest);
}
