import dynamic from "next/dynamic";
import { cn } from "@/lib/utils";

/**
 * Seamless infinite rail — server shell.
 *
 * Renders the track twice so MarqueeMotion can translate it to exactly -50% and
 * loop invisibly. The clone is aria-hidden, otherwise a screen reader reads the
 * whole list twice, which is the accessibility bug in most marquee
 * implementations.
 *
 * With `interactive` unset this is pure server-rendered markup: a static row
 * clipped by overflow-hidden and faded by mask-x, with no client JS whatsoever.
 * That is the same thing reduced-motion users see, and it is what /about gets —
 * Phase 5 motion is homepage-only, and reaching the tween through next/dynamic
 * is what keeps the GSAP chunk off the routes that do not opt in.
 */
const MarqueeMotion = dynamic(() => import("./MarqueeMotion"));

export default function Marquee({
  children,
  speed = 40,
  reverse = false,
  className,
  interactive = false,
}) {
  return (
    <div className={cn("mask-x flex overflow-hidden", className)}>
      <div className="flex min-w-max will-change-transform">
        {children}
        <div aria-hidden="true" className="flex">
          {children}
        </div>
      </div>
      {/* Must stay LAST — MarqueeMotion walks up to this div and expects the
          track to still be firstElementChild. */}
      {interactive && <MarqueeMotion speed={speed} reverse={reverse} />}
    </div>
  );
}
