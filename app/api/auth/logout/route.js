import { NextResponse } from "next/server";
import { getToken, clearToken } from "@/lib/session";

/**
 * Per-request by nature: this handler reads or writes the session cookie, so it
 * must never be statically evaluated at build time.
 */
export const dynamic = "force-dynamic";


const BASE = process.env.API_URL;

export async function POST() {
  const token = await getToken();

  // Best-effort upstream logout. Our cookie is cleared regardless — a failed
  // API call must never leave the user apparently signed in.
  if (token) {
    await fetch(`${BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => {});
  }

  await clearToken();
  return NextResponse.json({ success: true });
}
