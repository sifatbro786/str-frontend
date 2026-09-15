"use client";

import { useCallback, useRef, useState } from "react";

import SectionIndex from "@/components/ui/SectionIndex";
import {
    ACCEPTED_FILES,
    ACCEPTED_LABEL,
    DELIVERY_TIMES,
    DELIVERY_TYPES,
    FILE_NOTE,
    ORDER_STEPS,
    UPLOAD_LIMITS,
} from "@/lib/graphicsQuote";
import { cn, pad } from "@/lib/utils";

/**
 * The order desk on /graphics.
 *
 * ── WHY THIS IS NOT contact/InquiryForm.jsx WITH MORE FIELDS ─────────────
 * That form asks "what is the actual constraint" and posts a paragraph to
 * /inquiries. This one takes a work order: a job name, per-image instructions,
 * a delivery format, a deadline and the source files, posted as multipart to
 * /graphics-quotes. Two different endpoints, two different collections, and —
 * the part that decides it — two different failure modes. A lead that does not
 * send is a missed opportunity; an order that does not send loses the client's
 * files, so this form owns upload progress, a size budget and a reference
 * number on success.
 *
 * ── WHY IT LOOKS LIKE A DOCKET AND NOT LIKE THE REST OF THE SITE ─────────
 * The first pass used the house treatment: transparent inputs, one hairline
 * border, no container. On /contact that works, because the page is a contact
 * page and a form is the only thing on it. Here it sits under eight showcase
 * blocks built from the same hairlines, and it disappeared — a reader scrolling
 * past saw more page, not a place to type. A form has to advertise that it is
 * one, and the way to do that without reaching for a drop shadow or a gradient
 * is a VALUE STEP:
 *
 *   page ground   --canvas   (warm stock, unchanged)
 *   docket card   --raised   (one notch warmer — the form is a physical thing
 *                             sitting on the page)
 *   input wells   --canvas   (back to the page value — white boxes on tinted
 *                             card stock, which is what a paper work order
 *                             actually looks like)
 *
 * The same pair inverts correctly in dark mode without a second rule: --raised
 * is lighter than --canvas there, so the card lifts and the wells recess. One
 * token pair, both themes, no shadows.
 *
 * The bar across the top is the same blue/orange/green split at the same 46/34
 * /20 widths as the confirmation email (utils/mail/templates.js, signalBar).
 * Deliberate: the receipt that lands in their inbox ninety seconds later opens
 * with the identical mark, so the email reads as a continuation of the page
 * rather than as something from a different company.
 *
 * ── WHY XMLHttpRequest AND NOT fetch ─────────────────────────────────────
 * fetch has no upload-progress event. On a phone on Dhaka mobile data a 15MB
 * batch is a genuine wait, and a submit button that says "Sending…" for ninety
 * seconds with no movement is a button people press again — which is how the
 * studio gets the same order three times. XHR is the only browser API that
 * reports bytes sent, so it is what this uses. Nothing else in the app needs
 * it, which is why it is inline here rather than in lib/apiClient.
 *
 * ── WHY IT POSTS BROWSER → EXPRESS AND NOT THROUGH THE BFF ───────────────
 * Same call as InquiryForm: the endpoint is public and rate limited per IP.
 * Routing it through /api/admin would collapse every visitor onto the Next
 * server's single IP and one shared bucket, and the proxy re-encodes the body
 * as JSON, which would destroy the multipart payload outright.
 *
 * @param {string} index    Section number in the page's IA
 * @param {Array}  services From getGraphicsServices() — the checkbox list
 * @param {object} contact  { whatsapp, whatsappHref, email }
 */

/**
 * A filled well, not a transparent line. `bg-(--canvas)` is what separates
 * this from every other hairline box on the page — see the header note.
 */
const FIELD =
    "w-full border border-(--line) bg-(--canvas) px-4 py-3 text-[0.9375rem] text-(--text) placeholder:text-(--text-mute) transition-colors hover:border-(--text-mute) focus:border-signal focus:outline-none";

const LABEL = "label-mono block text-(--text-dim)";

/** Mono, wide-tracked, uppercase. Used ONLY on the docket furniture — the
 *  header strip, the group indices and the serial — where it is doing the job
 *  a rubber stamp does. Body copy stays in the house sans. */
const STAMP = "font-mono text-[0.625rem] uppercase tracking-[0.18em]";

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1).replace(/\.0$/, "")} MB`;
}

/** Same identity test the drop zone uses to reject a file picked twice. */
const fileKey = (f) => `${f.name}:${f.size}:${f.lastModified}`;

/** The three brand segments as one 4px rule. Mirrors the email's signalBar. */
function SignalBar() {
    return (
        <div aria-hidden="true" className="flex h-1 w-full">
            <span className="h-full w-[46%] bg-brand" />
            <span className="h-full w-[34%] bg-signal" />
            <span className="h-full w-[20%] bg-leaf" />
        </div>
    );
}

function Required() {
    return (
        <span aria-hidden="true" className="text-signal">
            {" "}
            *
        </span>
    );
}

/** A numbered block of fields. The index is what makes a long form read as a
 *  sequence with an end, rather than as a wall of inputs. */
function Group({ n, title, note, children }) {
    return (
        <fieldset className="border-t border-(--line) px-6 py-7 md:px-9">
            <legend className="sr-only">{title}</legend>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <span className={cn(STAMP, "nums text-brand")}>{pad(n)}</span>
                <h3 className="text-[1rem] font-semibold tracking-[-0.02em] text-(--text)">
                    {title}
                </h3>
                {note && (
                    <span className="text-[0.8125rem] text-(--text-mute)">{note}</span>
                )}
            </div>
            <div className="mt-5 space-y-5">{children}</div>
        </fieldset>
    );
}

function FieldError({ id, children }) {
    if (!children) return null;
    return (
        <p id={id} className="label-mono mt-2 text-signal">
            {children}
        </p>
    );
}

function FilesIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className="size-6 text-(--text-mute)"
        >
            <rect x="3" y="5" width="14" height="12" rx="1.5" />
            <path d="M7 3.5h12A1.5 1.5 0 0 1 20.5 5v12" />
            <circle cx="7.5" cy="9" r="1.2" />
            <path d="m3.4 15 3.7-3.2 3 2.6 2.4-2 3.5 3" />
        </svg>
    );
}

export default function GraphicsQuoteForm({ index = "03", services, contact }) {
    const [state, setState] = useState("idle"); // idle | sending | sent | error
    const [errors, setErrors] = useState({});
    const [files, setFiles] = useState([]);
    const [fileError, setFileError] = useState("");
    const [dragging, setDragging] = useState(false);
    const [progress, setProgress] = useState(0);
    const [receipt, setReceipt] = useState(null);

    const inputRef = useRef(null);
    const formRef = useRef(null);

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

    /**
     * Mirrors the server's ceilings so a client is told before the upload, not
     * after it. The server's copy in middleware/quoteUpload.js is the real
     * gate — this one can be bypassed by anyone who wants to and it does not
     * matter, because the request still fails there.
     */
    const addFiles = useCallback(
        (incoming) => {
            const picked = Array.from(incoming ?? []);
            if (picked.length === 0) return;

            /* Computed here rather than inside a setFiles updater. An updater
               must be pure — React double-invokes it in StrictMode — and this
               one has to set a second piece of state as it goes. */
            const seen = new Set(files.map(fileKey));
            const next = [...files];
            let bytes = next.reduce((sum, f) => sum + f.size, 0);
            const problems = [];

            for (const file of picked) {
                if (seen.has(fileKey(file))) continue;

                if (file.size > UPLOAD_LIMITS.maxFileBytes) {
                    problems.push(
                        `${file.name} is ${formatBytes(file.size)} — over the ${formatBytes(UPLOAD_LIMITS.maxFileBytes)} limit per file.`,
                    );
                    continue;
                }
                if (next.length >= UPLOAD_LIMITS.maxFiles) {
                    problems.push(
                        `Up to ${UPLOAD_LIMITS.maxFiles} files here. Paste a link below for the rest of the batch.`,
                    );
                    break;
                }
                if (bytes + file.size > UPLOAD_LIMITS.maxTotalBytes) {
                    problems.push(
                        `That would come to ${formatBytes(bytes + file.size)}. Email tops out around ${formatBytes(UPLOAD_LIMITS.maxTotalBytes)} — send a link instead.`,
                    );
                    break;
                }

                seen.add(fileKey(file));
                next.push(file);
                bytes += file.size;
            }

            setFiles(next);
            // One message, not a stack of five. The first thing that went wrong
            // is the thing they need to act on.
            setFileError(problems[0] ?? "");

            /* The <input> is a picker, not the source of truth — `files` state
               is. Clearing it means picking the same file again after removing
               it still fires a change event. */
            if (inputRef.current) inputRef.current.value = "";
        },
        [files],
    );

    function removeFile(key) {
        setFiles((current) => current.filter((f) => fileKey(f) !== key));
        setFileError("");
    }

    function onDrop(e) {
        e.preventDefault();
        setDragging(false);
        addFiles(e.dataTransfer?.files);
    }

    /** Mirrors the server rules. Never replaces them — express-validator wins. */
    function validate(form) {
        const next = {};
        const get = (name) => String(form.get(name) ?? "").trim();

        if (!get("senderName")) next.senderName = "Tell us who this is from.";
        if (!/^\S+@\S+\.\S+$/.test(get("senderEmail")))
            next.senderEmail = "That email does not look right.";
        if (!get("jobTitle")) next.jobTitle = "Give the batch a name so we can both refer to it.";
        if (get("instructions").length < 5)
            next.instructions = "Say what should happen to the images, even in one line.";
        if (form.getAll("servicesRequired").length === 0)
            next.servicesRequired = "Pick at least one pass.";

        const link = get("fileLink");
        if (link && !/^https:\/\/\S+$/i.test(link))
            next.fileLink = "Paste the full https link to your file drop.";

        return next;
    }

    function onSubmit(e) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);

        // Honeypot: real people never fill a visually hidden field. Checked on
        // the server too — this only saves the round trip.
        if (String(form.get("company") ?? "").trim() !== "") return;
        form.delete("company");

        const found = validate(form);
        setErrors(found);
        if (Object.keys(found).length > 0) {
            setState("idle");
            return;
        }

        /* Appended from state rather than carried by the input, so a file the
           client removed from the list is genuinely not uploaded. The input
           deliberately has no `name` for exactly this reason. */
        for (const file of files) form.append("files", file, file.name);

        setState("sending");
        setProgress(0);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", `${process.env.NEXT_PUBLIC_API_URL}/graphics-quotes`);
        xhr.responseType = "json";

        /* Content-Type is set by the browser, boundary included. Setting it by
           hand here is the classic way to get a 500 out of a multipart parser
           that then has no boundary to split on. */

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                setProgress(Math.round((event.loaded / event.total) * 100));
            }
        };

        xhr.onload = () => {
            const payload = xhr.response ?? {};

            if (xhr.status >= 200 && xhr.status < 300) {
                setReceipt(payload.data ?? null);
                setState("sent");
                setFiles([]);
                formRef.current?.reset();
                return;
            }

            if (xhr.status === 429) {
                setErrors({
                    form:
                        payload.message ??
                        "That is a few orders in a short window. Give it a few minutes.",
                });
            } else if (xhr.status === 400 && Array.isArray(payload.details)) {
                // Server rules win. Mapped onto the same error state the client
                // validator writes to, so the two never render differently.
                setErrors(Object.fromEntries(payload.details.map((d) => [d.field, d.message])));
            } else if (payload.message) {
                // A single-message 400 is a file rejection from quoteUpload.js.
                setErrors({ form: payload.message });
            }
            setState("error");
        };

        xhr.onerror = () => setState("error");
        xhr.onabort = () => setState("idle");

        xhr.send(form);
    }

    const sending = state === "sending";

    /* ── Section chrome, shared by both states ─────────────────────────── */

    const header = (
        <div className="grid gap-x-12 gap-y-6 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-6">
                <SectionIndex index={index} label="Order desk" />
                <h2 className="text-heading mt-6 max-w-[22ch]">
                    Send the batch.{" "}
                    <span className="text-(--text-mute)">Get a real quote, not a table.</span>
                </h2>
            </div>
            <p className="max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim) lg:col-span-4 lg:col-start-9">
                Two sample images is enough to start. Fill the docket, attach what you have, and
                the quote comes back against your own photography with the turnaround confirmed.
            </p>
        </div>
    );

    /* ── Sent ─────────────────────────────────────────────────────────── */

    if (state === "sent") {
        return (
            <section id="order" className="scroll-mt-28 border-b border-(--line)">
                <div className="shell py-20 md:py-28">
                    {header}

                    <div className="mt-14 max-w-2xl border border-(--line) bg-(--raised)">
                        <SignalBar />
                        <div
                            className={cn(
                                STAMP,
                                "flex items-center justify-between border-b border-(--line) px-6 py-3 text-(--text-mute) md:px-9",
                            )}
                        >
                            <span>Job docket</span>
                            {/* The blank on the header strip, filled in. This is
                                the one number the client quotes back at us. */}
                            <span className="nums text-(--text)">
                                No. {receipt?.reference ?? "—"}
                            </span>
                        </div>

                        <div className="px-6 py-9 md:px-9" role="status">
                            <span className="label-mono text-signal">Order received</span>
                            <h3 className="text-subheading mt-4 text-(--text)">
                                That is on the desk.
                            </h3>

                            {receipt?.fileCount > 0 && (
                                <p className="label-mono nums mt-4 text-(--text-mute)">
                                    {receipt.fileCount} file{receipt.fileCount === 1 ? "" : "s"}{" "}
                                    received
                                </p>
                            )}

                            <p className="mt-5 text-[1.0625rem] leading-relaxed text-(--text-dim)">
                                A receipt is on its way to your inbox. An editor looks at the
                                images themselves before quoting, so the price comes back against
                                your own photography rather than against the table above — within
                                one business day, with the turnaround confirmed. Nothing is charged
                                until you reply to it.
                            </p>
                            <p className="mt-4 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                                Tighter than that? Call {contact.whatsapp} or mail {contact.email}.
                            </p>

                            <button
                                type="button"
                                onClick={() => {
                                    setState("idle");
                                    setReceipt(null);
                                    setErrors({});
                                }}
                                className="label-mono mt-8 border-b border-signal pb-1 text-(--text) transition-colors hover:text-signal"
                            >
                                Place another order
                            </button>
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    /* ── Form ─────────────────────────────────────────────────────────── */

    return (
        <section id="order" className="scroll-mt-28 border-b border-(--line)">
            <div className="shell py-20 md:py-28">
                {header}

                <div className="mt-14 grid gap-10 lg:grid-cols-12 lg:gap-12">
                    {/* ── The rail: what happens to the files, and who to call
                        instead. Quiet on purpose — the docket is the thing on
                        this screen that has to be loud. ── */}
                    <div className="lg:col-span-4">
                        <ol className="space-y-7">
                            {ORDER_STEPS.map((step, i) => (
                                <li key={step.title} className="flex gap-4">
                                    <span className={cn(STAMP, "nums mt-1 shrink-0 text-brand")}>
                                        {pad(i + 1)}
                                    </span>
                                    <div>
                                        <h3 className="text-[1rem] leading-snug font-medium tracking-[-0.02em] text-(--text)">
                                            {step.title}
                                        </h3>
                                        <p className="mt-2 text-[0.9375rem] leading-relaxed text-(--text-dim)">
                                            {step.body}
                                        </p>
                                    </div>
                                </li>
                            ))}
                        </ol>

                        <p className="mt-9 border-t border-(--line) pt-7 text-[0.9375rem] leading-relaxed text-(--text-mute)">
                            Rather talk it through first?{" "}
                            <a
                                href={contact.whatsappHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-(--text) underline decoration-(--line) underline-offset-4 transition-colors hover:text-brand"
                            >
                                {contact.whatsapp}
                            </a>{" "}
                            or{" "}
                            <a
                                href={`mailto:${contact.email}`}
                                className="text-(--text) underline decoration-(--line) underline-offset-4 transition-colors hover:text-brand"
                            >
                                {contact.email}
                            </a>
                            .
                        </p>
                    </div>

                    {/* ── The docket ─────────────────────────────────────── */}
                    <div className="lg:col-span-8">
                        <form
                            ref={formRef}
                            onSubmit={onSubmit}
                            noValidate
                            className="border border-(--line) bg-(--raised)"
                        >
                            <SignalBar />

                            <div
                                className={cn(
                                    STAMP,
                                    "flex flex-wrap items-center justify-between gap-3 border-b border-(--line) px-6 py-3 text-(--text-mute) md:px-9",
                                )}
                            >
                                <span className="text-(--text)">Job docket</span>
                                <span className="flex items-center gap-2">
                                    <span>Graphics</span>
                                    <span aria-hidden="true" className="text-(--line)">
                                        /
                                    </span>
                                    {/* Left blank until the server issues one. A
                                        printed blank is what tells a reader this
                                        is a document that gets filled in. */}
                                    <span>No. </span>
                                    <span
                                        aria-hidden="true"
                                        className="inline-block w-14 border-b border-dashed border-(--text-mute) align-baseline"
                                    />
                                </span>
                            </div>

                            {/* Honeypot */}
                            <div className="sr-only" aria-hidden="true">
                                <label htmlFor="q-company">Company (leave blank)</label>
                                <input
                                    id="q-company"
                                    name="company"
                                    type="text"
                                    tabIndex={-1}
                                    autoComplete="off"
                                />
                            </div>

                            {/* ── 01 ── */}
                            <Group n={1} title="Who it is from">
                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="q-senderName" className={LABEL}>
                                            Your name
                                            <Required />
                                        </label>
                                        <input
                                            id="q-senderName"
                                            name="senderName"
                                            type="text"
                                            autoComplete="name"
                                            maxLength={120}
                                            aria-invalid={!!errors.senderName}
                                            aria-describedby={
                                                errors.senderName ? "err-q-senderName" : undefined
                                            }
                                            className={cn(
                                                FIELD,
                                                "mt-2",
                                                errors.senderName && "border-signal",
                                            )}
                                            placeholder="Andrea Dawson"
                                        />
                                        <FieldError id="err-q-senderName">
                                            {errors.senderName}
                                        </FieldError>
                                    </div>

                                    <div>
                                        <label htmlFor="q-senderEmail" className={LABEL}>
                                            Work email
                                            <Required />
                                        </label>
                                        <input
                                            id="q-senderEmail"
                                            name="senderEmail"
                                            type="email"
                                            autoComplete="email"
                                            aria-invalid={!!errors.senderEmail}
                                            aria-describedby={
                                                errors.senderEmail
                                                    ? "err-q-senderEmail"
                                                    : undefined
                                            }
                                            className={cn(
                                                FIELD,
                                                "mt-2",
                                                errors.senderEmail && "border-signal",
                                            )}
                                            placeholder="you@company.com"
                                        />
                                        <FieldError id="err-q-senderEmail">
                                            {errors.senderEmail}
                                        </FieldError>
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label htmlFor="q-phone" className={LABEL}>
                                            Phone / WhatsApp
                                        </label>
                                        <input
                                            id="q-phone"
                                            name="phone"
                                            type="tel"
                                            autoComplete="tel"
                                            maxLength={40}
                                            className={cn(FIELD, "mt-2")}
                                            placeholder="+880 1XXX-XXXXXX"
                                        />
                                    </div>
                                </div>
                            </Group>

                            {/* ── 02 ── */}
                            <Group n={2} title="The job">
                                <div>
                                    <label htmlFor="q-jobTitle" className={LABEL}>
                                        Job name
                                        <Required />
                                    </label>
                                    <input
                                        id="q-jobTitle"
                                        name="jobTitle"
                                        type="text"
                                        maxLength={160}
                                        aria-invalid={!!errors.jobTitle}
                                        aria-describedby={
                                            errors.jobTitle ? "err-q-jobTitle" : undefined
                                        }
                                        className={cn(
                                            FIELD,
                                            "mt-2",
                                            errors.jobTitle && "border-signal",
                                        )}
                                        placeholder="SS26 lookbook — batch 04"
                                    />
                                    <FieldError id="err-q-jobTitle">{errors.jobTitle}</FieldError>
                                </div>

                                <div>
                                    <span className={LABEL}>
                                        Which passes do you need?
                                        <Required />
                                    </span>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {services.map((s) => (
                                            <label
                                                key={s.id}
                                                className="cursor-pointer border border-(--line) bg-(--canvas) px-3.5 py-2 text-[0.875rem] text-(--text-dim) transition-colors select-none has-checked:border-signal has-checked:bg-signal has-checked:text-white hover:border-(--text-mute)"
                                            >
                                                <input
                                                    type="checkbox"
                                                    name="servicesRequired"
                                                    value={s.title}
                                                    className="sr-only"
                                                />
                                                {s.title}
                                            </label>
                                        ))}
                                    </div>
                                    <FieldError id="err-q-servicesRequired">
                                        {errors.servicesRequired}
                                    </FieldError>
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label htmlFor="q-deliveryType" className={LABEL}>
                                            Delivery format
                                        </label>
                                        <select
                                            id="q-deliveryType"
                                            name="deliveryType"
                                            defaultValue=""
                                            className={cn(FIELD, "mt-2")}
                                        >
                                            <option value="">Tell us in the brief</option>
                                            {DELIVERY_TYPES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                        <FieldError id="err-q-deliveryType">
                                            {errors.deliveryType}
                                        </FieldError>
                                    </div>

                                    <div>
                                        <label htmlFor="q-deliveryTime" className={LABEL}>
                                            Turnaround
                                        </label>
                                        <select
                                            id="q-deliveryTime"
                                            name="deliveryTime"
                                            defaultValue=""
                                            className={cn(FIELD, "mt-2")}
                                        >
                                            <option value="">No fixed deadline</option>
                                            {DELIVERY_TIMES.map((t) => (
                                                <option key={t} value={t}>
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                        <FieldError id="err-q-deliveryTime">
                                            {errors.deliveryTime}
                                        </FieldError>
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="q-instructions" className={LABEL}>
                                        Instructions
                                        <Required />
                                    </label>
                                    <textarea
                                        id="q-instructions"
                                        name="instructions"
                                        rows={5}
                                        maxLength={4000}
                                        aria-invalid={!!errors.instructions}
                                        aria-describedby={
                                            errors.instructions ? "err-q-instructions" : undefined
                                        }
                                        className={cn(
                                            FIELD,
                                            "mt-2 resize-y",
                                            errors.instructions && "border-signal",
                                        )}
                                        placeholder={
                                            "Clip the image, save as Path 1, save the path to Clipping Path.\nWhite background, 2000px square, keep the shadow."
                                        }
                                    />
                                    <FieldError id="err-q-instructions">
                                        {errors.instructions}
                                    </FieldError>
                                </div>
                            </Group>

                            {/* ── 03 ── */}
                            <Group n={3} title="The files" note="Optional, but it speeds the quote up">
                                <div
                                    onDragOver={(e) => {
                                        e.preventDefault();
                                        setDragging(true);
                                    }}
                                    onDragLeave={() => setDragging(false)}
                                    onDrop={onDrop}
                                    className={cn(
                                        "border border-dashed bg-(--canvas) p-6 transition-colors",
                                        dragging
                                            ? "border-signal bg-signal/5"
                                            /* A plain token, no opacity modifier:
                                               `border-(--text-mute)/45` is an
                                               arbitrary var + alpha, which Tailwind
                                               cannot color-mix without knowing the
                                               value's type, and it silently drops
                                               the whole declaration. */
                                            : "border-(--text-mute)",
                                    )}
                                >
                                    <input
                                        ref={inputRef}
                                        id="q-files"
                                        /* Deliberately unnamed: the files posted are
                                           the ones in state, appended by hand at
                                           submit, so a removed file is truly gone. */
                                        type="file"
                                        multiple
                                        accept={ACCEPTED_FILES}
                                        onChange={(e) => addFiles(e.target.files)}
                                        className="sr-only"
                                    />

                                    <div className="flex flex-wrap items-center gap-4">
                                        <FilesIcon />
                                        <div className="min-w-0 flex-1">
                                            <label
                                                htmlFor="q-files"
                                                className="cursor-pointer text-[0.9375rem] font-medium text-(--text) underline decoration-signal underline-offset-4 transition-colors hover:text-signal"
                                            >
                                                Choose files
                                            </label>
                                            <span className="text-[0.9375rem] text-(--text-mute)">
                                                {" "}
                                                or drop them here
                                            </span>
                                            <p className="mt-1 text-[0.8125rem] leading-relaxed text-(--text-mute)">
                                                {ACCEPTED_LABEL} ·{" "}
                                                {formatBytes(UPLOAD_LIMITS.maxFileBytes)} per file
                                            </p>
                                        </div>
                                        <span
                                            className={cn(
                                                STAMP,
                                                "nums shrink-0 text-(--text-mute)",
                                            )}
                                        >
                                            {files.length}/{UPLOAD_LIMITS.maxFiles}
                                        </span>
                                    </div>

                                    {files.length > 0 && (
                                        <ul className="mt-5 border-t border-(--line)">
                                            {files.map((file) => (
                                                <li
                                                    key={fileKey(file)}
                                                    className="flex items-center gap-4 border-b border-(--line-soft) py-2.5 last:border-0"
                                                >
                                                    <span className="min-w-0 flex-1 truncate text-[0.875rem] text-(--text)">
                                                        {file.name}
                                                    </span>
                                                    <span className="label-mono nums shrink-0 text-(--text-mute)">
                                                        {formatBytes(file.size)}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeFile(fileKey(file))}
                                                        disabled={sending}
                                                        aria-label={`Remove ${file.name}`}
                                                        className="label-mono shrink-0 text-(--text-mute) transition-colors hover:text-signal disabled:opacity-40"
                                                    >
                                                        Remove
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}

                                    {files.length > 0 && (
                                        <p
                                            className={cn(
                                                STAMP,
                                                "nums mt-3 text-(--text-mute)",
                                            )}
                                        >
                                            {formatBytes(totalBytes)} of{" "}
                                            {formatBytes(UPLOAD_LIMITS.maxTotalBytes)}
                                        </p>
                                    )}

                                    {fileError && (
                                        <p role="alert" className="label-mono mt-4 text-signal">
                                            {fileError}
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label htmlFor="q-fileLink" className={LABEL}>
                                        Or a link to the full batch
                                    </label>
                                    <input
                                        id="q-fileLink"
                                        name="fileLink"
                                        type="url"
                                        inputMode="url"
                                        maxLength={400}
                                        aria-invalid={!!errors.fileLink}
                                        aria-describedby={
                                            errors.fileLink ? "err-q-fileLink" : undefined
                                        }
                                        className={cn(
                                            FIELD,
                                            "mt-2",
                                            errors.fileLink && "border-signal",
                                        )}
                                        placeholder="https://we.tl/… or a Drive or Dropbox link"
                                    />
                                    <FieldError id="err-q-fileLink">{errors.fileLink}</FieldError>
                                </div>

                                <p className="text-[0.8125rem] leading-relaxed text-(--text-mute)">
                                    {FILE_NOTE}
                                </p>
                            </Group>

                            {/* ── Footer of the docket ───────────────────── */}
                            <div className="border-t border-(--line) bg-(--canvas) px-6 py-7 md:px-9">
                                <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
                                    <button
                                        type="submit"
                                        disabled={sending}
                                        className="inline-flex items-center gap-2.5 bg-brand px-8 py-4 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
                                    >
                                        {sending ? "Sending…" : "Send the order"}
                                        {!sending && <span aria-hidden="true">→</span>}
                                    </button>

                                    <p className="max-w-xs text-[0.875rem] leading-relaxed text-(--text-mute)">
                                        Quote back within one business day. Nothing is charged
                                        until you reply to it.
                                    </p>
                                </div>

                                {/* Progress only earns its place once bytes are
                                    moving, and only when there are bytes worth
                                    watching. */}
                                {sending && totalBytes > 0 && (
                                    <div aria-live="polite" className="mt-6">
                                        <div
                                            role="progressbar"
                                            aria-valuemin={0}
                                            aria-valuemax={100}
                                            aria-valuenow={progress}
                                            aria-label="Upload progress"
                                            className="h-0.5 w-full bg-(--line)"
                                        >
                                            <div
                                                className="h-0.5 bg-signal transition-[width] duration-200 ease-out"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                        <p
                                            className={cn(
                                                STAMP,
                                                "nums mt-2.5 text-(--text-mute)",
                                            )}
                                        >
                                            {progress < 100
                                                ? `Uploading ${formatBytes(totalBytes)} — ${progress}%`
                                                : "Uploaded. Filing the order…"}
                                        </p>
                                    </div>
                                )}

                                {state === "error" && (
                                    <p role="alert" className="label-mono mt-5 text-signal">
                                        {errors.form ??
                                            `Something went wrong sending that. Mail the batch to ${contact.email} instead.`}
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}
