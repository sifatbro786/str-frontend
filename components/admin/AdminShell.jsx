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
      <div className="min-h-dvh bg-(--canvas)">
        {/* Desktop rail */}
        <div className="fixed inset-y-0 left-0 z-40 hidden w-60 border-r border-(--line) bg-(--raised) lg:block">
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
            <div className="absolute inset-y-0 left-0 w-64 border-r border-(--line) bg-(--raised)">
              <Sidebar onNavigate={() => setNavOpen(false)} />
            </div>
          </div>
        )}

        <div className="lg:pl-60">
          <Topbar user={user} onMenu={() => setNavOpen(true)} />
          <main className="px-5 py-8 sm:px-8 lg:px-10">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
