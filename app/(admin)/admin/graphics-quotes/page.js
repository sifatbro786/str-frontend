"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";

import { useResource, useDebounced } from "@/hooks/useResource";
import { api } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import Toolbar from "@/components/admin/Toolbar";
import Pagination from "@/components/admin/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusPill from "@/components/admin/StatusPill";
import { CONTROL } from "@/components/admin/Fields";
import { cn, formatDate } from "@/lib/utils";

/**
 * Graphics orders from /graphics.
 *
 * Read-only BY CONTRACT, exactly like the leads board: the API accepts only
 * `status` and `notes` on PATCH (updateGraphicsQuote uses an explicit
 * allow-list). Nothing else on a row may render as an editable field — the
 * instructions and the file manifest are the record of what the client asked
 * for, and they are what the studio would be judged against if a job is
 * disputed.
 *
 * ── THE ONE THING THIS SCREEN EXISTS TO SURFACE ──────────────────────────
 * `mailStatus: "failed"`. Source files are attached to the studio's
 * notification email and never written to disk (see quoteUpload.js), so an
 * order whose email did not send is an order whose files are gone. The row
 * carries a red flag and the filter has an entry for it, because the recovery
 * — ask the client to send them again — only works while they still remember
 * placing the order.
 */

const STATUSES = ["new", "quoted", "in_progress", "delivered", "closed"];

const STATUS_LABEL = {
    new: "New",
    quoted: "Quoted",
    in_progress: "In progress",
    delivered: "Delivered",
    closed: "Closed",
};

/**
 * The segmented control on a row carries five states, not the leads board's
 * three, and "In progress" spelled out pushes the whole row onto a second line
 * at laptop width. Short in the control, full in the filter, the detail pane
 * and the button's own title — so the abbreviation is never the only place a
 * status is named.
 */
const STATUS_SHORT = {
    new: "New",
    quoted: "Quoted",
    in_progress: "WIP",
    delivered: "Done",
    closed: "Closed",
};

function formatBytes(bytes) {
    const n = Number(bytes) || 0;
    if (n === 0) return "—";
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
    return `${(n / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

function OrdersBoard() {
    const params = useSearchParams();

    const [search, setSearch] = useState("");
    // Deep link: /admin/graphics-quotes?status=new applies on mount, so the
    // overview card and the "Open in dashboard" link in the order email both
    // land on a filtered view.
    const [status, setStatus] = useState(() => params.get("status") ?? "");
    const [mailStatus, setMailStatus] = useState(() => params.get("mailStatus") ?? "");
    const [page, setPage] = useState(1);
    const [expanded, setExpanded] = useState(null);
    const [busyId, setBusyId] = useState(null);
    const [pendingDelete, setPendingDelete] = useState(null);
    const toast = useToast();

    const debounced = useDebounced(search);

    const { rows, meta, status: loadState, error, reload, setRows } = useResource(
        "graphics-quotes",
        { search: debounced, status, mailStatus, page, limit: 20 },
    );

    async function setStatusFor(row, next) {
        if (row.status === next) return;
        setBusyId(row._id);
        setRows((list) => list.map((r) => (r._id === row._id ? { ...r, status: next } : r)));
        try {
            await api.update("graphics-quotes", row._id, { status: next });
        } catch (err) {
            setRows((list) => list.map((r) => (r._id === row._id ? { ...r, status: row.status } : r)));
            toast.error(err.message);
        } finally {
            setBusyId(null);
        }
    }

    async function confirmDelete() {
        const target = pendingDelete;
        setPendingDelete(null);
        try {
            await api.remove("graphics-quotes", target._id);
            toast.success(`Deleted the order "${target.jobTitle}".`);
            reload();
        } catch (err) {
            toast.error(err.message);
        }
    }

    return (
        <div className="space-y-6">
            <Toolbar
                search={search}
                onSearch={(v) => {
                    setSearch(v);
                    setPage(1);
                }}
                placeholder="Search name, email, job or instructions…"
                filters={[
                    {
                        label: "Status",
                        value: status,
                        onChange: (v) => {
                            setStatus(v);
                            setPage(1);
                        },
                        options: [
                            { value: "", label: "All" },
                            ...STATUSES.map((s) => ({ value: s, label: STATUS_LABEL[s] })),
                        ],
                    },
                    {
                        label: "Mail",
                        value: mailStatus,
                        onChange: (v) => {
                            setMailStatus(v);
                            setPage(1);
                        },
                        options: [
                            { value: "", label: "All" },
                            { value: "failed", label: "Did not send" },
                            { value: "pending", label: "Sending" },
                            { value: "sent", label: "Sent" },
                        ],
                    },
                ]}
            />

            {loadState === "error" ? (
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
                <ul className={cn("border border-(--line)", loadState === "loading" && "opacity-60")}>
                    {rows.length === 0 && loadState !== "loading" && (
                        <li className="px-5 py-14 text-center text-[0.9375rem] text-(--text-mute)">
                            No orders match this filter.
                        </li>
                    )}

                    {rows.map((row) => (
                        <li key={row._id} className="border-b border-(--line-soft) last:border-0">
                            <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
                                <button
                                    type="button"
                                    onClick={() => setExpanded(expanded === row._id ? null : row._id)}
                                    aria-expanded={expanded === row._id}
                                    className="min-w-0 flex-1 text-left"
                                >
                                    <p className="truncate text-[0.9375rem] font-medium text-(--text)">
                                        {row.jobTitle}
                                    </p>
                                    <p className="label-mono truncate text-(--text-mute)">
                                        {row.senderName} · {row.senderEmail}
                                    </p>
                                </button>

                                {/* The files never left. Loudest thing on the row,
                                    on purpose — see the header comment. */}
                                {row.mailStatus === "failed" && (
                                    <StatusPill value="failed" label="Files not sent" />
                                )}

                                <span className="label-mono hidden text-(--text-mute) lg:block">
                                    {row.deliveryTime || "—"}
                                </span>
                                <span className="label-mono nums hidden w-24 text-(--text-mute) lg:block">
                                    {row.attachments?.length
                                        ? `${row.attachments.length} file${row.attachments.length === 1 ? "" : "s"}`
                                        : row.fileLink
                                          ? "link"
                                          : "no files"}
                                </span>

                                {/* Segmented status control — the only writable
                                    field on a row. */}
                                <div className="flex shrink-0">
                                    {STATUSES.map((s) => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setStatusFor(row, s)}
                                            disabled={busyId === row._id}
                                            aria-pressed={row.status === s}
                                            title={STATUS_LABEL[s]}
                                            aria-label={`Mark as ${STATUS_LABEL[s]}`}
                                            className={cn(
                                                "label-mono -ml-px border px-2.5 py-1.5 transition-colors first:ml-0 disabled:opacity-50",
                                                row.status === s
                                                    ? "border-signal text-signal"
                                                    : "border-(--line) text-(--text-mute) hover:text-(--text)",
                                            )}
                                        >
                                            {STATUS_SHORT[s]}
                                        </button>
                                    ))}
                                </div>

                                <span className="label-mono w-24 shrink-0 text-right text-(--text-mute)">
                                    {formatDate(row.createdAt)}
                                </span>
                            </div>

                            {expanded === row._id && (
                                <OrderDetail row={row} onDelete={() => setPendingDelete(row)} />
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <Pagination meta={meta} onPage={setPage} />

            <ConfirmDialog
                open={Boolean(pendingDelete)}
                title="Delete this order?"
                body={
                    pendingDelete
                        ? `"${pendingDelete.jobTitle}" from ${pendingDelete.senderName} will be removed permanently. The client's files are not stored here — the only copy is the attachment on the notification email, which is unaffected. This cannot be undone.`
                        : ""
                }
                confirmLabel="Delete permanently"
                onConfirm={confirmDelete}
                onCancel={() => setPendingDelete(null)}
            />
        </div>
    );
}

/** Expanded row: the brief, the spec, the file manifest and internal notes. */
function OrderDetail({ row, onDelete }) {
    const [notes, setNotes] = useState(row.notes ?? "");
    const [saved, setSaved] = useState(true);
    const timer = useRef(null);
    const toast = useToast();

    useEffect(() => () => clearTimeout(timer.current), []);

    async function persist(value) {
        if (value === (row.notes ?? "")) return;
        try {
            await api.update("graphics-quotes", row._id, { notes: value });
            setSaved(true);
        } catch (err) {
            toast.error(err.message);
        }
    }

    function onChange(e) {
        const value = e.target.value;
        setNotes(value);
        setSaved(false);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => persist(value), 800);
    }

    const mailto = `mailto:${row.senderEmail}?subject=${encodeURIComponent(
        `Re: ${row.jobTitle} — STR Solutions`,
    )}`;

    return (
        <div className="grid gap-6 border-t border-(--line) bg-(--raised) px-5 py-5 lg:grid-cols-2">
            <div>
                <p className="label-mono text-(--text-mute)">Instructions</p>
                <p className="mt-3 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-(--text-dim)">
                    {row.instructions}
                </p>

                <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3">
                    <div className="col-span-2">
                        <dt className="label-mono text-(--text-mute)">Passes</dt>
                        <dd className="mt-1.5 text-[0.875rem] text-(--text-dim)">
                            {row.servicesRequired?.length ? row.servicesRequired.join(", ") : "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="label-mono text-(--text-mute)">Delivery format</dt>
                        <dd className="mt-1.5 text-[0.875rem] text-(--text-dim)">
                            {row.deliveryType || "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="label-mono text-(--text-mute)">Turnaround</dt>
                        <dd className="mt-1.5 text-[0.875rem] text-(--text-dim)">
                            {row.deliveryTime || "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="label-mono text-(--text-mute)">Phone</dt>
                        <dd className="mt-1.5 text-[0.875rem] text-(--text-dim)">
                            {row.phone || "—"}
                        </dd>
                    </div>
                    <div>
                        <dt className="label-mono text-(--text-mute)">Status</dt>
                        <dd className="mt-1.5">
                            <StatusPill value={row.status} label={STATUS_LABEL[row.status]} />
                        </dd>
                    </div>
                </dl>
            </div>

            <div className="flex flex-col">
                {/* ── File manifest ─────────────────────────────────────────
                    Names and sizes only. There is no download link and there
                    never will be one from here: the bytes were never written to
                    this server. The attachment on the notification email is the
                    copy, and saying so plainly is what stops someone hunting
                    for a button that cannot exist. */}
                <p className="label-mono text-(--text-mute)">Files</p>
                {row.attachments?.length > 0 ? (
                    <>
                        <ul className="mt-2 border-t border-(--line)">
                            {row.attachments.map((f) => (
                                <li
                                    key={f.filename}
                                    className="flex items-center gap-4 border-b border-(--line-soft) py-2"
                                >
                                    <span className="min-w-0 flex-1 truncate text-[0.875rem] text-(--text-dim)">
                                        {f.filename}
                                    </span>
                                    <span className="label-mono nums shrink-0 text-(--text-mute)">
                                        {formatBytes(f.size)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                        <p className="label-mono mt-2 text-(--text-mute)">
                            {formatBytes(row.attachmentBytes)} total ·{" "}
                            {row.mailStatus === "sent"
                                ? "attached to the order email"
                                : row.mailStatus === "pending"
                                  ? "sending…"
                                  : "NOT SENT — ask the client to re-send"}
                        </p>
                    </>
                ) : (
                    <p className="mt-2 text-[0.875rem] text-(--text-mute)">
                        Nothing was attached.
                    </p>
                )}

                {row.fileLink && (
                    <p className="mt-3 text-[0.875rem] break-all">
                        <a
                            href={row.fileLink}
                            target="_blank"
                            rel="noopener noreferrer nofollow"
                            className="text-brand underline underline-offset-4"
                        >
                            {row.fileLink}
                        </a>
                    </p>
                )}

                {row.mailStatus === "failed" && row.mailError && (
                    <p className="label-mono mt-3 text-signal">Mail error: {row.mailError}</p>
                )}

                <div className="mt-6 flex items-center justify-between">
                    <label htmlFor={`qnotes-${row._id}`} className="label-mono text-(--text-mute)">
                        Internal notes
                    </label>
                    <span className="label-mono text-(--text-mute)">
                        {saved ? "Saved" : "Unsaved"}
                    </span>
                </div>
                <textarea
                    id={`qnotes-${row._id}`}
                    value={notes}
                    onChange={onChange}
                    onBlur={(e) => persist(e.target.value)}
                    rows={5}
                    maxLength={4000}
                    placeholder="Quoted figure, who is on it, what the client agreed. Not visible to the client."
                    className={cn(CONTROL, "mt-2 flex-1 resize-y")}
                />

                <div className="mt-4 flex flex-wrap items-center gap-4">
                    <a
                        href={mailto}
                        className="label-mono border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
                    >
                        Send the quote ↗
                    </a>
                    <button
                        type="button"
                        onClick={onDelete}
                        className="label-mono text-(--text-mute) transition-colors hover:text-signal"
                    >
                        Delete order
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function GraphicsQuotesAdminPage() {
    // useSearchParams bails out of static rendering; keep it inside Suspense.
    return (
        <Suspense fallback={<p className="label-mono text-(--text-mute)">Loading…</p>}>
            <OrdersBoard />
        </Suspense>
    );
}
