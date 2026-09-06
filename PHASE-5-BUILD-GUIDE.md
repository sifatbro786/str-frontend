# STR Solutions — Phase 5 Build Guide (`str-frontend`)

Homepage motion system. Give this file to the VS Code AI assistant as context
**before** it touches this repo. Companion documents: `PHASE-4-BUILD-GUIDE.md`
(admin + data layer, already shipped), `PHASE-3-BUILD-GUIDE.md` (design system).

**Scope of this phase:** the homepage only — `app/(public)/page.js` and the
twelve components it renders, plus the global scroll engine and cursor that live
in the `(public)` layout. Nothing else. No inner-page animation, no case-study
scroll work, no admin changes.

**Rules for the executing assistant**

- Pure JavaScript, `.js` / `.jsx`. No TypeScript. App Router, React 19.
- **Zero animation in `/admin`.** This is enforced architecturally in §3.3 —
  the engine mounts inside `app/(public)/layout.js`, which `/admin` does not
  render. Do not move it to `app/layout.js` "so it is available everywhere".
- Every motion path must have a `prefers-reduced-motion` branch. §17 is not
  optional polish; it is a correctness requirement and Awwwards scores it.
- New dependencies allowed this phase: `gsap` and `@gsap/react` **only**.
- Do not rewrite whole components. Apply the extractions and diffs below.

---

## 0 · Decisions locked for this phase

1. **ScrollSmoother, not Lenis.** Both were on the brief; they are mutually
   exclusive. ScrollSmoother is now free (§2), is written by the same team as
   ScrollTrigger, and needs **zero** proxy wiring for pinning and scrubbing —
   which this homepage does in four places. Lenis would need
   `lenis.on("scroll", ScrollTrigger.update)` plus a ticker bridge, and every
   pin would run through a third-party scroll position. §3.4 documents the Lenis
   swap if you ever need it; do not implement both.

2. **The animated shell is always a client child of a server parent.**
   `HeroSection`, `ServicesBento` and `FeaturedProjects` are `async` server
   components that fetch from the API. They cannot become `"use client"` without
   losing that. §4 is the pattern every section follows. Getting this wrong is
   the single most likely way to break the build.

3. **The Navbar stays outside the smooth wrapper.** `#smooth-content` carries a
   CSS transform, which makes it the containing block for `position: fixed`
   descendants — a fixed header inside it stops being fixed. §3.3 has the exact
   nesting.

4. **`FeaturedProjects` is redesigned, not decorated.** A pinned horizontal
   gallery cannot coexist with the current offset 7/5 column rail. §10 replaces
   the desktop layout and keeps the existing vertical grid as the mobile and
   reduced-motion branch. That is a deliberate design change — read §10 before
   agreeing to it.

5. **`FAQSection` is new and needs a data change.** `faqs` in `lib/data.js` is
   `{ q, a }` with no category. Category tabs require a `category` field. §14.1
   is a real edit to the content layer, not just a component.

6. **Motion serves the copy.** This site's whole voice is "no adjectives, show
   the number". Text should arrive fast and settle — 0.6–0.9s, not 2s hero
   cinematics. Nothing on this page should make a returning visitor wait to read
   something they have already read.

---

## 1 · File manifest

Dependency order. `N` = new, `E` = edit existing, `R` = redesigned.

```
  N  lib/gsap.js                                 plugin registration, one place
  N  components/providers/SmoothScrollProvider.jsx   "use client"
  N  components/providers/CustomCursor.jsx           "use client"
  N  hooks/useIsomorphicLayoutEffect.js
  E  app/(public)/layout.js                      mount engine + cursor
  E  app/globals.css                             cursor + split + FOUC guards

  E  components/Navbar.jsx                       rolling-text hover
  R  components/home/HeroSection.jsx             → server shell + HeroIntro
  N  components/home/HeroIntro.jsx                   "use client"
  N  components/home/HeroPaths.jsx                   "use client"  motion path

  N  components/motion/Marquee.jsx                   "use client"  shared loop
  E  components/home/PartnersBand.jsx            use Marquee
  E  components/home/TechMarquee.jsx             use Marquee

  R  components/home/ServicesBento.jsx           → server shell + BentoGrid
  N  components/home/BentoGrid.jsx                   "use client"

  R  components/home/FeaturedProjects.jsx        → server shell + ProjectsRail
  N  components/home/ProjectsRail.jsx                "use client"  pinned x-scroll

  E  components/home/ProcessSection.jsx          DrawSVG connectors
  N  components/home/ProcessConnector.jsx            "use client"

  E  components/home/MetricsSection.jsx          count-up
  N  components/home/MetricsCounter.jsx              "use client"
  N  components/home/MetricsShader.jsx               "use client"  OPTIONAL, §12.2

  R  components/home/Testimonials.jsx            → server-safe + slider
  N  components/home/TestimonialSlider.jsx           "use client"  Draggable

  N  components/home/FAQSection.jsx                  "use client"  NEW SECTION
  E  lib/data.js                                 add `category` to faqs
  E  app/(public)/page.js                        insert <FAQSection />

  E  components/ui/CTABand.jsx                   pointer-tracked glow
  E  components/Footer.jsx                       curved reveal
```

---

## 2 · Dependencies

```bash
npm i gsap @gsap/react
```

Verified available at the time of writing: `gsap@3.15.0`, `@gsap/react@2.1.2`.

Since **29 April 2025**, following Webflow's acquisition of GreenSock, the
entire GSAP toolset — including every plugin that used to be Club-only — is free
for commercial use and published to the public npm registry. Confirmed present
in `gsap@3.15.0`: `ScrollTrigger`, `ScrollSmoother`, `SplitText`,
`MorphSVGPlugin`, `DrawSVGPlugin`, `MotionPathPlugin`, `ScrambleTextPlugin`,
`Observer`, `Draggable`, `InertiaPlugin`, `Flip`, `CustomEase`.

There is no licence key, no `.npmrc` registry override, and no Club auth step.
If you find a tutorial telling you to add a private registry token, it predates
the change — ignore it.

---

## 3 · The engine

### 3.1 `lib/gsap.js`

One registration site. Importing plugins ad-hoc in components double-registers
them and makes tree-shaking unpredictable.

```js
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

/**
 * Single registration site for the whole app.
 *
 * gsap.registerPlugin is idempotent, but importing plugins from N components
 * means N module graphs referencing them and no single place to audit what the
 * public bundle actually carries. Everything animated imports from here.
 *
 * This module is "use client" — it must never be pulled into a server
 * component. If a server component needs a value from here, it is in the wrong
 * file (see §4).
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
  Observer
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

/** Nudge ScrollTrigger to re-measure once fonts settle — see §17.3. */
if (typeof document !== "undefined" && document.fonts) {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export {
  gsap, ScrollTrigger, ScrollSmoother, SplitText, DrawSVGPlugin,
  MotionPathPlugin, MorphSVGPlugin, ScrambleTextPlugin, Draggable,
  InertiaPlugin, Observer,
};
```

### 3.2 `hooks/useIsomorphicLayoutEffect.js`

```js
import { useEffect, useLayoutEffect } from "react";

/**
 * useLayoutEffect warns during SSR. GSAP setup must run before paint to avoid
 * a flash of un-animated content, so this picks the right one per environment.
 *
 * @gsap/react's useGSAP already does this internally — use this hook only for
 * non-GSAP layout reads (the cursor's pointer listeners, for example).
 */
const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
export default useIsomorphicLayoutEffect;
```

### 3.3 `components/providers/SmoothScrollProvider.jsx`

```jsx
"use client";

import { useRef } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger, ScrollSmoother } from "@/lib/gsap";

/**
 * ScrollSmoother wrapper for the public site.
 *
 * DOM contract (non-negotiable, ScrollSmoother queries these ids):
 *   #smooth-wrapper > #smooth-content > ...page
 *
 * WHAT MUST STAY OUTSIDE THIS COMPONENT:
 *   #smooth-content carries a CSS transform, and a transformed ancestor becomes
 *   the containing block for position:fixed descendants. The Navbar (fixed,
 *   z-50), its mobile overlay, the skip link and the custom cursor therefore
 *   live in the layout OUTSIDE this wrapper. Put the Navbar inside and it will
 *   scroll away with the page — the single most common ScrollSmoother bug.
 *
 * Native scrolling still drives everything (the body keeps its real height and
 * ScrollSmoother translates the content), so Navbar's existing window.scrollY
 * listener keeps working untouched.
 *
 * Rebuilt per route: `dependencies: [pathname]` + `revertOnUpdate` tears the
 * smoother and every ScrollTrigger down on navigation. Without it, triggers
 * from the previous route survive against detached DOM nodes.
 */
export default function SmoothScrollProvider({ children }) {
  const pathname = usePathname();
  const wrapper = useRef(null);
  const content = useRef(null);

  useGSAP(
    () => {
      // Touch devices: native momentum scrolling beats anything we can
      // synthesise, and normalizeScroll on iOS fights the URL bar. Bail out and
      // let ScrollTrigger run against the native scroller.
      const isTouch = window.matchMedia("(hover: none)").matches;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (isTouch || reduced) {
        ScrollTrigger.refresh();
        return;
      }

      const smoother = ScrollSmoother.create({
        wrapper: wrapper.current,
        content: content.current,
        // 1.2 is the ceiling before the page feels detached from the wheel.
        // Anything at 2+ reads as "portfolio site" rather than "studio site".
        smooth: 1.2,
        effects: true,          // enables data-speed / data-lag attributes
        normalizeScroll: true,  // consistent wheel deltas across browsers
        ignoreMobileResize: true,
      });

      return () => smoother.kill();
    },
    { dependencies: [pathname], revertOnUpdate: true }
  );

  return (
    <div id="smooth-wrapper" ref={wrapper}>
      <div id="smooth-content" ref={content}>
        {children}
      </div>
    </div>
  );
}
```

`app/(public)/layout.js` — the mount. Note what is inside the wrapper and what
is not:

```diff
 import Navbar from "@/components/Navbar";
 import Footer from "@/components/Footer";
+import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
+import CustomCursor from "@/components/providers/CustomCursor";

 export default function PublicLayout({ children }) {
   return (
     <>
       <a href="#main" className="sr-only focus:not-sr-only …">Skip to content</a>
+      {/* Fixed elements MUST sit outside #smooth-content — see the note in
+          SmoothScrollProvider. Navbar is `fixed inset-x-0 top-0 z-50`. */}
       <Navbar />
-      <main id="main">{children}</main>
-      <Footer />
+      <CustomCursor />
+      <SmoothScrollProvider>
+        <main id="main">{children}</main>
+        <Footer />
+      </SmoothScrollProvider>
     </>
   );
 }
```

> `/admin` and `/login` render `app/(admin)/layout.js` and `app/(auth)/layout.js`
> respectively. Neither renders this file, so **no GSAP module is reachable from
> the admin bundle at all**. That is the enforcement mechanism for the
> zero-animation rule — verify it with the grep in §18.

`app/globals.css` — add the wrapper guard:

```css
/* ScrollSmoother sets these itself, but declaring them prevents a one-frame
   jump between hydration and smoother creation. */
#smooth-wrapper { overflow: hidden; }
#smooth-content { will-change: transform; }

/* SplitText line masking. `mask: "lines"` wraps each line in a clipping div;
   this is what stops descenders being sheared off during a y-reveal. */
.split-line { overflow: hidden; }
.split-line-inner { display: block; will-change: transform; }
```

### 3.4 If you must use Lenis instead

Do not do both. If ScrollSmoother is ever swapped out, the bridge is:

```js
const lenis = new Lenis({ autoRaf: false });
lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

Everything else in this guide is unchanged — every section below uses plain
ScrollTrigger, not ScrollSmoother-specific APIs, except the `data-speed`
parallax in §7.2 and §16.

---

## 4 · The server/client boundary — read this before writing any section

Three homepage components are `async` server components that `await` the API:

| Component | Fetches |
|---|---|
| `HeroSection` | `getFeaturedProjects(3)` |
| `ServicesBento` | `getServices()` |
| `FeaturedProjects` | `getFeaturedProjects(4)` |

Adding `"use client"` to any of these **breaks the build** — a client component
cannot be `async` and cannot await a server-only data module (`lib/api.js`
imports `lib/apiServer.js`, which imports `next/headers`).

**The pattern, everywhere:** the server component keeps the fetch and passes
plain serialisable data into a client child that owns the markup and the motion.

```jsx
// components/home/ServicesBento.jsx  — SERVER. Fetches. No "use client".
import { getServices } from "@/lib/api";
import BentoGrid from "./BentoGrid";

export default async function ServicesBento() {
  const services = await getServices();
  return <BentoGrid services={services} />;
}
```

```jsx
// components/home/BentoGrid.jsx  — CLIENT. Markup + motion. Receives props.
"use client";
export default function BentoGrid({ services }) { /* … */ }
```

Only pass plain objects. Mongo documents arriving through `lib/api.js` are
already JSON (the API layer parses them), so they serialise cleanly — but do not
pass functions, class instances or `Date` objects across the boundary.

---

## 5 · Global custom cursor

`components/providers/CustomCursor.jsx`. One instance, mounted in the layout,
driven by a tiny global registry so any card can opt into image preview without
prop-drilling a ref through four levels.

```jsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Pointer-following cursor with a trailing ring and an optional image preview.
 *
 * Performance notes that are the whole reason this is not 20 lines:
 *  · gsap.quickTo() compiles a single mutating tween per property instead of
 *    allocating a new tween on every mousemove. At 120Hz that is the difference
 *    between a smooth cursor and a GC sawtooth.
 *  · The dot tracks at 0.15s and the ring at 0.5s. The lag between them IS the
 *    trail — no particle system, no canvas, three DOM nodes total.
 *  · transform only. Never animate left/top here.
 *
 * Opt in from any element (no props, no context):
 *    <a data-cursor="view" data-cursor-image="/websites/paarel-website.png">
 *  data-cursor values: "view" | "drag" | "hide"
 */
export default function CustomCursor() {
  const root = useRef(null);
  const dot = useRef(null);
  const ring = useRef(null);
  const preview = useRef(null);
  const label = useRef(null);

  useGSAP(
    () => {
      // Pointer-coarse devices have no cursor to decorate.
      if (window.matchMedia("(hover: none)").matches) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.set([dot.current, ring.current], { xPercent: -50, yPercent: -50 });
      gsap.set(root.current, { autoAlpha: 0 });

      const xDot = gsap.quickTo(dot.current, "x", { duration: 0.15, ease: "power3" });
      const yDot = gsap.quickTo(dot.current, "y", { duration: 0.15, ease: "power3" });
      const xRing = gsap.quickTo(ring.current, "x", { duration: 0.5, ease: "power3" });
      const yRing = gsap.quickTo(ring.current, "y", { duration: 0.5, ease: "power3" });

      let visible = false;
      const onMove = (e) => {
        if (!visible) {
          visible = true;
          gsap.to(root.current, { autoAlpha: 1, duration: 0.3 });
        }
        xDot(e.clientX); yDot(e.clientY);
        xRing(e.clientX); yRing(e.clientY);
      };

      // Delegated hover: one listener for the whole document, so cards added by
      // a later render (filtered FAQ, slider clones) work with no re-binding.
      const onOver = (e) => {
        const target = e.target.closest("[data-cursor]");
        if (!target) return;
        const mode = target.dataset.cursor;
        const src = target.dataset.cursorImage;

        if (mode === "hide") {
          gsap.to(root.current, { autoAlpha: 0, duration: 0.2 });
          return;
        }
        gsap.to(ring.current, { scale: src ? 0 : 2.4, duration: 0.4 });
        gsap.to(dot.current, { scale: src ? 0 : 1, duration: 0.4 });

        if (src) {
          preview.current.style.backgroundImage = `url("${src}")`;
          label.current.textContent = target.dataset.cursorLabel ?? "View";
          gsap.to(preview.current, { autoAlpha: 1, scale: 1, duration: 0.45, ease: "power4.out" });
        }
      };

      const onOut = (e) => {
        if (!e.target.closest?.("[data-cursor]")) return;
        gsap.to(root.current, { autoAlpha: 1, duration: 0.2 });
        gsap.to(ring.current, { scale: 1, duration: 0.4 });
        gsap.to(dot.current, { scale: 1, duration: 0.4 });
        gsap.to(preview.current, { autoAlpha: 0, scale: 0.85, duration: 0.3 });
      };

      window.addEventListener("mousemove", onMove, { passive: true });
      document.addEventListener("mouseover", onOver);
      document.addEventListener("mouseout", onOut);

      return () => {
        window.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseover", onOver);
        document.removeEventListener("mouseout", onOut);
      };
    },
    { scope: root }
  );

  return (
    <div
      ref={root}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-100 hidden lg:block"
    >
      <div ref={ring} className="absolute size-9 rounded-full border border-(--text-mute)" />
      <div ref={dot} className="absolute size-1.5 rounded-full bg-signal" />
      <div
        ref={preview}
        className="absolute -ml-32 -mt-40 size-64 origin-center scale-[0.85] overflow-hidden border border-(--line) bg-(--raised) bg-cover bg-center opacity-0"
      >
        <span
          ref={label}
          className="label-mono absolute bottom-0 left-0 bg-(--canvas) px-3 py-2 text-(--text)"
        />
      </div>
    </div>
  );
}
```

Add to `globals.css` so the native cursor does not double up on desktop:

```css
@media (hover: hover) and (pointer: fine) {
  /* Keep the native cursor on anything the user types into — replacing an
     I-beam with a dot makes text fields feel broken. */
  body { cursor: none; }
  input, textarea, select, [contenteditable] { cursor: auto; }
}
```

> The `rounded-full` here is deliberate and is the **only** place on the site
> that uses it. Phase 3 §3 forbids rounded corners on *layout* surfaces; a
> cursor is not a layout surface. Everything else stays square.

---

## 6 · Navbar — rolling text

`components/Navbar.jsx` is already `"use client"`. Only the link markup changes:
each item renders its label twice in a clipped box, and the pair translates on
hover. No JS, no GSAP — the whole effect is one transform and it cannot desync.

```jsx
/**
 * Rolling label. The second copy is aria-hidden so the accessible name is not
 * duplicated. Height is locked to 1em so the clip is exact at any font size.
 */
function RollingLabel({ children }) {
  return (
    <span className="relative block h-[1em] overflow-hidden">
      <span className="block transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover/nav:-translate-y-full">
        {children}
      </span>
      <span aria-hidden="true" className="block text-signal">
        {children}
      </span>
    </span>
  );
}
```

Wrap each nav `<Link>` with `group/nav` and swap its text node for
`<RollingLabel>`. Leave the existing `scrolled` state, the mobile sheet and the
`aria-current` logic exactly as they are.

---

## 7 · HeroSection

### 7.1 Split into shell + client intro

`HeroSection.jsx` keeps the `await getFeaturedProjects(3)` and renders
`<HeroIntro strip={strip} />`. Move the entire current JSX into
`components/home/HeroIntro.jsx` with `"use client"` at the top, then animate.

```jsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, SplitText } from "@/lib/gsap";

export default function HeroIntro({ strip }) {
  const root = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      mm.add(
        {
          reduced: "(prefers-reduced-motion: reduce)",
          full: "(prefers-reduced-motion: no-preference)",
        },
        (ctx) => {
          if (ctx.conditions.reduced) {
            // Reduced motion still gets a state change, just not a journey.
            gsap.set("[data-hero-fade]", { autoAlpha: 1 });
            return;
          }

          /**
           * autoSplit + onSplit is REQUIRED here, not optional.
           *
           * General Sans loads from the Fontshare CDN (see globals.css), so it
           * almost always arrives AFTER first paint. A one-shot split measures
           * line boxes in the fallback face, then the real font swaps in and
           * every line break moves — leaving words clipped by their own masks.
           * autoSplit re-splits on font load and on resize; returning the tween
           * from onSplit keeps it time-synced across those re-splits.
           */
          const split = SplitText.create("[data-hero-headline]", {
            type: "lines",
            mask: "lines",
            autoSplit: true,
            linesClass: "split-line-inner",
            onSplit(self) {
              return gsap.from(self.lines, {
                yPercent: 115,
                duration: 0.9,
                stagger: 0.09,
                ease: "power4.out",
              });
            },
          });

          const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
          tl.from("[data-hero-locator] > *", { y: 12, autoAlpha: 0, stagger: 0.05, duration: 0.5 }, 0)
            .from("[data-hero-lede]", { y: 20, autoAlpha: 0, duration: 0.7 }, 0.35)
            .from("[data-hero-actions] > *", { y: 16, autoAlpha: 0, stagger: 0.08, duration: 0.5 }, 0.45)
            .from("[data-hero-caps] li", { autoAlpha: 0, stagger: 0.03, duration: 0.4 }, 0.55)
            .from("[data-hero-strip] > *", { yPercent: 12, autoAlpha: 0, stagger: 0.1, duration: 0.9 }, 0.5);

          return () => split.revert();
        }
      );

      return () => mm.revert();
    },
    { scope: root }
  );

  return (/* current hero JSX, with the data-* hooks added */);
}
```

Add these attributes to the existing markup — no class or layout changes:

| Element | Attribute |
|---|---|
| locator strip `<div>` | `data-hero-locator` |
| `<h1 className="text-display …">` | `data-hero-headline` |
| lede `<p>` | `data-hero-lede` |
| button row `<div>` | `data-hero-actions` |
| capability `<ul>` | `data-hero-caps` |
| evidence strip `<div className="shell mt-14 …">` | `data-hero-strip` |

> **Scrambling vs rolling.** The brief offered both. Use the masked line reveal
> above for the `<h1>`. `ScrambleTextPlugin` on a headline that reads
> *"Software that survives the year after launch"* turns the site's one clear
> sentence into noise for 800ms. If you want scramble, put it on the
> `label-mono` locator strip (`Dhaka, Bangladesh // Est. 2017`), where the text
> is decorative and monospaced — scramble reads as intentional there, and the
> tabular figures mean it cannot reflow.

### 7.2 Background motion paths

`components/home/HeroPaths.jsx` — sits behind the existing `bg-grid` overlay.

```jsx
"use client";
// Inline SVG with 3 hairline bezier paths + 3 small circles.
// MotionPathPlugin moves each circle along its own path on an infinite,
// offset-start yoyo. Opacity ~0.5, stroke = var(--line).
//
//   gsap.to(dot, {
//     motionPath: { path: pathEl, align: pathEl, alignOrigin: [0.5, 0.5] },
//     duration: 14 + i * 3,
//     repeat: -1,
//     ease: "none",
//   });
//
// Also give the wrapper data-speed="0.85" so ScrollSmoother parallaxes it
// behind the copy. Keep it aria-hidden and pointer-events-none.
```

Mount it as the first child of the hero `<section>`, before the `bg-grid` div.
The hero already has `relative overflow-hidden`, so nothing else changes.

---

## 8 · PartnersBand & TechMarquee — one shared loop

`TechMarquee` currently loops in pure CSS (`--animate-marquee` in `globals.css`)
and is genuinely seamless already. It is replaced only because the brief asks
for GSAP tickers and because a shared component gives both bands identical
timing, pause-on-hover, and reduced-motion behaviour.

`components/motion/Marquee.jsx`:

```jsx
"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

/**
 * Seamless infinite rail.
 *
 * The track is rendered twice and translated to exactly -50%, so the reset is
 * invisible. `modifiers` wraps the value rather than restarting the tween,
 * which is what removes the one-frame stutter a repeat:-1 tween shows at the
 * loop boundary.
 *
 * The clone is aria-hidden — otherwise a screen reader reads the whole list
 * twice, which is the accessibility bug in most marquee implementations.
 */
export default function Marquee({ children, speed = 40, reverse = false, className = "" }) {
  const root = useRef(null);

  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      const track = root.current.firstElementChild;
      const wrap = gsap.utils.wrap(-50, 0);

      const tween = gsap.to(track, {
        xPercent: reverse ? 50 : -50,
        ease: "none",
        duration: speed,
        repeat: -1,
        modifiers: { xPercent: (x) => `${wrap(parseFloat(x))}%` },
      });

      // Hover slows rather than stops: a hard pause makes the band feel broken.
      const slow = () => gsap.to(tween, { timeScale: 0.25, duration: 0.4 });
      const resume = () => gsap.to(tween, { timeScale: 1, duration: 0.4 });
      root.current.addEventListener("mouseenter", slow);
      root.current.addEventListener("mouseleave", resume);

      return () => {
        root.current?.removeEventListener("mouseenter", slow);
        root.current?.removeEventListener("mouseleave", resume);
      };
    },
    { scope: root }
  );

  return (
    <div ref={root} className={`mask-x flex overflow-hidden ${className}`}>
      <div className="flex min-w-max will-change-transform">
        {children}
        <div aria-hidden="true" className="flex">{children}</div>
      </div>
    </div>
  );
}
```

**`PartnersBand.jsx`** — replace the `<ul className="grid …">` with a single
`<Marquee speed={45}>` wrapping the eight logos as a flex row. Keep the
`label-mono` caption to the left; it does not scroll. Keep the existing
`grayscale` / `dark:invert` treatment and `next/image` sizing exactly as is.

**`TechMarquee.jsx`** — replace the local `Rail` with
`<Marquee speed={38}>` and `<Marquee speed={52} reverse>`. Delete `Rail`.

**Then clean up the CSS it leaves behind.** `TechMarquee` is the *only* consumer
of the CSS marquee — verify before deleting:

```bash
grep -rn "animate-marquee" components/ app/    # → must return nothing after the swap
```

Once it does, remove from `globals.css`: the `--animate-marquee` and
`--animate-marquee-slow` entries in `@theme`, the `@keyframes marquee` block,
and the `.animate-marquee` / `.animate-marquee-slow` rules inside the
`prefers-reduced-motion` media query (the new `<Marquee>` handles reduced motion
in JS). **Keep `@utility mask-x`** — the new component still uses it for the
edge fade.

---

## 9 · ServicesBento

Split per §4 into `ServicesBento.jsx` (server, fetches) + `BentoGrid.jsx`
(client, animates). The grid markup, `SPANS` array and 1px-gap hairline
technique are unchanged.

```jsx
useGSAP(() => {
  const mm = gsap.matchMedia();
  mm.add("(prefers-reduced-motion: no-preference)", () => {
    // Scrubbed reveal: cards rise and settle as the block crosses the viewport.
    // `stagger.from: "start"` keeps reading order — the bento's visual order and
    // Service.order agree, and the animation must not contradict that.
    gsap.from("[data-bento-cell]", {
      yPercent: 8,
      autoAlpha: 0,
      duration: 1,
      stagger: { each: 0.06, from: "start" },
      scrollTrigger: {
        trigger: "[data-bento-grid]",
        start: "top 82%",
        end: "top 35%",
        scrub: 0.6,
      },
    });
  });
  return () => mm.revert();
}, { scope: root });
```

Add `data-bento-grid` to the grid wrapper and `data-bento-cell` to each `<Link>`.

**On the "morphing hairline borders" item.** The bento's hairlines are the 1px
grid gap over a `--line` background — they are CSS, not SVG, and there is no
path to morph. Morphing them would mean rebuilding the whole block as an SVG and
losing the technique Phase 3 chose deliberately. Two honest substitutions that
deliver the same intent:

1. **`DrawSVGPlugin` corner brackets.** Give each cell an absolutely positioned
   inline SVG with two 20px L-shaped strokes at opposing corners, drawn from 0%
   to 100% on hover. Reads as precision engineering and matches the site voice.
2. **`MorphSVGPlugin` on the service icon.** `Service.icon` holds a lucide key.
   Morph between the outline and a filled variant on hover. This is where a real
   shape morph earns its place.

Implement (1); treat (2) as optional and only if the icon set is finalised.

---

## 10 · FeaturedProjects — pinned horizontal gallery

**Read this before implementing.** The current section is a deliberate offset
editorial rail: cells alternate `lg:col-span-7` / `lg:col-span-5` and the narrow
ones are pushed down `lg:mt-28`, so the eye travels diagonally. That comment in
the file explicitly warns against flattening it into "the grid every generated
portfolio ships with". A pinned horizontal gallery replaces it with a
*different* strong idea, not a weaker one — but it is a design decision, not a
decoration. Confirm before you delete the offset layout.

Split per §4. `ProjectsRail.jsx`:

```jsx
"use client";

export default function ProjectsRail({ items }) {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();

      // Desktop + motion allowed → pin and scrub horizontally.
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const distance = () => track.current.scrollWidth - window.innerWidth;

        const tween = gsap.to(track.current, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: root.current,
            start: "top top",
            // Pin length == horizontal distance, so the wheel-to-travel ratio
            // is 1:1 and the section cannot feel sticky or overlong.
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            anticipatePin: 1,
            invalidateOnRefresh: true,
          },
        });

        // Image mask: each cover unmasks as its card enters the viewport.
        // clipPath inset animates on the compositor and does not reflow.
        gsap.utils.toArray("[data-rail-cover]").forEach((cover) => {
          gsap.fromTo(
            cover,
            { clipPath: "inset(0% 0% 100% 0%)" },
            {
              clipPath: "inset(0% 0% 0% 0%)",
              ease: "power2.out",
              scrollTrigger: {
                trigger: cover,
                containerAnimation: tween, // REQUIRED for horizontal triggers
                start: "left 85%",
                end: "left 45%",
                scrub: true,
              },
            }
          );
        });
      });

      // Mobile / reduced motion → the existing vertical grid, no pin at all.
      return () => mm.revert();
    },
    { scope: root }
  );
  /* … */
}
```

Three things that will bite:

- **`containerAnimation` is mandatory** for any ScrollTrigger whose trigger
  moves horizontally inside the pinned tween. Without it the start/end are
  measured against vertical scroll and every mask fires at once, on load.
- **`invalidateOnRefresh: true`** — `distance()` depends on `window.innerWidth`.
  Without this the pin length is frozen at first measurement and breaks on
  resize and on orientation change.
- **`anticipatePin: 1`** removes the half-frame jump at pin start on trackpads.

Each card carries the cursor hooks from §5:

```jsx
<Link
  href={`/projects/${p.slug}`}
  data-cursor="view"
  data-cursor-image={p.coverImage}
  data-cursor-label="Case study"
>
```

Keep `next/image` with `sizes` accurate for the horizontal layout (roughly
`(max-width: 1024px) 100vw, 42vw`) — a pinned rail renders every card at once,
so a wrong `sizes` here downloads four full-width images on first paint.

---

## 11 · ProcessSection — drawn connectors

`ProcessSection` is a static server component reading `processSteps`. It stays a
server component; add a small client child.

`components/home/ProcessConnector.jsx` renders an absolutely positioned inline
SVG down the left edge of the `<ol>` — a vertical hairline with a gentle bezier
kink at each step boundary — and draws it on scroll:

```jsx
gsap.fromTo(
  pathRef.current,
  { drawSVG: "0%" },
  {
    drawSVG: "100%",
    ease: "none",
    scrollTrigger: { trigger: listRef, start: "top 70%", end: "bottom 70%", scrub: 0.8 },
  }
);
```

Each step's `label-mono` index (`01`, `02`…) gets a small circle node on the
path that scales from 0 as the line passes it. Stroke is `var(--line)`; the
drawn portion is `var(--color-signal)` at 40% opacity. Keep `aria-hidden="true"`
on the whole SVG — it is decoration; the `<ol>` already conveys the sequence.

---

## 12 · MetricsSection

### 12.1 Count-up (do this one)

The Phase 3 file already predicted this: values are split into `value` and
`suffix` in `lib/data.js` precisely so the animator only touches the number
node, and `.nums` gives tabular figures so the row cannot reflow mid-count.

`components/home/MetricsCounter.jsx`:

```jsx
"use client";

export default function MetricsCounter({ value, suffix }) {
  const el = useRef(null);

  useGSAP(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.current.textContent = value;
      return;
    }
    const obj = { n: 0 };
    gsap.to(obj, {
      n: value,
      duration: 1.6,
      ease: "power2.out",
      snap: { n: 1 },
      onUpdate: () => { el.current.textContent = obj.n; },
      scrollTrigger: { trigger: el.current, start: "top 85%", once: true },
    });
  }, { scope: el });

  return <span ref={el}>0</span>;
}
```

Swap `{m.value}` for `<MetricsCounter value={m.value} suffix={m.suffix} />` in
`MetricsSection.jsx`; the `<span className="text-signal">{m.suffix}</span>`
stays exactly where it is. `once: true` matters — a metric that re-counts every
time you scroll past reads as a glitch, not a flourish.

### 12.2 Shader (optional — implement last, or not at all)

The brief asks for "shader on scroll" on the inverted band. Be clear-eyed about
the trade:

- A real WebGL shader means either a ~150KB dependency (`three`) or ~60 lines of
  raw WebGL you now maintain, plus a canvas that repaints on every scroll frame
  behind your highest-contrast text.
- The band is `bg-(--text) text-(--canvas)` — pure inversion is already the
  strongest contrast moment on the page. A shader competes with the numbers.

**Recommended:** skip WebGL. Get 90% of the effect with a scrubbed CSS gradient
on a pseudo-element — a soft radial highlight whose position and opacity are
driven by the section's ScrollTrigger progress. No dependency, no canvas, no
battery cost, and it degrades to a flat band under reduced motion.

```js
gsap.to("[data-metrics-glow]", {
  "--glow-x": "80%", opacity: 0.18, ease: "none",
  scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true },
});
```

If a genuine shader is non-negotiable, write it with raw WebGL in a single
`MetricsShader.jsx`, cap it at `devicePixelRatio` 1.5, pause the RAF loop via
`ScrollTrigger.onToggle` when the band is offscreen, and skip it entirely on
`(hover: none)`. Do not add `three` for one gradient.

---

## 13 · Testimonials — draggable slider

`Testimonials` fetches (`getTestimonials`, `getProjects`) — split per §4.
`TestimonialSlider.jsx` uses `Draggable` + `InertiaPlugin`:

```jsx
Draggable.create(track.current, {
  type: "x",
  bounds: { minX: -(track.current.scrollWidth - wrapper.current.offsetWidth), maxX: 0 },
  inertia: true,
  edgeResistance: 0.85,
  cursor: "grab",
  activeCursor: "grabbing",
  allowNativeTouchScrolling: true, // vertical page scroll must still work on touch
});
```

- Put `data-cursor="drag"` on the wrapper so the custom cursor swaps to a drag
  affordance.
- Keep the existing lead-quote / supporting-cards hierarchy — the current
  component gives the first testimonial visual primacy, and a uniform carousel
  would flatten that. Slide only the supporting cards.
- **Keyboard:** `Draggable` gives you nothing for keyboard users. Add left/right
  arrow buttons that `gsap.to(track, { x: … })` by one card width, and make the
  track `tabIndex={0}` with `onKeyDown` for Arrow keys. A drag-only carousel is
  an accessibility failure.
- `allowNativeTouchScrolling: true` is what stops the slider from trapping
  vertical page scroll on phones.

---

## 14 · FAQSection (new)

### 14.1 Data change first

`lib/data.js` — `faqs` currently has no category. Add one to each of the six
entries. Suggested mapping against the existing copy:

| Question | `category` |
|---|---|
| How do you price a project? | `General` |
| What does a typical timeline look like? | `Process` |
| Do you work with clients outside Bangladesh? | `General` |
| Who owns the code and the design files? | `Tech` |
| Can you take over a project someone else started? | `Tech` |
| What happens after launch? | `Process` |

```diff
 export const faqs = [
   {
+    category: "General",
     q: "How do you price a project?",
```

`app/(public)/contact/page.js` already imports `faqs` and renders them — adding
a field is additive and will not break it. Check that page still renders after
the edit.

### 14.2 The component

`components/home/FAQSection.jsx`, `"use client"`. Two interactions:

**Category tabs** — filter with GSAP `Flip` so rows animate to their new
positions instead of snapping:

```jsx
const state = Flip.getState("[data-faq-item]");
setActive(next);                       // React re-renders the filtered list
// after commit:
Flip.from(state, { duration: 0.5, ease: "power3.out", stagger: 0.03,
                   absolute: true, onEnter: (el) => gsap.from(el, { opacity: 0, y: 12 }),
                   onLeave: (el) => gsap.to(el, { opacity: 0, y: -12 }) });
```

Run `Flip.from` inside `useGSAP` with `dependencies: [active]` so it fires after
React commits, not before.

**Accordion** — animate `height: auto` correctly:

```jsx
gsap.to(panel, { height: open ? "auto" : 0, duration: 0.45, ease: "power3.inOut" });
gsap.to(arrow, { rotate: open ? 45 : 0, duration: 0.45 });
```

GSAP resolves `height: "auto"` by measuring, so this is safe — but the panel
must have `overflow: hidden` and start at `height: 0`.

Accessibility, not optional:

- Each question is a `<button aria-expanded aria-controls>`; each panel has a
  matching `id` and `role="region"`.
- Tabs are real `<button>`s with `aria-pressed`, not `<div>`s.
- The `+` → `×` arrow is a two-line inline SVG rotated 45°, `aria-hidden`.

Section chrome matches the rest of the page: `SectionIndex index="05"`,
hairline `border-b border-(--line)` rows, `label-mono` tab labels. Insert into
`app/(public)/page.js` between `<Testimonials />` and `<ContactCTA />`, and
renumber `ContactCTA`'s section index if it carries one.

---

## 15 · ContactCTA

The brief offered "image sequence or interactive high-contrast form glow". There
is no image sequence in `public/` and shooting one is out of scope — implement
the glow.

`CTABand.jsx` is shared with inner pages, so gate the effect behind a prop
(`interactive`) that only `ContactCTA` passes. Track the pointer over the band
and move a soft radial highlight with `quickTo`:

```js
const x = gsap.quickTo(glow, "--x", { duration: 0.6, ease: "power3" });
```

The band is already `bg-(--text) text-(--canvas)` with an existing
`opacity-[0.07]` decorative panel — reuse that layer rather than adding another.
Entrance: split the `<h2>` by lines with the same masked reveal as §7.1, on a
`start: "top 75%"` trigger, `once: true`.

---

## 16 · Footer

Curved reveal on scroll completion:

- Add an inline SVG arc above the footer's top border — a shallow curve whose
  `d` morphs from bowed-down to flat as the footer enters view
  (`MorphSVGPlugin`, or animate the control point with a plain tween on a
  `path` attribute — cheaper and enough for one arc).
- Give the footer's inner content `data-speed="0.95"` so ScrollSmoother
  parallaxes it slightly against the arc.
- Trigger: `start: "top bottom"`, `end: "top 80%"`, `scrub: true`.

Keep it subtle. This is the last thing on the page and a bouncing footer
undermines the "handed over, not held hostage" tone the copy works hard for.

---

## 17 · Reduced motion & accessibility

### 17.1 The one pattern

Every animated component wraps its setup in `gsap.matchMedia()`:

```js
const mm = gsap.matchMedia();
mm.add("(prefers-reduced-motion: no-preference)", () => { /* motion */ });
return () => mm.revert();
```

`mm.revert()` restores every property GSAP touched. This is what makes the
reduced-motion branch a genuinely different page rather than the same page with
`animation: none` bolted on.

### 17.2 Non-negotiables

- Content is **never** hidden behind a trigger that might not fire. Animate
  `from` a visible resting state, or set the hidden state inside the same
  `matchMedia` block that animates it back. If JS fails, the page must read.
- `SplitText` sets `aria` handling automatically (`aria: "auto"`), which keeps
  the original text available to screen readers. Do not set `aria: "none"`.
- Marquee clones and all decorative SVG carry `aria-hidden="true"`.
- The custom cursor never replaces focus outlines. Keyboard users must still see
  `:focus-visible` rings — check `globals.css` still applies them.

### 17.3 Layout-shift traps specific to this codebase

- **General Sans loads from a CDN.** Any `SplitText` on a heading needs
  `autoSplit: true` (§7.1). `lib/gsap.js` also calls `ScrollTrigger.refresh()`
  on `document.fonts.ready`.
- **`next/image` with `fill`** reserves space via the parent's aspect ratio, so
  it does not shift — but images finishing late still change nothing about
  measured trigger positions *only* because of that. Do not remove the aspect
  wrappers.
- Call `ScrollTrigger.refresh()` after any layout-affecting state change that
  GSAP did not cause (the FAQ filter is the one on this page — `Flip` handles it,
  but refresh after the accordion opens if a pin sits below it).

---

## 18 · Verification

```bash
npm run dev
```

**Admin isolation — the one that must never regress**

```bash
# No GSAP import may be reachable from the admin or auth trees.
grep -rn "gsap\|@gsap/react\|ScrollSmoother\|SplitText" "app/(admin)" "app/(auth)" components/admin/
# → must return nothing

# The engine must be mounted in (public) only.
grep -rn "SmoothScrollProvider\|CustomCursor" app/
# → only app/(public)/layout.js
```

- [ ] `/admin`, `/admin/projects`, `/login` scroll natively — no smoothing, no
      custom cursor, no `#smooth-wrapper` in the DOM
- [ ] `npm run build` — check the route table: `/admin/*` First Load JS must not
      grow versus Phase 4. If it did, a GSAP import leaked across the boundary.

**Homepage**

- [ ] Hard reload `/` three times — the hero headline never renders clipped or
      invisible, and never double-splits after the CDN font swaps in
- [ ] Resize from 1440 → 375 with the page mid-scroll: the pinned rail
      un-pins below `lg`, nothing overlaps, no horizontal body scroll
- [ ] Scroll to the projects rail, resize the window, scroll back — the pin
      length recalculates (`invalidateOnRefresh`)
- [ ] Marquees loop with no visible seam or stutter at the wrap point
- [ ] Metrics count once and do not re-run on scroll-back
- [ ] Testimonials drag with the mouse, throw with inertia, and still allow
      vertical page scroll on touch; arrow keys move one card
- [ ] FAQ tabs re-flow with Flip; accordion opens to full height with no clip;
      `aria-expanded` flips
- [ ] Navigate `/` → `/projects` → back: no console warnings about ScrollTrigger
      on detached nodes, smoother recreated once

**Reduced motion** — DevTools → Rendering → Emulate `prefers-reduced-motion`

- [ ] Every section is fully readable with all content visible
- [ ] No smoothing, no cursor, no marquee movement, no pinning
- [ ] Metrics show final values immediately

**Performance** — Lighthouse on `/`, mobile preset

- [ ] CLS < 0.05 (font swap + split is the risk)
- [ ] No long task > 200ms during hero entrance
- [ ] DevTools Performance while scrolling the pinned rail: no layout thrash;
      transforms and `clip-path` only

---

## 19 · Out of scope for Phase 5

Do not build these now, and do not scaffold them:

- **Any inner page.** `/projects/[slug]` has `accentColor`, `layoutStyle` and
  `animationTrigger` stored and returned by the API since Phase 4, still unread.
  That is the next phase, not this one.
- **Page transition animations** between routes. The smoother teardown in §3.3
  is correct as-is; a transition layer changes how every route mounts.
- **`three.js` / WebGL beyond §12.2's optional shader.**
- **Scroll-driven video or image sequences.** No assets exist.
- **`ProjectRail` on `/projects`.** It is a client filter component, not a
  marquee, and it is untouched this phase — the `/projects` page keeps its
  Phase 3 behaviour until the inner-page phase.
