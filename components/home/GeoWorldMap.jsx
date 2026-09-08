"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import {
  DISCIPLINES,
  GRATICULE_PATH,
  HEIGHT,
  LAND_PATHS,
  SPHERE_PATH,
  WIDTH,
  layout,
} from "@/lib/heroMap";

/**
 * Global service network — a Dhaka-centred azimuthal equidistant map.
 *
 * ── WHY IT IS NOT A RECTANGULAR WORLD MAP ────────────────────────────────
 * It was: geoEqualEarth, grey continents, a ring of identical blue pins. That
 * is the default output of react-simple-maps and it is on hundreds of agency
 * sites, which is exactly the problem — the graphic carrying the top of the
 * homepage was the one element on the page that said nothing specific about
 * this studio.
 *
 * The geometry now does. lib/heroMap.js has the full reasoning; the short
 * version is that this projection is centred on the studio, so distance from
 * the middle of the graphic IS distance from Dhaka, and the shortest real
 * route to anywhere is a straight line out of the centre. The rings are
 * genuine isolines and the number on each pin is the true great-circle
 * distance. Recentre it on another city and it is a visibly different picture,
 * which is the property a rectangular map with relocated pins does not have.
 *
 * ── WHY THE MAP IS CARTOGRAPHIC AND THE REST OF THE SITE IS NOT ──────────
 * Land and ocean read as land and ocean — a pale blue and a warm sand, not
 * two greys off the brand ramp. This is the one graphic on the site allowed
 * to break the monochrome, because a map drawn in card-greys reads as a
 * diagram of a map rather than as a place. The palette is five CSS tokens
 * defined once in globals.css (--map-ocean, --map-land, --map-border,
 * --map-graticule, --map-ring), so changing it — to a full atlas green, or
 * back to monochrome — is an edit in one file that this component never
 * needs to know about.
 *
 * ── WHY THERE ARE THREE COLOURS NOW ──────────────────────────────────────
 * The old map had one accent, so every pin said "we are here" and no more.
 * Each market is coloured by the discipline that actually ships there, which
 * turns a presence map into a capability map at no cost in ink. The
 * distribution is deliberately not balanced for looks — four engineering
 * markets, one visualization, one production is what is true.
 *
 * The colour runs through three things at once: the pin, the spoke, and the
 * country itself, which is tinted where STR works. lib/heroMap owns the
 * country-to-discipline map and carries the note about what that tint does to
 * the United States on this projection — read it before changing either.
 *
 * ── WHAT CARRIES OVER FROM THE OLD VERSION ───────────────────────────────
 * The topojson is imported rather than fetched, so the largest element above
 * the fold never waits on a third-party CDN. The landmass is non-interactive.
 * The projected coordinates carry suppressHydrationWarning. All three notes
 * are kept below where they apply, because all three are still load-bearing.
 *
 * What did NOT carry over is react-simple-maps. Once the projection had to be
 * built by hand — it is the only way to set clipAngle, which is what makes
 * this a disc — the library was wrapping three SVG elements and resolving a
 * topology in an effect that cost more than it saved. See lib/heroMap.js.
 */

/* Resolved once at module scope. layout() is pure and deterministic, so server
   and client compute the same positions, and the projection pass does not
   re-run on every hover. */
const MAP = layout();
const { markets, center, rings } = MAP;
const [CX, CY] = center;

/* Hover card geometry, in SVG user units. Fixed rather than measured: getBBox
   can only run once the webfont has landed, and a card that resizes itself a
   second after first paint is worse than one a few pixels wider than it needs
   to be. */
const CARD_W = 196;
const CARD_H = 56;

/**
 * The landmass.
 *
 * ── WHY THIS IS PLAIN <path> AND NOT <Geographies> ───────────────────────
 * react-simple-maps resolves its topology in an effect, so on the server it
 * renders nothing and the countries appear only after hydration. lib/heroMap
 * now projects them at module scope instead, which puts them in the server
 * HTML and removes the effect, the null first render and the memo() that used
 * to be needed to stop 240 paths being reconciled on every hover.
 *
 * pointerEvents="none": the countries are decoration. Leaving them
 * hit-testable means point-in-path against 240 complex paths on every
 * mousemove, and it lets a country swallow a pin's hover where their bounding
 * boxes overlap.
 *
 * shapeRendering="optimizeSpeed" drops antialiasing on the fills. At this size
 * the borders are drawn by the 0.5px stroke rather than the fill edges, so the
 * visible difference is nil and the rasterisation is materially cheaper.
 */
function Land() {
  return (
    <g data-land="" pointerEvents="none" shapeRendering="optimizeSpeed">
      {LAND_PATHS.map((country, i) => {
        const tint = country.discipline
          ? DISCIPLINES[country.discipline].color
          : null;

        return (
          <path
            key={i}
            d={country.d}
            fill={tint ?? "var(--map-land)"}
            /* The tint is the brand colour at partial alpha, not a
               pre-mixed pale variant. Alpha lets the same value work on
               the light sand and the dark olive without a second palette,
               and it keeps the country reading as land with colour on it
               rather than as a flat sticker laid over the map. The opacity
               itself is a token because the two themes need different
               values — see globals.css. */
            fillOpacity={tint ? "var(--map-tint-opacity)" : 1}
            stroke="var(--map-border)"
            strokeWidth={0.5}
          />
        );
      })}
    </g>
  );
}

export default function GeoWorldMap({ className }) {
  const root = useRef(null);
  const [active, setActive] = useState(null);

  useGSAP(
    () => {
      const reduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const q = gsap.utils.selector(root);
      const spokes = q("[data-spoke]");
      const pins = q("[data-pin]");
      const chips = q("[data-chip]");
      const ringEls = q("[data-ring]");

      if (reduced) {
        gsap.set([...spokes, ...pins, ...chips, ...ringEls], {
          opacity: 1,
          scale: 1,
        });
        return;
      }

      // Arm the draw-on. See the note on data-length in the markup.
      spokes.forEach((el) => {
        const length = Number(el.dataset.length);
        gsap.set(el, { strokeDasharray: length, strokeDashoffset: length });
      });

      /* The landmass is deliberately not animated, but the reason is now
               taste rather than mechanics. It used to be impossible: while the
               countries came from <Geographies> they were not in the DOM on the
               commit where this hook runs, so any selector for them returned
               empty and the tween silently did nothing. They are plain markup
               now and could be tweened — they are not, because the map should
               read as a stable ground with things arriving ON it, and fading in
               240 country paths behind the pins is motion nobody asked for. */
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.from(ringEls, { opacity: 0, duration: 0.6, stagger: 0.08 }, 0.1)
        /* Each spoke draws from the studio outward. strokeDashoffset,
                   not scaleX: a scaled line scales its own stroke width with it
                   and arrives thicker than it started, and it would also have to
                   be rotated into place per market. The dash is armed above
                   from each line's own true length. */
        .to(spokes, { strokeDashoffset: 0, duration: 0.7, stagger: 0.09 }, 0.25)
        /* transformOrigin is explicit: an SVG group's default origin is
                   the user-space origin at (0,0), so scaling a pin without it
                   throws the pin across the map instead of growing it in place. */
        .fromTo(
          pins,
          { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" },
          {
            opacity: 1,
            scale: 1,
            duration: 0.45,
            ease: "back.out(2.2)",
            stagger: 0.09,
            transformOrigin: "50% 50%",
          },
          0.5,
        )
        .from(chips, { opacity: 0, y: 5, duration: 0.4, stagger: 0.09 }, 0.65);

      const halo = root.current?.querySelector("[data-halo]");
      if (halo) {
        gsap.fromTo(
          halo,
          { scale: 0.6, opacity: 0.55 },
          {
            scale: 2.8,
            opacity: 0,
            duration: 2.6,
            ease: "power2.out",
            repeat: -1,
            delay: 1.4,
            transformOrigin: "50% 50%",
          },
        );
      }

      return () => tl.kill();
    },
    { scope: root },
  );

  /* The hover card animates on `active`, in its own context. Deliberately not
       a CSS transition: it has to be able to reverse cleanly on a fast
       mouse-out, and a transition-delay chain that does that correctly is more
       fragile than one timeline with overwrite. */
  useGSAP(
    () => {
      const card = root.current?.querySelector(`[data-card="${active}"]`);
      if (!card) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(card, { opacity: 1, y: 0 });
        return;
      }

      const tl = gsap.fromTo(
        card,
        { opacity: 0, y: 5 },
        { opacity: 1, y: 0, duration: 0.22, ease: "power3.out" },
      );
      return () => tl.kill();
    },
    { scope: root, dependencies: [active] },
  );

  return (
    <div ref={root} className={className}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        style={{ width: "100%", height: "auto" }}
        role="img"
        aria-label={`Service network centred on Dhaka. ${markets
          .map(
            (m) =>
              `${m.name}, ${m.distance}, ${DISCIPLINES[m.discipline].label}`,
          )
          .join(". ")}`}
      >
        {/* The projection's own outline. With clipAngle set this is the
                    disc, so it paints the ocean and draws the edge in one node
                    and can never drift out of sync with the clip. */}
        <path
          id="hero-map-sphere"
          d={SPHERE_PATH}
          fill="var(--map-ocean)"
          stroke="var(--line)"
          strokeWidth={1}
        />
        <path
          d={GRATICULE_PATH}
          fill="none"
          stroke="var(--map-graticule)"
          strokeWidth={0.5}
          opacity={0.9}
          pointerEvents="none"
        />
        <Land />

        {/* ── Distance rings ──────────────────────────────────────
                    Real isolines: every point on one is genuinely that far from
                    the studio, because distance is linear on this projection.
                    The labels run due east from the centre, which is the one
                    bearing with no market on it, and reads as the scale bar it
                    effectively is. */}
        <g pointerEvents="none">
          {rings.map((ring) => (
            <g key={ring.km} data-ring="">
              <circle
                cx={CX}
                cy={CY}
                r={ring.r}
                fill="none"
                stroke="var(--map-ring)"
                strokeWidth={0.8}
                strokeDasharray="2 6"
                opacity={0.55}
                vectorEffect="non-scaling-stroke"
              />
              {/* Painted backing rather than a stroke halo: a
                                paint-order outline is unevenly supported and a
                                stroked duplicate doubles the text node. */}
              <rect
                x={CX + ring.r - 30}
                y={CY - 8}
                width={60}
                height={16}
                rx={8}
                fill="var(--map-ocean)"
                opacity={0.85}
              />
              <text
                x={CX + ring.r}
                y={CY + 3.4}
                textAnchor="middle"
                fontSize={9.5}
                fill="var(--text-mute)"
                className="select-none"
              >
                {ring.label}
              </text>
            </g>
          ))}
        </g>

        {/* ── Spokes ──────────────────────────────────────────────
                    Straight, not arced. On an azimuthal equidistant projection
                    the great circle from the centre to any point already IS a
                    straight line, so a curve here would be decoration drawn on
                    top of a truth. Coloured by discipline, so the lines carry
                    the same information as the pins. */}
        <g pointerEvents="none">
          {markets
            .filter((m) => !m.home)
            .map((m) => {
              const length = Math.hypot(m.x - CX, m.y - CY);
              return (
                <line
                  key={m.code}
                  data-spoke=""
                  suppressHydrationWarning
                  x1={CX}
                  y1={CY}
                  x2={m.x}
                  y2={m.y}
                  stroke={DISCIPLINES[m.discipline].color}
                  strokeWidth={1.3}
                  /* The dash that drives the draw-on is set by
                                       GSAP, not here. Writing strokeDashoffset
                                       into the markup would leave every spoke
                                       invisible for anyone whose JS never runs —
                                       hidden-by-JS fails open, hidden-by-markup
                                       fails closed. The length travels on a data
                                       attribute so the hook does not have to
                                       recompute it. */
                  data-length={length}
                  opacity={active === m.code ? 1 : 0.55}
                  vectorEffect="non-scaling-stroke"
                  className="transition-opacity duration-200"
                />
              );
            })}
        </g>

        {/* ── Labels ──────────────────────────────────────────────
            Chip and pin are separate nodes at separate coordinates, joined by a
            hairline leader. lib/heroMap places the chips radially and pushes
            them apart until none overlap — the pins cluster hard around the
            Gulf and South-East Asia, and a label sitting under a neighbouring
            label is the failure this graphic is most likely to ship with.

            ── WHY EVERY CHIP IS DRAWN BEFORE EVERY PIN ──────────────────────
            These used to be one <g> per market, chip and pin together. SVG has
            no z-index — paint order is document order — so market N+1's opaque
            chip painted straight over market N's pin, and Australia's dot
            vanished under Singapore's label. Sorting the markets could not fix
            it: any order that puts one market's chip after another's pin can
            hide it. Layers can, and only layers can. Chips here, pins after. */}
        <g pointerEvents="none">
          {markets.map((m) => {
            const label = m.label;
            return (
              <g key={m.code}>
                <line
                  suppressHydrationWarning
                  x1={m.x}
                  y1={m.y}
                  x2={label.x}
                  y2={label.y}
                  stroke="var(--line)"
                  strokeWidth={1}
                  vectorEffect="non-scaling-stroke"
                />
                {/* Always visible: a map whose labels appear only on hover says
                    nothing in a screenshot, and nothing at all on a phone. */}
                <g data-chip="" opacity={active === m.code ? 0 : 1}>
                  <rect
                    suppressHydrationWarning
                    x={label.x - label.w / 2}
                    y={label.y - 11}
                    width={label.w}
                    height={22}
                    rx={11}
                    fill="var(--canvas)"
                    stroke="var(--line)"
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    suppressHydrationWarning
                    x={label.x}
                    y={label.y + 3.8}
                    textAnchor="middle"
                    fontSize={10.5}
                    className="select-none"
                  >
                    <tspan fill="var(--text)" fontWeight={500}>
                      {m.name}
                    </tspan>
                    <tspan fill="var(--text-mute)" dx={5}>
                      {m.distance}
                    </tspan>
                  </text>
                </g>
              </g>
            );
          })}
        </g>

        {/* ── Pins ────────────────────────────────────────────────
            Above every chip, and the only interactive layer on the map.

            ── WHY suppressHydrationWarning IS CORRECT HERE ──────────────────
            These coordinates come out of the d3 projection. Node produced
            109.6164622611006 and the browser 109.61646226110062 for the same
            input, so React reported a hydration mismatch.

            That is not a bug in this code and cannot be fixed by writing it
            differently. ECMA-262 leaves the precision of Math.sin, Math.cos,
            Math.atan and friends implementation-defined, and an azimuthal
            projection is trigonometry all the way down. Node and the browser
            are free to differ in the last bit, and they do. Any float that
            reaches an attribute through a transcendental is exposed.

            suppressHydrationWarning is the API React provides for exactly
            this: a value that legitimately differs and does not matter. It
            applies to this element's own attributes only, so a real mismatch
            anywhere else still reports. */}
        {markets.map((m) => {
          const on = active === m.code;
          const color = DISCIPLINES[m.discipline].color;

          return (
            <g
              key={m.code}
              suppressHydrationWarning
              transform={`translate(${m.x}, ${m.y})`}
              onMouseEnter={() => setActive(m.code)}
              onMouseLeave={() => setActive(null)}
            >
              {/* Generous transparent hit area. The visible pin is 9px across
                  and a pointer target that small is unusable, but growing the
                  pin to fix it would wreck the graphic. */}
              <circle
                r={17}
                fill="transparent"
                tabIndex={0}
                onFocus={() => setActive(m.code)}
                onBlur={() => setActive(null)}
                className="outline-none"
                role="img"
                aria-label={`${m.name}, ${m.distance}. ${m.focus}.`}
              />

              <g data-pin="" className="cursor-default">
                {m.home && (
                  <circle
                    data-halo=""
                    r={8}
                    fill="none"
                    stroke={color}
                    strokeWidth={1}
                    vectorEffect="non-scaling-stroke"
                  />
                )}
                <circle
                  r={m.home ? 6 : 4.5}
                  fill={m.home || on ? color : "var(--canvas)"}
                  stroke={color}
                  strokeWidth={1.9}
                  vectorEffect="non-scaling-stroke"
                  className="transition-[fill] duration-200"
                />
              </g>
            </g>
          );
        })}

        {/* ── Hover card ──────────────────────────────────────────
            Replaces the chip in place, so the graphic does not grow a second
            floating element. Last in the document, so it is above everything
            including a neighbouring pin. */}
        {markets
          .filter((m) => active === m.code)
          .map((m) => (
            <foreignObject
              key={m.code}
              data-card={m.code}
              suppressHydrationWarning
              x={Math.min(
                Math.max(m.label.x - CARD_W / 2, 4),
                WIDTH - CARD_W - 4,
              )}
              y={Math.min(
                Math.max(m.label.y - CARD_H / 2, 4),
                HEIGHT - CARD_H - 4,
              )}
              width={CARD_W}
              height={CARD_H}
              style={{ overflow: "visible" }}
              className="pointer-events-none"
            >
              <div className="flex h-full flex-col justify-center rounded-xl border border-(--line) bg-(--canvas) px-3.5 py-2 shadow-[0_8px_24px_-14px_rgb(0_0_0/0.4)]">
                <p className="flex items-baseline gap-2 text-[11px] leading-none font-medium text-(--text)">
                  {m.name}
                  <span className="text-[10px] font-normal text-(--text-mute)">
                    {m.distance}
                  </span>
                </p>
                <p
                  className="mt-1.5 text-[10px] leading-tight"
                  style={{ color: DISCIPLINES[m.discipline].color }}
                >
                  {m.focus}
                </p>
              </div>
            </foreignObject>
          ))}

        {/* ── Legend ──────────────────────────────────────────────
                    Bottom-left, not top-left: Hero.jsx absolutely positions its
                    own "Global service network" label over the top-left corner
                    of this graphic, and the bottom-left of the disc is empty
                    Southern Ocean. */}
        <g pointerEvents="none">
          {Object.entries(DISCIPLINES).map(([key, d], i) => {
            const x = 6 + i * 128;
            return (
              <g key={key} transform={`translate(${x}, ${HEIGHT - 18})`}>
                <circle cx={4} cy={0} r={4} fill={d.color} />
                <text
                  x={15}
                  y={4}
                  fontSize={11}
                  fill="var(--text-dim)"
                  className="select-none"
                >
                  {d.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
