import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { site } from "@/lib/site";

/**
 * /api/og — the social card every page falls back to.
 *
 * ── WHY GENERATE RATHER THAN SHIP ONE PNG ────────────────────────────────
 * The fallback used to be site.brand.logo. A logo in a 1200×630 frame is a
 * small mark floating in dead space, and it is identical on all thirty-odd
 * routes — so a link to a case study and a link to the pricing page look like
 * the same link. The card below carries the page's own title, which is the
 * only thing that makes a shared URL worth clicking.
 *
 * Precedence is unchanged and still lives in lib/seo.js: a PageMeta ogImage
 * from the dashboard wins, then a route's own image, then this. Nobody loses
 * the ability to art-direct a specific page.
 *
 * ── WHY .woff AND NOT .woff2 ⚑ ───────────────────────────────────────────
 * Satori, which renders this, reads ttf, otf and woff. It does NOT read
 * woff2 — it fails at render time, not at build, so the mistake ships and
 * shows up as a broken card in a client's LinkedIn post. public/fonts holds
 * the .woff pair on purpose; do not "optimise" them to woff2.
 *
 * The site's own UI loads JetBrains Mono through next/font, which emits woff2
 * into .next and cannot be read from here. Hence the second copy in public/,
 * which is the one unavoidable duplication in this file.
 *
 * ── WHY MONO FOR THE HEADLINE ────────────────────────────────────────────
 * globals.css uses the mono face for indices, labels and metadata. Setting a
 * headline in it is a deliberate extension of that, not a compromise: the
 * card reads as a spec sheet for the page, which is the house voice. When
 * General Sans is added to public/fonts, swap the family here and nothing
 * else in this file needs to move.
 */

export const runtime = "nodejs";

const WIDTH = 1200;
const HEIGHT = 630;

/* Read once per process, not once per request. A social scraper hitting ten
   URLs in a burst would otherwise read 56KB off disk ten times. */
let fontsPromise;
function loadFonts() {
    fontsPromise ??= Promise.all([
        readFile(join(process.cwd(), "public", "fonts", "JetBrainsMono-Regular.woff")),
        readFile(join(process.cwd(), "public", "fonts", "JetBrainsMono-Bold.woff")),
    ]);
    return fontsPromise;
}

const INK = "#17161a";
const MUTE = "#8b8478";
const RULE = "#e2ded5";
const STOCK = "#fbfaf7";
const BRAND = site.brand.blue;

/* Monospace means width is a pure function of character count, so the step
   points below are exact rather than guessed: at 76px a glyph is ~46px wide,
   and 1200 minus two 72px gutters leaves room for about 22 of them per line. */
function titleSize(len) {
    if (len <= 42) return 76;
    if (len <= 78) return 58;
    if (len <= 124) return 44;
    return 36;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);

    const rawTitle = (searchParams.get("t") || site.tagline).trim();
    // Hard cap rather than a CSS line clamp: Satori's clamp support varies by
    // version and a silently unclamped title overflows the frame instead of
    // ellipsing. Cutting the string is the one behaviour that cannot surprise.
    const title = rawTitle.length > 150 ? `${rawTitle.slice(0, 149).trimEnd()}…` : rawTitle;
    const kicker = (searchParams.get("k") || "").trim().toUpperCase();

    const [regular, bold] = await loadFonts();

    return new ImageResponse(
        (
            <div
                style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    padding: "64px 72px",
                    backgroundColor: STOCK,
                    /* Warm, off-centre light rather than a flat fill. A single
                       soft source reads as paper under a lamp; a centred one
                       reads as a template. */
                    backgroundImage: `radial-gradient(900px circle at 18% -10%, #ffffff 0%, ${STOCK} 62%)`,
                    fontFamily: "JetBrains Mono",
                    color: INK,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                        {/* The square is the same marker globals.css uses beside a
                            section index. It is the only saturated element on the
                            card, which is what keeps the blue an accent. */}
                        <div style={{ display: "flex", width: 14, height: 14, backgroundColor: BRAND }} />
                        <div
                            style={{
                                marginLeft: 16,
                                fontSize: 21,
                                fontWeight: 700,
                                letterSpacing: "0.2em",
                                color: kicker ? BRAND : MUTE,
                            }}
                        >
                            {kicker || "STR SOLUTIONS"}
                        </div>
                    </div>
                    <div style={{ display: "flex", fontSize: 21, letterSpacing: "0.12em", color: MUTE }}>
                        {new URL(site.url).hostname}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    {/* A short rule instead of an underline on the text itself.
                        Satori has no text-decoration offset, and a rule that is
                        its own element is the typographically better answer
                        anyway — it holds its position whatever the title wraps to. */}
                    <div style={{ display: "flex", width: 104, height: 4, backgroundColor: BRAND }} />
                    <div
                        style={{
                            marginTop: 28,
                            fontSize: titleSize(title.length),
                            fontWeight: 700,
                            lineHeight: 1.16,
                            letterSpacing: "-0.035em",
                            /* Satori honours whiteSpace: pre-wrap, which keeps a
                               title the marketer deliberately broke where they
                               broke it. */
                            whiteSpace: "pre-wrap",
                        }}
                    >
                        {title}
                    </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", width: "100%", height: 1, backgroundColor: RULE }} />
                    <div
                        style={{
                            marginTop: 22,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            fontSize: 20,
                            color: MUTE,
                        }}
                    >
                        <div style={{ display: "flex", fontWeight: 700, letterSpacing: "0.14em", color: INK }}>
                            {site.legalName.toUpperCase()}
                        </div>
                        <div style={{ display: "flex", letterSpacing: "0.04em" }}>{site.tagline}</div>
                    </div>
                </div>
            </div>
        ),
        {
            width: WIDTH,
            height: HEIGHT,
            fonts: [
                { name: "JetBrains Mono", data: regular, weight: 400, style: "normal" },
                { name: "JetBrains Mono", data: bold, weight: 700, style: "normal" },
            ],
            headers: {
                /* The rendered bytes are a pure function of the query string, so
                   a long cache is safe — a changed title is a changed URL. Thirty
                   days rather than a year only because a design change to this
                   file should reach the crawlers that recheck, within a month. */
                "Cache-Control": "public, max-age=2592000, s-maxage=2592000, immutable",
            },
        },
    );
}
