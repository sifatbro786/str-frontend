import { getServices } from "@/lib/api";
import BentoGrid from "./BentoGrid";

/**
 * Server shell. Owns the fetch and nothing else — see PHASE-5-BUILD-GUIDE §4.
 * All markup and motion live in BentoGrid.
 */
export default async function ServicesBento() {
  const services = await getServices();

  return <BentoGrid services={services} />;
}
