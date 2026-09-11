"use client";

import { useCallback, useRef, useState } from "react";
import { cn, mediaUrl } from "@/lib/utils";

/**
 * Upload widget for a single image field.
 *
 * Uploads to /api/admin/upload (the multipart BFF route), which returns the
 * stored path. That path is what goes in the record — never a blob URL, never
 * a data URI.
 *
 * ── WHY XMLHttpRequest AND NOT fetch ─────────────────────────────────────
 * fetch still has no upload progress event. On the connections this dashboard
 * is actually used on, a 4MB render is a ten to twenty second wait, and a
 * button that says "Uploading…" for twenty seconds is indistinguishable from a
 * button that has hung. XHR gives a real percentage for the cost of a promise
 * wrapper.
 *
 * ── WHY THE TYPE AND SIZE ARE CHECKED HERE TOO ───────────────────────────
 * The server checks both and is the authority. Checking client side as well is
 * not about security, it is about not spending twenty seconds uploading a file
 * that is going to be rejected on arrival. The two limits are duplicated
 * constants, which is a real cost: if UPLOAD_MAX_BYTES changes on the API,
 * this number has to follow or the form starts rejecting files the server
 * would have accepted.
 *
 * ── WHY REPLACING DELETES THE OLD FILE ───────────────────────────────────
 * Without it every re-crop leaves an orphan on disk that nothing references
 * and nobody can identify later. The delete is fire and forget: if it fails,
 * the new image is still saved and the worst case is one stale file, which is
 * strictly better than blocking the editor on a cleanup call.
 *
 * ⚑ A file is uploaded the moment it is chosen, before the form is saved. So
 * choosing an image and then hitting Cancel leaves the file on disk unpinned.
 * The alternative is holding the bytes in memory until submit, which breaks
 * the preview and makes the save the slow step instead. Orphans from that path
 * are collected by hand; if it becomes a real problem, the fix is a nightly
 * sweep over the uploads folder against the image fields, not a change here.
 */

const ACCEPT = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 5 * 1024 * 1024; // keep in step with UPLOAD_MAX_BYTES on the API

function upload(file, folder, onProgress) {
    return new Promise((resolve, reject) => {
        const body = new FormData();
        body.append("file", file);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `/api/admin/upload?folder=${encodeURIComponent(folder)}`);
        xhr.responseType = "json";

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
        };

        xhr.onload = () => {
            const payload = xhr.response ?? {};
            if (xhr.status >= 200 && xhr.status < 300 && payload?.data?.url) {
                resolve(payload.data);
            } else {
                reject(new Error(payload?.message || `Upload failed (${xhr.status})`));
            }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));

        xhr.send(body);
    });
}

export default function ImageField({ value, onChange, folder = "misc", disabled }) {
    const inputRef = useRef(null);
    const [progress, setProgress] = useState(null); // null = idle
    const [error, setError] = useState("");
    const [dragging, setDragging] = useState(false);

    const preview = mediaUrl(value);
    const busy = progress !== null;

    const handleFile = useCallback(
        async (file) => {
            if (!file) return;
            setError("");

            if (!ACCEPT.includes(file.type)) {
                setError("Use a JPEG, PNG, WebP or AVIF file.");
                return;
            }
            if (file.size > MAX_BYTES) {
                setError(
                    `That file is ${(file.size / 1024 / 1024).toFixed(1)}MB. The limit is 5MB, so export it smaller or save it as WebP.`,
                );
                return;
            }

            const previous = value;
            setProgress(0);
            try {
                const result = await upload(file, folder, setProgress);
                onChange(result.url);

                // Fire and forget; see the note in the header comment.
                if (previous && previous.startsWith("/uploads/")) {
                    const [, , prevFolder, prevName] = previous.split("/");
                    fetch(
                        `/api/admin/upload?folder=${encodeURIComponent(prevFolder)}&filename=${encodeURIComponent(prevName)}`,
                        { method: "DELETE" },
                    ).catch(() => {});
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setProgress(null);
                // Reset the input so choosing the SAME file again still fires
                // onChange. Without this, re-picking a file after an error is
                // silently ignored, which reads as the button being broken.
                if (inputRef.current) inputRef.current.value = "";
            }
        },
        [folder, onChange, value],
    );

    function remove() {
        const current = value;
        onChange("");
        setError("");
        if (current && current.startsWith("/uploads/")) {
            const [, , prevFolder, prevName] = current.split("/");
            fetch(
                `/api/admin/upload?folder=${encodeURIComponent(prevFolder)}&filename=${encodeURIComponent(prevName)}`,
                { method: "DELETE" },
            ).catch(() => {});
        }
    }

    return (
        <div>
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    if (!disabled && !busy) setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    if (!disabled && !busy) handleFile(e.dataTransfer.files?.[0]);
                }}
                className={cn(
                    "flex flex-wrap items-center gap-5 border border-(--line) p-4 transition-colors",
                    dragging && "border-signal",
                    (disabled || busy) && "opacity-60",
                )}
            >
                {/* Plain <img>, not next/image. This is a 160px admin thumbnail
            of a file that changes every few minutes; routing it through the
            optimiser adds a round trip and a cache entry per crop for no
            visible gain. */}
                <div className="grid size-28 shrink-0 place-items-center overflow-hidden border border-(--line-soft) bg-(--raised)">
                    {preview ? (
                        <img
                            src={preview}
                            alt=""
                            className="size-full object-cover"
                            loading="lazy"
                            decoding="async"
                        />
                    ) : (
                        <span className="label-mono text-(--text-mute)">No image</span>
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <input
                        ref={inputRef}
                        type="file"
                        accept={ACCEPT.join(",")}
                        disabled={disabled || busy}
                        onChange={(e) => handleFile(e.target.files?.[0])}
                        className="sr-only"
                        id={`upload-${folder}`}
                    />

                    <div className="flex flex-wrap items-center gap-3">
                        <label
                            htmlFor={`upload-${folder}`}
                            className={cn(
                                "label-mono cursor-pointer border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)",
                                (disabled || busy) && "pointer-events-none",
                            )}
                        >
                            {busy ? `Uploading ${progress}%` : value ? "Replace image" : "Choose image"}
                        </label>

                        {value && !busy && (
                            <button
                                type="button"
                                onClick={remove}
                                className="label-mono text-(--text-mute) transition-colors hover:text-signal"
                            >
                                Remove
                            </button>
                        )}
                    </div>

                    {busy ? (
                        <div
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            className="mt-3 h-px w-full bg-(--line)"
                        >
                            <div
                                className="h-px bg-signal transition-[width] duration-200"
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    ) : (
                        <p className="mt-3 truncate text-[0.8125rem] text-(--text-mute)">
                            {value || "JPEG, PNG, WebP or AVIF. 5MB maximum. Drag a file here."}
                        </p>
                    )}
                </div>
            </div>

            {error && (
                <p role="alert" className="label-mono mt-2 text-signal">
                    {error}
                </p>
            )}
        </div>
    );
}
