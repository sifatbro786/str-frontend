"use client";

import ProjectForm from "@/components/admin/ProjectForm";

export default function NewProjectPage() {
  return (
    <div className="space-y-8">
      <header>
        <h2 className="text-[1.5rem] font-semibold tracking-[-0.02em] text-(--text)">New project</h2>
        <p className="mt-2 text-[0.9375rem] text-(--text-mute)">
          The slug is generated from the title on save.
        </p>
      </header>
      <ProjectForm mode="create" />
    </div>
  );
}
