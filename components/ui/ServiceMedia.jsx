import Image from "next/image";
import { cn, mediaUrl, pad } from "@/lib/utils";

/**
 * The one place a Service.image is turned into pixels.
 *
 * ── WHY A COMPONENT AND NOT AN <Image> AT EACH CALL SITE ─────────────────
 * Three surfaces render this picture — the homepage preview, the /services
 * row, the detail figure — and each needs the same two things: the stored path
 * resolved against the API origin, and something to show when the field is
 * empty. `image` is empty by default now (it is uploaded per service after the
 * record exists), so the empty state is not an edge case, it is the state
 * every new service starts in. Three copies of that logic is three chances for
 * one page to render a broken <img> with a red X in it.
 *
 * ── WHY THE PLACEHOLDER IS TYPE AND NOT AN ICON ──────────────────────────
 * A grey image-shaped glyph in a 16:10 box reads as "this is broken". A
 * number and a title set on ruled paper reads as a deliberate index card, so
 * a service published at 2am without artwork still looks like the site rather
 * than like a failure. It also gives the author an obvious visual cue that
 * the upload is missing, without an admin warning nobody reads.
 *
 * No "use client": there are no hooks here, so this renders on the server
 * inside /services and inside the client CapabilityStack alike.
 *
 * @param {string} src    Service.image — "" is expected and handled.
 * @param {string} alt    Service.imageAlt. Empty renders decoratively.
 * @param {number} index  1-based position, shown by the placeholder.
 */
export default function ServiceMedia({
    src,
    alt = "",
    title,
    index,
    sizes = "(max-width: 1024px) 100vw, 42vw",
    priority = false,
    className,
    imageClassName,
}) {
    const resolved = mediaUrl(src);

    if (!resolved) {
        return (
            <div
                className={cn(
                    "relative flex flex-col justify-between overflow-hidden bg-(--raised) p-6",
                    className,
                )}
            >
                {/* Ruled paper, drawn with a repeating gradient rather than an
            asset. aria-hidden because it carries no information. */}
                <span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 opacity-60"
                    style={{
                        backgroundImage:
                            "repeating-linear-gradient(180deg, transparent 0 27px, var(--line-soft) 27px 28px)",
                    }}
                />
                <span className="label-mono relative text-(--text-mute)">
                    {index ? pad(index) : "··"}
                </span>
                <span className="relative max-w-[14ch] text-[clamp(1.1rem,2vw,1.6rem)] leading-tight font-medium tracking-[-0.02em] text-(--text-mute)">
                    {title}
                </span>
            </div>
        );
    }

    return (
        <div className={cn("relative overflow-hidden", className)}>
            <Image
                src={resolved}
                alt={alt}
                fill
                sizes={sizes}
                priority={priority}
                className={cn("object-cover object-center", imageClassName)}
            />
        </div>
    );
}
