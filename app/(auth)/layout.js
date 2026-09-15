/** Bare centred shell. No Navbar, no Footer — this page has one job. */
export default function AuthLayout({ children }) {
    return (
        /* data-auth is the login screen's opt-out from the marketing site's
           warm stock paper, exactly as data-admin is the dashboard's. See the
           html:not(.dark) block in globals.css. It carries no styling of its
           own — it only selects the ramp — so this page renders identically to
           how it did before the paper change. */
        <div
            data-auth=""
            className="flex min-h-dvh items-center justify-center bg-(--canvas) px-6 py-16"
        >
            {children}
        </div>
    );
}
