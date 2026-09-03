"use client";

import { useState } from "react";

const FIELDS = [
  { name: "senderName", label: "Name", type: "text", placeholder: "Your name" },
  { name: "senderEmail", label: "Email", type: "email", placeholder: "you@company.com" },
  { name: "serviceInterested", label: "Service", type: "text", placeholder: "e.g. Web application" },
];

export default function ContactCTA() {
  const [form, setForm] = useState({
    senderName: "",
    senderEmail: "",
    serviceInterested: "",
    message: "",
  });
  const [status, setStatus] = useState("idle"); // idle | sending | sent | error

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setStatus("sending");
    // TODO (Phase 4): POST `form` to `${process.env.NEXT_PUBLIC_API_URL}/api/inquiries`
    // and add a real error branch. Simulated for now so the UI is demonstrable.
    setTimeout(() => setStatus("sent"), 600);
  };

  return (
    <section className="relative overflow-hidden border-b border-(--border)">
      <div
        aria-hidden="true"
        className="bg-grid pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(ellipse_at_center,#000,transparent_75%)]"
      />

      <div className="relative mx-auto grid max-w-6xl gap-12 px-6 py-24 lg:grid-cols-2 lg:items-center">
        {/* Left: pitch + facts */}
        <div>
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-(--text-muted)">
            <span className="h-px w-8 bg-accent" />
            06 // Contact
          </div>
          <h2 className="mt-6 max-w-md text-balance text-4xl font-extrabold tracking-tighter text-(--text) sm:text-6xl">
            Let&apos;s build something that lasts.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-(--text-muted)">
            Tell us what you&apos;re building. We&apos;ll come back within one
            business day.
          </p>
          <dl className="mt-10 space-y-3 font-mono text-sm text-(--text-muted)">
            <div>
              <dt className="inline text-(--text)">Email — </dt>
              <dd className="inline">
                <a href="mailto:info@strsltd.com" className="hover:text-primary">
                  info@strsltd.com
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline text-(--text)">Phone — </dt>
              <dd className="inline">
                <a href="tel:+8801332802026" className="hover:text-primary">
                  +880 1332 802026
                </a>
              </dd>
            </div>
            <div>
              <dt className="inline text-(--text)">Studio — </dt>
              <dd className="inline">Dhaka 1216, Bangladesh</dd>
            </div>
          </dl>
        </div>

        {/* Right: glassmorphic intake form */}
        <div className="border border-(--border) bg-(--surface)/60 p-8 backdrop-blur-xl">
          {status === "sent" ? (
            <div className="flex min-h-[20rem] flex-col items-start justify-center">
              <span className="grid h-12 w-12 place-items-center border border-primary text-primary">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </span>
              <h3 className="mt-5 text-xl font-bold text-(--text)">Message received.</h3>
              <p className="mt-2 text-sm text-(--text-muted)">
                Thanks, {form.senderName || "there"} — we&apos;ll be in touch shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-5">
              {FIELDS.map((f) => (
                <div key={f.name}>
                  <label
                    htmlFor={f.name}
                    className="font-mono text-xs uppercase tracking-wider text-(--text-muted)"
                  >
                    {f.label}
                  </label>
                  <input
                    id={f.name}
                    name={f.name}
                    type={f.type}
                    value={form[f.name]}
                    onChange={update}
                    required={f.name !== "serviceInterested"}
                    placeholder={f.placeholder}
                    className="mt-2 w-full border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text) outline-none transition-colors placeholder:text-(--text-muted) focus:border-primary"
                  />
                </div>
              ))}
              <div>
                <label
                  htmlFor="message"
                  className="font-mono text-xs uppercase tracking-wider text-(--text-muted)"
                >
                  Project details
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={4}
                  value={form.message}
                  onChange={update}
                  required
                  placeholder="A few lines about scope, timeline, and goals."
                  className="mt-2 w-full resize-none border border-(--border) bg-(--surface) px-4 py-3 text-sm text-(--text) outline-none transition-colors placeholder:text-(--text-muted) focus:border-primary"
                />
              </div>
              <button
                type="submit"
                disabled={status === "sending"}
                className="inline-flex w-full items-center justify-center gap-2 bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {status === "sending" ? "Sending…" : "Send inquiry"}
                {status !== "sending" && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
