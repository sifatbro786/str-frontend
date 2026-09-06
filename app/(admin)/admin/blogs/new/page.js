"use client";

import BlogForm from "@/components/admin/BlogForm";

export default function NewBlogPage() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-(--text)">New article</h2>
        <p className="mt-2 text-[0.9375rem] text-(--text-mute)">
          The author is set from your account; the slug is generated from the title.
        </p>
      </header>
      <BlogForm mode="create" />
    </div>
  );
}
