import Link from "next/link";

const COLUMNS = [
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Projects", href: "/projects" },
      { label: "Blog", href: "/blog" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Services",
    links: [
      { label: "Web Development", href: "/services/web-development" },
      { label: "Software Development", href: "/services/software-development" },
      { label: "Data Science & Analytics", href: "/services/data-science" },
      { label: "Digital Marketing", href: "/services/digital-marketing" },
    ],
  },
];

const SOCIAL = [
  { label: "Facebook", href: "https://www.facebook.com/share/1J9gnWA3Q9" },
  { label: "LinkedIn", href: "https://www.linkedin.com/company/str-solutions-ltd" },
  { label: "WhatsApp", href: "https://wa.me/message/5NTM5FEI27IBH1" },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[--border] bg-[--surface]">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand block */}
          <div>
            <Link href="/" className="flex items-center gap-2 font-extrabold tracking-tight">
              <span className="grid h-7 w-7 place-items-center bg-primary text-xs font-bold text-white">
                S
              </span>
              <span className="text-[--text]">
                STR<span className="text-accent">.</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[--text-muted]">
              Enterprise-grade software, data science, and digital products
              engineered for scale.
            </p>
            <address className="mt-5 not-italic text-sm text-[--text-muted]">
              Dhaka 1216, Bangladesh
              <br />
              <a href="mailto:info@strsltd.com" className="hover:text-[--text]">
                info@strsltd.com
              </a>
              <br />
              <a href="tel:+8801332802026" className="hover:text-[--text]">
                +880 1332 802026
              </a>
            </address>
          </div>

          {/* Link columns */}
          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[--text]">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[--text-muted] transition-colors hover:text-[--text]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-[--border] pt-6 sm:flex-row sm:items-center">
          <p className="text-xs text-[--text-muted]">
            © {year} STR Solutions Ltd. All rights reserved.
          </p>
          <ul className="flex items-center gap-5">
            {SOCIAL.map((s) => (
              <li key={s.label}>
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-medium text-[--text-muted] transition-colors hover:text-[--text]"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
