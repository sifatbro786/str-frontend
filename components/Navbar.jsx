"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/ui/Logo";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { site } from "@/lib/site";
import { cn, pad } from "@/lib/utils";

/**
 * Sticky header.
 *
 * Active state is a signal-orange rule drawn *under* the label rather than a
 * filled pill — the pill is the generated-UI tell we are avoiding everywhere.
 * The rule is a pseudo-free absolutely positioned span so it can animate width
 * later (Phase 5) without re-layout.
 *
 * The header is not translucent at scrollTop 0: a blurred bar over a hero is a
 * cliché and it costs a composite layer on every scroll frame for nothing.
 */
/**
 * Rolling label. The item's text is rendered twice inside a 1em-tall clipped
 * box; hovering translates the pair up by exactly one line, so the second copy
 * lands where the first was.
 *
 * Pure CSS on purpose — a JS-driven roll on a nav item can desync if the
 * pointer leaves mid-tween, and this cannot. The clone is aria-hidden so the
 * accessible name is not duplicated.
 */
function RollingLabel({ children }) {
  return (
    <span className="relative block h-[1em] overflow-hidden">
      <span className="block transition-transform duration-500 ease-[cubic-bezier(0.65,0,0.35,1)] group-hover:-translate-y-full">
        {children}
      </span>
      <span aria-hidden="true" className="block text-signal">
        {children}
      </span>
    </span>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the sheet on route change, and lock the body while it is open.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const isActive = (href) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300",
          scrolled
            ? "border-(--line) bg-(--overlay) backdrop-blur-xl backdrop-saturate-150"
            : "border-transparent bg-transparent"
        )}
      >
        <div className="shell flex h-[68px] items-center justify-between gap-6 md:h-[76px]">
          <Logo priority height={28} />

          {/* Desktop nav */}
          <nav aria-label="Primary" className="hidden items-center gap-1 lg:flex">
            {site.nav.map((item, i) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group relative inline-flex items-center px-4 py-2 text-[0.9375rem] transition-colors",
                    active ? "text-(--text)" : "text-(--text-mute) hover:text-(--text)"
                  )}
                >
                  <span className="label-mono mr-2 text-signal opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    {pad(i + 1)}
                  </span>
                  <RollingLabel>{item.label}</RollingLabel>
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-4 -bottom-px h-px origin-left bg-signal transition-transform duration-300",
                      active ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />

            <Link
              href="/contact"
              className="hidden bg-(--text) px-5 py-2.5 text-[0.8125rem] font-medium text-(--canvas) transition-colors hover:bg-signal hover:text-white sm:inline-flex"
            >
              Start a project
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="inline-flex h-9 w-9 items-center justify-center border border-(--line) text-(--text) lg:hidden"
            >
              <span className="relative block h-3 w-4">
                <span
                  className={cn(
                    "absolute left-0 block h-px w-full bg-current transition-transform duration-300",
                    open ? "top-1.5 rotate-45" : "top-0"
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 top-1.5 block h-px w-full bg-current transition-opacity duration-200",
                    open && "opacity-0"
                  )}
                />
                <span
                  className={cn(
                    "absolute left-0 block h-px w-full bg-current transition-transform duration-300",
                    open ? "top-1.5 -rotate-45" : "top-3"
                  )}
                />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet — full canvas, indexed list, no slide-in drawer. */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="fixed inset-0 z-40 bg-(--canvas) pt-[68px] lg:hidden"
      >
        <nav aria-label="Mobile" className="shell flex h-full flex-col">
          <ul className="divide-y divide-(--line) border-b border-t border-(--line)">
            {site.nav.map((item, i) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-baseline gap-5 py-5 text-[1.75rem] tracking-[-0.03em] transition-colors",
                    isActive(item.href) ? "text-signal" : "text-(--text)"
                  )}
                >
                  <span className="label-mono text-(--text-mute)">{pad(i + 1)}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-auto pb-10 pt-8">
            <Link
              href="/contact"
              className="flex w-full items-center justify-center bg-brand px-6 py-4 text-sm font-medium text-white"
            >
              Start a project
            </Link>
            <p className="label-mono mt-6 text-(--text-mute)">
              {site.contact.email} · {site.address.line2}
            </p>
          </div>
        </nav>
      </div>
    </>
  );
}
