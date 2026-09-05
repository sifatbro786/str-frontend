import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Text link with a diagonal arrow that translates on hover. Used instead of a
 * button anywhere the action is "read more" rather than "commit to something".
 */
export default function ArrowLink({ href, children, className, tone = "default", ...rest }) {
  const tones = {
    default: "text-(--text) hover:text-signal",
    muted: "text-(--text-mute) hover:text-(--text)",
    signal: "text-signal hover:text-(--text)",
  };

  return (
    <Link
      href={href}
      className={cn(
        "group/arrow inline-flex items-center gap-2 text-sm font-medium transition-colors",
        tones[tone] ?? tones.default,
        className
      )}
      {...rest}
    >
      <span className="border-b border-transparent pb-0.5 transition-colors group-hover/arrow:border-current">
        {children}
      </span>
      <svg
        width="13"
        height="13"
        viewBox="0 0 14 14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        aria-hidden="true"
        className="transition-transform duration-300 ease-out group-hover/arrow:translate-x-0.5 group-hover/arrow:-translate-y-0.5"
      >
        <path d="M3.5 10.5 10.5 3.5M4.9 3.5h5.6v5.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </Link>
  );
}
