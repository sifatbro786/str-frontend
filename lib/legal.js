import { site } from "./site";

/**
 * lib/legal.js — the text of /privacy and /terms, as data.
 *
 * ── WHY THIS IS DATA AND NOT TWO PAGES OF JSX ────────────────────────────
 * Legal copy gets amended, and it gets amended by someone who is not a
 * developer reading a diff. Keeping it as a flat list of sections means an
 * edit is a string change in one file with no chance of breaking a layout,
 * and it means both documents render through one component
 * (components/legal/LegalDocument.jsx) so they cannot drift apart visually.
 *
 * It deliberately does NOT go through PageMeta/Mongo like the marketing copy
 * does. A legal notice that can be edited from a dashboard with no version
 * history is a liability, not a feature — these change in a commit, with a
 * date and an author attached.
 *
 * ── BLOCK SHAPES ─────────────────────────────────────────────────────────
 *   "a string"                    → paragraph
 *   { list: [...] }               → bulleted list
 *   { defs: [{ term, desc }] }    → hairline definition grid
 *   { note: "..." }               → set-off callout, for the one thing in a
 *                                   section a reader must not miss
 *
 * ── ⚑ BEFORE LAUNCH ──────────────────────────────────────────────────────
 * Four values below are placeholders that only the company can supply, and
 * they are marked with ⚑ at their definition:
 *
 *   1. `effectiveDate` — set it to the date these actually go live.
 *   2. Company registration / RJSC number in "Who we are".
 *   3. Governing law: written as Bangladesh with Dhaka courts, which follows
 *      from the entity being a Bangladeshi company. Confirm with counsel if
 *      any EU/UK client contract already names a different forum.
 *   4. The processor list in "Who else touches your data" is accurate to the
 *      stack as built (Vercel, Render, MongoDB Atlas, Fontshare). It has to
 *      be re-checked whenever infrastructure changes — naming a processor you
 *      no longer use is as wrong as omitting one you do.
 *
 * None of this is legal advice, and neither of these documents has been
 * reviewed by a lawyer. They are an honest, accurate description of what this
 * site actually does — which is the prerequisite for a review, not a
 * substitute for one.
 */

/* ⚑ Set to the real go-live date. Shown on both documents and in the masthead
   meta row; a legal notice with no date is not worth much. */
export const effectiveDate = "2026-01-01";

const CONTACT_EMAIL = site.contact.email;

/* ═══════════════════════════════════════════════════════════════════════
   Privacy Policy
   ═══════════════════════════════════════════════════════════════════════ */

export const privacyPolicy = {
    identifier: "privacy",
    path: "/privacy",
    index: "06",
    eyebrow: "Legal",
    title: "Privacy Policy",
    lede: `What ${site.legalName} collects when you use this website, why we collect it, who else can see it, and how to make us delete it.`,
    description: `How ${site.legalName} collects, uses, stores and shares personal information through strsltd.com — including the inquiry form, cookies and third-party processors.`,
    summary: [
        "We collect what you type into the inquiry form, and very little else.",
        "There is no analytics, no advertising pixel and no tracker on this site.",
        "We do not sell personal information, and we never have.",
        `Email ${CONTACT_EMAIL} and we will delete your record.`,
    ],
    sections: [
        {
            id: "who-we-are",
            title: "Who we are",
            blocks: [
                `${site.legalName} ("STR", "we", "us") is an engineering and visual production studio registered in ${site.address.country} and operating from ${site.address.city}. For anything you send through this website, we are the data controller — the party that decides why and how your information is used.`,
                {
                    defs: [
                        { term: "Entity", desc: site.legalName },
                        {
                            term: "Registered office",
                            // ⚑ lib/site.js has no street address yet; see the note there.
                            desc: `${site.address.city}, ${site.address.country}`,
                        },
                        { term: "Privacy contact", desc: CONTACT_EMAIL },
                        { term: "Telephone", desc: site.contact.phone },
                    ],
                },
                `This policy covers ${site.url} only. Work we do inside a client's own systems is governed by the contract for that engagement, not by this page.`,
            ],
        },
        {
            id: "what-we-collect",
            title: "What we collect",
            blocks: [
                "Two things, and they are worth separating because they are collected very differently.",
                {
                    defs: [
                        {
                            term: "You give it to us",
                            desc: "The inquiry form on /contact: your name, email address, phone number if you enter one, the service you are interested in, the budget range you select, and your message. Nothing on that form is collected that you did not type.",
                        },
                        {
                            term: "Your browser sends it",
                            desc: "Standard server request data — IP address, user agent, the page requested and a timestamp — which our hosting providers log automatically for security and to keep the site running. We do not build profiles from it.",
                        },
                    ],
                },
                "We do not ask for, and have no field for, payment card details, government identification, date of birth, or any special-category data (health, biometrics, political or religious views). Do not send those through the inquiry form.",
                {
                    note: "If you send us documents during a project — a brief, a spreadsheet, credentials for a staging environment — those arrive by email or through your own systems, not through this website, and are handled under the confidentiality terms of your engagement.",
                },
            ],
        },
        {
            id: "why-we-collect-it",
            title: "Why we collect it, and on what basis",
            blocks: [
                "Every item above maps to one reason. If a reason stops applying, the data goes.",
                {
                    defs: [
                        {
                            term: "To reply to you",
                            desc: "An inquiry is a request to be contacted. We use your details to answer it, scope the work, and follow up. Legal basis: steps taken at your request before entering a contract.",
                        },
                        {
                            term: "To run the business",
                            desc: "We keep a record of inquiries so we know what was quoted, to whom, and when. Legal basis: our legitimate interest in operating and defending the business.",
                        },
                        {
                            term: "To keep the site up",
                            desc: "Server logs and rate limiting exist to detect abuse and outages. Legal basis: legitimate interest in security.",
                        },
                        {
                            term: "Where you have agreed",
                            desc: "Anything non-essential runs only if you accept it in the cookie banner. Today nothing does. Legal basis: consent, withdrawable at any time.",
                        },
                    ],
                },
                "We do not use your information for automated decision-making or profiling, and we do not send marketing email to people who only filled in the inquiry form.",
            ],
        },
        {
            id: "cookies",
            title: "Cookies and similar technologies",
            blocks: [
                "This site sets no advertising cookies and runs no analytics. There is no Google Analytics tag, no Meta pixel, no session recorder and no A/B testing script. What exists is the following, all of it stored in your own browser and readable only by this site.",
                {
                    defs: [
                        {
                            term: "Your consent choice",
                            desc: "Records whether you accepted or declined non-essential storage, so the banner does not ask again on every page. Strictly necessary — it exists to honour your answer.",
                        },
                        {
                            term: "Theme preference",
                            desc: "Remembers light or dark mode. Strictly necessary for the preference to survive a reload; it identifies nothing.",
                        },
                        {
                            term: "Admin session",
                            desc: "A signed authentication cookie set only for staff signing in to the dashboard at /admin. It is never set for a public visitor.",
                        },
                    ],
                },
                "Because everything above is strictly necessary or set only after you sign in, the site works fully whether you accept or decline the banner. Declining costs you nothing, which is the point.",
                {
                    note: "If we ever add analytics or a marketing tag, it will load only after consent is granted — the code gate for that already exists — and this section will be updated before it ships.",
                },
            ],
        },
        {
            id: "who-else",
            title: "Who else touches your data",
            blocks: [
                "We do not sell personal information, we do not share it with advertisers, and we do not trade contact lists. A small number of infrastructure providers process data on our behalf, under contract, because the site cannot run without them.",
                {
                    defs: [
                        {
                            term: "Vercel",
                            desc: "Hosts and serves this website. Processes request logs, including IP addresses.",
                        },
                        {
                            term: "Render",
                            desc: "Hosts the application server that receives the inquiry form.",
                        },
                        {
                            term: "MongoDB Atlas",
                            desc: "The managed database where inquiry records and site content are stored.",
                        },
                        {
                            term: "Fontshare",
                            desc: "Serves one webfont used across the site. Your browser requests it directly, so their CDN sees your IP address and user agent. No cookie is set.",
                        },
                    ],
                },
                "Beyond those, we disclose personal information only where we are legally required to — a valid court order or regulatory demand — or where it is necessary to establish or defend a legal claim. If we are ever compelled to hand over your data, we will tell you unless we are legally barred from doing so.",
            ],
        },
        {
            id: "transfers",
            title: "Where your data goes",
            blocks: [
                `We operate from ${site.address.country} and roughly half our clients are outside it, so your information will in practice be processed in more than one country — including in the United States and the European Union, depending on where the providers above run the infrastructure serving you.`,
                "Where personal information covered by UK or EU data protection law leaves that jurisdiction, we rely on our providers' standard contractual clauses and equivalent safeguards. If you want to know which provider handles a specific record, ask and we will tell you.",
            ],
        },
        {
            id: "retention",
            title: "How long we keep it",
            blocks: [
                {
                    defs: [
                        {
                            term: "Inquiries that went nowhere",
                            desc: "Deleted within 24 months of the last contact, unless you ask for it sooner.",
                        },
                        {
                            term: "Inquiries that became projects",
                            desc: "Kept for the life of the engagement and for as long afterwards as tax and contract-limitation rules require, then deleted.",
                        },
                        {
                            term: "Server and security logs",
                            desc: "Retained on a short rolling window by our hosting providers, typically measured in days to weeks, then rotated out automatically.",
                        },
                    ],
                },
                "We do not keep data indefinitely on the theory that it might be useful later. If a record has no live reason to exist, it is deleted.",
            ],
        },
        {
            id: "your-rights",
            title: "Your rights",
            blocks: [
                "Wherever you are, you can ask us to do all of the following, and we will do it regardless of whether your local law obliges us to.",
                {
                    list: [
                        "Tell you exactly what we hold about you, and give you a copy.",
                        "Correct anything that is wrong or out of date.",
                        "Delete your record entirely.",
                        "Stop using your information for a particular purpose.",
                        "Provide your data in a portable, machine-readable format.",
                        "Withdraw a consent you previously gave, without penalty.",
                    ],
                },
                `Email ${CONTACT_EMAIL} with the request. We reply within one business day and complete the request within 30 days at the outside. We will not charge you, and we will not make you explain why.`,
                "If you are in the UK or the EEA, you also have the right to complain to your national supervisory authority. We would rather you raised it with us first, but that right does not depend on our agreement.",
            ],
        },
        {
            id: "security",
            title: "How it is protected",
            blocks: [
                "The site is served over HTTPS end to end. The inquiry endpoint is rate limited and every submitted field is validated and sanitised on the server before it is stored. Administrative access to the dashboard requires a signed session, and access to the database is restricted to the application and to the small number of people who need it.",
                "No system is perfectly secure and we will not claim otherwise. If a breach ever affects your personal information, we will notify you and the relevant authority within the timeframes the applicable law requires.",
            ],
        },
        {
            id: "children",
            title: "Children",
            blocks: [
                "This is a business-to-business site and is not directed at children. We do not knowingly collect information from anyone under 16. If you believe a child has sent us something through this site, email us and we will delete it.",
            ],
        },
        {
            id: "changes",
            title: "Changes to this policy",
            blocks: [
                "When this policy changes, the effective date at the top of the page changes with it. Material changes — a new processor, a new category of data, a new purpose — will be described here rather than folded in silently.",
                "We do not apply a new purpose retroactively to data we already hold. If we ever want to use existing records for something this policy does not cover, we will ask first.",
            ],
        },
        {
            id: "contact-privacy",
            title: "Contact",
            blocks: [
                `Questions, requests and complaints about this policy all go to ${CONTACT_EMAIL}, or by post to ${site.legalName}, ${site.address.city}, ${site.address.country}. Put "Privacy" in the subject line and it will reach the right person faster.`,
            ],
        },
    ],
};

/* ═══════════════════════════════════════════════════════════════════════
   Terms of Service
   ═══════════════════════════════════════════════════════════════════════ */

export const termsOfService = {
    identifier: "terms",
    path: "/terms",
    index: "07",
    eyebrow: "Legal",
    title: "Terms of Service",
    lede: `The terms on which you may use ${site.url}. They govern the website itself — a signed proposal or contract governs any work we do for you, and it wins wherever the two disagree.`,
    description: `Terms governing use of ${site.url} — acceptable use, intellectual property, disclaimers, liability and governing law.`,
    summary: [
        "These terms cover this website, not the work we do under contract.",
        "Everything published here is information, not a binding offer.",
        "Your signed proposal or master agreement overrides this page.",
        "Nothing you send through the inquiry form is confidential until an NDA is in place.",
    ],
    sections: [
        {
            id: "agreement",
            title: "The agreement",
            blocks: [
                `By using ${site.url} you accept these terms. If you do not accept them, stop using the site — that is the whole of the bargain, and it is the only thing you agree to by browsing.`,
                `They are between you and ${site.legalName}, a company operating from ${site.address.city}, ${site.address.country}. We may update them; the effective date at the top of this page tells you which version you are reading, and continued use after a change means you accept the new version.`,
            ],
        },
        {
            id: "what-this-site-is",
            title: "What this website is",
            blocks: [
                "A description of what we do and what we have built. Everything on it — service pages, case studies, articles, timelines, capability claims — is provided for information.",
                {
                    note: "Nothing on this site is an offer, a quotation, or a commitment to take on work. A price, a scope or a delivery date becomes binding only in a proposal we have issued to you in writing and that both parties have signed.",
                },
                "We try to keep everything accurate and current, and we correct mistakes when we find them. We do not warrant that every page is free of error or that any figure is up to date at the moment you read it.",
            ],
        },
        {
            id: "acceptable-use",
            title: "Acceptable use",
            blocks: [
                "Use the site for legitimate purposes. Specifically, do not:",
                {
                    list: [
                        "Attempt to gain unauthorised access to any part of the site, its server, its database, or the admin dashboard.",
                        "Probe, scan or test the security of the site, or circumvent its rate limiting or authentication.",
                        "Scrape, harvest or bulk-copy content, or use automated systems in a way that degrades the service for anyone else.",
                        "Submit anything through the inquiry form that is unlawful, defamatory, malicious, or that infringes someone else's rights.",
                        "Use the inquiry form to send unsolicited commercial messages.",
                        "Misrepresent your identity or your affiliation with any person or organisation.",
                    ],
                },
                "We may block access from any address that does any of the above, without notice and without needing to explain ourselves.",
                {
                    note: "Found a security flaw? Email it to us rather than exploiting it. We treat good-faith reports as help and will not pursue anyone who reports a genuine issue responsibly and does not exfiltrate data or degrade the service.",
                },
            ],
        },
        {
            id: "intellectual-property",
            title: "Intellectual property",
            blocks: [
                `The design, code, copy, structure and original graphics of this site belong to ${site.legalName} or to our licensors and are protected by copyright. The ${site.name} name and logo are our trademarks.`,
                "You may read the site, print or save pages for your own reference, and quote short passages from an article with attribution and a link. You may not republish our copy, reproduce the design, or present any part of this site as your own work.",
                {
                    defs: [
                        {
                            term: "Client work shown here",
                            desc: "Case studies and screenshots remain the property of the client concerned and appear here by arrangement with them. Nothing on this site licenses you to use a client's brand, name or materials.",
                        },
                        {
                            term: "Third-party marks",
                            desc: "Logos and product names belonging to other companies are their own and are used to identify them, not to imply endorsement.",
                        },
                        {
                            term: "Work we build for you",
                            desc: "Ownership of deliverables is set by the contract for that engagement, not by this page. Ask about it before signing, not after.",
                        },
                    ],
                },
            ],
        },
        {
            id: "submissions",
            title: "What you send us",
            blocks: [
                "You keep ownership of everything you submit through the inquiry form. You give us permission to read it, store it and use it to respond to you — nothing more, and nothing that survives your deletion request.",
                {
                    note: "An unsolicited inquiry is not confidential. Until a non-disclosure agreement is signed, please do not send us trade secrets, unreleased plans, credentials, or anything else you would be harmed by us receiving without protection. Tell us an NDA is needed and we will put one in place before the detail is discussed.",
                },
                "You confirm that whatever you send is yours to send, is accurate, and does not infringe anyone else's rights.",
            ],
        },
        {
            id: "third-party-links",
            title: "Links to other sites",
            blocks: [
                "Some pages link out — to a client's live site, to a partner, to something we have written about. Those sites are not ours. We do not control them, we are not responsible for their content or their privacy practices, and a link is not an endorsement. Once you leave this site, their terms apply, not ours.",
            ],
        },
        {
            id: "availability",
            title: "Availability",
            blocks: [
                "We aim to keep the site up and fast, and we do not guarantee it. It may be unavailable during deployments, provider outages, or maintenance, sometimes without warning. We may change, suspend or withdraw any part of it at any time.",
                "Nothing in this section limits any uptime commitment in a signed contract for a system we operate for you. Those are separate promises with separate remedies.",
            ],
        },
        {
            id: "disclaimers",
            title: "Disclaimers",
            blocks: [
                'The website and its content are provided "as is" and "as available". To the fullest extent the law allows, we exclude all warranties, conditions and representations that are not expressly stated here — including implied warranties of merchantability, fitness for a particular purpose, accuracy and non-infringement.',
                "Articles and technical writing on this site are general commentary, not advice for your situation. Do not act on them without checking against your own circumstances, and do not treat anything here as legal, financial or professional advice.",
            ],
        },
        {
            id: "liability",
            title: "Limitation of liability",
            blocks: [
                "To the fullest extent permitted by law, we are not liable for any indirect, incidental, special or consequential loss arising from your use of this website, nor for lost profits, lost revenue, lost data or business interruption, however caused.",
                `Our total liability for any claim connected with this website is limited to BDT 10,000 or the equivalent, unless a signed contract between us provides otherwise — in which case that contract's liability terms apply to work done under it.`,
                {
                    note: "Nothing here excludes liability that cannot lawfully be excluded — including for death or personal injury caused by negligence, or for fraud or fraudulent misrepresentation.",
                },
            ],
        },
        {
            id: "indemnity",
            title: "Indemnity",
            blocks: [
                "If you use this site in breach of these terms and that causes a third-party claim against us, you agree to cover the reasonable costs and damages we incur as a direct result. This does not apply to anything caused by our own act or omission.",
            ],
        },
        {
            id: "precedence",
            title: "Which document wins",
            blocks: [
                "If you engage us, more than one document will be in play. The order of precedence is:",
                {
                    list: [
                        "A signed master services agreement or contract between us.",
                        "A signed proposal or statement of work under that agreement.",
                        "These website terms.",
                    ],
                },
                "Where two of them conflict, the higher one governs. These terms fill the gaps; they never override a negotiated agreement.",
            ],
        },
        {
            id: "general",
            title: "General",
            blocks: [
                {
                    defs: [
                        {
                            term: "Severability",
                            desc: "If a court finds any part of these terms unenforceable, the rest stays in force.",
                        },
                        {
                            term: "No waiver",
                            desc: "If we do not enforce a term on one occasion, that is not a waiver of our right to enforce it later.",
                        },
                        {
                            term: "Assignment",
                            desc: "You may not transfer your rights under these terms. We may assign ours to a successor of the business.",
                        },
                        {
                            term: "No partnership",
                            desc: "Using this site creates no employment, agency, partnership or joint-venture relationship between us.",
                        },
                    ],
                },
            ],
        },
        {
            id: "governing-law",
            title: "Governing law",
            blocks: [
                // ⚑ Written to follow the entity's jurisdiction. Confirm with counsel
                // before launch if any existing client contract names another forum.
                `These terms are governed by the laws of ${site.address.country}, and the courts of ${site.address.city} have exclusive jurisdiction over any dispute arising from them or from your use of this website.`,
                "If you are a consumer resident elsewhere, this does not deprive you of the protection of mandatory consumer-protection law in your own country.",
            ],
        },
        {
            id: "contact-terms",
            title: "Contact",
            blocks: [
                `Questions about these terms go to ${CONTACT_EMAIL}, or by post to ${site.legalName}, ${site.address.city}, ${site.address.country}.`,
            ],
        },
    ],
};

export const legalDocuments = { privacy: privacyPolicy, terms: termsOfService };
