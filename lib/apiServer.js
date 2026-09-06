import { getToken } from "./session";

const BASE = process.env.API_URL;
if (!BASE) {
  throw new Error("[apiServer] API_URL is not set. Refusing to start with a guessed base URL.");
}

/**
 * Server-side fetch against Express.
 *
 * `auth: true` attaches the admin JWT from this app's cookie. Admin calls must
 * also stay uncached — `cache: "no-store"` — or Next will serve one admin's
 * response to the next request.
 *
 * Server-only by construction: ./session imports next/headers.
 */
export async function apiFetch(
  path,
  { method = "GET", body, auth = false, revalidate, tags, headers = {} } = {}
) {
  const init = {
    method,
    headers: { Accept: "application/json", ...headers },
  };

  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  if (auth) {
    const token = await getToken();
    if (token) init.headers.Authorization = `Bearer ${token}`;
    init.cache = "no-store";
  } else {
    init.next = { revalidate: revalidate ?? 300, tags: tags ?? [] };
  }

  const res = await fetch(`${BASE}${path}`, init);
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(payload.message || `${res.status} ${path}`);
    err.status = res.status;
    err.details = payload.details;
    throw err;
  }
  return payload;
}
