"use client";

import { use } from "react";
import RecordLoader from "@/components/admin/RecordLoader";
import ProjectForm from "@/components/admin/ProjectForm";

export default function EditProjectPage({ params }) {
  // Next 15: params is a Promise; use() unwraps it in a client component.
  const { id } = use(params);

  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-(--text)">Edit project</h2>
        <p className="mt-2 text-[0.9375rem] text-(--text-mute)">
          Renaming the title regenerates the slug, which changes the public URL.
        </p>
      </header>

      <RecordLoader resource="projects/admin/id" id={id}>
        {(project) => <ProjectForm mode="edit" id={id} initial={project} />}
      </RecordLoader>
    </div>
  );
}
