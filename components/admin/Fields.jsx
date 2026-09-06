"use client";

import { cn } from "@/lib/utils";

/**
 * Form primitives. One shared shell (Field) owns the label / hint / error so no
 * page repeats it, and every control shares CONTROL so they cannot drift.
 *
 * Square corners, hairline borders, semantic tokens only. transition-colors is
 * the only transition permitted anywhere in /admin (Phase 4 §0.4).
 */
export const CONTROL =
  "w-full border border-(--line) bg-transparent px-3.5 py-2.5 text-[0.9375rem] text-(--text) placeholder:text-(--text-mute) transition-colors focus:border-signal focus:outline-none disabled:opacity-50";

export function Field({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label-mono block text-(--text-mute)">
        {label} {required && <span className="text-signal">*</span>}
      </label>
      <div className="mt-2">{children}</div>
      {hint && !error && <p className="mt-2 text-[0.8125rem] text-(--text-mute)">{hint}</p>}
      {error && (
        <p id={`err-${htmlFor}`} role="alert" className="label-mono mt-2 text-signal">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ error, className, ...props }) {
  return (
    <input
      {...props}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={error ? `err-${props.id}` : undefined}
      className={cn(CONTROL, error && "border-signal", className)}
    />
  );
}

export function Textarea({ error, className, ...props }) {
  return (
    <textarea
      {...props}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={error ? `err-${props.id}` : undefined}
      className={cn(CONTROL, "resize-y", error && "border-signal", className)}
    />
  );
}

export function Select({ error, className, options = [], children, ...props }) {
  return (
    <select
      {...props}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={error ? `err-${props.id}` : undefined}
      className={cn(CONTROL, error && "border-signal", className)}
    >
      {children ??
        options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
    </select>
  );
}

export function NumberInput({ error, className, ...props }) {
  return (
    <input
      {...props}
      type="number"
      inputMode="numeric"
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={error ? `err-${props.id}` : undefined}
      className={cn(CONTROL, "nums", error && "border-signal", className)}
    />
  );
}

/** Square checkbox, not a rounded switch — see the forbidden list in Phase 3 §3. */
export function Toggle({ id, checked, onChange, label, disabled }) {
  return (
    <label htmlFor={id} className={cn("flex items-center gap-3", disabled ? "opacity-50" : "cursor-pointer")}>
      <input
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 shrink-0 accent-brand"
      />
      <span className="text-[0.9375rem] text-(--text)">{label}</span>
    </label>
  );
}

/** Live "n / max" counter for the length-capped textareas. */
export function Counter({ value = "", max }) {
  const n = String(value).length;
  return (
    <span className={cn("label-mono", n > max ? "text-signal" : "text-(--text-mute)")}>
      {n} / {max}
    </span>
  );
}
