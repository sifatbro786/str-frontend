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
