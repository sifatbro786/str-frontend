"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_GROUPS, isNavActive } from "@/lib/adminNav";
import { CloseIcon, ExternalIcon } from "./icons";
import { cn } from "@/lib/utils";

/**
 * Admin rail.
 *
 * ── WHY IT DOES NOT LOOK LIKE THE PUBLIC SITE ────────────────────────────
 * The marketing pages are editorial: hairlines, square corners, no icons, one
 * accent. That language is right for a page someone reads once and wrong for a
 * tool someone uses every day — in a dashboard the same restraint reads as
 * "which of these eight identical rows is the one I want". This rail is
 * deliberately conventional: an icon per section, grouped headings, a filled
 * rounded pill on the active row. Familiar beats distinctive here.
 *
 * ── WHY THE ICON IS NOT THE LABEL ────────────────────────────────────────
 * Every row keeps its text. Icon-only rails save 140px and cost a guess on
 * every click for anyone who is not in here daily — which is the client, who
 * is the actual user of this panel.
 */
export default function Sidebar({ onNavigate, onClose }) {
    const pathname = usePathname();

    return (
        <nav aria-label="Admin sections" className="flex h-full flex-col bg-(--raised)">
            <div className="flex h-16 shrink-0 items-center gap-2 border-b border-(--line) px-4">
                <Link
                    href="/admin"
                    onClick={onNavigate}
                    className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-(--raised-2)"
                >
                    <span className="grid size-7 place-items-center rounded-md bg-brand text-[0.8125rem] font-semibold text-white">
                        S
                    </span>
                    <span className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-(--text)">
                        STR Admin
                    </span>
                </Link>

                {/* Only rendered in the mobile sheet; the desktop rail passes no
                    onClose, so there is nothing to dismiss. */}
                {onClose && (
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close navigation"
                        className="ml-auto rounded-lg p-2 text-(--text-mute) transition-colors hover:bg-(--raised-2) hover:text-(--text) lg:hidden"
                    >
                        <CloseIcon />
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4">
                {ADMIN_NAV_GROUPS.map((group) => (
                    <div key={group.title} className="mb-5 last:mb-0">
                        <p className="px-3 pb-2 text-[0.6875rem] font-semibold tracking-[0.04em] text-(--text-mute) uppercase">
                            {group.title}
                        </p>

                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const active = isNavActive(item, pathname);
                                const IconComponent = item.icon;

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            onClick={onNavigate}
                                            aria-current={active ? "page" : undefined}
                                            className={cn(
                                                "flex items-center gap-3 rounded-lg px-3 py-2 text-[0.9375rem] transition-colors",
                                                active
                                                    ? "bg-brand font-medium text-white"
                                                    : "text-(--text-dim) hover:bg-(--raised-2) hover:text-(--text)",
                                            )}
                                        >
                                            <IconComponent
                                                className={cn(
                                                    "size-[18px] shrink-0",
                                                    !active && "text-(--text-mute)",
                                                )}
                                            />
                                            {item.label}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="border-t border-(--line) p-3">
                <Link
                    href="/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-lg px-3 py-2 text-[0.9375rem] text-(--text-dim) transition-colors hover:bg-(--raised-2) hover:text-(--text)"
                >
                    <ExternalIcon className="size-[18px] shrink-0 text-(--text-mute)" />
                    View site
                </Link>
            </div>
        </nav>
    );
}
