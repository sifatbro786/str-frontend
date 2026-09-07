import { getServices } from "@/lib/api";
import ServicesList from "./ServicesList";

/**
 * Server shell. Owns the fetch and nothing else — see PHASE-5-BUILD-GUIDE §4.
 * All markup and motion live in ServicesList.
 *
 * Renamed from ServicesBento when the bento was replaced by the typographic
 * index. A file called ServicesBento that renders a list is exactly the kind of
 * drift that makes a codebase stop being greppable.
 */
export default async function ServicesSection() {
  const services = await getServices();

  return <ServicesList services={services} />;
}
