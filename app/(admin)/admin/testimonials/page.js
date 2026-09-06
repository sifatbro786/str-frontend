"use client";

import { useEffect, useState } from "react";
import { useResource } from "@/hooks/useResource";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, Textarea, Select, Toggle } from "@/components/admin/Fields";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusPill from "@/components/admin/StatusPill";
import { cn } from "@/lib/utils";

const EMPTY = {
  clientName: "", clientDesignation: "", companyName: "", clientAvatar: "",
  rating: 5, reviewText: "", projectRef: "", isFeatured: false,
};

/**
 * Card grid rather than a table: five short text fields and a paragraph of
 * review copy read far better as cards than as truncated table cells.
 */
export default function TestimonialsAdminPage() {
  const [editing, setEditing] = useState(null); // _id or "new"
  const [draft, setDraft] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [projects, setProjects] = useState([]);
  const toast = useToast();

  const { rows, status, error, reload } = useResource("testimonials", { limit: 100 });

  // Populates the "linked project" select. Fetched once, not per card.
  useEffect(() => {
    api
      .list("projects/admin/all", { limit: 100, fields: "title" })
      .then((p) => setProjects(p.data ?? []))
      .catch(() => setProjects([]));
  }, []);

  const set = (key) => (v) => setDraft((prev) => ({ ...prev, [key]: v }));
  const onInput = (key) => (e) => set(key)(e.target.value);

  function openNew() {
    setDraft(EMPTY);
    setErrors({});
    setSummary("");
    setEditing("new");
  }

  function openEdit(row) {
    setDraft({
      ...EMPTY,
      ...row,
      // projectRef arrives populated ({_id,title,slug}) from the list endpoint.
      projectRef: row.projectRef?._id ?? row.projectRef ?? "",
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

    const payload = { ...draft, rating: Number(draft.rating) };
    // An explicit "no linked project" must clear the ref, so send null not "".
    payload.projectRef = payload.projectRef || null;
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.__v;

    try {
      if (editing === "new") await api.create("testimonials", payload);
      else await api.update("testimonials", editing, payload);

      revalidate("testimonials");
      toast.success(editing === "new" ? "Testimonial created." : "Saved.");
      setEditing(null);
      reload();
    } catch (err) {
      if (Array.isArray(err.details)) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setSummary(err.message || "Could not save this testimonial.");
      toast.error(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await api.remove("testimonials", target._id);
      toast.success(`Deleted the testimonial from ${target.clientName}.`);
      revalidate("testimonials");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const form = (
    <form onSubmit={save} noValidate className="space-y-6 border border-(--line) bg-(--raised) p-5">
      {summary && (
        <p role="alert" className="label-mono border-l-2 border-signal py-1 pl-3 text-signal">
          {summary}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Client name" htmlFor="t-name" required error={errors.clientName}>
          <Input id="t-name" value={draft.clientName} onChange={onInput("clientName")} error={errors.clientName} />
        </Field>
        <Field label="Designation" htmlFor="t-role" error={errors.clientDesignation}>
          <Input id="t-role" value={draft.clientDesignation} onChange={onInput("clientDesignation")} />
        </Field>
        <Field label="Company" htmlFor="t-company" error={errors.companyName}>
          <Input id="t-company" value={draft.companyName} onChange={onInput("companyName")} />
        </Field>
        <Field
          label="Avatar"
          htmlFor="t-avatar"
          error={errors.clientAvatar}
          hint="A path under /public, or an absolute URL."
        >
          <Input id="t-avatar" value={draft.clientAvatar} onChange={onInput("clientAvatar")} />
        </Field>
        <Field label="Rating" htmlFor="t-rating" error={errors.rating}>
          <Select
            id="t-rating"
            value={String(draft.rating)}
            onChange={onInput("rating")}
            options={[5, 4, 3, 2, 1].map((n) => ({ value: String(n), label: `${n} / 5` }))}
          />
        </Field>
        <Field label="Linked project" htmlFor="t-project" error={errors.projectRef}>
          <Select
            id="t-project"
            value={draft.projectRef ?? ""}
            onChange={onInput("projectRef")}
            options={[
              { value: "", label: "No linked project" },
              ...projects.map((p) => ({ value: p._id, label: p.title })),
            ]}
          />
        </Field>
        <Field label="Review" htmlFor="t-review" required error={errors.reviewText} className="sm:col-span-2">
          <Textarea
            id="t-review"
            rows={5}
            value={draft.reviewText}
            onChange={onInput("reviewText")}
            error={errors.reviewText}
          />
        </Field>
        <div className="flex items-end pb-2.5">
          <Toggle id="t-featured" checked={draft.isFeatured} onChange={set("isFeatured")} label="Featured" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
        >
          {saving ? "Saving…" : editing === "new" ? "Create testimonial" : "Save changes"}
        </button>
        <button
          type="button"
          onClick={() => setEditing(null)}
          className="label-mono border border-(--line) px-5 py-3 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
        >
          Cancel
        </button>
      </div>
    </form>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-[0.9375rem] text-(--text-mute)">
          {rows.length} testimonial{rows.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={openNew}
          className="bg-brand px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi"
        >
          New testimonial
        </button>
      </div>

      {editing === "new" && form}

      {status === "error" ? (
        <div className="border border-(--line) px-5 py-10 text-center">
          <p className="text-[0.9375rem] text-(--text)">{error?.message}</p>
          <button
            type="button"
            onClick={reload}
            className="label-mono mt-5 border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
          >
            Retry
          </button>
        </div>
      ) : rows.length === 0 && status !== "loading" ? (
        <p className="border border-(--line) px-5 py-14 text-center text-[0.9375rem] text-(--text-mute)">
          No testimonials yet.
        </p>
      ) : (
        <ul className={cn("grid gap-px bg-(--line) lg:grid-cols-2", status === "loading" && "opacity-60")}>
          {rows.map((row) =>
            editing === row._id ? (
              <li key={row._id} className="bg-(--canvas) lg:col-span-2">
                {form}
              </li>
            ) : (
              <li key={row._id} className="flex flex-col bg-(--canvas) p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-[0.9375rem] font-medium text-(--text)">{row.clientName}</p>
                    <p className="label-mono mt-1.5 text-(--text-mute)">
                      {[row.clientDesignation, row.companyName].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="label-mono nums text-(--text-mute)">{row.rating}/5</span>
                    {row.isFeatured && <StatusPill value="featured" />}
                  </div>
                </div>

                <p className="mt-4 flex-1 text-[0.875rem] leading-relaxed text-(--text-dim)">
                  {row.reviewText}
                </p>

                <div className="mt-5 flex items-center gap-4 border-t border-(--line-soft) pt-4">
                  <span className="label-mono min-w-0 flex-1 truncate text-(--text-mute)">
                    {row.projectRef?.title ?? "No linked project"}
                  </span>
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
                </div>
              </li>
            )
          )}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this testimonial?"
        body={pendingDelete ? `The review from ${pendingDelete.clientName} will be removed permanently.` : ""}
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
