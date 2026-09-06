"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollSmoother } from "gsap/ScrollSmoother";
import { SplitText } from "gsap/SplitText";
import { DrawSVGPlugin } from "gsap/DrawSVGPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import { MorphSVGPlugin } from "gsap/MorphSVGPlugin";
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
 */
gsap.registerPlugin(
  ScrollTrigger,
  ScrollSmoother,
  SplitText,
  DrawSVGPlugin,
  MotionPathPlugin,
  MorphSVGPlugin,
  ScrambleTextPlugin,
  Draggable,
  InertiaPlugin,
  Observer,
  Flip
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
  DrawSVGPlugin,
  MotionPathPlugin,
  MorphSVGPlugin,
  ScrambleTextPlugin,
  Draggable,
  InertiaPlugin,
  Observer,
  Flip,
};
