/**
 * Admin icon set.
 *
 * ── WHY THESE ARE HAND-WRITTEN AND NOT lucide-react ──────────────────────
 * The dashboard needs about fifteen icons. `lucide-react` is ~1,500 of them;
 * even fully tree-shaken it adds a dependency, a version to keep current and a
 * build-time cost to save writing the fifteen paths below once. This project
 * has no icon library today and no second use for one — components/ui/Logo.jsx
 * and the public pages already draw their few marks inline for the same reason.
 *
 * ── THE RULES EVERY ICON HERE FOLLOWS ────────────────────────────────────
 * 24×24 viewBox, 1.75 stroke, round caps and joins, `currentColor` — so an
 * icon inherits the text colour of whatever it sits in and needs no variant
 * per surface. Size is set by the caller through `className` (`size-*`), never
 * by a width/height prop, so it scales with the type around it.
 *
 * `aria-hidden` is on the shared wrapper and is correct for every current call
 * site: each icon sits beside a visible text label, or inside a control that
 * carries its own aria-label. An icon that ever becomes the ONLY content of a
 * control still needs that label on the control — the icon must stay silent.
 */

function Icon({ children, className = "size-[18px]", ...rest }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={className}
            {...rest}
        >
            {children}
        </svg>
    );
}

/* ── Sidebar sections ─────────────────────────────────────────────────── */

export const OverviewIcon = (p) => (
    <Icon {...p}>
        <rect x="3" y="3" width="7" height="9" rx="1.5" />
        <rect x="14" y="3" width="7" height="5" rx="1.5" />
        <rect x="14" y="12" width="7" height="9" rx="1.5" />
        <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </Icon>
);

export const ProjectsIcon = (p) => (
    <Icon {...p}>
        <rect x="2.5" y="7" width="19" height="13" rx="2" />
        <path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7" />
        <path d="M2.5 12h19" />
    </Icon>
);

export const ServicesIcon = (p) => (
    <Icon {...p}>
        <path d="m12 3 8.5 4.5L12 12 3.5 7.5 12 3Z" />
        <path d="m3.5 12.5 8.5 4.5 8.5-4.5" />
        <path d="m3.5 17 8.5 4.5 8.5-4.5" />
    </Icon>
);

export const BlogsIcon = (p) => (
    <Icon {...p}>
        <path d="M6 3h8l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6M9 17h4" />
    </Icon>
);

export const TestimonialsIcon = (p) => (
    <Icon {...p}>
        <path d="M21 12a7 7 0 0 1-7 7H8l-4 3v-4.5A7 7 0 0 1 8 5h6a7 7 0 0 1 7 7Z" />
        <path d="M9.5 11.5h.01M14.5 11.5h.01" />
    </Icon>
);

export const TeamIcon = (p) => (
    <Icon {...p}>
        <circle cx="9" cy="8" r="3.25" />
        <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
        <path d="M16 5.5a3.25 3.25 0 0 1 0 6.5" />
        <path d="M17.5 14.5A6.5 6.5 0 0 1 21.5 20" />
    </Icon>
);

export const InquiriesIcon = (p) => (
    <Icon {...p}>
        <path d="M3 8.5 12 14l9-5.5" />
        <rect x="3" y="4.5" width="18" height="15" rx="2" />
    </Icon>
);

export const PageMetaIcon = (p) => (
    <Icon {...p}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m20.5 20.5-5.3-5.3" />
    </Icon>
);

export const SiteContentIcon = (p) => (
    <Icon {...p}>
        <path d="M4 7V5h16v2" />
        <path d="M12 5v14" />
        <path d="M9 19h6" />
    </Icon>
);

/* ── Controls ─────────────────────────────────────────────────────────── */

export const MenuIcon = (p) => (
    <Icon {...p}>
        <path d="M4 7h16M4 12h16M4 17h16" />
    </Icon>
);

export const CloseIcon = (p) => (
    <Icon {...p}>
        <path d="m6 6 12 12M18 6 6 18" />
    </Icon>
);

export const ChevronUpIcon = (p) => (
    <Icon {...p}>
        <path d="m6 14 6-6 6 6" />
    </Icon>
);

export const ChevronDownIcon = (p) => (
    <Icon {...p}>
        <path d="m6 10 6 6 6-6" />
    </Icon>
);

export const PlusIcon = (p) => (
    <Icon {...p}>
        <path d="M12 5v14M5 12h14" />
    </Icon>
);

export const TrashIcon = (p) => (
    <Icon {...p}>
        <path d="M4 7h16" />
        <path d="M9.5 7V5.5A1.5 1.5 0 0 1 11 4h2a1.5 1.5 0 0 1 1.5 1.5V7" />
        <path d="M6.5 7v12.5A1.5 1.5 0 0 0 8 21h8a1.5 1.5 0 0 0 1.5-1.5V7" />
        <path d="M10.5 11v6M13.5 11v6" />
    </Icon>
);

export const LogoutIcon = (p) => (
    <Icon {...p}>
        <path d="M15 4h3.5A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5H15" />
        <path d="M10 8l-4 4 4 4" />
        <path d="M6 12h9" />
    </Icon>
);

export const ExternalIcon = (p) => (
    <Icon {...p}>
        <path d="M13 4h7v7" />
        <path d="M20 4 11 13" />
        <path d="M18 14.5v4A1.5 1.5 0 0 1 16.5 20h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6h4" />
    </Icon>
);

export const SaveIcon = (p) => (
    <Icon {...p}>
        <path d="M5 4h11l3 3v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
        <path d="M8 4v5h7V4" />
        <path d="M8 14h8v7H8z" />
    </Icon>
);
