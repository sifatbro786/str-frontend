import PageMasthead from "@/components/ui/PageMasthead";
import CTABand from "@/components/ui/CTABand";
import BlogArchive from "@/components/blogs/BlogArchive";
import { getBlogs, getBlogCategories } from "@/lib/data";

export const metadata = {
  title: "Insights",
  description:
    "Notes from the STR Solutions studio on performance, architecture, design systems, production process and growth.",
  alternates: { canonical: "/blogs" },
};

export default function BlogsPage() {
  const posts = getBlogs();
  const categories = getBlogCategories();

  return (
    <>
      <PageMasthead
        index="04"
        eyebrow="Insights"
        title="Things we learned the expensive way."
        lede="Written by the people who did the work, about the decisions that turned out to matter. No listicles, no reposted release notes."
        breadcrumb={[{ label: "Home", href: "/" }, { label: "Insights" }]}
        meta={[
          { label: "Published", value: `${posts.length} articles` },
          { label: "Topics", value: `${categories.length - 1}` },
          { label: "Written by", value: "The delivery team" },
          { label: "Cadence", value: "Monthly, roughly" },
        ]}
      />

      <BlogArchive posts={posts} categories={categories} />

      <CTABand
        title="Want this applied to your own stack?"
        body="Most of these posts started as an audit finding. If any of them described your situation, an audit is usually the cheapest next step."
        primary={{ label: "Book an audit", href: "/contact" }}
        secondary={{ label: "See our services", href: "/services" }}
      />
    </>
  );
}
