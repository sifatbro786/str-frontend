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
import { formatDate } from "@/lib/utils";

export default function BlogsAdminPage() {
  const [search, setSearch] = useState("");
  const [published, setPublished] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();

  const debounced = useDebounced(search);

  const { rows, meta, status, error, reload, setRows } = useResource("blogs/admin/all", {
    search: debounced,
    isPublished: published,
    category,
    page,
    limit: 20,
  });

  /**
   * Publish toggle writes { isPublished } only. The API's pre("findOneAndUpdate")
   * hook owns publishedAt — sending it from here would fight that hook.
   * Optimistic, rolled back on error.
   */
  async function togglePublish(row) {
    const next = !row.isPublished;
    setBusyId(row._id);
    setRows((list) => list.map((r) => (r._id === row._id ? { ...r, isPublished: next } : r)));
    try {
      await api.update("blogs", row._id, { isPublished: next });
      revalidate("blogs");
      toast.success(next ? `Published "${row.title}".` : `Moved "${row.title}" to drafts.`);
      reload();
    } catch (err) {
      setRows((list) => list.map((r) => (r._id === row._id ? { ...r, isPublished: !next } : r)));
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  }

  async function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await api.remove("blogs", target._id);
      toast.success(`Deleted "${target.title}".`);
      revalidate("blogs");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    {
      key: "title",
      header: "Article",
      render: (row) => (
        <div className="min-w-0">
          <Link
            href={`/admin/blogs/${row._id}`}
            className="font-medium text-(--text) transition-colors hover:text-signal"
          >
            {row.title}
          </Link>
          <p className="label-mono truncate text-(--text-mute)">/{row.slug}</p>
        </div>
      ),
    },
    { key: "category", header: "Category", render: (row) => row.category || "—" },
    { key: "author", header: "Author", render: (row) => row.author?.name ?? "—" },
    { key: "viewCount", header: "Views", className: "nums text-right" },
    {
      key: "isPublished",
      header: "Status",
      render: (row) => <StatusPill value={row.isPublished ? "published" : "draft"} />,
    },
    { key: "publishedAt", header: "Published", render: (row) => formatDate(row.publishedAt) || "—" },
  ];

  return (
    <div className="space-y-6">
      <Toolbar
        search={search}
        onSearch={(v) => {
          setSearch(v);
          setPage(1);
        }}
        placeholder="Search title or excerpt…"
        filters={[
          {
            label: "Status",
            value: published,
            onChange: (v) => {
              setPublished(v);
              setPage(1);
            },
            options: [
              { value: "", label: "All" },
              { value: "true", label: "Published" },
              { value: "false", label: "Drafts" },
            ],
          },
          {
            label: "Category",
            value: category,
            onChange: (v) => {
              setCategory(v);
              setPage(1);
            },
            options: [
              { value: "", label: "All categories" },
              ...Array.from(new Set(rows.map((r) => r.category).filter(Boolean))).map((c) => ({
                value: c,
                label: c,
              })),
            ],
          },
        ]}
        action={{ href: "/admin/blogs/new", label: "New article" }}
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r._id}
        status={status}
        error={error}
        onRetry={reload}
        empty="No articles match this filter."
        actions={(row) => (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => togglePublish(row)}
              disabled={busyId === row._id}
              className="label-mono text-(--text-mute) transition-colors hover:text-(--text) disabled:opacity-50"
            >
              {row.isPublished ? "Unpublish" : "Publish"}
            </button>
            <Link
              href={`/admin/blogs/${row._id}`}
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
        title="Delete this article?"
        body={pendingDelete ? `"${pendingDelete.title}" will be removed permanently. This cannot be undone.` : ""}
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
