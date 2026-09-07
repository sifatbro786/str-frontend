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
    // Four, not three: the hero console features the newest and the evidence
    // strip shows the next three, so nothing appears twice on the first screen.
    const strip = await getFeaturedProjects(4);

    return <HeroIntro strip={strip} />;
}
