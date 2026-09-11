import { NextResponse } from "next/server";
import { getToken } from "@/lib/session";

export const dynamic = "force-dynamic";
/* Node runtime, not edge: the body is a multipart stream up to 5MB and it is
   forwarded whole. Edge would work but adds a size ceiling nobody documented. */
export const runtime = "nodejs";

const BASE = process.env.API_URL;

/**
 * Multipart upload proxy.
 *
 * ── WHY THIS IS NOT THE CATCH-ALL PROXY ──────────────────────────────────
 * app/api/admin/[...path]/route.js forces `Content-Type: application/json` and
 * forwards `await request.text()`. Pushing a PNG through that produces a
 * corrupted body with a lying content type, and the multipart boundary is
 * lost, so multer sees no file and answers 400. A static segment route takes
 * precedence over the catch-all, so /api/admin/upload lands here instead.
 *
 * ── WHY THE FORM IS REBUILT INSTEAD OF PIPED ─────────────────────────────
 * Piping request.body straight through preserves the original boundary and is
 * one line shorter, but it also forwards every field the browser sent, and
 * this route is the only place that can enforce "exactly one file, under the
 * field name multer expects". Parsing it means a second FormData is
 * constructed with the boundary fetch generates, which is why the
 * Content-Type header is deliberately NOT copied from the incoming request:
 * reusing the old boundary with a new body is the classic way to make a
 * multipart parser hang.
 *
 * Same responsibilities as the catch-all otherwise: attach the JWT, pass the
 * upstream status through, reshape nothing.
 */

/* Mirrors UPLOAD_FOLDERS in the API's middleware/upload.js. Duplicated because
   this route has to reject an unknown folder before it spends time reading a
   multipart body; the API rejects it again, which is the check that counts. */
const FOLDERS = new Set(["services", "projects", "team", "blogs", "partners", "misc"]);

export async function POST(request) {
    const token = await getToken();
    if (!token) {
        return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const folder = new URL(request.url).searchParams.get("folder") ?? "misc";
    if (!FOLDERS.has(folder)) {
        return NextResponse.json({ success: false, message: "Unknown folder" }, { status: 400 });
    }

    let incoming;
    try {
        incoming = await request.formData();
    } catch {
        return NextResponse.json(
            { success: false, message: "Could not read the upload" },
            { status: 400 },
        );
    }

    const file = incoming.get("file");
    // A string here means the field was sent as text, not as a file.
    if (!file || typeof file === "string") {
        return NextResponse.json(
            { success: false, message: 'No file received. Send it under the field name "file".' },
            { status: 400 },
        );
    }

    const body = new FormData();
    body.append("file", file, file.name || "upload");

    let upstream;
    try {
        upstream = await fetch(`${BASE}/uploads/${folder}`, {
            method: "POST",
            headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
            body,
            cache: "no-store",
        });
    } catch {
        return NextResponse.json(
            { success: false, message: "API server unreachable" },
            { status: 502 },
        );
    }

    const text = await upstream.text();
    return new NextResponse(text, {
        status: upstream.status,
        headers: {
            "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
            "Cache-Control": "no-store, max-age=0",
        },
    });
}

/**
 * DELETE /api/admin/upload?folder=services&filename=hero-ab12….webp
 *
 * Here rather than in the catch-all because "uploads" is deliberately absent
 * from that route's ALLOWED set: the catch-all is an open relay to whatever it
 * whitelists, and a delete route belongs next to the upload it undoes.
 */
export async function DELETE(request) {
    const token = await getToken();
    if (!token) {
        return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
    }

    const params = new URL(request.url).searchParams;
    const folder = params.get("folder") ?? "";
    const filename = params.get("filename") ?? "";

    if (!FOLDERS.has(folder) || !filename) {
        return NextResponse.json({ success: false, message: "Unknown file" }, { status: 400 });
    }

    let upstream;
    try {
        upstream = await fetch(
            `${BASE}/uploads/${folder}/${encodeURIComponent(filename)}`,
            {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
                cache: "no-store",
            },
        );
    } catch {
        return NextResponse.json(
            { success: false, message: "API server unreachable" },
            { status: 502 },
        );
    }

    const text = await upstream.text();
    return new NextResponse(text, {
        status: upstream.status,
        headers: { "Content-Type": "application/json", "Cache-Control": "no-store, max-age=0" },
    });
}
