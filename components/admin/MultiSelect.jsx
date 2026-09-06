"use client";

/* From taxonomy, NOT lib/data: this is a client component, and one named
   import from lib/data.js ships every case-study body and every blog post into
   the admin bundle. Phase 3 §2 covers why. */
import { SERVICE_TYPES, SERVICE_LABELS } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

/**
 * Checkbox grid over the service taxonomy.
 *
 * The 1–4 rule is enforced here as a HINT only — the express-validator rule on
 * the API stays the source of truth. Blocking the fifth checkbox client-side
 * would be a second implementation of a rule that can change on the server.
 */
export default function MultiSelect({ value = [], onChange, min = 1, max = 4 }) {
  function toggle(slug) {
    onChange(value.includes(slug) ? value.filter((v) => v !== slug) : [...value, slug]);
  }

  const over = value.length > max;
  const under = value.length < min;

  return (
    <div>
      <ul className="grid gap-px bg-(--line) sm:grid-cols-2">
        {SERVICE_TYPES.map((slug) => {
          const checked = value.includes(slug);
          return (
            <li key={slug} className="bg-(--canvas)">
              <label
                htmlFor={`svc-${slug}`}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-(--raised-2)",
                  checked && "bg-(--raised-2)"
                )}
              >
                <input
                  id={`svc-${slug}`}
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(slug)}
                  className="size-4 shrink-0 accent-brand"
                />
                <span className="text-[0.9375rem] text-(--text)">{SERVICE_LABELS[slug] ?? slug}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <p className={cn("label-mono mt-2", over || under ? "text-signal" : "text-(--text-mute)")}>
        {value.length} selected · {min}–{max} required
      </p>
    </div>
  );
}
