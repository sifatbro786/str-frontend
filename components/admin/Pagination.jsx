"use client";

import { cn } from "@/lib/utils";

const BTN =
  "label-mono border border-(--line) px-3.5 py-2 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text) disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-(--line) disabled:hover:text-(--text-dim)";

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages, total, limit } = meta;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-4">
      <p className="label-mono text-(--text-mute)">
        <span className="nums">{from}</span>–<span className="nums">{to}</span> of{" "}
        <span className="nums">{total}</span>
      </p>

      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onPage(page - 1)} disabled={!meta.hasPrevPage} className={BTN}>
          ← Prev
        </button>
        <span className={cn("label-mono nums px-2 text-(--text-mute)")}>
          {page} / {totalPages}
        </span>
        <button type="button" onClick={() => onPage(page + 1)} disabled={!meta.hasNextPage} className={BTN}>
          Next →
        </button>
      </div>
    </nav>
  );
}
