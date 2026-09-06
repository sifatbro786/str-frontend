"use client";

import { use } from "react";
import RecordLoader from "@/components/admin/RecordLoader";
import BlogForm from "@/components/admin/BlogForm";

export default function EditBlogPage({ params }) {
  const { id } = use(params);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-(--text)">Edit article</h2>
        <p className="mt-2 text-[0.9375rem] text-(--text-mute)">
          Renaming the title regenerates the slug, which changes the public URL.
        </p>
      </header>

      <RecordLoader resource="blogs/admin/id" id={id}>
        {(post) => <BlogForm mode="edit" id={id} initial={post} />}
      </RecordLoader>
    </div>
  );
}
