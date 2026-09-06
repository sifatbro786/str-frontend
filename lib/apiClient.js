"use client";

/**
 * Browser → same-origin BFF. There is no base URL, no token, and no CORS here
 * by design; `/api/admin/*` resolves the first two and eliminates the third.
 */
async function request(path, { method = "GET", body, params } = {}) {
  const qs = params ? `?${new URLSearchParams(clean(params))}` : "";
  const init = { method, headers: { Accept: "application/json" } };

  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`/api/admin/${path}${qs}`, init);
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 401 means the cookie expired mid-session. Bounce to /login rather than
    // letting every table on the page render its own "Unauthorized" error.
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    const err = new Error(payload.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = payload.details;
    throw err;
  }
  return payload;
}

/** Drops empty values so the URL never carries `?search=&status=`. */
function clean(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
}

export const api = {
  list: (resource, params) => request(resource, { params }),
  get: (resource, id) => request(`${resource}/${id}`),
  create: (resource, body) => request(resource, { method: "POST", body }),
  update: (resource, id, body) => request(`${resource}/${id}`, { method: "PATCH", body }),
  put: (resource, id, body) => request(`${resource}/${id}`, { method: "PUT", body }),
  remove: (resource, id) => request(`${resource}/${id}`, { method: "DELETE" }),
};

/** Fire-and-forget cache bust after a mutation. Never blocks the UI. */
export function revalidate(tag) {
  fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  }).catch(() => {});
}
