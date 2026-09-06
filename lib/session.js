import { cookies } from "next/headers";

/**
 * Admin session cookie, set on THIS origin by the BFF route handlers.
 *
 * The `next/headers` import is what keeps this module server-only: pulling it
 * into a client component is a build error, which is the same guarantee the
 * `server-only` package gives without adding a dependency (Phase 4 §0.6).
 */
export const COOKIE = process.env.ADMIN_COOKIE_NAME ?? "str_admin";

/** Seven days, matching JWT_EXPIRES_IN on the API. Keep the two in sync. */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" is correct: the admin panel is never embedded cross-site, and
    // "strict" breaks the redirect back from /login?next=/admin/projects.
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

/** Next 15: cookies() is async. Returns the raw JWT or null. */
export async function getToken() {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

export async function setToken(token) {
  const store = await cookies();
  store.set(COOKIE, token, cookieOptions());
}

export async function clearToken() {
  const store = await cookies();
  // Flags must match cookieOptions() or the browser keeps the cookie.
  store.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}
