"use client";

import { useState } from "react";
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

  function validate(data) {
    const next = {};
    if (!data.senderName?.trim()) next.senderName = "Tell us who you are.";
    if (!/^\S+@\S+\.\S+$/.test(data.senderEmail || "")) next.senderEmail = "That email does not look right.";
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
    // PHASE 4 — replace this block with the real POST:
    //   const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries`, {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify(data),
    //   });
    //   if (!res.ok) { setState("error"); return; }
    await new Promise((r) => setTimeout(r, 700));
    setState("sent");
    e.target.reset();
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
          <select id="budgetRange" name="budgetRange" defaultValue="" className={cn(FIELD, "mt-3")}>
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
              className="group cursor-pointer border border-(--line) px-4 py-2.5 text-[0.875rem] text-(--text-dim) transition-colors has-[:checked]:border-signal has-[:checked]:bg-signal has-[:checked]:text-white hover:border-(--text)"
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

        <p className="label-mono max-w-xs text-(--text-mute)">{site.contact.responseTime}</p>
      </div>

      {state === "error" && (
        <p role="alert" className="label-mono text-signal">
          Something went wrong sending that. Email {site.contact.email} instead.
        </p>
      )}
    </form>
  );
}
