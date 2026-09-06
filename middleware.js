import { NextResponse } from "next/server";

const COOKIE = process.env.ADMIN_COOKIE_NAME ?? "str_admin";

/**
 * Edge gate for /admin.
 *
 * Presence check only — the signature is verified by Express on every single
 * request behind the proxy. Verifying here would mean shipping `jose` and the
 * JWT secret into the edge runtime to duplicate a check that already happens.
 *
 * Its actual job is UX: no flash of the dashboard before a client-side
 * redirect, and a `next` param so the user lands where they were headed.
 */
export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(COOKIE)?.value);

  if (pathname.startsWith("/admin") && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Already signed in? /login is pointless.
  if (pathname === "/login" && hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
