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
import { formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";

const STATUSES = ["new", "contacted", "closed"];

/**
 * Read-only lead board.
 *
 * Read-only BY CONTRACT: the API accepts only `status` and `notes` on PATCH
 * (updateInquiry uses an explicit allow-list). Nothing else may render as an
 * editable field here — a lead is a record of what the client sent.
 */
function InquiriesBoard() {
  const params = useSearchParams();

  const [search, setSearch] = useState("");
  // Deep link: /admin/inquiries?status=new must apply the filter on mount, so
  // the overview card links straight into the filtered view.
  const [status, setStatus] = useState(() => params.get("status") ?? "");
  const [service, setService] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const toast = useToast();

  const debounced = useDebounced(search);

  const { rows, meta, status: loadState, error, reload, setRows } = useResource("inquiries", {
    search: debounced,
    status,
    serviceInterested: service,
    page,
    limit: 20,
  });

  async function setStatusFor(row, next) {
    if (row.status === next) return;
    setBusyId(row._id);
    setRows((list) => list.map((r) => (r._id === row._id ? { ...r, status: next } : r)));
    try {
      await api.update("inquiries", row._id, { status: next });
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
      await api.remove("inquiries", target._id);
      toast.success(`Deleted the lead from ${target.senderName}.`);
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
        placeholder="Search name, email or message…"
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
              ...STATUSES.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) })),
            ],
          },
          {
            label: "Service",
            value: service,
            onChange: (v) => {
              setService(v);
              setPage(1);
            },
            // Options come from the live leads, not from SERVICE_TYPES slugs:
            // the public form submits the service TITLE into a free-text field,
            // so slug-based options would never match.
            options: [
              { value: "", label: "All services" },
              ...Array.from(new Set(rows.map((r) => r.serviceInterested).filter(Boolean))).map((s) => ({
                value: s,
                label: s,
              })),
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
              No inquiries match this filter.
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
                  <p className="truncate text-[0.9375rem] font-medium text-(--text)">{row.senderName}</p>
                  <p className="label-mono truncate text-(--text-mute)">{row.senderEmail}</p>
                </button>

                <span className="label-mono hidden text-(--text-mute) lg:block">
                  {row.serviceInterested || "—"}
                </span>
                <span className="label-mono hidden text-(--text-mute) lg:block">
                  {row.budgetRange || "—"}
                </span>

                {/* Segmented status control — the only writable field on a row. */}
                <div className="flex shrink-0">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatusFor(row, s)}
                      disabled={busyId === row._id}
                      aria-pressed={row.status === s}
                      className={cn(
                        "label-mono border px-2.5 py-1.5 transition-colors -ml-px first:ml-0 disabled:opacity-50",
                        row.status === s
                          ? "border-signal text-signal"
                          : "border-(--line) text-(--text-mute) hover:text-(--text)"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>

                <span className="label-mono w-24 shrink-0 text-right text-(--text-mute)">
                  {formatDate(row.createdAt)}
                </span>
              </div>

              {expanded === row._id && <LeadDetail row={row} onDelete={() => setPendingDelete(row)} />}
            </li>
          ))}
        </ul>
      )}

      <Pagination meta={meta} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this lead?"
        body={
          pendingDelete
            ? `The inquiry from ${pendingDelete.senderName} will be removed permanently. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}

/** Expanded row: full message, contact details, and the internal notes field. */
function LeadDetail({ row, onDelete }) {
  const [notes, setNotes] = useState(row.notes ?? "");
  const [saved, setSaved] = useState(true);
  const timer = useRef(null);
  const toast = useToast();

  // Notes save on blur, debounced 800ms so a pause in typing also persists.
  useEffect(() => () => clearTimeout(timer.current), []);

  async function persist(value) {
    if (value === (row.notes ?? "")) return;
    try {
      await api.update("inquiries", row._id, { notes: value });
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
    `Re: your inquiry to STR Solutions${row.serviceInterested ? ` — ${row.serviceInterested}` : ""}`
  )}`;

  return (
    <div className="grid gap-6 border-t border-(--line) bg-(--raised) px-5 py-5 lg:grid-cols-2">
      <div>
        <p className="label-mono text-(--text-mute)">Message</p>
        <p className="mt-3 text-[0.9375rem] leading-relaxed whitespace-pre-wrap text-(--text-dim)">
          {row.message}
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-3">
          <div>
            <dt className="label-mono text-(--text-mute)">Phone</dt>
            <dd className="mt-1.5 text-[0.875rem] text-(--text-dim)">{row.phone || "—"}</dd>
          </div>
          <div>
            <dt className="label-mono text-(--text-mute)">Budget</dt>
            <dd className="mt-1.5 text-[0.875rem] text-(--text-dim)">{row.budgetRange || "—"}</dd>
          </div>
          <div>
            <dt className="label-mono text-(--text-mute)">Service</dt>
            <dd className="mt-1.5 text-[0.875rem] text-(--text-dim)">{row.serviceInterested || "—"}</dd>
          </div>
          <div>
            <dt className="label-mono text-(--text-mute)">Status</dt>
            <dd className="mt-1.5">
              <StatusPill value={row.status} />
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col">
        <div className="flex items-center justify-between">
          <label htmlFor={`notes-${row._id}`} className="label-mono text-(--text-mute)">
            Internal notes
          </label>
          <span className="label-mono text-(--text-mute)">{saved ? "Saved" : "Unsaved"}</span>
        </div>
        <textarea
          id={`notes-${row._id}`}
          value={notes}
          onChange={onChange}
          onBlur={(e) => persist(e.target.value)}
          rows={6}
          maxLength={4000}
          placeholder="Not visible to the client."
          className={cn(CONTROL, "mt-2 flex-1 resize-y")}
        />

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <a
            href={mailto}
            className="label-mono border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
          >
            Reply by email ↗
          </a>
          <button
            type="button"
            onClick={onDelete}
            className="label-mono text-(--text-mute) transition-colors hover:text-signal"
          >
            Delete lead
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InquiriesAdminPage() {
  // useSearchParams bails out of static rendering; keep it inside Suspense.
  return (
    <Suspense fallback={<p className="label-mono text-(--text-mute)">Loading…</p>}>
      <InquiriesBoard />
    </Suspense>
  );
}
