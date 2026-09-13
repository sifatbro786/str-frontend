"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Inquiry form — Phase 3 is UI only. Field names map 1:1 onto
 * str-backend/src/models/Inquiry.js so the Phase 4 wiring is a single fetch:
 *
 *   POST /api/v1/inquiries
 *   { senderName, senderEmail, phone, serviceInterested, budgetRange, message }
 *
 * Validation notes for whoever wires it up:
 *   · Mirror the server's rules, never replace them. express-validator on the
 *     backend stays the source of truth; this is a UX layer.
 *   · The honeypot below is a first-line bot filter only — the real gate is the
 *     backend rate limiter in middleware/rateLimiters.js.
 *   · Never disable the button on `!isValid`; disable on `submitting`. A button
 *     that is dead with no explanation is the most common accessibility failure
 *     on contact forms.
 */

const FIELD =
    "w-full border border-(--line) bg-transparent px-4 py-3.5 text-[0.9375rem] text-(--text) placeholder:text-(--text-mute) transition-colors focus:border-signal focus:outline-none";

const LABEL = "label-mono block text-(--text-mute)";

export default function InquiryForm({ services }) {
    const [state, setState] = useState("idle"); // idle | submitting | sent | error
    const [errors, setErrors] = useState({});
    const [prefill, setPrefill] = useState("");

    /**
     * Seeds the message box when someone arrives from a package card on
     * /packages, which links here as /contact?package=Corporate%20Package%20(BIZ-02).
     *
     * ── WHY window.location AND NOT useSearchParams ──────────────────────
     * useSearchParams opts the whole route out of static generation and, in an
     * app-router build, has to sit behind its own <Suspense> boundary. This
     * page is otherwise static and has no other reason to be dynamic, and the
     * cost of getting it wrong is a build error rather than a runtime one.
     * Reading the query in an effect keeps the route exactly as it was.
     *
     * ── WHY IT IS SAFE FOR HYDRATION ─────────────────────────────────────
     * The first render is "" on the server and on the client; the effect runs
     * after hydration, so there is no markup mismatch. `key={prefill}` on the
     * textarea below is what makes a late defaultValue take: without it React
     * keeps the already-mounted uncontrolled node and the change is ignored.
     * Uncontrolled on purpose — the form reads itself with FormData, and the
     * visitor must be able to delete this sentence and write their own.
     */
    useEffect(() => {
        try {
            const requested = new URLSearchParams(window.location.search).get("package");
            if (!requested) return;
            // Bounded: this string is rendered into a textarea, and a query
            // param is attacker-controlled even when the only link to it is ours.
            setPrefill(`I'm interested in the ${requested.slice(0, 120)} package. `);
        } catch {
            /* No query string to parse is the normal case, not an error. */
        }
    }, []);

    function validate(data) {
        const next = {};
        if (!data.senderName?.trim()) next.senderName = "Tell us who you are.";
        if (!/^\S+@\S+\.\S+$/.test(data.senderEmail || ""))
            next.senderEmail = "That email does not look right.";
        if ((data.message || "").trim().length < 20)
            next.message = "A sentence or two more, so we can answer usefully.";
        return next;
    }

    async function onSubmit(e) {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        const data = Object.fromEntries(form.entries());

        // Honeypot: real users never fill a visually hidden field.
        if (data.company) return;

        const found = validate(data);
        setErrors(found);
        if (Object.keys(found).length > 0) return;

        setState("submitting");

        // Posts browser → Express directly. This endpoint is public and rate
        // limited per IP; routing it through the BFF would collapse every
        // visitor onto one rate-limit bucket. Not the same case as /admin.
        delete data.company; // honeypot, never sent

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                const payload = await res.json().catch(() => ({}));
                if (res.status === 429) {
                    setErrors({
                        form: "Too many submissions from this connection. Try again shortly.",
                    });
                } else if (res.status === 400 && Array.isArray(payload.details)) {
                    // Server rules win. Map them onto the same error state the client
                    // validator uses so the two never render differently.
                    setErrors(Object.fromEntries(payload.details.map((d) => [d.field, d.message])));
                }
                setState("error");
                return;
            }

            setState("sent");
            e.target.reset();
        } catch {
            setState("error");
        }
    }

    if (state === "sent") {
        return (
            <div className="border border-(--line) p-10" role="status">
                <span className="label-mono text-signal">Received</span>
                <h3 className="mt-5 text-[1.75rem] font-semibold tracking-[-0.03em] text-(--text)">
                    Thanks — that landed.
                </h3>
                <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-(--text-mute)">
                    {site.contact.responseTime} If it is urgent, call {site.contact.phone} during{" "}
                    {site.contact.hours}.
                </p>
                <button
                    type="button"
                    onClick={() => setState("idle")}
                    className="label-mono mt-8 border-b border-signal pb-1 text-(--text) transition-colors hover:text-signal"
                >
                    Send another
                </button>
            </div>
        );
    }

    return (
        <form onSubmit={onSubmit} noValidate className="space-y-7">
            {/* Honeypot */}
            <div className="sr-only" aria-hidden="true">
                <label htmlFor="company">Company (leave blank)</label>
                <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
            </div>

            <div className="grid gap-7 sm:grid-cols-2">
                <div>
                    <label htmlFor="senderName" className={LABEL}>
                        Your name *
                    </label>
                    <input
                        id="senderName"
                        name="senderName"
                        type="text"
                        autoComplete="name"
                        aria-invalid={!!errors.senderName}
                        aria-describedby={errors.senderName ? "err-senderName" : undefined}
                        className={cn(FIELD, "mt-3", errors.senderName && "border-signal")}
                        placeholder="Sifat Islam"
                    />
                    {errors.senderName && (
                        <p id="err-senderName" className="label-mono mt-2 text-signal">
                            {errors.senderName}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="senderEmail" className={LABEL}>
                        Work email *
                    </label>
                    <input
                        id="senderEmail"
                        name="senderEmail"
                        type="email"
                        autoComplete="email"
                        aria-invalid={!!errors.senderEmail}
                        aria-describedby={errors.senderEmail ? "err-senderEmail" : undefined}
                        className={cn(FIELD, "mt-3", errors.senderEmail && "border-signal")}
                        placeholder="you@company.com"
                    />
                    {errors.senderEmail && (
                        <p id="err-senderEmail" className="label-mono mt-2 text-signal">
                            {errors.senderEmail}
                        </p>
                    )}
                </div>

                <div>
                    <label htmlFor="phone" className={LABEL}>
                        Phone / WhatsApp
                    </label>
                    <input
                        id="phone"
                        name="phone"
                        type="tel"
                        autoComplete="tel"
                        className={cn(FIELD, "mt-3")}
                        placeholder="+880 1XXX-XXXXXX"
                    />
                </div>

                <div>
                    <label htmlFor="budgetRange" className={LABEL}>
                        Budget range
                    </label>
                    <select
                        id="budgetRange"
                        name="budgetRange"
                        defaultValue=""
                        className={cn(FIELD, "mt-3")}
                    >
                        <option value="">Prefer not to say</option>
                        {site.budgetRanges.map((b) => (
                            <option key={b} value={b}>
                                {b}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <fieldset>
                <legend className={LABEL}>What do you need? *</legend>
                <div className="mt-4 flex flex-wrap gap-2">
                    {services.map((s, i) => (
                        <label
                            key={s.slug}
                            className="group cursor-pointer border border-(--line) px-4 py-2.5 text-[0.875rem] text-(--text-dim) transition-colors has-checked:border-signal has-checked:bg-signal has-checked:text-white hover:border-(--text)"
                        >
                            <input
                                type="radio"
                                name="serviceInterested"
                                value={s.title}
                                defaultChecked={i === 0}
                                className="sr-only"
                            />
                            {s.title}
                        </label>
                    ))}
                </div>
            </fieldset>

            <div>
                <label htmlFor="message" className={LABEL}>
                    What is the actual constraint? *
                </label>
                <textarea
                    // Remounts when the effect above resolves a ?package= param,
                    // so the late defaultValue is actually applied.
                    key={prefill}
                    defaultValue={prefill}
                    id="message"
                    name="message"
                    rows={6}
                    aria-invalid={!!errors.message}
                    aria-describedby={errors.message ? "err-message" : undefined}
                    className={cn(FIELD, "mt-3 resize-y", errors.message && "border-signal")}
                    placeholder="The deadline, the legacy system, the volume, the thing that has already been tried once. More detail here means a more useful first reply."
                />
                {errors.message && (
                    <p id="err-message" className="label-mono mt-2 text-signal">
                        {errors.message}
                    </p>
                )}
            </div>

            <div className="flex flex-wrap items-center gap-5 pt-2">
                <button
                    type="submit"
                    disabled={state === "submitting"}
                    className="inline-flex items-center gap-2.5 bg-brand px-8 py-4 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
                >
                    {state === "submitting" ? "Sending…" : "Send inquiry"}
                    {state !== "submitting" && <span aria-hidden="true">→</span>}
                </button>

                <p className="label-mono max-w-xs text-(--text-mute)">
                    {site.contact.responseTime}
                </p>
            </div>

            {state === "error" && (
                <p role="alert" className="label-mono text-signal">
                    {errors.form ??
                        `Something went wrong sending that. Email ${site.contact.email} instead.`}
                </p>
            )}
        </form>
    );
}
