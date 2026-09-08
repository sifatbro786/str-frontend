import LegalDocument from "@/components/legal/LegalDocument";
import JsonLd from "@/components/seo/JsonLd";
import { breadcrumbSchema, buildMetadata } from "@/lib/seo";
import { privacyPolicy } from "@/lib/legal";

/**
 * /privacy — already referenced by app/sitemap.js, lib/site.js's footer
 * legalLinks and the cookie banner, all of which were pointing at a 404.
 *
 * `identifier` is deliberately omitted from buildMetadata: there is no
 * PageMeta row for this route and there should not be one. Legal titles are
 * not marketing copy and do not belong behind a dashboard field — see the
 * note at the top of lib/legal.js.
 */
export async function generateMetadata() {
    return buildMetadata({
        path: privacyPolicy.path,
        title: privacyPolicy.title,
        description: privacyPolicy.description,
    });
}

export default function PrivacyPage() {
    return (
        <>
            <JsonLd data={breadcrumbSchema([{ name: privacyPolicy.title, path: "/privacy" }])} />
            <LegalDocument
                doc={privacyPolicy}
                counterpart={{ label: "Terms of Service", href: "/terms" }}
                showCookieSettings
            />
        </>
    );
}
