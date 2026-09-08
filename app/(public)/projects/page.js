import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import ProjectRail from "@/components/projects/ProjectRail";
import JsonLd from "@/components/seo/JsonLd";
import { getProjects } from "@/lib/api";
import { breadcrumbSchema, buildMetadata, caseStudySchema } from "@/lib/seo";
import { SERVICE_TYPES } from "@/lib/taxonomy";

export async function generateMetadata() {
    return buildMetadata({
        identifier: "projects",
        path: "/projects",
        title: "Selected work",
        description:
            "Case studies from STR Solutions Ltd: commerce replatforms, field applications, booking engines, catalogue production and architectural visualization.",
    });
}

/**
 * Case-study index.
 *
 * ── WHY THE DATA IS FETCHED HERE AND PASSED DOWN ─────────────────────────
 * ProjectRail owns filter state and nothing else. Fetching in the client
 * would mean a second round trip for data that is already in the HTML
 * payload, an empty first paint, and a grid that does not exist at all
 * without JS. Passing it down gives a first paint that is filtered-correct
 * and fully crawlable.
 *
 * ⚑ The `meta` strings below are hand-written claims about sectors and
 * regions. They are true of the current catalogue; if the catalogue changes
 * shape they will quietly stop being true, because nothing derives them.
 * Worth deriving from the records if this list grows much past ten.
 */
export default async function ProjectsPage() {
    const projects = await getProjects();

    return (
        <>
            <JsonLd
                data={[
                    breadcrumbSchema([{ name: "Work", path: "/projects" }]),
                    // One CreativeWork per case study, each referencing the
                    // organisation by @id rather than repeating it — that is how
                    // Google resolves them into one creator instead of ten.
                    ...projects.map(caseStudySchema),
                ]}
            />

            <PageMasthead
                index="02"
                eyebrow="Selected work"
                title="The work, and what actually changed."
                lede="Each of these is written up as a problem, a decision and a number, not a screenshot with adjectives around it. Filter by discipline below."
                breadcrumb={[{ label: "Home", href: "/" }, { label: "Work" }]}
                meta={[
                    { label: "Published", value: `${projects.length} case studies` },
                    { label: "Sectors", value: "Retail, property, field ops, nonprofit" },
                    { label: "Regions", value: "Bangladesh, UK, Australia" },
                    { label: "Under NDA", value: "Available on request" },
                ]}
            />

            <ProjectRail projects={projects} services={SERVICE_TYPES} />

            <CTABand
                title="Yours could be the next one written up."
                body="We publish case studies with the client's number in them, or not at all. If you would rather stay unnamed that is fine too, and most of our largest work is."
                primary={{ label: "Start a project", href: "/contact" }}
                secondary={{ label: "See our services", href: "/services" }}
            />
        </>
    );
}
