"use client";

import { useEffect, useMemo, useState } from "react";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, NumberInput, Select, Toggle } from "@/components/admin/Fields";
import RepeatableRows, { stripKeys } from "@/components/admin/RepeatableRows";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusPill from "@/components/admin/StatusPill";
import { cn } from "@/lib/utils";
import { formatTaka, discountPercent } from "@/lib/packagesUi";

/**
 * /admin/packages → Packages. One priced tier per row.
 *
 * ── WHY THE PRICE PREVIEW IS IN THE FORM ─────────────────────────────────
 * The discount badge on the public page is derived, not typed: the percentage
 * comes from `amount` and `original`. An editor typing two numbers has no way
 * to know what the third one will say, and "40,500 was 45,000" is a 10% badge,
 * not the 25% they may have been aiming at. The preview strip under the fields
 * renders the same three values the page will, from the same helpers, so the
 * answer is visible before the save rather than after a deploy.
 *
 * ── WHY `original` IS ALLOWED TO BE EMPTY AND NOT ZERO ────────────────────
 * Clearing the list price is how a discount is removed. Zero is a real number
 * that would render a 100%-off badge, so the empty string is stripped from the
 * payload entirely rather than coerced — see toPayload below.
 *
 * ── WHY FEATURES USE RepeatableRows ──────────────────────────────────────
 * They are an ordered list of flat {label, value} rows edited and saved as a
 * unit, which is exactly what that component is for, reorder arrows included —
 * and order is meaningful here, since the first two rows are the ones read on
 * a phone.
 */

const EMPTY_LOCALE = { segment: "", name: "", badge: "", features: [] };

const EMPTY = {
    code: "",
    category: "",
    order: 0,
    highlighted: false,
    isActive: true,
    price: { amount: "", original: "", from: false, custom: false },
    en: { ...EMPTY_LOCALE },
    bn: { ...EMPTY_LOCALE },
};

const LOCALES = [
    { code: "en", label: "English", placeholders: { segment: "Professional", name: "Corporate Package", badge: "Growth ready" } },
    { code: "bn", label: "বাংলা", placeholders: { segment: "প্রফেশনাল", name: "কর্পোরেট প্যাকেজ", badge: "গ্রোথ-রেডি" } },
];

/* ⚑ 8 mirrors MAX_FEATURES in str-backend/src/validators/package.validator.js.
   A cap the form does not show is a save that fails with a message the editor
   cannot act on. */
const MAX_FEATURES = 8;

const FEATURE_COLUMNS = [
    { key: "label", label: "Label", placeholder: "UI / UX", grow: false, required: true },
    { key: "value", label: "Detail", placeholder: "Multi-page custom UI…", required: true },
];

export default function TiersEditor({ tracks, onChanged }) {
    const [rows, setRows] = useState([]);
    const [status, setStatus] = useState("loading");
    const [filter, setFilter] = useState("");
    const [editing, setEditing] = useState(null);
    const [draft, setDraft] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [summary, setSummary] = useState("");
    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const toast = useToast();

    async function load() {
        setStatus("loading");
        try {
            const payload = await api.list("packages/tiers");
            setRows(payload.data ?? []);
            setStatus("ready");
        } catch (err) {
            setStatus("error");
            setSummary(err.message || "Could not load the packages.");
        }
    }

    useEffect(() => {
        load();
    }, []);

    const trackOptions = useMemo(
        () => tracks.map((t) => ({ value: t._id, label: t.en?.title || t.key })),
        [tracks],
    );

    const visible = filter ? rows.filter((r) => (r.category?._id ?? r.category) === filter) : rows;

    const set = (key) => (v) => setDraft((prev) => ({ ...prev, [key]: v }));
    const setPrice = (key) => (v) => setDraft((prev) => ({ ...prev, price: { ...prev.price, [key]: v } }));
    const setLocale = (locale, key) => (v) =>
        setDraft((prev) => ({ ...prev, [locale]: { ...prev[locale], [key]: v } }));

    function openNew() {
        setDraft({
            ...EMPTY,
            price: { ...EMPTY.price },
            en: { ...EMPTY_LOCALE, features: [] },
            bn: { ...EMPTY_LOCALE, features: [] },
            category: filter || tracks[0]?._id || "",
            order: visible.length + 1,
        });
        setErrors({});
        setSummary("");
        setEditing("new");
    }

    function openEdit(row) {
        setDraft({
            ...EMPTY,
            ...row,
            // The list endpoint populates the category down to {_id, key,
            // en.title}; the select needs the bare id.
            category: row.category?._id ?? row.category ?? "",
            price: {
                amount: row.price?.amount ?? "",
                // null from the API becomes "" so the input is controlled.
                original: row.price?.original ?? "",
                from: Boolean(row.price?.from),
                custom: Boolean(row.price?.custom),
            },
            en: { ...EMPTY_LOCALE, ...(row.en ?? {}), features: row.en?.features ?? [] },
            bn: { ...EMPTY_LOCALE, ...(row.bn ?? {}), features: row.bn?.features ?? [] },
        });
        setErrors({});
        setSummary("");
        setEditing(row._id);
    }

    function toPayload() {
        const price = {
            amount: Number(draft.price.amount) || 0,
            from: Boolean(draft.price.from),
            custom: Boolean(draft.price.custom),
        };
        /* Absent, not 0 and not null: the validator skips a falsy `original`,
           and sending 0 would pass the type check and render a 100% badge. */
        if (String(draft.price.original).trim() !== "") {
            price.original = Number(draft.price.original);
        }

        return {
            code: draft.code.trim().toUpperCase(),
            category: draft.category,
            order: Number(draft.order) || 0,
            highlighted: Boolean(draft.highlighted),
            isActive: Boolean(draft.isActive),
            price,
            en: { ...draft.en, features: stripKeys(draft.en.features ?? []) },
            bn: { ...draft.bn, features: stripKeys(draft.bn.features ?? []) },
        };
    }

    async function save(event) {
        event.preventDefault();
        setSaving(true);
        setErrors({});
        setSummary("");

        try {
            const payload = toPayload();
            if (editing === "new") await api.create("packages/tiers", payload);
            else await api.update("packages/tiers", editing, payload);

            revalidate("packages");
            toast.success(editing === "new" ? "Package created." : "Package saved.");
            setEditing(null);
            await load();
            onChanged?.();
        } catch (err) {
            if (Array.isArray(err.details)) {
                setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
                /* Feature errors come back as "en.features[2].value", which
                   has no Field to attach to — RepeatableRows has no per-cell
                   error slot and inventing one for this screen alone is not
                   worth it. Those land in the summary line instead. */
                setSummary(err.details.map((d) => d.message).join(" · "));
            } else {
                setSummary(err.message || "Could not save this package.");
            }
            toast.error(err.message || "Save failed.");
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        const target = pendingDelete;
        setPendingDelete(null);
        try {
            await api.remove("packages/tiers", target._id);
            toast.success(`Deleted ${target.code}.`);
            revalidate("packages");
            await load();
            onChanged?.();
        } catch (err) {
            toast.error(err.message || "Could not delete this package.");
        }
    }

    const amount = Number(draft.price.amount) || 0;
    const original = String(draft.price.original).trim() === "" ? null : Number(draft.price.original);
    const previewPct = discountPercent(amount, original);

    const form = (
        <form
            onSubmit={save}
            noValidate
            className="space-y-7 rounded-xl border border-(--line) bg-(--canvas) p-5"
        >
            {summary && (
                <p role="alert" className="label-mono border-l-2 border-signal py-1 pl-3 text-signal">
                    {summary}
                </p>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
                <Field
                    label="Code"
                    htmlFor="tier-code"
                    required
                    error={errors.code}
                    hint="Uppercase, hyphens. Travels to /contact on the CTA, so keep it stable."
                >
                    <Input
                        id="tier-code"
                        value={draft.code}
                        onChange={(e) => set("code")(e.target.value)}
                        placeholder="BIZ-02"
                        error={errors.code}
                    />
                </Field>

                <Field label="Track" htmlFor="tier-track" required error={errors.category}>
                    <Select
                        id="tier-track"
                        value={draft.category}
                        onChange={(e) => set("category")(e.target.value)}
                        error={errors.category}
                        options={[{ value: "", label: "Pick a track" }, ...trackOptions]}
                    />
                </Field>

                <Field label="Order" htmlFor="tier-order" error={errors.order} hint="Within the track.">
                    <NumberInput
                        id="tier-order"
                        value={draft.order}
                        onChange={(e) => set("order")(e.target.value)}
                        error={errors.order}
                    />
                </Field>

                <div className="flex flex-col justify-end gap-3 pb-2.5">
                    <Toggle
                        id="tier-hot"
                        checked={draft.highlighted}
                        onChange={set("highlighted")}
                        label="Recommended (brand rule on the card)"
                    />
                    <Toggle
                        id="tier-active"
                        checked={draft.isActive}
                        onChange={set("isActive")}
                        label="Visible on the site"
                    />
                </div>
            </div>

            {/* ── Price ───────────────────────────────────────────────────── */}
            <div className="border-t border-(--line) pt-6">
                <h3 className="label-mono text-(--text)">Price</h3>

                <div className="mt-5 grid gap-6 sm:grid-cols-2">
                    <Field
                        label="Amount (৳)"
                        htmlFor="tier-amount"
                        required
                        error={errors["price.amount"]}
                        hint="Whole taka. No separators — 40500, not 40,500."
                    >
                        <NumberInput
                            id="tier-amount"
                            min={0}
                            value={draft.price.amount}
                            onChange={(e) => setPrice("amount")(e.target.value)}
                            error={errors["price.amount"]}
                        />
                    </Field>

                    <Field
                        label="List price (৳)"
                        htmlFor="tier-original"
                        error={errors["price.original"] ?? errors.price}
                        hint="Struck through beside the amount. Leave empty for no discount."
                    >
                        <NumberInput
                            id="tier-original"
                            min={0}
                            value={draft.price.original}
                            onChange={(e) => setPrice("original")(e.target.value)}
                            error={errors["price.original"] ?? errors.price}
                        />
                    </Field>

                    <div className="flex flex-col justify-end gap-3 pb-2.5 sm:col-span-2">
                        <Toggle
                            id="tier-from"
                            checked={draft.price.from}
                            onChange={setPrice("from")}
                            label='Show the "From" prefix (entry point, not a fixed fee)'
                        />
                        <Toggle
                            id="tier-custom"
                            checked={draft.price.custom}
                            onChange={setPrice("custom")}
                            label='Label it "custom scope" instead of "one-time project"'
                        />
                    </div>
                </div>

                {/* Rendered with the same helpers the public card uses, so what
                    is shown here is what will ship — not an approximation. */}
                <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-lg border border-(--line) bg-(--raised) px-4 py-3">
                    <span className="label-mono text-(--text-mute)">Preview</span>
                    {draft.price.from && (
                        <span className="text-[0.875rem] text-(--text-mute)">From</span>
                    )}
                    <span className="nums text-[1.25rem] font-medium text-(--text)">
                        {formatTaka(amount, "en")}
                    </span>
                    {previewPct > 0 && (
                        <>
                            <span className="nums text-[0.9375rem] text-(--text-mute) line-through">
                                {formatTaka(original, "en")}
                            </span>
                            <span className="label-mono nums text-brand">{previewPct}% off</span>
                        </>
                    )}
                    <span className="label-mono text-(--text-mute)">
                        · {draft.price.custom ? "custom scope" : "one-time project"}
                    </span>
                    <span className="label-mono ml-auto nums text-(--text-mute)">
                        বাংলা: {formatTaka(amount, "bn")}
                    </span>
                </div>

                {original !== null && previewPct === 0 && (
                    <p className="label-mono mt-2 text-signal">
                        The list price must be higher than the amount, or there is no discount to
                        show. The save will be refused.
                    </p>
                )}
            </div>

            {/* ── Copy, per locale ────────────────────────────────────────── */}
            {LOCALES.map(({ code, label, placeholders }) => (
                <div key={code} className="border-t border-(--line) pt-6">
                    <h3 className="label-mono text-(--text)">{label}</h3>

                    <div className="mt-5 grid gap-6 sm:grid-cols-3">
                        <Field
                            label="Segment"
                            htmlFor={`tier-${code}-segment`}
                            required
                            error={errors[`${code}.segment`]}
                        >
                            <Input
                                id={`tier-${code}-segment`}
                                value={draft[code].segment}
                                onChange={(e) => setLocale(code, "segment")(e.target.value)}
                                error={errors[`${code}.segment`]}
                                placeholder={placeholders.segment}
                            />
                        </Field>

                        <Field
                            label="Name"
                            htmlFor={`tier-${code}-name`}
                            required
                            error={errors[`${code}.name`]}
                        >
                            <Input
                                id={`tier-${code}-name`}
                                value={draft[code].name}
                                onChange={(e) => setLocale(code, "name")(e.target.value)}
                                error={errors[`${code}.name`]}
                                placeholder={placeholders.name}
                            />
                        </Field>

                        <Field
                            label="Badge"
                            htmlFor={`tier-${code}-badge`}
                            error={errors[`${code}.badge`]}
                        >
                            <Input
                                id={`tier-${code}-badge`}
                                value={draft[code].badge}
                                onChange={(e) => setLocale(code, "badge")(e.target.value)}
                                error={errors[`${code}.badge`]}
                                placeholder={placeholders.badge}
                            />
                        </Field>
                    </div>

                    <div className="mt-6">
                        <p className="label-mono text-(--text-mute)">
                            Features — up to {MAX_FEATURES}. Rendered as spec rows in the order
                            below.
                        </p>
                        <div className="mt-3">
                            <RepeatableRows
                                value={draft[code].features ?? []}
                                onChange={(next) => setLocale(code, "features")(next)}
                                columns={FEATURE_COLUMNS}
                                newRow={{ label: "", value: "" }}
                                max={MAX_FEATURES}
                                addLabel="Add feature"
                            />
                        </div>
                    </div>
                </div>
            ))}

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-brand px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-45"
                >
                    {saving ? "Saving…" : editing === "new" ? "Create package" : "Save changes"}
                </button>
                <button
                    type="button"
                    onClick={() => setEditing(null)}
                    className="rounded-lg border border-(--line) px-4 py-2.5 text-[0.9375rem] font-medium text-(--text-dim) transition-colors hover:bg-(--raised-2) hover:text-(--text)"
                >
                    Cancel
                </button>
            </div>
        </form>
    );

    if (status === "error") {
        return (
            <div className="border border-(--line) px-5 py-10 text-center">
                <p className="text-[0.9375rem] text-(--text)">{summary}</p>
                <button
                    type="button"
                    onClick={load}
                    className="label-mono mt-5 border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                    <label htmlFor="tier-filter" className="label-mono text-(--text-mute)">
                        Track
                    </label>
                    {/* Width on the wrapper, not on the control: CONTROL already
                        sets w-full and `cn` is a plain join, so a competing
                        w-auto would be decided by stylesheet order rather than
                        by the call site. */}
                    <div className="w-56">
                        <Select
                            id="tier-filter"
                            value={filter}
                            onChange={(e) => setFilter(e.target.value)}
                            options={[{ value: "", label: "All tracks" }, ...trackOptions]}
                        />
                    </div>
                    <span className="text-[0.9375rem] text-(--text-mute)">
                        {visible.length} package{visible.length === 1 ? "" : "s"}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={openNew}
                    disabled={tracks.length === 0}
                    className="rounded-lg bg-brand px-4 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-45"
                >
                    New package
                </button>
            </div>

            {tracks.length === 0 && (
                <p className="rounded-lg border border-(--line) px-4 py-3 text-[0.875rem] text-(--text-mute)">
                    Create a track first — a package has to belong to one.
                </p>
            )}

            {editing === "new" && form}

            <ul className={cn("space-y-px", status === "loading" && "opacity-60")}>
                {visible.map((row) =>
                    editing === row._id ? (
                        <li key={row._id}>{form}</li>
                    ) : (
                        <li
                            key={row._id}
                            className="flex flex-wrap items-center gap-4 rounded-xl border border-(--line) bg-(--canvas) px-5 py-4"
                        >
                            <span className="label-mono nums w-20 shrink-0 text-(--text-mute)">
                                {row.code}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate text-[0.9375rem] font-medium text-(--text)">
                                    {row.en?.name || "—"}
                                </span>
                                <span className="label-mono block truncate text-(--text-mute)">
                                    {row.category?.en?.title ?? row.category?.key ?? "No track"} ·{" "}
                                    {row.bn?.name || "⚠ No Bengali name"}
                                </span>
                            </span>
                            <span className="nums shrink-0 text-[0.9375rem] text-(--text)">
                                {formatTaka(row.price?.amount, "en")}
                            </span>
                            {row.highlighted && <StatusPill value="featured" label="Recommended" />}
                            {!row.isActive && <StatusPill value="inactive" label="Hidden" />}
                            <button
                                type="button"
                                onClick={() => openEdit(row)}
                                className="label-mono text-(--text-mute) transition-colors hover:text-(--text)"
                            >
                                Edit
                            </button>
                            <button
                                type="button"
                                onClick={() => setPendingDelete(row)}
                                className="label-mono text-(--text-mute) transition-colors hover:text-signal"
                            >
                                Delete
                            </button>
                        </li>
                    ),
                )}
            </ul>

            {visible.length === 0 && status !== "loading" && (
                <p className="border border-(--line) px-5 py-14 text-center text-[0.9375rem] text-(--text-mute)">
                    No packages in this view.
                </p>
            )}

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Delete this package?"
                body={
                    pendingDelete
                        ? `${pendingDelete.code} — "${pendingDelete.en?.name ?? ""}" will be removed permanently. To take it off the site without losing the copy, untick "Visible on the site" instead.`
                        : ""
                }
                confirmLabel="Delete permanently"
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}
