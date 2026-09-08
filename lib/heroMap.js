import { geoAzimuthalEquidistant, geoGraticule10, geoPath } from "d3-geo";
import { feature } from "topojson-client";
import worldTopology from "world-atlas/countries-110m.json";

/**
 * lib/heroMap.js — the geometry behind the hero's service-network map.
 *
 * ── WHY THIS IS NOT A WORLD MAP ANY MORE ─────────────────────────────────
 * It was a geoEqualEarth rectangle with pins on it. That is the single most
 * copied graphic in agency web design — every studio with clients abroad has
 * the same grey continents and the same ring of dots, because everyone reaches
 * for react-simple-maps and takes its default projection. Two sites built that
 * way are indistinguishable, and being indistinguishable is the one thing a
 * studio's own homepage cannot afford.
 *
 * This is an AZIMUTHAL EQUIDISTANT projection centred on the studio in Dhaka,
 * and the change is not cosmetic. On this projection, measured from the centre
 * point and only from the centre point, two things are literally true on the
 * page:
 *
 *   1. DISTANCE IS LINEAR. A market twice as far from Dhaka sits twice as far
 *      from the middle of the graphic. So the rings below are real distances,
 *      not decoration, and the label on each pin is the actual great-circle
 *      distance from the studio.
 *   2. BEARING IS TRUE. The great-circle path from Dhaka to anywhere is a
 *      STRAIGHT LINE out of the centre. The spokes are not drawn as arcs
 *      because they do not need to be — the shortest real path is already
 *      straight here.
 *
 * That is why this map cannot be mistaken for anyone else's: its whole shape
 * is derived from where STR actually is. Recentre it on another city and it
 * becomes a different picture. A rectangular world map with the pins moved is
 * the same picture.
 *
 * ── WHY THE GEOMETRY LIVES OUTSIDE THE COMPONENT ─────────────────────────
 * Pure functions of constants, no React, no DOM. That makes the whole graphic
 * renderable in Node — which is how it gets checked visually without a
 * browser — and keeps the trigonometry out of a file that is otherwise about
 * markup and animation.
 */

/* ── The studio ───────────────────────────────────────────────────────── */

export const ORIGIN = { name: "Dhaka", coords: [90.4, 23.8] };

/* ── Frame ─────────────────────────────────────────────────────────────── */
export const WIDTH = 780;
export const HEIGHT = 560;

/* 138°, not 180. The furthest market (the US interior) sits at ~120° from
   Dhaka, so 138 keeps it comfortably inside the disc while cutting the
   antipodal rim where an azimuthal projection smears the last degrees into an
   unreadable band. Every degree past ~140 adds empty Pacific and nothing else. */
export const CLIP = 138;

const CX = WIDTH / 2;
/* Below the geometric middle, and deliberately: every market except Australia
   and Singapore lies north or west of Dhaka, so the interesting half of the
   disc is the top half. Centring it properly would leave a third of the
   graphic as empty Southern Ocean — the same mistake the old rectangular map
   made, which is why it was framed with center:[15,14]. */
const CY = 330;
const RADIUS = 290;

/** Earth's mean radius, for the distance labels and the ring maths. */
const EARTH_KM = 6371;

/**
 * The projection, built once at module scope.
 *
 * rotate() rather than center(): an azimuthal projection is centred by
 * spinning the globe so the point of interest is at the tangent, which is
 * [-lon, -lat]. Using center() here would offset the map WITHIN the plane and
 * leave the tangent — and therefore the distance and bearing guarantees above
 * — somewhere in the Bay of Bengal.
 */
export function makeProjection() {
  return (
    geoAzimuthalEquidistant()
      .rotate([-ORIGIN.coords[0], -ORIGIN.coords[1]])
      .clipAngle(CLIP)
      .translate([CX, CY])
      // On this projection the radius in pixels is scale × angle-in-radians,
      // so the scale that puts the clip edge exactly on RADIUS falls out.
      .scale(RADIUS / ((CLIP * Math.PI) / 180))
  );
}

export const CENTER = [CX, CY];
export const DISC_RADIUS = RADIUS;

/* ── Disciplines ──────────────────────────────────────────────────────────
   Three, matching the three things the studio actually sells. The colour is
   the point of the whole redraw: the old map had one accent, so every pin
   said "we are here" and nothing else. These say WHAT is there.

   ⚑ Tokens, not hex. The map is rendered on --canvas in both themes and the
   brand ramp is defined once in globals.css; hard-coding #1476BE here is how
   a graphic ends up unreadable the first time someone adjusts the dark
   palette. */
export const DISCIPLINES = {
  engineering: { label: "Engineering", color: "var(--color-brand)" },
  visual: { label: "Visualization", color: "var(--color-signal)" },
  production: { label: "Production", color: "var(--color-leaf)" },
};

/* ⚑ Markets, not offices. Dhaka is the only STR office; the rest are places
   the studio has shipped into and supports. `focus` is the line of work that
   actually went there and `discipline` is which of the three it belongs to —
   both are claims about real engagements, so confirm them with the account
   owners before launch. */
const MARKETS_RAW = [
  {
    code: "BD",
    name: "Bangladesh",
    coords: [90.4, 23.8],
    home: true,
    discipline: "engineering",
    focus: "Studio, engineering and production floor",
  },
  {
    code: "GB",
    name: "United Kingdom",
    coords: [-0.13, 51.5],
    discipline: "engineering",
    focus: "Web platforms and brand",
  },
  {
    code: "IT",
    name: "Italy",
    coords: [12.5, 41.9],
    discipline: "visual",
    focus: "Architectural visualization",
  },
  {
    code: "US",
    name: "United States",
    coords: [-96, 38.5],
    discipline: "engineering",
    focus: "Custom software and SaaS",
  },
  {
    code: "AE",
    name: "UAE",
    coords: [54.4, 24.5],
    discipline: "engineering",
    focus: "Commerce and trade portals",
  },
  {
    code: "AU",
    name: "Australia",
    coords: [134, -25.3],
    discipline: "engineering",
    focus: "Mobile and field tooling",
  },
  {
    code: "SG",
    name: "Singapore",
    coords: [103.8, 1.35],
    discipline: "production",
    focus: "Catalogue post-production",
  },
];

/** Great-circle distance in km. Haversine — accurate enough at this scale. */
function distanceKm([lon1, lat1], [lon2, lat2]) {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_KM * Math.asin(Math.sqrt(a));
}

/**
 * Markets with their distance from Dhaka attached, furthest first.
 *
 * Sort order is a rendering concern, not a data one: drawing the far spokes
 * first means the near pins — which are the crowded ones, around the Gulf and
 * South-East Asia — stack on top rather than under.
 */
export const MARKETS = MARKETS_RAW.map((m) => {
  const km = distanceKm(ORIGIN.coords, m.coords);
  return {
    ...m,
    km,
    // "8,000 km" reads as a measurement; "7,983 km" reads as a claim of
    // precision the coordinates do not support — several of these are
    // country centroids, not addresses.
    distance: m.home
      ? "Home studio"
      : `${(Math.round(km / 100) * 100).toLocaleString()} km`,
  };
}).sort((a, b) => b.km - a.km);

/* ── Distance rings ───────────────────────────────────────────────────────
   Real isolines: every point on a ring is genuinely that far from the studio.
   Chosen so each one lands near a market cluster rather than at a round number
   with nothing on it — 5,000 sits just past the Gulf, 10,000 just past Europe,
   15,000 past the Americas. */
export const RINGS = [5000, 10000, 15000].map((km) => ({
  km,
  label: `${km.toLocaleString()} km`,
  r: (km / EARTH_KM) * (RADIUS / ((CLIP * Math.PI) / 180)),
}));

/* ── Label placement ──────────────────────────────────────────────────────
   The pins radiate from one point, so their labels want to radiate too: each
   chip is pushed straight out along the same bearing as its spoke, which reads
   as an extension of the line rather than as a box dropped near a dot.

   Radial placement alone is not enough. Two markets on close bearings at
   similar distances — London and Rome are 15° and 700km apart — land their
   chips on top of each other, and "roughly correct except where it matters" is
   how a graphic ends up looking unfinished. So each chip is pushed further out
   along its own bearing until it clears every chip already placed.

   ⚑ Chip width is ESTIMATED per character, not measured. getBBox can only run
   after General Sans arrives from the Fontshare CDN, which means a second
   layout pass and every label visibly jumping. A few pixels of error on a
   rounded chip is invisible; a reflow is not. If the type scale or family
   changes, CHAR_W has to change with it. */
const CHIP_H = 22;
const CHAR_W = 6.2; // average advance of General Sans at 10.5px
const CHIP_PAD = 30; // horizontal padding plus the gap between name and distance

export function chipWidth(m) {
  return CHIP_PAD + (m.name.length + m.distance.length) * CHAR_W;
}

function overlaps(a, b) {
  // 6px of breathing room, so chips that merely touch still read as separate.
  return (
    a.x1 < b.x2 + 6 && a.x2 > b.x1 - 6 && a.y1 < b.y2 + 6 && a.y2 > b.y1 - 6
  );
}

/**
 * Everything the component needs to draw, resolved through the projection.
 *
 * Returns pixel positions rather than the projection itself, so the component
 * never touches d3 — and so this same output can be handed to a plain SVG
 * string builder in Node for a visual check without a browser.
 */
export function layout() {
  const projection = makeProjection();

  const markets = MARKETS.map((m) => {
    const [x, y] = projection(m.coords);
    return { ...m, x, y };
  });

  /* EVERY PIN IS AN OBSTACLE BEFORE ANY CHIP IS PLACED.
       Chip-versus-chip alone is not enough, and the failure is specific: a
       chip belonging to a near market is wide, so it reaches sideways across
       ground that a further market's pin is sitting on. Singapore's label ran
       straight through Australia's dot that way — no two chips overlapped, and
       the map was still wrong. The pins are seeded as occupied boxes here so
       the same push-outward loop resolves both cases at once.

       PIN_BOX is the visible dot plus its stroke and a little air, not the
       17px invisible hit area: hover targets are allowed to sit under a label,
       the drawn mark is not. */
  const PIN_BOX = 7;
  const placed = markets.map((m) => ({
    code: `pin:${m.code}`,
    box: {
      x1: m.x - PIN_BOX,
      x2: m.x + PIN_BOX,
      y1: m.y - PIN_BOX,
      y2: m.y + PIN_BOX,
    },
  }));

  /* Placement order is nearest-first from the centre. The crowding is all in
       the middle — the Gulf, South-East Asia — so the pins with the least room
       should claim their spot before the distant ones, which have empty disc
       in every direction and can absorb being pushed out. */
  const byProximity = [...markets].sort((a, b) => a.km - b.km);

  for (const m of byProximity) {
    const w = chipWidth(m);

    /* The home pin sits exactly at the centre, where the bearing is
           undefined — atan2(0, 0) is 0, which would push its label due east
           across the busiest part of the map. Straight down instead. */
    const angle = m.home ? Math.PI / 2 : Math.atan2(m.y - CY, m.x - CX);

    let cx = m.x;
    let cy = m.y;
    let box = null;

    for (let step = 0; step < 14; step += 1) {
      /* Push the chip's NEAR EDGE clear of the pin, not its centre. A
               fixed radial offset works for a chip above a pin and fails for
               one beside it: a 160px-wide label offset 22px to the east still
               has its left half sitting on top of the dot it belongs to. This
               is the half-extent of the box along the bearing, so a wide chip
               going sideways is pushed further than a wide chip going up. */
      const reach =
        Math.abs(Math.cos(angle)) * (w / 2) +
        Math.abs(Math.sin(angle)) * (CHIP_H / 2);
      const offset = 14 + reach + step * 15;
      cx = m.x + Math.cos(angle) * offset;
      cy = m.y + Math.sin(angle) * offset;

      // Keep the chip inside the frame; a label clipped by the viewBox
      // edge is worse than one slightly closer to its neighbour.
      cx = Math.min(Math.max(cx, w / 2 + 6), WIDTH - w / 2 - 6);
      cy = Math.min(Math.max(cy, CHIP_H / 2 + 34), HEIGHT - CHIP_H / 2 - 6);

      box = {
        x1: cx - w / 2,
        x2: cx + w / 2,
        y1: cy - CHIP_H / 2,
        y2: cy + CHIP_H / 2,
      };
      if (!placed.some((p) => overlaps(p.box, box))) break;
    }

    placed.push({ code: m.code, box, label: { x: cx, y: cy, w } });
  }

  // `placed` also holds the seeded pin obstacles, which carry no label.
  const labels = Object.fromEntries(
    placed.filter((p) => p.label).map((p) => [p.code, p.label]),
  );

  return {
    projection,
    markets: markets.map((m) => ({ ...m, label: labels[m.code] })),
    center: CENTER,
    rings: RINGS,
    discRadius: RADIUS,
  };
}

/* ── Pre-rendered geometry ────────────────────────────────────────────────
   The country outlines, the graticule and the disc edge, resolved to SVG path
   strings once at module scope.

   ── WHY NOT react-simple-maps' <Geographies> ─────────────────────────────
   <Geographies> resolves its topology inside an effect and renders null until
   it has. On the server that effect never runs, so the countries are simply
   absent from the HTML and the largest element above the fold arrives as an
   empty disc that fills in after hydration. That was true of the previous map
   too — it is why its entrance animation could never touch the landmass, as
   the old comment in the component explained at length. It was a workaround
   for the symptom.

   Projecting here fixes the cause. topojson-client and d3-geo both run
   perfectly well in Node, the input is a static file already in the bundle,
   and the output is a list of `d` strings. So the land is in the server HTML,
   there is no effect, no null first render, and nothing to memoise.

   The cost is that the paths are computed at module load rather than lazily.
   That is ~240 features through one projection, once per process — measured in
   single-digit milliseconds, against a hero graphic that previously did the
   same work in the browser on every visitor's main thread. */

const PATH = geoPath(makeProjection());

/**
 * Which country polygon belongs to which market, keyed by the name Natural
 * Earth uses in this topology — NOT by ISO code, because countries-110m
 * carries `properties.name` and a numeric id and nothing else.
 *
 * ⚑ These strings are Natural Earth's, not ours: "United States of America",
 * not "United States". A rename upstream silently stops highlighting that
 * country — nothing throws, the fill just quietly disappears. If a market ever
 * stops being tinted, check this map against the topology before anything else.
 *
 * ⚑ Singapore is deliberately absent. At 110m resolution it has no polygon at
 * all — it is smaller than the simplification threshold — so there is nothing
 * to fill. Its pin and spoke still render; only the country tint is missing,
 * and moving to 50m to gain it would quadruple the file for one city-state.
 */
const MARKET_COUNTRY = {
  Bangladesh: "engineering",
  "United Kingdom": "engineering",
  Italy: "visual",
  "United States of America": "engineering",
  "United Arab Emirates": "engineering",
  Australia: "engineering",
};

/**
 * Country outlines, each tagged with the discipline that ships there when it
 * is one of ours.
 *
 * ── ⚑ ON THE UNITED STATES LOOKING ENORMOUS ──────────────────────────────
 * It is, and the geometry is correct. An azimuthal equidistant projection
 * preserves distance and bearing from the centre and pays for it by inflating
 * area near the rim — badly. The US sits at ~120° from Dhaka, close to the
 * 138° clip, so its tinted polygon renders larger than Africa.
 *
 * This was raised as a reason not to tint countries at all, and the tint was
 * chosen anyway with the effect understood. Do not "fix" it by shrinking the
 * US polygon or by special-casing far markets — either would make the map
 * lie about the projection it is drawn in. If the inflation ever becomes
 * unacceptable, the honest fixes are to drop the tint (set MARKET_COUNTRY to
 * {}) or to change the projection, and changing the projection costs the
 * distance rings and the straight spokes, which are the point of the graphic.
 */
export const LAND_PATHS = feature(
  worldTopology,
  worldTopology.objects.countries,
)
  .features.map((f) => ({
    d: PATH(f),
    discipline: MARKET_COUNTRY[f.properties?.name] ?? null,
  }))
  .filter((p) => p.d);

export const GRATICULE_PATH = PATH(geoGraticule10());
export const SPHERE_PATH = PATH({ type: "Sphere" });
