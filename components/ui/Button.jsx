import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Square-cornered button. Three variants only — every additional variant is a
 * decision the design system failed to make.
 *
 * Renders <Link> when `href` is present, <button> otherwise, so callers never
 * have to think about it.
 */
export default function Button({
  href,
  children,
  variant = "solid",
  size = "md",
  className,
  withArrow = false,
  ...rest
}) {
  const variants = {
    solid: "bg-brand text-white hover:bg-brand-hi",
    invert: "bg-(--text) text-(--canvas) hover:bg-signal hover:text-white",
    outline: "border border-(--line) text-(--text) hover:border-(--text)",
  };
  const sizes = {
    sm: "px-4 py-2.5 text-[0.8125rem]",
    md: "px-6 py-3.5 text-sm",
    lg: "px-8 py-4 text-[0.9375rem]",
  };

  const classes = cn(
    "group/btn inline-flex items-center justify-center gap-2.5 font-medium tracking-[-0.01em] transition-colors duration-200",
    variants[variant] ?? variants.solid,
    sizes[size] ?? sizes.md,
    className
  );

  const inner = (
    <>
      {children}
      {withArrow && (
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.7"
          aria-hidden="true"
          className="transition-transform duration-300 ease-out group-hover/btn:translate-x-1"
        >
          <path d="M2.5 8h11M9.5 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...rest}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" className={classes} {...rest}>
      {inner}
    </button>
  );
}
