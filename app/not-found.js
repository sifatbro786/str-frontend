import Link from "next/link";
import { site } from "@/lib/site";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="border-b border-(--line)">
      <div className="shell grid gap-x-12 gap-y-10 pb-24 pt-40 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <span className="label-mono text-signal">Error 404</span>
          <h1 className="text-display mt-6 max-w-[14ch]">
            That page{" "}
            <span className="text-(--text-mute)">does not exist.</span>
          </h1>
          <p className="mt-8 max-w-md text-[1.0625rem] leading-relaxed text-(--text-dim)">
            Either the URL is wrong or we moved something and did not redirect it. The
            second one is our fault — tell us and we will fix it.
          </p>
        </div>

        <nav aria-label="Suggested pages" className="lg:col-span-4 lg:col-start-9">
          <p className="label-mono text-(--text-mute)">Try one of these</p>
          <ul className="mt-5 border-t border-(--line)">
            {site.nav.map((item) => (
              <li key={item.href} className="border-b border-(--line)">
                <Link
                  href={item.href}
                  className="flex items-center justify-between gap-4 py-4 text-[1.0625rem] text-(--text) transition-colors hover:text-signal"
                >
                  {item.label}
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </section>
  );
}
