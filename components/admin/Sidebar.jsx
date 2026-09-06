"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV } from "@/lib/adminNav";
import { cn } from "@/lib/utils";

export default function Sidebar({ onNavigate }) {
  const pathname = usePathname();

  const isActive = (item) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  return (
    <nav aria-label="Admin sections" className="flex h-full flex-col">
      <Link
        href="/admin"
        onClick={onNavigate}
        className="flex h-16 shrink-0 items-center border-b border-(--line) px-5"
      >
        <span className="label-mono text-(--text)">STR</span>
        <span className="label-mono ml-2 text-signal">Admin</span>
      </Link>

      <ul className="flex-1 overflow-y-auto py-3">
        {ADMIN_NAV.map((item) => {
          const active = isActive(item);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center border-l-2 px-5 py-2.5 text-[0.9375rem] transition-colors",
                  active
                    ? "border-signal bg-(--raised-2) font-medium text-(--text)"
                    : "border-transparent text-(--text-mute) hover:bg-(--raised-2) hover:text-(--text)"
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="border-t border-(--line) px-5 py-4">
        <Link href="/" target="_blank" rel="noreferrer" className="label-mono text-(--text-mute) transition-colors hover:text-signal">
          View site ↗
        </Link>
      </div>
    </nav>
  );
}
