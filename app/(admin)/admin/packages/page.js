"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import TracksEditor from "@/components/admin/packages/TracksEditor";
import TiersEditor from "@/components/admin/packages/TiersEditor";
import PageCopyEditor from "@/components/admin/packages/PageCopyEditor";
import { cn } from "@/lib/utils";

/**
 * /admin/packages — everything behind the public /packages route.
 *
 * ── WHY ONE SCREEN WITH THREE TABS AND NOT THREE ROUTES ──────────────────
 * Same argument as /admin/site-content. These three are one job: a track, the
 * packages inside it and the copy around them are almost always edited in the
 * same sitting, and three sidebar entries for one page would push Projects and
 * Services down the rail to describe a single route.
 *
 * ── WHY THE TRACK LIST IS FETCHED HERE AND PASSED DOWN ───────────────────
 * TiersEditor needs it for its "Track" select and its filter; TracksEditor
 * owns it. Fetching it in both would mean the select going stale the moment a
 * track is renamed on the other tab — a dropdown showing a name that no longer
 * exists, with no error. The parent holds it, TracksEditor calls `onChanged`
 * after every write, and both tabs see the same list.
 *
 * ⚑ Adding anything here means the proxy allow-list too: `packages` must be in
 * ALLOWED in app/api/admin/[...path]/route.js, or every call on this screen is
 * a 404 from our own BFF with nothing in the API logs to explain it.
 */

const TABS = [
    {
        key: "tracks",
        label: "Tracks",
        hint: "The four tabs on the public page. A track with no visible package is dropped rather than rendering an empty tab.",
    },
    {
        key: "packages",
        label: "Packages",
        hint: "One priced tier per row. Both languages are required — the public page has a hard language switch, so an English-only package is a blank card for half the readers.",
    },
    {
        key: "copy",
        label: "Page copy",
        hint: "The masthead, the essentials band, the closing CTA and the selected-work links. Titles and meta descriptions are at Page meta → Packages.",
    },
];

export default function PackagesAdminPage() {
    const [active, setActive] = useState("tracks");
    const [tracks, setTracks] = useState([]);

    /* Kept in the parent so the Track select on the Packages tab cannot show a
       name that was renamed on the Tracks tab a moment earlier. Failure is
       deliberately quiet: TracksEditor renders its own error state for the same
       request, and two error banners for one failed fetch is noise. */
    const loadTracks = useCallback(async () => {
        try {
            const payload = await api.list("packages/categories");
            setTracks(payload.data ?? []);
        } catch {
            setTracks([]);
        }
    }, []);

    useEffect(() => {
        loadTracks();
    }, [loadTracks]);

    const tab = TABS.find((t) => t.key === active) ?? TABS[0];

    return (
        <div className="space-y-5">
            <p className="text-[0.9375rem] text-(--text-dim)">
                Published rates for <code>/packages</code>, in English and Bengali. Saving
                publishes immediately.
            </p>

            <div
                role="tablist"
                aria-label="Packages sections"
                className="flex flex-wrap gap-1 border-b border-(--line)"
            >
                {TABS.map((t) => {
                    const on = t.key === active;
                    return (
                        <button
                            key={t.key}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            onClick={() => setActive(t.key)}
                            className={cn(
                                "-mb-px border-b-2 px-4 py-2.5 text-[0.9375rem] transition-colors",
                                on
                                    ? "border-brand font-medium text-(--text)"
                                    : "border-transparent text-(--text-mute) hover:text-(--text)",
                            )}
                        >
                            {t.label}
                        </button>
                    );
                })}
            </div>

            <p className="max-w-prose text-[0.875rem] leading-relaxed text-(--text-mute)">
                {tab.hint}
            </p>

            {/* Unmounted rather than hidden. Each editor holds an in-progress
                draft, and keeping all three mounted means three sets of unsaved
                state alive at once with no indication which tab holds one. */}
            {active === "tracks" && <TracksEditor onChanged={loadTracks} />}
            {active === "packages" && <TiersEditor tracks={tracks} onChanged={loadTracks} />}
            {active === "copy" && <PageCopyEditor />}
        </div>
    );
}
