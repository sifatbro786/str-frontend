"use client";

import { useState } from "react";
import Image from "next/image";
import { useResource } from "@/hooks/useResource";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, Textarea, NumberInput, Toggle, CONTROL } from "@/components/admin/Fields";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusPill from "@/components/admin/StatusPill";
import { cn } from "@/lib/utils";

const EMPTY = {
  name: "", designation: "", bio: "", image: "",
  socialLinks: { linkedin: "", github: "", twitter: "" },
  displayOrder: 0, isActive: true,
};

/** An external URL not in next.config.mjs remotePatterns throws at render. */
function isExternal(src) {
  return /^https?:\/\//i.test(src ?? "");
}

export default function TeamAdminPage() {
  const [editing, setEditing] = useState(null); // _id or "new"
  const [draft, setDraft] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [summary, setSummary] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();

  const { rows, status, error, reload, setRows } = useResource("team", {
    sort: "displayOrder",
    limit: 100,
  });

  const set = (key) => (v) => setDraft((prev) => ({ ...prev, [key]: v }));
  const onInput = (key) => (e) => set(key)(e.target.value);
  // socialLinks must be submitted as a NESTED object. The API's sanitize
  // middleware deletes any key containing a dot as NoSQL-injection defence, so
  // a flattened "socialLinks.linkedin" is silently dropped and appears not to save.
  const setSocial = (key) => (e) =>
    setDraft((prev) => ({ ...prev, socialLinks: { ...prev.socialLinks, [key]: e.target.value } }));

  function openNew() {
    setDraft(EMPTY);
    setErrors({});
    setSummary("");
    setEditing("new");
  }

  function openEdit(row) {
    setDraft({ ...EMPTY, ...row, socialLinks: { ...EMPTY.socialLinks, ...(row.socialLinks ?? {}) } });
    setErrors({});
    setSummary("");
    setEditing(row._id);
  }

  async function save(event) {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setSummary("");

    const payload = { ...draft };
    delete payload._id;
    delete payload.createdAt;
    delete payload.updatedAt;
    delete payload.__v;

    try {
      if (editing === "new") await api.create("team", payload);
      else await api.update("team", editing, payload);

      revalidate("team");
      toast.success(editing === "new" ? "Team member added." : "Saved.");
      setEditing(null);
      reload();
    } catch (err) {
      if (Array.isArray(err.details)) {
        setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
      }
      setSummary(err.message || "Could not save this team member.");
      toast.error(err.message || "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(row) {
    const next = !row.isActive;
    setBusyId(row._id);
    setRows((list) => list.map((r) => (r._id === row._id ? { ...r, isActive: next } : r)));
    try {
      await api.update("team", row._id, { isActive: next });
      revalidate("team");
    } catch (err) {
      setRows((list) => list.map((r) => (r._id === row._id ? { ...r, isActive: !next } : r)));
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function saveOrder(row, value) {
    const displayOrder = Number(value);
    if (Number.isNaN(displayOrder) || displayOrder === row.displayOrder) return;
    setRows((list) => list.map((r) => (r._id === row._id ? { ...r, displayOrder } : r)));
    try {
      await api.update("team", row._id, { displayOrder });
      revalidate("team");
    } catch (err) {
      setRows((list) =>
        list.map((r) => (r._id === row._id ? { ...r, displayOrder: row.displayOrder } : r))
      );
      toast.error(err.message);
    }
  }

  async function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await api.remove("team", target._id);
      toast.success(`Removed ${target.name}.`);
      revalidate("team");
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
        <Field label="Name" htmlFor="tm-name" required error={errors.name}>
          <Input id="tm-name" value={draft.name} onChange={onInput("name")} error={errors.name} />
        </Field>
        <Field label="Designation" htmlFor="tm-role" error={errors.designation}>
          <Input id="tm-role" value={draft.designation} onChange={onInput("designation")} />
        </Field>
        <Field
          label="Image"
          htmlFor="tm-image"
          error={errors.image}
          hint="A path under /public, or an absolute URL."
          className="sm:col-span-2"
        >
          <Input id="tm-image" value={draft.image} onChange={onInput("image")} placeholder="/team/name.jpg" />
        </Field>
        <Field label="Bio" htmlFor="tm-bio" error={errors.bio} className="sm:col-span-2">
          <Textarea id="tm-bio" rows={4} value={draft.bio} onChange={onInput("bio")} />
        </Field>

        <Field label="LinkedIn" htmlFor="tm-linkedin">
          <Input id="tm-linkedin" value={draft.socialLinks.linkedin} onChange={setSocial("linkedin")} placeholder="https://" />
        </Field>
        <Field label="GitHub" htmlFor="tm-github">
          <Input id="tm-github" value={draft.socialLinks.github} onChange={setSocial("github")} placeholder="https://" />
        </Field>
        <Field label="Twitter" htmlFor="tm-twitter">
          <Input id="tm-twitter" value={draft.socialLinks.twitter} onChange={setSocial("twitter")} placeholder="https://" />
        </Field>
        <Field label="Display order" htmlFor="tm-order" error={errors.displayOrder}>
          <NumberInput
            id="tm-order"
            min={0}
            value={draft.displayOrder}
            onChange={(e) => set("displayOrder")(e.target.value === "" ? 0 : Number(e.target.value))}
          />
        </Field>
        <div className="flex items-end pb-2.5">
          <Toggle id="tm-active" checked={draft.isActive} onChange={set("isActive")} label="Active" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={saving}
          className="bg-brand px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
        >
          {saving ? "Saving…" : editing === "new" ? "Add member" : "Save changes"}
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
          {rows.length} member{rows.length === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={openNew}
          className="bg-brand px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi"
        >
          New member
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
              No team members yet.
            </li>
          )}

          {rows.map((row) => (
            <li key={row._id} className="border-b border-(--line-soft) last:border-0">
              <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
                <input
                  type="number"
                  aria-label={`Display order for ${row.name}`}
                  defaultValue={row.displayOrder}
                  onBlur={(e) => saveOrder(row, e.target.value)}
                  className={cn(CONTROL, "nums w-20 shrink-0 px-2 py-1.5 text-center")}
                />

                <div className="relative size-10 shrink-0 overflow-hidden border border-(--line) bg-(--raised-2)">
                  {row.image ? (
                    <Image
                      src={row.image}
                      alt=""
                      fill
                      sizes="40px"
                      unoptimized={isExternal(row.image)}
                      className="object-cover"
                    />
                  ) : null}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium text-(--text)">{row.name}</p>
                  <p className="label-mono truncate text-(--text-mute)">{row.designation || "—"}</p>
                </div>

                <button
                  type="button"
                  onClick={() => toggleActive(row)}
                  disabled={busyId === row._id}
                  aria-label={`Toggle ${row.name} active`}
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
        title="Remove this team member?"
        body={pendingDelete ? `${pendingDelete.name} will be removed permanently. This cannot be undone.` : ""}
        confirmLabel="Remove permanently"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
