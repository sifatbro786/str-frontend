"use client";

import Link from "next/link";
import { CONTROL } from "./Fields";
import { cn } from "@/lib/utils";

/**
 * Search + filter selects + primary action. The search input is uncontrolled by
 * debounce — the page owns the raw value and passes the debounced one to the
 * fetch, so typing stays instant while the network does not.
 */
export default function Toolbar({ search, onSearch, placeholder = "Search…", filters = [], action, children }) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {onSearch && (
        <div className="min-w-56 flex-1">
          <label htmlFor="toolbar-search" className="label-mono block text-(--text-mute)">
            Search
          </label>
          <input
            id="toolbar-search"
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className={cn(CONTROL, "mt-2")}
          />
        </div>
      )}

      {filters.map((f) => (
        <div key={f.label} className="min-w-44">
          <label htmlFor={`filter-${f.label}`} className="label-mono block text-(--text-mute)">
            {f.label}
          </label>
          <select
            id={`filter-${f.label}`}
            value={f.value}
            onChange={(e) => f.onChange(e.target.value)}
            className={cn(CONTROL, "mt-2")}
          >
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {children}

      {action && (
        <Link
          href={action.href}
          className="ml-auto bg-brand px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
