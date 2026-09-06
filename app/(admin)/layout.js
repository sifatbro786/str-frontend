import { redirect } from "next/navigation";
import { apiFetch } from "@/lib/apiServer";
import AdminShell from "@/components/admin/AdminShell";

/**
 * Second protection layer. middleware.js only proved a cookie exists; this
 * proves the token is valid, unexpired, unrevoked, and belongs to an active
 * account — by asking the only component that can know, the API.
 *
 * force-dynamic because the answer is per-request and per-user. Without it a
 * cached RSC payload could render one admin's shell for another.
 */
export const dynamic = "force-dynamic";

export const metadata = {
  title: { default: "Admin", template: "%s · STR Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({ children }) {
  let user = null;
  try {
    const res = await apiFetch("/auth/me", { auth: true });
    user = res.data;
  } catch {
    // redirect() throws NEXT_REDIRECT as control flow. Calling it inside the
    // catch is the one safe position — never wrap a redirect() in its own try,
    // or the catch swallows it and the page renders unguarded.
    redirect("/login?next=/admin");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
