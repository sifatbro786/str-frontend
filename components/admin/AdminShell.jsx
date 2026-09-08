"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ToastProvider } from "@/hooks/useToast";

/**
 * Fixed sidebar ≥ lg, off-canvas below. The mobile panel is toggled by mounting
 * and unmounting — NOT by a transform transition. Phase 4 is zero-animation and
 * an instant panel is also the fastest correct thing on a mid-range phone.
 */
export default function AdminShell({ user, children }) {
    const [navOpen, setNavOpen] = useState(false);

    return (
        <ToastProvider>
            {/* data-admin scopes the dashboard's own visual language — rounded
                controls, soft surfaces — to this subtree in globals.css. The
                public site keeps its square editorial styling untouched, and
                neither has to know about the other. */}
            <div data-admin="" className="min-h-dvh bg-(--admin-bg)">
                {/* Desktop rail */}
                <div className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-(--line) lg:block">
                    <Sidebar />
                </div>

                {/* Mobile sheet */}
                {navOpen && (
                    <div className="fixed inset-0 z-50 lg:hidden">
                        <button
                            type="button"
                            aria-label="Close navigation"
                            onClick={() => setNavOpen(false)}
                            className="absolute inset-0 bg-(--overlay)"
                        />
                        <div className="absolute inset-y-0 left-0 w-64 border-r border-(--line)">
                            <Sidebar
                                onNavigate={() => setNavOpen(false)}
                                onClose={() => setNavOpen(false)}
                            />
                        </div>
                    </div>
                )}

                <div className="lg:pl-64">
                    <Topbar user={user} onMenu={() => setNavOpen(true)} />
                    <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8">
                        {children}
                    </main>
                </div>
            </div>
        </ToastProvider>
    );
}
