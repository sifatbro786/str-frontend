/**
 * lib/graphics.js — the /graphics route's content and rate card.
 *
 * ── WHY THIS IS A FILE AND NOT A COLLECTION, FOR NOW ─────────────────────
 * Same arrangement as lib/pricingData.js: the records live here, the route
 * reaches them only through the two async accessors at the bottom, and nothing
 * else in the app imports the arrays directly. When this moves behind the
 * dashboard, the bodies of `getGraphicsServices()` and `getGraphicsRates()`
 * are pointed at the API and no component changes, because neither of them
 * knows where the rows came from. They are already async for exactly that
 * reason — making an accessor async later is a change at every call site.
 *
 * ⚑ THE RATE CARD IS DERIVED, NOT WRITTEN TWICE. `rate` lives on the service
 * row and `graphicsRates()` projects the table out of it. A second hand-kept
 * price list is how the table and the section under it end up disagreeing,
 * and the version a client quotes back at you is always the wrong one.
 *
 * ── ON THE MEDIA PATHS ───────────────────────────────────────────────────
 * Every file here is in this app's /public/graphics, so the paths pass through
 * lib/utils mediaUrl untouched and next/image optimisms them locally. When the
 * rows move to the API these become "/uploads/graphics/..." references and
 * mediaUrl rewrites them onto the API host with no other change.
 *
 * ── ON THE COPY ──────────────────────────────────────────────────────────
 * No dash punctuation anywhere in these strings, same rule as the rest of the
 * marketing copy on this site.
 */

/**
 * One row per pass, in pipeline order. What each field drives:
 *
 *   id          anchor on the section, and the React key. Becomes the `slug`
 *               on the model when this moves to the database.
 *   stage       the one word that says where in the pipeline this sits
 *   title       heading, and the service column of the rate table
 *   summary     one paragraph under the heading
 *   receive     what is handed over. Chips, same idiom as the catalogue cards
 *   rate        { amount, unit } in USD. The rate table is built from this
 *   mode        "compare" for a real before and after pair, "static" for a
 *               finished piece with nothing to compare it against. Two of the
 *               eight are genuinely static and faking a slider for them would
 *               mean inventing a "before" that never existed
 *   labels      what the two sides of the slider are called. Per service,
 *               because "Raw / Pathed" and "On form / Ghosted" describe
 *               different operations and one generic pair describes neither
 *   hero        the large frame
 *   support     the two smaller frames under it. Empty on static rows
 */
export const GRAPHICS_SERVICES = [
    {
        id: "clipping-path",
        stage: "Foundation",
        title: "Clipping Path",
        summary:
            "Every cutout starts as a hand drawn path. We trace the silhouette of the product point by point, so the edge stays crisp at any size and on any background it is later dropped onto.",
        receive: ["PSD with saved path", "Transparent PNG", "JPEG on white"],
        rate: { amount: 0.2, unit: "per image" },
        mode: "compare",
        labels: { before: "Raw", after: "Pathed" },
        hero: {
            before: "/graphics/clippingPathBefore1.webp",
            after: "/graphics/clippingPathAfter1.webp",
            caption: "014A",
        },
        support: [
            {
                before: "/graphics/clippingPathBefore2.webp",
                after: "/graphics/clippingPathAfter2.webp",
                caption: "014B",
            },
            {
                before: "/graphics/clippingPathBefore3.webp",
                after: "/graphics/clippingPathAfter3.webp",
                caption: "014C",
            },
        ],
    },
    {
        id: "background-removal",
        stage: "Isolation",
        title: "Background Removal",
        summary:
            "Once the path is set the background lifts clean. No halo around the edge, no fringing left in the hair, no soft grey sitting where the old backdrop used to be.",
        receive: ["Transparent PNG", "Pure white JPEG", "Marketplace ready"],
        rate: { amount: 0.2, unit: "per image" },
        mode: "compare",
        labels: { before: "Raw", after: "Isolated" },
        hero: {
            before: "/graphics/backgroundRemovalBefore1.webp",
            after: "/graphics/backgroundRemovalAfter1.webp",
            caption: "022A",
        },
        support: [
            {
                before: "/graphics/backgroundRemovalBefore2.webp",
                after: "/graphics/backgroundRemovalAfter2.webp",
                caption: "022B",
            },
            {
                before: "/graphics/backgroundRemovalBefore3.webp",
                after: "/graphics/backgroundRemovalAfter3.webp",
                caption: "022C",
            },
        ],
    },
    {
        id: "image-masking",
        stage: "Fine detail",
        title: "Image Masking",
        summary:
            "Hair, fur, glass and netting cannot be traced with a path. Those are masked by hand, strand by strand, so translucency and fine edges survive the cut instead of turning into a hard outline.",
        receive: ["Layered PSD", "Alpha channel", "Transparent PNG"],
        rate: { amount: 0.25, unit: "per image" },
        mode: "compare",
        labels: { before: "Raw", after: "Masked" },
        hero: {
            before: "/graphics/maskingBefore1.webp",
            after: "/graphics/maskingAfter1.webp",
            caption: "031A",
        },
        support: [
            {
                before: "/graphics/maskingBefore2.webp",
                after: "/graphics/maskingAfter2.webp",
                caption: "031B",
            },
            {
                before: "/graphics/maskingBefore3.webp",
                after: "/graphics/maskingAfter3.webp",
                caption: "031C",
            },
        ],
    },
    {
        id: "invisible-mannequin",
        stage: "Garment shape",
        title: "Invisible Mannequin",
        summary:
            "The mannequin or model form comes out and the garment keeps its shape. Collars, necklines and waistbands read the way they do on a body, with the neck joint rebuilt so the inside of the piece is visible.",
        receive: ["Ghost effect JPEG", "Layered PSD", "Neck joint rebuilt"],
        rate: { amount: 1, unit: "per image" },
        mode: "compare",
        labels: { before: "On form", after: "Ghosted" },
        hero: {
            before: "/graphics/mannequinBefore1.webp",
            after: "/graphics/mannequinAfter1.webp",
            caption: "040A",
        },
        support: [
            {
                before: "/graphics/mannequinBefore2.webp",
                after: "/graphics/mannequinAfter2.webp",
                caption: "040B",
            },
            {
                before: "/graphics/mannequinBefore3.webp",
                after: "/graphics/mannequinAfter3.webp",
                caption: "040C",
            },
        ],
    },
    {
        id: "colour-processing",
        stage: "Accuracy",
        title: "Colour Processing and Recolouring",
        summary:
            "Matching a Pantone swatch, correcting a cast, or building ten colourways out of one shot. Hue, saturation and tone are moved until the file matches the product as it sits on the shelf.",
        receive: ["Full colourway set", "Pantone matched", "Layered PSD"],
        rate: { amount: 0.2, unit: "per image" },
        /* No slider on this one. A colourway set has no "before" that a client
           would recognise, and a raw frame beside ten finished variants reads
           as a mistake rather than as a comparison. */
        mode: "static",
        hero: { src: "/graphics/colorProcessing.webp", caption: "057" },
        support: [],
    },
    {
        id: "retouching",
        stage: "Cleanup",
        title: "Photo Retouching",
        summary:
            "Dust spots, blemishes, scratches and stray fibre come out. The texture that makes a photograph look like a photograph stays in, which is the whole difference between retouched and plastic.",
        receive: ["Retouched JPEG", "Layered PSD", "Texture preserved"],
        rate: { amount: 0.75, unit: "per image" },
        mode: "compare",
        labels: { before: "Unretouched", after: "Cleaned" },
        hero: {
            before: "/graphics/retouchingBefore1.webp",
            after: "/graphics/retouchingAfter1.webp",
            caption: "063A",
        },
        support: [
            {
                before: "/graphics/retouchingBefore2.webp",
                after: "/graphics/retouchingAfter2.webp",
                caption: "063B",
            },
            {
                before: "/graphics/retouchingBefore3.webp",
                after: "/graphics/retouchingAfter3.webp",
                caption: "063C",
            },
        ],
    },
    {
        id: "shadow-reflection",
        stage: "Realism",
        title: "Shadow and Reflection",
        summary:
            "A cutout floats until it has a shadow. Drop shadow, natural shadow and reflection are built on their own layers so the product sits on the page instead of hovering above it.",
        receive: ["Grounded JPEG", "Shadow on own layer", "Transparent PNG"],
        rate: { amount: 0.5, unit: "per image" },
        mode: "compare",
        labels: { before: "Flat", after: "Grounded" },
        hero: {
            before: "/graphics/shadowBefore1.webp",
            after: "/graphics/shadowAfter1.webp",
            caption: "074A",
        },
        support: [
            {
                before: "/graphics/shadowBefore2.webp",
                after: "/graphics/shadowAfter2.webp",
                caption: "074B",
            },
            {
                before: "/graphics/shadowBefore3.webp",
                after: "/graphics/shadowAfter3.webp",
                caption: "074C",
            },
        ],
    },
    {
        id: "crop-resize",
        stage: "Delivery",
        title: "Cropping and Resizing",
        summary:
            "Every marketplace wants a different frame. The finished file is cropped and resized to each platform spec and renamed to the convention that platform expects, so nothing is cut off, stretched or rejected on upload.",
        receive: ["Per platform sizes", "Batch renamed", "Web optimised"],
        rate: { amount: 0.15, unit: "per image" },
        mode: "static",
        hero: { src: "/graphics/croppingImage.webp", caption: "081A" },
        support: [],
    },
];

/** The opening frame. One image carried through the whole pipeline. */
export const GRAPHICS_HERO = {
    before: "/graphics/heroBefore1.webp",
    after: "/graphics/heroAfter1.webp",
    caption: "Fig. 00 / drag the handle",
    labels: { before: "As shot", after: "Delivered" },
};

/**
 * What the rate table says under the figures.
 *
 * Kept as data rather than written into the component because it is the part
 * a client argues about, and it should be editable from the same screen as the
 * numbers once this is behind the dashboard.
 */
export const GRAPHICS_RATE_TERMS = [
    "Rates are per image in USD and are the starting point for standard complexity.",
    "A layered PSD, a rush batch or a product that needs more than the usual attention is quoted on the batch, not on this table.",
    "Send two or three sample images and the quote comes back against your own photography rather than against ours.",
];

/**
 * Bulk enquiry routes. Both are real and both are answered.
 *
 * ⚑ The WhatsApp number and the address are also in lib/site.js and must stay
 * in step with it. They are read from there by the route rather than restated
 * here, so this object carries only the copy around them.
 */
export const GRAPHICS_BULK = {
    note: "Volume work is quoted per batch. Send the count, the category and a couple of sample files.",
    whatsappLabel: "Call or WhatsApp for bulk",
    emailLabel: "Mail for bulk",
};

/* ── Accessors ────────────────────────────────────────────────────────────
   The only surface the route is allowed to touch. Async on purpose. */

/** The eight passes, in pipeline order. */
export async function getGraphicsServices() {
    return GRAPHICS_SERVICES;
}

/**
 * The rate card, projected from the service rows.
 *
 * ⚑ Rows come back in PIPELINE order, not cheapest first. An earlier pass
 * sorted them by amount, which left the position column reading 08, 01, 02, 05
 * down the page: a numbered column that does not count looks like a bug before
 * a reader works out that the number means something other than "row". Pipeline
 * order keeps the column serial, 01 to 08, and keeps every number identical to
 * the section it links to in GraphicsShowcase, which is the whole reason
 * `position` is carried across in the first place.
 *
 * The price ladder is not lost: the masthead prints the cheapest figure from
 * `from` below, and the terms under the table say the rates are a starting
 * point.
 */
export function graphicsRates(services) {
    return services.map((s, i) => ({
        id: s.id,
        position: i + 1,
        title: s.title,
        amount: s.rate.amount,
        unit: s.rate.unit,
    }));
}

/** The rate card and everything printed around it. */
export async function getGraphicsRateCard() {
    const services = await getGraphicsServices();
    return {
        rates: graphicsRates(services),
        terms: GRAPHICS_RATE_TERMS,
        bulk: GRAPHICS_BULK,
        /* The cheapest line on the table, so the masthead can print a real
           "from" figure instead of one somebody typed and then forgot to
           change when a rate moved. */
        from: Math.min(...services.map((s) => s.rate.amount)),
    };
}

/**
 * USD, always two decimal places.
 *
 * ⚑ This printed cents as "20c" in the first pass, which is how the studio
 * quotes them out loud and is also the one format a reader has to stop and
 * parse. Half this page's audience is buying from outside the US and reads
 * "20c" as a typo, a currency they do not recognize, or twenty dollars.
 * "$0.20" needs no interpretation anywhere, and the column of aligned decimal
 * points is easier to scan than a mix of "20c" and "$1.00" was.
 *
 * Still a function rather than an inline template, because it is the single
 * seam where the currency changes if these rates ever get quoted in EUR
 * alongside the build rates on /packages.
 */
export function formatRate(amount) {
    return `$${amount.toFixed(2)}`;
}
