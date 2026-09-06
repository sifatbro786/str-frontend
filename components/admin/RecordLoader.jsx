"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";

/**
 * Loads one record by _id for an edit form and renders children(record).
 *
 * `resource` is the full admin path, e.g. "projects/admin/id" — the API exposes
 * the by-_id lookup there because /projects/:slug is the public slug route, and
 * a slug lookup breaks the moment an admin renames the record.
 */
export default function RecordLoader({ resource, id, children }) {
  const [state, setState] = useState({ status: "loading", data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const payload = await api.get(resource, id);
        if (!cancelled) setState({ status: "ready", data: payload.data, error: null });
      } catch (err) {
        if (!cancelled) setState({ status: "error", data: null, error: err });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [resource, id]);

  if (state.status === "loading") {
    return <p className="label-mono text-(--text-mute)">Loading…</p>;
  }

  if (state.status === "error") {
    return (
      <div className="border border-(--line) px-5 py-10 text-center">
        <p className="text-[0.9375rem] text-(--text)">
          {state.error?.status === 404 ? "That record no longer exists." : state.error?.message}
        </p>
      </div>
    );
  }

  return children(state.data);
}
