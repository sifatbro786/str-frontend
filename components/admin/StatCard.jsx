import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * One cell of the 1px-gap grid on the overview page — the gap IS the hairline,
 * so the card paints its own background and owns no border of its own.
 */
export default function StatCard({ label, value, hint, href, accent }) {
  const body = (
    <>
      <p className="label-mono text-(--text-mute)">{label}</p>
      <p className={cn("nums mt-4 text-[2.5rem] leading-none font-semibold tracking-[-0.03em]", accent ? "text-signal" : "text-(--text)")}>
        {value}
      </p>
      {hint && <p className="label-mono mt-3 text-(--text-mute)">{hint}</p>}
    </>
  );

  const className = "block bg-(--canvas) p-5 transition-colors hover:bg-(--raised-2)";
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}
