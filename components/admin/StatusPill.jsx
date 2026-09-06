import { cn } from "@/lib/utils";

/**
 * Square, hairline, label-mono. Deliberately not a rounded badge — see the
 * forbidden list in Phase 3 §3.
 */
const TONES = {
  new: "border-signal/40 text-signal",
  contacted: "border-brand/40 text-brand",
  closed: "border-(--line) text-(--text-mute)",
  published: "border-leaf/40 text-leaf",
  active: "border-leaf/40 text-leaf",
  featured: "border-leaf/40 text-leaf",
  draft: "border-(--line) text-(--text-mute)",
  inactive: "border-(--line) text-(--text-mute)",
};

export default function StatusPill({ value, label }) {
  const tone = TONES[value] ?? "border-(--line) text-(--text-mute)";
  return (
    <span className={cn("label-mono inline-block border px-2 py-1", tone)}>
      {label ?? value}
    </span>
  );
}
