"use client";

import { useState } from "react";
import { useResource } from "@/hooks/useResource";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, Textarea, NumberInput, Toggle, CONTROL } from "@/components/admin/Fields";
import TagInput from "@/components/admin/TagInput";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusPill from "@/components/admin/StatusPill";
import { cn } from "@/lib/utils";

const EMPTY = {
  title: "", shortDescription: "", detailedOverview: "", icon: "",
  featuresList: [], deliverableTimeline: "", order: 0, isActive: true,
};

/**
 * Services list. Seven rows and a small form, so this uses an inline expanding
 * row editor rather than separate /new and /[id] routes — the round trip to a
 * dedicated page costs more than the form is worth at this size.
 */
export default function ServicesAdminPage() {
  const [editing, setEditing] = useState(null); // service _id, or "new"
  const [draft, setDraft] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();

  const { rows, status, error, reload, setRows } = useResource("services", {
    sort: "order",
    limit: 50,
  });

  function openNew() {
    setDraft(EMPTY);
    setErrors({});
    setSummary("");
    setEditing("new");
  }

  function openEdit(row) {
    setDraft({ ...EMPTY, ...row });
    setErrors({});
    setSummary("");
    setEditing(row._id);
  }

  const set = (key) => (v) => setDraft((prev) => ({ ...prev, [key]: v }));
  const onInput = (key) => (e) => set(key)(e.target.value);

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setSummary("");

    const payload = { ...draft };
    delete payload.slug;
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.__v;

    try {
      if (editing === "new") await api.create("services", payload);
      else await api.update("services", editing, payload);

      revalidate("services");
      toast.success(editing === "new" ? "Service created." : "Saved.");
      setEditing(null);
      reload();
    } catch (err) {
      if (Array.isArray(err.details)) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setSummary(err.message || "Could not save this service.");
      toast.error(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  /** Optimistic isActive toggle, rolled back on error. */
  async function toggleActive(row) {
    const next = !row.isActive;
    setBusyId(row._id);
    setRows((list) => list.map((r) => (r._id === row._id ? { ...r, isActive: next } : r)));
    try {
      await api.update("services", row._id, { isActive: next });
      revalidate("services");
    } catch (err) {
      setRows((list) => list.map((r) => (r._id === row._id ? { ...r, isActive: !next } : r)));
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  /** Order is saved on blur so a stream of arrow-key ticks is one request. */
  async function saveOrder(row, value) {
    const order = Number(value);
    if (Number.isNaN(order) || order === row.order) return;
    setRows((list) => list.map((r) => (r._id === row._id ? { ...r, order } : r)));
    try {
      await api.update("services", row._id, { order });
      revalidate("services");
    } catch (err) {
      setRows((list) => list.map((r) => (r._id === row._id ? { ...r, order: row.order } : r)));
      toast.error(err.message);
    }
  }

  async function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await api.remove("services", target._id);
      toast.success(`Deleted "${target.title}".`);
      revalidate("services");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const form = (
    <form onSubmit={save} noValidate className="space-y-6 border-t border-(--line) bg-(--raised) p-5">
      {summary && (
        <p role="alert" className="label-mono border-l-2 border-signal py-1 pl-3 text-signal">
          {summary}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Title" htmlFor="svc-title" required error={errors.title}>
          <Input id="svc-title" value={draft.title} onChange={onInput("title")} error={errors.title} maxLength={120} />
        </Field>
        <Field
          label="Icon"
          htmlFor="svc-icon"
          error={errors.icon}
          hint="A lucide key such as code — not a file path. Artwork lives in SERVICE_MEDIA."
        >
          <Input id="svc-icon" value={draft.icon} onChange={onInput("icon")} placeholder="code" />
        </Field>
        <Field label="Short description" htmlFor="svc-short" error={errors.shortDescription} className="sm:col-span-2">
          <Textarea id="svc-short" rows={3} value={draft.shortDescription} onChange={onInput("shortDescription")} />
        </Field>
        <Field
          label="Detailed overview (HTML)"
          htmlFor="svc-detail"
          error={errors.detailedOverview}
          hint="HTML is sanitized server-side on save."
          className="sm:col-span-2"
        >
          <Textarea
            id="svc-detail"
            rows={12}
            value={draft.detailedOverview}
            onChange={onInput("detailedOverview")}
            className="font-mono text-[0.8125rem]"
          />
        </Field>
        <Field label="Features list" htmlFor="svc-features" error={errors.featuresList} className="sm:col-span-2">
          <TagInput id="svc-features" value={draft.featuresList} onChange={set("featuresList")} />
        </Field>
        <Field label="Deliverable timeline" htmlFor="svc-timeline" error={errors.deliverableTimeline}>
          <Input
            id="svc-timeline"
            value={draft.deliverableTimeline}
            onChange={onInput("deliverableTimeline")}
            placeholder="6–10 weeks"
          />
        </Field>
        <Field label="Order" htmlFor="svc-order" error={errors.order}>
          <NumberInput
            id="svc-order"
            min={0}
            value={draft.order}
            onChange={(e) => set("order")(e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </Field>
        <div className="flex items-end pb-2.5">
          <Toggle id="svc-active" checked={draft.isActive} onChange={set("isActive")} label="Active" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
        >
          {saving ? "Saving…" : editing === "new" ? "Create service" : "Save changes"}
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
          {rows.length} service{rows.length === 1 ? "" : "s"} · edit expands in place
        </p>
        <button
          type="button"
          onClick={openNew}
          className="bg-brand px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi"
        >
          New service
        </button>
      </div>

      {editing === "new" && <div className="border border-(--line)">{form}</div>}

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
      ) : (
        <ul className={cn("border border-(--line)", status === "loading" && "opacity-60")}>
          {rows.length === 0 && status !== "loading" && (
            <li className="px-5 py-14 text-center text-[0.9375rem] text-(--text-mute)">
              No services yet.
            </li>
          )}

          {rows.map((row) => (
            <li key={row._id} className="border-b border-(--line-soft) last:border-0">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
                <input
                  type="number"
                  aria-label={`Display order for ${row.title}`}
                  defaultValue={row.order}
                  onBlur={(e) => saveOrder(row, e.target.value)}
                  className={cn(CONTROL, "nums w-20 shrink-0 px-2 py-1.5 text-center")}
                />

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium text-(--text)">{row.title}</p>
                  <p className="label-mono truncate text-(--text-mute)">/{row.slug}</p>
                </div>

                <span className="label-mono hidden text-(--text-mute) md:block">
                  {row.deliverableTimeline || "—"}
                </span>

                <button
                  type="button"
                  onClick={() => toggleActive(row)}
                  disabled={busyId === row._id}
                  aria-label={`Toggle ${row.title} active`}
                  className="transition-opacity disabled:opacity-50"
                >
                  <StatusPill value={row.isActive ? "active" : "inactive"} />
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => (editing === row._id ? setEditing(null) : openEdit(row))}
                    className="label-mono text-(--text-mute) transition-colors hover:text-(--text)"
                  >
                    {editing === row._id ? "Close" : "Edit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingDelete(row)}
                    className="label-mono text-(--text-mute) transition-colors hover:text-signal"
                  >
                    Delete
                  </button>
                </div>
              </div>

              {editing === row._id && form}
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this service?"
        body={
          pendingDelete
            ? `"${pendingDelete.title}" will be removed permanently, including its detailed overview. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
