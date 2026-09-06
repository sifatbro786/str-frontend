"use client";

import { useState } from "react";
import { CONTROL } from "./Fields";
import { cn } from "@/lib/utils";

/**
 * string[] editor. Enter or comma commits; Backspace on an empty input removes
 * the last chip; duplicates are rejected silently rather than with an error,
 * because a duplicate is a mistyped repeat, not something to explain.
 */
export default function TagInput({ id, value = [], onChange, placeholder = "Type and press Enter", max = 40 }) {
  const [draft, setDraft] = useState("");

  function commit(raw) {
    const next = raw.trim().replace(/,$/, "");
    if (!next) return;
    if (value.includes(next)) {
      setDraft("");
      return;
    }
    if (value.length >= max) return;
    onChange([...value, next]);
    setDraft("");
  }

  function onKeyDown(e) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length) {
      onChange(value.slice(0, -1));
    }
  }

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 flex flex-wrap gap-2">
          {value.map((tag) => (
            <li key={tag} className="label-mono flex items-center gap-2 border border-(--line) px-2.5 py-1.5 text-(--text-dim)">
              {tag}
              <button
                type="button"
                onClick={() => onChange(value.filter((t) => t !== tag))}
                aria-label={`Remove ${tag}`}
                className="text-(--text-mute) transition-colors hover:text-signal"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
      <input
        id={id}
        type="text"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => commit(draft)}
        placeholder={placeholder}
        className={cn(CONTROL)}
      />
    </div>
  );
}
