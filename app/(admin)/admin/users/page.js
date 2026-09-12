import { redirect } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/apiServer";
import UsersManager from "@/components/admin/UsersManager";

/**
 * Per-request by nature: the answer depends on who is asking. Without
 * force-dynamic a cached RSC payload could hand one admin's view to another.
 */
export const dynamic = "force-dynamic";

export const metadata = { title: "Users" };

/**
 * Role gate #2 of 3.
 *
 * The sidebar hides this link for non-super_admins, and Express refuses every
 * /users call with checkRole("super_admin"). Neither covers the case in
 * between: an admin who has the URL — bookmarked, pasted, or promoted-then-
 * demoted — and loads the page directly. Without this they get a working
 * screen whose every request 403s, which reads as a broken dashboard rather
 * than a permission boundary.
 *
 * The identity comes from /auth/me, never from a prop or a cookie claim read
 * client-side: the API is the only party that can say whether the token is
 * still valid and what the role is RIGHT NOW, after any change made minutes
 * ago by someone else.
 */
export default async function UsersPage() {
    let me = null;
    try {
        const res = await apiFetch("/auth/me", { auth: true });
        me = res.data;
    } catch {
        // redirect() throws NEXT_REDIRECT as control flow — safe only outside a try.
        redirect("/login?next=/admin/users");
    }

    if (me?.role !== "super_admin") {
        return (
            <div className="rounded-xl border border-(--line) bg-(--raised) px-6 py-14 text-center">
                <p className="label-mono text-signal">Restricted</p>
                <h2 className="mt-4 text-[1.375rem] font-semibold tracking-[-0.02em] text-(--text)">
                    User management is super admin only
                </h2>
                <p className="mx-auto mt-3 max-w-md text-[0.9375rem] leading-relaxed text-(--text-mute)">
                    Your account is signed in as {me?.role?.replace("_", " ") ?? "an admin"}. Ask a
                    super admin to make the change, or to promote your account.
                </p>
                <Link
                    href="/admin"
                    className="label-mono mt-7 inline-block rounded-lg border border-(--line) px-4 py-2.5 text-(--text-dim) transition-colors hover:border-(--text) hover:text-(--text)"
                >
                    Back to overview
                </Link>
            </div>
        );
    }

    // `currentUserId` drives the "You" marker and disables the self-destructive
    // controls. It is a UX affordance only — the same rules are enforced in
    // user.controller.js, which is what a curl hits.
    return <UsersManager currentUserId={String(me._id)} />;
}
