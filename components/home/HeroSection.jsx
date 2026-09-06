import { getFeaturedProjects } from "@/lib/api";
import HeroIntro from "./HeroIntro";

/**
 * Server shell. Owns the fetch and nothing else — see PHASE-5-BUILD-GUIDE §4.
 *
 * This component cannot become "use client": it is async and awaits lib/api.js,
 * which reaches next/headers through lib/apiServer.js. All markup and motion
 * live in HeroIntro, which receives plain serialisable data.
 */
export default async function HeroSection() {
  const strip = await getFeaturedProjects(3);

  return <HeroIntro strip={strip} />;
}
