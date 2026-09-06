"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

const FIELD =
  "w-full border border-(--line) bg-transparent px-4 py-3.5 text-[0.9375rem] text-(--text) placeholder:text-(--text-mute) transition-colors focus:border-signal focus:outline-none";
const LABEL = "label-mono block text-(--text-mute)";

/**
 * Posts to the BFF, never to Express. On success the cookie is already set by
 * the route handler, so we only have to navigate.
 *
 * router.replace + router.refresh, in that order: replace moves the URL,
 * refresh re-runs the (admin) layout's server-side /auth/me check so the shell
 * renders with the real user instead of a stale RSC payload.
 */
export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [state, setState] = useState("idle"); // idle | submitting | error
  const [message, setMessage] = useState("");

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") || "").trim();
    const password = String(form.get("password") || "");

    if (!email || !password) {
      setState("error");
      setMessage("Both fields are required.");
      return;
    }

    setState("submitting");
    setMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await res.json().catch(() => ({}));

      if (!res.ok) {
        setState("error");
        setMessage(
          res.status === 429
            ? "Too many attempts. Wait a few minutes and try again."
            : payload.message || "Sign in failed."
        );
        return;
      }

      // Open redirects: only ever navigate to an in-app absolute path.
      router.replace(next.startsWith("/") && !next.startsWith("//") ? next : "/admin");
      router.refresh();
    } catch {
      setState("error");
      setMessage("Network error. Check that the API server is running.");
    }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div>
        <label htmlFor="email" className={LABEL}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoFocus
          required
          className={cn(FIELD, "mt-3")}
          placeholder="you@strsltd.com"
        />
      </div>

      <div>
        <label htmlFor="password" className={LABEL}>
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={cn(FIELD, "mt-3")}
          placeholder="••••••••"
        />
      </div>

      {state === "error" && (
        <p role="alert" className="label-mono border-l-2 border-signal pl-3 text-signal">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "submitting"}
        className="w-full bg-brand px-8 py-4 text-[0.9375rem] font-medium text-white transition-colors hover:bg-brand-hi disabled:opacity-60"
      >
        {state === "submitting" ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
