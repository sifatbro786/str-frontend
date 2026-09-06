import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/apiServer";

/**
 * Per-request by nature: this handler reads or writes the session cookie, so it
 * must never be statically evaluated at build time.
 */
export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const { data } = await apiFetch("/auth/me", { auth: true });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: err.message },
      { status: err.status ?? 401 }
    );
  }
}
