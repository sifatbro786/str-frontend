import paths from "./heroMapPaths.json";

/**
 * lib/heroMap.js — the hero map's geometry, as data.
 *
 * This is a re-export of lib/heroMapPaths.json, which is GENERATED. Nothing
 * here computes anything, and that is the point.
 *
 * ── WHAT THIS REPLACED ───────────────────────────────────────────────────
 * This file used to BE the geometry: it imported world-atlas's
 * countries-110m.json plus d3-geo and topojson-client, and projected ~162
 * country polygons into SVG path strings at module scope. Its only consumer is
 * GeoWorldMap.jsx, which is "use client" — so every visitor to the homepage
 * downloaded the topology and both libraries, then spent main-thread time
 * during hydration decoding and re-projecting them into strings that are
 * byte-identical on every build.
 *
 * The computation is a pure function of constants, so it now happens once at
 * build time. The logic still exists, unchanged, in lib/heroMapGeometry.js;
 * scripts/build-hero-map.mjs runs it and writes the JSON beside this file, and
 * `npm run build` runs that via `prebuild`.
 *
 * Client cost, gzipped: 47.3 KB (topology + libs) → 33.9 KB (this JSON), and
 * the projection work is gone entirely. The measurements, and why the rounding
 * precision is what decides whether this is a win at all, are in the build
 * script.
 *
 * ── CHANGING THE MAP ─────────────────────────────────────────────────────
 * Edit lib/heroMapGeometry.js — markets, disciplines, projection, frame — then
 * run `npm run prebuild`. Editing heroMapPaths.json by hand does nothing; the
 * next build overwrites it.
 *
 * ⚑ Import from HERE, never from lib/heroMapGeometry.js. That file imports
 * `node:module` specifically so that a component importing it fails the build
 * instead of silently pulling the topology back into the client bundle.
 */
export const {
    WIDTH,
    HEIGHT,
    DISCIPLINES,
    GRATICULE_PATH,
    SPHERE_PATH,
    LAND_PATHS,
    /** Precomputed output of heroMapGeometry's layout(): markets, center, rings. */
    LAYOUT,
} = paths;
