import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import ProjectRail from "@/components/projects/ProjectRail";
import { getProjects } from "@/lib/api";
import { SERVICE_TYPES } from "@/lib/taxonomy";

export const metadata = {
  title: "Selected Work",
  description:
    "Case studies from STR Solutions Ltd — commerce replatforms, field applications, booking engines, catalogue production and architectural visualization.",
  alternates: { canonical: "/projects" },
};

/**
 * Server component owns the data; ProjectRail owns only the filter state.
 * Passing the array down beats a client-side fetch: it is already in the HTML
 * payload, and the first paint is filtered-correct with JS disabled.
 */
export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <>
      <PageMasthead
        index="02"
        eyebrow="Selected work"
        title="Ten projects, and what actually changed."
        lede="Each of these is written up as a problem, a decision, and a number — not a screenshot with adjectives around it. Filter by discipline below."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Work" }]}
        meta={[
          { label: "Published", value: `${projects.length} case studies` },
          { label: "Sectors", value: "Retail · Property · Field ops · Nonprofit" },
          { label: "Regions", value: "Bangladesh · UK · Australia" },
          { label: "Under NDA", value: "Available on request" },
        ]}
      />

      <ProjectRail projects={projects} services={SERVICE_TYPES} />

      <CTABand
        title="Yours could be the next one written up."
        body="We publish case studies with the client's number in them, or not at all. If you would rather stay unnamed, that is fine too — most of our largest work is."
        primary={{ label: "Start a project", href: "/contact" }}
        secondary={{ label: "See our services", href: "/services" }}
      />
    </>
  );
}
