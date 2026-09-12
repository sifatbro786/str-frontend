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
    UsersIcon,
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
 *
 * `roles` restricts an entry to those roles. Absent means everyone signed in.
 * This is navigation, NOT authorization — it stops an admin being shown a door
 * that will not open for them. The door itself is locked in three other
 * places: the page's own server-side role check, checkRole("super_admin") on
 * the Express route, and the proxy's resource allow-list.
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

    {
        href: "/admin/users",
        label: "Users",
        icon: UsersIcon,
        group: "Access",
        roles: ["super_admin"],
    },
];

/** Buckets entries by `group`, preserving ADMIN_NAV order. */
function groupNav(items) {
    return items.reduce((acc, item) => {
        const bucket = acc.find((g) => g.title === item.group);
        if (bucket) bucket.items.push(item);
        else acc.push({ title: item.group, items: [item] });
        return acc;
    }, []);
}

/** Nav entries in render order, bucketed by `group`. Order follows ADMIN_NAV. */
export const ADMIN_NAV_GROUPS = groupNav(ADMIN_NAV);

/**
 * Groups visible to `role`, with any group left empty by the filter dropped —
 * otherwise an admin sees an "Access" heading with nothing under it.
 */
export function navGroupsFor(role) {
    return groupNav(ADMIN_NAV.filter((item) => !item.roles || item.roles.includes(role)));
}

/** Matcher shared by Sidebar (active state) and Topbar (page title). */
export function isNavActive(item, pathname) {
    return item.exact
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
}
