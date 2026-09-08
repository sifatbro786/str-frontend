import {
    BlogsIcon,
    InquiriesIcon,
    OverviewIcon,
    PageMetaIcon,
    ProjectsIcon,
    ServicesIcon,
    SiteContentIcon,
    TeamIcon,
    TestimonialsIcon,
} from "@/components/admin/icons";

/**
 * Sidebar model. `exact` is required on the overview entry, otherwise every
 * /admin/* route marks it active.
 *
 * `icon` is the component itself rather than a name string: a name would need a
 * lookup map that TypeScript cannot check and tree-shaking cannot narrow, and
 * the only consumers are Sidebar and Topbar, both of which render it directly.
 *
 * `group` splits the rail into "what the site shows" and "how the site
 * describes itself". Eight flat entries scanned as one undifferentiated list;
 * the split is what makes Page Meta findable by someone who has not memorised
 * where it sits.
 */
export const ADMIN_NAV = [
    { href: "/admin", label: "Overview", exact: true, icon: OverviewIcon, group: "Dashboard" },

    { href: "/admin/projects", label: "Projects", icon: ProjectsIcon, group: "Content" },
    { href: "/admin/services", label: "Services", icon: ServicesIcon, group: "Content" },
    { href: "/admin/blogs", label: "Blogs", icon: BlogsIcon, group: "Content" },
    { href: "/admin/testimonials", label: "Testimonials", icon: TestimonialsIcon, group: "Content" },
    { href: "/admin/team", label: "Team", icon: TeamIcon, group: "Content" },

    { href: "/admin/inquiries", label: "Inquiries", icon: InquiriesIcon, group: "Inbox" },

    {
        href: "/admin/site-content",
        label: "Site content",
        icon: SiteContentIcon,
        group: "Site settings",
    },
    { href: "/admin/page-meta", label: "Page meta", icon: PageMetaIcon, group: "Site settings" },
];

/** Nav entries in render order, bucketed by `group`. Order follows ADMIN_NAV. */
export const ADMIN_NAV_GROUPS = ADMIN_NAV.reduce((acc, item) => {
    const bucket = acc.find((g) => g.title === item.group);
    if (bucket) bucket.items.push(item);
    else acc.push({ title: item.group, items: [item] });
    return acc;
}, []);

/** Matcher shared by Sidebar (active state) and Topbar (page title). */
export function isNavActive(item, pathname) {
    return item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
