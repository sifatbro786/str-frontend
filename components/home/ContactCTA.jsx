import CTABand from "@/components/ui/CTABand";

/**
 * Homepage closer. Thin wrapper so the homepage's copy can diverge from the
 * default band used on inner routes without forking the component.
 */
export default function ContactCTA() {
  return (
    <CTABand
      title="Tell us the part that is actually hard."
      body="Not the feature list — the constraint. The legacy system nobody wants to touch, the deadline that moved, the catalogue drop that has to go out Friday. That is the conversation worth having first."
      primary={{ label: "Start a project", href: "/contact" }}
      secondary={{ label: "Read a case study", href: "/projects" }}
      interactive
    />
  );
}
