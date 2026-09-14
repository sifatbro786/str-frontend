"use client";

/* Only the label helpers come from taxonomy — the LIST arrives as a prop, from
   the services the dashboard actually holds. Importing a hardcoded array here
   is what made a newly created service invisible in this grid. */
import { serviceOptions } from "@/lib/taxonomy";
import { cn } from "@/lib/utils";

/**
 * Checkbox grid over the service taxonomy.
 *
 * ── WHY `services` IS A PROP ─────────────────────────────────────────────
 * This grid IS the answer to "which disciplines exist", and that answer lives
 * in the Service collection. It used to map over a literal array in
 * lib/taxonomy.js, so adding Video Editing at /admin/services produced a
 * service no project could ever be tagged with — no checkbox, and a 400 from
 * the API if the value was sent another way.
 *
 * Fetching here instead of taking a prop would put a request inside a
 * component that is rendered once per form; the form already knows how to
 * load, so it loads and passes down.
 *
 * The 1–4 rule is enforced here as a HINT only — the express-validator rule on
 * the API stays the source of truth. Blocking the fifth checkbox client-side
 * would be a second implementation of a rule that can change on the server.
 */
export default function MultiSelect({ value = [], onChange, services, min = 1, max = 4 }) {
    function toggle(slug) {
        onChange(value.includes(slug) ? value.filter((v) => v !== slug) : [...value, slug]);
    }

    const options = serviceOptions(services);
    const over = value.length > max;
    const under = value.length < min;

    /* An empty list means the services have not arrived yet, or the request
       failed. Saying so beats an empty box that looks like "there are no
       services", which is the reading that sends someone to check the
       database. */
    if (options.length === 0) {
        return (
            <p className="label-mono rounded-lg border border-(--line) px-3.5 py-3 text-(--text-mute)">
                Loading services…
            </p>
        );
    }

    return (
        <div>
            <ul className="grid gap-px bg-(--line) sm:grid-cols-2">
                {options.map(({ value: slug, label }) => {
                    const checked = value.includes(slug);
                    return (
                        <li key={slug} className="bg-(--canvas)">
                            <label
                                htmlFor={`svc-${slug}`}
                                className={cn(
                                    "flex cursor-pointer items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-(--raised-2)",
                                    checked && "bg-(--raised-2)",
                                )}
                            >
                                <input
                                    id={`svc-${slug}`}
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggle(slug)}
                                    className="size-4 shrink-0 accent-brand"
                                />
                                <span className="text-[0.9375rem] text-(--text)">{label}</span>
                            </label>
                        </li>
                    );
                })}
            </ul>

            <p
                className={cn(
                    "label-mono mt-2",
                    over || under ? "text-signal" : "text-(--text-mute)",
                )}
            >
                {value.length} selected · {min}–{max} required
            </p>
        </div>
    );
}
