import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * One cell of the overview grid.
 *
 * Still a 1px-gap grid cell — the gap IS the hairline, so the card paints its
 * own background and owns no border. The admin stylesheet clips the grid to a
 * radius, which is what keeps the outer corners round while the rules between
 * cells stay square.
 *
 * `href` upgrades a card to a link. When it does, the whole cell is the target
 * and the hover state moves with it — a number a client cannot click is a
 * number they will ask you about.
 */
export default function StatCard({ label, value, hint, href, accent }) {
    const body = (
        <>
            <p className="text-[0.875rem] font-medium text-(--text-mute)">{label}</p>
            <p
                className={cn(
                    "nums mt-3 text-[2rem] leading-none font-semibold tracking-[-0.03em]",
                    accent ? "text-signal" : "text-(--text)",
                )}
            >
                {value}
            </p>
            {hint && <p className="mt-2.5 text-[0.8125rem] text-(--text-mute)">{hint}</p>}
        </>
    );

    const className = cn(
        "block bg-(--canvas) p-5 transition-colors",
        href && "hover:bg-(--raised-2)",
    );

    return href ? (
        <Link href={href} className={className}>
            {body}
        </Link>
    ) : (
        <div className={className}>{body}</div>
    );
}
