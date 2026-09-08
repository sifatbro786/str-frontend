"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { ADMIN_NAV, isNavActive } from "@/lib/adminNav";
import { LogoutIcon, MenuIcon } from "./icons";

/**
 * Page title, theme toggle, who is signed in, sign out.
 *
 * The title is derived from ADMIN_NAV rather than passed down by each page, so
 * a route added to the nav gets a correct heading with no second edit — and a
 * route NOT in the nav falls back to "Admin" rather than rendering blank.
 */
export default function Topbar({ user, onMenu }) {
    const router = useRouter();
    const pathname = usePathname();
    const [busy, setBusy] = useState(false);

    const current = ADMIN_NAV.find((item) => isNavActive(item, pathname))?.label ?? "Admin";

    async function logout() {
        setBusy(true);
        await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
        // replace, not push: the back button must not return to the dashboard.
        router.replace("/login");
        router.refresh();
    }

    const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? "?";

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-(--line) bg-(--canvas)/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
            <button
                type="button"
                onClick={onMenu}
                aria-label="Open navigation"
                className="-ml-1 rounded-lg p-2 text-(--text-dim) transition-colors hover:bg-(--raised-2) hover:text-(--text) lg:hidden"
            >
                <MenuIcon className="size-5" />
            </button>

            <h1 className="truncate text-[1.0625rem] font-semibold tracking-[-0.015em] text-(--text)">
                {current}
            </h1>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <ThemeToggle />

                <div className="hidden items-center gap-2.5 sm:flex">
                    <span
                        aria-hidden="true"
                        className="grid size-8 shrink-0 place-items-center rounded-full bg-(--raised-2) text-[0.8125rem] font-semibold text-(--text-dim)"
                    >
                        {initial}
                    </span>
                    <div className="leading-tight">
                        <p className="text-[0.8125rem] font-medium text-(--text)">{user?.name}</p>
                        <p className="text-[0.75rem] text-(--text-mute) capitalize">
                            {user?.role?.replace("_", " ")}
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={logout}
                    disabled={busy}
                    className="flex items-center gap-2 rounded-lg border border-(--line) px-3 py-2 text-[0.875rem] font-medium text-(--text-dim) transition-colors hover:border-(--text-mute) hover:bg-(--raised-2) hover:text-(--text) disabled:opacity-60"
                >
                    <LogoutIcon className="size-4" />
                    <span className="hidden sm:inline">{busy ? "Signing out…" : "Sign out"}</span>
                </button>
            </div>
        </header>
    );
}
