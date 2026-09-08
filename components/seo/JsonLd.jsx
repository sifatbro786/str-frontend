/**
 * Structured-data emitter. Server component, no client JS.
 *
 * ── WHY THIS EXISTS RATHER THAN INLINE <script> TAGS ─────────────────────
 * Injecting JSON into a <script> element requires dangerouslySetInnerHTML,
 * and the escaping is a security question, not a formatting one. Any string
 * inside the payload that a person can edit — a blog title, a client name, an
 * FAQ answer typed into the admin panel — could contain the literal sequence
 * `</script>`, which terminates the tag early and drops whatever follows into
 * the document as live markup. That is stored XSS, authored through a CMS
 * field nobody thinks of as dangerous.
 *
 * Replacing `<` with its unicode escape is the standard mitigation and it is
 * safe inside JSON: `<` parses back to `<`, so crawlers see exactly the
 * string that was written. Doing it here, once, means no call site can forget.
 *
 * ── WHY type="application/ld+json" AND NOT next/script ───────────────────
 * next/script is for executable JavaScript and applies loading strategies to
 * it. This is inert data that must be in the initial HTML, because crawlers
 * that do not run JS still need to read it. A plain tag in the server-rendered
 * output is the whole requirement.
 */
export default function JsonLd({ data }) {
    if (!data) return null;

    // An array renders as a graph of separate blocks, which is valid and
    // easier to debug in Google's testing tool than one merged @graph.
    const blocks = Array.isArray(data) ? data : [data];

    return (
        <>
            {blocks.filter(Boolean).map((block, i) => (
                <script
                    key={i}
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify(block).replace(/</g, "\\u003c"),
                    }}
                />
            ))}
        </>
    );
}
