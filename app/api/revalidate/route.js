import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getToken } from "@/lib/session";

/**
 * Per-request by nature: this handler reads or writes the session cookie, so it
 * must never be statically evaluated at build time.
 */
export const dynamic = "force-dynamic";


const TAGS = new Set(["projects", "services", "blogs", "testimonials", "team", "page-meta"]);

/**
 * POST /api/revalidate { tag } — busts the ISR cache for the public pages after
 * an admin write, so an edit is live immediately instead of after `revalidate`
 * seconds. Auth-gated: an unauthenticated caller could otherwise force a
 * regeneration storm.
 */
export async function POST(request) {
  if (!(await getToken())) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  const { tag } = await request.json().catch(() => ({}));
  if (!TAGS.has(tag)) {
    return NextResponse.json({ success: false, message: "Unknown tag" }, { status: 400 });
  }
  revalidateTag(tag);
  return NextResponse.json({ success: true, tag });
}
