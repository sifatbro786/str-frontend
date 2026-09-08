import LegalDocument from "@/components/legal/LegalDocument";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { termsOfService } from "@/lib/legal";

/** /terms — see the note in ../privacy/page.js on why there is no PageMeta row. */
export async function generateMetadata() {
    return buildMetadata({
        path: termsOfService.path,
        title: termsOfService.title,
        description: termsOfService.description,
    });
}

export default function TermsPage() {
    return (
        <>
            <JsonLd data={breadcrumbSchema([{ name: termsOfService.title, path: "/terms" }])} />
            <LegalDocument
                doc={termsOfService}
                counterpart={{ label: "Privacy Policy", href: "/privacy" }}
            />
        </>
    );
}
