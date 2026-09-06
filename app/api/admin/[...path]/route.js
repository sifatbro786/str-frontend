import { NextResponse } from "next/server";
import { getToken } from "@/lib/session";

/**
 * Per-request by nature: this handler reads or writes the session cookie, so it
 * must never be statically evaluated at build time.
 */
export const dynamic = "force-dynamic";


const BASE = process.env.API_URL;

/**
 * Catch-all admin proxy.
 *
 *   fetch("/api/admin/projects?page=2")         → GET   ${API_URL}/projects?page=2
 *   fetch("/api/admin/projects/64ab…", {PATCH}) → PATCH ${API_URL}/projects/64ab…
 *
 * Responsibilities, and nothing else:
 *   1. attach the JWT from the httpOnly cookie
 *   2. forward method, query string and body untouched
 *   3. pass the upstream status through so the client can branch on 401/403/409
 *
 * It does NOT reshape payloads. Business rules live in Express; duplicating any
 * of them here creates two sources of truth that will disagree.
 */

// Only these top-level resources are reachable through the proxy. Without this
// the route is an open relay to every path on the API host.
const ALLOWED = new Set([
  "projects", "services", "blogs", "testimonials",
  "team", "inquiries", "page-meta", "stats", "users",
]);

async function proxy(request, ctx) {
  // Next 15: params is a Promise.
  const { path = [] } = await ctx.params;

  if (path.length === 0 || !ALLOWED.has(path[0])) {
    return NextResponse.json({ success: false, message: "Unknown resource" }, { status: 404 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const search = new URL(request.url).search;
  // encodeURIComponent per segment is what stops /api/admin/projects/../../users
  // from walking out of the resource. Never join the raw path array.
  const target = `${BASE}/${path.map(encodeURIComponent).join("/")}${search}`;

  const init = {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
    },
    cache: "no-store",
  };

  if (!["GET", "HEAD", "DELETE"].includes(request.method)) {
    init.headers["Content-Type"] = "application/json";
    init.body = await request.text();
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json({ success: false, message: "API server unreachable" }, { status: 502 });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      // Never let a CDN or the browser cache an authenticated response.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
