import { getFeaturedProjects } from "@/lib/api";
import ProjectsRail from "./ProjectsRail";

/**
 * Server shell. Owns the fetch and nothing else — see PHASE-5-BUILD-GUIDE §4.
 * All markup and motion live in ProjectsRail.
 */
export default async function FeaturedProjects() {
  const items = await getFeaturedProjects(4);

  return <ProjectsRail items={items} />;
}
