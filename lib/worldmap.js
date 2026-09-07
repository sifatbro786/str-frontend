/**
 * lib/worldmap.js — geometry for the hero's dot-matrix world map.
 *
 * ── WHY A HAND-BUILT MASK AND NOT A GeoJSON PIPELINE ─────────────────────
 * The alternative is shipping a simplified world TopoJSON (~60–90 kB even at
 * 110m resolution) plus a projection library to rasterise it into dots, on a
 * decorative graphic that renders once, above the fold, at a fixed size. The
 * mask below is 27 lines of integers, needs no runtime, and produces an
 * identical result because the output resolution is 5° — coarser than any
 * simplification the pipeline would apply anyway.
 *
 * ── THE MASK FORMAT ──────────────────────────────────────────────────────
 * `LAND[r]` is the list of inclusive `[startCol, endCol]` column ranges that
 * contain land on row `r`. Ranges, not a bit string, because a 72-character
 * string of 1s and 0s cannot be reviewed — an off-by-one in the middle of one
 * is invisible in a diff and moves Africa.
 *
 * Grid: 72 columns × 27 rows on an equirectangular graticule.
 *   column c spans lon  [-180 + 5c,  -175 + 5c]
 *   row    r spans lat  [  80 - 5r,    75 - 5r]
 *
 * Antarctica is omitted deliberately: at this latitude range an equirectangular
 * projection smears it into a solid bar across the bottom of the frame, which
 * reads as a UI element rather than a continent.
 *
 * ⚑ Coastlines are approximate to ±½ cell (~275 km at the equator). This is a
 * graphic, not a basemap — do not reuse it for anything that has to be right.
 */

export const COLS = 72;
export const ROWS = 27;
export const STEP = 10; // px per 5° cell in the SVG user-space
export const LON_LEFT = -180;
export const LAT_TOP = 80;
export const DEG = 5;

export const MAP_W = COLS * STEP; // 720
export const MAP_H = ROWS * STEP; // 270

/** Inclusive [startCol, endCol] land ranges, one row per 5° of latitude. */
export const LAND = [
  [[14, 25], [26, 32], [37, 38], [50, 53], [58, 60]],             //  77.5N  Arctic archipelagos
  [[8, 26], [27, 33], [38, 40], [46, 71]],                        //  72.5N
  [[6, 26], [27, 33], [35, 36], [37, 71]],                        //  67.5N
  [[5, 27], [28, 32], [34, 35], [36, 71]],                        //  62.5N
  [[5, 10], [11, 28], [30, 32], [34, 36], [37, 71]],              //  57.5N
  [[10, 29], [34, 71]],                                           //  52.5N
  [[11, 30], [35, 65]],                                           //  47.5N
  [[12, 30], [34, 65]],                                           //  42.5N
  [[13, 30], [34, 36], [37, 48], [50, 63]],                       //  37.5N
  [[14, 30], [33, 48], [49, 61], [62, 63]],                       //  32.5N
  [[15, 22], [26, 27], [33, 47], [49, 62]],                       //  27.5N
  [[16, 22], [23, 26], [33, 47], [49, 61]],                       //  22.5N
  [[17, 22], [24, 27], [33, 46], [49, 61]],                       //  17.5N
  [[18, 23], [24, 28], [32, 45], [50, 61]],                       //  12.5N
  [[21, 23], [24, 29], [32, 45], [51, 51], [55, 61]],             //   7.5N
  [[24, 31], [32, 44], [55, 62]],                                 //   2.5N
  [[25, 33], [32, 44], [55, 66]],                                 //   2.5S
  [[26, 34], [32, 44], [57, 68]],                                 //   7.5S
  [[25, 35], [32, 44], [59, 68]],                                 //  12.5S
  [[25, 36], [32, 42], [45, 46], [59, 67]],                       //  17.5S
  [[25, 36], [32, 42], [45, 46], [58, 66]],                       //  22.5S
  [[25, 34], [33, 41], [57, 66]],                                 //  27.5S
  [[25, 32], [33, 40], [57, 66]],                                 //  32.5S
  [[25, 31], [60, 65], [69, 70]],                                 //  37.5S
  [[25, 30], [64, 65], [69, 71]],                                 //  42.5S
  [[25, 29], [70, 71]],                                           //  47.5S
  [[26, 29]],                                                     //  52.5S
];

/**
 * Flattened dot list, computed once at module scope.
 *
 * De-duplicated via a Set because several rows carry overlapping ranges by
 * design — Africa and South America share columns 32–33 at the equator, and
 * writing them as one merged range would make the row unreadable. Overlap is
 * cheaper to allow here than to hand-resolve in the table above.
 */
export const DOTS = (() => {
  const out = [];
  for (let r = 0; r < LAND.length; r += 1) {
    const seen = new Set();
    for (const [a, b] of LAND[r]) {
      for (let c = a; c <= b; c += 1) {
        if (c < 0 || c >= COLS || seen.has(c)) continue;
        seen.add(c);
        out.push({
          x: (c + 0.5) * STEP,
          y: (r + 0.5) * STEP,
          // Row index doubles as the stagger axis, so the reveal can sweep
          // north-to-south without the component recomputing anything.
          r,
          c,
        });
      }
    }
  }
  return out;
})();

/** lon/lat → SVG user-space. Same graticule as the dots, so nodes land on them. */
export function project(lon, lat) {
  return {
    x: ((lon - LON_LEFT) / DEG) * STEP,
    y: ((LAT_TOP - lat) / DEG) * STEP,
  };
}

/**
 * Delivery nodes. Dhaka is the hub — every arc originates there, which is the
 * honest shape of the business rather than a decorative mesh.
 *
 * `label` renders on hover; `hub` gets the larger marker and the pulse.
 */
export const NODES = [
  { id: "dhaka", label: "Dhaka", meta: "HQ", lon: 90.4, lat: 23.8, hub: true },
  { id: "london", label: "London", meta: "UK", lon: -0.13, lat: 51.5 },
  { id: "milan", label: "Milan", meta: "EU", lon: 9.19, lat: 45.46 },
  { id: "newyork", label: "New York", meta: "US", lon: -74.0, lat: 40.71 },
  { id: "dubai", label: "Dubai", meta: "MEA", lon: 55.27, lat: 25.2 },
  { id: "singapore", label: "Singapore", meta: "APAC", lon: 103.82, lat: 1.35 },
  { id: "sydney", label: "Sydney", meta: "AU", lon: 151.21, lat: -33.87 },
];

/**
 * Quadratic arc from the hub to each spoke.
 *
 * The control point is lifted perpendicular to the chord rather than straight
 * up: a fixed upward lift makes east–west arcs bow correctly and north–south
 * arcs collapse onto their own chord. Lift scales with chord length so a short
 * hop (Dhaka→Singapore) does not get the same dramatic curve as a long one.
 */
export const ARCS = (() => {
  const hub = NODES.find((n) => n.hub);
  const from = project(hub.lon, hub.lat);

  return NODES.filter((n) => !n.hub).map((n) => {
    const to = project(n.lon, n.lat);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const len = Math.hypot(dx, dy) || 1;
    const lift = Math.min(len * 0.22, 82);

    // Perpendicular unit vector, sign chosen so the arc always bows away from
    // the equator-ward side — i.e. up, in screen terms, on both hemispheres.
    const nx = -dy / len;
    const ny = dx / len;
    const sign = ny > 0 ? -1 : 1;

    const cx = from.x + dx / 2 + nx * lift * sign;
    const cy = from.y + dy / 2 + ny * lift * sign;

    return {
      id: n.id,
      d: `M ${from.x.toFixed(1)} ${from.y.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${to.x.toFixed(1)} ${to.y.toFixed(1)}`,
      // Longer routes draw slower, so the whole set finishes together-ish
      // without a hand-tuned delay per arc.
      len,
    };
  });
})();
