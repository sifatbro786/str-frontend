"use client";

import { useEffect, useState } from "react";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, Textarea, Select, NumberInput, Toggle } from "@/components/admin/Fields";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusPill from "@/components/admin/StatusPill";
import { cn } from "@/lib/utils";

/**
 * /admin/packages → Tracks. The four tabs on the public /packages page.
 *
 * ── WHY THE TWO LOCALES SIT SIDE BY SIDE IN ONE FORM ─────────────────────
 * They could have been two tabs, and it would have been less to look at. But
 * the public page has a hard language switch, so a track saved in English only
 * is a blank tab for every Bengali reader and renders perfectly for the person
 * who saved it — the failure is invisible from the seat that caused it. The
 * server requires both locales on every write for that reason, and the form
 * shows both for the same one: the missing half has to be visible at the
 * moment of writing, not discovered later.
 *
 * ── WHY THE KEY IS EDITABLE ──────────────────────────────────────────────
 * Unlike the slugs elsewhere in this dashboard, this one is not a public URL —
 * it is the id the page uses to restore the open tab. An editor who typed
 * "buisness" has no other way to fix it, and nothing outside this collection
 * links to it.
 */

/* ⚑ Mirrors PACKAGE_CATEGORY_ICONS in str-backend/src/models/PackageCategory.js
   and the `paths` map in components/packages/PackageTiers.jsx. All three move
   together: an icon accepted here and unknown to the page renders the default
   mark with nothing reporting the mismatch. */
const ICONS = [
    { value: "business", label: "Business / corporate" },
    { value: "custom", label: "Custom build" },
    { value: "wordpress", label: "WordPress" },
    { value: "shopify", label: "Shopify" },
    { value: "seo", label: "SEO / marketing" },
    { value: "mobile", label: "Mobile app" },
];

const EMPTY = {
    key: "",
    icon: "custom",
    order: 0,
    isActive: true,
    en: { title: "", platform: "", bestFor: "" },
    bn: { title: "", platform: "", bestFor: "" },
};

const LOCALES = [
    { code: "en", label: "English" },
    { code: "bn", label: "বাংলা" },
];

export default function TracksEditor({ onChanged }) {
    const [rows, setRows] = useState([]);
    const [status, setStatus] = useState("loading");
    const [editing, setEditing] = useState(null); // _id | "new" | null
    const [draft, setDraft] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [summary, setSummary] = useState("");
    const [saving, setSaving] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const toast = useToast();

    async function load() {
        setStatus("loading");
        try {
            const payload = await api.list("packages/categories");
            setRows(payload.data ?? []);
            setStatus("ready");
        } catch (err) {
            setStatus("error");
            setSummary(err.message || "Could not load the tracks.");
        }
    }

    useEffect(() => {
        load();
    }, []);

    const set = (key) => (v) => setDraft((prev) => ({ ...prev, [key]: v }));
    const setLocale = (locale, key) => (e) =>
        setDraft((prev) => ({ ...prev, [locale]: { ...prev[locale], [key]: e.target.value } }));

    function openNew() {
        setDraft({ ...EMPTY, order: rows.length + 1 });
        setErrors({});
        setSummary("");
        setEditing("new");
    }

    function openEdit(row) {
        setDraft({
            ...EMPTY,
            ...row,
            en: { ...EMPTY.en, ...(row.en ?? {}) },
            bn: { ...EMPTY.bn, ...(row.bn ?? {}) },
        });
        setErrors({});
        setSummary("");
        setEditing(row._id);
    }

    async function save(event) {
        event.preventDefault();
        setSaving(true);
        setErrors({});
        setSummary("");

        const payload = {
            key: draft.key.trim().toLowerCase(),
            icon: draft.icon,
            /* Typed into a text input, so it arrives as a string. Coerced here
               rather than in the input: a field that rewrites its own value
               while somebody is typing "1" on the way to "10" is the classic
               controlled-number bug. */
            order: Number(draft.order) || 0,
            isActive: Boolean(draft.isActive),
            en: draft.en,
            bn: draft.bn,
        };

        try {
            if (editing === "new") await api.create("packages/categories", payload);
            else await api.update("packages/categories", editing, payload);

            revalidate("packages");
            toast.success(editing === "new" ? "Track created." : "Track saved.");
            setEditing(null);
            await load();
            onChanged?.();
        } catch (err) {
            /* express-validator reports nested paths as "en.title". Kept
               verbatim as the error key so the Field below can look itself up
               without a translation table that would drift. */
            if (Array.isArray(err.details)) {
                setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
            }
            setSummary(err.message || "Could not save this track.");
            toast.error(err.message || "Save failed.");
        } finally {
            setSaving(false);
        }
    }

    async function confirmDelete() {
        const target = pendingDelete;
        setPendingDelete(null);
        try {
            await api.remove("packages/categories", target._id);
            toast.success(`Deleted "${target.en?.title ?? target.key}".`);
            revalidate("packages");
            await load();
            onChanged?.();
        } catch (err) {
            /* The API answers 409 while packages still point at this track,
               and the message names the count. Surfaced as a toast rather than
               swallowed: it is the one delete on this screen that can fail for
               a reason the editor can act on. */
            toast.error(err.message || "Could not delete this track.");
        }
    }

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
                    label="Key"
                    htmlFor="tr-key"
                    required
                    error={errors.key}
                    hint="Lowercase, hyphens only. Used to restore the open tab on the public page."
                >
                    <Input
                        id="tr-key"
                        value={draft.key}
                        onChange={(e) => set("key")(e.target.value)}
                        placeholder="wordpress"
                        error={errors.key}
                    />
                </Field>

                <Field label="Icon" htmlFor="tr-icon" error={errors.icon}>
                    <Select
                        id="tr-icon"
                        value={draft.icon}
                        onChange={(e) => set("icon")(e.target.value)}
                        options={ICONS}
                    />
                </Field>

                <Field
                    label="Order"
                    htmlFor="tr-order"
                    error={errors.order}
                    hint="Low numbers first. Ties fall back to creation date."
                >
                    <NumberInput
                        id="tr-order"
                        value={draft.order}
                        onChange={(e) => set("order")(e.target.value)}
                        error={errors.order}
                    />
                </Field>

                <div className="flex items-end pb-2.5">
                    <Toggle
                        id="tr-active"
                        checked={draft.isActive}
                        onChange={set("isActive")}
                        label="Visible on the site"
                    />
                </div>
            </div>

            {LOCALES.map(({ code, label }) => (
                <div key={code} className="border-t border-(--line) pt-6">
                    <h3 className="label-mono text-(--text)">{label}</h3>
                    <div className="mt-5 grid gap-6 sm:grid-cols-2">
                        <Field
                            label="Title"
                            htmlFor={`tr-${code}-title`}
                            required
                            error={errors[`${code}.title`]}
                        >
                            <Input
                                id={`tr-${code}-title`}
                                value={draft[code].title}
                                onChange={setLocale(code, "title")}
                                error={errors[`${code}.title`]}
                                placeholder={code === "en" ? "WordPress Store" : "ওয়ার্ডপ্রেস স্টোর"}
                            />
                        </Field>

                        <Field
                            label="Platform note"
                            htmlFor={`tr-${code}-platform`}
                            error={errors[`${code}.platform`]}
                            hint="Rendered as quiet type beside the title."
                        >
                            <Input
                                id={`tr-${code}-platform`}
                                value={draft[code].platform}
                                onChange={setLocale(code, "platform")}
                                error={errors[`${code}.platform`]}
                                placeholder="WooCommerce"
                            />
                        </Field>

                        <Field
                            label="Best for"
                            htmlFor={`tr-${code}-bestfor`}
                            error={errors[`${code}.bestFor`]}
                            className="sm:col-span-2"
                        >
                            <Textarea
                                id={`tr-${code}-bestfor`}
                                rows={3}
                                value={draft[code].bestFor}
                                onChange={setLocale(code, "bestFor")}
                                error={errors[`${code}.bestFor`]}
                            />
                        </Field>
                    </div>
                </div>
            ))}

            <div className="flex flex-wrap items-center gap-3">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-brand px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-45"
                >
                    {saving ? "Saving…" : editing === "new" ? "Create track" : "Save changes"}
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
                <p className="text-[0.9375rem] text-(--text-mute)">
                    {rows.length} track{rows.length === 1 ? "" : "s"}. A track with no visible
                    package is dropped from the page rather than rendering an empty tab.
                </p>
                <button
                    type="button"
                    onClick={openNew}
                    className="rounded-lg bg-brand px-4 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi"
                >
                    New track
                </button>
            </div>

            {editing === "new" && form}

            <ul className={cn("space-y-px", status === "loading" && "opacity-60")}>
                {rows.map((row) =>
                    editing === row._id ? (
                        <li key={row._id}>{form}</li>
                    ) : (
                        <li
                            key={row._id}
                            className="flex flex-wrap items-center gap-4 rounded-xl border border-(--line) bg-(--canvas) px-5 py-4"
                        >
                            <span className="label-mono nums w-8 shrink-0 text-(--text-mute)">
                                {row.order}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-[0.9375rem] font-medium text-(--text)">
                                    {row.en?.title || row.key}
                                </span>
                                <span className="label-mono block truncate text-(--text-mute)">
                                    {row.bn?.title || "⚠ No Bengali title"} · {row.key}
                                </span>
                            </span>
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

            {rows.length === 0 && status !== "loading" && (
                <p className="border border-(--line) px-5 py-14 text-center text-[0.9375rem] text-(--text-mute)">
                    No tracks yet. Run <code>npm run seed:packages</code> on the API to load the
                    published set, or create one above.
                </p>
            )}

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Delete this track?"
                body={
                    pendingDelete
                        ? `"${pendingDelete.en?.title ?? pendingDelete.key}" will be removed permanently. If packages still point at it the delete is refused — deactivate it instead to hide it from the site.`
                        : ""
                }
                confirmLabel="Delete permanently"
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}
