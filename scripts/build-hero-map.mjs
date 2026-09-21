import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

import {
    DISCIPLINES,
    GRATICULE_PATH,
    HEIGHT,
    LAND_PATHS,
    SPHERE_PATH,
    WIDTH,
    layout,
} from "../lib/heroMapGeometry.js";

/**
 * Precomputes the hero map's geometry into lib/heroMapPaths.json.
 *
 * ── WHY ──────────────────────────────────────────────────────────────────
 * GeoWorldMap.jsx is "use client". It used to import lib/heroMap.js directly,
 * which imported world-atlas/countries-110m.json (105 KB), d3-geo and
 * topojson-client — so all of it was shipped to every visitor on the homepage
 * and re-executed in the browser to produce path strings that are identical on
 * every build. Nothing in that computation depends on the request, the viewport
 * or the user; it is a pure function of constants.
 *
 * So it runs here instead, once, and the app ships the answer.
 *
 * ── PRECISION IS THE WHOLE OPTIMISATION ─────────────────────────────────
 * Measured, because the first cut of this made the bundle BIGGER.
 *
 * What the old arrangement cost the client, gzipped:
 *     countries-110m.json                38.5 KB
 *     d3-geo + topojson (tree-shaken)     8.8 KB
 *                                        ───────
 *                                        47.3 KB
 *
 * What this file emits, gzipped, by rounding:
 *     2 decimals   65.8 KB   ← worse than what it replaces
 *     1 decimal    52.0 KB   ← still worse
 *     0 decimals   33.8 KB   ← the win
 *
 * Topology is delta-encoded integers and gzips extremely well; full-precision
 * float path strings do not. "Precompute it at build time" is only an
 * optimisation at the right precision, which is why the numbers are in the
 * file rather than in a commit message.
 *
 * d3-geo 2.x has no .digits(), so this rounds the emitted strings itself.
 *
 * ⚑ The three scales below are NOT arbitrary:
 *   - LAND and GRATICULE carry ~99% of the bytes and are decorative outlines.
 *     The viewBox is 780×620 and the graphic renders at roughly that width, so
 *     integers mean a worst case of half a unit — sub-pixel on a coastline.
 *   - SPHERE is one stroked circle and the disc's visible edge. A half-unit
 *     wobble on a 290px-radius stroke is the one place rounding could show, and
 *     it is a single path, so it keeps full-ish precision for free.
 *   - Pin and label positions get a decimal. They are exact-looking marks with
 *     leader lines drawn to them, and there are seven of them.
 *
 * If the map is ever rendered at much larger scale (a print export), raise
 * LAND_DECIMALS first and re-measure rather than removing the rounding.
 */
const LAND_DECIMALS = 0;
const SPHERE_DECIMALS = 2;
const POS_DECIMALS = 1;

const at = (decimals) => {
    const factor = 10 ** decimals;
    return (n) => Math.round(n * factor) / factor;
};

const roundLand = at(LAND_DECIMALS);
const roundSphere = at(SPHERE_DECIMALS);
const round = at(POS_DECIMALS);

/** Rounds every number inside an SVG path `d` string at the given scale. */
const pathRounder = (fn) => (d) =>
    d.replace(/-?\d+(\.\d+)?/g, (m) => String(fn(Number(m))));

const roundLandPath = pathRounder(roundLand);
const roundSpherePath = pathRounder(roundSphere);

/* layout() also returns the d3 projection function, which is not serialisable
   and — checked — is not read by the component: it destructures markets,
   center and rings only. Taking the three explicitly means a future addition
   to layout()'s return value fails loudly here rather than silently arriving
   as `undefined` in the browser. */
const { markets, center, rings } = layout();

const out = {
    /* Regenerate with `npm run prebuild`. Do not hand-edit — see
       scripts/build-hero-map.mjs and lib/heroMapGeometry.js. */
    WIDTH,
    HEIGHT,
    DISCIPLINES,
    GRATICULE_PATH: roundLandPath(GRATICULE_PATH),
    SPHERE_PATH: roundSpherePath(SPHERE_PATH),
    LAND_PATHS: LAND_PATHS.map(({ d, discipline }) => ({ d: roundLandPath(d), discipline })),
    LAYOUT: {
        markets: markets.map((m) => ({
            ...m,
            x: round(m.x),
            y: round(m.y),
            label: m.label && { x: round(m.label.x), y: round(m.label.y), w: round(m.label.w) },
        })),
        center: center.map(round),
        rings: rings.map((r) => ({ ...r, r: round(r.r) })),
    },
};

/* Sanity checks. A silently empty or half-built map is the failure mode worth
   guarding: the build would still succeed and the homepage would render an
   empty disc, which reads as a styling bug and takes an afternoon to trace. */
if (out.LAND_PATHS.length < 100) {
    throw new Error(`Only ${out.LAND_PATHS.length} land paths — expected ~150. Topology changed?`);
}
if (out.LAYOUT.markets.length === 0) throw new Error("No markets in layout output.");
if (out.LAYOUT.markets.some((m) => !m.label)) {
    throw new Error("A market came out without a placed label.");
}
if (!out.SPHERE_PATH || !out.GRATICULE_PATH) throw new Error("Disc or graticule path is empty.");

const target = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "lib", "heroMapPaths.json");
writeFileSync(target, `${JSON.stringify(out)}\n`);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
// eslint-disable-next-line no-console
console.log(
    `[hero-map] ${out.LAND_PATHS.length} land paths, ${out.LAYOUT.markets.length} markets ` +
        `→ lib/heroMapPaths.json (${kb(Buffer.byteLength(JSON.stringify(out)))})`,
);
