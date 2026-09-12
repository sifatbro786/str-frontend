/**
 * Portfolio taxonomy — enums, labels and the per-discipline verbs.
 *
 * Kept apart from lib/portfolioData.js for the same reason lib/taxonomy.js is
 * kept apart from the records it describes: the filter rail is a client
 * component, so anything it imports ships to the browser. This file is the
 * contract (five ids and their labels, ~1KB). The records are content and stay
 * on the server, fetched there and passed down as a prop.
 *
 * ⚑ When /portfolio moves behind the dashboard, these five ids become the
 * `discipline` enum on the Mongoose model. The backend enum and this list must
 * move together, exactly as SERVICE_TYPES and Project.serviceTypes do — a
 * mismatch shows an empty rail for that discipline rather than throwing.
 */

/**
 * One row per discipline, in display order. Everything the UI needs to talk
 * about a discipline lives here rather than in three parallel maps beside the
 * component:
 *
 *   label        filter pill and band heading
 *   deliverable  what the client actually receives — the honest distinction
 *                between a URL and a file set, which is the whole reason this
 *                page is not just /projects with more rows
 *   action       the link verb on a card. "Visit live site" is reserved for
 *                `web`, where it is literally true; every other discipline
 *                hands over files, so it takes its own verb
 *   note         one line for the discipline band at the top of the page
 *   empty        shown when a filter yields nothing. Written as a route to the
 *                work rather than as an empty shelf
 */
export const PORTFOLIO_DISCIPLINES = [
    {
        id: "web",
        label: "Web & Apps",
        deliverable: "Live sites",
        action: "Visit live site",
        note: "Production sites and web apps. Every entry links to the address it runs on.",
        empty: {
            title: "Nothing published under this filter yet",
            body: "Tell us what you are looking for and we will send the closest build straight over.",
        },
    },
    {
        id: "creative",
        label: "2D & 3D",
        deliverable: "Render files",
        action: "View the render set",
        note: "Product, interior and architectural visualisation, plus measured floor plans.",
        empty: {
            title: "Render sets are shared on request",
            body: "Product and architectural 3D is delivered as files, not a public address. We open the folder with the full render set, source scenes and turntables.",
        },
    },
    {
        id: "marketing",
        label: "Digital Marketing",
        deliverable: "Reporting packs",
        action: "View the campaign report",
        note: "Paid social, search and SEO, shown as the reporting that went out with them.",
        empty: {
            title: "Campaign reporting is shared on request",
            body: "Ad accounts and performance data belong to the client, so results travel as a reporting pack: spend, CPA, ROAS and the creative that ran.",
        },
    },
    {
        id: "graphics",
        label: "Graphic Design",
        deliverable: "Artwork files",
        action: "View the design set",
        note: "Identity and campaign artwork, and catalogue retouching at production volume.",
        empty: {
            title: "Design sets are shared on request",
            body: "Identity systems, packaging and print collateral are delivered as artwork. We open the folder with the finished pieces and the brand guide.",
        },
    },
    {
        id: "video",
        label: "Video",
        deliverable: "Edit reels",
        action: "Watch the reel",
        note: "Performance creative, product film and motion, cut for the placement it runs in.",
        empty: {
            title: "Reels are shared on request",
            body: "Edits, motion graphics and product films sit in a shared folder rather than on a public channel. Say the word and the reel comes over.",
        },
    },
];

/** id → row, so a card can look up its own verbs without a second map. */
export const DISCIPLINE_BY_ID = Object.fromEntries(
    PORTFOLIO_DISCIPLINES.map((d) => [d.id, d]),
);

/** Ordered ids. Mirrors the future `discipline` enum on the model. */
export const DISCIPLINE_IDS = PORTFOLIO_DISCIPLINES.map((d) => d.id);
