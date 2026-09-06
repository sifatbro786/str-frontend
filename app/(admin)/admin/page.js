import Link from "next/link";
import { apiFetch } from "@/lib/apiServer";
import StatCard from "@/components/admin/StatCard";
import StatusPill from "@/components/admin/StatusPill";
import { SERVICE_LABELS } from "@/lib/taxonomy";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";
export const metadata = { title: "Overview" };

export default async function OverviewPage() {
  const { data } = await apiFetch("/stats/overview", { auth: true });

  const cards = [
    {
      label: "Projects",
      value: data.projects.total,
      hint: `${data.projects.featured} featured`,
      href: "/admin/projects",
    },
    {
      label: "Unread inquiries",
      value: data.inquiries.new,
      hint: `${data.inquiries.total} total`,
      href: "/admin/inquiries?status=new",
      accent: data.inquiries.new > 0,
    },
    {
      label: "Published articles",
      value: data.blogs.published,
      hint: `${data.blogs.drafts} drafts`,
      href: "/admin/blogs",
    },
    {
      label: "Active services",
      value: data.services.active,
      hint: `${data.team.active} team members`,
      href: "/admin/services",
    },
  ];

  return (
    <div className="space-y-10">
      {/* 1px-gap grid over --line: the gap IS the hairline. Phase 3 §3. */}
      <div className="grid gap-px bg-(--line) sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <StatCard key={c.label} {...c} />
        ))}
      </div>

      <section className="border border-(--line)">
        <header className="flex items-center justify-between border-b border-(--line) px-5 py-4">
          <h2 className="label-mono text-(--text)">Recent leads</h2>
          <Link href="/admin/inquiries" className="label-mono text-(--text-mute) transition-colors hover:text-signal">
            All inquiries →
          </Link>
        </header>

        {data.recentInquiries.length === 0 ? (
          <p className="px-5 py-10 text-[0.9375rem] text-(--text-mute)">
            No inquiries yet. The public contact form writes here.
          </p>
        ) : (
          <ul>
            {data.recentInquiries.map((lead) => (
              <li
                key={lead._id}
                className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-(--line-soft) px-5 py-4 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.9375rem] font-medium text-(--text)">{lead.senderName}</p>
                  <p className="label-mono truncate text-(--text-mute)">{lead.senderEmail}</p>
                </div>
                <span className="label-mono text-(--text-mute)">{lead.serviceInterested || "—"}</span>
                <span className="label-mono text-(--text-mute)">{lead.budgetRange || "—"}</span>
                <StatusPill value={lead.status} />
                <span className="label-mono w-24 text-right text-(--text-mute)">{formatDate(lead.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="border border-(--line) p-5">
        <h2 className="label-mono text-(--text)">Projects by discipline</h2>
        {data.projects.byService.length === 0 ? (
          <p className="mt-5 text-[0.9375rem] text-(--text-mute)">No projects yet.</p>
        ) : (
          <ul className="mt-5 space-y-3">
            {data.projects.byService.map((row) => {
              const pct = Math.round((row.count / Math.max(1, data.projects.total)) * 100);
              return (
                <li key={row.serviceType} className="flex items-center gap-4">
                  <span className="w-44 shrink-0 text-[0.875rem] text-(--text-dim)">
                    {SERVICE_LABELS[row.serviceType] ?? row.serviceType}
                  </span>
                  {/* Static width, set at render. No transition — see §0.4. */}
                  <span className="h-2 flex-1 bg-(--raised-2)">
                    <span className="block h-full bg-brand" style={{ width: `${pct}%` }} />
                  </span>
                  <span className="label-mono nums w-8 text-right text-(--text-mute)">{row.count}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="label-mono text-(--text-mute)">
        Accurate as of {formatDate(data.generatedAt)} · reloads on every page load
      </p>
    </div>
  );
}
