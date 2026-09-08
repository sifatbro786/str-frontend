"use client";

import { useEffect, useMemo, useState } from "react";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import RepeatableRows, { stripKeys } from "@/components/admin/RepeatableRows";
import { SaveIcon } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/**
 * /admin/site-content — the four marketing blocks that used to be hard-coded
 * in lib/data.js and needed a deploy to change: the metrics band, the FAQ, the
 * process steps and the engagement shapes.
 *
 * ── WHY ONE SCREEN AND NOT FOUR ──────────────────────────────────────────
 * Same reasoning as the single SiteContent collection behind it. Every block
 * is an ordered list of short flat rows, edited as a whole and saved as a
 * whole, and RepeatableRows already does exactly that. Four routes would be
 * four copies of this file differing only in a column array.
 *
 * ── WHY EVERY BLOCK LOADS AT ONCE ────────────────────────────────────────
 * GET /site-content returns all four keyed in one response, so switching tabs
 * is instant and costs no request. They are a few kilobytes in total; paging
 * them would be optimising the wrong number.
 *
 * ── WHY THE DIRTY CHECK IS A JSON COMPARE ────────────────────────────────
 * These are small plain arrays with no cycles and stable key order coming from
 * one source, so stringify is a correct equality test here and a dependency is
 * not warranted. It is NOT a general-purpose deep equal — do not lift it.
 *
 * ⚑ Column definitions below must stay in step with SHAPES in
 * str-backend/src/validators/siteContent.validator.js. The server rejects any
 * field it does not recognise, so a column added only here fails the save with
 * "not a valid field" rather than silently doing nothing.
 */

const BLOCKS = [
    {
        key: "metrics",
        label: "Metrics",
        where: "Homepage · About",
        hint: "The four-number band. Value is a number on its own; the suffix is the character after it.",
        max: 8,
        addLabel: "Add metric",
        newRow: { value: "", suffix: "", label: "", note: "" },
        columns: [
            { key: "value", label: "Value", placeholder: "200", grow: false, required: true },
            { key: "suffix", label: "Suffix", placeholder: "+", grow: false },
            { key: "label", label: "Label", placeholder: "Projects delivered", required: true },
            { key: "note", label: "Note", placeholder: "Across 6 industries" },
        ],
        // `value` is typed as text but stored as a number — the validator
        // rejects a string and the counter would render "NaN+".
        numeric: ["value"],
    },
    {
        key: "faqs",
        label: "FAQ",
        where: "Homepage · Contact",
        hint: "Category drives the filter tabs on the homepage. /contact renders every row and ignores it.",
        max: 30,
        addLabel: "Add question",
        newRow: { category: "General", q: "", a: "" },
        columns: [
            {
                key: "category",
                label: "Category",
                type: "select",
                grow: false,
                options: [
                    { value: "General", label: "General" },
                    { value: "Process", label: "Process" },
                    { value: "Tech", label: "Tech" },
                ],
            },
            { key: "q", label: "Question", required: true },
            { key: "a", label: "Answer", required: true },
        ],
    },
    {
        key: "process",
        label: "Process steps",
        where: "Homepage · Services",
        hint: "Rendered in the order below. The index is display copy, not a sort key — reorder with the arrows.",
        max: 8,
        addLabel: "Add step",
        newRow: { index: "", title: "", body: "", output: "" },
        columns: [
            { key: "index", label: "Index", placeholder: "01", grow: false, required: true },
            { key: "title", label: "Title", placeholder: "Scope", required: true },
            { key: "body", label: "Body", required: true },
            { key: "output", label: "Output", placeholder: "Scope document · estimate" },
        ],
    },
    {
        key: "capabilities",
        label: "Engagement shapes",
        where: "About",
        hint: "The four ways a client can engage. Shown as a hairline grid, so four or eight read best.",
        max: 8,
        addLabel: "Add shape",
        newRow: { title: "", body: "" },
        columns: [
            { key: "title", label: "Title", placeholder: "Dedicated squads", required: true },
            { key: "body", label: "Body", required: true },
        ],
    },
];

export default function SiteContentAdminPage() {
    const [active, setActive] = useState(BLOCKS[0].key);
    const [saved, setSaved] = useState({}); // key → items, as the server has them
    const [draft, setDraft] = useState({}); // key → items, as edited
    const [status, setStatus] = useState("loading");
    const [summary, setSummary] = useState("");
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    const block = BLOCKS.find((b) => b.key === active);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const payload = await api.list("site-content");
                if (cancelled) return;
                const items = Object.fromEntries(
                    BLOCKS.map((b) => [b.key, payload.data?.[b.key]?.items ?? []]),
                );
                setSaved(items);
                setDraft(items);
                setStatus("ready");
            } catch (err) {
                if (cancelled) return;
                setStatus("error");
                setSummary(err.message || "Could not load site content.");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    /* stripKeys first: RepeatableRows stamps a client-only _key onto every row,
       so comparing raw drafts would report every block dirty the moment it
       rendered. */
    const dirty = useMemo(() => {
        if (status !== "ready") return {};
        return Object.fromEntries(
            BLOCKS.map((b) => [
                b.key,
                JSON.stringify(stripKeys(draft[b.key] ?? [])) !==
                    JSON.stringify(saved[b.key] ?? []),
            ]),
        );
    }, [draft, saved, status]);

    async function save(event) {
        event.preventDefault();
        setSaving(true);
        setSummary("");

        /* Numeric columns are typed into text inputs, so they arrive as
           strings. Coerce here rather than in the input: an input that
           rewrites its own value while someone is typing "1" on the way to
           "10" is the classic controlled-number-field bug. An empty string
           stays absent so the optional field is simply not sent. */
        const items = stripKeys(draft[active] ?? []).map((row) => {
            const out = { ...row };
            for (const field of block.numeric ?? []) {
                if (out[field] === "" || out[field] === undefined) delete out[field];
                else out[field] = Number(out[field]);
            }
            return out;
        });

        try {
            const res = await api.put("site-content", active, { items });
            setSaved((prev) => ({ ...prev, [active]: res.data.items }));
            setDraft((prev) => ({ ...prev, [active]: res.data.items }));
            revalidate("site-content");
            toast.success(`${block.label} saved.`);
        } catch (err) {
            /* The item validator reports the offending row as
               `items[2].label`, which is more useful in the summary line than
               attached to a field — RepeatableRows has no per-cell error slot,
               and inventing one for four screens is not worth it. */
            const detail = Array.isArray(err.details)
                ? err.details.map((d) => d.message).join(" · ")
                : "";
            setSummary(detail || err.message || "Could not save this block.");
            toast.error(err.message || "Save failed.");
        } finally {
            setSaving(false);
        }
    }

    function reset() {
        setDraft((prev) => ({ ...prev, [active]: saved[active] ?? [] }));
        setSummary("");
    }

    if (status === "loading") {
        return <p className="text-[0.9375rem] text-(--text-mute)">Loading…</p>;
    }

    if (status === "error") {
        return (
            <p role="alert" className="text-[0.9375rem] text-signal">
                {summary}
            </p>
        );
    }

    return (
        <div className="space-y-5">
            <div>
                <p className="text-[0.9375rem] text-(--text-dim)">
                    Copy that appears on the marketing pages but is not a project, service or post.
                    Saving publishes immediately.
                </p>
            </div>

            {/* Tabs. A tab strip rather than the left rail /admin/page-meta
                uses: there are four of these, not six, and each one needs the
                full width for its rows. */}
            <div
                role="tablist"
                aria-label="Content blocks"
                className="flex flex-wrap gap-1 border-b border-(--line)"
            >
                {BLOCKS.map((b) => {
                    const isActive = b.key === active;
                    return (
                        <button
                            key={b.key}
                            role="tab"
                            type="button"
                            aria-selected={isActive}
                            onClick={() => setActive(b.key)}
                            className={cn(
                                "-mb-px flex items-center gap-2 border-b-2 px-4 py-2.5 text-[0.9375rem] transition-colors",
                                isActive
                                    ? "border-brand font-medium text-(--text)"
                                    : "border-transparent text-(--text-mute) hover:text-(--text)",
                            )}
                        >
                            {b.label}
                            {dirty[b.key] && (
                                <span
                                    aria-label="Unsaved changes"
                                    className="size-1.5 rounded-full bg-signal"
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            <form onSubmit={save} noValidate className="space-y-5">
                <div className="rounded-xl border border-(--line) bg-(--canvas) p-5">
                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                        <h2 className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-(--text)">
                            {block.label}
                        </h2>
                        <p className="text-[0.8125rem] text-(--text-mute)">
                            Appears on: {block.where}
                        </p>
                    </div>

                    <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-(--text-mute)">
                        {block.hint}
                    </p>

                    <div className="mt-5">
                        <RepeatableRows
                            value={draft[active] ?? []}
                            onChange={(rows) => setDraft((prev) => ({ ...prev, [active]: rows }))}
                            columns={block.columns}
                            newRow={block.newRow}
                            max={block.max}
                            addLabel={block.addLabel}
                        />
                    </div>

                    {/* An empty block is not an error, but it does not do what
                        the author expects either — lib/api falls back to the
                        static copy rather than rendering nothing, so the page
                        will not look empty. Saying so here is cheaper than
                        someone reporting it as a bug. */}
                    {(draft[active] ?? []).length === 0 && (
                        <p className="mt-4 text-[0.875rem] text-(--text-mute)">
                            No rows. Saving an empty block restores the built-in copy on the site
                            rather than leaving the section blank.
                        </p>
                    )}
                </div>

                {summary && (
                    <p
                        role="alert"
                        className="rounded-lg border border-signal/40 bg-signal/8 px-4 py-3 text-[0.875rem] text-signal"
                    >
                        {summary}
                    </p>
                )}

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        type="submit"
                        disabled={saving || !dirty[active]}
                        className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-45"
                    >
                        <SaveIcon className="size-4" />
                        {saving ? "Saving…" : `Save ${block.label.toLowerCase()}`}
                    </button>

                    <button
                        type="button"
                        onClick={reset}
                        disabled={saving || !dirty[active]}
                        className="rounded-lg border border-(--line) px-4 py-2.5 text-[0.9375rem] font-medium text-(--text-dim) transition-colors hover:bg-(--raised-2) hover:text-(--text) disabled:opacity-45"
                    >
                        Discard changes
                    </button>

                    {saved[active]?.length > 0 && !dirty[active] && (
                        <p className="text-[0.8125rem] text-(--text-mute)">
                            {saved[active].length}{" "}
                            {saved[active].length === 1 ? "row" : "rows"} published
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
