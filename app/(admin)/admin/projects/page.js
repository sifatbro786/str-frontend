"use client";

import { useState } from "react";
import Link from "next/link";
import { useResource, useDebounced } from "@/hooks/useResource";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import DataTable from "@/components/admin/DataTable";
import Toolbar from "@/components/admin/Toolbar";
import Pagination from "@/components/admin/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusPill from "@/components/admin/StatusPill";
import { SERVICE_TYPES, SERVICE_LABELS } from "@/lib/taxonomy";
import { formatDate } from "@/lib/utils";

export default function ProjectsAdminPage() {
  const [search, setSearch] = useState("");
  const [service, setService] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const toast = useToast();

  const debounced = useDebounced(search);

  const { rows, meta, status, error, reload } = useResource("projects/admin/all", {
    search: debounced,
    serviceTypes: service,
    page,
    limit: 20,
  });

  async function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await api.remove("projects", target._id);
      toast.success(`Deleted "${target.title}".`);
      revalidate("projects");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    {
      key: "title",
      header: "Project",
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={`/admin/projects/${row._id}`}
            className="font-medium text-(--text) transition-colors hover:text-signal"
          >
            {row.title}
          </Link>
          <p className="label-mono truncate text-(--text-mute)">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: "serviceTypes",
      header: "Services",
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {(row.serviceTypes ?? []).map((s) => (
            <span key={s} className="label-mono border border-(--line) px-2 py-1 text-(--text-dim)">
              {SERVICE_LABELS[s] ?? s}
            </span>
          ))}
        </div>
      ),
    },
    { key: "clientName", header: "Client", render: (row) => row.clientName || "—" },
    {
      key: "featured",
      header: "Status",
      render: (row) => <StatusPill value={row.featured ? "featured" : "draft"} label={row.featured ? "featured" : "standard"} />,
    },
    { key: "displayOrder", header: "Order", className: "nums text-right" },
    { key: "updatedAt", header: "Updated", render: (row) => formatDate(row.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search title, client, slug…"
        filters={[
          {
            label: "Service",
            value: service,
            onChange: (v) => {
              setService(v);
              setPage(1);
            },
            options: [
              { value: "", label: "All services" },
              ...SERVICE_TYPES.map((s) => ({ value: s, label: SERVICE_LABELS[s] })),
            ],
          },
        ]}
        action={{ href: "/admin/projects/new", label: "New project" }}
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r._id}
        status={status}
        error={error}
        onRetry={reload}
        empty="No projects match this filter."
        emptyAction={
          <Link
            href="/admin/projects/new"
            className="label-mono mt-5 inline-block border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-signal hover:text-signal"
          >
            New project
          </Link>
        }
        actions={(row) => (
          <div className="flex justify-end gap-3">
            <Link
              href={`/admin/projects/${row._id}`}
              className="label-mono text-(--text-mute) transition-colors hover:text-(--text)"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setPendingDelete(row)}
              className="label-mono text-(--text-mute) transition-colors hover:text-signal"
            >
              Delete
            </button>
          </div>
        )}
      />

      <Pagination meta={meta} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this project?"
        body={
          pendingDelete
            ? `"${pendingDelete.title}" and its case study will be removed permanently. This cannot be undone.`
            : ""
        }
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
