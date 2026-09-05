"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn, formatDate, pad } from "@/lib/utils";

/**
 * Archive list with a category filter. The lead article gets a two-column
 * treatment; the rest are hairline-divided rows, not cards — an article index
 * reads better as a list, and it makes the titles the loudest thing on screen.
 */
export default function BlogArchive({ posts, categories }) {
  const [active, setActive] = useState("All");

  const filtered = useMemo(
    () => (active === "All" ? posts : posts.filter((p) => p.category === active)),
    [active, posts]
  );

  const [lead, ...rest] = filtered;

  return (
    <>
      <div className="sticky top-[68px] z-30 border-b border-(--line) bg-(--overlay) backdrop-blur-xl md:top-[76px]">
        <div className="shell flex items-center gap-6 overflow-x-auto py-4">
          <span className="label-mono shrink-0 text-(--text-mute)">Topics</span>
          <div className="flex items-center gap-1">
            {categories.map((c) => {
              const on = active === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => setActive(c)}
                  aria-pressed={on}
                  className={cn(
                    "label-mono relative shrink-0 whitespace-nowrap px-3.5 py-2 transition-colors",
                    on ? "text-(--text)" : "text-(--text-mute) hover:text-(--text)"
                  )}
                >
                  {c}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute inset-x-2 bottom-0 h-px origin-left bg-signal transition-transform duration-300",
                      on ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="shell py-16 md:py-24">
        {!lead ? (
          <div className="bg-hatch border border-(--line) px-8 py-24 text-center">
            <p className="text-(--text-mute)">Nothing published under that topic yet.</p>
          </div>
        ) : (
          <>
            {/* Lead article */}
            <article className="group grid gap-x-12 gap-y-8 border-b border-(--line) pb-14 lg:grid-cols-12">
              <Link
                href={`/blogs/${lead.slug}`}
                className="relative block aspect-[16/10] overflow-hidden border border-(--line) lg:col-span-7"
              >
                <Image
                  src={lead.coverImage}
                  alt={lead.title}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 55vw"
                  className="object-cover object-top transition-transform duration-[900ms] ease-out group-hover:scale-[1.035]"
                />
              </Link>

              <div className="lg:col-span-5 lg:self-center">
                <div className="label-mono flex items-center gap-3 text-(--text-mute)">
                  <span className="text-signal">Latest</span>
                  <span aria-hidden="true" className="text-(--line)">//</span>
                  <span>{lead.category}</span>
                </div>

                <h2 className="text-subheading mt-5">
                  <Link href={`/blogs/${lead.slug}`} className="transition-colors hover:text-signal">
                    {lead.title}
                  </Link>
                </h2>

                <p className="mt-5 max-w-prose text-[1rem] leading-relaxed text-(--text-mute)">
                  {lead.excerpt}
                </p>

                <p className="label-mono mt-7 text-(--text-mute)">
                  {lead.author.name} · {formatDate(lead.publishedAt)} · {lead.readingMinutes} min
                </p>
              </div>
            </article>

            {/* Index rows */}
            <ol>
              {rest.map((post, i) => (
                <li key={post._id}>
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="group grid items-baseline gap-x-8 gap-y-3 border-b border-(--line) py-8 transition-colors hover:bg-(--raised) md:py-10 lg:grid-cols-12"
                  >
                    <span className="label-mono text-(--text-mute) lg:col-span-1">
                      {pad(i + 2)}
                    </span>

                    <div className="lg:col-span-6">
                      <h3 className="text-[1.375rem] font-semibold leading-snug tracking-[-0.028em] text-(--text) transition-colors group-hover:text-signal">
                        {post.title}
                      </h3>
                      <p className="mt-3 max-w-prose text-[0.9375rem] leading-relaxed text-(--text-mute)">
                        {post.excerpt}
                      </p>
                    </div>

                    <span className="label-mono text-(--text-dim) lg:col-span-2">
                      {post.category}
                    </span>

                    <span className="label-mono text-(--text-mute) lg:col-span-3 lg:text-right">
                      {formatDate(post.publishedAt)} · {post.readingMinutes} min
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          </>
        )}
      </div>
    </>
  );
}
