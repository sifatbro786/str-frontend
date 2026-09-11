/**
 * lib/data.js — static content layer for Phase 3.
 *
 * CONTRACT: every object here is shaped exactly like the document the API will
 * return, field-for-field against str-backend/src/models/*. When Phase 4 swaps
 * these arrays for `fetch()` calls, not a single component prop changes.
 *
 * Deliberate deviations from the Mongoose models, all upward-compatible:
 *   1. Project.serviceType (single enum string) is represented here as
 *      `serviceTypes: [String]`. See PHASE-3-BUILD-GUIDE.md §7 for the
 *      backend migration diff. A `serviceType` getter is NOT provided —
 *      components must read serviceTypes[0] as the primary.
 *   2. Blog.author is an ObjectId ref in Mongo; here it is the *populated*
 *      shape the controller returns to the public feed.
 *   3. `_id` values are stable 24-hex strings so React keys survive the swap.
 *
 * TODO(legacy): copy marked ⚑ is a best-effort reconstruction and must be
 * replaced from the legacy STR project folder before launch.
 *
 * ── WHAT THIS MODULE IS FOR NOW ──────────────────────────────────────────
 * Nothing imports it directly any more. It has exactly one consumer, lib/api,
 * and two distinct jobs inside it:
 *
 *   1. Sections 1-5 (services, projects, team, testimonials, blogs) are the
 *      outage fallback for the collections the API owns. Kept because the
 *      backend runs on a free tier that spins down: a cold start during a
 *      Vercel build would otherwise fail the build or ship empty pages.
 *      Retire this when the API moves to a paid, always-on plan.
 *   2. Section 6 is the fallback for the SiteContent collection, which is now
 *      the source for those blocks. See the note above section 6 — those four
 *      arrays must stay in sync with the backend seed.
 *
 * It is server-only in practice: ~1,200 lines, most of it case-study HTML. A
 * client component importing it drags the lot into the browser bundle.
 */

/* ═══════════════════════════════════════════════════════════════
   0 · Enums live in lib/taxonomy.js and are re-exported here.
       Client components import from taxonomy directly so this
       module — every case study body, every blog post — never
       crosses the client boundary. See the note in that file.
   ═══════════════════════════════════════════════════════════════ */

export { SERVICE_TYPES, SERVICE_LABELS } from "./taxonomy";

/* ═══════════════════════════════════════════════════════════════
   1 · Services — model: str-backend/src/models/Service.js
   ═══════════════════════════════════════════════════════════════ */

export const services = [
    {
        _id: "6650a1f0c3d4e5f601000001",
        title: "Website Development",
        slug: "website-development",
        shortDescription:
            "Corporate sites, commerce platforms and booking systems built on Next.js, tuned to load fast on a mid range Android phone and not only on a designer's laptop.",
        detailedOverview: "<p>We build the web layer a company actually runs on: the storefront customers buy from, the booking flow that takes the payment, the internal tool an operations team lives inside for eight hours a day. Most of it ships on Next.js with a Node.js and Express core, MongoDB behind it, and server rendering wherever search visibility matters.</p>\n<p>The part clients notice six months later is the unglamorous part. A documented API contract, seeded environments, a rollback that takes one command, and a content model an editor can work in without calling a developer. That is what keeps a site maintainable after the launch team has moved on.</p>\n<h3>How an engagement usually runs</h3>\n<ul><li>Week one: audit, content model and a clickable route map</li><li>Weeks two to five: component library first, then pages against real data</li><li>Final week: performance budget, accessibility pass, analytics and handover</li></ul>",
        image: "",
        imageAlt: "",
        featuresList: [
            "Next.js App Router with server components and streamed routes",
            "Custom admin dashboard, or a headless CMS if your team prefers one",
            "Core Web Vitals budget agreed in writing before the build starts",
            "WCAG 2.2 AA keyboard and screen reader passes",
            "Structured data, sitemaps and metadata on every route",
            "Continuous integration with a preview deployment per branch",
        ],
        deliverableTimeline: "4 to 8 weeks",
        order: 1,
        isActive: true,
        createdAt: "2025-01-12T09:00:00.000Z",
        updatedAt: "2026-09-11T09:00:00.000Z",
    },
    {
        _id: "6650a1f0c3d4e5f601000002",
        title: "Software Development",
        slug: "software-development",
        shortDescription:
            "ERP modules, logistics tooling and SaaS backends for teams whose daily process no packaged product actually fits.",
        detailedOverview: "<p>Packaged software fails in the same place every time. The one workflow that makes the business money is the one the vendor never modelled, so the team ends up running it in a spreadsheet beside the system they paid for. We build that workflow properly and integrate the rest rather than rebuilding it.</p>\n<p>The architecture stays deliberately boring. A modular Express service with business logic kept away from routing, MongoDB aggregation pipelines instead of queries inside loops, JSON Web Tokens with rotating refresh tokens, and rate limiting at the edge. Boring is what survives a change of team.</p>\n<h3>What we insist on</h3>\n<ul><li>Domain modelling sessions with the people who do the work, before any code</li><li>A migration path off whatever you run today, spreadsheets included</li><li>Load testing against an agreed concurrency target before launch</li></ul>",
        image: "",
        imageAlt: "",
        featuresList: [
            "Domain modelling workshops with the operators, not only the managers",
            "Modular service structure with business logic isolated from routing",
            "Role based access control with an audit trail on every write",
            "Reporting through aggregation pipelines, not client side arithmetic",
            "Integrations for ERP, SMS, payment gateways and courier APIs",
            "Load tested to an agreed concurrency target before go live",
            "Runbook and a handover session for your own engineers",
        ],
        deliverableTimeline: "8 to 20 weeks",
        order: 2,
        isActive: true,
        createdAt: "2025-01-12T09:00:00.000Z",
        updatedAt: "2026-09-11T09:00:00.000Z",
    },
    {
        _id: "6650a1f0c3d4e5f601000003",
        title: "Business & IT Consultancy",
        slug: "business-and-it-consultancy",
        shortDescription:
            "Technology audit, architecture review and a costed roadmap, so the next budget goes into the system that is actually holding the business back.",
        detailedOverview: "<p>Most technology spending in a growing company is decided under pressure, and the result is four tools that overlap, two nobody logs into, and one critical process held together by a single person's memory. We map what exists, then write down what it costs to keep running.</p>\n<p>The output is a document a non technical board can read and a technical team can act on: current state, risks ranked by what they would cost if they landed, and a sequenced roadmap with a price against every step. We are perfectly happy for the conclusion to be that you need less software rather than more.</p>\n<h3>Why clients usually call</h3>\n<ul><li>A system is slow or falling over and nobody agrees on the cause</li><li>A vendor quote has arrived and it needs an independent second opinion</li><li>A funding round or an audit needs the stack documented properly</li></ul>",
        image: "",
        imageAlt: "",
        featuresList: [
            "Current state audit of systems, integrations and licence spend",
            "Architecture and code review with findings ranked by business risk",
            "Build versus buy analysis with real numbers on both sides",
            "Security and access review across accounts, servers and databases",
            "Sequenced roadmap with cost and effort against every step",
            "Vendor quote review and technical due diligence",
        ],
        deliverableTimeline: "2 to 6 weeks",
        order: 3,
        isActive: true,
        createdAt: "2025-01-12T09:00:00.000Z",
        updatedAt: "2026-09-11T09:00:00.000Z",
    },
    {
        _id: "6650a1f0c3d4e5f601000004",
        title: "Graphic Design",
        slug: "graphic-design",
        shortDescription:
            "Brand identity, campaign collateral and high volume product image production, with every batch through a quality check before it leaves the studio.",
        detailedOverview: "<p>Two kinds of work happen here and they run on different rhythms. Identity and campaign design is studio work: research, routes, refinement, and a brand guide the next agency can actually follow. Product image production is a line: hundreds or thousands of files a week, moving on a schedule with a named coordinator against it.</p>\n<p>On the production side the craft is in what nobody sees. Hand drawn clipping paths rather than automatic selection, channel based masking for hair, fur and glass, colour matched to your physical reference instead of to a screen, and shadow work that keeps a product sitting on a surface rather than floating above it.</p>",
        image: "",
        imageAlt: "",
        featuresList: [
            "Logo and identity systems delivered with a written brand guide",
            "Social, print and packaging collateral in production ready files",
            "Hand drawn clipping paths on every cutout",
            "Image masking for hair, fur, glass and translucent fabric",
            "Skin, product and jewellery retouching",
            "Invisible mannequin composites for apparel catalogues",
            "Natural shadows, drop shadows and reflection rebuilds",
            "Batch resizing and exports to each marketplace specification",
        ],
        deliverableTimeline: "24 to 72 hour turnaround",
        order: 4,
        isActive: true,
        createdAt: "2025-01-12T09:00:00.000Z",
        updatedAt: "2026-09-11T09:00:00.000Z",
    },
    {
        _id: "6650a1f0c3d4e5f601000005",
        title: "Digital Marketing",
        slug: "digital-marketing",
        shortDescription:
            "Technical SEO, paid social and reporting that ties spend to qualified pipeline rather than to impressions.",
        detailedOverview: "<p>We start with the audit nobody enjoys reading: crawl errors, index bloat, thin pages competing against each other, and a Core Web Vitals score quietly costing you positions you already earned. Fixing that is usually cheaper than the campaign somebody wanted to run instead.</p>\n<p>Campaigns come after, on Meta and Google, with conversion tracking wired to real events rather than to page views. Reporting is a dashboard you open yourself, and the headline number is cost per qualified lead. Reach and impressions stay off it, because no invoice was ever paid with an impression.</p>",
        image: "",
        imageAlt: "",
        featuresList: [
            "Full technical SEO audit with a prioritised fix list",
            "Keyword and search intent mapping against the offers you actually sell",
            "On page optimisation and structured data implementation",
            "Meta and Google campaign build, creative testing and management",
            "Server side conversion tracking that survives ad blockers",
            "Monthly reporting against pipeline, with the raw data included",
        ],
        deliverableTimeline: "Monthly retainer",
        order: 5,
        isActive: true,
        createdAt: "2025-01-12T09:00:00.000Z",
        updatedAt: "2026-09-11T09:00:00.000Z",
    },
    {
        _id: "6650a1f0c3d4e5f601000006",
        title: "Data Science & Analytics",
        slug: "data-science-and-analytics",
        shortDescription:
            "Warehouse modelling, forecasting and decision dashboards, so meetings argue about the decision instead of about whose number is correct.",
        detailedOverview: "<p>Analytics work usually fails for an unglamorous reason: the same metric is calculated three ways in three tools, so every meeting opens by reconciling numbers. The first thing we build is a modelled layer with one definition per metric, documented, versioned and owned by somebody.</p>\n<p>On top of that sits the part people asked for. Demand and inventory forecasting, customer segmentation and churn scoring, anomaly alerts that reach a human before a customer notices, and dashboards built for a decision rather than for a screenshot.</p>\n<h3>How we work</h3>\n<ul><li>Start from the decision, then work backwards to the data it needs</li><li>Ship one modelled metric end to end before modelling forty</li><li>Hand over the pipeline and the notebooks, not only the chart</li></ul>",
        image: "",
        imageAlt: "",
        featuresList: [
            "Warehouse modelling with one documented definition per metric",
            "Pipelines from your live systems, scheduled and monitored",
            "Forecasting for demand, inventory and revenue",
            "Customer segmentation, cohort analysis and churn scoring",
            "Anomaly detection with alerting that reaches a person",
            "Dashboards in Power BI, Looker Studio or a custom React build",
        ],
        deliverableTimeline: "6 to 12 weeks",
        order: 6,
        isActive: true,
        createdAt: "2025-01-12T09:00:00.000Z",
        updatedAt: "2026-09-11T09:00:00.000Z",
    },
    {
        _id: "6650a1f0c3d4e5f601000007",
        title: "2D/3D Design & Animation",
        slug: "2d-3d-design-and-animation",
        shortDescription:
            "Floor plans, architectural renders, product visualisation and motion graphics for property developers, manufacturers and campaign teams.",
        detailedOverview: "<p>Drawings a buyer understands in four seconds and an architect does not have to correct. We work from CAD files, a PDF or a hand sketch, and return coloured 2D plans, textured 3D floor plans, interior and exterior stills, and animated walkthroughs that hold up on a phone screen as well as on a sales floor display.</p>\n<p>Product and motion work runs the same way. Turntables and exploded views for manufacturers, explainer animation for campaigns, and every deliverable exported at both listing size and print size, so nobody on the marketing team is exporting files again at eleven at night.</p>",
        image: "",
        imageAlt: "",
        featuresList: [
            "Monochrome and full colour 2D floor plans",
            "Textured 3D floor plans, single unit and full development",
            "Photoreal interior and exterior stills with lighting studies",
            "Product rendering, turntables and exploded views",
            "Animated walkthroughs and camera flythroughs",
            "Character design, rigging and 2D motion graphics",
            "Listing size and print size exports of every deliverable",
        ],
        deliverableTimeline: "3 to 10 working days",
        order: 7,
        isActive: true,
        createdAt: "2025-01-12T09:00:00.000Z",
        updatedAt: "2026-09-11T09:00:00.000Z",
    },
    {
        _id: "6650a1f0c3d4e5f601000008",
        title: "Dashboard Development",
        slug: "dashboard-development",
        shortDescription:
            "Admin panels and operations consoles with role based access, audit trails and aggregation backed reporting that stays fast as the data grows.",
        detailedOverview: "<p>A dashboard is the screen a business actually spends its day in, and it is usually the screen nobody designed. We treat it as a product. The five things a user does a hundred times a day take one click, bulk actions exist, and nothing important hides behind a modal inside another modal.</p>\n<p>Underneath, every table paginates and filters on the server, every summary tile comes from an aggregation pipeline rather than from pulling ten thousand rows into the browser, and every destructive action is logged with who did it and when. That is the difference between a dashboard that feels fine in a demo and one that still feels fine at two million records.</p>",
        image: "",
        imageAlt: "",
        featuresList: [
            "Role and permission model designed with you before any screen",
            "Server side pagination, filtering and search on every table",
            "Summary tiles and charts driven by aggregation pipelines",
            "Audit log on every create, update and delete",
            "Bulk actions, CSV export and saved views",
            "Optimistic updates with a rollback when the server disagrees",
            "Light and dark themes, with keyboard navigation throughout",
        ],
        deliverableTimeline: "5 to 10 weeks",
        order: 8,
        isActive: true,
        createdAt: "2025-01-12T09:00:00.000Z",
        updatedAt: "2026-09-11T09:00:00.000Z",
    },
    {
        _id: "6650a1f0c3d4e5f601000009",
        title: "Mobile App Development",
        slug: "mobile-app-development",
        shortDescription:
            "Cross platform apps in React Native and Flutter, shipped through both stores with the release process written down for your own team.",
        detailedOverview: "<p>One codebase, two stores, and a release checklist your team can run without calling us. The work that stalls most mobile projects is handled as part of the build rather than discovered at the end: signing and provisioning, store metadata and screenshots, staged rollout, and crash reporting wired up from the first internal build.</p>\n<p>Offline first is the default assumption for this market. The app has to stay usable through a dead spot on the way home and reconcile cleanly when the connection returns, which is a data design decision made on day one and very expensive to retrofit later.</p>",
        image: "",
        imageAlt: "",
        featuresList: [
            "React Native or Flutter, chosen against your constraints and your team",
            "Offline first data layer with conflict resolution",
            "Push notifications, deep linking and in app updates",
            "Play Store and App Store submission handled end to end",
            "Crash and performance monitoring from the first internal build",
            "Over the air updates for changes that do not need a store review",
            "Signing keys and store accounts handed over in your name",
        ],
        deliverableTimeline: "10 to 16 weeks",
        order: 9,
        isActive: true,
        createdAt: "2025-01-12T09:00:00.000Z",
        updatedAt: "2026-09-11T09:00:00.000Z",
    },
];

/* ═══════════════════════════════════════════════════════════════
   2 · Projects — model: str-backend/src/models/Project.js
       (serviceTypes[] — see migration note at top of file)
   ═══════════════════════════════════════════════════════════════ */

const T = {
    next: { name: "Next.js", icon: "nextjs", category: "frontend" },
    react: { name: "React", icon: "react", category: "frontend" },
    rn: { name: "React Native", icon: "react", category: "mobile" },
    tw: { name: "Tailwind CSS", icon: "tailwind", category: "frontend" },
    node: { name: "Node.js", icon: "nodejs", category: "backend" },
    express: { name: "Express", icon: "express", category: "backend" },
    mongo: { name: "MongoDB", icon: "mongodb", category: "database" },
    pg: { name: "PostgreSQL", icon: "postgres", category: "database" },
    redis: { name: "Redis", icon: "redis", category: "database" },
    stripe: { name: "Stripe", icon: "stripe", category: "integration" },
    ssl: { name: "SSLCommerz", icon: "sslcommerz", category: "integration" },
    aws: { name: "AWS", icon: "aws", category: "devops" },
    vercel: { name: "Vercel", icon: "vercel", category: "devops" },
    docker: { name: "Docker", icon: "docker", category: "devops" },
    figma: { name: "Figma", icon: "figma", category: "design" },
    ps: { name: "Photoshop", icon: "photoshop", category: "design" },
    blender: { name: "Blender", icon: "blender", category: "design" },
    vray: { name: "V-Ray", icon: "vray", category: "design" },
    ga4: { name: "GA4", icon: "analytics", category: "analytics" },
};

export const projects = [
    {
        _id: "6651b2a1c3d4e5f602000001",
        title: "Paarel: Smart Retail Commerce",
        slug: "paarel-smart-retail-commerce",
        subtitle: "A multi-brand storefront rebuilt around a 1.4-second first paint",
        shortDescription:
            "Replatformed a stalling multi-brand retail store onto Next.js with a custom Node inventory service, cutting time-to-interactive by 61% on 3G.",
        fullCaseStudy: `<h2>The problem</h2><p>Paarel's storefront was a stitched-together theme carrying four brands and roughly 9,000 SKUs. Category pages took eleven seconds to become interactive on a mid-range Android device, and the checkout dropped roughly one order in six.</p>
<h2>What we changed</h2><p>We split the monolith in two: a Next.js App Router front end rendered on the server for every category and product route, and a Node inventory service that owns stock, pricing and promotion logic behind a single typed API. Product media moved to a CDN with AVIF negotiation.</p>
<h3>The checkout</h3><p>The old checkout lost orders at the payment redirect. We rebuilt it as a three-step flow with server-validated state, SSLCommerz and card handled through one abstraction, and an idempotency key on order creation so a double-tap never charges twice.</p>
<h2>Where it landed</h2><p>Time to interactive on a throttled 3G profile fell from 11.2s to 4.3s. Checkout completion rose 23% over the first eight weeks. Catalogue publishing, previously a developer task, moved to the merchandising team.</p>`,
        clientName: "Paarel Retail",
        projectDate: "2025-03-18T00:00:00.000Z",
        serviceTypes: ["website-development", "software-development", "graphic-design"],
        tags: ["E-Commerce", "Replatform", "Performance", "Retail"],
        techStack: [T.next, T.tw, T.node, T.express, T.mongo, T.redis, T.ssl, T.vercel],
        deliverables: [
            "Next.js storefront (48 routes)",
            "Node inventory & pricing service",
            "Merchandising admin dashboard",
            "Design system — 62 components",
            "Performance & SEO handover document",
        ],
        liveUrl: "https://paarel.com",
        githubUrl: "",
        figmaUrl: "",
        appStoreUrl: "",
        playStoreUrl: "",
        coverImage: "/websites/paarel-website.png",
        thumbnailImage: "/websites/paarel-website.png",
        galleryImages: [
            {
                url: "/websites/paarel-website.png",
                caption: "Storefront home, dark surface",
                layoutType: "full",
            },
            {
                url: "/websites/vera-website.png",
                caption: "Category rail and filter drawer",
                layoutType: "half",
            },
            {
                url: "/websites/zuzuva-website.png",
                caption: "Product detail, media gallery",
                layoutType: "half",
            },
        ],
        accentColor: "#1476BE",
        layoutStyle: "full-width",
        animationTrigger: "pinned-scroll",
        featured: true,
        displayOrder: 1,
        metaTitle: "Paarel — Smart Retail Commerce | STR Solutions Case Study",
        metaDescription:
            "How STR Solutions replatformed a four-brand, 9,000-SKU retail storefront onto Next.js and cut time-to-interactive by 61%.",
        ogImage: "/websites/paarel-website.png",
        createdAt: "2025-03-20T09:00:00.000Z",
        updatedAt: "2025-06-10T09:00:00.000Z",
    },
    {
        _id: "6651b2a1c3d4e5f602000002",
        title: "Innoel Technology",
        slug: "innoel-technology",
        subtitle: "A distributor catalogue that finally matches the warehouse",
        shortDescription:
            "Built a B2B electronics catalogue and quotation portal with live ERP stock sync, replacing a spreadsheet-and-email quoting process.",
        fullCaseStudy: `<h2>The problem</h2><p>Innoel quoted from a spreadsheet exported nightly. By mid-afternoon the prices were wrong, and the sales team was quoting stock that had already shipped.</p>
<h2>What we built</h2><p>A public catalogue with role-gated trade pricing, and a quotation portal where a logged-in buyer builds a basket that carries live stock and tier pricing pulled from the ERP every ten minutes. Quotes render to PDF and are versioned, so an amended quote never overwrites the one the client already has.</p>
<h2>Result</h2><p>Quote turnaround dropped from roughly a day to under twenty minutes, and stock disputes effectively stopped.</p>`,
        clientName: "Innoel Technology Ltd.",
        projectDate: "2024-11-02T00:00:00.000Z",
        serviceTypes: ["website-development", "software-development"],
        tags: ["B2B", "ERP Integration", "Catalogue", "Quotation"],
        techStack: [T.next, T.tw, T.node, T.express, T.pg, T.docker, T.aws],
        deliverables: [
            "Public product catalogue",
            "Role-gated trade pricing layer",
            "Quotation portal with PDF versioning",
            "ERP sync worker",
        ],
        liveUrl: "https://innoel.com",
        githubUrl: "",
        figmaUrl: "",
        appStoreUrl: "",
        playStoreUrl: "",
        coverImage: "/websites/innoel-website.png",
        thumbnailImage: "/websites/innoel-website.png",
        galleryImages: [
            {
                url: "/websites/innoel-website.png",
                caption: "Catalogue landing",
                layoutType: "full",
            },
            {
                url: "/websites/skhsourcing-website.png",
                caption: "Quotation builder",
                layoutType: "full",
            },
        ],
        accentColor: "#EF5A28",
        layoutStyle: "split",
        animationTrigger: "fade-up",
        featured: true,
        displayOrder: 2,
        metaTitle: "Innoel Technology — B2B Catalogue & Quotation Portal",
        metaDescription:
            "A distributor catalogue with live ERP stock sync and versioned PDF quoting, built by STR Solutions Ltd.",
        ogImage: "/websites/innoel-website.png",
        createdAt: "2024-11-05T09:00:00.000Z",
        updatedAt: "2025-05-01T09:00:00.000Z",
    },
    {
        _id: "6651b2a1c3d4e5f602000003",
        title: "Tiger Den Tourism",
        slug: "tiger-den-tourism",
        subtitle: "Booking for the Sundarbans, built for a patchy connection",
        shortDescription:
            "A tour-operator booking platform with seat inventory, partial payments and an itinerary builder that works offline on a boat.",
        fullCaseStudy: `<h2>Context</h2><p>Tiger Den runs multi-day Sundarbans expeditions. Guides on the water needed the manifest; head office needed live seat counts; travellers needed to pay a deposit now and the balance later.</p>
<h2>Build</h2><p>Seat inventory is held server-side with a short soft-lock during checkout so two people cannot buy the last berth. Payments run through SSLCommerz with a scheduled-balance record rather than a second manual invoice. The guide view is a cached PWA — the manifest is readable with no signal.</p>
<h2>Outcome</h2><p>Direct bookings grew from a small fraction of departures to the majority, and the manual reconciliation spreadsheet was retired.</p>`,
        clientName: "Tiger Den Tourism",
        projectDate: "2025-01-24T00:00:00.000Z",
        serviceTypes: ["website-development", "graphic-design", "digital-marketing"],
        tags: ["Travel", "Booking Engine", "PWA", "Payments"],
        techStack: [T.next, T.tw, T.node, T.mongo, T.ssl, T.ga4, T.vercel],
        deliverables: [
            "Booking engine with soft-lock seat inventory",
            "Deposit and scheduled-balance payments",
            "Offline-capable guide manifest (PWA)",
            "SEO foundation and landing pages",
        ],
        liveUrl: "https://tigerdentourism.com",
        githubUrl: "",
        figmaUrl: "",
        appStoreUrl: "",
        playStoreUrl: "",
        coverImage: "/websites/tigerdentourism-website.png",
        thumbnailImage: "/websites/tigerdentourism-website.png",
        galleryImages: [
            {
                url: "/websites/tigerdentourism-website.png",
                caption: "Departure detail page",
                layoutType: "full",
            },
            {
                url: "/websites/riverside-website.png",
                caption: "Itinerary builder",
                layoutType: "half",
            },
            {
                url: "/websites/the-foxes-website.png",
                caption: "Checkout, deposit step",
                layoutType: "half",
            },
        ],
        accentColor: "#57B04A",
        layoutStyle: "bento",
        animationTrigger: "fade-up",
        featured: true,
        displayOrder: 3,
        metaTitle: "Tiger Den Tourism — Sundarbans Booking Platform",
        metaDescription:
            "Seat inventory, partial payments and an offline guide manifest for a Sundarbans tour operator.",
        ogImage: "/websites/tigerdentourism-website.png",
        createdAt: "2025-01-28T09:00:00.000Z",
        updatedAt: "2025-06-12T09:00:00.000Z",
    },
    {
        _id: "6651b2a1c3d4e5f602000004",
        title: "Torgeson Field Operations",
        slug: "torgeson-field-operations",
        subtitle: "Taking a 40-person field team off paper",
        shortDescription:
            "A React Native job-dispatch app with offline sync, photo evidence capture and a supervisor dashboard for scheduling.",
        fullCaseStudy: `<h2>The problem</h2><p>Job sheets went out on paper each morning and came back — sometimes — at the end of the week. Invoicing lagged the work by up to a month.</p>
<h2>The app</h2><p>Technicians get the day's jobs on their phone, capture signatures and photo evidence, and mark completion. Everything queues locally and syncs when signal returns; conflicts resolve last-write-wins per field, not per record, so two partial edits merge instead of clobbering.</p>
<h2>Result</h2><p>Invoicing moved from monthly to same-week. Disputed jobs fell sharply once every completion carried a timestamped photo.</p>`,
        clientName: "Torgeson Services",
        projectDate: "2024-08-14T00:00:00.000Z",
        serviceTypes: ["mobile-app-development", "software-development", "graphic-design"],
        tags: ["Field Service", "Offline First", "Dispatch", "Android"],
        techStack: [T.rn, T.node, T.express, T.mongo, T.redis, T.aws],
        deliverables: [
            "React Native app — Android & iOS",
            "Offline sync engine with field-level merge",
            "Supervisor scheduling dashboard",
            "Photo evidence pipeline with S3 lifecycle rules",
        ],
        liveUrl: "",
        githubUrl: "",
        figmaUrl: "https://figma.com/file/str-torgeson",
        appStoreUrl: "https://apps.apple.com/app/id0000000000",
        playStoreUrl: "https://play.google.com/store/apps/details?id=com.torgeson.field",
        coverImage: "/websites/torgeson-website.png",
        thumbnailImage: "/websites/torgeson-website.png",
        galleryImages: [
            {
                url: "/websites/torgeson-website.png",
                caption: "Supervisor dashboard",
                layoutType: "full",
            },
            { url: "/PPhoto.png", caption: "Technician job view", layoutType: "grid" },
            { url: "/websites/teds-website.png", caption: "Evidence capture", layoutType: "grid" },
            { url: "/websites/vera-website.png", caption: "Scheduling board", layoutType: "grid" },
        ],
        accentColor: "#1476BE",
        layoutStyle: "split",
        animationTrigger: "3d-tilt",
        featured: true,
        displayOrder: 4,
        metaTitle: "Torgeson Field Operations — Offline-First Dispatch App",
        metaDescription:
            "A React Native dispatch app with offline sync and photo evidence for a 40-person field team.",
        ogImage: "/websites/torgeson-website.png",
        createdAt: "2024-08-20T09:00:00.000Z",
        updatedAt: "2025-04-18T09:00:00.000Z",
    },
    {
        _id: "6651b2a1c3d4e5f602000005",
        title: "Riverside Residences: Visualization Suite",
        slug: "riverside-residences-visualization-suite",
        subtitle: "Selling forty units off a plan set",
        shortDescription:
            "Full 2D/3D visualization package — coloured floor plans, interior stills and a walkthrough film — produced for a pre-launch sales campaign.",
        fullCaseStudy: `<h2>Brief</h2><p>Riverside needed to sell forty units before the structure topped out. All that existed was a CAD plan set and a materials schedule.</p>
<h2>Production</h2><p>We produced monochrome and coloured 2D plans for the brochure, textured 3D plans for the listing portals, six interior stills per unit type, an exterior dusk study, and a ninety-second walkthrough. Everything was delivered in print CMYK and web sRGB from the same master.</p>
<h2>Outcome</h2><p>The sales team ran the entire pre-launch on this package with no site photography at all.</p>`,
        clientName: "Riverside Developments",
        projectDate: "2025-04-30T00:00:00.000Z",
        serviceTypes: ["2d-3d-design-and-animation", "graphic-design"],
        tags: ["Real Estate", "3D Render", "Floor Plan", "Walkthrough"],
        techStack: [T.blender, T.vray, T.ps],
        deliverables: [
            "12 coloured 2D floor plans",
            "12 textured 3D floor plans",
            "48 interior stills",
            "Exterior dusk study",
            "90-second walkthrough film",
        ],
        liveUrl: "",
        githubUrl: "",
        figmaUrl: "",
        appStoreUrl: "",
        playStoreUrl: "",
        coverImage: "/2d-3d/3d-rendering.jpg",
        thumbnailImage: "/2d-3d/3d-floor-plan.jpg",
        galleryImages: [
            { url: "/2d-3d/3d-rendering.jpg", caption: "Exterior, dusk study", layoutType: "full" },
            {
                url: "/2d-3d/2d-floor-plan-colour.png",
                caption: "Coloured 2D plan — Type A",
                layoutType: "grid",
            },
            {
                url: "/2d-3d/2d-floor-plan-mono.png",
                caption: "Monochrome plan for print",
                layoutType: "grid",
            },
            {
                url: "/2d-3d/2d-floor-plan-dual-unit.png",
                caption: "Dual-unit floor plate",
                layoutType: "grid",
            },
            { url: "/2d-3d/3d-interior.jpg", caption: "Living room, Type B", layoutType: "half" },
            {
                url: "/2d-3d/exterior-lighting.jpg",
                caption: "Facade lighting study",
                layoutType: "half",
            },
            {
                url: "/2d-3d/3d-animation-video.jpg",
                caption: "Walkthrough film still",
                layoutType: "full",
            },
        ],
        accentColor: "#EF5A28",
        layoutStyle: "bento",
        animationTrigger: "pinned-scroll",
        featured: true,
        displayOrder: 5,
        metaTitle: "Riverside Residences — 2D & 3D Visualization Suite",
        metaDescription:
            "Coloured floor plans, interior stills and a walkthrough film produced for a forty-unit pre-launch campaign.",
        ogImage: "/2d-3d/3d-rendering.jpg",
        createdAt: "2025-05-04T09:00:00.000Z",
        updatedAt: "2025-06-20T09:00:00.000Z",
    },
    {
        _id: "6651b2a1c3d4e5f602000006",
        title: "SKH Sourcing: Catalogue Production",
        slug: "skh-sourcing-catalogue-production",
        subtitle: "11,400 images through a single QC gate",
        shortDescription:
            "Season-long apparel post-production: clipping paths, ghost mannequin composites and marketplace exports on a 48-hour SLA.",
        fullCaseStudy: `<h2>Scope</h2><p>Two seasons, 11,400 raw frames, four marketplace specifications, and a hard weekly drop date.</p>
<h2>How it ran</h2><p>Every frame passed through a fixed pipeline — hand-drawn path, colour match against the physical swatch, ghost-mannequin composite where required, shadow rebuild, then a QC gate before batching. Rejects went back into the queue with an annotated note rather than a verbal comment.</p>
<h2>Result</h2><p>Rejection rate at the client's end settled under 1.2%, and no weekly drop was missed.</p>`,
        clientName: "SKH Sourcing",
        projectDate: "2025-02-10T00:00:00.000Z",
        serviceTypes: ["graphic-design"],
        tags: ["Apparel", "Post Production", "Ghost Mannequin", "High Volume"],
        techStack: [T.ps],
        deliverables: [
            "11,400 hand-drawn clipping paths",
            "3,200 ghost-mannequin composites",
            "Shadow and reflection rebuild",
            "Four marketplace export presets",
        ],
        liveUrl: "https://skhsourcing.com",
        githubUrl: "",
        figmaUrl: "",
        appStoreUrl: "",
        playStoreUrl: "",
        coverImage: "/graphics/invisible-mannequin.jpg",
        thumbnailImage: "/graphics/clipping-path.jpg",
        galleryImages: [
            {
                url: "/graphics/invisible-mannequin.jpg",
                caption: "Ghost mannequin composite",
                layoutType: "half",
            },
            { url: "/graphics/clipping-path.jpg", caption: "Hand-drawn path", layoutType: "half" },
            {
                url: "/graphics/image-masking.jpg",
                caption: "Channel mask — knitwear",
                layoutType: "grid",
            },
            { url: "/graphics/retouching.jpg", caption: "Retouch pass", layoutType: "grid" },
            {
                url: "/graphics/shadows-reflection.jpg",
                caption: "Shadow rebuild",
                layoutType: "grid",
            },
            {
                url: "/graphics/color-processing.jpg",
                caption: "Colour match to swatch",
                layoutType: "grid",
            },
        ],
        accentColor: "#57B04A",
        layoutStyle: "bento",
        animationTrigger: "fade-up",
        featured: false,
        displayOrder: 6,
        metaTitle: "SKH Sourcing — Apparel Catalogue Post-Production",
        metaDescription:
            "11,400 apparel frames through clipping path, ghost mannequin and marketplace export on a 48-hour SLA.",
        ogImage: "/graphics/invisible-mannequin.jpg",
        createdAt: "2025-02-14T09:00:00.000Z",
        updatedAt: "2025-05-30T09:00:00.000Z",
    },
    {
        _id: "6651b2a1c3d4e5f602000007",
        title: "London Youth Foundation",
        slug: "london-youth-foundation",
        subtitle: "A donation flow that stops asking twice",
        shortDescription:
            "Charity site rebuild with a single-screen donation flow, Gift Aid capture and a programme directory the team edits themselves.",
        fullCaseStudy: `<h2>The problem</h2><p>The old donation journey ran across four screens and asked for the amount twice. Roughly two-thirds of people who started it never finished.</p>
<h2>Rebuild</h2><p>One screen: amount, frequency, Gift Aid, pay. Card and wallet handled through Stripe with Apple Pay and Google Pay surfaced first on mobile. The programme directory moved into a small admin so the outreach team publishes without a developer.</p>
<h2>Result</h2><p>Completion on the donation flow roughly doubled, and average gift size rose once monthly giving was made the default option.</p>`,
        clientName: "London Youth Foundation",
        projectDate: "2024-06-11T00:00:00.000Z",
        serviceTypes: ["website-development", "graphic-design"],
        tags: ["Nonprofit", "Donations", "Accessibility", "Stripe"],
        techStack: [T.next, T.tw, T.node, T.mongo, T.stripe, T.vercel],
        deliverables: [
            "Single-screen donation flow",
            "Gift Aid declaration capture",
            "Programme directory + admin",
            "WCAG 2.2 AA audit and remediation",
        ],
        liveUrl: "",
        githubUrl: "",
        figmaUrl: "https://figma.com/file/str-lyf",
        appStoreUrl: "",
        playStoreUrl: "",
        coverImage: "/websites/london-youth-website.png",
        thumbnailImage: "/websites/london-youth-website.png",
        galleryImages: [
            { url: "/websites/london-youth-website.png", caption: "Home", layoutType: "full" },
            {
                url: "/websites/the-foxes-website.png",
                caption: "Donation screen",
                layoutType: "half",
            },
            {
                url: "/websites/podcast-website.png",
                caption: "Programme directory",
                layoutType: "half",
            },
        ],
        accentColor: "#1476BE",
        layoutStyle: "full-width",
        animationTrigger: "fade-up",
        featured: false,
        displayOrder: 7,
        metaTitle: "London Youth Foundation — Donation Flow Rebuild",
        metaDescription:
            "A single-screen donation journey with Gift Aid capture that doubled completion rate.",
        ogImage: "/websites/london-youth-website.png",
        createdAt: "2024-06-18T09:00:00.000Z",
        updatedAt: "2025-03-09T09:00:00.000Z",
    },
    {
        _id: "6651b2a1c3d4e5f602000008",
        title: "Terea: Brand and Growth Campaign",
        slug: "terea-brand-growth-campaign",
        subtitle: "Fixing the funnel before spending on it",
        shortDescription:
            "Technical SEO remediation, landing-page system and paid social build that cut cost per qualified lead by 44%.",
        fullCaseStudy: `<h2>Starting point</h2><p>Spend was climbing and leads were flat. The audit found 1,100 indexed thin pages, a broken canonical strategy, and conversion tracking firing on page view rather than on form submission.</p>
<h2>Work</h2><p>We pruned and consolidated the index, rebuilt the landing pages as a composable section system so the marketing team could ship a variant in an hour, and moved conversion tracking server-side.</p>
<h2>Result</h2><p>Cost per qualified lead fell 44% over the following quarter, on flat spend.</p>`,
        clientName: "Terea",
        projectDate: "2025-05-19T00:00:00.000Z",
        serviceTypes: ["digital-marketing", "website-development"],
        tags: ["SEO", "Paid Social", "Landing Pages", "Analytics"],
        techStack: [T.next, T.tw, T.ga4, T.vercel],
        deliverables: [
            "Technical SEO audit + remediation",
            "Composable landing-page section system",
            "Server-side conversion tracking",
            "Monthly pipeline reporting dashboard",
        ],
        liveUrl: "https://terea.example",
        githubUrl: "",
        figmaUrl: "",
        appStoreUrl: "",
        playStoreUrl: "",
        coverImage: "/websites/terea-website.png",
        thumbnailImage: "/websites/terea-website.png",
        galleryImages: [
            {
                url: "/websites/terea-website.png",
                caption: "Landing page system",
                layoutType: "full",
            },
            { url: "/digital/seo-audit-report.jpg", caption: "Audit extract", layoutType: "half" },
            {
                url: "/digital/facebook-ads-campaign.jpg",
                caption: "Campaign structure",
                layoutType: "half",
            },
        ],
        accentColor: "#EF5A28",
        layoutStyle: "split",
        animationTrigger: "fade-up",
        featured: false,
        displayOrder: 8,
        metaTitle: "Terea — SEO Remediation & Paid Growth",
        metaDescription:
            "Index pruning, a composable landing-page system and server-side tracking that cut CPQL by 44%.",
        ogImage: "/websites/terea-website.png",
        createdAt: "2025-05-24T09:00:00.000Z",
        updatedAt: "2025-07-01T09:00:00.000Z",
    },
    {
        _id: "6651b2a1c3d4e5f602000009",
        title: "Australian Cosmetic Clinic",
        slug: "australian-cosmetic-clinic",
        subtitle: "Consultation booking, without the phone tag",
        shortDescription:
            "Clinic site with practitioner-level availability, pre-consultation intake forms and a treatment library.",
        fullCaseStudy: `<h2>Brief</h2><p>Every consultation started with three phone calls: availability, intake questions, then confirmation. The front desk spent most of its day on it.</p>
<h2>Build</h2><p>Availability is modelled per practitioner and per treatment duration, not as a flat calendar. Intake runs as a conditional form before payment, so the practitioner has the medical history before the patient arrives.</p>
<h2>Result</h2><p>Front-desk call volume dropped by roughly half within a month, and no-shows fell once deposits were attached to bookings.</p>`,
        clientName: "Australian Cosmetic Clinic",
        projectDate: "2024-09-27T00:00:00.000Z",
        serviceTypes: ["website-development", "graphic-design"],
        tags: ["Healthcare", "Booking", "Forms", "Compliance"],
        techStack: [T.next, T.tw, T.node, T.mongo, T.stripe],
        deliverables: [
            "Per-practitioner availability engine",
            "Conditional pre-consultation intake",
            "Treatment library with structured data",
            "Deposit-backed booking",
        ],
        liveUrl: "",
        githubUrl: "",
        figmaUrl: "",
        appStoreUrl: "",
        playStoreUrl: "",
        coverImage: "/websites/australian-cosmetic-website.png",
        thumbnailImage: "/websites/australian-cosmetic-website.png",
        galleryImages: [
            {
                url: "/websites/australian-cosmetic-website.png",
                caption: "Clinic home",
                layoutType: "full",
            },
            { url: "/websites/vera-website.png", caption: "Booking step", layoutType: "half" },
            { url: "/websites/teds-website.png", caption: "Treatment library", layoutType: "half" },
        ],
        accentColor: "#57B04A",
        layoutStyle: "full-width",
        animationTrigger: "fade-up",
        featured: false,
        displayOrder: 9,
        metaTitle: "Australian Cosmetic Clinic — Consultation Booking Platform",
        metaDescription:
            "Practitioner-level availability, conditional intake and deposit-backed booking for a cosmetic clinic.",
        ogImage: "/websites/australian-cosmetic-website.png",
        createdAt: "2024-10-02T09:00:00.000Z",
        updatedAt: "2025-02-11T09:00:00.000Z",
    },
    {
        _id: "6651b2a1c3d4e5f60200000a",
        title: "The Foxes: Studio Identity and Site",
        slug: "the-foxes-studio-identity-and-site",
        subtitle: "A portfolio that loads before the client loses interest",
        shortDescription:
            "Identity, design system and a static-first portfolio site for a production studio, shipped in five weeks.",
        fullCaseStudy: `<h2>Brief</h2><p>A production studio with excellent work and a site that took nine seconds to show any of it.</p>
<h2>Approach</h2><p>Identity first — a tighter grotesque, a restrained palette, and a grid that lets a single still carry a whole screen. Then a static-first build: every case page pre-rendered, video posters inlined, motion reserved for two moments instead of every scroll.</p>
<h2>Result</h2><p>Largest contentful paint settled at 1.1s. Enquiries through the site tripled in the first quarter.</p>`,
        clientName: "The Foxes Studio",
        projectDate: "2025-06-08T00:00:00.000Z",
        serviceTypes: ["graphic-design", "website-development"],
        tags: ["Identity", "Portfolio", "Design System", "Static"],
        techStack: [T.figma, T.next, T.tw, T.vercel],
        deliverables: [
            "Visual identity and type system",
            "Design system — 40 components",
            "Static-first portfolio build",
            "Asset pipeline and export presets",
        ],
        liveUrl: "",
        githubUrl: "",
        figmaUrl: "https://figma.com/file/str-foxes",
        appStoreUrl: "",
        playStoreUrl: "",
        coverImage: "/websites/the-foxes-website.png",
        thumbnailImage: "/websites/the-foxes-website.png",
        galleryImages: [
            { url: "/websites/the-foxes-website.png", caption: "Home", layoutType: "full" },
            { url: "/video/all-video.jpg", caption: "Case study page", layoutType: "half" },
            { url: "/video/real-estate-video.jpg", caption: "Reel index", layoutType: "half" },
        ],
        accentColor: "#1476BE",
        layoutStyle: "bento",
        animationTrigger: "3d-tilt",
        featured: false,
        displayOrder: 10,
        metaTitle: "The Foxes — Studio Identity & Portfolio Site",
        metaDescription:
            "Identity, design system and a static-first portfolio build delivered in five weeks.",
        ogImage: "/websites/the-foxes-website.png",
        createdAt: "2025-06-12T09:00:00.000Z",
        updatedAt: "2025-07-15T09:00:00.000Z",
    },
];

/* ═══════════════════════════════════════════════════════════════
   3 · Team — model: str-backend/src/models/Team.js
       ⚑ Names and designations are placeholders derived from the
       image filenames in /public. Replace from the legacy folder.
   ═══════════════════════════════════════════════════════════════ */

export const team = [
    {
        _id: "6652c3b2c3d4e5f603000001",
        name: "Md. Shahriar Rahman", // ⚑
        designation: "Founder & Chief Executive Officer",
        bio: "Started STR in 2024 with two contracts and a rented desk. Still reads every proposal that goes out.",
        image: "/ceo.jpg",
        socialLinks: { linkedin: "https://linkedin.com/in/", github: "", twitter: "" },
        displayOrder: 1,
        isActive: true,
    },
    {
        _id: "6652c3b2c3d4e5f603000002",
        name: "Arif Hossain", // ⚑
        designation: "Head of Engineering",
        bio: "Owns architecture reviews and the deployment pipeline. Argues for the boring option and is usually right.",
        image: "/arif.jpg",
        socialLinks: {
            linkedin: "https://linkedin.com/in/",
            github: "https://github.com/",
            twitter: "",
        },
        displayOrder: 2,
        isActive: true,
    },
    {
        _id: "6652c3b2c3d4e5f603000003",
        name: "Sharif Ahmed", // ⚑
        designation: "Lead Product Designer",
        bio: "Runs research and the design system. Will not hand over a screen without its empty and error states.",
        image: "/sharif.jpg",
        socialLinks: { linkedin: "https://linkedin.com/in/", github: "", twitter: "" },
        displayOrder: 3,
        isActive: true,
    },
    {
        _id: "6652c3b2c3d4e5f603000004",
        name: "Tamim Iqbal", // ⚑
        designation: "Senior Full-Stack Engineer",
        bio: "Node, MongoDB and the aggregation pipelines nobody else wants to write.",
        image: "/tamim.jpeg",
        socialLinks: {
            linkedin: "https://linkedin.com/in/",
            github: "https://github.com/",
            twitter: "",
        },
        displayOrder: 4,
        isActive: true,
    },
    {
        _id: "6652c3b2c3d4e5f603000005",
        name: "Touhidul Islam", // ⚑
        designation: "Mobile Engineering Lead",
        bio: "React Native and Flutter. Has shipped through both store review processes more times than he'd like.",
        image: "/touhid.jpeg",
        socialLinks: {
            linkedin: "https://linkedin.com/in/",
            github: "https://github.com/",
            twitter: "",
        },
        displayOrder: 5,
        isActive: true,
    },
    {
        _id: "6652c3b2c3d4e5f603000006",
        name: "Nusrat Jahan", // ⚑
        designation: "Data Scientist",
        bio: "Turns operational exhaust into forecasting the client will actually act on.",
        image: "/datascientis.jpg",
        socialLinks: { linkedin: "https://linkedin.com/in/", github: "", twitter: "" },
        displayOrder: 6,
        isActive: true,
    },
    {
        _id: "6652c3b2c3d4e5f603000007",
        name: "S. M. Kabir", // ⚑
        designation: "Head of Visual Production",
        bio: "Runs the retouching floor and the 3D visualization queue. Owns the QC gate.",
        image: "/sm.jpeg",
        socialLinks: { linkedin: "https://linkedin.com/in/", github: "", twitter: "" },
        displayOrder: 7,
        isActive: true,
    },
    {
        _id: "6652c3b2c3d4e5f603000008",
        name: "Mahmudul Hasan", // ⚑
        designation: "Client Partner",
        bio: "First call, scoping and the awkward conversations about timeline. Prefers to have them early.",
        image: "/mhp.png",
        socialLinks: { linkedin: "https://linkedin.com/in/", github: "", twitter: "" },
        displayOrder: 8,
        isActive: true,
    },
];

/* ═══════════════════════════════════════════════════════════════
   4 · Testimonials — model: str-backend/src/models/Testimonial.js
   ═══════════════════════════════════════════════════════════════ */

export const testimonials = [
    {
        _id: "6653d4c3c3d4e5f604000001",
        clientName: "Rehana Chowdhury", // ⚑
        clientDesignation: "Head of E-Commerce",
        companyName: "Paarel Retail",
        clientAvatar: "",
        rating: 5,
        reviewText:
            "They rewrote the parts of our storefront that were actually broken and left alone the parts that weren't. Six weeks in we had a checkout that stopped losing orders. The handover document is still what our new developers read on day one.",
        projectRef: "6651b2a1c3d4e5f602000001",
        isFeatured: true,
        createdAt: "2025-05-02T09:00:00.000Z",
    },
    {
        _id: "6653d4c3c3d4e5f604000002",
        clientName: "David Kettering", // ⚑
        clientDesignation: "Operations Director",
        companyName: "Torgeson Services",
        clientAvatar: "",
        rating: 5,
        reviewText:
            "We'd been told twice before that offline sync was 'basically impossible' for our use case. STR asked what happens when two technicians edit the same job, built for that answer, and it has held up for a year.",
        projectRef: "6651b2a1c3d4e5f602000004",
        isFeatured: true,
        createdAt: "2025-01-19T09:00:00.000Z",
    },
    {
        _id: "6653d4c3c3d4e5f604000003",
        clientName: "Farhana Karim", // ⚑
        clientDesignation: "Marketing Lead",
        companyName: "Riverside Developments",
        clientAvatar: "",
        rating: 5,
        reviewText:
            "Forty units sold off a plan set and their renders. We didn't take a single site photograph during the pre-launch. Turnaround was quicker than the agency we used before, and the print files came back correct the first time.",
        projectRef: "6651b2a1c3d4e5f602000005",
        isFeatured: true,
        createdAt: "2025-06-28T09:00:00.000Z",
    },
    {
        _id: "6653d4c3c3d4e5f604000004",
        clientName: "Imran Sabet", // ⚑
        clientDesignation: "Managing Director",
        companyName: "Innoel Technology Ltd.",
        clientAvatar: "",
        rating: 5,
        reviewText:
            "Quoting used to take a day and half of it was checking whether the stock number was real. Now it's twenty minutes and nobody argues about it. That's the whole review.",
        projectRef: "6651b2a1c3d4e5f602000002",
        isFeatured: true,
        createdAt: "2025-02-07T09:00:00.000Z",
    },
    {
        _id: "6653d4c3c3d4e5f604000005",
        clientName: "Amelia Rowe", // ⚑
        clientDesignation: "Director of Fundraising",
        companyName: "London Youth Foundation",
        clientAvatar: "",
        rating: 5,
        reviewText:
            "They pushed back on our brief, which nobody had done before. The donation flow ended up simpler than what we asked for and roughly twice as many people finish it.",
        projectRef: "6651b2a1c3d4e5f602000007",
        isFeatured: false,
        createdAt: "2024-09-14T09:00:00.000Z",
    },
];

/* ═══════════════════════════════════════════════════════════════
   5 · Blogs — model: str-backend/src/models/Blog.js
       `author` is shown in its *populated* form (the public feed
       controller populates name/avatar/role and nothing else).
   ═══════════════════════════════════════════════════════════════ */

const AUTHOR_ARIF = {
    _id: "6652c3b2c3d4e5f603000002",
    name: "Arif Hossain",
    avatar: "/arif.jpg",
    role: "Head of Engineering",
};
const AUTHOR_SHARIF = {
    _id: "6652c3b2c3d4e5f603000003",
    name: "Sharif Ahmed",
    avatar: "/sharif.jpg",
    role: "Lead Product Designer",
};
const AUTHOR_SM = {
    _id: "6652c3b2c3d4e5f603000007",
    name: "S. M. Kabir",
    avatar: "/sm.jpeg",
    role: "Head of Visual Production",
};

export const blogs = [
    {
        _id: "6654e5d4c3d4e5f605000001",
        title: "Your Next.js site is fast on your laptop and slow on your customer's phone",
        slug: "fast-on-your-laptop-slow-on-your-customers-phone",
        excerpt:
            "Most Bangladeshi traffic arrives on a mid-range Android over a congested network. Here is what that actually changes about how you build.",
        content: `<p>Every performance conversation we have starts the same way: someone opens the site on a MacBook over office fibre, sees it paint instantly, and concludes there is no problem. Then we open it on a three-year-old Android on a shared mobile connection and the same page takes nine seconds.</p>
<h2>The device is the bottleneck, not the network</h2><p>Bandwidth in Dhaka is fine. What is not fine is the CPU on the median device parsing 900KB of JavaScript. A modern phone chews through that in 300ms; a mid-range one takes 2.5 seconds, and it does it <strong>before</strong> anything on screen becomes clickable.</p>
<h2>Three changes that move the number</h2>
<ul><li><strong>Server-render anything that carries content.</strong> If a route exists for SEO, it should not need JavaScript to show text.</li><li><strong>Budget your JS per route, not per site.</strong> A homepage carrying the checkout bundle is the most common cause we find.</li><li><strong>Test on a throttled profile in CI.</strong> If the regression is not caught by a pipeline it will be caught by a customer.</li></ul>
<h2>What we do on every build</h2><p>We agree a Core Web Vitals budget in week one and fail the build when a branch breaks it. It is an unpopular meeting and it saves the project.</p>`,
        coverImage: "/websites/paarel-website.png",
        author: AUTHOR_ARIF,
        category: "Engineering",
        tags: ["Performance", "Next.js", "Core Web Vitals", "Mobile"],
        viewCount: 2140,
        isPublished: true,
        publishedAt: "2025-07-22T06:00:00.000Z",
        metaTitle: "Why your Next.js site is slow on real phones",
        metaDescription:
            "Device CPU, not bandwidth, is what makes a Next.js site slow in Bangladesh. Three changes that actually move the number.",
        readingMinutes: 6,
        createdAt: "2025-07-22T06:00:00.000Z",
        updatedAt: "2025-07-22T06:00:00.000Z",
    },
    {
        _id: "6654e5d4c3d4e5f605000002",
        title: "Design systems die in the handover, not in Figma",
        slug: "design-systems-die-in-the-handover",
        excerpt:
            "A component library with no error states, no empty states and no written responsive behaviour is a mood board with a version number.",
        content: `<p>Every failed design system we have inherited failed at the same seam: the file was beautiful and the handover was a conversation. Six months later the codebase has four button variants that were never designed and two spacing scales.</p>
<h2>What has to be in the file</h2><ul><li>Every interactive state, drawn — not described in a comment</li><li>Empty, loading, error and permission-denied states for anything that fetches</li><li>Tokens exported as CSS custom properties, not hex values in a table</li><li>Responsive behaviour written as rules, not implied by three artboards</li></ul>
<h2>The test</h2><p>Hand the file to a developer who was not in the project. If they have to ask a question before they can build the card, the system is not finished.</p>
<blockquote>The expensive part of a redesign is the ambiguity handed to engineering, not the pixels.</blockquote>`,
        coverImage: "/websites/the-foxes-website.png",
        author: AUTHOR_SHARIF,
        category: "Design",
        tags: ["Design Systems", "Figma", "Handover", "Tokens"],
        viewCount: 1685,
        isPublished: true,
        publishedAt: "2025-06-30T06:00:00.000Z",
        metaTitle: "Design systems die in the handover",
        metaDescription:
            "What has to be in a component library before it can survive contact with a codebase.",
        readingMinutes: 5,
        createdAt: "2025-06-30T06:00:00.000Z",
        updatedAt: "2025-06-30T06:00:00.000Z",
    },
    {
        _id: "6654e5d4c3d4e5f605000003",
        title: "Offline-first is a data model decision, not a caching trick",
        slug: "offline-first-is-a-data-model-decision",
        excerpt:
            "Service workers are the easy half. The hard half is deciding what happens when two people edit the same record on two dead connections.",
        content: `<p>Teams ask for offline support and mean "cache the pages". That is fine for a brochure site. For a field application it is not close to enough, because the interesting question is not reading — it is writing.</p>
<h2>The question that decides your architecture</h2><p>Two technicians open job #4021. Both lose signal. One marks it complete; the other uploads a photo and changes the customer's phone number. Both reconnect. What is true?</p>
<h2>Three answers, in increasing cost</h2><ul><li><strong>Last write wins, per record.</strong> Cheap, and it silently destroys one person's work.</li><li><strong>Last write wins, per field.</strong> More bookkeeping, merges cleanly in the common case. This is where most field apps should land.</li><li><strong>CRDTs or an operation log.</strong> Correct under any ordering, and a genuine engineering project on its own.</li></ul>
<p>Pick before you build the sync layer, not after the first support ticket.</p>`,
        coverImage: "/websites/torgeson-website.png",
        author: AUTHOR_ARIF,
        category: "Engineering",
        tags: ["Offline First", "React Native", "Sync", "Architecture"],
        viewCount: 1203,
        isPublished: true,
        publishedAt: "2025-05-14T06:00:00.000Z",
        metaTitle: "Offline-first is a data model decision",
        metaDescription:
            "Conflict resolution, not caching, is what makes an offline-capable app work in the field.",
        readingMinutes: 7,
        createdAt: "2025-05-14T06:00:00.000Z",
        updatedAt: "2025-05-14T06:00:00.000Z",
    },
    {
        _id: "6654e5d4c3d4e5f605000004",
        title: "What 11,400 product images taught us about QC",
        slug: "what-11400-product-images-taught-us-about-qc",
        excerpt:
            "At catalogue scale, the difference between a 1% and a 6% rejection rate is not skill. It is whether feedback is written down.",
        content: `<p>Volume post-production looks like a skill problem and behaves like a process problem. Two retouchers of identical ability will produce wildly different rejection rates depending on how corrections reach them.</p>
<h2>Verbal feedback does not survive the night shift</h2><p>A note said across a desk at 4pm is gone by the next batch. We moved every rejection to an annotated frame with the reason attached — colour off swatch, path too tight at the collar, shadow direction inconsistent — and the same retoucher's rate improved without any additional training.</p>
<h2>The gate matters more than the pipeline</h2><p>One QC pass before batching, done by someone who did not do the retouching, catches the overwhelming majority of what a client would otherwise reject. It costs a fraction of a re-delivery.</p>`,
        coverImage: "/graphics/retouching.jpg",
        author: AUTHOR_SM,
        category: "Production",
        tags: ["Post Production", "QC", "Process", "E-Commerce"],
        viewCount: 874,
        isPublished: true,
        publishedAt: "2025-04-02T06:00:00.000Z",
        metaTitle: "What 11,400 product images taught us about QC",
        metaDescription:
            "Why written, annotated rejection feedback beats talent when you are retouching at catalogue scale.",
        readingMinutes: 4,
        createdAt: "2025-04-02T06:00:00.000Z",
        updatedAt: "2025-04-02T06:00:00.000Z",
    },
    {
        _id: "6654e5d4c3d4e5f605000005",
        title: "Stop measuring impressions. Measure cost per qualified lead.",
        slug: "stop-measuring-impressions",
        excerpt:
            "If your reporting dashboard cannot answer what a closed deal cost to acquire, it is a screensaver.",
        content: `<p>Marketing reports we inherit tend to lead with reach, engagement and click-through. None of those survive a conversation with a finance director, because none of them convert into a number that can be compared against revenue.</p>
<h2>Wire the tracking to the outcome</h2><p>Conversion events should fire on the thing you want — a qualified form submission, a booked call — and they should fire server-side so an ad blocker does not silently delete a third of your data.</p>
<h2>Then prune ruthlessly</h2><p>Once cost per qualified lead is visible per campaign, the decision usually makes itself. In most accounts we audit, a minority of campaigns produce nearly all of the qualified pipeline.</p>`,
        coverImage: "/digital/seo-audit-report.jpg",
        author: AUTHOR_ARIF,
        category: "Growth",
        tags: ["SEO", "Analytics", "Paid Media", "Attribution"],
        viewCount: 1042,
        isPublished: true,
        publishedAt: "2025-03-11T06:00:00.000Z",
        metaTitle: "Stop measuring impressions",
        metaDescription:
            "Server-side conversion tracking and cost per qualified lead as the only two numbers that matter.",
        readingMinutes: 5,
        createdAt: "2025-03-11T06:00:00.000Z",
        updatedAt: "2025-03-11T06:00:00.000Z",
    },
    {
        _id: "6654e5d4c3d4e5f605000006",
        title: "A 3D render is a sales document, not an artwork",
        slug: "a-3d-render-is-a-sales-document",
        excerpt:
            "Buyers read a floor plan in about four seconds. Everything in the render should be serving that four seconds.",
        content: `<p>Visualization briefs often arrive asking for realism. Realism is table stakes. What sells a unit is legibility: can a non-technical buyer understand the flow of the space almost immediately?</p>
<h2>What we change first</h2><ul><li>Furniture at true scale, so the room does not lie about its size</li><li>One consistent light direction across the whole set — mixed lighting reads as a stock library</li><li>Room labels and dimensions on the 2D plan, never only on the 3D</li><li>A single hero angle per unit type, not six near-identical ones</li></ul>
<h2>And deliver both colour spaces</h2><p>Print CMYK and web sRGB from the same master. A marketing team re-exporting your files is a marketing team introducing errors into your work.</p>`,
        coverImage: "/2d-3d/3d-interior.jpg",
        author: AUTHOR_SM,
        category: "Visualization",
        tags: ["3D Render", "Real Estate", "Floor Plan", "Sales"],
        viewCount: 693,
        isPublished: true,
        publishedAt: "2025-02-05T06:00:00.000Z",
        metaTitle: "A 3D render is a sales document",
        metaDescription:
            "Legibility beats realism when a render's job is to sell a unit off a plan set.",
        readingMinutes: 4,
        createdAt: "2025-02-05T06:00:00.000Z",
        updatedAt: "2025-02-05T06:00:00.000Z",
    },
];

/* ═══════════════════════════════════════════════════════════════
   6 · Page furniture — now the OUTAGE FALLBACK for the SiteContent
       collection, not the source.

       metrics, processSteps, capabilities and faqs are served from
       /api/v1/site-content and edited at /admin/site-content. No
       route imports them from here any more; lib/api reaches them
       only when the API is unreachable or a block is empty — see
       FALLBACK_CONTENT in lib/api.js.

       ⚑ These four must stay byte-identical to
       str-backend/src/seed/siteContent.js. If they drift, an API
       outage silently changes the copy on the page rather than
       preserving it, which is the one thing a fallback exists to
       prevent. Edit both or neither.

       `techMarquee` was removed with components/home/TechMarquee.jsx
       in the dead-code pass — nothing rendered either one.
   ═══════════════════════════════════════════════════════════════ */

export const metrics = [
    { value: 2, suffix: "", label: "Years building", note: "Since 2024" },
    { value: 200, suffix: "+", label: "Projects delivered", note: "Across 6 industries" },
    {
        value: 50,
        suffix: "+",
        label: "People on the floor",
        note: "Engineering, design, production",
    },
    { value: 7, suffix: "", label: "Countries served", note: "BD · UK · US · AU · EU" },
];

export const processSteps = [
    {
        index: "01",
        title: "Scope",
        body: "A paid discovery week. We map the actual workflow, name the constraints, and write down what success is measured by. Nobody signs a build estimate before this exists.",
        output: "Scope document · route map · fixed estimate",
    },
    {
        index: "02",
        title: "Design",
        body: "Flows, then screens, then a component library with every state drawn. Reviewed against real content, never lorem ipsum. never!!!",
        output: "Figma system · prototype · tokens",
    },
    {
        index: "03",
        title: "Build",
        body: "Two-week cycles with a working deployment at the end of each. You see the real thing on a real URL, not a screenshot in a status email.",
        output: "Preview deploys · weekly demo · CI",
    },
    {
        index: "04",
        title: "Handover",
        body: "Documentation, an admin walkthrough recorded to video, and thirty days of warranty support. Then a retainer only if you want one.",
        output: "Docs · training · 30-day warranty",
    },
];

export const capabilities = [
    {
        title: "Architecture reviews",
        body: "For teams who already have a codebase and a problem with it.",
    },
    {
        title: "Dedicated squads",
        body: "Two to six people embedded with your team on a rolling monthly basis.",
    },
    {
        title: "Production overflow",
        body: "Retouching and visualization capacity when your in-house queue is full.",
    },
    {
        title: "Rescue engagements",
        body: "Half-finished projects, absent original developers. It is more common than anyone admits.",
    },
];

/**
 * FAQ. `category` drives the filter tabs on the homepage FAQ section (Phase 5);
 * /contact renders the same rows unfiltered and ignores it.
 */
export const faqs = [
    {
        category: "General",
        q: "How do you price a project?",
        a: "Fixed price after a paid discovery week, or a monthly rate for a dedicated squad. We do not quote a build price off a one-paragraph brief. Every time we have, one of us has regretted it.",
    },
    {
        category: "Process",
        q: "What does a typical timeline look like?",
        a: "A marketing site is four to eight weeks. A custom platform is eight to twenty. Visualization and post-production run on a days-not-weeks SLA. Discovery gives you a date, not a range.",
    },
    {
        category: "General",
        q: "Do you work with clients outside Bangladesh?",
        a: "About half our work is. We overlap with UK and EU mornings and with US evenings, and every project runs in English with written weekly status.",
    },
    {
        category: "Tech",
        q: "Who owns the code and the design files?",
        a: "You do, on final payment. Repository, Figma file, assets, and the deployment account. We do not hold infrastructure hostage as a retention strategy.",
    },
    {
        category: "Tech",
        q: "Can you take over a project someone else started?",
        a: "Yes, after an audit. The audit is chargeable and occasionally ends with us advising you not to continue. That is a legitimate outcome.",
    },
    {
        category: "Process",
        q: "What happens after launch?",
        a: "Thirty days of warranty support is included. After that, a support retainer is optional and priced by response time, not by hours banked.",
    },
];

/* ═══════════════════════════════════════════════════════════════
   7 · Selectors — the only API surface components should touch.
       Phase 4 replaces the bodies with fetch(); the signatures hold.
   ═══════════════════════════════════════════════════════════════ */

const byOrder = (a, b) => (a.order ?? a.displayOrder ?? 0) - (b.order ?? b.displayOrder ?? 0);

export const getServices = () => services.filter((s) => s.isActive).sort(byOrder);
export const getServiceBySlug = (slug) => services.find((s) => s.slug === slug) ?? null;

export const getProjects = ({ service, tag, limit } = {}) => {
    let out = [...projects];
    if (service) out = out.filter((p) => p.serviceTypes.includes(service));
    if (tag) out = out.filter((p) => p.tags.includes(tag));
    // Mirrors the backend defaultSort: "-featured -displayOrder -createdAt".
    out.sort((a, b) => Number(b.featured) - Number(a.featured) || a.displayOrder - b.displayOrder);
    return typeof limit === "number" ? out.slice(0, limit) : out;
};
export const getFeaturedProjects = (limit = 4) =>
    getProjects()
        .filter((p) => p.featured)
        .slice(0, limit);
export const getProjectBySlug = (slug) => projects.find((p) => p.slug === slug) ?? null;

/** Adjacent case studies for the prev/next rail on /projects/[slug]. */
export const getProjectNeighbours = (slug) => {
    const ordered = getProjects();
    const i = ordered.findIndex((p) => p.slug === slug);
    if (i === -1) return { prev: null, next: null };
    return {
        prev: ordered[(i - 1 + ordered.length) % ordered.length],
        next: ordered[(i + 1) % ordered.length],
    };
};

export const getBlogs = ({ category, limit } = {}) => {
    let out = copyOf(blogs).filter((b) => b.isPublished);
    if (category && category !== "All") out = out.filter((b) => b.category === category);
    out.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
    return typeof limit === "number" ? out.slice(0, limit) : out;
};
export const getBlogBySlug = (slug) => blogs.find((b) => b.slug === slug && b.isPublished) ?? null;
export const getBlogCategories = () => [
    "All",
    ...Array.from(new Set(blogs.filter((b) => b.isPublished).map((b) => b.category))),
];
export const getRelatedBlogs = (slug, limit = 3) => {
    const current = getBlogBySlug(slug);
    if (!current) return getBlogs({ limit });
    return getBlogs()
        .filter((b) => b.slug !== slug)
        .sort((a, b) => overlap(b.tags, current.tags) - overlap(a.tags, current.tags))
        .slice(0, limit);
};

export const getTeam = () => team.filter((m) => m.isActive).sort(byOrder);
export const getTestimonials = ({ featuredOnly = false } = {}) =>
    testimonials.filter((t) => (featuredOnly ? t.isFeatured : true));

/** Every distinct tag across the catalogue — powers the /projects filter rail. */
export const getProjectTags = () => Array.from(new Set(projects.flatMap((p) => p.tags))).sort();

/* — internals — */
function overlap(a = [], b = []) {
    return a.filter((x) => b.includes(x)).length;
}
// Defensive copy so a caller that sorts in place cannot mutate module state.
// Module scope is shared across requests in a long-lived Node process — this is
// the mutation bug that only shows up in production.
function copyOf(arr) {
    return [...arr];
}
