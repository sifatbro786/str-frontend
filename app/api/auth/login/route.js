import { NextResponse } from "next/server";
import { setToken } from "@/lib/session";

/**
 * Per-request by nature: this handler reads or writes the session cookie, so it
 * must never be statically evaluated at build time.
 */
export const dynamic = "force-dynamic";


const BASE = process.env.API_URL;

/**
 * POST /api/auth/login — BFF login.
 *
 * Forwards credentials to Express, keeps the JWT server-side in an httpOnly
 * cookie on THIS origin, and returns only a boolean plus the safe user object.
 * The token itself never reaches the browser.
 */
export async function POST(request) {
  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Malformed request" }, { status: 400 });
  }

  const { email, password } = credentials ?? {};
  if (!email || !password) {
    return NextResponse.json(
      { success: false, message: "Email and password are required" },
      { status: 400 }
    );
  }

  let upstream;
  try {
    upstream = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Preserve the real client IP so the API's per-identity rate limiter
        // is not keyed on this server's address. See PHASE-4-API-GUIDE §7.
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Cannot reach the API server" },
      { status: 502 }
    );
  }

  const payload = await upstream.json().catch(() => ({}));

  if (!upstream.ok || !payload.token) {
    // Pass the upstream status through so 401 (bad credentials), 403
    // (suspended) and 429 (rate limited) each render their own message.
    return NextResponse.json(
      { success: false, message: payload.message ?? "Login failed" },
      { status: upstream.status || 401 }
    );
  }

  await setToken(payload.token);
  return NextResponse.json({ success: true, data: payload.data });
}
