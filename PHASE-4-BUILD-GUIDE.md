# STR Solutions — Phase 4 Build Guide (`str-frontend`)

Admin dashboard, auth flow, and live data hydration. Give this file to the
VS Code AI assistant as context **before** it touches this repo. Companion
document: `str-backend/PHASE-4-API-GUIDE.md` — run that one first, the API
contract in §12 there is what everything below fetches.

---

## 0 · Decisions locked for this phase

1. **Auth transport: BFF proxy.** The browser never sees a JWT. Next Route
   Handlers call Express, then set their **own** httpOnly cookie on the frontend
   origin. `middleware.js` gates `/admin` at the edge; Express remains the real
   authority. Rationale in §3.
2. **Route groups.** `app/layout.js` currently hardcodes `<Navbar>` and
   `<Footer>` around every route. Public pages move into `app/(public)/`;
   `/admin` and `/login` get their own group layouts. Zero URL changes.
3. **Images are URL/path strings.** Every image field is a text input taking
   `/websites/paarel-website.png` or an absolute URL. No uploads this phase.
4. **`/admin` has zero animation.** No GSAP, no `transition-transform`, no
   entrance animation, no skeleton shimmer. `transition-colors` on interactive
   elements is permitted and is the only exception. State changes are instant.
5. **Pure JavaScript.** `.js` / `.jsx`. No TypeScript. App Router.
6. **No new dependencies.** Everything below is React 19 + Next 15 + Tailwind 4.

---

## 1 · File manifest

Written in dependency order. `M` = move, `E` = edit existing, `N` = new.

```
  E  app/layout.js                          strip Navbar/Footer → shell only
  N  app/(public)/layout.js                 Navbar + <main id="main"> + Footer
  M  app/(public)/page.js                   ← app/page.js
  M  app/(public)/about/page.js
  M  app/(public)/services/page.js
  M  app/(public)/services/[slug]/page.js
  M  app/(public)/projects/page.js
  M  app/(public)/projects/[slug]/page.js
  M  app/(public)/blogs/page.js
  M  app/(public)/blogs/[slug]/page.js
  M  app/(public)/contact/page.js
     app/not-found.js                       STAYS at app/ root — see §2

  N  middleware.js                          edge gate for /admin

  N  lib/session.js                         server-only cookie read/write
  N  lib/apiServer.js                       server→Express fetch (public + admin)
  N  lib/apiClient.js                       browser→/api/admin proxy fetch
  N  lib/api.js                             public data selectors (fetch + fallback)
  N  lib/adminNav.js                        sidebar config
  N  lib/adminSchema.js                     field descriptors for the CRUD forms

  N  app/api/auth/login/route.js
  N  app/api/auth/logout/route.js
  N  app/api/auth/me/route.js
  N  app/api/admin/[...path]/route.js       the BFF proxy — one file, all CRUD
  N  app/api/revalidate/route.js            cache busting after admin writes

  N  app/(auth)/layout.js
  N  app/(auth)/login/page.js
  N  components/auth/LoginForm.jsx          "use client"

  N  app/(admin)/layout.js                  guard + AdminShell
  N  app/(admin)/admin/page.js              overview
  N  app/(admin)/admin/projects/page.js
  N  app/(admin)/admin/projects/new/page.js
  N  app/(admin)/admin/projects/[id]/page.js
  N  app/(admin)/admin/services/page.js
  N  app/(admin)/admin/blogs/page.js
  N  app/(admin)/admin/blogs/new/page.js
  N  app/(admin)/admin/blogs/[id]/page.js
  N  app/(admin)/admin/testimonials/page.js
  N  app/(admin)/admin/team/page.js
  N  app/(admin)/admin/inquiries/page.js
  N  app/(admin)/admin/page-meta/page.js

  N  components/admin/AdminShell.jsx        "use client"  sidebar + topbar + slot
  N  components/admin/Sidebar.jsx           "use client"  active route only
  N  components/admin/Topbar.jsx            "use client"  profile + logout
  N  components/admin/DataTable.jsx         "use client"  generic table
  N  components/admin/Toolbar.jsx           "use client"  search + filters + new
  N  components/admin/Pagination.jsx        "use client"
  N  components/admin/ConfirmDialog.jsx     "use client"  <dialog>, no animation
  N  components/admin/Fields.jsx            "use client"  Input/Textarea/Select/Toggle/Number
  N  components/admin/TagInput.jsx          "use client"  string[] editor
  N  components/admin/MultiSelect.jsx       "use client"  serviceTypes[] checkboxes
  N  components/admin/RepeatableRows.jsx    "use client"  techStack[] + galleryImages[]
  N  components/admin/ResourceTable.jsx     "use client"  list-page composition
  N  components/admin/ResourceForm.jsx      "use client"  create/edit composition
  N  components/admin/StatCard.jsx
  N  components/admin/StatusPill.jsx
  N  components/admin/Toast.jsx             "use client"  aria-live region

  N  hooks/useResource.js                   "use client"  list state machine
  N  hooks/useToast.js                      "use client"

  E  components/contact/InquiryForm.jsx     replace the mock submit with POST
  E  .env.example / .env                    NEXT_PUBLIC_API_URL, API_URL, cookie name
```

---

## 2 · Route groups refactor

Do this **first**. Every later step assumes it.

`app/layout.js` — remove the public chrome, keep everything else byte-identical:

```diff
 import { JetBrains_Mono } from "next/font/google";
 import ThemeProvider from "@/components/theme-provider";
-import Navbar from "@/components/Navbar";
-import Footer from "@/components/Footer";
 import { site } from "@/lib/site";
 import "./globals.css";
@@
       <body className="min-h-dvh antialiased" suppressHydrationWarning>
         <ThemeProvider>
-          <a href="#main" className="sr-only focus:not-sr-only …">Skip to content</a>
-          <Navbar />
-          <main id="main">{children}</main>
-          <Footer />
+          {children}
         </ThemeProvider>
       </body>
```

New `app/(public)/layout.js` — the skip link, Navbar, `<main id="main">` and
Footer move here verbatim:

```jsx
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

/**
 * Public chrome. Lives in the (public) group so /admin and /login inherit the
 * root shell (fonts, theme, tokens) without the marketing header and footer —
 * and without the Navbar's client bundle, which is the actual win here.
 */
export default function PublicLayout({ children }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-100 focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>
      <Navbar />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
```

Then move the eight public route files. **Nothing inside them changes** — no
import paths shift, because `@/` is repo-root aliased in `jsconfig.json`.

```bash
mkdir -p "app/(public)"
git mv app/page.js      "app/(public)/page.js"
git mv app/about        "app/(public)/about"
git mv app/services     "app/(public)/services"
git mv app/projects     "app/(public)/projects"
git mv app/blogs        "app/(public)/blogs"
git mv app/contact      "app/(public)/contact"
```

> **`app/not-found.js` must NOT move.** The root `not-found.js` is what Next
> renders for unmatched URLs anywhere in the app, and a copy inside a route
> group only covers that group. Leaving it at `app/` means a 404 renders with
> the bare shell (no Navbar). If you want the public chrome on 404s, add a
> second `app/(public)/not-found.js` that re-exports the root one — but leave
> the root file in place either way.

Verify before continuing: `npm run dev`, then confirm `/`, `/projects`,
`/blogs/[any-slug]` still render with header and footer and no console warning
about duplicate routes.

---

## 3 · Auth architecture

```
browser                 Next.js (frontend origin)              Express (API origin)
───────                 ──────────────────────────             ─────────────────────
POST /api/auth/login ─► app/api/auth/login/route.js ─────────► POST /api/v1/auth/login
                        reads { token } from the JSON               ▲
                        Set-Cookie: str_admin (httpOnly)            │
◄─── 200 {ok:true} ───┘                                             │
                                                                    │
GET  /admin ──────────► middleware.js: cookie present? ─────────────┤ no  → /login
                        app/(admin)/layout.js: GET /auth/me ────────┘ 401 → /login

fetch("/api/admin/projects?…") ─► app/api/admin/[...path]/route.js
                                   Authorization: Bearer <cookie> ─► /api/v1/projects/…
```

Why this and not the Express cookie directly:

- `str_token` is set **without a `domain` option**, so it is host-only to the API
  origin. `middleware.js` runs on the frontend origin and cannot read it — edge
  protection would silently do nothing.
- The token never enters JavaScript, so the three rich-text
  `dangerouslySetInnerHTML` call sites on the public site — `blogs/[slug]`,
  `projects/[slug]`, `services/[slug]`; the fourth, in `contact/page.js`, is
  JSON-LD and not user-authored — cannot leak it even if sanitization regresses.
- Admin fetches are same-origin, so there is no CORS preflight on any mutation.
- The API origin can move (Render → Fly → private network) without touching a
  single component.

**Three layers of protection, deliberately redundant:**

| Layer | Cost | Catches |
|---|---|---|
| `middleware.js` cookie presence | ~0ms, edge | The 99% case; no `/admin` flash |
| `app/(admin)/layout.js` → `/auth/me` | 1 request per navigation | Expired, revoked, suspended |
| Express `protect` + `checkRole` | — | Everything. The only real gate. |

The middleware check is **presence only** — it does not verify the signature.
Verifying at the edge means shipping `jose` and the JWT secret into the edge
runtime for a check the API repeats anyway. Do not add it.

### 3.1 Environment

`.env.local` (and `.env.example`, committed):

```bash
# Server-side only. The BFF talks to this. Never exposed to the browser.
API_URL=http://localhost:5025/api/v1

# Exposed. Used ONLY by the public contact form, which posts directly.
NEXT_PUBLIC_API_URL=http://localhost:5025/api/v1

# Name of the cookie THIS app sets. Distinct from the backend's str_token
# on purpose — they are different cookies on different origins.
ADMIN_COOKIE_NAME=str_admin
```

> If `API_URL` is unset the BFF must throw at module load, not fall back to
> localhost. A silent localhost fallback in production is a 30-second outage
> that looks like a 3-hour one.

### 3.2 `lib/session.js`

```js
import "server-only";
import { cookies } from "next/headers";

export const COOKIE = process.env.ADMIN_COOKIE_NAME ?? "str_admin";

/** Seven days, matching JWT_EXPIRES_IN on the API. Keep the two in sync. */
export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

export function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    // "lax" is correct: the admin panel is never embedded cross-site, and
    // "strict" breaks the redirect back from /login?next=/admin/projects.
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  };
}

/** Next 15: cookies() is async. Returns the raw JWT or null. */
export async function getToken() {
  const store = await cookies();
  return store.get(COOKIE)?.value ?? null;
}

export async function setToken(token) {
  const store = await cookies();
  store.set(COOKIE, token, cookieOptions());
}

export async function clearToken() {
  const store = await cookies();
  // Flags must match cookieOptions() or the browser keeps the cookie.
  store.set(COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}
```

### 3.3 `lib/apiServer.js`

```js
import "server-only";
import { getToken } from "./session";

const BASE = process.env.API_URL;
if (!BASE) {
  throw new Error("[apiServer] API_URL is not set. Refusing to start with a guessed base URL.");
}

/**
 * Server-side fetch against Express.
 *
 * `auth: true` attaches the admin JWT from this app's cookie. Admin calls must
 * also stay uncached — `cache: "no-store"` — or Next will serve one admin's
 * response to the next request.
 */
export async function apiFetch(path, { method = "GET", body, auth = false, revalidate, tags, headers = {} } = {}) {
  const init = {
    method,
    headers: { Accept: "application/json", ...headers },
  };

  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = typeof body === "string" ? body : JSON.stringify(body);
  }

  if (auth) {
    const token = await getToken();
    if (token) init.headers.Authorization = `Bearer ${token}`;
    init.cache = "no-store";
  } else {
    init.next = { revalidate: revalidate ?? 300, tags: tags ?? [] };
  }

  const res = await fetch(`${BASE}${path}`, init);
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = new Error(payload.message || `${res.status} ${path}`);
    err.status = res.status;
    err.details = payload.details;
    throw err;
  }
  return payload;
}
```

### 3.4 `app/api/auth/login/route.js`

```js
import { NextResponse } from "next/server";
import { setToken } from "@/lib/session";

const BASE = process.env.API_URL;

/**
 * POST /api/auth/login — BFF login.
 *
 * Forwards credentials to Express, keeps the JWT server-side in an httpOnly
 * cookie on THIS origin, and returns only a boolean plus the safe user object.
 * The token itself never reaches the browser.
 */
export async function POST(request) {
  let credentials;
  try {
    credentials = await request.json();
  } catch {
    return NextResponse.json({ success: false, message: "Malformed request" }, { status: 400 });
  }

  const { email, password } = credentials ?? {};
  if (!email || !password) {
    return NextResponse.json({ success: false, message: "Email and password are required" }, { status: 400 });
  }

  let upstream;
  try {
    upstream = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Preserve the real client IP so the API's per-identity rate limiter
        // is not keyed on this server's address. See PHASE-4-API-GUIDE §7.
        "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
      },
      body: JSON.stringify({ email, password }),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json({ success: false, message: "Cannot reach the API server" }, { status: 502 });
  }

  const payload = await upstream.json().catch(() => ({}));

  if (!upstream.ok || !payload.token) {
    // Pass the upstream status through so 401 (bad credentials), 403
    // (suspended) and 429 (rate limited) each render their own message.
    return NextResponse.json(
      { success: false, message: payload.message ?? "Login failed" },
      { status: upstream.status || 401 }
    );
  }

  await setToken(payload.token);
  return NextResponse.json({ success: true, data: payload.data });
}
```

### 3.5 `app/api/auth/logout/route.js`

```js
import { NextResponse } from "next/server";
import { getToken, clearToken } from "@/lib/session";

const BASE = process.env.API_URL;

export async function POST() {
  const token = await getToken();

  // Best-effort upstream logout. Our cookie is cleared regardless — a failed
  // API call must never leave the user apparently signed in.
  if (token) {
    await fetch(`${BASE}/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }).catch(() => {});
  }

  await clearToken();
  return NextResponse.json({ success: true });
}
```

### 3.6 `app/api/auth/me/route.js`

```js
import { NextResponse } from "next/server";
import { apiFetch } from "@/lib/apiServer";

export async function GET() {
  try {
    const { data } = await apiFetch("/auth/me", { auth: true });
    return NextResponse.json({ success: true, data });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: err.status ?? 401 });
  }
}
```

### 3.7 `app/api/admin/[...path]/route.js` — the proxy

One file serves every admin CRUD call. This is the piece that makes the whole
dashboard possible without a token in the browser.

```js
import { NextResponse } from "next/server";
import { getToken } from "@/lib/session";

const BASE = process.env.API_URL;

/**
 * Catch-all admin proxy.
 *
 *   fetch("/api/admin/projects?page=2")        → GET    ${API_URL}/projects?page=2
 *   fetch("/api/admin/projects/64ab…", {PATCH})→ PATCH  ${API_URL}/projects/64ab…
 *
 * Responsibilities, and nothing else:
 *   1. attach the JWT from the httpOnly cookie
 *   2. forward method, query string and body untouched
 *   3. pass the upstream status through so the client can branch on 401/403/409
 *
 * It does NOT reshape payloads. Business rules live in Express; duplicating any
 * of them here creates two sources of truth that will disagree.
 */

// Only these top-level resources are reachable through the proxy. Without this
// the route is an open relay to every path on the API host.
const ALLOWED = new Set([
  "projects", "services", "blogs", "testimonials",
  "team", "inquiries", "page-meta", "stats", "users",
]);

async function proxy(request, ctx) {
  // Next 15: params is a Promise.
  const { path = [] } = await ctx.params;

  if (path.length === 0 || !ALLOWED.has(path[0])) {
    return NextResponse.json({ success: false, message: "Unknown resource" }, { status: 404 });
  }

  const token = await getToken();
  if (!token) {
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const search = new URL(request.url).search;
  const target = `${BASE}/${path.map(encodeURIComponent).join("/")}${search}`;

  const init = {
    method: request.method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "x-forwarded-for": request.headers.get("x-forwarded-for") ?? "",
    },
    cache: "no-store",
  };

  if (!["GET", "HEAD", "DELETE"].includes(request.method)) {
    init.headers["Content-Type"] = "application/json";
    init.body = await request.text();
  }

  let upstream;
  try {
    upstream = await fetch(target, init);
  } catch {
    return NextResponse.json({ success: false, message: "API server unreachable" }, { status: 502 });
  }

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") ?? "application/json",
      // Never let a CDN or the browser cache an authenticated response.
      "Cache-Control": "no-store, max-age=0",
    },
  });
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
```

> `encodeURIComponent` on each segment is what stops `/api/admin/projects/../../users`
> from walking out of the resource. Do not remove it, and do not join the raw
> `path` array with a template literal.

### 3.8 `middleware.js` (repo root, next to `package.json`)

```js
import { NextResponse } from "next/server";

const COOKIE = process.env.ADMIN_COOKIE_NAME ?? "str_admin";

/**
 * Edge gate for /admin.
 *
 * Presence check only — the signature is verified by Express on every single
 * request behind the proxy. Verifying here would mean shipping `jose` and the
 * JWT secret into the edge runtime to duplicate a check that already happens.
 *
 * Its actual job is UX: no flash of the dashboard before a client-side
 * redirect, and a `next` param so the user lands where they were headed.
 */
export function middleware(request) {
  const { pathname, search } = request.nextUrl;
  const hasToken = Boolean(request.cookies.get(COOKIE)?.value);

  if (pathname.startsWith("/admin") && !hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  // Already signed in? /login is pointless.
  if (pathname === "/login" && hasToken) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
```

---

## 4 · Login route

`app/(auth)/layout.js`:

```jsx
/** Bare centred shell. No Navbar, no Footer — this page has one job. */
export default function AuthLayout({ children }) {
  return <div className="flex min-h-dvh items-center justify-center bg-(--canvas) px-6 py-16">{children}</div>;
}
```

`app/(auth)/login/page.js`:

```jsx
import LoginForm from "@/components/auth/LoginForm";
import Logo from "@/components/ui/Logo";
import { site } from "@/lib/site";

export const metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-104">
      <Logo />
      <p className="label-mono mt-10 text-(--text-mute)">Administration</p>
      <h1 className="mt-4 text-[2rem] font-semibold tracking-[-0.03em] text-(--text)">
        Sign in to {site.shortName}.
      </h1>
      <p className="mt-3 text-[0.9375rem] leading-relaxed text-(--text-mute)">
        Content management for {site.url.replace("https://", "")}. Access is issued by a
        super admin — there is no self-registration.
      </p>

      <div className="mt-10 border-t border-(--line) pt-10">
        <LoginForm />
      </div>
    </div>
  );
}
```

`components/auth/LoginForm.jsx`:

```jsx
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
        <label htmlFor="email" className={LABEL}>Email</label>
        <input
          id="email" name="email" type="email" autoComplete="username"
          autoFocus required className={cn(FIELD, "mt-3")} placeholder="you@strsltd.com"
        />
      </div>

      <div>
        <label htmlFor="password" className={LABEL}>Password</label>
        <input
          id="password" name="password" type="password" autoComplete="current-password"
          required className={cn(FIELD, "mt-3")} placeholder="••••••••"
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
```

> `useSearchParams` forces this subtree to be client-rendered, which is why it
> lives in its own component and the page above it stays a server component.
> Wrap `<LoginForm />` in `<Suspense fallback={null}>` if `next build` reports a
> CSR-bailout warning for `/login`.

---

## 5 · Admin shell

### 5.1 `app/(admin)/layout.js` — the server guard

```jsx
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
    redirect("/login?next=/admin");
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
```

> `redirect()` throws a `NEXT_REDIRECT` control-flow error. Call it **outside**
> the `try` block, or the catch swallows it and the page renders unguarded. In
> the code above it is inside `catch`, which is the one safe position —
> never wrap a `redirect()` in its own `try`.

### 5.2 `lib/adminNav.js`

```js
/**
 * Sidebar model. `exact` is required on the overview entry, otherwise every
 * /admin/* route marks it active.
 */
export const ADMIN_NAV = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/projects", label: "Projects" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/blogs", label: "Blogs" },
  { href: "/admin/testimonials", label: "Testimonials" },
  { href: "/admin/team", label: "Team" },
  { href: "/admin/inquiries", label: "Inquiries" },
  { href: "/admin/page-meta", label: "Page Meta" },
];
```

### 5.3 `components/admin/AdminShell.jsx`

```jsx
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
```

### 5.4 `components/admin/Sidebar.jsx`

```jsx
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
        <Link href="/" target="_blank" rel="noreferrer" className="label-mono text-(--text-mute) hover:text-signal">
          View site ↗
        </Link>
      </div>
    </nav>
  );
}
```

### 5.5 `components/admin/Topbar.jsx`

```jsx
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
          <p className="text-[0.8125rem] font-medium leading-tight text-(--text)">{user?.name}</p>
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
```

---

## 6 · Data layer for admin pages

### 6.1 `lib/apiClient.js`

```js
"use client";

/**
 * Browser → same-origin BFF. There is no base URL, no token, and no CORS here
 * by design; `/api/admin/*` resolves the first two and eliminates the third.
 */
async function request(path, { method = "GET", body, params } = {}) {
  const qs = params ? `?${new URLSearchParams(clean(params))}` : "";
  const init = { method, headers: { Accept: "application/json" } };

  if (body !== undefined) {
    init.headers["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  const res = await fetch(`/api/admin/${path}${qs}`, init);
  const payload = await res.json().catch(() => ({}));

  if (!res.ok) {
    // 401 means the cookie expired mid-session. Bounce to /login rather than
    // letting every table on the page render its own "Unauthorized" error.
    if (res.status === 401 && typeof window !== "undefined") {
      window.location.href = `/login?next=${encodeURIComponent(window.location.pathname)}`;
    }
    const err = new Error(payload.message || `Request failed (${res.status})`);
    err.status = res.status;
    err.details = payload.details;
    throw err;
  }
  return payload;
}

/** Drops empty values so the URL never carries `?search=&status=`. */
function clean(params) {
  return Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== "" && v !== null && v !== undefined)
  );
}

export const api = {
  list: (resource, params) => request(resource, { params }),
  get: (resource, id) => request(`${resource}/${id}`),
  create: (resource, body) => request(resource, { method: "POST", body }),
  update: (resource, id, body) => request(`${resource}/${id}`, { method: "PATCH", body }),
  put: (resource, id, body) => request(`${resource}/${id}`, { method: "PUT", body }),
  remove: (resource, id) => request(`${resource}/${id}`, { method: "DELETE" }),
};

/** Fire-and-forget cache bust after a mutation. Never blocks the UI. */
export function revalidate(tag) {
  fetch("/api/revalidate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  }).catch(() => {});
}
```

### 6.2 `hooks/useResource.js`

```js
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/apiClient";

/**
 * List-page state machine: query params → fetch → { rows, meta, status }.
 *
 * Two things worth knowing:
 *  · Every fetch carries an AbortController. Typing in the search box fires a
 *    request per debounce tick, and without this a slow early response can
 *    overwrite a fast later one — the classic out-of-order render.
 *  · `params` is stringified into the dependency list. Passing an object
 *    literal from the caller would otherwise re-fetch on every render.
 */
export function useResource(resource, params = {}, { immediate = true } = {}) {
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [status, setStatus] = useState(immediate ? "loading" : "idle");
  const [error, setError] = useState(null);
  const abortRef = useRef(null);
  const key = JSON.stringify(params);

  const load = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus("loading");
    try {
      const payload = await api.list(resource, JSON.parse(key));
      if (controller.signal.aborted) return;
      setRows(payload.data ?? []);
      setMeta(payload.meta ?? null);
      setStatus("ready");
      setError(null);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err);
      setStatus("error");
    }
  }, [resource, key]);

  useEffect(() => {
    if (!immediate) return;
    load();
    return () => abortRef.current?.abort();
  }, [load, immediate]);

  return { rows, meta, status, error, reload: load, setRows };
}

/** Debounces a value. 300ms is the point where search feels instant but the
 *  network is not doing one request per keystroke. */
export function useDebounced(value, delay = 300) {
  const [out, setOut] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setOut(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return out;
}
```

### 6.3 `app/api/revalidate/route.js`

```js
import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getToken } from "@/lib/session";

const TAGS = new Set(["projects", "services", "blogs", "testimonials", "team", "page-meta"]);

/**
 * POST /api/revalidate { tag } — busts the ISR cache for the public pages after
 * an admin write, so an edit is live immediately instead of after `revalidate`
 * seconds. Auth-gated: an unauthenticated caller could otherwise force a
 * regeneration storm.
 */
export async function POST(request) {
  if (!(await getToken())) {
    return NextResponse.json({ success: false }, { status: 401 });
  }
  const { tag } = await request.json().catch(() => ({}));
  if (!TAGS.has(tag)) {
    return NextResponse.json({ success: false, message: "Unknown tag" }, { status: 400 });
  }
  revalidateTag(tag);
  return NextResponse.json({ success: true, tag });
}
```

---

## 7 · Shared admin primitives

Build these before any page. Every page below assumes them, and their absence is
what turns a CRUD panel into eight thousand lines of copy-paste.

**Design constraints for all of them:** square corners, hairline `--line`
borders, `label-mono` for every label and column header, semantic tokens only —
never a hex or a Tailwind palette colour. `transition-colors` is the only
transition permitted anywhere in `/admin`.

### 7.1 `components/admin/Fields.jsx`

Export `Field`, `Input`, `Textarea`, `Select`, `Toggle`, `NumberInput`. One
shared shell handles the label / error / hint so no page repeats it:

```jsx
"use client";

import { cn } from "@/lib/utils";

export const CONTROL =
  "w-full border border-(--line) bg-transparent px-3.5 py-2.5 text-[0.9375rem] text-(--text) placeholder:text-(--text-mute) transition-colors focus:border-signal focus:outline-none disabled:opacity-50";

export function Field({ label, htmlFor, error, hint, required, children, className }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="label-mono block text-(--text-mute)">
        {label} {required && <span className="text-signal">*</span>}
      </label>
      <div className="mt-2">{children}</div>
      {hint && !error && <p className="mt-2 text-[0.8125rem] text-(--text-mute)">{hint}</p>}
      {error && (
        <p id={`err-${htmlFor}`} role="alert" className="label-mono mt-2 text-signal">
          {error}
        </p>
      )}
    </div>
  );
}

export function Input({ error, className, ...props }) {
  return (
    <input
      {...props}
      aria-invalid={Boolean(error) || undefined}
      aria-describedby={error ? `err-${props.id}` : undefined}
      className={cn(CONTROL, error && "border-signal", className)}
    />
  );
}
// Textarea, Select, NumberInput: identical wrappers over the same CONTROL class.

/** Square checkbox, not a rounded switch — see the forbidden list in Phase 3 §3. */
export function Toggle({ id, checked, onChange, label }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3">
      <input
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
        className="size-4 shrink-0 accent-brand"
      />
      <span className="text-[0.9375rem] text-(--text)">{label}</span>
    </label>
  );
}
```

### 7.2 `components/admin/TagInput.jsx`

`value: string[]`, `onChange(next)`. Enter or comma commits; Backspace on an
empty input removes the last chip; duplicates are rejected silently. Used for
`Project.tags`, `Project.deliverables`, `Service.featuresList`,
`Blog.tags`, `PageMeta.keywords`.

### 7.3 `components/admin/MultiSelect.jsx`

Checkbox grid over `SERVICE_TYPES` from `@/lib/taxonomy`, rendering
`SERVICE_LABELS[slug]`. Enforces the backend's 1–4 rule client-side as a
**hint**, never as the authority — the API validator stays the source of truth.

> Import from `@/lib/taxonomy`, **never** from `@/lib/data`. This is a client
> component, and one named import from `lib/data.js` ships every case-study body
> and every blog post into the admin bundle. Phase 3 §2 covers why.

### 7.4 `components/admin/RepeatableRows.jsx`

Generic array-of-objects editor. Props: `value`, `onChange`, `columns`
(`[{ key, label, type, options }]`), `newRow`, `max`. Renders a row per item with
add / remove / move-up / move-down. Two call sites:

| Field | Columns |
|---|---|
| `Project.techStack` | `name` (text, required) · `icon` (text) · `category` (select: frontend, backend, devops, design, data) |
| `Project.galleryImages` | `url` (text, required) · `caption` (text) · `layoutType` (select: full, half, grid) |

Keys must be stable across reorders — use a `useRef` counter to stamp a
client-side `_key` on each row rather than the array index, or removing row 2
visually clears row 3's input.

### 7.5 `components/admin/DataTable.jsx`

```jsx
"use client";
```

Props: `columns` (`[{ key, header, width, render?, className? }]`), `rows`,
`rowKey`, `status`, `error`, `empty`, `actions(row)`.

- `<table>` inside `overflow-x-auto` — the page body never scrolls sideways.
- Header row: `label-mono`, `border-b border-(--line)`.
- Body rows: `border-b border-(--line-soft)`, `hover:bg-(--raised-2)`.
- Loading: render the last known rows at `opacity-60` with
  `aria-busy="true"` on the table. **No skeleton shimmer** — that is animation.
- Empty: a single full-width cell with the `empty` message and the primary
  action, not a bare "No data".
- Error: the message plus a Retry button that calls `reload()`.

### 7.6 `components/admin/ConfirmDialog.jsx`

Native `<dialog>` + `showModal()`. Gives focus trapping, Escape-to-close and
inertness for free — a hand-rolled div modal gets all three wrong. Destructive
confirm is `text-signal`; the safe action holds initial focus.

### 7.7 `components/admin/StatusPill.jsx`

Square, hairline, `label-mono`. Map:

| Value | Class |
|---|---|
| `new` | `border-signal/40 text-signal` |
| `contacted` | `border-brand/40 text-brand` |
| `closed` | `border-(--line) text-(--text-mute)` |
| published / active / featured | `border-leaf/40 text-leaf` |
| draft / inactive | `border-(--line) text-(--text-mute)` |

### 7.8 `hooks/useToast.js` + `components/admin/Toast.jsx`

Context provider with `toast.success(msg)` / `toast.error(msg)`. Renders a
fixed bottom-right stack inside `role="status" aria-live="polite"`. Appears and
disappears instantly; auto-dismiss after 4s. No slide-in.

---

## 8 · Admin pages

### 8.1 `/admin` — Overview

Server component. One `apiFetch("/stats/overview", { auth: true })`, no client
JS beyond the shell.

```jsx
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
    { label: "Projects", value: data.projects.total, hint: `${data.projects.featured} featured`, href: "/admin/projects" },
    { label: "Unread inquiries", value: data.inquiries.new, hint: `${data.inquiries.total} total`, href: "/admin/inquiries?status=new", accent: data.inquiries.new > 0 },
    { label: "Published articles", value: data.blogs.published, hint: `${data.blogs.drafts} drafts`, href: "/admin/blogs" },
    { label: "Active services", value: data.services.active, hint: `${data.team.active} team members`, href: "/admin/services" },
  ];

  return (
    <div className="space-y-10">
      {/* 1px-gap grid over --line: the gap IS the hairline. Phase 3 §3. */}
      <div className="grid gap-px bg-(--line) sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => <StatCard key={c.label} {...c} />)}
      </div>

      <section className="border border-(--line)">
        <header className="flex items-center justify-between border-b border-(--line) px-5 py-4">
          <h2 className="label-mono text-(--text)">Recent leads</h2>
          <Link href="/admin/inquiries" className="label-mono text-(--text-mute) hover:text-signal">
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
              <li key={lead._id} className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-(--line-soft) px-5 py-4 last:border-0">
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
                <span className="label-mono w-8 text-right text-(--text-mute)">{row.count}</span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
```

Add `app/(admin)/admin/error.js` (a client error boundary) so a 502 from the
stats endpoint renders a retry instead of the Next error overlay.

### 8.2 `/admin/projects` — the canonical list page

This page is the pattern; services, blogs, testimonials and team are the same
shape with different columns. Build it fully, then copy it.

```jsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useResource, useDebounced } from "@/hooks/useResource";
import { api, revalidate } from "@/lib/apiClient";
import { useToast } from "@/hooks/useToast";
import DataTable from "@/components/admin/DataTable";
import Toolbar from "@/components/admin/Toolbar";
import Pagination from "@/components/admin/Pagination";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import StatusPill from "@/components/admin/StatusPill";
import { SERVICE_TYPES, SERVICE_LABELS } from "@/lib/taxonomy";
import { formatDate } from "@/lib/utils";

export default function ProjectsAdminPage() {
  const [search, setSearch] = useState("");
  const [service, setService] = useState("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState(null);
  const toast = useToast();

  const debounced = useDebounced(search);

  const { rows, meta, status, error, reload } = useResource("projects/admin/all", {
    search: debounced,
    serviceTypes: service,
    page,
    limit: 20,
  });

  async function confirmDelete() {
    const target = pendingDelete;
    setPendingDelete(null);
    try {
      await api.remove("projects", target._id);
      toast.success(`Deleted "${target.title}".`);
      revalidate("projects");
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const columns = [
    {
      key: "title",
      header: "Project",
      render: (row) => (
        <div className="min-w-0">
          <Link href={`/admin/projects/${row._id}`} className="font-medium text-(--text) hover:text-signal">
            {row.title}
          </Link>
          <p className="label-mono truncate text-(--text-mute)">/{row.slug}</p>
        </div>
      ),
    },
    {
      key: "serviceTypes",
      header: "Services",
      render: (row) => (
        <div className="flex flex-wrap gap-1.5">
          {(row.serviceTypes ?? []).map((s) => (
            <span key={s} className="label-mono border border-(--line) px-2 py-1 text-(--text-dim)">
              {SERVICE_LABELS[s] ?? s}
            </span>
          ))}
        </div>
      ),
    },
    { key: "clientName", header: "Client", render: (row) => row.clientName || "—" },
    { key: "featured", header: "Status", render: (row) => <StatusPill value={row.featured ? "featured" : "draft"} /> },
    { key: "displayOrder", header: "Order", className: "text-right nums" },
    { key: "updatedAt", header: "Updated", render: (row) => formatDate(row.updatedAt) },
  ];

  return (
    <div className="space-y-6">
      <Toolbar
        search={search}
        onSearch={(v) => { setSearch(v); setPage(1); }}
        placeholder="Search title, client, slug…"
        filters={[
          {
            label: "Service",
            value: service,
            onChange: (v) => { setService(v); setPage(1); },
            options: [
              { value: "", label: "All services" },
              ...SERVICE_TYPES.map((s) => ({ value: s, label: SERVICE_LABELS[s] })),
            ],
          },
        ]}
        action={{ href: "/admin/projects/new", label: "New project" }}
      />

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r._id}
        status={status}
        error={error}
        onRetry={reload}
        empty="No projects match this filter."
        actions={(row) => (
          <div className="flex justify-end gap-3">
            <Link href={`/admin/projects/${row._id}`} className="label-mono text-(--text-mute) hover:text-(--text)">
              Edit
            </Link>
            <button
              type="button"
              onClick={() => setPendingDelete(row)}
              className="label-mono text-(--text-mute) transition-colors hover:text-signal"
            >
              Delete
            </button>
          </div>
        )}
      />

      <Pagination meta={meta} onPage={setPage} />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this project?"
        body={pendingDelete ? `"${pendingDelete.title}" and its case study will be removed permanently. This cannot be undone.` : ""}
        confirmLabel="Delete permanently"
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
```

> **Full-page form, not a modal.** The project form has ~25 fields including two
> repeatable groups. A modal that scrolls internally is unusable on a laptop and
> loses everything on an accidental backdrop click. Modals in this panel are for
> confirmations only.

### 8.3 `/admin/projects/new` and `/admin/projects/[id]`

Both render the same `<ProjectForm mode="create" | "edit" initial={…} />`.
The `[id]` page is a client component that loads via
`api.get("projects/admin/id", id)` — remember the API exposes the by-`_id`
lookup at `/projects/admin/id/:id`, because `/projects/:slug` is the public
slug route.

Field groups, in this order:

| Group | Fields |
|---|---|
| **Identity** | `title` (required) · `subtitle` · `clientName` · `projectDate` (date) · `shortDescription` (textarea, 400 max, live counter) |
| **Classification** | `serviceTypes` (MultiSelect, 1–4, required) · `tags` (TagInput) · `deliverables` (TagInput) |
| **Case study** | `fullCaseStudy` (monospace textarea, min 20 rows) — hint: *HTML is sanitized server-side on save; `<script>`, `<style>`, inline handlers and `style` attributes are stripped* |
| **Tech stack** | `techStack` (RepeatableRows) |
| **Links** | `liveUrl` · `githubUrl` · `figmaUrl` · `appStoreUrl` · `playStoreUrl` — all must be absolute (`https://…`) or empty; the API rejects bare domains |
| **Media** | `coverImage` · `thumbnailImage` (text; hint: *a path under `/public` such as `/websites/paarel-website.png`, or an absolute URL*) · `galleryImages` (RepeatableRows) |
| **Presentation (Phase 5)** | `accentColor` (`<input type="color">` + hex text input, kept in sync) · `layoutStyle` (select) · `animationTrigger` (select) · `featured` (Toggle) · `displayOrder` (number) — section note: *consumed by the GSAP engine in Phase 5; stored and returned but unused today* |
| **SEO** | `metaTitle` · `metaDescription` · `ogImage` |

Submit behaviour:

```js
const payload = { ...values };
// Never send an empty string where the API expects an absolute URL — the
// isURL validator rejects "" unless the field is omitted. Strip blanks.
for (const k of ["liveUrl", "githubUrl", "figmaUrl", "appStoreUrl", "playStoreUrl"]) {
  if (!payload[k]) delete payload[k];
}
// slug is derived server-side from title; sending it is stripped by the
// immutable guard, so do not put it in the form at all.
delete payload.slug;

const res = mode === "create"
  ? await api.create("projects", payload)
  : await api.update("projects", id, payload);

revalidate("projects");
toast.success(mode === "create" ? "Project created." : "Saved.");
router.push("/admin/projects");
```

Error rendering: the API returns `{ message, details: [{ field, message }] }`
on a 400. Map `details` onto the field state so each error lands under its own
input; show `message` at the top of the form as the summary. Do not render the
raw JSON.

Also: a `beforeunload` guard when the form is dirty, and **never disable the
submit button on invalid** — disable on submitting only (Phase 3 §, and the
same rule `InquiryForm` already follows).

### 8.4 `/admin/services`

Full CRUD, but the list is short (7 rows) and the form is small — use an inline
expanding row editor rather than separate routes.

- Columns: drag-free order control (`order` number input, saved on blur) ·
  `title` · `slug` · `deliverableTimeline` · `isActive` toggle · actions.
- Form fields: `title` · `shortDescription` · `detailedOverview` (HTML
  textarea, sanitized server-side) · `icon` (text — a lucide key like `code`,
  **not** a file path; `SERVICE_MEDIA` in `lib/taxonomy.js` holds the artwork
  and is presentation-only) · `featuresList` (TagInput) ·
  `deliverableTimeline` · `order` · `isActive`.
- Toggling `isActive` writes immediately via `api.update` with optimistic local
  state, rolled back on error.

### 8.5 `/admin/blogs`

- List reads `blogs/admin/all` (includes drafts). Filters: `isPublished`
  (All / Published / Drafts), `category`, search.
- Columns: `title` + slug · `category` · author name · `viewCount` (right
  aligned, `.nums`) · publish StatusPill · `publishedAt`.
- Publish toggle writes `{ isPublished }` directly from the row; the API's
  `pre("findOneAndUpdate")` hook manages `publishedAt`. **Never send
  `publishedAt` from the form** — it would fight the hook.
- Form (`/admin/blogs/new`, `/admin/blogs/[id]`): `title` · `excerpt` (400 max,
  counter) · `content` (large monospace textarea) · `coverImage` · `category` ·
  `tags` · `isPublished` · `metaTitle` · `metaDescription`.
- `author` is **not** a form field. The API sets it from the authenticated user
  on create and refuses it on update.

### 8.6 `/admin/testimonials`

Card grid rather than a table — five short text fields read better as cards.
Fields: `clientName` · `clientDesignation` · `companyName` · `clientAvatar` ·
`rating` (1–5 select) · `reviewText` (textarea) · `projectRef` (select
populated from `api.list("projects/admin/all", { limit: 100, fields: "title" })`,
with an explicit "No linked project" option that sends `null`) · `isFeatured`.

### 8.7 `/admin/team`

Table with `displayOrder` inline number input, avatar preview via
`next/image` (`unoptimized` when the value is an external URL not in
`next.config.mjs` `remotePatterns` — otherwise the image throws at render).
Fields: `name` · `designation` · `bio` · `image` · `socialLinks.linkedin` ·
`socialLinks.github` · `socialLinks.twitter` · `displayOrder` · `isActive`.

Nested `socialLinks` must be submitted as a nested object, not as
`"socialLinks.linkedin"` — the API's `sanitize` middleware **deletes any key
containing a dot** as NoSQL-injection defence, so a flattened key is silently
dropped and the field appears not to save.

### 8.8 `/admin/inquiries` — read-only lead board

- Read-only by contract: the API only accepts `status` and `notes` on PATCH.
  The table must not render an editable field for anything else.
- Filters: `status` (All / New / Contacted / Closed) · `serviceInterested` ·
  search across name, email, message.
- Status control: three segmented buttons per row writing
  `api.update("inquiries", id, { status })`, optimistic with rollback.
- Row expands in place to show the full `message`, `phone`, `budgetRange`, and
  an internal `notes` textarea saved on blur (debounced 800ms).
- `mailto:` reply link built from `senderEmail` with the subject prefilled.
- Deep link: `/admin/inquiries?status=new` must apply that filter on mount, so
  the overview card links straight into the filtered view.

### 8.9 `/admin/page-meta`

Six identifiers (`home`, `about`, `services`, `projects`, `blogs`, `contact`)
after the enum change in the backend guide §10.

- Load all rows once: `api.list("page-meta")`.
- Left rail of page identifiers, right pane the editor for the selected one.
- Fields: `metaTitle` · `metaDescription` (with a live character counter and a
  soft warning past 160) · `keywords` (TagInput) · `ogImage` ·
  `dynamicHeroHeadline` · `dynamicHeroSubtitle`.
- Saves with **`PUT`** — `api.put("page-meta", identifier, values)` — because the
  endpoint is an upsert keyed on the identifier, not a patch on an `_id`. A page
  that has never been saved simply has no row yet; render empty fields, not an
  error.
- Under the meta title/description, render a live SERP preview using the same
  `--text` / `--text-mute` tokens. Static, no animation.

---

## 9 · Public page hydration

Replace the bodies of the `lib/data.js` selectors with fetches. **The signatures
do not change**, so no component is touched — that was the whole point of the
Phase 3 contract.

### 9.1 `lib/api.js`

```js
import "server-only";
import { apiFetch } from "./apiServer";
import * as fallback from "./data";

/**
 * Public data layer. Same selector names and signatures as lib/data.js — see
 * PHASE-3-BUILD-GUIDE §5 — so the swap is invisible to every component.
 *
 * Fallback policy: if the API is unreachable, serve the Phase 3 static content
 * rather than a 500. An agency marketing site that shows slightly stale copy
 * during an API outage is strictly better than one that shows nothing, and the
 * build must not fail because the backend is not running on a CI box.
 *
 * The fallback is NOT a cache and must never be used to paper over a 404 — a
 * missing slug has to stay a 404 or the sitemap starts lying.
 */
async function safe(fetcher, fallbackValue, label) {
  try {
    return await fetcher();
  } catch (err) {
    if (err.status === 404) throw err;
    console.warn(`[api] ${label} fell back to static content: ${err.message}`);
    return fallbackValue;
  }
}

export const getServices = () =>
  safe(
    async () => (await apiFetch("/services?isActive=true&sort=order&limit=50", { tags: ["services"] })).data,
    fallback.getServices(),
    "getServices"
  );

export const getServiceBySlug = async (slug) => {
  try {
    return (await apiFetch(`/services/${slug}`, { tags: ["services"] })).data;
  } catch (err) {
    if (err.status === 404) return null;
    return fallback.getServiceBySlug(slug);
  }
};

export const getProjects = ({ service, tag, limit } = {}) =>
  safe(
    async () => {
      const qs = new URLSearchParams();
      if (service) qs.set("serviceTypes", service);
      if (tag) qs.set("tags", tag);
      qs.set("limit", String(limit ?? 50));
      return (await apiFetch(`/projects?${qs}`, { tags: ["projects"] })).data;
    },
    fallback.getProjects({ service, tag, limit }),
    "getProjects"
  );

// getFeaturedProjects, getProjectBySlug, getProjectNeighbours, getProjectTags,
// getBlogs, getBlogBySlug, getBlogCategories, getRelatedBlogs, getTeam,
// getTestimonials — same shape. Keep every signature byte-identical to
// lib/data.js; that file stays in the repo as the fallback source.
```

> `getProjectNeighbours` and `getRelatedBlogs` are **derived**, not endpoints.
> Implement them on top of `getProjects()` / `getBlogs()` exactly as
> `lib/data.js` does. Do not add API routes for them — the list is already
> cached and a second round trip buys nothing.

### 9.2 Switching the pages over

One line per route file:

```diff
-import { getProjects, SERVICE_TYPES } from "@/lib/data";
+import { getProjects } from "@/lib/api";
+import { SERVICE_TYPES } from "@/lib/taxonomy";
```

…and the component becomes `async`:

```diff
-export default function ProjectsPage() {
-  const projects = getProjects();
+export default async function ProjectsPage() {
+  const projects = await getProjects();
```

Taxonomy constants keep coming from `@/lib/taxonomy` (they are enums, not
content) — do **not** route them through the API.

`generateStaticParams` in `services/[slug]`, `projects/[slug]` and
`blogs/[slug]` must also switch to the API, and must tolerate an unreachable
backend at build time:

```js
export async function generateStaticParams() {
  const projects = await getProjects({ limit: 200 });
  return projects.map((p) => ({ slug: p.slug }));
}
```

Add `export const dynamicParams = true;` to each so a project published after
the build renders on demand instead of 404ing until the next deploy.

### 9.3 `InquiryForm` — the real POST

`components/contact/InquiryForm.jsx`, replacing the marked Phase 4 block:

```diff
     setState("submitting");
-    // PHASE 4 — replace this block with the real POST:
-    //   const res = await fetch(...)
-    await new Promise((r) => setTimeout(r, 700));
-    setState("sent");
-    e.target.reset();
+    // Posts browser → Express directly. This endpoint is public and rate
+    // limited per IP; routing it through the BFF would collapse every
+    // visitor onto one rate-limit bucket. Not the same case as /admin.
+    delete data.company; // honeypot, never sent
+    try {
+      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/inquiries`, {
+        method: "POST",
+        headers: { "Content-Type": "application/json" },
+        body: JSON.stringify(data),
+      });
+      if (!res.ok) {
+        const payload = await res.json().catch(() => ({}));
+        if (res.status === 429) {
+          setErrors({ form: "Too many submissions from this connection. Try again shortly." });
+        } else if (res.status === 400 && Array.isArray(payload.details)) {
+          // Server rules win. Map them onto the same error state the client
+          // validator uses so the two never render differently.
+          setErrors(Object.fromEntries(payload.details.map((d) => [d.field, d.message])));
+        }
+        setState("error");
+        return;
+      }
+      setState("sent");
+      e.target.reset();
+    } catch {
+      setState("error");
+    }
```

`serviceInterested` currently submits the service **title** (`"Web Development"`),
and `Inquiry.serviceInterested` is a free-text `String`, so this is valid — but
the admin filter groups by exact match. Keep sending the title, and make the
admin filter read its options from the live services list rather than from
`SERVICE_TYPES` slugs, or the two will never line up.

---

## 10 · Verification

```bash
npm run dev          # frontend :3000
# in str-backend:  npm run dev   → :5025
```

**Auth**

- [ ] `/admin` while signed out → redirected to `/login?next=%2Fadmin`, with no
      frame of dashboard visible
- [ ] Wrong password → "Invalid credentials", no cookie set
- [ ] Eleven wrong attempts → 429 rendered as its own message, not "Login failed"
- [ ] Successful login → lands on `next` if present, `/admin` otherwise
- [ ] DevTools → Application → Cookies: `str_admin` is `HttpOnly`, `SameSite=Lax`,
      `Path=/`. **`document.cookie` in the console must not contain it.**
- [ ] `localStorage` and `sessionStorage` are empty on every admin route
- [ ] Sign out → cookie gone, `/admin` redirects, browser Back does not restore
      the dashboard
- [ ] Change the password via the API, then use the old session → bounced to
      `/login` on the next request (the backend's `passwordChangedAt` check)
- [ ] Stop the Express server, then load `/admin` → a readable "API unreachable"
      error, not a Next error overlay

**Proxy**

- [ ] `fetch("/api/admin/projects")` from the console while signed in → 200
- [ ] Same call in a private window → 401, not a 500
- [ ] `fetch("/api/admin/../../etc/passwd")` and `/api/admin/whatever` → 404
- [ ] Network tab: no admin request goes to `:5025`; every one is same-origin
- [ ] Response headers on `/api/admin/*` include `Cache-Control: no-store`

**CRUD** — for each of projects, services, blogs, testimonials, team:

- [ ] Create → row appears, toast fires, list reloads
- [ ] Edit → values load into the form, save persists, `updatedAt` moves
- [ ] Delete → confirm dialog traps focus, Escape cancels, delete removes the row
- [ ] Validation error → messages land under the right fields, not as raw JSON
- [ ] Rename a project → the slug updates and the public URL follows it
- [ ] Search + filter + paginate together; then type fast in search and confirm
      no out-of-order result flashes (the AbortController)

**Inquiries**

- [ ] Submit the public form at `/contact` → the lead appears in `/admin/inquiries`
- [ ] Status toggle persists across reload
- [ ] Attempting to edit `senderEmail` is impossible in the UI **and** rejected
      by the API if forced
- [ ] `/admin/inquiries?status=new` applies the filter on mount

**Public hydration**

- [ ] `/projects`, `/services`, `/blogs` render live API data
- [ ] Publish a blog in admin → it appears at `/blogs` after `revalidate("blogs")`
- [ ] Stop Express, reload `/projects` → the Phase 3 static content renders with
      a console warning; **the page does not 500**
- [ ] A nonexistent slug still renders the 404 page
- [ ] `npm run build` completes with the API server **stopped**

**Discipline checks**

- [ ] `grep -rn "gsap\|framer-motion\|animate-\|transition-transform\|transition-all" app/\(admin\) components/admin/`
      returns nothing
- [ ] `grep -rln "use client" app/\(admin\)` — no page imports `@/lib/data`
- [ ] No `rounded-lg`, `rounded-xl`, `rounded-full` or `shadow-` in
      `components/admin/`
- [ ] No literal hex colour in `components/admin/` except the `accentColor`
      picker's own value
- [ ] Every admin route works at 375px: the sheet opens, tables scroll inside
      their own container, the body never scrolls sideways
- [ ] Tab through `/admin/projects/new` end to end — every control reachable,
      every error announced via `aria-describedby`
- [ ] Theme toggle works on every admin route

---

## 11 · Out of scope for Phase 4

- **All GSAP work.** `accentColor`, `layoutStyle` and `animationTrigger` are
  edited and stored; nothing reads them until Phase 5.
- **File uploads.** Image fields stay text inputs. Phase 6, if still wanted.
- **A rich-text WYSIWYG.** `fullCaseStudy` / `content` / `detailedOverview` are
  monospace HTML textareas. An editor is a week of work and a new dependency
  tree; the backend sanitizer already makes raw HTML safe.
- **`/admin/users`.** The API surface exists and is `super_admin`-only. Adding
  the UI means role and permission editing, which is its own design problem.
  Create additional admins with `POST /api/v1/auth/register` for now.
- **Optimistic list mutations beyond toggles.** Create/delete reload the list.
  It is one request and it cannot desync.
- **Real-time / polling.** The dashboard is accurate as of page load. Say so in
  the UI (`generatedAt` is already in the stats payload) rather than adding a
  socket.
