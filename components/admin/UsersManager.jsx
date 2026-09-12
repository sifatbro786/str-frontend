"use client";

import { useEffect, useRef, useState } from "react";
import { useResource, useDebounced } from "@/hooks/useResource";
import { api } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import { Field, Input, Select, CONTROL } from "@/components/admin/Fields";
import Toolbar from "@/components/admin/Toolbar";
import Pagination from "@/components/admin/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusPill from "@/components/admin/StatusPill";
import { cn } from "@/lib/utils";

/**
 * Admin user management.
 *
 * ── WHY ROLE IS AN INLINE SELECT AND NOT A FORM FIELD ────────────────────
 * Promoting someone is the single most common thing this screen is opened
 * for, and burying it behind Edit → change → Save makes the frequent case cost
 * four interactions. The select sits in the row and writes on change, with the
 * row rolled back if the API refuses — which it will, for the guarded cases
 * (own role, last super admin). The server message is what gets shown; this
 * component never predicts the refusal itself, or the two rule sets drift.
 *
 * ── WHY EVERY MUTATION IS OPTIMISTIC BUT REVERSIBLE ──────────────────────
 * Same pattern as the team page: patch the row immediately, restore the exact
 * previous value on failure. Not a reload() — a reload after a failed write
 * looks identical to a successful one to anyone not reading the toast.
 */

const ROLES = [
    { value: "admin", label: "Admin" },
    { value: "super_admin", label: "Super admin" },
];

const EMPTY = { name: "", email: "", password: "", role: "admin" };

const PAGE_SIZE = 20;

/**
 * Satisfies the API's rule (10+, one of each class) by construction rather
 * than by retrying until a random string happens to pass. crypto, not
 * Math.random: this value is a real credential from the moment it is shown.
 */
function generatePassword(length = 16) {
    const sets = [
        "abcdefghijkmnopqrstuvwxyz",
        "ABCDEFGHJKLMNPQRSTUVWXYZ",
        "23456789",
        "!@#$%^&*-_=+",
    ];
    const all = sets.join("");
    const bytes = new Uint32Array(length);
    crypto.getRandomValues(bytes);

    // One guaranteed character per class, then fill, then shuffle so the
    // guaranteed ones are not always in positions 0-3.
    const out = sets.map((set, i) => set[bytes[i] % set.length]);
    for (let i = sets.length; i < length; i += 1) out.push(all[bytes[i] % all.length]);

    const order = new Uint32Array(out.length);
    crypto.getRandomValues(order);
    for (let i = out.length - 1; i > 0; i -= 1) {
        const j = order[i] % (i + 1);
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out.join("");
}

function initials(name) {
    return String(name || "?")
        .trim()
        .charAt(0)
        .toUpperCase();
}

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export default function UsersManager({ currentUserId }) {
    const toast = useToast();

    const [search, setSearch] = useState("");
    const [role, setRole] = useState("");
    const [status, setStatus] = useState("");
    const [page, setPage] = useState(1);
    const debouncedSearch = useDebounced(search);

    const [creating, setCreating] = useState(false);
    const [editing, setEditing] = useState(null); // row._id
    const [draft, setDraft] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [summary, setSummary] = useState("");
    const [saving, setSaving] = useState(false);
    const [revealPassword, setRevealPassword] = useState(false);

    const [busyId, setBusyId] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [pendingReset, setPendingReset] = useState(null);

    const { rows, meta, status: loadState, error, reload, setRows } = useResource("users", {
        search: debouncedSearch,
        role,
        status,
        page,
        limit: PAGE_SIZE,
    });

    // Any filter change invalidates the current page number — page 3 of an
    // unfiltered list is usually page 0 of a filtered one, which renders empty
    // and reads as "no results".
    useEffect(() => {
        setPage(1);
    }, [debouncedSearch, role, status]);

    const set = (key) => (e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }));

    function openNew() {
        setDraft({ ...EMPTY, password: generatePassword() });
        setErrors({});
        setSummary("");
        setRevealPassword(true);
        setEditing(null);
        setCreating(true);
    }

    function openEdit(row) {
        setDraft({ name: row.name, email: row.email, role: row.role, password: "" });
        setErrors({});
        setSummary("");
        setCreating(false);
        setEditing(row._id);
    }

    function closeForm() {
        setCreating(false);
        setEditing(null);
        setErrors({});
        setSummary("");
    }

    async function save(event) {
        event.preventDefault();
        setSaving(true);
        setErrors({});
        setSummary("");

        try {
            if (creating) {
                await api.create("users", {
                    name: draft.name,
                    email: draft.email,
                    password: draft.password,
                    role: draft.role,
                });
                toast.success(`${draft.name} can now sign in.`);
            } else {
                // `password` is deliberately absent — PATCH /users/:id rejects it
                // outright. Passwords move only through the reset dialog, which
                // hits /users/:id/password and ends that account's sessions.
                await api.update("users", editing, {
                    name: draft.name,
                    email: draft.email,
                    role: draft.role,
                });
                toast.success("Saved.");
            }
            closeForm();
            reload();
        } catch (err) {
            if (Array.isArray(err.details)) {
                setErrors(Object.fromEntries(err.details.map((d) => [d.field, d.message])));
            }
            setSummary(err.message || "Could not save this user.");
            toast.error(err.message || "Save failed.");
        } finally {
            setSaving(false);
        }
    }

    /** Optimistic single-field patch with an exact rollback. */
    async function patchRow(row, patch, successMessage) {
        const previous = Object.fromEntries(Object.keys(patch).map((k) => [k, row[k]]));
        setBusyId(row._id);
        setRows((list) => list.map((r) => (r._id === row._id ? { ...r, ...patch } : r)));
        try {
            await api.update("users", row._id, patch);
            if (successMessage) toast.success(successMessage);
        } catch (err) {
            setRows((list) => list.map((r) => (r._id === row._id ? { ...r, ...previous } : r)));
            // The server owns the rules (own role, last super admin); surface its
            // sentence verbatim rather than paraphrasing it here.
            toast.error(err.message);
        } finally {
            setBusyId(null);
        }
    }

    async function confirmDelete() {
        const target = pendingDelete;
        setPendingDelete(null);
        try {
            await api.remove("users", target._id);
            toast.success(`Removed ${target.name}.`);
            reload();
        } catch (err) {
            toast.error(err.message);
        }
    }

    const isLoading = loadState === "loading";

    const form = (
        <form
            onSubmit={save}
            noValidate
            className="space-y-6 border-t border-(--line) bg-(--raised) p-5"
        >
            {summary && (
                <p role="alert" className="label-mono border-l-2 border-signal py-1 pl-3 text-signal">
                    {summary}
                </p>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
                <Field label="Name" htmlFor="u-name" required error={errors.name}>
                    <Input id="u-name" value={draft.name} onChange={set("name")} error={errors.name} />
                </Field>

                <Field label="Email" htmlFor="u-email" required error={errors.email}>
                    <Input
                        id="u-email"
                        type="email"
                        autoComplete="off"
                        value={draft.email}
                        onChange={set("email")}
                        error={errors.email}
                    />
                </Field>

                <Field
                    label="Role"
                    htmlFor="u-role"
                    error={errors.role}
                    hint="Super admin can manage users and every section. Admin can manage content but not accounts."
                    className="sm:col-span-2"
                >
                    <Select id="u-role" value={draft.role} onChange={set("role")} options={ROLES} />
                </Field>

                {creating && (
                    <Field
                        label="Temporary password"
                        htmlFor="u-password"
                        required
                        error={errors.password}
                        hint="Shown once. Send it to them over a channel you trust — they can change it from their own account."
                        className="sm:col-span-2"
                    >
                        <div className="flex flex-wrap gap-2">
                            <Input
                                id="u-password"
                                type={revealPassword ? "text" : "password"}
                                autoComplete="new-password"
                                value={draft.password}
                                onChange={set("password")}
                                error={errors.password}
                                className="min-w-56 flex-1 font-mono"
                            />
                            <button
                                type="button"
                                onClick={() => setRevealPassword((v) => !v)}
                                className="label-mono rounded-lg border border-(--line) px-3 py-2.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
                            >
                                {revealPassword ? "Hide" : "Show"}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    const next = generatePassword();
                                    setDraft((prev) => ({ ...prev, password: next }));
                                    setRevealPassword(true);
                                }}
                                className="label-mono rounded-lg border border-(--line) px-3 py-2.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
                            >
                                Generate
                            </button>
                        </div>
                    </Field>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-brand px-6 py-3 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
                >
                    {saving ? "Saving…" : creating ? "Create user" : "Save changes"}
                </button>
                <button
                    type="button"
                    onClick={closeForm}
                    className="label-mono rounded-lg border border-(--line) px-5 py-3 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
                >
                    Cancel
                </button>
            </div>
        </form>
    );

    return (
        <div className="space-y-6">
            <Toolbar
                search={search}
                onSearch={setSearch}
                placeholder="Name or email…"
                filters={[
                    {
                        label: "Role",
                        value: role,
                        onChange: setRole,
                        options: [{ value: "", label: "All roles" }, ...ROLES],
                    },
                    {
                        label: "Status",
                        value: status,
                        onChange: setStatus,
                        options: [
                            { value: "", label: "All" },
                            { value: "active", label: "Active" },
                            { value: "suspended", label: "Suspended" },
                        ],
                    },
                ]}
            >
                <button
                    type="button"
                    onClick={openNew}
                    className="ml-auto rounded-lg bg-brand px-5 py-2.5 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi"
                >
                    New user
                </button>
            </Toolbar>

            {creating && <div className="rounded-xl border border-(--line) bg-(--raised)">{form}</div>}

            {loadState === "error" ? (
                <div className="rounded-xl border border-(--line) px-5 py-10 text-center">
                    <p className="text-[0.9375rem] text-(--text)">{error?.message}</p>
                    <button
                        type="button"
                        onClick={reload}
                        className="label-mono mt-5 rounded-lg border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
                    >
                        Retry
                    </button>
                </div>
            ) : (
                <ul
                    className={cn(
                        "overflow-hidden rounded-xl border border-(--line) bg-(--raised)",
                        isLoading && "opacity-60",
                    )}
                >
                    {rows.length === 0 && !isLoading && (
                        <li className="px-5 py-14 text-center text-[0.9375rem] text-(--text-mute)">
                            No accounts match these filters.
                        </li>
                    )}

                    {rows.map((row) => {
                        const isSelf = String(row._id) === String(currentUserId);
                        const busy = busyId === row._id;

                        return (
                            <li key={row._id} className="border-b border-(--line-soft) last:border-0">
                                <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
                                    <span
                                        aria-hidden="true"
                                        className="grid size-9 shrink-0 place-items-center rounded-full bg-(--raised-2) text-[0.875rem] font-semibold text-(--text-dim)"
                                    >
                                        {initials(row.name)}
                                    </span>

                                    <div className="min-w-0 flex-1">
                                        <p className="flex items-center gap-2 truncate text-[0.9375rem] font-medium text-(--text)">
                                            {row.name}
                                            {isSelf && (
                                                <span className="label-mono rounded-full bg-(--raised-2) px-2 py-0.5 text-(--text-mute)">
                                                    You
                                                </span>
                                            )}
                                        </p>
                                        <p className="truncate text-[0.8125rem] text-(--text-mute)">
                                            {row.email}
                                        </p>
                                    </div>

                                    <label className="sr-only" htmlFor={`role-${row._id}`}>
                                        Role for {row.name}
                                    </label>
                                    <select
                                        id={`role-${row._id}`}
                                        value={row.role}
                                        disabled={busy || isSelf}
                                        onChange={(e) =>
                                            patchRow(
                                                row,
                                                { role: e.target.value },
                                                `${row.name} is now ${
                                                    e.target.value === "super_admin"
                                                        ? "a super admin"
                                                        : "an admin"
                                                }.`,
                                            )
                                        }
                                        title={
                                            isSelf
                                                ? "You cannot change your own role — ask another super admin."
                                                : undefined
                                        }
                                        className={cn(CONTROL, "w-40 shrink-0 rounded-lg py-2")}
                                    >
                                        {ROLES.map((r) => (
                                            <option key={r.value} value={r.value}>
                                                {r.label}
                                            </option>
                                        ))}
                                    </select>

                                    <button
                                        type="button"
                                        disabled={busy || isSelf}
                                        onClick={() => {
                                            const next =
                                                row.status === "active" ? "suspended" : "active";
                                            patchRow(
                                                row,
                                                { status: next },
                                                next === "suspended"
                                                    ? `${row.name} is suspended and signed out.`
                                                    : `${row.name} can sign in again.`,
                                            );
                                        }}
                                        aria-label={`Toggle status for ${row.name}`}
                                        className="shrink-0 transition-opacity disabled:opacity-50"
                                    >
                                        <StatusPill value={row.status} />
                                    </button>

                                    <p className="label-mono hidden w-28 shrink-0 text-(--text-mute) lg:block">
                                        {formatDate(row.createdAt)}
                                    </p>

                                    <div className="flex shrink-0 gap-3">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                editing === row._id ? closeForm() : openEdit(row)
                                            }
                                            className="label-mono text-(--text-mute) transition-colors hover:text-(--text)"
                                        >
                                            {editing === row._id ? "Close" : "Edit"}
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isSelf}
                                            onClick={() => setPendingReset(row)}
                                            title={
                                                isSelf
                                                    ? "Change your own password from your account settings."
                                                    : undefined
                                            }
                                            className="label-mono text-(--text-mute) transition-colors hover:text-(--text) disabled:opacity-40 disabled:hover:text-(--text-mute)"
                                        >
                                            Password
                                        </button>
                                        <button
                                            type="button"
                                            disabled={isSelf}
                                            onClick={() => setPendingDelete(row)}
                                            title={isSelf ? "You cannot delete your own account." : undefined}
                                            className="label-mono text-(--text-mute) transition-colors hover:text-signal disabled:opacity-40 disabled:hover:text-(--text-mute)"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>

                                {editing === row._id && form}
                            </li>
                        );
                    })}
                </ul>
            )}

            <Pagination meta={meta} onPage={setPage} />

            <ResetPasswordDialog
                user={pendingReset}
                onClose={() => setPendingReset(null)}
                onDone={(message) => {
                    setPendingReset(null);
                    toast.success(message);
                }}
            />

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Delete this account?"
                body={
                    pendingDelete
                        ? `${pendingDelete.name} (${pendingDelete.email}) loses access immediately. Content they created stays. This cannot be undone.`
                        : ""
                }
                confirmLabel="Delete permanently"
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}

/**
 * Native <dialog> for the same reasons as ConfirmDialog — focus trap, Escape,
 * background inertness — but with a field in it, which ConfirmDialog has no
 * slot for. Kept local rather than generalising ConfirmDialog into a
 * children-taking modal for one caller.
 */
function ResetPasswordDialog({ user, onClose, onDone }) {
    const ref = useRef(null);
    const inputRef = useRef(null);
    const [value, setValue] = useState("");
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        if (user && !el.open) {
            setValue(generatePassword());
            setError("");
            el.showModal();
            inputRef.current?.focus();
        } else if (!user && el.open) {
            el.close();
        }
    }, [user]);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        const handle = (e) => {
            e.preventDefault();
            onClose();
        };
        el.addEventListener("cancel", handle);
        return () => el.removeEventListener("cancel", handle);
    }, [onClose]);

    async function submit(event) {
        event.preventDefault();
        setBusy(true);
        setError("");
        try {
            // Nested path: api.update builds `${resource}/${id}`, so passing the
            // id with the sub-path appended yields PATCH /users/:id/password.
            await api.update("users", `${user._id}/password`, { newPassword: value });
            onDone(`Password reset. ${user.name} has been signed out everywhere.`);
        } catch (err) {
            setError(err.details?.[0]?.message || err.message || "Could not reset the password.");
        } finally {
            setBusy(false);
        }
    }

    return (
        <dialog
            ref={ref}
            aria-labelledby="reset-title"
            className="w-[min(30rem,calc(100vw-2.5rem))] rounded-xl border border-(--line) bg-(--raised) p-0 text-(--text) backdrop:bg-(--overlay)"
        >
            <form onSubmit={submit} className="p-6">
                <h2
                    id="reset-title"
                    className="text-[1.25rem] font-semibold tracking-[-0.02em] text-(--text)"
                >
                    Set a new password
                </h2>
                <p className="mt-3 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                    For {user?.name} ({user?.email}). Every session they have open ends immediately
                    — including on their phone.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        autoComplete="new-password"
                        aria-label="New password"
                        className={cn(CONTROL, "min-w-56 flex-1 rounded-lg font-mono")}
                    />
                    <button
                        type="button"
                        onClick={() => setValue(generatePassword())}
                        className="label-mono rounded-lg border border-(--line) px-3 py-2.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
                    >
                        Generate
                    </button>
                </div>

                {error && (
                    <p role="alert" className="label-mono mt-3 text-signal">
                        {error}
                    </p>
                )}

                <div className="mt-7 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="label-mono rounded-lg border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={busy}
                        className="label-mono rounded-lg border border-signal px-4 py-2.5 text-signal transition-colors hover:bg-signal hover:text-white disabled:opacity-60"
                    >
                        {busy ? "Resetting…" : "Reset password"}
                    </button>
                </div>
            </form>
        </dialog>
    );
}
