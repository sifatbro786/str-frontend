"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { ScrambleTextPlugin } from "gsap/ScrambleTextPlugin";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { Observer } from "gsap/Observer";
import { Flip } from "gsap/Flip";

/**
 * Single registration site for the whole app.
 *
 * gsap.registerPlugin is idempotent, but importing plugins from N components
 * means N module graphs referencing them and no single place to audit what the
 * public bundle actually carries. Everything animated imports from here.
 *
 * This module is "use client" — it must never be pulled into a server
 * component. If a server component needs a value from here, it is in the wrong
 * file (see PHASE-5-BUILD-GUIDE §4).
 *
 * ── ⚑ NOTHING UNUSED GOES IN THIS LIST ───────────────────────────────────
 * Every component that animates imports `gsap` from here, so this module is in
 * the bundle of every public page — and a registerPlugin argument is a live
 * reference, which means the plugin cannot be tree-shaken away. It is
 * downloaded, parsed and executed on the main thread whether or not a single
 * tween uses it.
 *
 * DrawSVGPlugin, MotionPathPlugin and MorphSVGPlugin were registered here and
 * used by nothing. MorphSVG is one of the largest plugins in the library. They
 * cost roughly 40 KB of parse-and-execute on every page for no animation at
 * all, which is most of what Lighthouse was reporting as Total Blocking Time
 * on /services. They are named in a couple of comments explaining why a hand
 * written path was chosen INSTEAD of them — that is not usage.
 *
 * Before adding one back, confirm a component actually calls it. `grep` for
 * the plugin name and for its tween property (morphSVG, drawSVG, motionPath);
 * a hit in a comment does not count.
 */
gsap.registerPlugin(
    ScrollTrigger,
    ScrollSmoother,
    SplitText,
    ScrambleTextPlugin,
    Draggable,
    InertiaPlugin,
    Observer,
    Flip,
);

/**
 * Project-wide defaults. Every tween inherits these unless it overrides them,
 * which is how the whole page ends up feeling like one system instead of
 * fourteen developers' preferences.
 *
 * power3.out is the house curve: fast departure, long settle. 0.8s is the
 * longest a piece of TEXT should ever take to arrive on this site.
 */
gsap.defaults({ ease: "power3.out", duration: 0.8 });

/**
 * Nudge ScrollTrigger to re-measure once fonts settle.
 *
 * General Sans loads from the Fontshare CDN, so it lands after first paint and
 * every measured trigger position shifts when it swaps in. See §17.3.
 */
if (typeof document !== "undefined" && document.fonts) {
    document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export {
    gsap,
    ScrollTrigger,
    ScrollSmoother,
    SplitText,
    ScrambleTextPlugin,
    Draggable,
    InertiaPlugin,
    Observer,
    Flip,
};
