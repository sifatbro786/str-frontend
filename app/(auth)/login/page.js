import { Suspense } from "react";
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
        {/* useSearchParams in LoginForm bails out of static rendering; the
            Suspense boundary keeps that contained to the form. */}
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
