import { cn } from "@/lib/utils";

/**
 * Hairline-bordered rectangular tag. Square corners on purpose — the rounded
 * pastel pill is the single most recognisable generated-UI tell.
 *
 * variant "solid"   → inverted block, for the primary service on a card
 * variant "outline" → default hairline
 * variant "ghost"   → no border, mono only, for dense meta rows
 */
export default function Tag({ children, variant = "outline", as: As = "span", className, ...rest }) {
  const styles = {
    outline: "border border-(--line) text-(--text-dim)",
    solid: "border border-transparent bg-(--text) text-(--canvas)",
    ghost: "border border-transparent text-(--text-mute)",
    signal: "border border-signal/40 text-signal",
  };

  return (
    <As
      className={cn(
        "label-mono inline-flex items-center whitespace-nowrap px-2.5 py-1.5",
        styles[variant] ?? styles.outline,
        className
      )}
      {...rest}
    >
      {children}
    </As>
  );
}
