"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ADMIN_NAV } from "@/lib/adminNav";

export default function Topbar({ user, onMenu }) {
  const router = useRouter();
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  const current =
    ADMIN_NAV.find((i) => (i.exact ? pathname === i.href : pathname.startsWith(i.href)))?.label ?? "Admin";

  async function logout() {
    setBusy(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    // replace, not push: the back button must not return to the dashboard.
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-(--line) bg-(--canvas) px-5 sm:px-8 lg:px-10">
      <button
        type="button"
        onClick={onMenu}
        aria-label="Open navigation"
        className="border border-(--line) px-3 py-2 text-(--text-dim) transition-colors hover:border-(--text) lg:hidden"
      >
        ☰
      </button>

      <h1 className="label-mono truncate text-(--text)">{current}</h1>

      <div className="ml-auto flex items-center gap-4">
        <ThemeToggle />
        <div className="hidden text-right sm:block">
          <p className="text-[0.8125rem] leading-tight font-medium text-(--text)">{user?.name}</p>
          <p className="label-mono leading-tight text-(--text-mute)">{user?.role?.replace("_", " ")}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          disabled={busy}
          className="label-mono border border-(--line) px-3 py-2 text-(--text-dim) transition-colors hover:border-signal hover:text-signal disabled:opacity-60"
        >
          {busy ? "…" : "Sign out"}
        </button>
      </div>
    </header>
  );
}
