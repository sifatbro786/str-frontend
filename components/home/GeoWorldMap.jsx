"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps";
import worldData from "world-atlas/countries-110m.json";
import { gsap } from "@/lib/gsap";

/**
 * Global service network.
 *
 * ── WHY THE TOPOJSON IS IMPORTED, NOT FETCHED ────────────────────────────
 * Every react-simple-maps example passes `geography` a jsDelivr URL and lets
 * the component fetch it at runtime. That leaves the largest element above the
 * fold blank until a third-party CDN we do not own responds. The world-atlas
 * package is a static file, so it belongs in the bundle: Next inlines the
 * import at build time and it gzips over the same connection as everything
 * else.
 *
 * countries-110m, not 50m: at this render size the extra detail in 50m is
 * sub-pixel and the file is four times larger.
 *
 * ── WHY geoEqualEarth AND NOT MERCATOR ───────────────────────────────────
 * Mercator is the default people reach for and it is wrong for a "where we
 * work" graphic: it inflates Europe and North America and shrinks everything
 * near the equator, which would make our own region look small on our own map.
 * Equal Earth preserves relative area and still looks like the world map
 * people expect.
 *
 * ── THE HOVER LEADER LINE ────────────────────────────────────────────────
 * Hovering a country runs a line up from its pin to a card naming the work we
 * do there. The line is drawn with a stroke-dashoffset wipe rather than a
 * height or scaleY tween, because a scaled line scales its own stroke width
 * with it and arrives thicker than it started.
 *
 * The card is an SVG <foreignObject>, not an HTML overlay positioned with
 * getBoundingClientRect. An overlay would have to re-measure on every resize,
 * every projection change and every ScrollSmoother frame, and it would drift
 * by a pixel or two the whole time. Inside the SVG it is in the same
 * coordinate space as the pin and simply cannot desync.
 */

/* ⚑ Markets, not offices. Dhaka is the only STR office; the rest are places we
   have shipped into and support. `focus` is the line of work that actually
   went there, so the card says something specific rather than "we operate
   here". Confirm these with the account owners before launch. */
const MARKETS = [
    {
        code: "BD",
        name: "Bangladesh",
        coords: [90.4, 23.8],
        home: true,
        focus: "Studio, engineering and production floor",
    },
    { code: "GB", name: "United Kingdom", coords: [-0.13, 51.5], focus: "Web platforms and brand" },
    { code: "IT", name: "Italy", coords: [12.5, 41.9], focus: "Architectural visualization" },
    { code: "US", name: "United States", coords: [-96, 38.5], focus: "Custom software and SaaS" },
    { code: "AE", name: "UAE", coords: [54.4, 24.5], focus: "Commerce and trade portals" },
    { code: "AU", name: "Australia", coords: [134, -25.3], focus: "Mobile and field tooling" },
    { code: "SG", name: "Singapore", coords: [103.8, 1.35], focus: "Catalogue post-production" },
];

/* Card geometry, in SVG user units. Fixed rather than measured: getBBox can
   only run after the webfont lands, and a card that resizes itself a second
   after first paint is worse than one that is four pixels wider than it needs
   to be. */
const CARD_W = 172;
const CARD_H = 52;
const LEADER = 34; // vertical run from pin to card

export default function GeoWorldMap({ className }) {
    const root = useRef(null);
    const [active, setActive] = useState(null);

    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const pins = gsap.utils.toArray("[data-pin]", root.current);

            if (reduced) {
                gsap.set(pins, { opacity: 1, scale: 1 });
                return;
            }

            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            /* THE LANDMASS IS NOT ANIMATED, and that is not an oversight.
               <Geographies> resolves its topology in an effect and renders null
               until it has, so on the commit where this hook runs the country
               paths are not in the DOM yet. Child effects flush before parent
               effects, but the setState they trigger does not, so any selector
               for them here comes back empty and the tween silently animates
               nothing. Chasing it with a MutationObserver would be a lot of
               machinery to fade in a map that is already the right colour. The
               pins are plain siblings and mount immediately, which is why they
               can be tweened directly.

               transformOrigin is set explicitly: an SVG group's default origin
               is the user-space origin at (0,0), so scaling a marker without it
               throws the pin across the map instead of growing it in place. */
            tl.fromTo(
                pins,
                { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" },
                {
                    opacity: 1,
                    scale: 1,
                    duration: 0.5,
                    ease: "back.out(2.2)",
                    stagger: 0.07,
                    transformOrigin: "50% 50%",
                },
                0.3,
            );

            const halo = root.current?.querySelector("[data-halo]");
            if (halo) {
                gsap.fromTo(
                    halo,
                    { scale: 0.6, opacity: 0.55 },
                    {
                        scale: 2.6,
                        opacity: 0,
                        duration: 2.6,
                        ease: "power2.out",
                        repeat: -1,
                        delay: 1.1,
                        transformOrigin: "50% 50%",
                    },
                );
            }

            return () => tl.kill();
        },
        { scope: root },
    );

    /* The leader and card animate on `active`, in their own context.
       Deliberately not CSS transitions: the line has to wipe before the card
       arrives, and a transition-delay chain that reverses correctly on a fast
       mouse-out is more fragile than one timeline with overwrite. */
    useGSAP(
        () => {
            const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const line = root.current?.querySelector(`[data-leader="${active}"]`);
            const card = root.current?.querySelector(`[data-card="${active}"]`);
            if (!line || !card) return;

            if (reduced) {
                gsap.set([line, card], { opacity: 1, strokeDashoffset: 0 });
                return;
            }

            const tl = gsap.timeline();
            tl.fromTo(
                line,
                { strokeDashoffset: LEADER, opacity: 1 },
                { strokeDashoffset: 0, duration: 0.26, ease: "power2.out" },
            ).fromTo(
                card,
                { opacity: 0, y: 6 },
                { opacity: 1, y: 0, duration: 0.24, ease: "power3.out" },
                0.16,
            );

            return () => tl.kill();
        },
        { scope: root, dependencies: [active] },
    );

    return (
        <div ref={root} className={className}>
            <ComposableMap
                projection="geoEqualEarth"
                // Centred north of the equator and pulled up: the default frame
                // leaves a deep band of Southern Ocean under South America that is
                // a third of the graphic's height and holds nothing.
                projectionConfig={{ scale: 172, center: [15, 14] }}
                width={880}
                height={400}
                style={{ width: "100%", height: "auto" }}
                role="img"
                aria-label={`Countries served: ${MARKETS.map((m) => m.name).join(", ")}`}
            >
                <Geographies geography={worldData}>
                    {({ geographies }) => (
                        <g data-land="">
                            {geographies.map((geo) => (
                                <Geography
                                    key={geo.rsmKey}
                                    geography={geo}
                                    // Fill and stroke one step apart in the same
                                    // family, so borders read as creases in a single
                                    // sheet rather than outlines around shapes.
                                    fill="var(--raised-2)"
                                    stroke="var(--canvas)"
                                    strokeWidth={0.6}
                                    style={{
                                        default: { outline: "none" },
                                        hover: { outline: "none" },
                                        pressed: { outline: "none" },
                                    }}
                                />
                            ))}
                        </g>
                    )}
                </Geographies>

                {MARKETS.map((m) => {
                    const on = active === m.code;
                    return (
                        <Marker
                            key={m.code}
                            coordinates={m.coords}
                            onMouseEnter={() => setActive(m.code)}
                            onMouseLeave={() => setActive(null)}
                        >
                            {/* Generous transparent hit area. The visible pin is 9px
                  across and a pointer target that small is unusable, but
                  growing the pin to fix it would wreck the graphic. */}
                            <circle r={16} fill="transparent" tabIndex={0}
                                onFocus={() => setActive(m.code)}
                                onBlur={() => setActive(null)}
                                className="outline-none"
                                role="img"
                                aria-label={`${m.name}. ${m.focus}.`}
                            />

                            <g data-pin="" className="cursor-default">
                                {m.home && (
                                    <circle
                                        data-halo=""
                                        r={7}
                                        fill="none"
                                        stroke="var(--color-brand)"
                                        strokeWidth={1}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                )}

                                <circle
                                    r={m.home ? 5.5 : 4.5}
                                    fill={on ? "var(--color-brand)" : "var(--canvas)"}
                                    stroke="var(--color-brand)"
                                    strokeWidth={1.6}
                                    vectorEffect="non-scaling-stroke"
                                    className="transition-[fill] duration-200"
                                />
                                {m.home && !on && <circle r={2} fill="var(--color-brand)" />}

                                {/* Resting label chip. Always visible, like the
                    reference: a map whose labels only appear on hover
                    says nothing in a screenshot. */}
                                <g transform="translate(0, 20)" opacity={on ? 0 : 1}>
                                    <rect
                                        x={-labelWidth(m) / 2}
                                        y={-11}
                                        width={labelWidth(m)}
                                        height={22}
                                        rx={11}
                                        fill="var(--canvas)"
                                        stroke="var(--line)"
                                        strokeWidth={1}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    <text
                                        textAnchor="middle"
                                        y={4}
                                        fontSize={11}
                                        className="pointer-events-none select-none"
                                    >
                                        <tspan fill="var(--text-mute)">{m.code}</tspan>
                                        <tspan fill="var(--text)" fontWeight={500} dx={5}>
                                            {m.name}
                                        </tspan>
                                    </text>
                                </g>
                            </g>

                            {/* ── Hover leader and card ───────────────────────
                  Rendered only for the active market. Kept OUTSIDE
                  [data-pin] so the entrance scale tween never touches
                  it, and drawn after the pin so it stacks above the
                  neighbouring chips. */}
                            {on && (
                                <g className="pointer-events-none">
                                    <line
                                        data-leader={m.code}
                                        x1={0}
                                        y1={-6}
                                        x2={0}
                                        y2={-LEADER}
                                        stroke="var(--color-brand)"
                                        strokeWidth={1.2}
                                        strokeDasharray={LEADER}
                                        vectorEffect="non-scaling-stroke"
                                    />
                                    <foreignObject
                                        data-card={m.code}
                                        x={-CARD_W / 2}
                                        y={-LEADER - CARD_H}
                                        width={CARD_W}
                                        height={CARD_H}
                                        style={{ overflow: "visible" }}
                                    >
                                        <div className="flex h-full flex-col justify-center rounded-lg border border-(--line) bg-(--canvas) px-3 py-2 shadow-[0_6px_20px_-12px_rgb(0_0_0/0.35)]">
                                            <p className="text-[11px] leading-none font-medium text-(--text)">
                                                {m.name}
                                            </p>
                                            <p className="mt-1.5 text-[10px] leading-tight text-brand">
                                                {m.focus}
                                            </p>
                                        </div>
                                    </foreignObject>
                                </g>
                            )}
                        </Marker>
                    );
                })}
            </ComposableMap>
        </div>
    );
}

/**
 * Chip width, estimated per character rather than measured with getBBox.
 *
 * getBBox is exact but can only run once the text has been laid out in the
 * real font, which on this site means after General Sans arrives from the
 * Fontshare CDN. That is a second render pass and a visible resize of every
 * chip on the map. A per-character estimate is stable from first paint and
 * wrong by a couple of pixels at worst, on a rounded rectangle where nobody
 * can tell.
 */
function labelWidth(m) {
    return 26 + m.code.length * 7 + m.name.length * 6.4;
}
