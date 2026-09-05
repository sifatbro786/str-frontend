import { cn } from "@/lib/utils";

/**
 * The eyebrow replacement. Renders `01 // SERVICES` as a mono index with a
 * signal rule — never a rounded pill badge.
 *
 * @param {string} index   Zero-padded section number, e.g. "02".
 * @param {string} label   Uppercased by CSS; pass normal-case text.
 * @param {"left"|"right"} align
 */
export default function SectionIndex({ index, label, align = "left", className }) {
  return (
    <div
      className={cn(
        "label-mono flex items-center gap-3 text-(--text-mute)",
        align === "right" && "justify-end",
        className
      )}
    >
      {index ? (
        <>
          <span className="text-signal">{index}</span>
          <span aria-hidden="true" className="select-none text-(--line)">
            //
          </span>
        </>
      ) : (
        <span aria-hidden="true" className="h-px w-7 bg-signal" />
      )}
      <span>{label}</span>
    </div>
  );
}
