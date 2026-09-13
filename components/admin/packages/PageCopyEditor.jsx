"use client";

import { useEffect, useMemo, useState } from "react";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, Textarea, Counter } from "@/components/admin/Fields";
import RepeatableRows, { stripKeys } from "@/components/admin/RepeatableRows";
import { SaveIcon } from "@/components/admin/icons";
import { cn } from "@/lib/utils";

/**
 * /admin/packages → Page copy. Everything on /packages that is not a price.
 *
 * ── WHAT IS DELIBERATELY NOT ON THIS SCREEN ──────────────────────────────
 *   · The <title>, meta description and OG image. Those are PageMeta, edited
 *     at /admin/page-meta → Packages. Two screens writing the same <head> is
 *     how a dashboard field silently stops taking effect.
 *   · "From", "You save", "Visit site", "Recommended", the breadcrumb. Those
 *     are interface strings in str-frontend/lib/packagesUi.js. The test for
 *     what belongs where: could emptying this field leave the page broken
 *     rather than merely emptier? "From" next to a figure is load-bearing; a
 *     headline is not.
 *   · The WhatsApp number behind the closing CTA — lib/site.js, once, for the
 *     whole site. This screen sets the button's LABEL, not its destination.
 *
 * ── WHY A SINGLE SAVE FOR BOTH LOCALES ───────────────────────────────────
 * The API replaces the document wholesale, because `essentials.items` and
 * `showcase` are ordered lists edited as a unit — a merge would make deleting
 * the last row impossible and reordering ambiguous. One PUT for the whole form
 * matches that exactly. Saving one locale at a time would mean reading the
 * other back from the server and posting it unchanged, which is the same write
 * with an extra chance to clobber a concurrent edit.
 *
 * ── WHY THE DIRTY CHECK IS A JSON COMPARE ────────────────────────────────
 * Small plain objects, no cycles, stable key order from one source. Correct
 * here, and NOT a general-purpose deep equal — do not lift it.
 */

const EMPTY_LOCALE = {
    hero: { eyebrow: "", title: "", lede: "", trust: "" },
    essentials: { kicker: "", title: "", items: [] },
    closing: { title: "", body: "", primaryCta: "", secondaryCta: "" },
};

const LOCALES = [
    { code: "en", label: "English" },
    { code: "bn", label: "বাংলা" },
];

/* ⚑ Mirrors the caps in str-backend/src/validators/package.validator.js. */
const MAX_ESSENTIALS = 8;
const MAX_SHOWCASE = 40;

/* ⚑ Mirrors the maxlength on models/PackagePage.js and the validator. Shown as
   a live counter on the two fields long enough to overrun without noticing. */
const LIMITS = { title: 160, lede: 600 };

const SHOWCASE_COLUMNS = [
    { key: "name", label: "Name", placeholder: "Paarel", grow: false, required: true },
    { key: "url", label: "URL", placeholder: "https://paarel.com/", required: true },
    {
        key: "group",
        label: "Group",
        type: "select",
        grow: false,
        options: [
            { value: "custom", label: "Custom development" },
            { value: "wp-shopify", label: "WordPress & Shopify" },
        ],
    },
];

/** Fills every path the form touches, so no input is ever uncontrolled. */
function hydrate(doc) {
    const one = (locale) => ({
        hero: { ...EMPTY_LOCALE.hero, ...(doc?.[locale]?.hero ?? {}) },
        essentials: {
            ...EMPTY_LOCALE.essentials,
            ...(doc?.[locale]?.essentials ?? {}),
            items: doc?.[locale]?.essentials?.items ?? [],
        },
        closing: { ...EMPTY_LOCALE.closing, ...(doc?.[locale]?.closing ?? {}) },
    });

    return { en: one("en"), bn: one("bn"), showcase: doc?.showcase ?? [] };
}

/** Drops the client-only _key RepeatableRows stamps onto every row. */
function toPayload(draft) {
    const one = (locale) => ({
        hero: draft[locale].hero,
        essentials: {
            ...draft[locale].essentials,
            items: stripKeys(draft[locale].essentials.items ?? []),
        },
        closing: draft[locale].closing,
    });

    return { en: one("en"), bn: one("bn"), showcase: stripKeys(draft.showcase ?? []) };
}

export default function PageCopyEditor() {
    const [saved, setSaved] = useState(null);
    const [draft, setDraft] = useState(null);
    const [status, setStatus] = useState("loading");
    const [errors, setErrors] = useState({});
    const [summary, setSummary] = useState("");
    const [saving, setSaving] = useState(false);
    const [locale, setLocale] = useState("en");
    const toast = useToast();

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const payload = await api.list("packages/page");
                if (cancelled) return;
                const hydrated = hydrate(payload.data);
                setSaved(hydrated);
                setDraft(hydrated);
                setStatus("ready");
            } catch (err) {
                if (cancelled) return;
                setStatus("error");
                setSummary(err.message || "Could not load the page copy.");
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    const dirty = useMemo(() => {
        if (!draft || !saved) return false;
        return JSON.stringify(toPayload(draft)) !== JSON.stringify(toPayload(saved));
    }, [draft, saved]);

    if (status === "loading") {
        return <p className="text-[0.9375rem] text-(--text-mute)">Loading…</p>;
    }

    if (status === "error" || !draft) {
        return (
            <p role="alert" className="text-[0.9375rem] text-signal">
                {summary}
            </p>
        );
    }

    const setField = (block, key) => (e) =>
        setDraft((prev) => ({
            ...prev,
            [locale]: { ...prev[locale], [block]: { ...prev[locale][block], [key]: e.target.value } },
        }));

    const value = (block, key) => draft[locale][block][key] ?? "";
    const err = (path) => errors[`${locale}.${path}`];

    async function save(event) {
        event.preventDefault();
        setSaving(true);
        setErrors({});
        setSummary("");

        try {
            const res = await api.put("packages", "page", toPayload(draft));
            const hydrated = hydrate(res.data);
            setSaved(hydrated);
            setDraft(hydrated);
            revalidate("packages");
            toast.success("Page copy saved.");
        } catch (error) {
            if (Array.isArray(error.details)) {
                setErrors(Object.fromEntries(error.details.map((d) => [d.field, d.message])));
                /* Row-level paths such as "showcase[3].url" have no Field to
                   attach to, so every message also goes into the summary. It
                   is the only place a bad row is nameable. */
                setSummary(error.details.map((d) => d.message).join(" · "));
            } else {
                setSummary(error.message || "Could not save the page copy.");
            }
            toast.error(error.message || "Save failed.");
        } finally {
            setSaving(false);
        }
    }

    return (
        <form onSubmit={save} noValidate className="space-y-5">
            {/* Locale switch. Not two forms: the save is one PUT for the whole
                document, so this only decides which half is on screen. */}
            <div
                role="tablist"
                aria-label="Language"
                className="flex flex-wrap gap-1 border-b border-(--line)"
            >
                {LOCALES.map((l) => {
                    const on = l.code === locale;
                    return (
                        <button
                            key={l.code}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            onClick={() => setLocale(l.code)}
                            className={cn(
                                "-mb-px border-b-2 px-4 py-2.5 text-[0.9375rem] transition-colors",
                                on
                                    ? "border-brand font-medium text-(--text)"
                                    : "border-transparent text-(--text-mute) hover:text-(--text)",
                            )}
                        >
                            {l.label}
                        </button>
                    );
                })}
            </div>

            {/* ── Masthead ────────────────────────────────────────────────── */}
            <section className="rounded-xl border border-(--line) bg-(--canvas) p-5">
                <h2 className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-(--text)">
                    Masthead
                </h2>
                <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-(--text-mute)">
                    The top of the page. The headline is plain text — it is split into word nodes
                    for the reveal animation, so markup or a coloured span inside it will not
                    survive. The spec row beneath it (tracks, packages, currency, billing) is
                    counted from the data and is not editable.
                </p>

                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    <Field label="Eyebrow" htmlFor="pk-eyebrow" error={err("hero.eyebrow")}>
                        <Input
                            id="pk-eyebrow"
                            value={value("hero", "eyebrow")}
                            onChange={setField("hero", "eyebrow")}
                            error={err("hero.eyebrow")}
                            placeholder="Packages"
                        />
                    </Field>

                    <Field
                        label="Headline"
                        htmlFor="pk-title"
                        error={err("hero.title")}
                        hint={<Counter value={value("hero", "title")} max={LIMITS.title} />}
                    >
                        <Input
                            id="pk-title"
                            value={value("hero", "title")}
                            onChange={setField("hero", "title")}
                            error={err("hero.title")}
                        />
                    </Field>

                    <Field
                        label="Lede"
                        htmlFor="pk-lede"
                        error={err("hero.lede")}
                        hint={<Counter value={value("hero", "lede")} max={LIMITS.lede} />}
                        className="sm:col-span-2"
                    >
                        <Textarea
                            id="pk-lede"
                            rows={4}
                            value={value("hero", "lede")}
                            onChange={setField("hero", "lede")}
                            error={err("hero.lede")}
                        />
                    </Field>

                    <Field
                        label="Trust line"
                        htmlFor="pk-trust"
                        error={err("hero.trust")}
                        hint="One line of proof under the lede. Leave empty to drop it."
                        className="sm:col-span-2"
                    >
                        <Textarea
                            id="pk-trust"
                            rows={2}
                            value={value("hero", "trust")}
                            onChange={setField("hero", "trust")}
                            error={err("hero.trust")}
                        />
                    </Field>
                </div>
            </section>

            {/* ── Essentials ──────────────────────────────────────────────── */}
            <section className="rounded-xl border border-(--line) bg-(--canvas) p-5">
                <h2 className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-(--text)">
                    Included in every package
                </h2>
                <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-(--text-mute)">
                    A numbered hairline grid. Four rows read best; the section is dropped entirely
                    when there are none.
                </p>

                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    <Field label="Kicker" htmlFor="pk-ess-kicker" error={err("essentials.kicker")}>
                        <Input
                            id="pk-ess-kicker"
                            value={value("essentials", "kicker")}
                            onChange={setField("essentials", "kicker")}
                            error={err("essentials.kicker")}
                        />
                    </Field>

                    <Field label="Title" htmlFor="pk-ess-title" error={err("essentials.title")}>
                        <Input
                            id="pk-ess-title"
                            value={value("essentials", "title")}
                            onChange={setField("essentials", "title")}
                            error={err("essentials.title")}
                        />
                    </Field>
                </div>

                <div className="mt-6">
                    <p className="label-mono text-(--text-mute)">Rows — up to {MAX_ESSENTIALS}</p>
                    <div className="mt-3">
                        <RepeatableRows
                            value={draft[locale].essentials.items ?? []}
                            onChange={(items) =>
                                setDraft((prev) => ({
                                    ...prev,
                                    [locale]: {
                                        ...prev[locale],
                                        essentials: { ...prev[locale].essentials, items },
                                    },
                                }))
                            }
                            columns={[
                                {
                                    key: "title",
                                    label: "Title",
                                    placeholder: "Local payment gateways",
                                    grow: false,
                                    required: true,
                                },
                                {
                                    key: "value",
                                    label: "Detail",
                                    placeholder: "Native bKash, Nagad…",
                                    required: true,
                                },
                            ]}
                            newRow={{ title: "", value: "" }}
                            max={MAX_ESSENTIALS}
                            addLabel="Add row"
                        />
                    </div>
                </div>
            </section>

            {/* ── Closing ─────────────────────────────────────────────────── */}
            <section className="rounded-xl border border-(--line) bg-(--canvas) p-5">
                <h2 className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-(--text)">
                    Closing band
                </h2>
                <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-(--text-mute)">
                    The inverted band at the foot of the page. The primary button goes to /contact
                    and the secondary opens WhatsApp on the number in lib/site.js — these fields set
                    the labels, not the destinations. An empty label hides that button.
                </p>

                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    <Field label="Title" htmlFor="pk-close-title" error={err("closing.title")}>
                        <Input
                            id="pk-close-title"
                            value={value("closing", "title")}
                            onChange={setField("closing", "title")}
                            error={err("closing.title")}
                        />
                    </Field>

                    <Field label="Body" htmlFor="pk-close-body" error={err("closing.body")}>
                        <Textarea
                            id="pk-close-body"
                            rows={3}
                            value={value("closing", "body")}
                            onChange={setField("closing", "body")}
                            error={err("closing.body")}
                        />
                    </Field>

                    <Field
                        label="Primary button"
                        htmlFor="pk-close-primary"
                        error={err("closing.primaryCta")}
                        hint="Links to /contact."
                    >
                        <Input
                            id="pk-close-primary"
                            value={value("closing", "primaryCta")}
                            onChange={setField("closing", "primaryCta")}
                            error={err("closing.primaryCta")}
                        />
                    </Field>

                    <Field
                        label="Secondary button"
                        htmlFor="pk-close-secondary"
                        error={err("closing.secondaryCta")}
                        hint="Opens WhatsApp."
                    >
                        <Input
                            id="pk-close-secondary"
                            value={value("closing", "secondaryCta")}
                            onChange={setField("closing", "secondaryCta")}
                            error={err("closing.secondaryCta")}
                        />
                    </Field>
                </div>
            </section>

            {/* ── Selected work ───────────────────────────────────────────── */}
            <section className="rounded-xl border border-(--line) bg-(--canvas) p-5">
                <h2 className="text-[1.0625rem] font-semibold tracking-[-0.015em] text-(--text)">
                    Selected work
                </h2>
                <p className="mt-2 max-w-prose text-[0.875rem] leading-relaxed text-(--text-mute)">
                    Outbound links to live sites, split into two labelled rows by group. Shared
                    between both languages — a brand name and a hostname do not translate, so this
                    list does not switch with the tabs above. Full <code>https://</code> URLs only;
                    the card derives the hostname and the favicon from them.
                </p>

                <div className="mt-5">
                    <RepeatableRows
                        value={draft.showcase ?? []}
                        onChange={(showcase) => setDraft((prev) => ({ ...prev, showcase }))}
                        columns={SHOWCASE_COLUMNS}
                        newRow={{ name: "", url: "", group: "custom" }}
                        max={MAX_SHOWCASE}
                        addLabel="Add link"
                    />
                </div>
            </section>

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
                    disabled={saving || !dirty}
                    className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-45"
                >
                    <SaveIcon className="size-4" />
                    {saving ? "Saving…" : "Save page copy"}
                </button>

                <button
                    type="button"
                    onClick={() => {
                        setDraft(saved);
                        setSummary("");
                        setErrors({});
                    }}
                    disabled={saving || !dirty}
                    className="rounded-lg border border-(--line) px-4 py-2.5 text-[0.9375rem] font-medium text-(--text-dim) transition-colors hover:bg-(--raised-2) hover:text-(--text) disabled:opacity-45"
                >
                    Discard changes
                </button>

                {/* Both languages save together, so the reminder belongs next to
                    the button rather than on the inactive tab nobody is looking at. */}
                {dirty && (
                    <p className="text-[0.8125rem] text-(--text-mute)">
                        Saves both languages at once.
                    </p>
                )}
            </div>
        </form>
    );
}
