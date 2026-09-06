/** Bare centred shell. No Navbar, no Footer — this page has one job. */
export default function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-(--canvas) px-6 py-16">
      {children}
    </div>
  );
}
